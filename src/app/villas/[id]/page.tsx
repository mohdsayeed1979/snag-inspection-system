// Villa Inspection Checklist Page (Datatable, Filters, Import/Export, Snag Details drawer)
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { 
  dbService, 
  Villa, 
  Project, 
  Block, 
  InspectionItem, 
  InspectionCategory, 
  Profile, 
  InspectionPhoto, 
  InspectionComment,
  InspectionHistory
} from '@/lib/db';
import { useAuth } from '@/context/AuthContext';
import { exportCenter, ExportOptions } from '@/lib/exportCenter';
import { parseChecklistExcel, saveImportedItems } from '@/lib/importCenter';
import { 
  ArrowLeft, 
  FileSpreadsheet, 
  FileText, 
  Upload, 
  Search, 
  SlidersHorizontal, 
  Eye, 
  Trash2, 
  MessageSquare, 
  Camera, 
  Check, 
  User, 
  Calendar,
  AlertCircle,
  HelpCircle,
  Plus
} from 'lucide-react';

export default function VillaDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const villaId = params.id as string;
  const { user, canCreateSnag, canEditSnag, canChangeStatus, canDeleteSnag } = useAuth();
  
  // Data State
  const [project, setProject] = useState<Project | null>(null);
  const [villa, setVilla] = useState<Villa | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [items, setItems] = useState<InspectionItem[]>([]);
  const [categories, setCategories] = useState<InspectionCategory[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);

  // Filter State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Excel Import State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [importErrors, setImportErrors] = useState<string[]>([]);

  // Export Drawer State
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<'excel' | 'pdf'>('excel');
  const [exportOrientation, setExportOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [exportPaperSize, setExportPaperSize] = useState<'a4' | 'letter'>('a4');
  const [includePhotos, setIncludePhotos] = useState(true);
  const [includeComments, setIncludeComments] = useState(true);
  const [includeClosedItems, setIncludeClosedItems] = useState(true);

  // Snag Detail Drawer/Modal State
  const [activeSnag, setActiveSnag] = useState<InspectionItem | null>(null);
  const [activeSnagComments, setActiveSnagComments] = useState<InspectionComment[]>([]);
  const [activeSnagPhotos, setActiveSnagPhotos] = useState<InspectionPhoto[]>([]);
  const [activeSnagHistory, setActiveSnagHistory] = useState<InspectionHistory[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [photoUploadType, setPhotoUploadType] = useState<'before' | 'after'>('before');
  const [photoCaption, setPhotoCaption] = useState('');
  const [photoMockUrl, setPhotoMockUrl] = useState('');

  // Add Snag Modal State
  const [showAddSnagModal, setShowAddSnagModal] = useState(false);
  const [newSnagTitle, setNewSnagTitle] = useState('');
  const [newSnagDesc, setNewSnagDesc] = useState('');
  const [newSnagCatId, setNewSnagCatId] = useState('');
  const [newSnagPriority, setNewSnagPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [newSnagLocation, setNewSnagLocation] = useState('Ground Floor');
  const [newSnagRoom, setNewSnagRoom] = useState('General');

  // Load database items
  const loadData = () => {
    const projectsList = dbService.getProjects();
    if (projectsList.length > 0) setProject(projectsList[0]);
    
    setBlocks(dbService.getBlocks());
    setCategories(dbService.getCategories());
    setProfiles(dbService.getProfiles());

    const currentVilla = dbService.getVillaById(villaId);
    if (currentVilla) {
      setVilla(currentVilla);
      const allItems = dbService.getInspectionItems();
      const villaItems = allItems.filter(i => i.villa_id === currentVilla.id);
      setItems(villaItems);

      // Check query parameter for deep linked snag
      const snagIdParam = searchParams.get('snagId');
      if (snagIdParam) {
        const foundSnag = villaItems.find(i => i.id === snagIdParam);
        if (foundSnag) {
          setActiveSnag(foundSnag);
        }
      }
    } else {
      router.push('/villas');
    }
  };


  useEffect(() => {
    loadData();
  }, [villaId]);

  // Load active snag comments, photos, audit history
  useEffect(() => {
    if (activeSnag) {
      setActiveSnagComments(dbService.getCommentsBySnagId(activeSnag.id));
      setActiveSnagPhotos(dbService.getPhotosBySnagId(activeSnag.id));
      setActiveSnagHistory(dbService.getHistoryBySnagId(activeSnag.id));
    }
  }, [activeSnag]);

  // Excel Import Trigger
  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !villa) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await parseChecklistExcel(arrayBuffer, dbService.getVillas(), categories);
      
      if (result.errors.filter(err => err.severity === 'error').length > 0) {
        setImportStatus('error');
        setImportErrors(result.errors.map(err => `Row ${err.row}: ${err.error}`));
      } else {
        // Save items
        // Map to current villa ID to overwrite Excel target if required
        const itemsToSave = result.itemsParsed.map(item => ({
          ...item,
          villa_id: villa.id
        }));

        saveImportedItems(itemsToSave, user?.id || 'u-admin');
        setImportStatus('success');
        setImportErrors(result.errors.map(err => `Row ${err.row} (Warning): ${err.error}`));
        loadData(); // reload
        setTimeout(() => setImportStatus('idle'), 4000);
      }
    } catch (err: any) {
      setImportStatus('error');
      setImportErrors([err.message || 'Error parsing file.']);
    }
  };

  // Export Trigger
  const handleExport = async () => {
    if (!project || !villa) return;
    
    const options: ExportOptions = {
      orientation: exportOrientation,
      paperSize: exportPaperSize,
      includePhotos,
      includeComments,
      includeClosedItems,
      preparedBy: user?.full_name || 'QC Inspector'
    };

    const reportTitle = `${villa.villa_number} Inspection Snag Report`;

    if (exportFormat === 'excel') {
      const blob = await exportCenter.exportToExcel(items, project, [villa], blocks, categories, profiles, reportTitle, options);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${villa.villa_number.replace(/\s+/g, '_')}_SnagList.xlsx`;
      a.click();
    } else {
      const blob = await exportCenter.exportToPdf(items, project, [villa], blocks, categories, profiles, reportTitle, options);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${villa.villa_number.replace(/\s+/g, '_')}_Report.pdf`;
      a.click();
    }
    
    setShowExportModal(false);
  };

  // Inline Status Change RLS validation check
  const handleStatusChange = (item: InspectionItem, newStatus: any) => {
    if (!user || !canChangeStatus(newStatus)) return;
    const updated = { ...item, status: newStatus };
    dbService.updateInspectionItem(updated, user.id);
    loadData();
    if (activeSnag && activeSnag.id === item.id) {
      setActiveSnag(dbService.getInspectionItemById(item.id) || null);
    }
  };

  // Add Snag Action
  const handleAddSnag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!villa || !newSnagTitle || !user) return;

    dbService.addInspectionItem({
      villa_id: villa.id,
      category_id: newSnagCatId || categories[0].id,
      title: newSnagTitle,
      description: newSnagDesc,
      priority: newSnagPriority,
      status: 'open',
      location: newSnagLocation,
      room: newSnagRoom,
      remarks: '',
      inspection_date: new Date().toISOString().split('T')[0]
    }, user.id);

    // Reset Form
    setNewSnagTitle('');
    setNewSnagDesc('');
    setShowAddSnagModal(false);
    loadData();
  };

  // Comment submit
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSnag || !newCommentText.trim() || !user) return;

    dbService.addComment(activeSnag.id, newCommentText, user.id);
    setNewCommentText('');
    setActiveSnagComments(dbService.getCommentsBySnagId(activeSnag.id));
    setActiveSnagHistory(dbService.getHistoryBySnagId(activeSnag.id));
  };

  // Photo submit (Simulated URL or Upload)
  const handleAddPhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSnag || !user) return;

    const url = photoMockUrl.trim() || 'https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?auto=format&fit=crop&w=600&q=80';
    dbService.addPhoto(activeSnag.id, url, photoUploadType, photoCaption || 'Inspection image', user.id);
    
    setPhotoCaption('');
    setPhotoMockUrl('');
    setActiveSnagPhotos(dbService.getPhotosBySnagId(activeSnag.id));
    setActiveSnagHistory(dbService.getHistoryBySnagId(activeSnag.id));
  };

  // Delete Snag
  const handleDeleteSnag = (id: string) => {
    if (!confirm('Are you sure you want to delete this snag item?')) return;
    dbService.deleteInspectionItem(id);
    setActiveSnag(null);
    loadData();
  };

  // Filter Logic
  const filteredItems = items.filter((item) => {
    const q = search.toLowerCase();
    const searchMatch = 
      item.snag_number.toLowerCase().includes(q) ||
      item.title.toLowerCase().includes(q) ||
      (item.location && item.location.toLowerCase().includes(q)) ||
      (item.room && item.room.toLowerCase().includes(q));

    const statusMatch = statusFilter === 'all' || item.status === statusFilter;
    const priorityMatch = priorityFilter === 'all' || item.priority === priorityFilter;
    const categoryMatch = categoryFilter === 'all' || item.category_id === categoryFilter;

    return searchMatch && statusMatch && priorityMatch && categoryMatch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push('/villas')}
            className="p-2 border border-border bg-card rounded-xl hover:bg-muted text-foreground transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground">{villa?.villa_number || 'Villa Unit'}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Block Sector: <strong>{blocks.find(b => b.id === villa?.block_id)?.name}</strong></p>
          </div>
        </div>

        {/* Action Panel */}
        <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
          {/* Excel Import button */}
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 border border-border bg-card hover:bg-muted/70 text-foreground font-semibold text-xs px-3.5 py-2.5 rounded-xl transition-all"
          >
            <Upload className="w-4 h-4 text-primary" /> Import Checklist (.xlsx)
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleExcelImport}
            accept=".xlsx,.xls" 
            className="hidden" 
          />

          {/* Export Center Trigger */}
          <button 
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2 bg-primary hover:bg-primary/95 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shadow-primary/10"
          >
            <FileText className="w-4 h-4 text-secondary" /> Export Center
          </button>
        </div>
      </div>

      {/* Import error alerts */}
      {importStatus === 'error' && (
        <div className="bg-danger/10 border border-danger/25 p-4 rounded-2xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-danger">Excel Import Failed</h4>
            <ul className="list-disc pl-4 mt-2 text-[10px] text-danger/90 space-y-1 max-h-32 overflow-y-auto">
              {importErrors.map((err, i) => <li key={i}>{err}</li>)}
            </ul>
          </div>
        </div>
      )}

      {importStatus === 'success' && (
        <div className="bg-success/10 border border-success/25 p-4 rounded-2xl flex items-center gap-3">
          <Check className="w-5 h-5 text-success shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-success">Checklist Imported Successfully</h4>
            {importErrors.length > 0 && (
              <p className="text-[9px] text-success/80 mt-1">Imported items with some row notes/warnings.</p>
            )}
          </div>
        </div>
      )}

      {/* Villa metadata panel */}
      {villa && (
        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-6 relative overflow-hidden">
          <div className="md:col-span-2 lg:col-span-2 space-y-2">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Completion rate</span>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-black text-foreground">{villa.completion_rate}%</span>
              <div className="flex-1 bg-muted h-2.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    villa.completion_rate === 100 ? 'bg-success' : 
                    villa.completion_rate > 0 ? 'bg-warning' : 'bg-muted-foreground'
                  }`}
                  style={{ width: `${villa.completion_rate}%` }}
                />
              </div>
            </div>
          </div>
          {[
            { label: 'Villa Owner', val: villa.owner },
            { label: 'Contractor', val: villa.contractor },
            { label: 'Consultant', val: villa.consultant },
            { label: 'Site Engineer', val: villa.engineer }
          ].map((meta, idx) => (
            <div key={idx} className="space-y-1.5">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">{meta.label}</span>
              <p className="text-xs font-bold text-foreground truncate">{meta.val}</p>
            </div>
          ))}
        </div>
      )}

      {/* Table Filters Panel */}
      <div className="bg-card border border-border p-4 rounded-2xl shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 w-full max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search snags by ID, description, location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-all"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex gap-2 w-full md:w-auto shrink-0 flex-wrap sm:flex-nowrap">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none focus:border-primary text-foreground"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none focus:border-primary text-foreground"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="rectified">Rectified</option>
            <option value="qa_verification">QA Verification</option>
            <option value="closed">Closed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none focus:border-primary text-foreground"
          >
            <option value="all">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>

          {canCreateSnag() && (
            <button 
              onClick={() => {
                if (categories.length > 0 && !newSnagCatId) setNewSnagCatId(categories[0].id);
                setShowAddSnagModal(true);
              }}
              className="flex items-center gap-1.5 bg-primary/20 text-primary hover:bg-primary hover:text-white font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all shrink-0 ml-auto"
            >
              <Plus className="w-3.5 h-3.5" /> Raise Snag
            </button>
          )}
        </div>
      </div>

      {/* Checklist Table */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/30 border-b border-border text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                <th className="px-5 py-4">Item ID</th>
                <th className="px-5 py-4">Category</th>
                <th className="px-5 py-4">Location / Room</th>
                <th className="px-5 py-4">Title / Specification</th>
                <th className="px-5 py-4 text-center">Priority</th>
                <th className="px-5 py-4 text-center">Status</th>
                <th className="px-5 py-4">Due Date</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs text-foreground">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-muted-foreground font-medium">
                    No inspection snag items matching current filters.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const itemCat = categories.find(c => c.id === item.category_id);
                  
                  // Color codes
                  const statusColors: Record<string, string> = {
                    open: 'bg-danger/10 text-danger border-danger/15',
                    assigned: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/15',
                    in_progress: 'bg-warning/10 text-warning border-warning/15',
                    rectified: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/15',
                    qa_verification: 'bg-accent/15 text-primary border-accent/20',
                    closed: 'bg-success/10 text-success border-success/15'
                  };

                  const priorityColors: Record<string, string> = {
                    critical: 'bg-danger text-white',
                    high: 'bg-warning text-dark-foreground',
                    medium: 'bg-primary text-white',
                    low: 'bg-muted text-muted-foreground'
                  };

                  return (
                    <tr key={item.id} className="hover:bg-muted/10 transition-colors">
                      {/* ID */}
                      <td className="px-5 py-4 font-bold text-primary">{item.snag_number}</td>
                      
                      {/* Category */}
                      <td className="px-5 py-4 font-semibold">{itemCat ? itemCat.name : 'General'}</td>
                      
                      {/* Location / Room */}
                      <td className="px-5 py-4">
                        <span className="font-medium text-foreground">{item.location}</span>
                        <span className="block text-[10px] text-muted-foreground mt-0.5">{item.room}</span>
                      </td>

                      {/* Title */}
                      <td className="px-5 py-4 font-medium max-w-xs truncate" title={item.title}>
                        {item.title}
                      </td>

                      {/* Priority */}
                      <td className="px-5 py-4 text-center">
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${priorityColors[item.priority]}`}>
                          {item.priority}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${statusColors[item.status]}`}>
                            {item.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                      </td>

                      {/* Due Date */}
                      <td className="px-5 py-4 font-medium text-muted-foreground">
                        {item.due_date || 'No date'}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Status Change Selector (respecting RLS context) */}
                          <select
                            value={item.status}
                            onChange={(e) => handleStatusChange(item, e.target.value)}
                            disabled={user?.role === 'read_only'}
                            className="bg-background border border-border rounded-xl px-2 py-1 text-[10px] font-bold text-foreground outline-none cursor-pointer focus:ring-0 focus:border-primary disabled:opacity-60"
                          >
                            <option value="open" disabled={!canChangeStatus('open')}>Open</option>
                            <option value="assigned" disabled={!canChangeStatus('assigned')}>Assigned</option>
                            <option value="in_progress" disabled={!canChangeStatus('in_progress')}>In Progress</option>
                            <option value="rectified" disabled={!canChangeStatus('rectified')}>Rectified</option>
                            <option value="qa_verification" disabled={!canChangeStatus('qa_verification')}>QA Verification</option>
                            <option value="closed" disabled={!canChangeStatus('closed')}>Closed</option>
                          </select>

                          {/* View details */}
                          <button
                            onClick={() => setActiveSnag(item)}
                            className="p-1.5 border border-border rounded-lg bg-background hover:bg-muted text-foreground transition-all"
                            title="View Snag Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ------------------------------------------ */}
      {/* EXPORT OPTIONS MODAL DIALOG */}
      {/* ------------------------------------------ */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowExportModal(false)} />
          
          <div className="relative bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-sm font-bold text-foreground mb-4">Export Snag Checklist Report</h3>
            
            <div className="space-y-4">
              {/* Format selection */}
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1.5 font-sans">Report Format</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setExportFormat('excel')}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      exportFormat === 'excel'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border bg-background text-muted-foreground'
                    }`}
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Excel Spreadsheet
                  </button>
                  <button
                    onClick={() => setExportFormat('pdf')}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      exportFormat === 'pdf'
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border bg-background text-muted-foreground'
                    }`}
                  >
                    <FileText className="w-4 h-4 text-red-600" /> PDF Document
                  </button>
                </div>
              </div>

              {exportFormat === 'pdf' && (
                <>
                  {/* Orientation */}
                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1.5">Page Layout</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setExportOrientation('portrait')}
                        className={`py-2 rounded-xl border text-xs font-bold transition-all ${
                          exportOrientation === 'portrait' ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-background text-muted-foreground'
                        }`}
                      >
                        Portrait (Vertical)
                      </button>
                      <button
                        onClick={() => setExportOrientation('landscape')}
                        className={`py-2 rounded-xl border text-xs font-bold transition-all ${
                          exportOrientation === 'landscape' ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-background text-muted-foreground'
                        }`}
                      >
                        Landscape (Horizontal)
                      </button>
                    </div>
                  </div>

                  {/* Size */}
                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1.5">Paper Size</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setExportPaperSize('a4')}
                        className={`py-2 rounded-xl border text-xs font-bold transition-all ${
                          exportPaperSize === 'a4' ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-background text-muted-foreground'
                        }`}
                      >
                        A4 Paper Size
                      </button>
                      <button
                        onClick={() => setExportPaperSize('letter')}
                        className={`py-2 rounded-xl border text-xs font-bold transition-all ${
                          exportPaperSize === 'letter' ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-background text-muted-foreground'
                        }`}
                      >
                        US Letter Size
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Toggles */}
              <div className="space-y-3 pt-2">
                <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">Export Components</label>
                
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includePhotos}
                    onChange={(e) => setIncludePhotos(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-0 w-4 h-4 cursor-pointer"
                  />
                  <span>Include Inspection Photos (Before/After)</span>
                </label>

                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeComments}
                    onChange={(e) => setIncludeComments(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-0 w-4 h-4 cursor-pointer"
                  />
                  <span>Include Remarks & Comments Threads</span>
                </label>

                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeClosedItems}
                    onChange={(e) => setIncludeClosedItems(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-0 w-4 h-4 cursor-pointer"
                  />
                  <span>Include Closed/Rectified Snags</span>
                </label>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 justify-end pt-4 border-t border-border">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="px-4 py-2.5 border border-border hover:bg-muted text-foreground text-xs rounded-xl font-medium"
                >
                  Close
                </button>
                <button
                  onClick={handleExport}
                  className="px-4 py-2.5 bg-primary hover:bg-primary/95 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-primary/10"
                >
                  Generate Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------ */}
      {/* ADD SNAG MODAL DIALOG */}
      {/* ------------------------------------------ */}
      {showAddSnagModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddSnagModal(false)} />
          
          <div className="relative bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-sm font-bold text-foreground mb-4">Record New Snag Item</h3>
            
            <form onSubmit={handleAddSnag} className="space-y-4">
              {/* Category */}
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1.5">Snag Category</label>
                <select
                  value={newSnagCatId}
                  onChange={(e) => setNewSnagCatId(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs outline-none focus:border-primary text-foreground"
                  required
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1.5">Snag Title / Observation</label>
                <input
                  type="text"
                  placeholder="e.g. Scratches on vanity door"
                  value={newSnagTitle}
                  onChange={(e) => setNewSnagTitle(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs outline-none focus:border-primary text-foreground"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1.5">Specification / Detail</label>
                <textarea
                  placeholder="Provide details about the issue..."
                  value={newSnagDesc}
                  onChange={(e) => setNewSnagDesc(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs outline-none focus:border-primary text-foreground h-20"
                />
              </div>

              {/* Location details */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1.5">Location</label>
                  <input
                    type="text"
                    value={newSnagLocation}
                    onChange={(e) => setNewSnagLocation(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs outline-none focus:border-primary text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1.5">Room</label>
                  <input
                    type="text"
                    value={newSnagRoom}
                    onChange={(e) => setNewSnagRoom(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs outline-none focus:border-primary text-foreground"
                  />
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1.5">Priority Level</label>
                <select
                  value={newSnagPriority}
                  onChange={(e) => setNewSnagPriority(e.target.value as any)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs outline-none focus:border-primary text-foreground"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddSnagModal(false)}
                  className="px-4 py-2.5 border border-border hover:bg-muted text-foreground text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-primary hover:bg-primary/95 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-primary/10"
                >
                  Record Snag
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------ */}
      {/* DETAILED SNAG DRAWER PANEL (SIDE PANEL) */}
      {/* ------------------------------------------ */}
      {activeSnag && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" 
            onClick={() => setActiveSnag(null)} 
          />
          
          <div className="relative bg-card border-l border-border w-full max-w-xl h-full flex flex-col shadow-2xl z-50 animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-5 border-b border-border flex items-center justify-between bg-muted/20">
              <div>
                <span className="text-[10px] font-bold text-primary uppercase">{activeSnag.snag_number}</span>
                <h3 className="text-sm font-bold text-foreground mt-0.5 truncate max-w-[320px]">{activeSnag.title}</h3>
              </div>
              <div className="flex items-center gap-2">
                {canDeleteSnag() && (
                  <button
                    onClick={() => handleDeleteSnag(activeSnag.id)}
                    className="p-2 border border-border rounded-xl text-danger hover:bg-danger/10 transition-all"
                    title="Delete Snag Item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setActiveSnag(null)}
                  className="p-2 border border-border rounded-xl hover:bg-muted text-foreground transition-all"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Drawer Content (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Grid Metadata details */}
              <div className="grid grid-cols-2 gap-4 bg-background/50 border border-border p-4 rounded-2xl">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Category</span>
                  <p className="text-xs font-bold mt-1 text-foreground">
                    {categories.find(c => c.id === activeSnag.category_id)?.name || 'General'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Status</span>
                  <p className="text-xs font-bold mt-1 text-foreground uppercase">
                    {activeSnag.status.replace('_', ' ')}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Priority</span>
                  <p className="text-xs font-bold mt-1 text-foreground uppercase">
                    {activeSnag.priority}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Due Date</span>
                  <p className="text-xs font-bold mt-1 text-foreground">
                    {activeSnag.due_date || 'No Date'}
                  </p>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold">Detail Description</span>
                  <p className="text-xs mt-1 text-muted-foreground leading-normal">
                    {activeSnag.description || 'No description provided.'}
                  </p>
                </div>
              </div>

              {/* Photo Section */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-primary" /> Inspection Photos Gallery
                </h4>
                
                {/* Photo Grid list */}
                <div className="grid grid-cols-2 gap-3">
                  {activeSnagPhotos.length === 0 ? (
                    <div className="col-span-2 border-2 border-dashed border-border p-8 text-center text-xs text-muted-foreground rounded-2xl bg-background/30">
                      No photos uploaded for this snag. Use the form below to upload.
                    </div>
                  ) : (
                    activeSnagPhotos.map((p) => (
                      <div key={p.id} className="relative rounded-2xl overflow-hidden border border-border shadow-sm group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.photo_url} alt={p.caption} className="object-cover w-full h-28" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-between text-white">
                          <span className="text-[9px] uppercase font-black bg-primary px-1.5 py-0.5 rounded-md self-start">
                            {p.photo_type} Photo
                          </span>
                          <div>
                            <p className="text-[10px] leading-tight font-semibold">{p.caption}</p>
                            <span className="text-[8px] text-gray-300 mt-1 block">
                              Uploaded: {new Date(p.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Upload Photo Form */}
                {user?.role !== 'read_only' && (
                  <form onSubmit={handleAddPhoto} className="bg-muted/20 p-3 rounded-2xl border border-border/80 space-y-3">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Upload inspection photo</span>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPhotoUploadType('before')}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                          photoUploadType === 'before' ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-background text-muted-foreground'
                        }`}
                      >
                        Before Photo
                      </button>
                      <button
                        type="button"
                        onClick={() => setPhotoUploadType('after')}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                          photoUploadType === 'after' ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-background text-muted-foreground'
                        }`}
                      >
                        After Photo
                      </button>
                    </div>

                    <input
                      type="text"
                      placeholder="Mock Photo URL (e.g., https://...)"
                      value={photoMockUrl}
                      onChange={(e) => setPhotoMockUrl(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-[10px] text-foreground outline-none focus:border-primary"
                    />

                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Caption (e.g. Scratches on door panel)"
                        value={photoCaption}
                        onChange={(e) => setPhotoCaption(e.target.value)}
                        className="flex-1 bg-background border border-border rounded-xl px-3 py-2 text-[10px] text-foreground outline-none focus:border-primary"
                        required
                      />
                      <button
                        type="submit"
                        className="bg-primary hover:bg-primary/95 text-white text-[10px] font-bold px-4 rounded-xl transition-all"
                      >
                        Upload
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Comments Section */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-primary" /> Remarks & Comments Thread
                </h4>
                
                {/* Comments List */}
                <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                  {activeSnagComments.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4 bg-background/30 rounded-xl border border-border border-dashed">
                      No remarks posted. Add a comment to starting the thread.
                    </p>
                  ) : (
                    activeSnagComments.map((c) => {
                      const commUser = profiles.find(p => p.id === c.user_id);
                      return (
                        <div key={c.id} className="p-3 border border-border rounded-xl bg-background/50 space-y-1">
                          <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                            <span className="font-bold text-foreground">{commUser ? commUser.full_name : 'User'}</span>
                            <span>{new Date(c.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                          </div>
                          <p className="text-xs text-foreground mt-1 leading-normal">{c.comment}</p>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Add Comment Form */}
                {user?.role !== 'read_only' && (
                  <form onSubmit={handleAddComment} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add an inspection remark..."
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                      className="flex-1 bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-all"
                      required
                    />
                    <button
                      type="submit"
                      className="bg-primary hover:bg-primary/95 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all"
                    >
                      Comment
                    </button>
                  </form>
                )}
              </div>

              {/* Audit Trail History */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider text-muted-foreground">Audit History Logs</h4>
                <div className="border border-border rounded-xl bg-background/30 p-3 divide-y divide-border/60 max-h-40 overflow-y-auto">
                  {activeSnagHistory.map((h) => {
                    const u = profiles.find(p => p.id === h.user_id);
                    return (
                      <div key={h.id} className="py-2 first:pt-0 last:pb-0 text-[10px] text-muted-foreground">
                        <div className="flex justify-between font-semibold text-foreground">
                          <span>{h.action.replace('_', ' ').toUpperCase()}</span>
                          <span>{new Date(h.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="mt-0.5 leading-normal">{h.details}</p>
                        <span className="text-[9px] mt-1 block">Logged by: {u?.full_name || 'System'}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
