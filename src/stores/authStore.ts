import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { useMindmapStore } from './mindmapStore';

interface AuthState {
  user: User | null;
  profile: any | null;
  subscription: any | null;
  loading: boolean;
  initialized: boolean;
  
  signIn: (email: string, password?: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, username: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  fetchProfile: (userId: string) => Promise<void>;
  fetchSubscription: (userId: string) => Promise<void>;
  setInitialized: (val: boolean) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  subscription: null,
  loading: true,
  initialized: false,

  setInitialized: (val) => set({ initialized: val }),

  signIn: async (email: string, password?: string) => {
    if (!isSupabaseConfigured) {
      return { error: { message: 'Supabase 未配置，请联系管理员或检查 .env 文件。' } };
    }
    
    if (password) {
      // Email/Password login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } else {
      // Magic link login (legacy)
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });
      return { error };
    }
  },

  signUp: async (email: string, password: string, username: string) => {
    if (!isSupabaseConfigured) {
      return { error: { message: 'Supabase 未配置，请联系管理员或检查 .env 文件。' } };
    }
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username,
          full_name: username, // Fallback for the trigger
        },
        emailRedirectTo: window.location.origin,
      },
    });
    
    if (!error && data.user) {
      // Profile creation is handled by DB trigger, but we can also manually ensure it if needed
      // or just wait for the auth state change to fetch it
    }
    
    return { error };
  },

  signOut: async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    // Clear mindmap store data on signout
    useMindmapStore.getState().resetAll();
    set({ user: null, profile: null, subscription: null });
  },

  fetchProfile: async (userId: string) => {
    if (!isSupabaseConfigured) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (data) set({ profile: data });
  },

  fetchSubscription: async (userId: string) => {
    if (!isSupabaseConfigured) return;
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (data) set({ subscription: data });
  },
}));

// Initialize Auth listener
if (isSupabaseConfigured) {
  supabase.auth.onAuthStateChange(async (event, session) => {
    const { user } = session || {};
    useAuthStore.setState({ user: user ?? null, loading: false });
    
    if (user) {
      await useAuthStore.getState().fetchProfile(user.id);
      await useAuthStore.getState().fetchSubscription(user.id);
      await useMindmapStore.getState().fetchUserMindmaps();
    }
    
    useAuthStore.getState().setInitialized(true);
  });
} else {
  // Set as initialized but with no user if not configured
  setTimeout(() => {
    useAuthStore.setState({ loading: false, initialized: true });
  }, 0);
}

