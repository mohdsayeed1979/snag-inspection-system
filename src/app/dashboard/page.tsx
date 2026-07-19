// Dashboard Screen (Summary Cards, Recharts, Recent Activities, Latest Photos)
'use client';

import React, { useState, useEffect } from 'react';
import { dbService, InspectionItem, Villa, Project, InspectionPhoto } from '@/lib/db';
import { 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Activity, 
  Image as ImageIcon,
  Calendar,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line
} from 'recharts';

export default function Dashboard() {
  const [project, setProject] = useState<Project | null>(null);
  const [villas, setVillas] = useState<Villa[]>([]);
  const [items, setItems] = useState<InspectionItem[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [latestPhotos, setLatestPhotos] = useState<InspectionPhoto[]>([]);
  const [upcomingInspections, setUpcomingInspections] = useState<InspectionItem[]>([]);

  useEffect(() => {
    // Load database items
    const projs = dbService.getProjects();
    if (projs.length > 0) setProject(projs[0]);
    
    const vList = dbService.getVillas();
    setVillas(vList);
    
    const itemsList = dbService.getInspectionItems();
    setItems(itemsList);

    // Latest 5 photos
    const allPhotos = JSON.parse(localStorage.getItem('snaglist_photos') || '[]');
    setLatestPhotos(allPhotos.slice(-4).reverse());

    // Upcoming snags (due in the next 7 days, that are not closed)
    const upcoming = itemsList
      .filter(item => item.status !== 'closed' && item.due_date)
      .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
      .slice(0, 4);
    setUpcomingInspections(upcoming);

    // Recent activities (joined with profile names and item snag numbers)
    const allHistory = JSON.parse(localStorage.getItem('snaglist_history') || '[]');
    const profiles = dbService.getProfiles();
    const joinedHistory = allHistory
      .slice(-5)
      .reverse()
      .map((hist: any) => {
        const itemObj = itemsList.find(i => i.id === hist.inspection_item_id);
        const profileObj = profiles.find(p => p.id === hist.user_id);
        return {
          ...hist,
          snag_number: itemObj?.snag_number || 'SNAG',
          villa_id: itemObj?.villa_id,
          user_name: profileObj ? profileObj.full_name : 'System'
        };
      });
    setRecentActivities(joinedHistory);
  }, []);

  // Compute stats
  const totalVillas = villas.length;
  const totalSnags = items.length;
  const openSnags = items.filter(i => i.status === 'open').length;
  const closedSnags = items.filter(i => i.status === 'closed').length;
  const inProgressSnags = items.filter(i => i.status === 'in_progress').length;
  const pendingApprovalSnags = items.filter(i => i.status === 'qa_verification').length; // pending qa verification

  // Chart data: Status distribution
  const statusData = [
    { name: 'Open', value: openSnags, color: '#DC2626' }, // Danger red
    { name: 'In Progress', value: inProgressSnags, color: '#F59E0B' }, // Warning yellow
    { name: 'QA Verification', value: pendingApprovalSnags, color: '#88BDF2' }, // Soft Accent blue
    { name: 'Closed', value: closedSnags, color: '#16A34A' } // Success green
  ].filter(d => d.value > 0);

  // Chart data: Villa completion rate (Top 8 villas for readibility)
  const villaChartData = villas
    .map(v => ({
      name: v.villa_number,
      'Completion %': v.completion_rate
    }))
    .slice(0, 10);

  // Chart data: Monthly trend (mock data representing progress over the last months)
  const trendData = [
    { name: 'Feb', Raised: 12, Resolved: 5 },
    { name: 'Mar', Raised: 45, Resolved: 22 },
    { name: 'Apr', Raised: 68, Resolved: 40 },
    { name: 'May', Raised: 90, Resolved: 72 },
    { name: 'Jun', Raised: 110, Resolved: 98 },
    { name: 'Jul', Raised: totalSnags, Resolved: closedSnags }
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-dark to-primary p-6 md:p-8 rounded-2xl text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-secondary">Quality Assurance Hub</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Luxury Villa Compound Project</h1>
          <p className="text-sm text-secondary/90 font-medium">Engineer control dashboard and real-time inspection snag metrics.</p>
        </div>
        <div className="bg-white/10 backdrop-blur-md px-5 py-3.5 rounded-xl border border-white/10 flex flex-col items-center shrink-0 self-stretch md:self-auto justify-center">
          <span className="text-xs font-bold text-accent tracking-wide uppercase">Project Progress</span>
          <span className="text-3xl font-black mt-1 text-white">{project?.completion_rate || 0}%</span>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {[
          { title: 'Total Villas', val: totalVillas, sub: 'Villas Compound', color: 'bg-white text-dark', icon: Building2 },
          { title: 'Total Snags', val: totalSnags, sub: 'Raised items', color: 'bg-white text-dark', icon: Activity },
          { title: 'Open', val: openSnags, sub: 'Needs attention', color: 'border-l-4 border-danger bg-card text-foreground', icon: AlertCircle },
          { title: 'In Progress', val: inProgressSnags, sub: 'Contractor working', color: 'border-l-4 border-warning bg-card text-foreground', icon: Clock },
          { title: 'Pending QA', val: pendingApprovalSnags, sub: 'Awaiting verification', color: 'border-l-4 border-accent bg-card text-foreground', icon: Clock },
          { title: 'Closed / Fixed', val: closedSnags, sub: 'Successfully verified', color: 'border-l-4 border-success bg-card text-foreground', icon: CheckCircle2 }
        ].map((c, i) => (
          <div key={i} className={`p-4 rounded-2xl border border-border/80 shadow-sm flex flex-col justify-between hover:scale-[1.02] hover:shadow-md transition-all duration-200 ${c.color}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">{c.title}</span>
              <c.icon className="w-4 h-4 text-primary" />
            </div>
            <div className="mt-3">
              <p className="text-2xl font-black tracking-tight">{c.val}</p>
              <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{c.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Pie Chart */}
        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm flex flex-col h-[320px]">
          <h2 className="text-sm font-bold text-foreground mb-4">Snag Status Distribution</h2>
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

        {/* Villa Progress Bar Chart */}
        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm flex flex-col h-[320px] lg:col-span-2">
          <h2 className="text-sm font-bold text-foreground mb-4">Villa Inspection Progress (Sample)</h2>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={villaChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={10} tickLine={false} unit="%" />
                <Tooltip formatter={(value) => [`${value}%`, 'Completion']} />
                <Bar dataKey="Completion %" fill="#6A89A7" radius={[4, 4, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Trend Line Chart */}
        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm flex flex-col h-[320px] lg:col-span-3">
          <h2 className="text-sm font-bold text-foreground mb-4">Monthly Snag Trend (Raised vs. Resolved)</h2>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" stroke="#64748B" fontSize={10} />
                <YAxis stroke="#64748B" fontSize={10} />
                <Tooltip />
                <Legend iconType="plainline" wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="Raised" stroke="#DC2626" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Resolved" stroke="#16A34A" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Layout - Activity & Upcoming & Photos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity Timeline */}
        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm flex flex-col h-[380px]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-foreground">Recent Activity Logs</h2>
            <Activity className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 overflow-y-auto pr-1 space-y-4">
            {recentActivities.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground">No operations recorded.</div>
            ) : (
              recentActivities.map((act) => (
                <div key={act.id} className="relative pl-6 pb-2 border-l border-border last:border-0">
                  <span className="absolute -left-[5px] top-1 w-2.5 h-2.5 bg-primary rounded-full ring-4 ring-card"></span>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-bold text-foreground">
                        {act.user_name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{act.details}</p>
                    </div>
                    {act.villa_id && (
                      <Link 
                        href={`/villas/${act.villa_id}`} 
                        className="text-[10px] bg-secondary/20 hover:bg-secondary/40 text-primary font-bold px-2 py-0.5 rounded-lg flex items-center gap-1 transition-all"
                      >
                        {act.snag_number} <ArrowRight className="w-2.5 h-2.5" />
                      </Link>
                    )}
                  </div>
                  <span className="text-[9px] text-muted-foreground mt-1.5 block">
                    {new Date(act.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Inspections & Due Dates */}
        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm flex flex-col h-[380px]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-foreground">Due Snag Rectifications</h2>
            <Calendar className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 overflow-y-auto space-y-3">
            {upcomingInspections.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground">No upcoming inspections due.</div>
            ) : (
              upcomingInspections.map((item) => (
                <div key={item.id} className="p-3 border border-border rounded-xl bg-background/50 hover:bg-muted/10 transition-all">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] uppercase font-black text-danger tracking-wider">
                        {item.priority} priority
                      </span>
                      <h4 className="text-xs font-bold text-foreground truncate mt-0.5 max-w-[150px]">{item.title}</h4>
                    </div>
                    <span className="text-[10px] bg-warning/10 text-warning font-semibold px-2 py-0.5 rounded-md border border-warning/15">
                      {item.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-3 text-[10px] text-muted-foreground">
                    <span>Due: {item.due_date}</span>
                    <Link href={`/villas/${item.villa_id}`} className="text-primary font-bold hover:underline">
                      Inspect →
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Latest Photos Gallery */}
        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm flex flex-col h-[380px]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-foreground">Latest Uploaded Photos</h2>
            <ImageIcon className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 grid grid-cols-2 gap-3">
            {latestPhotos.length === 0 ? (
              <div className="col-span-2 h-full flex flex-col items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <ImageIcon className="w-6 h-6 text-muted" />
                No photos uploaded yet.
              </div>
            ) : (
              latestPhotos.map((photo) => (
                <div key={photo.id} className="relative group rounded-xl overflow-hidden border border-border shadow-sm bg-muted/40 aspect-[4/3] flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={photo.photo_url} 
                    alt={photo.caption || 'Inspection photo'} 
                    className="object-cover w-full h-full group-hover:scale-105 transition-all duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2.5 flex flex-col justify-end">
                    <p className="text-[10px] text-white font-semibold truncate leading-snug">{photo.caption}</p>
                    <span className="text-[8px] text-accent tracking-wider uppercase font-bold mt-0.5">{photo.photo_type} PHOTO</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
