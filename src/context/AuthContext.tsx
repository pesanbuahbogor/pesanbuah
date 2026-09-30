import React, { createContext, useContext, useState, useEffect } from 'react';
import { Profile, UserRole } from '../types';
import { db } from '../lib/db';
import { getSupabase } from '../lib/supabase';

interface AuthContextType {
  currentUser: Profile | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => void;
  refreshCurrentUser: () => Promise<void>;
  isOwner: boolean;
  isManager: boolean;
  isSales: boolean;
  canManageUsers: boolean;
  canManageZones: boolean;
  canManageBusinessTypes: boolean;
  canDeleteProspect: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CURRENT_USER_STORAGE = 'pesanbuah_active_user_v1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function initAuth() {
      try {
        const stored = localStorage.getItem(CURRENT_USER_STORAGE);
        if (stored) {
          const userObj: Profile = JSON.parse(stored);
          // Verify user still exists and is still active in database
          const profile = await db.getProfileById(userObj.id);
          if (profile && profile.active) {
            setCurrentUser(profile);
          } else {
            localStorage.removeItem(CURRENT_USER_STORAGE);
            setCurrentUser(null);
          }
        } else {
          // No active session stored in localStorage, prompt user to login
          setCurrentUser(null);
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
      } finally {
        setIsLoading(false);
      }
    }
    initAuth();
  }, []);

  const login = async (email: string, password?: string) => {
    setIsLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const supabase = getSupabase();

      // If Supabase is configured, try Supabase Auth first
      if (supabase && password) {
        try {
          const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password,
          });

          if (!authErr && authData?.user) {
            const profile = await db.getProfileById(authData.user.id);
            if (profile) {
              if (!profile.active) {
                await supabase.auth.signOut();
                throw new Error('Akun Anda telah dinonaktifkan. Silakan hubungi Owner untuk mengaktifkan kembali.');
              }
              setCurrentUser(profile);
              localStorage.setItem(CURRENT_USER_STORAGE, JSON.stringify(profile));
              return;
            }
          } else if (authErr) {
            console.warn('Supabase auth signIn error:', authErr.message);
          }
        } catch (supaErr: any) {
          console.warn('Supabase auth attempt encountered error, checking internal profiles:', supaErr?.message);
          if (supaErr?.message?.includes('dinonaktifkan')) {
            throw supaErr;
          }
        }
      }

      // Check against internal database profiles (fallback / local storage seed)
      const profiles = await db.getProfiles();
      const matched = profiles.find((p) => p.email.toLowerCase() === cleanEmail);

      if (!matched) {
        throw new Error('Email atau akun tidak terdaftar di sistem PesanBuah.id.');
      }

      if (!matched.active) {
        throw new Error('Akun Anda dinonaktifkan oleh Owner. Anda tidak dapat login.');
      }

      // If password provided in profile, verify
      if (password && matched.password && matched.password !== password) {
        throw new Error('Kata sandi salah. Silakan periksa kembali kata sandi Anda.');
      }

      setCurrentUser(matched);
      localStorage.setItem(CURRENT_USER_STORAGE, JSON.stringify(matched));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    const supabase = getSupabase();
    if (supabase) {
      supabase.auth.signOut().catch(() => {});
    }
    setCurrentUser(null);
    localStorage.removeItem(CURRENT_USER_STORAGE);
  };

  const refreshCurrentUser = async () => {
    if (!currentUser) return;
    const fresh = await db.getProfileById(currentUser.id);
    if (fresh) {
      if (!fresh.active) {
        logout();
      } else {
        setCurrentUser(fresh);
        localStorage.setItem(CURRENT_USER_STORAGE, JSON.stringify(fresh));
      }
    }
  };

  const isOwner = currentUser?.role === 'Owner';
  const isManager = currentUser?.role === 'Manager';
  const isSales = currentUser?.role === 'Sales';

  // Strict RBAC constraints:
  // - Only Owner can manage users
  // - Owner and Manager can manage zones and business types
  // - Owner and Manager can delete prospects
  const canManageUsers = isOwner;
  const canManageZones = isOwner || isManager;
  const canManageBusinessTypes = isOwner || isManager;
  const canDeleteProspect = isOwner || isManager;

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isLoading,
        login,
        logout,
        refreshCurrentUser,
        isOwner,
        isManager,
        isSales,
        canManageUsers,
        canManageZones,
        canManageBusinessTypes,
        canDeleteProspect,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
