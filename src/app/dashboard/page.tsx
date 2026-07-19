// Dashboard Screen (Global Super Admin view OR Company/Project specific metrics)
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { dbService, InspectionItem, Project, Company, ProjectNode, Profile } from '@/lib/db';
import { 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Activity, 
  Image as ImageIcon,
  Calendar,
  Sparkles,
  ArrowRight,
  Globe,
  Users,
  HardDrive,
  Cpu,
  FileCheck,
  TrendingUp,
  FolderOpen
} from 'lucide-react';
import Link from 'next/link';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line
} from 'recharts';

export default function Dashboard() {
  const { user, currentCompany } = useAuth();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [mounted, setMounted] = useState(false);
  
  // Dashboard states
  const [projects, setProjects] = useState<Project[]>([]);
  const [nodes, setNodes] = useState<ProjectNode[]>([]);
  const [allItems, setAllItems] = useState<InspectionItem[]>([]);
  const [allCompanies, setAllCompanies] = useState<Company[]>([]);
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);

  useEffect(() => {
    setMounted(true);
    setProjects(dbService.getProjects());
    setAllItems(dbService.getInspectionItems());
    setNodes(dbService.getProjectNodes());
    setAllCompanies(dbService.getCompanies());
    setAllProfiles(JSON.parse(localStorage.getItem('snaglist_profiles') || '[]'));
  }, [currentCompany]);

  // Default to first project when projects list loads
  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects]);

  if (!mounted) {
    return (
      <div className="h-[60vh] flex items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-muted-foreground animate-pulse">Loading dashboard metrics...</p>
        </div>
      </div>
    );
  }

  const activeProject = projects.find(p => p.id === selectedProjectId) || null;

  // Filter items for selected project
  const projectItems = allItems.filter(item => {
    if (!activeProject) return false;
    // Map either via location node or legacy villa_id
    const nodeObj = nodes.find(n => n.id === item.location_node_id || n.id === item.villa_id);
    return item.villa_id === activeProject.id || 
           (nodeObj && nodeObj.project_id === activeProject.id);
  });

  // Check if we show the Global Super Admin Dashboard
  const showGlobalDashboard = user?.role === 'super_admin' && !currentCompany;

  if (showGlobalDashboard) {
    // --- GLOBAL SUPER ADMIN DASHBOARD CALCULATIONS ---
    const totalCompanies = allCompanies.length;
    const totalProjects = JSON.parse(localStorage.getItem('snaglist_projects') || '[]').length;
    const totalUsers = allProfiles.length;
    const totalItemsCount = JSON.parse(localStorage.getItem('snaglist_items') || '[]').length;
    const totalOpenItems = JSON.parse(localStorage.getItem('snaglist_items') || '[]').filter((i: any) => i.status !== 'closed').length;

    // Company Activity Chart Data
    const companyActivityData = allCompanies.map(c => {
      const cProjects = JSON.parse(localStorage.getItem('snaglist_projects') || '[]').filter((p: any) => p.company_id === c.id);
      const cItems = JSON.parse(localStorage.getItem('snaglist_items') || '[]').filter((i: any) => i.company_id === c.id);
      return {
        name: c.code,
        Projects: cProjects.length,
        'Snag Items': cItems.length
      };
    });

    const globalTrendData = [
      { name: 'Feb', Companies: 1, Projects: 1, Snags: 120 },
      { name: 'Mar', Companies: 1, Projects: 1, Snags: 200 },
      { name: 'Apr', Companies: 2, Projects: 2, Snags: 250 },
      { name: 'May', Companies: 2, Projects: 3, Snags: 280 },
      { name: 'Jun', Companies: 2, Projects: 3, Snags: 300 },
      { name: 'Jul', Companies: totalCompanies, Projects: totalProjects, Snags: totalItemsCount }
    ];

    return (
      <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in duration-200">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-dark to-slate-700 p-6 md:p-8 rounded-2xl text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="relative z-10 space-y-2">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-accent animate-spin-slow" />
              <span className="text-xs font-bold uppercase tracking-wider text-secondary">Global Super Admin Console</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">System Administration Control</h1>
            <p className="text-sm text-secondary/90 font-medium">Global platform health statistics, subscription tracking, and tenant workloads.</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-5 py-3.5 rounded-xl border border-white/10 flex flex-col items-center shrink-0 self-stretch md:self-auto justify-center">
            <span className="text-xs font-bold text-accent tracking-wide uppercase">System Health</span>
            <span className="text-3xl font-black mt-1 text-white">99.98%</span>
          </div>
        </div>

        {/* Admin Counter Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { title: 'Total Companies', val: totalCompanies, sub: 'Isolated Tenants', icon: Globe, color: 'border-l-4 border-primary bg-card text-foreground' },
            { title: 'Total Projects', val: totalProjects, sub: 'Across all tenants', icon: Building2, color: 'border-l-4 border-info bg-card text-foreground' },
            { title: 'Total Users', val: totalUsers, sub: 'Registered accounts', icon: Users, color: 'border-l-4 border-accent bg-card text-foreground' },
            { title: 'Total Snags', val: totalItemsCount, sub: 'Inspection items', icon: Activity, color: 'border-l-4 border-warning bg-card text-foreground' },
            { title: 'Global Storage', val: '42.5 MB / 100 GB', sub: 'Cloud backup limit', icon: HardDrive, color: 'border-l-4 border-success bg-card text-foreground' }
          ].map((c, i) => (
            <div key={i} className={`p-5 rounded-2xl border border-border shadow-sm flex flex-col justify-between hover:scale-[1.02] hover:shadow-md transition-all duration-200 ${c.color}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground">{c.title}</span>
                <c.icon className="w-4 h-4 text-primary" />
              </div>
              <div className="mt-3">
                <p className="text-2xl font-black tracking-tight">{c.val}</p>
                <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">{c.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Global Statistics Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Active Companies Bar Chart */}
          <div className="bg-card border border-border p-5 rounded-2xl shadow-sm flex flex-col h-[320px] lg:col-span-2">
            <h2 className="text-sm font-bold text-foreground mb-4">Tenant Workload & Usage Matrix</h2>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={companyActivityData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" stroke="#64748B" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="Projects" fill="#6A89A7" radius={[4, 4, 0, 0]} maxBarSize={20} />
                  <Bar dataKey="Snag Items" fill="#F59E0B" radius={[4, 4, 0, 0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* System Environment Stats */}
          <div className="bg-card border border-border p-5 rounded-2xl shadow-sm flex flex-col h-[320px]">
            <h2 className="text-sm font-bold text-foreground mb-4">System Service Limits</h2>
            <div className="flex-1 flex flex-col justify-around">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2.5">
                  <Cpu className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs font-bold">API Services</p>
                    <p className="text-[10px] text-muted-foreground">Connected to Supabase Edge</p>
                  </div>
                </div>
                <span className="text-xs bg-success/15 text-success border border-success/20 px-2 py-0.5 rounded font-bold">Active</span>
              </div>
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2.5">
                  <HardDrive className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs font-bold">Postgres Storage</p>
                    <p className="text-[10px] text-muted-foreground">Database sizing limit</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-foreground">0.8 MB / 500 MB</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Globe className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs font-bold">Active CDN Locations</p>
                    <p className="text-[10px] text-muted-foreground">Vercel Edge Distribution</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-foreground">5 Nodes</span>
              </div>
            </div>
          </div>

          {/* Platform Scaling Trend */}
          <div className="bg-card border border-border p-5 rounded-2xl shadow-sm flex flex-col h-[320px] lg:col-span-3">
            <h2 className="text-sm font-bold text-foreground mb-4">System Scaling Trend (Last 6 Months)</h2>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={globalTrendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" stroke="#64748B" fontSize={10} />
                  <YAxis stroke="#64748B" fontSize={10} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Line type="monotone" dataKey="Companies" stroke="#16A34A" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="Projects" stroke="#6A89A7" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="Snags" stroke="#DC2626" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- STANDARD COMPANY / USER DASHBOARD VIEW ---
  
  // Total numbers for current company
  const totalProjects = projects.length;
  const totalSnags = projectItems.length;
  const openSnags = projectItems.filter(i => i.status === 'open').length;
  const closedSnags = projectItems.filter(i => i.status === 'closed').length;
  const inProgressSnags = projectItems.filter(i => i.status === 'in_progress').length;
  const pendingQA = projectItems.filter(i => i.status === 'qa_verification').length;
  const criticalSnags = projectItems.filter(i => i.priority === 'critical' && i.status !== 'closed').length;

  // Chart data: Status distribution
  const statusData = [
    { name: 'Open', value: openSnags, color: '#DC2626' },
    { name: 'In Progress', value: inProgressSnags, color: '#F59E0B' },
    { name: 'Pending QA', value: pendingQA, color: '#6A89A7' },
    { name: 'Closed', value: closedSnags, color: '#16A34A' }
  ].filter(d => d.value > 0);

  // Chart data: Locations Node completion rate inside this project
  const pNodes = nodes.filter(n => n.project_id === selectedProjectId && n.parent_id !== null).slice(0, 10);
  const locationChartData = pNodes.map(node => ({
    name: node.name,
    'Completion %': node.completion_rate
  }));

  // Chart data: Monthly trends
  const trendData = [
    { name: 'May', Raised: Math.round(totalSnags * 0.4), Resolved: Math.round(closedSnags * 0.3) },
    { name: 'Jun', Raised: Math.round(totalSnags * 0.7), Resolved: Math.round(closedSnags * 0.6) },
    { name: 'Jul', Raised: totalSnags, Resolved: closedSnags }
  ];

  // Compute Contractor performance
  const contractorsMap: Record<string, { closed: number; total: number }> = {};
  projectItems.forEach(item => {
    const contractor = item.contractor_id || 'Unassigned Contractor';
    if (!contractorsMap[contractor]) contractorsMap[contractor] = { closed: 0, total: 0 };
    contractorsMap[contractor].total++;
    if (item.status === 'closed') contractorsMap[contractor].closed++;
  });

  const contractorPerformanceData = Object.keys(contractorsMap).map(c => {
    // Find profile name
    const profile = allProfiles.find(p => p.id === c);
    const name = profile ? profile.full_name : c.replace('u-', 'Company ').toUpperCase();
    return {
      name,
      'Closed Snags': contractorsMap[c].closed,
      'Total Assigned': contractorsMap[c].total
    };
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in duration-200">
      
      {/* Top Banner & Project Selector */}
      <div className="bg-card border border-border p-6 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            {currentCompany?.name || 'Company Dashboard'}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">Select a project below to load details and checklist progress matrices.</p>
        </div>

        {/* Project Selector dropdown */}
        <div className="w-full md:w-72 shrink-0">
          <label className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Active Project Focus</label>
          {projects.length === 0 ? (
            <div className="text-sm font-semibold text-danger">No projects found. Please create one.</div>
          ) : (
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full bg-background border border-border px-3.5 py-2.5 rounded-xl text-xs font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.project_type.toUpperCase()})
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {activeProject && (
        <>
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-dark to-primary p-6 md:p-8 rounded-2xl text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="relative z-10 space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-secondary">Project Quality Hub</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">{activeProject.name}</h2>
              <p className="text-xs text-secondary/90 font-medium">
                Contractor: <span className="text-white font-bold">{activeProject.contractor || 'TBD'}</span> | 
                Consultant: <span className="text-white font-bold">{activeProject.consultant || 'TBD'}</span> | 
                Type: <span className="text-white font-bold capitalize">{activeProject.project_type}</span>
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-5 py-3.5 rounded-xl border border-white/10 flex flex-col items-center shrink-0 self-stretch md:self-auto justify-center">
              <span className="text-xs font-bold text-accent tracking-wide uppercase">Project Progress</span>
              <span className="text-3xl font-black mt-1 text-white">{activeProject.completion_rate || 0}%</span>
            </div>
          </div>

          {/* Summary Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            {[
              { title: 'Total Items', val: totalSnags, sub: 'Raised checklist items', icon: FileCheck, color: 'bg-white text-dark border border-border shadow-sm' },
              { title: 'Open Snags', val: openSnags, sub: 'Require attention', icon: AlertCircle, color: 'border-l-4 border-danger bg-card text-foreground shadow-sm' },
              { title: 'In Progress', val: inProgressSnags, sub: 'Contractor working', icon: Clock, color: 'border-l-4 border-warning bg-card text-foreground shadow-sm' },
              { title: 'Pending QA', val: pendingQA, sub: 'Awaiting inspector approval', icon: Clock, color: 'border-l-4 border-accent bg-card text-foreground shadow-sm' },
              { title: 'Critical Items', val: criticalSnags, sub: 'High risk status', icon: AlertCircle, color: 'border-l-4 border-danger bg-card text-foreground shadow-sm' },
              { title: 'Closed / Fixed', val: closedSnags, sub: 'Verified by Engineer', icon: CheckCircle2, color: 'border-l-4 border-success bg-card text-foreground shadow-sm' }
            ].map((c, i) => (
              <div key={i} className={`p-4 rounded-2xl flex flex-col justify-between hover:scale-[1.02] hover:shadow-md transition-all duration-200 ${c.color}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-muted-foreground">{c.title}</span>
                  <c.icon className="w-4 h-4 text-primary" />
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-black tracking-tight">{c.val}</p>
                  <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">{c.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Status Pie Chart */}
            <div className="bg-card border border-border p-5 rounded-2xl shadow-sm flex flex-col h-[320px]">
              <h3 className="text-sm font-bold text-foreground mb-4">Snag Status Distribution</h3>
              <div className="flex-1 min-h-0">
                {statusData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No snag items created.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="45%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} items`, 'Count']} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Custom Location Hierarchy Progress Bar Chart */}
            <div className="bg-card border border-border p-5 rounded-2xl shadow-sm flex flex-col h-[320px] lg:col-span-2">
              <h3 className="text-sm font-bold text-foreground mb-4">Location Progress Rates</h3>
              <div className="flex-1 min-h-0">
                {locationChartData.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-sm text-muted-foreground gap-2">
                    <Building2 className="w-8 h-8 text-muted" />
                    <span>No sub-location node structures defined yet.</span>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={locationChartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="name" stroke="#64748B" fontSize={10} tickLine={false} />
                      <YAxis stroke="#64748B" fontSize={10} tickLine={false} unit="%" />
                      <Tooltip formatter={(value) => [`${value}%`, 'Completion']} />
                      <Bar dataKey="Completion %" fill="#6A89A7" radius={[4, 4, 0, 0]} maxBarSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Contractor Performance */}
            <div className="bg-card border border-border p-5 rounded-2xl shadow-sm flex flex-col h-[320px] lg:col-span-2">
              <h3 className="text-sm font-bold text-foreground mb-4">Contractor Performance Chart</h3>
              <div className="flex-1 min-h-0">
                {contractorPerformanceData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No snags assigned.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={contractorPerformanceData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="name" stroke="#64748B" fontSize={10} tickLine={false} />
                      <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Bar dataKey="Closed Snags" fill="#16A34A" radius={[4, 4, 0, 0]} maxBarSize={20} />
                      <Bar dataKey="Total Assigned" fill="#6A89A7" radius={[4, 4, 0, 0]} maxBarSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Trend Line Chart */}
            <div className="bg-card border border-border p-5 rounded-2xl shadow-sm flex flex-col h-[320px]">
              <h3 className="text-sm font-bold text-foreground mb-4">Quality Rectification Trend</h3>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" stroke="#64748B" fontSize={10} />
                    <YAxis stroke="#64748B" fontSize={10} />
                    <Tooltip />
                    <Line type="monotone" dataKey="Raised" stroke="#DC2626" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="Resolved" stroke="#16A34A" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Quick Actions & Folder Directory Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Documents Folders */}
            <div className="bg-card border border-border p-5 rounded-2xl shadow-sm flex flex-col h-[300px] lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <FolderOpen className="w-4 h-4 text-primary" />
                  Project Specification Folders
                </h3>
                <Link href={`/villas/${activeProject.id}?tab=documents`} className="text-xs text-primary font-bold hover:underline">
                  Browse Files →
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto">
                {dbService.getDocumentFolders(activeProject.id).map(fld => {
                  const files = dbService.getDocuments(activeProject.id).filter(d => d.folder_id === fld.id);
                  return (
                    <div key={fld.id} className="p-4 border border-border rounded-xl bg-background hover:bg-muted/10 transition-colors flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <FolderOpen className="w-5 h-5" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-foreground truncate">{fld.name}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{files.length} document version files uploaded</p>
                      </div>
                    </div>
                  );
                })}
                {dbService.getDocumentFolders(activeProject.id).length === 0 && (
                  <div className="col-span-2 py-10 text-center text-xs text-muted-foreground">
                    No documentation folders created yet.
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="bg-card border border-border p-5 rounded-2xl shadow-sm flex flex-col justify-between h-[300px]">
              <div>
                <h3 className="text-sm font-bold text-foreground mb-4">Quick Inspect Navigation</h3>
                <p className="text-xs text-muted-foreground leading-normal">
                  Jump directly into the project structure to inspect nodes, check off audit parameters, upload defect photos, and export PDF sheets.
                </p>
              </div>
              <div className="space-y-2">
                <Link 
                  href={`/villas/${activeProject.id}`}
                  className="w-full bg-primary hover:bg-primary/95 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <Building2 className="w-4 h-4" />
                  Open Project Structure Node Tree
                </Link>
                <Link 
                  href="/villas"
                  className="w-full border border-border hover:bg-muted/40 text-foreground font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  View Other Company Projects
                </Link>
              </div>
            </div>
          </div>
        </>
      )}

      {!activeProject && projects.length > 0 && (
        <div className="bg-card border border-border p-12 text-center rounded-2xl flex flex-col items-center justify-center">
          <Building2 className="w-12 h-12 text-primary/40 mb-3 animate-pulse" />
          <h3 className="text-sm font-bold text-foreground">Loading Selected Project...</h3>
          <p className="text-xs text-muted-foreground mt-1">Please select an enterprise project from the dropdown above to view metrics.</p>
        </div>
      )}

      {projects.length === 0 && (
        <div className="bg-card border border-border p-12 text-center rounded-2xl flex flex-col items-center justify-center">
          <AlertCircle className="w-12 h-12 text-danger/60 mb-3" />
          <h3 className="text-sm font-bold text-foreground">No Projects Registered</h3>
          <p className="text-xs text-muted-foreground mt-1">Go to Projects Explorer to register a project and setup inspection structures.</p>
          <Link href="/villas" className="mt-4 px-4 py-2.5 bg-primary hover:bg-primary/95 text-white font-bold text-xs rounded-xl transition-all shadow shadow-primary/10">
            Open Projects Explorer
          </Link>
        </div>
      )}
    </div>
  );
}
