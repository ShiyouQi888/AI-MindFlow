import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { useMindmapStore } from './mindmapStore';

interface AuthState {
  user: User | null;
  profile: any | null;
  subscription: {
    status: 'free' | 'pro' | 'enterprise';
    ai_usage_count: number;
    ai_limit: number;
    expires_at: string | null;
    [key: string]: any;
  } | null;
  loading: boolean;
  initialized: boolean;
  isAuthModalOpen: boolean;
  
  setAuthModalOpen: (open: boolean) => void;
  signIn: (email: string, password?: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, username: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  fetchProfile: (userId: string) => Promise<void>;
  fetchSubscription: (userId: string) => Promise<void>;
  updateAIUsage: (userId: string, increment?: number) => Promise<void>;
  setInitialized: (val: boolean) => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  subscription: null,
  loading: true,
  initialized: false,
  isAuthModalOpen: false,

  setAuthModalOpen: (open) => set({ isAuthModalOpen: open }),
  setInitialized: (val) => set({ initialized: val }),

  initialize: async () => {
    if (get().initialized) return;
    
    // Set initialized to true immediately to prevent concurrent calls
    set({ initialized: true });

    if (!isSupabaseConfigured) {
      set({ loading: false });
      return;
    }

    try {
      // Get initial session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;

      const user = session?.user ?? null;
      if (user) {
        set({ user });
        // Use Promise.allSettled to prevent one failure from blocking others
        // and handle potential AbortErrors or network issues gracefully
        await Promise.allSettled([
          get().fetchProfile(user.id),
          get().fetchSubscription(user.id),
          useMindmapStore.getState().fetchUserMindmaps()
        ]);
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        const user = session?.user ?? null;
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (user) {
            set({ user });
            await Promise.allSettled([
              get().fetchProfile(user.id),
              get().fetchSubscription(user.id),
              useMindmapStore.getState().fetchUserMindmaps()
            ]);
          }
        } else if (event === 'SIGNED_OUT') {
          set({ user: null, profile: null, subscription: null });
        }
      });

    } catch (err: any) {
      // Don't log AbortError as a full error since it's often normal during page navigation/refresh
      if (err?.name !== 'AbortError') {
        console.error('Auth initialization error:', err);
      }
      // If failed, allow retry
      set({ initialized: false });
    } finally {
      set({ loading: false });
    }
  },

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
    try {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
      // Clear mindmap store data on signout
      useMindmapStore.getState().resetAll();
      set({ user: null, profile: null, subscription: null });
      
      // Refresh the page to ensure all states are reset properly
      window.location.reload();
    } catch (error) {
      console.error('Error during sign out:', error);
      // Fallback refresh even if error occurs
      window.location.reload();
    }
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
    
    if (data) {
      set({ subscription: data });
    } else if (error && error.code === 'PGRST116') {
      // No subscription found, might need to create a default one or handle as free
      console.log('No subscription found for user, using default free tier');
    }
  },

  updateAIUsage: async (userId: string, increment: number = 1) => {
    if (!isSupabaseConfigured) return;
    
    const { data: currentSub } = await supabase
      .from('subscriptions')
      .select('ai_usage_count')
      .eq('user_id', userId)
      .single();
    
    const newCount = (currentSub?.ai_usage_count || 0) + increment;
    
    const { data, error } = await supabase
      .from('subscriptions')
      .update({ ai_usage_count: newCount })
      .eq('user_id', userId)
      .select()
      .single();
    
    if (data) set({ subscription: data });
  },
}));


