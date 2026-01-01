# Live Camera Hand Tracking Guide

## Overview

The MUNA Hand Control application now includes **live camera hand tracking** capabilities that allow you to control the 3D particle system using hand gestures captured through your webcam.

## Features

### 1. Real-Time Hand Detection
- Uses MediaPipe Hands for accurate hand landmark detection
- Tracks 21 hand landmarks in real-time
- Processes video at high frame rates for smooth interaction

### 2. Visual Hand Tracking Display
- **Live Camera Feed**: A resizable camera preview (320x240) displayed in the bottom-right corner
- **Hand Landmarks Overlay**: Green lines and red dots showing all 21 hand landmarks
- **Tracking Status**: Real-time indicator showing "TRACKING" (green) or "SEARCHING" (red)
- **Highlighted Points**: Thumb tip (landmark 4) and Index finger tip (landmark 8) are highlighted with yellow circles

### 3. Camera Controls

#### Toggle Camera On/Off
- **Location**: Top-right corner of the screen
- **Button**: Camera icon button
- **States**:
  - **Active** (Green): Camera is on and tracking hands
  - **Inactive** (White): Camera is off, using mouse/touch mode

#### Show/Hide Camera Feed
- **Hide Button**: X button in top-right of camera feed
- **Show Button**: Camera icon button (bottom-right when feed is hidden)

### 4. Hand Gestures Detected

The system recognizes the following hand gestures:

1. **2 Fingers Up** ✌️ → Flower Shape
2. **3 Fingers Up** 🤟 → Saturn Shape  
3. **4 Fingers Up** 🤘 → Heart Shape
4. **5 Fingers Up** ✋ → Fireworks Shape
5. **Pinch** 🤏 (Thumb + Index together) → Attract Particles

### 5. Hand Position Tracking

- **Index Finger Tip** controls the 3D interaction point
- **Pinch Gesture** (thumb and index close together) attracts particles
- **Open Hand** creates a gentle swirl effect around your hand

## How to Use

### Starting Camera Tracking

1. Click "Enter Experience" to start the application
2. **Grant camera permission** when prompted by your browser
3. The camera will automatically initialize and start tracking
4. Position your hand in front of the camera (within frame)

### Status Messages

The top center of the screen shows real-time status:

- `REQUESTING CAMERA ACCESS...` - Waiting for permission
- `INITIALIZING HAND TRACKING...` - Loading MediaPipe models
- `CAMERA ACTIVE - Show your hand` - Ready to track
- `TRACKING` - Hand detected and being tracked
- `SEARCHING` - Looking for hand in frame
- `CAMERA DISABLED - Using Mouse/Touch` - Camera turned off
- `CAMERA ACCESS DENIED - Using Mouse/Touch` - Permission denied
- `NO CAMERA FOUND - Using Mouse/Touch` - No camera device detected

### Toggling Between Camera and Mouse Mode

#### Switch to Mouse Mode:
1. Click the camera button (top-right, green when active)
2. Camera will stop and mouse/touch control activates

#### Switch Back to Camera Mode:
1. Click the camera button again (top-right, white when inactive)
2. Camera permission may be requested again
3. Hand tracking resumes

### Camera Feed Controls

#### To Hide Camera Feed:
- Click the X button in top-right corner of the feed
- Feed is hidden but tracking continues

#### To Show Camera Feed:
- Click the camera icon button in bottom-right corner

## Technical Details

### Hand Landmarks

The system tracks 21 3D landmarks per hand:

```
Landmarks (0-20):
- 0: Wrist
- 1-4: Thumb (base to tip)
- 5-8: Index finger (base to tip)
- 9-12: Middle finger (base to tip)
- 13-16: Ring finger (base to tip)
- 17-20: Pinky finger (base to tip)
```

### Gesture Detection Algorithm

- **Finger Counting**: Detects extended fingers by comparing tip positions to middle joint positions
- **Smoothing**: Uses 15-frame threshold to prevent gesture jitter
- **Confidence**: Only triggers shape changes when gesture is stable

### Performance Optimization

- **Model Complexity**: Set to 1 (balanced performance)
- **Detection Confidence**: 0.5 minimum
- **Tracking Confidence**: 0.5 minimum
- **Video Resolution**: 640x480 for optimal performance

## Browser Compatibility

### Recommended Browsers:
- **Chrome/Edge**: Full support (best performance)
- **Firefox**: Full support
- **Safari**: Full support (may require HTTPS)

### Camera Permissions:
- First-time use requires granting camera permission
- Permission can be managed in browser settings
- HTTPS is required for camera access in most browsers

## Troubleshooting

### Camera Not Working

**Issue**: "CAMERA ACCESS DENIED"
- **Solution**: Check browser permissions and allow camera access
- Go to browser settings → Site permissions → Camera

**Issue**: "NO CAMERA FOUND"
- **Solution**: Ensure camera is connected and not in use by another app
- Check device manager / system preferences

**Issue**: "MEDIAPIPE NOT LOADED"
- **Solution**: Refresh the page and wait for scripts to load
- Check internet connection (MediaPipe loads from CDN)

### Hand Not Detected

**Issue**: Hand in frame but status shows "SEARCHING"
- **Solution**: 
  - Ensure good lighting conditions
  - Keep hand clearly visible (not too close or far)
  - Show full hand including palm
  - Avoid complex backgrounds

**Issue**: Gestures not triggering shapes
- **Solution**:
  - Hold gesture steady for ~1 second
  - Ensure fingers are clearly extended
  - Face palm toward camera

### Performance Issues

**Issue**: Low frame rate or lag
- **Solution**:
  - Close other applications using camera
  - Reduce browser tab count
  - Toggle camera feed off (tracking continues)
  - Use mouse/touch mode instead

## Privacy & Security

- **All processing is done locally** in your browser
- **No video data is sent to any server**
- **Camera stream is not recorded**
- **No personal data is collected**
- MediaPipe models are loaded from CDN but processing is client-side

## Tips for Best Experience

1. **Lighting**: Use well-lit environment for better detection
2. **Background**: Plain backgrounds work best
3. **Distance**: Keep hand 1-2 feet from camera
4. **Gesture Duration**: Hold gestures for 1-2 seconds
5. **Camera Feed**: Hide feed for better particle visibility
6. **Fallback**: Use mouse/touch mode if camera isn't working well

## Keyboard Shortcuts (Future Enhancement)

Currently not implemented, but planned:
- `C` - Toggle camera on/off
- `V` - Toggle camera feed visibility
- `H` - Show/hide help modal

## API Reference

### Camera Functions

```typescript
// Toggle camera tracking
toggleCamera(): Promise<void>

// Initialize MediaPipe Hands
initMediaPipe(): Promise<void>

// Process hand tracking results
onHandResults(results: MediaPipeResults): void

// Draw hand landmarks on canvas
drawHandLandmarks(landmarks: MediaPipeLandmark[]): void
```

### State Variables

```typescript
cameraActive: boolean        // Camera stream active
handDetected: boolean        // Hand currently detected
showCameraFeed: boolean      // Camera feed visible
detectedGesture: string      // Current gesture/status message
```

## Support

For issues or questions:
1. Check browser console for error messages
2. Review this guide
3. Try mouse/touch mode as fallback
4. Ensure camera permissions are granted

---

**Version**: 1.0  
**Created by**: MUNEEB REHMAN  
**Technology**: MediaPipe Hands + Three.js + React
