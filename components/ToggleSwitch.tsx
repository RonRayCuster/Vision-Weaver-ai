import React from 'react';

interface ToggleSwitchProps {
    label: string;
    isEnabled: boolean;
    onToggle: (enabled: boolean) => void;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ label, isEnabled, onToggle }) => {
    return (
        <label htmlFor={label} className="flex items-center justify-between cursor-pointer">
            <span className="text-sm font-medium text-text-primary">{label}</span>
            <div className="relative">
                <input 
                    id={label}
                    type="checkbox" 
                    className="sr-only" 
                    checked={isEnabled} 
                    onChange={() => onToggle(!isEnabled)} 
                />
                <div className={`block w-10 h-6 rounded-full transition-colors ${isEnabled ? 'bg-accent' : 'bg-primary'}`}></div>
                <div 
                    className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isEnabled ? 'transform translate-x-full' : ''}`}
                ></div>
            </div>
        </label>
    );
};