-- Create custom roles and types if needed, but text constraints are preferred for simplicity and flexibility in RLS.

-- 1. Profiles Table (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'project_manager', 'site_engineer', 'qaqc_inspector', 'contractor', 'read_only')),
    phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    owner TEXT,
    contractor TEXT,
    consultant TEXT,
    engineer TEXT,
    completion_rate NUMERIC(5,2) NOT NULL DEFAULT 0.00 CHECK (completion_rate >= 0 AND completion_rate <= 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- 3. Blocks Table
CREATE TABLE IF NOT EXISTS public.blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (project_id, name)
);

ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

-- 4. Villas Table
CREATE TABLE IF NOT EXISTS public.villas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    block_id UUID NOT NULL REFERENCES public.blocks(id) ON DELETE CASCADE,
    villa_number TEXT NOT NULL,
    owner TEXT,
    contractor TEXT,
    consultant TEXT,
    engineer TEXT,
    completion_rate NUMERIC(5,2) NOT NULL DEFAULT 0.00 CHECK (completion_rate >= 0 AND completion_rate <= 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (block_id, villa_number)
);

ALTER TABLE public.villas ENABLE ROW LEVEL SECURITY;

-- 5. Inspection Categories Table
CREATE TABLE IF NOT EXISTS public.inspection_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.inspection_categories ENABLE ROW LEVEL SECURITY;

-- 6. Inspection Templates Table
CREATE TABLE IF NOT EXISTS public.inspection_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_name TEXT NOT NULL,
    audit_item TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (category_name, audit_item)
);

ALTER TABLE public.inspection_templates ENABLE ROW LEVEL SECURITY;

