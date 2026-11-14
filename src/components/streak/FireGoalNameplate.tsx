import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Flame,
  Sparkles,
  RotateCcw,
  Copy,
  Check,
  Zap,
  MousePointerClick,
  Play,
  Pause,
  Sliders,
  ShieldAlert,
} from "lucide-react";

/**
 * ============================================================================
 * FIRE GOAL PHYSICS NAMEPLATE (React Bits Style Interactive Component)
 * ============================================================================
 * Features:
 * - 2D Verlet Integration Cloth/Net Physics with real constraint tearing
 * - Interactive mouse/touch net repulsion & ball slingshot/click-to-shoot
 * - Stylized Cel-Shaded Cartoon Soccer Ball with 3D patch rotation & squash/stretch
 * - Dynamic Toon Flame, Smoke & Impact Spark Particle Engine
 * - Automatic Net Regeneration after tearing
 */
export function FireGoalNameplate({
  name = "Ibrahim Fox",
  title = "Striker Mode • Interactive Physics",
  badge = "PRO",
  avatarText = "IF",
  avatarUrl = "",
  autoShoot = true,
  autoShootInterval = 4200,
  hoverToShoot = true,
  tearStrength = 1.0, // Multiplier for how easily the net tears
  height = 250,
  children,
  className = "",
  style = {},
  compact = false,
}: {
  name?: string;
  title?: string;
  badge?: string;
  avatarText?: string;
  avatarUrl?: string;
  autoShoot?: boolean;
  autoShootInterval?: number;
  hoverToShoot?: boolean;
  tearStrength?: number;
  height?: number | string;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  compact?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [goalCount, setGoalCount] = useState(0);
  const [isAiming, setIsAiming] = useState(false);

  // Simulation state stored in a ref for 60fps zero-re-render performance
  const simRef = useRef({
    width: 800,
    height: 250,
    nodes: [],
    constraints: [],
    sparks: [],
    flames: [],
    shockwaves: [],
    floatingTexts: [],
    ball: {
      x: 140,
      y: 160,
      vx: 0,
      vy: 0,
      radius: 17,
      angle: 0,
      vAngle: 0,
      onFire: false,
      fireIntensity: 0,
      scaleX: 1,
      scaleY: 1,
      trail: [],
    },
    pointer: {
      x: -1000,
      y: -1000,
      px: -1000,
      py: -1000,
      isDown: false,
      dragStartX: 0,
      dragStartY: 0,
      isDraggingBall: false,
    },
    shake: 0,
    flash: 0,
    netTornTime: 0,
    lastAutoShot: 0,
    lastHoverShot: 0,
    goalBox: {
      x: 650,
      y: 35,
      w: 115,
      h: 180,
    },
    scoredThisShot: false,
  });

  // Build or Rebuild the Verlet Cloth Net on the right side of the card
  const initNet = useCallback((width, height) => {
    const sim = simRef.current;
    const cols = 11;
    const rows = 14;
    const goalW = Math.min(130, Math.max(95, width * 0.16));
    const goalH = Math.min(190, Math.max(135, height * 0.76));
    const startX = width - goalW - 22;
    const startY = (height - goalH) / 2;

    sim.goalBox = { x: startX, y: startY, w: goalW, h: goalH };

    const nodes = [];
    const constraints = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Slight trapezoid perspective for the goal depth
        const depthRatio = c / (cols - 1);
        const topInset = depthRatio * 10;
        const bottomInset = depthRatio * 6;
        const effectiveH = goalH - topInset - bottomInset;

        const x = startX + depthRatio * goalW;
        const y = startY + topInset + (r / (rows - 1)) * effectiveH;

        // Pin the front goalpost (c === 0), top bar (r === 0), bottom ground (r === rows - 1), and back support post (c === cols - 1 && (r === 0 || r === rows - 1))
        const pinned =
          c === 0 ||
          r === 0 ||
          r === rows - 1 ||
          (c === cols - 1 && (r === 0 || r === rows - 1));

        nodes.push({
          x,
          y,
          ox: x,
          oy: y,
          baseX: x,
          baseY: y,
          pinned,
          r,
          c,
        });
      }
    }

    const getIndex = (r, c) => r * cols + c;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = getIndex(r, c);
        // Horizontal net twine
        if (c < cols - 1) {
          const rightIdx = getIndex(r, c + 1);
          const dx = nodes[rightIdx].x - nodes[idx].x;
          const dy = nodes[rightIdx].y - nodes[idx].y;
          constraints.push({
            p1: idx,
            p2: rightIdx,
            restLength: Math.hypot(dx, dy),
            torn: false,
            stress: 0,
          });
        }
        // Vertical net twine
        if (r < rows - 1) {
          const downIdx = getIndex(r + 1, c);
          const dx = nodes[downIdx].x - nodes[idx].x;
          const dy = nodes[downIdx].y - nodes[idx].y;
          constraints.push({
            p1: idx,
            p2: downIdx,
            restLength: Math.hypot(dx, dy),
            torn: false,
            stress: 0,
          });
        }
      }
    }

    sim.nodes = nodes;
    sim.constraints = constraints;
    sim.netTornTime = 0;
  }, []);

  // Shoot the ball with customizable power, angle, and fire state
  const shootBall = useCallback(
    (options = {}) => {
      const sim = simRef.current;
      const { width, height, goalBox } = sim;

      // Reset ball to left side launch position if it's far right or out of bounds
      const startX =
        options.startX !== undefined
          ? options.startX
          : Math.min(180, width * 0.22);
      const startY =
        options.startY !== undefined
          ? options.startY
          : height * (0.45 + (Math.random() - 0.5) * 0.35);

      const targetX = goalBox.x + goalBox.w * 0.65;
      const targetY =
        options.targetY !== undefined
          ? options.targetY
          : goalBox.y + goalBox.h * (0.25 + Math.random() * 0.5);

      const dx = targetX - startX;
      const dy = targetY - startY;
      const dist = Math.hypot(dx, dy) || 1;

      const power = options.power || 28 + Math.random() * 6;
      const vx = options.vx !== undefined ? options.vx : (dx / dist) * power;
      const vy =
        options.vy !== undefined
          ? options.vy
          : (dy / dist) * power - 2.2; // Slight upward arc

      sim.ball.x = startX;
      sim.ball.y = startY;
      sim.ball.vx = vx;
      sim.ball.vy = vy;
      sim.ball.vAngle = 0.45;
      sim.ball.onFire = options.onFire !== undefined ? options.onFire : true;
      sim.ball.fireIntensity = sim.ball.onFire ? 1.0 : 0.2;
      sim.ball.trail = [];
      sim.scoredThisShot = false;
      sim.lastAutoShot = performance.now();

      // Launch burst particles
      for (let i = 0; i < 18; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = 2 + Math.random() * 6;
        sim.sparks.push({
          x: startX,
          y: startY,
          vx: Math.cos(ang) * spd - vx * 0.15,
          vy: Math.sin(ang) * spd - vy * 0.15,
          size: 2.5 + Math.random() * 3.5,
          color: i % 2 === 0 ? "#fde047" : "#f97316",
          life: 1,
          decay: 0.03 + Math.random() * 0.03,
        });
      }

      sim.shockwaves.push({
        x: startX,
        y: startY,
        radius: 8,
        maxRadius: 55,
        alpha: 0.85,
        color: "#fb923c",
      });
    },
    []
  );

  // Repair torn net smoothly
  const repairNet = useCallback(() => {
    const sim = simRef.current;
    sim.constraints.forEach((c) => {
      c.torn = false;
      c.stress = 0;
    });
    sim.nodes.forEach((n) => {
      n.x = n.baseX + (Math.random() - 0.5) * 4;
      n.y = n.baseY + (Math.random() - 0.5) * 4;
      n.ox = n.baseX;
      n.oy = n.baseY;
    });
    sim.netTornTime = 0;

    // Subtle emerald/gold repair sparkles on the goal
    const { goalBox } = sim;
    for (let i = 0; i < 20; i++) {
      sim.sparks.push({
        x: goalBox.x + Math.random() * goalBox.w,
        y: goalBox.y + Math.random() * goalBox.h,
        vx: (Math.random() - 0.5) * 2,
        vy: -1 - Math.random() * 2,
        size: 2 + Math.random() * 2.5,
        color: "#34d399",
        life: 1,
        decay: 0.025,
      });
    }
  }, []);

  // Expose shoot/repair helper on window/ref if needed
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    let animationFrameId;

    const handleResize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      simRef.current.width = rect.width;
      simRef.current.height = rect.height;
      initNet(rect.width, rect.height);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    // Initial dramatic shot shortly after mount
    const initialTimer = setTimeout(() => {
      shootBall({ power: 31, onFire: true });
    }, 500);

    // Helper: Draw a stylized 3D-ish cartoon soccer ball
    const drawStylizedSoccerBall = (ctx, x, y, r, angle, scaleX, scaleY, velAngle, onFire) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(velAngle);
      ctx.scale(scaleX, scaleY);
      ctx.rotate(-velAngle);

      // Outer Fiery Aura if blazing
      if (onFire) {
        const auraGrad = ctx.createRadialGradient(0, 0, r * 0.5, 0, 0, r * 2.1);
        auraGrad.addColorStop(0, "rgba(254, 240, 138, 0.9)");
        auraGrad.addColorStop(0.45, "rgba(249, 115, 22, 0.65)");
        auraGrad.addColorStop(1, "rgba(239, 68, 68, 0)");
        ctx.fillStyle = auraGrad;
        ctx.beginPath();
        ctx.arc(0, 0, r * 2.1, 0, Math.PI * 2);
        ctx.fill();
      }

      // Clip to sphere
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.save();
      ctx.clip();

      // Sphere base gradient (warm cel-shaded look when on fire)
      const ballGrad = ctx.createRadialGradient(-r * 0.35, -r * 0.35, r * 0.1, 0, 0, r * 1.1);
      if (onFire) {
        ballGrad.addColorStop(0, "#ffffff");
        ballGrad.addColorStop(0.65, "#fef3c7");
        ballGrad.addColorStop(1, "#f59e0b");
      } else {
        ballGrad.addColorStop(0, "#ffffff");
        ballGrad.addColorStop(0.7, "#e2e8f0");
        ballGrad.addColorStop(1, "#94a3b8");
      }
      ctx.fillStyle = ballGrad;
      ctx.fillRect(-r, -r, r * 2, r * 2);

      // Rotating pentagon patches
      ctx.save();
      ctx.rotate(angle);

      const drawPentagon = (cx, cy, pr) => {
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const a = (i * 2 * Math.PI) / 5 - Math.PI / 2;
          const px = cx + Math.cos(a) * pr;
          const py = cy + Math.sin(a) * pr;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
      };

      // Seam lines connecting center pentagon to outer pentagons
      ctx.strokeStyle = onFire ? "#7c2d12" : "#334155";
      ctx.lineWidth = 1.6;
      for (let i = 0; i < 5; i++) {
        const a = (i * 2 * Math.PI) / 5 - Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * (r * 0.32), Math.sin(a) * (r * 0.32));
        ctx.lineTo(Math.cos(a) * (r * 0.88), Math.sin(a) * (r * 0.88));
        ctx.stroke();
      }

      // Pentagon fill
      ctx.fillStyle = onFire ? "#431407" : "#0f172a";
      drawPentagon(0, 0, r * 0.36);

      for (let i = 0; i < 5; i++) {
        const a = (i * 2 * Math.PI) / 5 - Math.PI / 2;
        const dist = r * 0.92;
        drawPentagon(Math.cos(a) * dist, Math.sin(a) * dist, r * 0.33);
      }
      ctx.restore();

      // Cel-shaded specular highlight & rim shadow
      ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
      ctx.beginPath();
      ctx.ellipse(-r * 0.35, -r * 0.38, r * 0.32, r * 0.16, -Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore(); // Restore clip

      // Bold cartoon outline
      ctx.strokeStyle = onFire ? "#fde047" : "#0f172a";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    };

    // Main 60FPS Physics & Render Loop
    const render = (now) => {
      const sim = simRef.current;
      const { width, height, ball, nodes, constraints, pointer, goalBox } = sim;

      // Auto-shoot check
      if (
        autoShoot &&
        !pointer.isDraggingBall &&
        now - sim.lastAutoShot > autoShootInterval
      ) {
        shootBall({
          power: 29 + Math.random() * 5,
          onFire: true,
        });
      }

      // Automatic net regeneration 2.6 seconds after tearing
      if (sim.netTornTime > 0 && now - sim.netTornTime > 2600) {
        repairNet();
      }

      // 1. Update Screen Shake & Flash
      let shakeX = 0;
      let shakeY = 0;
      if (sim.shake > 0.2) {
        shakeX = (Math.random() - 0.5) * sim.shake;
        shakeY = (Math.random() - 0.5) * sim.shake;
        sim.shake *= 0.88;
      } else {
        sim.shake = 0;
      }
      if (sim.flash > 0.01) {
        sim.flash *= 0.86;
      } else {
        sim.flash = 0;
      }

      ctx.save();
      ctx.clearRect(0, 0, width, height);
      ctx.translate(shakeX, shakeY);

      // 2. Draw Subtle Stadium Pitch Background Elements
      ctx.save();
      ctx.strokeStyle = "rgba(16, 185, 129, 0.14)";
      ctx.lineWidth = 2;
      // Penalty box lines
      ctx.strokeRect(
        goalBox.x - 90,
        goalBox.y - 20,
        goalBox.w + 110,
        goalBox.h + 40
      );
      // Penalty arc
      ctx.beginPath();
      ctx.arc(
        goalBox.x - 90,
        goalBox.y + goalBox.h / 2,
        45,
        Math.PI * 0.65,
        Math.PI * 1.35
      );
      ctx.stroke();
      ctx.restore();

      // 3. Update Ball Physics
      if (!pointer.isDraggingBall) {
        // Gravity & Air Drag
        ball.vy += 0.26;
        ball.vx *= 0.992;
        ball.vy *= 0.992;

        ball.x += ball.vx;
        ball.y += ball.vy;
        ball.angle += ball.vx * 0.032;

        const speed = Math.hypot(ball.vx, ball.vy);

        // Dynamic cartoon squash & stretch
        const stretch = Math.min(1.34, 1 + speed * 0.011);
        ball.scaleX += (stretch - ball.scaleX) * 0.35;
        ball.scaleY += (1 / stretch - ball.scaleY) * 0.35;

        // Floor & Ceiling bounce
        const floorY = height - 18;
        if (ball.y + ball.radius > floorY) {
          ball.y = floorY - ball.radius;
          ball.vy = -ball.vy * 0.65;
          ball.vx *= 0.88;
          // Squash on bounce
          if (Math.abs(ball.vy) > 2) {
            ball.scaleX = 1.25;
            ball.scaleY = 0.78;
          }
        }
        if (ball.y - ball.radius < 12) {
          ball.y = 12 + ball.radius;
          ball.vy = -ball.vy * 0.65;
        }

        // Top & Bottom Goalpost Crossbar Collisions
        const postLocations = [
          { x: goalBox.x, y: goalBox.y, r: 6 }, // Top crossbar corner
          { x: goalBox.x, y: goalBox.y + goalBox.h, r: 6 }, // Bottom post corner
        ];
        postLocations.forEach((post) => {
          const dx = ball.x - post.x;
          const dy = ball.y - post.y;
          const d = Math.hypot(dx, dy);
          if (d < ball.radius + post.r) {
            const nx = dx / (d || 1);
            const ny = dy / (d || 1);
            ball.x = post.x + nx * (ball.radius + post.r);
            ball.y = post.y + ny * (ball.radius + post.r);
            const dot = ball.vx * nx + ball.vy * ny;
            ball.vx = (ball.vx - 2 * dot * nx) * 0.75;
            ball.vy = (ball.vy - 2 * dot * ny) * 0.75;
            sim.shake = Math.max(sim.shake, 9);
          }
        });

        // Emit Stylized Toon Flame & Smoke Particles when ball is moving fast / on fire
        if (ball.onFire && speed > 3.5) {
          const count = speed > 14 ? 4 : 2;
          for (let i = 0; i < count; i++) {
            const spread = (Math.random() - 0.5) * ball.radius * 1.1;
            const perpX = -ball.vy / (speed || 1);
            const perpY = ball.vx / (speed || 1);

            sim.flames.push({
              x: ball.x - (ball.vx / speed) * (ball.radius * 0.6) + perpX * spread,
              y: ball.y - (ball.vy / speed) * (ball.radius * 0.6) + perpY * spread,
              vx: -ball.vx * (0.12 + Math.random() * 0.15) + (Math.random() - 0.5) * 1.8,
              vy: -ball.vy * (0.12 + Math.random() * 0.15) - 0.6 + (Math.random() - 0.5) * 1.8,
              size: ball.radius * (0.65 + Math.random() * 0.55),
              life: 1.0,
              decay: 0.038 + Math.random() * 0.025,
            });
          }

          // Occasional trailing embers
          if (Math.random() < 0.65) {
            sim.sparks.push({
              x: ball.x + (Math.random() - 0.5) * 14,
              y: ball.y + (Math.random() - 0.5) * 14,
              vx: -ball.vx * 0.1 + (Math.random() - 0.5) * 3,
              vy: -ball.vy * 0.1 + (Math.random() - 0.5) * 3,
              size: 2 + Math.random() * 2.5,
              color: Math.random() > 0.4 ? "#fde047" : "#fb923c",
              life: 1,
              decay: 0.04 + Math.random() * 0.03,
            });
          }
        }
      } else {
        // Ball is being dragged by user for a slingshot shot
        ball.scaleX = 1;
        ball.scaleY = 1;
      }

      // 4. Update Verlet Cloth Net Nodes
      const mouseVx = pointer.x - pointer.px;
      const mouseVy = pointer.y - pointer.py;

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        if (n.pinned) continue;

        const vx = (n.x - n.ox) * 0.96;
        const vy = (n.y - n.oy) * 0.96;

        n.ox = n.x;
        n.oy = n.y;

        // Subtle gravity + gentle wind wave + spring back toward rest shape
        const wind = Math.sin(now * 0.003 + n.r * 0.35 + n.c * 0.2) * 0.06;
        const springX = (n.baseX - n.x) * 0.012;
        const springY = (n.baseY - n.y) * 0.012;

        n.x += vx + wind + springX;
        n.y += vy + 0.12 + springY;

        // Mouse/Touch Hover Interaction with Net
        const mdx = n.x - pointer.x;
        const mdy = n.y - pointer.y;
        const mDist = Math.hypot(mdx, mdy);
        if (mDist < 42) {
          const factor = (1 - mDist / 42) * 0.65;
          n.x += Math.max(-9, Math.min(9, mouseVx * factor));
          n.y += Math.max(-9, Math.min(9, mouseVy * factor));
        }

        // Ball Interaction with Net Nodes
        const bdx = n.x - ball.x;
        const bdy = n.y - ball.y;
        const bDist = Math.hypot(bdx, bdy);
        const hitRadius = ball.radius + 9;

        if (bDist < hitRadius) {
          const bSpeed = Math.hypot(ball.vx, ball.vy);
          const nx = bdx / (bDist || 1);
          const ny = bdy / (bDist || 1);

          // Push net node strongly in the direction of the ball
          const pushDist = (hitRadius - bDist) * 1.15;
          n.x += nx * pushDist + ball.vx * 0.42;
          n.y += ny * pushDist + ball.vy * 0.42;

          // If ball is blazing fast, slow it only slightly as it rips through; otherwise elastic net catch
          if (ball.onFire && bSpeed > 15) {
            ball.vx *= 0.96;
            ball.vy *= 0.96;
          } else {
            ball.vx *= 0.78;
            ball.vy *= 0.78;
            ball.x -= nx * 2;
          }
        }
      }

      // 5. Solve Cloth Constraints & Tear Net Under High Impact
      const tearThreshold = 2.45 / tearStrength;
      let newlyTornCount = 0;

      for (let iter = 0; iter < 5; iter++) {
        for (let i = 0; i < constraints.length; i++) {
          const c = constraints[i];
          if (c.torn) continue;

          const n1 = nodes[c.p1];
          const n2 = nodes[c.p2];

          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const dist = Math.hypot(dx, dy) || 0.0001;

          const strain = dist / c.restLength;
          c.stress = Math.min(1, Math.max(0, (strain - 1) / 1.2));

          // Direct high-speed blazing ball impact tears the net fibers!
          const midX = (n1.x + n2.x) * 0.5;
          const midY = (n1.y + n2.y) * 0.5;
          const distToBall = Math.hypot(midX - ball.x, midY - ball.y);
          const ballSpeed = Math.hypot(ball.vx, ball.vy);

          const shouldTearFromBall =
            ball.onFire &&
            ballSpeed > 14 &&
            distToBall < ball.radius + 7 &&
            !n1.pinned &&
            !n2.pinned;

          if (strain > tearThreshold || shouldTearFromBall) {
            c.torn = true;
            newlyTornCount++;

            if (sim.netTornTime === 0) {
              sim.netTornTime = now;
            }

            // Spawn fiery sparks & torn net fiber particles at the tear point
            for (let s = 0; s < 5; s++) {
              const ang = Math.random() * Math.PI * 2;
              const spd = 2 + Math.random() * 7;
              sim.sparks.push({
                x: midX,
                y: midY,
                vx: Math.cos(ang) * spd + ball.vx * 0.25,
                vy: Math.sin(ang) * spd + ball.vy * 0.25,
                size: 2 + Math.random() * 3,
                color: s % 2 === 0 ? "#fde047" : "#fb923c",
                life: 1,
                decay: 0.03 + Math.random() * 0.02,
              });
            }
            continue;
          }

          const diff = (c.restLength - dist) / dist;
          if (!n1.pinned && !n2.pinned) {
            n1.x -= dx * diff * 0.5;
            n1.y -= dy * diff * 0.5;
            n2.x += dx * diff * 0.5;
            n2.y += dy * diff * 0.5;
          } else if (n1.pinned && !n2.pinned) {
            n2.x += dx * diff;
            n2.y += dy * diff;
          } else if (!n1.pinned && n2.pinned) {
            n1.x -= dx * diff;
            n1.y -= dy * diff;
          }
        }
      }

      // Trigger Goal Explosion, Camera Shake & Shockwave when ball enters/tears the goal
      if (
        !sim.scoredThisShot &&
        ball.x > goalBox.x + 12 &&
        ball.x < goalBox.x + goalBox.w + 40 &&
        ball.y > goalBox.y &&
        ball.y < goalBox.y + goalBox.h
      ) {
        sim.scoredThisShot = true;
        sim.shake = ball.onFire ? 16 : 7;
        sim.flash = ball.onFire ? 0.55 : 0.2;
        setGoalCount((c) => c + 1);

        sim.shockwaves.push({
          x: ball.x,
          y: ball.y,
          radius: 10,
          maxRadius: 95,
          alpha: 1,
          color: ball.onFire ? "#f97316" : "#34d399",
        });

        sim.floatingTexts.push({
          x: goalBox.x - 25,
          y: ball.y,
          text: newlyTornCount > 0 || ball.onFire ? "🔥 RIPPED THE NET!" : "⚽ GOAL!",
          life: 1.0,
          vy: -1.4,
        });
      }

      // 6. Render Back Goalpost Frame
      ctx.save();
      ctx.strokeStyle = "rgba(203, 213, 225, 0.45)";
      ctx.lineWidth = 3.5;
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(goalBox.x, goalBox.y);
      ctx.lineTo(goalBox.x + goalBox.w, goalBox.y + 10);
      ctx.lineTo(goalBox.x + goalBox.w, goalBox.y + goalBox.h - 6);
      ctx.lineTo(goalBox.x, goalBox.y + goalBox.h);
      ctx.stroke();
      ctx.restore();

      // 7. Render Flame & Smoke Particles (Behind and around the ball)
      for (let i = sim.flames.length - 1; i >= 0; i--) {
        const f = sim.flames[i];
        f.x += f.vx;
        f.y += f.vy;
        f.size *= 0.965;
        f.life -= f.decay;

        if (f.life <= 0 || f.size < 1) {
          sim.flames.splice(i, 1);
          continue;
        }

        ctx.save();
        // Stylized Toon Fire Color Ramp: Core White/Yellow -> Bright Orange -> Crimson Red -> Dark Smoke
        if (f.life > 0.75) {
          ctx.fillStyle = `rgba(254, 249, 195, ${f.life})`;
        } else if (f.life > 0.45) {
          ctx.fillStyle = `rgba(249, 115, 22, ${f.life * 0.95})`;
        } else if (f.life > 0.22) {
          ctx.fillStyle = `rgba(220, 38, 38, ${f.life * 0.85})`;
        } else {
          ctx.fillStyle = `rgba(30, 41, 59, ${f.life * 0.7})`;
        }

        ctx.beginPath();
        ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 8. Render Slingshot Aiming Line if dragging
      if (pointer.isDraggingBall) {
        const dx = ball.x - pointer.x;
        const dy = ball.y - pointer.y;
        ctx.save();
        ctx.strokeStyle = "#fb923c";
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(ball.x, ball.y);
        ctx.lineTo(ball.x + dx * 2.2, ball.y + dy * 2.2);
        ctx.stroke();
        ctx.restore();
      }

      // 9. Render Stylized Cartoon Soccer Ball
      const velAngle = Math.atan2(ball.vy, ball.vx);
      drawStylizedSoccerBall(
        ctx,
        ball.x,
        ball.y,
        ball.radius,
        ball.angle,
        ball.scaleX,
        ball.scaleY,
        velAngle,
        ball.onFire
      );

      // 10. Render Verlet Cloth Net Mesh (Over the ball for realistic net wrapping)
      ctx.save();
      ctx.lineCap = "round";
      for (let i = 0; i < constraints.length; i++) {
        const c = constraints[i];
        if (c.torn) continue;

        const n1 = nodes[c.p1];
        const n2 = nodes[c.p2];

        // Glow orange/gold when the net fibers are stressed or hot
        if (c.stress > 0.22) {
          ctx.strokeStyle = `rgba(251, 146, 60, ${0.65 + c.stress * 0.35})`;
          ctx.lineWidth = 2.2;
        } else {
          ctx.strokeStyle = "rgba(241, 245, 249, 0.65)";
          ctx.lineWidth = 1.5;
        }

        ctx.beginPath();
        ctx.moveTo(n1.x, n1.y);
        ctx.lineTo(n2.x, n2.y);
        ctx.stroke();
      }

      // Draw tiny knots at net intersections for extra cartoon detail
      ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        ctx.beginPath();
        ctx.arc(n.x, n.y, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // 11. Render Front Glossy Goalpost (Top Crossbar & Front Post)
      ctx.save();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 6.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.shadowColor = "rgba(52, 211, 153, 0.5)";
      ctx.shadowBlur = 12;

      ctx.beginPath();
      // Front vertical post
      ctx.moveTo(goalBox.x, goalBox.y);
      ctx.lineTo(goalBox.x, goalBox.y + goalBox.h);
      // Top crossbar roof
      ctx.moveTo(goalBox.x, goalBox.y);
      ctx.lineTo(goalBox.x + goalBox.w, goalBox.y + 10);
      ctx.stroke();
      ctx.restore();

      // 12. Render Impact Sparks & Torn Net Fibers
      for (let i = sim.sparks.length - 1; i >= 0; i--) {
        const s = sim.sparks[i];
        s.x += s.vx;
        s.y += s.vy;
        s.vy += 0.18; // gravity on sparks
        s.life -= s.decay;

        if (s.life <= 0) {
          sim.sparks.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, s.life);
        ctx.fillStyle = s.color;
        ctx.shadowColor = s.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 13. Render Expanding Shockwaves
      for (let i = sim.shockwaves.length - 1; i >= 0; i--) {
        const sw = sim.shockwaves[i];
        sw.radius += (sw.maxRadius - sw.radius) * 0.16;
        sw.alpha *= 0.88;

        if (sw.alpha < 0.03) {
          sim.shockwaves.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.strokeStyle = sw.color;
        ctx.globalAlpha = sw.alpha;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // 14. Render Floating Arcade Text ("🔥 RIPPED THE NET!")
      for (let i = sim.floatingTexts.length - 1; i >= 0; i--) {
        const ft = sim.floatingTexts[i];
        ft.y += ft.vy;
        ft.life -= 0.022;
        if (ft.life <= 0) {
          sim.floatingTexts.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.globalAlpha = Math.max(0, ft.life);
        ctx.font = "900 13px Inter, system-ui, sans-serif";
        ctx.fillStyle = "#fde047";
        ctx.shadowColor = "#ea580c";
        ctx.shadowBlur = 10;
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      }

      // 15. Impact Screen Flash Overlay
      if (sim.flash > 0.01) {
        ctx.fillStyle = `rgba(251, 146, 60, ${sim.flash * 0.35})`;
        ctx.fillRect(0, 0, width, height);
      }

      pointer.px = pointer.x;
      pointer.py = pointer.y;

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      clearTimeout(initialTimer);
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, [autoShoot, autoShootInterval, initNet, repairNet, shootBall, tearStrength]);

  // Pointer Events (Mouse + Touch) for Net Interaction, Slingshot, and Click-to-Shoot
  const getLocalCoords = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const handlePointerDown = (e) => {
    if (!canvasRef.current) return;
    const { x, y } = getLocalCoords(e);
    const sim = simRef.current;
    sim.pointer.x = x;
    sim.pointer.y = y;
    sim.pointer.px = x;
    sim.pointer.py = y;
    sim.pointer.isDown = true;

    const distToBall = Math.hypot(x - sim.ball.x, y - sim.ball.y);
    if (distToBall < 45) {
      // Start slingshot drag
      sim.pointer.isDraggingBall = true;
      sim.ball.vx = 0;
      sim.ball.vy = 0;
      setIsAiming(true);
    } else {
      // Shoot directly toward clicked Y height or from clicked spot if on the left side
      if (x < sim.goalBox.x - 40) {
        shootBall({
          startX: Math.min(x, sim.width * 0.45),
          startY: y,
          targetY: Math.max(
            sim.goalBox.y + 20,
            Math.min(sim.goalBox.y + sim.goalBox.h - 20, y)
          ),
          power: 31,
          onFire: true,
        });
      } else {
        // Clicked right on the net -> shoot directly at that net spot!
        shootBall({
          targetY: y,
          power: 32,
          onFire: true,
        });
      }
    }
  };

  const handlePointerMove = (e) => {
    if (!canvasRef.current) return;
    const { x, y } = getLocalCoords(e);
    const sim = simRef.current;
    sim.pointer.x = x;
    sim.pointer.y = y;

    // Hover trigger if enabled and cursor moves quickly near the ball
    const distToBall = Math.hypot(x - sim.ball.x, y - sim.ball.y);
    const now = performance.now();
    if (
      hoverToShoot &&
      !sim.pointer.isDraggingBall &&
      distToBall < 32 &&
      Math.hypot(sim.ball.vx, sim.ball.vy) < 4 &&
      now - sim.lastHoverShot > 900
    ) {
      sim.lastHoverShot = now;
      shootBall({ power: 30, onFire: true });
    }
  };

  const handlePointerUp = () => {
    const sim = simRef.current;
    if (sim.pointer.isDraggingBall) {
      const dx = sim.ball.x - sim.pointer.x;
      const dy = sim.ball.y - sim.pointer.y;
      const pullDist = Math.hypot(dx, dy);

      if (pullDist > 8) {
        shootBall({
          startX: sim.ball.x,
          startY: sim.ball.y,
          vx: Math.max(18, Math.min(36, dx * 0.38)),
          vy: Math.max(-18, Math.min(18, dy * 0.38)),
          onFire: true,
        });
      } else {
        shootBall({ power: 30, onFire: true });
      }
      sim.pointer.isDraggingBall = false;
      setIsAiming(false);
    }
    sim.pointer.isDown = false;
  };

  return (
    <div
      ref={containerRef}
      style={{
        height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
        ...style,
      }}
      onMouseDown={handlePointerDown}
      onMouseMove={handlePointerMove}
      onMouseUp={handlePointerUp}
      onMouseLeave={handlePointerUp}
      onTouchStart={handlePointerDown}
      onTouchMove={handlePointerMove}
      onTouchEnd={handlePointerUp}
      className={`relative w-full overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-emerald-950/90 to-slate-900 border border-emerald-500/30 shadow-[0_20px_60px_-15px_rgba(16,185,129,0.25)] select-none cursor-crosshair group ${className}`}
    >
      {/* Ambient Glowing Stadium Spotlights */}
      <div className="absolute -top-24 left-1/4 w-72 h-72 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 right-10 w-80 h-80 bg-orange-500/20 rounded-full blur-3xl pointer-events-none" />

      {/* Interactive 2D Physics Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block z-10"
      />

      {/* Profile Nameplate Overlay (Left Side) */}
      <div className={`relative z-20 h-full flex flex-col justify-between ${compact ? 'p-3' : 'p-6 sm:p-8'} pointer-events-none max-w-md`}>
        {/* Top Interactive Status Badge */}
        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-500/20 text-orange-300 border border-orange-500/40 backdrop-blur-md shadow-sm">
            <Flame className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
            {isAiming ? "Release to Fire!" : "Interactive Cloth Physics"}
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-md">
            ⚽ {goalCount}
          </span>
        </div>

        {/* Main User Identity / Nameplate */}
        {children ? (
          <div className="pointer-events-auto flex items-center h-full my-auto">{children}</div>
        ) : (
          <div className="flex items-center gap-4 bg-slate-950/55 backdrop-blur-md border border-white/10 p-4 rounded-2xl shadow-xl w-fit">
            <div className="relative shrink-0">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-orange-500 via-amber-400 to-emerald-400 p-0.5 shadow-[0_0_25px_rgba(249,115,22,0.45)]">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={name}
                    className="w-full h-full rounded-[14px] object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-[14px] bg-slate-900 flex items-center justify-center text-white font-black text-xl tracking-tighter">
                    {avatarText}
                  </div>
                )}
              </div>
              <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 text-[10px] font-black bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-md shadow">
                {badge}
              </span>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-md flex items-center gap-2">
                {name}
              </h2>
              <p className="text-xs sm:text-sm text-emerald-300/90 font-medium mt-0.5">
                {title}
              </p>
            </div>
          </div>
        )}

        {/* Subtle Interactive Hint */}
        <div className="text-[11px] text-slate-300/80 font-medium flex items-center gap-1.5">
          <MousePointerClick className="w-3.5 h-3.5 text-orange-400" />
          <span>
            اضغط في أي مكان للشوط • أو مرر الماوس على الشبكة والكورة
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * ============================================================================
 * DEMO SHOWCASE & CODE EXPORTER FOR ANTIGRAVITY
 * ============================================================================
 */
export function FireGoalPlayground() {
  const [autoShoot, setAutoShoot] = useState(true);
  const [hoverToShoot, setHoverToShoot] = useState(true);
  const [tearStrength, setTearStrength] = useState(1.1);
  const [customName, setCustomName] = useState("Ibrahim Fox");
  const [customTitle, setCustomTitle] = useState("Striker Mode • Fire Shot");
  const [copied, setCopied] = useState(false);
  const [triggerKey, setTriggerKey] = useState(0);

  const handleCopyPrompt = () => {
    const promptText = `Create a reusable React component named FireGoalNameplate.jsx with interactive HTML5 2D Canvas Verlet cloth net physics, net tearing on high-speed fire ball collision, mouse hover net interaction, and cartoon fire particles. Use it as my profile header / nameplate for "${customName}".`;
    navigator.clipboard.writeText(promptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 flex flex-col items-center justify-center font-sans">
      <div className="w-full max-w-4xl space-y-6">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              React Bits Style • Interactive Canvas Physics
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Fire Goal Physics Nameplate
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              فيزياء شبكة حقيقية بتتقطع مع قوة التسديدة النارية وبتتأثر بالماوس واللمس
            </p>
          </div>

          <button
            onClick={handleCopyPrompt}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-orange-500/20 transition active:scale-95 cursor-pointer shrink-0"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                تم نسخ البرومبت!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                نسخ البرومبت لـ Antigravity
              </>
            )}
          </button>
        </div>

        {/* Live Interactive Component Preview */}
        <FireGoalNameplate
          key={triggerKey}
          name={customName}
          title={customTitle}
          autoShoot={autoShoot}
          hoverToShoot={hoverToShoot}
          tearStrength={tearStrength}
          height={265}
        />

        {/* Interactive Physics Controls & Playground */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-5">
          {/* Column 1: Nameplate Text Customization */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
              <Sliders className="w-4 h-4" />
              بيانات البروفايل (Nameplate)
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">الاسم</label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                الوصف / اللقب
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Column 2: Physics Settings */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-400">
              <Zap className="w-4 h-4" />
              إعدادات الفيزياء والتفاعل
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <span className="text-xs font-medium text-slate-300">
                تسديد تلقائي كل 4 ثواني
              </span>
              <button
                onClick={() => setAutoShoot(!autoShoot)}
                className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  autoShoot
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                {autoShoot ? (
                  <>
                    <Play className="w-3 h-3" /> شغال
                  </>
                ) : (
                  <>
                    <Pause className="w-3 h-3" /> متوقف
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
              <span className="text-xs font-medium text-slate-300">
                شوط الكورة لما الماوس يلمسها (Hover)
              </span>
              <button
                onClick={() => setHoverToShoot(!hoverToShoot)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  hoverToShoot
                    ? "bg-orange-500/20 text-orange-300 border border-orange-500/40"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                {hoverToShoot ? "مفعل" : "معطل"}
              </button>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">سهولة قطع الشبكة</span>
                <span className="text-orange-400 font-bold">
                  {Math.round(tearStrength * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.6"
                max="1.6"
                step="0.1"
                value={tearStrength}
                onChange={(e) => setTearStrength(parseFloat(e.target.value))}
                className="w-full accent-orange-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Column 3: Interactive Tips & Reset */}
          <div className="space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-400">
                <ShieldAlert className="w-4 h-4" />
                جرب بنفسك دلوقتي في الكارت فوق
              </div>
              <ul className="text-xs text-slate-300 space-y-1.5 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                <li>
                  • <strong>حرك الماوس على الشبكة:</strong> هتلاقي خيوط الشبكة بتتشد وتتحرك مع الماوس فيزيائياً.
                </li>
                <li>
                  • <strong>اضغط كليك في أي زاوية:</strong> الكورة هتنطلق بالنار وتقطع الشبكة في المكان اللي ضغطت عليه.
                </li>
                <li>
                  • <strong>اسحب الكورة (Slingshot):</strong> اضغط على الكورة واسحبها لورا عشان تصوب وتسيبها.
                </li>
              </ul>
            </div>

            <button
              onClick={() => setTriggerKey((k) => k + 1)}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              إعادة ضبط الشبكة والكورة
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FireGoalNameplate;