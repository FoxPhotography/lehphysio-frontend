'use client';

import React, { useEffect, useRef, useState, type HTMLAttributes } from 'react';
import './PixelSnow.css';

export type PixelSnowVariant = 'snowflake' | 'square' | 'round';

export interface PixelSnowProps extends HTMLAttributes<HTMLDivElement> {
  color?: string;
  variant?: PixelSnowVariant;
  density?: number;
  speed?: number;
  wind?: number;
  sway?: number;
  flakeSize?: number;
  pixelSize?: number;
  depth?: number;
  brightness?: number;
  glow?: number;
  twinkle?: number;
  accumulate?: boolean;
  mouseInteraction?: boolean;
  intro?: boolean;
  fade?: number;
  opacity?: number;
  lightMode?: boolean;
  paused?: boolean;
  dpr?: number;
  engine?: 'auto' | '2d' | 'webgl';
}

type Settings = {
  color: string;
  variant: number;
  density: number;
  speed: number;
  wind: number;
  sway: number;
  flakeSize: number;
  pixelSize: number;
  depth: number;
  brightness: number;
  glow: number;
  twinkle: number;
  accumulate: boolean;
  mouseInteraction: boolean;
  intro: boolean;
  fade: number;
  opacity: number;
  lightMode: boolean;
  paused: boolean;
  dpr?: number;
};

type Program = { program: WebGLProgram; uniforms: Record<string, WebGLUniformLocation | null> };
type Target = { texture: WebGLTexture | null; framebuffer: WebGLFramebuffer | null; width: number; height: number };

type Flake = {
  level: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  phase: number;
  rate: number;
  sparkle: number;
  drift: number;
  alt: boolean;
  reveal: number;
  levelSize: number;
};

const SPRITES: Record<string, string[][]> = {
  square: [
    ['@'],
    ['oo', 'oo'],
    ['xox', 'o@o', 'xox'],
    ['xoox', 'o@@o', 'o@@o', 'xoox'],
    ['xooox', 'oo@oo', 'o@@@o', 'oo@oo', 'xooox'],
    ['xox', 'o@o', 'xox'],
    ['xoox', 'o@@o', 'o@@o', 'xoox'],
    ['xooox', 'oo@oo', 'o@@@o', 'oo@oo', 'xooox']
  ],
  round: [
    ['@'],
    ['.x.', 'x@x', '.x.'],
    ['.xx.', 'x@@x', 'x@@x', '.xx.'],
    ['.xxx.', 'xo@ox', 'x@@@x', 'xo@ox', '.xxx.'],
    ['..xxx..', '.xooox.', 'xoo@oox', 'xo@@@ox', 'xoo@oox', '.xooox.', '..xxx..'],
    ['.xx.', 'x@@x', 'x@@x', '.xx.'],
    ['.xxx.', 'xo@ox', 'x@@@x', 'xo@ox', '.xxx.'],
    ['..xxx..', '.xooox.', 'xoo@oox', 'xo@@@ox', 'xoo@oox', '.xooox.', '..xxx..']
  ],
  snowflake: [
    ['@'],
    ['.x.', 'x@x', '.x.'],
    ['..x..', 'x.o.x', '.o@o.', 'x.o.x', '..x..'],
    ['...x...', '.x.o.x.', '..ooo..', 'xoo@oox', '..ooo..', '.x.o.x.', '...x...'],
    [
      '....x....',
      '.x..o..x.',
      '..o.o.o..',
      '...ooo...',
      'xooo@ooox',
      '...ooo...',
      '..o.o.o..',
      '.x..o..x.',
      '....x....'
    ],
    ['x...x', '.o.o.', '..@..', '.o.o.', 'x...x'],
    ['x..x..x', '.o.o.o.', '..ooo..', 'xoo@oox', '..ooo..', '.o.o.o.', 'x..x..x'],
    [
      'x...x...x',
      '.o..o..o.',
      '..o.o.o..',
      '...ooo...',
      'xooo@ooox',
      '...ooo...',
      '..o.o.o..',
      '.o..o..o.',
      'x...x...x'
    ]
  ]
};

const VARIANTS = ['square', 'round', 'snowflake'];
const CELL = 9;
const LEVELS = 5;
const SLOTS = 8;
const MAX_FLAKES = 120;
const LEVEL_WEIGHTS = [0.46, 0.27, 0.15, 0.08, 0.04];
const LEVEL_FALL = [16, 24, 34, 48, 66];
const LEVEL_LIGHT = [0.42, 0.58, 0.76, 0.92, 1];
const INTRO_SECONDS = 1.4;

