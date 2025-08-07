export class AudioProcessor {
    constructor(audioContext) {
        this.audioContext = audioContext;
        this.analyser = null;
        this.source = null;
        this.audioBuffer = null;
    }

    async loadAudioFile(file) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            return this.audioBuffer;
        } catch (error) {
            throw new Error('Failed to load audio file: ' + error.message);
        }
    }

    setupAnalyser() {
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 2048;
        this.analyser.smoothingTimeConstant = 0.8;
        return this.analyser;
    }

    connectSource(audioBuffer) {
        if (this.source) {
            this.source.disconnect();
        }

        this.source = this.audioContext.createBufferSource();
        this.source.buffer = audioBuffer;

        if (!this.analyser) {
            this.setupAnalyser();
        }

        this.source.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);

        return this.source;
    }

    getFrequencyData() {
        if (!this.analyser) return new Uint8Array(0);

        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        this.analyser.getByteFrequencyData(dataArray);
        return dataArray;
    }

    getWaveformData() {
        if (!this.analyser) return new Uint8Array(0);

        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        this.analyser.getByteTimeDomainData(dataArray);
        return dataArray;
    }
}