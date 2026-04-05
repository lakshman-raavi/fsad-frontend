// Centralized localStorage utility

const PREFIX = 'activityhub_';

export const storage = {
    get: (key, fallback = null) => {
        try {
            const val = localStorage.getItem(PREFIX + key);
            return val !== null ? JSON.parse(val) : fallback;
        } catch {
            return fallback;
        }
    },
    set: (key, value) => {
        try {
            localStorage.setItem(PREFIX + key, JSON.stringify(value));
        } catch (e) {
            console.error('localStorage set error', e);
        }
    },
    remove: (key) => {
        localStorage.removeItem(PREFIX + key);
    },
    clear: () => {
        Object.keys(localStorage)
            .filter(k => k.startsWith(PREFIX))
            .forEach(k => localStorage.removeItem(k));
    },
};

import api from './api';

// Activity operations (NOW ASYNC via Axios API)
export const getActivities = async () => {
    try {
        const res = await api.get('/events');
        // Map data to ensure registrations exists for frontend DataContext
        const dataList = Array.isArray(res.data) ? res.data : [];
        const formatted = dataList.map(a => ({ ...a, registrations: Array.isArray(a.registrations) ? a.registrations : [] }));
        storage.set('activities', formatted);
        return formatted;
    } catch (e) {
        console.error('API getActivities error, falling back to cache', e);
        return storage.get('activities', []);
    }
};

export const setActivities = (activities) => storage.set('activities', activities); // Restored for seedData

export const addActivity = async (activity) => {
    try {
        const res = await api.post('/events', activity);
        const formatted = { ...res.data, registrations: activity.registrations || [] };
        
        // 1. Update localStorage cache
        const current = storage.get('activities', []);
        storage.set('activities', [...current, formatted]);
        
        return formatted;
    } catch (e) {
        console.error('API addActivity error', e);
        throw e;
    }
};

export const updateActivity = async (id, updates) => {
    try {
        const res = await api.put(`/events/${id}`, updates);
        const formatted = { ...res.data, registrations: updates.registrations || [] };
        
        // 1. Update localStorage cache
        const current = storage.get('activities', []);
        const idx = current.findIndex(a => a.id == id);
        if (idx !== -1) {
            current[idx] = { ...current[idx], ...formatted };
            storage.set('activities', current);
        }
        
        return current[idx] || formatted;
    } catch (e) {
        console.error('API updateActivity error', e);
        throw e;
    }
};

export const deleteActivity = async (id) => {
    try {
        await api.delete(`/events/${id}`);
        // 1. Update localStorage cache
        const current = storage.get('activities', []);
        storage.set('activities', current.filter(a => String(a.id) !== String(id)));
    } catch (e) {
        console.error('API deleteActivity error', e);
        throw e;
    }
};

export const getActivity = (id) => storage.get('activities', []).find(a => a.id == id) || null;

export const bulkFinalizeAttendance = async (eventId, records) => {
    try {
        await api.post('/attendance/bulk-finalize', { eventId, records });
    } catch (e) {
        console.error('API bulkFinalizeAttendance error', e);
        throw e;
    }
};

// User operations (NOW ASYNC)
export const getUsers = async () => {
    try {
        const res = await api.get('/users');
        return res.data;
    } catch (e) {
        return storage.get('users', []);
    }
};

export const setUsers = (users) => storage.set('users', users); // Restored

export const addUser = async (user) => {
    try {
        await api.post('/users', user); // If we wanted an admin endpoint to add users
    } catch (e) {
        console.warn('API addUser error', e);
    }
};

export const getUserById = (id) => storage.get('users', []).find(u => u.id === id) || null; // Restored
export const getUserByStudentId = (studentId) => storage.get('users', []).find(u => u.studentId === studentId) || null; // Restored

// Current user session
export const getCurrentUser = () => storage.get('currentUser', null);
export const setCurrentUser = (user) => storage.set('currentUser', user);
export const clearCurrentUser = () => storage.remove('currentUser');

// Notifications
export const getNotifications = (userId) => storage.get(`notifications_${userId}`, []);
export const addNotification = (userId, notification) => {
    const notifs = getNotifications(userId);
    notifs.unshift({ ...notification, id: Date.now(), read: false, createdAt: new Date().toISOString() });
    storage.set(`notifications_${userId}`, notifs.slice(0, 50));
};
export const markNotificationRead = (userId, notifId) => {
    const notifs = getNotifications(userId);
    const idx = notifs.findIndex(n => n.id === notifId);
    if (idx !== -1) notifs[idx].read = true;
    storage.set(`notifications_${userId}`, notifs);
};
export const markAllNotificationsRead = (userId) => {
    const notifs = getNotifications(userId).map(n => ({ ...n, read: true }));
    storage.set(`notifications_${userId}`, notifs);
};

// Theme
export const getTheme = () => storage.get('theme', 'light');
export const setTheme = (theme) => storage.set('theme', theme);

// Generate unique ID
export const generateId = () => `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