const QUAD_VERTEX = `#version 300 es
in vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const FLAKE_VERTEX = `#version 300 es
in vec2 aCorner;
in vec4 aFlake;
uniform vec2 uGrid;
uniform vec4 uSizes;
uniform float uLargest;
flat out ivec2 vOrigin;
flat out ivec2 vCell;
flat out int vSize;
flat out float vLight;
void main() {
  int index = int(aFlake.z + 0.5);
  int slot = index % ${SLOTS};
  int variant = index / ${SLOTS};
  int level = slot < ${LEVELS} ? slot : slot - 3;
  float size = level == 0 ? 1.0 : (level == 1 ? uSizes.x : (level == 2 ? uSizes.y : (level == 3 ? uSizes.z : uLargest)));
  vec2 origin = floor(aFlake.xy) - floor(size * 0.5);
  origin.y = uGrid.y - origin.y - size;
  vec2 corner = origin + (aCorner * 0.5 + 0.5) * size;
  gl_Position = vec4(corner / uGrid * 2.0 - 1.0, 0.0, 1.0);
  vOrigin = ivec2(origin);
  vCell = ivec2(slot * ${CELL}, variant * ${CELL});
  vSize = int(size);
  vLight = aFlake.w;
}`;

const FLAKE_FRAGMENT = `#version 300 es
precision highp float;
precision highp int;
uniform sampler2D uAtlas;
flat in ivec2 vOrigin;
flat in ivec2 vCell;
flat in int vSize;
flat in float vLight;
out vec4 outColor;
void main() {
  ivec2 local = ivec2(gl_FragCoord.xy) - vOrigin;
  if (local.x < 0 || local.y < 0 || local.x >= vSize || local.y >= vSize) discard;
  vec4 texel = texelFetch(uAtlas, vCell + local, 0);
  if (texel.r < 0.5) discard;
  outColor = vec4(vLight, texel.g * vLight, 0.0, 1.0);
}`;

const PILE = `#version 300 es
precision highp float;
precision highp int;
uniform sampler2D uPile;
uniform float uTime;
uniform float uLight;
out vec4 outColor;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

void main() {
  ivec2 cell = ivec2(gl_FragCoord.xy);
  float height = texelFetch(uPile, ivec2(cell.x, 0), 0).r;
  float row = float(cell.y);
  if (row >= floor(height + 0.5)) discard;
  float below = floor(height + 0.5) - row;
  float crest = below <= 1.0 ? 1.0 : 0.0;
  ivec2 bayerCell = cell & 3;
  int bayerIndex = bayerCell.x + bayerCell.y * 4;
  float bayer[16] = float[16](0.0, 8.0, 2.0, 10.0, 12.0, 4.0, 14.0, 6.0, 3.0, 11.0, 1.0, 9.0, 15.0, 7.0, 13.0, 5.0);
  float threshold = (bayer[bayerIndex] + 0.5) / 16.0;
  float shade = clamp((below - 1.0) / 9.0, 0.0, 1.0) * 3.0;
  float step3 = floor(shade) + step(threshold, fract(shade));
  float body = 0.94 - step3 * 0.13;
  float glint = below <= 3.0 ? step(0.992, hash(vec2(cell) + floor(uTime * 1.1 + hash(vec2(cell.yx)) * 9.0))) : 0.0;
  float core = crest * 0.6 + glint;
  outColor = vec4(body, core, 0.0, 1.0) * uLight;
}`;

const DOWN = `#version 300 es
precision highp float;
uniform sampler2D uSource;
uniform vec2 uTexel;
uniform vec2 uTarget;
out vec4 outColor;
void main() {
  vec2 uv = gl_FragCoord.xy / uTarget;
  vec4 sum = texture(uSource, uv) * 4.0;
  sum += texture(uSource, uv - uTexel);
  sum += texture(uSource, uv + uTexel);
  sum += texture(uSource, uv + vec2(uTexel.x, -uTexel.y));
  sum += texture(uSource, uv - vec2(uTexel.x, -uTexel.y));
  outColor = sum / 8.0;
}`;

const UP = `#version 300 es
precision highp float;
uniform sampler2D uSource;
uniform sampler2D uBase;
uniform vec2 uTexel;
uniform vec2 uTarget;
out vec4 outColor;
void main() {
  vec2 uv = gl_FragCoord.xy / uTarget;
  vec2 h = uTexel * 0.5;
  vec4 sum = texture(uSource, uv + vec2(-h.x * 2.0, 0.0));
  sum += texture(uSource, uv + vec2(h.x * 2.0, 0.0));
  sum += texture(uSource, uv + vec2(0.0, -h.y * 2.0));
  sum += texture(uSource, uv + vec2(0.0, h.y * 2.0));
  sum += texture(uSource, uv + vec2(-h.x, h.y)) * 2.0;
  sum += texture(uSource, uv + h) * 2.0;
  sum += texture(uSource, uv + vec2(h.x, -h.y)) * 2.0;
  sum += texture(uSource, uv - h) * 2.0;
  outColor = (sum / 12.0 + texture(uBase, uv)) * 0.5;
}`;

const COMPOSITE = `#version 300 es
precision highp float;
uniform sampler2D uSnow;
uniform sampler2D uGlowMap;
uniform vec2 uResolution;
uniform vec2 uGrid;
uniform float uPixel;
uniform vec3 uColor;
uniform float uBrightness;
uniform float uGlow;
uniform float uFade;
uniform float uOpacity;
uniform float uLightMode;
out vec4 outColor;

