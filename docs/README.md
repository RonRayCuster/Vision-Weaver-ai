
# VISIONWEAVERSTUDIO Interactive Scene Visualizer

## 1. Overview

The Interactive Scene Visualizer is an advanced web-based dashboard for film and animation professionals. It provides a powerful toolset to analyze and visualize complex scene data by synchronizing it with video playback. Users can explore character blocking, emotional arcs, and camera dynamics through an intuitive interface that includes a real-time SVG overlay, detailed timeline graphs, and a 3D scene representation.

The application leverages the Google Gemini API to perform cutting-edge AI analysis directly from video frames, offering deep insights into scene composition, mood, and 3D spatial layout.

## 2. Features

- **Synchronized Video Playback**: A core video player with standard playback controls and a scrubbable timeline.
- **Real-time SVG Overlay**: Visualize character blocking paths and camera movements directly on top of the video player.
- **Interactive Data Layers**: Toggle the visibility of different data layers (Blocking, Camera Path, Emotion Curves) to focus the analysis.
- **Dynamic Timeline Graphs**: View emotional intensity and camera complexity over time, with the current value highlighted as the video plays.
- **AI-Powered Scene Analysis**:
    - **Scene Layout Generation**: At any point in the video, generate a top-down 2D schematic of the scene, identifying actors, props, and lights.
    - **Cinematic Analysis**: Get a detailed breakdown of the current frame's composition, color palette, and inferred camera work.
    - **3D Scene Reconstruction**: Generate a 3D point cloud of the scene from a short sequence of frames for spatial analysis.
- **Interactive 3D Views**:
    - **Scene3DView**: Inspect individual elements (actors, props, lights) in the generated 2D layout to see detailed properties.
    - **PointCloudViewer**: Explore the reconstructed 3D point cloud with orbit controls.
- **Responsive Design**: A clean, modern UI built with Tailwind CSS that works on different screen sizes.

## 3. Tech Stack

- **Frontend Framework**: React
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **3D Graphics**: Three.js (for the Point Cloud Viewer)
- **AI Integration**: Google Gemini API (`@google/genai`)

## 4. Project Structure

```
.
├── components/               # Reusable React components
│   ├── DataPanel.tsx         # Main sidebar with controls and analysis results
│   ├── PlaybackControls.tsx  # Play/pause button and timeline
│   ├── PointCloudViewer.tsx  # 3D point cloud renderer
│   ├── Scene3DView.tsx       # 2D top-down view of the scene
│   ├── TimelineGraph.tsx     # Graph for emotion/camera data
│   └── VideoPlayer.tsx       # Video element with SVG overlay
├── utils/                    # Utility functions
│   └── interpolation.ts      # Functions for interpolating data between keyframes
├── App.tsx                   # Main application component, manages state and logic
├── constants.ts              # Static scene data (blocking, emotion, etc.)
├── index.html                # Entry point HTML file
├── index.tsx                 # React application entry point
├── metadata.json             # Application metadata
└── types.ts                  # TypeScript type definitions for all data structures
```
