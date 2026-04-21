import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../utils/api';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for existing auth on mount
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (credentials) => {
        try {
            const response = await authAPI.login(credentials);
            const { token, user } = response;

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            setToken(token);
            setUser(user);

            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.message || 'Login failed'
            };
        }
    };

    const register = async (userData) => {
        try {
            const response = await authAPI.register(userData);
            const { token, user } = response;

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            setToken(token);
            setUser(user);

            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.message || 'Registration failed'
            };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
    };

    const updateUser = (userData) => {
        const updatedUser = { ...user, ...userData };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
    };

    // Called after successful OTP verification — also refreshes token
    const markEmailVerified = (newToken) => {
        if (newToken) {
            localStorage.setItem('token', newToken);
            setToken(newToken);
        }
        
        const updatedUser = { ...user, emailVerified: true };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
    };

    const sendOTP = async () => {
        try {
            await authAPI.sendOtp();
            return { success: true };
        } catch (error) {
            return { success: false, message: error.message || 'Failed to send OTP' };
        }
    };

    const verifyOTP = async (otp) => {
        try {
            const response = await authAPI.verifyOtp({ otp });
            if (response.success || response.token) {
                if (response.token) {
                    markEmailVerified(response.token);
                } else {
                    markEmailVerified();
                }
                return { success: true };
            }
            return { success: false, message: response.message || 'OTP verification failed' };
        } catch (error) {
            return { success: false, message: error.message || 'OTP verification failed' };
        }
    };

    const forgotPassword = async (data) => {
        try {
            const response = await authAPI.forgotPassword(data);
            return { success: true, message: response.message };
        } catch (error) {
            return { success: false, message: error.message || 'Failed to send reset link' };
        }
    };

    const resetPassword = async (token, data) => {
        try {
            const response = await authAPI.resetPassword(token, data);
            return { success: true, message: response.message };
        } catch (error) {
            return { success: false, message: error.message || 'Failed to reset password' };
        }
    };

    const value = {
        user,
        token,
        loading,
        isAuthenticated: !!token,
        login,
        register,
        logout,
        updateUser,
        markEmailVerified,
        sendOTP,
        verifyOTP,
        forgotPassword,
        resetPassword
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export { AuthContext };
export default AuthContext; // Keeping for compatibility but renamed to satisfy Vite if needed
