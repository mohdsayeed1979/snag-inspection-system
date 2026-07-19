// Admin Control Panel (Categories, Templates, User Profiles, Company Settings)
'use client';

import React, { useState, useEffect } from 'react';
import { dbService, Profile, Project, Block, InspectionCategory, InspectionTemplate, Company } from '@/lib/db';
import { useAuth } from '@/context/AuthContext';
import { 
  ShieldAlert, 
  Building2, 
  Users, 
  FolderLock, 
  CheckSquare, 
  Plus, 
  Trash2, 
  Save, 
  Check,
  Building,
  Mail,
  Palette,
  Settings
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminPanel() {
  const { user, currentCompany, canManageSettings } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'users' | 'templates' | 'settings'>('templates');

  // DB Data States
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [categories, setCategories] = useState<InspectionCategory[]>([]);
  const [templates, setTemplates] = useState<InspectionTemplate[]>([]);
  
  // Forms states
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  const [newTemplateCat, setNewTemplateCat] = useState('');
  const [newTemplateItem, setNewTemplateItem] = useState('');

  // Company Settings Form State
  const [companyName, setCompanyName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [vatNumber, setVatNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#6A89A7');
  const [secondaryColor, setSecondaryColor] = useState('#E0E7FF');
  const [reportHeader, setReportHeader] = useState('');
  const [reportFooter, setReportFooter] = useState('');
  
  const [saveStatus, setSaveStatus] = useState(false);

  const loadData = () => {
    setProfiles(dbService.getProfiles());
    
    const cats = dbService.getCategories();
    setCategories(cats);
    if (cats.length > 0 && !newTemplateCat) {
      setNewTemplateCat(cats[0].name);
    }
    
    setTemplates(dbService.getTemplates());

    // Bind company settings
    if (currentCompany) {
      setCompanyName(currentCompany.name);
      setLogoUrl(currentCompany.logo_url || '');
      setRegNumber(currentCompany.registration_number || '');
      setVatNumber(currentCompany.vat_number || '');
      setPhone(currentCompany.phone || '');
      setEmail(currentCompany.email || '');
      setCountry(currentCompany.country || '');
      setCity(currentCompany.city || '');
      setPrimaryColor(currentCompany.primary_color || '#6A89A7');
      setSecondaryColor(currentCompany.secondary_color || '#E0E7FF');
      setReportHeader(currentCompany.report_header || '');
      setReportFooter(currentCompany.report_footer || '');
    }
  };

  useEffect(() => {
    // RLS validation
    if (user && !canManageSettings()) {
      router.push('/dashboard');
      return;
    }
    loadData();
  }, [user, currentCompany]);

  // Form actions
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName) return;

    dbService.addCategory(newCatName, newCatDesc);
    setNewCatName('');
    setNewCatDesc('');
    loadData();
  };

  const handleAddTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateCat || !newTemplateItem) return;

    dbService.addTemplate(newTemplateCat, newTemplateItem);
    setNewTemplateItem('');
    loadData();
  };

  const handleDeleteTemplate = (id: string) => {
    dbService.deleteTemplate(id);
    loadData();
  };

  // Switch simulated user role in public profiles
  const handleUserRoleChange = (userId: string, newRole: any) => {
    const list = JSON.parse(localStorage.getItem('snaglist_profiles') || '[]');
    const index = list.findIndex((p: any) => p.id === userId);
    if (index !== -1) {
      list[index].role = newRole;
      localStorage.setItem('snaglist_profiles', JSON.stringify(list));
      setProfiles(dbService.getProfiles());
      
      // If current user modified themselves, reload auth context
      const currentUserEmail = localStorage.getItem('snaglist_current_user_email');
      if (list[index].email === currentUserEmail) {
        window.location.reload(); // Quick refresh to re-evaluate context RLS rules
      }
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCompany) return;

    const updatedCompany: Company = {
      ...currentCompany,
      name: companyName,
      logo_url: logoUrl || undefined,
      registration_number: regNumber || undefined,
      vat_number: vatNumber || undefined,
      phone: phone || undefined,
      email: email || undefined,
      country: country || undefined,
      city: city || undefined,
      primary_color: primaryColor,
      secondary_color: secondaryColor,
      report_header: reportHeader || undefined,
      report_footer: reportFooter || undefined
    };

    dbService.updateCompanySettings(updatedCompany);
    setSaveStatus(true);
    setTimeout(() => {
      setSaveStatus(false);
      window.location.reload(); // refresh layout shell colors
    }, 1500);
  };

  const tabs = [
    { id: 'templates', name: 'Inspection Templates', icon: CheckSquare },
    { id: 'users', name: 'Users & Roles', icon: Users },
    { id: 'settings', name: 'Company Settings', icon: FolderLock }
  ] as const;

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      <div>
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-primary" /> Admin Control Panel
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">Manage checklist templates, database entities, roles, and settings.</p>
      </div>

      {/* Tab controls */}
      <div className="flex border-b border-border gap-1 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 rounded-t-xl text-xs font-semibold whitespace-nowrap transition-all border-b-2 ${
              activeTab === tab.id
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="w-4 h-4" /> {tab.name}
          </button>
        ))}
      </div>

      {/* TAB CONTENTS */}
      <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
        
        {/* 1. INSPECTION TEMPLATES */}
        {activeTab === 'templates' && (
          <div className="space-y-8 animate-in fade-in duration-150">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Category creation */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Add Checklist Category</h3>
                <form onSubmit={handleAddCategory} className="space-y-3 bg-muted/20 p-4 rounded-2xl border border-border">
                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Category Name</label>
                    <input
                      type="text"
                      placeholder="e.g. HVAC, External Works"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs text-foreground outline-none focus:border-primary"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Description</label>
                    <input
                      type="text"
                      placeholder="Category explanation"
                      value={newCatDesc}
                      onChange={(e) => setNewCatDesc(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs text-foreground outline-none focus:border-primary"
                    />
                  </div>
                  <button type="submit" className="w-full py-2 bg-primary hover:bg-primary/95 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-primary/10">
                    <Plus className="w-4 h-4" /> Create Category
                  </button>
                </form>
              </div>

              {/* Template check item creation */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Add Audit Specification Item</h3>
                <form onSubmit={handleAddTemplate} className="space-y-3 bg-muted/20 p-4 rounded-2xl border border-border">
                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Checklist Category</label>
                    <select
                      value={newTemplateCat}
                      onChange={(e) => setNewTemplateCat(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs text-foreground outline-none focus:border-primary"
                      required
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Check Item / Audit Specification</label>
                    <input
                      type="text"
                      placeholder="e.g. Inspect water pressure"
                      value={newTemplateItem}
                      onChange={(e) => setNewTemplateItem(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs text-foreground outline-none focus:border-primary"
                      required
                    />
                  </div>
                  <button type="submit" className="w-full py-2 bg-primary hover:bg-primary/95 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-primary/10">
                    <Plus className="w-4 h-4" /> Add Check Item
                  </button>
                </form>
              </div>
            </div>

            {/* Template checklist list */}
            <div className="space-y-3 pt-4 border-t border-border">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Default Template Checklist Matrix</h3>
              <div className="border border-border rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-muted/30 border-b border-border text-[10px] font-bold text-muted-foreground uppercase">
                      <th className="px-5 py-3.5">Category</th>
                      <th className="px-5 py-3.5">Audit Item Details</th>
                      <th className="px-5 py-3.5 text-center">Status</th>
                      <th className="px-5 py-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-foreground">
                    {templates.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-6 text-center text-muted-foreground">No template items registered yet.</td>
                      </tr>
                    ) : (
                      templates.map((t) => (
                        <tr key={t.id} className="hover:bg-muted/10">
                          <td className="px-5 py-3.5 font-bold text-primary">{t.category_name}</td>
                          <td className="px-5 py-3.5 font-medium">{t.audit_item}</td>
                          <td className="px-5 py-3.5 text-center">
                            <span className="bg-success/15 text-success text-[10px] font-bold px-2 py-0.5 rounded-full border border-success/20">
                              ACTIVE
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <button
                              onClick={() => handleDeleteTemplate(t.id)}
                              className="p-1 text-danger hover:bg-danger/10 rounded-lg transition-all"
                              title="Delete template item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 2. USERS & ROLES */}
        {activeTab === 'users' && (
          <div className="space-y-4 animate-in fade-in duration-150">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">User Management & Permissions Control</h3>
            <div className="border border-border rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-muted/30 border-b border-border text-[10px] font-bold text-muted-foreground uppercase">
                    <th className="px-5 py-3.5">Name</th>
                    <th className="px-5 py-3.5">Email</th>
                    <th className="px-5 py-3.5">Tenant Company</th>
                    <th className="px-5 py-3.5">Role Permission</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-foreground">
                  {profiles.map((p) => {
                    const comp = dbService.getCompanyById(p.company_id);
                    return (
                      <tr key={p.id} className="hover:bg-muted/10">
                        <td className="px-5 py-3.5 font-bold">{p.full_name}</td>
                        <td className="px-5 py-3.5 text-muted-foreground">{p.email}</td>
                        <td className="px-5 py-3.5 text-muted-foreground font-semibold">{comp ? comp.name : 'DEF_ORG'}</td>
                        <td className="px-5 py-3.5">
                          <select
                            value={p.role}
                            onChange={(e) => handleUserRoleChange(p.id, e.target.value)}
                            className="bg-background border border-border rounded-xl px-3 py-1.5 text-xs text-foreground font-semibold cursor-pointer outline-none focus:border-primary"
                          >
                            <option value="super_admin">Super Admin</option>
                            <option value="project_manager">Project Manager</option>
                            <option value="site_engineer">Site Engineer</option>
                            <option value="qaqc_inspector">QA/QC Inspector</option>
                            <option value="contractor">Contractor</option>
                            <option value="read_only">Read Only User</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="bg-muted/20 p-4 border border-border rounded-2xl mt-4">
              <p className="text-[10px] text-muted-foreground leading-normal">
                <span className="font-bold text-primary">Simulation Notice:</span> Changing a user's role immediately adjusts their RLS constraints and access rules. If you modify your own role, the application will refresh to apply the new permission level.
              </p>
            </div>
          </div>
        )}

        {/* 3. COMPANY SETTINGS */}
        {activeTab === 'settings' && (
          <form onSubmit={handleSaveSettings} className="space-y-8 animate-in fade-in duration-150">
            
            {/* Meta and branding split layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column - Core Meta Details */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Settings className="w-4 h-4 text-primary" />
                  Organization Details
                </h3>

                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1.5">Company Name</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs text-foreground outline-none focus:border-primary"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1.5">Registration Number</label>
                    <input
                      type="text"
                      placeholder="e.g. CR-40301294"
                      value={regNumber}
                      onChange={(e) => setRegNumber(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs text-foreground outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1.5">VAT Number</label>
                    <input
                      type="text"
                      placeholder="e.g. VAT-3004812"
                      value={vatNumber}
                      onChange={(e) => setVatNumber(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs text-foreground outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1.5">Contact Phone</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs text-foreground outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1.5">Contact Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs text-foreground outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1.5">Country</label>
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs text-foreground outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1.5">City</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs text-foreground outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column - Brand Customization */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Palette className="w-4 h-4 text-primary" />
                  Branding Customization
                </h3>

                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1.5">Company Logo Link (URL)</label>
                  <input
                    type="text"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs text-foreground outline-none focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1.5">Primary brand Color</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-8 h-8 rounded-lg outline-none cursor-pointer border border-border shrink-0"
                      />
                      <input
                        type="text"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl px-3 py-1.5 text-xs text-foreground outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1.5">Secondary brand Color</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="w-8 h-8 rounded-lg outline-none cursor-pointer border border-border shrink-0"
                      />
                      <input
                        type="text"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="w-full bg-background border border-border rounded-xl px-3 py-1.5 text-xs text-foreground outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* PDF Header / Footer customizations */}
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1.5">PDF Export Header Title</label>
                  <input
                    type="text"
                    value={reportHeader}
                    onChange={(e) => setReportHeader(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs text-foreground outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1.5">PDF Export Footer Notes</label>
                  <input
                    type="text"
                    value={reportFooter}
                    onChange={(e) => setReportFooter(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs text-foreground outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-4 border-t border-border">
              <button 
                type="submit" 
                className="flex items-center gap-2 bg-primary hover:bg-primary/95 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shadow-primary/10"
              >
                <Save className="w-4 h-4" /> Save Enterprise Settings
              </button>
              {saveStatus && (
                <span className="text-xs text-success font-bold flex items-center gap-1">
                  <Check className="w-4 h-4" /> Settings updated successfully!
                </span>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
