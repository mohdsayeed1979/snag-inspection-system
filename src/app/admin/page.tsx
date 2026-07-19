// Admin Control Panel (Categories, Templates, User Profiles, Settings)
'use client';

import React, { useState, useEffect } from 'react';
import { dbService, Profile, Project, Block, InspectionCategory, InspectionTemplate, Villa } from '@/lib/db';
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
  Mail
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminPanel() {
  const { user, canManageSettings } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'projects' | 'users' | 'templates' | 'settings'>('templates');

  // DB Data States
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [categories, setCategories] = useState<InspectionCategory[]>([]);
  const [templates, setTemplates] = useState<InspectionTemplate[]>([]);
  
  // Forms states
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  const [newTemplateCat, setNewTemplateCat] = useState('');
  const [newTemplateItem, setNewTemplateItem] = useState('');

  const [newBlockName, setNewBlockName] = useState('');
  const [newBlockDesc, setNewBlockDesc] = useState('');

  // Company Settings State
  const [companyName, setCompanyName] = useState('Villa Snag Ltd');
  const [consultantName, setConsultantName] = useState('Khatib & Alami');
  const [logoUrl, setLogoUrl] = useState('https://images.unsplash.com/photo-1590483736148-3c1a5e59b994?auto=format&fit=crop&w=150&q=80');
  const [emailTemplate, setEmailTemplate] = useState('Dear Contractor,\n\nA new snag item has been recorded. Please check and rectify.');
  const [saveStatus, setSaveStatus] = useState(false);

  const loadData = () => {
    setProfiles(dbService.getProfiles());
    setProjects(dbService.getProjects());
    setBlocks(dbService.getBlocks());
    
    const cats = dbService.getCategories();
    setCategories(cats);
    if (cats.length > 0 && !newTemplateCat) {
      setNewTemplateCat(cats[0].name);
    }
    
    setTemplates(dbService.getTemplates());
  };

  useEffect(() => {
    // RLS validation
    if (user && !canManageSettings()) {
      router.push('/dashboard');
      return;
    }
    loadData();
  }, [user]);

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

  const handleAddBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlockName || projects.length === 0) return;

    dbService.addBlock({
      project_id: projects[0].id,
      name: newBlockName,
      description: newBlockDesc
    });

    setNewBlockName('');
    setNewBlockDesc('');
    loadData();
  };

  // Switch simulated user role in public profiles
  const handleUserRoleChange = (userId: string, newRole: any) => {
    const list = [...profiles];
    const index = list.findIndex(p => p.id === userId);
    if (index !== -1) {
      list[index].role = newRole;
      setProfiles(list);
      localStorage.setItem('snaglist_profiles', JSON.stringify(list));
      
      // If current user modified themselves, reload auth context
      const currentUserEmail = localStorage.getItem('snaglist_current_user_email');
      if (list[index].email === currentUserEmail) {
        window.location.reload(); // Quick refresh to re-evaluate context RLS rules
      }
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus(true);
    setTimeout(() => setSaveStatus(false), 2000);
  };

  const tabs = [
    { id: 'templates', name: 'Inspection Templates', icon: CheckSquare },
    { id: 'users', name: 'Users & Roles', icon: Users },
    { id: 'projects', name: 'Projects & Blocks', icon: Building2 },
    { id: 'settings', name: 'Company Settings', icon: FolderLock }
  ] as const;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
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
          <div className="space-y-8">
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
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">User Management & Permissions Control</h3>
            <div className="border border-border rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-muted/30 border-b border-border text-[10px] font-bold text-muted-foreground uppercase">
                    <th className="px-5 py-3.5">Name</th>
                    <th className="px-5 py-3.5">Email</th>
                    <th className="px-5 py-3.5">Phone</th>
                    <th className="px-5 py-3.5">Role Permission</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-foreground">
                  {profiles.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/10">
                      <td className="px-5 py-3.5 font-bold">{p.full_name}</td>
                      <td className="px-5 py-3.5 text-muted-foreground">{p.email}</td>
                      <td className="px-5 py-3.5 text-muted-foreground">{p.phone || 'No phone'}</td>
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
                  ))}
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

        {/* 3. PROJECTS & BLOCKS */}
        {activeTab === 'projects' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Active Projects</h3>
              {projects.map((proj) => (
                <div key={proj.id} className="p-4 border border-border rounded-2xl mt-3 flex justify-between items-center bg-muted/10">
                  <div>
                    <h4 className="text-sm font-bold text-foreground">{proj.name}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{proj.description}</p>
                    <div className="mt-2 text-[10px] text-muted-foreground space-x-4">
                      <span>Owner: <strong>{proj.owner}</strong></span>
                      <span>Contractor: <strong>{proj.contractor}</strong></span>
                      <span>Consultant: <strong>{proj.consultant}</strong></span>
                    </div>
                  </div>
                  <div className="bg-primary/10 text-primary font-black px-4 py-2 rounded-xl text-sm border border-primary/25">
                    {proj.completion_rate}%
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-border space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Add New Block Sector</h3>
              <form onSubmit={handleAddBlock} className="space-y-3 bg-muted/20 p-4 rounded-2xl border border-border max-w-lg">
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Block Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Block D"
                    value={newBlockName}
                    onChange={(e) => setNewBlockName(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs text-foreground outline-none focus:border-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Description / Sector Scope</label>
                  <input
                    type="text"
                    placeholder="e.g. Garden Sector Villas"
                    value={newBlockDesc}
                    onChange={(e) => setNewBlockDesc(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs text-foreground outline-none focus:border-primary"
                  />
                </div>
                <button type="submit" className="w-full py-2 bg-primary hover:bg-primary/95 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-primary/10">
                  <Plus className="w-4 h-4" /> Create Block Sector
                </button>
              </form>

              {/* Display existing blocks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                {blocks.map((b) => (
                  <div key={b.id} className="p-3 bg-background border border-border rounded-xl">
                    <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-primary" /> {b.name}
                    </h4>
                    <p className="text-[10px] text-muted-foreground mt-1">{b.description || 'No description'}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 4. COMPANY SETTINGS */}
        {activeTab === 'settings' && (
          <form onSubmit={handleSaveSettings} className="space-y-6 max-w-xl">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Enterprise Logo & Branding Settings</h3>
              
              <div className="space-y-4">
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

                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1.5">Lead Consultant Name</label>
                  <input
                    type="text"
                    value={consultantName}
                    onChange={(e) => setConsultantName(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs text-foreground outline-none focus:border-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1.5">Branding Logo URL</label>
                  <input
                    type="text"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs text-foreground outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1.5 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" /> Email Notification Template
                  </label>
                  <textarea
                    value={emailTemplate}
                    onChange={(e) => setEmailTemplate(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground outline-none focus:border-primary h-24"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-4 border-t border-border">
              <button 
                type="submit" 
                className="flex items-center gap-2 bg-primary hover:bg-primary/95 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shadow-primary/10"
              >
                <Save className="w-4 h-4" /> Save Settings
              </button>
              {saveStatus && (
                <span className="text-xs text-success font-bold flex items-center gap-1">
                  <Check className="w-4 h-4" /> Settings updated successfully
                </span>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
