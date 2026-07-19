-- Seed Data Script for Villa Snag List / Inspection Management System

-- 1. Seed Inspection Categories
INSERT INTO public.inspection_categories (id, name, description) VALUES
('c0000000-0000-0000-0000-000000000001', 'المطبخ', 'Kitchen Snags and Inspections'),
('c0000000-0000-0000-0000-000000000002', 'خزانة الملابس', 'Wardrobes and Carpentry'),
('c0000000-0000-0000-0000-000000000003', 'Civil Works', 'Concrete, walls, structure, plastering'),
('c0000000-0000-0000-0000-000000000004', 'Electrical', 'Sockets, wiring, DB boards, lighting fixtures'),
('c0000000-0000-0000-0000-000000000005', 'Plumbing', 'Pipes, sanitaryware, leakage, pressure tests'),
('c0000000-0000-0000-0000-000000000006', 'HVAC', 'AC ducting, grilles, unit performance, thermostat'),
('c0000000-0000-0000-0000-000000000007', 'Finishing & Painting', 'Walls painting, touch-ups, color uniformity'),
('c0000000-0000-0000-0000-000000000008', 'Flooring & Tiling', 'Tiles alignment, grouting, hollow tiles, marble polish')
ON CONFLICT (name) DO NOTHING;

-- 2. Seed Inspection Templates (Excel Columns Mapped)
INSERT INTO public.inspection_templates (category_name, audit_item, is_active) VALUES
('المطبخ', 'النظافة العامة وإزالة بقايا السيلكون والغراء', true),
('المطبخ', 'الخدوش والرتووش والتلقيطات في الأبواب والضلف', true),
('المطبخ', 'وزنيات الادراج والضلف واستقامتها وإغلاقها التام', true),
('المطبخ', 'سلامة المفصلات والمجرى الهيدروليكي وجودة الحركة', true),
('المطبخ', 'قطع او اكسسوارات مفقودة او ناقصة كالمقابض والرفوف', true),
('المطبخ', 'انحناء او ترخيم في الالواح والأسطح الخشبية أو الرخام', true),
('خزانة الملابس', 'تثبيت الهيكل وقوائم الخزانة الرأسية مع الجدار والأرضية بشكل محكم ومتزن وعمل السدادات.', true),
('خزانة الملابس', 'وزنيات واستقامة الأبواب وإغلاقها التام دون وجود فراغات متفاوتة.', true),
('خزانة الملابس', 'وزنيات واستقامة الأدراج وإغلاقها التام دون وجود فراغات متفاوتة.', true),
('خزانة الملابس', 'الخدوش والرتووش والتلقيطات والنهايات والتقفيلات مع الجدار.', true),
('خزانة الملابس', 'الإكسسوارات الداخلية: تثبيت أعمدة التعليق، الأرفف بشكل سليم.', true),
('خزانة الملابس', 'نظام الإضاءة الداخلية: عمل الحساسات الذكية (Sensors) فور فتح الأبواب وتشغيل الإنارة بكفاءة.', true),
('خزانة الملابس', 'عدم الاغلاق الكامل للابواب السحاب وترخي الصدادات.', true),
('خزانة الملابس', 'ترخيم وترييح في اسفل الخزانة والفواصل الخشبية.', true),
('Electrical', 'Inspection of DB dressing, labeling and earth continuity', true),
('Electrical', 'Verify functions of all switches, sockets and ELRBs', true),
('Plumbing', 'Check for leakages in under-sink connections and vanity taps', true),
('Plumbing', 'Inspect water pressure and drainage flow rate in showers/toilets', true),
('HVAC', 'Verify AC cooling performance and noise levels in rooms', true),
('HVAC', 'Ensure flexible duct connection and insulation are complete without condensation', true),
('Finishing & Painting', 'Check wall plastering and paint finish for cracks, roller marks, or peel-off', true),
('Flooring & Tiling', 'Verify floor levels and slope in wet areas towards gully trap', true)
ON CONFLICT (category_name, audit_item) DO NOTHING;

