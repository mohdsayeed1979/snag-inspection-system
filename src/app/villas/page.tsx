// Enterprise Projects Explorer with search, filtering, and custom hierarchy creator
'use client';

import React, { useState, useEffect } from 'react';
import { dbService, Project, ProjectNode } from '@/lib/db';
import { useAuth } from '@/context/AuthContext';
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
  Sparkles
} from 'lucide-react';
import Link from 'next/link';

export default function ProjectsPage() {
  const { user, currentCompany, canCreateSnag } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [nodes, setNodes] = useState<ProjectNode[]>([]);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  // Modal / Add Project form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newClient, setNewClient] = useState('');
  const [newOwner, setNewOwner] = useState('');
  const [newContractor, setNewContractor] = useState('');
  const [newConsultant, setNewConsultant] = useState('');
  const [newEngineer, setNewEngineer] = useState('');
  const [newProjectType, setNewProjectType] = useState<Project['project_type']>('villa');
  const [newLevels, setNewLevels] = useState<string>('Block, Villa');
  const [newLocation, setNewLocation] = useState('');

  const loadData = () => {
    setProjects(dbService.getProjects());
    setNodes(dbService.getProjectNodes());
  };

  useEffect(() => {
    loadData();
  }, [currentCompany]);

  // Handle template level autofills based on project type selection
  useEffect(() => {
    switch (newProjectType) {
      case 'hotel':
        setNewLevels('Tower, Floor, Room');
        break;
      case 'apartment':
        setNewLevels('Block, Floor, Apartment');
        break;
      case 'hospital':
        setNewLevels('Building, Floor, Room');
        break;
      case 'mall':
        setNewLevels('Block, Shop');
        break;
      case 'warehouse':
        setNewLevels('Zone, Rack');
        break;
      case 'factory':
        setNewLevels('Area, Machine');
        break;
      case 'road':
        setNewLevels('Section, Chainage');
        break;
      case 'villa':
      default:
        setNewLevels('Block, Villa');
        break;
    }
  }, [newProjectType]);

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newCode) return;

    // Parse levels configuration
    const levelsArr = newLevels
      .split(',')
      .map(lvl => lvl.trim())
      .filter(lvl => lvl.length > 0);

    const companyId = currentCompany?.id || 'c0000000-0000-0000-0000-000000000000';

    dbService.addProject({
      company_id: companyId,
      name: newName,
      project_code: newCode,
      description: newDesc,
      owner: newOwner || newClient || 'General',
      contractor: newContractor || 'Saudi Construction Co.',
      consultant: newConsultant || 'Khatib & Alami',
      engineer: newEngineer || user?.full_name || 'Eng. Khalid',
      project_type: newProjectType,
      level_structure: levelsArr,
      location: newLocation
    });

    // Reset Form
    setNewName('');
    setNewCode('');
    setNewDesc('');
    setNewOwner('');
    setNewClient('');
    setNewContractor('');
    setNewConsultant('');
    setNewEngineer('');
    setNewLocation('');
    setShowAddModal(false);
    loadData(); // Reload list
  };

  // Filter projects based on search and type
  const filteredProjects = projects.filter((p) => {
    const typeMatch = selectedType === 'all' || p.project_type === selectedType;
    const query = searchQuery.toLowerCase();
    const searchMatch = 
      p.name.toLowerCase().includes(query) ||
      (p.project_code && p.project_code.toLowerCase().includes(query)) ||
      (p.description && p.description.toLowerCase().includes(query)) ||
      (p.contractor && p.contractor.toLowerCase().includes(query));
    return typeMatch && searchMatch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* Header Block */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Projects Explorer</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage company projects, structures and quality checklists.
          </p>
        </div>

        {/* Add Project Button (PM & Admins only) */}
        {canCreateSnag() && (
          <button 
            onClick={() => setShowAddModal(true)} 
            className="flex items-center gap-2 bg-primary hover:bg-primary/95 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shadow-primary/10 self-start sm:self-auto"
          >
            <Plus className="w-4.5 h-4.5" /> Register New Project
          </button>
        )}
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-card border border-border p-4 rounded-2xl shadow-sm flex flex-col md:flex-row gap-4 items-center">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search projects by name, code, description, contractor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-all"
          />
        </div>

        {/* Type Filter Tabs */}
        <div className="flex gap-1.5 w-full md:w-auto shrink-0 overflow-x-auto pb-1 md:pb-0">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-background border border-border px-3 py-2.5 rounded-xl text-xs text-muted-foreground outline-none focus:border-primary transition-all cursor-pointer font-semibold"
          >
            <option value="all">All Project Types</option>
            <option value="villa">Villa Compound</option>
            <option value="apartment">Apartment Building</option>
            <option value="hotel">Hotel</option>
            <option value="hospital">Hospital</option>
            <option value="mall">Shopping Mall</option>
            <option value="warehouse">Warehouse</option>
            <option value="factory">Factory</option>
            <option value="road">Infrastructure / Road</option>
            <option value="custom">Custom Hierarchy</option>
          </select>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((proj) => {
          // Count location tree items for this project
          const projNodes = nodes.filter(n => n.project_id === proj.id && n.parent_id !== null);
          
          let progressColor = 'bg-muted';
          if (proj.completion_rate > 0 && proj.completion_rate < 100) {
            progressColor = 'bg-warning';
          } else if (proj.completion_rate === 100) {
            progressColor = 'bg-success';
          }

          return (
            <div key={proj.id} className="bg-card border border-border p-5 rounded-2xl shadow-sm hover:shadow-md hover:scale-[1.01] transition-all flex flex-col justify-between h-[280px]">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] font-black uppercase text-primary tracking-widest px-2 py-0.5 rounded bg-primary/10">
                      {proj.project_type}
                    </span>
                    <h3 className="text-base font-extrabold text-foreground truncate mt-1.5 max-w-[200px]">{proj.name}</h3>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    proj.completion_rate === 100 ? 'bg-success/15 text-success border border-success/20' : 
                    proj.completion_rate > 0 ? 'bg-warning/15 text-warning border border-warning/20' : 
                    'bg-muted-foreground/10 text-muted-foreground'
                  }`}>
                    {proj.completion_rate}%
                  </span>
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

                {/* Metadata */}
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
                    <span>Levels: <strong>{proj.level_structure.join(' ➔ ')}</strong></span>
                  </div>
                </div>
              </div>

              {/* Clickable check link */}
              <Link 
                href={`/villas/${proj.id}`}
                className="mt-4 w-full py-2.5 bg-secondary/35 hover:bg-secondary text-primary font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors border border-accent/15"
              >
                Enter Project QA Space &rarr;
              </Link>
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
      {/* REGISTER PROJECT DIALOG MODAL */}
      {/* ------------------------------------------ */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          
          <div className="relative bg-card border border-border rounded-2xl p-6 w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
            <h3 className="text-sm font-bold text-foreground mb-4">Register New Enterprise Project</h3>
            
            <form onSubmit={handleAddProject} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Project Name */}
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1.5">Project Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Al-Faisaliah Hotel Remodeling"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs outline-none focus:border-primary text-foreground"
                    required
                  />
                </div>

                {/* Project Code */}
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1.5">Project Code</label>
                  <input
                    type="text"
                    placeholder="e.g. PROJ-FHS"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs outline-none focus:border-primary text-foreground"
                    required
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1.5">Location (City, Country)</label>
                  <input
                    type="text"
                    placeholder="e.g. Riyadh, KSA"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs outline-none focus:border-primary text-foreground"
                  />
                </div>

                {/* Project Type */}
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1.5">Project Type</label>
                  <select
                    value={newProjectType}
                    onChange={(e) => setNewProjectType(e.target.value as any)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs outline-none focus:border-primary text-foreground cursor-pointer"
                  >
                    <option value="villa">Villa Compound</option>
                    <option value="apartment">Apartment Building</option>
                    <option value="hotel">Hotel</option>
                    <option value="hospital">Hospital</option>
                    <option value="mall">Shopping Mall</option>
                    <option value="warehouse">Warehouse</option>
                    <option value="factory">Factory</option>
                    <option value="road">Infrastructure / Road</option>
                    <option value="custom">Custom Structure</option>
                  </select>
                </div>

                {/* Level Structure */}
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1.5">Structure Nodes (Comma Separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. Tower, Floor, Suite"
                    value={newLevels}
                    onChange={(e) => setNewLevels(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs outline-none focus:border-primary text-foreground"
                    required
                  />
                </div>

                {/* Contractor */}
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1.5">Main Contractor</label>
                  <input
                    type="text"
                    placeholder="Saudi Construction Co."
                    value={newContractor}
                    onChange={(e) => setNewContractor(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs outline-none focus:border-primary text-foreground"
                  />
                </div>

                {/* Consultant */}
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1.5">Consultant</label>
                  <input
                    type="text"
                    placeholder="Khatib & Alami"
                    value={newConsultant}
                    onChange={(e) => setNewConsultant(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs outline-none focus:border-primary text-foreground"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1.5">Project Description</label>
                <textarea
                  placeholder="Summary of construction scope and audit deliverables..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs outline-none focus:border-primary text-foreground h-20 resize-none"
                />
              </div>

              <div className="bg-muted/30 p-3 rounded-xl border border-border flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5 animate-pulse" />
                <p className="text-[9px] text-muted-foreground leading-normal">
                  Defining structural levels allows you to organize inspections hierarchically. For example, a Hotel project with levels: <strong>{newLevels}</strong> will generate location nodes matching this exact architecture.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 border border-border hover:bg-muted text-foreground text-xs rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-primary hover:bg-primary/95 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-primary/10"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
