// Database Gateway and State Management with LocalStorage Fallback
import { createClient } from '@supabase/supabase-js';

// Types representing the database schema
export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: 'super_admin' | 'project_manager' | 'site_engineer' | 'qaqc_inspector' | 'contractor' | 'read_only';
  phone?: string;
  created_at?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  owner?: string;
  contractor?: string;
  consultant?: string;
  engineer?: string;
  completion_rate: number;
  created_at: string;
}

export interface Block {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface Villa {
  id: string;
  block_id: string;
  villa_number: string;
  owner?: string;
  contractor?: string;
  consultant?: string;
  engineer?: string;
  completion_rate: number;
  created_at: string;
}

export interface InspectionCategory {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface InspectionTemplate {
  id: string;
  category_name: string;
  audit_item: string;
  is_active: boolean;
  created_at: string;
}

export interface InspectionItem {
  id: string;
  snag_number: string;
  villa_id: string;
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
}

export interface InspectionPhoto {
  id: string;
  inspection_item_id: string;
  photo_url: string;
  photo_type: 'before' | 'after';
  caption?: string;
  uploaded_by?: string;
  created_at: string;
}

export interface InspectionComment {
  id: string;
  inspection_item_id: string;
  comment: string;
  user_id: string;
  created_at: string;
}

export interface InspectionHistory {
  id: string;
  inspection_item_id: string;
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
  title: string;
  message: string;
  is_read: boolean;
  link?: string;
  created_at: string;
}

export interface ExportHistory {
  id: string;
  report_name: string;
  export_type: 'excel' | 'pdf' | 'csv';
  exported_by: string;
  file_size: number;
  file_url: string;
  created_at: string;
}

// Check if Supabase keys exist
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;

// Simulated Roles Database Profiles
export const SEED_PROFILES: Profile[] = [
  { id: 'u-admin', email: 'admin@villaqc.com', full_name: 'Super Admin User', role: 'super_admin', phone: '+966500000001' },
  { id: 'u-pm', email: 'pm@villaqc.com', full_name: 'Eng. Ahmed (Project Manager)', role: 'project_manager', phone: '+966500000002' },
  { id: 'u-eng', email: 'engineer@villaqc.com', full_name: 'Eng. Khalid (Site Engineer)', role: 'site_engineer', phone: '+966500000003' },
  { id: 'u-inspector', email: 'inspector@villaqc.com', full_name: 'Eng. Yousef (QA/QC)', role: 'qaqc_inspector', phone: '+966500000004' },
  { id: 'u-contractor', email: 'contractor@villaqc.com', full_name: 'Saudi Construction Co. (Contractor)', role: 'contractor', phone: '+966500000005' },
  { id: 'u-viewer', email: 'viewer@villaqc.com', full_name: 'Client Representative (Read-Only)', role: 'read_only', phone: '+966500000006' }
];

// Seed checklist items from the Excel template
const SEED_CATEGORIES: InspectionCategory[] = [
  { id: 'cat-kitchen', name: 'المطبخ', description: 'Kitchen Snags and Inspections', created_at: new Date().toISOString() },
  { id: 'cat-wardrobe', name: 'خزانة الملابس', description: 'Wardrobes and Carpentry', created_at: new Date().toISOString() },
  { id: 'cat-civil', name: 'Civil Works', description: 'Concrete, structure, partition and masonry', created_at: new Date().toISOString() },
  { id: 'cat-elec', name: 'Electrical', description: 'Power sockets, DB Dressing, earth continuity', created_at: new Date().toISOString() },
  { id: 'cat-plumb', name: 'Plumbing', description: 'Water pressure, leakage, sanitary fixtures', created_at: new Date().toISOString() },
  { id: 'cat-hvac', name: 'HVAC', description: 'AC performance, grilles, unit and insulation', created_at: new Date().toISOString() },
  { id: 'cat-finishing', name: 'Finishing & Painting', description: 'Paint smoothness, trims, skirting and touchups', created_at: new Date().toISOString() },
  { id: 'cat-flooring', name: 'Flooring & Tiling', description: 'Hollow tiles, marble polish, slope in bathroom', created_at: new Date().toISOString() }
];

const SEED_TEMPLATES: InspectionTemplate[] = [
  { id: 't1', category_name: 'المطبخ', audit_item: 'النظافة العامة وإزالة بقايا السيلكون والغراء', is_active: true, created_at: new Date().toISOString() },
  { id: 't2', category_name: 'المطبخ', audit_item: 'الخدوش والرتووش والتلقيطات في الأبواب والضلف', is_active: true, created_at: new Date().toISOString() },
  { id: 't3', category_name: 'المطبخ', audit_item: 'وزنيات الادراج والضلف واستقامتها وإغلاقها التام', is_active: true, created_at: new Date().toISOString() },
  { id: 't4', category_name: 'المطبخ', audit_item: 'سلامة المفصلات والمجرى الهيدروليكي وجودة الحركة', is_active: true, created_at: new Date().toISOString() },
  { id: 't5', category_name: 'المطبخ', audit_item: 'قطع او اكسسوارات مفقودة او ناقصة كالمقابض والرفوف', is_active: true, created_at: new Date().toISOString() },
  { id: 't6', category_name: 'المطبخ', audit_item: 'انحناء او ترخيم في الالواح والأسطح الخشبية أو الرخام', is_active: true, created_at: new Date().toISOString() },
  { id: 't7', category_name: 'خزانة الملابس', audit_item: 'تثبيت الهيكل وقوائم الخزانة الرأسية مع الجدار والأرضية بشكل محكم ومتزن وعمل السدادات.', is_active: true, created_at: new Date().toISOString() },
  { id: 't8', category_name: 'خزانة الملابس', audit_item: 'وزنيات واستقامة الأبواب وإغلاقها التام دون وجود فراغات متفاوتة.', is_active: true, created_at: new Date().toISOString() },
  { id: 't9', category_name: 'خزانة الملابس', audit_item: 'وزنيات واستقامة الأدراج وإغلاقها التام دون وجود فراغات متفاوتة.', is_active: true, created_at: new Date().toISOString() },
  { id: 't10', category_name: 'خزانة الملابس', audit_item: 'الخدوش والرتووش والتلقيطات والنهايات والتقفيلات مع الجدار.', is_active: true, created_at: new Date().toISOString() },
  { id: 't11', category_name: 'خزانة الملابس', audit_item: 'الإكسسوارات الداخلية: تثبيت أعمدة التعليق، الأرفف بشكل سليم.', is_active: true, created_at: new Date().toISOString() },
  { id: 't12', category_name: 'خزانة الملابس', audit_item: 'نظام الإضاءة الداخلية: عمل الحساسات الذكية (Sensors) فور فتح الأبواب وتشغيل الإنارة بكفاءة.', is_active: true, created_at: new Date().toISOString() },
  { id: 't13', category_name: 'خزانة الملابس', audit_item: 'عدم الاغلاق الكامل للابواب السحاب وترخي الصدادات.', is_active: true, created_at: new Date().toISOString() },
  { id: 't14', category_name: 'خزانة الملابس', audit_item: 'ترخيم وترييح في اسفل الخزانة والفواصل الخشبية.', is_active: true, created_at: new Date().toISOString() },
  { id: 't15', category_name: 'Electrical', audit_item: 'Inspection of DB dressing, labeling and earth continuity', is_active: true, created_at: new Date().toISOString() },
  { id: 't16', category_name: 'Electrical', audit_item: 'Verify functions of all switches, sockets and ELRBs', is_active: true, created_at: new Date().toISOString() },
  { id: 't17', category_name: 'Plumbing', audit_item: 'Check for leakages in under-sink connections and vanity taps', is_active: true, created_at: new Date().toISOString() },
  { id: 't18', category_name: 'Plumbing', audit_item: 'Inspect water pressure and drainage flow rate in showers/toilets', is_active: true, created_at: new Date().toISOString() },
  { id: 't19', category_name: 'HVAC', audit_item: 'Verify AC cooling performance and noise levels in rooms', is_active: true, created_at: new Date().toISOString() },
  { id: 't20', category_name: 'HVAC', audit_item: 'Ensure flexible duct connection and insulation are complete without condensation', is_active: true, created_at: new Date().toISOString() }
];

// Helper to seed localStorage
export const initializeMockDatabase = () => {
  if (typeof window === 'undefined') return;

  const isSeeded = localStorage.getItem('snaglist_seeded');
  if (isSeeded) return;

  console.log('Seeding LocalStorage mock database...');

  // 1. Projects
  const project: Project = {
    id: 'proj-1',
    name: 'Luxury Villa Compound',
    description: 'Premium residential complex containing 30 luxury villas with high-end finishes.',
    owner: 'Al-Hokair Real Estate',
    contractor: 'Saudi Construction Co.',
    consultant: 'Khatib & Alami',
    engineer: 'Eng. Ahmed',
    completion_rate: 45.0,
    created_at: new Date().toISOString()
  };
  localStorage.setItem('snaglist_projects', JSON.stringify([project]));

  // 2. Blocks
  const blocks: Block[] = [
    { id: 'block-a', project_id: 'proj-1', name: 'Block A', description: 'Villas 01 to 10 - Sea View Sector', created_at: new Date().toISOString() },
    { id: 'block-b', project_id: 'proj-1', name: 'Block B', description: 'Villas 11 to 20 - Park Sector', created_at: new Date().toISOString() },
    { id: 'block-c', project_id: 'proj-1', name: 'Block C', description: 'Villas 21 to 30 - Boulevard Sector', created_at: new Date().toISOString() }
  ];
  localStorage.setItem('snaglist_blocks', JSON.stringify(blocks));

  // 3. Villas (30 villas)
  const villas: Villa[] = [];
  const owners = ['Fahad Al-Qahtani', 'Sarah Al-Sudairy', 'Mohammed Al-Dosari', 'Noura Al-Otaibi', 'Studio-101 Owner', 'Khalid Al-Ghamdi', 'Aisha Al-Harbi', 'Sulaiman Al-Malki', 'Yousef Al-Zahrani', 'Maha Al-Mutairi'];
  
  for (let i = 1; i <= 30; i++) {
    const blockIndex = Math.ceil(i / 10) - 1;
    const blockId = blocks[blockIndex].id;
    const villaNum = `Villa ${i < 10 ? '0' + i : i}`;
    
    villas.push({
      id: `villa-${i}`,
      block_id: blockId,
      villa_number: villaNum,
      owner: owners[(i - 1) % owners.length],
      contractor: 'Saudi Construction Co.',
      consultant: 'Khatib & Alami',
      engineer: 'Eng. Khalid',
      completion_rate: 0, // Computed dynamically based on seeded items
      created_at: new Date().toISOString()
    });
  }
  localStorage.setItem('snaglist_villas', JSON.stringify(villas));

  // 4. Categories & Templates
  localStorage.setItem('snaglist_categories', JSON.stringify(SEED_CATEGORIES));
  localStorage.setItem('snaglist_templates', JSON.stringify(SEED_TEMPLATES));

  // 5. Profiles
  localStorage.setItem('snaglist_profiles', JSON.stringify(SEED_PROFILES));

  // 6. Inspection Items (Snag items: 10 per villa, total 300 items)
  const inspectionItems: InspectionItem[] = [];
  const statuses: ('open' | 'assigned' | 'in_progress' | 'rectified' | 'qa_verification' | 'closed')[] = 
    ['open', 'assigned', 'in_progress', 'rectified', 'qa_verification', 'closed'];
  const priorities: ('low' | 'medium' | 'high' | 'critical')[] = ['low', 'medium', 'high', 'critical'];
  const locations = ['Ground Floor', 'First Floor', 'Roof Terrace'];
  const rooms = ['Kitchen', 'Living Room', 'Master Bedroom', 'Toilet', 'Corridor'];

  let snagNumberCounter = 1;

  villas.forEach((v) => {
    // Generate 10 snags for this villa
    for (let c = 0; c < 10; c++) {
      const isStudio101Villa = v.villa_number === 'Villa 05';
      let title = '';
      let categoryId = SEED_CATEGORIES[c % SEED_CATEGORIES.length].id;
      let status: 'open' | 'assigned' | 'in_progress' | 'rectified' | 'qa_verification' | 'closed' = statuses[Math.floor(Math.random() * statuses.length)];
      let priority = priorities[Math.floor(Math.random() * priorities.length)];
      let remarks = 'Checklist inspection item';

      // Pick specific titles based on template index
      const categoryObj = SEED_CATEGORIES[c % SEED_CATEGORIES.length];
      if (categoryObj.id === 'cat-kitchen') {
        const items = ['General Silicon residues', 'Drawer alignment needed', 'Scratches on laminate', 'Squeaky hinges', 'Missing pull handles'];
        title = items[c % items.length];
        // If it's Villa 05 (the studio inspection checklist villa), map closely to the Excel
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
        const items = ['Wardrobe vertical check', 'LED sensor not working', 'Sliding doors alignment', 'Sagging bottom shelf'];
        title = items[c % items.length];
        if (isStudio101Villa && c === 1) {
          title = 'عدم الاغلاق الكامل للابواب السحاب';
          status = 'closed';
          priority = 'medium';
        }
      } else if (categoryObj.id === 'cat-elec') {
        title = 'Socket cover plate missing screws';
      } else if (categoryObj.id === 'cat-plumb') {
        title = 'Slow sink drainage in main bathroom';
      } else if (categoryObj.id === 'cat-hvac') {
        title = 'AC grill rattling noise in guest bedroom';
      } else {
        title = 'Wall paint touchups required';
      }

      const item: InspectionItem = {
        id: `snag-${snagNumberCounter}`,
        snag_number: `SNAG-2026-${String(snagNumberCounter).padStart(4, '0')}`,
        villa_id: v.id,
        category_id: categoryId,
        location: locations[c % locations.length],
        room: rooms[c % rooms.length],
        title: title,
        description: `${title} needs attention. Inspected as per standards.`,
        priority: priority,
        status: status,
        assigned_to: status !== 'open' ? 'u-contractor' : undefined,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        completion_date: status === 'closed' ? new Date().toISOString().split('T')[0] : undefined,
        inspection_date: new Date().toISOString().split('T')[0],
        inspector_id: 'u-inspector',
        contractor_id: 'u-contractor',
        remarks: remarks,
        gps_lat: 24.7136 + (Math.random() - 0.5) * 0.01,
        gps_lng: 46.6753 + (Math.random() - 0.5) * 0.01,
        created_by: 'u-eng',
        updated_by: 'u-eng',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      inspectionItems.push(item);
      snagNumberCounter++;
    }
  });

  localStorage.setItem('snaglist_items', JSON.stringify(inspectionItems));

  // 7. Comments
  const comments: InspectionComment[] = [
    {
      id: 'comm-1',
      inspection_item_id: 'snag-4', // hinge check in Villa 5
      comment: 'Spoke to the carpenter. Replacement hinges will be installed on Monday.',
      user_id: 'u-contractor',
      created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'comm-2',
      inspection_item_id: 'snag-4',
      comment: 'Please ensure it is the soft-close model matching project spec sheet page 12.',
      user_id: 'u-eng',
      created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
    }
  ];
  localStorage.setItem('snaglist_comments', JSON.stringify(comments));

  // 8. Photos
  const photos: InspectionPhoto[] = [
    {
      id: 'photo-1',
      inspection_item_id: 'snag-5', // missing handle in Villa 5
      photo_url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80',
      photo_type: 'before',
      caption: 'Missing cabinet handle on drawers',
      uploaded_by: 'u-eng',
      created_at: new Date().toISOString()
    }
  ];
  localStorage.setItem('snaglist_photos', JSON.stringify(photos));

  // 9. History / Logs
  const history: InspectionHistory[] = [
    {
      id: 'hist-1',
      inspection_item_id: 'snag-5',
      user_id: 'u-eng',
      action: 'create',
      new_status: 'open',
      details: 'Created inspection item SNAG-2026-0005.',
      created_at: new Date().toISOString()
    }
  ];
  localStorage.setItem('snaglist_history', JSON.stringify(history));

  // 10. Notifications
  const notifications: Notification[] = [
    {
      id: 'notif-1',
      user_id: 'u-contractor',
      title: 'New Snag Assigned',
      message: 'You have been assigned SNAG-2026-0004 for Villa 05 in Block A',
      is_read: false,
      link: '/villas/villa-5',
      created_at: new Date().toISOString()
    }
  ];
  localStorage.setItem('snaglist_notifications', JSON.stringify(notifications));

  // 11. Export History
  const exports: ExportHistory[] = [];
  localStorage.setItem('snaglist_exports', JSON.stringify(exports));

  // Re-compute Completion Rates
  recomputeAllCompletionRates(villas, inspectionItems, project);

  localStorage.setItem('snaglist_seeded', 'true');
};

const recomputeAllCompletionRates = (villas: Villa[], items: InspectionItem[], project: Project) => {
  villas.forEach((v) => {
    const villaItems = items.filter((item) => item.villa_id === v.id);
    const closed = villaItems.filter((item) => item.status === 'closed').length;
    v.completion_rate = villaItems.length > 0 ? Math.round((closed / villaItems.length) * 100) : 0;
  });
  localStorage.setItem('snaglist_villas', JSON.stringify(villas));

  const totalVillasRate = villas.reduce((sum, v) => sum + v.completion_rate, 0);
  project.completion_rate = villas.length > 0 ? Math.round(totalVillasRate / villas.length) : 0;
  localStorage.setItem('snaglist_projects', JSON.stringify([project]));
};

// ==========================================
// DB SERVICE METHODS (LocalStorage Fallback)
// ==========================================

export const dbService = {
  // --- Profiles ---
  getProfiles: (): Profile[] => {
    if (typeof window === 'undefined') return SEED_PROFILES;
    return JSON.parse(localStorage.getItem('snaglist_profiles') || '[]');
  },

  // --- Projects ---
  getProjects: (): Project[] => {
    if (typeof window === 'undefined') return [];
    return JSON.parse(localStorage.getItem('snaglist_projects') || '[]');
  },

  updateProject: (proj: Project): Project => {
    const projects = dbService.getProjects();
    const index = projects.findIndex(p => p.id === proj.id);
    if (index !== -1) {
      projects[index] = { ...proj };
      localStorage.setItem('snaglist_projects', JSON.stringify(projects));
    }
    return proj;
  },

  // --- Blocks ---
  getBlocks: (): Block[] => {
    if (typeof window === 'undefined') return [];
    return JSON.parse(localStorage.getItem('snaglist_blocks') || '[]');
  },

  addBlock: (block: Omit<Block, 'id' | 'created_at'>): Block => {
    const blocks = dbService.getBlocks();
    const newBlock: Block = {
      ...block,
      id: `block-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    blocks.push(newBlock);
    localStorage.setItem('snaglist_blocks', JSON.stringify(blocks));
    return newBlock;
  },

  // --- Villas ---
  getVillas: (): Villa[] => {
    if (typeof window === 'undefined') return [];
    return JSON.parse(localStorage.getItem('snaglist_villas') || '[]');
  },

  getVillaById: (id: string): Villa | undefined => {
    return dbService.getVillas().find(v => v.id === id);
  },

  addVilla: (villa: Omit<Villa, 'id' | 'completion_rate' | 'created_at'>): Villa => {
    const villas = dbService.getVillas();
    const newVilla: Villa = {
      ...villa,
      id: `villa-${Date.now()}`,
      completion_rate: 0,
      created_at: new Date().toISOString()
    };
    villas.push(newVilla);
    localStorage.setItem('snaglist_villas', JSON.stringify(villas));
    
    // Create default items from active templates for the new villa
    const templates = dbService.getTemplates();
    const categories = dbService.getCategories();
    let currentSnagCount = dbService.getInspectionItems().length;
    
    templates.forEach((t) => {
      currentSnagCount++;
      const cat = categories.find(c => c.name === t.category_name);
      dbService.addInspectionItem({
        villa_id: newVilla.id,
        category_id: cat?.id,
        title: t.audit_item,
        description: `Check and verify ${t.audit_item} in accordance with project requirements.`,
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
    if (typeof window === 'undefined') return SEED_CATEGORIES;
    return JSON.parse(localStorage.getItem('snaglist_categories') || '[]');
  },

  addCategory: (name: string, description?: string): InspectionCategory => {
    const categories = dbService.getCategories();
    const newCat: InspectionCategory = {
      id: `cat-${Date.now()}`,
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
    if (typeof window === 'undefined') return SEED_TEMPLATES;
    return JSON.parse(localStorage.getItem('snaglist_templates') || '[]');
  },

  addTemplate: (category_name: string, audit_item: string): InspectionTemplate => {
    const templates = dbService.getTemplates();
    const newT: InspectionTemplate = {
      id: `t-${Date.now()}`,
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
    const templates = dbService.getTemplates();
    const filtered = templates.filter(t => t.id !== id);
    localStorage.setItem('snaglist_templates', JSON.stringify(filtered));
  },

  // --- Inspection Items ---
  getInspectionItems: (): InspectionItem[] => {
    if (typeof window === 'undefined') return [];
    return JSON.parse(localStorage.getItem('snaglist_items') || '[]');
  },

  getInspectionItemById: (id: string): InspectionItem | undefined => {
    return dbService.getInspectionItems().find(item => item.id === id);
  },

  addInspectionItem: (item: Omit<InspectionItem, 'id' | 'snag_number' | 'created_at' | 'updated_at'>, userId: string): InspectionItem => {
    const items = dbService.getInspectionItems();
    const count = items.length + 1;
    const newItem: InspectionItem = {
      ...item,
      id: `snag-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      snag_number: `SNAG-2026-${String(count).padStart(4, '0')}`,
      created_by: userId,
      updated_by: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    items.push(newItem);
    localStorage.setItem('snaglist_items', JSON.stringify(items));
    
    // Log history
    dbService.addHistoryEntry(newItem.id, userId, 'create', undefined, newItem.status, `Inspection item created with status: ${newItem.status}.`);

    // Trigger completion rate re-computation
    dbService.triggerRatesUpdate();

    return newItem;
  },

  updateInspectionItem: (item: InspectionItem, userId: string): InspectionItem => {
    const items = dbService.getInspectionItems();
    const index = items.findIndex(i => i.id === item.id);
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
        
        // Notify assigned contractor on status updates
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
            `You have been assigned ${updatedItem.snag_number} in Villa ${dbService.getVillaById(updatedItem.villa_id)?.villa_number || ''}`,
            `/villas/${updatedItem.villa_id}`
          );
        }
      }

      dbService.triggerRatesUpdate();
    }
    return item;
  },

