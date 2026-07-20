// Authentication Context with Role-Based Access Control and Company Separation
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile, Company, SEED_PROFILES, initializeMockDatabase, dbService } from '@/lib/db';

interface AuthContextType {
  user: Profile | null;
  allProfiles: Profile[];
  currentCompany: Company | null;
  switchUser: (email: string) => void;
  switchCompany: (companyId: string) => void;
  isLoading: boolean;
  canCreateSnag: () => boolean;
  canEditSnag: () => boolean;
  canAssignSnag: () => boolean;
  canDeleteSnag: () => boolean;
  canChangeStatus: (status: string) => boolean;
  canManageSettings: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [allProfiles, setAllProfiles] = useState<Profile[]>(SEED_PROFILES);
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadCompanyContext = (profile: Profile | null) => {
    if (!profile) return;
    // Determine the active company
    let companyId = profile.company_id;
    if (profile.role === 'super_admin') {
      const override = localStorage.getItem('snaglist_override_company_id');
      if (override) {
        companyId = override;
      }
    }

    const company = dbService.getCompanyById(companyId);
    setCurrentCompany(company || dbService.getCompanyById('c0000000-0000-0000-0000-000000000000') || null);
  };

  useEffect(() => {
    try {
      // Initializing the mock DB on application mount
      initializeMockDatabase();
      
      // Load current user from local storage or set default
      const storedUserEmail = typeof window !== 'undefined' ? localStorage.getItem('snaglist_current_user_email') : null;
      const profilesJson = typeof window !== 'undefined' ? localStorage.getItem('snaglist_profiles') : null;
      
      let loadedProfiles = SEED_PROFILES;
      if (profilesJson && profilesJson !== 'null' && profilesJson !== 'undefined') {
        try {
          const parsed = JSON.parse(profilesJson);
          if (Array.isArray(parsed) && parsed.length > 0) {
            loadedProfiles = parsed;
            setAllProfiles(loadedProfiles);
          }
        } catch (e) {
          console.error('Failed to parse profiles', e);
        }
      }

      let activeUser: Profile | null = null;
      const emailToFind = storedUserEmail && storedUserEmail !== 'null' && storedUserEmail !== 'undefined' ? storedUserEmail : null;
      
      if (emailToFind && Array.isArray(loadedProfiles)) {
        const found = loadedProfiles.find(p => p && p.email === emailToFind);
        if (found) {
          activeUser = found;
        } else {
          activeUser = loadedProfiles[0] || SEED_PROFILES[0];
        }
      } else if (Array.isArray(loadedProfiles) && loadedProfiles.length > 0) {
        const defaultUser = loadedProfiles.find(p => p && p.role === 'project_manager') || loadedProfiles[0];
        activeUser = defaultUser || SEED_PROFILES[0];
        if (defaultUser && typeof window !== 'undefined') {
          localStorage.setItem('snaglist_current_user_email', defaultUser.email);
        }
      }

      const finalUser = activeUser || SEED_PROFILES[0];
      setUser(finalUser);
      loadCompanyContext(finalUser);
    } catch (err) {
      console.error('Error during AuthContext initialization:', err);
      setUser(SEED_PROFILES[0]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const switchUser = (email: string) => {
    const found = allProfiles.find(p => p.email === email);
    if (found) {
      setUser(found);
      localStorage.setItem('snaglist_current_user_email', found.email);
      // Reset company override when changing users
      localStorage.removeItem('snaglist_override_company_id');
      loadCompanyContext(found);
      
      // Force page reload to clear cache and refresh query results
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    }
  };

  const switchCompany = (companyId: string) => {
    if (user && user.role === 'super_admin') {
      localStorage.setItem('snaglist_override_company_id', companyId);
      const company = dbService.getCompanyById(companyId);
      setCurrentCompany(company || null);
      
      // Reload page to re-render context and trigger stats refresh
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    }
  };

  // --- RBAC Helpers ---
  const canCreateSnag = (): boolean => {
    if (!user) return false;
    return ['super_admin', 'project_manager', 'site_engineer', 'qaqc_inspector'].includes(user.role);
  };

  const canEditSnag = (): boolean => {
    if (!user) return false;
    return ['super_admin', 'project_manager', 'site_engineer', 'qaqc_inspector'].includes(user.role);
  };

  const canAssignSnag = (): boolean => {
    if (!user) return false;
    return ['super_admin', 'project_manager', 'site_engineer'].includes(user.role);
  };

  const canDeleteSnag = (): boolean => {
    if (!user) return false;
    return ['super_admin', 'project_manager'].includes(user.role);
  };

  const canChangeStatus = (targetStatus: string): boolean => {
    if (!user) return false;
    
    // Super Admins & PMs can override and change to anything
    if (['super_admin', 'project_manager'].includes(user.role)) return true;
    
    // Read only users cannot change status
    if (user.role === 'read_only') return false;

    // Site Engineers and QA/QC Inspectors can change status
    if (['site_engineer', 'qaqc_inspector'].includes(user.role)) return true;

    // Contractors have restricted state flow
    if (user.role === 'contractor') {
      return ['in_progress', 'rectified'].includes(targetStatus);
    }

    return false;
  };

  const canManageSettings = (): boolean => {
    if (!user) return false;
    return ['super_admin', 'project_manager'].includes(user.role);
  };

  return (
    <AuthContext.Provider value={{
      user,
      allProfiles,
      currentCompany,
      switchUser,
      switchCompany,
      isLoading,
      canCreateSnag,
      canEditSnag,
      canAssignSnag,
      canDeleteSnag,
      canChangeStatus,
      canManageSettings
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
