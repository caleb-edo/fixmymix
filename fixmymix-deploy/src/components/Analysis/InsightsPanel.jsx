import React, { useEffect, useState } from 'react';
import { Lightbulb, AlertTriangle, CheckCircle, Info, TrendingUp, Volume2, Music } from 'lucide-react';
import { MixingAnalyzer } from '../../utils/MixingAnalyzer';

const InsightsPanel = ({ audioProcessor, isPlaying }) => {
    const [insights, setInsights] = useState([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [selectedGenre, setSelectedGenre] = useState('general');
    const mixingAnalyzer = useState(() => new MixingAnalyzer())[0];

    const genres = [
        { value: 'general', label: 'General / Auto-detect' },
        { value: 'hiphop', label: 'Hip-Hop / Trap' },
        { value: 'pop', label: 'Pop' },
        { value: 'rock', label: 'Rock / Alternative' },
        { value: 'electronic', label: 'Electronic / EDM' },
        { value: 'jazz', label: 'Jazz / Classical' }
    ];

    useEffect(() => {
        mixingAnalyzer.setGenre(selectedGenre);
    }, [selectedGenre, mixingAnalyzer]);

    useEffect(() => {
        if (!audioProcessor || !isPlaying) return;

        const analyzeInterval = setInterval(() => {
            setIsAnalyzing(true);

            // Get frequency and waveform data
            const frequencyData = audioProcessor.getFrequencyData();
            const waveformData = audioProcessor.getWaveformData();

            // Generate insights
            const newInsights = mixingAnalyzer.generateInsights(
                frequencyData,
                waveformData,
                audioProcessor.audioContext.sampleRate
            );

            setInsights(newInsights);
            setIsAnalyzing(false);
        }, 2000); // Analyze every 2 seconds

        return () => clearInterval(analyzeInterval);
    }, [audioProcessor, isPlaying, mixingAnalyzer]);

    const getIcon = (type) => {
        switch (type) {
            case 'warning':
                return <AlertTriangle className="w-5 h-5 text-amber-500" />;
            case 'info':
                return <Info className="w-5 h-5 text-blue-500" />;
            case 'success':
                return <CheckCircle className="w-5 h-5 text-green-500" />;
            default:
                return <Lightbulb className="w-5 h-5 text-sky-500" />;
        }
    };

    const getCategoryIcon = (category) => {
        switch (category) {
            case 'Bass':
                return <Volume2 className="w-4 h-4" />;
            case 'Dynamics':
                return <TrendingUp className="w-4 h-4" />;
            default:
                return null;
        }
    };

    const getInsightStyles = (type) => {
        switch (type) {
            case 'warning':
                return {
                    border: 'border-amber-200',
                    bg: 'bg-amber-50',
                    titleColor: 'text-amber-900',
                    textColor: 'text-amber-700'
                };
            case 'info':
                return {
                    border: 'border-blue-200',
                    bg: 'bg-blue-50',
                    titleColor: 'text-blue-900',
                    textColor: 'text-blue-700'
                };
            case 'success':
                return {
                    border: 'border-green-200',
                    bg: 'bg-green-50',
                    titleColor: 'text-green-900',
                    textColor: 'text-green-700'
                };
            default:
                return {
                    border: 'border-slate-200',
                    bg: 'bg-slate-50',
                    titleColor: 'text-slate-900',
                    textColor: 'text-slate-700'
                };
        }
    };

    if (!isPlaying) {
        return (
            <div className="bg-gradient-to-br from-slate-900 to-blue-900 rounded-2xl p-6 sm:p-8 text-white">
                <h3 className="text-lg sm:text-xl font-semibold mb-4 flex items-center">
                    <Lightbulb className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
                    Mixing Insights
                </h3>

                {/* Genre Selector */}
                <div className="mb-4">
                    <label className="text-sm text-white/70 mb-2 block">Select Genre for Tailored Analysis:</label>
                    <select
                        value={selectedGenre}
                        onChange={(e) => setSelectedGenre(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-sky-400 transition-colors text-sm sm:text-base"
                    >
                        {genres.map(genre => (
                            <option key={genre.value} value={genre.value} className="bg-slate-800">
                                {genre.label}
                            </option>
                        ))}
                    </select>
                </div>

                <p className="text-white/70 text-sm sm:text-base">
                    Play your track to get real-time mixing analysis and suggestions tailored to your genre
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 border border-slate-200 overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 space-y-2 sm:space-y-0">
                <h3 className="text-lg sm:text-xl font-semibold text-slate-800 flex items-center">
                    <Lightbulb className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-sky-500" />
                    Real-Time Mixing Insights
                </h3>
                {isAnalyzing && (
                    <div className="flex items-center space-x-2 text-sm text-slate-500">
                        <div className="w-2 h-2 bg-sky-500 rounded-full animate-pulse" />
                        <span>Analyzing...</span>
                    </div>
                )}
            </div>

            {/* Genre Selector - Active State */}
            <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
                    <div className="flex items-center space-x-2">
                        <Music className="w-4 h-4 text-slate-600" />
                        <span className="text-sm font-medium text-slate-700">Genre Mode:</span>
                    </div>
                    <select
                        value={selectedGenre}
                        onChange={(e) => setSelectedGenre(e.target.value)}
                        className="px-3 py-1 text-sm rounded-md bg-white border border-slate-300 text-slate-700 focus:outline-none focus:border-sky-400 transition-colors w-full sm:w-auto"
                    >
                        {genres.map(genre => (
                            <option key={genre.value} value={genre.value}>
                                {genre.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Severity Legend */}
            <div className="mb-6 p-4 bg-slate-50 rounded-lg">
                <p className="text-xs font-medium text-slate-600 mb-2">INSIGHT SEVERITY LEVELS:</p>
                <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 text-xs">
                    <div className="flex items-center space-x-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                        <span className="text-slate-600"><span className="font-medium">Warning:</span> Issues affecting mix quality</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        <span className="text-slate-600"><span className="font-medium">Info:</span> Suggestions for improvement</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="text-slate-600"><span className="font-medium">Success:</span> Mix sounds good!</span>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {insights.length === 0 ? (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                            <Lightbulb className="w-8 h-8 text-slate-400" />
                        </div>
                        <p className="text-slate-500">Analyzing your mix...</p>
                    </div>
                ) : (
                    insights.slice(0, 3).map((insight, index) => {
                        const styles = getInsightStyles(insight.type);
                        return (
                            <div
                                key={index}
                                className={`${styles.bg} ${styles.border} border rounded-xl p-4 sm:p-6 transition-all duration-300 hover:shadow-md overflow-hidden`}
                            >
                                <div className="flex items-start space-x-3">
                                    <div className="flex-shrink-0 mt-0.5">
                                        {getIcon(insight.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 mb-2">
                                            <h4 className={`font-semibold ${styles.titleColor} text-sm sm:text-base`}>
                                                {insight.title}
                                            </h4>
                                            {getCategoryIcon(insight.category) && (
                                                <span className={`text-xs px-2 py-1 rounded-full ${styles.bg} ${styles.textColor} flex items-center space-x-1 w-fit`}>
                                                    {getCategoryIcon(insight.category)}
                                                    <span>{insight.category}</span>
                                                </span>
                                            )}
                                        </div>
                                        <p className={`text-sm ${styles.textColor} mb-3 leading-relaxed`}>
                                            {insight.description}
                                        </p>
                                        <div className={`text-sm ${styles.titleColor} font-medium`}>
                                            💡 Try this: <span className={`${styles.textColor} font-normal`}>{insight.solution}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {insights.length > 3 && (
                <div className="mt-4 text-center">
                    <button className="text-sm text-sky-600 hover:text-sky-700 font-medium">
                        View {insights.length - 3} more insights →
                    </button>
                </div>
            )}
        </div>
    );
};

export default InsightsPanel;
