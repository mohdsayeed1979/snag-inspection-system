// Villas and Blocks Explorer with Search, Filters, and "Create Villa" functionality
'use client';

import React, { useState, useEffect } from 'react';
import { dbService, Villa, Block, Project, InspectionCategory } from '@/lib/db';
import { useAuth } from '@/context/AuthContext';
import { 
  Search, 
  Building2, 
  Plus, 
  User, 
  HardHat, 
  Briefcase,
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';
import Link from 'next/link';

export default function VillasPage() {
  const { user, canCreateSnag } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [villas, setVillas] = useState<Villa[]>([]);
  const [categories, setCategories] = useState<InspectionCategory[]>([]);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBlockId, setSelectedBlockId] = useState<string>('all');

  // Modal / Add Villa form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newVillaNum, setNewVillaNum] = useState('');
  const [newOwner, setNewOwner] = useState('');
  const [newEngineer, setNewEngineer] = useState('Eng. Khalid');
  const [newContractor, setNewContractor] = useState('Saudi Construction Co.');
  const [newConsultant, setNewConsultant] = useState('Khatib & Alami');
  const [newBlockId, setNewBlockId] = useState('');

  const loadData = () => {
    const projectsList = dbService.getProjects();
    if (projectsList.length > 0) setProject(projectsList[0]);
    const bList = dbService.getBlocks();
    setBlocks(bList);
    setVillas(dbService.getVillas());
    setCategories(dbService.getCategories());
    if (bList.length > 0 && !newBlockId) setNewBlockId(bList[0].id);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddVilla = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVillaNum || !newBlockId) return;

    dbService.addVilla({
      block_id: newBlockId,
      villa_number: newVillaNum,
      owner: newOwner || 'General',
      contractor: newContractor,
      consultant: newConsultant,
      engineer: newEngineer
    });

    // Reset Form
    setNewVillaNum('');
    setNewOwner('');
    setShowAddModal(false);
    loadData(); // Reload list
  };

  // Filter villas based on search and selected block
  const filteredVillas = villas.filter((v) => {
    const blockMatch = selectedBlockId === 'all' || v.block_id === selectedBlockId;
    const query = searchQuery.toLowerCase();
    const searchMatch = 
      v.villa_number.toLowerCase().includes(query) ||
      (v.owner && v.owner.toLowerCase().includes(query)) ||
      (v.engineer && v.engineer.toLowerCase().includes(query)) ||
      (v.contractor && v.contractor.toLowerCase().includes(query));
    return blockMatch && searchMatch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Block */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Villas and Building Blocks</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Explore structure blocks and villa inspection completion metrics.</p>
        </div>

        {/* Add Villa Button (PM & Admins only) */}
        {canCreateSnag() && (
          <button 
            onClick={() => setShowAddModal(true)} 
            className="flex items-center gap-2 bg-primary hover:bg-primary/95 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shadow-primary/10 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Add Villa Unit
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
            placeholder="Search villas by number, owner, engineer, contractor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-all"
          />
        </div>

        {/* Block Filter Tabs */}
        <div className="flex gap-1.5 w-full md:w-auto shrink-0 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setSelectedBlockId('all')}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedBlockId === 'all'
                ? 'bg-secondary text-primary'
                : 'bg-background hover:bg-muted/30 text-muted-foreground'
            }`}
          >
            All Blocks
          </button>
          {blocks.map((b) => (
            <button
              key={b.id}
              onClick={() => setSelectedBlockId(b.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedBlockId === b.id
                  ? 'bg-secondary text-primary'
                  : 'bg-background hover:bg-muted/30 text-muted-foreground'
              }`}
            >
              {b.name}
            </button>
          ))}
        </div>
      </div>

      {/* Block-wise Grid Render */}
      {blocks
        .filter(b => selectedBlockId === 'all' || b.id === selectedBlockId)
        .map((block) => {
          const blockVillas = filteredVillas.filter(v => v.block_id === block.id);
          if (blockVillas.length === 0 && selectedBlockId !== 'all') {
            return (
              <div key={block.id} className="bg-card border border-border p-8 text-center rounded-2xl">
                <AlertCircle className="w-8 h-8 text-muted mx-auto mb-2" />
                <p className="text-sm font-semibold text-muted-foreground">No villas matching search in {block.name}.</p>
              </div>
            );
          }

          if (blockVillas.length === 0) return null;

          return (
            <div key={block.id} className="space-y-4">
              <div className="border-b border-border pb-1">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" /> {block.name}
                  <span className="text-[10px] font-semibold bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                    {blockVillas.length} villas
                  </span>
                </h3>
                <p className="text-[10px] text-muted-foreground">{block.description}</p>
              </div>

              {/* Villas Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {blockVillas.map((villa) => {
                  // Color representation for progress
                  let progressColor = 'bg-muted';
                  let progressBorder = 'border-border/60';
                  if (villa.completion_rate > 0 && villa.completion_rate < 100) {
                    progressColor = 'bg-warning';
                    progressBorder = 'border-warning/20';
                  } else if (villa.completion_rate === 100) {
                    progressColor = 'bg-success';
                    progressBorder = 'border-success/20';
                  }

                  return (
                    <div key={villa.id} className="bg-card border border-border p-4 rounded-2xl shadow-sm hover:shadow-md hover:scale-[1.01] transition-all flex flex-col justify-between h-[230px]">
                      <div className="space-y-2.5">
                        <div className="flex justify-between items-start">
                          <h4 className="text-sm font-black text-foreground">{villa.villa_number}</h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            villa.completion_rate === 100 ? 'bg-success/15 text-success' : 
                            villa.completion_rate > 0 ? 'bg-warning/15 text-warning' : 
                            'bg-muted-foreground/15 text-muted-foreground'
                          }`}>
                            {villa.completion_rate}%
                          </span>
                        </div>

                        {/* Progress slider bar */}
                        <div className="w-full bg-muted/60 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${progressColor} transition-all duration-300`} 
                            style={{ width: `${villa.completion_rate}%` }}
                          />
                        </div>

                        {/* Labels block */}
                        <div className="space-y-1.5 pt-2">
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                            <User className="w-3 h-3 text-primary shrink-0" />
                            <span className="truncate">Owner: <strong>{villa.owner}</strong></span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                            <HardHat className="w-3 h-3 text-primary shrink-0" />
                            <span className="truncate">Contr: <strong>{villa.contractor}</strong></span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                            <Briefcase className="w-3 h-3 text-primary shrink-0" />
                            <span className="truncate">Consult: <strong>{villa.consultant}</strong></span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                            <User className="w-3 h-3 text-primary shrink-0" />
                            <span className="truncate">Eng: <strong>{villa.engineer}</strong></span>
                          </div>
                        </div>
                      </div>

                      {/* Clickable check link */}
                      <Link 
                        href={`/villas/${villa.id}`}
                        className="mt-4 w-full py-2 bg-secondary/35 hover:bg-secondary text-primary font-bold text-[10px] rounded-xl flex items-center justify-center gap-1.5 transition-colors border border-accent/10"
                      >
                        Inspect checklist &rarr;
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

      {/* ------------------------------------------ */}
      {/* ADD VILLA DIALOG MODAL */}
      {/* ------------------------------------------ */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          
          <div className="relative bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-sm font-bold text-foreground mb-4">Register New Villa Unit</h3>
            
            <form onSubmit={handleAddVilla} className="space-y-4">
              {/* Block Selection */}
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1.5">Block Sector</label>
                <select
                  value={newBlockId}
                  onChange={(e) => setNewBlockId(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs outline-none focus:border-primary text-foreground"
                  required
                >
                  {blocks.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              {/* Villa Number */}
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1.5">Villa Number/Name</label>
                <input
                  type="text"
                  placeholder="e.g. Villa 31, Studio-102"
                  value={newVillaNum}
                  onChange={(e) => setNewVillaNum(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs outline-none focus:border-primary text-foreground"
                  required
                />
              </div>

              {/* Owner */}
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1.5">Owner Name</label>
                <input
                  type="text"
                  placeholder="e.g. Khalid Al-Fahad"
                  value={newOwner}
                  onChange={(e) => setNewOwner(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs outline-none focus:border-primary text-foreground"
                />
              </div>

              <div className="bg-muted/30 p-3 rounded-xl border border-border space-y-2">
                <p className="text-[9px] text-muted-foreground leading-normal">
                  <span className="font-bold text-primary">Note:</span> Adding a villa will automatically instantiate its inspection checklist containing {dbService.getTemplates().length} audit items based on the active template.
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
                  Create Unit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
