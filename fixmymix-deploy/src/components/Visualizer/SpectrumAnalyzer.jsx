import React, { useEffect, useRef } from 'react';
import { Activity } from 'lucide-react';

const SpectrumAnalyzer = ({ audioProcessor, isPlaying }) => {
    const canvasRef = useRef(null);
    const animationRef = useRef(null);

    useEffect(() => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // Set canvas resolution
        const dpr = window.devicePixelRatio || 1;
        canvas.width = 800 * dpr;
        canvas.height = 256 * dpr;
        ctx.scale(dpr, dpr);
        canvas.style.width = '800px';
        canvas.style.height = '256px';

        const draw = () => {
            if (!isPlaying || !audioProcessor || !audioProcessor.analyser) {
                // Clear canvas when not playing
                ctx.fillStyle = 'rgb(241, 245, 249)'; // slate-100
                ctx.fillRect(0, 0, 800, 256);
                return;
            }

            const frequencyData = audioProcessor.getFrequencyData();

            // Clear canvas with semi-transparent fill for motion blur effect
            ctx.fillStyle = 'rgba(241, 245, 249, 0.5)';
            ctx.fillRect(0, 0, 800, 256);

            // Draw frequency bars
            const barCount = 64; // Number of bars to display
            const barWidth = 800 / barCount;
            const barSpacing = 2;

            for (let i = 0; i < barCount; i++) {
                // Map frequency data to bar count
                const dataIndex = Math.floor((i * frequencyData.length) / barCount);
                const value = frequencyData[dataIndex];
                const barHeight = (value / 255) * 200; // Max height 200px

                // Create gradient for bars
                const gradient = ctx.createLinearGradient(0, 256 - barHeight, 0, 256);
                gradient.addColorStop(0, 'rgb(125, 211, 252)'); // sky-300
                gradient.addColorStop(0.5, 'rgb(56, 189, 248)'); // sky-400
                gradient.addColorStop(1, 'rgb(14, 165, 233)'); // sky-500

                ctx.fillStyle = gradient;
                ctx.fillRect(
                    i * barWidth + barSpacing / 2,
                    256 - barHeight,
                    barWidth - barSpacing,
                    barHeight
                );

                // Add glow effect for high values
                if (value > 200) {
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = 'rgb(56, 189, 248)';
                    ctx.fillRect(
                        i * barWidth + barSpacing / 2,
                        256 - barHeight,
                        barWidth - barSpacing,
                        barHeight
                    );
                    ctx.shadowBlur = 0;
                }
            }

            animationRef.current = requestAnimationFrame(draw);
        };

        // Start animation
        if (isPlaying && audioProcessor) {
            draw();
        }

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [audioProcessor, isPlaying]);

    // Placeholder visualization when not playing
    const PlaceholderVisualization = () => (
        <div className="h-64 bg-gradient-to-b from-slate-50 to-slate-100 rounded-xl flex items-end justify-center p-4">
            <div className="flex items-end space-x-1 w-full max-w-2xl">
                {Array.from({ length: 32 }).map((_, i) => (
                    <div
                        key={i}
                        className="flex-1 bg-gradient-to-t from-sky-500/30 to-sky-300/30 rounded-t transition-all duration-300"
                        style={{
                            height: `${20 + Math.sin(i * 0.5) * 30}%`
                        }}
                    />
                ))}
            </div>
        </div>
    );

    return (
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-800">Frequency Spectrum Analysis</h3>
                <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                    <span className="text-sm text-slate-600">
                        {isPlaying ? 'Live Analysis' : 'Ready'}
                    </span>
                </div>
            </div>

            <div className="relative">
                <canvas
                    ref={canvasRef}
                    className="w-full h-64 rounded-xl bg-slate-100"
                    style={{ display: isPlaying ? 'block' : 'none' }}
                />
                {!isPlaying && <PlaceholderVisualization />}
            </div>

            <div className="mt-4 grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Bass</p>
                    <p className="font-semibold text-slate-800">20-250 Hz</p>
                    <div className="mt-1 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Mids</p>
                    <p className="font-semibold text-slate-800">250-4k Hz</p>
                    <div className="mt-1 h-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full" />
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Highs</p>
                    <p className="font-semibold text-slate-800">4k-20k Hz</p>
                    <div className="mt-1 h-1 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full" />
                </div>
            </div>
        </div>
    );
};

export default SpectrumAnalyzer;