import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
    // Use relative path if the frontend is also deployed on Render (behind a proxy)
    // or use absolute URL from environment variable
    baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
    headers: {
        'Content-Type': 'application/json',
    }
});

// Request Interceptor to add JWT Auth Token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('activityhub_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => Promise.reject(error));

// Response Interceptor to catch 401s globally
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            console.error("Unauthorized! Token may be expired.");
            localStorage.removeItem('activityhub_token');
            localStorage.removeItem('activityhub_currentUser');
            // Optional: redirect to login if not already there
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
