import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Points, PointMaterial, Float, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { 
  Github, 
  Linkedin, 
  Mail, 
  Zap, 
  Users, 
  Server, 
  User, 
  FolderCode, 
  MessageSquare, 
  Settings, 
  Briefcase,
  Trophy,
  MousePointer2,
  Info
} from 'lucide-react';

// --- SVG Tech Icons ---
const TECH_SVGS = {
  unity: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M22.1 11.2L13.8 3.3c-.2-.2-.5-.3-.8-.3s-.6.1-.8.3L3.9 11.2c-.4.4-.4 1.1 0 1.5l8.3 7.9c.2.2.5.3.8.3s.6-.1.8-.3l8.3-7.9c.4-.4.4-1.1 0-1.5zm-9.1 6.4l-6.1-5.8 6.1-5.8 6.1 5.8-6.1 5.8z"/>
    </svg>
  ),
  csharp: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6zm-1.5-9h3v1h-3v1h3v1h-3v1h3v1h-4v-6h1v1zm6 0h1v6h-1v-6z"/>
    </svg>
  ),
  cpp: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M2 12c0-5.52 4.48-10 10-10s10 4.48 10 10-4.48 10-10 10S2 17.52 2 12zm10-8c-4.41 0-8 3.59-8 8s3.59 8 8 8 8-3.59 8-8-3.59-8-8-8zm-1 5h-2v2h-2v2h2v2h2v-2h2v-2h-2V9zm6 2h2v2h-2v-2z"/>
    </svg>
  ),
  nodejs: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M12 2L4.5 6.3v8.7L12 19.3l7.5-4.3V6.3L12 2zm5.5 12.1l-5.5 3.2-5.5-3.2V7.2l5.5-3.2 5.5 3.2v6.9z"/>
    </svg>
  ),
  aws: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5-10-5-10 5z"/>
    </svg>
  ),
  docker: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M13.962 8.885c0-.603.49-1.093 1.093-1.093.603 0 1.093.49 1.093 1.093 0 .603-.49 1.093-1.093 1.093-.603 0-1.093-.49-1.093-1.093zm-1.093 0c0-.603.49-1.093 1.093-1.093.603 0 1.093.49 1.093 1.093 0 .603-.49 1.093-1.093 1.093-.603 0-1.093-.49-1.093-1.093zm-1.093 0c0-.603.49-1.093 1.093-1.093.603 0 1.093.49 1.093 1.093 0 .603-.49 1.093-1.093 1.093-.603 0-1.093-.49-1.093-1.093zm-1.1 0c0-.603.49-1.093 1.093-1.093.603 0 1.093.49 1.093 1.093 0 .603-.49 1.093-1.093 1.093-.603 0-1.093-.49-1.093-1.093zm-1.093 0c0-.603.49-1.093 1.093-1.093.603 0 1.093.49 1.093 1.093 0 .603-.49 1.093-1.093 1.093-.603 0-1.093-.49-1.093-1.093zm-1.093 0c0-.603.49-1.093 1.093-1.093.603 0 1.093.49 1.093 1.093 0 .603-.49 1.093-1.093 1.093-.603 0-1.093-.49-1.093-1.093zm-1.093 0c0-.603.49-1.093 1.093-1.093.603 0 1.093.49 1.093 1.093 0 .603-.49 1.093-1.093 1.093-.603 0-1.093-.49-1.093-1.093zm-1.093 0c0-.603.49-1.093 1.093-1.093.603 0 1.093.49 1.093 1.093 0 .603-.49 1.093-1.093 1.093-.603 0-1.093-.49-1.093-1.093zm12.022 4.008c.032.303.047.612.047.926 0 3.48-2.82 6.3-6.3 6.3-2.514 0-4.682-1.475-5.69-3.602-.513.044-1.035.067-1.563.067-2.64 0-5.02-.574-6.965-1.547l.012-.07c1.32.46 2.257.603 3.39.603 2.917 0 5.28-2.363 5.28-5.28 0-.327-.03-.646-.088-.954h11.917z"/>
    </svg>
  ),
  photon: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M12 2L2 19.74l1.35 1.26L12 18.28l8.65 2.72L22 19.74 12 2zm0 13.53l-6.37 2.01L12 5.47l6.37 12.07-6.37-2.01z"/>
    </svg>
  ),
  azure: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M5.483 21.3l6.156-8.912 3.972 5.587 8.389 3.325L5.483 21.3zM24 17.66L17.116 2.1l-2.776 3.928 6.126 11.632L24 17.66zM13.03 5.39L8.536 0 0 18.782l4.674 2.518L13.03 5.39z"/>
    </svg>
  )
};

