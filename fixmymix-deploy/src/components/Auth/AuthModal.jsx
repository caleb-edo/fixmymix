import React, { useState } from 'react';
import { X, Mail, Lock, User, AlertCircle, Loader2, CheckCircle, Eye, EyeOff } from 'lucide-react';

const AuthModal = ({ isOpen, onClose, mode, onAuth }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [currentMode, setCurrentMode] = useState(mode);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    const [validationStatus, setValidationStatus] = useState({});

    if (!isOpen) return null;

    // Validation functions
    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email) return { isValid: false, message: 'Email is required' };
        if (!emailRegex.test(email)) return { isValid: false, message: 'Please enter a valid email address' };
        if (email.length > 254) return { isValid: false, message: 'Email is too long' };
        return { isValid: true, message: '' };
    };

    const validatePassword = (password) => {
        if (!password) return { isValid: false, message: 'Password is required' };
        if (password.length < 8) return { isValid: false, message: 'Password must be at least 8 characters' };
        if (password.length > 128) return { isValid: false, message: 'Password is too long (max 128 characters)' };

        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        if (!hasUpperCase) return { isValid: false, message: 'Password must contain at least one uppercase letter' };
        if (!hasLowerCase) return { isValid: false, message: 'Password must contain at least one lowercase letter' };
        if (!hasNumbers) return { isValid: false, message: 'Password must contain at least one number' };
        if (!hasSpecialChar) return { isValid: false, message: 'Password must contain at least one special character (!@#$%^&*...)' };

        // Check for common weak passwords
        const commonPasswords = ['password', '12345678', 'qwerty123', 'abc123456', 'password123'];
        if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
            return { isValid: false, message: 'Password is too common. Please choose a stronger password' };
        }

        return { isValid: true, message: '' };
    };

    const validateName = (name) => {
        if (!name) return { isValid: false, message: 'Name is required' };
        if (name.trim().length < 2) return { isValid: false, message: 'Name must be at least 2 characters' };
        if (name.length > 50) return { isValid: false, message: 'Name is too long (max 50 characters)' };

        // Check for valid characters (letters, spaces, hyphens, apostrophes)
        const nameRegex = /^[a-zA-Z\s\-']+$/;
        if (!nameRegex.test(name)) return { isValid: false, message: 'Name can only contain letters, spaces, hyphens, and apostrophes' };

        // Check for suspicious patterns
        if (/^\s+|\s+$/.test(name)) return { isValid: false, message: 'Name cannot start or end with spaces' };
        if (/\s{2,}/.test(name)) return { isValid: false, message: 'Name cannot contain multiple consecutive spaces' };

        return { isValid: true, message: '' };
    };

    const validateConfirmPassword = (confirmPassword, password) => {
        if (!confirmPassword) return { isValid: false, message: 'Please confirm your password' };
        if (confirmPassword !== password) return { isValid: false, message: 'Passwords do not match' };
        return { isValid: true, message: '' };
    };

    // Real-time validation
    const handleEmailChange = (value) => {
        setEmail(value);
        const validation = validateEmail(value);
        setFieldErrors(prev => ({ ...prev, email: validation.isValid ? '' : validation.message }));
        setValidationStatus(prev => ({ ...prev, email: validation.isValid }));
    };

    const handlePasswordChange = (value) => {
        setPassword(value);
        const validation = validatePassword(value);
        setFieldErrors(prev => ({ ...prev, password: validation.isValid ? '' : validation.message }));
        setValidationStatus(prev => ({ ...prev, password: validation.isValid }));

        // Revalidate confirm password if it exists
        if (confirmPassword) {
            const confirmValidation = validateConfirmPassword(confirmPassword, value);
            setFieldErrors(prev => ({ ...prev, confirmPassword: confirmValidation.isValid ? '' : confirmValidation.message }));
            setValidationStatus(prev => ({ ...prev, confirmPassword: confirmValidation.isValid }));
        }
    };

    const handleConfirmPasswordChange = (value) => {
        setConfirmPassword(value);
        const validation = validateConfirmPassword(value, password);
        setFieldErrors(prev => ({ ...prev, confirmPassword: validation.isValid ? '' : validation.message }));
        setValidationStatus(prev => ({ ...prev, confirmPassword: validation.isValid }));
    };

    const handleNameChange = (value) => {
        setName(value);
        const validation = validateName(value);
        setFieldErrors(prev => ({ ...prev, name: validation.isValid ? '' : validation.message }));
        setValidationStatus(prev => ({ ...prev, name: validation.isValid }));
    };

    // Password strength indicator
    const getPasswordStrength = (password) => {
        let score = 0;
        if (password.length >= 8) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[a-z]/.test(password)) score++;
        if (/\d/.test(password)) score++;
        if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
        if (password.length >= 12) score++;

        if (score <= 2) return { level: 'weak', color: 'bg-red-500', text: 'Weak' };
        if (score <= 4) return { level: 'medium', color: 'bg-yellow-500', text: 'Medium' };
        return { level: 'strong', color: 'bg-green-500', text: 'Strong' };
    };

    const handleSubmit = async () => {
        // Clear previous errors
        setError('');
        setFieldErrors({});

        // Validate all fields
        const emailValidation = validateEmail(email);
        const passwordValidation = validatePassword(password);
        let nameValidation = { isValid: true };
        let confirmPasswordValidation = { isValid: true };

        if (currentMode === 'register') {
            nameValidation = validateName(name);
            confirmPasswordValidation = validateConfirmPassword(confirmPassword, password);
        }

        // Set field errors
        const newFieldErrors = {};
        if (!emailValidation.isValid) newFieldErrors.email = emailValidation.message;
        if (!passwordValidation.isValid) newFieldErrors.password = passwordValidation.message;
        if (currentMode === 'register') {
            if (!nameValidation.isValid) newFieldErrors.name = nameValidation.message;
            if (!confirmPasswordValidation.isValid) newFieldErrors.confirmPassword = confirmPasswordValidation.message;
        }

        if (Object.keys(newFieldErrors).length > 0) {
            setFieldErrors(newFieldErrors);
            return;
        }

        // Additional security checks
        if (currentMode === 'register') {
            // Check if email looks like a temporary/disposable email
            const disposableDomains = ['10minutemail.com', 'tempmail.org', 'guerrillamail.com', 'mailinator.com'];
            const emailDomain = email.split('@')[1]?.toLowerCase();
            if (disposableDomains.includes(emailDomain)) {
                setError('Please use a permanent email address');
                return;
            }

            // Check if name looks suspicious
            if (name.toLowerCase().includes('test') || name.toLowerCase().includes('admin')) {
                setError('Please enter your real name');
                return;
            }
        }

        setIsLoading(true);

        // Simulate API call with realistic delay
        setTimeout(() => {
            // Mock different responses based on email for testing
            if (email === 'existing@test.com' && currentMode === 'register') {
                setError('An account with this email already exists');
                setIsLoading(false);
                return;
            }

            if (email === 'invalid@test.com' && currentMode === 'login') {
                setError('Invalid email or password');
                setIsLoading(false);
                return;
            }

            const mockUser = {
                id: Date.now(),
                email,
                name: name || email.split('@')[0],
                isPro: false,
                emailVerified: true
            };
            const mockToken = 'mock-jwt-token-' + Date.now();

            onAuth(mockUser, mockToken);
            setIsLoading(false);
        }, 1500);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSubmit();
        }
    };

    const switchMode = () => {
        setCurrentMode(currentMode === 'login' ? 'register' : 'login');
        setError('');
        setFieldErrors({});
        setValidationStatus({});
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setName('');
    };

    const passwordStrength = currentMode === 'register' && password ? getPasswordStrength(password) : null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative max-h-[90vh] overflow-y-auto">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>

                <div className="text-center mb-6">
                    <h2 className="text-3xl font-bold text-slate-800 mb-2">
                        {currentMode === 'login' ? 'Welcome Back' : 'Create Account'}
                    </h2>
                    <p className="text-slate-600">
                        {currentMode === 'login'
                            ? 'Sign in to access unlimited features'
                            : 'Join for free unlimited access to all features'}
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
                                Full Name *
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => handleNameChange(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none transition-colors ${
                                        fieldErrors.name
                                            ? 'border-red-300 focus:border-red-400'
                                            : validationStatus.name
                                                ? 'border-green-300 focus:border-green-400'
                                                : 'border-slate-300 focus:border-sky-400'
                                    }`}
                                    placeholder="John Doe"
                                />
                                {validationStatus.name && (
                                    <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-500" />
                                )}
                            </div>
                            {fieldErrors.name && (
                                <p className="text-sm text-red-600 mt-1">{fieldErrors.name}</p>
                            )}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Email Address *
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => handleEmailChange(e.target.value)}
                                onKeyPress={handleKeyPress}
                                className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none transition-colors ${
                                    fieldErrors.email
                                        ? 'border-red-300 focus:border-red-400'
                                        : validationStatus.email
                                            ? 'border-green-300 focus:border-green-400'
                                            : 'border-slate-300 focus:border-sky-400'
                                }`}
                                placeholder="you@example.com"
                                autoComplete="email"
                            />
                            {validationStatus.email && (
                                <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-500" />
                            )}
                        </div>
                        {fieldErrors.email && (
                            <p className="text-sm text-red-600 mt-1">{fieldErrors.email}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Password *
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => handlePasswordChange(e.target.value)}
                                onKeyPress={handleKeyPress}
                                className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none transition-colors ${
                                    fieldErrors.password
                                        ? 'border-red-300 focus:border-red-400'
                                        : validationStatus.password
                                            ? 'border-green-300 focus:border-green-400'
                                            : 'border-slate-300 focus:border-sky-400'
                                }`}
                                placeholder="••••••••"
                                autoComplete={currentMode === 'login' ? 'current-password' : 'new-password'}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                        {fieldErrors.password && (
                            <p className="text-sm text-red-600 mt-1">{fieldErrors.password}</p>
                        )}

                        {/* Password strength indicator for registration */}
                        {currentMode === 'register' && password && !fieldErrors.password && (
                            <div className="mt-2">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs text-slate-600">Password strength:</span>
                                    <span className={`text-xs font-medium ${
                                        passwordStrength.level === 'weak' ? 'text-red-600' :
                                            passwordStrength.level === 'medium' ? 'text-yellow-600' : 'text-green-600'
                                    }`}>
                                        {passwordStrength.text}
                                    </span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-1.5">
                                    <div
                                        className={`h-1.5 rounded-full transition-all ${passwordStrength.color}`}
                                        style={{
                                            width: passwordStrength.level === 'weak' ? '33%' :
                                                passwordStrength.level === 'medium' ? '66%' : '100%'
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        {currentMode === 'register' && (
                            <div className="mt-2 text-xs text-slate-500">
                                <p>Password must contain:</p>
                                <ul className="list-disc list-inside mt-1 space-y-0.5">
                                    <li>At least 8 characters</li>
                                    <li>Upper & lowercase letters</li>
                                    <li>At least one number</li>
                                    <li>At least one special character</li>
                                </ul>
                            </div>
                        )}
                    </div>

                    {currentMode === 'register' && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Confirm Password *
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    className={`w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none transition-colors ${
                                        fieldErrors.confirmPassword
                                            ? 'border-red-300 focus:border-red-400'
                                            : validationStatus.confirmPassword
                                                ? 'border-green-300 focus:border-green-400'
                                                : 'border-slate-300 focus:border-sky-400'
                                    }`}
                                    placeholder="••••••••"
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            {fieldErrors.confirmPassword && (
                                <p className="text-sm text-red-600 mt-1">{fieldErrors.confirmPassword}</p>
                            )}
                        </div>
                    )}

                    <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="w-full py-3 px-4 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-lg hover:from-sky-600 hover:to-blue-700 transition-all duration-300 font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-sky-500 disabled:hover:to-blue-600"
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center">
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                {currentMode === 'login' ? 'Signing In...' : 'Creating Account...'}
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
                                    onClick={switchMode}
                                    className="text-sky-600 hover:text-sky-700 font-medium"
                                >
                                    Sign up for free
                                </button>
                            </>
                        ) : (
                            <>
                                Already have an account?{' '}
                                <button
                                    onClick={switchMode}
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
                            <span className="font-semibold">🎉 100% Free Forever:</span> Unlimited AI mixing, analysis, and all features
                        </p>
                    </div>
                )}

                {/* Test accounts info for development */}
                <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs text-slate-600 text-center">
                        <strong>Test validation:</strong> Try "existing@test.com" (register) or "invalid@test.com" (login)
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AuthModal;
