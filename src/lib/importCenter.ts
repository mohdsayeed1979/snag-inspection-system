// Excel Checklist Import Engine (using ExcelJS client-side)
import ExcelJS from 'exceljs';
import { dbService, InspectionItem, Villa, InspectionCategory } from '@/lib/db';

export interface ImportError {
  row: number;
  column: string;
  error: string;
  severity: 'error' | 'warning';
}

export interface ImportResult {
  villaName: string;
  vesselId?: string;
  itemsParsed: Omit<InspectionItem, 'id' | 'snag_number' | 'company_id' | 'created_at' | 'updated_at'>[];
  errors: ImportError[];
}

export const parseChecklistExcel = async (
  fileBuffer: ArrayBuffer,
  villasList: Villa[],
  categoriesList: InspectionCategory[]
): Promise<ImportResult> => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(fileBuffer);
  
  // Use the first worksheet
  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    throw new Error('The uploaded Excel file does not contain any sheets.');
  }

  let villaName = 'Unknown Villa';
  let matchedVilla: Villa | undefined = undefined;
  const itemsParsed: Omit<InspectionItem, 'id' | 'snag_number' | 'company_id' | 'created_at' | 'updated_at'>[] = [];
  const errors: ImportError[] = [];

  // 1. Detect format by checking Row 1 or headers
  const row2 = worksheet.getRow(2);
  const r2c1 = row2.getCell(1).value?.toString() || '';
  const r2c2 = row2.getCell(2).value?.toString() || '';
  
  const isArabicTemplate = r2c1.includes('رقم الاستوديو') || r2c1.includes('الفيلا') || worksheet.getRow(1).getCell(1).value?.toString()?.includes('الفحص الفني');

  if (isArabicTemplate) {
    // Extract Villa Number from Row 2, Column 2 (e.g. "Studio-101" or "Villa 05")
    villaName = r2c2 ? r2c2.trim() : 'Studio-101';
    
    // Map Studio-101 to Villa 05 in seed or search list
    // Let's do a soft check: if it is "Studio-101", let's look for "Villa 05" or "Villa 01" or create/map it
    matchedVilla = villasList.find(
      v => v.villa_number.toLowerCase() === villaName.toLowerCase() ||
           (villaName.toLowerCase() === 'studio-101' && v.villa_number === 'Villa 05')
    );

    if (!matchedVilla) {
      errors.push({
        row: 2,
        column: 'B',
        error: `Villa matching name "${villaName}" not found in current project. Items will be mapped to "Villa 05" by default.`,
        severity: 'warning'
      });
      // Fallback to Villa 05 so user can still see seeded results
      matchedVilla = villasList.find(v => v.villa_number === 'Villa 05') || villasList[0];
    }

    // Row 5 contains headers: بند الفحص الفني, عنصر التدقيق, تقييم الحالة, تفاصيل الملاحظات والعيوب
    // Data starts from Row 6 onwards
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber < 6) return; // Skip headers and metadata

      const category = row.getCell(1).value?.toString() || '';
      const auditItem = row.getCell(2).value?.toString() || '';
      const rawStatus = row.getCell(3).value?.toString() || '';
      const remarks = row.getCell(4).value?.toString() || '';

      // Skip empty or summary rows (e.g., rows containing "النتيجة الإجمالية")
      if (!category || category.includes('النتيجة الإجمالية') || (!auditItem && !rawStatus)) {
        return;
      }

      // Map categories
      let cleanCategory = category.trim();
      // Remove prefixes like "2. "
      cleanCategory = cleanCategory.replace(/^\d+\.\s*/, '');

      let matchedCategory = categoriesList.find(
        c => c.name.toLowerCase() === cleanCategory.toLowerCase() ||
             (cleanCategory.includes('خزانة') && c.name.includes('خزانة')) ||
             (cleanCategory.includes('المطبخ') && c.name.includes('المطبخ'))
      );

      // Map statuses
      // Arabic Excel evaluations: [مقبول], مقبول, ملاحظات, مرفوض, لم يتم الفحص
      let status: 'open' | 'assigned' | 'in_progress' | 'rectified' | 'qa_verification' | 'closed' = 'open';
      if (rawStatus.includes('مقبول')) {
        status = 'closed';
      } else if (rawStatus.includes('مرفوض')) {
        status = 'open'; // or in_progress, rejected maps to contractor back loop
      } else if (rawStatus.includes('ملاحظات')) {
        status = 'in_progress';
      } else if (rawStatus.includes('لم يتم الفحص')) {
        status = 'open';
      }

      // Map Priority (Default to medium, can deduce from details if needed)
      let priority: 'low' | 'medium' | 'high' | 'critical' = 'medium';
      if (remarks.toLowerCase().includes('critical') || remarks.includes('عاجل')) {
        priority = 'critical';
      } else if (remarks.toLowerCase().includes('high') || remarks.includes('هام')) {
        priority = 'high';
      } else if (remarks.toLowerCase().includes('low') || remarks.includes('بسيط')) {
        priority = 'low';
      }

      // Validate duplicate checking (in parsed items or database)
      const isDuplicateInParsed = itemsParsed.some(
        item => item.title === auditItem && item.category_id === matchedCategory?.id
      );

      if (isDuplicateInParsed) {
        errors.push({
          row: rowNumber,
          column: 'B',
          error: `Duplicate check item "${auditItem}" in same category.`,
          severity: 'warning'
        });
        return; // Skip duplicate rows
      }

      if (!auditItem) {
        errors.push({
          row: rowNumber,
          column: 'B',
          error: 'Checklist audit item description is missing.',
          severity: 'error'
        });
        return;
      }

      itemsParsed.push({
        villa_id: matchedVilla!.id,
        category_id: matchedCategory?.id || categoriesList[0].id, // Default to first category if unmapped
        location: 'Ground Floor',
        room: 'General',
        title: auditItem.trim(),
        description: `Inspected item: ${auditItem.trim()}`,
        priority,
        status,
        remarks: remarks || undefined,
        inspection_date: new Date().toISOString().split('T')[0],
        inspector_id: 'u-inspector',
        contractor_id: 'u-contractor'
      });
    });

  } else {
    // Standard template format parsing: Header in Row 1 or 2
    // Let's search for columns: Snag, Villa, Category, Description, Status, etc.
    let headers: string[] = [];
    let dataStartRow = 2;

    const row1Values = worksheet.getRow(1).values as any[];
    if (row1Values && row1Values.length > 2) {
      headers = row1Values.map(h => String(h || '').toLowerCase().trim());
    }

    if (headers.length === 0 || !headers.includes('villa')) {
      // Check row 2
      const row2Values = worksheet.getRow(2).values as any[];
      if (row2Values && row2Values.length > 2) {
        headers = row2Values.map(h => String(h || '').toLowerCase().trim());
        dataStartRow = 3;
      }
    }

    if (!headers.includes('description') && !headers.includes('title')) {
      throw new Error('Invalid standard Excel sheet structure. Must contain at least a "Description" or "Title" header column.');
    }

    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber < dataStartRow) return;

      const getValByHeader = (name: string): string => {
        const colIdx = headers.indexOf(name);
        if (colIdx === -1) return '';
        // values array is 1-indexed (first element in array is empty or indices offset)
        return row.getCell(colIdx).value?.toString() || '';
      };

      const villaNum = getValByHeader('villa') || getValByHeader('villa number') || getValByHeader('villa_number');
      const category = getValByHeader('category');
      const title = getValByHeader('title') || getValByHeader('description') || getValByHeader('snag');
      const statusText = getValByHeader('status').toLowerCase();
      const priorityText = getValByHeader('priority').toLowerCase();
      const remarks = getValByHeader('remarks') || getValByHeader('comments');
      const location = getValByHeader('location') || 'Ground Floor';
      const room = getValByHeader('room') || 'General';

      if (!title) {
        errors.push({
          row: rowNumber,
          column: 'Description/Title',
          error: 'Title/Description is required for row.',
          severity: 'error'
        });
        return;
      }

      // Map Villa
      const vMatch = villasList.find(
        v => v.villa_number.toLowerCase().replace(/\s+/, '') === villaNum.toLowerCase().replace(/\s+/, '')
      ) || villasList[0];

      // Map Category
      const catMatch = categoriesList.find(
        c => c.name.toLowerCase() === category.toLowerCase()
      ) || categoriesList[0];

      // Map Status
      let status: 'open' | 'assigned' | 'in_progress' | 'rectified' | 'qa_verification' | 'closed' = 'open';
      if (statusText.includes('close')) status = 'closed';
      else if (statusText.includes('progress')) status = 'in_progress';
      else if (statusText.includes('rectify')) status = 'rectified';
      else if (statusText.includes('qa') || statusText.includes('verify')) status = 'qa_verification';
      else if (statusText.includes('assign')) status = 'assigned';

      // Map Priority
      let priority: 'low' | 'medium' | 'high' | 'critical' = 'medium';
      if (priorityText.includes('low')) priority = 'low';
      else if (priorityText.includes('high')) priority = 'high';
      else if (priorityText.includes('critical')) priority = 'critical';

      itemsParsed.push({
        villa_id: vMatch.id,
        category_id: catMatch.id,
        location,
        room,
        title,
        description: title,
        priority,
        status,
        remarks: remarks || undefined,
        inspection_date: new Date().toISOString().split('T')[0],
        inspector_id: 'u-inspector',
        contractor_id: 'u-contractor'
      });
    });
  }

  return {
    villaName,
    vesselId: matchedVilla?.id,
    itemsParsed,
    errors
  };
};

export const saveImportedItems = (
  items: Omit<InspectionItem, 'id' | 'snag_number' | 'company_id' | 'created_at' | 'updated_at'>[],
  userId: string
): void => {
  items.forEach(item => {
    dbService.addInspectionItem(item, userId);
  });
};