-- 7. Inspection / Snag Items Table
CREATE TABLE IF NOT EXISTS public.inspection_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    snag_number TEXT NOT NULL UNIQUE,
    villa_id UUID NOT NULL REFERENCES public.villas(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.inspection_categories(id) ON DELETE SET NULL,
    location TEXT,
    room TEXT,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status TEXT NOT NULL CHECK (status IN ('open', 'assigned', 'in_progress', 'rectified', 'qa_verification', 'closed')),
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    due_date DATE,
    completion_date DATE,
    inspection_date DATE NOT NULL DEFAULT CURRENT_DATE,
    inspector_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    contractor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    remarks TEXT,
    gps_lat DOUBLE PRECISION,
    gps_lng DOUBLE PRECISION,
    digital_signature TEXT, -- Stored as signature metadata/base64 or storage url
    created_by UUID REFERENCES public.profiles(id),
    updated_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.inspection_items ENABLE ROW LEVEL SECURITY;

-- Indexing for search performance
CREATE INDEX IF NOT EXISTS idx_inspection_items_villa ON public.inspection_items(villa_id);
CREATE INDEX IF NOT EXISTS idx_inspection_items_status ON public.inspection_items(status);
CREATE INDEX IF NOT EXISTS idx_inspection_items_category ON public.inspection_items(category_id);
CREATE INDEX IF NOT EXISTS idx_inspection_items_assigned ON public.inspection_items(assigned_to);

-- 8. Inspection Photos Table
CREATE TABLE IF NOT EXISTS public.inspection_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inspection_item_id UUID NOT NULL REFERENCES public.inspection_items(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    photo_type TEXT NOT NULL CHECK (photo_type IN ('before', 'after')),
    caption TEXT,
    uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.inspection_photos ENABLE ROW LEVEL SECURITY;

-- 9. Inspection Comments Table
CREATE TABLE IF NOT EXISTS public.inspection_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inspection_item_id UUID NOT NULL REFERENCES public.inspection_items(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.inspection_comments ENABLE ROW LEVEL SECURITY;

-- 10. Inspection History (Audit Trail)
CREATE TABLE IF NOT EXISTS public.inspection_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inspection_item_id UUID NOT NULL REFERENCES public.inspection_items(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL, -- e.g., 'create', 'status_change', 'assigned_change', 'photo_upload', 'comment_added'
    old_status TEXT,
    new_status TEXT,
    details TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.inspection_history ENABLE ROW LEVEL SECURITY;

-- 11. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    link TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 12. Attachments Table (PDFs, Drawings, specs)
CREATE TABLE IF NOT EXISTS public.attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inspection_item_id UUID NOT NULL REFERENCES public.inspection_items(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size INTEGER,
    file_type TEXT NOT NULL CHECK (file_type IN ('pdf', 'drawing', 'other')),
    uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

-- 13. Activity Logs Table (General actions)
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    details TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- 14. Export History Table (Required by Export Center)
CREATE TABLE IF NOT EXISTS public.export_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_name TEXT NOT NULL,
    export_type TEXT NOT NULL CHECK (export_type IN ('excel', 'pdf', 'csv')),
    exported_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    file_size INTEGER,
    file_url TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.export_history ENABLE ROW LEVEL SECURITY;


--------------------------------------------------------------------------------
-- TRIGGERS & PROCEDURES
--------------------------------------------------------------------------------

-- Trigger function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to tables
CREATE TRIGGER update_profiles_modtime BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_projects_modtime BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_villas_modtime BEFORE UPDATE ON public.villas FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_inspection_templates_modtime BEFORE UPDATE ON public.inspection_templates FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_inspection_items_modtime BEFORE UPDATE ON public.inspection_items FOR EACH ROW EXECUTE FUNCTION update_modified_column();


-- Trigger function: Automatically sync new auth users to profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'read_only')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- Trigger function: Automatically update completion rate of a Villa and Project
-- Formula: closed items / total items
CREATE OR REPLACE FUNCTION public.update_completion_rates()
RETURNS TRIGGER AS $$
DECLARE
    v_villa_id UUID;
    v_block_id UUID;
    v_project_id UUID;
    v_total_items INT;
    v_closed_items INT;
    v_completion NUMERIC(5,2);
    v_villas_avg NUMERIC(5,2);
BEGIN
    -- Determine the villa_id depending on insertion, update, or deletion
    IF TG_OP = 'DELETE' THEN
        v_villa_id := OLD.villa_id;
    ELSE
        v_villa_id := NEW.villa_id;
    END IF;

    -- Count inspection items for this villa
    SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'closed')
    INTO v_total_items, v_closed_items
    FROM public.inspection_items
    WHERE villa_id = v_villa_id;

    -- Calculate villa completion rate
    IF v_total_items > 0 THEN
        v_completion := (v_closed_items::numeric / v_total_items::numeric) * 100.00;
    ELSE
        v_completion := 0.00;
    END IF;

    -- Update Villa
    UPDATE public.villas
    SET completion_rate = ROUND(v_completion, 2)
    WHERE id = v_villa_id
    RETURNING block_id INTO v_block_id;

    -- Update Project Completion Rate (Average of its villas' completion rates)
    SELECT project_id INTO v_project_id
    FROM public.blocks
    WHERE id = v_block_id;

    SELECT COALESCE(AVG(completion_rate), 0.00)
    INTO v_villas_avg
    FROM public.villas v
    JOIN public.blocks b ON v.block_id = b.id
    WHERE b.project_id = v_project_id;

    UPDATE public.projects
    SET completion_rate = ROUND(v_villas_avg, 2)
    WHERE id = v_project_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to inspection_items
CREATE TRIGGER on_inspection_items_change
  AFTER INSERT OR UPDATE OF status OR DELETE
  ON public.inspection_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_completion_rates();


-- Trigger function: Automatically log inspection_items history audit trail
CREATE OR REPLACE FUNCTION public.log_inspection_history()
RETURNS TRIGGER AS $$
DECLARE
    v_action TEXT;
    v_user_id UUID;
    v_details TEXT;
BEGIN
    IF TG_OP = 'INSERT' THEN
        v_action := 'create';
        v_user_id := NEW.created_by;
        v_details := 'Inspection item created with status: ' || NEW.status || '.';
        
        INSERT INTO public.inspection_history (inspection_item_id, user_id, action, old_status, new_status, details)
        VALUES (NEW.id, v_user_id, v_action, NULL, NEW.status, v_details);
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status <> NEW.status THEN
            v_action := 'status_change';
            v_user_id := NEW.updated_by;
            v_details := 'Status changed from ' || OLD.status || ' to ' || NEW.status || '.';
            
            INSERT INTO public.inspection_history (inspection_item_id, user_id, action, old_status, new_status, details)
            VALUES (NEW.id, v_user_id, v_action, OLD.status, NEW.status, v_details);
        END IF;
        
        IF COALESCE(OLD.assigned_to, '00000000-0000-0000-0000-000000000000'::uuid) <> COALESCE(NEW.assigned_to, '00000000-0000-0000-0000-000000000000'::uuid) THEN
            v_action := 'assigned_change';
            v_user_id := NEW.updated_by;
            v_details := 'Assigned user updated.';
            
            INSERT INTO public.inspection_history (inspection_item_id, user_id, action, old_status, new_status, details)
            VALUES (NEW.id, v_user_id, v_action, NULL, NULL, v_details);
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_inspection_items_audit
  AFTER INSERT OR UPDATE ON public.inspection_items
  FOR EACH ROW
  EXECUTE FUNCTION public.log_inspection_history();


--------------------------------------------------------------------------------
-- ROW LEVEL SECURITY POLICIES
--------------------------------------------------------------------------------

-- Policy Helper Functions
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(
    (SELECT role FROM public.profiles WHERE id = auth.uid()),
    'read_only'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Profiles Policies
CREATE POLICY "Allow read access to all authenticated profiles"
ON public.profiles FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow update to own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow all actions to super admin on profiles"
ON public.profiles FOR ALL
USING (public.get_auth_role() = 'super_admin');

-- 2. Projects Policies
CREATE POLICY "Allow read access to projects for all authenticated users"
ON public.projects FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow write access to projects for admins and managers"
ON public.projects FOR ALL
USING (public.get_auth_role() IN ('super_admin', 'project_manager'));

-- 3. Blocks Policies
CREATE POLICY "Allow read access to blocks for all authenticated users"
ON public.blocks FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow write access to blocks for admins and managers"
ON public.blocks FOR ALL
USING (public.get_auth_role() IN ('super_admin', 'project_manager'));

-- 4. Villas Policies
CREATE POLICY "Allow read access to villas for all authenticated users"
ON public.villas FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow write access to villas for admins and managers"
ON public.villas FOR ALL
USING (public.get_auth_role() IN ('super_admin', 'project_manager'));

-- 5. Categories Policies
CREATE POLICY "Allow read access to categories for all authenticated users"
ON public.inspection_categories FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow write access to categories for admins and managers"
ON public.inspection_categories FOR ALL
USING (public.get_auth_role() IN ('super_admin', 'project_manager'));

-- 6. Templates Policies
CREATE POLICY "Allow read access to templates for all authenticated users"
ON public.inspection_templates FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow write access to templates for admins and managers"
ON public.inspection_templates FOR ALL
USING (public.get_auth_role() IN ('super_admin', 'project_manager'));

-- 7. Inspection Items Policies
CREATE POLICY "Allow read access to inspection items for all authenticated users"
ON public.inspection_items FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow create access to items for admins, managers, engineers, inspectors"
ON public.inspection_items FOR INSERT
WITH CHECK (public.get_auth_role() IN ('super_admin', 'project_manager', 'site_engineer', 'qaqc_inspector'));

CREATE POLICY "Allow updates for admins, managers, engineers, inspectors"
ON public.inspection_items FOR UPDATE
USING (public.get_auth_role() IN ('super_admin', 'project_manager', 'site_engineer', 'qaqc_inspector'))
WITH CHECK (public.get_auth_role() IN ('super_admin', 'project_manager', 'site_engineer', 'qaqc_inspector'));

CREATE POLICY "Allow status updates and remarks to assigned contractors"
ON public.inspection_items FOR UPDATE
USING (
    public.get_auth_role() = 'contractor' 
    AND (assigned_to = auth.uid() OR contractor_id = auth.uid())
)
WITH CHECK (
    public.get_auth_role() = 'contractor'
    AND (assigned_to = auth.uid() OR contractor_id = auth.uid())
);

CREATE POLICY "Allow delete access to admins and managers"
ON public.inspection_items FOR DELETE
USING (public.get_auth_role() IN ('super_admin', 'project_manager'));

-- 8. Inspection Photos Policies
CREATE POLICY "Allow read access to photos for all"
ON public.inspection_photos FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow inserts to photos for authorized users"
ON public.inspection_photos FOR INSERT
WITH CHECK (
    public.get_auth_role() IN ('super_admin', 'project_manager', 'site_engineer', 'qaqc_inspector')
    OR (public.get_auth_role() = 'contractor' AND uploaded_by = auth.uid())
);

CREATE POLICY "Allow deletes of photos for admins, managers, or uploader"
ON public.inspection_photos FOR DELETE
USING (
    public.get_auth_role() IN ('super_admin', 'project_manager')
    OR uploaded_by = auth.uid()
);

-- 9. Comments Policies
CREATE POLICY "Allow read access to comments for all"
ON public.inspection_comments FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow insert of comments for all"
ON public.inspection_comments FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Allow update/delete to comment owner or admin"
ON public.inspection_comments FOR ALL
USING (auth.uid() = user_id OR public.get_auth_role() IN ('super_admin', 'project_manager'));

-- 10. Audit History Policies
CREATE POLICY "Allow read access to audit logs for all"
ON public.inspection_history FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 11. Notifications Policies
CREATE POLICY "Allow read/write of notifications to self"
ON public.notifications FOR ALL
USING (auth.uid() = user_id);

-- 12. Attachments Policies
CREATE POLICY "Allow read of attachments to all"
ON public.attachments FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow uploads of attachments to authorized roles"
ON public.attachments FOR INSERT
WITH CHECK (public.get_auth_role() IN ('super_admin', 'project_manager', 'site_engineer', 'qaqc_inspector'));

CREATE POLICY "Allow deletes of attachments to admins or uploader"
ON public.attachments FOR DELETE
USING (public.get_auth_role() IN ('super_admin', 'project_manager') OR uploaded_by = auth.uid());

-- 13. Activity Logs Policies
CREATE POLICY "Allow read of activity logs to all"
ON public.activity_logs FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow inserts of activity logs to all"
ON public.activity_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 14. Export History Policies
CREATE POLICY "Allow read/write of exports to self or admin"
ON public.export_history FOR ALL
USING (auth.uid() = exported_by OR public.get_auth_role() IN ('super_admin', 'project_manager'));
