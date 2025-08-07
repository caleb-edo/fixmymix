// WebAudioMixer.js - Client-side mixing engine using Web Audio API
export class WebAudioMixer {
    constructor(audioContext) {
        this.audioContext = audioContext;
        this.isProcessing = false;
    }

    async mixAudioFiles(beatFile, vocalsFile, genre = 'general') {
        this.isProcessing = true;

        try {
            // Load audio files
            const [beatBuffer, vocalsBuffer] = await Promise.all([
                this.loadAudioFile(beatFile),
                this.loadAudioFile(vocalsFile)
            ]);

            // Analyze levels and adjust parameters accordingly
            const levelAnalysis = this.analyzeTrackLevels(beatBuffer, vocalsBuffer);

            // Get mixing parameters for the genre and adjust based on level analysis
            const params = this.getMixingParameters(genre);
            this.adjustParametersForLevels(params, levelAnalysis);

            // Create offline context for rendering
            const sampleRate = this.audioContext.sampleRate;
            const duration = Math.max(beatBuffer.duration, vocalsBuffer.duration);
            const offlineContext = new OfflineAudioContext(2, duration * sampleRate, sampleRate);

            // Process beat
            const beatChain = this.createBeatChain(offlineContext, beatBuffer, params);

            // Process vocals
            const vocalsChain = this.createVocalsChain(offlineContext, vocalsBuffer, params);

            // Create master bus with professional mastering chain
            const masterGain = offlineContext.createGain();
            const masterEQ = this.createMasterEQ(offlineContext); // Professional mastering EQ
            const masterCompressor = offlineContext.createDynamicsCompressor();
            const masterEnhancer = this.createStereoEnhancer(offlineContext); // Stereo width
            const masterLimiter = this.createLimiter(offlineContext);

            // Connect chains to master with professional signal flow
            beatChain.output.connect(masterGain);
            vocalsChain.output.connect(masterGain);

            masterGain.connect(masterEQ.input);
            masterEQ.output.connect(masterCompressor);
            masterCompressor.connect(masterEnhancer.input);
            masterEnhancer.output.connect(masterLimiter);
            masterLimiter.connect(offlineContext.destination);

            // Set master parameters for commercial loudness with better bass preservation
            masterGain.gain.value = params.masterGain;
            masterCompressor.threshold.value = -4; // Higher threshold to let 808s through
            masterCompressor.knee.value = 4; // Softer knee for smoother compression
            masterCompressor.ratio.value = 3; // Gentler ratio to preserve dynamics
            masterCompressor.attack.value = 0.003; // Slower attack to let transients through
            masterCompressor.release.value = 0.12; // Faster release for punch recovery

            // Start playback
            beatChain.source.start(0);
            vocalsChain.source.start(0);

            // Render the mix
            const renderedBuffer = await offlineContext.startRendering();

            // Convert to WAV blob
            const wavBlob = this.bufferToWave(renderedBuffer);

            this.isProcessing = false;
            return wavBlob;

        } catch (error) {
            this.isProcessing = false;
            console.error('WebAudioMixer error:', error);
            throw new Error(`Mixing failed: ${error.message}`);
        }
    }

    createBeatChain(context, buffer, params) {
        const source = context.createBufferSource();
        source.buffer = buffer;

        const gain = context.createGain();
        const lowShelf = context.createBiquadFilter();
        const highShelf = context.createBiquadFilter();
        const compressor = context.createDynamicsCompressor();

        // Configure beat EQ
        lowShelf.type = 'lowshelf';
        lowShelf.frequency.value = params.beat.lowShelfFreq;
        lowShelf.gain.value = params.beat.lowShelfGain;

        highShelf.type = 'highshelf';
        highShelf.frequency.value = params.beat.highShelfFreq;
        highShelf.gain.value = params.beat.highShelfGain;

        // Configure beat compression
        compressor.threshold.value = params.beat.compressorThreshold;
        compressor.knee.value = 6;
        compressor.ratio.value = params.beat.compressorRatio;
        compressor.attack.value = 0.01;
        compressor.release.value = 0.1;

        // Set gain
        gain.gain.value = params.beat.gain;

        // Connect chain
        source.connect(lowShelf);
        lowShelf.connect(highShelf);
        highShelf.connect(compressor);
        compressor.connect(gain);

        return { source, output: gain };
    }

