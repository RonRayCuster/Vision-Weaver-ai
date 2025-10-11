
import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../hooks/useAIDirectorChat';

interface AIDirectorChatProps {
    messages: ChatMessage[];
    isLoading: boolean;
    error: string | null;
    sendMessage: (message: string) => void;
}

const AIDirectorChat: React.FC<AIDirectorChatProps> = ({ messages, isLoading, error, sendMessage }) => {
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputValue.trim() && !isLoading) {
            sendMessage(inputValue);
            setInputValue('');
        }
    };

    return (
        <div className="h-full flex flex-col bg-gray-900/50 rounded-lg">
            <h2 className="text-lg font-semibold p-4 border-b border-gray-700 text-rose-400 flex-shrink-0">
                AI Director Chat
            </h2>
            <div className="flex-grow p-4 overflow-y-auto">
                <div className="space-y-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div
                                className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-xl ${
                                    msg.role === 'user'
                                        ? 'bg-sky-600 text-white rounded-br-none'
                                        : 'bg-gray-700 text-gray-200 rounded-bl-none'
                                }`}
                            >
                                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                         <div className="flex justify-start">
                             <div className="max-w-xs px-4 py-2 rounded-xl bg-gray-700 text-gray-200 rounded-bl-none">
                                <div className="flex items-center space-x-1">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                                </div>
                             </div>
                         </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>
             {error && <p className="p-4 text-sm text-red-400 border-t border-gray-700 flex-shrink-0">{error}</p>}
            <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700 flex-shrink-0">
                <div className="flex items-center space-x-2">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        // FIX: Removed conditional placeholder based on API key status.
                        placeholder={"Ask the AI Director..."}
                        className="w-full bg-gray-700 text-white placeholder-gray-400 px-3 py-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-rose-500 transition"
                        // FIX: Removed isApiKeySet from disabled logic.
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        // FIX: Removed isApiKeySet from disabled logic.
                        disabled={isLoading || !inputValue.trim()}
                        className="bg-rose-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-rose-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                    >
                        Send
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AIDirectorChat;
