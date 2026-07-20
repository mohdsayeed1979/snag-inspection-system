// Database Gateway and State Management with LocalStorage Fallback
import { createClient } from '@supabase/supabase-js';

// --- Multi-Tenant and Generic Project Structure Types ---

export interface Company {
  id: string;
  name: string;
  code: string;
  logo_url?: string;
  registration_number?: string;
  vat_number?: string;
  country?: string;
  city?: string;
  address?: string;
  postal_code?: string;
  phone?: string;
  email?: string;
  website?: string;
  primary_contact?: string;
  timezone: string;
  currency: string;
  language: string;
  status: 'active' | 'suspended';
  created_at: string;
  updated_at: string;
  
  // Branding configurations
  primary_color?: string;
  secondary_color?: string;
  report_header?: string;
  report_footer?: string;
  pdf_logo_url?: string;
  email_template?: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: 'super_admin' | 'project_manager' | 'site_engineer' | 'qaqc_inspector' | 'contractor' | 'read_only';
  phone?: string;
  company_id: string; // Tenant separation
  created_at?: string;
}

export interface Project {
  id: string;
  company_id: string; // Tenant separation
  name: string;
  description?: string;
  owner?: string;
  contractor?: string;
  consultant?: string;
  engineer?: string;
  subcontractors?: string;
  project_manager?: string;
  notes?: string;
  completion_rate: number;
  created_at: string;
  updated_at?: string;
  
  // Custom structure extensions
  project_type: 'villa' | 'apartment' | 'hotel' | 'hospital' | 'mall' | 'warehouse' | 'factory' | 'road' | 'bridge' | 'airport' | 'retail' | 'restaurant' | 'custom';
  level_structure: string[]; // e.g. ["Block", "Villa"] or ["Tower", "Floor", "Suite"]
  project_code?: string;
  location?: string;
  contract_value?: string;
  start_date?: string;
  expected_completion?: string;
  project_logo?: string;
  status?: 'active' | 'archived' | 'completed' | 'on_hold';
}

// Kept for backward compatibility
export interface Block {
  id: string;
  project_id: string;
  company_id: string;
  name: string;
  description?: string;
  created_at: string;
}

// Kept for backward compatibility
export interface Villa {
  id: string;
  block_id: string;
  company_id: string;
  villa_number: string;
  owner?: string;
  contractor?: string;
  consultant?: string;
  engineer?: string;
  completion_rate: number;
  created_at: string;
}

// Generic node representing any level in the location hierarchy
export interface ProjectNode {
  id: string;
  project_id: string;
  parent_id?: string | null;
  company_id: string;
  name: string;
  node_type: string; // e.g. 'Block', 'Villa', 'Tower', 'Floor', 'Room'
  description?: string;
  completion_rate: number;
  created_at: string;
  updated_at: string;
}

export interface InspectionCategory {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface InspectionTemplate {
  id: string;
  company_id: string;
  category_name: string;
  audit_item: string;
  is_active: boolean;
  checkpoint_count?: number;
  assigned_project_ids?: string[];
  created_at: string;
  updated_at?: string;
}

export interface InspectionItem {
  id: string;
  snag_number: string;
  villa_id: string; // Kept for backward compatibility
  location_node_id?: string; // Pointer to generic location tree node
  company_id: string;
  category_id?: string;
  location?: string;
  room?: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'assigned' | 'in_progress' | 'rectified' | 'qa_verification' | 'closed';
  assigned_to?: string;
  due_date?: string;
  completion_date?: string;
  inspection_date: string;
  inspector_id?: string;
  contractor_id?: string;
  remarks?: string;
  gps_lat?: number;
  gps_lng?: number;
  digital_signature?: string;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  
  // Custom checklist response values
  form_responses?: Record<string, any>;