// --- Types ---
interface Project {
  id: number;
  title: string;
  shortDesc: string;
  summary: string;
  categories: ('gameplay' | 'multiplayer' | 'backend')[];
  techs: (keyof typeof TECH_SVGS)[];
  image: string;
  link?: string;
  videoUrl?: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
}

// --- Constants & Data ---
const EXPERIENCE = [
  {
    company: "Devsinc",
    role: "Senior Software Engineer",
    period: "2022 - Present",
    description: "Leading multiplayer game development teams. Specialized in Photon Fusion, Unity architecture, and backend scalability for high-concurrency games."
  },
  {
    company: "Sacred Tails",
    role: "Lead Gameplay Engineer",
    period: "2021 - 2022",
    description: "Developed core combat systems for a blockchain-based multiplayer card game. Integrated Sei chain and optimized Azure-based backend services."
  },
  {
    company: "Freelance",
    role: "Game Developer",
    period: "2019 - 2021",
    description: "Solo developed multiple Unity-based projects including 'Triple Hand Poker' and 'Funny Shooter'. Focused on WebGL optimization and cross-platform gameplay."
  }
];

const PROJECTS: Project[] = [
  {
    id: 1,
    title: "Nanocry",
    shortDesc: "Multiplayer Battle Royale (Unity, Photon Fusion).",
    summary: "Architected faction-based battle royale supporting 30+ players. Engineered core network infrastructure with server-authoritative validation and lag compensation.",
    categories: ['multiplayer', 'gameplay'],
    techs: ["unity", "csharp", "photon"],
    image: "https://picsum.photos/seed/nanocry/800/450",
    link: "https://github.com/ibrahim-butt/nanocry",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ"
  },
  {
    id: 2,
    title: "Sacred Tails",
    shortDesc: "Blockchain Multiplayer Card Game (Sei Chain).",
    summary: "Delivered turn-based card combat serving 300+ daily players. Integrated NFT characters and engineered combat evaluation algorithms using Azure Functions.",
    categories: ['multiplayer', 'backend'],
    techs: ["unity", "azure", "docker"],
    image: "https://picsum.photos/seed/sacred/800/450",
    link: "https://sacredtails.com",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ"
  },
  {
    id: 3,
    title: "Triple Hand Poker",
    shortDesc: "6-Player Multiplayer Card Game.",
    summary: "Solo developed poker game with seamless online/offline switching. Engineered custom card evaluation algorithms supporting 50+ hand combinations.",
    categories: ['multiplayer', 'gameplay'],
    techs: ["unity", "photon", "csharp"],
    image: "https://picsum.photos/seed/poker/800/450",
    link: "https://play.google.com/store/apps/details?id=com.triplehandpoker",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ"
  },
  {
    id: 4,
    title: "Funny Shooter",
    shortDesc: "Web-Based Multiplayer FPS (Unity WebGL).",
    summary: "Optimized WebGL build to 45MB while maintaining 60fps. Implemented projectile-based combat system with 12 unique weapon types.",
    categories: ['multiplayer', 'gameplay'],
    techs: ["unity", "csharp"],
    image: "https://picsum.photos/seed/shooter/800/450",
    link: "https://funny-shooter.web.app",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ"
  }
];

// --- Achievement System ---
const INITIAL_ACHIEVEMENTS: Achievement[] = [
  { id: 'first_kill', title: 'First Contact', description: 'Extinguished your first firefly.', unlocked: false },
  { id: 'exterminator', title: 'Exterminator', description: 'Cleared 20 fireflies.', unlocked: false },
  { id: 'explorer', title: 'Scholar', description: 'Visited all sections of the portfolio.', unlocked: false },
  { id: 'night_owl', title: 'Night Owl', description: 'Visited the site during late hours.', unlocked: false },
  { id: 'shockwave_pro', title: 'Shockwave Master', description: 'Used the Shockwave ability 3 times.', unlocked: false },
  { id: 'speed_demon', title: 'Speed Demon', description: 'Cleared 5 fireflies in under 2 seconds.', unlocked: false },
];