  deleteInspectionItem: (id: string) => {
    const items = dbService.getInspectionItems();
    const filtered = items.filter(item => item.id !== id);
    localStorage.setItem('snaglist_items', JSON.stringify(filtered));
    dbService.triggerRatesUpdate();
  },

  // --- Comments ---
  getCommentsBySnagId: (snagId: string): InspectionComment[] => {
    if (typeof window === 'undefined') return [];
    const allComments: InspectionComment[] = JSON.parse(localStorage.getItem('snaglist_comments') || '[]');
    return allComments.filter(c => c.inspection_item_id === snagId).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  },

  addComment: (snagId: string, commentText: string, userId: string): InspectionComment => {
    const allComments = JSON.parse(localStorage.getItem('snaglist_comments') || '[]');
    const newComment: InspectionComment = {
      id: `comm-${Date.now()}`,
      inspection_item_id: snagId,
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
    return allPhotos.filter(p => p.inspection_item_id === snagId);
  },

  addPhoto: (snagId: string, photoUrl: string, type: 'before' | 'after', caption: string, userId: string): InspectionPhoto => {
    const allPhotos = JSON.parse(localStorage.getItem('snaglist_photos') || '[]');
    const newPhoto: InspectionPhoto = {
      id: `photo-${Date.now()}`,
      inspection_item_id: snagId,
      photo_url: photoUrl,
      photo_type: type,
      caption,
      uploaded_by: userId,
      created_at: new Date().toISOString()
    };
    allPhotos.push(newPhoto);
    localStorage.setItem('snaglist_photos', JSON.stringify(allPhotos));
    
    // Log history
    dbService.addHistoryEntry(snagId, userId, 'photo_upload', undefined, undefined, `Uploaded ${type} photo.`);
    
    return newPhoto;
  },

  deletePhoto: (photoId: string) => {
    const allPhotos: InspectionPhoto[] = JSON.parse(localStorage.getItem('snaglist_photos') || '[]');
    const filtered = allPhotos.filter(p => p.id !== photoId);
    localStorage.setItem('snaglist_photos', JSON.stringify(filtered));
  },

  // --- History ---
  getHistoryBySnagId: (snagId: string): InspectionHistory[] => {
    if (typeof window === 'undefined') return [];
    const allHistory: InspectionHistory[] = JSON.parse(localStorage.getItem('snaglist_history') || '[]');
    return allHistory.filter(h => h.inspection_item_id === snagId).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); // Latest first
  },

