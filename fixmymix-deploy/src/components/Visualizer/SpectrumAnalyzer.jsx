import React, { useEffect, useRef } from 'react';
import { Activity } from 'lucide-react';

const SpectrumAnalyzer = ({ audioProcessor, isPlaying }) => {
    const canvasRef = useRef(null);
    const animationRef = useRef(null);
    const containerRef = useRef(null);

    useEffect(() => {
        if (!canvasRef.current || !containerRef.current) return;

        const canvas = canvasRef.current;
        const container = containerRef.current;
        const ctx = canvas.getContext('2d');
        
        // Get container width for responsive sizing
        const containerWidth = container.offsetWidth - 32; // Account for padding
        const canvasHeight = 256;

        // Set canvas resolution based on container width
        const dpr = window.devicePixelRatio || 1;
        canvas.width = containerWidth * dpr;
        canvas.height = canvasHeight * dpr;
        ctx.scale(dpr, dpr);
        canvas.style.width = containerWidth + 'px';
        canvas.style.height = canvasHeight + 'px';

        const draw = () => {
            if (!isPlaying || !audioProcessor || !audioProcessor.analyser) {
                // Clear canvas when not playing
                ctx.fillStyle = 'rgb(241, 245, 249)'; // slate-100
                ctx.fillRect(0, 0, containerWidth, canvasHeight);
                return;
            }

            const frequencyData = audioProcessor.getFrequencyData();

            // Clear canvas with semi-transparent fill for motion blur effect
            ctx.fillStyle = 'rgba(241, 245, 249, 0.5)';
            ctx.fillRect(0, 0, containerWidth, canvasHeight);

            // Draw frequency bars - responsive bar count based on width
            const barCount = Math.min(64, Math.floor(containerWidth / 8)); // Minimum 8px per bar
            const barWidth = containerWidth / barCount;
            const barSpacing = Math.max(1, barWidth * 0.1); // 10% spacing, minimum 1px

            for (let i = 0; i < barCount; i++) {
                // Map frequency data to bar count
                const dataIndex = Math.floor((i * frequencyData.length) / barCount);
                const value = frequencyData[dataIndex];
                const barHeight = (value / 255) * (canvasHeight * 0.8); // Max height 80% of canvas

                // Create gradient for bars
                const gradient = ctx.createLinearGradient(0, canvasHeight - barHeight, 0, canvasHeight);
                gradient.addColorStop(0, 'rgb(125, 211, 252)'); // sky-300
                gradient.addColorStop(0.5, 'rgb(56, 189, 248)'); // sky-400
                gradient.addColorStop(1, 'rgb(14, 165, 233)'); // sky-500

                ctx.fillStyle = gradient;
                ctx.fillRect(
                    i * barWidth + barSpacing / 2,
                    canvasHeight - barHeight,
                    barWidth - barSpacing,
                    barHeight
                );

                // Add glow effect for high values
                if (value > 200) {
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = 'rgb(56, 189, 248)';
                    ctx.fillRect(
                        i * barWidth + barSpacing / 2,
                        canvasHeight - barHeight,
                        barWidth - barSpacing,
                        barHeight
                    );
                    ctx.shadowBlur = 0;
                }
            }

            animationRef.current = requestAnimationFrame(draw);
        };

        // Handle resize
        const handleResize = () => {
            const newWidth = container.offsetWidth - 32;
            canvas.width = newWidth * dpr;
            canvas.style.width = newWidth + 'px';
            ctx.scale(dpr, dpr);
        };

        window.addEventListener('resize', handleResize);

        // Start animation
        if (isPlaying && audioProcessor) {
            draw();
        }

        return () => {
            window.removeEventListener('resize', handleResize);
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [audioProcessor, isPlaying]);

    // Placeholder visualization when not playing
    const PlaceholderVisualization = () => (
        <div className="h-64 bg-gradient-to-b from-slate-50 to-slate-100 rounded-xl flex items-end justify-center p-4 overflow-hidden">
            <div className="flex items-end space-x-1 w-full max-w-full">
                {Array.from({ length: Math.min(32, Math.floor(window.innerWidth / 20)) }).map((_, i) => (
                    <div
                        key={i}
                        className="flex-1 bg-gradient-to-t from-sky-500/30 to-sky-300/30 rounded-t transition-all duration-300 min-w-0"
                        style={{
                            height: `${20 + Math.sin(i * 0.5) * 30}%`
                        }}
                    />
                ))}
            </div>
        </div>
    );

    return (
        <div ref={containerRef} className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 border border-slate-200 w-full overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 space-y-2 sm:space-y-0">
                <h3 className="text-lg lg:text-xl font-semibold text-slate-800">Frequency Spectrum Analysis</h3>
                <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                    <span className="text-sm text-slate-600">
                        {isPlaying ? 'Live Analysis' : 'Ready'}
                    </span>
                </div>
            </div>

            <div className="relative overflow-hidden">
                <canvas
                    ref={canvasRef}
                    className="w-full h-64 rounded-xl bg-slate-100 max-w-full"
                    style={{ display: isPlaying ? 'block' : 'none' }}
                />
                {!isPlaying && <PlaceholderVisualization />}
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
                <div className="text-center p-2 sm:p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Bass</p>
                    <p className="text-sm sm:text-base font-semibold text-slate-800">20-250 Hz</p>
                    <div className="mt-1 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" />
                </div>
                <div className="text-center p-2 sm:p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Mids</p>
                    <p className="text-sm sm:text-base font-semibold text-slate-800">250-4k Hz</p>
                    <div className="mt-1 h-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full" />
                </div>
                <div className="text-center p-2 sm:p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Highs</p>
                    <p className="text-sm sm:text-base font-semibold text-slate-800">4k-20k Hz</p>
                    <div className="mt-1 h-1 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full" />
                </div>
            </div>
        </div>
    );
};

export default SpectrumAnalyzer;
