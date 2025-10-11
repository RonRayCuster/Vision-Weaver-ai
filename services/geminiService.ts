import { GoogleGenAI, Type, Modality } from "@google/genai";
import type { SceneAnalysis, CinematicAnalysis, SceneReconstruction, DynamicFeedback, EditedImage, GeneratedVideo } from '../types';

/**
 * Analyzes a sequence of frames to determine the 3D layout, character emotions, and environment.
 */
export async function analyzeSceneLayout(base64Frames: string[]): Promise<SceneAnalysis> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const vector3Schema = {
        type: Type.OBJECT,
        properties: {
            x: { type: Type.NUMBER, description: "X coordinate from 0-100" },
            y: { type: Type.NUMBER, description: "Y coordinate from 0-100 (ground plane)" },
            z: { type: Type.NUMBER, description: "Z coordinate from 0-100 (height)" },
        },
         required: ["x", "y", "z"]
    };
    
    const parts = [
        { text: `Analyze this sequence of frames from a movie. Describe the 3D layout from a top-down perspective (100x100 grid), character emotions, their interactions, the overall environment, and mood. Be very descriptive and nuanced in your analysis, especially for the environment (time of day, weather, location) and mood (specific emotional tones like 'melancholy' or 'suspenseful'). The frames are sequential. Provide a single, consolidated JSON response adhering to the schema.` },
        ...base64Frames.map(frame => ({ inlineData: { mimeType: 'image/jpeg', data: frame } }))
    ];

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    actors: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING, description: "Name of the actor or character."},
                                position: vector3Schema,
                                emotion: { type: Type.STRING, description: "The character's perceived emotion (e.g., 'happy', 'anxious')." },
                                interaction: { type: Type.STRING, description: "Description of interaction with props or other characters. Null if none." }
                            },
                            required: ["name", "position", "emotion", "interaction"]
                        }
                    },
                    camera: {
                        type: Type.OBJECT,
                        properties: { position: vector3Schema },
                        required: ["position"]
                    },
                    lights: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                type: { type: Type.STRING, description: "e.g., key, fill, back, practical"},
                                position: vector3Schema,
                                intensity: { type: Type.NUMBER, description: "Light intensity from 0 to 1." }
                            },
                            required: ["type", "position", "intensity"]
                        }
                    },
                     props: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING, description: "Name of the prop."},
                                position: vector3Schema,
                            },
                            required: ["name", "position"]
                        }
                    },
                    environmentDescription: {
                        type: Type.STRING,
                        description: "Describe the physical environment. Include details like location (e.g., 'forest', 'kitchen'), time of day, and weather if applicable."
                    },
                    overallMood: {
                        type: Type.STRING,
                        description: "Describe the emotional atmosphere of the scene. Use specific, nuanced words (e.g., 'melancholy', 'suspenseful', 'joyful') rather than general categories."
                    }
                },
                required: ["actors", "camera", "lights", "props", "environmentDescription", "overallMood"]
            }
        }
    });

    const resultJson = JSON.parse(response.text);
    return resultJson;
}


/**
 * Analyzes a single frame to determine its cinematic properties like composition and color.
 */
export async function analyzeCinematics(base64Frame: string): Promise<CinematicAnalysis> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const parts = [
        { text: `Analyze the cinematic properties of this film frame. Describe the shot composition, color palette, and inferred camera work. Provide a JSON response adhering to the schema.` },
        { inlineData: { mimeType: 'image/jpeg', data: base64Frame } }
    ];

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    shotComposition: {
                        type: Type.STRING,
                        description: "Describe the shot composition. Specify the shot size (e.g., 'Extreme Close-up', 'Medium Shot', 'Full Shot'). Mention any notable framing techniques like rule of thirds, leading lines, or symmetry."
                    },
                    colorPalette: {
                        type: Type.STRING,
                        description: "Describe the color palette and grading. Specify the color temperature (e.g., 'cool blues', 'warm oranges'), dominant colors, and contrast level (e.g., 'high contrast', 'low contrast'). Describe the mood these colors evoke."
                    },
                    cameraWork: {
                        type: Type.STRING,
                        description: "Infer and describe the camera work. Specify camera movement (e.g., 'static', 'handheld shake', 'smooth dolly', 'dolly zoom'). Infer the likely lens focal length (e.g., 'wide-angle', 'telephoto')."
                    }
                },
                required: ["shotComposition", "colorPalette", "cameraWork"]
            }
        }
    });

    const resultJson = JSON.parse(response.text);
    return resultJson;
}


/**
 * Reconstructs a 3D point cloud and camera poses from a sequence of frames.
 */