  addHistoryEntry: (snagId: string, userId: string, action: string, old_status?: string, new_status?: string, details?: string) => {
    const allHistory = JSON.parse(localStorage.getItem('snaglist_history') || '[]');
    const newEntry: InspectionHistory = {
      id: `hist-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      inspection_item_id: snagId,
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
    return allNotifs.filter(n => n.user_id === userId).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  addNotification: (userId: string, title: string, message: string, link?: string): Notification => {
    const allNotifs = JSON.parse(localStorage.getItem('snaglist_notifications') || '[]');
    const newNotif: Notification = {
      id: `notif-${Date.now()}`,
      user_id: userId,
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
    const allNotifs: Notification[] = JSON.parse(localStorage.getItem('snaglist_notifications') || '[]');
    const index = allNotifs.findIndex(n => n.id === id);
    if (index !== -1) {
      allNotifs[index].is_read = true;
      localStorage.setItem('snaglist_notifications', JSON.stringify(allNotifs));
    }
  },

  // --- Export History ---
  getExportHistory: (): ExportHistory[] => {
    if (typeof window === 'undefined') return [];
    return JSON.parse(localStorage.getItem('snaglist_exports') || '[]');
  },

  addExportHistory: (name: string, type: 'excel' | 'pdf' | 'csv', userId: string, size: number, url: string): ExportHistory => {
    const history = dbService.getExportHistory();
    const newExport: ExportHistory = {
      id: `export-${Date.now()}`,
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

  // --- System calculations ---
  triggerRatesUpdate: () => {
    const villas = dbService.getVillas();
    const items = dbService.getInspectionItems();
    const projects = dbService.getProjects();
    if (projects.length > 0) {
      recomputeAllCompletionRates(villas, items, projects[0]);
    }
  }
};