    createVocalsChain(context, buffer, params) {
        const source = context.createBufferSource();
        source.buffer = buffer;

        const gain = context.createGain();
        const highpass = context.createBiquadFilter();
        const presence = context.createBiquadFilter();
        const deEsser = this.createDeEsser(context);
        const compressor = context.createDynamicsCompressor();
        const reverb = this.createReverb(context, params.vocals.reverbAmount);

        // Configure vocal highpass
        highpass.type = 'highpass';
        highpass.frequency.value = params.vocals.highpassFreq;
        highpass.Q.value = 0.7;

        // Configure presence boost
        presence.type = 'peaking';
        presence.frequency.value = params.vocals.presenceFreq;
        presence.Q.value = 1;
        presence.gain.value = params.vocals.presenceGain;

        // Configure vocal compression
        compressor.threshold.value = params.vocals.compressorThreshold;
        compressor.knee.value = 10;
        compressor.ratio.value = params.vocals.compressorRatio;
        compressor.attack.value = 0.002;
        compressor.release.value = 0.05;

        // Set gain
        gain.gain.value = params.vocals.gain;

        // Connect chain
        source.connect(highpass);
        highpass.connect(presence);
        presence.connect(deEsser.input);
        deEsser.output.connect(compressor);
        compressor.connect(gain);

        // Add reverb send
        if (params.vocals.reverbAmount > 0) {
            compressor.connect(reverb.input);
            reverb.output.connect(gain);
        }

        return { source, output: gain };
    }

    createDeEsser(context) {
        // Simple de-esser using dynamic EQ
        const input = context.createGain();
        const output = context.createGain();
        const detector = context.createBiquadFilter();
        const reduction = context.createBiquadFilter();

        detector.type = 'bandpass';
        detector.frequency.value = 7000;
        detector.Q.value = 2;

        reduction.type = 'peaking';
        reduction.frequency.value = 7000;
        reduction.Q.value = 2;
        reduction.gain.value = -6; // Reduce sibilance by 6dB

        input.connect(detector);
        input.connect(reduction);
        reduction.connect(output);

        return { input, output };
    }

    createReverb(context, amount) {
        const convolver = context.createConvolver();
        const wetGain = context.createGain();
        const dryGain = context.createGain();
        const output = context.createGain();

        // Create impulse response for reverb
        const length = context.sampleRate * 2; // 2 second reverb
        const impulse = context.createBuffer(2, length, context.sampleRate);

        for (let channel = 0; channel < 2; channel++) {
            const channelData = impulse.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
            }
        }

        convolver.buffer = impulse;
        wetGain.gain.value = amount;
        dryGain.gain.value = 1 - amount;

