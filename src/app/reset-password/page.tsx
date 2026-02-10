'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Input } from '@/components/ui/BaseComponents';
import api from '@/services/api';
import Link from 'next/link';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const validatePassword = (pass: string) => {
        if (pass.length < 8) return "Password must be at least 8 characters long";
        if (!/\d/.test(pass)) return "Password must contain at least one number";
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(pass)) return "Password must contain at least one special character";
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const validationError = validatePassword(password);
        if (validationError) {
            setError(validationError);
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);
        try {
            await api.post('/auth/reset-password', { token, password });
            setSuccess(true);
            setTimeout(() => router.push('/login'), 3000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Invalid or expired token.');
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="bg-white p-10 rounded-3xl shadow-xl border border-gray-100 text-center">
                <div className="flex justify-center mb-6">
                    <div className="bg-red-100 p-4 rounded-full text-red-600">
                        <AlertCircle size={40} />
                    </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Invalid Link</h2>
                <p className="text-gray-600 mb-8">This password reset link is invalid or has expired.</p>
                <Link href="/forgot-password">
                    <Button className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold">Request New Link</Button>
                </Link>
            </div>
        );
    }

    if (success) {
        return (
            <div className="bg-white p-10 rounded-3xl shadow-xl border border-gray-100 text-center">
                <div className="flex justify-center mb-6">
                    <div className="bg-green-100 p-4 rounded-full text-green-600">
                        <CheckCircle2 size={40} />
                    </div>
                </div>
                <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Password Reset!</h2>
                <p className="text-gray-600 mb-2 font-medium">Your password has been successfully updated.</p>
                <p className="text-gray-400 text-sm mb-8">Redirecting you to login...</p>
                <Link href="/login">
                    <Button className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold">Log In Now</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="bg-white p-10 rounded-3xl shadow-xl border border-gray-100 w-full max-w-md">
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center p-3 bg-blue-50 rounded-2xl mb-4">
                    <ShieldCheck size={32} className="text-blue-600" />
                </div>
                <h2 className="text-3xl font-extrabold text-gray-900">New Password</h2>
                <p className="text-gray-500 font-medium">Set a strong password for your account</p>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-700 text-sm font-medium animate-in slide-in-from-top-2">
                    <AlertCircle size={20} />
                    {error}
                </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">New Password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-3.5 text-gray-400" size={20} />
                            <Input
                                type={showPassword ? "text" : "password"}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="pl-12 pr-12 h-12 bg-gray-50 border-gray-200 focus:bg-white transition-all rounded-xl"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Confirm New Password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-3.5 text-gray-400" size={20} />
                            <Input
                                type={showPassword ? "text" : "password"}
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="pl-12 h-12 bg-gray-50 border-gray-200 focus:bg-white transition-all rounded-xl"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-blue-50/50 p-4 rounded-xl space-y-2">
                    <p className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">Requirements</p>
                    <ul className="text-xs text-blue-700 space-y-1">
                        <li className="flex items-center gap-2">
                            <div className={cn("w-1.5 h-1.5 rounded-full", password.length >= 8 ? "bg-green-500" : "bg-blue-300")} />
                            At least 8 characters
                        </li>
                        <li className="flex items-center gap-2">
                            <div className={cn("w-1.5 h-1.5 rounded-full", /\d/.test(password) ? "bg-green-500" : "bg-blue-300")} />
                            At least one number
                        </li>
                        <li className="flex items-center gap-2">
                            <div className={cn("w-1.5 h-1.5 rounded-full", /[!@#$%^&*(),.?":{}|<>]/.test(password) ? "bg-green-500" : "bg-blue-300")} />
                            At least one special character
                        </li>
                    </ul>
                </div>

                <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold shadow-lg shadow-blue-200 transition-all"
                >
                    {loading ? 'Updating...' : 'Reset Password'}
                </Button>
            </form>
        </div>
    );
}

export default function ResetPassword() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center py-12 px-6 lg:px-8">
            <Suspense fallback={<div className="text-gray-400 font-medium">Loading security gateway...</div>}>
                <ResetPasswordForm />
            </Suspense>
        </div>
    );
}
