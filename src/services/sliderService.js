
const STORAGE_KEY = 'server48_sliders';

// Initial demo data
const DEMO_SLIDERS = [
    {
        id: "s-1",
        imageUrl: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80",
        title: "Welcome to SERVER48",
        order: 0,
        createdAt: new Date().toISOString()
    },
    {
        id: "s-2",
        imageUrl: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=1200&q=80",
        title: "Premium Tech Gear",
        order: 1,
        createdAt: new Date().toISOString()
    }
];

// Initialize memory
let sliders = [];
try {
    const stored = localStorage.getItem(STORAGE_KEY);
    sliders = stored ? JSON.parse(stored) : DEMO_SLIDERS;
} catch (e) {
    sliders = DEMO_SLIDERS;
}

const save = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sliders));
};

// Sort by order 0-N
const sortSliders = () => {
    sliders.sort((a, b) => a.order - b.order);
};

// Re-normalize orders 0 to N-1
const normalizeOrders = () => {
    sliders.forEach((s, index) => {
        s.order = index;
    });
    save();
};

export const sliderService = {
    getAll: () => {
        sortSliders();
        return [...sliders];
    },

    getAvailableSlots: (currentOrderId = null) => {
        // Limit is 5 (indexes 0, 1, 2, 3, 4)
        const allSlots = [0, 1, 2, 3, 4];
        const usedSlots = sliders.map(s => s.order);

        // Available = All - Used (plus include current if editing)
        return allSlots.filter(slot =>
            !usedSlots.includes(slot) || (currentOrderId !== null && slot === currentOrderId)
        );
    },

    create: (data) => {
        if (sliders.length >= 5) {
            throw new Error("Maximum 5 sliders allowed");
        }

        // Find first available slot if not provided, or simply use end
        // But usually we just append to end, then let normalize fix it, 
        // OR we fill specific logic. Specification says "Automatically pre-select the lowest available order".
        // Here we just accept what comes or append.

        let newOrder = data.order;
        if (newOrder === undefined || newOrder === null) {
            newOrder = sliders.length; // Append
        }

        const newSlider = {
            id: "s-" + Date.now(),
            imageUrl: data.imageUrl,
            title: data.title || "No Title",
            order: parseInt(newOrder),
            createdAt: new Date().toISOString()
        };

        sliders.push(newSlider);
        // Normalize just in case of weirdness, but strictly we should respect the hole filling if designed that way.
        // BUT Requirement 2.2 says "Recompute orders from top to bottom" implies sequential.
        // Requirement 2.1 says "Only show UNUSED slots". This implies we CAN have gaps temporarily or we insert into slots?
        // Actually 2.2 says "Reassign order sequentially: 0 -> N-1". 
        // This suggests simple sequential ordering is preferred for DnD.
        // But 2.1 Dropdown implies manual slot selection. 
        // Only way to reconcile: We allow manual order assignment, but Sort + Normalize might override it if we are not careful.
        // Let's trust normalize for DnD, but for Create/Edit, we allow setting specific order value.
        // If I manually set order 2 when 0,1,3 exist, we have 0,1,2,3.

        sortSliders();
        save();
        return newSlider;
    },

    update: (id, updatedFields) => {
        const index = sliders.findIndex(s => s.id === id);
        if (index === -1) return null;

        sliders[index] = { ...sliders[index], ...updatedFields };

        // If order changed, we might have conflicts. 
        // Ideally we just save. The list might need re-sorting.
        sortSliders();
        save();
        return sliders[index];
    },

    delete: (id) => {
        if (sliders.length <= 1) {
            throw new Error("Minimum 1 slider required");
        }
        sliders = sliders.filter(s => s.id !== id);
        normalizeOrders(); // 2.3 Delete Rules: Re-normalize orders
    },

    reorder: (reorderedSliders) => {
        // 2.2 Drag & Drop Reordering: Reassign sequential 0 -> N-1
        sliders = reorderedSliders.map((s, index) => ({
            ...s,
            order: index
        }));
        save();
    }
};
