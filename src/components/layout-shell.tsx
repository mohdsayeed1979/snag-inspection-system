// Responsive Layout Shell (Sidebar + Header + Notifications + Role & Company Switchers)
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { dbService, Notification, InspectionItem, Company } from '@/lib/db';
import { UserGuideModal } from '@/components/user-guide-modal';
import { InteractiveTour } from '@/components/interactive-tour';
import { 
  LayoutDashboard, 
  Building2, 
  ShieldCheck, 
  Bell, 
  Menu, 
  X, 
  Sun, 
  Moon, 
  Users, 
  LogOut, 
  CheckSquare,
  ChevronRight,
  TrendingUp,
  FileCheck,
  Search,
  Globe,
  BookOpen,
  GraduationCap,
  HelpCircle,
  Sparkles
} from 'lucide-react';

interface LayoutShellProps {
  children: React.ReactNode;
}

export const LayoutShell: React.FC<LayoutShellProps> = ({ children }) => {
  const { user, allProfiles, switchUser, currentCompany, switchCompany, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showTourModal, setShowTourModal] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);

  // Load companies list for Super Admin switcher
  useEffect(() => {
    if (user && user.role === 'super_admin') {
      setCompanies(dbService.getCompanies());
    }
  }, [user]);

  // Load and apply theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme as 'light' | 'dark');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Poll notifications
  useEffect(() => {
    if (user) {
      setNotifications(dbService.getNotifications(user.id));
      const interval = setInterval(() => {
        setNotifications(dbService.getNotifications(user.id));
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Global Search State
  const [globalQuery, setGlobalQuery] = useState('');
  const [globalResults, setGlobalResults] = useState<InspectionItem[]>([]);

  const handleGlobalSearch = (val: string) => {
    setGlobalQuery(val);
    if (!val.trim()) {
      setGlobalResults([]);
      return;
    }
    const q = val.toLowerCase();
    const allItems = dbService.getInspectionItems();
    const matched = allItems.filter(item => {
      // Find parent project node name (e.g. Room/Villa)
      const nodes = dbService.getProjectNodes();
      const nodeObj = nodes.find(n => n.id === item.location_node_id || n.id === item.villa_id);
      return (
        item.snag_number.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q) ||
        (item.location && item.location.toLowerCase().includes(q)) ||
        (item.room && item.room.toLowerCase().includes(q)) ||
        (nodeObj && nodeObj.name.toLowerCase().includes(q))
      );
    }).slice(0, 5); // limit to 5 results
    setGlobalResults(matched);
  };

  const handleResultClick = (item: InspectionItem) => {
    setGlobalQuery('');
    setGlobalResults([]);
    router.push(`/villas/${item.villa_id}?snagId=${item.id}`);
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAllAsRead = () => {
    notifications.forEach(n => dbService.markNotificationAsRead(n.id));
    if (user) {
      setNotifications(dbService.getNotifications(user.id));
    }
  };

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['super_admin', 'project_manager', 'site_engineer', 'qaqc_inspector', 'contractor', 'read_only'] },
    { name: 'Projects Explorer', href: '/villas', icon: Building2, roles: ['super_admin', 'project_manager', 'site_engineer', 'qaqc_inspector', 'contractor', 'read_only'] },
    { name: 'Inspection Checklist Templates', href: '/templates', icon: FileCheck, roles: ['super_admin', 'project_manager', 'site_engineer', 'qaqc_inspector'] },
    { name: 'Training Center', href: '/training', icon: GraduationCap, roles: ['super_admin', 'project_manager', 'site_engineer', 'qaqc_inspector', 'contractor', 'read_only'] },
    { name: 'Admin Control', href: '/admin', icon: ShieldCheck, roles: ['super_admin', 'project_manager'] }
  ];

  const allowedNavItems = navItems.filter(item => user && item.roles.includes(user.role));

  const formatPathname = () => {
    if (pathname === '/dashboard') return 'Dashboard';
    if (pathname === '/villas') return 'Projects Explorer';
    if (pathname.startsWith('/villas/')) return 'Project Details';
    if (pathname === '/admin') return 'Admin Panel';
    return 'Home';
  };

  // Custom branding colors from company settings
  const primaryBgColor = currentCompany?.primary_color || '#6A89A7';

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-muted-foreground animate-pulse">Loading inspection workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* 1. Sidebar for Desktop */}
      <aside className="hidden md:flex md:flex-col md:w-64 bg-dark text-dark-foreground border-r border-border shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-muted/20 gap-3">
          {currentCompany?.logo_url ? (
            <img src={currentCompany.logo_url} alt="Logo" className="w-6 h-6 object-contain rounded-md" />
          ) : (
            <FileCheck className="w-6 h-6 text-accent" />
          )}
          <span className="font-bold text-sm tracking-wider text-white uppercase truncate">
            {currentCompany?.name || 'INSPECTION PLATFORM'}
          </span>
        </div>
        
        <nav className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
          {allowedNavItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive 
                    ? 'text-white shadow-md scale-[1.02]' 
                    : 'text-dark-foreground/80 hover:bg-white/10 hover:text-white'
                }`}
                style={isActive ? { backgroundColor: primaryBgColor } : {}}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-accent'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Card at Bottom of Sidebar */}
        <div className="p-4 border-t border-muted/20 bg-black/10">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-accent text-dark font-bold flex items-center justify-center text-sm shadow-inner">
                {user?.full_name?.charAt(0) || 'U'}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold truncate text-white leading-tight">{user?.full_name}</p>
                <span className="text-[10px] uppercase font-bold text-accent tracking-wider leading-none">
                  {user?.role ? user.role.replace('_', ' ') : ''}
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex flex-col w-64 max-w-xs bg-dark text-dark-foreground shadow-2xl animate-in slide-in-from-left duration-200">
            <div className="h-16 flex items-center justify-between px-6 border-b border-muted/20">
              <div className="flex items-center gap-2">
                {currentCompany?.logo_url ? (
                  <img src={currentCompany.logo_url} alt="Logo" className="w-5 h-5 object-contain rounded-md" />
                ) : (
                  <FileCheck className="w-5 h-5 text-accent" />
                )}
                <span className="font-bold text-white tracking-wide truncate uppercase text-sm">
                  {currentCompany?.name || 'INSPECTION'}
                </span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="p-1 rounded-lg hover:bg-white/10 text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 py-6 px-4 space-y-1">
              {allowedNavItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive 
                        ? 'text-white' 
                        : 'text-dark-foreground/80 hover:bg-white/10 hover:text-white'
                    }`}
                    style={isActive ? { backgroundColor: primaryBgColor } : {}}
                  >
                    <item.icon className="w-5 h-5 text-accent" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t border-muted/20 bg-black/10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-accent text-dark font-bold flex items-center justify-center text-xs">
                  {user?.full_name?.charAt(0) || 'U'}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-semibold text-white truncate">{user?.full_name}</p>
                  <span className="text-[9px] uppercase font-bold text-accent tracking-wider">
                    {user?.role ? user.role.replace('_', ' ') : ''}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 md:px-8 shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(true)} 
              className="p-2 rounded-lg hover:bg-muted md:hidden text-foreground"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            {/* Breadcrumb / Title */}
            <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
              <span>Inspection Platform</span>
              <ChevronRight className="w-4 h-4" />
              <span className="font-semibold text-foreground">{formatPathname()}</span>
            </div>

            {/* Global Search Input */}
            <div className="relative hidden lg:block w-64 ml-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Global search snags..."
                value={globalQuery}
                onChange={(e) => handleGlobalSearch(e.target.value)}
                className="w-full bg-background border border-border rounded-xl pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
              />
              {/* Dropdown list */}
              {globalResults.length > 0 && (
                <div className="absolute left-0 mt-2 w-80 bg-card border border-border rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto divide-y divide-border">
                  {globalResults.map((item) => {
                    const nodes = dbService.getProjectNodes();
                    const nodeObj = nodes.find(n => n.id === item.location_node_id || n.id === item.villa_id);
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleResultClick(item)}
                        className="p-3 hover:bg-muted/40 cursor-pointer transition-colors"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-primary">{item.snag_number}</span>
                          <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded font-semibold text-muted-foreground">
                            {nodeObj?.name || 'Unit'}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-foreground truncate mt-1">{item.title}</p>
                        <p className="text-[10px] text-muted-foreground truncate mt-0.5">{item.location} - {item.room}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {/* Company Tenant Switcher (Super Admin only) */}
            {user?.role === 'super_admin' && companies.length > 0 && (
              <div className="flex items-center gap-1.5 border border-border bg-background px-3 py-1.5 rounded-xl text-xs shadow-sm">
                <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="font-semibold text-muted-foreground hidden md:inline">Tenant:</span>
                <select
                  value={currentCompany?.id || ''}
                  onChange={(e) => switchCompany(e.target.value)}
                  className="bg-transparent font-medium text-foreground outline-none cursor-pointer focus:ring-0"
                >
                  {companies.map((c) => (
                    <option key={c.id} value={c.id} className="bg-card text-foreground">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Simulated Role Selector (FOR EVALUATION PURPOSE) */}
            <div className="flex items-center gap-2 border border-border bg-background px-3 py-1.5 rounded-xl text-xs shadow-sm">
              <Users className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="font-semibold text-muted-foreground hidden md:inline">Profile:</span>
              <select
                value={user?.email || ''}
                onChange={(e) => switchUser(e.target.value)}
                className="bg-transparent font-medium text-foreground outline-none cursor-pointer focus:ring-0"
              >
                {allProfiles.map((p) => (
                  <option key={p.id} value={p.email} className="bg-card text-foreground">
                    {p.full_name} ({p.role ? p.role.replace('_', ' ') : ''})
                  </option>
                ))}
              </select>
            </div>

            {/* Notifications Button */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)} 
                className="p-2 rounded-xl border border-border hover:bg-muted text-foreground transition-all relative"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full ring-2 ring-card animate-pulse"></span>
                )}
              </button>

              {/* Notifications Dropdown Drawer */}
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-card border border-border rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
                    <span className="font-bold text-sm text-foreground">Notifications</span>
                    {unreadCount > 0 && (
                      <button 
                        onClick={markAllAsRead} 
                        className="text-xs text-primary font-bold hover:underline"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-border">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-muted-foreground">
                        No notifications.
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div 
                          key={notif.id} 
                          onClick={() => {
                            dbService.markNotificationAsRead(notif.id);
                            setShowNotifications(false);
                            if (notif.link) router.push(notif.link);
                          }}
                          className={`p-3.5 hover:bg-muted/40 cursor-pointer transition-colors ${!notif.is_read ? 'bg-secondary/10' : ''}`}
                        >
                          <p className="text-xs font-bold text-foreground">{notif.title}</p>
                          <p className="text-xs text-muted-foreground mt-1 leading-normal">{notif.message}</p>
                          <span className="text-[9px] text-muted-foreground mt-2 block">
                            {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Replay Guided Tour Button */}
            <button 
              onClick={() => setShowTourModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-warning/20 bg-warning/10 text-warning text-xs font-bold hover:bg-warning/20 transition-all"
              title="Replay Interactive Guided Tour"
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Guided Tour</span>
            </button>

            {/* User Guide Button */}
            <button 
              onClick={() => setShowGuideModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-primary/20 bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-all"
              title="Open Step-by-Step User Guide"
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">User Guide</span>
            </button>

            {/* Dark Mode Toggle */}
            <button 
              onClick={toggleTheme} 
              className="p-2 rounded-xl border border-border hover:bg-muted text-foreground transition-all"
              title="Toggle Dark/Light Mode"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto bg-background p-4 md:p-8">
          {children}
        </main>
      </div>

      {/* User Guide Modal */}
      <UserGuideModal 
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
      />

      {/* Interactive Guided Tour */}
      <InteractiveTour 
        forceOpen={showTourModal}
        onClose={() => setShowTourModal(false)}
      />
    </div>
  );
};
