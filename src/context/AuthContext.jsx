import { createContext, useContext, useState, useCallback } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    // Attempt to parse currentUser from localStorage smoothly
    const [user, setUser] = useState(() => {
        try {
            const data = localStorage.getItem('activityhub_currentUser');
            return data ? JSON.parse(data) : null;
        } catch { return null; }
    });

    const login = useCallback(async (credentials, role) => {
        try {
            // Unify payload for both admin and student
            const payload = {
                email: role === 'admin' ? credentials.username : (credentials.email || credentials.studentId),
                password: credentials.password
            };
            
            const response = await api.post('/auth/login', payload);
            
            // Backend sends: { token: '...', user: { id, name, email, role, isVerified }, message }
            const authResponse = response.data;
            const backendUser = authResponse.user;
            
            // Use the real backend numeric ID as studentId so Java lookups work correctly.
            // The backend UserRepository.findById() expects a Long (e.g. 5), not a string like "STU-005".
            const fullUser = {
                ...backendUser,
                studentId: backendUser.id,  // real DB primary key (Long)
                displayId: role === 'admin' ? 'ADMIN' : `STU-${String(backendUser.id).padStart(3, '0')}` // for UI display only
            };
            
            // Store token & user to localStorage
            localStorage.setItem('activityhub_token', authResponse.token);
            localStorage.setItem('activityhub_currentUser', JSON.stringify(fullUser));
            
            setUser(fullUser);
            return { success: true, user: fullUser };
            
        } catch (error) {
            console.error("Login attempt failed:", error);
            const msg = error.response?.data?.message || error.message || 'Login failed! Check credentials or try later.';
            return { success: false, error: msg };
        }
    }, []);

    const register = useCallback(async (data) => {
        try {
            const payload = {
                name: data.name,
                email: data.email,
                studentId: data.studentId,
                password: data.password,
                role: data.role || 'STUDENT'
            };
            
            // Wait for DB creation and OTP dispatcher
            const response = await api.post(`/auth/register?role=${payload.role}`, payload);
            return { success: true, message: response.data.message || 'Registered check email!' };
            
        } catch (error) {
            console.error("Registration failed:", error);
            const msg = error.response?.data?.message || 'Registration failed';
            return { success: false, error: msg };
        }
    }, []);

    const verifyOtp = useCallback(async (email, otp) => {
        try {
            const response = await api.post(`/auth/verify-otp?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otp)}`);
            return { success: true, message: response.data.message };
        } catch (error) {
            console.error("Verification failed:", error);
            const msg = error.response?.data?.message || 'Invalid OTP';
            return { success: false, error: msg };
        }
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('activityhub_token');
        localStorage.removeItem('activityhub_currentUser');
        setUser(null);
    }, []);

    const forgotPassword = useCallback(async (email) => {
        try {
            const response = await api.post(`/auth/forgot-password?email=${encodeURIComponent(email)}`);
            return { success: true, message: response.data.message };
        } catch (error) {
            console.error("Forgot password failed:", error);
            const msg = error.response?.data?.message || 'Failed to send reset OTP';
            return { success: false, error: msg };
        }
    }, []);

    const resetPassword = useCallback(async (email, otp, newPassword) => {
        try {
            const response = await api.post(`/auth/reset-password?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otp)}&newPassword=${encodeURIComponent(newPassword)}`);
            return { success: true, message: response.data.message };
        } catch (error) {
            console.error("Reset password failed:", error);
            const msg = error.response?.data?.message || 'Failed to reset password';
            return { success: false, error: msg };
        }
    }, []);

    return (
        <AuthContext.Provider value={{
            user, 
            login, 
            logout, 
            register, 
            verifyOtp,
            forgotPassword,
            resetPassword,
            isAdmin: user?.role === 'ADMIN' || user?.role === 'admin', 
            isStudent: user?.role === 'STUDENT' || user?.role === 'student',
            isFaculty: user?.role === 'FACULTY' || user?.role === 'faculty' 
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuthContext = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuthContext must be used inside AuthProvider');
    return ctx;
};
