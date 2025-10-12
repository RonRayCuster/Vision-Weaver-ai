
import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";

/**
 * Defines the structure of a single chat message.
 */
export interface ChatMessage {
    role: 'user' | 'model';
    content: string;
}

/**
 * Custom hook to manage a conversational chat session with the AI Director.
 * @param apiKey The user-provided Google GenAI API key.
 */
// FIX: The API key should not be passed as a parameter. Using process.env.API_KEY as per guidelines.
export function useAIDirectorChat() {
    const chatRef = useRef<Chat | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);

    /**
     * Initializes the chat session with the Gemini API and a system instruction.
     */
    const initializeChat = useCallback(() => {
        try {
            // FIX: Using process.env.API_KEY directly as per guidelines.
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            chatRef.current = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: {
                    systemInstruction: `You are an expert AI Film Director and creative partner. Your role is to provide deep cinematic analysis and spark creative ideas. Your collaborator is a human director, and you should help them deconstruct their scene, understand its emotional beats, and explore possibilities.

When discussing the scene, don't just state facts. Offer interpretations, ask thought-provoking questions, and suggest creative alternatives. You can suggest edits, new shots, or even changes to the sound design. Your tone is collaborative, insightful, and professional.

When you suggest a specific analysis at a particular time, you MUST embed a special action token in your response. The format is [ACTION:TYPE:TIMESTAMP], where TIMESTAMP is in seconds.

Available ACTION TYPEs are:
- ANALYZE_LAYOUT: For scene layout analysis.
- ANALYZE_CINEMATICS: For cinematic analysis of a single frame.
- RECONSTRUCT_SCENE: For 3D reconstruction.

Example of a great response: "The composition at 35 seconds is quite interesting, following the rule of thirds perfectly. However, the flat lighting diminishes the emotional impact. Have you considered a more dramatic Rembrandt lighting setup? We could even try generating an edited frame to see how it looks. Also, let's take a closer look at the technicals. [ACTION:ANALYZE_CINEMATICS:35]"`,
                },
            });
            setMessages([
                { role: 'model', content: "Hello! I'm the AI Director. How can we improve the scene today? Feel free to ask about blocking, pacing, or cinematic choices." }
            ]);
            setError(null);
            setIsInitialized(true);
        } catch (e) {
            console.error("Failed to initialize AI Chat:", e);
            // FIX: Updated error message to not prompt for an API key.
            setError("Could not connect to the AI Director. Check your API key configuration.");
            setIsInitialized(false);
        }
    }, []);
    
    // FIX: Initialize chat once on component mount. The API key is assumed to be available.
    useEffect(() => {
        initializeChat();
    }, [initializeChat]);


    /**
     * Sends a message to the chat session and handles the streamed response.
     */
    const sendMessage = useCallback(async (message: string) => {
        if (!chatRef.current || !isInitialized) {
            // FIX: Updated error message to not prompt for an API key.
            setError("Chat is not initialized. Please check your API key configuration.");
            return;
        }
        if (!message.trim()) return;

        setIsLoading(true);
        setError(null);

        // Add user message to history
        setMessages(prev => [...prev, { role: 'user', content: message }]);

        try {
            const stream = await chatRef.current.sendMessageStream({ message });
            
            // Add a placeholder for the model's response
            setMessages(prev => [...prev, { role: 'model', content: "" }]);

            for await (const chunk of stream) {
                const chunkText = chunk.text;
                // Update the last message (the model's response) with the new chunk
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1].content += chunkText;
                    return newMessages;
                });
            }

        } catch (e) {
            console.error("Failed to send message:", e);
            setError("An error occurred while talking to the AI Director. Please try again.");
            // Remove the empty model placeholder on error
            setMessages(prev => prev.filter(msg => msg.content !== '' || msg.role !== 'model'));
        } finally {
            setIsLoading(false);
        }

    }, [isInitialized]);

    return { messages, isLoading, error, sendMessage };
}