  // Root cause analysis and sign-off details
  root_cause?: string;
  corrective_action?: string;
  verification?: string;
  closed_by?: string;
  closed_date?: string;
}

export interface InspectionPhoto {
  id: string;
  inspection_item_id: string;
  company_id: string;
  photo_url: string;
  photo_type: 'before' | 'after';
  caption?: string;
  uploaded_by?: string;
  created_at: string;
}

export interface InspectionComment {
  id: string;
  inspection_item_id: string;
  company_id: string;
  comment: string;
  user_id: string;
  created_at: string;
}

export interface InspectionHistory {
  id: string;
  inspection_item_id: string;
  company_id: string;
  user_id: string;
  action: string;
  old_status?: string;
  new_status?: string;
  details?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  company_id: string;
  title: string;
  message: string;
  is_read: boolean;
  link?: string;
  created_at: string;
}

export interface ExportHistory {
  id: string;
  company_id: string;
  report_name: string;
  export_type: 'excel' | 'pdf' | 'csv';
  exported_by: string;
  file_size: number;
  file_url: string;
  created_at: string;
}

export interface ProjectDocumentFolder {
  id: string;
  project_id: string;
  company_id: string;
  name: string;
  parent_id?: string | null;
  created_at: string;
}

export interface ProjectDocument {
  id: string;
  folder_id?: string | null;
  project_id: string;
  company_id: string;
  name: string;
  file_url: string;
  file_size?: number;
  file_type: string;
  version: number;
  uploaded_by?: string;
  created_at: string;
  updated_at: string;
}

// Check if Supabase keys exist
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;


// Helper to parse LocalStorage safely and guarantee an array return
const safeParseList = <T = any>(key: string): T[] => {
  if (typeof window === 'undefined') return [];
  const val = localStorage.getItem(key);
  if (!val || val === 'null' || val === 'undefined') return [];
  try {
    const parsed = JSON.parse(val);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error(`Failed to parse localStorage key: ${key}`, e);
    return [];
  }
};

// --- SEED SEPARATORS ---
const DEFAULT_ORG_ID = 'c0000000-0000-0000-0000-000000000000';
const COMPANY2_ID = 'co2-uuid-0000-0000-000000000000';

export const SEED_COMPANIES: Company[] = [
  {
    id: DEFAULT_ORG_ID,
    name: 'Default Organization',
    code: 'DEF_ORG',
    timezone: 'Asia/Riyadh',
    currency: 'SAR',
    language: 'ar',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    primary_color: '#6A89A7',
    secondary_color: '#E0E7FF',
    report_header: 'Default Organization - Inspection Audit Report',
    report_footer: 'Confidential Document - Generated Automatically'
  },
  {
    id: COMPANY2_ID,
    name: 'Al-Mousa Construction Group',
    code: 'MOUSA_GROUP',
    timezone: 'Asia/Riyadh',
    currency: 'SAR',
    language: 'en',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    primary_color: '#1E3A8A',
    secondary_color: '#DBEAFE',
    report_header: 'Al-Mousa Construction - Site QA/QC Report',
    report_footer: 'Al-Mousa Group Operations Dept.'
  }
];

export const SEED_PROFILES: Profile[] = [
  { id: 'u-admin', email: 'admin@villaqc.com', full_name: 'Super Admin User', role: 'super_admin', phone: '+966500000001', company_id: DEFAULT_ORG_ID },
  { id: 'u-pm', email: 'pm@villaqc.com', full_name: 'Eng. Ahmed (Project Manager)', role: 'project_manager', phone: '+966500000002', company_id: DEFAULT_ORG_ID },
  { id: 'u-eng', email: 'engineer@villaqc.com', full_name: 'Eng. Khalid (Site Engineer)', role: 'site_engineer', phone: '+966500000003', company_id: DEFAULT_ORG_ID },
  { id: 'u-inspector', email: 'inspector@villaqc.com', full_name: 'Eng. Yousef (QA/QC)', role: 'qaqc_inspector', phone: '+966500000004', company_id: DEFAULT_ORG_ID },
  { id: 'u-contractor', email: 'contractor@villaqc.com', full_name: 'Saudi Construction Co. (Contractor)', role: 'contractor', phone: '+966500000005', company_id: DEFAULT_ORG_ID },
  { id: 'u-viewer', email: 'viewer@villaqc.com', full_name: 'Client Representative (Read-Only)', role: 'read_only', phone: '+966500000006', company_id: DEFAULT_ORG_ID },
  
  // Isolated company 2 PM
  { id: 'u-pm-co2', email: 'pm@almousa.com', full_name: 'Eng. Faisal (PM Al-Mousa)', role: 'project_manager', phone: '+966500000007', company_id: COMPANY2_ID }
];

const SEED_CATEGORIES: Omit<InspectionCategory, 'company_id'>[] = [
  { id: 'cat-kitchen', name: 'المطبخ', description: 'Kitchen Snags and Inspections', created_at: new Date().toISOString() },
  { id: 'cat-wardrobe', name: 'خزانة الملابس', description: 'Wardrobes and Carpentry', created_at: new Date().toISOString() },
  { id: 'c0000000-0000-0000-0000-000000000001', name: 'Civil Works', description: 'Concrete, structure, partition and masonry', created_at: new Date().toISOString() },
  { id: 'c0000000-0000-0000-0000-000000000005', name: 'Electrical', description: 'Power sockets, DB Dressing, earth continuity', created_at: new Date().toISOString() },
  { id: 'c0000000-0000-0000-0000-000000000008', name: 'Plumbing', description: 'Water pressure, leakage, sanitary fixtures', created_at: new Date().toISOString() },
  { id: 'c0000000-0000-0000-0000-000000000010', name: 'HVAC', description: 'AC performance, grilles, unit and insulation', created_at: new Date().toISOString() }
];

const SEED_TEMPLATES: Omit<InspectionTemplate, 'company_id'>[] = [
  { id: 't1', category_name: 'المطبخ', audit_item: 'النظافة العامة وإزالة بقايا السيلكون والغراء', is_active: true, created_at: new Date().toISOString() },
  { id: 't2', category_name: 'المطبخ', audit_item: 'الخدوش والرتووش والتلقيطات في الأبواب والضلف', is_active: true, created_at: new Date().toISOString() },
  { id: 't3', category_name: 'المطبخ', audit_item: 'وزنيات الادراج والضلف واستقامتها وإغلاقها التام', is_active: true, created_at: new Date().toISOString() },
  { id: 't4', category_name: 'المطبخ', audit_item: 'سلامة المفصلات والمجرى الهيدروليكي وجودة الحركة', is_active: true, created_at: new Date().toISOString() },
  { id: 't5', category_name: 'خزانة الملابس', audit_item: 'تثبيت الهيكل وقوائم الخزانة الرأسية مع الجدار والأرضية', is_active: true, created_at: new Date().toISOString() },
  { id: 't6', category_name: 'خزانة الملابس', audit_item: 'وزنيات واستقامة الأبواب وإغلاقها التام دون وجود فراغات', is_active: true, created_at: new Date().toISOString() },
  { id: 't7', category_name: 'Electrical', audit_item: 'Inspection of DB dressing, labeling and earth continuity', is_active: true, created_at: new Date().toISOString() },
  { id: 't8', category_name: 'Plumbing', audit_item: 'Check for leakages in under-sink connections and vanity taps', is_active: true, created_at: new Date().toISOString() },
  { id: 't9', category_name: 'HVAC', audit_item: 'Verify AC cooling performance and noise levels in rooms', is_active: true, created_at: new Date().toISOString() }
];

// Helper to migrate legacy browser DB structures
const runLegacyDatabaseMigration = () => {
  if (typeof window === 'undefined') return;
  console.log('Migrating legacy browser local storage to multi-tenant structures...');

  const DEFAULT_ORG_ID = 'c0000000-0000-0000-0000-000000000000';

  // 1. Companies
  const existingCompanies = localStorage.getItem('snaglist_companies');
  if (!existingCompanies) {
    localStorage.setItem('snaglist_companies', JSON.stringify([
      {
        id: DEFAULT_ORG_ID,
        name: 'Default Organization',
        code: 'DEF_ORG',
        timezone: 'Asia/Riyadh',
        currency: 'SAR',
        language: 'ar',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        primary_color: '#6A89A7',
        secondary_color: '#E0E7FF',
        report_header: 'Default Organization - Inspection Audit Report',
        report_footer: 'Confidential Document - Generated Automatically'
      },
      {
        id: 'co2-uuid-0000-0000-000000000000',
        name: 'Al-Mousa Construction Group',
        code: 'MOUSA_GROUP',
        timezone: 'Asia/Riyadh',
        currency: 'SAR',
        language: 'en',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        primary_color: '#1E3A8A',
        secondary_color: '#DBEAFE',
        report_header: 'Al-Mousa Construction - Site QA/QC Report',
        report_footer: 'Al-Mousa Group Operations Dept.'
      }
    ]));
  }

  // 2. Profiles (inject company_id)
  const profilesStr = localStorage.getItem('snaglist_profiles');
  if (profilesStr && profilesStr !== 'null' && profilesStr !== 'undefined') {
    try {
      const profiles = JSON.parse(profilesStr);
      const updated = profiles.map((p: any) => ({
        ...p,
        company_id: p.company_id || DEFAULT_ORG_ID
      }));
      localStorage.setItem('snaglist_profiles', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  }

  // 3. Projects (inject company_id, project_type, level_structure)
  const projectsStr = localStorage.getItem('snaglist_projects');
  if (projectsStr && projectsStr !== 'null' && projectsStr !== 'undefined') {
    try {
      const projects = JSON.parse(projectsStr);
      const updated = projects.map((p: any) => ({
        ...p,
        company_id: p.company_id || DEFAULT_ORG_ID,
        project_type: p.project_type || 'villa',
        level_structure: p.level_structure || ['Block', 'Villa']
      }));
      localStorage.setItem('snaglist_projects', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  }

  // 4. Blocks (inject company_id) & project_nodes tree
  const blocksStr = localStorage.getItem('snaglist_blocks');
  const projectNodes: any[] = [];
  if (blocksStr && blocksStr !== 'null' && blocksStr !== 'undefined') {
    try {
      const blocks = JSON.parse(blocksStr);
      const updated = blocks.map((b: any) => {
        const uBlock = { ...b, company_id: b.company_id || DEFAULT_ORG_ID };
        projectNodes.push({
          id: uBlock.id,
          project_id: uBlock.project_id,
          parent_id: null,
          company_id: uBlock.company_id,
          name: uBlock.name,
          node_type: 'Block',
          description: uBlock.description,
          completion_rate: 0,
          created_at: uBlock.created_at || new Date().toISOString(),
          updated_at: uBlock.created_at || new Date().toISOString()
        });
        return uBlock;
      });
      localStorage.setItem('snaglist_blocks', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  }

  // 5. Villas (inject company_id) & project_nodes tree
  const villasStr = localStorage.getItem('snaglist_villas');
  if (villasStr && villasStr !== 'null' && villasStr !== 'undefined') {
    try {
      const villas = JSON.parse(villasStr);
      const updated = villas.map((v: any) => {
        const uVilla = { ...v, company_id: v.company_id || DEFAULT_ORG_ID };
        projectNodes.push({
          id: uVilla.id,
          project_id: 'proj-1',
          parent_id: uVilla.block_id,
          company_id: uVilla.company_id,
          name: uVilla.villa_number,
          node_type: 'Villa',
          description: `${uVilla.owner || ''} unit`,
          completion_rate: uVilla.completion_rate || 0,
          created_at: uVilla.created_at || new Date().toISOString(),
          updated_at: uVilla.created_at || new Date().toISOString()
        });
        return uVilla;
      });
      localStorage.setItem('snaglist_villas', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  }

  localStorage.setItem('snaglist_nodes', JSON.stringify(projectNodes));

  // 6. Categories
  const categoriesStr = localStorage.getItem('snaglist_categories');
  if (categoriesStr && categoriesStr !== 'null' && categoriesStr !== 'undefined') {
    try {
      const categories = JSON.parse(categoriesStr);
      const updated = categories.map((c: any) => ({
        ...c,
        company_id: c.company_id || DEFAULT_ORG_ID
      }));
      localStorage.setItem('snaglist_categories', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  }

  // 7. Templates
  const templatesStr = localStorage.getItem('snaglist_templates');
  if (templatesStr && templatesStr !== 'null' && templatesStr !== 'undefined') {
    try {
      const templates = JSON.parse(templatesStr);
      const updated = templates.map((t: any) => ({
        ...t,
        company_id: t.company_id || DEFAULT_ORG_ID
      }));
      localStorage.setItem('snaglist_templates', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  }

  // 8. Items
  const itemsStr = localStorage.getItem('snaglist_items');
  if (itemsStr && itemsStr !== 'null' && itemsStr !== 'undefined') {
    try {
      const items = JSON.parse(itemsStr);
      const updated = items.map((i: any) => ({
        ...i,
        company_id: i.company_id || DEFAULT_ORG_ID,
        location_node_id: i.location_node_id || i.villa_id,
        form_responses: i.form_responses || {}
      }));
      localStorage.setItem('snaglist_items', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  }

  // 9. Comments, Photos, History, Notifications
  const tables = ['snaglist_comments', 'snaglist_photos', 'snaglist_history', 'snaglist_notifications'];
  tables.forEach(tbl => {
    const raw = localStorage.getItem(tbl);
    if (raw) {
      try {
        const arr = JSON.parse(raw);
        const updated = arr.map((item: any) => ({
          ...item,
          company_id: item.company_id || DEFAULT_ORG_ID
        }));
        localStorage.setItem(tbl, JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
    }
  });

  localStorage.setItem('snaglist_doc_folders', JSON.stringify([]));
  localStorage.setItem('snaglist_docs', JSON.stringify([]));
};

export const MASTER_CATEGORIES = [
  { id: 'c0000000-0000-0000-0000-000000000001', name: 'Civil Works', description: 'Concrete, structure, partition and masonry' },
  { id: 'c0000000-0000-0000-0000-000000000002', name: 'Architectural', description: 'Internal finishes, plaster and wall alignments' },
  { id: 'c0000000-0000-0000-0000-000000000003', name: 'Structural', description: 'Beams, columns, foundation and slab checks' },
  { id: 'c0000000-0000-0000-0000-000000000004', name: 'MEP', description: 'Mechanical, electrical and plumbing coordinated items' },
  { id: 'c0000000-0000-0000-0000-000000000005', name: 'Electrical', description: 'Power sockets, DB Dressing, earth continuity' },
  { id: 'c0000000-0000-0000-0000-000000000006', name: 'Lighting', description: 'Light fixtures, switches and general lighting checks' },
  { id: 'c0000000-0000-0000-0000-000000000007', name: 'Low Current', description: 'Data, intercom, CCTV and telephone cabling' },
  { id: 'c0000000-0000-0000-0000-000000000008', name: 'Plumbing', description: 'Water pressure, leakage, sanitary fixtures' },
  { id: 'c0000000-0000-0000-0000-000000000009', name: 'Drainage', description: 'Drain lines, floor traps, cleanouts and siphons' },
  { id: 'c0000000-0000-0000-0000-000000000010', name: 'HVAC', description: 'AC performance, grilles, unit and insulation' },
  { id: 'c0000000-0000-0000-0000-000000000011', name: 'Fire Fighting', description: 'Sprinklers, fire hose reel and extinguisher checks' },
  { id: 'c0000000-0000-0000-0000-000000000012', name: 'Doors', description: 'Timber doors, hinges, locks and door closers' },
  { id: 'c0000000-0000-0000-0000-000000000013', name: 'Windows', description: 'Aluminium windows, gaskets and locking handles' },
  { id: 'c0000000-0000-0000-0000-000000000014', name: 'Glass', description: 'Glass panels, shower screens, tempering and scratches' },
  { id: 'c0000000-0000-0000-0000-000000000015', name: 'Painting', description: 'Wall painting, primer, putty, final coat and finishes' },
  { id: 'c0000000-0000-0000-0000-000000000016', name: 'Gypsum Ceiling', description: 'Gypsum board ceiling, joints, access panels and hangers' },
  { id: 'c0000000-0000-0000-0000-000000000017', name: 'False Ceiling', description: 'Grid ceiling, tiles and support structure' },
  { id: 'c0000000-0000-0000-0000-000000000018', name: 'Waterproofing', description: 'Wet area waterproofing, roof and terrace membranes' },
  { id: 'c0000000-0000-0000-0000-000000000019', name: 'Flooring', description: 'Parquet, vinyl, raised floors and underlayments' },
  { id: 'c0000000-0000-0000-0000-000000000020', name: 'Wall Tiles', description: 'Ceramic/porcelain wall tiles, tile lippage and grouting' },
  { id: 'c0000000-0000-0000-0000-000000000021', name: 'Floor Tiles', description: 'Ceramic/porcelain floor tiles, slope and grouting' },
  { id: 'c0000000-0000-0000-0000-000000000022', name: 'Marble', description: 'Marble vanity tops, stair treads, threshold and polish' },
  { id: 'c0000000-0000-0000-0000-000000000023', name: 'Granite', description: 'Granite countertops, external paving and thresholds' },
  { id: 'c0000000-0000-0000-0000-000000000024', name: 'Joinery', description: 'General carpentry, trim, architraves and skirtings' },
  { id: 'c0000000-0000-0000-0000-000000000025', name: 'Kitchen Cabinets', description: 'Kitchen cabinet carcasses, doors, shelves and handles' },
  { id: 'c0000000-0000-0000-0000-000000000026', name: 'Wardrobes', description: 'Bedroom wardrobes, drawers, hanging rods and hinges' },
  { id: 'c0000000-0000-0000-0000-000000000027', name: 'Furniture', description: 'Loose and fixed furniture checks' },
  { id: 'c0000000-0000-0000-0000-000000000028', name: 'Appliances', description: 'White goods, ovens, hoods, hobs and fridges' },
  { id: 'c0000000-0000-0000-0000-000000000029', name: 'Sanitary Fixtures', description: 'Wash basins, toilets, bidets, showers and mixers' },
  { id: 'c0000000-0000-0000-0000-000000000030', name: 'Bathroom Accessories', description: 'Towel rails, soap holders, toilet roll holders and mirrors' },
  { id: 'c0000000-0000-0000-0000-000000000031', name: 'Curtains', description: 'Curtain tracks, boxes, motorized tracks and drapes' },
  { id: 'c0000000-0000-0000-0000-000000000032', name: 'Aluminium Works', description: 'Cladding, louvers, screens and flashings' },
  { id: 'c0000000-0000-0000-0000-000000000033', name: 'Steel Works', description: 'Handrails, cat ladders, structural steel framing' },
  { id: 'c0000000-0000-0000-0000-000000000034', name: 'External Works', description: 'Asphalt paving, interlock, curb stones and gates' },
  { id: 'c0000000-0000-0000-0000-000000000035', name: 'Landscape', description: 'Soft landscape, trees, grass, irrigation drippers' },
  { id: 'c0000000-0000-0000-0000-000000000036', name: 'Road Works', description: 'Road marking, signage, manholes and speed humps' },
  { id: 'c0000000-0000-0000-0000-000000000037', name: 'Boundary Wall', description: 'Perimeter fence, retaining walls and plaster' },
  { id: 'c0000000-0000-0000-0000-000000000038', name: 'Cleaning', description: 'Debris removal, chemical washing, deep clean' },
  { id: 'c0000000-0000-0000-0000-000000000039', name: 'Final Handover', description: 'Snag-free certification, keys tagging, testing & commissioning' },
  { id: 'c0000000-0000-0000-0000-000000000040', name: 'General', description: 'Miscellaneous inspection checks' }
];

export const seedIzdiharProject = () => {
  if (typeof window === 'undefined') return;
  console.log('Procedurally seeding Izdihar Villa Project (IZD-001) with 5,500+ snags...');

  const DEFAULT_ORG_ID = 'c0000000-0000-0000-0000-000000000000';
  const projectId = 'a0000000-0000-0000-0000-000000000002';

  // 1. Check/Add master categories
  const categoriesList: InspectionCategory[] = safeParseList('snaglist_categories');
  MASTER_CATEGORIES.forEach(mc => {
    if (!categoriesList.some(c => c.id === mc.id)) {
      categoriesList.push({
        id: mc.id,
        company_id: DEFAULT_ORG_ID,
        name: mc.name,
        description: mc.description,
        created_at: new Date().toISOString()
      });
    }
  });
  localStorage.setItem('snaglist_categories', JSON.stringify(categoriesList));

  // 2. Add Project Izdihar
  const projectsList: Project[] = (safeParseList('snaglist_projects') || []).filter((p: any) => p && p.id !== projectId);
  projectsList.unshift({
    id: projectId,
    company_id: DEFAULT_ORG_ID,
    name: 'Izdihar Villa Project',
    description: 'Premium Residential Compound featuring 30 luxury villas (120 units total) and comprehensive common facilities.',
    owner: 'Default Organization',
    contractor: 'Saudi Construction Co.',
    consultant: 'Khatib & Alami',
    engineer: 'Eng. Ahmed',
    completion_rate: 72.0,
    created_at: new Date().toISOString(),
    project_type: 'villa',
    level_structure: ['Villa', 'Unit', 'Room/Area']
  });
  localStorage.setItem('snaglist_projects', JSON.stringify(projectsList));

  // 3. Generate Master Inspection Templates (350-500 checkpoints)
  const masterTemplates: InspectionTemplate[] = (safeParseList('snaglist_templates') || []).filter((t: any) => t && !t.id.startsWith('tpl-izd-'));
  
  const roomsForChecklists = [
    'Entrance', 'Hall', 'Living Room', 'Dining Room', 'Kitchen', 
    'Bathroom', 'Master Bedroom', 'Bedroom 2', 'Bedroom 3', 
    'Maid Room', 'Store', 'Laundry', 'Balcony', 'Staircase', 
    'Corridor', 'Electrical Panel', 'Mechanical Area', 'Roof', 'External Elevation'
  ];

  const checksByCat = [
    { cat: 'Painting', check: 'Check wall paint for roller marks, touch-ups and uniformity' },
    { cat: 'Painting', check: 'Inspect ceiling paint finish for patches or peeling' },
    { cat: 'Gypsum Ceiling', check: 'Check gypsum board ceiling joints for tape hairline cracks' },
    { cat: 'Gypsum Ceiling', check: 'Verify gypsum ceiling level and drop alignment' },
    { cat: 'Lighting', check: 'Test light fixture operations and verify lux levels' },
    { cat: 'Lighting', check: 'Check switches alignment, level and gaps' },
    { cat: 'Electrical', check: 'Verify wall sockets terminal polarity and earth connection' },
    { cat: 'Electrical', check: 'Check circuit breakers labeling and DB dressing safety' },
    { cat: 'Low Current', check: 'Test TV outlet signal level and coax termination' },
    { cat: 'Low Current', check: 'Test RJ45 internet port continuity and speed' },
    { cat: 'Floor Tiles', check: 'Verify floor tile slopes towards drainage floor traps' },
    { cat: 'Floor Tiles', check: 'Check floor tiles lippage and grout joint widths' },
    { cat: 'Wall Tiles', check: 'Verify wall tile verticality, plumb and grout joint consistency' },
    { cat: 'Doors', check: 'Check timber door frame anchors, paint and architrave joints' },
    { cat: 'Doors', check: 'Verify door lock latches and key cylinder operation smoothness' },
    { cat: 'Windows', check: 'Inspect aluminium window sliding tracks and locking handles' },
    { cat: 'Glass', check: 'Check window double-glazed glass panes for deep cleaning scratches' },
    { cat: 'Glass', check: 'Verify shower glass panel bottom seals for water leaks' },
    { cat: 'Waterproofing', check: 'Conduct wet area floor waterproofing pond testing' },
    { cat: 'Sanitary Fixtures', check: 'Inspect wash basin mixers for hot/cold indicator labels' },
    { cat: 'Plumbing', check: 'Test under-sink flexi hoses for high water pressure leaks' },
    { cat: 'Cleaning', check: 'Verify general cleanup, removing cement grout stains and dust' }
  ];

  let tCounter = 1;
  const newTemplates: InspectionTemplate[] = [];
  roomsForChecklists.forEach((rName) => {
    checksByCat.forEach((chk) => {
      newTemplates.push({
        id: `tpl-izd-${tCounter++}`,
        company_id: DEFAULT_ORG_ID,
        category_name: chk.cat,
        audit_item: `${chk.check} in ${rName}`,
        is_active: true,
        created_at: new Date().toISOString()
      });
    });
  });
  localStorage.setItem('snaglist_templates', JSON.stringify([...masterTemplates, ...newTemplates]));

  // 4. Generate project nodes tree
  const nodesList: ProjectNode[] = (safeParseList('snaglist_nodes') || []).filter((n: any) => n && n.project_id !== projectId);

  const newNodes: ProjectNode[] = [];

  // Generate 30 Villas
  for (let v = 1; v <= 30; v++) {
    const vId = `d0000000-0000-0000-0000-0000000010${String(v).padStart(2, '0')}`;
    const is2BHKVilla = v <= 10;
    newNodes.push({
      id: vId,
      project_id: projectId,
      parent_id: null,
      company_id: DEFAULT_ORG_ID,
      name: `Villa ${String(v).padStart(2, '0')}`,
      node_type: 'Villa',
      description: `${is2BHKVilla ? '2 BHK Layout' : '1 BHK Layout'} building structure #S-${v}`,
      completion_rate: Math.floor(Math.random() * 25) + 60,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    const unitTypes = ['Ground Floor Unit', 'First Floor Unit', 'Second Floor Unit', 'Penthouse Unit'];
    unitTypes.forEach((uName, uIndex) => {
      const uId = `d0000000-0000-0000-0000-0000000020${String(v).padStart(2, '0')}${uIndex + 1}`;
      newNodes.push({
        id: uId,
        project_id: projectId,
        parent_id: vId,
        company_id: DEFAULT_ORG_ID,
        name: uName,
        node_type: 'Unit',
        description: `${uName} of Villa ${String(v).padStart(2, '0')}`,
        completion_rate: Math.floor(Math.random() * 30) + 55,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      let unitRooms: string[] = [];
      if (is2BHKVilla) {
        unitRooms = ['Entrance', 'Hall', 'Bedroom 1', 'Bedroom 2', 'Kitchen', 'Bathroom 1', 'Bathroom 2', 'Balcony', 'Electrical DB'];
      } else {
        unitRooms = ['Entrance', 'Hall', 'Bedroom', 'Kitchen', 'Bathroom', 'Balcony', 'Electrical DB'];
      }

      unitRooms.forEach((rName, rIndex) => {
        const rId = `d0000000-0000-0000-0000-000000003${String(v).padStart(2, '0')}${uIndex + 1}${String(rIndex).padStart(2, '0')}`;
        newNodes.push({
          id: rId,
          project_id: projectId,
          parent_id: uId,
          company_id: DEFAULT_ORG_ID,
          name: rName,
          node_type: 'Room/Area',
          description: `${rName} area in ${uName}`,
          completion_rate: Math.floor(Math.random() * 35) + 50,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      });
    });
  }

  const commonRootId = `d0000000-0000-0000-0000-0000000000c0`;
  newNodes.push({
    id: commonRootId,
    project_id: projectId,
    parent_id: null,
    company_id: DEFAULT_ORG_ID,
    name: 'Common Facilities',
    node_type: 'Common Area',
    description: 'Shared compound spaces and utility centers',
    completion_rate: 78.0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });

  const commonFacilities = [
    'Management Office', 'Gym', 'Security Office', 'Guard Room', 
    'Main Entrance', 'Exit Gate', 'Electrical Room', 'Pump Room', 
    'Water Tank', 'Generator Room', 'Garbage Collection Area', 'Parking Areas', 
    'Landscape Areas', 'Walkways', 'Boundary Wall', 'External Roads', 
    'Street Lighting', 'Children\'s Play Area', 'Common Toilets', 'Utility Rooms'
  ];

  commonFacilities.forEach((cfName, cfIndex) => {
    const cfId = `d0000000-0000-0000-0000-000000000cf${String(cfIndex).padStart(2, '0')}`;
    newNodes.push({
      id: cfId,
      project_id: projectId,
      parent_id: commonRootId,
      company_id: DEFAULT_ORG_ID,
      name: cfName,
      node_type: 'Facility',
      description: `${cfName} compound utility service`,
      completion_rate: Math.floor(Math.random() * 20) + 70,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  });

  localStorage.setItem('snaglist_nodes', JSON.stringify([...nodesList, ...newNodes]));

  // 5. Generate ~5,700 realistic snag items procedurally
  const snagsList: InspectionItem[] = (safeParseList('snaglist_items') || []).filter((s: any) => s && !String(s.id).startsWith('f0000000-0000-0000-0000-00000'));
  const commentsList: InspectionComment[] = (safeParseList('snaglist_comments') || []).filter((c: any) => c && !c.id.startsWith('e0000000-0000-0000-0000-00000'));
  
  const itemsToAdd: InspectionItem[] = [];
  const commentsToAdd: InspectionComment[] = [];

  const CHECKPOINTS_MAP: Record<string, { cat: string; title: string; desc: string; root: string; correct: string }[]> = {
    'Entrance': [
      { cat: 'c0000000-0000-0000-0000-000000000012', title: 'Main door weather stripping is loose', desc: 'Inspect perimeter rubber seals on main entrance door frame.', root: 'Poor gasket glue application', correct: 'Replace frame weather strip gasket' },
      { cat: 'c0000000-0000-0000-0000-000000000012', title: 'Smart door lock cylinder or handle is loose', desc: 'Check keyless lock assembly bolts inside lock faceplate.', root: 'Insufficient bolt tightening', correct: 'Tighten lockset assembly screws' },
      { cat: 'c0000000-0000-0000-0000-000000000012', title: 'Hydraulic door closer speed is too fast', desc: 'Adjust closing and latching speed valves on door closer arm.', root: 'Incorrect valve calibration', correct: 'Adjust sweep speed screw' },
      { cat: 'c0000000-0000-0000-0000-000000000012', title: 'Door frame architrave has gaps at miter joints', desc: 'Verify joints at top corners. Apply wood filler and sand.', root: 'Improper carpentry joinery cut', correct: 'Fill miter joint with acrylic filler' },
      { cat: 'c0000000-0000-0000-0000-000000000015', title: 'Main door paint coat has drips and running marks', desc: 'Sanding of door surface and application of final polyurethane spray.', root: 'Excessive paint application speed', correct: 'Sand drip marks and repaint door leaf' },
      { cat: 'c0000000-0000-0000-0000-000000000040', title: 'Name plate engraving is scratched or crooked', desc: 'Check lettering alignment and surface finish of brass plate.', root: 'Careless installation by subcontractor', correct: 'Re-align name plate level' },
      { cat: 'c0000000-0000-0000-0000-000000000007', title: 'Entrance door bell chime is not functioning', desc: 'Verify low voltage wire connection behind push button plate.', root: 'Loose terminal screw connection', correct: 'Secure push button terminals' },
      { cat: 'c0000000-0000-0000-0000-000000000022', title: 'Threshold marble strip has cracks or chipped edges', desc: 'Inspect stone threshold joint. Patch with matching color resin.', root: 'Impact during material movement', correct: 'Fill chips with polyester adhesive' }
    ],
    'Hall': [
      { cat: 'c0000000-0000-0000-0000-000000000015', title: 'Wall paint finish shows uneven coats and patchy primer', desc: 'Inspect gypsum board joints. Light sand and apply topcoat.', root: 'Inadequate primer drying time', correct: 'Apply touch-up coat' },
      { cat: 'c0000000-0000-0000-0000-000000000016', title: 'Gypsum ceiling board shows wavy deflection', desc: 'Verify ceiling frame support level with laser tool.', root: 'Sagging ceiling support channel', correct: 'Reinforce ceiling hanger rods' },
      { cat: 'c0000000-0000-0000-0000-000000000016', title: 'Ceiling joint tape has bubbled or separated', desc: 'Rake joint, apply new paper tape, joint compound and sand.', root: 'Lack of joint compound backing', correct: 'Re-tape ceiling joints' },
      { cat: 'c0000000-0000-0000-0000-000000000006', title: 'Recessed spotlight clip is loose causing ceiling gap', desc: 'Check spring clips on LED spotlight casing. Adjust springs.', root: 'Oversized drywall ceiling cutout', correct: 'Adjust spring clip tension' },
      { cat: 'c0000000-0000-0000-0000-000000000006', title: 'Light switch plate is crooked and out of level', desc: 'Loosen box screws, level plate with spirit tool, and tighten.', root: 'Misaligned wall conduit box', correct: 'Re-level switch faceplate' },
      { cat: 'c0000000-0000-0000-0000-000000000005', title: 'Electrical wall socket has loose wiring terminal contacts', desc: 'Open plate, inspect conductor screw joints, and tighten.', root: 'Subcontractor rush execution', correct: 'Tighten terminal plate screws' },
      { cat: 'c0000000-0000-0000-0000-000000000007', title: 'TV outlet coaxial connection has high attenuation loss', desc: 'Verify shielding contact of F-connector in wall plate.', root: 'Poor coaxial shielding dressing', correct: 'Crimp new F-connector terminal' },
      { cat: 'c0000000-0000-0000-0000-000000000007', title: 'Data outlet RJ45 port fails continuity testing', desc: 'Re-punch terminal connections in wall socket and patch panel.', root: 'Wire color code mixup at jack', correct: 'Punch down terminal pins' },
      { cat: 'c0000000-0000-0000-0000-000000000021', title: 'Floor tiles have lippage exceeding 1.5mm tolerance', desc: 'Locate uneven tiles. Chop and replace to prevent lip tripping.', root: 'Incorrect tile spacer application', correct: 'Chop and re-lay floor tiles' },
      { cat: 'c0000000-0000-0000-0000-000000000021', title: 'Skirting tile joints are not aligned with floor tile joints', desc: 'Verify vertical alignment of grout joints from floor to wall.', root: 'Careless tiling layout planning', correct: 'Adjust and replace skirting tiles' },
      { cat: 'c0000000-0000-0000-0000-000000000012', title: 'Door leaf is binding against latch strike plate', desc: 'Re-align hinges and file strike plate slot to clear latch bolt.', root: 'Door frame skewness or sagging', correct: 'Adjust hinge backing plate' },
      { cat: 'c0000000-0000-0000-0000-000000000012', title: 'Door lock cylinder key operation is stiff', desc: 'Apply graphite powder lubricant to key cylinder chambers.', root: 'Construction dust in lock cylinder', correct: 'Flush lock and apply dry lube' },
      { cat: 'c0000000-0000-0000-0000-000000000013', title: 'Aluminium sliding window frame is out of plumb', desc: 'Adjust frame alignment screw anchors. Pack with shims.', root: 'Failure to use level during fixing', correct: 'Adjust frame vertical level' },
      { cat: 'c0000000-0000-0000-0000-000000000014', title: 'Double glazed window glass has deep scratches', desc: 'Check glass pane quality. Replace unit if scratches are deep.', root: 'Aggressive construction cleanup scraper', correct: 'Replace double glazed panel unit' },
      { cat: 'c0000000-0000-0000-0000-000000000031', title: 'Curtain track runner wheels are stuck', desc: 'Clean dust and paint residue inside aluminium track slot.', root: 'Lack of protection during ceiling paint', correct: 'Clean track slot and lubricate runners' },
      { cat: 'c0000000-0000-0000-0000-000000000010', title: 'AC linear slot diffuser has paint stains', desc: 'Clean paint stains from diffuser blades. Paint diffuser if damaged.', root: 'Failure to mask diffuser during paint', correct: 'Clean slot diffuser surfaces' }
    ],
    'Bedroom': [
      { cat: 'c0000000-0000-0000-0000-000000000015', title: 'Wall surface shows visible plaster cracks and holes', desc: 'Apply wall filler, sand smooth and apply final latex coat.', root: 'Drywall joint shrinkage', correct: 'Fill cracks and apply touch-up coat' },
      { cat: 'c0000000-0000-0000-0000-000000000006', title: 'Recessed downlight reflector is dirty or damaged', desc: 'Clean reflector or replace damaged spotlight casing.', root: 'Handling with dirty worker hands', correct: 'Clean spotlight casing' },
      { cat: 'c0000000-0000-0000-0000-000000000005', title: 'AC isolator switch plate is loose on wall surface', desc: 'Tighten fixing screws of waterproof isolator box.', root: 'Loose anchors in concrete wall', correct: 'Replace wall plug anchors and screw' },
      { cat: 'c0000000-0000-0000-0000-000000000026', title: 'Wardrobe drawer tracks slide out of level', desc: 'Adjust slide rail height screws to ensure drawer stays shut.', root: 'Unlevel carcass assembly', correct: 'Adjust slide rail alignments' },
      { cat: 'c0000000-0000-0000-0000-000000000012', title: 'Door leaf does not clear carpet or parquet floor level', desc: 'Remove door leaf and trim bottom edge by 3mm. Re-varnish.', root: 'Inadequate floor clearance tolerance', correct: 'Trim bottom edge of door leaf' },
      { cat: 'c0000000-0000-0000-0000-000000000013', title: 'Window frame perimeter sealant has gaps and shrinkage', desc: 'Apply high performance exterior grade silicone around aluminium.', root: 'Weathering of inferior sealant', correct: 'Apply new weatherproofing silicone' },
      { cat: 'c0000000-0000-0000-0000-000000000014', title: 'Window pane safety tempering stamp is missing', desc: 'Verify tempered markings. Replace glass if safety code is missing.', root: 'Un-tempered glass installed by supplier', correct: 'Replace glass with certified panel' },
      { cat: 'c0000000-0000-0000-0000-000000000019', title: 'Parquet flooring skirtings are loose and gapped', desc: 'Fix skirtings using headless nails and matching wood glue.', root: 'Inadequate contact adhesive used', correct: 'Re-glue and nail skirtings' },
      { cat: 'c0000000-0000-0000-0000-000000000010', title: 'AC blower unit creates excessive noise on high speed', desc: 'Inspect fan motor alignment and balance of blower blades.', root: 'Imbalanced fan motor housing', correct: 'Align AC fan housing and blades' },
      { cat: 'c0000000-0000-0000-0000-000000000038', title: 'Parquet flooring has visible paint splatters', desc: 'Clean parquet floor with specialized wood cleaning compound.', root: 'Lack of dust sheets on floors', correct: 'Scrape paint splatters with plastic tool' }
    ],
    'Kitchen': [
      { cat: 'c0000000-0000-0000-0000-000000000025', title: 'Kitchen cabinet doors alignment is crooked', desc: 'Adjust 3D hinge adjustment screws to align cabinet gaps.', root: 'Uneven cabinet mounting blocks', correct: 'Adjust cabinet hinge levels' },
      { cat: 'c0000000-0000-0000-0000-000000000025', title: 'Cabinet drawer soft close track is stiff', desc: 'Lubricate drawer slide track rails and clear sawdust.', root: 'Sawdust clogging slide rollers', correct: 'Clean and oil drawer slides' },
      { cat: 'c0000000-0000-0000-0000-000000000023', title: 'Granite countertop edge has rough polish finish', desc: 'Grind and wet-polish granite profile edge to match top face.', root: 'Incomplete fabrication workshop prep', correct: 'Wet polish granite chamfer profile' },
      { cat: 'c0000000-0000-0000-0000-000000000020', title: 'Backsplash tile joints have unequal grout widths', desc: 'Rake grout joints and apply matching grout using spacers.', root: 'Failure to use tile spacers', correct: 'Rake and re-grout tile joints' },
      { cat: 'c0000000-0000-0000-0000-000000000008', title: 'Kitchen sink seal has water seepage leaks', desc: 'Strip silicone sealant, clean surface, apply sanitary sealant.', root: 'Poor sealing execution', correct: 'Apply new sanitary white silicone' },
      { cat: 'c0000000-0000-0000-0000-000000000029', title: 'Kitchen mixer tap has loose mount base', desc: 'Tighten securing brass locknut from under countertop.', root: 'Inadequate under-sink access tool used', correct: 'Tighten mixer retaining locknut' },
      { cat: 'c0000000-0000-0000-0000-000000000009', title: 'Sink waste pipe connection leaking under sink', desc: 'Inspect compression washer in kitchen trap waste siphon.', root: 'Misaligned PVC pipe threads', correct: 'Replace slip washer and secure joint' },
      { cat: 'c0000000-0000-0000-0000-000000000008', title: 'Hot water line does not deliver hot water', desc: 'Verify heater valve is open and thermostat is powered.', root: 'Heater isolate valve is closed', correct: 'Open heater water loop valves' },
      { cat: 'c0000000-0000-0000-0000-000000000005', title: 'Cooker socket isolator switch is not wired', desc: 'Connect power cables to cook plate connection box behind.', root: 'Unfinished terminal connections', correct: 'Terminate cooker power cabling' },
      { cat: 'c0000000-0000-0000-0000-000000000010', title: 'Kitchen exhaust fan damper is stuck closed', desc: 'Verify duct damper swings open freely under fan exhaust pressure.', root: 'Over-painted damper flap hinge', correct: 'Free exhaust fan damper flap' }
    ],
    'Bathroom': [
      { cat: 'c0000000-0000-0000-0000-000000000018', title: 'Wet area waterproofing has damage from subsequent works', desc: 'Apply patch of elastomeric waterproofing membrane over tear.', root: 'Workers walking with steel boots', correct: 'Patch waterproofing membrane' },
      { cat: 'c0000000-0000-0000-0000-000000000021', title: 'Floor tile slope does not drain completely to trap', desc: 'Check floor tiles slope. Re-lay tiles to form positive slope.', root: 'Improper screed leveling', correct: 'Chop tiles, re-grade screed, tile' },
      { cat: 'c0000000-0000-0000-0000-000000000009', title: 'Floor drain trap cleanout plug is missing', desc: 'Install threaded ABS cleanout plug in floor trap cup.', root: 'Lost cleanout cap during tiling cleanup', correct: 'Fit new plastic cleanout plug' },
      { cat: 'c0000000-0000-0000-0000-000000000020', title: 'Bathroom wall tile joints have voids and gaps', desc: 'Clean tile joints and apply anti-fungal epoxy tile grout.', root: 'Incomplete grout filling work', correct: 'Epoxy grout tile joints' },
      { cat: 'c0000000-0000-0000-0000-000000000022', title: 'Marble vanity counter has rough sand marks', desc: 'Grind vanity top with diamond pads up to 3000 grit and buff.', root: 'Poor marble fabrication polish', correct: 'Grind and buff marble counter' },
      { cat: 'c0000000-0000-0000-0000-000000000029', title: 'Toilet bowl flush tank has continuous water bypass', desc: 'Verify flush siphon valve and fill float height setting.', root: 'High float water level setting', correct: 'Adjust water fill float arm' },
      { cat: 'c0000000-0000-0000-0000-000000000029', title: 'Toilet seat cover is misaligned on pan rim', desc: 'Loosen plastic anchor hinges, align seat, and tighten.', root: 'Loose factory assembly', correct: 'Align toilet seat anchor hinges' },
      { cat: 'c0000000-0000-0000-0000-000000000029', title: 'Shower mixer cartridge has internal sand blockage', desc: 'Disassemble mixer tap, flush cartridge and clean dirt filters.', root: 'Debris left in piping before flushing', correct: 'Clean mixer cartridge filters' },
      { cat: 'c0000000-0000-0000-0000-000000000030', title: 'Vanity mirror has edge silvering damage from humidity', desc: 'Replace mirror unit with water resistant backing mirror.', root: 'Moisture ingress on cheap backing', correct: 'Replace vanity mirror' },
      { cat: 'c0000000-0000-0000-0000-000000000010', title: 'Bathroom exhaust fan has excessive vibration noise', desc: 'Tighten housing mounting screws in gypsum ceiling frame.', root: 'Loose ceiling mounting bracket', correct: 'Secure exhaust fan casing' }
    ],
    'Balcony': [
      { cat: 'c0000000-0000-0000-0000-000000000021', title: 'Balcony floor tiles slope away from drainage trap', desc: 'Locate flat tiles. Re-screed and re-lay balcony floor tiles.', root: 'Improper outdoor grading slope', correct: 'Re-lay tiles with slope to drain' },
      { cat: 'c0000000-0000-0000-0000-000000000009', title: 'Balcony drainage floor trap is clogged with cement', desc: 'Clean out construction mortar from drainage trap cavity.', root: 'Failure to mask drain during screed', correct: 'Chop cement debris from drain' },
      { cat: 'c0000000-0000-0000-0000-000000000033', title: 'Balcony metal handrail weld joints have rough burs', desc: 'Grind weld joints smooth, apply rust inhibitive primer and paint.', root: 'Poor steel weld grinding finish', correct: 'Grind weld joints smooth and repaint' },
      { cat: 'c0000000-0000-0000-0000-000000000015', title: 'Balcony external plaster shows salt efflorescence', desc: 'Scrape salt deposits, apply breathable masonry primer and paint.', root: 'Moisture absorption in blockwork wall', correct: 'Scrape, seal and paint plaster' },
      { cat: 'c0000000-0000-0000-0000-000000000038', title: 'Balcony floor tiles have cement grout stains', desc: 'Clean balcony tiling with specialized acidic tile cleaner wash.', root: 'Failure to wash grout before drying', correct: 'Acid wash balcony floor tiles' }
    ],
    'Electrical DB': [
      { cat: 'c0000000-0000-0000-0000-000000000005', title: 'Electrical DB circuit breakers have missing labels', desc: 'Produce, print and affix descriptive MCB label strips.', root: 'Incomplete electrical labeling work', correct: 'Affix breaker identification labels' },
      { cat: 'c0000000-0000-0000-0000-000000000005', title: 'DB cover panel door latch is broken', desc: 'Replace door latch mechanism on electrical distribution board.', root: 'Impact during material deliveries', correct: 'Replace plastic door latch' },
      { cat: 'c0000000-0000-0000-0000-000000000005', title: 'DB earth copper busbar has loose terminal connections', desc: 'Inspect earth wires and tighten terminal screws.', root: 'Subcontractor speed terminations', correct: 'Tighten ground busbar screws' },
      { cat: 'c0000000-0000-0000-0000-000000000005', title: 'Electrical DB schematic directory card is missing', desc: 'Print schematic directory card and place in DB door slot.', root: 'Incomplete panelboard documentation', correct: 'Fit printed panel layout cards' }
    ]
  };

  const roomNodes = newNodes.filter(n => n.node_type === 'Room/Area');
  const facilityNodes = newNodes.filter(n => n.node_type === 'Facility');

  let snagCounter = 1;

  roomNodes.forEach((roomNode) => {
    let roomType = roomNode.name;
    if (roomType.startsWith('Bedroom')) roomType = 'Bedroom';
    if (roomType.startsWith('Bathroom')) roomType = 'Bathroom';

    const templates = CHECKPOINTS_MAP[roomType] || CHECKPOINTS_MAP['Hall'];
    const snagsToCreate = Math.floor(Math.random() * 3) + 5; // 5, 6, or 7 snags
    const selectedTemps = [...templates].sort(() => 0.5 - Math.random()).slice(0, snagsToCreate);

    selectedTemps.forEach((temp) => {
      const rVal = Math.random();
      let status = 'open';
      let remarks = 'Checklist inspection item.';

      if (rVal < 0.22) {
        status = 'open';
      } else if (rVal < 0.40) {
        status = 'in_progress';
      } else if (rVal < 0.55) {
        status = 'rectified';
      } else if (rVal < 0.70) {
        status = 'qa_verification';
      } else if (rVal < 0.90) {
        status = 'closed';
      } else {
        status = Math.random() > 0.5 ? 'open' : 'in_progress';
        remarks = 'REJECTED: Rectification not acceptable. Re-work required immediately.';
      }

      const daysAgo = Math.floor(Math.random() * 25) + 6;
      const createdDate = new Date();
      createdDate.setDate(createdDate.getDate() - daysAgo);

      const dueDate = new Date(createdDate);
      if (rVal > 0.90 && status !== 'closed') {
        dueDate.setDate(createdDate.getDate() + 2);
      } else {
        dueDate.setDate(createdDate.getDate() + 14);
      }

      let closedDate: string | undefined = undefined;
      if (status === 'closed') {
        const closedDays = Math.floor(Math.random() * daysAgo);
        const cDate = new Date(createdDate);
        cDate.setDate(cDate.getDate() + closedDays);
        closedDate = cDate.toISOString().split('T')[0];
      }

      const unitNode = newNodes.find(n => n.id === roomNode.parent_id);
      const villaNode = unitNode ? newNodes.find(n => n.id === unitNode.parent_id) : null;

      const snagId = `f0000000-0000-0000-0000-00000${String(snagCounter).padStart(7, '0')}`;
      itemsToAdd.push({
        id: snagId,
        snag_number: `IZD-SNAG-${String(snagCounter).padStart(4, '0')}`,
        company_id: DEFAULT_ORG_ID,
        villa_id: villaNode ? villaNode.id : '',
        location_node_id: roomNode.id,
        category_id: temp.cat,
        title: temp.title,
        description: temp.desc,
        priority: (Math.random() > 0.85 ? 'critical' : Math.random() > 0.65 ? 'high' : 'medium') as any,
        status: status as any,
        location: `${villaNode?.name || ''} - ${unitNode?.name || ''}`,
        room: roomNode.name,
        remarks,
        root_cause: temp.root,
        corrective_action: temp.correct,
        verification: 'QA/QC inspector re-check.',
        closed_by: status === 'closed' ? 'u-admin' : undefined,
        closed_date: closedDate,
        inspection_date: createdDate.toISOString().split('T')[0],
        due_date: dueDate.toISOString().split('T')[0],
        inspector_id: 'u-inspector',
        contractor_id: 'u-contractor',
        assigned_to: 'u-eng',
        created_at: createdDate.toISOString(),
        updated_at: closedDate ? new Date(closedDate).toISOString() : createdDate.toISOString(),
        form_responses: {
          pass_fail: status === 'closed' ? 'pass' : 'fail',
          rating: status === 'closed' ? 5 : 2,
          req_met: status === 'closed' ? 'yes' : 'no'
        }
      });

      if (remarks.startsWith('REJECTED')) {
        commentsToAdd.push({
          id: `e0000000-0000-0000-0000-00000${String(snagCounter).padStart(7, '0')}`,
          inspection_item_id: snagId,
          company_id: DEFAULT_ORG_ID,
          comment: 'Re-inspection failed. Contractor failed to fix basic paint leveling before spray coat. Sand marks are still visible.',
          user_id: 'u-inspector',
          created_at: new Date().toISOString()
        });
      } else if (Math.random() > 0.85) {
        commentsToAdd.push({
          id: `comm-izd-${snagCounter}`,
          inspection_item_id: snagId,
          company_id: DEFAULT_ORG_ID,
          comment: 'Approved by engineer. Rectified successfully.',
          user_id: 'u-eng',
          created_at: new Date().toISOString()
        });
      }

      snagCounter++;
    });
  });

  facilityNodes.forEach((facilityNode) => {
    const snagsToCreate = 10;
    const templates = CHECKPOINTS_MAP['Hall'] || [];
    const selectedTemps = [...templates].sort(() => 0.5 - Math.random()).slice(0, snagsToCreate);

    selectedTemps.forEach((temp) => {
      const rVal = Math.random();
      let status = 'open';
      let remarks = 'Facility commissioning log.';

      if (rVal < 0.20) status = 'open';
      else if (rVal < 0.40) status = 'in_progress';
      else if (rVal < 0.60) status = 'rectified';
      else if (rVal < 0.80) status = 'qa_verification';
      else status = 'closed';

      const daysAgo = Math.floor(Math.random() * 20) + 5;
      const createdDate = new Date();
      createdDate.setDate(createdDate.getDate() - daysAgo);

      const dueDate = new Date(createdDate);
      dueDate.setDate(dueDate.getDate() + 14);

      let closedDate: string | undefined = undefined;
      if (status === 'closed') {
        const closedDays = Math.floor(Math.random() * daysAgo);
        const cDate = new Date(createdDate);
        cDate.setDate(cDate.getDate() + closedDays);
        closedDate = cDate.toISOString().split('T')[0];
      }

      const snagId = `f0000000-0000-0000-0000-00000${String(snagCounter).padStart(7, '0')}`;
      itemsToAdd.push({
        id: snagId,
        snag_number: `IZD-SNAG-${String(snagCounter).padStart(4, '0')}`,
        company_id: DEFAULT_ORG_ID,
        villa_id: 'node-izd-common',
        location_node_id: facilityNode.id,
        category_id: temp.cat,
        title: temp.title,
        description: temp.desc,
        priority: (Math.random() > 0.8 ? 'high' : 'medium') as any,
        status: status as any,
        location: 'Common Facilities',
        room: facilityNode.name,
        remarks,
        root_cause: temp.root,
        corrective_action: temp.correct,
        verification: 'QAQC commissioner sign off.',
        closed_by: status === 'closed' ? 'u-admin' : undefined,
        closed_date: closedDate,
        inspection_date: createdDate.toISOString().split('T')[0],
        due_date: dueDate.toISOString().split('T')[0],
        inspector_id: 'u-inspector',
        contractor_id: 'u-contractor',
        assigned_to: 'u-eng',
        created_at: createdDate.toISOString(),
        updated_at: closedDate ? new Date(closedDate).toISOString() : createdDate.toISOString(),
        form_responses: {
          pass_fail: status === 'closed' ? 'pass' : 'fail',
          rating: status === 'closed' ? 5 : 2,
          req_met: status === 'closed' ? 'yes' : 'no'
        }
      });
      snagCounter++;
    });
  });

  localStorage.setItem('snaglist_items', JSON.stringify([...snagsList, ...itemsToAdd]));
  localStorage.setItem('snaglist_comments', JSON.stringify([...commentsList, ...commentsToAdd]));
  
  console.log(`Successfully seeded ${itemsToAdd.length} snags and ${commentsToAdd.length} remarks!`);
};

// Helper to seed localStorage
export const initializeMockDatabase = () => {
  if (typeof window === 'undefined') return;

  const isSeeded = localStorage.getItem('snaglist_seeded');
  const hasNodes = localStorage.getItem('snaglist_nodes');
  
  if (isSeeded && !hasNodes) {
    runLegacyDatabaseMigration();
  }

  // Trigger Izdihar Project seeding if not present yet
  const isIzdiharSeeded = localStorage.getItem('snaglist_seeded_izdihar_v3');
  if (isSeeded && !isIzdiharSeeded) {
    seedIzdiharProject();
    localStorage.setItem('snaglist_seeded_izdihar_v3', 'true');
  }

  if (isSeeded) return;

  console.log('Seeding LocalStorage multi-tenant sandbox database...');

  // 1. Companies
  localStorage.setItem('snaglist_companies', JSON.stringify(SEED_COMPANIES));

  // 2. Profiles
  localStorage.setItem('snaglist_profiles', JSON.stringify(SEED_PROFILES));

  // 3. Projects
  const projects: Project[] = [
    {
      id: 'proj-1',
      company_id: DEFAULT_ORG_ID,
      name: 'Luxury Villa Compound',
      description: 'Premium residential complex containing 30 luxury villas with high-end finishes.',
      owner: 'Al-Hokair Real Estate',
      contractor: 'Saudi Construction Co.',
      consultant: 'Khatib & Alami',
      engineer: 'Eng. Ahmed',
      completion_rate: 45.0,
      created_at: new Date().toISOString(),
      project_type: 'villa',
      level_structure: ['Block', 'Villa']
    },
    {
      id: 'proj-2',
      company_id: DEFAULT_ORG_ID,
      name: 'Riyadh Plaza Hotel',
      description: '5-Star boutique hotel tower consisting of 12 floors and 150 guest rooms.',
      owner: 'Riyadh Hospitality Co.',
      contractor: 'Saudi Construction Co.',
      consultant: 'Khatib & Alami',
      engineer: 'Eng. Khalid',
      completion_rate: 15.0,
      created_at: new Date().toISOString(),
      project_type: 'hotel',
      level_structure: ['Tower', 'Floor', 'Room']
    },
    {
      id: 'proj-3',
      company_id: COMPANY2_ID, // Isolated tenant
      name: 'Al-Mousa Office Tower',
      description: 'Corporate headquarters commercial high-rise in King Fahd Road.',
      owner: 'Al-Mousa Family Trust',
      contractor: 'Al-Mousa Construction Group',
      consultant: 'Dar Al-Handasah',
      engineer: 'Eng. Faisal',
      completion_rate: 0,
      created_at: new Date().toISOString(),
      project_type: 'custom',
      level_structure: ['Zone', 'Floor', 'Suite']
    }
  ];
  localStorage.setItem('snaglist_projects', JSON.stringify(projects));

  // 4. Seeding location nodes tree (project_nodes)
  const projectNodes: ProjectNode[] = [
    // Project 1 (Villa Project: Block A, B, C -> Villas 01-30)
    { id: 'block-a', project_id: 'proj-1', parent_id: null, company_id: DEFAULT_ORG_ID, name: 'Block A', node_type: 'Block', completion_rate: 50, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'block-b', project_id: 'proj-1', parent_id: null, company_id: DEFAULT_ORG_ID, name: 'Block B', node_type: 'Block', completion_rate: 40, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'block-c', project_id: 'proj-1', parent_id: null, company_id: DEFAULT_ORG_ID, name: 'Block C', node_type: 'Block', completion_rate: 45, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    
    // Project 2 (Hotel Project: Tower 1 -> Floor 1, Floor 2 -> Rooms)
    { id: 'hotel-t1', project_id: 'proj-2', parent_id: null, company_id: DEFAULT_ORG_ID, name: 'Tower A', node_type: 'Tower', completion_rate: 15, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'hotel-t1-f1', project_id: 'proj-2', parent_id: 'hotel-t1', company_id: DEFAULT_ORG_ID, name: 'Floor 1', node_type: 'Floor', completion_rate: 20, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'hotel-t1-f2', project_id: 'proj-2', parent_id: 'hotel-t1', company_id: DEFAULT_ORG_ID, name: 'Floor 2', node_type: 'Floor', completion_rate: 10, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'hotel-room-101', project_id: 'proj-2', parent_id: 'hotel-t1-f1', company_id: DEFAULT_ORG_ID, name: 'Room 101', node_type: 'Room', completion_rate: 30, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'hotel-room-102', project_id: 'proj-2', parent_id: 'hotel-t1-f1', company_id: DEFAULT_ORG_ID, name: 'Room 102', node_type: 'Room', completion_rate: 10, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'hotel-room-201', project_id: 'proj-2', parent_id: 'hotel-t1-f2', company_id: DEFAULT_ORG_ID, name: 'Room 201', node_type: 'Room', completion_rate: 10, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    
    // Project 3 (Isolated Tower: Zone 1 -> Floor 25 -> Suite A)
    { id: 'mousa-z1', project_id: 'proj-3', parent_id: null, company_id: COMPANY2_ID, name: 'Zone East', node_type: 'Zone', completion_rate: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'mousa-z1-f25', project_id: 'proj-3', parent_id: 'mousa-z1', company_id: COMPANY2_ID, name: 'Floor 25', node_type: 'Floor', completion_rate: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'mousa-suite-a', project_id: 'proj-3', parent_id: 'mousa-z1-f25', company_id: COMPANY2_ID, name: 'Suite 2501', node_type: 'Suite', completion_rate: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
  ];

  // Seed 30 villas nodes for Project 1 backward compatibility
  const villas: Villa[] = [];
  const blocksList = ['block-a', 'block-b', 'block-c'];
  const blockNames = ['Block A', 'Block B', 'Block C'];
  const owners = ['Fahad Al-Qahtani', 'Sarah Al-Sudairy', 'Mohammed Al-Dosari', 'Noura Al-Otaibi', 'Studio-101 Owner', 'Khalid Al-Ghamdi', 'Aisha Al-Harbi', 'Sulaiman Al-Malki', 'Yousef Al-Zahrani', 'Maha Al-Mutairi'];

  for (let i = 1; i <= 30; i++) {
    const blockIdx = Math.ceil(i / 10) - 1;
    const blockId = blocksList[blockIdx];
    const villaId = `villa-${i}`;
    const villaNum = `Villa ${i < 10 ? '0' + i : i}`;

    // Add to project nodes tree
    projectNodes.push({
      id: villaId,
      project_id: 'proj-1',
      parent_id: blockId,
      company_id: DEFAULT_ORG_ID,
      name: villaNum,
      node_type: 'Villa',
      completion_rate: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    // Add to backward compatible villas table
    villas.push({
      id: villaId,
      block_id: blockId,
      company_id: DEFAULT_ORG_ID,
      villa_number: villaNum,
      owner: owners[(i - 1) % owners.length],
      contractor: 'Saudi Construction Co.',
      consultant: 'Khatib & Alami',
      engineer: 'Eng. Khalid',
      completion_rate: 0,
      created_at: new Date().toISOString()
    });
  }

  // Save Nodes, Blocks & Villas
  localStorage.setItem('snaglist_nodes', JSON.stringify(projectNodes));
  localStorage.setItem('snaglist_villas', JSON.stringify(villas));

  const legacyBlocks: Block[] = [
    { id: 'block-a', project_id: 'proj-1', company_id: DEFAULT_ORG_ID, name: 'Block A', description: 'Villas 01 to 10 - Sea View Sector', created_at: new Date().toISOString() },
    { id: 'block-b', project_id: 'proj-1', company_id: DEFAULT_ORG_ID, name: 'Block B', description: 'Villas 11 to 20 - Park Sector', created_at: new Date().toISOString() },
    { id: 'block-c', project_id: 'proj-1', company_id: DEFAULT_ORG_ID, name: 'Block C', description: 'Villas 21 to 30 - Boulevard Sector', created_at: new Date().toISOString() }
  ];
  localStorage.setItem('snaglist_blocks', JSON.stringify(legacyBlocks));

  // 5. Categories & Templates
  const categories = SEED_CATEGORIES.map(c => ({ ...c, company_id: DEFAULT_ORG_ID }));
  const templates = SEED_TEMPLATES.map(t => ({ ...t, company_id: DEFAULT_ORG_ID }));
  
  // Add Company 2 categories
  categories.push({ id: 'cat-mep-co2', name: 'MEP Inspections', company_id: COMPANY2_ID, description: 'Mechanical Electrical Plumbing', created_at: new Date().toISOString() });
  templates.push({ id: 't-mep-co2', category_name: 'MEP Inspections', company_id: COMPANY2_ID, audit_item: 'Verify high pressure water pipes', is_active: true, created_at: new Date().toISOString() });

  localStorage.setItem('snaglist_categories', JSON.stringify(categories));
  localStorage.setItem('snaglist_templates', JSON.stringify(templates));

  // 6. Inspection Items (300 items total)
  const inspectionItems: InspectionItem[] = [];
  const statuses: ('open' | 'assigned' | 'in_progress' | 'rectified' | 'qa_verification' | 'closed')[] = 
    ['open', 'assigned', 'in_progress', 'rectified', 'qa_verification', 'closed'];
  const priorities: ('low' | 'medium' | 'high' | 'critical')[] = ['low', 'medium', 'high', 'critical'];
  const locations = ['Ground Floor', 'First Floor', 'Roof Terrace'];
  const rooms = ['Kitchen', 'Living Room', 'Master Bedroom', 'Toilet', 'Corridor'];

  let snagNumberCounter = 1;

  // Seeding snags for Villa Project (Project 1)
  villas.forEach((v) => {
    for (let c = 0; c < 10; c++) {
      const isStudio101Villa = v.villa_number === 'Villa 05';
      let title = '';
      let categoryId = categories[c % SEED_CATEGORIES.length].id;
      let status = statuses[Math.floor(Math.random() * statuses.length)];
      let priority = priorities[Math.floor(Math.random() * priorities.length)];
      let remarks = 'Checklist inspection item';

      const categoryObj = categories[c % SEED_CATEGORIES.length];
      if (categoryObj.id === 'cat-kitchen') {
        const itemsList = ['General Silicone residues', 'Drawer alignment needed', 'Scratches on laminate', 'Squeaky hinges', 'Missing pull handles'];
        title = itemsList[c % itemsList.length];
        if (isStudio101Villa && c === 0) {
          title = 'النظافة العامة';
          status = 'closed';
          priority = 'low';
        } else if (isStudio101Villa && c === 4) {
          title = 'قطع او اكسسوارات مفقودة او ناقصة';
          status = 'open';
          priority = 'high';
          remarks = 'Cabinet handles missing on drawers';
        }
      } else if (categoryObj.id === 'cat-wardrobe') {
        const itemsList = ['Wardrobe vertical check', 'LED sensor not working', 'Sliding doors alignment', 'Sagging bottom shelf'];
        title = itemsList[c % itemsList.length];
        if (isStudio101Villa && c === 1) {
          title = 'عدم الاغلاق الكامل للابواب السحاب';
          status = 'closed';
          priority = 'medium';
        }
      } else {
        title = 'General paint touchups required';
      }

      inspectionItems.push({
        id: `snag-${snagNumberCounter}`,
        snag_number: `SNAG-2026-${String(snagNumberCounter).padStart(4, '0')}`,
        villa_id: v.id, // Legacy compatibility
        location_node_id: v.id, // Mapped to the Villa node in project_nodes tree
        company_id: DEFAULT_ORG_ID,
        category_id: categoryId,
        location: locations[c % locations.length],
        room: rooms[c % rooms.length],
        title,
        description: `${title} inspection log.`,
        priority,
        status,
        assigned_to: status !== 'open' ? 'u-contractor' : undefined,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        completion_date: status === 'closed' ? new Date().toISOString().split('T')[0] : undefined,
        inspection_date: new Date().toISOString().split('T')[0],
        inspector_id: 'u-inspector',
        contractor_id: 'u-contractor',
        remarks,
        gps_lat: 24.7136 + (Math.random() - 0.5) * 0.01,
        gps_lng: 46.6753 + (Math.random() - 0.5) * 0.01,
        created_by: 'u-eng',
        updated_by: 'u-eng',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      snagNumberCounter++;
    }
  });

  // Seed some snags for Project 2 (Hotel Project - Room 101)
  inspectionItems.push({
    id: `snag-${snagNumberCounter}`,
    snag_number: `SNAG-2026-${String(snagNumberCounter).padStart(4, '0')}`,
    villa_id: 'hotel-room-101', // Mapped as legacy villa pointer
    location_node_id: 'hotel-room-101', // Room 101
    company_id: DEFAULT_ORG_ID,
    category_id: 'c0000000-0000-0000-0000-000000000010',
    location: 'Tower A - Floor 1',
    room: 'Room 101',
    title: 'AC unit condensation dripping',
    description: 'AC blower unit insulation leakage causing condensation on the drop ceiling panels.',
    priority: 'high',
    status: 'open',
    due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    inspection_date: new Date().toISOString().split('T')[0],
    inspector_id: 'u-inspector',
    remarks: 'Condensation leaking',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    form_responses: {
      check_failed: true,
      measured_temp: 18,
      pass_fail: 'fail'
    }
  });

  localStorage.setItem('snaglist_items', JSON.stringify(inspectionItems));

  // 7. Comments & Photos
  const comments: InspectionComment[] = [
    {
      id: 'comm-1',
      inspection_item_id: 'snag-4',
      company_id: DEFAULT_ORG_ID,
      comment: 'Hinges check updates logged.',
      user_id: 'u-contractor',
      created_at: new Date().toISOString()
    }
  ];
  localStorage.setItem('snaglist_comments', JSON.stringify(comments));

  const photos: InspectionPhoto[] = [
    {
      id: 'photo-1',
      inspection_item_id: 'snag-5',
      company_id: DEFAULT_ORG_ID,
      photo_url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80',
      photo_type: 'before',
      caption: 'Initial check',
      created_at: new Date().toISOString()
    }
  ];
  localStorage.setItem('snaglist_photos', JSON.stringify(photos));

  const history: InspectionHistory[] = [
    {
      id: 'hist-1',
      inspection_item_id: 'snag-5',
      company_id: DEFAULT_ORG_ID,
      user_id: 'u-eng',
      action: 'create',
      new_status: 'open',
      details: 'Snag created.',
      created_at: new Date().toISOString()
    }
  ];
  localStorage.setItem('snaglist_history', JSON.stringify(history));

  // Seed Project document directories (spec sheets & drawings folders)
  const folders: ProjectDocumentFolder[] = [
    { id: 'fld-1', project_id: 'proj-1', company_id: DEFAULT_ORG_ID, name: 'Architectural Drawings', parent_id: null, created_at: new Date().toISOString() },
    { id: 'fld-2', project_id: 'proj-1', company_id: DEFAULT_ORG_ID, name: 'Specifications Sheets', parent_id: null, created_at: new Date().toISOString() },
    { id: 'fld-3', project_id: 'proj-2', company_id: DEFAULT_ORG_ID, name: 'Structural Plans', parent_id: null, created_at: new Date().toISOString() }
  ];
  localStorage.setItem('snaglist_doc_folders', JSON.stringify(folders));

  const docs: ProjectDocument[] = [
    { id: 'doc-1', folder_id: 'fld-1', project_id: 'proj-1', company_id: DEFAULT_ORG_ID, name: 'Main Compound Layout.pdf', file_url: 'https://pdfobject.com/pdf/sample.pdf', file_size: 1542000, file_type: 'pdf', version: 1, uploaded_by: 'u-pm', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'doc-2', folder_id: 'fld-2', project_id: 'proj-1', company_id: DEFAULT_ORG_ID, name: 'Kitchen Wood Specs v2.xlsx', file_url: 'https://example.com/specs.xlsx', file_size: 450000, file_type: 'excel', version: 2, uploaded_by: 'u-pm', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
  ];
  localStorage.setItem('snaglist_docs', JSON.stringify(docs));

  // 10. Recompute completion rates
  recomputeRates(villas, inspectionItems, projects);

  localStorage.setItem('snaglist_seeded', 'true');
  
  // Seed Izdihar Project
  seedIzdiharProject();
  localStorage.setItem('snaglist_seeded_izdihar_v3', 'true');
};

const recomputeRates = (villas: Villa[], items: InspectionItem[], projects: Project[]) => {
  const nodes: ProjectNode[] = safeParseList('snaglist_nodes') || [];
  
  // 1. Calculate for leaf nodes (Room/Area or Facility)
  nodes.forEach(node => {
    const isLeaf = node.node_type === 'Room/Area' || node.node_type === 'Facility';
    if (isLeaf) {
      const nodeItems = items.filter(item => item.location_node_id === node.id);
      const closed = nodeItems.filter(item => item.status === 'closed').length;
      node.completion_rate = nodeItems.length > 0 ? Math.round((closed / nodeItems.length) * 100) : 0;
    }
  });

  // 2. Propagate upwards: calculate Unit nodes (parent is Villa, children are Room/Area)
  nodes.forEach(node => {
    if (node.node_type === 'Unit') {
      const children = nodes.filter(n => n.parent_id === node.id);
      const sum = children.reduce((acc, child) => acc + child.completion_rate, 0);
      node.completion_rate = children.length > 0 ? Math.round(sum / children.length) : 0;
    }
  });

  // 3. Propagate upwards: calculate Villa or Common Area nodes
  nodes.forEach(node => {
    if (node.node_type === 'Villa' || node.node_type === 'Common Area') {
      const children = nodes.filter(n => n.parent_id === node.id);
      const sum = children.reduce((acc, child) => acc + child.completion_rate, 0);
      node.completion_rate = children.length > 0 ? Math.round(sum / children.length) : 0;
    }
  });

  localStorage.setItem('snaglist_nodes', JSON.stringify(nodes));

  // 4. Calculate projects completion rates based on top-level nodes
  projects.forEach(p => {
    const topNodes = nodes.filter(n => n.project_id === p.id && n.parent_id === null);
    const sum = topNodes.reduce((acc, node) => acc + node.completion_rate, 0);
    p.completion_rate = topNodes.length > 0 ? Math.round(sum / topNodes.length) : 0;
  });

  // Maintain backward compatibility for legacy villas list
  villas.forEach((v) => {
    const villaItems = items.filter((item) => item.villa_id === v.id);
    const closed = villaItems.filter((item) => item.status === 'closed').length;
    v.completion_rate = villaItems.length > 0 ? Math.round((closed / villaItems.length) * 100) : 0;
  });
  localStorage.setItem('snaglist_villas', JSON.stringify(villas));
  localStorage.setItem('snaglist_projects', JSON.stringify(projects));
};

// ==========================================
// DB SERVICE METHODS (LocalStorage Fallback)
// ==========================================

export const dbService = {
  // Helper to retrieve the current user's profile context from local storage
  getCurrentUserContext: (): Profile | null => {
    if (typeof window === 'undefined') return null;
    const email = localStorage.getItem('snaglist_current_user_email');
    if (!email) return null;
    const profiles: Profile[] = safeParseList('snaglist_profiles');
    return profiles.find(p => p.email === email) || null;
  },

  // --- Companies ---
  getCompanies: (): Company[] => {
    if (typeof window === 'undefined') return SEED_COMPANIES;
    return safeParseList('snaglist_companies');
  },

  getCompanyById: (id: string): Company | undefined => {
    return dbService.getCompanies().find(c => c.id === id);
  },

  updateCompanySettings: (company: Company): Company => {
    const list = dbService.getCompanies();
    const idx = list.findIndex(c => c.id === company.id);
    if (idx !== -1) {
      list[idx] = { ...company, updated_at: new Date().toISOString() };
      localStorage.setItem('snaglist_companies', JSON.stringify(list));
    }
    return company;
  },

  addCompany: (comp: Omit<Company, 'id' | 'created_at' | 'updated_at'>): Company => {
    const list = dbService.getCompanies();
    const newComp: Company = {
      ...comp,
      id: `comp-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    list.push(newComp);
    localStorage.setItem('snaglist_companies', JSON.stringify(list));
    return newComp;
  },

  // --- Profiles ---
  getProfiles: (): Profile[] => {
    if (typeof window === 'undefined') return SEED_PROFILES;
    const list: Profile[] = safeParseList('snaglist_profiles');
    
    // Filter profiles by current company ID, unless Super Admin
    const userContext = dbService.getCurrentUserContext();
    if (userContext && userContext.role !== 'super_admin') {
      return list.filter(p => p.company_id === userContext.company_id);
    }
    return list;
  },

  // --- Projects ---
  getProjects: (): Project[] => {
    if (typeof window === 'undefined') return [];
    const list: Project[] = safeParseList('snaglist_projects');
    
    // Filter by user's company ID (tenant isolation)
    const userContext = dbService.getCurrentUserContext();
    if (userContext && userContext.role !== 'super_admin') {
      return list.filter(p => p.company_id === userContext.company_id);
    }
    return list;
  },

  addProject: (proj: Omit<Project, 'id' | 'completion_rate' | 'created_at'>): Project => {
    const projects = safeParseList('snaglist_projects');
    const newProj: Project = {
      ...proj,
      id: `proj-${Date.now()}`,
      completion_rate: 0,
      created_at: new Date().toISOString()
    };
    projects.push(newProj);
    localStorage.setItem('snaglist_projects', JSON.stringify(projects));

    // Seed location levels configuration in project_nodes tree
    const rootNode: ProjectNode = {
      id: `node-root-${Date.now()}`,
      project_id: newProj.id,
      parent_id: null,
      company_id: newProj.company_id,
      name: `Main ${newProj.level_structure[0] || 'Sector'}`,
      node_type: newProj.level_structure[0] || 'Block',
      completion_rate: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    const nodes = dbService.getProjectNodesByProjectId(newProj.id);
    nodes.push(rootNode);
    const allNodes = safeParseList('snaglist_nodes');
    allNodes.push(rootNode);
    localStorage.setItem('snaglist_nodes', JSON.stringify(allNodes));

    return newProj;
  },

  updateProject: (proj: Project): Project => {
    const projects = safeParseList<Project>('snaglist_projects');
    const index = projects.findIndex((p: Project) => p.id === proj.id);
    if (index !== -1) {
      projects[index] = { ...proj, updated_at: new Date().toISOString() };
      localStorage.setItem('snaglist_projects', JSON.stringify(projects));
    }
    return proj;
  },

  duplicateProject: (id: string, newName?: string, newCode?: string): Project | null => {
    const projects = safeParseList<Project>('snaglist_projects');
    const source = projects.find(p => p.id === id);
    if (!source) return null;

    const newId = `proj-${Date.now()}`;
    const clonedProj: Project = {
      ...source,
      id: newId,
      name: newName || `${source.name} (Copy)`,
      project_code: newCode || `${source.project_code || 'PROJ'}-COPY`,
      completion_rate: 0,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    projects.push(clonedProj);
    localStorage.setItem('snaglist_projects', JSON.stringify(projects));

    // Clone nodes tree
    const allNodes = safeParseList<ProjectNode>('snaglist_nodes');
    const sourceNodes = allNodes.filter(n => n.project_id === id);
    const nodeMapping: Record<string, string> = {};

    const clonedNodes = sourceNodes.map(node => {
      const clonedNodeId = `node-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      nodeMapping[node.id] = clonedNodeId;
      return {
        ...node,
        id: clonedNodeId,
        project_id: newId,
        completion_rate: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    });

    // Re-link parent_ids for nested nodes
    clonedNodes.forEach(node => {
      if (node.parent_id && nodeMapping[node.parent_id]) {
        node.parent_id = nodeMapping[node.parent_id];
      }
    });

    localStorage.setItem('snaglist_nodes', JSON.stringify([...allNodes, ...clonedNodes]));
    return clonedProj;
  },

  archiveProject: (id: string): Project | null => {
    const projects = safeParseList<Project>('snaglist_projects');
    const idx = projects.findIndex(p => p.id === id);
    if (idx !== -1) {
      projects[idx].status = 'archived';
      projects[idx].updated_at = new Date().toISOString();
      localStorage.setItem('snaglist_projects', JSON.stringify(projects));
      return projects[idx];
    }
    return null;
  },

  unarchiveProject: (id: string): Project | null => {
    const projects = safeParseList<Project>('snaglist_projects');
    const idx = projects.findIndex(p => p.id === id);
    if (idx !== -1) {
      projects[idx].status = 'active';
      projects[idx].updated_at = new Date().toISOString();
      localStorage.setItem('snaglist_projects', JSON.stringify(projects));
      return projects[idx];
    }
    return null;
  },

  deleteProjectSafely: (id: string, forceDelete: boolean = false): { success: boolean; archived: boolean; message: string } => {
    const projects = safeParseList<Project>('snaglist_projects');
    const items = safeParseList<InspectionItem>('snaglist_items');
    const nodes = safeParseList<ProjectNode>('snaglist_nodes');
    const projNodeIds = nodes.filter(n => n.project_id === id).map(n => n.id);

    const hasItems = items.some(i => i.villa_id === id || (i.location_node_id && projNodeIds.includes(i.location_node_id)));

    if (hasItems && !forceDelete) {
      // Archive instead of delete
      dbService.archiveProject(id);
      return {
        success: true,
        archived: true,
        message: 'Project contains inspection records. It has been safely archived.'
      };
    }

    // Permanent delete
    const filteredProjects = projects.filter(p => p.id !== id);
    localStorage.setItem('snaglist_projects', JSON.stringify(filteredProjects));

    // Remove nodes
    const filteredNodes = nodes.filter(n => n.project_id !== id);
    localStorage.setItem('snaglist_nodes', JSON.stringify(filteredNodes));

    return {
      success: true,
      archived: false,
      message: 'Project deleted permanently.'
    };
  },

  // --- Project Nodes (Generic Structure Tree) ---
  getProjectNodes: (): ProjectNode[] => {
    if (typeof window === 'undefined') return [];
    const list: ProjectNode[] = safeParseList('snaglist_nodes');
    
    // Filter by company_id
    const userContext = dbService.getCurrentUserContext();
    if (userContext && userContext.role !== 'super_admin') {
      return list.filter(n => n.company_id === userContext.company_id);
    }
    return list;
  },

  getProjectNodesByProjectId: (projectId: string): ProjectNode[] => {
    return dbService.getProjectNodes().filter(n => n.project_id === projectId);
  },

  addProjectNode: (node: Omit<ProjectNode, 'id' | 'completion_rate' | 'created_at' | 'updated_at'>): ProjectNode => {
    const list = safeParseList('snaglist_nodes');
    const newNode: ProjectNode = {
      ...node,
      id: `node-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      completion_rate: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    list.push(newNode);
    localStorage.setItem('snaglist_nodes', JSON.stringify(list));
    return newNode;
  },

  // --- Blocks (Backward compatibility wrapper mapping to project_nodes) ---
  getBlocks: (): Block[] => {
    if (typeof window === 'undefined') return [];
    const list: Block[] = safeParseList('snaglist_blocks');
    const userContext = dbService.getCurrentUserContext();
    if (userContext && userContext.role !== 'super_admin') {
      return list.filter(b => b.company_id === userContext.company_id);
    }
    return list;
  },

  addBlock: (block: Omit<Block, 'id' | 'company_id' | 'created_at'>): Block => {
    const userContext = dbService.getCurrentUserContext();
    const companyId = userContext?.company_id || DEFAULT_ORG_ID;

    // Create legacy block entry
    const blocks = dbService.getBlocks();
    const id = `block-${Date.now()}`;
    const newBlock: Block = {
      ...block,
      id,
      company_id: companyId,
      created_at: new Date().toISOString()
    };
    blocks.push(newBlock);
    localStorage.setItem('snaglist_blocks', JSON.stringify(blocks));

    // Mirror in project_nodes tree
    dbService.addProjectNode({
      project_id: block.project_id,
      parent_id: null,
      company_id: companyId,
      name: block.name,
      node_type: 'Block',
      description: block.description
    });

    return newBlock;
  },

  // --- Villas (Backward compatibility wrapper mapping to project_nodes) ---
  getVillas: (): Villa[] => {
    if (typeof window === 'undefined') return [];
    const list: Villa[] = safeParseList('snaglist_villas');
    const userContext = dbService.getCurrentUserContext();
    if (userContext && userContext.role !== 'super_admin') {
      return list.filter(v => v.company_id === userContext.company_id);
    }
    return list;
  },

  getVillaById: (id: string): Villa | undefined => {
    return dbService.getVillas().find(v => v.id === id);
  },

  addVilla: (villa: Omit<Villa, 'id' | 'company_id' | 'completion_rate' | 'created_at'>): Villa => {
    const userContext = dbService.getCurrentUserContext();
    const companyId = userContext?.company_id || DEFAULT_ORG_ID;

    const villas = dbService.getVillas();
    const id = `villa-${Date.now()}`;
    const newVilla: Villa = {
      ...villa,
      id,
      company_id: companyId,
      completion_rate: 0,
      created_at: new Date().toISOString()
    };
    villas.push(newVilla);
    localStorage.setItem('snaglist_villas', JSON.stringify(villas));

    // Mirror in project_nodes tree
    dbService.addProjectNode({
      project_id: 'proj-1', // maps to default villa compound
      parent_id: villa.block_id,
      company_id: companyId,
      name: villa.villa_number,
      node_type: 'Villa',
      description: `${villa.owner || ''} unit`
    });

    // Seed default checklist templates
    const templates = dbService.getTemplates();
    const categories = dbService.getCategories();
    let currentSnagCount = dbService.getInspectionItems().length;

    templates.forEach((t) => {
      currentSnagCount++;
      const cat = categories.find(c => c.name === t.category_name);
      dbService.addInspectionItem({
        villa_id: newVilla.id,
        location_node_id: newVilla.id, // generic map
        category_id: cat?.id,
        title: t.audit_item,
        description: `Check and verify ${t.audit_item}.`,
        priority: 'medium',
        status: 'open',
        location: 'Ground Floor',
        room: 'General',
        remarks: 'Generated from default inspection template',
        inspection_date: new Date().toISOString().split('T')[0]
      }, 'u-admin');
    });

    return newVilla;
  },

  // --- Categories ---
  getCategories: (): InspectionCategory[] => {
    if (typeof window === 'undefined') return [];
    const list: InspectionCategory[] = safeParseList('snaglist_categories');
    const userContext = dbService.getCurrentUserContext();
    if (userContext && userContext.role !== 'super_admin') {
      return list.filter(c => c.company_id === userContext.company_id);
    }
    return list;
  },

  addCategory: (name: string, description?: string): InspectionCategory => {
    const userContext = dbService.getCurrentUserContext();
    const companyId = userContext?.company_id || DEFAULT_ORG_ID;

    const categories = dbService.getCategories();
    const newCat: InspectionCategory = {
      id: `cat-${Date.now()}`,
      company_id: companyId,
      name,
      description,
      created_at: new Date().toISOString()
    };
    categories.push(newCat);
    localStorage.setItem('snaglist_categories', JSON.stringify(categories));
    return newCat;
  },

  // --- Templates ---
  getTemplates: (): InspectionTemplate[] => {
    if (typeof window === 'undefined') return [];
    const list: InspectionTemplate[] = safeParseList('snaglist_templates');
    const userContext = dbService.getCurrentUserContext();
    if (userContext && userContext.role !== 'super_admin') {
      return list.filter(t => t.company_id === userContext.company_id);
    }
    return list;
  },

  addTemplate: (category_name: string, audit_item: string, checkpoint_count?: number): InspectionTemplate => {
    const userContext = dbService.getCurrentUserContext();
    const companyId = userContext?.company_id || DEFAULT_ORG_ID;

    const templates = dbService.getTemplates();
    const newT: InspectionTemplate = {
      id: `t-${Date.now()}`,
      company_id: companyId,
      category_name,
      audit_item,
      is_active: true,
      checkpoint_count: checkpoint_count || 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    templates.push(newT);
    localStorage.setItem('snaglist_templates', JSON.stringify(templates));
    return newT;
  },

  updateTemplate: (tpl: InspectionTemplate): InspectionTemplate => {
    const templates = safeParseList<InspectionTemplate>('snaglist_templates');
    const idx = templates.findIndex(t => t.id === tpl.id);
    if (idx !== -1) {
      templates[idx] = { ...tpl, updated_at: new Date().toISOString() };
      localStorage.setItem('snaglist_templates', JSON.stringify(templates));
    }
    return tpl;
  },

  duplicateTemplate: (id: string): InspectionTemplate | null => {
    const templates = safeParseList<InspectionTemplate>('snaglist_templates');
    const source = templates.find(t => t.id === id);
    if (!source) return null;

    const cloned: InspectionTemplate = {
      ...source,
      id: `t-${Date.now()}`,
      audit_item: `${source.audit_item} (Copy)`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    templates.push(cloned);
    localStorage.setItem('snaglist_templates', JSON.stringify(templates));
    return cloned;
  },

  toggleTemplateStatus: (id: string): InspectionTemplate | null => {
    const templates = safeParseList<InspectionTemplate>('snaglist_templates');
    const idx = templates.findIndex(t => t.id === id);
    if (idx !== -1) {
      templates[idx].is_active = !templates[idx].is_active;
      templates[idx].updated_at = new Date().toISOString();
      localStorage.setItem('snaglist_templates', JSON.stringify(templates));
      return templates[idx];
    }
    return null;
  },

  assignTemplateToProject: (templateId: string, projectIds: string[]) => {
    const templates = safeParseList<InspectionTemplate>('snaglist_templates');
    const idx = templates.findIndex(t => t.id === templateId);
    if (idx !== -1) {
      templates[idx].assigned_project_ids = projectIds;
      templates[idx].updated_at = new Date().toISOString();
      localStorage.setItem('snaglist_templates', JSON.stringify(templates));
    }
  },

  deleteTemplate: (id: string) => {
    const templates = safeParseList<InspectionTemplate>('snaglist_templates');
    const filtered = templates.filter((t: any) => t.id !== id);
    localStorage.setItem('snaglist_templates', JSON.stringify(filtered));
  },

  // --- Inspection Items (Snags) ---
  getInspectionItems: (): InspectionItem[] => {
    if (typeof window === 'undefined') return [];
    const list: InspectionItem[] = safeParseList('snaglist_items');
    
    // Filter by company
    const userContext = dbService.getCurrentUserContext();
    if (userContext && userContext.role !== 'super_admin') {
      return list.filter(item => item.company_id === userContext.company_id);
    }
    return list;
  },

  getInspectionItemById: (id: string): InspectionItem | undefined => {
    return dbService.getInspectionItems().find(item => item.id === id);
  },

  addInspectionItem: (item: Omit<InspectionItem, 'id' | 'snag_number' | 'company_id' | 'created_at' | 'updated_at'>, userId: string): InspectionItem => {
    const userContext = dbService.getCurrentUserContext();
    const companyId = userContext?.company_id || DEFAULT_ORG_ID;

    const items = safeParseList('snaglist_items');
    const count = items.length + 1;
    const newItem: InspectionItem = {
      ...item,
      id: `snag-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      snag_number: `SNAG-2026-${String(count).padStart(4, '0')}`,
      company_id: companyId,
      created_by: userId,
      updated_by: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      form_responses: item.form_responses || {}
    };
    items.push(newItem);
    localStorage.setItem('snaglist_items', JSON.stringify(items));
    
    // Log history
    dbService.addHistoryEntry(newItem.id, userId, 'create', undefined, newItem.status, `Inspection item created with status: ${newItem.status}.`);

    // Trigger completion rates calculation
    dbService.triggerRatesUpdate();

    return newItem;
  },

  updateInspectionItem: (item: InspectionItem, userId: string): InspectionItem => {
    const items = safeParseList('snaglist_items');
    const index = items.findIndex((i: any) => i.id === item.id);
    if (index !== -1) {
      const oldItem = items[index];
      const updatedItem = {
        ...item,
        updated_by: userId,
        updated_at: new Date().toISOString()
      };
      
      // Auto-set completion date if closed
      if (updatedItem.status === 'closed' && oldItem.status !== 'closed') {
        updatedItem.completion_date = new Date().toISOString().split('T')[0];
      } else if (updatedItem.status !== 'closed') {
        updatedItem.completion_date = undefined;
      }

      items[index] = updatedItem;
      localStorage.setItem('snaglist_items', JSON.stringify(items));

      // Log status changes
      if (oldItem.status !== updatedItem.status) {
        dbService.addHistoryEntry(updatedItem.id, userId, 'status_change', oldItem.status, updatedItem.status, `Status changed from ${oldItem.status} to ${updatedItem.status}.`);
        
        // Notify assigned contractor
        if (updatedItem.assigned_to) {
          dbService.addNotification(
            updatedItem.assigned_to,
            'Snag Status Updated',
            `${updatedItem.snag_number} status updated to ${updatedItem.status}.`,
            `/villas/${updatedItem.villa_id}`
          );
        }
      }

      // Log assignments
      if (oldItem.assigned_to !== updatedItem.assigned_to) {
        dbService.addHistoryEntry(updatedItem.id, userId, 'assigned_change', undefined, undefined, `Assigned user updated.`);
        if (updatedItem.assigned_to) {
          dbService.addNotification(
            updatedItem.assigned_to,
            'New Snag Assigned',
            `You have been assigned ${updatedItem.snag_number}.`,
            `/villas/${updatedItem.villa_id}`
          );
        }
      }

      dbService.triggerRatesUpdate();
    }
    return item;
  },

  deleteInspectionItem: (id: string) => {
    const items = safeParseList('snaglist_items');
    const filtered = items.filter((item: any) => item.id !== id);
    localStorage.setItem('snaglist_items', JSON.stringify(filtered));
    dbService.triggerRatesUpdate();
  },

  // --- Comments ---
  getCommentsBySnagId: (snagId: string): InspectionComment[] => {
    if (typeof window === 'undefined') return [];
    const allComments: InspectionComment[] = safeParseList('snaglist_comments');
    const userContext = dbService.getCurrentUserContext();
    const companyId = userContext?.company_id || DEFAULT_ORG_ID;

    return allComments
      .filter(c => c.inspection_item_id === snagId && (userContext?.role === 'super_admin' || c.company_id === companyId))
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  },

  addComment: (snagId: string, commentText: string, userId: string): InspectionComment => {
    const userContext = dbService.getCurrentUserContext();
    const companyId = userContext?.company_id || DEFAULT_ORG_ID;

    const allComments = safeParseList('snaglist_comments');
    const newComment: InspectionComment = {
      id: `comm-${Date.now()}`,
      inspection_item_id: snagId,
      company_id: companyId,
      comment: commentText,
      user_id: userId,
      created_at: new Date().toISOString()
    };
    allComments.push(newComment);
    localStorage.setItem('snaglist_comments', JSON.stringify(allComments));
    
    // Log history
    dbService.addHistoryEntry(snagId, userId, 'comment_added', undefined, undefined, `Added comment: "${commentText.slice(0, 30)}..."`);
    
    return newComment;
  },

  // --- Photos ---
  getPhotosBySnagId: (snagId: string): InspectionPhoto[] => {
    if (typeof window === 'undefined') return [];
    const allPhotos: InspectionPhoto[] = safeParseList('snaglist_photos');
    const userContext = dbService.getCurrentUserContext();
    const companyId = userContext?.company_id || DEFAULT_ORG_ID;

    return allPhotos.filter(p => p.inspection_item_id === snagId && (userContext?.role === 'super_admin' || p.company_id === companyId));
  },

  addPhoto: (snagId: string, photoUrl: string, type: 'before' | 'after', caption: string, userId: string): InspectionPhoto => {
    const userContext = dbService.getCurrentUserContext();
    const companyId = userContext?.company_id || DEFAULT_ORG_ID;

    const allPhotos = safeParseList('snaglist_photos');
    const newPhoto: InspectionPhoto = {
      id: `photo-${Date.now()}`,
      inspection_item_id: snagId,
      company_id: companyId,
      photo_url: photoUrl,
      photo_type: type,
      caption,
      uploaded_by: userId,
      created_at: new Date().toISOString()
    };
    allPhotos.push(newPhoto);
    localStorage.setItem('snaglist_photos', JSON.stringify(allPhotos));
    
    dbService.addHistoryEntry(snagId, userId, 'photo_upload', undefined, undefined, `Uploaded ${type} photo.`);
    
    return newPhoto;
  },

  deletePhoto: (photoId: string) => {
    const allPhotos = safeParseList('snaglist_photos');
    const filtered = allPhotos.filter((p: any) => p.id !== photoId);
    localStorage.setItem('snaglist_photos', JSON.stringify(filtered));
  },

  // --- History ---
  getHistoryBySnagId: (snagId: string): InspectionHistory[] => {
    if (typeof window === 'undefined') return [];
    const allHistory: InspectionHistory[] = safeParseList('snaglist_history');
    const userContext = dbService.getCurrentUserContext();
    const companyId = userContext?.company_id || DEFAULT_ORG_ID;

    return allHistory
      .filter(h => h.inspection_item_id === snagId && (userContext?.role === 'super_admin' || h.company_id === companyId))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  addHistoryEntry: (snagId: string, userId: string, action: string, old_status?: string, new_status?: string, details?: string) => {
    const userContext = dbService.getCurrentUserContext();
    const companyId = userContext?.company_id || DEFAULT_ORG_ID;

    const allHistory = safeParseList('snaglist_history');
    const newEntry: InspectionHistory = {
      id: `hist-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      inspection_item_id: snagId,
      company_id: companyId,
      user_id: userId,
      action,
      old_status,
      new_status,
      details,
      created_at: new Date().toISOString()
    };
    allHistory.push(newEntry);
    localStorage.setItem('snaglist_history', JSON.stringify(allHistory));
  },

  // --- Notifications ---
  getNotifications: (userId: string): Notification[] => {
    if (typeof window === 'undefined') return [];
    const allNotifs: Notification[] = safeParseList('snaglist_notifications');
    const userContext = dbService.getCurrentUserContext();
    const companyId = userContext?.company_id || DEFAULT_ORG_ID;

    return allNotifs
      .filter(n => n.user_id === userId && (userContext?.role === 'super_admin' || n.company_id === companyId))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  addNotification: (userId: string, title: string, message: string, link?: string): Notification => {
    const userContext = dbService.getCurrentUserContext();
    const companyId = userContext?.company_id || DEFAULT_ORG_ID;

    const allNotifs = safeParseList('snaglist_notifications');
    const newNotif: Notification = {
      id: `notif-${Date.now()}`,
      user_id: userId,
      company_id: companyId,
      title,
      message,
      is_read: false,
      link,
      created_at: new Date().toISOString()
    };
    allNotifs.push(newNotif);
    localStorage.setItem('snaglist_notifications', JSON.stringify(allNotifs));
    return newNotif;
  },

  markNotificationAsRead: (id: string) => {
    const allNotifs = safeParseList('snaglist_notifications');
    const index = allNotifs.findIndex((n: any) => n.id === id);
    if (index !== -1) {
      allNotifs[index].is_read = true;
      localStorage.setItem('snaglist_notifications', JSON.stringify(allNotifs));
    }
  },

  // --- Export History ---
  getExportHistory: (): ExportHistory[] => {
    if (typeof window === 'undefined') return [];
    const list: ExportHistory[] = safeParseList('snaglist_exports');
    const userContext = dbService.getCurrentUserContext();
    if (userContext && userContext.role !== 'super_admin') {
      return list.filter(e => e.company_id === userContext.company_id);
    }
    return list;
  },

  addExportHistory: (name: string, type: 'excel' | 'pdf' | 'csv', userId: string, size: number, url: string): ExportHistory => {
    const userContext = dbService.getCurrentUserContext();
    const companyId = userContext?.company_id || DEFAULT_ORG_ID;

    const history = dbService.getExportHistory();
    const newExport: ExportHistory = {
      id: `export-${Date.now()}`,
      company_id: companyId,
      report_name: name,
      export_type: type,
      exported_by: userId,
      file_size: size,
      file_url: url,
      created_at: new Date().toISOString()
    };
    history.push(newExport);
    localStorage.setItem('snaglist_exports', JSON.stringify(history));
    return newExport;
  },

  // --- Project Document Folders & Files ---
  getDocumentFolders: (projectId: string): ProjectDocumentFolder[] => {
    if (typeof window === 'undefined') return [];
    const list: ProjectDocumentFolder[] = safeParseList('snaglist_doc_folders');
    const userContext = dbService.getCurrentUserContext();
    const companyId = userContext?.company_id || DEFAULT_ORG_ID;

    return list.filter(f => f.project_id === projectId && (userContext?.role === 'super_admin' || f.company_id === companyId));
  },

  addDocumentFolder: (folder: Omit<ProjectDocumentFolder, 'id' | 'company_id' | 'created_at'>): ProjectDocumentFolder => {
    const userContext = dbService.getCurrentUserContext();
    const companyId = userContext?.company_id || DEFAULT_ORG_ID;

    const list = safeParseList('snaglist_doc_folders');
    const newFolder: ProjectDocumentFolder = {
      ...folder,
      id: `fld-${Date.now()}`,
      company_id: companyId,
      created_at: new Date().toISOString()
    };
    list.push(newFolder);
    localStorage.setItem('snaglist_doc_folders', JSON.stringify(list));
    return newFolder;
  },

  getDocuments: (projectId: string): ProjectDocument[] => {
    if (typeof window === 'undefined') return [];
    const list: ProjectDocument[] = safeParseList('snaglist_docs');
    const userContext = dbService.getCurrentUserContext();
    const companyId = userContext?.company_id || DEFAULT_ORG_ID;

    return list.filter(d => d.project_id === projectId && (userContext?.role === 'super_admin' || d.company_id === companyId));
  },

  addDocument: (doc: Omit<ProjectDocument, 'id' | 'company_id' | 'version' | 'created_at' | 'updated_at'>): ProjectDocument => {
    const userContext = dbService.getCurrentUserContext();
    const companyId = userContext?.company_id || DEFAULT_ORG_ID;

    const list = safeParseList('snaglist_docs');
    const newDoc: ProjectDocument = {
      ...doc,
      id: `doc-${Date.now()}`,
      company_id: companyId,
      version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    list.push(newDoc);
    localStorage.setItem('snaglist_docs', JSON.stringify(list));
    return newDoc;
  },

  // --- System calculations ---
  triggerRatesUpdate: () => {
    const villas = dbService.getVillas();
    const items = dbService.getInspectionItems();
    const projects = safeParseList('snaglist_projects');
    if (projects.length > 0) {
      recomputeRates(villas, items, projects);
    }
  }
};
