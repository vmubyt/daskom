import { supabase } from '../lib/supabaseClient';

export const sliderService = {
    getAll: async () => {
        const { data, error } = await supabase
            .from('sliders')
            .select('*')
            .order('order', { ascending: true });

        if (error) throw error;

        return data.map(s => ({
            ...s,
            imageUrl: s.image_url,
            createdAt: s.created_at
        }));
    },

    getAvailableSlots: async (currentOrderId = null) => {
        // Limit is 10
        const allSlots = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

        const { data: sliders, error } = await supabase
            .from('sliders')
            .select('order');

        if (error) throw error;

        const usedSlots = sliders.map(s => s.order);

        // Available = All - Used (plus include current if editing)
        return allSlots.filter(slot =>
            !usedSlots.includes(slot) || (currentOrderId !== null && slot === currentOrderId)
        );
    },

    create: async (data) => {
        // Check Limit
        const { count, error: countError } = await supabase
            .from('sliders')
            .select('*', { count: 'exact', head: true });

        if (countError) throw countError;
        if (count >= 10) {
            throw new Error("Maximum 10 sliders allowed");
        }

        // Determine Order
        let newOrder = data.order;
        if (newOrder === undefined || newOrder === null) {
            newOrder = count; // Append
        }

        const dbPayload = {
            title: data.title || "No Title",
            image_url: data.imageUrl,
            order: parseInt(newOrder),
            created_at: new Date().toISOString()
        };

        const { data: newSlider, error } = await supabase
            .from('sliders')
            .insert([dbPayload])
            .select()
            .single();

        if (error) throw error;

        // Normalize just in case
        await sliderService.normalizeOrders();

        return {
            ...newSlider,
            imageUrl: newSlider.image_url,
            createdAt: newSlider.created_at
        };
    },

    update: async (id, updatedFields) => {
        const dbPayload = {};
        if (updatedFields.title !== undefined) dbPayload.title = updatedFields.title;
        if (updatedFields.imageUrl !== undefined) dbPayload.image_url = updatedFields.imageUrl;
        if (updatedFields.order !== undefined) dbPayload.order = updatedFields.order;

        const { data, error } = await supabase
            .from('sliders')
            .update(dbPayload)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // If order changed, we might need to sort/normalize
        await sliderService.normalizeOrders();

        return {
            ...data,
            imageUrl: data.image_url,
            createdAt: data.created_at
        };
    },

    delete: async (id) => {
        // Check minimum 1? Requirement: "minimum of one... active slides".
        // Frontend handles this mostly, but backend check is good.
        // However, Supabase permissions usually handle this or we do it here.
        const { count } = await supabase.from('sliders').select('*', { count: 'exact', head: true });
        if (count <= 1) {
            throw new Error("Minimum 1 slider required");
        }

        const { error } = await supabase
            .from('sliders')
            .delete()
            .eq('id', id);

        if (error) throw error;

        await sliderService.normalizeOrders();
    },

    reorder: async (reorderedSliders) => {
        // reorderedSliders is array of objects { id, order ... } with NEW correct order (index based)
        // We need to update each slider in DB to match its new index.

        // This is inefficient (N requests), but fine for 5 items.
        // We can do it concurrently.
        const updates = reorderedSliders.map((slider, index) => {
            return supabase
                .from('sliders')
                .update({ order: index })
                .eq('id', slider.id);
        });

        await Promise.all(updates);
    },

    normalizeOrders: async () => {
        // Fetch all, sort by order, then re-write orders 0..N-1
        const { data: sliders } = await supabase
            .from('sliders')
            .select('*')
            .order('order', { ascending: true });

        if (!sliders) return;

        const updates = sliders.map((slider, index) => {
            if (slider.order !== index) {
                return supabase.from('sliders').update({ order: index }).eq('id', slider.id);
            }
            return Promise.resolve();
        });

        await Promise.all(updates);
    }
};
