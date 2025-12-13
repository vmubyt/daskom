import { storage } from './storage';

const ADMIN_CREDENTIALS = {
    email: "admin@server48.id",
    password: "server48admin"
};

const ADMIN_USER = {
    id: "admin-1",
    name: "SERVER48 Admin",
    email: "admin@server48.id",
    avatarUrl: "https://ui-avatars.com/api/?name=Server+Admin&background=random",
    role: "admin"
};

export const authService = {
    login: (email, password) => {
        return new Promise((resolve, reject) => {
            // Simulate network delay
            setTimeout(() => {
                if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
                    storage.saveSession(ADMIN_USER);
                    resolve(ADMIN_USER);
                } else {
                    reject(new Error("Invalid credentials"));
                }
            }, 500);
        });
    },

    logout: () => {
        storage.clearSession();
        // Force reload to clear any in-memory state or redirect
        window.location.href = '/admin/login';
    },

    getCurrentUser: () => {
        return storage.getSession();
    },

    isAuthenticated: () => {
        return !!storage.getSession();
    }
};
