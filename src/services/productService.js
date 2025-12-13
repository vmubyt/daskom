import { storage } from './storage';

// Initial demo data
const DEMO_PRODUCTS = [
    {
        id: "p-1",
        name: "Classic Mechanical Keyboard",
        description: "High quality mechanical keyboard with tactile switches for the best typing experience.",
        imageUrl: "https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=800&q=80",
        createdAt: new Date().toISOString(),
        status: "visible"
    },
    {
        id: "p-2",
        name: "Wireless Gaming Mouse",
        description: "Ultra-low latency wireless mouse with 20000 DPI sensor.",
        imageUrl: "https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=800&q=80",
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        status: "visible"
    },
    {
        id: "p-3",
        name: "Noise Cancelling Headphones",
        description: "Premium sound quality with active noise cancellation technology.",
        imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        status: "private" // Hidden by default used for verification
    },
    {
        id: "p-4",
        name: "4K Monitor 27-inch",
        description: "Crystal clear display for creative professionals.",
        imageUrl: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80",
        createdAt: new Date(Date.now() - 200000000).toISOString(),
        status: "visible"
    }
];

// Initialize memory
let products = storage.getProducts() || DEMO_PRODUCTS;
// Save immediately if empty (first run)
if (!storage.getProducts()) {
    storage.saveProducts(products);
}

export const productService = {
    getAll: (filterOptions = {}) => {
        const { searchQuery, status } = filterOptions;

        let filtered = [...products];

        // Filter by status
        if (status && status !== 'all') {
            filtered = filtered.filter(p => p.status === status);
        }

        // Filter by search query
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            const fields = filterOptions.searchFields || ['name', 'description'];

            filtered = filtered.filter(p =>
                fields.some(field => p[field] && p[field].toLowerCase().includes(q))
            );
        }

        // Sort by newest first
        return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },

    getById: (id) => {
        return products.find(p => p.id === id);
    },

    create: (productData) => {
        const newProduct = {
            ...productData,
            id: "p-" + Date.now(),
            createdAt: new Date().toISOString()
        };
        products = [newProduct, ...products];
        storage.saveProducts(products);
        return newProduct;
    },

    update: (id, updatedFields) => {
        products = products.map(p =>
            p.id === id ? { ...p, ...updatedFields } : p
        );
        storage.saveProducts(products);
        return products.find(p => p.id === id);
    },

    delete: (id) => {
        products = products.filter(p => p.id !== id);
        storage.saveProducts(products);
    }
};
