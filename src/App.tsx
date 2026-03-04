import {memo, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties} from 'react';

interface Point {
  x: number;
  y: number;
}

interface Segment {
  start: Point;
  end: Point;
}

interface SegmentInfo {
  distance: number;
  vectorX: number;
  vectorY: number;
}

interface Particle {
  id: number;
  anchorId: string;
  offsetX: number;
  offsetY: number;
  jitterX: number;
  jitterY: number;
  driftVX: number;
  driftVY: number;
  shield: number;
  radius: number;
  morphDuration: number;
  wobbleDelay: number;
  dodgeBias: number;
  lastDodgeAt: number;
}

interface ParticleFragment {
  id: number;
  x: number;
  y: number;
  size: number;
  dx: number;
  dy: number;
  spin: number;
  bornAt: number;
  lifetime: number;
  half: 'left' | 'right';
  kind: 'blob' | 'shield';
}

interface SlashTrail {
  id: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  bornAt: number;
  lifetime: number;
  kind: 'primary' | 'secondary';
}

interface AbilityBurst {
  id: number;
  x: number;
  y: number;
  bornAt: number;
  lifetime: number;
  kind: 'dash' | 'punch';
}

interface MlSample {
  t: number;
  x: number;
  y: number;
  features: number[];
}

interface MlMetrics {
  confidence: number;
  errorPx: number;
  samples: number;
}

interface MlPrediction {
  x: number;
  y: number;
  confidence: number;
}

interface PlayerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  targetX: number;
  targetY: number;
}

interface Quest {
  id: 'clear' | 'explore' | 'survive';
  title: string;
  progress: number;
  target: number;
  completed: boolean;
}

interface SectionData {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
}

type SectionRegistrar = (id: string) => (node: HTMLElement | null) => void;

const SECTION_CONTENT: SectionData[] = [
  {
    id: 'about',
    eyebrow: 'Origin',
    title: 'Gameplay Engineer With Product Sense',
    body: 'I design and ship game systems that are smooth under pressure. My work spans Unity gameplay loops, multiplayer architecture, and production pipelines that keep teams fast.',
  },
  {
    id: 'skills',
    eyebrow: 'Loadout',
    title: 'Core Skills',
    body: 'Unity, C#, Photon Fusion, backend APIs, technical leadership, and data-informed balancing. I enjoy systems that feel elegant to players and maintainable for teams.',
  },
  {
    id: 'projects',
    eyebrow: 'Missions',
    title: 'Featured Projects',
    body: 'Battle royale prototypes, multiplayer card systems, and performant WebGL releases. My focus is reliable netcode, responsive combat, and smooth onboarding flows.',
  },
  {
    id: 'contact',
    eyebrow: 'Extraction',
    title: "Let's Build Something Fast",
    body: 'If you are scaling a game team or launching a production feature, I can help shape architecture and execute across gameplay + platform constraints.',
  },
];

const PROJECTS = [
  {
    name: 'Nanocry',
    summary: 'Faction battle royale architecture with server-authoritative combat and replication tuning.',
    stack: 'Unity, C#, Photon Fusion',
  },
  {
    name: 'Sacred Tails',
    summary: 'Turn-based multiplayer card game with reliable match flow and backend-linked progression.',
    stack: 'Unity, Azure, Live Ops',
  },
  {
    name: 'Funny Shooter',
    summary: 'WebGL multiplayer FPS with optimized memory footprint and stable browser frame pacing.',
    stack: 'Unity WebGL, Netcode',
  },
];

const SKILLS = ['Unity', 'C#', 'Photon Fusion', 'Multiplayer Architecture', 'Backend APIs', 'Technical Leadership'];

const SECTION_IDS = SECTION_CONTENT.map(section => section.id);
const PARTICLE_ANCHORS = ['hero', ...SECTION_IDS];
const MOBILE_ANCHORS = ['m0', 'm1', 'm2', 'm3', 'm4', 'm5'];

const MOBILE_ARENA_ZONES = [
  {x: 0.05, y: 0.2, w: 0.3, h: 0.22},
  {x: 0.36, y: 0.14, w: 0.3, h: 0.22},
  {x: 0.67, y: 0.22, w: 0.28, h: 0.22},
  {x: 0.08, y: 0.49, w: 0.31, h: 0.24},
  {x: 0.4, y: 0.46, w: 0.29, h: 0.25},
  {x: 0.69, y: 0.52, w: 0.26, h: 0.24},
];

const QUEST_GOALS = {
  clear: 44,
  explore: SECTION_IDS.length,
  survive: 8,
};

const MAX_THREAT = 10;
const TARGET_BLOBS = 5;
const MAX_BLOBS = 5;
const JITTER_LIMIT = 132;
const TRAIL_LIFETIME_MS = 170;
const FRAGMENT_LIFETIME_MS = 1120;
const COMET_SIZE = 44;
const COMET_TAIL_NODES = 9;
const COMET_SEGMENT_STEP = 12;
const TRAIL_EMIT_INTERVAL_MS = 34;
const DEFAULT_MOVEMENT_TUNING = 1.75;
const DEFAULT_DODGE_TUNING = 1.25;
const DASH_DURATION_MS = 260;
const DASH_COOLDOWN_MS = 1800;
const DASH_SPEED_MULT = 2.25;
const PUNCH_COOLDOWN_MS = 1050;
const PUNCH_LIFETIME_MS = 320;
const ML_FEATURE_COUNT = 9;
const ML_HORIZON_MS = 220;
const ML_LEARNING_RATE = 0.085;
const ML_WEIGHT_DECAY = 0.00028;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const randomBetween = (min: number, max: number) => min + Math.random() * (max - min);
const detectMobileArena = () =>
  typeof window !== 'undefined' && window.matchMedia('(max-width: 900px) and (pointer: coarse)').matches;

const formatClock = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
};

const formatCooldown = (remainingMs: number) => (remainingMs <= 0 ? 'Ready' : `${(remainingMs / 1000).toFixed(1)}s`);
const dot = (weights: number[], features: number[]) => {
  let total = 0;
  for (let index = 0; index < features.length; index += 1) {
    total += weights[index] * features[index];
  }
  return total;
};

const segmentPointInfo = (point: Point, start: Point, end: Point): SegmentInfo => {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) {
    const vectorX = point.x - start.x;
    const vectorY = point.y - start.y;
    return {
      distance: Math.hypot(vectorX, vectorY),
      vectorX,
      vectorY,
    };
  }

  const projection = ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared;
  const t = clamp(projection, 0, 1);

  const closestX = start.x + dx * t;
  const closestY = start.y + dy * t;

  const vectorX = point.x - closestX;
  const vectorY = point.y - closestY;

  return {
    distance: Math.hypot(vectorX, vectorY),
    vectorX,
    vectorY,
  };
};

const buildTwinSegments = (start: Point, end: Point, gap: number): [Segment, Segment] => {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.hypot(dx, dy) || 1;

  const normalX = -dy / length;
  const normalY = dx / length;
  const offset = gap * 0.5;

  return [
    {
      start: {
        x: start.x + normalX * offset,
        y: start.y + normalY * offset,
      },
      end: {
        x: end.x + normalX * offset,
        y: end.y + normalY * offset,
      },
    },
    {
      start: {
        x: start.x - normalX * offset,
        y: start.y - normalY * offset,
      },
      end: {
        x: end.x - normalX * offset,
        y: end.y - normalY * offset,
      },
    },
  ];
};

