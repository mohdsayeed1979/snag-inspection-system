-- 1. Seed Active Inspection Categories
INSERT INTO public.inspection_categories (id, name, description) VALUES
('c0000000-0000-0000-0000-000000000001', 'المطبخ', 'Kitchen audits, cabinets, alignment, and finishing check list'),
('c0000000-0000-0000-0000-000000000002', 'خزانة الملابس', 'Wardrobes, sliding mechanisms, shelves, drawer checks'),
('c0000000-0000-0000-0000-000000000003', 'Electrical', 'DB Dressing, switches, sockets, earth leakage, and lighting systems'),
('c0000000-0000-0000-0000-000000000004', 'Plumbing', 'Vanities, under-sink connection leakage, mixers, and floor slopes'),
('c0000000-0000-0000-0000-000000000005', 'HVAC', 'Thermostats, AC performance, noise levels, and flexible ducts'),
('c0000000-0000-0000-0000-000000000006', 'Finishing & Painting', 'Plastering, painting coats, roller marks, ceiling, and doors'),
('c0000000-0000-0000-0000-000000000007', 'Flooring & Tiling', 'Tile slope, grout check, hollow tiles, and floor expansion joints')
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;

-- 2. Seed Default Inspection Templates (checks that populate new Villa checklists)
INSERT INTO public.inspection_templates (category_name, audit_item, is_active) VALUES
('المطبخ', 'تنظيف الفواصل وإزالة بقايا السيليكون واللاصق.', true),
('المطبخ', 'مراجعة تثبيت البنلات الجانبية وسد الفراغات بالسيليكون.', true),
('المطبخ', 'وزنية ومحاذاة درف الخزائن لضمان إغلاق انسيابي.', true),
('المطبخ', 'التأكد من توفر جميع الإكسسوارات والمقابض وسلاسل السحب.', true),
('المطبخ', 'فحص مفصلات الدرف وسلاسة حركة الجرارات وسكك الأدراج.', true),
('خزانة الملابس', 'مراجعة الهيكل وتثبيت الفريمات رأسياً مع الحائط والأرضية.', true),
('خزانة الملابس', 'التأكد من مسار الدرف المنزلقة وعدم احتكاكها أو ثقل حركتها.', true),
('خزانة الملابس', 'سلامة الرفوف والتقسيمات الداخلية وتحملها للأوزان.', true),
('خزانة الملابس', 'وزن درف الدوابيب لتغلق بإحكام متساوي وبدون فراغات.', true),
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

-- 3. Seed Project
INSERT INTO public.projects (id, name, description, owner, contractor, consultant, engineer) VALUES
('a0000000-0000-0000-0000-000000000001', 'Luxury Villa Compound', 'Premium residential complex containing 30 luxury villas with high-end finishes.', 'Al-Hokair Real Estate', 'Saudi Construction Co.', 'Khatib & Alami', 'Eng. Ahmed')
ON CONFLICT (name) DO UPDATE SET owner = EXCLUDED.owner;

-- 4. Seed Blocks
INSERT INTO public.blocks (id, project_id, name, description) VALUES
('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Block A', 'Villas 01 to 10 - Sea View Sector'),
('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Block B', 'Villas 11 to 20 - Park Sector'),
('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Block C', 'Villas 21 to 30 - Boulevard Sector')
ON CONFLICT (project_id, name) DO NOTHING;