export async function reconstructScene(base64Frames: string[]): Promise<SceneReconstruction> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const vector3Schema = {
        type: Type.OBJECT,
        properties: {
            x: { type: Type.NUMBER },
            y: { type: Type.NUMBER },
            z: { type: Type.NUMBER },
        },
        required: ["x", "y", "z"]
    };

    const parts = [
        { text: `Analyze this sequence of frames. Use the COLMAP tool to perform a 3D reconstruction of the scene. Generate a dense point cloud and the corresponding camera poses for each frame. The origin (0,0,0) should be the center of the scene. Provide a JSON response adhering to the schema.` },
        ...base64Frames.map(frame => ({ inlineData: { mimeType: 'image/jpeg', data: frame } }))
    ];
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    pointCloud: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                position: vector3Schema,
                                color: { type: Type.STRING, description: "Hex color string (#RRGGBB)" }
                            },
                            required: ["position", "color"]
                        }
                    },
                    cameraPoses: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                position: vector3Schema,
                                orientation: {
                                    type: Type.OBJECT,
                                    properties: {
                                        x: { type: Type.NUMBER },
                                        y: { type: Type.NUMBER },
                                        z: { type: Type.NUMBER },
                                        w: { type: Type.NUMBER },
                                    },
                                    description: "Quaternion representing camera orientation.",
                                    required: ["x", "y", "z", "w"]
                                }
                            },
                            required: ["position", "orientation"]
                        }
                    }
                },
                required: ["pointCloud", "cameraPoses"]
            }
        }
    });
    const resultJson = JSON.parse(response.text);
    return resultJson;
}

/**
 * Analyzes a scene layout change and provides cinematic feedback.
 */
export async function getDynamicFeedbackForChange(analysis: SceneAnalysis, changedObjectName: string): Promise<DynamicFeedback> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Create a simplified text representation of the scene for the prompt.
    const sceneSummary = `
        - Environment: ${analysis.environmentDescription}
        - Mood: ${analysis.overallMood}
        - Actors: ${analysis.actors.map(a => `${a.name} at (${a.position.x.toFixed(0)}, ${a.position.y.toFixed(0)})`).join(', ')}
        - Camera: at (${analysis.camera.position.x.toFixed(0)}, ${analysis.camera.position.y.toFixed(0)})
    `;

    const prompt = `
        You are an expert AI Film Director. A user is interactively blocking a scene.
        Current scene summary:
        ${sceneSummary}
        
        The user just moved the "${changedObjectName}".
        
        Based on its new position relative to other elements, provide a concise cinematic analysis of this specific change.
        Be brief and insightful. Adhere to the JSON schema.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    impact: {
                        type: Type.STRING,
                        description: "Briefly describe the cinematic impact of the change. (e.g., 'This creates a classic over-the-shoulder shot, increasing intimacy.')"
                    },
                    suggestion: {
                        type: Type.STRING,
                        description: "Offer a brief, creative suggestion related to the change. (e.g., 'Consider using a shallower depth of field to isolate the character further.')"
                    }
                },
                required: ["impact", "suggestion"]
            }
        }
    });

    const resultJson = JSON.parse(response.text);
    return resultJson;
}

/**
 * Edits a single frame based on a text prompt using 'gemini-2.5-flash-image'.
 */
export async function editFrame(base64Frame: string, prompt: string): Promise<EditedImage> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                { inlineData: { data: base64Frame, mimeType: 'image/jpeg' } },
                { text: prompt },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE, Modality.TEXT],
        },
    });

    let editedImageData = '';
    let commentary = 'No commentary provided.';

    if (response.candidates && response.candidates.length > 0) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                editedImageData = part.inlineData.data;
            } else if (part.text) {
                commentary = part.text;
            }
        }
    }

    if (!editedImageData) {
        throw new Error("AI did not return an edited image.");
    }

    return { imageData: editedImageData, commentary };
}

/**
 * Generates a short video clip from a text prompt using 'veo-2.0-generate-001'.
 */
export async function generateVideo(prompt: string, onProgress: (message: string) => void): Promise<GeneratedVideo> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    onProgress("Sending generation request...");
    let operation = await ai.models.generateVideos({
        model: 'veo-2.0-generate-001',
        prompt: prompt,
        config: {
            numberOfVideos: 1,
        }
    });

    const reassuringMessages = [
        "The AI is dreaming up your scene...",
        "Rendering photons and pixels...",
        "This can take a few minutes, good things come to those who wait.",
        "Compositing the final shot...",
    ];
    let messageIndex = 0;

    onProgress(reassuringMessages[messageIndex++]);
    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000)); // Poll every 10 seconds
        onProgress(reassuringMessages[messageIndex++ % reassuringMessages.length]);
        operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    onProgress("Downloading generated video...");
    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        throw new Error("Video generation succeeded, but no download link was provided.");
    }
    
    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    if (!response.ok) {
        throw new Error(`Failed to download the video. Status: ${response.statusText}`);
    }

    const videoBlob = await response.blob();
    const videoUrl = URL.createObjectURL(videoBlob);
    
    return { videoUrl };
}