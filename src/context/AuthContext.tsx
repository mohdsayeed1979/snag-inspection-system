// Authentication Context with Role-Based Access Control Helpers
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile, SEED_PROFILES, initializeMockDatabase } from '@/lib/db';

interface AuthContextType {
  user: Profile | null;
  allProfiles: Profile[];
  switchUser: (email: string) => void;
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initializing the mock DB on application mount
    initializeMockDatabase();
    
    // Load current user from local storage or set default (PM or Admin)
    const storedUserEmail = localStorage.getItem('snaglist_current_user_email');
    const profilesJson = localStorage.getItem('snaglist_profiles');
    
    let loadedProfiles = SEED_PROFILES;
    if (profilesJson) {
      try {
        loadedProfiles = JSON.parse(profilesJson);
        setAllProfiles(loadedProfiles);
      } catch (e) {
        console.error('Failed to parse profiles', e);
      }
    }

    if (storedUserEmail) {
      const found = loadedProfiles.find(p => p.email === storedUserEmail);
      if (found) {
        setUser(found);
      } else {
        setUser(loadedProfiles[0]); // default to first profile (Admin)
      }
    } else {
      // Default to Project Manager as it is the most standard role to view the app
      const defaultUser = loadedProfiles.find(p => p.role === 'project_manager') || loadedProfiles[0];
      setUser(defaultUser);
      localStorage.setItem('snaglist_current_user_email', defaultUser.email);
    }
    setIsLoading(false);
  }, []);

  const switchUser = (email: string) => {
    const found = allProfiles.find(p => p.email === email);
    if (found) {
      setUser(found);
      localStorage.setItem('snaglist_current_user_email', found.email);
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
      // Contractors can mark things as in_progress or rectified (ready for inspection)
      // They cannot close snags or bypass QA verification
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
      switchUser,
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
