import React, { useState } from 'react';
import { X, Mail, Lock, User, AlertCircle, Loader2 } from 'lucide-react';

const AuthModal = ({ isOpen, onClose, mode, onAuth }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [currentMode, setCurrentMode] = useState(mode);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        // Validation
        if (!email || !password || (currentMode === 'register' && !name)) {
            setError('Please fill in all fields');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setError('');
        setIsLoading(true);

        // Mock authentication for frontend-only app
        setTimeout(() => {
            const mockUser = {
                id: Date.now(),
                email,
                name: name || email.split('@')[0],
                isPro: false
            };
            const mockToken = 'mock-jwt-token-' + Date.now();

            onAuth(mockUser, mockToken);
            setIsLoading(false);
        }, 1000);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSubmit();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>

                <div className="text-center mb-6">
                    <h2 className="text-3xl font-bold text-slate-800 mb-2">
                        {currentMode === 'login' ? 'Welcome Back' : 'Get Started'}
                    </h2>
                    <p className="text-slate-600">
                        {currentMode === 'login'
                            ? 'Sign in to access your account'
                            : 'Create an account to start analyzing'}
                    </p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
                        <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                )}

                <div className="space-y-4">
                    {currentMode === 'register' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Name
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-sky-400 transition-colors"
                                    placeholder="John Doe"
                                />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Email
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onKeyPress={handleKeyPress}
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-sky-400 transition-colors"
                                placeholder="you@example.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onKeyPress={handleKeyPress}
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-sky-400 transition-colors"
                                placeholder="••••••••"
                            />
                        </div>
                        {currentMode === 'register' && (
                            <p className="text-xs text-slate-500 mt-1">
                                Must be at least 6 characters
                            </p>
                        )}
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="w-full py-3 px-4 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-lg hover:from-sky-600 hover:to-blue-700 transition-all duration-300 font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center">
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Processing...
                            </span>
                        ) : (
                            currentMode === 'login' ? 'Sign In' : 'Create Account'
                        )}
                    </button>
                </div>

                <div className="mt-6 text-center">
                    <p className="text-sm text-slate-600">
                        {currentMode === 'login' ? (
                            <>
                                Don't have an account?{' '}
                                <button
                                    onClick={() => {
                                        setCurrentMode('register');
                                        setError('');
                                    }}
                                    className="text-sky-600 hover:text-sky-700 font-medium"
                                >
                                    Sign up
                                </button>
                            </>
                        ) : (
                            <>
                                Already have an account?{' '}
                                <button
                                    onClick={() => {
                                        setCurrentMode('login');
                                        setError('');
                                    }}
                                    className="text-sky-600 hover:text-sky-700 font-medium"
                                >
                                    Sign in
                                </button>
                            </>
                        )}
                    </p>
                </div>

                {currentMode === 'register' && (
                    <div className="mt-6 p-4 bg-purple-50 rounded-lg">
                        <p className="text-sm text-purple-800 text-center">
                            <span className="font-semibold">🎉 Start Free:</span> Analyze unlimited tracks and use all AI features forever
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuthModal;