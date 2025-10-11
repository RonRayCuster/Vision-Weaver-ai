import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { ChatMessage } from '../hooks/useAIDirectorChat';
import { SendIcon, SearchIcon } from './Icons';

interface AIDirectorChatProps {
    messages: ChatMessage[];
    isLoading: boolean;
    error: string | null;
    sendMessage: (message: string) => void;
    onExecuteAction: (actionType: string, timestamp: number) => void;
}

const ACTION_REGEX = /\[ACTION:(\w+):(\d+\.?\d*)]/g;

const formatActionLabel = (actionType: string, timestamp: number): string => {
    const date = new Date(0);
    date.setSeconds(timestamp);
    const timeString = date.toISOString().substr(14, 5); // MM:SS format

    switch (actionType) {
        case 'ANALYZE_CINEMATICS':
            return `Analyze Cinematics at ${timeString}`;
        case 'ANALYZE_LAYOUT':
            return `Analyze Layout at ${timeString}`;
        case 'RECONSTRUCT_SCENE':
             return `Reconstruct Scene at ${timeString}`;
        default:
            return `Execute ${actionType.replace(/_/g, ' ').toLowerCase()} at ${timeString}`;
    }
};

const AIDirectorChat: React.FC<AIDirectorChatProps> = ({ messages, isLoading, error, sendMessage, onExecuteAction }) => {
    const [inputValue, setInputValue] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Auto-scroll to the bottom only when new messages arrive and there's no active search
    useEffect(() => {
        if (!searchQuery) {
            scrollToBottom();
        }
    }, [messages, searchQuery]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputValue.trim() && !isLoading) {
            sendMessage(inputValue);
            setInputValue('');
        }
    };

    // Memoize filtered messages to avoid re-calculating on every render
    const filteredMessages = useMemo(() => {
        if (!searchQuery.trim()) {
            return messages;
        }
        return messages.filter(msg =>
            msg.content.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [messages, searchQuery]);

    // Function to highlight search term in message content
    const highlightText = (text: string, highlight: string): React.ReactNode => {
        if (!highlight.trim()) {
            return text;
        }
        // Use a case-insensitive regex to split the string, escaping special characters
        const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        const parts = text.split(regex);
        return (
            <>
                {parts.map((part, i) =>
                    regex.test(part) ? (
                        <mark key={i} className="bg-warning text-primary rounded px-0.5">
                            {part}
                        </mark>
                    ) : (
                        part
                    )
                )}
            </>
        );
    };

    const renderMessageContent = (content: string) => {
        const parts: (string | React.ReactNode)[] = [];
        let lastIndex = 0;
        let match;
    
        // Reset regex state for each call
        ACTION_REGEX.lastIndex = 0;

        while ((match = ACTION_REGEX.exec(content)) !== null) {
            // Push the text before the match
            if (match.index > lastIndex) {
                parts.push(content.substring(lastIndex, match.index));
            }
    
            const [fullMatch, actionType, timestampStr] = match;
            const timestamp = parseFloat(timestampStr);
    
            // Push the button for the match
            parts.push(
                <button 
                    key={match.index}
                    onClick={() => onExecuteAction(actionType, timestamp)}
                    className="block bg-secondary-accent text-primary font-bold px-2 py-1 my-1 text-xs rounded-md hover:bg-secondary-accent/90 transition active:scale-95 text-left"
                    title={`Run analysis at ${timestamp.toFixed(2)}s`}
                >
                    {`[ ${formatActionLabel(actionType, timestamp)} ]`}
                </button>
            );
    
            lastIndex = match.index + fullMatch.length;
        }
    
        // Push the remaining text after the last match
        if (lastIndex < content.length) {
            parts.push(content.substring(lastIndex));
        }
    
        // Apply highlighting to the text parts
        return parts.map((part, index) => {
            if (typeof part === 'string') {
                return <span key={index}>{highlightText(part, searchQuery)}</span>;
            }
            return part; // It's already a button
        });
    };

    return (
        <div className="h-full flex flex-col">
            <style>{`
                @keyframes message-in {
                    from {
                        opacity: 0;
                        transform: translateY(8px) scale(0.98);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
                .animate-message-in {
                    animation: message-in 0.3s ease-out forwards;
                }
            `}</style>
            <div className="p-4 border-b border-border flex-shrink-0 flex justify-between items-center gap-4">
                <h2 className="text-lg font-bold text-accent">
                    AI Director Chat
                </h2>
                <div className="relative flex-grow max-w-xs">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search messages..."
                        className="w-full bg-primary text-text-primary placeholder-text-secondary pl-9 pr-8 py-1.5 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent transition text-sm"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary p-1"
                            aria-label="Clear search"
                        >
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>
            <div className="flex-grow p-4 overflow-y-auto">
                <div className="space-y-4">
                    {filteredMessages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div
                                className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-xl shadow-sm animate-message-in ${
                                    msg.role === 'user'
                                        ? 'bg-accent text-text-primary rounded-br-none'
                                        : 'bg-primary/80 text-text-primary rounded-bl-none'
                                }`}
                            >
                                <div className="text-sm whitespace-pre-wrap">{renderMessageContent(msg.content)}</div>
                            </div>
                        </div>
                    ))}
                    {isLoading && !searchQuery && ( // Don't show loading dots when searching
                         <div className="flex justify-start">
                             <div className="max-w-xs px-4 py-2 rounded-xl bg-primary/80 text-text-primary rounded-bl-none">
                                <div className="flex items-center space-x-1">
                                    <div className="w-2 h-2 bg-text-secondary rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                                    <div className="w-2 h-2 bg-text-secondary rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                                    <div className="w-2 h-2 bg-text-secondary rounded-full animate-pulse"></div>
                                </div>
                             </div>
                         </div>
                    )}
                    {filteredMessages.length === 0 && searchQuery && (
                        <div className="text-center py-4 text-text-secondary text-sm">
                            <p>No messages found for "{searchQuery}"</p>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>
             {error && <p className="p-4 text-sm text-error border-t border-border flex-shrink-0">{error}</p>}
            <form onSubmit={handleSubmit} className="p-4 border-t border-border flex-shrink-0 bg-surface/80">
                <div className="flex items-center space-x-2">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder={"Ask the AI Director..."}
                        className="w-full bg-primary text-text-primary placeholder-text-secondary px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-accent transition"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !inputValue.trim()}
                        className="bg-accent text-text-primary font-semibold p-2.5 rounded-lg hover:bg-accent/90 disabled:bg-border disabled:cursor-not-allowed transition-colors active:scale-95 flex-shrink-0"
                        aria-label="Send message"
                    >
                        <SendIcon />
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AIDirectorChat;