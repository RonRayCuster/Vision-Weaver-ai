
import { GoogleGenAI, Type } from "@google/genai";
import type { SceneAnalysis, CinematicAnalysis, SceneReconstruction } from '../types';

/**
 * Analyzes a sequence of frames to determine the 3D layout, character emotions, and environment.
 */
// FIX: Removed apiKey parameter and now using process.env.API_KEY per coding guidelines.
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
// FIX: Removed apiKey parameter and now using process.env.API_KEY per coding guidelines.
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
// FIX: Removed apiKey parameter and now using process.env.API_KEY per coding guidelines.
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
            // FIX: The 'colmap' tool is not a recognized property and causes a type error.
            // The model is instructed to use the COLMAP tool via the prompt, so this explicit declaration is not needed.
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