const createParticle = (id: number, anchorId: string, threatLevel: number): Particle => {
  const eliteChance = clamp(0.03 + threatLevel * 0.012, 0.03, 0.18);
  const armoredChance = clamp(0.16 + threatLevel * 0.04, 0.16, 0.62);
  const shieldRoll = Math.random();

  const shield = shieldRoll < eliteChance ? 3 : shieldRoll < armoredChance ? 2 : 1;
  const radius = randomBetween(15.5, 24.5) + shield * 1.8;

  return {
    id,
    anchorId,
    offsetX: randomBetween(0.14, 0.86),
    offsetY: randomBetween(0.15, 0.85),
    jitterX: randomBetween(-26, 26),
    jitterY: randomBetween(-26, 26),
    driftVX: randomBetween(-38, 38),
    driftVY: randomBetween(-38, 38),
    shield,
    radius,
    morphDuration: randomBetween(2.5, 4.9),
    wobbleDelay: randomBetween(0, 1.9),
    dodgeBias: randomBetween(-0.09, 0.08),
    lastDodgeAt: 0,
  };
};

const ContentSections = memo(function ContentSections({registerSection}: {registerSection: SectionRegistrar}) {
  return (
    <div className="content-grid">
      {SECTION_CONTENT.map(section => (
        <section key={section.id} className="panel section-card" ref={registerSection(section.id)} data-section-id={section.id}>
          <p className="eyebrow">{section.eyebrow}</p>
          <h2>{section.title}</h2>
          <p>{section.body}</p>

          {section.id === 'skills' && (
            <div className="chip-row">
              {SKILLS.map(skill => (
                <span key={skill} className="chip">
                  {skill}
                </span>
              ))}
            </div>
          )}

          {section.id === 'projects' && (
            <div className="projects">
              {PROJECTS.map(project => (
                <article key={project.name} className="project-card">
                  <h3>{project.name}</h3>
                  <p>{project.summary}</p>
                  <small>{project.stack}</small>
                </article>
              ))}
            </div>
          )}

          {section.id === 'contact' && (
            <a className="contact-button" href="mailto:ibrahimbu11@gmail.com">
              Start a project
            </a>
          )}
        </section>
      ))}
    </div>
  );
});