-- 3. Seed Mock Profiles (We assume users are inserted via auth system or manual inserts)
-- Since UUIDs are required, we'll create standard mock profile UUIDs for local/development use.
-- For local storage bypass/mock, we can define these IDs.
INSERT INTO public.profiles (id, email, full_name, role, phone) VALUES
('d1111111-1111-1111-1111-111111111111', 'admin@villaqc.com', 'Super Admin User', 'super_admin', '+966500000001'),
('d2222222-2222-2222-2222-222222222222', 'pm@villaqc.com', 'Eng. Ahmed (PM)', 'project_manager', '+966500000002'),
('d3333333-3333-3333-3333-333333333333', 'engineer@villaqc.com', 'Eng. Khalid (Site Engineer)', 'site_engineer', '+966500000003'),
('d4444444-4444-4444-4444-444444444444', 'inspector@villaqc.com', 'Eng. Yousef (QA/QC)', 'qaqc_inspector', '+966500000004'),
('d5555555-5555-5555-5555-555555555555', 'contractor@villaqc.com', 'Saudi Construction Co. (Contractor)', 'contractor', '+966500000005'),
('d6666666-6666-6666-6666-666666666666', 'viewer@villaqc.com', 'Client Representative (Read Only)', 'read_only', '+966500000006')
ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name, role = EXCLUDED.role;

-- 4. Seed Project
INSERT INTO public.projects (id, name, description, owner, contractor, consultant, engineer) VALUES
('p0000000-0000-0000-0000-000000000001', 'Luxury Villa Compound', 'Premium residential complex containing 30 luxury villas with high-end finishes.', 'Al-Hokair Real Estate', 'Saudi Construction Co.', 'Khatib & Alami', 'Eng. Ahmed')
ON CONFLICT (name) DO UPDATE SET owner = EXCLUDED.owner;

-- 5. Seed Blocks
INSERT INTO public.blocks (id, project_id, name, description) VALUES
('b0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000001', 'Block A', 'Villas 01 to 10 - Sea View Sector'),
('b0000000-0000-0000-0000-000000000002', 'p0000000-0000-0000-0000-000000000001', 'Block B', 'Villas 11 to 20 - Park Sector'),
('b0000000-0000-0000-0000-000000000003', 'p0000000-0000-0000-0000-000000000001', 'Block C', 'Villas 21 to 30 - Boulevard Sector')
ON CONFLICT (project_id, name) DO NOTHING;

