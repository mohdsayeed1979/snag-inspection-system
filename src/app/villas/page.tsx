// Enterprise Projects Explorer with complete Project Lifecycle Management & Safeguarded Deletion
'use client';

import React, { useState, useEffect } from 'react';
import { dbService, Project, ProjectNode } from '@/lib/db';
import { useAuth } from '@/context/AuthContext';
import { ProjectWizardModal } from '@/components/project-wizard-modal';
import { 
  Search, 
  Building2, 
  Plus, 
  User, 
  HardHat, 
  Briefcase,
  AlertCircle,
  FolderOpen,
  Calendar,
  Grid,
  MapPin,
  Sparkles,
  Edit3,
  Copy,
  Archive,
  RotateCcw,
  Trash2,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Wand2
} from 'lucide-react';
import Link from 'next/link';

export default function ProjectsPage() {
  const { user, currentCompany } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [nodes, setNodes] = useState<ProjectNode[]>([]);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal / Add Project form state
  const [showWizardModal, setShowWizardModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Form Fields
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newOwner, setNewOwner] = useState('');
  const [newContractor, setNewContractor] = useState('');
  const [newConsultant, setNewConsultant] = useState('');
  const [newEngineer, setNewEngineer] = useState('');
  const [newSubcontractors, setNewSubcontractors] = useState('');
  const [newPM, setNewPM] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newProjectType, setNewProjectType] = useState<Project['project_type']>('villa');
  const [newLevels, setNewLevels] = useState<string>('Block, Villa');
  const [newLocation, setNewLocation] = useState('');
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [newLogoUrl, setNewLogoUrl] = useState('');
  const [newStatus, setNewStatus] = useState<'active' | 'archived' | 'completed' | 'on_hold'>('active');

  const loadData = async () => {
    await dbService.syncFromCloud();
    setProjects(dbService.getProjects());
    setNodes(dbService.getProjectNodes());
  };

  useEffect(() => {
    loadData();
  }, [currentCompany]);

  // Handle template level autofills based on project type selection
  useEffect(() => {
    switch (newProjectType) {
      case 'hotel': setNewLevels('Tower, Floor, Room'); break;
      case 'apartment': setNewLevels('Block, Floor, Apartment'); break;
      case 'hospital': setNewLevels('Building, Floor, Room'); break;
      case 'mall': setNewLevels('Block, Shop'); break;
      case 'warehouse': setNewLevels('Zone, Rack'); break;
      case 'factory': setNewLevels('Area, Machine'); break;
      case 'road': setNewLevels('Section, Chainage'); break;
      case 'villa': default: setNewLevels('Block, Villa'); break;
    }
  }, [newProjectType]);

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newCode) return;

    const levelsArr = newLevels.split(',').map(l => l.trim()).filter(l => l.length > 0);
    const companyId = currentCompany?.id || 'c0000000-0000-0000-0000-000000000000';

    dbService.addProject({
      company_id: companyId,
      name: newName,
      project_code: newCode,
      description: newDesc,
      owner: newOwner,
      contractor: newContractor,
      consultant: newConsultant,
      engineer: newEngineer,
      subcontractors: newSubcontractors,
      project_manager: newPM,
      notes: newNotes,
      project_type: newProjectType,
      level_structure: levelsArr.length > 0 ? levelsArr : ['Block', 'Villa'],
      location: newLocation || 'Saudi Arabia',
      start_date: newStartDate,
      expected_completion: newEndDate,
      project_logo: newLogoUrl,
      status: newStatus
    });

    setShowAddModal(false);
    resetForm();
    loadData();
  };

  const openEditModal = (proj: Project) => {
    setSelectedProject(proj);
    setNewName(proj.name);
    setNewCode(proj.project_code || '');
    setNewDesc(proj.description || '');
    setNewOwner(proj.owner || '');
    setNewContractor(proj.contractor || '');
    setNewConsultant(proj.consultant || '');
    setNewEngineer(proj.engineer || '');
    setNewSubcontractors(proj.subcontractors || '');
    setNewPM(proj.project_manager || '');
    setNewNotes(proj.notes || '');
    setNewProjectType(proj.project_type);
    setNewLevels((proj.level_structure || ['Block', 'Villa']).join(', '));
    setNewLocation(proj.location || '');
    setNewStartDate(proj.start_date || '');
    setNewEndDate(proj.expected_completion || '');
    setNewLogoUrl(proj.project_logo || '');
    setNewStatus(proj.status || 'active');
    setShowEditModal(true);
  };

  const handleEditProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !newName || !newCode) return;

    const levelsArr = newLevels.split(',').map(l => l.trim()).filter(l => l.length > 0);

    dbService.updateProject({
      ...selectedProject,
      name: newName,
      project_code: newCode,
      description: newDesc,
      owner: newOwner,
      contractor: newContractor,
      consultant: newConsultant,
      engineer: newEngineer,
      subcontractors: newSubcontractors,
      project_manager: newPM,
      notes: newNotes,
      project_type: newProjectType,
      level_structure: levelsArr.length > 0 ? levelsArr : ['Block', 'Villa'],
      location: newLocation,
      start_date: newStartDate,
      expected_completion: newEndDate,
      project_logo: newLogoUrl,
      status: newStatus
    });

    setShowEditModal(false);
    setSelectedProject(null);
    resetForm();
    loadData();
  };

  const handleDuplicate = (id: string) => {
    dbService.duplicateProject(id);
    loadData();
  };

  const handleToggleArchive = (proj: Project) => {
    if (proj.status === 'archived') {
      dbService.unarchiveProject(proj.id);
    } else {
      dbService.archiveProject(proj.id);
    }
    loadData();
  };

  const openDeleteModal = (proj: Project) => {
    setSelectedProject(proj);
    setShowDeleteModal(true);
  };

  const confirmDeleteProject = (forceDelete: boolean = false) => {
    if (!selectedProject) return;
    const res = dbService.deleteProjectSafely(selectedProject.id, forceDelete);
    alert(res.message);
    setShowDeleteModal(false);
    setSelectedProject(null);
    loadData();
  };

  const resetForm = () => {
    setNewName('');
    setNewCode('');
    setNewDesc('');
    setNewOwner('');
    setNewContractor('');
    setNewConsultant('');
    setNewEngineer('');
    setNewSubcontractors('');
    setNewPM('');
    setNewNotes('');
    setNewLocation('');
    setNewStartDate('');
    setNewEndDate('');
    setNewLogoUrl('');
    setNewStatus('active');
  };

  // Filter projects
  const filteredProjects = projects.filter(proj => {
    const matchesQuery = proj.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (proj.project_code && proj.project_code.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (proj.contractor && proj.contractor.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = selectedType === 'all' || proj.project_type === selectedType;
    const matchesStatus = statusFilter === 'all' || (proj.status || 'active') === statusFilter;
    return matchesQuery && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      
      {/* 1. Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4" />
            Enterprise Project Explorer
          </div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Project Inspection Hub</h1>
          <p className="text-sm text-muted-foreground">Manage multi-tenant inspection projects, structural levels, and project lifecycle controls.</p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <button 
            onClick={() => setShowWizardModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary to-accent text-primary-foreground font-black text-xs rounded-xl shadow-lg hover:brightness-110 transition-all"
          >
            <Wand2 className="w-4 h-4" />
            Launch 5-Min Project Setup Wizard
          </button>

          <button 
            onClick={() => { resetForm(); setShowAddModal(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border text-foreground font-bold text-xs rounded-xl hover:bg-muted transition-all"
          >
            <Plus className="w-4 h-4" />
            Manual Create
          </button>
        </div>
      </div>

      {/* 2. Search & Filters Bar */}
      <div className="p-4 bg-card border border-border rounded-2xl flex flex-col md:flex-row items-center gap-3 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by project name, project code, contractor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Project Types</option>
            <option value="villa">Residential Villa Compound</option>
            <option value="apartment">Apartment Building</option>
            <option value="hotel">Hotel</option>
            <option value="hospital">Hospital</option>
            <option value="mall">Shopping Mall</option>
            <option value="warehouse">Warehouse</option>
            <option value="factory">Factory</option>
            <option value="road">Road Project</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="archived">Archived Only</option>
            <option value="completed">Completed Only</option>
          </select>
        </div>
      </div>

      {/* 3. Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProjects.map((proj) => {
          let progressColor = 'bg-muted';
          if (proj.completion_rate > 0 && proj.completion_rate < 100) progressColor = 'bg-warning';
          else if (proj.completion_rate === 100) progressColor = 'bg-success';

          return (
            <div key={proj.id} className="bg-card border border-border p-5 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] font-black uppercase text-primary tracking-widest px-2 py-0.5 rounded bg-primary/10">
                      {proj.project_type}
                    </span>
                    <h3 className="text-base font-extrabold text-foreground truncate mt-1.5 max-w-[190px]">{proj.name}</h3>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      proj.completion_rate === 100 ? 'bg-success/15 text-success border border-success/20' : 
                      proj.completion_rate > 0 ? 'bg-warning/15 text-warning border border-warning/20' : 
                      'bg-muted-foreground/10 text-muted-foreground'
                    }`}>
                      {proj.completion_rate}%
                    </span>
                    <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded ${
                      proj.status === 'archived' ? 'bg-danger/15 text-danger' : 'bg-success/10 text-success'
                    }`}>
                      {proj.status || 'Active'}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground line-clamp-2 h-8 leading-relaxed">
                  {proj.description || 'No description provided.'}
                </p>

                {/* Progress bar */}
                <div className="w-full bg-muted/60 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${progressColor} transition-all duration-300`} 
                    style={{ width: `${proj.completion_rate}%` }}
                  />
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 gap-2 pt-2 text-[10px] text-muted-foreground">
                  <div className="flex items-center gap-1.5 truncate">
                    <HardHat className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>Contractor: <strong>{proj.contractor || 'TBD'}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <Briefcase className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>Consultant: <strong>{proj.consultant || 'TBD'}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>Loc: <strong>{proj.location || 'Saudi Arabia'}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <Grid className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>Levels: <strong>{(proj.level_structure || ['Villa']).join(' ➔ ')}</strong></span>
                  </div>
                </div>
              </div>

              {/* Action Controls & Enter Button */}
              <div className="pt-4 border-t border-border mt-4 space-y-2">
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => openEditModal(proj)} 
                      title="Edit Project Details"
                      className="p-1.5 rounded-lg border border-border bg-background hover:bg-muted text-foreground transition-all text-xs flex items-center gap-1 font-semibold"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-primary" />
                      Edit
                    </button>

                    <button 
                      onClick={() => handleDuplicate(proj.id)} 
                      title="Duplicate Project Structure"
                      className="p-1.5 rounded-lg border border-border bg-background hover:bg-muted text-foreground transition-all text-xs flex items-center gap-1 font-semibold"
                    >
                      <Copy className="w-3.5 h-3.5 text-foreground" />
                      Copy
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => handleToggleArchive(proj)} 
                      title={proj.status === 'archived' ? 'Unarchive Project' : 'Archive Project'}
                      className="p-1.5 rounded-lg border border-border bg-background hover:bg-muted text-foreground transition-all"
                    >
                      {proj.status === 'archived' ? <RotateCcw className="w-3.5 h-3.5 text-success" /> : <Archive className="w-3.5 h-3.5 text-warning" />}
                    </button>

                    <button 
                      onClick={() => openDeleteModal(proj)} 
                      title="Delete Project"
                      className="p-1.5 rounded-lg border border-border bg-background hover:bg-muted text-danger transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <Link 
                  href={`/villas/${proj.id}`}
                  className="w-full py-2 bg-primary text-primary-foreground font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-sm hover:bg-primary/90"
                >
                  View Details & Inspection Tree &rarr;
                </Link>
              </div>
            </div>
          );
        })}

        {filteredProjects.length === 0 && (
          <div className="col-span-full bg-card border border-border p-12 text-center rounded-2xl flex flex-col items-center justify-center">
            <AlertCircle className="w-12 h-12 text-muted mb-3" />
            <h3 className="text-sm font-bold text-foreground">No Projects Found</h3>
            <p className="text-xs text-muted-foreground mt-1">Try refining your search queries or register a new project using the button above.</p>
          </div>
        )}
      </div>

      {/* ------------------------------------------ */}
      {/* REGISTER / EDIT PROJECT MODAL */}
      {/* ------------------------------------------ */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setShowAddModal(false); setShowEditModal(false); }} />
          
          <div className="relative bg-card border border-border rounded-3xl p-6 w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh] space-y-4">
            <h3 className="text-base font-extrabold text-foreground">
              {showEditModal ? 'Edit Project Settings & Lifecycle' : 'Register New Enterprise Project'}
            </h3>
            
            <form onSubmit={showEditModal ? handleEditProject : handleAddProject} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Project Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Izdihar Villa Project"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary text-foreground"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Project Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. IZD-001"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary text-foreground"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Project Type</label>
                  <select
                    value={newProjectType}
                    onChange={(e) => setNewProjectType(e.target.value as any)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary text-foreground"
                  >
                    <option value="villa">Residential Villa Compound</option>
                    <option value="apartment">Apartment Building</option>
                    <option value="hotel">Hotel</option>
                    <option value="hospital">Hospital</option>
                    <option value="mall">Shopping Mall</option>
                    <option value="warehouse">Warehouse</option>
                    <option value="factory">Factory</option>
                    <option value="road">Road Project</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Project Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as any)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary text-foreground"
                  >
                    <option value="active">Active</option>
                    <option value="archived">Archived</option>
                    <option value="completed">Completed</option>
                    <option value="on_hold">On Hold</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Client / Owner</label>
                  <input
                    type="text"
                    placeholder="e.g. Default Organization"
                    value={newOwner}
                    onChange={(e) => setNewOwner(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary text-foreground"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Consultant Firm</label>
                  <input
                    type="text"
                    placeholder="e.g. Khatib & Alami"
                    value={newConsultant}
                    onChange={(e) => setNewConsultant(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary text-foreground"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Main Contractor</label>
                  <input
                    type="text"
                    placeholder="e.g. Saudi Construction Co."
                    value={newContractor}
                    onChange={(e) => setNewContractor(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary text-foreground"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Project Manager</label>
                  <input
                    type="text"
                    placeholder="e.g. Eng. Ahmed Al-Otaibi"
                    value={newPM}
                    onChange={(e) => setNewPM(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary text-foreground"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Start Date</label>
                  <input
                    type="date"
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary text-foreground"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Expected Completion</label>
                  <input
                    type="date"
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary text-foreground"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Level Structure Definition (Comma Separated)</label>
                  <input
                    type="text"
                    value={newLevels}
                    onChange={(e) => setNewLevels(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary text-foreground"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">Defines hierarchy depth (e.g. "Villa, Unit, Room" or "Tower, Floor, Suite").</p>
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary text-foreground"
                  />
                </div>

              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setShowEditModal(false); }}
                  className="px-4 py-2 bg-muted text-muted-foreground rounded-xl text-xs font-semibold hover:bg-muted/80 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 transition-all"
                >
                  {showEditModal ? 'Save Project Changes' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------ */}
      {/* DELETE PROJECT CONFIRMATION MODAL */}
      {/* ------------------------------------------ */}
      {showDeleteModal && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md" onClick={() => setShowDeleteModal(false)} />
          
          <div className="relative bg-card border border-border rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-danger">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-extrabold text-foreground">Confirm Delete / Archive Project</h3>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to delete <strong className="text-foreground">{selectedProject.name}</strong> ({selectedProject.project_code})?
            </p>

            <div className="p-3 bg-muted/40 border border-border rounded-xl text-xs space-y-1">
              <span className="font-bold text-foreground block">Safety Policy Safeguard:</span>
              <p className="text-muted-foreground">Projects containing active inspection records will be safely <strong className="text-warning">Archived</strong> instead of permanently deleted to preserve audit trails.</p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => confirmDeleteProject(false)}
                className="w-full py-2.5 bg-warning text-warning-foreground font-bold text-xs rounded-xl shadow hover:bg-warning/90 transition-all"
              >
                Safe Delete (Archive if Records Exist)
              </button>

              {user?.role === 'super_admin' && (
                <button
                  onClick={() => confirmDeleteProject(true)}
                  className="w-full py-2.5 bg-danger text-danger-foreground font-bold text-xs rounded-xl shadow hover:bg-danger/90 transition-all"
                >
                  Super Admin Force Permanent Delete
                </button>
              )}

              <button
                onClick={() => setShowDeleteModal(false)}
                className="w-full py-2 bg-muted text-muted-foreground font-semibold text-xs rounded-xl hover:bg-muted/80 transition-all mt-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Project Setup Wizard Modal */}
      <ProjectWizardModal 
        isOpen={showWizardModal}
        onClose={() => { setShowWizardModal(false); loadData(); }}
      />
    </div>
  );
}
