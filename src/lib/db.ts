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
  completion_rate: number;
  created_at: string;
  
  // Custom structure extensions
  project_type: 'villa' | 'apartment' | 'hotel' | 'hospital' | 'mall' | 'warehouse' | 'factory' | 'road' | 'bridge' | 'airport' | 'retail' | 'restaurant' | 'custom';
  level_structure: string[]; // e.g. ["Block", "Villa"] or ["Tower", "Floor", "Suite"]
  project_code?: string;
  location?: string;
  contract_value?: string;
  start_date?: string;
  expected_completion?: string;
  project_logo?: string;
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
  created_at: string;
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
  { id: 'cat-civil', name: 'Civil Works', description: 'Concrete, structure, partition and masonry', created_at: new Date().toISOString() },
  { id: 'cat-elec', name: 'Electrical', description: 'Power sockets, DB Dressing, earth continuity', created_at: new Date().toISOString() },
  { id: 'cat-plumb', name: 'Plumbing', description: 'Water pressure, leakage, sanitary fixtures', created_at: new Date().toISOString() },
  { id: 'cat-hvac', name: 'HVAC', description: 'AC performance, grilles, unit and insulation', created_at: new Date().toISOString() }
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
  if (profilesStr) {
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
  if (projectsStr) {
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
  if (blocksStr) {
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
  if (villasStr) {
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
  if (categoriesStr) {
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
  if (templatesStr) {
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
  if (itemsStr) {
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

// Helper to seed localStorage
export const initializeMockDatabase = () => {
  if (typeof window === 'undefined') return;

  const isSeeded = localStorage.getItem('snaglist_seeded');
  const hasNodes = localStorage.getItem('snaglist_nodes');
  
  if (isSeeded && !hasNodes) {
    runLegacyDatabaseMigration();
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
    category_id: 'cat-hvac',
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
};

const recomputeRates = (villas: Villa[], items: InspectionItem[], projects: Project[]) => {
  villas.forEach((v) => {
    const villaItems = items.filter((item) => item.villa_id === v.id);
    const closed = villaItems.filter((item) => item.status === 'closed').length;
    v.completion_rate = villaItems.length > 0 ? Math.round((closed / villaItems.length) * 100) : 0;
  });
  localStorage.setItem('snaglist_villas', JSON.stringify(villas));

  projects.forEach(p => {
    const pVillas = villas.filter(v => v.company_id === p.company_id); // link average
    if (p.id === 'proj-1') {
      const totalVillasRate = pVillas.reduce((sum, v) => sum + v.completion_rate, 0);
      p.completion_rate = pVillas.length > 0 ? Math.round(totalVillasRate / pVillas.length) : 0;
    }
  });
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
    const profiles: Profile[] = JSON.parse(localStorage.getItem('snaglist_profiles') || '[]');
    return profiles.find(p => p.email === email) || null;
  },

  // --- Companies ---
  getCompanies: (): Company[] => {
    if (typeof window === 'undefined') return SEED_COMPANIES;
    return JSON.parse(localStorage.getItem('snaglist_companies') || '[]');
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
    const list: Profile[] = JSON.parse(localStorage.getItem('snaglist_profiles') || '[]');
    
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
    const list: Project[] = JSON.parse(localStorage.getItem('snaglist_projects') || '[]');
    
    // Filter by user's company ID (tenant isolation)
    const userContext = dbService.getCurrentUserContext();
    if (userContext && userContext.role !== 'super_admin') {
      return list.filter(p => p.company_id === userContext.company_id);
    }
    return list;
  },

  addProject: (proj: Omit<Project, 'id' | 'completion_rate' | 'created_at'>): Project => {
    const projects = JSON.parse(localStorage.getItem('snaglist_projects') || '[]');
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
    const allNodes = JSON.parse(localStorage.getItem('snaglist_nodes') || '[]');
    allNodes.push(rootNode);
    localStorage.setItem('snaglist_nodes', JSON.stringify(allNodes));

    return newProj;
  },

  updateProject: (proj: Project): Project => {
    const projects = JSON.parse(localStorage.getItem('snaglist_projects') || '[]');
    const index = projects.findIndex((p: Project) => p.id === proj.id);
    if (index !== -1) {
      projects[index] = { ...proj };
      localStorage.setItem('snaglist_projects', JSON.stringify(projects));
    }
    return proj;
  },

  // --- Project Nodes (Generic Structure Tree) ---
  getProjectNodes: (): ProjectNode[] => {
    if (typeof window === 'undefined') return [];
    const list: ProjectNode[] = JSON.parse(localStorage.getItem('snaglist_nodes') || '[]');
    
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
    const list = JSON.parse(localStorage.getItem('snaglist_nodes') || '[]');
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
    const list: Block[] = JSON.parse(localStorage.getItem('snaglist_blocks') || '[]');
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
    const list: Villa[] = JSON.parse(localStorage.getItem('snaglist_villas') || '[]');
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
    const list: InspectionCategory[] = JSON.parse(localStorage.getItem('snaglist_categories') || '[]');
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
    const list: InspectionTemplate[] = JSON.parse(localStorage.getItem('snaglist_templates') || '[]');
    const userContext = dbService.getCurrentUserContext();
    if (userContext && userContext.role !== 'super_admin') {
      return list.filter(t => t.company_id === userContext.company_id);
    }
    return list;
  },

  addTemplate: (category_name: string, audit_item: string): InspectionTemplate => {
    const userContext = dbService.getCurrentUserContext();
    const companyId = userContext?.company_id || DEFAULT_ORG_ID;

    const templates = dbService.getTemplates();
    const newT: InspectionTemplate = {
      id: `t-${Date.now()}`,
      company_id: companyId,
      category_name,
      audit_item,
      is_active: true,
      created_at: new Date().toISOString()
    };
    templates.push(newT);
    localStorage.setItem('snaglist_templates', JSON.stringify(templates));
    return newT;
  },

  deleteTemplate: (id: string) => {
    const templates = JSON.parse(localStorage.getItem('snaglist_templates') || '[]');
    const filtered = templates.filter((t: any) => t.id !== id);
    localStorage.setItem('snaglist_templates', JSON.stringify(filtered));
  },

  // --- Inspection Items (Snags) ---
  getInspectionItems: (): InspectionItem[] => {
    if (typeof window === 'undefined') return [];
    const list: InspectionItem[] = JSON.parse(localStorage.getItem('snaglist_items') || '[]');
    
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

    const items = JSON.parse(localStorage.getItem('snaglist_items') || '[]');
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
    const items = JSON.parse(localStorage.getItem('snaglist_items') || '[]');
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
    const items = JSON.parse(localStorage.getItem('snaglist_items') || '[]');
    const filtered = items.filter((item: any) => item.id !== id);
    localStorage.setItem('snaglist_items', JSON.stringify(filtered));
    dbService.triggerRatesUpdate();
  },

  // --- Comments ---
  getCommentsBySnagId: (snagId: string): InspectionComment[] => {
    if (typeof window === 'undefined') return [];
    const allComments: InspectionComment[] = JSON.parse(localStorage.getItem('snaglist_comments') || '[]');
    const userContext = dbService.getCurrentUserContext();
    const companyId = userContext?.company_id || DEFAULT_ORG_ID;

    return allComments
      .filter(c => c.inspection_item_id === snagId && (userContext?.role === 'super_admin' || c.company_id === companyId))
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  },

  addComment: (snagId: string, commentText: string, userId: string): InspectionComment => {
    const userContext = dbService.getCurrentUserContext();
    const companyId = userContext?.company_id || DEFAULT_ORG_ID;

    const allComments = JSON.parse(localStorage.getItem('snaglist_comments') || '[]');
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
    const allPhotos: InspectionPhoto[] = JSON.parse(localStorage.getItem('snaglist_photos') || '[]');
    const userContext = dbService.getCurrentUserContext();
    const companyId = userContext?.company_id || DEFAULT_ORG_ID;

    return allPhotos.filter(p => p.inspection_item_id === snagId && (userContext?.role === 'super_admin' || p.company_id === companyId));
  },

  addPhoto: (snagId: string, photoUrl: string, type: 'before' | 'after', caption: string, userId: string): InspectionPhoto => {
    const userContext = dbService.getCurrentUserContext();
    const companyId = userContext?.company_id || DEFAULT_ORG_ID;

    const allPhotos = JSON.parse(localStorage.getItem('snaglist_photos') || '[]');
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
    const allPhotos = JSON.parse(localStorage.getItem('snaglist_photos') || '[]');
    const filtered = allPhotos.filter((p: any) => p.id !== photoId);
    localStorage.setItem('snaglist_photos', JSON.stringify(filtered));
  },

  // --- History ---
  getHistoryBySnagId: (snagId: string): InspectionHistory[] => {
    if (typeof window === 'undefined') return [];
    const allHistory: InspectionHistory[] = JSON.parse(localStorage.getItem('snaglist_history') || '[]');
    const userContext = dbService.getCurrentUserContext();
    const companyId = userContext?.company_id || DEFAULT_ORG_ID;

    return allHistory
      .filter(h => h.inspection_item_id === snagId && (userContext?.role === 'super_admin' || h.company_id === companyId))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  addHistoryEntry: (snagId: string, userId: string, action: string, old_status?: string, new_status?: string, details?: string) => {
    const userContext = dbService.getCurrentUserContext();
    const companyId = userContext?.company_id || DEFAULT_ORG_ID;

    const allHistory = JSON.parse(localStorage.getItem('snaglist_history') || '[]');
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
    const allNotifs: Notification[] = JSON.parse(localStorage.getItem('snaglist_notifications') || '[]');
    const userContext = dbService.getCurrentUserContext();
    const companyId = userContext?.company_id || DEFAULT_ORG_ID;

    return allNotifs
      .filter(n => n.user_id === userId && (userContext?.role === 'super_admin' || n.company_id === companyId))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  addNotification: (userId: string, title: string, message: string, link?: string): Notification => {
    const userContext = dbService.getCurrentUserContext();
    const companyId = userContext?.company_id || DEFAULT_ORG_ID;

    const allNotifs = JSON.parse(localStorage.getItem('snaglist_notifications') || '[]');
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
    const allNotifs = JSON.parse(localStorage.getItem('snaglist_notifications') || '[]');
    const index = allNotifs.findIndex((n: any) => n.id === id);
    if (index !== -1) {
      allNotifs[index].is_read = true;
      localStorage.setItem('snaglist_notifications', JSON.stringify(allNotifs));
    }
  },

  // --- Export History ---
  getExportHistory: (): ExportHistory[] => {
    if (typeof window === 'undefined') return [];
    const list: ExportHistory[] = JSON.parse(localStorage.getItem('snaglist_exports') || '[]');
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
    const list: ProjectDocumentFolder[] = JSON.parse(localStorage.getItem('snaglist_doc_folders') || '[]');
    const userContext = dbService.getCurrentUserContext();
    const companyId = userContext?.company_id || DEFAULT_ORG_ID;

    return list.filter(f => f.project_id === projectId && (userContext?.role === 'super_admin' || f.company_id === companyId));
  },

  addDocumentFolder: (folder: Omit<ProjectDocumentFolder, 'id' | 'company_id' | 'created_at'>): ProjectDocumentFolder => {
    const userContext = dbService.getCurrentUserContext();
    const companyId = userContext?.company_id || DEFAULT_ORG_ID;

    const list = JSON.parse(localStorage.getItem('snaglist_doc_folders') || '[]');
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
    const list: ProjectDocument[] = JSON.parse(localStorage.getItem('snaglist_docs') || '[]');
    const userContext = dbService.getCurrentUserContext();
    const companyId = userContext?.company_id || DEFAULT_ORG_ID;

    return list.filter(d => d.project_id === projectId && (userContext?.role === 'super_admin' || d.company_id === companyId));
  },

  addDocument: (doc: Omit<ProjectDocument, 'id' | 'company_id' | 'version' | 'created_at' | 'updated_at'>): ProjectDocument => {
    const userContext = dbService.getCurrentUserContext();
    const companyId = userContext?.company_id || DEFAULT_ORG_ID;

    const list = JSON.parse(localStorage.getItem('snaglist_docs') || '[]');
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
    const projects = JSON.parse(localStorage.getItem('snaglist_projects') || '[]');
    if (projects.length > 0) {
      recomputeRates(villas, items, projects);
    }
  }
};