-- 6. Seed Villas (30 Villas)
INSERT INTO public.villas (id, block_id, villa_number, owner, contractor, consultant, engineer) VALUES
-- Block A (Villas 01 to 10)
('v0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Villa 01', 'Fahad Al-Qahtani', 'Saudi Construction Co.', 'Khatib & Alami', 'Eng. Khalid', 0),
('v0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'Villa 02', 'Sarah Al-Sudairy', 'Saudi Construction Co.', 'Khatib & Alami', 'Eng. Khalid', 0),
('v0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'Villa 03', 'Mohammed Al-Dosari', 'Saudi Construction Co.', 'Khatib & Alami', 'Eng. Khalid', 0),
('v0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', 'Villa 04', 'Noura Al-Otaibi', 'Saudi Construction Co.', 'Khatib & Alami', 'Eng. Khalid', 0),
('v0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000001', 'Villa 05', 'Studio-101 Owner', 'Saudi Construction Co.', 'Khatib & Alami', 'Eng. Khalid', 0),
('v0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000001', 'Villa 06', 'Khalid Al-Ghamdi', 'Saudi Construction Co.', 'Khatib & Alami', 'Eng. Khalid', 0),
('v0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000001', 'Villa 07', 'Aisha Al-Harbi', 'Saudi Construction Co.', 'Khatib & Alami', 'Eng. Khalid', 0),
('v0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000001', 'Villa 08', 'Sulaiman Al-Malki', 'Saudi Construction Co.', 'Khatib & Alami', 'Eng. Khalid', 0),
('v0000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000001', 'Villa 09', 'Yousef Al-Zahrani', 'Saudi Construction Co.', 'Khatib & Alami', 'Eng. Khalid', 0),
('v0000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000001', 'Villa 10', 'Maha Al-Mutairi', 'Saudi Construction Co.', 'Khatib & Alami', 'Eng. Khalid', 0),
-- Block B (Villas 11 to 20)
('v0000000-0000-0000-0000-000000000011', 'b0000000-0000-0000-0000-000000000002', 'Villa 11', 'Abdullah Al-Shehri', 'Saudi Construction Co.', 'Khatib & Alami', 'Eng. Khalid', 0),
('v0000000-0000-0000-0000-000000000012', 'b0000000-0000-0000-0000-000000000002', 'Villa 12', 'Reem Al-Anazi', 'Saudi Construction Co.', 'Khatib & Alami', 'Eng. Khalid', 0),
('v0000000-0000-0000-0000-000000000013', 'b0000000-0000-0000-0000-000000000002', 'Villa 13', 'Bandar Al-Faisal', 'Saudi Construction Co.', 'Khatib & Alami', 'Eng. Khalid', 0),
('v0000000-0000-0000-0000-000000000014', 'b0000000-0000-0000-0000-000000000002', 'Villa 14', 'Dalal Al-Ghamdi', 'Saudi Construction Co.', 'Khatib & Alami', 'Eng. Khalid', 0),
('v0000000-0000-0000-0000-000000000015', 'b0000000-0000-0000-0000-000000000002', 'Villa 15', 'Nasser Al-Subaie', 'Saudi Construction Co.', 'Khatib & Alami', 'Eng. Khalid', 0),
('v0000000-0000-0000-0000-000000000016', 'b0000000-0000-0000-0000-000000000002', 'Villa 16', 'Fatima Al-Ruwaili', 'Saudi Construction Co.', 'Khatib & Alami', 'Eng. Khalid', 0),
('v0000000-0000-0000-0000-000000000017', 'b0000000-0000-0000-0000-000000000002', 'Villa 17', 'Faisal Al-Saud', 'Saudi Construction Co.', 'Khatib & Alami', 'Eng. Khalid', 0),
('v0000000-0000-0000-0000-000000000018', 'b0000000-0000-0000-0000-000000000002', 'Villa 18', 'Hanan Al-Rashid', 'Saudi Construction Co.', 'Khatib & Alami', 'Eng. Khalid', 0),
('v0000000-0000-0000-0000-000000000019', 'b0000000-0000-0000-0000-000000000002', 'Villa 19', 'Saad Al-Dossari', 'Saudi Construction Co.', 'Khatib & Alami', 'Eng. Khalid', 0),
('v0000000-0000-0000-0000-000000000020', 'b0000000-0000-0000-0000-000000000002', 'Villa 20', 'Lulua Al-Khalid', 'Saudi Construction Co.', 'Khatib & Alami', 'Eng. Khalid', 0),
-- Block C (Villas 21 to 30)
('v0000000-0000-0000-0000-000000000021', 'b0000000-0000-0000-0000-000000000003', 'Villa 21', 'Hassan Al-Shammari', 'Saudi Construction Co.', 'Khatib & Alami', 'Eng. Khalid', 0),
('v0000000-0000-0000-0000-000000000022', 'b0000000-0000-0000-0000-000000000003', 'Villa 22', 'Amal Al-Ajmi', 'Saudi Construction Co.', 'Khatib & Alami', 'Eng. Khalid', 0),
('v0000000-0000-0000-0000-000000000023', 'b0000000-0000-0000-0000-000000000003', 'Villa 23', 'Rashed Al-Marri', 'Saudi Construction Co.', 'Khatib & Alami', 'Eng. Khalid', 0),
('v0000000-0000-0000-0000-000000000024', 'b0000000-0000-0000-0000-000000000003', 'Villa 24', 'Mona Al-Suwaidi', 'Saudi Construction Co.', 'Khatib & Alami', 'Eng. Khalid', 0),
('v0000000-0000-0000-0000-000000000025', 'b0000000-0000-0000-0000-000000000003', 'Villa 25', 'Saleh Al-Harthi', 'Saudi Construction Co.', 'Khatib & Alami', 'Eng. Khalid', 0),
('v0000000-0000-0000-0000-000000000026', 'b0000000-0000-0000-0000-000000000003', 'Villa 26', 'Jawaher Al-Mansoori', 'Saudi Construction Co.', 'Khatib & Alami', 'Eng. Khalid', 0),
('v0000000-0000-0000-0000-000000000027', 'b0000000-0000-0000-0000-000000000003', 'Villa 27', 'Sultan Al-Otaibi', 'Saudi Construction Co.', 'Khatib & Alami', 'Eng. Khalid', 0),
('v0000000-0000-0000-0000-000000000028', 'b0000000-0000-0000-0000-000000000003', 'Villa 28', 'Deema Al-Sabhan', 'Saudi Construction Co.', 'Khatib & Alami', 'Eng. Khalid', 0),
('v0000000-0000-0000-0000-000000000029', 'b0000000-0000-0000-0000-000000000003', 'Villa 29', 'Waleed Al-Bawardi', 'Saudi Construction Co.', 'Khatib & Alami', 'Eng. Khalid', 0),
('v0000000-0000-0000-0000-000000000030', 'b0000000-0000-0000-0000-000000000003', 'Villa 30', 'Ghada Al-Jasser', 'Saudi Construction Co.', 'Khatib & Alami', 'Eng. Khalid', 0)
ON CONFLICT (block_id, villa_number) DO NOTHING;

-- 7. Seed Sample Snag Items (Around 10 items per Villa, total 300+ items with random status/priority/category)
-- To avoid writing 300 explicit insert statements manually, we can seed Villa 01 and Villa 05 (Studio 101 checklist)
-- with detailed items, and write a SQL procedure to generate bulk randomized items for the other villas.
-- This will ensure a robust and realistic seed database.

-- Seeding detailed checklist for Villa 05 (Studio-101) directly from the Excel checklist
INSERT INTO public.inspection_items (id, snag_number, villa_id, category_id, location, room, title, description, priority, status, assigned_to, due_date, inspector_id, contractor_id, remarks) VALUES
-- Kitchen items
('i0000000-0000-0000-0000-000000000001', 'SNAG-2026-0001', 'v0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000001', 'Ground Floor', 'Kitchen', 'Cleanliness', 'General cleaning and removal of silicon and glue residue.', 'low', 'closed', 'd5555555-5555-5555-5555-555555555555', '2026-07-25', 'd4444444-4444-4444-4444-444444444444', 'd5555555-5555-5555-5555-555555555555', 'No comments'),
('i0000000-0000-0000-0000-000000000002', 'SNAG-2026-0002', 'v0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000001', 'Ground Floor', 'Kitchen', 'Scratches and Touch-ups', 'Minor scratches and touchups needed on cabinet doors.', 'medium', 'closed', 'd5555555-5555-5555-5555-555555555555', '2026-07-25', 'd4444444-4444-4444-4444-444444444444', 'd5555555-5555-5555-5555-555555555555', 'Resolved'),
('i0000000-0000-0000-0000-000000000003', 'SNAG-2026-0003', 'v0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000001', 'Ground Floor', 'Kitchen', 'Drawer Alignment', 'Align drawers and ensure smooth soft-close functionality.', 'medium', 'closed', 'd5555555-5555-5555-5555-555555555555', '2026-07-25', 'd4444444-4444-4444-4444-444444444444', 'd5555555-5555-5555-5555-555555555555', 'Fixed'),
('i0000000-0000-0000-0000-000000000004', 'SNAG-2026-0004', 'v0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000001', 'Ground Floor', 'Kitchen', 'Hinges Check', 'Check door hinges safety and grease/tighten as required.', 'low', 'in_progress', 'd5555555-5555-5555-5555-555555555555', '2026-07-25', 'd4444444-4444-4444-4444-444444444444', 'd5555555-5555-5555-5555-555555555555', 'Hinges squeaking'),
('i0000000-0000-0000-0000-000000000005', 'SNAG-2026-0005', 'v0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000001', 'Ground Floor', 'Kitchen', 'Missing Accessories', 'Cabinet handles missing on two top drawers.', 'high', 'open', 'd5555555-5555-5555-5555-555555555555', '2026-07-25', 'd4444444-4444-4444-4444-444444444444', 'd5555555-5555-5555-5555-555555555555', 'Cabinet handles missing'),
('i0000000-0000-0000-0000-000000000006', 'SNAG-2026-0006', 'v0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000001', 'Ground Floor', 'Kitchen', 'Panel Deflection', 'Minor bending in wooden shelving under the sink.', 'medium', 'closed', 'd5555555-5555-5555-5555-555555555555', '2026-07-25', 'd4444444-4444-4444-4444-444444444444', 'd5555555-5555-5555-5555-555555555555', 'No action needed'),
-- Wardrobe items
('i0000000-0000-0000-0000-000000000007', 'SNAG-2026-0007', 'v0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000002', 'First Floor', 'Bedroom 1', 'Frame Fixing', 'Structure and vertical frame fixing check with wall and floor.', 'high', 'closed', 'd5555555-5555-5555-5555-555555555555', '2026-07-28', 'd4444444-4444-4444-4444-444444444444', 'd5555555-5555-5555-5555-555555555555', 'Sturdy'),
('i0000000-0000-0000-0000-000000000008', 'SNAG-2026-0008', 'v0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000002', 'First Floor', 'Bedroom 1', 'Sliding Doors', 'Sliding doors not closing fully or dragging.', 'medium', 'closed', 'd5555555-5555-5555-5555-555555555555', '2026-07-28', 'd4444444-4444-4444-4444-444444444444', 'd5555555-5555-5555-5555-555555555555', 'Good'),
('i0000000-0000-0000-0000-000000000009', 'SNAG-2026-0009', 'v0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000002', 'First Floor', 'Bedroom 1', 'Bottom Sagging', 'Sagging or gap in the bottom wardrobe plinth.', 'low', 'closed', 'd5555555-5555-5555-5555-555555555555', '2026-07-28', 'd4444444-4444-4444-4444-444444444444', 'd5555555-5555-5555-5555-555555555555', 'Resolved'),
('i0000000-0000-0000-0000-000000000010', 'SNAG-2026-0010', 'v0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000002', 'First Floor', 'Bedroom 1', 'Doors Alignment', 'Align wardrobe doors to close evenly without gaps.', 'medium', 'closed', 'd5555555-5555-5555-5555-555555555555', '2026-07-28', 'd4444444-4444-4444-4444-444444444444', 'd5555555-5555-5555-5555-555555555555', 'Aligned'),
('i0000000-0000-0000-0000-000000000011', 'SNAG-2026-0011', 'v0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000002', 'First Floor', 'Bedroom 1', 'Drawers Straightness', 'Check drawers guide rails and make sure they open straight.', 'low', 'closed', 'd5555555-5555-5555-5555-555555555555', '2026-07-28', 'd4444444-4444-4444-4444-444444444444', 'd5555555-5555-5555-5555-555555555555', 'All straight'),
('i0000000-0000-0000-0000-000000000012', 'SNAG-2026-0012', 'v0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000002', 'First Floor', 'Bedroom 1', 'Scratches & Trims', 'Scratches on the edge banding and side panel wood grain.', 'low', 'closed', 'd5555555-5555-5555-5555-555555555555', '2026-07-28', 'd4444444-4444-4444-4444-444444444444', 'd5555555-5555-5555-5555-555555555555', 'Done'),
('i0000000-0000-0000-0000-000000000013', 'SNAG-2026-0013', 'v0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000002', 'First Floor', 'Bedroom 1', 'Internal Accessories', 'Check hanging rod brackets and shelf pins.', 'low', 'closed', 'd5555555-5555-5555-5555-555555555555', '2026-07-28', 'd4444444-4444-4444-4444-444444444444', 'd5555555-5555-5555-5555-555555555555', 'OK'),
('i0000000-0000-0000-0000-000000000014', 'SNAG-2026-0014', 'v0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000002', 'First Floor', 'Bedroom 1', 'Lighting Sensor', 'LED strip sensor fails to turn on when opening left wardrobe door.', 'medium', 'rectified', 'd5555555-5555-5555-5555-555555555555', '2026-07-28', 'd4444444-4444-4444-4444-444444444444', 'd5555555-5555-5555-5555-555555555555', 'Awaiting QA signoff')
ON CONFLICT (snag_number) DO NOTHING;

-- Procedural logic to seed other villas (Villas 01 to 30, skipping Villa 05) with 10 random items each
-- We will write a postgres block that iterates through all villas, selects 10 random templates, and creates snag items.
DO $$
DECLARE
    v_rec RECORD;
    v_cat_rec RECORD;
    v_template_rec RECORD;
    v_snag_seq INT := 15;
    v_status_arr TEXT[] := ARRAY['open', 'assigned', 'in_progress', 'rectified', 'qa_verification', 'closed'];
    v_priority_arr TEXT[] := ARRAY['low', 'medium', 'high', 'critical'];
    v_status TEXT;
    v_priority TEXT;
    v_cnt INT;
    v_title TEXT;
BEGIN
    FOR v_rec IN SELECT id, villa_number FROM public.villas WHERE id <> 'v0000000-0000-0000-0000-000000000005' LOOP
        
        -- Generate 10 inspection items for this villa
        FOR v_cnt IN 1..10 LOOP
            v_snag_seq := v_snag_seq + 1;
            
            -- Pick status and priority randomly
            v_status := v_status_arr[1 + floor(random() * 6)::int];
            v_priority := v_priority_arr[1 + floor(random() * 4)::int];
            
            -- Pick a random category
            SELECT id, name INTO v_cat_rec FROM public.inspection_categories ORDER BY random() LIMIT 1;
            
            -- Pick a random title/description based on category
            IF v_cat_rec.name = 'المطبخ' THEN
                v_title := ARRAY['Silicone residues', 'Drawer alignment', 'Scratches on panels', 'Hinge adjustment', 'Missing handle'][1 + floor(random() * 5)::int];
            ELSIF v_cat_rec.name = 'خزانة الملابس' THEN
                v_title := ARRAY['Wardrobe alignment', 'LED strip sensor issue', 'Sliding door drag', 'Shelving deflection', 'Frame screw loose'][1 + floor(random() * 5)::int];
            ELSIF v_cat_rec.name = 'Electrical' THEN
                v_title := ARRAY['Ganging plate loose', 'Earth leakage check', 'DB board missing label', 'Power socket not working', 'Light fitting scratch'][1 + floor(random() * 5)::int];
            ELSIF v_cat_rec.name = 'Plumbing' THEN
                v_title := ARRAY['Drain block', 'Pipe joint leakage', 'Low water pressure', 'Silicon missing around sink', 'Mixer tap loose'][1 + floor(random() * 5)::int];
            ELSIF v_cat_rec.name = 'HVAC' THEN
                v_title := ARRAY['Thermostat display error', 'AC filter dirty', 'AC grill loose', 'Duct vibration noise', 'Condensation drop'][1 + floor(random() * 5)::int];
            ELSE
                v_title := ARRAY['Wall paint patchiness', 'Floor tile hollow', 'Skirting gap', 'Window lock jammed', 'Door paint touch-up'][1 + floor(random() * 5)::int];
            END IF;

            INSERT INTO public.inspection_items (
                snag_number, villa_id, category_id, location, room, title, description, priority, status, assigned_to, due_date, inspector_id, contractor_id, remarks, created_by, updated_by
            ) VALUES (
                'SNAG-2026-' || lpad(v_snag_seq::text, 4, '0'),
                v_rec.id,
                v_cat_rec.id,
                CASE WHEN random() > 0.5 THEN 'Ground Floor' ELSE 'First Floor' END,
                ARRAY['Kitchen', 'Living Room', 'Master Bedroom', 'Toilet', 'Corridor'][1 + floor(random() * 5)::int],
                v_title,
                v_title || ' needs rectification as per specifications.',
                v_priority,
                v_status,
                CASE WHEN v_status <> 'open' THEN 'd5555555-5555-5555-5555-555555555555'::uuid ELSE NULL END,
                CURRENT_DATE + 7,
                'd4444444-4444-4444-4444-444444444444'::uuid,
                'd5555555-5555-5555-5555-555555555555'::uuid,
                'Auto-generated during seeding',
                'd3333333-3333-3333-3333-333333333333'::uuid,
                'd3333333-3333-3333-3333-333333333333'::uuid
            );
        END LOOP;
        
    END LOOP;
END;
$$;

-- Trigger updating the completion rates for each Villa and Project initially (after seeding)
-- Note: Our triggers on inspection_items already fired and set completion rates! We can verify:
-- SELECT id, villa_number, completion_rate FROM public.villas;
