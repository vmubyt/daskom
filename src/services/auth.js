import { supabase } from '../lib/supabaseClient';

export const authService = {
    login: async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;
        return data.user;
    },

    logout: async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        // Redirect handled by AuthContext state change or UI
        window.location.href = '/admin/login';
    },

    getCurrentUser: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        return session?.user ?? null;
    },

    isAuthenticated: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        return !!session;
    }
};

