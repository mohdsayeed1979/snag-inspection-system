-- Additive Migration for Multi-Tenant & Generic Project Structure Upgrade
-- Guarantee: Zero Data Loss & Full Backward Compatibility

--------------------------------------------------------------------------------
-- 1. Create Companies Table
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    registration_number TEXT,
    vat_number TEXT,
    country TEXT,
    city TEXT,
    address TEXT,
    postal_code TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    primary_contact TEXT,
    timezone TEXT DEFAULT 'Asia/Riyadh',
    currency TEXT DEFAULT 'SAR',
    language TEXT DEFAULT 'ar',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Seed Default Organization (with fixed UUID)
INSERT INTO public.companies (id, name, code, status)
VALUES ('c0000000-0000-0000-0000-000000000000', 'Default Organization', 'DEF_ORG', 'active')
ON CONFLICT (id) DO NOTHING;

--------------------------------------------------------------------------------
-- 2. Add company_id Column to All Tables (Defaulting to Default Org)
--------------------------------------------------------------------------------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_id UUID NOT NULL DEFAULT 'c0000000-0000-0000-0000-000000000000' REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS company_id UUID NOT NULL DEFAULT 'c0000000-0000-0000-0000-000000000000' REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.blocks ADD COLUMN IF NOT EXISTS company_id UUID NOT NULL DEFAULT 'c0000000-0000-0000-0000-000000000000' REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.villas ADD COLUMN IF NOT EXISTS company_id UUID NOT NULL DEFAULT 'c0000000-0000-0000-0000-000000000000' REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.inspection_categories ADD COLUMN IF NOT EXISTS company_id UUID NOT NULL DEFAULT 'c0000000-0000-0000-0000-000000000000' REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.inspection_templates ADD COLUMN IF NOT EXISTS company_id UUID NOT NULL DEFAULT 'c0000000-0000-0000-0000-000000000000' REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.inspection_items ADD COLUMN IF NOT EXISTS company_id UUID NOT NULL DEFAULT 'c0000000-0000-0000-0000-000000000000' REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.inspection_photos ADD COLUMN IF NOT EXISTS company_id UUID NOT NULL DEFAULT 'c0000000-0000-0000-0000-000000000000' REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.inspection_comments ADD COLUMN IF NOT EXISTS company_id UUID NOT NULL DEFAULT 'c0000000-0000-0000-0000-000000000000' REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.inspection_history ADD COLUMN IF NOT EXISTS company_id UUID NOT NULL DEFAULT 'c0000000-0000-0000-0000-000000000000' REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS company_id UUID NOT NULL DEFAULT 'c0000000-0000-0000-0000-000000000000' REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.attachments ADD COLUMN IF NOT EXISTS company_id UUID NOT NULL DEFAULT 'c0000000-0000-0000-0000-000000000000' REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.activity_logs ADD COLUMN IF NOT EXISTS company_id UUID NOT NULL DEFAULT 'c0000000-0000-0000-0000-000000000000' REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.export_history ADD COLUMN IF NOT EXISTS company_id UUID NOT NULL DEFAULT 'c0000000-0000-0000-0000-000000000000' REFERENCES public.companies(id) ON DELETE CASCADE;

--------------------------------------------------------------------------------
-- 3. Add Project Type, Custom Hierarchy, and Form Builder Configuration
--------------------------------------------------------------------------------
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS project_type TEXT NOT NULL DEFAULT 'villa' CHECK (project_type IN ('villa', 'apartment', 'hotel', 'hospital', 'mall', 'warehouse', 'factory', 'road', 'bridge', 'airport', 'retail', 'restaurant', 'custom'));
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS level_structure JSONB NOT NULL DEFAULT '["Block", "Villa"]';

-- Add Form Response column to Inspection Items for dynamic checklists
ALTER TABLE public.inspection_items ADD COLUMN IF NOT EXISTS form_responses JSONB NOT NULL DEFAULT '{}';

--------------------------------------------------------------------------------
-- 4. Create Generic Project Hierarchy location Table
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.project_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.project_nodes(id) ON DELETE CASCADE,
    company_id UUID NOT NULL DEFAULT 'c0000000-0000-0000-0000-000000000000' REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    node_type TEXT NOT NULL, -- e.g. 'Block', 'Villa', 'Floor', 'Room', 'Shop', 'Zone'
    description TEXT,
    completion_rate NUMERIC(5,2) NOT NULL DEFAULT 0.00 CHECK (completion_rate >= 0 AND completion_rate <= 100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (project_id, parent_id, name)
);

ALTER TABLE public.project_nodes ENABLE ROW LEVEL SECURITY;

