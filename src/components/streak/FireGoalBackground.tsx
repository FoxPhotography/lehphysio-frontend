import React, { useEffect, useRef, useCallback } from "react";

/**
 * ============================================================================
 * PURE INTERACTIVE FIRE GOAL PHYSICS BACKGROUND
 * ============================================================================
 * Standalone background component with:
 * - 2D Verlet Integration Cloth/Net Physics with real constraint tearing
 * - Interactive mouse/touch net ripple & ball hover/click/slingshot physics
 * - Stylized Cel-Shaded Cartoon Soccer Ball with 3D rotation & squash/stretch
 * - Multi-layered Toon Flame, Smoke & Impact Spark Particle Engine
 * - Automatic Net Regeneration & Ball Respawn
 */
export function FireGoalBackground({
  className = "w-full h-full min-h-[320px]",
  autoShoot = true,
  idleTimeout = 4000,
  tearStrength = 1.15,
  children,
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const simRef = useRef({
    width: 800,
    height: 320,
    nodes: [],
    constraints: [],
    sparks: [],
    flames: [],
    shockwaves: [],
    ball: {
      x: 140,
      y: 180,
      spawnX: 140,
      spawnY: 180,
      vx: 0,
      vy: 0,
      radius: 18,
      angle: 0,
      onFire: false,
      scaleX: 1,
      scaleY: 1,
    },
    pointer: {
      x: -1000,
      y: -1000,
      px: -1000,
      py: -1000,
      isDown: false,
      isDraggingBall: false,
    },
    shake: 0,
    flash: 0,
    netTornTime: 0,
    idleStartTime: performance.now(),
    shotActiveTime: 0,
    goalBox: {
      x: 640,
      y: 40,
      w: 125,
      h: 220,
    },
    scoredThisShot: false,
  });

  // Reset ball to its ready position on the pitch
  const resetBallToSpawn = useCallback((now = performance.now()) => {
    const sim = simRef.current;
    const spawnX = Math.min(160, Math.max(80, sim.width * 0.18));
    const spawnY = sim.height * 0.58;

    sim.ball.spawnX = spawnX;
    sim.ball.spawnY = spawnY;
    sim.ball.x = spawnX;
    sim.ball.y = spawnY;
    sim.ball.vx = 0;
    sim.ball.vy = 0;
    sim.ball.scaleX = 1;
    sim.ball.scaleY = 1;
    sim.ball.onFire = false;
    sim.scoredThisShot = false;
    sim.shotActiveTime = 0;
    sim.idleStartTime = now;
  }, []);

  // Initialize / Rebuild Verlet Cloth Net
  const initNet = useCallback((width, height) => {
    const sim = simRef.current;
    const cols = 12;
    const rows = 15;
    const goalW = Math.min(145, Math.max(95, width * 0.17));
    const goalH = Math.min(240, Math.max(140, height * 0.78));
    const startX = width - goalW - 24;
    const startY = (height - goalH) / 2;

    sim.goalBox = { x: startX, y: startY, w: goalW, h: goalH };

    const nodes = [];
    const constraints = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const depthRatio = c / (cols - 1);
        const topInset = depthRatio * 12;
        const bottomInset = depthRatio * 8;
        const effectiveH = goalH - topInset - bottomInset;

        const x = startX + depthRatio * goalW;
        const y = startY + topInset + (r / (rows - 1)) * effectiveH;

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

    const spawnX = Math.min(160, Math.max(80, width * 0.18));
    const spawnY = height * 0.58;
    sim.ball.spawnX = spawnX;
    sim.ball.spawnY = spawnY;
    if (Math.hypot(sim.ball.vx, sim.ball.vy) < 0.5 && !sim.pointer.isDraggingBall) {
      sim.ball.x = spawnX;
      sim.ball.y = spawnY;
    }
  }, []);

  // Launch a blazing power shot
  const shootBall = useCallback((options = {}) => {
    const sim = simRef.current;
    const { width, height, goalBox } = sim;
    const now = performance.now();

    const startX =
      options.startX !== undefined
        ? options.startX
        : sim.ball.x || Math.min(160, Math.max(80, width * 0.18));
    const startY =
      options.startY !== undefined
        ? options.startY
        : sim.ball.y || height * 0.58;

    const targetX =
      options.targetX !== undefined
        ? options.targetX
        : goalBox.x + goalBox.w * 0.65;
    const targetY =
      options.targetY !== undefined
        ? options.targetY
        : goalBox.y + goalBox.h * (0.22 + Math.random() * 0.56);

    const dx = targetX - startX;
    const dy = targetY - startY;
    const dist = Math.hypot(dx, dy) || 1;

    const power = options.power || 31 + Math.random() * 4;
    const vx = options.vx !== undefined ? options.vx : (dx / dist) * power;
    const vy =
      options.vy !== undefined ? options.vy : (dy / dist) * power - 2.3;

    sim.ball.x = startX;
    sim.ball.y = startY;
    sim.ball.vx = vx;
    sim.ball.vy = vy;
    sim.ball.onFire = options.onFire !== undefined ? options.onFire : true;
    sim.scoredThisShot = false;
    sim.shotActiveTime = now;
    sim.idleStartTime = now;

    for (let i = 0; i < 20; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 2 + Math.random() * 6.5;
      sim.sparks.push({
        x: startX,
        y: startY,
        vx: Math.cos(ang) * spd - vx * 0.14,
        vy: Math.sin(ang) * spd - vy * 0.14,
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
      maxRadius: 58,
      alpha: 0.85,
      color: "#fb923c",
    });
  }, []);

  // Regenerate torn net and reset ball smoothly
  const repairNet = useCallback(() => {
    const sim = simRef.current;
    sim.constraints.forEach((c) => {
      c.torn = false;
      c.stress = 0;
    });
    sim.nodes.forEach((n) => {
      n.x = n.baseX + (Math.random() - 0.5) * 3;
      n.y = n.baseY + (Math.random() - 0.5) * 3;
      n.ox = n.baseX;
      n.oy = n.baseY;
    });
    sim.netTornTime = 0;

    const { goalBox } = sim;
    for (let i = 0; i < 18; i++) {
      sim.sparks.push({
        x: goalBox.x + Math.random() * goalBox.w,
        y: goalBox.y + Math.random() * goalBox.h,
        vx: (Math.random() - 0.5) * 2,
        vy: -1 - Math.random() * 2,
        size: 2 + Math.random() * 2.5,
        color: "#34d399",
        life: 1,
        decay: 0.028,
      });
    }
  }, []);

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
      resetBallToSpawn(performance.now());
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    // Draw Cel-Shaded Cartoon 3D Soccer Ball
    const drawStylizedSoccerBall = (
      ctx,
      x,
      y,
      r,
      angle,
      scaleX,
      scaleY,
      velAngle,
      onFire
    ) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(velAngle);
      ctx.scale(scaleX, scaleY);
      ctx.rotate(-velAngle);

      if (onFire) {
        const auraGrad = ctx.createRadialGradient(0, 0, r * 0.4, 0, 0, r * 2.2);
        auraGrad.addColorStop(0, "rgba(254, 240, 138, 0.95)");
        auraGrad.addColorStop(0.45, "rgba(249, 115, 22, 0.7)");
        auraGrad.addColorStop(1, "rgba(239, 68, 68, 0)");
        ctx.fillStyle = auraGrad;
        ctx.beginPath();
        ctx.arc(0, 0, r * 2.2, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.save();
      ctx.clip();

      const ballGrad = ctx.createRadialGradient(
        -r * 0.35,
        -r * 0.35,
        r * 0.1,
        0,
        0,
        r * 1.1
      );
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

      ctx.strokeStyle = onFire ? "#7c2d12" : "#334155";
      ctx.lineWidth = 1.6;
      for (let i = 0; i < 5; i++) {
        const a = (i * 2 * Math.PI) / 5 - Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * (r * 0.32), Math.sin(a) * (r * 0.32));
        ctx.lineTo(Math.cos(a) * (r * 0.88), Math.sin(a) * (r * 0.88));
        ctx.stroke();
      }

      ctx.fillStyle = onFire ? "#431407" : "#0f172a";
      drawPentagon(0, 0, r * 0.36);

      for (let i = 0; i < 5; i++) {
        const a = (i * 2 * Math.PI) / 5 - Math.PI / 2;
        const dist = r * 0.92;
        drawPentagon(Math.cos(a) * dist, Math.sin(a) * dist, r * 0.33);
      }
      ctx.restore();

      ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
      ctx.beginPath();
      ctx.ellipse(
        -r * 0.35,
        -r * 0.38,
        r * 0.32,
        r * 0.16,
        -Math.PI / 4,
        0,
        Math.PI * 2
      );
      ctx.fill();

      ctx.restore();

      ctx.strokeStyle = onFire ? "#fde047" : "#0f172a";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    };

    const render = (now) => {
      const sim = simRef.current;
      const { width, height, ball, nodes, constraints, pointer, goalBox } = sim;

      const ballSpeed = Math.hypot(ball.vx, ball.vy);
      const isStationary = ballSpeed < 0.45 && sim.shotActiveTime === 0;

      // Pause/reset the 4-second timer while holding the ball or while ball is moving
      if (pointer.isDraggingBall || !isStationary) {
        sim.idleStartTime = now;
      } else if (
        autoShoot &&
        now - sim.idleStartTime >= idleTimeout
      ) {
        shootBall({
          power: 31 + Math.random() * 4,
          onFire: true,
        });
      }

      // Repair torn net after 2.2 seconds
      if (sim.netTornTime > 0 && now - sim.netTornTime > 2200) {
        repairNet();
      }

      // After a shot finishes (either flies out or settles down), reset ball to spawn so idle timer can start cleanly
      if (
        !pointer.isDraggingBall &&
        sim.shotActiveTime > 0 &&
        (now - sim.shotActiveTime > 2300 ||
          (now - sim.shotActiveTime > 900 && ballSpeed < 0.8))
      ) {
        resetBallToSpawn(now);
      }

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

      // Subtle Pitch Lines
      ctx.save();
      ctx.strokeStyle = "rgba(16, 185, 129, 0.14)";
      ctx.lineWidth = 2;
      ctx.strokeRect(
        goalBox.x - 95,
        goalBox.y - 20,
        goalBox.w + 115,
        goalBox.h + 40
      );
      ctx.beginPath();
      ctx.arc(
        goalBox.x - 95,
        goalBox.y + goalBox.h / 2,
        48,
        Math.PI * 0.65,
        Math.PI * 1.35
      );
      ctx.stroke();

      // Ground Turf Line
      ctx.strokeStyle = "rgba(16, 185, 129, 0.22)";
      ctx.beginPath();
      ctx.moveTo(0, height - 16);
      ctx.lineTo(width, height - 16);
      ctx.stroke();
      ctx.restore();

      // Update Ball Physics
      if (!pointer.isDraggingBall) {
        ball.vy += 0.26;
        ball.vx *= 0.992;
        ball.vy *= 0.992;

        ball.x += ball.vx;
        ball.y += ball.vy;
        ball.angle += ball.vx * 0.032;

        const speed = Math.hypot(ball.vx, ball.vy);

        const stretch = Math.min(1.36, 1 + speed * 0.011);
        ball.scaleX += (stretch - ball.scaleX) * 0.35;
        ball.scaleY += (1 / stretch - ball.scaleY) * 0.35;

        const floorY = height - 16;
        if (ball.y + ball.radius > floorY) {
          ball.y = floorY - ball.radius;
          ball.vy = -ball.vy * 0.68;
          ball.vx *= 0.88;
          if (Math.abs(ball.vy) > 2) {
            ball.scaleX = 1.26;
            ball.scaleY = 0.76;
          }
        }
        if (ball.y - ball.radius < 12) {
          ball.y = 12 + ball.radius;
          ball.vy = -ball.vy * 0.65;
        }
        if (ball.x - ball.radius < 12) {
          ball.x = 12 + ball.radius;
          ball.vx = Math.abs(ball.vx) * 0.75;
        }

        // Respawn ball smoothly on the left if it flies far off the right edge
        if (ball.x - ball.radius > width + 90) {
          resetBallToSpawn(now);
        }

        // Goalpost Corner Collisions
        const postLocations = [
          { x: goalBox.x, y: goalBox.y, r: 6 },
          { x: goalBox.x, y: goalBox.y + goalBox.h, r: 6 },
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

        // Emit Stylized Toon Flame & Smoke Particles
        if (ball.onFire && speed > 3.0) {
          const count = speed > 14 ? 4 : 2;
          for (let i = 0; i < count; i++) {
            const spread = (Math.random() - 0.5) * ball.radius * 1.15;
            const perpX = -ball.vy / (speed || 1);
            const perpY = ball.vx / (speed || 1);

            sim.flames.push({
              x:
                ball.x -
                (ball.vx / speed) * (ball.radius * 0.55) +
                perpX * spread,
              y:
                ball.y -
                (ball.vy / speed) * (ball.radius * 0.55) +
                perpY * spread,
              vx:
                -ball.vx * (0.12 + Math.random() * 0.15) +
                (Math.random() - 0.5) * 1.8,
              vy:
                -ball.vy * (0.12 + Math.random() * 0.15) -
                0.6 +
                (Math.random() - 0.5) * 1.8,
              size: ball.radius * (0.68 + Math.random() * 0.55),
              life: 1.0,
              decay: 0.036 + Math.random() * 0.025,
            });
          }

          if (Math.random() < 0.7) {
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
        ball.scaleX = 1;
        ball.scaleY = 1;
      }

      // Update Verlet Cloth Net Nodes
      const mouseVx = pointer.x - pointer.px;
      const mouseVy = pointer.y - pointer.py;

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        if (n.pinned) continue;

        const vx = (n.x - n.ox) * 0.96;
        const vy = (n.y - n.oy) * 0.96;

        n.ox = n.x;
        n.oy = n.y;

        const wind = Math.sin(now * 0.003 + n.r * 0.35 + n.c * 0.2) * 0.06;
        const springX = (n.baseX - n.x) * 0.012;
        const springY = (n.baseY - n.y) * 0.012;

        n.x += vx + wind + springX;
        n.y += vy + 0.12 + springY;

        // Mouse/Touch Ripple Interaction on Net
        const mdx = n.x - pointer.x;
        const mdy = n.y - pointer.y;
        const mDist = Math.hypot(mdx, mdy);
        if (mDist < 46) {
          const factor = (1 - mDist / 46) * 0.7;
          n.x += Math.max(-10, Math.min(10, mouseVx * factor));
          n.y += Math.max(-10, Math.min(10, mouseVy * factor));
        }

        // Ball Collision with Net Nodes
        const bdx = n.x - ball.x;
        const bdy = n.y - ball.y;
        const bDist = Math.hypot(bdx, bdy);
        const hitRadius = ball.radius + 9;

        if (bDist < hitRadius) {
          const bSpeed = Math.hypot(ball.vx, ball.vy);
          const nx = bdx / (bDist || 1);
          const ny = bdy / (bDist || 1);

          const pushDist = (hitRadius - bDist) * 1.15;
          n.x += nx * pushDist + ball.vx * 0.42;
          n.y += ny * pushDist + ball.vy * 0.42;

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

      // Solve Cloth Constraints & Tear Net Under High Impact
      const tearThreshold = 2.4 / tearStrength;

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

          const midX = (n1.x + n2.x) * 0.5;
          const midY = (n1.y + n2.y) * 0.5;
          const distToBall = Math.hypot(midX - ball.x, midY - ball.y);
          const ballSpeed = Math.hypot(ball.vx, ball.vy);

          const shouldTearFromBall =
            ball.onFire &&
            ballSpeed > 14 &&
            distToBall < ball.radius + 8 &&
            !n1.pinned &&
            !n2.pinned;

          if (strain > tearThreshold || shouldTearFromBall) {
            c.torn = true;

            if (sim.netTornTime === 0) {
              sim.netTornTime = now;
            }

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

      // Goal Impact Shockwave & Shake
      if (
        !sim.scoredThisShot &&
        ball.x > goalBox.x + 12 &&
        ball.x < goalBox.x + goalBox.w + 40 &&
        ball.y > goalBox.y &&
        ball.y < goalBox.y + goalBox.h
      ) {
        sim.scoredThisShot = true;
        sim.shake = ball.onFire ? 16 : 7;
        sim.flash = ball.onFire ? 0.5 : 0.2;

        sim.shockwaves.push({
          x: ball.x,
          y: ball.y,
          radius: 10,
          maxRadius: 95,
          alpha: 1,
          color: ball.onFire ? "#f97316" : "#34d399",
        });
      }

      // Back Goalpost Frame
      ctx.save();
      ctx.strokeStyle = "rgba(203, 213, 225, 0.45)";
      ctx.lineWidth = 3.5;
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(goalBox.x, goalBox.y);
      ctx.lineTo(goalBox.x + goalBox.w, goalBox.y + 12);
      ctx.lineTo(goalBox.x + goalBox.w, goalBox.y + goalBox.h - 8);
      ctx.lineTo(goalBox.x, goalBox.y + goalBox.h);
      ctx.stroke();
      ctx.restore();

      // Render Flame & Smoke Particles
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

      // Slingshot / Grab Aim Trajectory Line
      if (pointer.isDraggingBall) {
        const pullDx = ball.spawnX - ball.x;
        const pullDy = ball.spawnY - ball.y;
        const pullDist = Math.hypot(pullDx, pullDy);

        // Aim either via slingshot pull-back or directly toward goal if just holding/nudging forward
        let aimVx = pullDist > 12 ? pullDx * 0.45 : (goalBox.x + goalBox.w * 0.5 - ball.x) * 0.065;
        let aimVy = pullDist > 12 ? pullDy * 0.45 : (pointer.y - ball.spawnY) * 0.18 - 2.2;
        if (aimVx < 14) {
          aimVx = 28;
        }

        ctx.save();
        ctx.strokeStyle = "#fb923c";
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.moveTo(ball.x, ball.y);
        ctx.lineTo(ball.x + aimVx * 6.5, ball.y + aimVy * 6.5);
        ctx.stroke();
        ctx.restore();
      }

      // Render Stylized Cartoon Soccer Ball
      const velAngle = pointer.isDraggingBall
        ? 0
        : Math.atan2(ball.vy, ball.vx);
      drawStylizedSoccerBall(
        ctx,
        ball.x,
        ball.y,
        ball.radius,
        ball.angle,
        ball.scaleX,
        ball.scaleY,
        velAngle,
        ball.onFire || pointer.isDraggingBall
      );

      // Render Verlet Cloth Net Mesh
      ctx.save();
      ctx.lineCap = "round";
      for (let i = 0; i < constraints.length; i++) {
        const c = constraints[i];
        if (c.torn) continue;

        const n1 = nodes[c.p1];
        const n2 = nodes[c.p2];

        if (c.stress > 0.22) {
          ctx.strokeStyle = `rgba(251, 146, 60, ${0.65 + c.stress * 0.35})`;
          ctx.lineWidth = 2.2;
        } else {
          ctx.strokeStyle = "rgba(241, 245, 249, 0.68)";
          ctx.lineWidth = 1.5;
        }

        ctx.beginPath();
        ctx.moveTo(n1.x, n1.y);
        ctx.lineTo(n2.x, n2.y);
        ctx.stroke();
      }

      ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        ctx.beginPath();
        ctx.arc(n.x, n.y, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Front Goalpost & Crossbar
      ctx.save();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 6.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.shadowColor = "rgba(52, 211, 153, 0.5)";
      ctx.shadowBlur = 12;

      ctx.beginPath();
      ctx.moveTo(goalBox.x, goalBox.y);
      ctx.lineTo(goalBox.x, goalBox.y + goalBox.h);
      ctx.moveTo(goalBox.x, goalBox.y);
      ctx.lineTo(goalBox.x + goalBox.w, goalBox.y + 12);
      ctx.stroke();
      ctx.restore();

      // Render Sparks
      for (let i = sim.sparks.length - 1; i >= 0; i--) {
        const s = sim.sparks[i];
        s.x += s.vx;
        s.y += s.vy;
        s.vy += 0.18;
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

      // Render Shockwaves
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

      // Screen Flash
      if (sim.flash > 0.01) {
        ctx.fillStyle = `rgba(251, 146, 60, ${sim.flash * 0.32})`;
        ctx.fillRect(0, 0, width, height);
      }

      pointer.px = pointer.x;
      pointer.py = pointer.y;

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, [
    autoShoot,
    idleTimeout,
    initNet,
    repairNet,
    resetBallToSpawn,
    shootBall,
    tearStrength,
  ]);

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
    const now = performance.now();

    sim.pointer.x = x;
    sim.pointer.y = y;
    sim.pointer.px = x;
    sim.pointer.py = y;
    sim.pointer.isDown = true;

    // Grab the ball when clicking/touching on or near the ball
    const distToBall = Math.hypot(x - sim.ball.x, y - sim.ball.y);
    if (distToBall <= sim.ball.radius + 50) {
      sim.pointer.isDraggingBall = true;
      sim.ball.spawnX = sim.ball.x;
      sim.ball.spawnY = sim.ball.y;
      sim.ball.vx = 0;
      sim.ball.vy = 0;
      sim.ball.onFire = true;
      sim.shotActiveTime = 0;
      sim.idleStartTime = now;
    }
  };

  const handlePointerMove = (e) => {
    if (!canvasRef.current) return;
    const { x, y } = getLocalCoords(e);
    const sim = simRef.current;
    sim.pointer.x = x;
    sim.pointer.y = y;

    // Move the ball slightly with the hand/cursor while holding it & keep auto-shoot paused
    if (sim.pointer.isDraggingBall) {
      const maxPull = 95;
      const dx = x - sim.ball.spawnX;
      const dy = y - sim.ball.spawnY;
      const dist = Math.hypot(dx, dy);
      const clampedDist = Math.min(maxPull, dist);
      const ang = Math.atan2(dy, dx);

      sim.ball.x = sim.ball.spawnX + Math.cos(ang) * clampedDist;
      sim.ball.y = sim.ball.spawnY + Math.sin(ang) * clampedDist;
      sim.ball.vx = 0;
      sim.ball.vy = 0;
      sim.idleStartTime = performance.now();
    }
  };

  const handlePointerUp = () => {
    const sim = simRef.current;
    if (sim.pointer.isDraggingBall) {
      const pullDx = sim.ball.spawnX - sim.ball.x;
      const pullDy = sim.ball.spawnY - sim.ball.y;
      const pullDist = Math.hypot(pullDx, pullDy);

      sim.pointer.isDraggingBall = false;

      if (pullDist > 12) {
        // Slingshot release: shoot in the direction opposite to pull, or toward goal if dragged forward
        const dirX = pullDx > 5 ? pullDx : Math.abs(pullDx) + 45;
        const speedScale = Math.min(36, Math.max(26, pullDist * 0.45));
        const norm = Math.hypot(dirX, pullDy) || 1;

        shootBall({
          startX: sim.ball.x,
          startY: sim.ball.y,
          vx: (dirX / norm) * speedScale,
          vy: (pullDy / norm) * speedScale - 1.5,
          onFire: true,
        });
      } else {
        // Quick grab & release shoots directly into the goal
        shootBall({
          startX: sim.ball.x,
          startY: sim.ball.y,
          power: 32,
          onFire: true,
        });
      }
    }
    sim.pointer.isDown = false;
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handlePointerDown}
      onMouseMove={handlePointerMove}
      onMouseUp={handlePointerUp}
      onMouseLeave={handlePointerUp}
      onTouchStart={handlePointerDown}
      onTouchMove={handlePointerMove}
      onTouchEnd={handlePointerUp}
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-emerald-950/90 to-slate-900 select-none cursor-grab active:cursor-grabbing ${className}`}
    >
      {/* Ambient Stadium Glow */}
      <div className="absolute -top-24 left-1/4 w-72 h-72 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 right-10 w-80 h-80 bg-orange-500/20 rounded-full blur-3xl pointer-events-none" />

      {/* Pure Interactive Physics Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
        className="absolute inset-0 w-full h-full block z-10 pointer-events-auto"
      />

      {/* Optional slot if you ever pass children over the background */}
      {children && (
        <div className="relative z-20 w-full h-full pointer-events-none">
          {children}
        </div>
      )}
    </div>
  );
}

export function FireGoalPlayground() {
  return (
    <div className="w-screen h-screen bg-slate-950 p-4 sm:p-6 flex items-center justify-center">
      <FireGoalBackground className="w-full h-full max-w-5xl max-h-[420px] border border-emerald-500/25 shadow-2xl" />
    </div>
  );
}

export default FireGoalBackground;
