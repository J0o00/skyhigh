/**
 * Auth Context
 * 
 * Unified authentication context for all user roles.
 */

import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Load user from localStorage on init
    useEffect(() => {
        const stored = localStorage.getItem('conversaiq_user');
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                setUser(parsed);
            } catch (e) {
                localStorage.removeItem('conversaiq_user');
            }
        }
        setLoading(false);
    }, []);

    // Login with error handling
    const login = async (email, password, role) => {
        try {
            const response = await api.post('/auth/login', { email, password, role });
            const userData = response.data.data.user;
            setUser(userData);
            localStorage.setItem('conversaiq_user', JSON.stringify(userData));
            return userData;
        } catch (error) {
            const errorMessage = error.response?.data?.error || error.message || 'Login failed';
            throw new Error(errorMessage);
        }
    };

    // Register with error handling
    const register = async (name, email, phone, password, role) => {
        try {
            const response = await api.post('/auth/register', { name, email, phone, password, role });
            const userData = response.data.data.user;
            setUser(userData);
            localStorage.setItem('conversaiq_user', JSON.stringify(userData));
            return userData;
        } catch (error) {
            const errorMessage = error.response?.data?.error || error.message || 'Registration failed';
            throw new Error(errorMessage);
        }
    };

    // Logout
    const logout = async () => {
        if (user?._id) {
            try {
                await api.post('/auth/logout', { userId: user._id });
            } catch (e) {
                // Ignore logout errors
            }
        }
        setUser(null);
        localStorage.removeItem('conversaiq_user');
    };

    // Derive agent from user when role is 'agent'
    // This provides backwards compatibility for components expecting 'agent'
    const agent = user?.role === 'agent' ? user : null;

    const value = {
        user,
        agent, // Alias for agent-role users (backwards compatibility)
        loading,
        isAuthenticated: !!user,
        isAgent: user?.role === 'agent',
        isAdmin: user?.role === 'admin',
        isClient: user?.role === 'client',
        login,
        register,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}
