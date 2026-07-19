// Excel & PDF Generation Engine (ExcelJS + jsPDF + jsPDF-AutoTable)
import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { dbService, InspectionItem, Project, Villa, Block, Profile, InspectionCategory } from './db';

// Define layout and print options
export interface ExportOptions {
  orientation: 'portrait' | 'landscape';
  paperSize: 'a4' | 'letter';
  includePhotos: boolean;
  includeComments: boolean;
  includeClosedItems: boolean;
  preparedBy: string;
}

export const exportCenter = {
  // ==========================================
  // EXCEL EXPORT ENGINE
  // ==========================================
  exportToExcel: async (
    items: InspectionItem[],
    project: Project,
    villas: Villa[],
    blocks: Block[],
    categories: InspectionCategory[],
    profiles: Profile[],
    title: string,
    options: ExportOptions
  ): Promise<Blob> => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Inspection Snag List');

    // Enable gridlines
    sheet.views = [{ showGridLines: true }];

    // 1. Report Header Info
    sheet.mergeCells('A1:Q1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = 'VILLA SNAG LIST & INSPECTION REPORT';
    titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF384959' } }; // Dark Stormy Morning color
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 40;

    // Metadata block
    sheet.getCell('A3').value = 'Project Name:';
    sheet.getCell('B3').value = project.name;
    sheet.getCell('A3').font = { bold: true };
    
    sheet.getCell('A4').value = 'Report Title:';
    sheet.getCell('B4').value = title;
    sheet.getCell('A4').font = { bold: true };

    sheet.getCell('H3').value = 'Generated Date:';
    sheet.getCell('I3').value = new Date().toLocaleString();
    sheet.getCell('H3').font = { bold: true };

    sheet.getCell('H4').value = 'Prepared By:';
    sheet.getCell('I4').value = options.preparedBy;
    sheet.getCell('H4').font = { bold: true };

    // Stats block
    const total = items.length;
    const closed = items.filter(i => i.status === 'closed').length;
    const open = total - closed;
    const completionRate = total > 0 ? Math.round((closed / total) * 100) : 0;

    sheet.getCell('O3').value = 'Total Snags:';
    sheet.getCell('P3').value = total;
    sheet.getCell('O3').font = { bold: true };

    sheet.getCell('O4').value = 'Closed Snags:';
    sheet.getCell('P4').value = closed;
    sheet.getCell('O4').font = { bold: true };

    sheet.getCell('O5').value = 'Completion %:';
    sheet.getCell('P5').value = `${completionRate}%`;
    sheet.getCell('O5').font = { bold: true };

    sheet.getRow(3).height = 18;
    sheet.getRow(4).height = 18;
    sheet.getRow(5).height = 18;

    // Blank spacer row
    sheet.getRow(6).height = 15;

    // 2. Main Data Headers
    const headers = [
      'Snag ID', 'Project', 'Block', 'Villa Number', 'Category', 
      'Location', 'Room', 'Description', 'Priority', 'Status', 
      'Assigned To', 'Contractor', 'Inspector', 'Due Date', 
      'Completion Date', 'Remarks', 'Created Date'
    ];

    const headerRowIdx = 7;
    const headerRow = sheet.getRow(headerRowIdx);
    headerRow.values = headers;
    headerRow.height = 25;
    
    // Freeze header row and meta columns
    sheet.views = [
      {
        state: 'frozen',
        xSplit: 0,
        ySplit: 7, // Freeze everything above row 8
        topLeftCell: 'A8',
        activeCell: 'A8'
      }
    ];

    // Style the header row
    headers.forEach((_, colIndex) => {
      const cell = headerRow.getCell(colIndex + 1);
      cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF6A89A7' } // Primary Stormy Morning color
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF384959' } },
        bottom: { style: 'medium', color: { argb: 'FF384959' } },
        left: { style: 'thin', color: { argb: 'FF384959' } },
        right: { style: 'thin', color: { argb: 'FF384959' } }
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    // Color definitions for mapping
    const statusFills: Record<string, string> = {
      open: 'FFFFD2D2',        // light red
      assigned: 'FFFFE4C4',    // light orange/peach
      in_progress: 'FFFFF0D2', // light yellow
      rectified: 'FFE2F0D9',   // light green-blue
      qa_verification: 'FFE1F0FF', // light blue
      closed: 'FFD5F3DB'       // success green
    };

    const priorityColors: Record<string, string> = {
      critical: 'FFDC2626', // dark red text
      high: 'FFF59E0B',     // warning orange text
      medium: 'FF3B82F6',   // info blue text
      low: 'FF6B7280'       // gray text
    };

    // Filter closed items if requested
    const filteredItems = options.includeClosedItems ? items : items.filter(i => i.status !== 'closed');

    // 3. Add Data Rows
    let currentRowIdx = 8;
    filteredItems.forEach((item) => {
      const row = sheet.getRow(currentRowIdx);
      
      const villaObj = villas.find(v => v.id === item.villa_id);
      const blockObj = blocks.find(b => b?.id === villaObj?.block_id);
      const categoryObj = categories.find(c => c.id === item.category_id);
      const assigneeObj = profiles.find(p => p.id === item.assigned_to);
      const contractorObj = profiles.find(p => p.id === item.contractor_id);
      const inspectorObj = profiles.find(p => p.id === item.inspector_id);

      row.getCell(1).value = item.snag_number;
      row.getCell(2).value = project.name;
      row.getCell(3).value = blockObj ? blockObj.name : '';
      row.getCell(4).value = villaObj ? villaObj.villa_number : '';
      row.getCell(5).value = categoryObj ? categoryObj.name : '';
      row.getCell(6).value = item.location || '';
      row.getCell(7).value = item.room || '';
      row.getCell(8).value = item.title;
      row.getCell(9).value = item.priority.toUpperCase();
      row.getCell(10).value = item.status.toUpperCase().replace('_', ' ');
      row.getCell(11).value = assigneeObj ? assigneeObj.full_name : '';
      row.getCell(12).value = contractorObj ? contractorObj.full_name : '';
      row.getCell(13).value = inspectorObj ? inspectorObj.full_name : '';
      row.getCell(14).value = item.due_date ? new Date(item.due_date).toLocaleDateString() : '';
      row.getCell(15).value = item.completion_date ? new Date(item.completion_date).toLocaleDateString() : '';
      row.getCell(16).value = item.remarks || '';
      row.getCell(17).value = item.created_at ? new Date(item.created_at).toLocaleDateString() : '';

      // Base fonts and borders
      for (let c = 1; c <= 17; c++) {
        const cell = row.getCell(c);
        cell.font = { name: 'Arial', size: 9 };
        cell.border = {
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };
        cell.alignment = { vertical: 'middle', wrapText: true };
      }

      // Priority Styling (text color)
      const pCell = row.getCell(9);
      pCell.font = { name: 'Arial', size: 9, bold: true, color: { argb: statusFills[item.priority] || priorityColors[item.priority] } };
      pCell.alignment = { horizontal: 'center', vertical: 'middle' };

      // Status Styling (background fill)
      const sCell = row.getCell(10);
      const sColor = statusFills[item.status] || 'FFFFFFFF';
      sCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: sColor }
      };
      sCell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF1E293B' } };
      sCell.alignment = { horizontal: 'center', vertical: 'middle' };

      row.height = 22;
      currentRowIdx++;
    });

    // 4. Total Summary at Bottom
    const summaryRow = sheet.getRow(currentRowIdx);
    summaryRow.getCell(7).value = 'Summary Total:';
    summaryRow.getCell(7).font = { bold: true };
    summaryRow.getCell(8).value = `Total Open: ${open} | Total Closed: ${closed}`;
    summaryRow.getCell(8).font = { bold: true };
    summaryRow.getCell(8).alignment = { horizontal: 'left' };
    summaryRow.height = 25;
    
    // Auto-fit Column Widths
    sheet.columns.forEach((column) => {
      let maxLen = 0;
      column.eachCell?.({ includeEmpty: true }, (cell) => {
        // Skip header merged row
        if ((cell.row as any) === 1) return;
        const valStr = cell.value ? String(cell.value) : '';
        if (valStr.length > maxLen) {
          maxLen = valStr.length;
        }
      });
      column.width = maxLen < 12 ? 12 : maxLen > 40 ? 40 : maxLen + 3;
    });

    // Save as array buffer
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    // Save to export history in LocalStorage fallback
    dbService.addExportHistory(title, 'excel', 'u-admin', blob.size, '');

    return blob;
  },

  // ==========================================
  // PDF REPORT EXPORT ENGINE
  // ==========================================
  exportToPdf: async (
    items: InspectionItem[],
    project: Project,
    villas: Villa[],
    blocks: Block[],
    categories: InspectionCategory[],
    profiles: Profile[],
    title: string,
    options: ExportOptions
  ): Promise<Blob> => {
    // 1. Initialize jsPDF doc
    const isLandscape = options.orientation === 'landscape';
    const doc = new jsPDF({
      orientation: isLandscape ? 'landscape' : 'portrait',
      unit: 'mm',
      format: options.paperSize === 'letter' ? 'letter' : 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 12;

    // Filters according to options
    const filteredItems = options.includeClosedItems ? items : items.filter(i => i.status !== 'closed');

    // 2. Draw Report Title and Header Banner
    const drawHeader = (pageNumber: number) => {
      // Top Dark Banner
      doc.setFillColor(56, 73, 89); // Deep Charcoal Blue (#384959)
      doc.rect(0, 0, pageWidth, 24, 'F');

      // Title text
      doc.setTextColor(255, 255, 255);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('VILLA INSPECTION REPORT', margin, 11);

      // Company info text (Right side)
      doc.setFontSize(9);
      doc.setFont('Helvetica', 'normal');
      doc.text('QC System - Snaglist Center', pageWidth - margin - 50, 11);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - margin - 50, 16);

      // Sub-header details
      doc.setTextColor(56, 73, 89);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(`Project: ${project.name}`, margin, 31);
      doc.text(`Report: ${title}`, margin, 37);

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Prepared By: ${options.preparedBy}`, pageWidth - margin - 60, 31);
      
      const closedCount = items.filter(i => i.status === 'closed').length;
      const progress = items.length > 0 ? Math.round((closedCount / items.length) * 100) : 0;
      doc.text(`Snag Metrics: ${closedCount}/${items.length} Closed (${progress}%)`, pageWidth - margin - 60, 37);

      // Divider line
      doc.setDrawColor(106, 137, 167); // Slate Gray Blue (#6A89A7)
      doc.setLineWidth(0.5);
      doc.line(margin, 42, pageWidth - margin, 42);
    };

    drawHeader(1);

    // 3. Assemble table data
    const tableHeaders = ['ID', 'Villa', 'Category', 'Location', 'Description', 'Priority', 'Status', 'Due Date'];
    const tableRows = filteredItems.map(item => {
      const villaObj = villas.find(v => v.id === item.villa_id);
      const catObj = categories.find(c => c.id === item.category_id);
      
      return [
        item.snag_number,
        villaObj ? villaObj.villa_number : '',
        catObj ? catObj.name : '',
        item.location || '',
        item.title,
        item.priority.toUpperCase(),
        item.status.toUpperCase().replace('_', ' '),
        item.due_date ? new Date(item.due_date).toLocaleDateString() : ''
      ];
    });

    // 4. Generate Table
    autoTable(doc, {
      head: [tableHeaders],
      body: tableRows,
      startY: 45,
      margin: { top: 45, left: margin, right: margin, bottom: 25 },
      styles: {
        fontSize: 8,
        font: 'Helvetica',
        cellPadding: 2,
        valign: 'middle'
      },
      headStyles: {
        fillColor: [106, 137, 167], // #6A89A7
        textColor: 255,
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 15 },
        2: { cellWidth: 20 },
        3: { cellWidth: 20 },
        4: { cellWidth: 'auto' },
        5: { cellWidth: 15, halign: 'center' },
        6: { cellWidth: 25, halign: 'center' },
        7: { cellWidth: 18, halign: 'center' }
      },
      didDrawPage: (data) => {
        // Draw header on subsequent pages
        if (data.pageNumber > 1) {
          drawHeader(data.pageNumber);
        }

        // Draw Footer
        doc.setDrawColor(226, 232, 240);
        doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
        
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text('Confidential Document for Internal Project Control and Quality Audit', margin, pageHeight - 8);
        doc.text(`Page ${data.pageNumber}`, pageWidth - margin - 15, pageHeight - 8);
      }
    });

    let currentY = (doc as any).lastAutoTable.finalY + 12;

    // 5. Signature Section (Placed at the bottom or on next page if space is tight)
    if (currentY > pageHeight - 50) {
      doc.addPage();
      drawHeader(doc.getNumberOfPages());
      currentY = 45;
    }

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(56, 73, 89);
    doc.text('Digital Signature Validation Sign-offs', margin, currentY);

    const sigWidth = (pageWidth - (margin * 2) - 15) / 4;
    const sigY = currentY + 6;

    const signatureBlocks = [
      { role: 'QA/QC Inspector', name: 'Eng. Yousef' },
      { role: 'Site Engineer', name: 'Eng. Khalid' },
      { role: 'Contractor Rep', name: 'Saudi Construction' },
      { role: 'Consultant Engineer', name: 'Khatib & Alami' }
    ];

    signatureBlocks.forEach((sig, idx) => {
      const sigX = margin + (idx * (sigWidth + 5));
      
      // Draw signature line
      doc.setDrawColor(150, 150, 150);
      doc.setLineWidth(0.3);
      doc.line(sigX, sigY + 14, sigX + sigWidth, sigY + 14);

      // Label text
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(56, 73, 89);
      doc.text(sig.role, sigX, sigY + 18);
      
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(`Name: ${sig.name}`, sigX, sigY + 22);
      doc.text(`Date: ________________`, sigX, sigY + 26);
    });

    currentY = sigY + 33;

    // 6. Include Comments & Photos (Optional)
    if (options.includePhotos) {
      // Find snags with photos
      const snagsWithPhotos = filteredItems.filter(item => {
        const itemPhotos = dbService.getPhotosBySnagId(item.id);
        return itemPhotos.length > 0;
      });

      if (snagsWithPhotos.length > 0) {
        doc.addPage();
        drawHeader(doc.getNumberOfPages());
        let photoY = 45;

        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(56, 73, 89);
        doc.text('Inspection Photos Gallery', margin, photoY);
        photoY += 8;

        for (const item of snagsWithPhotos) {
          const itemPhotos = dbService.getPhotosBySnagId(item.id);
          const villaObj = villas.find(v => v.id === item.villa_id);

          if (photoY > pageHeight - 85) {
            doc.addPage();
            drawHeader(doc.getNumberOfPages());
            photoY = 45;
          }

          doc.setFont('Helvetica', 'bold');
          doc.setFontSize(9);
          doc.setTextColor(56, 73, 89);
          doc.text(`${item.snag_number} - Villa ${villaObj?.villa_number || ''}: ${item.title}`, margin, photoY);
          photoY += 4;

          // Display before/after photos side by side
          const imgWidth = 60;
          const imgHeight = 45;
          
          let imgX = margin;
          for (const photo of itemPhotos.slice(0, 2)) {
            // Draw border box instead of real image if URL is mockup/external to prevent blocking
            doc.setDrawColor(200, 200, 200);
            doc.setFillColor(245, 247, 250);
            doc.rect(imgX, photoY, imgWidth, imgHeight, 'FD');
            
            // Image text placeholder/mockup drawing
            doc.setFont('Helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(120, 120, 120);
            doc.text(`${photo.photo_type.toUpperCase()} PHOTO`, imgX + (imgWidth/2) - 10, photoY + (imgHeight/2) - 3);
            doc.text(`Uploaded: ${new Date(photo.created_at).toLocaleDateString()}`, imgX + 5, photoY + imgHeight - 4);

            imgX += imgWidth + 10;
          }
          photoY += imgHeight + 8;
        }
      }
    }

    const pdfBlob = doc.output('blob');
    
    // Save to export history
    dbService.addExportHistory(title, 'pdf', 'u-admin', pdfBlob.size, '');

    return pdfBlob;
  }
};