        return {
            input: convolver,
            output: wetGain
        };
    }

    createLimiter(context) {
        const limiter = context.createDynamicsCompressor();
        limiter.threshold.value = -1; // Higher threshold for more bass punch
        limiter.knee.value = 1; // Slight knee for smoother limiting
        limiter.ratio.value = 15; // Still aggressive but not as harsh
        limiter.attack.value = 0.002; // Slightly slower to let 808 transients through
        limiter.release.value = 0.08; // Quick release for punch recovery
        return limiter;
    }

    createMasterEQ(context) {
        // Professional mastering EQ chain with better bass preservation
        const input = context.createGain();
        const lowShelf = context.createBiquadFilter();
        const lowMid = context.createBiquadFilter();
        const presence = context.createBiquadFilter();
        const air = context.createBiquadFilter();
        const output = context.createGain();

        // Enhanced sub-bass instead of cutting it
        lowShelf.type = 'lowshelf';
        lowShelf.frequency.value = 60; // Lower frequency for true sub-bass
        lowShelf.gain.value = 0.5; // Slight boost instead of cut

        // Less aggressive low-mid cleanup
        lowMid.type = 'peaking';
        lowMid.frequency.value = 250; // Higher frequency to avoid 808 range
        lowMid.Q.value = 0.5; // Wider Q for gentler effect
        lowMid.gain.value = -0.5; // Gentler cut

        // Vocal presence boost
        presence.type = 'peaking';
        presence.frequency.value = 2500;
        presence.Q.value = 1.2;
        presence.gain.value = 1; // Subtle presence

        // Air/sparkle (like professional masters)
        air.type = 'highshelf';
        air.frequency.value = 10000;
        air.gain.value = 1.5; // Add commercial sparkle

        // Connect EQ chain
        input.connect(lowShelf);
        lowShelf.connect(lowMid);
        lowMid.connect(presence);
        presence.connect(air);
        air.connect(output);

        return { input, output };
    }

    createStereoEnhancer(context) {
        // Simple, clean stereo enhancement without panning issues
        const input = context.createGain();
        const output = context.createGain();

        // Just add subtle high-frequency sparkle without any channel processing
        const sparkleEQ = context.createBiquadFilter();
        sparkleEQ.type = 'highshelf';
        sparkleEQ.frequency.value = 8000;
        sparkleEQ.gain.value = 1; // Subtle sparkle
        sparkleEQ.Q.value = 0.7;

        // Simple passthrough with just EQ enhancement
        input.connect(sparkleEQ);
        sparkleEQ.connect(output);

        return { input, output };
    }

    getMixingParameters(genre) {
        const params = {
            general: {
                beat: {
                    gain: 0.52, // Increased from 0.4
                    lowShelfFreq: 100,
                    lowShelfGain: 2, // Increased from 1
                    highShelfFreq: 8000,
                    highShelfGain: 0.5, // Reduced from 0.5
                    compressorThreshold: -12, // Raised from -12
                    compressorRatio: 3 // Reduced from 3
                },
                vocals: {
                    gain: 0.38, // Increased from 0.35
                    highpassFreq: 80,
                    presenceFreq: 3500,
                    presenceGain: 1, // Reduced from 1
                    compressorThreshold: -10, // Raised from -10
                    compressorRatio: 3, // Reduced from 3
                    reverbAmount: 0.1 // Reduced from 0.1
                },
                masterGain: 1.3 // Increased from 0.98
            },
            hiphop: {
                beat: {
                    gain: 0.58, // Increased from 0.45
                    lowShelfFreq: 80,
                    lowShelfGain: 3, // Increased from 2
                    highShelfFreq: 10000,
                    highShelfGain: 1, // Reduced from 1
                    compressorThreshold: -10, // Raised from -10
                    compressorRatio: 4 // Reduced from 4
                },
                vocals: {
                    gain: 0.43, // Increased from 0.4
                    highpassFreq: 60,
                    presenceFreq: 4000,
                    presenceGain: 1, // Reduced from 1.5
                    compressorThreshold: -8, // Raised from -8
                    compressorRatio: 4, // Reduced from 4
                    reverbAmount: 0.08 // Reduced from 0.08
                },
                masterGain: 1.3 // Increased from 1.0
            },
            pop: {
                beat: {
                    gain: 0.48, // Increased from 0.35
                    lowShelfFreq: 100,
                    lowShelfGain: 1, // Increased from 0.5
                    highShelfFreq: 12000,
                    highShelfGain: 1.5, // Reduced from 1.5
                    compressorThreshold: -14, // Raised from -14
                    compressorRatio: 2.5 // Reduced from 2.5
                },
                vocals: {
                    gain: 0.41, // Increased from 0.38
                    highpassFreq: 100,
                    presenceFreq: 5000,
                    presenceGain: 1.5, // Reduced from 2
                    compressorThreshold: -12, // Raised from -12
                    compressorRatio: 2.5, // Reduced from 2.5
                    reverbAmount: 0.12 // Reduced from 0.12
                },
                masterGain: 1.3 // Increased from 0.99
            },
            rock: {
                beat: {
                    gain: 0.65, // Increased from 0.5
                    lowShelfFreq: 80,
                    lowShelfGain: 1, // Increased from 0.5
                    highShelfFreq: 6000,
                    highShelfGain: 0,
                    compressorThreshold: -16, // Raised from -16
                    compressorRatio: 2
                },
                vocals: {
                    gain: 0.35, // Increased from 0.32
                    highpassFreq: 80,
                    presenceFreq: 3000,
                    presenceGain: 0.8, // Reduced from 1
                    compressorThreshold: -14, // Raised from -14
                    compressorRatio: 2,
                    reverbAmount: 0.15 // Reduced from 0.15
                },
                masterGain: 1.3 // Increased from 0.96
            },
            electronic: {
                beat: {
                    gain: 0.62, // Increased from 0.48
                    lowShelfFreq: 60,
                    lowShelfGain: 3, // Increased from 2.5
                    highShelfFreq: 15000,
                    highShelfGain: 2, // Reduced from 2
                    compressorThreshold: -8, // Raised from -8
                    compressorRatio: 6 // Reduced from 6
                },
                vocals: {
                    gain: 0.33, // Increased from 0.3
                    highpassFreq: 40,
                    presenceFreq: 6000,
                    presenceGain: 1.8, // Reduced from 2.5
                    compressorThreshold: -6, // Raised from -6
                    compressorRatio: 6, // Reduced from 6
                    reverbAmount: 0.18 // Reduced from 0.18
                },
                masterGain: 1.3 // Increased from 1.0
            },
            rnb: {
                beat: {
                    gain: 0.52, // Increased from 0.38
                    lowShelfFreq: 90,
                    lowShelfGain: 1.5, // Increased from 1
                    highShelfFreq: 9000,
                    highShelfGain: 1, // Reduced from 1
                    compressorThreshold: -12, // Raised from -12
                    compressorRatio: 3 // Reduced from 3
                },
                vocals: {
                    gain: 0.45, // Increased from 0.42
                    highpassFreq: 70,
                    presenceFreq: 4500,
                    presenceGain: 1.2, // Reduced from 1.5
                    compressorThreshold: -10, // Raised from -10
                    compressorRatio: 3, // Reduced from 3
                    reverbAmount: 0.12 // Reduced from 0.12
                },
                masterGain: 1.3 // Increased from 0.99
            }
        };

        return params[genre] || params.general;
    }

    async loadAudioFile(file) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            return await this.audioContext.decodeAudioData(arrayBuffer);
        } catch (error) {
            throw new Error(`Failed to decode ${file.name}: ${error.message}`);
        }
    }

    bufferToWave(abuffer) {
        const numOfChan = abuffer.numberOfChannels;
        const length = abuffer.length * numOfChan * 2 + 44;
        const buffer = new ArrayBuffer(length);
        const view = new DataView(buffer);
        const channels = [];
        let sample;
        let offset = 0;
        let pos = 0;

        // write WAVE header
        const setUint16 = (data) => {
            view.setUint16(pos, data, true);
            pos += 2;
        };

        const setUint32 = (data) => {
            view.setUint32(pos, data, true);
            pos += 4;
        };

        setUint32(0x46464952); // "RIFF"
        setUint32(length - 8); // file length - 8
        setUint32(0x45564157); // "WAVE"

        setUint32(0x20746d66); // "fmt " chunk
        setUint32(16); // length = 16
        setUint16(1); // PCM (uncompressed)
        setUint16(numOfChan);
        setUint32(abuffer.sampleRate);
        setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
        setUint16(numOfChan * 2); // block-align
        setUint16(16); // 16-bit (hardcoded in this demo)

        setUint32(0x61746164); // "data" - chunk
        setUint32(length - pos - 4); // chunk length

        // write interleaved data
        for (let i = 0; i < abuffer.numberOfChannels; i++)
            channels.push(abuffer.getChannelData(i));

        while (pos < length) {
            for (let i = 0; i < numOfChan; i++) { // interleave channels
                sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
                // Fixed: Convert to signed 16-bit instead of unsigned
                sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
                view.setInt16(pos, sample, true); // write 16-bit sample as signed
                pos += 2;
            }
            offset++; // next source sample
        }

        return new Blob([buffer], { type: 'audio/wav' });
    }

    analyzeTrackLevels(beatBuffer, vocalsBuffer) {
        // Analyze RMS levels of both tracks
        const beatRMS = this.calculateRMS(beatBuffer);
        const vocalsRMS = this.calculateRMS(vocalsBuffer);

        // Calculate peak levels
        const beatPeak = this.calculatePeak(beatBuffer);
        const vocalsPeak = this.calculatePeak(vocalsBuffer);

        // Determine relative loudness
        const beatLoudness = this.rmsToDb(beatRMS);
        const vocalsLoudness = this.rmsToDb(vocalsRMS);

        const analysis = {
            beatRMS,
            vocalsRMS,
            beatPeak,
            vocalsPeak,
            beatLoudness,
            vocalsLoudness,
            levelDifference: Math.abs(beatLoudness - vocalsLoudness),
            beatLouder: beatLoudness > vocalsLoudness,
            vocalsLouder: vocalsLoudness > beatLoudness
        };

        console.log('Level Analysis:', {
            beatLoudness: beatLoudness.toFixed(1) + 'dB',
            vocalsLoudness: vocalsLoudness.toFixed(1) + 'dB',
            difference: analysis.levelDifference.toFixed(1) + 'dB'
        });

        return analysis;
    }

    calculateRMS(audioBuffer) {
        let sumSquares = 0;
        let sampleCount = 0;

        for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
            const channelData = audioBuffer.getChannelData(channel);
            for (let i = 0; i < channelData.length; i++) {
                sumSquares += channelData[i] * channelData[i];
                sampleCount++;
            }
        }

        return Math.sqrt(sumSquares / sampleCount);
    }

    calculatePeak(audioBuffer) {
        let peak = 0;

        for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
            const channelData = audioBuffer.getChannelData(channel);
            for (let i = 0; i < channelData.length; i++) {
                peak = Math.max(peak, Math.abs(channelData[i]));
            }
        }

        return peak;
    }

    rmsToDb(rms) {
        return 20 * Math.log10(Math.max(rms, 0.00001)); // Avoid log(0)
    }

    adjustParametersForLevels(params, analysis) {
        const { levelDifference, beatLouder, vocalsLouder, beatLoudness, vocalsLoudness } = analysis;

        // If one track is significantly louder than the other, adjust gains
        if (levelDifference > 8) { // Increased threshold from 6dB to 8dB
            if (beatLouder) {
                // Beat is much louder - reduce beat gain slightly, increase vocals gain slightly
                const adjustment = Math.min(levelDifference * 0.02, 0.15); // Reduced from 0.03 and 0.3
                params.beat.gain *= (1 - adjustment * 0.5); // Smaller beat reduction
                params.vocals.gain *= (1 + adjustment * 0.8); // Smaller vocal boost
                console.log(`Beat is ${levelDifference.toFixed(1)}dB louder - minor adjustment`);
            } else {
                // Vocals are much louder - reduce vocals more aggressively
                const adjustment = Math.min(levelDifference * 0.04, 0.25); // More aggressive vocal reduction
                params.vocals.gain *= (1 - adjustment * 1.2); // Larger vocal reduction
                params.beat.gain *= (1 + adjustment * 0.6); // Moderate beat boost
                console.log(`Vocals are ${levelDifference.toFixed(1)}dB louder - reducing vocals more`);
            }
        }

        // Always bias toward the beat more aggressively
        params.beat.gain *= 1.25; // Give beat a 25% boost (increased from 10%)
        params.vocals.gain *= 0.85; // Reduce vocals by 15% (increased from 10%)

        // Adjust compression based on overall levels
        // If tracks are very quiet (below -20dB), reduce compression
        if (beatLoudness < -20) {
            params.beat.compressorThreshold -= 3; // Gentler compression for quiet tracks
        }
        if (vocalsLoudness < -20) {
            params.vocals.compressorThreshold -= 3;
        }

        // If tracks are very loud (above -6dB), increase compression
        if (beatLoudness > -6) {
            params.beat.compressorThreshold += 2; // More compression for hot tracks
            params.beat.compressorRatio += 1;
        }
        if (vocalsLoudness > -6) {
            params.vocals.compressorThreshold += 2;
            params.vocals.compressorRatio += 1;
        }
    }
}