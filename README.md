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

### 👋 Live Camera Hand Tracking & Gesture Recognition
- **MediaPipe Hands** for real-time computer vision with 21-point hand landmark detection
- **Live Camera Feed**: Visual overlay showing tracked hand landmarks in real-time
- **Gesture Controls**:
  - ✌️ 2 Fingers Up → Flower shape
  - 🤟 3 Fingers Up → Saturn shape
  - 🤘 4 Fingers Up → Heart shape
  - ✋ 5 Fingers (Open Hand) → Fireworks shape
  - 🤏 Pinch (Thumb + Index) → Attract particles
- **Smart Detection**: 15-frame confidence threshold prevents jitter
- **3D Position Tracking**: Index finger tip controls interaction point in 3D space
- **Camera Controls**: Toggle camera on/off, show/hide feed, visual tracking indicators
- **Mouse/Touch Fallback**: Automatic fallback when camera unavailable or disabled

### 🔊 Generative Audio (Web Audio API)
- **Ambient Drone**: Continuous 55Hz sine wave oscillator
- **Dynamic Modulation**: 
  - Volume increases with interaction intensity
  - Low-pass filter opens for brighter sound
  - Pitch rises during active interaction
- **Procedural Whoosh**: Bandpass-filtered white noise on shape changes

### 🎮 User Interface
- **Start Screen**: Permission-aware overlay for AudioContext and camera
- **Gesture HUD**: Real-time feedback of detected gestures and tracking status
- **Live Camera Feed**: Resizable video preview with hand landmark overlay (320x240)
  - Visual hand skeleton with green lines connecting 21 landmarks
  - Red dots for all hand points, yellow highlights for thumb/index tips
  - Real-time tracking status indicator (TRACKING/SEARCHING)
  - Toggle visibility controls
- **Camera Controls**: Top-right camera button to enable/disable tracking
- **Manual Controls**: Button panel for direct shape selection
- **Help Modal**: Interactive gesture guide with camera usage instructions
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
- **Enable/Disable**: Click camera button (top-right) to toggle tracking
- **Grant Permission**: Allow camera access when prompted by browser
- **Hand Gestures**: Use gestures to control particle shapes (see above)
- **Hand Movement**: Move your hand to interact with particles in 3D space
- **Pinch**: Bring thumb and index finger together to attract particles
- **Visual Feedback**: Watch hand landmarks overlay on camera feed
- **Hide/Show Feed**: Use X button or camera icon to toggle feed visibility

### Mouse/Touch Mode (Fallback)
- **Automatic**: Activates when camera is disabled or unavailable
- **Move**: Cursor/finger position controls interaction point
- **Click/Hold**: Attract particles (simulates pinch gesture)
- **Hover**: Creates gentle swirl effect around cursor

### Camera Tracking Features
- **Real-time Hand Detection**: 21-point landmark tracking at high FPS
- **Visual Skeleton**: Green lines showing hand structure
- **Status Indicators**: Live tracking status display
- **Landmark Highlights**: Yellow circles on thumb and index finger tips
- **Gesture Smoothing**: 15-frame threshold for stable detection

For detailed camera tracking information, see [CAMERA_TRACKING_GUIDE.md](CAMERA_TRACKING_GUIDE.md)

## License

Created by MUNEEB REHMAN. All rights reserved.
