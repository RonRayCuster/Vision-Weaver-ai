import React from 'react';
import { VisionWeaverIcon, MenuIcon } from './Icons';

interface HeaderProps {
    onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
    return (
        <header className="px-4 lg:px-6 py-4 flex items-center justify-between border-b border-border bg-surface/50 fade-in opacity-0">
            <div className="flex items-center gap-4">
                 <button
                    onClick={onMenuClick}
                    className="xl:hidden p-2 rounded-full text-text-secondary hover:bg-primary/50 focus:outline-none focus:ring-2 focus:ring-accent"
                    aria-label="Open tools and analysis panel"
                >
                    <MenuIcon className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-3">
                    <VisionWeaverIcon className="w-8 h-8 text-accent" />
                    <div>
                        <h1 className="text-xl font-bold text-text-primary">VISIONWEAVER</h1>
                        <p className="text-xs text-text-secondary -mt-1">Interactive Scene Visualizer</p>
                    </div>
                </div>
            </div>
             <div className="text-xs text-text-secondary">
                Powered by Gemini
            </div>
        </header>
    );
};

export default Header;