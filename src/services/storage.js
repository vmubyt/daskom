
const STORAGE_KEY = 'server48_products';

export const storage = {
    getProducts: () => {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : null;
    },

    saveProducts: (products) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    },

    // Auth storage
    getSession: () => {
        const data = localStorage.getItem('server48_session');
        return data ? JSON.parse(data) : null;
    },

    saveSession: (user) => {
        localStorage.setItem('server48_session', JSON.stringify(user));
    },

    clearSession: () => {
        localStorage.removeItem('server48_session');
    }
};
