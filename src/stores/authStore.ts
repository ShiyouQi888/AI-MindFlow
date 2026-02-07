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
      // 1. First, set up the listener to ensure we don't miss any events (like SIGNED_IN after signIn call)
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        const user = session?.user ?? null;
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (user) {
            set({ user, loading: false });
            await Promise.allSettled([
              get().fetchProfile(user.id),
              get().fetchSubscription(user.id),
              useMindmapStore.getState().fetchUserMindmaps()
            ]);
          }
        } else if (event === 'SIGNED_OUT') {
          set({ user: null, profile: null, subscription: null, loading: false });
        } else if (event === 'INITIAL_SESSION') {
          // Handle initial session if needed, but getSession usually handles this
          if (user) {
            set({ user, loading: false });
          } else {
            set({ loading: false });
          }
        }
      });

      // 2. Then get initial session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        // Ignore AbortError for getSession as it's often caused by concurrent auth operations
        const isAbortError = 
          sessionError.name === 'AbortError' || 
          sessionError.message?.includes('AbortError') || 
          sessionError.hint?.includes('Request was aborted');

        if (!isAbortError) {
          throw sessionError;
        }
      }

      const user = session?.user ?? null;
      if (user) {
        set({ user });
        await Promise.allSettled([
          get().fetchProfile(user.id),
          get().fetchSubscription(user.id),
          useMindmapStore.getState().fetchUserMindmaps()
        ]);
      }

    } catch (err: any) {
      // Don't log AbortError as a full error
      const isAbortError = 
        err?.name === 'AbortError' || 
        err?.message?.includes('AbortError') || 
        err?.hint?.includes('Request was aborted');

      if (!isAbortError) {
        console.error('Auth initialization error:', err);
      }
      // On error, we might want to allow retry
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
      
      if (data?.user) {
        set({ user: data.user });
        // Fetch profile and subscription immediately
        Promise.allSettled([
          get().fetchProfile(data.user.id),
          get().fetchSubscription(data.user.id),
          useMindmapStore.getState().fetchUserMindmaps()
        ]);
      }
      
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
      // If auto-confirm is enabled, we might get a user immediately
      if (data.session) {
        set({ user: data.user });
        Promise.allSettled([
          get().fetchProfile(data.user.id),
          get().fetchSubscription(data.user.id),
          useMindmapStore.getState().fetchUserMindmaps()
        ]);
      }
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
      // For free users, reset count if it's a new day
      if (data.status === 'free') {
        const lastUpdated = new Date(data.updated_at || data.expires_at || Date.now());
        const now = new Date();
        const isSameDay = lastUpdated.getDate() === now.getDate() && 
                         lastUpdated.getMonth() === now.getMonth() && 
                         lastUpdated.getFullYear() === now.getFullYear();
        
        if (!isSameDay) {
          // Reset for new day
          const { data: updatedData } = await supabase
            .from('subscriptions')
            .update({ ai_usage_count: 0, updated_at: new Date().toISOString() })
            .eq('user_id', userId)
            .select()
            .single();
          if (updatedData) {
            set({ subscription: updatedData });
            return;
          }
        }
      }
      set({ subscription: data });
    } else if (error && error.code === 'PGRST116') {
      // No subscription found, might need to create a default one
      console.log('No subscription found for user, using default free tier');
    }
  },

  updateAIUsage: async (userId: string, increment: number = 1) => {
    if (!isSupabaseConfigured) return;
    
    const { data: currentSub } = await supabase
      .from('subscriptions')
      .select('ai_usage_count, status')
      .eq('user_id', userId)
      .single();
    
    // Pro users have unlimited usage (or a very high limit, but here we just don't increment/check)
    if (currentSub?.status === 'pro') return;
    
    const newCount = (currentSub?.ai_usage_count || 0) + increment;
    
    const { data, error } = await supabase
      .from('subscriptions')
      .update({ ai_usage_count: newCount, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .select()
      .single();
    
    if (data) set({ subscription: data });
  },
}));


