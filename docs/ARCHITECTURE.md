
# Application Architecture

## 1. High-Level Overview

The Interactive Scene Visualizer is a client-side Single Page Application (SPA) built with React and TypeScript. Its architecture is designed around a centralized state management model within the main `App` component, which promotes a clear, unidirectional data flow.

The core of the application is a container-component pattern. The `App` component acts as the primary container, fetching data (currently from `constants.ts`), managing all application state, and handling business logic, including calls to the Google Gemini API. It then passes this data and logic down to presentational components responsible for rendering the UI.

## 2. Component Breakdown

- **`App.tsx` (Container Component)**
  - **Role**: The root of the application.
  - **Responsibilities**:
    - Manages all primary state: `currentTime`, `isPlaying`, AI analysis results (`sceneAnalysis`, `cinematicAnalysis`, `sceneReconstruction`), UI visibility toggles (`showBlocking`, etc.).
    - Contains all logic for interacting with the Google Gemini API, including capturing video frames and parsing responses.
    - Interpolates data based on `currentTime` to derive the current positions of characters and the camera.
    - Passes state and callback functions down to child components as props.

- **`VideoPlayer.tsx` (Presentational Component)**
  - **Role**: Displays the video and the real-time SVG overlay.
  - **Responsibilities**:
    - Renders the `<video>` element.
    - Renders an `<svg>` overlay with paths (`<polyline>`) and markers (`<circle>`, `<rect>`) for characters and the camera.
    - Receives all positional data as props and is not responsible for calculating it.

- **`PlaybackControls.tsx` (Presentational Component)**
  - **Role**: Provides UI for video playback control.
  - **Responsibilities**:
    - Renders the play/pause button and a scrubbable timeline.
    - Listens for user interactions (clicks, drags) and invokes callback functions (`togglePlay`, `onScrub`) passed from `App.tsx`.

- **`DataPanel.tsx` (Presentational Component)**
  - **Role**: The main sidebar for displaying data and triggering AI analyses.
  - **Responsibilities**:
    - Renders UI toggles for data layers (blocking, camera, etc.).
    - Renders buttons to initiate AI analysis functions.
    - Displays loading/error states for AI processes.
    - Renders the results of AI analyses, often by delegating to specialized child components (`Scene3DView`, `PointCloudViewer`).
    - Renders `TimelineGraph` components for emotion and camera data.

- **`TimelineGraph.tsx` (Reusable Component)**
  - **Role**: Displays a single line graph over time.
  - **Responsibilities**:
    - Renders an SVG graph based on a dataset.
    - Shows a vertical line indicating the `currentTime`.
    - Displays the current interpolated value and label for the data.

- **`Scene3DView.tsx` (Specialized Component)**
  - **Role**: Visualizes the AI-generated scene layout.
  - **Responsibilities**:
    - Renders a 2D, top-down view of actors, props, and lights on a grid.
    - Handles selection of individual items and displays their properties in an info panel.
    - Allows toggling the visibility of certain element types (lights, camera).

- **`PointCloudViewer.tsx` (Specialized Component)**
  - **Role**: Renders the 3D scene reconstruction.
  - **Responsibilities**:
    - Manages a Three.js scene, camera, and renderer.
    - Converts the point cloud data into a `THREE.Points` object.
    - Implements `OrbitControls` for user interaction (rotate, zoom, pan).

## 3. State Management and Data Flow

The application follows a **unidirectional data flow**:

1.  **State Lives in `App.tsx`**: All authoritative state is held within the `App` component using `useState` hooks.
2.  **Data Flows Down**: State is passed down to child components via props. For example, `VideoPlayer` receives `characterPositions` and `DataPanel` receives `sceneAnalysis`.
3.  **Events Flow Up**: Child components communicate with the parent by calling functions passed down as props. For example, when a user clicks the play button in `PlaybackControls`, it calls the `togglePlay` function owned by `App.tsx`.
4.  **State is Updated**: The `togglePlay` function in `App` updates its `isPlaying` state.
5.  **UI Re-renders**: React re-renders the `App` component and its children with the new state, causing the UI to update.

This approach keeps the application predictable and easier to debug, as state changes are managed in a single, centralized location.
