import React, { useState, useCallback, useRef } from 'react';
import { Upload, Music, Mic2, Loader2, CheckCircle, AlertCircle, Sparkles, Download, Play, Pause, Zap } from 'lucide-react';
import { WebAudioMixer } from '../../utils/WebAudioMixer';

const FixMyMixAI = ({ user, onUpgradeClick, audioContext, onMixComplete, isTrialUser = false }) => {
    const [beatFile, setBeatFile] = useState(null);
    const [vocalsFile, setVocalsFile] = useState(null);
    const [genre, setGenre] = useState('general');
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingMode, setProcessingMode] = useState('client'); // 'client' or 'server'
    const [jobId, setJobId] = useState(null);
    const [jobStatus, setJobStatus] = useState(null);
    const [resultUrl, setResultUrl] = useState(null);
    const [resultBlob, setResultBlob] = useState(null);
    const [error, setError] = useState('');
    const [isPlaying, setIsPlaying] = useState(false);
    const [audio, setAudio] = useState(null);
    const [progress, setProgress] = useState(0);
    const [localAudioContext, setLocalAudioContext] = useState(null);
    const [hasCompletedFirstMix, setHasCompletedFirstMix] = useState(false);

    const genres = [
        { value: 'general', label: 'Auto-detect Best Settings' },
        { value: 'hiphop', label: 'Hip-Hop / Trap' },
        { value: 'pop', label: 'Pop / Commercial' },
        { value: 'rock', label: 'Rock / Alternative' },
        { value: 'electronic', label: 'Electronic / EDM' },
        { value: 'rnb', label: 'R&B / Soul' }
    ];

    // Initialize audio context when needed
    const initializeAudioContext = useCallback(() => {
        // Use passed audioContext first, then create local one if needed
        if (audioContext) {
            return audioContext;
        }

        if (!localAudioContext) {
            try {
                const context = new (window.AudioContext || window.webkitAudioContext)();
                setLocalAudioContext(context);
                return context;
            } catch (error) {
                console.error('Web Audio API not supported:', error);
                setError('Web Audio API not supported in your browser');
                return null;
            }
        }
        return localAudioContext;
    }, [audioContext, localAudioContext]);

    const handleFileSelect = useCallback((file, type) => {
        const validTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/m4a'];
        if (!validTypes.includes(file.type)) {
            setError('Please upload a valid audio file (MP3, WAV, M4A)');
            return;
        }

        if (file.size > 50 * 1024 * 1024) {
            setError('File size must be less than 50MB');
            return;
        }

        setError('');
        if (type === 'beat') {
            setBeatFile(file);
        } else {
            setVocalsFile(file);
        }
    }, []);

    // Client-side mixing using Web Audio API
    const processClientSide = async (context) => {
        setProgress(10);
        const mixer = new WebAudioMixer(context);
        try {
            setProgress(30);
            const mixedBlob = await mixer.mixAudioFiles(beatFile, vocalsFile, genre);
            setProgress(90);
            const url = URL.createObjectURL(mixedBlob);
            setResultUrl(url);
            setResultBlob(mixedBlob);
            setProgress(100);
            // Just mark completion locally, but don't trigger trial end yet
            if (isTrialUser && !hasCompletedFirstMix) {
                setHasCompletedFirstMix(true);
            }
        } catch (err) {
            console.error('Mixing error:', err);
            setError('Failed to mix audio. Please try again.');
        }
    };

    const handleSubmit = async () => {
        if (!beatFile || !vocalsFile) {
            setError('Please upload both beat and vocals');
            return;
        }

        setIsProcessing(true);
        setError('');
        setProgress(0);

        // Initialize audio context here when user clicks
        const context = initializeAudioContext();
        if (!context) {
            setIsProcessing(false);
            return;
        }
        await processClientSide(context);

        setIsProcessing(false);
    };

    const handlePlayPause = () => {
        if (!audio) {
            const newAudio = new Audio(resultUrl);
            newAudio.addEventListener('ended', () => setIsPlaying(false));
            setAudio(newAudio);
            newAudio.play();
            setIsPlaying(true);
        } else {
            if (isPlaying) {
                audio.pause();
            } else {
                audio.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = resultUrl;
        link.download = `FixMyMix_${genre}_${Date.now()}.wav`;
        link.click();
    };

    const handleReset = () => {
        // For trial users who have completed their first mix
        if (isTrialUser && hasCompletedFirstMix) {
            // Now mark the trial as used and trigger the parent callback
            if (onMixComplete) {
                onMixComplete();
            }
            return;
        }

        // For logged in users, allow normal reset
        setBeatFile(null);
        setVocalsFile(null);
        setJobId(null);
        setJobStatus(null);
        setResultUrl(null);
        setResultBlob(null);
        setError('');
        setProgress(0);
        if (audio) {
            audio.pause();
            setAudio(null);
            setIsPlaying(false);
        }
    };

    // Show results if completed
    if (resultUrl) {
        return (
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
                <div className="text-center">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">Your Mix is Ready!</h3>
                    <p className="text-slate-600 mb-6">
                        AI-powered mixing with {genres.find(g => g.value === genre)?.label} settings applied
                    </p>

                    <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                        🎵 Mixed using advanced Web Audio processing (WAV format)
                    </div>

                    <div className="flex justify-center space-x-4 mb-6">
                        <button
                            onClick={handlePlayPause}
                            className="flex items-center px-6 py-3 bg-sky-500 text-white rounded-xl hover:bg-sky-600 transition-colors"
                        >
                            {isPlaying ? <Pause className="w-5 h-5 mr-2" /> : <Play className="w-5 h-5 mr-2" />}
                            {isPlaying ? 'Pause' : 'Play'}
                        </button>
                        <button
                            onClick={handleDownload}
                            className="flex items-center px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors"
                        >
                            <Download className="w-5 h-5 mr-2" />
                            Download
                        </button>
                    </div>

                    {/* For trial users who completed their first mix */}
                    {isTrialUser && hasCompletedFirstMix ? (
                        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                            <p className="text-purple-800 font-medium mb-3">
                                🎉 Trial Complete! Sign up for free to mix unlimited tracks.
                            </p>
                            <button
                                onClick={onUpgradeClick}
                                className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all font-semibold"
                            >
                                Sign Up Free for Unlimited Mixing
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={handleReset}
                            className="text-sky-600 hover:text-sky-700 font-medium"
                        >
                            Mix Another Track →
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // Show processing status
    if (isProcessing) {
        return (
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
                <div className="text-center">
                    <div className="relative w-24 h-24 mx-auto mb-6">
                        <Loader2 className="w-24 h-24 text-sky-500 animate-spin" />
                        <Sparkles className="w-12 h-12 text-purple-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-2">AI is Mixing Your Track</h3>
                    <p className="text-slate-600 mb-4">
                        Processing locally in your browser...
                    </p>

                    {/* Progress bar */}
                    <div className="w-full max-w-md mx-auto mb-6">
                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-sky-400 to-purple-500 transition-all duration-500"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <p className="text-sm text-slate-500 mt-2">{progress}% complete</p>
                    </div>

                    <div className="max-w-md mx-auto">
                        <div className="space-y-3 text-left">
                            <div className={`flex items-center space-x-3 ${progress > 20 ? 'text-sky-600' : 'text-slate-400'}`}>
                                <CheckCircle className="w-5 h-5" />
                                <span>Analyzing frequency content</span>
                            </div>
                            <div className={`flex items-center space-x-3 ${progress > 40 ? 'text-sky-600' : 'text-slate-400'}`}>
                                <CheckCircle className="w-5 h-5" />
                                <span>Applying genre-specific EQ</span>
                            </div>
                            <div className={`flex items-center space-x-3 ${progress > 60 ? 'text-sky-600' : 'text-slate-400'}`}>
                                <CheckCircle className="w-5 h-5" />
                                <span>Optimizing dynamics & compression</span>
                            </div>
                            <div className={`flex items-center space-x-3 ${progress > 80 ? 'text-sky-600' : 'text-slate-400'}`}>
                                <CheckCircle className="w-5 h-5" />
                                <span>Finalizing spatial mix</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Main upload interface
    return (
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-2xl font-bold text-slate-800 flex items-center">
                        <Sparkles className="w-8 h-8 mr-2 text-purple-500" />
                        FixMyMix AI
                    </h3>
                    <p className="text-slate-600 mt-1">Upload your beat and vocals for automatic professional mixing</p>
                </div>
                {isTrialUser && (
                    <span className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-semibold rounded-full">
                        FREE TRIAL
                    </span>
                )}
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center">
                    <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}

            <div className="grid md:grid-cols-2 gap-6 mb-6">
                {/* Beat Upload */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Upload Beat / Instrumental
                    </label>
                    <div
                        className={`
                            relative border-2 border-dashed rounded-xl p-8 text-center
                            transition-all duration-300 cursor-pointer
                            ${beatFile
                            ? 'border-green-400 bg-green-50'
                            : 'border-slate-300 hover:border-sky-300 bg-slate-50'
                        }
                        `}
                    >
                        <input
                            type="file"
                            accept="audio/mpeg,audio/wav,audio/mp3,audio/m4a,audio/x-m4a,audio/mp4,.mp3,.wav,.m4a,.aac"
                            onChange={(e) => handleFileSelect(e.target.files[0], 'beat')}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <Music className={`w-12 h-12 mx-auto mb-3 ${beatFile ? 'text-green-600' : 'text-slate-400'}`} />
                        <p className="text-sm font-medium text-slate-700">
                            {beatFile ? beatFile.name : 'Drop beat here or click to browse'}
                        </p>
                        {beatFile && (
                            <p className="text-xs text-slate-500 mt-1">
                                {(beatFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                        )}
                    </div>
                </div>

                {/* Vocals Upload */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Upload Vocals
                    </label>
                    <div
                        className={`
                            relative border-2 border-dashed rounded-xl p-8 text-center
                            transition-all duration-300 cursor-pointer
                            ${vocalsFile
                            ? 'border-green-400 bg-green-50'
                            : 'border-slate-300 hover:border-sky-300 bg-slate-50'
                        }
                        `}
                    >
                        <input
                            type="file"
                            accept="audio/mpeg,audio/wav,audio/mp3,audio/m4a,audio/x-m4a,audio/mp4,.mp3,.wav,.m4a,.aac"
                            onChange={(e) => handleFileSelect(e.target.files[0], 'vocals')}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <Mic2 className={`w-12 h-12 mx-auto mb-3 ${vocalsFile ? 'text-green-600' : 'text-slate-400'}`} />
                        <p className="text-sm font-medium text-slate-700">
                            {vocalsFile ? vocalsFile.name : 'Drop vocals here or click to browse'}
                        </p>
                        {vocalsFile && (
                            <p className="text-xs text-slate-500 mt-1">
                                {(vocalsFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Genre Selection */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                    Select Genre for Optimized Mixing
                </label>
                <select
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 focus:outline-none focus:border-sky-400 transition-colors"
                >
                    {genres.map(g => (
                        <option key={g.value} value={g.value}>{g.label}</option>
                    ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">
                    Each genre applies specific EQ curves, compression settings, and spatial processing
                </p>
            </div>

            {/* Submit Button */}
            <button
                onClick={handleSubmit}
                disabled={!beatFile || !vocalsFile || isProcessing}
                className={`
                    w-full py-3 px-6 rounded-xl font-semibold transition-all duration-300
                    ${beatFile && vocalsFile
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-lg'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }
                `}
            >
                Start AI Mixing
            </button>

            <p className="text-xs text-slate-500 text-center mt-4">
                Instant processing • No upload required • WAV output
            </p>
        </div>
    );
};

export default FixMyMixAI;
