
# Data Structures & Types API

This document provides a reference for the core data structures used throughout the Interactive Scene Visualizer application, as defined in `types.ts`.

---

## 1. Core Scene Data (`SceneData`)

This is the main object that describes a scene's pre-analyzed data.

```typescript
interface SceneData {
    videoUrl: string;
    duration: number;
    characters: Character[];
    camera: CameraData;
}
```

-   **`videoUrl`**: The URL of the video file for the scene.
-   **`duration`**: The total duration of the video in seconds.
-   **`characters`**: An array of `Character` objects.
-   **`camera`**: A `CameraData` object describing camera movement.

---

## 2. Character Data

Describes a single character, including their blocking path and emotional arc.

```typescript
interface Character {
    id: string;
    name: string;
    color: string;      // Tailwind CSS background color class
    pathColor: string;  // Hex color for SVG paths
    blocking: BlockingKeyframe[];
    emotion: EmotionKeyframe[];
}
```

### Keyframes

-   **`BlockingKeyframe`**: A point in time defining a character's position on a 2D plane.
    -   `time`: `number` (seconds)
    -   `x`: `number` (percentage, 0-100)
    -   `y`: `number` (percentage, 0-100)

-   **`EmotionKeyframe`**: A point in time defining a character's emotional state.
    -   `time`: `number` (seconds)
    -   `intensity`: `number` (0.0 to 1.0)
    -   `label`: `string` (e.g., "Happy", "Anxious")

---

## 3. Camera Data

Describes the camera's movement and properties over time.

```typescript
interface CameraData {
    movement: CameraKeyframe[];
}

interface CameraKeyframe {
    time: number;
    x: number;
    y: number;
    complexity: number; // 0.0 to 1.0, e.g., for shake or zoom intensity
    label: string;      // Descriptive label, e.g., "Slow Pan"
}
```

---

## 4. AI Analysis Data Structures

These types define the structure of the JSON responses expected from the Google Gemini API.

### Vector3

A reusable object for representing a 3D coordinate.
- `x`, `y`, `z`: `number`

### Scene Analysis (`SceneAnalysis`)

The complete analysis of a scene's layout at a specific moment.

```typescript
interface SceneAnalysis {
    actors: ActorAnalysis[];
    camera: CameraAnalysis;
    lights: LightAnalysis[];
    props: PropAnalysis[];
    environmentDescription: string;
    overallMood: string;
}
```

-   **`ActorAnalysis`**: `{ name: string; position: Vector3; emotion: string; interaction: string | null; }`
-   **`CameraAnalysis`**: `{ position: Vector3; }`
-   **`LightAnalysis`**: `{ type: string; position: Vector3; intensity: number; }`
-   **`PropAnalysis`**: `{ name: string; position: Vector3; }`
-   **`environmentDescription`**: A textual description of the setting.
-   **`overallMood`**: A textual description of the scene's emotional tone.

### Cinematic Analysis (`CinematicAnalysis`)

A breakdown of the filmic properties of a single frame.

```typescript
interface CinematicAnalysis {
    shotComposition: string;
    colorPalette: string;
    cameraWork: string;
}
```

### 3D Scene Reconstruction (`SceneReconstruction`)

The data required to render a 3D point cloud of the scene.

```typescript
interface SceneReconstruction {
    pointCloud: PointCloudPoint[];
    cameraPoses: CameraPose[];
}
```

-   **`PointCloudPoint`**: Describes a single point in the cloud.
    -   `position`: `Vector3`
    -   `color`: `string` (Hex color, e.g., "#RRGGBB")
-   **`CameraPose`**: Describes a camera's position and orientation for one of the source frames.
    -   `position`: `Vector3`
    -   `orientation`: `{ x, y, z, w }` (A quaternion)
