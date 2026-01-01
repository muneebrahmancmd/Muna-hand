'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Camera, Heart, Flower2, Star, Sparkles, HelpCircle, X } from 'lucide-react';

// TypeScript declarations for MediaPipe
interface MediaPipeHands {
  setOptions: (options: {
    maxNumHands: number;
    modelComplexity: number;
    minDetectionConfidence: number;
    minTrackingConfidence: number;
  }) => void;
  onResults: (callback: (results: MediaPipeResults) => void) => void;
  send: (config: { image: HTMLVideoElement }) => Promise<void>;
}

interface MediaPipeLandmark {
  x: number;
  y: number;
  z: number;
}

interface MediaPipeResults {
  multiHandLandmarks?: MediaPipeLandmark[][];
}

declare global {
  interface Window {
    Hands: new (config: { locateFile: (file: string) => string }) => MediaPipeHands;
  }
}

// Shape types
type ShapeType = 'sphere' | 'heart' | 'flower' | 'saturn' | 'fireworks';

// Audio context and nodes
interface AudioNodes {
  context: AudioContext;
  drone: OscillatorNode;
  droneGain: GainNode;
  filter: BiquadFilterNode;
}

export default function HandControl3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const handCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isStarted, setIsStarted] = useState(false);
  const [currentShape, setCurrentShape] = useState<ShapeType>('sphere');
  const [detectedGesture, setDetectedGesture] = useState<string>('WAITING FOR INPUT');
  const [cameraActive, setCameraActive] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [handDetected, setHandDetected] = useState(false);
  const [showCameraFeed, setShowCameraFeed] = useState(true);
  
  // Refs for Three.js and MediaPipe
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const handsRef = useRef<MediaPipeHands | null>(null);
  const audioNodesRef = useRef<AudioNodes | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  
  // Interaction state
  const interactionRef = useRef({
    position: new THREE.Vector3(0, 0, 5),
    isPinching: false,
    intensity: 0,
  });
  
  // Gesture tracking
  const gestureFramesRef = useRef({
    current: 'none',
    frames: 0,
    threshold: 15,
  });

  // Particle data
  const particleDataRef = useRef({
    positions: new Float32Array(15000 * 3),
    targetPositions: new Float32Array(15000 * 3),
    velocities: new Float32Array(15000 * 3),
    colors: new Float32Array(15000 * 3),
  });

  // Initialize audio
  const initAudio = () => {
    if (audioNodesRef.current) return;
    
    const context = new AudioContext();
    const drone = context.createOscillator();
    const droneGain = context.createGain();
    const filter = context.createBiquadFilter();
    
    drone.type = 'sine';
    drone.frequency.value = 55; // A1
    
    filter.type = 'lowpass';
    filter.frequency.value = 200;
    filter.Q.value = 1;
    
    droneGain.gain.value = 0.05;
    
    drone.connect(filter);
    filter.connect(droneGain);
    droneGain.connect(context.destination);
    
    drone.start();
    
    audioNodesRef.current = { context, drone, droneGain, filter };
  };

  // Update audio based on interaction
  const updateAudio = (intensity: number) => {
    if (!audioNodesRef.current) return;
    
    const { droneGain, filter, drone } = audioNodesRef.current;
    const targetVolume = 0.05 + intensity * 0.15;
    const targetFilter = 200 + intensity * 800;
    const targetFreq = 55 + intensity * 20;
    
    droneGain.gain.linearRampToValueAtTime(targetVolume, audioNodesRef.current.context.currentTime + 0.1);
    filter.frequency.linearRampToValueAtTime(targetFilter, audioNodesRef.current.context.currentTime + 0.1);
    drone.frequency.linearRampToValueAtTime(targetFreq, audioNodesRef.current.context.currentTime + 0.1);
  };

  // Play whoosh sound on shape change
  const playWhoosh = () => {
    if (!audioNodesRef.current) return;
    
    const { context } = audioNodesRef.current;
    const noise = context.createBufferSource();
    const noiseBuffer = context.createBuffer(1, context.sampleRate * 0.5, context.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    
    for (let i = 0; i < output.length; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    
    noise.buffer = noiseBuffer;
    
    const bandpass = context.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 1000;
    bandpass.Q.value = 1;
    
    const gainNode = context.createGain();
    gainNode.gain.value = 0.2;
    gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.5);
    
    noise.connect(bandpass);
    bandpass.connect(gainNode);
    gainNode.connect(context.destination);
    
    noise.start();
    noise.stop(context.currentTime + 0.5);
  };

  // Generate particle positions for different shapes
  const generateShape = (shape: ShapeType) => {
    const positions = particleDataRef.current.targetPositions;
    const count = 15000;
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      switch (shape) {
        case 'sphere': {
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(Math.random() * 2 - 1);
          const radius = 3 + Math.random() * 0.5;
          
          positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
          positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
          positions[i3 + 2] = radius * Math.cos(phi);
          break;
        }
        
        case 'heart': {
          const t = Math.random() * Math.PI * 2;
          const scale = 2;
          const x = scale * (16 * Math.pow(Math.sin(t), 3));
          const y = scale * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
          const z = (Math.random() - 0.5) * 2;
          
          positions[i3] = x * 0.15;
          positions[i3 + 1] = y * 0.15;
          positions[i3 + 2] = z;
          break;
        }
        
        case 'flower': {
          const theta = Math.random() * Math.PI * 2;
          const k = 5; // number of petals
          const radius = 3 * Math.cos(k * theta) + Math.random() * 0.5;
          const height = (Math.random() - 0.5) * 2;
          
          positions[i3] = radius * Math.cos(theta);
          positions[i3 + 1] = radius * Math.sin(theta);
          positions[i3 + 2] = height;
          break;
        }
        
        case 'saturn': {
          if (i < count * 0.4) {
            // Central sphere
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(Math.random() * 2 - 1);
            const radius = 2 + Math.random() * 0.3;
            
            positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i3 + 2] = radius * Math.cos(phi);
          } else {
            // Ring
            const theta = Math.random() * Math.PI * 2;
            const radius = 4 + Math.random() * 1.5;
            const tilt = Math.PI / 6;
            
            const x = radius * Math.cos(theta);
            const y = radius * Math.sin(theta) * Math.cos(tilt);
            const z = radius * Math.sin(theta) * Math.sin(tilt) + (Math.random() - 0.5) * 0.2;
            
            positions[i3] = x;
            positions[i3 + 1] = y;
            positions[i3 + 2] = z;
          }
          break;
        }
        
        case 'fireworks': {
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(Math.random() * 2 - 1);
          const velocity = 2 + Math.random() * 3;
          
          positions[i3] = Math.sin(phi) * Math.cos(theta) * velocity;
          positions[i3 + 1] = Math.sin(phi) * Math.sin(theta) * velocity;
          positions[i3 + 2] = Math.cos(phi) * velocity;
          break;
        }
      }
    }
  };

  // Initialize Three.js scene
  const initThreeScene = () => {
    if (!canvasRef.current) return;
    
    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    sceneRef.current = scene;
    
    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 10;
    cameraRef.current = camera;
    
    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    rendererRef.current = renderer;
    
    // Particle geometry
    const geometry = new THREE.BufferGeometry();
    const positions = particleDataRef.current.positions;
    const colors = particleDataRef.current.colors;
    
    // Initialize positions
    generateShape('sphere');
    for (let i = 0; i < 15000 * 3; i++) {
      positions[i] = particleDataRef.current.targetPositions[i];
    }
    
    // Initialize colors
    for (let i = 0; i < 15000; i++) {
      const i3 = i * 3;
      const hue = Math.random();
      const color = new THREE.Color().setHSL(hue, 1, 0.5);
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    // Particle material
    const material = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.8,
    });
    
    // Points
    const particles = new THREE.Points(geometry, material);
    scene.add(particles);
    particlesRef.current = particles;
    
    // Handle window resize
    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;
      
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  };

  // Animation loop
  const animate = (currentTime: number) => {
    if (!sceneRef.current || !cameraRef.current || !rendererRef.current || !particlesRef.current) return;
    
    if (startTimeRef.current === 0) {
      startTimeRef.current = currentTime;
    }
    
    const positions = particleDataRef.current.positions;
    const targetPositions = particleDataRef.current.targetPositions;
    const velocities = particleDataRef.current.velocities;
    const colors = particleDataRef.current.colors;
    const geometry = particlesRef.current.geometry;
    
    const interaction = interactionRef.current;
    const time = (currentTime - startTimeRef.current) * 0.001;
    
    // Update particles
    for (let i = 0; i < 15000; i++) {
      const i3 = i * 3;
      
      // Lerp to target position
      const lerpFactor = 0.05;
      positions[i3] += (targetPositions[i3] - positions[i3]) * lerpFactor;
      positions[i3 + 1] += (targetPositions[i3 + 1] - positions[i3 + 1]) * lerpFactor;
      positions[i3 + 2] += (targetPositions[i3 + 2] - positions[i3 + 2]) * lerpFactor;
      
      // Interaction force
      if (interaction.isPinching) {
        const dx = interaction.position.x - positions[i3];
        const dy = interaction.position.y - positions[i3 + 1];
        const dz = interaction.position.z - positions[i3 + 2];
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        if (distance < 5) {
          const force = (1 - distance / 5) * 0.2;
          velocities[i3] += dx * force;
          velocities[i3 + 1] += dy * force;
          velocities[i3 + 2] += dz * force;
        }
      } else {
        // Gentle swirl
        const dx = interaction.position.x - positions[i3];
        const dy = interaction.position.y - positions[i3 + 1];
        const dz = interaction.position.z - positions[i3 + 2];
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        if (distance < 3) {
          const force = (1 - distance / 3) * 0.02;
          velocities[i3] += -dy * force;
          velocities[i3 + 1] += dx * force;
        }
      }
      
      // Apply velocity
      positions[i3] += velocities[i3];
      positions[i3 + 1] += velocities[i3 + 1];
      positions[i3 + 2] += velocities[i3 + 2];
      
      // Damping
      velocities[i3] *= 0.95;
      velocities[i3 + 1] *= 0.95;
      velocities[i3 + 2] *= 0.95;
      
      // Update colors
      const hue = (positions[i3] * 0.1 + positions[i3 + 1] * 0.1 + time * 0.1) % 1;
      const color = new THREE.Color().setHSL(hue, 1, 0.5);
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }
    
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.color.needsUpdate = true;
    
    // Rotate scene
    particlesRef.current.rotation.y += 0.001;
    particlesRef.current.rotation.x += 0.0005;
    
    // Update audio
    updateAudio(interaction.intensity);
    
    // Render
    rendererRef.current.render(sceneRef.current, cameraRef.current);
    
    animationFrameRef.current = requestAnimationFrame(animate);
  };

  // Initialize MediaPipe Hands
  const initMediaPipe = async () => {
    if (!videoRef.current || typeof window === 'undefined' || !window.Hands) {
      console.log('MediaPipe not available, using mouse/touch mode');
      setDetectedGesture('MEDIAPIPE NOT LOADED - Using Mouse/Touch');
      return;
    }
    
    try {
      setDetectedGesture('REQUESTING CAMERA ACCESS...');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
      });
      
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setCameraActive(true);
      setDetectedGesture('INITIALIZING HAND TRACKING...');
      
      const hands = new window.Hands({
        locateFile: (file: string) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        },
      });
      
      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      
      hands.onResults(onHandResults);
      handsRef.current = hands;
      
      setDetectedGesture('CAMERA ACTIVE - Show your hand');
      
      const processFrame = async () => {
        if (videoRef.current && handsRef.current) {
          await handsRef.current.send({ image: videoRef.current });
          requestAnimationFrame(processFrame);
        }
      };
      
      processFrame();
    } catch (error) {
      console.error('Camera error:', error);
      setCameraActive(false);
      
      if ((error as Error).name === 'NotAllowedError') {
        setDetectedGesture('CAMERA ACCESS DENIED - Using Mouse/Touch');
      } else if ((error as Error).name === 'NotFoundError') {
        setDetectedGesture('NO CAMERA FOUND - Using Mouse/Touch');
      } else {
        setDetectedGesture('CAMERA ERROR - Using Mouse/Touch');
      }
    }
  };

  // Draw hand landmarks on canvas
  const drawHandLandmarks = (landmarks: MediaPipeLandmark[]) => {
    if (!handCanvasRef.current) return;
    
    const canvas = handCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw connections between landmarks
    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
      [0, 5], [5, 6], [6, 7], [7, 8], // Index
      [0, 9], [9, 10], [10, 11], [11, 12], // Middle
      [0, 13], [13, 14], [14, 15], [15, 16], // Ring
      [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
      [5, 9], [9, 13], [13, 17], // Palm
    ];
    
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    
    connections.forEach(([start, end]) => {
      const startPoint = landmarks[start];
      const endPoint = landmarks[end];
      
      ctx.beginPath();
      ctx.moveTo(startPoint.x * canvas.width, startPoint.y * canvas.height);
      ctx.lineTo(endPoint.x * canvas.width, endPoint.y * canvas.height);
      ctx.stroke();
    });
    
    // Draw landmark points
    ctx.fillStyle = '#ff0000';
    landmarks.forEach((landmark, index) => {
      const x = landmark.x * canvas.width;
      const y = landmark.y * canvas.height;
      
      ctx.beginPath();
      ctx.arc(x, y, index === 8 || index === 4 ? 6 : 4, 0, 2 * Math.PI);
      ctx.fill();
      
      // Highlight thumb and index finger tips
      if (index === 8 || index === 4) {
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, 2 * Math.PI);
        ctx.stroke();
      }
    });
  };

  // Process hand tracking results
  const onHandResults = (results: MediaPipeResults) => {
    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
      setHandDetected(false);
      setDetectedGesture('WAITING FOR INPUT');
      
      // Clear canvas
      if (handCanvasRef.current) {
        const ctx = handCanvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, handCanvasRef.current.width, handCanvasRef.current.height);
        }
      }
      
      return;
    }
    
    setHandDetected(true);
    
    const landmarks = results.multiHandLandmarks[0];
    
    // Draw hand landmarks
    drawHandLandmarks(landmarks);
    
    // Get index finger tip position (landmark 8)
    const indexTip = landmarks[8];
    const thumbTip = landmarks[4];
    
    // Map to 3D space
    interactionRef.current.position.x = (indexTip.x - 0.5) * 20;
    interactionRef.current.position.y = -(indexTip.y - 0.5) * 15;
    interactionRef.current.position.z = 5 - indexTip.z * 10;
    
    // Detect pinch
    const dx = thumbTip.x - indexTip.x;
    const dy = thumbTip.y - indexTip.y;
    const dz = thumbTip.z - indexTip.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    
    interactionRef.current.isPinching = distance < 0.05;
    interactionRef.current.intensity = interactionRef.current.isPinching ? 1 : 0.2;
    
    // Count extended fingers
    const fingersUp = countFingers(landmarks);
    
    // Gesture detection with smoothing
    let gestureShape: ShapeType | null = null;
    let gestureName = '';
    
    if (fingersUp === 2) {
      gestureShape = 'flower';
      gestureName = 'FLOWER (2 Fingers)';
    } else if (fingersUp === 3) {
      gestureShape = 'saturn';
      gestureName = 'SATURN (3 Fingers)';
    } else if (fingersUp === 4) {
      gestureShape = 'heart';
      gestureName = 'HEART (4 Fingers)';
    } else if (fingersUp === 5) {
      gestureShape = 'fireworks';
      gestureName = 'FIREWORKS (5 Fingers)';
    }
    
    if (gestureShape) {
      if (gestureFramesRef.current.current === gestureShape) {
        gestureFramesRef.current.frames++;
        
        if (gestureFramesRef.current.frames >= gestureFramesRef.current.threshold) {
          if (currentShape !== gestureShape) {
            changeShape(gestureShape);
          }
          setDetectedGesture(gestureName);
        }
      } else {
        gestureFramesRef.current.current = gestureShape;
        gestureFramesRef.current.frames = 0;
      }
    } else {
      gestureFramesRef.current.current = 'none';
      gestureFramesRef.current.frames = 0;
    }
  };

  // Count extended fingers
  const countFingers = (landmarks: MediaPipeLandmark[]) => {
    let count = 0;
    
    // Thumb
    if (landmarks[4].x < landmarks[3].x) count++;
    
    // Other fingers (check if tip is above middle joint)
    const fingers = [
      [8, 6],  // Index
      [12, 10], // Middle
      [16, 14], // Ring
      [20, 18], // Pinky
    ];
    
    for (const [tip, middle] of fingers) {
      if (landmarks[tip].y < landmarks[middle].y) count++;
    }
    
    return count;
  };

  // Change shape
  const changeShape = (shape: ShapeType) => {
    setCurrentShape(shape);
    generateShape(shape);
    playWhoosh();
  };

  // Mouse/touch interaction
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!cameraActive) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      
      interactionRef.current.position.x = x * 10;
      interactionRef.current.position.y = y * 7.5;
      interactionRef.current.position.z = 5;
    }
  };

  const handlePointerDown = () => {
    if (!cameraActive) {
      interactionRef.current.isPinching = true;
      interactionRef.current.intensity = 1;
    }
  };

  const handlePointerUp = () => {
    if (!cameraActive) {
      interactionRef.current.isPinching = false;
      interactionRef.current.intensity = 0.2;
    }
  };

  // Toggle camera tracking
  const toggleCamera = async () => {
    if (cameraActive) {
      // Stop camera
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      
      // Clear hands ref to stop processing
      handsRef.current = null;
      
      setCameraActive(false);
      setHandDetected(false);
      setDetectedGesture('CAMERA DISABLED - Using Mouse/Touch');
      
      // Clear hand canvas
      if (handCanvasRef.current) {
        const ctx = handCanvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, handCanvasRef.current.width, handCanvasRef.current.height);
        }
      }
    } else {
      // Start camera
      await initMediaPipe();
    }
  };

  // Start experience
  const handleStart = () => {
    setIsStarted(true);
    setShowHelp(true);
    initAudio();
    initThreeScene();
    initMediaPipe();
    requestAnimationFrame(animate);
  };

  // Cleanup
  useEffect(() => {
    const videoElement = videoRef.current;
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      
      if (particlesRef.current) {
        particlesRef.current.geometry.dispose();
        (particlesRef.current.material as THREE.Material).dispose();
      }
      
      if (audioNodesRef.current) {
        audioNodesRef.current.drone.stop();
        audioNodesRef.current.context.close();
      }
      
      if (videoElement?.srcObject) {
        const stream = videoElement.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {/* Three.js Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      />
      
      {/* Video element for MediaPipe (hidden) */}
      <video
        ref={videoRef}
        className="hidden"
        playsInline
      />
      
      {/* Start Overlay */}
      {!isStarted && (
        <div className="absolute inset-0 bg-black flex items-center justify-center z-50">
          <div className="text-center space-y-6">
            <h1 className="text-6xl font-bold text-white mb-4">
              MUNA Hand Control
            </h1>
            <p className="text-xl text-gray-400 mb-8">
              Interactive 3D Particle Experience
            </p>
            <button
              onClick={handleStart}
              className="px-8 py-4 bg-white text-black font-bold text-xl rounded-lg hover:bg-gray-200 transition-colors"
            >
              Enter Experience
            </button>
          </div>
        </div>
      )}
      
      {/* HUD */}
      {isStarted && (
        <>
          {/* Gesture Feedback */}
          <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-10">
            <div className="bg-black/50 backdrop-blur-sm px-6 py-3 rounded-full">
              <p className="text-white font-mono text-sm">
                DETECTED: {detectedGesture}
              </p>
            </div>
          </div>
          
          {/* Camera Feed */}
          {cameraActive && showCameraFeed && (
            <div className="absolute bottom-8 right-8 z-10">
              <div className="relative w-80 h-60 rounded-lg overflow-hidden border-2 border-white/30 bg-black">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover transform scale-x-[-1]"
                  playsInline
                />
                <canvas
                  ref={handCanvasRef}
                  width={320}
                  height={240}
                  className="absolute inset-0 w-full h-full transform scale-x-[-1]"
                />
                
                {/* Status indicator */}
                <div className="absolute top-2 left-2 flex items-center gap-2 bg-black/70 px-3 py-1 rounded-full">
                  <div className={`w-2 h-2 rounded-full ${handDetected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
                  <span className="text-white text-xs font-mono">
                    {handDetected ? 'TRACKING' : 'SEARCHING'}
                  </span>
                </div>
                
                {/* Toggle visibility button */}
                <button
                  onClick={() => setShowCameraFeed(false)}
                  className="absolute top-2 right-2 bg-black/70 p-2 rounded-full hover:bg-black/90 transition-colors"
                  title="Hide Camera Feed"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          )}
          
          {/* Show camera feed button when hidden */}
          {cameraActive && !showCameraFeed && (
            <button
              onClick={() => setShowCameraFeed(true)}
              className="absolute bottom-8 right-8 z-10 bg-white/10 backdrop-blur-sm p-4 rounded-full hover:bg-white/20 transition-colors"
              title="Show Camera Feed"
            >
              <Camera className="w-6 h-6 text-white" />
            </button>
          )}
          
          {/* Top Right Controls */}
          <div className="absolute top-8 right-8 z-10 flex gap-3">
            {/* Camera Toggle Button */}
            <button
              onClick={toggleCamera}
              className={`p-3 rounded-full backdrop-blur-sm transition-colors ${
                cameraActive 
                  ? 'bg-green-500/30 hover:bg-green-500/40 border-2 border-green-500' 
                  : 'bg-white/10 hover:bg-white/20'
              }`}
              title={cameraActive ? 'Disable Camera Tracking' : 'Enable Camera Tracking'}
            >
              <Camera className={`w-6 h-6 ${cameraActive ? 'text-green-400' : 'text-white'}`} />
            </button>
            
            {/* Help Button */}
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="bg-white/10 backdrop-blur-sm p-3 rounded-full hover:bg-white/20 transition-colors"
            >
              <HelpCircle className="w-6 h-6 text-white" />
            </button>
          </div>
          
          {/* Manual Controls */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
            <div className="bg-black/50 backdrop-blur-sm px-6 py-4 rounded-full flex gap-4">
              <button
                onClick={() => changeShape('sphere')}
                className={`p-3 rounded-full transition-colors ${
                  currentShape === 'sphere' ? 'bg-white text-black' : 'bg-white/20 text-white hover:bg-white/30'
                }`}
                title="Sphere"
              >
                <Camera className="w-6 h-6" />
              </button>
              
              <button
                onClick={() => changeShape('flower')}
                className={`p-3 rounded-full transition-colors ${
                  currentShape === 'flower' ? 'bg-white text-black' : 'bg-white/20 text-white hover:bg-white/30'
                }`}
                title="Flower"
              >
                <Flower2 className="w-6 h-6" />
              </button>
              
              <button
                onClick={() => changeShape('saturn')}
                className={`p-3 rounded-full transition-colors ${
                  currentShape === 'saturn' ? 'bg-white text-black' : 'bg-white/20 text-white hover:bg-white/30'
                }`}
                title="Saturn"
              >
                <Star className="w-6 h-6" />
              </button>
              
              <button
                onClick={() => changeShape('heart')}
                className={`p-3 rounded-full transition-colors ${
                  currentShape === 'heart' ? 'bg-white text-black' : 'bg-white/20 text-white hover:bg-white/30'
                }`}
                title="Heart"
              >
                <Heart className="w-6 h-6" />
              </button>
              
              <button
                onClick={() => changeShape('fireworks')}
                className={`p-3 rounded-full transition-colors ${
                  currentShape === 'fireworks' ? 'bg-white text-black' : 'bg-white/20 text-white hover:bg-white/30'
                }`}
                title="Fireworks"
              >
                <Sparkles className="w-6 h-6" />
              </button>
            </div>
          </div>
          
          {/* Help Modal */}
          {showHelp && (
            <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/80 backdrop-blur-sm">
              <div className="bg-black/90 border-2 border-white/30 rounded-2xl p-8 max-w-2xl mx-4">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-3xl font-bold text-white">Hand Gestures</h2>
                  <button
                    onClick={() => setShowHelp(false)}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <X className="w-6 h-6 text-white" />
                  </button>
                </div>
                
                <div className="space-y-4 text-white">
                  <div className="flex items-center gap-4 p-4 bg-white/5 rounded-lg">
                    <div className="text-4xl">✌️</div>
                    <div>
                      <p className="font-bold">2 Fingers Up</p>
                      <p className="text-gray-400">Flower Shape</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 p-4 bg-white/5 rounded-lg">
                    <div className="text-4xl">🤟</div>
                    <div>
                      <p className="font-bold">3 Fingers Up</p>
                      <p className="text-gray-400">Saturn Shape</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 p-4 bg-white/5 rounded-lg">
                    <div className="text-4xl">🤘</div>
                    <div>
                      <p className="font-bold">4 Fingers Up</p>
                      <p className="text-gray-400">Heart Shape</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 p-4 bg-white/5 rounded-lg">
                    <div className="text-4xl">✋</div>
                    <div>
                      <p className="font-bold">5 Fingers Up (Open Hand)</p>
                      <p className="text-gray-400">Fireworks Shape</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 p-4 bg-white/5 rounded-lg">
                    <div className="text-4xl">🤏</div>
                    <div>
                      <p className="font-bold">Pinch (Thumb + Index)</p>
                      <p className="text-gray-400">Attract Particles</p>
                    </div>
                  </div>
                  
                  <div className="mt-6 p-4 bg-blue-500/20 border border-blue-500/50 rounded-lg">
                    <p className="text-sm text-blue-200 mb-3">
                      💡 <strong>Tip:</strong> Use your mouse or touch to interact when camera is disabled. 
                      Click and drag to attract particles!
                    </p>
                    <p className="text-sm text-blue-200">
                      📹 <strong>Camera Controls:</strong> Use the camera button (top-right) to toggle hand tracking on/off. 
                      Hand landmarks will be displayed in green on the camera feed.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
