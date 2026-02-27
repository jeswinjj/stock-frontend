'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Input, Button } from '@/components/ui/BaseComponents';
import Link from 'next/link';
import { User, Mail, Lock, AlertCircle } from 'lucide-react';

export default function RegisterPage() {
    const { register } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await register(name, email, password);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 transition-colors duration-500 p-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent pointer-events-none" />

            <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-10 border border-gray-100 dark:border-gray-700 relative z-10 animate-in fade-in zoom-in-95 duration-500">
                <div className="text-center mb-10">
                    <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight mb-2">Create Account</h2>
                    <p className="text-gray-500 dark:text-gray-400 font-medium tracking-wide">Join us to start managing your stocks</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 rounded-2xl flex items-center gap-3 text-red-700 dark:text-red-400 text-sm font-bold animate-in slide-in-from-top-2 duration-300">
                        <AlertCircle size={20} className="shrink-0" />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 block">Full Name</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                                <Input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="pl-12 h-12 bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-gray-700 focus:bg-white dark:focus:bg-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 transition-all rounded-xl font-medium"
                                    placeholder="John Doe"
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 block">Email Address</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                                <Input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-12 h-12 bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-gray-700 focus:bg-white dark:focus:bg-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 transition-all rounded-xl font-medium"
                                    placeholder="you@example.com"
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 block">Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                                <Input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-12 h-12 bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-gray-700 focus:bg-white dark:focus:bg-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 transition-all rounded-xl font-medium"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <Button
                        className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-black shadow-lg shadow-blue-200 dark:shadow-none hover:shadow-blue-300 transition-all active:scale-[0.98] mt-2 group"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? 'Creating account...' : (
                            <span className="flex items-center justify-center gap-2">
                                Register
                            </span>
                        )}
                    </Button>
                </form>

                <div className="mt-10 pt-8 border-t border-gray-100 dark:border-gray-700 text-center">
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                        Already have an account? <Link href="/login" className="text-blue-600 dark:text-blue-400 font-black hover:underline ml-1">Log In</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