export default function App() {
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const particleIdRef = useRef(1);
  const fragmentIdRef = useRef(1);
  const trailIdRef = useRef(1);
  const burstIdRef = useRef(1);

  const particlesRef = useRef<Particle[]>([]);
  const playerRef = useRef<PlayerState>({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    angle: 0,
    targetX: 0,
    targetY: 0,
  });
  const playerTrailRef = useRef<Point[]>([]);
  const playerNodeRef = useRef<HTMLDivElement | null>(null);
  const tailNodeRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const movementFrameRef = useRef<number | null>(null);
  const movementTimeRef = useRef<number | null>(null);
  const blobMotionFrameRef = useRef<number | null>(null);
  const blobMotionTimeRef = useRef<number | null>(null);
  const trailEmitAtRef = useRef(0);
  const dashUntilRef = useRef(0);
  const dashCooldownUntilRef = useRef(0);
  const punchCooldownUntilRef = useRef(0);
  const leftMouseHeldRef = useRef(false);
  const playerAccelRef = useRef<Point>({x: 0, y: 0});
  const mlPrevVelocityRef = useRef<Point>({x: 0, y: 0});
  const mlSamplesRef = useRef<MlSample[]>([]);
  const mlWeightsXRef = useRef<number[]>(Array.from({length: ML_FEATURE_COUNT}, () => 0));
  const mlWeightsYRef = useRef<number[]>(Array.from({length: ML_FEATURE_COUNT}, () => 0));
  const mlErrorEmaRef = useRef(220);
  const mlSampleCountRef = useRef(0);
  const mlMetricUpdateAtRef = useRef(0);
  const activePointerIdRef = useRef<number | null>(null);
  const activePointerTypeRef = useRef<'mouse' | 'touch' | 'pen' | null>(null);

  const [particles, setParticles] = useState<Particle[]>([]);
  const [fragments, setFragments] = useState<ParticleFragment[]>([]);
  const [slashTrails, setSlashTrails] = useState<SlashTrail[]>([]);
  const [abilityBursts, setAbilityBursts] = useState<AbilityBurst[]>([]);

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [threatProgress, setThreatProgress] = useState(0);
  const [autoThreatLevel, setAutoThreatLevel] = useState(1);
  const [debugThreatLevel, setDebugThreatLevel] = useState<number | null>(null);
  const [movementTuning, setMovementTuning] = useState(DEFAULT_MOVEMENT_TUNING);
  const [dodgeTuning, setDodgeTuning] = useState(DEFAULT_DODGE_TUNING);
  const [debugOpen, setDebugOpen] = useState(true);
  const [kills, setKills] = useState(0);
  const [visitedSections, setVisitedSections] = useState<string[]>([]);
  const [isMobileArena, setIsMobileArena] = useState(detectMobileArena);
  const [abilityClock, setAbilityClock] = useState(() => Date.now());
  const [mlMetrics, setMlMetrics] = useState<MlMetrics>({
    confidence: 0,
    errorPx: 220,
    samples: 0,
  });

  const threatLevel = debugThreatLevel ?? autoThreatLevel;

  const registerSection = useCallback((id: string) => (node: HTMLElement | null) => {
    sectionRefs.current[id] = node;
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 900px) and (pointer: coarse)');
    const updateMode = () => {
      setIsMobileArena(mediaQuery.matches);
    };

    updateMode();
    mediaQuery.addEventListener('change', updateMode);
    window.addEventListener('resize', updateMode);

    return () => {
      mediaQuery.removeEventListener('change', updateMode);
      window.removeEventListener('resize', updateMode);
    };
  }, []);

  useEffect(() => {
    const resetPlayer = () => {
      const startX = window.innerWidth * 0.5;
      const startY = window.innerHeight * (isMobileArena ? 0.7 : 0.6);

      playerRef.current = {
        x: startX,
        y: startY,
        vx: 0,
        vy: 0,
        angle: -Math.PI / 2,
        targetX: startX,
        targetY: startY,
      };
      playerAccelRef.current = {x: 0, y: 0};
      mlPrevVelocityRef.current = {x: 0, y: 0};
      mlSamplesRef.current = [];
      mlErrorEmaRef.current = 220;
      mlSampleCountRef.current = 0;
      mlMetricUpdateAtRef.current = 0;
      setMlMetrics({
        confidence: 0,
        errorPx: 220,
        samples: 0,
      });

      playerTrailRef.current = Array.from({length: COMET_TAIL_NODES}, () => ({x: startX, y: startY}));

      if (playerNodeRef.current) {
        playerNodeRef.current.style.left = `${startX}px`;
        playerNodeRef.current.style.top = `${startY}px`;
        playerNodeRef.current.style.transform = `translate(-50%, -50%) rotate(${-Math.PI / 2}rad)`;
      }

      for (let index = 0; index < COMET_TAIL_NODES; index += 1) {
        const node = tailNodeRefs.current[index];
        if (!node) {
          continue;
        }

        node.style.left = `${startX}px`;
        node.style.top = `${startY}px`;
        node.style.opacity = `${clamp(0.84 - index * 0.08, 0.06, 0.84)}`;
        node.style.transform = `translate(-50%, -50%) scale(${clamp(1 - index * 0.075, 0.22, 1)})`;
      }
    };

    resetPlayer();
    window.addEventListener('resize', resetPlayer);

    return () => {
      window.removeEventListener('resize', resetPlayer);
    };
  }, [isMobileArena]);

  const getParticleCenter = useCallback(
    (particle: Particle, rectCache?: Map<string, DOMRect>) => {
      if (isMobileArena) {
        let zoneIndex = particle.id % MOBILE_ARENA_ZONES.length;
        if (particle.anchorId.startsWith('m')) {
          const parsed = Number.parseInt(particle.anchorId.slice(1), 10);
          if (!Number.isNaN(parsed)) {
            zoneIndex = parsed % MOBILE_ARENA_ZONES.length;
          }
        }

        const zone = MOBILE_ARENA_ZONES[zoneIndex];
        const left = window.innerWidth * zone.x;
        const top = window.innerHeight * zone.y;
        const width = window.innerWidth * zone.w;
        const height = window.innerHeight * zone.h;

        return {
          x: left + width * particle.offsetX + particle.jitterX,
          y: top + height * particle.offsetY + particle.jitterY,
        };
      }

      if (rectCache) {
        let rect = rectCache.get(particle.anchorId);
        if (!rect) {
          const anchor = sectionRefs.current[particle.anchorId];
          if (!anchor) {
            return null;
          }
          rect = anchor.getBoundingClientRect();
          rectCache.set(particle.anchorId, rect);
        }

        return {
          x: rect.left + rect.width * particle.offsetX + particle.jitterX,
          y: rect.top + rect.height * particle.offsetY + particle.jitterY,
        };
      }

      const anchor = sectionRefs.current[particle.anchorId];
      if (!anchor) {
        return null;
      }

      const rect = anchor.getBoundingClientRect();
      return {
        x: rect.left + rect.width * particle.offsetX + particle.jitterX,
        y: rect.top + rect.height * particle.offsetY + particle.jitterY,
      };
    },
    [isMobileArena],
  );

  const buildMlFeatures = useCallback((player: PlayerState) => {
    const acceleration = playerAccelRef.current;
    const vxNorm = clamp(player.vx / 920, -2.2, 2.2);
    const vyNorm = clamp(player.vy / 920, -2.2, 2.2);
    const speedNorm = clamp(Math.hypot(player.vx, player.vy) / 980, 0, 2.6);
    const axNorm = clamp(acceleration.x / 2600, -2.2, 2.2);
    const ayNorm = clamp(acceleration.y / 2600, -2.2, 2.2);
    const sinA = Math.sin(player.angle);
    const cosA = Math.cos(player.angle);
    const cross = clamp(vxNorm * vyNorm, -2, 2);

    return [1, vxNorm, vyNorm, speedNorm, axNorm, ayNorm, sinA, cosA, cross];
  }, []);

  const predictPlayerWithMl = useCallback(
    (player: PlayerState): MlPrediction => {
      const features = buildMlFeatures(player);
      const mlDx = clamp(dot(mlWeightsXRef.current, features), -460, 460);
      const mlDy = clamp(dot(mlWeightsYRef.current, features), -460, 460);

      const horizonSeconds = ML_HORIZON_MS / 1000;
      const acceleration = playerAccelRef.current;
      const fallbackX = player.x + player.vx * horizonSeconds + 0.5 * acceleration.x * horizonSeconds * horizonSeconds;
      const fallbackY = player.y + player.vy * horizonSeconds + 0.5 * acceleration.y * horizonSeconds * horizonSeconds;

      const modelX = player.x + mlDx;
      const modelY = player.y + mlDy;
      const confidence = clamp(1 - mlErrorEmaRef.current / 260, 0.06, 0.97);
      const modelWeight = 0.26 + confidence * 0.66;

      return {
        x: fallbackX * (1 - modelWeight) + modelX * modelWeight,
        y: fallbackY * (1 - modelWeight) + modelY * modelWeight,
        confidence,
      };
    },
    [buildMlFeatures],
  );

  useEffect(() => {
    particlesRef.current = particles;
  }, [particles]);

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setElapsedSeconds(previous => previous + 1);
      setThreatProgress(previous => previous + 1);
    }, 1000);

    return () => {
      window.clearInterval(timerId);
    };
  }, []);

  useEffect(() => {
    const abilityTimer = window.setInterval(() => {
      setAbilityClock(Date.now());
    }, 90);

    return () => {
      window.clearInterval(abilityTimer);
    };
  }, []);

  useEffect(() => {
    setAutoThreatLevel(Math.min(MAX_THREAT, 1 + Math.floor(threatProgress / 14)));
  }, [threatProgress]);

  useEffect(() => {
    setParticles(previous => {
      if (previous.length > 0) {
        return previous;
      }

      const seedCount = 4;
      const anchorPool = isMobileArena ? MOBILE_ANCHORS : PARTICLE_ANCHORS;
      return Array.from({length: seedCount}, () => {
        const anchorId = anchorPool[Math.floor(Math.random() * anchorPool.length)];
        const particle = createParticle(particleIdRef.current, anchorId, 1);
        particleIdRef.current += 1;
        return particle;
      });
    });
  }, [isMobileArena]);

  useEffect(() => {
    const spawnInterval = window.setInterval(() => {
      setParticles(previous => {
        if (previous.length >= TARGET_BLOBS) {
          return previous;
        }

        const capacity = MAX_BLOBS - previous.length;
        if (capacity <= 0) {
          return previous;
        }

        const spawnBudget = Math.min(1, capacity);
        const fillChance = previous.length < TARGET_BLOBS * 0.5 ? 0.86 : 0.54;
        const anchorPool = isMobileArena ? MOBILE_ANCHORS : PARTICLE_ANCHORS;

        const created: Particle[] = [];

        for (let index = 0; index < spawnBudget; index += 1) {
          if (Math.random() > fillChance) {
            continue;
          }

          const anchorId = anchorPool[Math.floor(Math.random() * anchorPool.length)];
          const particle = createParticle(particleIdRef.current, anchorId, threatLevel);
          particleIdRef.current += 1;
          created.push(particle);
        }

        if (created.length === 0) {
          return previous;
        }

        return [...previous, ...created].slice(0, MAX_BLOBS);
      });
    }, 760);

    return () => {
      window.clearInterval(spawnInterval);
    };
  }, [isMobileArena, threatLevel]);

  useEffect(() => {
    const cleanupInterval = window.setInterval(() => {
      const now = Date.now();

      setSlashTrails(previous => {
        if (previous.length === 0) {
          return previous;
        }

        const next = previous.filter(trail => now - trail.bornAt < trail.lifetime);
        return next.length === previous.length ? previous : next;
      });

      setFragments(previous => {
        if (previous.length === 0) {
          return previous;
        }

        const next = previous.filter(fragment => now - fragment.bornAt < fragment.lifetime);
        return next.length === previous.length ? previous : next;
      });

      setAbilityBursts(previous => {
        if (previous.length === 0) {
          return previous;
        }

        const next = previous.filter(burst => now - burst.bornAt < burst.lifetime);
        return next.length === previous.length ? previous : next;
      });
    }, 110);

    return () => {
      window.clearInterval(cleanupInterval);
    };
  }, []);

  useEffect(() => {
    const stepBlobMotion = (frameTime: number) => {
      const previousTime = blobMotionTimeRef.current ?? frameTime;
      const dt = clamp((frameTime - previousTime) / 1000, 1 / 200, 0.05);
      blobMotionTimeRef.current = frameTime;

      const player = playerRef.current;
      const prediction = predictPlayerWithMl(player);
      const predictedPlayerX = prediction.x;
      const predictedPlayerY = prediction.y;

      const activationRadius = (176 + threatLevel * 16) * movementTuning * (0.88 + prediction.confidence * 0.3);
      const panicRadius = activationRadius * (0.52 + prediction.confidence * 0.14);
      const escapeSpeedBase = (118 + threatLevel * 23) * movementTuning * (0.9 + prediction.confidence * 0.34);
      const steerStrength = clamp((8.8 + threatLevel * 0.42) * dt, 0.09, 0.56);
      const maxDrift = (240 + threatLevel * 34) * movementTuning;
      const timeSeconds = frameTime * 0.001;

      setParticles(previous => {
        if (previous.length === 0) {
          return previous;
        }

        const rectCache = new Map<string, DOMRect>();
        const next = previous.map(particle => {
          const center = getParticleCenter(particle, rectCache);
          if (!center) {
            return {
              ...particle,
              driftVX: particle.driftVX * 0.9,
              driftVY: particle.driftVY * 0.9,
            };
          }

          const deltaX = center.x - predictedPlayerX;
          const deltaY = center.y - predictedPlayerY;
          const distance = Math.hypot(deltaX, deltaY) || 1;

          let desiredVX = 0;
          let desiredVY = 0;

          if (distance < activationRadius) {
            const awayX = deltaX / distance;
            const awayY = deltaY / distance;
            const tangentX = -awayY;
            const tangentY = awayX;
            const urgency = clamp((activationRadius - distance) / activationRadius, 0.08, 1);
            const panicBoost = distance < panicRadius ? 1.55 : 1;
            const chaosWave =
              Math.sin(timeSeconds * 8.2 + particle.id * 1.17) * 0.55 +
              Math.cos(timeSeconds * 5.8 + particle.id * 0.67) * 0.42 +
              particle.dodgeBias * 1.15 +
              prediction.confidence * 0.22;

            const escapeSpeed = escapeSpeedBase * urgency * panicBoost;
            desiredVX = awayX * escapeSpeed + tangentX * escapeSpeed * 0.48 * chaosWave;
            desiredVY = awayY * escapeSpeed + tangentY * escapeSpeed * 0.48 * chaosWave;
          }

          let driftVX = particle.driftVX + (desiredVX - particle.driftVX) * steerStrength;
          let driftVY = particle.driftVY + (desiredVY - particle.driftVY) * steerStrength;

          if (distance >= activationRadius) {
            const idleDamp = Math.exp(-9.2 * dt);
            driftVX *= idleDamp;
            driftVY *= idleDamp;
          }

          driftVX = clamp(driftVX, -maxDrift, maxDrift);
          driftVY = clamp(driftVY, -maxDrift, maxDrift);

          let jitterX = particle.jitterX + driftVX * dt;
          let jitterY = particle.jitterY + driftVY * dt;

          if (Math.abs(jitterX) >= JITTER_LIMIT) {
            jitterX = clamp(jitterX, -JITTER_LIMIT, JITTER_LIMIT);
            driftVX *= -0.56;
          }

          if (Math.abs(jitterY) >= JITTER_LIMIT) {
            jitterY = clamp(jitterY, -JITTER_LIMIT, JITTER_LIMIT);
            driftVY *= -0.56;
          }

          return {
            ...particle,
            jitterX,
            jitterY,
            driftVX,
            driftVY,
          };
        });

        particlesRef.current = next;
        return next;
      });

      blobMotionFrameRef.current = window.requestAnimationFrame(stepBlobMotion);
    };

    blobMotionFrameRef.current = window.requestAnimationFrame(stepBlobMotion);

    return () => {
      if (blobMotionFrameRef.current !== null) {
        window.cancelAnimationFrame(blobMotionFrameRef.current);
        blobMotionFrameRef.current = null;
      }
      blobMotionTimeRef.current = null;
    };
  }, [getParticleCenter, movementTuning, predictPlayerWithMl, threatLevel]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        setVisitedSections(previous => {
          const tracker = new Set(previous);
          let changed = false;

          for (const entry of entries) {
            if (!entry.isIntersecting) {
              continue;
            }

            const sectionId = (entry.target as HTMLElement).dataset.sectionId;
            if (!sectionId || tracker.has(sectionId)) {
              continue;
            }

            tracker.add(sectionId);
            changed = true;
          }

          return changed ? Array.from(tracker) : previous;
        });
      },
      {
        threshold: 0.45,
      },
    );

    for (const id of SECTION_IDS) {
      const node = sectionRefs.current[id];
      if (node) {
        observer.observe(node);
      }
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  const quests: Quest[] = useMemo(
    () => [
      {
        id: 'clear',
        title: 'Sweep Protocol',
        progress: Math.min(kills, QUEST_GOALS.clear),
        target: QUEST_GOALS.clear,
        completed: kills >= QUEST_GOALS.clear,
      },
      {
        id: 'explore',
        title: 'Map Discovery',
        progress: Math.min(visitedSections.length, QUEST_GOALS.explore),
        target: QUEST_GOALS.explore,
        completed: visitedSections.length >= QUEST_GOALS.explore,
      },
      {
        id: 'survive',
        title: 'Threat Hold',
        progress: Math.min(threatLevel, QUEST_GOALS.survive),
        target: QUEST_GOALS.survive,
        completed: threatLevel >= QUEST_GOALS.survive,
      },
    ],
    [kills, threatLevel, visitedSections.length],
  );

  const cometCutRadius = Math.round(16 + threatLevel * 2.8);
  const cometBladeGap = Math.round(12 + threatLevel * 2.4);
  const cometMaxSpeed = Math.round(420 + threatLevel * 32);
  const dodgeChanceBase = clamp((0.1 + threatLevel * 0.035) * dodgeTuning, 0.08, 0.74);

  const createFragmentsFromHits = useCallback((hits: Array<{x: number; y: number; radius: number}>) => {
    if (hits.length === 0) {
      return;
    }

    const bornAt = Date.now();
    const created: ParticleFragment[] = [];

    for (const hit of hits) {
      const size = Math.max(32, hit.radius * 1.95);
      const sideDrift = randomBetween(90, 170);
      const drop = randomBetween(240, 360);

      created.push({
        id: fragmentIdRef.current,
        x: hit.x - 2,
        y: hit.y,
        size,
        dx: -sideDrift,
        dy: drop,
        spin: randomBetween(-240, -140),
        bornAt,
        lifetime: FRAGMENT_LIFETIME_MS,
        half: 'left',
        kind: 'blob',
      });
      fragmentIdRef.current += 1;

      created.push({
        id: fragmentIdRef.current,
        x: hit.x + 2,
        y: hit.y,
        size,
        dx: sideDrift,
        dy: drop,
        spin: randomBetween(140, 240),
        bornAt,
        lifetime: FRAGMENT_LIFETIME_MS,
        half: 'right',
        kind: 'blob',
      });
      fragmentIdRef.current += 1;
    }

    setFragments(previous => [...previous, ...created].slice(-220));
  }, []);

  const createShieldFragmentsFromHits = useCallback((hits: Array<{x: number; y: number}>) => {
    if (hits.length === 0) {
      return;
    }

    const bornAt = Date.now();
    const created: ParticleFragment[] = [];

    for (const hit of hits) {
      const size = randomBetween(13, 18);
      const sideDrift = randomBetween(52, 118);
      const drop = randomBetween(140, 220);

      created.push({
        id: fragmentIdRef.current,
        x: hit.x - 1,
        y: hit.y - 2,
        size,
        dx: -sideDrift,
        dy: drop,
        spin: randomBetween(-190, -110),
        bornAt,
        lifetime: 620,
        half: 'left',
        kind: 'shield',
      });
      fragmentIdRef.current += 1;

      created.push({
        id: fragmentIdRef.current,
        x: hit.x + 1,
        y: hit.y - 2,
        size,
        dx: sideDrift,
        dy: drop,
        spin: randomBetween(110, 190),
        bornAt,
        lifetime: 620,
        half: 'right',
        kind: 'shield',
      });
      fragmentIdRef.current += 1;
    }

    setFragments(previous => [...previous, ...created].slice(-220));
  }, []);

  const triggerDash = useCallback(() => {
    const now = Date.now();
    if (now < dashCooldownUntilRef.current) {
      return false;
    }

    dashUntilRef.current = now + DASH_DURATION_MS;
    dashCooldownUntilRef.current = now + DASH_COOLDOWN_MS;
    setAbilityClock(now);

    const player = playerRef.current;
    setAbilityBursts(previous => {
      const next: AbilityBurst[] = [
        ...previous,
        {
          id: burstIdRef.current,
          x: player.x,
          y: player.y,
          bornAt: now,
          lifetime: 260,
          kind: 'dash',
        },
      ];
      burstIdRef.current += 1;
      return next.slice(-40);
    });

    return true;
  }, []);

  const triggerPunch = useCallback(() => {
    const now = Date.now();
    if (now < punchCooldownUntilRef.current) {
      return false;
    }

    punchCooldownUntilRef.current = now + PUNCH_COOLDOWN_MS;
    setAbilityClock(now);

    const player = playerRef.current;
    const punchRadius = 64 + threatLevel * 5;

    setAbilityBursts(previous => {
      const next: AbilityBurst[] = [
        ...previous,
        {
          id: burstIdRef.current,
          x: player.x,
          y: player.y,
          bornAt: now,
          lifetime: PUNCH_LIFETIME_MS,
          kind: 'punch',
        },
      ];
      burstIdRef.current += 1;
      return next.slice(-40);
    });

    let killsThisPunch = 0;
    const cutHits: Array<{x: number; y: number; radius: number}> = [];
    const shieldHits: Array<{x: number; y: number}> = [];
    const rectCache = new Map<string, DOMRect>();
    let changed = false;
    const next: Particle[] = [];

    for (const particle of particlesRef.current) {
      const center = getParticleCenter(particle, rectCache);
      if (!center) {
        next.push(particle);
        continue;
      }

      const toParticleX = center.x - player.x;
      const toParticleY = center.y - player.y;
      const distance = Math.hypot(toParticleX, toParticleY);
      if (distance > punchRadius + particle.radius * 0.8) {
        next.push(particle);
        continue;
      }

      changed = true;
      const remainingShield = particle.shield - 1;
      const normalX = toParticleX / (distance || 1);
      const normalY = toParticleY / (distance || 1);

      if (remainingShield <= 0) {
        killsThisPunch += 1;
        cutHits.push({x: center.x, y: center.y, radius: particle.radius});
        continue;
      }

      shieldHits.push({x: center.x, y: center.y});
      const punchKick = 54 + threatLevel * 8 + remainingShield * 6;

      next.push({
        ...particle,
        shield: remainingShield,
        jitterX: clamp(particle.jitterX + normalX * punchKick, -JITTER_LIMIT, JITTER_LIMIT),
        jitterY: clamp(particle.jitterY + normalY * punchKick, -JITTER_LIMIT, JITTER_LIMIT),
        driftVX: clamp(particle.driftVX + normalX * 180, -320, 320),
        driftVY: clamp(particle.driftVY + normalY * 180, -320, 320),
        lastDodgeAt: now,
      });
    }

    if (changed) {
      particlesRef.current = next;
      setParticles(next);
    }

    if (killsThisPunch > 0) {
      setKills(previous => previous + killsThisPunch);
    }

    if (cutHits.length > 0) {
      createFragmentsFromHits(cutHits);
    }

    if (shieldHits.length > 0) {
      createShieldFragmentsFromHits(shieldHits);
    }

    return true;
  }, [createFragmentsFromHits, createShieldFragmentsFromHits, getParticleCenter, threatLevel]);

  const sweepParticlesWithComet = useCallback(
    (start: Point, end: Point, bornAt: number) => {
      const deltaX = end.x - start.x;
      const deltaY = end.y - start.y;
      const segmentLength = Math.hypot(deltaX, deltaY);
      if (segmentLength < 0.6) {
        return;
      }

      const dashActive = bornAt < dashUntilRef.current;
      const effectiveBladeGap = cometBladeGap + (dashActive ? 12 : 0);
      const effectiveCutRadius = cometCutRadius + (dashActive ? 18 : 0);

      const [segmentA, segmentB] = buildTwinSegments(start, end, effectiveBladeGap);
      const centerSegment: Segment = {start, end};
      const cometDirX = deltaX / (segmentLength || 1);
      const cometDirY = deltaY / (segmentLength || 1);

      if (segmentLength > 7 && bornAt - trailEmitAtRef.current >= TRAIL_EMIT_INTERVAL_MS) {
        const createdTrails: SlashTrail[] = [
          {
            id: trailIdRef.current,
            x1: segmentA.start.x,
            y1: segmentA.start.y,
            x2: segmentA.end.x,
            y2: segmentA.end.y,
            bornAt,
            lifetime: TRAIL_LIFETIME_MS,
            kind: 'primary',
          },
          {
            id: trailIdRef.current + 1,
            x1: segmentB.start.x,
            y1: segmentB.start.y,
            x2: segmentB.end.x,
            y2: segmentB.end.y,
            bornAt,
            lifetime: TRAIL_LIFETIME_MS,
            kind: 'secondary',
          },
        ];

        trailIdRef.current += 2;
        trailEmitAtRef.current = bornAt;
        setSlashTrails(previous => [...previous, ...createdTrails].slice(-120));
      }

      let killsThisSweep = 0;
      let changed = false;
      const cutHits: Array<{x: number; y: number; radius: number}> = [];
      const shieldHits: Array<{x: number; y: number}> = [];
      const rectCache = new Map<string, DOMRect>();
      const next: Particle[] = [];

      for (const particle of particlesRef.current) {
        const center = getParticleCenter(particle, rectCache);
        if (!center) {
          next.push(particle);
          continue;
        }

        const infoA = segmentPointInfo(center, segmentA.start, segmentA.end);
        const infoB = segmentPointInfo(center, segmentB.start, segmentB.end);
        const infoC = segmentPointInfo(center, centerSegment.start, centerSegment.end);
        let info = infoA;
        if (infoB.distance < info.distance) {
          info = infoB;
        }
        if (infoC.distance < info.distance) {
          info = infoC;
        }

        const hitRange = effectiveCutRadius + particle.radius * 0.8;
        const dodgeRange = hitRange + 16 + threatLevel * 0.7;

        if (info.distance <= hitRange) {
          changed = true;
          const remainingShield = particle.shield - 1;

          if (remainingShield <= 0) {
            killsThisSweep += 1;
            cutHits.push({x: center.x, y: center.y, radius: particle.radius});
            continue;
          }

          shieldHits.push({x: center.x, y: center.y});

          const vectorMagnitude = Math.hypot(info.vectorX, info.vectorY) || 1;
          const normalX = info.vectorX / vectorMagnitude;
          const normalY = info.vectorY / vectorMagnitude;
          const recoil = 18 + threatLevel * 2.8 + remainingShield * 8;

          next.push({
            ...particle,
            shield: remainingShield,
            jitterX: clamp(particle.jitterX + normalX * recoil + randomBetween(-4, 4), -JITTER_LIMIT, JITTER_LIMIT),
            jitterY: clamp(particle.jitterY + normalY * recoil + randomBetween(-4, 4), -JITTER_LIMIT, JITTER_LIMIT),
            driftVX: clamp(particle.driftVX + normalX * (58 + threatLevel * 11), -290, 290),
            driftVY: clamp(particle.driftVY + normalY * (58 + threatLevel * 11), -290, 290),
            lastDodgeAt: bornAt,
          });
          continue;
        }

        const dodgeChance = clamp((dodgeChanceBase + particle.dodgeBias) * (dashActive ? 0.6 : 1), 0.05, 0.68);
        const dodgeCooldown = Math.max(90, 260 - threatLevel * 16);
        const canDodge = bornAt - particle.lastDodgeAt > dodgeCooldown;
        const shouldDodge = info.distance > hitRange + 2 && info.distance <= dodgeRange;

        if (canDodge && shouldDodge && Math.random() < dodgeChance) {
          changed = true;
          const vectorMagnitude = Math.hypot(info.vectorX, info.vectorY) || 1;
          const normalX = info.vectorX / vectorMagnitude;
          const normalY = info.vectorY / vectorMagnitude;
          const lateralForce = 2.8 + threatLevel * 0.52 + randomBetween(0.25, 1.35);
          const backwardForce = 1.4 + threatLevel * 0.46 + randomBetween(0.12, 0.8);
          const dodgeX = normalX * lateralForce - cometDirX * backwardForce;
          const dodgeY = normalY * lateralForce - cometDirY * backwardForce;

          next.push({
            ...particle,
            jitterX: clamp(particle.jitterX + dodgeX + randomBetween(-1.2, 1.2), -JITTER_LIMIT, JITTER_LIMIT),
            jitterY: clamp(particle.jitterY + dodgeY + randomBetween(-1.2, 1.2), -JITTER_LIMIT, JITTER_LIMIT),
            driftVX: clamp(particle.driftVX + dodgeX * 20, -290, 290),
            driftVY: clamp(particle.driftVY + dodgeY * 20, -290, 290),
            lastDodgeAt: bornAt,
          });
          continue;
        }

        next.push(particle);
      }

      if (changed) {
        particlesRef.current = next;
        setParticles(next);
      }

      if (killsThisSweep > 0) {
        setKills(previous => previous + killsThisSweep);
      }

      if (cutHits.length > 0) {
        createFragmentsFromHits(cutHits);
      }

      if (shieldHits.length > 0) {
        createShieldFragmentsFromHits(shieldHits);
      }
    },
    [cometBladeGap, cometCutRadius, createFragmentsFromHits, createShieldFragmentsFromHits, dodgeChanceBase, getParticleCenter, threatLevel],
  );

  useEffect(() => {
    const isInteractiveTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) {
        return false;
      }

      return Boolean(target.closest('button, a, input, textarea, select, label'));
    };

    const setTarget = (x: number, y: number) => {
      playerRef.current.targetX = x;
      playerRef.current.targetY = y;
    };

    const onPointerDown = (event: PointerEvent) => {
      const isTouchLike = event.pointerType === 'touch' || event.pointerType === 'pen';
      if (isInteractiveTarget(event.target)) {
        return;
      }

      if (!isTouchLike) {
        if (event.button === 2) {
          event.preventDefault();
          triggerPunch();
          return;
        }

        if (event.button !== 0) {
          return;
        }

        leftMouseHeldRef.current = true;
        triggerDash();
        setTarget(event.clientX, event.clientY);
        return;
      }

      if (activePointerIdRef.current !== null && activePointerIdRef.current !== event.pointerId) {
        return;
      }

      activePointerIdRef.current = event.pointerId;
      activePointerTypeRef.current = event.pointerType === 'touch' ? 'touch' : 'pen';
      event.preventDefault();
      setTarget(event.clientX, event.clientY);
    };

    const onPointerMove = (event: PointerEvent) => {
      const isTouchLike = event.pointerType === 'touch' || event.pointerType === 'pen';
      if (!isTouchLike) {
        setTarget(event.clientX, event.clientY);
        return;
      }

      if (activePointerIdRef.current !== event.pointerId) {
        return;
      }

      setTarget(event.clientX, event.clientY);
      event.preventDefault();
    };

    const onPointerEnd = (event: PointerEvent) => {
      if (event.pointerType === 'mouse') {
        if (event.button === 0) {
          leftMouseHeldRef.current = false;
        }
        return;
      }

      if (activePointerIdRef.current === event.pointerId) {
        activePointerIdRef.current = null;
        activePointerTypeRef.current = null;
      }
    };

    const onMouseUp = (event: MouseEvent) => {
      if (event.button === 0) {
        leftMouseHeldRef.current = false;
      }
    };

    const onContextMenu = (event: MouseEvent) => {
      if (isInteractiveTarget(event.target)) {
        return;
      }
      event.preventDefault();
    };

    const onBlur = () => {
      activePointerIdRef.current = null;
      activePointerTypeRef.current = null;
      leftMouseHeldRef.current = false;
    };

    window.addEventListener('pointerdown', onPointerDown, {passive: false});
    window.addEventListener('pointermove', onPointerMove, {passive: false});
    window.addEventListener('pointerup', onPointerEnd, {passive: true});
    window.addEventListener('pointercancel', onPointerEnd, {passive: true});
    window.addEventListener('mouseup', onMouseUp, {passive: true});
    window.addEventListener('contextmenu', onContextMenu);
    window.addEventListener('blur', onBlur);

    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerEnd);
      window.removeEventListener('pointercancel', onPointerEnd);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('contextmenu', onContextMenu);
      window.removeEventListener('blur', onBlur);
      leftMouseHeldRef.current = false;
    };
  }, [triggerDash, triggerPunch]);

  useEffect(() => {
    const moveComet = (frameTime: number) => {
      const previousTime = movementTimeRef.current ?? frameTime;
      const dt = clamp((frameTime - previousTime) / 1000, 1 / 240, 0.05);
      movementTimeRef.current = frameTime;
      const now = Date.now();

      if (leftMouseHeldRef.current && now >= dashCooldownUntilRef.current) {
        triggerDash();
      }

      const dashActive = now < dashUntilRef.current;

      const player = playerRef.current;
      const toTargetX = player.targetX - player.x;
      const toTargetY = player.targetY - player.y;
      const distanceToTarget = Math.hypot(toTargetX, toTargetY) || 1;

      if (distanceToTarget > 0.5) {
        const pull = (1340 + threatLevel * 54) * (dashActive ? 2.6 : 1) * dt;
        player.vx += (toTargetX / distanceToTarget) * pull;
        player.vy += (toTargetY / distanceToTarget) * pull;
      }

      if (dashActive) {
        const thrust = (420 + threatLevel * 28) * dt;
        player.vx += Math.cos(player.angle) * thrust;
        player.vy += Math.sin(player.angle) * thrust;
      }

      const damping = Math.exp(-(dashActive ? 3.15 : 5.9) * dt);
      player.vx *= damping;
      player.vy *= damping;

      const speed = Math.hypot(player.vx, player.vy);
      const speedCap = dashActive ? cometMaxSpeed * DASH_SPEED_MULT : cometMaxSpeed;
      if (speed > speedCap) {
        const scale = speedCap / speed;
        player.vx *= scale;
        player.vy *= scale;
      }

      const previousPoint = {x: player.x, y: player.y};
      player.x = clamp(player.x + player.vx * dt, COMET_SIZE * 0.5, window.innerWidth - COMET_SIZE * 0.5);
      player.y = clamp(player.y + player.vy * dt, COMET_SIZE * 0.5, window.innerHeight - COMET_SIZE * 0.5);

      const previousVelocity = mlPrevVelocityRef.current;
      const invDt = 1 / Math.max(dt, 1 / 240);
      const accelX = clamp((player.vx - previousVelocity.x) * invDt, -3200, 3200);
      const accelY = clamp((player.vy - previousVelocity.y) * invDt, -3200, 3200);
      playerAccelRef.current = {x: accelX, y: accelY};
      mlPrevVelocityRef.current = {x: player.vx, y: player.vy};

      const featuresNow = buildMlFeatures(player);
      const samples = mlSamplesRef.current;
      samples.push({
        t: now,
        x: player.x,
        y: player.y,
        features: featuresNow,
      });
      if (samples.length > 240) {
        samples.splice(0, samples.length - 240);
      }

      const weightsX = mlWeightsXRef.current;
      const weightsY = mlWeightsYRef.current;
      while (samples.length > 0 && now - samples[0].t >= ML_HORIZON_MS) {
        const sample = samples.shift();
        if (!sample) {
          break;
        }

        const targetDx = player.x - sample.x;
        const targetDy = player.y - sample.y;
        if (Math.hypot(targetDx, targetDy) > 620) {
          continue;
        }

        const predictedDx = dot(weightsX, sample.features);
        const predictedDy = dot(weightsY, sample.features);
        const errorX = targetDx - predictedDx;
        const errorY = targetDy - predictedDy;
        const featureEnergy = sample.features.reduce((total, value) => total + value * value, 0);
        const lr = ML_LEARNING_RATE / (1 + featureEnergy * 0.38);

        for (let index = 0; index < sample.features.length; index += 1) {
          const feature = sample.features[index];
          weightsX[index] = clamp((weightsX[index] + lr * errorX * feature) * (1 - ML_WEIGHT_DECAY), -640, 640);
          weightsY[index] = clamp((weightsY[index] + lr * errorY * feature) * (1 - ML_WEIGHT_DECAY), -640, 640);
        }

        const frameError = Math.hypot(errorX, errorY);
        mlErrorEmaRef.current = mlErrorEmaRef.current * 0.93 + frameError * 0.07;
        mlSampleCountRef.current += 1;
      }

      if (now - mlMetricUpdateAtRef.current >= 260) {
        mlMetricUpdateAtRef.current = now;
        setMlMetrics({
          confidence: clamp(1 - mlErrorEmaRef.current / 260, 0.06, 0.97),
          errorPx: mlErrorEmaRef.current,
          samples: mlSampleCountRef.current,
        });
      }

      const moveX = player.x - previousPoint.x;
      const moveY = player.y - previousPoint.y;
      const moveDistance = Math.hypot(moveX, moveY);
      if (moveDistance > 0.9) {
        player.angle = Math.atan2(moveY, moveX);
        const steps = Math.max(1, Math.ceil(moveDistance / COMET_SEGMENT_STEP));
        const bornAt = Date.now();
        let from = previousPoint;

        for (let index = 1; index <= steps; index += 1) {
          const ratio = index / steps;
          const to = {
            x: previousPoint.x + moveX * ratio,
            y: previousPoint.y + moveY * ratio,
          };

          sweepParticlesWithComet(from, to, bornAt);
          from = to;
        }
      }

      const trail = playerTrailRef.current;
      trail.unshift({x: player.x, y: player.y});
      if (trail.length > COMET_TAIL_NODES + 1) {
        trail.length = COMET_TAIL_NODES + 1;
      }

      if (playerNodeRef.current) {
        playerNodeRef.current.style.left = `${player.x}px`;
        playerNodeRef.current.style.top = `${player.y}px`;
        playerNodeRef.current.style.transform = `translate(-50%, -50%) rotate(${player.angle}rad)`;
      }

      for (let index = 0; index < COMET_TAIL_NODES; index += 1) {
        const node = tailNodeRefs.current[index];
        if (!node) {
          continue;
        }

        const point = trail[index + 1] ?? trail[trail.length - 1] ?? {x: player.x, y: player.y};
        node.style.left = `${point.x}px`;
        node.style.top = `${point.y}px`;
        node.style.opacity = `${clamp(0.84 - index * 0.08, 0.06, 0.84)}`;
        node.style.transform = `translate(-50%, -50%) scale(${clamp(1 - index * 0.075, 0.22, 1)})`;
      }

      movementFrameRef.current = window.requestAnimationFrame(moveComet);
    };

    movementFrameRef.current = window.requestAnimationFrame(moveComet);

    return () => {
      if (movementFrameRef.current !== null) {
        window.cancelAnimationFrame(movementFrameRef.current);
        movementFrameRef.current = null;
      }
      movementTimeRef.current = null;
    };
  }, [buildMlFeatures, cometMaxSpeed, sweepParticlesWithComet, threatLevel, triggerDash]);

  const difficultyLabel =
    threatLevel <= 3 ? 'Stable' : threatLevel <= 6 ? 'Escalating' : threatLevel <= 8 ? 'Dangerous' : 'Critical';

  const cometTier = threatLevel <= 3 ? 'Comet Mk I' : threatLevel <= 6 ? 'Comet Mk II' : 'Comet Mk III';
  const debugThreatValue = debugThreatLevel ?? autoThreatLevel;

  const applyMaxPotential = () => {
    setDebugThreatLevel(MAX_THREAT);
    setMovementTuning(2.55);
    setDodgeTuning(1.75);
  };

  const resetDebugTuning = () => {
    setDebugThreatLevel(null);
    setMovementTuning(DEFAULT_MOVEMENT_TUNING);
    setDodgeTuning(DEFAULT_DODGE_TUNING);
  };

  const dashCooldownRemaining = Math.max(0, dashCooldownUntilRef.current - abilityClock);
  const punchCooldownRemaining = Math.max(0, punchCooldownUntilRef.current - abilityClock);
  const dashActive = abilityClock < dashUntilRef.current;

  return (
    <div className="portfolio-shell">
      <div className="ambient-grid" aria-hidden="true" />

      <div className="particle-layer" aria-hidden="true">
        <div className="player-tail">
          {Array.from({length: COMET_TAIL_NODES}).map((_, index) => (
            <span
              key={`tail-${index}`}
              className="player-tail-node"
              ref={node => {
                tailNodeRefs.current[index] = node;
              }}
            />
          ))}
        </div>

        <div className="player-comet" ref={playerNodeRef}>
          <span className="player-comet-core" />
          <span className="player-comet-fin player-comet-fin-a" />
          <span className="player-comet-fin player-comet-fin-b" />
        </div>

        {particles.map(particle => {
          const center = getParticleCenter(particle);
          if (!center) {
            return null;
          }

          const isOffscreen =
            center.x < -90 ||
            center.x > window.innerWidth + 90 ||
            center.y < -90 ||
            center.y > window.innerHeight + 90;

          if (isOffscreen) {
            return null;
          }

          const style: CSSProperties = {
            left: center.x,
            top: center.y,
            width: particle.radius * 2,
            height: particle.radius * 2,
            animationDuration: `${particle.morphDuration}s`,
            animationDelay: `${particle.wobbleDelay}s`,
          };

          return (
            <div key={particle.id} className={`sticky-particle${particle.shield > 1 ? ' sticky-particle-armored' : ''}`} style={style}>
              <span className="particle-core" />
              {particle.shield > 1 && (
                <span className="particle-shield-shells">
                  {Array.from({length: particle.shield - 1}).map((_, index) => (
                    <span
                      key={`${particle.id}-shield-${index}`}
                      className="particle-shield-shell"
                      style={{'--shell-layer': `${index}`} as CSSProperties}
                    />
                  ))}
                </span>
              )}
            </div>
          );
        })}

        {fragments.map(fragment => {
          const style = {
            left: fragment.x,
            top: fragment.y,
            width: fragment.size,
            height: fragment.size,
            animationDuration: `${fragment.lifetime}ms`,
            '--fx': `${fragment.dx}px`,
            '--fy': `${fragment.dy}px`,
            '--fr': `${fragment.spin}deg`,
          } as CSSProperties;

          return (
            <span
              key={fragment.id}
              className={`particle-fragment particle-fragment-${fragment.half} particle-fragment-${fragment.kind}`}
              style={style}
            />
          );
        })}

        {slashTrails.map(trail => {
          const dx = trail.x2 - trail.x1;
          const dy = trail.y2 - trail.y1;
          const length = Math.hypot(dx, dy);
          if (length < 1) {
            return null;
          }

          const style: CSSProperties = {
            left: trail.x1,
            top: trail.y1,
            width: length,
            transform: `translateY(-50%) rotate(${Math.atan2(dy, dx)}rad)`,
            animationDuration: `${trail.lifetime}ms`,
          };

          return <span key={trail.id} className={`slash-trail${trail.kind === 'secondary' ? ' slash-trail-secondary' : ''}`} style={style} />;
        })}

        {abilityBursts.map(burst => {
          const style: CSSProperties = {
            left: burst.x,
            top: burst.y,
            animationDuration: `${burst.lifetime}ms`,
          };

          return <span key={burst.id} className={`ability-burst ability-burst-${burst.kind}`} style={style} />;
        })}
      </div>

      <header className="mini-hud panel">
        <span className="mini-chip mini-chip-threat">Threat {threatLevel}{debugThreatLevel !== null ? ' (M)' : ''}</span>
        <span className="mini-chip">
          Blobs {particles.length}/{MAX_BLOBS}
        </span>
        <span className="mini-chip">Cut Radius {cometCutRadius}px</span>
        <span className="mini-chip">Blade Gap {cometBladeGap}px</span>
        <span className="mini-chip">Speed {cometMaxSpeed}px/s</span>
        <span className="mini-chip">ML {Math.round(mlMetrics.confidence * 100)}%</span>
        <span className="mini-chip">ML Err {Math.round(mlMetrics.errorPx)}px</span>
        <span className="mini-chip">Dash {dashActive ? 'Active' : formatCooldown(dashCooldownRemaining)}</span>
        <span className="mini-chip">Punch {formatCooldown(punchCooldownRemaining)}</span>
        <span className="mini-chip">Cuts {kills}</span>
        <span className="mini-chip">{formatClock(elapsedSeconds)}</span>
      </header>

      <aside className={`debug-overlay panel${debugOpen ? '' : ' debug-overlay-collapsed'}`} aria-label="Debug controls">
        <button type="button" className="debug-toggle" onClick={() => setDebugOpen(previous => !previous)}>
          {debugOpen ? 'Debug Controls -' : 'Debug Controls +'}
        </button>

        {debugOpen && (
          <div className="debug-controls">
            <label className="debug-label" htmlFor="debug-threat">
              Threat Level {debugThreatValue}
            </label>
            <input
              id="debug-threat"
              className="debug-slider"
              type="range"
              min={1}
              max={MAX_THREAT}
              step={1}
              value={debugThreatValue}
              onChange={event => {
                setDebugThreatLevel(Number.parseInt(event.target.value, 10));
              }}
            />
            <div className="debug-row">
              <span>{debugThreatLevel === null ? 'Auto escalation' : 'Manual override'}</span>
              <button type="button" className="debug-btn" onClick={() => setDebugThreatLevel(null)}>
                Auto
              </button>
            </div>

            <label className="debug-label" htmlFor="debug-speed">
              Blob Speed {movementTuning.toFixed(2)}x
            </label>
            <input
              id="debug-speed"
              className="debug-slider"
              type="range"
              min={0.9}
              max={3}
              step={0.05}
              value={movementTuning}
              onChange={event => {
                setMovementTuning(Number.parseFloat(event.target.value));
              }}
            />

            <label className="debug-label" htmlFor="debug-dodge">
              Dodge Scale {dodgeTuning.toFixed(2)}x
            </label>
            <input
              id="debug-dodge"
              className="debug-slider"
              type="range"
              min={0.8}
              max={2.2}
              step={0.05}
              value={dodgeTuning}
              onChange={event => {
                setDodgeTuning(Number.parseFloat(event.target.value));
              }}
            />

            <div className="debug-actions">
              <button type="button" className="debug-btn debug-btn-hot" onClick={applyMaxPotential}>
                Max Potential
              </button>
              <button type="button" className="debug-btn" onClick={resetDebugTuning}>
                Reset
              </button>
            </div>

            <div className="debug-row">
              <span>ML confidence {Math.round(mlMetrics.confidence * 100)}%</span>
              <span>Error {Math.round(mlMetrics.errorPx)}px</span>
            </div>
            <div className="debug-row">
              <span>Training samples</span>
              <span>{mlMetrics.samples}</span>
            </div>
          </div>
        )}
      </aside>

      <aside className="quest-overlay panel" aria-label="Quest status">
        <p className="quest-overlay-title">Quests</p>
        <div className="quest-overlay-icons">
          {quests.map(quest => {
            const label = `${quest.title}: ${quest.completed ? 'Done' : 'To do'} (${quest.progress}/${quest.target})`;
            return (
              <div key={quest.id} className="quest-icon-slot" title={label} aria-label={label} role="img">
                <span className={`quest-glyph quest-glyph-${quest.id}`} />
                <span className={`quest-state ${quest.completed ? 'quest-state-done' : 'quest-state-todo'}`} />
              </div>
            );
          })}
        </div>
      </aside>

      {isMobileArena && (
        <aside className="mobile-controls panel" aria-label="Mobile abilities">
          <button
            type="button"
            className={`mobile-ability${dashCooldownRemaining <= 0 ? '' : ' mobile-ability-cooldown'}`}
            onPointerDown={event => {
              event.preventDefault();
              triggerDash();
            }}
            disabled={dashCooldownRemaining > 0}
          >
            Dash {dashCooldownRemaining <= 0 ? 'Ready' : formatCooldown(dashCooldownRemaining)}
          </button>
          <button
            type="button"
            className={`mobile-ability${punchCooldownRemaining <= 0 ? '' : ' mobile-ability-cooldown'}`}
            onPointerDown={event => {
              event.preventDefault();
              triggerPunch();
            }}
            disabled={punchCooldownRemaining > 0}
          >
            Punch {punchCooldownRemaining <= 0 ? 'Ready' : formatCooldown(punchCooldownRemaining)}
          </button>
        </aside>
      )}

      <main className="content-frame">
        <section className="hero panel" ref={registerSection('hero')}>
          <p className="eyebrow">Interactive Portfolio // Comet Control Mode</p>
          <h1>Ibrahim Butt</h1>
          <p className="hero-subtitle">Senior Software Engineer - Multiplayer & Gameplay Systems</p>
          <p className="hero-description">
            Steer a comet head with cursor or touch. Blobs now use an online-trained ML predictor that learns your movement
            style in real time and adjusts their evade vectors as confidence grows.
          </p>
          <p className="slash-hint">
            Desktop: hold left click to chain Dash on cooldown, right click to Punch blast. Mobile: use the Dash/Punch buttons.
            Shell hit peels armor first, then core.
          </p>

          <div className="blade-row">
            <span className="blade-chip">{cometTier}</span>
            <span className="blade-chip">Dodge AI {Math.round(dodgeChanceBase * 100)}%</span>
            <span className="blade-chip">Velocity {cometMaxSpeed}px/s</span>
            <span className="blade-chip">Dash {dashActive ? 'Online' : formatCooldown(dashCooldownRemaining)}</span>
            <span className="blade-chip">Punch {formatCooldown(punchCooldownRemaining)}</span>
            <span className="blade-chip">Difficulty {difficultyLabel}</span>
            {isMobileArena && <span className="blade-chip">Mobile Arena</span>}
          </div>
        </section>

        <ContentSections registerSection={registerSection} />

        <section className="status-strip panel" aria-label="Threat status">
          <p>Mechanics: 5-blob cap, live ML trajectory prediction, dash hold ability, right-click punch burst.</p>
          <p>Optimization: online linear model training in-browser, nearby-only blob simulation, capped entities.</p>
        </section>
      </main>
    </div>
  );
}
