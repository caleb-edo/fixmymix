import React, { useState, useCallback, useEffect } from 'react';
import { Play, Pause, Square, Activity, BarChart3, Lightbulb, Headphones, AlertCircle, Sparkles, Menu, X, Mail, ChevronRight, Lock, Shield, Zap, Users, Star, ArrowRight, LogOut } from 'lucide-react';
import { useAudioContext } from './hooks/useAudioContext';
import { AudioProcessor } from './utils/audioProcessor';
import AudioUpload from './components/AudioUpload/AudioUpload';
import SpectrumAnalyzer from './components/Visualizer/SpectrumAnalyzer';
import InsightsPanel from './components/Analysis/InsightsPanel';
import FixMyMixAI from './components/AI/FixMyMixAI';
import AuthModal from './components/Auth/AuthModal';

// Navigation Component
const Navigation = ({ user, onLogout, onAuthClick }) => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <nav className="bg-gradient-to-r from-slate-900 to-blue-900 shadow-xl sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex items-center justify-between h-20">
                    {/* Logo */}
                    <div className="flex items-center space-x-4">
                        <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl">
                            <Activity className="w-8 h-8 text-sky-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">FixMyMix</h1>
                            <p className="text-sky-200 text-xs">Free Professional Audio Analysis</p>
                        </div>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-8">
                        <a href="#features" className="text-white/80 hover:text-white transition-colors">Features</a>
                        <a href="#about" className="text-white/80 hover:text-white transition-colors">About</a>
                        <a href="#contact" className="text-white/80 hover:text-white transition-colors">Contact</a>

                        {user ? (
                            <>
                                <span className="text-white/70 text-sm">
                                    {user.email}
                                </span>
                                <button
                                    onClick={onLogout}
                                    className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors flex items-center"
                                >
                                    <LogOut className="w-4 h-4 mr-2" />
                                    Sign Out
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={() => onAuthClick('login')}
                                    className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors"
                                >
                                    Sign In
                                </button>
                                <button
                                    onClick={() => onAuthClick('register')}
                                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg"
                                >
                                    Sign Up Free
                                </button>
                            </>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden text-white"
                    >
                        {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>

                {/* Mobile Navigation */}
                {mobileMenuOpen && (
                    <div className="md:hidden pb-6">
                        <div className="flex flex-col space-y-4">
                            <a href="#features" className="text-white/80 hover:text-white transition-colors">Features</a>
                            <a href="#about" className="text-white/80 hover:text-white transition-colors">About</a>
                            <a href="#contact" className="text-white/80 hover:text-white transition-colors">Contact</a>
                            {user ? (
                                <>
                                    <span className="text-white/70 text-sm">
                                        {user.email}
                                    </span>
                                    <button
                                        onClick={onLogout}
                                        className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors text-left"
                                    >
                                        Sign Out
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={() => onAuthClick('login')}
                                        className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors text-left"
                                    >
                                        Sign In
                                    </button>
                                    <button
                                        onClick={() => onAuthClick('register')}
                                        className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg text-left"
                                    >
                                        Sign Up Free
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
};

// Main App Component
function App() {
    const { audioContext, isContextReady } = useAudioContext();
    const [audioProcessor, setAudioProcessor] = useState(null);
    const [currentFile, setCurrentFile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioSource, setAudioSource] = useState(null);
    const [user, setUser] = useState(null);
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [authMode, setAuthMode] = useState('login');
    const [showAIMixer, setShowAIMixer] = useState(false);
    const [userProfile, setUserProfile] = useState(null);

    // Usage tracking state
    const [dailyUsage, setDailyUsage] = useState(0);
    const [hasTriedFixMyMix, setHasTriedFixMyMix] = useState(false);

    // Load user from localStorage on mount
    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (token && userData) {
            setUser(JSON.parse(userData));
        }

        // Load usage tracking
        loadUsageTracking();
    }, []);

    // Load usage tracking from localStorage
    const loadUsageTracking = () => {
        const today = new Date().toDateString();
        const savedUsageDate = localStorage.getItem('usageDate');
        const savedUsageCount = localStorage.getItem('dailyUsage');
        const savedFixMyMixTrial = localStorage.getItem('hasTriedFixMyMix');

        // Reset if it's a new day
        if (savedUsageDate !== today) {
            setDailyUsage(0);
            localStorage.setItem('usageDate', today);
            localStorage.setItem('dailyUsage', '0');
        } else {
            setDailyUsage(parseInt(savedUsageCount || '0'));
        }

        setHasTriedFixMyMix(savedFixMyMixTrial === 'true');
    };

    // Increment usage count
    const incrementUsage = () => {
        const newCount = dailyUsage + 1;
        setDailyUsage(newCount);
        localStorage.setItem('dailyUsage', newCount.toString());
    };

    // Check if user can use analysis
    const canUseAnalysis = () => {
        if (user) return true; // Logged in users have unlimited access
        return dailyUsage < 2; // Non-logged in users have 2 free uses
    };

    // Check if user can use FixMyMix AI
    const canUseFixMyMix = () => {
        if (user) return true; // Logged in users have unlimited access
        return !hasTriedFixMyMix; // Non-logged in users get one trial
    };

    // Mark FixMyMix as tried
    const markFixMyMixTried = () => {
        setHasTriedFixMyMix(true);
        localStorage.setItem('hasTriedFixMyMix', 'true');
    };

    const handleAuth = (userData, token) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        setAuthModalOpen(false);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setUserProfile(null);
        setCurrentFile(null);
        setShowAIMixer(false);
    };

    const handleAuthClick = (mode) => {
        setAuthMode(mode);
        setAuthModalOpen(true);
    };

    const handleFileSelect = useCallback(async (file) => {
        if (!audioContext) return;

        // Check analysis limits
        if (!canUseAnalysis()) {
            alert('You have reached your daily limit of 2 free analyses. Please sign up for unlimited analyses - it\'s free!');
            handleAuthClick('register');
            return;
        }

        setIsLoading(true);
        try {
            const processor = new AudioProcessor(audioContext);
            const audioBuffer = await processor.loadAudioFile(file);

            setAudioProcessor(processor);
            setCurrentFile(file);

            // Increment usage for non-logged in users
            if (!user) {
                incrementUsage();
            }

        } catch (error) {
            console.error('Error processing audio:', error);
            alert('Failed to process audio file: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    }, [audioContext, user, dailyUsage]);

    const handlePlay = () => {
        if (!audioProcessor || !audioProcessor.audioBuffer) return;

        if (audioSource) {
            audioSource.stop();
            setAudioSource(null);
            setIsPlaying(false);
            return;
        }

        const source = audioProcessor.connectSource(audioProcessor.audioBuffer);
        source.start();
        setAudioSource(source);
        setIsPlaying(true);

        source.addEventListener('ended', () => {
            setIsPlaying(false);
            setAudioSource(null);
        });
    };

    const handleStop = () => {
        if (audioSource) {
            audioSource.stop();
            setAudioSource(null);
            setIsPlaying(false);
        }
    };

    // Enhanced FixMyMix AI with trial wrapper
    const FixMyMixAIWithTrial = ({ user, audioContext }) => {
        // If trial already used and not logged in, show signup prompt
        if (!canUseFixMyMix() && !user) {
            return (
                <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-8 text-white">
                    <div className="max-w-2xl mx-auto">
                        <Sparkles className="w-16 h-16 mx-auto mb-4" />
                        <h2 className="text-3xl font-bold mb-4">FixMyMix AI - Trial Used</h2>
                        <p className="text-lg mb-6 text-purple-100">
                            You've used your free trial! Sign up for free to get unlimited AI mixing with professional results.
                        </p>
                        <div className="grid md:grid-cols-3 gap-4 mb-8">
                            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                                <h3 className="font-semibold mb-2">Unlimited Mixing</h3>
                                <p className="text-sm text-purple-100">Mix as many tracks as you want</p>
                            </div>
                            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                                <h3 className="font-semibold mb-2">Pro Compression</h3>
                                <p className="text-sm text-purple-100">Dynamic range optimization</p>
                            </div>
                            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                                <h3 className="font-semibold mb-2">Unlimited Analysis</h3>
                                <p className="text-sm text-purple-100">No daily limits</p>
                            </div>
                        </div>
                        <button
                            onClick={() => handleAuthClick('register')}
                            className="px-8 py-3 bg-white text-purple-600 rounded-xl hover:bg-purple-50 transition-colors font-semibold shadow-lg"
                        >
                            Sign Up Free
                        </button>
                    </div>
                </div>
            );
        }

        // If user has trial available or is logged in, show the component
        return (
            <div className="space-y-4">
                {!user && !hasTriedFixMyMix && (
                    <div className="bg-green-100 border border-green-300 rounded-xl p-4">
                        <p className="text-green-800 font-medium">
                            🎉 Free Trial: Experience the full FixMyMix AI feature once! Upload, mix, play, and download your result.
                        </p>
                    </div>
                )}
                <FixMyMixAI
                    user={user || { isPro: true }} // All logged in users have unlimited access
                    onUpgradeClick={() => handleAuthClick('register')}
                    audioContext={audioContext}
                    onMixComplete={markFixMyMixTried}
                    isTrialUser={!user}
                />
            </div>
        );
    };

    // Track Counter Component
    const TrackCounter = () => {
        if (user) return null; // Logged in users have unlimited access

        return (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                    <div>
                        <p className="text-amber-800 font-medium">
                            Free Trial: {dailyUsage}/2 tracks analyzed today
                            {!hasTriedFixMyMix && <span className="text-green-600"> • 1 AI Mix trial available</span>}
                        </p>
                        <p className="text-amber-600 text-sm">
                            {dailyUsage >= 2
                                ? "Daily limit reached. Sign up for free unlimited access!"
                                : `${2 - dailyUsage} track${2 - dailyUsage === 1 ? '' : 's'} remaining today`}
                        </p>
                    </div>
                </div>
                {dailyUsage >= 2 && (
                    <button
                        onClick={() => handleAuthClick('register')}
                        className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all text-sm font-semibold shadow-md"
                    >
                        Sign Up Free
                    </button>
                )}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50">
            {/* Navigation */}
            <Navigation
                user={user}
                onLogout={handleLogout}
                onAuthClick={handleAuthClick}
            />

            {/* Auth Modal */}
            {authModalOpen && (
                <AuthModal
                    isOpen={authModalOpen}
                    onClose={() => setAuthModalOpen(false)}
                    mode={authMode}
                    onAuth={handleAuth}
                />
            )}

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-12">
                {!isContextReady && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-center justify-center">
                        <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                        <p className="text-yellow-800">Click anywhere to initialize audio context</p>
                    </div>
                )}

                {showAIMixer ? (
                    <div className="space-y-8">
                        <button
                            onClick={() => setShowAIMixer(false)}
                            className="text-sky-600 hover:text-sky-700 font-medium flex items-center"
                        >
                            ← Back to Analyzer
                        </button>
                        <FixMyMixAIWithTrial
                            user={user}
                            audioContext={audioContext}
                        />
                    </div>
                ) : !currentFile ? (
                    <div className="space-y-12">
                        {/* Hero Section */}
                        <div className="text-center space-y-4 max-w-3xl mx-auto pt-8">
                            <div className="inline-flex items-center px-4 py-2 bg-sky-100 text-sky-800 rounded-full text-sm font-medium">
                                <Zap className="w-4 h-4 mr-2" />
                                100% Free Professional Audio Tools
                            </div>
                            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-slate-800 to-sky-600 bg-clip-text text-transparent">
                                Transform Your Mix with AI-Powered Analysis
                            </h1>
                            <p className="text-xl text-slate-600">
                                Upload your beat or instrumental to receive professional mixing and mastering insights
                                powered by advanced audio visualization and smart analysis - completely free!
                            </p>

                            {/* AI Mixer Button */}
                            <button
                                onClick={() => setShowAIMixer(true)}
                                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg text-lg font-semibold"
                            >
                                <Sparkles className="w-6 h-6 mr-2" />
                                Try FixMyMix AI
                                {!user && !hasTriedFixMyMix && <span className="ml-2 text-sm">(Free Trial)</span>}
                            </button>
                        </div>

                        {/* Track Counter */}
                        <TrackCounter />

                        {/* Upload Section */}
                        <AudioUpload onFileSelect={handleFileSelect} isLoading={isLoading} />

                        {/* Features Section */}
                        <section id="features" className="space-y-8">
                            <div className="text-center">
                                <h2 className="text-3xl font-bold text-slate-900 mb-4">Powerful Features - 100% Free</h2>
                                <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                                    Professional-grade audio analysis and AI-powered mixing tools. No hidden fees, no credit card required.
                                </p>
                            </div>

                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                                <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200 hover:shadow-xl transition-shadow">
                                    <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center mb-4">
                                        <BarChart3 className="w-6 h-6 text-sky-600" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-slate-800 mb-2">Real-Time Spectrum Analysis</h3>
                                    <p className="text-slate-600">
                                        Visualize your audio's frequency content with professional-grade spectrum analysis. Identify problematic frequencies and optimize your mix in real-time.
                                    </p>
                                </div>

                                <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200 hover:shadow-xl transition-shadow">
                                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                                        <Lightbulb className="w-6 h-6 text-purple-600" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-slate-800 mb-2">AI-Powered Insights</h3>
                                    <p className="text-slate-600">
                                        Get intelligent mixing suggestions tailored to your genre. Our AI analyzes your track and provides actionable recommendations for improvement.
                                    </p>
                                </div>

                                <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200 hover:shadow-xl transition-shadow">
                                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                                        <Sparkles className="w-6 h-6 text-green-600" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-slate-800 mb-2">FixMyMix AI</h3>
                                    <p className="text-slate-600">
                                        Upload separate beat and vocal tracks, and our AI automatically creates a professional mix with genre-specific EQ, compression, and spatial processing.
                                    </p>
                                </div>

                                <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200 hover:shadow-xl transition-shadow">
                                    <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-4">
                                        <Headphones className="w-6 h-6 text-amber-600" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-slate-800 mb-2">Genre-Specific Analysis</h3>
                                    <p className="text-slate-600">
                                        Tailored analysis for Hip-Hop, Pop, Rock, Electronic, Jazz, and more. Each genre has optimized thresholds and recommendations.
                                    </p>
                                </div>

                                <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200 hover:shadow-xl transition-shadow">
                                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                                        <Activity className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-slate-800 mb-2">Dynamic Range Analysis</h3>
                                    <p className="text-slate-600">
                                        Monitor compression levels and dynamic range to ensure your tracks maintain punch and clarity across all playback systems.
                                    </p>
                                </div>

                                <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200 hover:shadow-xl transition-shadow">
                                    <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4">
                                        <Zap className="w-6 h-6 text-red-600" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-slate-800 mb-2">Instant Processing</h3>
                                    <p className="text-slate-600">
                                        Fast, browser-based processing means no uploads required. Your audio stays private and analysis happens instantly on your device.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* How It Works Section */}
                        <section className="space-y-8">
                            <div className="text-center">
                                <h2 className="text-3xl font-bold text-slate-900 mb-4">How It Works</h2>
                                <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                                    Get started in seconds - no payment required!
                                </p>
                            </div>

                            <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-200">
                                <div className="grid md:grid-cols-2 gap-8 items-center">
                                    <div>
                                        <h3 className="text-2xl font-bold text-slate-800 mb-6">Free Trial</h3>
                                        <ul className="space-y-4">
                                            <li className="flex items-start">
                                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                                                    <span className="text-green-600 font-bold">1</span>
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-800">Try without signing up</p>
                                                    <p className="text-slate-600 text-sm">Get 2 audio analyses and 1 AI mix completely free</p>
                                                </div>
                                            </li>
                                            <li className="flex items-start">
                                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                                                    <span className="text-green-600 font-bold">2</span>
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-800">Test all features</p>
                                                    <p className="text-slate-600 text-sm">Experience the full power of our AI tools</p>
                                                </div>
                                            </li>
                                        </ul>
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-slate-800 mb-6">Unlimited Free Access</h3>
                                        <ul className="space-y-4">
                                            <li className="flex items-start">
                                                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                                                    <span className="text-purple-600 font-bold">3</span>
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-800">Sign up for free</p>
                                                    <p className="text-slate-600 text-sm">Quick registration - no credit card needed</p>
                                                </div>
                                            </li>
                                            <li className="flex items-start">
                                                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                                                    <span className="text-purple-600 font-bold">∞</span>
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-800">Get unlimited access forever</p>
                                                    <p className="text-slate-600 text-sm">All features, no limits, always free</p>
                                                </div>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                                <div className="mt-8 text-center">
                                    {!user && (
                                        <button
                                            onClick={() => handleAuthClick('register')}
                                            className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg font-semibold"
                                        >
                                            <ArrowRight className="w-5 h-5 mr-2" />
                                            Sign Up Free - Get Unlimited Access
                                        </button>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* About Section */}
                        <section id="about" className="space-y-8">
                            <div className="text-center">
                                <h2 className="text-3xl font-bold text-slate-900 mb-4">About FixMyMix</h2>
                                <p className="text-lg text-slate-600 max-w-3xl mx-auto">
                                    We believe professional audio tools should be accessible to everyone, regardless of budget.
                                </p>
                            </div>

                            <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-200">
                                <div className="max-w-4xl mx-auto">
                                    <div className="grid md:grid-cols-2 gap-12 items-center">
                                        <div>
                                            <h3 className="text-2xl font-bold text-slate-800 mb-4">Our Mission</h3>
                                            <p className="text-slate-600 mb-6">
                                                FixMyMix was born from the frustration of spending hours trying to perfect a mix, only to realize
                                                it doesn't translate well across different speakers and headphones. We believe everyone deserves
                                                access to professional-grade audio analysis tools - completely free.
                                            </p>

                                            <h4 className="text-lg font-semibold text-slate-800 mb-3">What Makes Us Different</h4>
                                            <ul className="space-y-2 text-slate-600">
                                                <li className="flex items-start">
                                                    <Star className="w-5 h-5 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                                                    <span>100% free - no hidden costs or premium tiers</span>
                                                </li>
                                                <li className="flex items-start">
                                                    <Star className="w-5 h-5 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                                                    <span>Genre-specific analysis tailored to your music style</span>
                                                </li>
                                                <li className="flex items-start">
                                                    <Star className="w-5 h-5 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                                                    <span>AI-powered mixing that learns from professional engineers</span>
                                                </li>
                                                <li className="flex items-start">
                                                    <Star className="w-5 h-5 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                                                    <span>Privacy-first approach - your audio never leaves your device</span>
                                                </li>
                                            </ul>
                                        </div>

                                        <div className="bg-gradient-to-br from-sky-50 to-blue-50 rounded-2xl p-8">
                                            <div className="text-center">
                                                <div className="w-16 h-16 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <Users className="w-8 h-8 text-sky-600" />
                                                </div>
                                                <h4 className="text-xl font-bold text-slate-800 mb-4">Trusted by Creators</h4>
                                                <div className="grid grid-cols-2 gap-4 text-center">
                                                    <div>
                                                        <div className="text-2xl font-bold text-sky-600">10,000+</div>
                                                        <div className="text-sm text-slate-600">Active Users</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-2xl font-bold text-sky-600">50,000+</div>
                                                        <div className="text-sm text-slate-600">Tracks Analyzed</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-2xl font-bold text-sky-600">25,000+</div>
                                                        <div className="text-sm text-slate-600">AI Mixes Created</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-2xl font-bold text-sky-600">100%</div>
                                                        <div className="text-sm text-slate-600">Free Forever</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Contact Section */}
                        <section id="contact" className="space-y-8">
                            <div className="text-center">
                                <h2 className="text-3xl font-bold text-slate-900 mb-4">Get in Touch</h2>
                                <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                                    Have questions, feedback, or need support? We'd love to hear from you.
                                </p>
                            </div>

                            <div className="bg-gradient-to-r from-slate-900 to-blue-900 rounded-2xl p-8 text-white text-center max-w-2xl mx-auto">
                                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Mail className="w-8 h-8 text-sky-400" />
                                </div>
                                <h3 className="text-2xl font-bold mb-4">Contact & Support</h3>
                                <p className="text-slate-300 mb-6">
                                    Questions about features, technical issues, or feedback?
                                    We're here to help with anything you need.
                                </p>
                                <a
                                    href="mailto:contactfixmymix@gmail.com"
                                    className="inline-flex items-center px-8 py-3 bg-white text-slate-900 rounded-xl hover:bg-slate-100 transition-colors font-semibold shadow-lg"
                                >
                                    <Mail className="w-5 h-5 mr-2" />
                                    contactfixmymix@gmail.com
                                </a>
                            </div>
                        </section>
                    </div>
                ) : (
                    <div className="space-y-8">

                        {/* Back to Landing button */}
                        <div className="flex space-x-4">
                            <button
                                onClick={() => setCurrentFile(null)}
                                className="text-sky-600 hover:text-sky-700 font-medium flex items-center"
                            >
                                ← Back to Landing
                            </button>
                        </div>

                        {/* Track Counter */}
                        <TrackCounter />

                        {/* File Info & Controls */}
                        <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800">
                                        {currentFile.name}
                                    </h2>
                                    <p className="text-slate-500 mt-1">
                                        {(currentFile.size / 1024 / 1024).toFixed(2)} MB • Ready for analysis
                                    </p>
                                </div>

                                <div className="flex space-x-3">
                                    <button
                                        onClick={handlePlay}
                                        className="flex items-center px-6 py-3 bg-gradient-to-r from-sky-500 to-blue-600 text-white rounded-xl hover:from-sky-600 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                                    >
                                        {isPlaying ? (
                                            <>
                                                <Pause className="w-5 h-5 mr-2" />
                                                Pause
                                            </>
                                        ) : (
                                            <>
                                                <Play className="w-5 h-5 mr-2" />
                                                Play
                                            </>
                                        )}
                                    </button>

                                    <button
                                        onClick={handleStop}
                                        className="flex items-center px-6 py-3 bg-slate-600 text-white rounded-xl hover:bg-slate-700 transition-colors"
                                    >
                                        <Square className="w-4 h-4 mr-2" />
                                        Stop
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Visualizers */}
                        <SpectrumAnalyzer audioProcessor={audioProcessor} isPlaying={isPlaying} />

                        {/* Real-Time Insights Panel */}
                        <InsightsPanel audioProcessor={audioProcessor} isPlaying={isPlaying} />

                        {/* Upload Another */}
                        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-slate-200">
                            <h3 className="text-lg font-semibold text-slate-800 mb-6">
                                Analyze Another Track
                            </h3>
                            <AudioUpload onFileSelect={handleFileSelect} isLoading={isLoading} />
                        </div>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="bg-slate-900 text-white py-12">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center">
                        <p className="text-slate-400">
                            © 2025 FixMyMix. All rights reserved. • 100% Free Forever
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default App;