// --- Three.js Fireflies Component ---
function Fireflies({ mouse, isLocked, level, explosions, shockwaveActive, shockwavePos }: { 
  mouse: React.MutableRefObject<[number, number]>, 
  isLocked: boolean,
  level: number,
  explosions: { x: number, y: number, id: number }[],
  shockwaveActive: boolean,
  shockwavePos: [number, number]
}) {
  const meshRef = useRef<THREE.Points>(null!);
  const shockwaveRef = useRef<THREE.Group>(null!);
  const lastShockwaveActive = useRef(false);
  const processedExplosions = useRef<Set<number>>(new Set());
  const { camera, viewport } = useThree();
  
  // Viewport scaling factors
  const vW = viewport.width / 2;
  const vH = viewport.height / 2;

  // Pre-allocate a large pool of particles
  const MAX_PARTICLES = 500;
  const particles = useMemo(() => {
    const positions = new Float32Array(MAX_PARTICLES * 3);
    const velocities = new Float32Array(MAX_PARTICLES * 3);
    const types = new Float32Array(MAX_PARTICLES); // 0: normal, 1: aggressive
    
    for (let i = 0; i < MAX_PARTICLES; i++) {
      // Initialize off-screen to avoid static background dots
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 1000; 
      positions[i * 3 + 2] = 0;
      
      velocities[i * 3] = (Math.random() - 0.5) * 0.02;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.02;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
      
      types[i] = Math.random() > 0.8 ? 1 : 0;
    }
    return { positions, velocities, types };
  }, []);

  useFrame((state, delta) => {
    const { positions, velocities, types } = particles;
    const time = state.clock.getElapsedTime();
    
    // Current active count based on level
    const activeCount = Math.min(MAX_PARTICLES, 150 + Math.floor(level) * 40);

    // Global Shockwave logic
    if (shockwaveRef.current && shockwaveActive) {
      const sx = shockwavePos[0] * vW;
      const sy = shockwavePos[1] * vH;

      if (!lastShockwaveActive.current) {
        shockwaveRef.current.position.set(sx, sy, 0);
        for (let i = 0; i < MAX_PARTICLES; i++) {
          const i3 = i * 3;
          if (positions[i3 + 1] > 500) continue; // Skip inactive
          const dx = positions[i3] - sx;
          const dy = positions[i3 + 1] - sy;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          velocities[i3] += (dx / dist) * 1.5;
          velocities[i3 + 1] += (dy / dist) * 1.5;
        }
      }
      shockwaveRef.current.scale.setScalar(shockwaveRef.current.scale.x + delta * 40);
      shockwaveRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material.opacity *= 0.8;
        }
      });
    } else if (shockwaveRef.current) {
      shockwaveRef.current.scale.setScalar(0);
      shockwaveRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material.opacity = child.userData.initialOpacity || 0.8;
        }
      });
    }
    lastShockwaveActive.current = shockwaveActive;

    // Mini-Shockwaves (Explosions) logic
    explosions.forEach(exp => {
      if (!processedExplosions.current.has(exp.id)) {
        const ex = exp.x * vW;
        const ey = exp.y * vH;
        for (let i = 0; i < MAX_PARTICLES; i++) {
          const i3 = i * 3;
          if (positions[i3 + 1] > 500) continue; // Skip inactive
          const dx = positions[i3] - ex;
          const dy = positions[i3 + 1] - ey;
          const distSq = dx * dx + dy * dy;
          if (distSq < 2) {
            const dist = Math.sqrt(distSq) || 0.1;
            const force = (1.5 - dist) * 0.2;
            velocities[i3] += (dx / dist) * force;
            velocities[i3 + 1] += (dy / dist) * force;
          }
        }
        processedExplosions.current.add(exp.id);
      }
    });

    if (explosions.length === 0) processedExplosions.current.clear();

    // Environmental Effect: Camera Shake at high threat
    if (level > 6) {
      camera.position.x = Math.sin(time * 20) * (level - 6) * 0.01;
      camera.position.y = Math.cos(time * 20) * (level - 6) * 0.01;
    } else {
      camera.position.x = 0;
      camera.position.y = 0;
    }

    for (let i = 0; i < MAX_PARTICLES; i++) {
      const i3 = i * 3;
      
      // Handle active/inactive state
      if (i >= activeCount) {
        positions[i3 + 1] = 1000; // Move far off-screen
        continue;
      } else if (positions[i3 + 1] > 500) {
        // Just became active, spawn at edge
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.max(vW, vH) * 1.5;
        positions[i3] = Math.cos(angle) * radius;
        positions[i3 + 1] = Math.sin(angle) * radius;
      }

      const isAggressive = types[i] === 1 && level > 4;
      
      // Respawn logic (if drifted too far)
      const distSq = positions[i3] * positions[i3] + positions[i3 + 1] * positions[i3 + 1];
      if (distSq > 625) { // 25^2
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.max(vW, vH) * 1.5;
        positions[i3] = Math.cos(angle) * radius;
        positions[i3 + 1] = Math.sin(angle) * radius;
        velocities[i3] = -Math.cos(angle) * 0.08;
        velocities[i3 + 1] = -Math.sin(angle) * 0.08;
      }

      // Normal behavior
      let targetX = mouse.current[0] * vW;
      let targetY = mouse.current[1] * vH;

      if (level > 2 && !shockwaveActive) {
        const swarmRadius = level > 5 ? vW * 0.8 : vW * 0.5;
        targetX = Math.sin(i * 0.1 + time * (0.2 + level * 0.05)) * swarmRadius;
        targetY = Math.cos(i * 0.1 + time * (0.2 + level * 0.05)) * swarmRadius;
        
        // Aggressive flies chase mouse even in swarm mode
        if (isAggressive) {
          targetX = mouse.current[0] * vW;
          targetY = mouse.current[1] * vH;
        }
      }

      let attractionStrength = isLocked ? 0.0006 * level : 0.0001;
      if (isAggressive) attractionStrength *= 1.5;
      
      if (!shockwaveActive) {
        velocities[i3] += (targetX - positions[i3]) * attractionStrength;
        velocities[i3 + 1] += (targetY - positions[i3 + 1]) * attractionStrength;
      }

      // Speed increases with level
      const driftScale = 0.005 + (level * 0.001);
      velocities[i3] += (Math.random() - 0.5) * driftScale;
      velocities[i3 + 1] += (Math.random() - 0.5) * driftScale;

      positions[i3] += velocities[i3];
      positions[i3 + 1] += velocities[i3 + 1];
      positions[i3 + 2] += velocities[i3 + 2];

      const friction = 0.96 - (level * 0.002); // Less friction = more chaotic/fast
      velocities[i3] *= Math.max(0.9, friction);
      velocities[i3 + 1] *= Math.max(0.9, friction);
      velocities[i3 + 2] *= Math.max(0.9, friction);
    }
    if (!meshRef.current) return;
    meshRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <group>
      <Points ref={meshRef} positions={particles.positions} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color={level > 5 ? "#ff2200" : "#facc15"}
          size={level > 4 ? 0.14 : 0.09}
          sizeAttenuation={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          opacity={level > 3 ? 0.9 : 0.6}
        />
      </Points>
      
      {/* Shockwave Visual - Improved with multiple rings */}
      <group ref={shockwaveRef}>
        <mesh onUpdate={(self) => (self.userData.initialOpacity = 0.8)}>
          <ringGeometry args={[0.1, 0.2, 64]} />
          <meshBasicMaterial color="#facc15" transparent opacity={0.8} side={THREE.DoubleSide} />
        </mesh>
        <mesh scale={0.8} onUpdate={(self) => (self.userData.initialOpacity = 0.5)}>
          <ringGeometry args={[0.1, 0.15, 64]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.5} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Mini Shockwaves for Left Clicks */}
      {explosions.map(exp => (
        <group key={exp.id} position={[exp.x * vW, exp.y * vH, 0]}>
          <MiniShockwaveVisual />
        </group>
      ))}
    </group>
  );
}

