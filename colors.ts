/**
 * Vision Weaver UI Palette: The Weaver's Eye
 * A professional, focused, dark-themed UI color palette.
 */
export const colors = {
    // Core Brand Colors
    primary: '#202124',      // PANTONE Black 6 C, Main background
    'secondary-accent': '#C3893F', // PANTONE 7557 C, Special highlights
    accent: '#009BBA',       // PANTONE 3125 C, Interactive elements

    // UI Neutrals
    surface: '#303134',      // Elevated surfaces (sidebars, modals)
    'text-primary': '#F1F3F4', // Main text, light gray
    'text-secondary': '#9AA0A6',// Secondary text, placeholders
    border: '#4E5054',       // Borders and dividers

    // System Colors
    success: '#1E8E3E',      // PANTONE 7731 C, Success notifications
    warning: '#F9AB00',      // PANTONE 1375 C, Warnings, in-progress
    error: '#D93025',        // PANTONE 199 C, Errors, destructive actions
};

// --- Perceptually Uniform Color Scale (Viridis-like) ---

// Helper to interpolate between two numbers
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// Helper to convert hex to RGB
const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
};

// Helper to convert RGB to Hex
const rgbToHex = (r: number, g: number, b: number) => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

// Color stops for the Viridis-like gradient
const viridisStops = [
    { pos: 0.0, hex: '#440154' }, // Purple
    { pos: 0.25, hex: '#3b528b' }, // Blue
    { pos: 0.5, hex: '#21918c' }, // Teal
    { pos: 0.75, hex: '#5ec962' }, // Green
    { pos: 1.0, hex: '#fde725' }  // Yellow
].map(stop => ({ pos: stop.pos, rgb: hexToRgb(stop.hex) }));


/**
 * Calculates a color based on emotional intensity using a perceptually uniform scale.
 * @param intensity A number from 0 (calm) to 1 (intense).
 * @returns A hex color string from a Viridis-like color map.
 */
export const getEmotionColor = (intensity: number): string => {
    const clampedIntensity = Math.max(0, Math.min(1, intensity));

    if (clampedIntensity <= 0) return rgbToHex(viridisStops[0].rgb.r, viridisStops[0].rgb.g, viridisStops[0].rgb.b);
    if (clampedIntensity >= 1) {
        const lastStop = viridisStops[viridisStops.length - 1];
        return rgbToHex(lastStop.rgb.r, lastStop.rgb.g, lastStop.rgb.b);
    }

    for (let i = 0; i < viridisStops.length - 1; i++) {
        const start = viridisStops[i];
        const end = viridisStops[i + 1];

        if (clampedIntensity >= start.pos && clampedIntensity <= end.pos) {
            const t = (clampedIntensity - start.pos) / (end.pos - start.pos);
            
            const r = Math.round(lerp(start.rgb.r, end.rgb.r, t));
            const g = Math.round(lerp(start.rgb.g, end.rgb.g, t));
            const b = Math.round(lerp(start.rgb.b, end.rgb.b, t));
            
            return rgbToHex(r, g, b);
        }
    }
    
    const lastStop = viridisStops[viridisStops.length - 1];
    return rgbToHex(lastStop.rgb.r, lastStop.rgb.g, lastStop.rgb.b); // Fallback
};