-- Add generic node pointer column to Inspection Items (referencing location tree node)
ALTER TABLE public.inspection_items ADD COLUMN IF NOT EXISTS location_node_id UUID REFERENCES public.project_nodes(id) ON DELETE SET NULL;

--------------------------------------------------------------------------------
-- 5. Data Migration Query: copy blocks/villas into project_nodes
--------------------------------------------------------------------------------
-- Migrate legacy blocks
INSERT INTO public.project_nodes (id, project_id, parent_id, company_id, name, node_type, description, created_at)
SELECT id, project_id, NULL, company_id, name, 'Block', description, created_at
FROM public.blocks
ON CONFLICT (id) DO NOTHING;

-- Migrate legacy villas
INSERT INTO public.project_nodes (id, project_id, parent_id, company_id, name, node_type, description, completion_rate, created_at)
SELECT v.id, b.project_id, v.block_id, v.company_id, v.villa_number, 'Villa', COALESCE(v.owner, '') || ' - ' || COALESCE(v.engineer, ''), v.completion_rate, v.created_at
FROM public.villas v
JOIN public.blocks b ON v.block_id = b.id
ON CONFLICT (id) DO NOTHING;

-- Map existing inspection items to location_node_id
UPDATE public.inspection_items SET location_node_id = villa_id WHERE location_node_id IS NULL;

--------------------------------------------------------------------------------
-- 6. Add Project Document Management tables
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.project_document_folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    company_id UUID NOT NULL DEFAULT 'c0000000-0000-0000-0000-000000000000' REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    parent_id UUID REFERENCES public.project_document_folders(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (project_id, parent_id, name)
);