-- 5. Seed Villas (30 Villas)
INSERT INTO public.villas (id, block_id, villa_number, owner, contractor, consultant, engineer, completion_rate) VALUES
-- Block A (Villas 01 to 10)
('e0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Villa 01', 'Fahad Al-Qahtani', 'Saudi Construction Co.', 'Khatib & Alami', 'Eng. Khalid', 0),
('e0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'Villa 02', 'Sarah Al-Sudairy', 'Saudi Construction Co.', 'Khatib & Alami', 'Eng. Khalid', 0),
('e0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'Villa 03', 'Mohammed Al-Dosari', 'Saudi Construction Co.', 'Khatib & Alami', 'Eng. Khalid', 0),
('e0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', 'Villa 04', 'Noura Al-Otaibi', 'Saudi Construction Co.', 'Khatib & Alami', 'Eng. Khalid', 0),
('e0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000001', 'Villa 05', 'Studio-101 Owner', 'Saudi Construction Co.', 'Khatib & Alami', 'Eng. Khalid', 0),
('e0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000001', 'Villa 06', 'Khalid Al-Ghamdi', 'Saudi Construction Co.', 'Khatib & Alami', 'Eng. Khalid', 0),
('e0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000001', 'Villa 07', 'Aisha Al-Harbi', 'Saudi Construction Co.', 'Khatib & Alami', 'Eng. Khalid', 0),
('e0000000-0000-0000-0000-000000000008', 'b0000000-0000-0000-0000-000000000001', 'Villa 08', 'Sulaiman Al-Malki', 'Saudi Construction Co.', 'Khatib & Alami', 'Eng. Khalid', 0),
('e0000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000001', 'Villa 09', 'Yousef Al-Zahrani', 'Saudi Construction Co.', 'Khatib & Alami', 'Eng. Khalid', 0),
('e0000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000001', 'Villa 10', 'Maha Al-Mutairi', 'Saudi Construction Co.', 'Khatib & Alami', 'Eng. Khalid', 0),
-- Block B (Villas 11 to 20)
('e0000000-0000-0000-0000-000000000011', 'b0000000-0000-0000-0000-000000000002', 'Villa 11', 'Abdullah Al-Shehri', 'Saudi Construction Co.', 'Khatib & Alami', 'Eng. Khalid', 0),
('e0000000-0000-0000-0000-000000000012', 'b0000000-0000-0000-0000-000000000002', 'Villa 12', 'Reem Al-Anazi', 'Saudi Construction Co.', 'Khatib & Alami', 'Eng. Khalid', 0),
('e0000000-0000-0000-0000-000000000013', 'b0000000-0000-0000-0000-000000000002', 'Villa 13', 'Bandar Al-Faisal', 'Saudi Construction Co.', 'Khatib & Alami', 'Eng. Khalid', 0),
('e0000000-0000-0000-0000-000000000014', 'b0000000-0000-0000-0000-000000000002', 'Villa 14', 'Dalal Al-Ghamdi', 'Saudi Construction Co.', 'Khatib & Alami', 'Eng. Khalid', 0),
('e0000000-0000-0000-0000-000000000015', 'b0000000-0000-0000-0000-000000000002', 'Villa 15', 'Nasser Al-Subaie', 'Saudi Construction Co.', 'Khatib & Alami', 'Eng. Khalid', 0),
('e0000000-0000-0000-0000-000000000016', 'b0000000-0000-0000-0000-000000000002', 'Villa 16', 'Fatima Al-Ruwaili', 'Saudi Construction Co.', 'Khatib & Alami', 'Eng. Khalid', 0),
('e0000000-0000-0000-0000-000000000017', 'b0000000-0000-0000-0000-000000000002', 'Villa 17', 'Faisal Al-Saud', 'Saudi Construction Co.', 'Khatib & Alami', 'Eng. Khalid', 0),
('e0000000-0000-0000-0000-000000000018', 'b0000000-0000-0000-0000-000000000002', 'Villa 18', 'Hanan Al-Rashid', 'Saudi Construction Co.', 'Khatib & Alami', 'Eng. Khalid', 0),
('e0000000-0000-0000-0000-000000000019', 'b0000000-0000-0000-0000-000000000002', 'Villa 19', 'Saad Al-Dossari', 'Saudi Construction Co.', 'Khatib & Alami', 'Eng. Khalid', 0),
('e0000000-0000-0000-0000-000000000020', 'b0000000-0000-0000-0000-000000000002', 'Villa 20', 'Lulua Al-Khalid', 'Saudi Construction Co.', 'Khatib & Alami', 'Eng. Khalid', 0),
-- Block C (Villas 21 to 30)
('e0000000-0000-0000-0000-000000000021', 'b0000000-0000-0000-0000-000000000003', 'Villa 21', 'Hassan Al-Shammari', 'Saudi Construction Co.', 'Khatib & Alami', 'Eng. Khalid', 0),
('e0000000-0000-0000-0000-000000000022', 'b0000000-0000-0000-0000-000000000003', 'Villa 22', 'Amal Al-Ajmi', 'Saudi Construction Co.', 'Khatib & Alami', 'Eng. Khalid', 0),
('e0000000-0000-0000-0000-000000000023', 'b0000000-0000-0000-0000-000000000003', 'Villa 23', 'Rashed Al-Marri', 'Saudi Construction Co.', 'Khatib & Alami', 'Eng. Khalid', 0),
('e0000000-0000-0000-0000-000000000024', 'b0000000-0000-0000-0000-000000000003', 'Villa 24', 'Mona Al-Suwaidi', 'Saudi Construction Co.', 'Khatib & Alami', 'Eng. Khalid', 0),
('e0000000-0000-0000-0000-000000000025', 'b0000000-0000-0000-0000-000000000003', 'Villa 25', 'Saleh Al-Harthi', 'Saudi Construction Co.', 'Khatib & Alami', 'Eng. Khalid', 0),
('e0000000-0000-0000-0000-000000000026', 'b0000000-0000-0000-0000-000000000003', 'Villa 26', 'Jawaher Al-Mansoori', 'Saudi Construction Co.', 'Khatib & Alami', 'Eng. Khalid', 0),
('e0000000-0000-0000-0000-000000000027', 'b0000000-0000-0000-0000-000000000003', 'Villa 27', 'Sultan Al-Otaibi', 'Saudi Construction Co.', 'Khatib & Alami', 'Eng. Khalid', 0),
('e0000000-0000-0000-0000-000000000028', 'b0000000-0000-0000-0000-000000000003', 'Villa 28', 'Deema Al-Sabhan', 'Saudi Construction Co.', 'Khatib & Alami', 'Eng. Khalid', 0),
('e0000000-0000-0000-0000-000000000029', 'b0000000-0000-0000-0000-000000000003', 'Villa 29', 'Waleed Al-Bawardi', 'Saudi Construction Co.', 'Khatib & Alami', 'Eng. Khalid', 0),
('e0000000-0000-0000-0000-000000000030', 'b0000000-0000-0000-0000-000000000003', 'Villa 30', 'Ghada Al-Jasser', 'Saudi Construction Co.', 'Khatib & Alami', 'Eng. Khalid', 0)
ON CONFLICT (block_id, villa_number) DO NOTHING;

-- 6. Seed Sample Snag Items (Around 10 items per Villa, total 300+ items with random status/priority/category)
-- These items are independent of authentication profiles to allow clean execution on any Supabase system.
-- All assigned_to, inspector_id, and contractor_id columns are set to NULL.

-- Seeding detailed checklist for Villa 05 (Studio-101) directly from the Excel checklist
INSERT INTO public.inspection_items (id, snag_number, villa_id, category_id, location, room, title, description, priority, status, assigned_to, due_date, inspector_id, contractor_id, remarks) VALUES
-- Kitchen items
('f0000000-0000-0000-0000-000000000001', 'SNAG-2026-0001', 'e0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000001', 'Ground Floor', 'Kitchen', 'Cleanliness', 'General cleaning and removal of silicon and glue residue.', 'low', 'closed', NULL, '2026-07-25', NULL, NULL, 'No comments'),
('f0000000-0000-0000-0000-000000000002', 'SNAG-2026-0002', 'e0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000001', 'Ground Floor', 'Kitchen', 'Scratches and Touch-ups', 'Minor scratches and touchups needed on cabinet doors.', 'medium', 'closed', NULL, '2026-07-25', NULL, NULL, 'Resolved'),
('f0000000-0000-0000-0000-000000000003', 'SNAG-2026-0003', 'e0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000001', 'Ground Floor', 'Kitchen', 'Drawer Alignment', 'Align drawers and ensure smooth soft-close functionality.', 'medium', 'closed', NULL, '2026-07-25', NULL, NULL, 'Fixed'),
('f0000000-0000-0000-0000-000000000004', 'SNAG-2026-0004', 'e0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000001', 'Ground Floor', 'Kitchen', 'Hinges Check', 'Check door hinges safety and grease/tighten as required.', 'low', 'in_progress', NULL, '2026-07-25', NULL, NULL, 'Hinges squeaking'),
('f0000000-0000-0000-0000-000000000005', 'SNAG-2026-0005', 'e0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000001', 'Ground Floor', 'Kitchen', 'Missing Accessories', 'Cabinet handles missing on two top drawers.', 'high', 'open', NULL, '2026-07-25', NULL, NULL, 'Cabinet handles missing'),
('f0000000-0000-0000-0000-000000000006', 'SNAG-2026-0006', 'e0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000001', 'Ground Floor', 'Kitchen', 'Panel Deflection', 'Minor bending in wooden shelving under the sink.', 'medium', 'closed', NULL, '2026-07-25', NULL, NULL, 'No action needed'),
-- Wardrobe items
('f0000000-0000-0000-0000-000000000007', 'SNAG-2026-0007', 'e0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000002', 'First Floor', 'Bedroom 1', 'Frame Fixing', 'Structure and vertical frame fixing check with wall and floor.', 'high', 'closed', NULL, '2026-07-28', NULL, NULL, 'Sturdy'),
('f0000000-0000-0000-0000-000000000008', 'SNAG-2026-0008', 'e0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000002', 'First Floor', 'Bedroom 1', 'Sliding Doors', 'Sliding doors not closing fully or dragging.', 'medium', 'closed', NULL, '2026-07-28', NULL, NULL, 'Good'),
('f0000000-0000-0000-0000-000000000009', 'SNAG-2026-0009', 'e0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000002', 'First Floor', 'Bedroom 1', 'Bottom Sagging', 'Sagging or gap in the bottom wardrobe plinth.', 'low', 'closed', NULL, '2026-07-28', NULL, NULL, 'Resolved'),
('f0000000-0000-0000-0000-000000000010', 'SNAG-2026-0010', 'e0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000002', 'First Floor', 'Bedroom 1', 'Doors Alignment', 'Align wardrobe doors to close evenly without gaps.', 'medium', 'closed', NULL, '2026-07-28', NULL, NULL, 'Aligned'),
('f0000000-0000-0000-0000-000000000011', 'SNAG-2026-0011', 'e0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000002', 'First Floor', 'Bedroom 1', 'Drawers Straightness', 'Check drawers guide rails and make sure they open straight.', 'low', 'closed', NULL, '2026-07-28', NULL, NULL, 'All straight'),
('f0000000-0000-0000-0000-000000000012', 'SNAG-2026-0012', 'e0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000002', 'First Floor', 'Bedroom 1', 'Scratches & Trims', 'Scratches on the edge banding and side panel wood grain.', 'low', 'closed', NULL, '2026-07-28', NULL, NULL, 'Done'),
('f0000000-0000-0000-0000-000000000013', 'SNAG-2026-0013', 'e0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000002', 'First Floor', 'Bedroom 1', 'Internal Accessories', 'Check hanging rod brackets and shelf pins.', 'low', 'closed', NULL, '2026-07-28', NULL, NULL, 'OK'),
('f0000000-0000-0000-0000-000000000014', 'SNAG-2026-0014', 'e0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000002', 'First Floor', 'Bedroom 1', 'Lighting Sensor', 'LED strip sensor fails to turn on when opening left wardrobe door.', 'medium', 'rectified', NULL, '2026-07-28', NULL, NULL, 'Awaiting QA signoff')
ON CONFLICT (snag_number) DO NOTHING;

-- Procedural logic to seed other villas (Villas 01 to 30, skipping Villa 05) with 10 random items each
-- We write a postgres block that iterates through all villas, selects 10 random templates, and creates snag items.
DO $$
DECLARE
    v_rec RECORD;
    v_cat_rec RECORD;
    v_snag_seq INT := 15;
    v_status_arr TEXT[] := ARRAY['open', 'assigned', 'in_progress', 'rectified', 'qa_verification', 'closed'];
    v_priority_arr TEXT[] := ARRAY['low', 'medium', 'high', 'critical'];
    v_status TEXT;
    v_priority TEXT;
    v_cnt INT;
    v_title TEXT;
BEGIN
    FOR v_rec IN SELECT id, villa_number FROM public.villas WHERE id <> 'e0000000-0000-0000-0000-000000000005' LOOP
        
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
                NULL,
                CURRENT_DATE + 7,
                NULL,
                NULL,
                'Randomly generated remark.',
                NULL,
                NULL
            ) ON CONFLICT (snag_number) DO NOTHING;
        END LOOP;
    END LOOP;
END $$;
