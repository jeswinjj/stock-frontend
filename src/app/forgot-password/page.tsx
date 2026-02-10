'use client';
import { useState } from 'react';
import { Button, Input } from '@/components/ui/BaseComponents';
import api from '@/services/api';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, AlertCircle, Mail } from 'lucide-react';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await api.post('/auth/forgot-password', { email });
            setSubmitted(true);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md bg-white p-10 rounded-3xl shadow-xl border border-gray-100 text-center">
                    <div className="flex justify-center mb-6">
                        <div className="bg-green-100 p-4 rounded-full">
                            <CheckCircle2 size={40} className="text-green-600" />
                        </div>
                    </div>
                    <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Request Sent!</h2>
                    <p className="text-gray-600 mb-8 leading-relaxed">
                        If an account exists for <span className="font-bold text-gray-800">{email}</span>, you will receive an email with instructions to reset your password shortly.
                    </p>
                    <Link href="/login">
                        <Button className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all">
                            Return to Login
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white p-10 rounded-3xl shadow-xl border border-gray-100">
                    <Link href="/login" className="inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-700 mb-8 transition-colors">
                        <ArrowLeft size={16} className="mr-2" />
                        Back to Login
                    </Link>

                    <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Forgot Password?</h2>
                    <p className="text-gray-500 mb-8 font-medium">Enter your email and we'll send you a link to reset your password.</p>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-700 text-sm font-medium animate-in fade-in duration-300">
                            <AlertCircle size={20} />
                            {error}
                        </div>
                    )}

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-3.5 text-gray-400" size={20} />
                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    className="pl-12 h-12 bg-gray-50 border-gray-200 focus:bg-white transition-all rounded-xl"
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold shadow-lg shadow-blue-200 transition-all active:scale-[0.98]"
                        >
                            {loading ? 'Sending Link...' : 'Send Reset Link'}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