ALTER TABLE public.project_document_folders ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.project_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    folder_id UUID REFERENCES public.project_document_folders(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    company_id UUID NOT NULL DEFAULT 'c0000000-0000-0000-0000-000000000000' REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER,
    file_type TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.project_documents ENABLE ROW LEVEL SECURITY;

--------------------------------------------------------------------------------
-- 7. Policy Helper Functions & Multi-Tenant RLS
--------------------------------------------------------------------------------

-- Helper: Get current user's company ID
CREATE OR REPLACE FUNCTION public.get_auth_company_id()
RETURNS UUID AS $$
BEGIN
  RETURN COALESCE(
    (SELECT company_id FROM public.profiles WHERE id = auth.uid()),
    'c0000000-0000-0000-0000-000000000000'::uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate policy helper to check role
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(
    (SELECT role FROM public.profiles WHERE id = auth.uid()),
    'read_only'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

--------------------------------------------------------------------------------
-- 8. Rebuild Row Level Security Policies for Isolation
--------------------------------------------------------------------------------

-- Profiles Policies
DROP POLICY IF EXISTS "Allow read access to all authenticated profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow update to own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow all actions to super admin on profiles" ON public.profiles;

CREATE POLICY "Allow read access to profiles in same company" ON public.profiles FOR SELECT
USING (auth.uid() IS NOT NULL AND (company_id = public.get_auth_company_id() OR public.get_auth_role() = 'super_admin'));

CREATE POLICY "Allow update to own profile" ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow all actions to super admin or company admin on profiles" ON public.profiles FOR ALL
USING (public.get_auth_role() = 'super_admin' OR (public.get_auth_role() = 'project_manager' AND company_id = public.get_auth_company_id()));

-- Companies Policies
CREATE POLICY "Allow read of company info to members" ON public.companies FOR SELECT
USING (id = public.get_auth_company_id() OR public.get_auth_role() = 'super_admin');

CREATE POLICY "Allow all to super admin on companies" ON public.companies FOR ALL
USING (public.get_auth_role() = 'super_admin');

-- Projects Policies
DROP POLICY IF EXISTS "Allow read access to projects for all authenticated users" ON public.projects;
DROP POLICY IF EXISTS "Allow write access to projects for admins and managers" ON public.projects;

CREATE POLICY "Allow read access to projects in company" ON public.projects FOR SELECT
USING (auth.uid() IS NOT NULL AND (company_id = public.get_auth_company_id() OR public.get_auth_role() = 'super_admin'));

CREATE POLICY "Allow write access to projects for admins and company managers" ON public.projects FOR ALL
USING ((public.get_auth_role() IN ('super_admin', 'project_manager')) AND (company_id = public.get_auth_company_id() OR public.get_auth_role() = 'super_admin'));

-- Project Nodes Policies
CREATE POLICY "Allow read access to nodes in company" ON public.project_nodes FOR SELECT
USING (auth.uid() IS NOT NULL AND (company_id = public.get_auth_company_id() OR public.get_auth_role() = 'super_admin'));

CREATE POLICY "Allow write access to nodes for company managers" ON public.project_nodes FOR ALL
USING ((public.get_auth_role() IN ('super_admin', 'project_manager', 'site_engineer')) AND (company_id = public.get_auth_company_id() OR public.get_auth_role() = 'super_admin'));

-- Blocks Policies
DROP POLICY IF EXISTS "Allow read access to blocks for all authenticated users" ON public.blocks;
DROP POLICY IF EXISTS "Allow write access to blocks for admins and managers" ON public.blocks;

CREATE POLICY "Allow read access to blocks in company" ON public.blocks FOR SELECT
USING (auth.uid() IS NOT NULL AND (company_id = public.get_auth_company_id() OR public.get_auth_role() = 'super_admin'));

CREATE POLICY "Allow write access to blocks for company managers" ON public.blocks FOR ALL
USING ((public.get_auth_role() IN ('super_admin', 'project_manager')) AND (company_id = public.get_auth_company_id() OR public.get_auth_role() = 'super_admin'));

-- Villas Policies
DROP POLICY IF EXISTS "Allow read access to villas for all authenticated users" ON public.villas;
DROP POLICY IF EXISTS "Allow write access to villas for admins and managers" ON public.villas;

CREATE POLICY "Allow read access to villas in company" ON public.villas FOR SELECT
USING (auth.uid() IS NOT NULL AND (company_id = public.get_auth_company_id() OR public.get_auth_role() = 'super_admin'));

CREATE POLICY "Allow write access to villas for company managers" ON public.villas FOR ALL
USING ((public.get_auth_role() IN ('super_admin', 'project_manager')) AND (company_id = public.get_auth_company_id() OR public.get_auth_role() = 'super_admin'));

-- Categories Policies
DROP POLICY IF EXISTS "Allow read access to categories for all authenticated users" ON public.inspection_categories;
DROP POLICY IF EXISTS "Allow write access to categories for admins and managers" ON public.inspection_categories;

CREATE POLICY "Allow read access to categories in company" ON public.inspection_categories FOR SELECT
USING (auth.uid() IS NOT NULL AND (company_id = public.get_auth_company_id() OR public.get_auth_role() = 'super_admin'));

CREATE POLICY "Allow write access to categories for company managers" ON public.inspection_categories FOR ALL
USING ((public.get_auth_role() IN ('super_admin', 'project_manager')) AND (company_id = public.get_auth_company_id() OR public.get_auth_role() = 'super_admin'));

-- Templates Policies
DROP POLICY IF EXISTS "Allow read access to templates for all authenticated users" ON public.inspection_templates;
DROP POLICY IF EXISTS "Allow write access to templates for admins and managers" ON public.inspection_templates;

CREATE POLICY "Allow read access to templates in company" ON public.inspection_templates FOR SELECT
USING (auth.uid() IS NOT NULL AND (company_id = public.get_auth_company_id() OR public.get_auth_role() = 'super_admin'));

CREATE POLICY "Allow write access to templates for company managers" ON public.inspection_templates FOR ALL
USING ((public.get_auth_role() IN ('super_admin', 'project_manager')) AND (company_id = public.get_auth_company_id() OR public.get_auth_role() = 'super_admin'));

-- Inspection Items Policies
DROP POLICY IF EXISTS "Allow read access to inspection items for all authenticated users" ON public.inspection_items;
DROP POLICY IF EXISTS "Allow create access to items for admins, managers, engineers, inspectors" ON public.inspection_items;
DROP POLICY IF EXISTS "Allow updates for admins, managers, engineers, inspectors" ON public.inspection_items;
DROP POLICY IF EXISTS "Allow status updates and remarks to assigned contractors" ON public.inspection_items;
DROP POLICY IF EXISTS "Allow delete access to admins and managers" ON public.inspection_items;

CREATE POLICY "Allow read access to inspection items in company" ON public.inspection_items FOR SELECT
USING (auth.uid() IS NOT NULL AND (company_id = public.get_auth_company_id() OR public.get_auth_role() = 'super_admin'));

CREATE POLICY "Allow create access to items for company inspectors" ON public.inspection_items FOR INSERT
WITH CHECK ((public.get_auth_role() IN ('super_admin', 'project_manager', 'site_engineer', 'qaqc_inspector')) AND (company_id = public.get_auth_company_id() OR public.get_auth_role() = 'super_admin'));

CREATE POLICY "Allow updates for company inspectors" ON public.inspection_items FOR UPDATE
USING (auth.uid() IS NOT NULL AND (company_id = public.get_auth_company_id() OR public.get_auth_role() = 'super_admin'))
WITH CHECK ((public.get_auth_role() IN ('super_admin', 'project_manager', 'site_engineer', 'qaqc_inspector')) AND (company_id = public.get_auth_company_id() OR public.get_auth_role() = 'super_admin'));

CREATE POLICY "Allow status updates to assigned contractors" ON public.inspection_items FOR UPDATE
USING (
    company_id = public.get_auth_company_id() 
    AND public.get_auth_role() = 'contractor' 
    AND (assigned_to = auth.uid() OR contractor_id = auth.uid())
)
WITH CHECK (
    company_id = public.get_auth_company_id()
    AND public.get_auth_role() = 'contractor'
    AND (assigned_to = auth.uid() OR contractor_id = auth.uid())
);

CREATE POLICY "Allow delete access to company admins" ON public.inspection_items FOR DELETE
USING ((public.get_auth_role() IN ('super_admin', 'project_manager')) AND (company_id = public.get_auth_company_id() OR public.get_auth_role() = 'super_admin'));

-- Photos Policies
DROP POLICY IF EXISTS "Allow read access to photos for all" ON public.inspection_photos;
DROP POLICY IF EXISTS "Allow inserts to photos for authorized users" ON public.inspection_photos;
DROP POLICY IF EXISTS "Allow deletes of photos for admins, managers, or uploader" ON public.inspection_photos;

CREATE POLICY "Allow read of photos in company" ON public.inspection_photos FOR SELECT
USING (auth.uid() IS NOT NULL AND (company_id = public.get_auth_company_id() OR public.get_auth_role() = 'super_admin'));

CREATE POLICY "Allow inserts of photos in company" ON public.inspection_photos FOR INSERT
WITH CHECK (
    (company_id = public.get_auth_company_id() OR public.get_auth_role() = 'super_admin')
    AND (
        public.get_auth_role() IN ('super_admin', 'project_manager', 'site_engineer', 'qaqc_inspector')
        OR (public.get_auth_role() = 'contractor' AND uploaded_by = auth.uid())
    )
);

CREATE POLICY "Allow deletes of photos in company" ON public.inspection_photos FOR DELETE
USING (
    (company_id = public.get_auth_company_id() OR public.get_auth_role() = 'super_admin')
    AND (
        public.get_auth_role() IN ('super_admin', 'project_manager')
        OR uploaded_by = auth.uid()
    )
);

-- Comments Policies
DROP POLICY IF EXISTS "Allow read access to comments for all" ON public.inspection_comments;
DROP POLICY IF EXISTS "Allow insert of comments for all" ON public.inspection_comments;
DROP POLICY IF EXISTS "Allow update/delete to comment owner or admin" ON public.inspection_comments;

CREATE POLICY "Allow read comments in company" ON public.inspection_comments FOR SELECT
USING (auth.uid() IS NOT NULL AND (company_id = public.get_auth_company_id() OR public.get_auth_role() = 'super_admin'));

CREATE POLICY "Allow insert comments in company" ON public.inspection_comments FOR INSERT
WITH CHECK (
    (company_id = public.get_auth_company_id() OR public.get_auth_role() = 'super_admin')
    AND auth.uid() IS NOT NULL 
    AND user_id = auth.uid()
);

-- Project Documents Policies
CREATE POLICY "Allow read documents in company" ON public.project_documents FOR SELECT
USING (auth.uid() IS NOT NULL AND (company_id = public.get_auth_company_id() OR public.get_auth_role() = 'super_admin'));

CREATE POLICY "Allow write documents in company" ON public.project_documents FOR ALL
USING ((public.get_auth_role() IN ('super_admin', 'project_manager', 'site_engineer', 'qaqc_inspector')) AND (company_id = public.get_auth_company_id() OR public.get_auth_role() = 'super_admin'));

CREATE POLICY "Allow read folders in company" ON public.project_document_folders FOR SELECT
USING (auth.uid() IS NOT NULL AND (company_id = public.get_auth_company_id() OR public.get_auth_role() = 'super_admin'));

CREATE POLICY "Allow write folders in company" ON public.project_document_folders FOR ALL
USING ((public.get_auth_role() IN ('super_admin', 'project_manager', 'site_engineer', 'qaqc_inspector')) AND (company_id = public.get_auth_company_id() OR public.get_auth_role() = 'super_admin'));

-- Notifications Policies
DROP POLICY IF EXISTS "Allow read/write of notifications to self" ON public.notifications;
CREATE POLICY "Allow notifications management self" ON public.notifications FOR ALL
USING (auth.uid() = user_id AND (company_id = public.get_auth_company_id() OR public.get_auth_role() = 'super_admin'));
