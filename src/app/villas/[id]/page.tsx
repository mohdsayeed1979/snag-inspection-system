// Enterprise Project QA/QC Inspection Space (Checklist, Document Vault, Form Builder, Snag Details drawer)
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  dbService, 
  Project, 
  ProjectNode, 
  InspectionItem, 
  InspectionCategory, 
  Profile, 
  InspectionPhoto, 
  InspectionComment,
  InspectionHistory,
  ProjectDocumentFolder,
  ProjectDocument
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
  Plus,
  Folder,
  FolderOpen,
  ChevronRight,
  MapPin,
  Map,
  ClipboardCheck,
  FileCode,
  CheckSquare,
  FileCheck,
  CheckCircle,
  Star,
  CheckSquare2,
  HardHat,
  Briefcase,
  X
} from 'lucide-react';

export default function ProjectDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = params.id as string;
  const { user, currentCompany, canCreateSnag, canEditSnag, canChangeStatus, canDeleteSnag } = useAuth();
  
  // Tabs State: 'checklist' | 'documents'
  const [activeTab, setActiveTab] = useState<'checklist' | 'documents'>('checklist');

  // Data State
  const [project, setProject] = useState<Project | null>(null);
  const [nodes, setNodes] = useState<ProjectNode[]>([]);
  const [items, setItems] = useState<InspectionItem[]>([]);
  const [categories, setCategories] = useState<InspectionCategory[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);

  // Tree Navigation State
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [nodeBreadcrumbs, setNodeBreadcrumbs] = useState<ProjectNode[]>([]);

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

  // Project Documents State
  const [docFolders, setDocFolders] = useState<ProjectDocumentFolder[]>([]);
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [showAddFolderModal, setShowAddFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showAddDocModal, setShowAddDocModal] = useState(false);
  const [newDocName, setNewDocName] = useState('');
  const [newDocUrl, setNewDocUrl] = useState('');
  const [newDocType, setNewDocType] = useState('pdf');

  // Dynamic Form responses state for active snag
  const [formResponses, setFormResponses] = useState<Record<string, any>>({});

  const loadData = () => {
    const projectsList = dbService.getProjects();
    let currentProj = projectsList.find(p => p.id === projectId);
    let initialNodeId: string | null = currentNodeId;

    if (!currentProj) {
      // It might be a villa ID or node ID
      const allNodes = dbService.getProjectNodes();
      const matchedNode = allNodes.find(n => n.id === projectId);
      if (matchedNode) {
        currentProj = projectsList.find(p => p.id === matchedNode.project_id);
        initialNodeId = matchedNode.id;
      } else {
        // Fallback checks
        const legacyVillas = dbService.getVillas();
        const matchedVilla = legacyVillas.find(v => v.id === projectId);
        if (matchedVilla) {
          initialNodeId = matchedVilla.id;
          const legacyBlocks = dbService.getBlocks();
          const matchedBlock = legacyBlocks.find(b => b.id === matchedVilla.block_id);
          if (matchedBlock) {
            currentProj = projectsList.find(p => p.id === matchedBlock.project_id);
          }
        }
      }
    }
    
    if (currentProj) {
      setProject(currentProj);
      setCategories(dbService.getCategories());
      setProfiles(dbService.getProfiles());
      
      const allNodes = dbService.getProjectNodesByProjectId(currentProj.id);
      setNodes(allNodes);
      
      // Default node navigation
      if (initialNodeId) {
        setCurrentNodeId(initialNodeId);
      } else {
        const roots = allNodes.filter(n => n.parent_id === null);
        if (roots.length > 0 && currentNodeId === null) {
          setCurrentNodeId(roots[0].id);
        }
      }

      // Load Document Vault files
      setDocFolders(dbService.getDocumentFolders(currentProj.id));
      setDocuments(dbService.getDocuments(currentProj.id));

      // Fetch active items
      const allItems = dbService.getInspectionItems();
      setItems(allItems);
    } else {
      router.push('/villas');
    }
  };

  useEffect(() => {
    loadData();
    // Check initial search tab override
    const tabParam = searchParams.get('tab');
    if (tabParam === 'documents') {
      setActiveTab('documents');
    }
  }, [projectId, currentCompany]);

  // Sync breadcrumbs based on currentNodeId selection
  useEffect(() => {
    if (currentNodeId) {
      const crumbs: ProjectNode[] = [];
      let nextNode = nodes.find(n => n.id === currentNodeId);
      while (nextNode) {
        crumbs.unshift(nextNode);
        nextNode = nodes.find(n => n.id === nextNode?.parent_id);
      }
      setNodeBreadcrumbs(crumbs);
    }
  }, [currentNodeId, nodes]);

  // Load active snag comments, photos, audit history, and form responses
  useEffect(() => {
    if (activeSnag) {
      setActiveSnagComments(dbService.getCommentsBySnagId(activeSnag.id));
      setActiveSnagPhotos(dbService.getPhotosBySnagId(activeSnag.id));
      setActiveSnagHistory(dbService.getHistoryBySnagId(activeSnag.id));
      setFormResponses(activeSnag.form_responses || {});
    }
  }, [activeSnag]);

  // Tree helper: Find leaf nodes recursively under a node (so we can filter snags in parent locations)
  const getLeafNodeIds = (nodeId: string): string[] => {
    const directChildren = nodes.filter(n => n.parent_id === nodeId);
    if (directChildren.length === 0) return [nodeId];
    return directChildren.flatMap(child => getLeafNodeIds(child.id));
  };

  // Find leaf nodes under current location
  const currentLeafIds = currentNodeId ? getLeafNodeIds(currentNodeId) : [];

  // Filter snag items
  const filteredItems = items.filter((item) => {
    // Verify it belongs to the current focused company
    if (currentCompany && item.company_id !== currentCompany.id) return false;

    // Verify it is inside our active sub-tree location scope
    const isMatchedLocation = currentNodeId 
      ? (item.location_node_id === currentNodeId || currentLeafIds.includes(item.location_node_id || '') || item.villa_id === currentNodeId || currentLeafIds.includes(item.villa_id || ''))
      : true;

    if (!isMatchedLocation) return false;

    // Query Search
    const q = search.toLowerCase();
    const searchMatch = 
      item.snag_number.toLowerCase().includes(q) ||
      item.title.toLowerCase().includes(q) ||
      (item.description && item.description.toLowerCase().includes(q)) ||
      (item.room && item.room.toLowerCase().includes(q)) ||
      (item.remarks && item.remarks.toLowerCase().includes(q));

    // Filters
    const statusMatch = statusFilter === 'all' || item.status === statusFilter;
    const priorityMatch = priorityFilter === 'all' || item.priority === priorityFilter;
    const categoryMatch = categoryFilter === 'all' || item.category_id === categoryFilter;

    return searchMatch && statusMatch && priorityMatch && categoryMatch;
  });

  // Handle snag status transition update
  const handleStatusChange = (newStatus: any) => {
    if (!activeSnag || !user) return;
    const updated = dbService.updateInspectionItem({
      ...activeSnag,
      status: newStatus
    }, user.id);
    setActiveSnag(updated);
    loadData();
  };

  // Save Dynamic form inputs
  const handleSaveFormValue = (key: string, value: any) => {
    if (!activeSnag || !user) return;
    const updatedResponses = { ...formResponses, [key]: value };
    setFormResponses(updatedResponses);

    const updatedItem = dbService.updateInspectionItem({
      ...activeSnag,
      form_responses: updatedResponses
    }, user.id);
    setActiveSnag(updatedItem);
    loadData();
  };

  // Submit Comments
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSnag || !newCommentText.trim() || !user) return;
    dbService.addComment(activeSnag.id, newCommentText, user.id);
    setNewCommentText('');
    setActiveSnagComments(dbService.getCommentsBySnagId(activeSnag.id));
    setActiveSnagHistory(dbService.getHistoryBySnagId(activeSnag.id));
  };

  // Add Photo Mock
  const handleAddPhotoMock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSnag || !photoMockUrl.trim() || !user) return;
    dbService.addPhoto(activeSnag.id, photoMockUrl, photoUploadType, photoCaption || 'Inspection photo log', user.id);
    setPhotoMockUrl('');
    setPhotoCaption('');
    setActiveSnagPhotos(dbService.getPhotosBySnagId(activeSnag.id));
    setActiveSnagHistory(dbService.getHistoryBySnagId(activeSnag.id));
  };

  // Add Snag manually
  const handleCreateSnag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSnagTitle || !user || !currentNodeId) return;

    dbService.addInspectionItem({
      villa_id: currentNodeId, // Legacy mapping
      location_node_id: currentNodeId, // New generic location mapping
      category_id: newSnagCatId || undefined,
      title: newSnagTitle,
      description: newSnagDesc,
      priority: newSnagPriority,
      status: 'open',
      location: newSnagLocation,
      room: newSnagRoom,
      remarks: 'Manually logged inspect audit.',
      inspection_date: new Date().toISOString().split('T')[0]
    }, user.id);

    setNewSnagTitle('');
    setNewSnagDesc('');
    setShowAddSnagModal(false);
    loadData();
  };

  // Add Document Folder
  const handleAddFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName || !project) return;
    dbService.addDocumentFolder({
      project_id: project.id,
      name: newFolderName,
      parent_id: currentFolderId
    });
    setNewFolderName('');
    setShowAddFolderModal(false);
    loadData();
  };

  // Add Document File
  const handleAddDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName || !newDocUrl || !project) return;
    dbService.addDocument({
      folder_id: currentFolderId,
      project_id: project.id,
      name: newDocName,
      file_url: newDocUrl,
      file_size: Math.floor(Math.random() * 2000000) + 100000,
      file_type: newDocType,
      uploaded_by: user?.id || 'u-admin'
    });
    setNewDocName('');
    setNewDocUrl('');
    setShowAddDocModal(false);
    loadData();
  };

  // Excel Import Trigger
  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentNodeId) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await parseChecklistExcel(arrayBuffer, dbService.getVillas(), categories);
      
      if (result.errors.filter(err => err.severity === 'error').length > 0) {
        setImportStatus('error');
        setImportErrors(result.errors.map(err => `Row ${err.row}: ${err.error}`));
      } else {
        const companyId = currentCompany?.id || 'c0000000-0000-0000-0000-000000000000';
        const itemsToSave = result.itemsParsed.map(item => ({
          ...item,
          villa_id: currentNodeId,
          location_node_id: currentNodeId,
          company_id: companyId
        }));

        saveImportedItems(itemsToSave, user?.id || 'u-admin');
        setImportStatus('success');
        setImportErrors(result.errors.map(err => `Row ${err.row} (Warning): ${err.error}`));
        loadData();
        setTimeout(() => setImportStatus('idle'), 4000);
      }
    } catch (err: any) {
      setImportStatus('error');
      setImportErrors([err.message || 'Error parsing file.']);
    }
  };

  // Export Trigger
  const handleExport = async () => {
    if (!project) return;
    
    const options: ExportOptions = {
      orientation: exportOrientation,
      paperSize: exportPaperSize,
      includePhotos,
      includeComments,
      includeClosedItems,
      preparedBy: user?.full_name || 'QC Inspector'
    };

    const reportTitle = `${project.name} QA/QC Inspection Report`;
    const targetNode = nodes.find(n => n.id === currentNodeId);
    const mockVillasWrapper = targetNode ? [{
      id: targetNode.id,
      block_id: targetNode.parent_id || 'block-a',
      company_id: targetNode.company_id,
      villa_number: targetNode.name,
      owner: project.owner,
      contractor: project.contractor,
      consultant: project.consultant,
      engineer: project.engineer,
      completion_rate: targetNode.completion_rate,
      created_at: targetNode.created_at
    }] : [];

    const blocksWrapper = dbService.getBlocks();

    if (exportFormat === 'excel') {
      const blob = await exportCenter.exportToExcel(filteredItems, project, mockVillasWrapper, blocksWrapper, categories, profiles, reportTitle, options);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.name.replace(/\s+/g, '_')}_SnagList.xlsx`;
      a.click();
    } else {
      const blob = await exportCenter.exportToPdf(filteredItems, project, mockVillasWrapper, blocksWrapper, categories, profiles, reportTitle, options);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.name.replace(/\s+/g, '_')}_Report.pdf`;
      a.click();
    }
    
    setShowExportModal(false);
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-danger/10 text-danger border border-danger/15';
      case 'high': return 'bg-warning/10 text-warning border border-warning/15';
      case 'medium': return 'bg-accent/15 text-primary border border-primary/10';
      case 'low': default: return 'bg-muted-foreground/10 text-muted-foreground';
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'closed': return 'bg-success/15 text-success border border-success/20';
      case 'qa_verification': return 'bg-accent/20 text-primary border border-accent/25';
      case 'rectified': return 'bg-success/10 text-success/90 border border-success/15';
      case 'in_progress': return 'bg-warning/15 text-warning border border-warning/20';
      case 'open': default: return 'bg-danger/15 text-danger border border-danger/20';
    }
  };

  if (!project) return null;

  // Active level name helper (e.g. Block/Villa)
  const activeLevelName = (project.level_structure || ['Block', 'Villa'])[nodeBreadcrumbs.length] || 'Sub Unit';
  const parentNode = nodes.find(n => n.id === currentNodeId);
  const childNodes = nodes.filter(n => n.parent_id === currentNodeId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      
      {/* 1. Header with Breadcrumbs & Title */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <Link href="/villas" className="p-2 border border-border bg-card rounded-xl hover:bg-muted text-foreground transition-all">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-foreground">{project.name}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Project Code: <strong>{project.project_code || 'PROJ-01'}</strong> | Main Contractor: {project.contractor}</p>
          </div>
        </div>

        {/* Node Hierarchy Navigation Breadcrumbs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-card border border-border px-4 py-2.5 rounded-xl text-xs font-semibold text-muted-foreground shadow-sm">
          <button 
            onClick={() => {
              const roots = nodes.filter(n => n.parent_id === null);
              if (roots.length > 0) setCurrentNodeId(roots[0].id);
            }} 
            className="hover:text-primary transition-colors flex items-center gap-1"
          >
            <Map className="w-3.5 h-3.5" /> root
          </button>
          
          {nodeBreadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.id}>
              <ChevronRight className="w-3.5 h-3.5 text-muted/50" />
              <button 
                onClick={() => setCurrentNodeId(crumb.id)} 
                className={`hover:text-primary transition-colors truncate max-w-[120px] ${idx === nodeBreadcrumbs.length - 1 ? 'text-foreground font-extrabold' : ''}`}
              >
                {crumb.name}
              </button>
            </React.Fragment>
          ))}

          {parentNode && (
            <span className="ml-auto text-[10px] bg-secondary/35 text-primary border border-accent/15 px-2.5 py-0.5 rounded-full font-bold">
              Progress: {parentNode.completion_rate}%
            </span>
          )}
        </div>
      </div>

      {/* 2. Sub-Locations Node Selector Grid */}
      {childNodes.length > 0 && (
        <div className="space-y-2 animate-in slide-in-from-top-1 duration-150">
          <h3 className="text-[10px] uppercase font-black text-muted-foreground tracking-widest flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-primary" />
            Browse Sub-locations under {parentNode?.name} ({activeLevelName})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {childNodes.map(child => (
              <div 
                key={child.id}
                onClick={() => setCurrentNodeId(child.id)}
                className="bg-card border border-border hover:border-primary/35 p-3 rounded-xl shadow-sm hover:shadow cursor-pointer transition-all flex flex-col justify-between h-[90px]"
              >
                <span className="text-xs font-bold text-foreground truncate block">{child.name}</span>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[9px] text-muted-foreground uppercase font-bold">{child.node_type}</span>
                  <span className="text-[10px] font-extrabold text-primary">{child.completion_rate}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Primary Workspace Tabs */}
      <div className="flex gap-4 border-b border-border">
        <button
          onClick={() => setActiveTab('checklist')}
          className={`pb-3 font-bold text-xs uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'checklist' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Audit Checklist ({filteredItems.length})
        </button>
        <button
          onClick={() => setActiveTab('documents')}
          className={`pb-3 font-bold text-xs uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'documents' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Document Vault ({documents.length})
        </button>
      </div>

      {/* 4. Tab Contents */}
      {activeTab === 'checklist' ? (
        <div className="space-y-4">
          
          {/* Action Row */}
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between bg-card border border-border p-4 rounded-2xl shadow-sm">
            {/* Search */}
            <div className="relative w-full lg:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search location items..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-background border border-border rounded-xl pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
              />
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap gap-2 w-full lg:w-auto items-center">
              {/* Category */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-background border border-border rounded-xl px-2.5 py-2 text-xs text-foreground outline-none"
              >
                <option value="all">All Categories</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              {/* Status */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-background border border-border rounded-xl px-2.5 py-2 text-xs text-foreground outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="open">Open</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">In Progress</option>
                <option value="rectified">Rectified</option>
                <option value="qa_verification">QA Verification</option>
                <option value="closed">Closed</option>
              </select>

              {/* Priority */}
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="bg-background border border-border rounded-xl px-2.5 py-2 text-xs text-foreground outline-none"
              >
                <option value="all">All Priorities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              {/* Excel Import button */}
              {canCreateSnag() && (
                <div className="relative">
                  <input
                    type="file"
                    accept=".xlsx, .xls"
                    ref={fileInputRef}
                    onChange={handleExcelImport}
                    className="hidden"
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 bg-secondary hover:bg-secondary/80 text-primary border border-accent/15 px-3 py-2 rounded-xl text-xs font-semibold transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" /> Import Excel
                  </button>
                </div>
              )}

              {/* Export Report button */}
              <button 
                onClick={() => setShowExportModal(true)}
                className="flex items-center gap-1.5 border border-border hover:bg-muted text-foreground px-3 py-2 rounded-xl text-xs font-semibold transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-primary" /> Export Report
              </button>

              {/* Create Snag */}
              {canCreateSnag() && (
                <button 
                  onClick={() => setShowAddSnagModal(true)}
                  className="flex items-center gap-1.5 bg-primary hover:bg-primary/95 text-white px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors shadow shadow-primary/10"
                >
                  <Plus className="w-3.5 h-3.5" /> Log Item
                </button>
              )}
            </div>
          </div>

          {/* Import warning dialog */}
          {importStatus === 'error' && (
            <div className="bg-danger/10 border border-danger/20 text-danger p-4 rounded-xl text-xs space-y-1">
              <p className="font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> Excel Import Failed:
              </p>
              <ul className="list-disc list-inside pl-2">
                {importErrors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {importStatus === 'success' && (
            <div className="bg-success/15 border border-success/20 text-success p-4 rounded-xl text-xs font-bold flex items-center gap-2">
              <Check className="w-4 h-4" /> Excel checklist imported successfully with no errors!
            </div>
          )}

          {/* Datatable */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/20 text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                    <th className="px-6 py-4">Item Code</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Location/Room</th>
                    <th className="px-6 py-4">Title / Audit Description</th>
                    <th className="px-6 py-4">Priority</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs">
                  {filteredItems.map((item) => {
                    const catObj = categories.find(c => c.id === item.category_id);
                    return (
                      <tr key={item.id} className="hover:bg-muted/10 transition-colors">
                        <td className="px-6 py-4 font-black text-primary whitespace-nowrap">{item.snag_number}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{catObj?.name || 'General'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-semibold text-foreground">{item.location || 'General'}</span>
                          <span className="text-[10px] text-muted-foreground block">{item.room || 'General'}</span>
                        </td>
                        <td className="px-6 py-4 font-medium text-foreground leading-normal max-w-sm truncate">
                          {item.title}
                          <span className="text-[10px] text-muted-foreground block truncate mt-0.5">{item.description}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-md text-[9px] uppercase font-bold ${getPriorityStyle(item.priority)}`}>
                            {item.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-full text-[9px] uppercase font-bold ${getStatusStyle(item.status)}`}>
                            {item.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <button
                            onClick={() => setActiveSnag(item)}
                            className="p-1.5 text-primary border border-accent/15 bg-secondary/25 hover:bg-secondary rounded-lg transition-colors inline-flex items-center justify-center"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredItems.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground text-xs">
                        No inspection snags logged under this location block.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        // --- 5. Project Document Vault View ---
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex justify-between items-center bg-card border border-border p-4 rounded-2xl shadow-sm">
            {/* Breadcrumb for Document Vault */}
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <FolderOpen className="w-4 h-4 text-primary" />
              <button onClick={() => setCurrentFolderId(null)} className="hover:text-primary">Root Files</button>
              {currentFolderId && (
                <>
                  <ChevronRight className="w-3.5 h-3.5" />
                  <span className="text-foreground font-bold">{docFolders.find(f => f.id === currentFolderId)?.name}</span>
                </>
              )}
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => setShowAddFolderModal(true)}
                className="flex items-center gap-1 border border-border hover:bg-muted text-foreground text-xs font-semibold px-3 py-2 rounded-xl transition-all"
              >
                <Folder className="w-3.5 h-3.5" /> New Folder
              </button>
              <button 
                onClick={() => setShowAddDocModal(true)}
                className="flex items-center gap-1 bg-primary hover:bg-primary/95 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition-all shadow shadow-primary/10"
              >
                <Upload className="w-3.5 h-3.5" /> Upload Document
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* List Folders */}
            <div className="bg-card border border-border p-4 rounded-2xl shadow-sm md:col-span-1 space-y-2 h-[350px] overflow-y-auto">
              <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-wider mb-2">Folder Directories</h4>
              <button 
                onClick={() => setCurrentFolderId(null)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${currentFolderId === null ? 'bg-secondary/40 text-primary border border-accent/15' : 'hover:bg-muted/40 text-muted-foreground'}`}
              >
                <FolderOpen className="w-4 h-4" /> Root Directories
              </button>
              {docFolders.map(folder => (
                <button
                  key={folder.id}
                  onClick={() => setCurrentFolderId(folder.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 truncate ${currentFolderId === folder.id ? 'bg-secondary/40 text-primary border border-accent/15' : 'hover:bg-muted/40 text-muted-foreground'}`}
                >
                  <Folder className="w-4 h-4 text-primary shrink-0" />
                  {folder.name}
                </button>
              ))}
            </div>

            {/* List Files */}
            <div className="bg-card border border-border p-4 rounded-2xl shadow-sm md:col-span-3 h-[350px] overflow-y-auto">
              <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-wider mb-4">Uploaded Specifications & Drawings</h4>
              <div className="space-y-3">
                {documents.filter(doc => doc.folder_id === currentFolderId).map(doc => (
                  <div key={doc.id} className="p-3 border border-border rounded-xl bg-background/50 hover:bg-muted/10 transition-colors flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
                        {doc.file_type === 'pdf' ? <FileText className="w-5 h-5" /> : <FileSpreadsheet className="w-5 h-5" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">{doc.name}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Version {doc.version} | Size: {Math.round(doc.file_size ? doc.file_size / 1024 : 0)} KB | Uploaded: {new Date(doc.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <a 
                      href={doc.file_url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="px-3 py-1.5 text-[10px] font-extrabold bg-secondary/30 hover:bg-secondary text-primary border border-accent/15 rounded-lg shrink-0"
                    >
                      Download
                    </a>
                  </div>
                ))}

                {documents.filter(doc => doc.folder_id === currentFolderId).length === 0 && (
                  <div className="text-center py-16 text-xs text-muted-foreground">
                    No files found inside this directory. Select another folder or upload files.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------ */}
      {/* EXPORT OPTIONS MODAL */}
      {/* ------------------------------------------ */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowExportModal(false)} />
          
          <div className="relative bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-sm font-bold text-foreground mb-4">Export Quality Audit Report</h3>
            
            <div className="space-y-4">
              {/* Format */}
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1.5">Document Format</label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setExportFormat('excel')}
                    className={`py-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 ${exportFormat === 'excel' ? 'border-primary bg-secondary/20 text-primary' : 'border-border text-muted-foreground'}`}
                  >
                    <FileSpreadsheet className="w-4 h-4" /> Excel Matrix
                  </button>
                  <button 
                    onClick={() => setExportFormat('pdf')}
                    className={`py-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 ${exportFormat === 'pdf' ? 'border-primary bg-secondary/20 text-primary' : 'border-border text-muted-foreground'}`}
                  >
                    <FileText className="w-4 h-4" /> PDF Report
                  </button>
                </div>
              </div>

              {exportFormat === 'pdf' && (
                <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-1 duration-150">
                  {/* Page Orientation */}
                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1.5">Orientation</label>
                    <select
                      value={exportOrientation}
                      onChange={(e) => setExportOrientation(e.target.value as any)}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs outline-none text-foreground"
                    >
                      <option value="portrait">Portrait</option>
                      <option value="landscape">Landscape</option>
                    </select>
                  </div>
                  {/* Paper Size */}
                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1.5">Paper Size</label>
                    <select
                      value={exportPaperSize}
                      onChange={(e) => setExportPaperSize(e.target.value as any)}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs outline-none text-foreground"
                    >
                      <option value="a4">A4 Standard</option>
                      <option value="letter">US Letter</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Settings Checkboxes */}
              <div className="space-y-2 pt-2 border-t border-border">
                <label className="flex items-center gap-2.5 text-xs text-foreground cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={includePhotos} 
                    onChange={(e) => setIncludePhotos(e.target.checked)}
                    className="w-4 h-4 rounded text-primary focus:ring-primary/20 border-border"
                  />
                  <span>Include uploaded snag photos</span>
                </label>
                <label className="flex items-center gap-2.5 text-xs text-foreground cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={includeComments} 
                    onChange={(e) => setIncludeComments(e.target.checked)}
                    className="w-4 h-4 rounded text-primary focus:ring-primary/20 border-border"
                  />
                  <span>Include inspector comments timeline</span>
                </label>
                <label className="flex items-center gap-2.5 text-xs text-foreground cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={includeClosedItems} 
                    onChange={(e) => setIncludeClosedItems(e.target.checked)}
                    className="w-4 h-4 rounded text-primary focus:ring-primary/20 border-border"
                  />
                  <span>Include closed/rectified snags</span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-4 border-t border-border">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="px-4 py-2.5 border border-border hover:bg-muted text-foreground text-xs rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExport}
                  className="px-5 py-2.5 bg-primary hover:bg-primary/95 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-primary/10"
                >
                  Generate File
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------ */}
      {/* ADD INSPECTION ITEM MODAL */}
      {/* ------------------------------------------ */}
      {showAddSnagModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddSnagModal(false)} />
          
          <div className="relative bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-sm font-bold text-foreground mb-4">Log Inspection Item</h3>
            
            <form onSubmit={handleCreateSnag} className="space-y-4">
              {/* Category */}
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1.5">Category</label>
                <select
                  value={newSnagCatId}
                  onChange={(e) => setNewSnagCatId(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs outline-none text-foreground"
                  required
                >
                  <option value="">Select category...</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1.5">Item Title</label>
                <input
                  type="text"
                  placeholder="e.g. Scratches on panels, Leakage"
                  value={newSnagTitle}
                  onChange={(e) => setNewSnagTitle(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs outline-none text-foreground"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1.5">Audit Description</label>
                <textarea
                  placeholder="Details of structural defect or parameter check status..."
                  value={newSnagDesc}
                  onChange={(e) => setNewSnagDesc(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs outline-none text-foreground h-16 resize-none"
                />
              </div>

              {/* Location & Room */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1.5">Location</label>
                  <input
                    type="text"
                    value={newSnagLocation}
                    onChange={(e) => setNewSnagLocation(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs outline-none text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1.5">Room/Zone</label>
                  <input
                    type="text"
                    value={newSnagRoom}
                    onChange={(e) => setNewSnagRoom(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs outline-none text-foreground"
                  />
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1.5">Severity Priority</label>
                <select
                  value={newSnagPriority}
                  onChange={(e) => setNewSnagPriority(e.target.value as any)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs outline-none text-foreground"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddSnagModal(false)}
                  className="px-4 py-2.5 border border-border hover:bg-muted text-foreground text-xs rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-primary hover:bg-primary/95 text-white font-bold text-xs rounded-xl transition-all shadow shadow-primary/10"
                >
                  Submit Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------ */}
      {/* CREATE DOCUMENT FOLDER MODAL */}
      {/* ------------------------------------------ */}
      {showAddFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddFolderModal(false)} />
          <div className="relative bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-sm font-bold text-foreground mb-4">Create Folder Directory</h3>
            <form onSubmit={handleAddFolder} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1.5">Folder Name</label>
                <input
                  type="text"
                  placeholder="e.g. Architectural Shop Drawings"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs outline-none text-foreground"
                  required
                />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowAddFolderModal(false)} className="px-4 py-2 text-xs border border-border rounded-xl hover:bg-muted">Cancel</button>
                <button type="submit" className="px-4 py-2 text-xs bg-primary text-white rounded-xl font-bold">Create Folder</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------ */}
      {/* UPLOAD DOCUMENT MODAL */}
      {/* ------------------------------------------ */}
      {showAddDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowAddDocModal(false)} />
          <div className="relative bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-sm font-bold text-foreground mb-4">Upload Document File</h3>
            <form onSubmit={handleAddDoc} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1.5">Document File Name</label>
                <input
                  type="text"
                  placeholder="e.g. Kitchen Layout Plan Rev3"
                  value={newDocName}
                  onChange={(e) => setNewDocName(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs outline-none text-foreground"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1.5">Mock Document URL</label>
                <input
                  type="text"
                  placeholder="e.g. https://pdfobject.com/pdf/sample.pdf"
                  value={newDocUrl}
                  onChange={(e) => setNewDocUrl(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs outline-none text-foreground"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1.5">File Format Type</label>
                <select
                  value={newDocType}
                  onChange={(e) => setNewDocType(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs outline-none text-foreground"
                >
                  <option value="pdf">PDF Document</option>
                  <option value="excel">Excel Sheet</option>
                  <option value="drawing">CAD / Shop Drawing</option>
                  <option value="other">Other Specification File</option>
                </select>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowAddDocModal(false)} className="px-4 py-2 text-xs border border-border rounded-xl hover:bg-muted">Cancel</button>
                <button type="submit" className="px-4 py-2 text-xs bg-primary text-white rounded-xl font-bold">Upload File</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------ */}
      {/* SNAG DETAIL DRAWER (WITH DYNAMIC FORMS & AUDIT DETAILS) */}
      {/* ------------------------------------------ */}
      {activeSnag && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setActiveSnag(null)} />
          
          {/* Drawer Panel */}
          <div className="relative w-full max-w-2xl bg-card border-l border-border h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200 z-10">
            {/* Header */}
            <div className="p-6 border-b border-border flex items-center justify-between bg-muted/20">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-primary uppercase tracking-widest">{activeSnag.snag_number}</span>
                  <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold ${getPriorityStyle(activeSnag.priority)}`}>
                    {activeSnag.priority}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-foreground mt-1">{activeSnag.title}</h3>
              </div>
              <button 
                onClick={() => setActiveSnag(null)} 
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Basic Meta Grid */}
              <div className="grid grid-cols-2 gap-4 bg-background/50 border border-border p-4 rounded-xl text-xs">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">Status State</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${getStatusStyle(activeSnag.status)}`}>
                    {activeSnag.status.replace('_', ' ')}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block mb-1">Location Room</span>
                  <span className="font-semibold text-foreground">{activeSnag.location} - {activeSnag.room}</span>
                </div>
              </div>

              {/* Status Action Buttons (Role Restricted) */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider block">Workflow Actions</span>
                <div className="flex flex-wrap gap-2">
                  {['open', 'in_progress', 'rectified', 'qa_verification', 'closed'].map((st) => {
                    const isAllowed = canChangeStatus(st);
                    const isCurrent = activeSnag.status === st;
                    return (
                      <button
                        key={st}
                        onClick={() => handleStatusChange(st)}
                        disabled={!isAllowed || isCurrent}
                        className={`px-3.5 py-2 rounded-xl text-[10px] font-bold uppercase transition-all flex items-center gap-1.5 border ${
                          isCurrent 
                            ? 'bg-primary text-white border-primary shadow-sm' 
                            : isAllowed 
                            ? 'bg-background hover:bg-muted text-foreground border-border' 
                            : 'bg-muted/30 text-muted/50 border-border/40 cursor-not-allowed'
                        }`}
                      >
                        {isCurrent && <Check className="w-3.5 h-3.5" />}
                        {st.replace('_', ' ')}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Checklist Parameter Form Builder */}
              <div className="border-t border-border pt-5 space-y-4">
                <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-wider flex items-center gap-1">
                  <ClipboardCheck className="w-4 h-4 text-primary" />
                  Dynamic Checklist Parameters
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-background/30 p-4 border border-border rounded-xl text-xs space-y-2 md:space-y-0">
                  {/* Pass/Fail Parameter */}
                  <div className="flex flex-col gap-1.5">
                    <span className="font-bold text-muted-foreground">Parameter Audit State</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleSaveFormValue('pass_fail', 'pass')}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase border ${formResponses.pass_fail === 'pass' ? 'bg-success/15 text-success border-success' : 'border-border text-muted-foreground'}`}
                      >
                        Pass
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveFormValue('pass_fail', 'fail')}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase border ${formResponses.pass_fail === 'fail' ? 'bg-danger/15 text-danger border-danger' : 'border-border text-muted-foreground'}`}
                      >
                        Fail
                      </button>
                    </div>
                  </div>

                  {/* Rating parameters */}
                  <div className="flex flex-col gap-1.5">
                    <span className="font-bold text-muted-foreground">Quality Score (1-5 Stars)</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => handleSaveFormValue('rating', star)}
                          className="focus:outline-none"
                        >
                          <Star className={`w-5 h-5 ${star <= (formResponses.rating || 0) ? 'text-warning fill-warning' : 'text-muted'}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Yes/No Parameter */}
                  <div className="flex flex-col gap-1.5 pt-2 md:pt-0">
                    <span className="font-bold text-muted-foreground">Requirements Met</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleSaveFormValue('req_met', 'yes')}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase border ${formResponses.req_met === 'yes' ? 'bg-primary/10 text-primary border-primary' : 'border-border text-muted-foreground'}`}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveFormValue('req_met', 'no')}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase border ${formResponses.req_met === 'no' ? 'bg-danger/10 text-danger border-danger' : 'border-border text-muted-foreground'}`}
                      >
                        No
                      </button>
                    </div>
                  </div>

                  {/* Custom Measurement Number Input */}
                  <div className="flex flex-col gap-1.5 pt-2 md:pt-0">
                    <span className="font-bold text-muted-foreground">Measured Value (mm/C)</span>
                    <input
                      type="number"
                      placeholder="e.g. 18.5"
                      value={formResponses.measured_val || ''}
                      onChange={(e) => handleSaveFormValue('measured_val', parseFloat(e.target.value))}
                      className="bg-background border border-border rounded-lg px-2 py-1.5 text-xs text-foreground outline-none focus:border-primary w-full md:w-32"
                    />
                  </div>

                  {/* GPS Tagging coordinates */}
                  <div className="col-span-1 md:col-span-2 flex flex-col gap-1.5 pt-2">
                    <span className="font-bold text-muted-foreground">GPS Location Coordinates</span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. 24.7136, 46.6753"
                        value={formResponses.gps_coords || ''}
                        onChange={(e) => handleSaveFormValue('gps_coords', e.target.value)}
                        className="bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-primary flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveFormValue('gps_coords', '24.713601, 46.675298')}
                        className="px-3 py-1.5 bg-secondary hover:bg-secondary/80 text-primary text-[10px] font-extrabold border border-accent/15 rounded-lg"
                      >
                        Pin GPS
                      </button>
                    </div>
                  </div>

                  {/* Digital signature mock pad */}
                  <div className="col-span-1 md:col-span-2 flex flex-col gap-1.5 pt-2">
                    <span className="font-bold text-muted-foreground">Digital Handover Signature</span>
                    {formResponses.signature ? (
                      <div className="p-3 border border-dashed border-border rounded-lg flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground italic font-semibold">Signature signed by inspector ({formResponses.signature})</span>
                        <button
                          type="button"
                          onClick={() => handleSaveFormValue('signature', null)}
                          className="text-[9px] text-danger font-extrabold hover:underline"
                        >
                          Clear
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSaveFormValue('signature', user?.full_name || 'Inspector Signature')}
                        className="p-4 border-2 border-dashed border-border hover:border-primary hover:bg-muted/10 rounded-lg text-center text-xs font-bold text-muted-foreground transition-all"
                      >
                        Click to mock-sign signature pad
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Photos Gallery and Comparison */}
              <div className="border-t border-border pt-5 space-y-4">
                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider block">Before & After Audit Photos</span>
                <div className="grid grid-cols-2 gap-4">
                  {/* Before photo */}
                  <div className="border border-border rounded-xl p-3 bg-background flex flex-col h-[200px] justify-between">
                    <span className="text-[9px] font-black uppercase text-danger tracking-wider">Before Photo</span>
                    {activeSnagPhotos.find(p => p.photo_type === 'before') ? (
                      <div className="relative group overflow-hidden rounded-lg aspect-[4/3] flex-1 mt-2">
                        <img src={activeSnagPhotos.find(p => p.photo_type === 'before')?.photo_url} alt="Before check" className="object-cover w-full h-full" />
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground text-[10px] italic">No before photo logged</div>
                    )}
                  </div>

                  {/* After photo */}
                  <div className="border border-border rounded-xl p-3 bg-background flex flex-col h-[200px] justify-between">
                    <span className="text-[9px] font-black uppercase text-success tracking-wider">After Photo</span>
                    {activeSnagPhotos.find(p => p.photo_type === 'after') ? (
                      <div className="relative group overflow-hidden rounded-lg aspect-[4/3] flex-1 mt-2">
                        <img src={activeSnagPhotos.find(p => p.photo_type === 'after')?.photo_url} alt="After check" className="object-cover w-full h-full" />
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground text-[10px] italic">No after photo logged</div>
                    )}
                  </div>
                </div>

                {/* Add photo mock form */}
                {canEditSnag() && (
                  <form onSubmit={handleAddPhotoMock} className="bg-background border border-border p-4 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Upload Mock Photo Link</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setPhotoUploadType('before')}
                          className={`px-2 py-0.5 rounded text-[8px] uppercase font-bold border ${photoUploadType === 'before' ? 'bg-danger/10 text-danger border-danger' : 'border-border text-muted-foreground'}`}
                        >
                          Before
                        </button>
                        <button
                          type="button"
                          onClick={() => setPhotoUploadType('after')}
                          className={`px-2 py-0.5 rounded text-[8px] uppercase font-bold border ${photoUploadType === 'after' ? 'bg-success/10 text-success border-success' : 'border-border text-muted-foreground'}`}
                        >
                          After
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="https://images.unsplash.com/photo-..."
                        value={photoMockUrl}
                        onChange={(e) => setPhotoMockUrl(e.target.value)}
                        className="bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-primary flex-1"
                        required
                      />
                      <button
                        type="submit"
                        className="px-3 bg-primary text-white rounded-lg text-xs font-bold"
                      >
                        Upload
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add photo caption..."
                        value={photoCaption}
                        onChange={(e) => setPhotoCaption(e.target.value)}
                        className="bg-background border border-border rounded-lg px-2.5 py-1 text-[10px] text-foreground outline-none focus:border-primary flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => setPhotoMockUrl('https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?auto=format&fit=crop&w=600&q=80')}
                        className="px-2.5 text-[9px] bg-secondary hover:bg-secondary/80 text-primary border border-accent/15 rounded-lg font-bold"
                      >
                        Demo Image
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Inspector Comment Thread */}
              <div className="border-t border-border pt-5 space-y-4">
                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider block">Inspector Comment Timeline</span>
                
                <div className="space-y-3">
                  {activeSnagComments.map(c => {
                    const prof = profiles.find(p => p.id === c.user_id);
                    return (
                      <div key={c.id} className="p-3 border border-border bg-background rounded-xl text-xs space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-foreground">{prof ? prof.full_name : 'QC Member'}</span>
                          <span className="text-[9px] text-muted-foreground">{new Date(c.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                        </div>
                        <p className="text-muted-foreground leading-relaxed">{c.comment}</p>
                      </div>
                    );
                  })}
                  {activeSnagComments.length === 0 && (
                    <p className="text-[10px] italic text-muted-foreground text-center py-4">No comments logged on this audit snag.</p>
                  )}
                </div>

                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type remarks or comment..."
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    className="bg-background border border-border rounded-xl px-3.5 py-2 text-xs text-foreground outline-none focus:border-primary flex-1"
                    required
                  />
                  <button type="submit" className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl transition-all shadow shadow-primary/10">
                    Add
                  </button>
                </form>
              </div>

              {/* Audit History Log */}
              <div className="border-t border-border pt-5 space-y-3">
                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider block">Audit Trail Timeline</span>
                <div className="space-y-2.5 max-h-40 overflow-y-auto pr-1">
                  {activeSnagHistory.map(h => {
                    const prof = profiles.find(p => p.id === h.user_id);
                    return (
                      <div key={h.id} className="flex justify-between text-[10px] text-muted-foreground">
                        <span className="truncate max-w-[320px]">
                          <strong>{prof ? prof.full_name : 'System'}</strong>: {h.details}
                        </span>
                        <span className="shrink-0">{new Date(h.created_at).toLocaleDateString()}</span>
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
