import { supabase } from '../lib/supabaseClient';

export const productService = {
    getAll: async (filterOptions = {}) => {
        const { searchQuery, status } = filterOptions;

        let query = supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

        if (status && status !== 'all') {
            query = query.eq('status', status);
        }

        if (searchQuery) {
            query = query.ilike('name', `%${searchQuery}%`);
        }

        const { data, error } = await query;
        if (error) throw error;

        return data.map(p => ({
            ...p,
            imageUrl: p.image_url, // Keep for legacy/fallback
            images: p.images || [], // New multi-image support
            price: p.price || 0,
            quantity: p.quantity || 0,
            variants: p.variants || [],
            createdAt: p.created_at
        }));
    },

    getById: async (id) => {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        return {
            ...data,
            imageUrl: data.image_url,
            images: data.images || [],
            price: data.price || 0,
            quantity: data.quantity || 0,
            variants: data.variants || [],
            createdAt: data.created_at
        };
    },

    create: async (productData) => {
        const dbPayload = {
            name: productData.name,
            description: productData.description,
            image_url: productData.imageUrl, // Main/First image
            images: productData.images || [], // Array of strings
            status: productData.status,
            price: productData.price,
            quantity: productData.quantity,
            variants: productData.variants,
            created_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('products')
            .insert([dbPayload])
            .select()
            .single();

        if (error) throw error;

        return {
            ...data,
            imageUrl: data.image_url,
            images: data.images || [],
            createdAt: data.created_at
        };
    },

    update: async (id, updatedFields) => {
        const dbPayload = {};
        if (updatedFields.name !== undefined) dbPayload.name = updatedFields.name;
        if (updatedFields.description !== undefined) dbPayload.description = updatedFields.description;
        if (updatedFields.imageUrl !== undefined) dbPayload.image_url = updatedFields.imageUrl;
        if (updatedFields.images !== undefined) dbPayload.images = updatedFields.images;
        if (updatedFields.status !== undefined) dbPayload.status = updatedFields.status;
        if (updatedFields.price !== undefined) dbPayload.price = updatedFields.price;
        if (updatedFields.quantity !== undefined) dbPayload.quantity = updatedFields.quantity;
        if (updatedFields.variants !== undefined) dbPayload.variants = updatedFields.variants;

        const { data, error } = await supabase
            .from('products')
            .update(dbPayload)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return {
            ...data,
            imageUrl: data.image_url,
            images: data.images || [],
            createdAt: data.created_at
        };
    },

    delete: async (id) => {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
