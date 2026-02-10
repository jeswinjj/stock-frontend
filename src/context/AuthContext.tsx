'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../services/api';

interface AuthContextType {
    user: any;
    token: string | null;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    logout: () => void;
    togglePrivacy: () => Promise<void>;
    loading: boolean;
    hideBalance: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<any>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [hideBalance, setHideBalance] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const savedToken = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');
        const localPrivacy = localStorage.getItem('hideBalance') === 'true';

        if (savedToken && savedUser) {
            setToken(savedToken);
            const parsedUser = JSON.parse(savedUser);
            setUser(parsedUser);
            // Balance state priority: LocalStorage (instant) -> DB User Profile (persistent)
            setHideBalance(localPrivacy || !!parsedUser.hideBalance);
        }
        setLoading(false);
    }, []);

    const login = async (email: string, password: string) => {
        const res = await api.post('/auth/login', { email, password });
        const { token, user } = res.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('hideBalance', String(!!user.hideBalance));
        setToken(token);
        setUser(user);
        setHideBalance(!!user.hideBalance);
        router.push('/dashboard');
    };

    const register = async (name: string, email: string, password: string) => {
        const res = await api.post('/auth/register', { name, email, password });
        const { token, user } = res.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('hideBalance', 'false');
        setToken(token);
        setUser(user);
        setHideBalance(false);
        router.push('/dashboard');
    };

    const togglePrivacy = async () => {
        const newState = !hideBalance;
        setHideBalance(newState);
        localStorage.setItem('hideBalance', String(newState));

        try {
            await api.post('/user/toggle-privacy', { hideBalance: newState });
        } catch (err: any) {
            console.error('Failed to sync privacy setting with server:', err.response?.data?.message || err.message);
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('hideBalance');
        setToken(null);
        setUser(null);
        setHideBalance(false);
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, token, login, register, logout, togglePrivacy, loading, hideBalance }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
