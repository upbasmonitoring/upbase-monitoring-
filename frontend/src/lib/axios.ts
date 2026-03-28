import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const instance = axios.create({
    baseURL: API_URL,
});

instance.interceptors.request.use((config) => {
    const userString = localStorage.getItem('user');
    if (userString) {
        try {
            const user = JSON.parse(userString);
            if (user?.token) {
                config.headers.Authorization = `Bearer ${user.token}`;
            }
        } catch (e) {
            console.error("Error parsing user from localStorage", e);
        }
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

let isRedirecting = false;

// Response interceptor for handling common errors
instance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 && !isRedirecting) {
            isRedirecting = true;
            // Only redirect if not on login/signup pages
            if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/signup')) {
                localStorage.removeItem('user');
                window.location.href = '/';
            }
            
            // Reset redirecting flag after a short delay (for next potential session)
            setTimeout(() => { isRedirecting = false; }, 5000);
        }
        return Promise.reject(error);
    }
);


export default instance;
