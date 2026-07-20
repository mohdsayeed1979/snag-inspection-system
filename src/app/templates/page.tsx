// Inspection Checklist Templates Management Page
'use client';

import React, { useState, useEffect } from 'react';
import { dbService, InspectionTemplate, Project, TemplateCheckpointItem } from '@/lib/db';
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
  ChevronDown,
  ChevronUp,
  Tag,
  BookOpen,
  Sparkles,
  Check,
  Building2,
  FolderOpen
} from 'lucide-react';

export default function InspectionChecklistTemplatesPage() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<InspectionTemplate[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Expanded Accordion State
  const [expandedTemplateId, setExpandedTemplateId] = useState<string | null>('tpl-1bhk-core');
  const [activeRoomTab, setActiveRoomTab] = useState<string>('Kitchen');

  // Modals State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<InspectionTemplate | null>(null);

  // Form Fields for Create / Edit
  const [formTitle, setFormTitle] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formVersion, setFormVersion] = useState('1.0');
  const [formPurpose, setFormPurpose] = useState('');
  const [formRooms, setFormRooms] = useState('Entrance, Hall, Bedroom, Kitchen, Bathroom, Balcony, Electrical DB');
  const [formCategories, setFormCategories] = useState('Civil, Architectural, Paint, Tiles, Plumbing, Electrical');
  
  // Checkpoints Editor State
  const [formCheckpoints, setFormCheckpoints] = useState<TemplateCheckpointItem[]>([]);
  const [newCpRoom, setNewCpRoom] = useState('Kitchen');
  const [newCpCat, setNewCpCat] = useState('Plumbing');
  const [newCpItem, setNewCpItem] = useState('');

  // Assign Modal State
  const [assignedProjectIds, setAssignedProjectIds] = useState<string[]>([]);

  const loadData = () => {
    const list = dbService.getTemplates();
    setTemplates(list);
    setProjects(dbService.getProjects());
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setFormTitle('');
    setFormCode(`TPL-${Math.floor(100 + Math.random() * 900)}`);
    setFormVersion('1.0');
    setFormPurpose('Standard residential unit QA/QC inspection checklist.');
    setFormRooms('Entrance, Hall, Bedroom, Kitchen, Bathroom, Balcony, Electrical DB');
    setFormCategories('Civil, Architectural, Paint, Tiles, Plumbing, Electrical');
    setFormCheckpoints([
      { id: 'cp-new-1', room_name: 'Kitchen', category_name: 'Kitchen', audit_item: 'Cabinet Door Alignment & Hydraulic Hinge Test' },
      { id: 'cp-new-2', room_name: 'Kitchen', category_name: 'Plumbing', audit_item: 'Sink Installation & Under-Sink Drain Leak Inspection' },
      { id: 'cp-new-3', room_name: 'Bathroom', category_name: 'Plumbing', audit_item: 'Wash Basin & Vanity Tap Pressure Test' }
    ]);
    setShowCreateModal(true);
  };

  const openEditModal = (tpl: InspectionTemplate) => {
    setEditingTemplate(tpl);
    setFormTitle(tpl.title || tpl.audit_item || 'Inspection Checklist Template');
    setFormCode(tpl.code || 'TPL-STD');
    setFormVersion(tpl.version || '1.0');
    setFormPurpose(tpl.purpose || 'QA/QC Inspection Checklist');
    setFormRooms((tpl.rooms || ['General']).join(', '));
    setFormCategories((tpl.categories || ['Civil', 'Architectural']).join(', '));
    setFormCheckpoints(tpl.checkpoints || []);
    setShowEditModal(true);
  };

  const handleAddCheckpointToForm = () => {
    if (!newCpItem.trim()) return;
    setFormCheckpoints([
      ...formCheckpoints,
      {
        id: `cp-form-${Date.now()}`,
        room_name: newCpRoom.trim() || 'General',
        category_name: newCpCat.trim() || 'Civil',
        audit_item: newCpItem.trim()
      }
    ]);
    setNewCpItem('');
  };

  const handleRemoveCheckpointFromForm = (id: string) => {
    setFormCheckpoints(formCheckpoints.filter(c => c.id !== id));
  };

  const handleSaveCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const roomsArr = formRooms.split(',').map(r => r.trim()).filter(r => r.length > 0);
    const catsArr = formCategories.split(',').map(c => c.trim()).filter(c => c.length > 0);

    dbService.addChecklistTemplate({
      title: formTitle.trim(),
      code: formCode.trim() || 'TPL-STD',
      version: formVersion.trim() || '1.0',
      purpose: formPurpose.trim(),
      rooms: roomsArr,
      categories: catsArr,
      checkpoints: formCheckpoints,
      checkpoint_count: formCheckpoints.length
    });

    setShowCreateModal(false);
    loadData();
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate || !formTitle.trim()) return;

    const roomsArr = formRooms.split(',').map(r => r.trim()).filter(r => r.length > 0);
    const catsArr = formCategories.split(',').map(c => c.trim()).filter(c => c.length > 0);

    dbService.updateTemplate({
      ...editingTemplate,
      title: formTitle.trim(),
      code: formCode.trim(),
      version: formVersion.trim(),
      purpose: formPurpose.trim(),
      rooms: roomsArr,
      categories: catsArr,
      checkpoints: formCheckpoints,
      checkpoint_count: formCheckpoints.length
    });

    setShowEditModal(false);
    setEditingTemplate(null);
    loadData();
  };

  const handleDuplicate = (id: string) => {
    dbService.duplicateTemplate(id);
    loadData();
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this Inspection Checklist Template?')) {
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

  const handleSaveAssignments = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate) return;
    dbService.assignTemplateToProject(editingTemplate.id, assignedProjectIds);
    setShowAssignModal(false);
    setEditingTemplate(null);
    loadData();
  };

  const handleExportExcel = (tpl: InspectionTemplate) => {
    alert(`Exporting "${tpl.title} (${tpl.version})" Matrix to Excel (.XLSX)...`);
  };

  const filteredTemplates = templates.filter(t => {
    const titleMatch = (t.title || t.audit_item || '').toLowerCase().includes(search.toLowerCase()) ||
                       (t.code || '').toLowerCase().includes(search.toLowerCase()) ||
                       (t.purpose || '').toLowerCase().includes(search.toLowerCase());
    const statusMatch = statusFilter === 'all' || 
                        (statusFilter === 'active' && t.is_active) ||
                        (statusFilter === 'archived' && !t.is_active);
    return titleMatch && statusMatch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider mb-1">
            <FileCheck className="w-4 h-4" />
            Standard Operating Quality Procedures
          </div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Inspection Checklist Templates</h1>
          <p className="text-sm text-muted-foreground">Reusable QA/QC inspection checklist suites with room-wise structure, categories, and versioning.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-primary text-primary-foreground font-extrabold text-xs rounded-xl shadow-md hover:bg-primary/90 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            Create Inspection Checklist Template
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 bg-card border border-border rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search templates by title, code (TPL-1BHK), room, or purpose..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground font-semibold outline-none focus:ring-2 focus:ring-primary cursor-pointer"
          >
            <option value="all">All Template Statuses</option>
            <option value="active">Active Only</option>
            <option value="archived">Archived Only</option>
          </select>
        </div>
      </div>

      {/* Template Cards List */}
      <div className="space-y-4">
        {filteredTemplates.map((tpl) => {
          const isExpanded = expandedTemplateId === tpl.id;
          const cps = tpl.checkpoints || [];
          const roomsList = tpl.rooms || ['General'];
          const activeRoomCps = cps.filter(c => c.room_name.toLowerCase() === activeRoomTab.toLowerCase() || activeRoomTab === 'All');

          return (
            <div 
              key={tpl.id}
              className={`bg-card border rounded-3xl overflow-hidden shadow-sm transition-all ${
                isExpanded ? 'border-primary ring-2 ring-primary/10' : 'border-border hover:border-primary/40'
              }`}
            >
              {/* Card Header Row */}
              <div className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border bg-muted/20">
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-lg bg-primary/10 text-primary font-black text-[10px] uppercase">
                      {tpl.code || 'TPL-STD'}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-secondary text-primary font-bold text-[10px]">
                      v{tpl.version || '1.0'}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      tpl.is_active ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'
                    }`}>
                      {tpl.is_active ? 'Active' : 'Archived'}
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold text-foreground truncate">{tpl.title || tpl.audit_item}</h3>
                  <p className="text-xs text-muted-foreground">{tpl.purpose || 'Standard QA/QC Inspection Checklist Suite'}</p>

                  {/* Rooms Badge Bar */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase mr-1">Rooms:</span>
                    {roomsList.map(r => (
                      <span key={r} className="px-2 py-0.5 bg-background border border-border rounded-md text-[10px] font-semibold text-foreground">
                        {r}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Card Right Actions */}
                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  <button
                    onClick={() => {
                      if (isExpanded) {
                        setExpandedTemplateId(null);
                      } else {
                        setExpandedTemplateId(tpl.id);
                        if (roomsList.length > 0) setActiveRoomTab(roomsList[0]);
                      }
                    }}
                    className="px-3.5 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <Layers className="w-4 h-4" />
                    {isExpanded ? 'Hide Checkpoints' : 'View Room Checkpoints'}
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={() => openAssignModal(tpl)}
                    className="px-3 py-2 bg-card border border-border text-foreground hover:bg-muted rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
                  >
                    <Link2 className="w-3.5 h-3.5 text-primary" />
                    Assign ({tpl.assigned_project_ids?.length || 0})
                  </button>

                  <button
                    onClick={() => openEditModal(tpl)}
                    className="p-2 border border-border rounded-xl hover:bg-muted text-muted-foreground"
                    title="Edit Template"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDuplicate(tpl.id)}
                    className="p-2 border border-border rounded-xl hover:bg-muted text-muted-foreground"
                    title="Duplicate Template"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleToggleStatus(tpl.id)}
                    className="p-2 border border-border rounded-xl hover:bg-muted text-muted-foreground"
                    title={tpl.is_active ? 'Archive Template' : 'Activate Template'}
                  >
                    {tpl.is_active ? <XCircle className="w-4 h-4 text-warning" /> : <CheckCircle2 className="w-4 h-4 text-success" />}
                  </button>

                  <button
                    onClick={() => handleDelete(tpl.id)}
                    className="p-2 border border-border rounded-xl hover:bg-muted text-danger"
                    title="Delete Template"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Expandable Room-Wise Checkpoints Accordion */}
              {isExpanded && (
                <div className="p-5 bg-background border-t border-border space-y-4 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <h4 className="text-xs font-extrabold uppercase text-foreground tracking-wider flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      Room-Wise Checkpoints Matrix ({cps.length} Items Total)
                    </h4>

                    <button
                      onClick={() => handleExportExcel(tpl)}
                      className="px-3 py-1 bg-secondary text-primary rounded-lg text-xs font-bold flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Export Matrix (.XLSX)
                    </button>
                  </div>

                  {/* Room Selection Tabs */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {roomsList.map(room => (
                      <button
                        key={room}
                        onClick={() => setActiveRoomTab(room)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                          activeRoomTab === room
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'bg-card border border-border text-foreground hover:bg-muted'
                        }`}
                      >
                        {room} ({cps.filter(c => c.room_name.toLowerCase() === room.toLowerCase()).length})
                      </button>
                    ))}
                  </div>

                  {/* Checkpoints List for Active Room */}
                  <div className="space-y-2">
                    {activeRoomCps.map((cp, idx) => (
                      <div key={cp.id || idx} className="p-3 bg-card border border-border rounded-xl flex items-center justify-between text-xs gap-3">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary font-black flex items-center justify-center text-[10px]">
                            {idx + 1}
                          </span>
                          <div>
                            <span className="font-bold text-foreground block">{cp.audit_item}</span>
                            <span className="text-[10px] text-muted-foreground font-semibold">
                              Room: <strong className="text-foreground">{cp.room_name}</strong> | Category: <span className="text-primary">{cp.category_name}</span>
                            </span>
                          </div>
                        </div>

                        <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground font-bold text-[10px] uppercase">
                          Standard Check
                        </span>
                      </div>
                    ))}

                    {activeRoomCps.length === 0 && (
                      <div className="p-6 text-center text-xs text-muted-foreground bg-muted/10 rounded-xl border border-dashed border-border">
                        No specific checkpoints configured for room "{activeRoomTab}".
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          );
        })}

        {filteredTemplates.length === 0 && (
          <div className="bg-card border border-border rounded-3xl p-12 text-center text-muted-foreground space-y-3">
            <FileCheck className="w-12 h-12 text-muted-foreground mx-auto" />
            <p className="text-sm font-semibold">No Inspection Checklist Templates found matching filters.</p>
          </div>
        )}
      </div>

      {/* CREATE / EDIT TEMPLATE MODAL */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <h3 className="text-base font-extrabold text-foreground">
              {showCreateModal ? 'Create Inspection Checklist Template' : 'Edit Inspection Checklist Template'}
            </h3>

            <form onSubmit={showCreateModal ? handleSaveCreate : handleSaveEdit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Template Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hotel Suite QA/QC Inspection Checklist"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Template Code & Version</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="TPL-HTL"
                      value={formCode}
                      onChange={(e) => setFormCode(e.target.value)}
                      className="w-1/2 bg-background border border-border rounded-xl px-2.5 py-2 font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary text-center"
                    />
                    <input
                      type="text"
                      placeholder="1.0"
                      value={formVersion}
                      onChange={(e) => setFormVersion(e.target.value)}
                      className="w-1/2 bg-background border border-border rounded-xl px-2.5 py-2 font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary text-center"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Purpose / Scope Description</label>
                <textarea
                  rows={2}
                  placeholder="Specify intended usage and scope of this template..."
                  value={formPurpose}
                  onChange={(e) => setFormPurpose(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Included Rooms / Areas (Comma Separated)</label>
                <input
                  type="text"
                  placeholder="Entrance, Hall, Bedroom, Kitchen, Bathroom, Balcony, Electrical DB"
                  value={formRooms}
                  onChange={(e) => setFormRooms(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Checkpoints Add Editor */}
              <div className="border-t border-border pt-3 space-y-3">
                <span className="text-[10px] font-extrabold uppercase text-primary tracking-wider block">Add Checkpoints to Template</span>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                  <input
                    type="text"
                    placeholder="Room (e.g. Kitchen)"
                    value={newCpRoom}
                    onChange={(e) => setNewCpRoom(e.target.value)}
                    className="bg-background border border-border rounded-xl px-3 py-1.5 text-xs text-foreground"
                  />
                  <input
                    type="text"
                    placeholder="Category (e.g. Plumbing)"
                    value={newCpCat}
                    onChange={(e) => setNewCpCat(e.target.value)}
                    className="bg-background border border-border rounded-xl px-3 py-1.5 text-xs text-foreground"
                  />
                  <input
                    type="text"
                    placeholder="Checkpoint Title (e.g. Sink Leak Test)"
                    value={newCpItem}
                    onChange={(e) => setNewCpItem(e.target.value)}
                    className="bg-background border border-border rounded-xl px-3 py-1.5 text-xs text-foreground md:col-span-2"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAddCheckpointToForm}
                  className="px-3 py-1.5 bg-primary/10 text-primary font-extrabold text-xs rounded-xl hover:bg-primary/20 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Checkpoint to Template
                </button>

                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {formCheckpoints.map(cp => (
                    <div key={cp.id} className="p-2 bg-muted/20 border border-border rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <strong className="text-foreground">{cp.audit_item}</strong>
                        <span className="text-[10px] text-muted-foreground block">Room: {cp.room_name} | Cat: {cp.category_name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveCheckpointFromForm(cp.id)}
                        className="text-danger p-1 hover:bg-danger/10 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); setShowEditModal(false); }}
                  className="px-4 py-2 bg-muted text-muted-foreground font-semibold rounded-xl hover:bg-muted/80"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary text-primary-foreground font-bold rounded-xl shadow-md hover:bg-primary/90"
                >
                  Save Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN TEMPLATE TO PROJECTS MODAL */}
      {showAssignModal && editingTemplate && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div>
              <h3 className="text-base font-extrabold text-foreground">Assign Template to Projects</h3>
              <p className="text-xs text-muted-foreground">Select projects that will use "{editingTemplate.title}".</p>
            </div>

            <form onSubmit={handleSaveAssignments} className="space-y-4 text-xs">
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {projects.map(p => {
                  const isAssigned = assignedProjectIds.includes(p.id);
                  return (
                    <label key={p.id} className="p-3 bg-muted/20 border border-border rounded-xl flex items-center gap-3 cursor-pointer hover:bg-muted/40">
                      <input
                        type="checkbox"
                        checked={isAssigned}
                        onChange={(e) => {
                          if (e.target.checked) setAssignedProjectIds([...assignedProjectIds, p.id]);
                          else setAssignedProjectIds(assignedProjectIds.filter(id => id !== p.id));
                        }}
                        className="rounded text-primary focus:ring-primary"
                      />
                      <div>
                        <p className="font-bold text-foreground">{p.name}</p>
                        <span className="text-[10px] text-muted-foreground">Type: {p.project_type.toUpperCase()} | Code: {p.project_code}</span>
                      </div>
                    </label>
                  );
                })}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 bg-muted text-muted-foreground font-semibold rounded-xl hover:bg-muted/80"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary text-primary-foreground font-bold rounded-xl shadow-md hover:bg-primary/90"
                >
                  Save Project Assignments
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
