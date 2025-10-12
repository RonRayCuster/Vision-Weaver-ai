import React, { useState, useRef, useEffect } from 'react';
import type { Preset } from '../presets';
import { CheckIcon, ChevronDownIcon } from './Icons';

interface PresetSelectorProps {
    presets: Preset[];
    currentPresetId: string;
    onSelectPreset: (id: string) => void;
}

const PresetSelector: React.FC<PresetSelectorProps> = ({ presets, currentPresetId, onSelectPreset }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const isCustomVideo = currentPresetId === 'custom';
    const currentPreset = presets.find(p => p.id === currentPresetId);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSelect = (id: string) => {
        onSelectPreset(id);
        setIsOpen(false);
    };

    return (
        <div ref={wrapperRef} className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full min-w-[200px] bg-primary text-text-primary px-3 py-2 rounded-lg border border-border hover:border-accent focus:outline-none focus:ring-2 focus:ring-accent transition"
                aria-haspopup="true"
                aria-expanded={isOpen}
            >
                <div className="flex items-center gap-2">
                    {isCustomVideo ? <span className="text-base">📹</span> : currentPreset?.icon && <span className="text-base">{currentPreset.icon}</span>}
                    <span className="text-sm font-medium">{isCustomVideo ? 'Custom Video' : currentPreset?.name || 'Select Preset'}</span>
                </div>
                <ChevronDownIcon className={`w-4 h-4 text-text-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute z-10 top-full mt-2 w-full bg-surface rounded-lg shadow-lg border border-border animate-fade-in-up">
                    <ul className="py-1">
                         {isCustomVideo && (
                            <li>
                                <div className="w-full text-left px-3 py-2 text-sm text-text-primary flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-base w-5 text-center">📹</span>
                                        <span>Custom Video</span>
                                    </div>
                                    <CheckIcon className="w-4 h-4 text-accent" />
                                </div>
                            </li>
                        )}
                        {presets.map(preset => (
                            <li key={preset.id}>
                                <button
                                    onClick={() => handleSelect(preset.id)}
                                    className="w-full text-left px-3 py-2 text-sm text-text-primary hover:bg-primary flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-2">
                                        {preset.icon && <span className="text-base w-5 text-center">{preset.icon}</span>}
                                        <span>{preset.name}</span>
                                    </div>
                                    {preset.id === currentPresetId && <CheckIcon className="w-4 h-4 text-accent" />}
                                </button>
                            </li>
                        ))}
                    </ul>
                     <style>{`
                        @keyframes fade-in-up {
                            from { opacity: 0; transform: translateY(-5px); }
                            to { opacity: 1; transform: translateY(0); }
                        }
                        .animate-fade-in-up { animation: fade-in-up 0.2s ease-out forwards; }
                    `}</style>
                </div>
            )}
        </div>
    );
};

export default PresetSelector;