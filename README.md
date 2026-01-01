# MUNA Hand Control 3D

**Created by MUNEEB REHMAN**  
Version: 1.0  
Type: Interactive 3D Experience / Creative Coding

## Overview

MUNA Hand Control is a real-time, cinematic 3D particle system that combines computer vision, generative audio, and interactive design to create an immersive "magical" interface. The application uses webcam-based hand tracking to recognize gestures that control different particle formations, with fallback support for mouse/touch interaction.

## Features

### 🎨 3D Visualization (Three.js)
- **15,000 GPU-accelerated particles** rendered using THREE.Points for optimal performance
- **5 Dynamic Shapes** with smooth morphing transitions:
  - Sphere: Equidistant spherical distribution
  - Heart: Parametric heart shape with depth
  - Flower: Mathematical rose curve
  - Saturn: Central sphere with tilted ring
  - Fireworks: Explosive spherical burst
- **Visual Effects**:
  - Additive blending for glowing particles
  - Dynamic HSL color shifting based on position and time
  - Continuous global rotation

### 👋 Hand Tracking & Gesture Recognition
- **MediaPipe Hands** for real-time computer vision
- **Gesture Controls**:
  - ✌️ 2 Fingers Up → Flower shape
  - 🤟 3 Fingers Up → Saturn shape
  - 🤘 4 Fingers Up → Heart shape
  - ✋ 5 Fingers (Open Hand) → Fireworks shape
  - 🤏 Pinch (Thumb + Index) → Attract particles
- **Smart Detection**: 15-frame confidence threshold prevents jitter
- **3D Position Tracking**: Index finger tip controls interaction point
- **Mouse/Touch Fallback**: Automatic fallback when camera unavailable

### 🔊 Generative Audio (Web Audio API)
- **Ambient Drone**: Continuous 55Hz sine wave oscillator
- **Dynamic Modulation**: 
  - Volume increases with interaction intensity
  - Low-pass filter opens for brighter sound
  - Pitch rises during active interaction
- **Procedural Whoosh**: Bandpass-filtered white noise on shape changes

### 🎮 User Interface
- **Start Screen**: Permission-aware overlay for AudioContext and camera
- **Gesture HUD**: Real-time feedback of detected gestures
- **Camera Preview**: Live feed with blur effect when hand detected
- **Manual Controls**: Button panel for direct shape selection
- **Help Modal**: Interactive gesture guide with emojis
- **Responsive Design**: Adapts to window resize

## Technology Stack

- **Framework**: Next.js 16 with React 19
- **3D Engine**: Three.js
- **Computer Vision**: @mediapipe/hands
- **Styling**: Tailwind CSS 4
- **Icons**: Lucide React
- **TypeScript**: Full type safety

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
npm start
```

## Browser Compatibility

- **Chrome/Edge**: Full support (recommended)
- **Firefox**: Full support
- **Safari**: Full support (requires user gesture for audio)

## Privacy

All camera data is processed **locally on the client device**. No video streams are sent to any server.

## Performance

- Targets 60 FPS
- GPU-accelerated particle rendering
- Optimized animation loop with `requestAnimationFrame`
- Proper memory management with cleanup on unmount

## Controls

### Camera Mode (Primary)
- Use hand gestures to control particle shapes
- Move your hand to interact with particles
- Pinch thumb and index finger together to attract particles

### Mouse/Touch Mode (Fallback)
- Move cursor/finger to interact with particles
- Click/hold to attract particles (simulates pinch)
- Hover for gentle swirl effect

## License

Created by MUNEEB REHMAN. All rights reserved.