float smootherstep(float edge, float x) {
  float t = clamp(x / max(edge, 0.0001), 0.0, 1.0);
  return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  ivec2 cell = ivec2(floor(gl_FragCoord.xy / uPixel));
  vec4 snow = texelFetch(uSnow, clamp(cell, ivec2(0), ivec2(uGrid) - 1), 0);
  vec2 glow = texture(uGlowMap, gl_FragCoord.xy / (uGrid * uPixel)).rg;
  float edge = uFade * 0.5;
  float mask = smootherstep(edge, uv.x) * smootherstep(edge, 1.0 - uv.x) * smootherstep(edge, uv.y) * smootherstep(edge, 1.0 - uv.y);
  mask *= uOpacity;
  float body = clamp(snow.r * uBrightness, 0.0, 1.0);
  float core = clamp(snow.g * uBrightness, 0.0, 1.0);
  float halo = clamp(glow.r * uGlow * uBrightness, 0.0, 1.0);
  if (uLightMode > 0.5) {
    vec3 tint = mix(uColor, vec3(1.0), clamp(core / max(body, 0.001), 0.0, 1.0) * 0.45);
    float alpha = body * 0.95;
    vec4 color = vec4(tint * alpha, alpha);
    float soft = halo * 0.22 * (1.0 - alpha);
    color += vec4(uColor * soft, soft);
    outColor = color * mask;
  } else {
    vec3 color = uColor * (body * 0.82 + core * 0.18) + uColor * halo * 0.55;
    color = 1.0 - exp(-color * 1.6);
    color *= mask;
    outColor = vec4(color, max(color.r, max(color.g, color.b)));
  }
}`;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const seeded = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const compile = (gl: WebGL2RenderingContext, type: number, source: string) => {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  gl.deleteShader(shader);
  return null;
};

const link = (
  gl: WebGL2RenderingContext,
  vertexSource: string,
  fragmentSource: string,
  attributes: string[]
): Program | null => {
  const vertex = compile(gl, gl.VERTEX_SHADER, vertexSource);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();
  if (!vertex || !fragment || !program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  attributes.forEach((name, index) => gl.bindAttribLocation(program, index, name));
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  const uniforms: Record<string, WebGLUniformLocation | null> = {};
  const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < count; i++) {
    const info = gl.getActiveUniform(program, i);
    if (info) uniforms[info.name] = gl.getUniformLocation(program, info.name);
  }
  return { program, uniforms };
};

const buildAtlas = () => {
  const width = CELL * SLOTS;
  const height = CELL * VARIANTS.length;
  const data = new Uint8Array(width * height * 4);
  VARIANTS.forEach((variant, row) => {
    SPRITES[variant].forEach((rows, level) => {
      rows.forEach((line, y) => {
        for (let x = 0; x < line.length; x++) {
          const mark = line[x];
          if (mark === '.') continue;
          const offset = ((row * CELL + y) * width + level * CELL + x) * 4;
          data[offset] = 255;
          data[offset + 1] = mark === '@' ? 255 : mark === 'o' ? 128 : 0;
          data[offset + 3] = 255;
        }
      });
    });
  });
  return { data, width, height };
};

const toRgb = (color: string) => {
  const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color.trim());
  if (!match) return [1, 1, 1];
  const hex = match[1].length === 3 ? match[1].replace(/./g, digit => digit + digit) : match[1];
  return [0, 2, 4].map(index => parseInt(hex.slice(index, index + 2), 16) / 255);
};

// ─── Lightweight 2D Canvas Engine (Immune to WebGL context limits & GPU crash) ───
function PixelSnow2D({ settings, className }: { settings: Settings; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let raf = 0;
    let visible = true;
    let last = 0;
    let width = 0;
    let height = 0;
    let dpr = 1;

    interface Flake2D {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      swayPhase: number;
      swaySpeed: number;
      alpha: number;
      twinklePhase: number;
      twinkleSpeed: number;
    }

    let flakes: Flake2D[] = [];
    let cols = 0;
    let pile = new Float32Array(0);

    const initPile = (w: number, h: number, c: number) => {
      if (!settingsRef.current.accumulate || c <= 0) return;
      pile = new Float32Array(c);
      // Pre-seed snow accumulation bank so snow is immediately visible at the bottom
      const cap = Math.min(Math.max(3.5, h * 0.2), 12);
      for (let i = 0; i < c; i++) {
        const norm = i / c;
        const dune = 0.55 + 0.45 * Math.sin(norm * 14 + 1.2) * Math.sin(norm * 7 + 0.5);
        pile[i] = cap * dune * 0.7;
      }
    };

    const populate = () => {
      const s = settingsRef.current;
      const count = Math.min(26, Math.max(8, Math.round(s.density * 34)));
      if (flakes.length === count) return;
      flakes = [];
      for (let i = 0; i < count; i++) {
        flakes.push({
          x: Math.random() * (width || 120),
          y: Math.random() * (height || 80),
          vx: (Math.random() - 0.5) * 8 + s.wind * 10,
          vy: (14 + Math.random() * 20) * Math.max(0.4, s.speed),
          size: Math.random() < 0.25 ? 3 : (Math.random() < 0.6 ? 2 : 1),
          swayPhase: Math.random() * Math.PI * 2,
          swaySpeed: 1.5 + Math.random() * 2.5,
          alpha: 0.45 + Math.random() * 0.5,
          twinklePhase: Math.random() * Math.PI * 2,
          twinkleSpeed: 2 + Math.random() * 3,
        });
      }
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, Math.round(rect.width));
      height = Math.max(1, Math.round(rect.height));
      const isMobile = typeof window !== 'undefined' &&
        (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768);
      dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1 : 1.5);

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);

      const newCols = Math.max(16, Math.ceil(width / 3));
      if (newCols !== cols) {
        cols = newCols;
        initPile(width, height, cols);
      }
      populate();
    };

    const frame = (now: number) => {
      raf = 0;
      if (!visible || document.hidden) return;
      const s = settingsRef.current;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;

      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      // ─── 1. Snow Accumulation at the bottom ──────────────────
      if (s.accumulate && cols > 0 && pile.length === cols) {
        const cap = Math.min(Math.max(4, height * 0.25), 14);
        if (s.speed > 0) {
          const grow = (0.15 + s.density * 0.4) * dt * Math.min(1.2, s.speed);
          for (let i = 0; i < cols; i++) {
            if (pile[i] < cap) {
              const norm = i / cols;
              const dune = 0.6 + 0.4 * Math.sin(norm * 14 + 1.2);
              pile[i] += grow * dune * 0.4;
            }
          }
        }
        // Smooth neighbors
        for (let i = 1; i < cols - 1; i++) {
          const diff = (pile[i - 1] + pile[i + 1]) * 0.5 - pile[i];
          pile[i] += diff * 0.05;
        }

        // Draw snow bank polygon
        ctx.beginPath();
        ctx.moveTo(0, height);
        for (let i = 0; i < cols; i++) {
          const px = (i / (cols - 1)) * width;
          const py = height - Math.max(0, pile[i]);
          ctx.lineTo(px, py);
        }
        ctx.lineTo(width, height);
        ctx.closePath();

        // Snow body fill
        ctx.fillStyle = s.color || '#e0f2fe';
        ctx.globalAlpha = 0.82 * (s.opacity ?? 1);
        ctx.fill();

        // Bright white crest line
        ctx.beginPath();
        for (let i = 0; i < cols; i++) {
          const px = (i / (cols - 1)) * width;
          const py = height - Math.max(0, pile[i]);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.95 * (s.opacity ?? 1);
        ctx.stroke();

        // Sparkles on crest
        for (let i = 2; i < cols - 2; i += 4) {
          const spark = Math.sin(now * 0.003 + i * 2.3);
          if (spark > 0.86) {
            const px = (i / (cols - 1)) * width;
            const py = height - Math.max(0, pile[i]);
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = 0.95 * (s.opacity ?? 1);
            ctx.fillRect(px - 0.5, py - 1, 1.5, 1.5);
          }
        }
      }

      // ─── 2. Falling Flakes ──────────────────────────────────
      const cap = Math.min(Math.max(4, height * 0.25), 14);
      for (const flake of flakes) {
        flake.swayPhase += flake.swaySpeed * dt;
        const sway = Math.sin(flake.swayPhase) * (s.sway * 14);
        flake.x += (flake.vx + sway + s.wind * 12) * dt;
        flake.y += flake.vy * dt;

        if (flake.x < -8) flake.x += width + 16;
        else if (flake.x > width + 8) flake.x -= width + 16;

        const col = Math.floor((flake.x / width) * (cols - 1));
        const currentPile = (s.accumulate && col >= 0 && col < cols) ? pile[col] : 0;
        const floorY = height - currentPile;

        if (flake.y >= floorY - 1) {
          if (s.accumulate && col >= 0 && col < cols) {
            pile[col] = Math.min(cap, pile[col] + 0.35);
            if (col > 0) pile[col - 1] = Math.min(cap, pile[col - 1] + 0.15);
            if (col < cols - 1) pile[col + 1] = Math.min(cap, pile[col + 1] + 0.15);
          }
          flake.y = -5;
          flake.x = Math.random() * width;
        }

        const twinkle = 0.75 + 0.25 * Math.sin(now * 0.003 * flake.twinkleSpeed + flake.twinklePhase);
        const alpha = flake.alpha * twinkle * (s.opacity ?? 1);
        ctx.fillStyle = s.color || '#e0f2fe';
        ctx.globalAlpha = alpha;

        const fx = Math.floor(flake.x);
        const fy = Math.floor(flake.y);

        if (flake.size === 1) {
          ctx.fillRect(fx, fy, 1.5, 1.5);
        } else if (flake.size === 2) {
          ctx.fillRect(fx, fy, 2.5, 2.5);
        } else {
          // 3x3 pixel cross snowflake
          ctx.fillRect(fx, fy - 1, 1, 3);
          ctx.fillRect(fx - 1, fy, 3, 1);
        }
      }

      ctx.restore();

      if (!s.paused) {
        raf = requestAnimationFrame(frame);
      } else {
        last = 0;
      }
    };

    const wake = () => {
      if (!raf && visible && !document.hidden && !settingsRef.current.paused) {
        last = 0;
        raf = requestAnimationFrame(frame);
      }
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);

    const intersection = new IntersectionObserver(
      entries => {
        visible = entries.some(e => e.isIntersecting);
        if (visible) wake();
        else if (raf) {
          cancelAnimationFrame(raf);
          raf = 0;
        }
      },
      { threshold: 0.05 }
    );
    intersection.observe(canvas);

    resize();
    wake();

    return () => {
      if (raf) cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      intersection.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className={`pixel-snow-canvas ${className || ''}`} aria-hidden="true" />;
}

// ─── Full WebGL2 Bloom Engine (For large hero banners / profiles) ───
function PixelSnowWebGL({
  settings,
  onError,
  className
}: {
  settings: Settings;
  onError: () => void;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wakeRef = useRef<(() => void) | null>(null);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const gl = canvas.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false
    });
    if (!gl) {
      onError();
      return undefined;
    }

    const handleContextLost = (e: Event) => {
      e.preventDefault();
      onError();
    };
    canvas.addEventListener('webglcontextlost', handleContextLost, false);

    const programs = {
      flake: link(gl, FLAKE_VERTEX, FLAKE_FRAGMENT, ['aCorner', 'aFlake']),
      pile: link(gl, QUAD_VERTEX, PILE, ['aPosition']),
      down: link(gl, QUAD_VERTEX, DOWN, ['aPosition']),
      up: link(gl, QUAD_VERTEX, UP, ['aPosition']),
      composite: link(gl, QUAD_VERTEX, COMPOSITE, ['aPosition'])
    } as Record<string, Program>;
    if (Object.values(programs).some(entry => !entry)) {
      onError();
      return undefined;
    }

    const atlas = buildAtlas();
    const atlasTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, atlasTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, atlas.width, atlas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, atlas.data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    const quadBuffer = gl.createBuffer();
    const quadVao = gl.createVertexArray();
    gl.bindVertexArray(quadVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const cornerBuffer = gl.createBuffer();
    const instanceBuffer = gl.createBuffer();
    const flakeVao = gl.createVertexArray();
    gl.bindVertexArray(flakeVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, cornerBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(1, 1);
    gl.bindVertexArray(null);

    const createTarget = (filter: number): Target => {
      const target = { texture: gl.createTexture(), framebuffer: gl.createFramebuffer(), width: 0, height: 0 };
      gl.bindTexture(gl.TEXTURE_2D, target.texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return target;
    };
    const sizeTarget = (target: Target, width: number, height: number) => {
      if (target.width === width && target.height === height) return;
      target.width = width;
      target.height = height;
      gl.bindTexture(gl.TEXTURE_2D, target.texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      if (!target.framebuffer) return;
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, target.texture, 0);
    };

    const snow = createTarget(gl.NEAREST);
    const down = [createTarget(gl.LINEAR), createTarget(gl.LINEAR), createTarget(gl.LINEAR)];
    const up = [createTarget(gl.LINEAR), createTarget(gl.LINEAR)];
    const pileTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, pileTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    const instances = new Float32Array(MAX_FLAKES * 4);
    const view = { width: 0, height: 0, ratio: 1, pixel: 3, gridWidth: 0, gridHeight: 0 };
    const flakes: Flake[] = [];
    let pile = new Float32Array(0);
    let pileWidth = 0;
    const rng = seeded(1);
    const state = { time: 0, intro: 0, push: 0 };
    const pointer = { x: 0, y: 0, vx: 0, vy: 0, time: 0, inside: false };
    let raf = 0;
    let last = 0;
    let visible = true;
    const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const spawn = (flake: Flake, s: Settings, edge: boolean) => {
      const level = flake.level;
      flake.reveal = edge ? (s.intro && state.intro < 1 ? rng() : -1) : -1;
      flake.x = rng() * view.width;
      flake.y = edge ? (s.speed < 0 ? view.height + 10 + rng() * 20 : -10 - rng() * 20) : rng() * view.height;
      flake.vx = (rng() - 0.5) * 8;
      flake.vy = LEVEL_FALL[level] * (0.8 + rng() * 0.4);
      flake.phase = rng() * Math.PI * 2;
      flake.rate = 0.8 + rng() * 0.8;
      flake.sparkle = rng() * Math.PI * 2;
      flake.drift = 0.7 + rng() * 0.6;
      flake.alt = rng() > 0.5;
    };

    const populate = (s: Settings) => {
      const area = (view.width * view.height) / (1000 * 700);
      const target = clamp(Math.round(s.density * 180 * Math.max(0.4, area)), 0, MAX_FLAKES);
      while (flakes.length < target) {
        let level = 0;
        const roll = rng();
        let acc = 0;
        for (let i = 0; i < LEVEL_WEIGHTS.length; i++) {
          acc += LEVEL_WEIGHTS[i];
          if (roll <= acc) {
            level = i;
            break;
          }
        }
        const flake: Flake = {
          level,
          x: 0,
          y: 0,
          vx: 0,
          vy: 0,
          phase: 0,
          rate: 0,
          sparkle: 0,
          drift: 0,
          alt: false,
          reveal: -1,
          levelSize: level === 0 ? 1 : 2 + level
        };
        spawn(flake, s, false);
        flakes.push(flake);
      }
      if (flakes.length > target) flakes.length = target;
    };

    const simulate = (s: Settings, dt: number) => {
      const wind = s.wind * 85;
      const fall = s.speed;
      const sway = s.sway;
      const radius = 90;
      const pushing = state.push > 0.001;
      const settle = s.accumulate && pile.length > 0 && fall > 0;
      const margin = 20;
      for (const flake of flakes) {
        const level = flake.level;
        flake.phase += flake.rate * dt;
        const wave = Math.sin(flake.phase);
        const targetX = wind * (0.6 + level * 0.1) + wave * sway * (12 + level * 6) * flake.drift;
        const targetY = LEVEL_FALL[level] * fall * (0.85 + flake.drift * 0.2);
        const ease = 1 - Math.exp(-dt * 3.5);
        flake.vx += (targetX - flake.vx) * ease;
        flake.vy += (targetY - flake.vy) * ease;
        if (pushing) {
          const dx = flake.x - pointer.x;
          const dy = flake.y - pointer.y;
          const distance = Math.hypot(dx, dy);
          if (distance < radius && distance > 0.001) {
            const near = 1 - distance / radius;
            const repel = near * near * near * state.push * 1500 * dt;
            const carry = near * near * state.push * dt * 5;
            flake.vx += (dx / distance) * repel + pointer.vx * carry;
            flake.vy += (dy / distance) * repel + pointer.vy * carry;
          }
        }
        flake.x += flake.vx * dt;
        flake.y += flake.vy * dt;
        if (settle) {
          const column = Math.floor(flake.x / view.pixel);
          if (column >= 0 && column < pile.length) {
            const surface = view.height - pile[column] * view.pixel;
            if (flake.y >= surface && pile[column] > 0.5) {
              const reach = level;
              for (let k = -reach; k <= reach; k++) {
                const index = column + k;
                if (index >= 0 && index < pile.length)
                  pile[index] += (0.35 + level * 0.15) * (1 - Math.abs(k) / (reach + 1));
              }
              spawn(flake, s, true);
              flake.reveal = -1;
              continue;
            }
          }
        }
        if (fall >= 0 ? flake.y > view.height + margin : flake.y < -margin) {
          spawn(flake, s, true);
          flake.reveal = -1;
          if (fall < 0) flake.y = view.height + 10 + rng() * 30;
        }
        if (flake.x < -margin) flake.x += view.width + margin * 2;
        else if (flake.x > view.width + margin) flake.x -= view.width + margin * 2;
      }
    };

    const settlePile = (s: Settings, dt: number) => {
      if (!pile.length) return;
      const cap = Math.max(4, view.gridHeight * 0.08);
      if (s.accumulate && s.speed > 0) {
        const grow = (0.25 + s.density * 0.9) * dt * Math.min(1, s.speed);
        for (let i = 0; i < pile.length; i++) {
          const dune = 0.55 + 0.45 * Math.sin(i * 0.045 + Math.sin(i * 0.013) * 2.1) * Math.sin(i * 0.021 + 1.3);
          if (pile[i] < cap * dune) pile[i] += grow * (0.6 + 0.8 * dune);
        }
      }
      for (let pass = 0; pass < 2; pass++) {
        const forward = pass === 0;
        for (let k = 0; k < pile.length - 1; k++) {
          const i = forward ? k : pile.length - 2 - k;
          const difference = pile[i] - pile[i + 1];
          if (Math.abs(difference) > 1.2) {
            const move = (Math.abs(difference) - 1.2) * 0.5 * Math.sign(difference);
            pile[i] -= move;
            pile[i + 1] += move;
          }
        }
      }
      for (let i = 0; i < pile.length; i++) {
        const excess = Math.max(0, pile[i] - cap);
        const rate = s.accumulate && s.speed > 0 ? excess * 0.8 : 2 + pile[i] * 0.6;
        pile[i] = Math.max(0, pile[i] - rate * dt);
      }
    };

    const run = (entry: Program, target: Target | null, width: number, height: number) => {
      gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.framebuffer : null);
      gl.viewport(0, 0, width, height);
      gl.useProgram(entry.program);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const bindTexture = (entry: Program, name: string, unit: number, texture: WebGLTexture | null) => {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniform1i(entry.uniforms[name], unit);
    };

    const render = () => {
      const s = settingsRef.current;
      sizeTarget(snow, view.gridWidth, view.gridHeight);
      let count = 0;
      const sizes = SPRITES[VARIANTS[s.variant]].map(rows => rows.length);
      const sweep = state.intro * 1.75;
      for (const flake of flakes) {
        const level = flake.level;
        const depthLight = 1 - s.depth * (1 - LEVEL_LIGHT[level]);
        const spark = Math.pow(Math.max(0, Math.sin(state.time * 0.9 + flake.sparkle)), 60) * s.twinkle;
        const reveal =
          flake.reveal < 0 || state.intro >= 1
            ? 1
            : clamp((sweep - flake.y / view.height - flake.reveal * 0.25) / 0.35, 0, 1);
        if (reveal <= 0) continue;
        const slot = level >= 2 && flake.alt ? level + 3 : level;
        const o = count * 4;
        instances[o] = flake.x / view.pixel;
        instances[o + 1] = flake.y / view.pixel;
        instances[o + 2] = s.variant * SLOTS + slot;
        instances[o + 3] = Math.min(1, depthLight * (0.85 + spark * 0.6)) * reveal * reveal;
        count++;
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, snow.framebuffer);
      gl.viewport(0, 0, snow.width, snow.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      if (pile.length && pile.some(height => height > 0.4)) {
        gl.bindTexture(gl.TEXTURE_2D, pileTexture);
        if (pileWidth !== pile.length) {
          pileWidth = pile.length;
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.R32F, pileWidth, 1, 0, gl.RED, gl.FLOAT, pile);
        } else {
          gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, pileWidth, 1, gl.RED, gl.FLOAT, pile);
        }
        const pileProgram = programs.pile;
        gl.useProgram(pileProgram.program);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, pileTexture);
        gl.uniform1i(pileProgram.uniforms.uPile, 0);
        gl.uniform1f(pileProgram.uniforms.uTime, state.time);
        gl.uniform1f(pileProgram.uniforms.uLight, 1 - s.depth * 0.1);
        gl.bindVertexArray(quadVao);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
      if (count > 0) {
        const flake = programs.flake;
        gl.useProgram(flake.program);
        gl.uniform2f(flake.uniforms.uGrid, snow.width, snow.height);
        gl.uniform4f(flake.uniforms.uSizes, sizes[1], sizes[2], sizes[3], 0);
        gl.uniform1f(flake.uniforms.uLargest, sizes[4]);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, atlasTexture);
        gl.uniform1i(flake.uniforms.uAtlas, 0);
        gl.enable(gl.BLEND);
        gl.blendEquation(gl.MAX);
        gl.bindVertexArray(flakeVao);
        gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, instances.subarray(0, count * 4), gl.DYNAMIC_DRAW);
        gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, count);
        gl.blendEquation(gl.FUNC_ADD);
        gl.disable(gl.BLEND);
      }

      gl.bindVertexArray(quadVao);
      let source = snow;
      for (let level = 0; level < down.length; level++) {
        const target = down[level];
        sizeTarget(target, Math.max(1, Math.ceil(source.width / 2)), Math.max(1, Math.ceil(source.height / 2)));
        gl.useProgram(programs.down.program);
        gl.uniform2f(programs.down.uniforms.uTexel, 1 / source.width, 1 / source.height);
        gl.uniform2f(programs.down.uniforms.uTarget, target.width, target.height);
        bindTexture(programs.down, 'uSource', 0, source.texture);
        run(programs.down, target, target.width, target.height);
        source = target;
      }
      for (let level = up.length - 1; level >= 0; level--) {
        const from = level === up.length - 1 ? down[down.length - 1] : up[level + 1];
        const target = up[level];
        sizeTarget(target, down[level].width, down[level].height);
        gl.useProgram(programs.up.program);
        gl.uniform2f(programs.up.uniforms.uTexel, 1 / from.width, 1 / from.height);
        gl.uniform2f(programs.up.uniforms.uTarget, target.width, target.height);
        bindTexture(programs.up, 'uSource', 0, from.texture);
        bindTexture(programs.up, 'uBase', 1, down[level].texture);
        run(programs.up, target, target.width, target.height);
      }

      const composite = programs.composite;
      const c = composite.uniforms;
      gl.useProgram(composite.program);
      gl.uniform2f(c.uResolution, canvas.width, canvas.height);
      gl.uniform2f(c.uGrid, snow.width, snow.height);
      gl.uniform1f(c.uPixel, view.pixel * view.ratio);
      gl.uniform3fv(c.uColor, toRgb(s.color));
      gl.uniform1f(c.uBrightness, s.brightness);
      gl.uniform1f(c.uGlow, s.glow);
      gl.uniform1f(c.uFade, s.fade);
      gl.uniform1f(c.uOpacity, s.opacity);
      gl.uniform1f(c.uLightMode, s.lightMode ? 1 : 0);
      bindTexture(composite, 'uSnow', 0, snow.texture);
      bindTexture(composite, 'uGlowMap', 1, up[0].texture);
      run(composite, null, canvas.width, canvas.height);
    };

    const frame = (now: number) => {
      raf = 0;
      if (!visible || document.hidden) return;
      const s = settingsRef.current;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      const moving = !s.paused && !reduce;
      if (!s.intro || reduce) state.intro = 1;
      else if (state.intro < 1) state.intro = Math.min(1, state.intro + dt / INTRO_SECONDS);
      const goal = s.mouseInteraction && pointer.inside && !reduce ? 1 : 0;
      state.push += (goal - state.push) * (1 - Math.exp(-dt * (goal ? 6 : 3)));
      pointer.vx *= Math.exp(-dt * 6);
      pointer.vy *= Math.exp(-dt * 6);
      populate(s);
      if (moving) {
        state.time += dt;
        simulate(s, dt);
        settlePile(s, dt);
      }
      render();
      if (moving || Math.abs(goal - state.push) > 0.001) raf = requestAnimationFrame(frame);
      else last = 0;
    };

    const wake = () => {
      if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame);
    };

    const resize = () => {
      const s = settingsRef.current;
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(1, Math.round(rect.width));
      const height = Math.max(1, Math.round(rect.height));
      const isMobile =
        typeof window !== 'undefined' &&
        (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768);
      const defaultMaxDpr = isMobile ? 0.45 : 0.6;
      const ratio = Math.min(s.dpr || defaultMaxDpr, defaultMaxDpr);
      view.width = width;
      view.height = height;
      view.ratio = ratio;
      view.pixel = Math.max(1, Math.round(s.pixelSize * ratio)) / ratio;
      canvas.width = Math.max(1, Math.round(width * ratio));
      canvas.height = Math.max(1, Math.round(height * ratio));
      view.gridWidth = Math.max(1, Math.ceil(width / view.pixel));
      view.gridHeight = Math.max(1, Math.ceil(height / view.pixel));
      if (pile.length !== view.gridWidth) {
        pile = new Float32Array(view.gridWidth);
        if (s.accumulate) {
          const cap = Math.max(4, view.gridHeight * 0.08);
          for (let i = 0; i < pile.length; i++) {
            const dune = 0.55 + 0.45 * Math.sin(i * 0.045 + Math.sin(i * 0.013) * 2.1) * Math.sin(i * 0.021 + 1.3);
            pile[i] = cap * dune * 0.65;
          }
        }
      }
      populate(s);
      render();
      wake();
    };

    const onPointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const now = performance.now();
      if (pointer.inside && pointer.time) {
        const elapsed = Math.max(1, now - pointer.time) / 1000;
        pointer.vx = clamp((x - pointer.x) / elapsed, -3000, 3000);
        pointer.vy = clamp((y - pointer.y) / elapsed, -3000, 3000);
      }
      pointer.x = x;
      pointer.y = y;
      pointer.time = now;
      pointer.inside = x >= 0 && y >= 0 && x <= rect.width && y <= rect.height;
      wake();
    };

    const onPointerLeave = () => {
      pointer.inside = false;
      wake();
    };

    const onVisibility = () => {
      last = 0;
      wake();
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    const intersection = new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting);
      if (visible) {
        last = 0;
        wake();
      } else if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    }, { threshold: 0.05 });
    intersection.observe(canvas);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onPointerLeave);
    document.addEventListener('visibilitychange', onVisibility);
    resize();

    let lastPixel = settingsRef.current.pixelSize;
    let lastDpr = settingsRef.current.dpr;
    wakeRef.current = () => {
      const s = settingsRef.current;
      if (s.pixelSize !== lastPixel || s.dpr !== lastDpr) {
        lastPixel = s.pixelSize;
        lastDpr = s.dpr;
        resize();
        return;
      }
      populate(s);
      if (!raf) render();
      wake();
    };

    return () => {
      cancelAnimationFrame(raf);
      raf = 0;
      wakeRef.current = null;
      resizeObserver.disconnect();
      intersection.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      document.documentElement.removeEventListener('pointerleave', onPointerLeave);
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      for (const target of [snow, ...down, ...up]) {
        gl.deleteTexture(target.texture);
        gl.deleteFramebuffer(target.framebuffer);
      }
      for (const entry of Object.values(programs)) gl.deleteProgram(entry.program);
      gl.deleteTexture(atlasTexture);
      gl.deleteTexture(pileTexture);
      gl.deleteBuffer(quadBuffer);
      gl.deleteBuffer(cornerBuffer);
      gl.deleteBuffer(instanceBuffer);
      gl.deleteVertexArray(quadVao);
      gl.deleteVertexArray(flakeVao);
    };
  }, []);

  useEffect(() => {
    wakeRef.current?.();
  });

  return <canvas ref={canvasRef} className={`pixel-snow-canvas ${className || ''}`} aria-hidden="true" />;
}

// ─── Main PixelSnow Component ───────────────────────────────────────────────
export default function PixelSnow({
  color = '#ffffff',
  variant = 'snowflake',
  density = 0.5,
  speed = 1,
  wind = 0.25,
  sway = 0.5,
  flakeSize = 1,
  pixelSize = 3,
  depth = 0.6,
  brightness = 1,
  glow = 0.8,
  twinkle = 0.35,
  accumulate = false,
  mouseInteraction = true,
  intro = true,
  fade = 0,
  opacity = 1,
  lightMode = false,
  paused = false,
  dpr,
  engine = 'auto',
  className = '',
  ...rest
}: PixelSnowProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const isMobile =
    typeof window !== 'undefined' &&
    (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768);

  const [activeEngine, setActiveEngine] = useState<'2d' | 'webgl'>(() => {
    if (engine === '2d') return '2d';
    if (engine === 'webgl') return 'webgl';
    return isMobile ? '2d' : 'webgl';
  });

  const settings: Settings = {
    color: String(color),
    variant: Math.max(0, VARIANTS.indexOf(variant)),
    density: clamp(density, 0, 1),
    speed,
    wind: clamp(wind, -2, 2),
    sway: Math.max(0, sway),
    flakeSize: clamp(flakeSize, 0, 2),
    pixelSize: Math.round(clamp(pixelSize, 1, 12)),
    depth: clamp(depth, 0, 1),
    brightness: Math.max(0, brightness),
    glow: Math.max(0, glow),
    twinkle: clamp(twinkle, 0, 1),
    accumulate,
    mouseInteraction,
    intro,
    fade: clamp(fade, 0, 1),
    opacity: clamp(opacity, 0, 1),
    lightMode,
    paused,
    dpr
  };

  return (
    <div ref={containerRef} className={`pixel-snow-container${className ? ` ${className}` : ''}`} {...rest}>
      {activeEngine === '2d' ? (
        <PixelSnow2D settings={settings} />
      ) : (
        <PixelSnowWebGL settings={settings} onError={() => setActiveEngine('2d')} />
      )}
    </div>
  );
}
