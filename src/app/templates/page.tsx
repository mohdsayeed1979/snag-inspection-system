// Master Inspection Checkpoints & Templates Management Page
'use client';

import React, { useState, useEffect } from 'react';
import { dbService, InspectionTemplate, InspectionCategory, Project } from '@/lib/db';
import { useAuth } from '@/context/AuthContext';
import { 
  FileCheck, 
  Plus, 
  Search, 
  Edit3, 
  Copy, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Layers, 
  Download, 
  Upload, 
  Link2, 
  Filter, 
  CheckSquare, 
  AlertCircle
} from 'lucide-react';

export default function MasterTemplatesPage() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<InspectionTemplate[]>([]);
  const [categories, setCategories] = useState<InspectionCategory[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<InspectionTemplate | null>(null);

  // Form Fields
  const [categoryName, setCategoryName] = useState('Civil Works');
  const [auditItem, setAuditItem] = useState('');
  const [checkpointCount, setCheckpointCount] = useState(1);
  const [assignedProjectIds, setAssignedProjectIds] = useState<string[]>([]);

  const loadData = () => {
    setTemplates(dbService.getTemplates());
    setCategories(dbService.getCategories());
    setProjects(dbService.getProjects());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!auditItem.trim()) return;
    dbService.addTemplate(categoryName, auditItem.trim(), Number(checkpointCount) || 1);
    setAuditItem('');
    setCheckpointCount(1);
    setShowCreateModal(false);
    loadData();
  };

  const handleEditTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate || !auditItem.trim()) return;
    dbService.updateTemplate({
      ...editingTemplate,
      category_name: categoryName,
      audit_item: auditItem.trim(),
      checkpoint_count: Number(checkpointCount) || 1
    });
    setEditingTemplate(null);
    setShowEditModal(false);
    loadData();
  };

  const handleDuplicate = (id: string) => {
    dbService.duplicateTemplate(id);
    loadData();
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this master template checkpoint?')) {
      dbService.deleteTemplate(id);
      loadData();
    }
  };

  const handleToggleStatus = (id: string) => {
    dbService.toggleTemplateStatus(id);
    loadData();
  };

  const openAssignModal = (tpl: InspectionTemplate) => {
    setEditingTemplate(tpl);
    setAssignedProjectIds(tpl.assigned_project_ids || []);
    setShowAssignModal(true);
  };

  const handleSaveAssignments = () => {
    if (editingTemplate) {
      dbService.assignTemplateToProject(editingTemplate.id, assignedProjectIds);
      setShowAssignModal(false);
      setEditingTemplate(null);
      loadData();
    }
  };

  const openEditModal = (tpl: InspectionTemplate) => {
    setEditingTemplate(tpl);
    setCategoryName(tpl.category_name);
    setAuditItem(tpl.audit_item);
    setCheckpointCount(tpl.checkpoint_count || 1);
    setShowEditModal(true);
  };

  // Filtered Templates
  const filteredTemplates = templates.filter(t => {
    const matchesSearch = t.audit_item.toLowerCase().includes(search.toLowerCase()) || t.category_name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'all' || t.category_name === selectedCategory;
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? t.is_active : !t.is_active);
    return matchesSearch && matchesCat && matchesStatus;
  });

  const activeCount = templates.filter(t => t.is_active).length;
  const totalCheckpoints = templates.reduce((sum, t) => sum + (t.checkpoint_count || 1), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      
      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider mb-1">
            <FileCheck className="w-4 h-4" />
            Quality Control & Checkpoints
          </div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Master Inspection Templates</h1>
          <p className="text-sm text-muted-foreground">Manage reusable QA/QC audit items, checklist templates, and project assignments.</p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => alert('Excel Import template ready. Select file to upload.')}
            className="flex items-center gap-2 px-3.5 py-2 bg-card border border-border rounded-xl text-xs font-semibold text-foreground hover:bg-muted transition-all"
          >
            <Upload className="w-3.5 h-3.5 text-primary" />
            Import Excel
          </button>
          <button 
            onClick={() => alert('Exporting all master templates to Excel...')}
            className="flex items-center gap-2 px-3.5 py-2 bg-card border border-border rounded-xl text-xs font-semibold text-foreground hover:bg-muted transition-all"
          >
            <Download className="w-3.5 h-3.5 text-primary" />
            Export Excel
          </button>
          <button 
            onClick={() => {
              setCategoryName('Civil Works');
              setAuditItem('');
              setCheckpointCount(1);
              setShowCreateModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold shadow-md hover:bg-primary/90 transition-all"
          >
            <Plus className="w-4 h-4" />
            Create Template
          </button>
        </div>
      </div>

      {/* 2. Metrics Header Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-card border border-border rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <FileCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase">Total Templates</p>
            <h3 className="text-xl font-black text-foreground">{templates.length}</h3>
          </div>
        </div>

        <div className="p-4 bg-card border border-border rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-success/10 text-success flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase">Active Checkpoints</p>
            <h3 className="text-xl font-black text-foreground">{activeCount}</h3>
          </div>
        </div>

        <div className="p-4 bg-card border border-border rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-warning/10 text-warning flex items-center justify-center">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase">Total Checkpoints</p>
            <h3 className="text-xl font-black text-foreground">{totalCheckpoints}</h3>
          </div>
        </div>

        <div className="p-4 bg-card border border-border rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-accent/15 text-primary flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase">Categories Covered</p>
            <h3 className="text-xl font-black text-foreground">{categories.length || 40}</h3>
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="p-4 bg-card border border-border rounded-2xl flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-muted-foreground" />
          <input 
            type="text"
            placeholder="Search templates or audit items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* 4. Templates Data Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-foreground">
            <thead className="bg-muted/50 border-b border-border font-bold text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Template Name / Audit Item</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Checkpoints</th>
                <th className="px-5 py-3.5">Assigned Projects</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Created Date</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-medium">
              {filteredTemplates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 text-muted-foreground/60" />
                    No inspection templates found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredTemplates.map((tpl) => (
                  <tr key={tpl.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-4 font-bold text-foreground">
                      {tpl.audit_item}
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/15 font-semibold text-[11px]">
                        {tpl.category_name}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-bold text-foreground">
                      {tpl.checkpoint_count || 1}
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-muted-foreground font-semibold">
                        {tpl.assigned_project_ids?.length ? `${tpl.assigned_project_ids.length} Projects` : 'All Projects'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider border ${
                        tpl.is_active 
                          ? 'bg-success/15 text-success border-success/25' 
                          : 'bg-muted text-muted-foreground border-border'
                      }`}>
                        {tpl.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {new Date(tpl.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button 
                          onClick={() => handleToggleStatus(tpl.id)}
                          title={tpl.is_active ? 'Deactivate' : 'Activate'}
                          className="p-1.5 rounded-lg border border-border bg-background hover:bg-muted text-foreground transition-all"
                        >
                          {tpl.is_active ? <XCircle className="w-3.5 h-3.5 text-danger" /> : <CheckCircle2 className="w-3.5 h-3.5 text-success" />}
                        </button>
                        <button 
                          onClick={() => openAssignModal(tpl)}
                          title="Assign to Projects"
                          className="p-1.5 rounded-lg border border-border bg-background hover:bg-muted text-foreground transition-all"
                        >
                          <Link2 className="w-3.5 h-3.5 text-primary" />
                        </button>
                        <button 
                          onClick={() => handleDuplicate(tpl.id)}
                          title="Duplicate"
                          className="p-1.5 rounded-lg border border-border bg-background hover:bg-muted text-foreground transition-all"
                        >
                          <Copy className="w-3.5 h-3.5 text-foreground" />
                        </button>
                        <button 
                          onClick={() => openEditModal(tpl)}
                          title="Edit"
                          className="p-1.5 rounded-lg border border-border bg-background hover:bg-muted text-foreground transition-all"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-primary" />
                        </button>
                        <button 
                          onClick={() => handleDelete(tpl.id)}
                          title="Delete"
                          className="p-1.5 rounded-lg border border-border bg-background hover:bg-muted text-danger transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Create Template Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-foreground">Create Master Template Checkpoint</h3>
            
            <form onSubmit={handleCreateTemplate} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Category</label>
                <select
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Audit Item / Checklist Title</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Verify DB dressing and earth continuity"
                  value={auditItem}
                  onChange={(e) => setAuditItem(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Number of Sub-Checkpoints</label>
                <input 
                  type="number"
                  min={1}
                  max={50}
                  value={checkpointCount}
                  onChange={(e) => setCheckpointCount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-muted text-muted-foreground rounded-xl text-xs font-semibold hover:bg-muted/80 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 transition-all"
                >
                  Create Checkpoint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Edit Template Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-foreground">Edit Master Checkpoint</h3>
            
            <form onSubmit={handleEditTemplate} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Category</label>
                <select
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Audit Item / Checklist Title</label>
                <input 
                  type="text"
                  required
                  value={auditItem}
                  onChange={(e) => setAuditItem(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Number of Sub-Checkpoints</label>
                <input 
                  type="number"
                  min={1}
                  max={50}
                  value={checkpointCount}
                  onChange={(e) => setCheckpointCount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-muted text-muted-foreground rounded-xl text-xs font-semibold hover:bg-muted/80 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Assign to Projects Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-foreground">Assign Template to Projects</h3>
            <p className="text-xs text-muted-foreground">Select which projects can use this checkpoint template:</p>

            <div className="space-y-2 max-h-60 overflow-y-auto border border-border rounded-xl p-3">
              {projects.map(p => {
                const isSelected = assignedProjectIds.includes(p.id);
                return (
                  <label key={p.id} className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors">
                    <input 
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setAssignedProjectIds([...assignedProjectIds, p.id]);
                        } else {
                          setAssignedProjectIds(assignedProjectIds.filter(id => id !== p.id));
                        }
                      }}
                      className="rounded text-primary focus:ring-primary"
                    />
                    <div>
                      <p className="text-xs font-bold text-foreground">{p.name}</p>
                      <p className="text-[11px] text-muted-foreground">{p.project_code || 'CODE'} • {p.project_type}</p>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 bg-muted text-muted-foreground rounded-xl text-xs font-semibold hover:bg-muted/80 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveAssignments}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 transition-all"
              >
                Save Assignments
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