function MiniShockwaveVisual() {
  const meshRef = useRef<THREE.Mesh>(null!);
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.scale.setScalar(meshRef.current.scale.x + delta * 10);
      const mat = meshRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity -= delta * 3;
    }
  });

  return (
    <mesh ref={meshRef}>
      <ringGeometry args={[0.05, 0.1, 32]} />
      <meshBasicMaterial color="#facc15" transparent opacity={0.8} side={THREE.DoubleSide} />
    </mesh>
  );
}

// --- Main App ---
export default function App() {
  const [achievements, setAchievements] = useState<Achievement[]>(INITIAL_ACHIEVEMENTS);
  const [killCount, setKillCount] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [level, setLevel] = useState(1);
  const [visitedSections, setVisitedSections] = useState<Set<string>>(new Set(['about']));
  const [showInstructions, setShowInstructions] = useState(true);
  const [activeSection, setActiveSection] = useState('about');
  const [notifications, setNotifications] = useState<{ id: string, title: string, type: 'achievement' | 'level' }[]>([]);
  const [explosions, setExplosions] = useState<{ x: number, y: number, id: number }[]>([]);
  const [shockwaveReady, setShockwaveReady] = useState(false);
  const [shockwaveActive, setShockwaveActive] = useState(false);
  const [shockwavePos, setShockwavePos] = useState<[number, number]>([0, 0]);
  const [shockwaveCount, setShockwaveCount] = useState(0);
  const [lastKills, setLastKills] = useState<number[]>([]);
  const [screenFlash, setScreenFlash] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  
  const mouse = useRef<[number, number]>([0, 0]);

  // Difficulty scaling over time
  useEffect(() => {
    const timer = setInterval(() => {
      if (!showInstructions) {
        setLevel(prev => {
          const next = prev + 0.1;
          const oldLevel = Math.floor(prev);
          const newLevel = Math.floor(next);
          
          if (newLevel > oldLevel && newLevel > 1) {
            addNotification(`Level Up: Threat Level ${newLevel}`, 'level');
          }

          if (next >= 2 && !isLocked) setIsLocked(true);
          return next;
        });
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [showInstructions, isLocked]);

  // Load achievements
  useEffect(() => {
    const saved = localStorage.getItem('ibrahim_achievements');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setAchievements(prev => prev.map(a => ({
          ...a,
          unlocked: parsed.find((p: any) => p.id === a.id)?.unlocked || false
        })));
      } catch (e) {
        console.error("Failed to load achievements", e);
      }
    }

    const hour = new Date().getHours();
    if (hour >= 22 || hour <= 4) {
      unlockAchievement('night_owl');
    }
  }, []);

  const addNotification = (title: string, type: 'achievement' | 'level') => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, title, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };

  const unlockAchievement = (id: string) => {
    setAchievements(prev => {
      const achievement = prev.find(a => a.id === id);
      if (achievement && !achievement.unlocked) {
        addNotification(`Achievement: ${achievement.title}`, 'achievement');
        setScreenFlash(true);
        setTimeout(() => setScreenFlash(false), 500);
        const updated = prev.map(a => a.id === id ? { ...a, unlocked: true } : a);
        localStorage.setItem('ibrahim_achievements', JSON.stringify(updated));
        return updated;
      }
      return prev;
    });
  };

  const handleKill = (e: React.MouseEvent) => {
    // Don't trigger game mechanics if clicking on interactive elements
    if ((e.target as HTMLElement).closest('button, a, input, [role="button"]')) return;

    const now = Date.now();
    const newCount = killCount + 1;
    setKillCount(newCount);
    
    // Speed Demon check
    const recentKills = [...lastKills, now].filter(t => now - t < 2000);
    setLastKills(recentKills);
    if (recentKills.length >= 5) unlockAchievement('speed_demon');

    // Add explosion
    const expId = Date.now();
    setExplosions(prev => [...prev, { x: mouse.current[0], y: mouse.current[1], id: expId }]);
    setTimeout(() => setExplosions(prev => prev.filter(exp => exp.id !== expId)), 500);

    unlockAchievement('first_kill');
    if (newCount >= 20) unlockAchievement('exterminator');
    
    // Shockwave logic
    if (newCount % 10 === 0) setShockwaveReady(true);

    // Unlock logic: clearing reduces level/difficulty
    setLevel(prev => Math.max(1, prev - 0.2));
    if (level < 2) setIsLocked(false);
  };

  const triggerShockwave = (e: React.MouseEvent) => {
    if (!shockwaveReady) return;
    // Don't trigger game mechanics if clicking on interactive elements
    if ((e.target as HTMLElement).closest('button, a, input, [role="button"]')) return;
    
    e.preventDefault();
    setShockwaveReady(false);
    setShockwavePos([mouse.current[0], mouse.current[1]]);
    setShockwaveActive(true);
    setTimeout(() => setShockwaveActive(false), 1000);

    const newShockwaveCount = shockwaveCount + 1;
    setShockwaveCount(newShockwaveCount);
    if (newShockwaveCount >= 3) unlockAchievement('shockwave_pro');

    setIsLocked(false);
    setLevel(1);
    addNotification("Shockwave Triggered!", "level");
    
    // Visual feedback
    setScreenFlash(true);
    setTimeout(() => setScreenFlash(false), 300);
    
    setTimeout(() => {
      if (level > 2) setIsLocked(true);
    }, 15000);
  };

  const handleSectionVisit = (id: string) => {
    setActiveSection(id);
    setVisitedSections(prev => {
      const next = new Set(prev).add(id);
      if (next.size >= 5) unlockAchievement('explorer');
      return next;
    });
  };

  const navItems = [
    { id: 'about', label: 'ABOUT', icon: <User size={18} /> },
    { id: 'experience', label: 'EXPERIENCE', icon: <Briefcase size={18} /> },
    { id: 'skills', label: 'SKILLS', icon: <Settings size={18} /> },
    { id: 'projects', label: 'PROJECTS', icon: <FolderCode size={18} /> },
    { id: 'contact', label: 'CONTACT', icon: <MessageSquare size={18} /> },
  ];

  return (
    <div 
      className="min-h-screen relative bg-[#020408] flex selection:bg-yellow-400/30 text-slate-200 font-sans cursor-crosshair"
      onMouseMove={(e) => {
        mouse.current = [
          (e.clientX / window.innerWidth) * 2 - 1,
          -(e.clientY / window.innerHeight) * 2 + 1
        ];
      }}
      onClick={handleKill}
      onContextMenu={triggerShockwave}
    >
      {/* Screen Flash Effect */}
      <AnimatePresence>
        {screenFlash && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-yellow-400 pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Three.js Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
          <Suspense fallback={null}>
            <Fireflies 
              mouse={mouse} 
              isLocked={isLocked} 
              level={level} 
              explosions={explosions} 
              shockwaveActive={shockwaveActive}
              shockwavePos={shockwavePos}
            />
            <ambientLight intensity={0.5} />
          </Suspense>
        </Canvas>
      </div>

      {/* Notifications */}
      <div className="fixed top-10 right-10 z-[110] flex flex-col gap-4 pointer-events-none">
        <AnimatePresence>
          {notifications.map(n => (
            <motion.div
              key={n.id}
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 100, opacity: 0 }}
              className="glass-card px-6 py-4 flex items-center gap-4 border-yellow-400/30"
            >
              <div className="w-10 h-10 bg-yellow-400/10 rounded-full flex items-center justify-center">
                {n.type === 'achievement' ? <Trophy className="text-yellow-400 w-5 h-5" /> : <Zap className="text-yellow-400 w-5 h-5" />}
              </div>
              <div>
                <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Notification</div>
                <div className="text-sm font-bold text-white">{n.title}</div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Game Overlay / Instructions */}
      <AnimatePresence>
        {showInstructions && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
          >
            <div className="max-w-md w-full glass-card p-10 text-center">
              <div className="w-16 h-16 bg-yellow-400/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <MousePointer2 className="text-yellow-400 w-8 h-8" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-4">Portfolio Quest</h2>
              <p className="text-slate-400 mb-8 leading-relaxed">
                The fireflies have swarmed the content! <br />
                <span className="text-yellow-400 font-medium">Click on the fireflies</span> to clear them and reveal the sections. 
                Unlock achievements as you explore.
              </p>
              <button 
                onClick={() => setShowInstructions(false)}
                className="w-full py-4 bg-yellow-400 text-black font-bold rounded-xl hover:bg-yellow-300 transition-colors uppercase tracking-widest text-sm"
              >
                Start Mission
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar Navigation */}
      <aside className="w-64 h-screen fixed left-0 top-0 border-r border-white/5 bg-black/40 backdrop-blur-xl z-50 flex flex-col">
        <div className="p-10 border-b border-white/5">
          <div className="font-mono text-sm tracking-widest text-white mb-1">
            IBRAHIM<span className="text-yellow-400">.DEV</span>
          </div>
          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Systems Architect</div>
        </div>
        
        <nav className="flex-1 py-10">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={(e) => {
                e.preventDefault();
                handleSectionVisit(item.id);
                document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`flex items-center gap-4 px-10 py-5 font-mono text-[11px] tracking-widest transition-all relative ${
                activeSection === item.id ? 'text-yellow-400 bg-yellow-400/5' : 'text-slate-500 hover:text-white hover:bg-white/5'
              }`}
            >
              {item.icon}
              {item.label}
              {activeSection === item.id && (
                <motion.div layoutId="nav-active" className="absolute right-0 top-1/4 bottom-1/4 w-1 bg-yellow-400 shadow-[0_0_10px_#facc15]" />
              )}
            </a>
          ))}
        </nav>

        {/* Achievements Preview */}
        <div className="p-8 border-t border-white/5 relative">
          <div className="flex items-center gap-2 mb-4 text-xs font-mono text-slate-500 uppercase tracking-widest">
            <Trophy size={14} className="text-yellow-400" />
            <span>Achievements</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {achievements.map(a => (
              <button 
                key={a.id} 
                onClick={() => setSelectedAchievement(a)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${
                  a.unlocked ? 'bg-yellow-400/10 border-yellow-400/30 text-yellow-400' : 'bg-white/5 border-white/5 text-slate-700'
                }`}
              >
                <Zap size={14} />
              </button>
            ))}
          </div>

          <AnimatePresence>
            {selectedAchievement && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-full left-4 right-4 mb-4 glass-card p-4 z-[60] border-yellow-400/20"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="text-[10px] font-mono text-yellow-400 uppercase tracking-widest">Achievement</div>
                  <button onClick={() => setSelectedAchievement(null)} className="text-slate-500 hover:text-white">×</button>
                </div>
                <div className="text-sm font-bold text-white mb-1">{selectedAchievement.title}</div>
                <div className="text-xs text-slate-400 leading-tight">{selectedAchievement.description}</div>
                {!selectedAchievement.unlocked && (
                  <div className="mt-2 text-[9px] font-mono text-slate-600 uppercase tracking-widest italic">[ Locked ]</div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-64 relative z-10 p-12 md:p-20 max-w-6xl">
        
        {/* Content Mask */}
        <AnimatePresence>
          {isLocked && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`fixed inset-0 z-10 pointer-events-none transition-colors duration-1000 ${level > 6 ? 'bg-red-900/20' : 'bg-black/40'} backdrop-blur-[4px]`}
            />
          )}
        </AnimatePresence>

        {/* Sections */}
        <div className={`transition-all duration-700 ${isLocked ? 'opacity-20 blur-sm scale-[0.98]' : 'opacity-100 blur-0 scale-100'}`}>
          
          {/* Hero Section */}
          <section id="about" className="min-h-[80vh] flex flex-col justify-center mb-32">
            <div className="max-w-3xl">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
              >
                <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-white mb-8">
                  Ibrahim Butt
                </h1>
                <p className="text-xl md:text-2xl text-slate-400 font-light leading-relaxed mb-12">
                  Building <span className="text-white font-medium">Multiplayer Worlds</span> and high-performance gameplay systems. Senior Software Engineer specializing in core architecture.
                </p>
                <div className="flex gap-6">
                  <a href="#" className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-white">
                    <Github size={20} />
                  </a>
                  <a href="#" className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-white">
                    <Linkedin size={20} />
                  </a>
                  <a href="#" className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-white">
                    <Mail size={20} />
                  </a>
                </div>
              </motion.div>
            </div>
          </section>

          {/* Experience Section */}
          <section id="experience" className="mb-40">
            <div className="flex items-center gap-4 mb-12">
              <h2 className="text-xs font-mono tracking-[0.4em] uppercase text-yellow-400">Deployment History</h2>
              <div className="h-[1px] flex-1 bg-white/5" />
            </div>
            <div className="space-y-16">
              {EXPERIENCE.map((exp, idx) => (
                <div key={idx} className="relative pl-8 border-l border-white/5">
                  <div className="absolute -left-[5px] top-0 w-2 h-2 bg-yellow-400 rounded-full shadow-[0_0_10px_#facc15]" />
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                    <h3 className="text-2xl font-semibold text-white">{exp.role}</h3>
                    <span className="font-mono text-xs text-slate-500 uppercase tracking-widest">{exp.period}</span>
                  </div>
                  <div className="text-yellow-400/60 font-mono text-[10px] uppercase tracking-[0.2em] mb-6">{exp.company}</div>
                  <p className="text-slate-400 leading-relaxed max-w-2xl">{exp.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Skills Section */}
          <section id="skills" className="mb-40">
            <div className="flex items-center gap-4 mb-12">
              <h2 className="text-xs font-mono tracking-[0.4em] uppercase text-yellow-400">Technical Arsenal</h2>
              <div className="h-[1px] flex-1 bg-white/5" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.keys(TECH_SVGS).map((name) => (
                <div key={name} className="glass-card p-8 flex flex-col items-center gap-4 hover:bg-white/5 transition-all group">
                  <div className="text-slate-500 group-hover:text-yellow-400 transition-colors">
                    {TECH_SVGS[name as keyof typeof TECH_SVGS]}
                  </div>
                  <span className="text-[10px] font-mono text-slate-600 group-hover:text-slate-300 uppercase tracking-widest">{name}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Projects Section */}
          <section id="projects" className="mb-40">
            <div className="flex items-center gap-4 mb-12">
              <h2 className="text-xs font-mono tracking-[0.4em] uppercase text-yellow-400">Mission Log</h2>
              <div className="h-[1px] flex-1 bg-white/5" />
            </div>
            <div className="grid grid-cols-1 gap-20">
              {PROJECTS.map((project) => (
                <div key={project.id} className="group">
                  <div className="relative aspect-video rounded-3xl overflow-hidden mb-8 border border-white/5">
                    <img src={project.image} alt={project.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-all" />
                    
                    {/* Project Interaction Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                      <div className="flex gap-4">
                        {project.videoUrl && (
                          <button 
                            onClick={() => setActiveVideo(project.videoUrl!)}
                            className="p-4 rounded-full bg-yellow-400 text-black hover:scale-110 transition-transform shadow-xl"
                          >
                            <Zap size={24} fill="currentColor" />
                          </button>
                        )}
                        {project.link && (
                          <a 
                            href={project.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-4 rounded-full bg-white text-black hover:scale-110 transition-transform shadow-xl"
                          >
                            <Github size={24} />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-3xl font-bold text-white group-hover:text-yellow-400 transition-colors">{project.title}</h3>
                    <div className="flex gap-4">
                      {project.techs.map(tech => (
                        <div key={tech} className="text-slate-600 hover:text-white transition-colors">
                          {TECH_SVGS[tech]}
                        </div>
                      ))}
                    </div>
                  </div>
                  <p className="text-slate-400 leading-relaxed max-w-2xl mb-8">{project.summary}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Contact Section */}
          <section id="contact" className="mb-40">
            <div className="glass-card p-12 md:p-20 text-center">
              <h2 className="text-4xl md:text-6xl font-bold text-white mb-8">Ready for Deployment?</h2>
              <p className="text-slate-400 mb-12 max-w-xl mx-auto leading-relaxed">
                Available for high-stakes multiplayer projects and core gameplay architecture. Initialize connection via secure channels.
              </p>
              <a 
                href="mailto:ibrahim.alibu11work@gmail.com"
                className="inline-block px-10 py-5 bg-white text-black font-bold rounded-2xl hover:bg-yellow-400 transition-all uppercase tracking-widest text-sm"
              >
                Send Message
              </a>
            </div>
          </section>

          {/* Footer */}
          <footer className="py-20 border-t border-white/5 text-center text-[10px] font-mono text-slate-600 uppercase tracking-[0.5em]">
            Ibrahim Butt // Core Systems // 2026
          </footer>
        </div>
      </main>

      {/* Game Status UI */}
      <div className="fixed bottom-10 right-10 z-50 flex flex-col items-end gap-4 pointer-events-none">
        {shockwaveReady && (
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="glass-card px-6 py-3 border-emerald-400/30 text-emerald-400 text-[10px] font-mono uppercase tracking-widest flex items-center gap-3"
          >
            <Zap size={14} className="animate-pulse" />
            Shockwave Ready (Right Click)
          </motion.div>
        )}
        <div className="glass-card px-6 py-3 flex items-center gap-4">
          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Threat Level</div>
          <div className={`text-xs font-mono uppercase tracking-widest ${level > 3 ? 'text-red-400' : 'text-yellow-400'}`}>
            Level {Math.floor(level)}
          </div>
        </div>
        <div className="glass-card px-6 py-3 flex items-center gap-4">
          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Cleared</div>
          <div className="text-xs font-mono text-yellow-400 uppercase tracking-widest">
            {killCount} Fireflies
          </div>
        </div>
      </div>
      {/* Video Modal */}
      <AnimatePresence>
        {activeVideo && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-20"
            onClick={() => setActiveVideo(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-5xl aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10"
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setActiveVideo(null)}
                className="absolute top-6 right-6 z-10 p-2 bg-black/50 hover:bg-black text-white rounded-full transition-colors"
              >
                <Zap size={20} className="rotate-45" />
              </button>
              <iframe 
                src={activeVideo} 
                className="w-full h-full" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
