import React, { useCallback, useState } from 'react';
import { Upload, Music, AlertCircle } from 'lucide-react';

const AudioUpload = ({ onFileSelect, isLoading }) => {
    const [dragActive, setDragActive] = useState(false);
    const [error, setError] = useState('');

    const validateFile = (file) => {
        const validTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/m4a'];
        const maxSize = 50 * 1024 * 1024; // 50MB

        if (!validTypes.includes(file.type)) {
            throw new Error('Please upload a valid audio file (MP3, WAV, M4A)');
        }

        if (file.size > maxSize) {
            throw new Error('File size must be less than 50MB');
        }

        return true;
    };

    const handleFile = useCallback((file) => {
        try {
            validateFile(file);
            setError('');
            onFileSelect(file);
        } catch (err) {
            setError(err.message);
        }
    }, [onFileSelect]);

    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            handleFile(files[0]);
        }
    }, [handleFile]);

    const handleFileInput = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            handleFile(files[0]);
        }
    };

    return (
        <div className="w-full">
            <div
                className={`
                    relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center
                    transition-all duration-300 ease-in-out backdrop-blur-sm
                    ${dragActive
                    ? 'border-sky-400 bg-sky-50/50 shadow-lg shadow-sky-200/50 scale-[1.02]'
                    : 'border-slate-300 hover:border-sky-300 bg-white/50 hover:shadow-lg'
                }
                    ${isLoading ? 'opacity-50 pointer-events-none' : ''}
                    overflow-hidden
                `}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <input
                    type="file"
                    accept="audio/mpeg,audio/wav,audio/mp3,audio/m4a,audio/x-m4a,audio/mp4,.mp3,.wav,.m4a,.aac"
                    onChange={handleFileInput}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={isLoading}
                />

                <div className="space-y-4">
                    {isLoading ? (
                        <div className="animate-spin w-12 h-12 sm:w-16 sm:h-16 mx-auto">
                            <Music className="w-full h-full text-sky-500" />
                        </div>
                    ) : (
                        <div className="relative">
                            <Upload className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-slate-400" />
                            <div className="absolute inset-0 w-12 h-12 sm:w-16 sm:h-16 mx-auto bg-sky-400/20 rounded-full blur-xl animate-pulse" />
                        </div>
                    )}

                    <div>
                        <p className="text-lg sm:text-xl font-semibold text-slate-800">
                            {isLoading ? 'Analyzing your audio...' : 'Drop your beat or instrumental here'}
                        </p>
                        <p className="text-sm text-slate-500 mt-2">
                            Click to browse or drag and drop
                        </p>
                        <p className="text-xs text-slate-400 mt-3">
                            Supports MP3, WAV, M4A • Max 50MB
                        </p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start">
                    <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}
        </div>
    );
};

export default AudioUpload;

