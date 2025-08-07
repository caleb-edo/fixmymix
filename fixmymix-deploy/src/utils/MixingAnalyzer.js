export class MixingAnalyzer {
    constructor() {
        this.insights = [];
        this.genre = 'general'; // Default genre

        this.frequencyRanges = {
            subBass: { min: 20, max: 60, name: 'Sub Bass' },
            bass: { min: 60, max: 250, name: 'Bass' },
            lowMids: { min: 250, max: 500, name: 'Low Mids' },
            mids: { min: 500, max: 2000, name: 'Mids' },
            upperMids: { min: 2000, max: 4000, name: 'Upper Mids' },
            presence: { min: 4000, max: 6000, name: 'Presence' },
            brilliance: { min: 6000, max: 20000, name: 'Brilliance' }
        };

        // Balanced thresholds - realistic but still catches real issues
        this.genreProfiles = {
            general: {
                bass: { low: 70, optimal: 140, high: 210 }, // Still catch weak bass
                lowMids: { low: 70, optimal: 130, high: 190 }, // Flag real muddiness
                upperMids: { low: 90, optimal: 150, high: 200 }, // Catch harshness
                presence: { low: 80, optimal: 130, high: 190 },
                brilliance: { low: 60, optimal: 110, high: 170 },
                crestFactor: { overCompressed: 2.5, optimal: 7, veryDynamic: 18 } // More forgiving
            },
            hiphop: {
                bass: { low: 90, optimal: 200, high: 240 }, // Still allow bass-heavy but catch extremes
                lowMids: { low: 90, optimal: 180, high: 230 }, // Flag when really muddy
                upperMids: { low: 110, optimal: 170, high: 210 }, // Vocals need presence
                presence: { low: 100, optimal: 150, high: 200 },
                brilliance: { low: 80, optimal: 130, high: 180 },
                crestFactor: { overCompressed: 2, optimal: 5.5, veryDynamic: 12 } // Very forgiving for heavy genre
            },
            rock: {
                bass: { low: 80, optimal: 150, high: 200 },
                lowMids: { low: 80, optimal: 150, high: 190 },
                upperMids: { low: 100, optimal: 160, high: 210 }, // Guitars need space
                presence: { low: 90, optimal: 140, high: 200 },
                brilliance: { low: 70, optimal: 120, high: 170 },
                crestFactor: { overCompressed: 3, optimal: 8, veryDynamic: 18 } // More forgiving
            },
            electronic: {
                bass: { low: 80, optimal: 180, high: 230 }, // EDM needs bass but flag extremes
                lowMids: { low: 60, optimal: 120, high: 180 }, // Usually cleaner low-mids
                upperMids: { low: 80, optimal: 140, high: 190 },
                presence: { low: 90, optimal: 150, high: 210 },
                brilliance: { low: 80, optimal: 140, high: 190 }, // Often bright
                crestFactor: { overCompressed: 2, optimal: 6, veryDynamic: 14 } // Very forgiving for EDM
            },
            jazz: {
                bass: { low: 60, optimal: 120, high: 170 }, // Natural bass levels
                lowMids: { low: 60, optimal: 120, high: 160 },
                upperMids: { low: 70, optimal: 130, high: 180 },
                presence: { low: 70, optimal: 120, high: 180 },
                brilliance: { low: 60, optimal: 110, high: 160 },
                crestFactor: { overCompressed: 5, optimal: 12, veryDynamic: 22 } // Slightly more forgiving
            },
            pop: {
                bass: { low: 75, optimal: 150, high: 220 }, // More forgiving for commercial pop
                lowMids: { low: 70, optimal: 140, high: 210 }, // Increase tolerance for pop's fuller sound
                upperMids: { low: 90, optimal: 160, high: 220 }, // Pop vocals can be forward
                presence: { low: 90, optimal: 150, high: 210 },
                brilliance: { low: 75, optimal: 130, high: 190 },
                crestFactor: { overCompressed: 2.5, optimal: 6.5, veryDynamic: 15 } // More forgiving for commercial pop
            }
        };
    }

    setGenre(genre) {
        this.genre = genre;
    }

    analyzeFrequencyBalance(frequencyData, sampleRate) {
        const insights = [];
        const nyquist = sampleRate / 2;
        const binCount = frequencyData.length;
        const binSize = nyquist / binCount;
        const profile = this.genreProfiles[this.genre] || this.genreProfiles.general;

        // Calculate average energy in each frequency range
        const rangeEnergies = {};

        Object.entries(this.frequencyRanges).forEach(([key, range]) => {
            const startBin = Math.floor(range.min / binSize);
            const endBin = Math.floor(range.max / binSize);

            let totalEnergy = 0;
            let binCount = 0;

            for (let i = startBin; i <= endBin && i < frequencyData.length; i++) {
                totalEnergy += frequencyData[i];
                binCount++;
            }

            rangeEnergies[key] = binCount > 0 ? totalEnergy / binCount : 0;
        });

        // Genre-specific analysis
        const genreContext = {
            hiphop: "in hip-hop",
            rock: "in rock music",
            electronic: "in electronic music",
            jazz: "in jazz",
            pop: "in pop music",
            general: "generally"
        };

        // MUDDY LOW END - Better balance between realistic and useful
        const bassOverage = rangeEnergies.bass > profile.bass.high;
        const lowMidOverage = rangeEnergies.lowMids > profile.lowMids.high;

        // For pop genre, be more selective about muddy low-end detection
        const isPopGenre = this.genre === 'pop';
        const muddyThreshold = isPopGenre ? 1.15 : 1.1; // More forgiving for pop
        const severeOverage = rangeEnergies.bass > (profile.bass.high * muddyThreshold) && rangeEnergies.lowMids > (profile.lowMids.high * muddyThreshold);

        if (severeOverage || (!isPopGenre && bassOverage && lowMidOverage)) {
            insights.push({
                type: 'warning',
                category: 'Bass',
                title: 'Muddy Low End Detected',
                description: `Your low end is getting muddy with buildup in both bass and low-mid frequencies. While ${genreContext[this.genre]} can handle some weight, this is affecting clarity.`,
                solution: this.genre === 'hiphop'
                    ? 'Try a gentle 1-2dB cut around 200-250Hz. Keep the sub-bass (30-60Hz) strong but clean up the low-mids. Consider high-passing melodic elements at 100Hz.'
                    : this.genre === 'pop'
                        ? 'Try a subtle 1-2dB cut around 150-200Hz. Modern pop can be full-sounding, but this might be a bit much. Consider gentle high-passing on non-bass elements.'
                        : 'Cut around 200-300Hz by 2-3dB with a wide Q. High-pass filter non-bass instruments at 80-120Hz to create more space.'
            });
        }

        // EXCESSIVE BASS - New check for clearly peaking bass
        if (rangeEnergies.bass > (profile.bass.high * 1.3)) {
            insights.push({
                type: 'warning',
                category: 'Bass',
                title: 'Excessive Bass Energy',
                description: `Your bass is hitting extremely hard and might be distorting or overpowering other elements. This level of bass energy can cause problems on most playback systems.`,
                solution: this.genre === 'hiphop'
                    ? 'Pull back the bass/808 level by 2-4dB. Check for distortion and consider using a limiter on the bass bus. Make sure it\'s not clipping.'
                    : 'Reduce bass levels by 3-5dB. Check your low-end instruments for clipping or distortion. Consider using a multiband compressor.'
            });
        }

        // HARSH UPPER MIDS - Catch obvious problems
        if (rangeEnergies.upperMids > (profile.upperMids.high * 1.1)) {
            const isVocalGenre = ['hiphop', 'pop'].includes(this.genre);
            insights.push({
                type: 'warning',
                category: 'Mids',
                title: 'Harsh Upper Mids',
                description: `The 2-4kHz range is quite hot and potentially harsh. ${isVocalGenre ? "This might be from pushed vocals, but it's getting aggressive." : "This harshness might cause listening fatigue."}`,
                solution: isVocalGenre
                    ? 'Try a 1-2dB cut around 2.5-3kHz. Consider using a dynamic EQ so it only cuts when needed.'
                    : 'Cut around 2.5-3.5kHz by 2-3dB. Use a moderate Q (around 1.5) for smooth results.'
            });
        }

        // WEAK BASS - Still catch obviously weak bass
        if (rangeEnergies.bass < profile.bass.low) {
            const bassNeededGenres = ['hiphop', 'electronic', 'pop'];
            const needsMoreBass = bassNeededGenres.includes(this.genre);

            insights.push({
                type: needsMoreBass ? 'warning' : 'info',
                category: 'Bass',
                title: 'Weak Low End',
                description: `Your bass presence is quite light. ${needsMoreBass ? "This genre typically benefits from more substantial low-end foundation." : "This might be intentional, but consider if you need more weight."}`,
                solution: this.genre === 'hiphop'
                    ? 'Boost around 50-80Hz by 2-4dB for more weight. Consider layering a sub-bass. Mono your sub frequencies below 80Hz.'
                    : 'Try a gentle 2-3dB boost around 60-100Hz. Check the relationship between your bass and kick drum.'
            });
        }

        // SUB-BASS CHECK - Only for genres that really use it
        if (['hiphop', 'electronic'].includes(this.genre) && rangeEnergies.subBass < 80) {
            insights.push({
                type: 'info',
                category: 'Bass',
                title: 'Could Use More Sub',
                description: 'Your sub-bass (20-60Hz) presence is light. This frequency range adds weight and impact that listeners feel more than hear.',
                solution: 'Consider boosting 30-50Hz by 1-3dB, or layer a dedicated sub-bass. Make sure it translates well on smaller speakers too.'
            });
        }

        // BRILLIANCE CHECK - Genre-specific
        if (this.genre === 'electronic' && rangeEnergies.brilliance < profile.brilliance.low) {
            insights.push({
                type: 'info',
                category: 'Highs',
                title: 'Could Use More Air',
                description: 'Electronic music often benefits from bright, exciting highs. Your track could use more sparkle and presence in the upper frequencies.',
                solution: 'Try a 1-2dB high shelf boost at 8-10kHz. Consider adding stereo width to your highs with a mid-side EQ.'
            });
        }

        // OVERALL BALANCE - Reasonable threshold
        const avgEnergy = Object.values(rangeEnergies).reduce((a, b) => a + b) / Object.values(rangeEnergies).length;
        const variance = Object.values(rangeEnergies).reduce((sum, energy) =>
            sum + Math.pow(energy - avgEnergy, 2), 0) / Object.values(rangeEnergies).length;

        const varianceThreshold = this.genre === 'hiphop' ? 4200 : 3500; // Balanced threshold

        if (variance > varianceThreshold) {
            insights.push({
                type: 'info',
                category: 'Balance',
                title: 'Uneven Frequency Balance',
                description: `Your mix has some notable peaks and valleys across the frequency spectrum. ${this.genre === 'hiphop' ? "Some character is normal in hip-hop, but this might be worth checking." : "This could affect how balanced your mix sounds."}`,
                solution: 'Consider gentle EQ adjustments to smooth out the biggest differences. Small 1-2dB moves usually work better than large cuts.'
            });
        }

        return insights;
    }

    analyzeDynamics(waveformData) {
        const insights = [];
        const profile = this.genreProfiles[this.genre] || this.genreProfiles.general;

        // Calculate RMS and peak values
        let sumSquares = 0;
        let peak = 0;

        for (let i = 0; i < waveformData.length; i++) {
            const sample = Math.abs(waveformData[i] - 128) / 128; // Normalize to 0-1
            sumSquares += sample * sample;
            peak = Math.max(peak, sample);
        }

        const rms = Math.sqrt(sumSquares / waveformData.length);
        const crestFactor = peak / (rms + 0.00001); // Avoid division by zero

        // OVER-COMPRESSION - Much more realistic thresholds
        if (crestFactor < profile.crestFactor.overCompressed) {
            const genreNote = this.genre === 'hiphop'
                ? "Even for modern hip-hop standards, this is quite heavily compressed."
                : this.genre === 'pop'
                    ? "This is quite compressed even for commercial pop music."
                    : "This level of compression might cause listener fatigue.";

            insights.push({
                type: 'warning',
                category: 'Dynamics',
                title: 'Heavily Compressed',
                description: `Your mix is quite heavily compressed with very little dynamic range. ${genreNote}`,
                solution: this.genre === 'hiphop'
                    ? 'Try reducing the master limiter by 1-2dB. Modern hip-hop is loud but still needs some punch. Target around -8 to -6 LUFS.'
                    : this.genre === 'pop'
                        ? 'Consider backing off the master chain compression slightly. Aim for -9 to -7 LUFS for streaming platforms.'
                        : 'Ease up on your master bus processing. Try raising compressor thresholds or reducing limiter gain.'
            });
        }

        // TOO DYNAMIC - Only flag if really excessive
        if (crestFactor > (profile.crestFactor.veryDynamic * 1.3)) { // Much higher threshold
            insights.push({
                type: 'info',
                category: 'Dynamics',
                title: 'Very Wide Dynamic Range',
                description: `Your mix has a very wide dynamic range. ${this.genre === 'jazz' ? "This natural dynamic range is often perfect for jazz." : "This might make quiet sections hard to hear in typical listening environments."}`,
                solution: this.genre === 'jazz'
                    ? 'This dynamic range is often ideal for jazz. Just ensure the quietest parts are still audible in your target listening environment.'
                    : 'Consider some gentle bus compression with a low ratio (2:1 or 3:1) to bring the dynamic range into a more manageable range.'
            });
        }

        return insights;
    }

    generateInsights(frequencyData, waveformData, sampleRate = 44100) {
        this.insights = [];

        // Analyze frequency balance
        const frequencyInsights = this.analyzeFrequencyBalance(frequencyData, sampleRate);
        this.insights.push(...frequencyInsights);

        // Analyze dynamics
        const dynamicInsights = this.analyzeDynamics(waveformData);
        this.insights.push(...dynamicInsights);

        // If no issues found, add positive feedback
        if (this.insights.length === 0) {
            const genrePraise = {
                hiphop: "The low end is hitting nicely, vocals have good presence, and the dynamics work well for the genre!",
                rock: "Good balance between instruments, appropriate dynamics, and clear frequency separation!",
                electronic: "Clean low end, exciting highs, and good energy throughout the frequency spectrum!",
                jazz: "Natural dynamics, warm tonal balance, and excellent instrument separation!",
                pop: "Polished sound with good vocal presence and commercial-ready balance!",
                general: "Great frequency balance and appropriate dynamics for your style!"
            };

            this.insights.push({
                type: 'success',
                category: 'Overall',
                title: 'Mix Sounds Great!',
                description: genrePraise[this.genre] || genrePraise.general,
                solution: 'Your mix is in good shape! Consider A/B testing with professional references in your genre for final polish.'
            });
        }

        return this.insights;
    }

    getPriorityInsights(maxCount = 3) {
        // Sort by type priority: warning > info > success
        const typePriority = { warning: 0, info: 1, success: 2 };

        return this.insights
            .sort((a, b) => typePriority[a.type] - typePriority[b.type])
            .slice(0, maxCount);
    }
}