"use client";

import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import MatrixRain from "@/components/MatrixRain";
import type { Setting, SettingTheme } from "@/types";

// ─────────────────────────────────────────────────────────────────────────────
// Effect-specific archetype detection
// Priority-ordered so rare/specific genres win over generic ones.
// Checks genres[] directly rather than the full description corpus, which
// prevents e.g. "Science Fiction" in Fallout firing 'scifi' before 'postapoc'.
// ─────────────────────────────────────────────────────────────────────────────

function detectEffectArchetype(setting: Setting): string {
    const genres = (setting.genres ?? []).map(g => g.toLowerCase());
    const name   = setting.name.toLowerCase();

    const hasGenre = (...terms: string[]) =>
        terms.some(t => genres.some(g => g.includes(t)));

    // ── Name-based overrides — for well-known IPs whose genre tags may be
    //    ambiguous or stored differently across DB entries ───────────────────

    // Scifi / Space
    if (name.includes('star wars') || name.includes('star trek') ||
        name.includes('halo') || name.includes('mass effect') ||
        name.includes('no man') || name.includes('guardians of the galaxy') ||
        name.includes('interstellar') || name.includes('dune') ||
        name.includes('battlestar') || name.includes('doctor who') ||
        name.includes('dr who') || name.includes('dr. who'))              return 'scifi';

    // Post-apocalyptic
    if (name.includes('fallout') || name.includes('last of us') ||
        name.includes('walking dead') || name.includes('mad max') ||
        name.includes('metro 20'))                                        return 'postapoc';

    // Nautical / Pirate
    if (name.includes('pirates of the caribbean') ||
        (name.includes('assassin') && name.includes('black flag')) ||
        name.includes('sea of thieves') || name.includes('black sails'))  return 'nautical';

    // Western
    if (name.includes('red dead') || name.includes('tombstone') ||
        name.includes('westworld'))                                       return 'western';

    // Anime / Isekai — override before scifi so SAO-style VR isekai don't get planets
    if (name.includes('sword art online') || name.includes('sword art') ||
        name.includes('sao') || name.includes('isekai') ||
        name.includes('no game no life') || name.includes('overlord') ||
        name.includes('log horizon'))                                     return 'fantasy';

    // Horror
    if (name.includes('resident evil') || name.includes('silent hill') ||
        name.includes('alien') || name.includes('five nights') ||
        name.includes('outlast'))                                         return 'horror';

    // Fantasy
    if (name.includes('world of warcraft') || name.includes('wow') ||
        name.includes('game of thrones') || name.includes('lord of the rings') ||
        name.includes('the hobbit') || name.includes('dungeons & dragons') ||
        name.includes('elder scrolls') || name.includes('skyrim') ||
        name.includes('witcher') || name.includes('dragon age'))          return 'fantasy';

    // Mystery / Noir
    if (name.includes('L.A. noire') || name.includes('la noire') ||
        name.includes('disco elysium') || name.includes('sherlock'))      return 'mystery';

    // Genre checks — specific/rare archetypes first to avoid false positives
    if (hasGenre('western', 'cowboy', 'frontier', 'wild west'))           return 'western';
    if (hasGenre('steampunk', 'clockwork', 'airship'))                    return 'steampunk';
    if (hasGenre('pirate', 'nautical', 'maritime', 'swashbuckling',
                 'ocean', 'sea voyage'))                                  return 'nautical';
    if (hasGenre('noir', 'detective', 'mystery', 'crime', 'thriller',
                 'spy', 'espionage', 'investigation'))                    return 'mystery';
    if (hasGenre('post-apocalyptic', 'apocalyptic', 'wasteland'))         return 'postapoc';
    if (hasGenre('horror', 'gothic', 'lovecraftian', 'psychological horror',
                 'survival horror'))                                      return 'horror';
    if (hasGenre('jungle', 'exploration', 'expedition', 'wilderness'))    return 'adventure';
    // Scifi before fantasy — e.g. Warhammer 40K has both 'Dark Fantasy' and
    // 'Science Fiction'; starfield fits better than fireflies there.
    if (hasGenre('science fiction', 'sci-fi', 'cyberpunk', 'space opera',
                 'space', 'futuristic', 'military sci-fi'))               return 'scifi';
    if (hasGenre('fantasy', 'dark fantasy', 'high fantasy', 'epic fantasy',
                 'medieval fantasy', 'anime', 'mythic', 'fairy tale'))    return 'fantasy';

    return 'default';
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Parse a CSS colour string to [r,g,b] best-effort — falls back to white */
function hexToRgb(hex: string): [number, number, number] {
    const m = hex.replace('#', '').match(/.{2}/g);
    if (m && m.length >= 3) return [parseInt(m[0], 16), parseInt(m[1], 16), parseInt(m[2], 16)];
    return [255, 255, 255];
}

/** Canvas used by every effect */
function EffectCanvas({ canvasRef, opacity = 0.3 }: {
    canvasRef: RefObject<HTMLCanvasElement | null>;
    opacity?: number;
}) {
    return (
        <canvas
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ref={canvasRef as any}
            className="pointer-events-none absolute inset-0 h-full w-full"
            style={{ opacity, zIndex: 0 }}
            aria-hidden
        />
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Fantasy — Dragons + Fireflies
// ─────────────────────────────────────────────────────────────────────────────

function DragonEffect({ accent, accentStrong }: { accent: string; accentStrong: string }) {
    const ref = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = ref.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animId: number;
        const rnd = (a: number, b: number) => a + Math.random() * (b - a);

        // ── Fireflies ────────────────────────────────────────────────────────
        interface Firefly { x: number; y: number; r: number; alpha: number; phase: number; speed: number; vx: number; vy: number; }
        let fireflies: Firefly[] = [];

        // ── Dragons ──────────────────────────────────────────────────────────
        interface Dragon {
            x: number; y: number;
            speed: number; dir: 1 | -1;
            wingPhase: number; wingSpeed: number;
            size: number; alpha: number;
            active: boolean; wait: number;
        }

        const makeDragon = (W: number, H: number, initialWait = 0): Dragon => {
            const dir = Math.random() < 0.5 ? 1 : -1 as 1 | -1;
            const size = rnd(3, 8);  // tiny — distant silhouette
            return {
                x:    dir === 1 ? -40 : W + 40,
                y:    rnd(H * 0.05, H * 0.30),  // upper sky only
                speed: rnd(0.35, 0.95) * dir,
                dir,
                wingPhase: Math.random() * Math.PI * 2,
                wingSpeed: rnd(0.07, 0.14),  // wing-flap rate
                size, alpha: 0,
                active: initialWait === 0,
                wait:  initialWait,
            };
        };

        let dragons: Dragon[] = [];

        const init = () => {
            canvas.width  = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            const W = canvas.width, H = canvas.height;

            fireflies = Array.from({ length: 55 }, () => ({
                x: rnd(0, W), y: rnd(0, H),
                r: rnd(1.2, 3.2),
                alpha: rnd(0.3, 0.8),
                phase: Math.random() * Math.PI * 2,
                speed: rnd(0.003, 0.012),
                vx: rnd(-0.22, 0.22), vy: rnd(-0.18, 0.18),
            }));

            // Seed 3 dragon "slots" with staggered wait times
            dragons = [
                makeDragon(W, H, Math.floor(rnd(60,  240))),
                makeDragon(W, H, Math.floor(rnd(300, 600))),
                makeDragon(W, H, Math.floor(rnd(500, 900))),
            ];
        };

        init();
        const ro = new ResizeObserver(init);
        ro.observe(canvas);

        // ── Draw one dragon — pure silhouette, tiny, distant ─────────────────
        const drawDragon = (d: Dragon) => {
            const s = d.size;
            const w = Math.sin(d.wingPhase);  // -1 .. 1  (wing beat)

            ctx.save();
            ctx.globalAlpha = d.alpha;
            ctx.translate(d.x, d.y);
            if (d.dir === -1) ctx.scale(-1, 1);
            ctx.fillStyle = 'rgba(20,12,4,0.92)';

            // Tiny body — just a small oval
            ctx.beginPath();
            ctx.ellipse(0, 0, s * 1.6, s * 0.32, 0, 0, Math.PI * 2);
            ctx.fill();

            // Left wing — single curved triangle that flaps
            const wingLift = w * s * 1.1;   // vertical travel of wingtip
            ctx.beginPath();
            ctx.moveTo(-s * 0.3, -s * 0.1);
            ctx.quadraticCurveTo(-s * 1.1, -s * 0.5 + wingLift, -s * 2.0, wingLift * 0.6);
            ctx.quadraticCurveTo(-s * 1.0, s * 0.18, -s * 0.2, s * 0.1);
            ctx.closePath();
            ctx.fill();

            // Right wing (mirrored)
            ctx.beginPath();
            ctx.moveTo(s * 0.3, -s * 0.1);
            ctx.quadraticCurveTo(s * 1.1, -s * 0.5 + wingLift, s * 2.0, wingLift * 0.6);
            ctx.quadraticCurveTo(s * 1.0, s * 0.18, s * 0.2, s * 0.1);
            ctx.closePath();
            ctx.fill();

            // Head nub
            ctx.beginPath();
            ctx.ellipse(s * 1.55, -s * 0.12, s * 0.28, s * 0.18, -0.3, 0, Math.PI * 2);
            ctx.fill();

            // Tail
            ctx.beginPath();
            ctx.moveTo(-s * 1.5, 0);
            ctx.quadraticCurveTo(-s * 2.4, s * 0.35, -s * 3.0, s * 0.1);
            ctx.lineWidth = s * 0.18;
            ctx.strokeStyle = 'rgba(20,12,4,0.88)';
            ctx.lineCap = 'round';
            ctx.stroke();

            ctx.restore();
        };

        const tick = () => {
            animId = requestAnimationFrame(tick);
            t++;

            const W = canvas.width, H = canvas.height;
            ctx.clearRect(0, 0, W, H);

            // ── Fireflies ────────────────────────────────────────────────────
            for (const f of fireflies) {
                f.phase += f.speed;
                f.x += f.vx; f.y += f.vy;
                if (f.x < -8) f.x = W + 8;
                if (f.x > W + 8) f.x = -8;
                if (f.y < -8) f.y = H + 8;
                if (f.y > H + 8) f.y = -8;
                const a = f.alpha * (0.45 + 0.55 * Math.sin(f.phase));
                const [r1, g1, b1] = hexToRgb(accentStrong);
                const [r2, g2, b2] = hexToRgb(accent);
                const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r * 2.8);
                g.addColorStop(0,   `rgba(${r1},${g1},${b1},${a})`);
                g.addColorStop(0.45,`rgba(${r2},${g2},${b2},${a * 0.5})`);
                g.addColorStop(1,   'transparent');
                ctx.beginPath();
                ctx.arc(f.x, f.y, f.r * 2.8, 0, Math.PI * 2);
                ctx.fillStyle = g;
                ctx.fill();
            }

            // ── Dragons ──────────────────────────────────────────────────────
            for (let i = 0; i < dragons.length; i++) {
                const d = dragons[i];

                if (!d.active) {
                    d.wait--;
                    if (d.wait <= 0) d.active = true;
                    continue;
                }

                // Advance
                d.x += d.speed;
                d.wingPhase += d.wingSpeed;
                d.alpha = Math.min(0.75, d.alpha + 0.015);  // fade in

                drawDragon(d);

                // Recycle when off screen
                const offEdge = d.dir === 1 ? d.x > W + 50 : d.x < -50;
                if (offEdge) {
                    dragons[i] = makeDragon(W, H, Math.floor(rnd(480, 1200)));
                }
            }
        };

        tick();
        return () => { cancelAnimationFrame(animId); ro.disconnect(); };
    }, [accent, accentStrong]);

    return <EffectCanvas canvasRef={ref} opacity={0.65} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Fantasy — Fireflies (standalone, kept for direct use if needed)
// ─────────────────────────────────────────────────────────────────────────────

function _FirefliesEffect({ accent, accentStrong }: { accent: string; accentStrong: string }) {
    const ref = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = ref.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animId: number;
        let frame = 0;

        interface Fly { x: number; y: number; vx: number; vy: number; r: number; phase: number; ps: number; }
        let flies: Fly[] = [];

        const init = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            flies = Array.from({ length: 18 }, () => ({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.35,
                vy: (Math.random() - 0.5) * 0.25,
                r: 2 + Math.random() * 3,
                phase: Math.random() * Math.PI * 2,
                ps: 0.018 + Math.random() * 0.025,
            }));
        };

        init();
        const ro = new ResizeObserver(init);
        ro.observe(canvas);

        const tick = () => {
            animId = requestAnimationFrame(tick);
            if (++frame % 2 !== 0) return;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (const f of flies) {
                f.phase += f.ps;
                f.x += f.vx + Math.sin(f.phase * 0.7) * 0.3;
                f.y += f.vy + Math.cos(f.phase * 0.5) * 0.2;
                if (f.x < -10) f.x = canvas.width + 10;
                if (f.x > canvas.width + 10) f.x = -10;
                if (f.y < -10) f.y = canvas.height + 10;
                if (f.y > canvas.height + 10) f.y = -10;

                const bright = (Math.sin(f.phase) + 1) / 2;
                ctx.save();
                ctx.globalAlpha = 0.25 + bright * 0.75;
                ctx.shadowBlur = 6 + bright * 14;
                ctx.shadowColor = accentStrong;
                ctx.fillStyle = bright > 0.5 ? accentStrong : accent;
                ctx.beginPath();
                ctx.arc(f.x, f.y, f.r * (0.55 + bright * 0.45), 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        };

        tick();
        return () => { cancelAnimationFrame(animId); ro.disconnect(); };
    }, [accent, accentStrong]);

    return <EffectCanvas canvasRef={ref} opacity={0.55} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sci-Fi — Starfield + shooting stars
// ─────────────────────────────────────────────────────────────────────────────

function StarfieldEffect() {
    const ref = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = ref.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animId: number;
        let rotation = 0;   // shared planet surface scroll

        interface Star     { x: number; y: number; r: number; alpha: number; twinkle: number; ts: number; }
        interface Shooter  { x: number; y: number; vx: number; vy: number; len: number; alpha: number; }
        interface PlanetDef {
            // position as fraction of canvas size so they stay in corners
            fx: number; fy: number;
            r: number;
            base: string;                  // core fill colour
            bands: string[];               // band strip colours (top→bottom)
            rotSpeed: number;              // surface scroll speed multiplier
            atmosphere: string;            // glow colour
            hasRing: boolean;
            ringColor: string;
        }

        // ── Palette pool ─────────────────────────────────────────────────────
        type PlanetPalette = Pick<PlanetDef, 'base' | 'bands' | 'atmosphere' | 'ringColor'>;
        const PALETTES: PlanetPalette[] = [
            // Blue gas giant
            { base: '#111e36', ringColor: 'rgba(120,160,220,0.20)',
              bands: ['rgba(55,90,145,0.55)','rgba(95,130,185,0.35)','rgba(38,68,125,0.50)','rgba(78,115,170,0.30)','rgba(48,80,135,0.45)','rgba(105,140,195,0.25)'],
              atmosphere: 'rgba(80,145,255,0.18)' },
            // Rust desert
            { base: '#261004', ringColor: 'rgba(210,110,50,0.18)',
              bands: ['rgba(175,75,28,0.50)','rgba(135,50,18,0.38)','rgba(195,95,48,0.32)','rgba(155,65,28,0.42)','rgba(115,42,14,0.36)'],
              atmosphere: 'rgba(218,98,38,0.15)' },
            // Ice / aqua
            { base: '#081a28', ringColor: 'rgba(100,210,255,0.18)',
              bands: ['rgba(95,185,220,0.42)','rgba(55,148,192,0.32)','rgba(118,198,228,0.26)','rgba(75,165,208,0.36)'],
              atmosphere: 'rgba(105,215,255,0.17)' },
            // Deep purple nebula giant
            { base: '#150a22', ringColor: 'rgba(180,120,255,0.20)',
              bands: ['rgba(110,55,175,0.50)','rgba(80,35,140,0.38)','rgba(145,80,210,0.30)','rgba(95,50,158,0.44)','rgba(68,28,120,0.36)','rgba(160,100,220,0.22)'],
              atmosphere: 'rgba(160,80,255,0.18)' },
            // Emerald jungle world
            { base: '#081810', ringColor: 'rgba(80,220,120,0.18)',
              bands: ['rgba(40,150,70,0.48)','rgba(22,110,48,0.36)','rgba(60,175,88,0.30)','rgba(32,128,58,0.42)','rgba(18,90,38,0.36)'],
              atmosphere: 'rgba(60,200,90,0.16)' },
            // Golden / tan gas giant
            { base: '#1e1408', ringColor: 'rgba(220,185,80,0.22)',
              bands: ['rgba(195,150,55,0.48)','rgba(158,115,30,0.36)','rgba(215,170,75,0.28)','rgba(175,132,48,0.42)','rgba(140,100,22,0.38)','rgba(225,188,90,0.22)'],
              atmosphere: 'rgba(230,175,60,0.16)' },
            // Crimson magma world
            { base: '#1e0404', ringColor: 'rgba(255,80,40,0.18)',
              bands: ['rgba(200,40,20,0.50)','rgba(158,25,10,0.38)','rgba(225,70,38,0.28)','rgba(178,45,22,0.44)','rgba(140,18,8,0.36)'],
              atmosphere: 'rgba(255,55,20,0.16)' },
            // Teal ocean world
            { base: '#041618', ringColor: 'rgba(40,200,185,0.18)',
              bands: ['rgba(25,168,158,0.48)','rgba(12,130,120,0.36)','rgba(40,188,175,0.28)','rgba(20,148,138,0.42)','rgba(8,108,100,0.36)'],
              atmosphere: 'rgba(30,210,195,0.16)' },
            // Lavender ice moon
            { base: '#100e1c', ringColor: 'rgba(185,165,240,0.20)',
              bands: ['rgba(148,130,210,0.44)','rgba(112,95,175,0.32)','rgba(168,152,225,0.26)','rgba(130,112,192,0.38)'],
              atmosphere: 'rgba(180,160,255,0.17)' },
            // Amber storm giant
            { base: '#1c1000', ringColor: 'rgba(245,168,28,0.22)',
              bands: ['rgba(215,138,18,0.52)','rgba(175,105,8,0.38)','rgba(238,158,38,0.28)','rgba(195,120,14,0.46)','rgba(155,88,4,0.38)','rgba(248,172,48,0.22)'],
              atmosphere: 'rgba(245,155,18,0.17)' },
        ];

        // ── Placement slots (corner + edge anchors, as fractions) ────────────
        const SLOTS: [number, number][] = [
            [0.88, 0.10], // top-right
            [0.06, 0.10], // top-left
            [0.88, 0.85], // bottom-right
            [0.06, 0.85], // bottom-left
            [0.92, 0.48], // mid-right edge
            [0.04, 0.48], // mid-left edge
            [0.48, 0.06], // top-center
            [0.48, 0.90], // bottom-center
        ];

        const rnd     = (min: number, max: number) => min + Math.random() * (max - min);
        const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

        // Generate planet set once on mount — consistent per page load
        const count = 2 + Math.floor(Math.random() * 3);  // 2, 3, or 4 planets
        const chosenSlots   = shuffle(SLOTS).slice(0, count);
        const chosenPalettes = shuffle(PALETTES).slice(0, count);

        const GENERATED_PLANETS: PlanetDef[] = chosenSlots.map(([bfx, bfy], i) => {
            const pal  = chosenPalettes[i];
            const r    = rnd(12, 44);
            const isLarge = r > 28;
            return {
                // add small per-planet jitter so exact slot positions vary
                fx: bfx + rnd(-0.03, 0.03),
                fy: bfy + rnd(-0.03, 0.03),
                r,
                base: pal.base,
                bands: pal.bands,
                atmosphere: pal.atmosphere,
                rotSpeed: rnd(0.4, 1.2),
                hasRing:  isLarge && Math.random() < 0.55,
                ringColor: pal.ringColor,
            };
        });
        // ─────────────────────────────────────────────────────────────────────

        let stars: Star[] = [];
        let shooter: Shooter | null = null;
        const planets: PlanetDef[] = GENERATED_PLANETS;

        const init = () => {
            canvas.width  = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            stars = Array.from({ length: 130 }, () => ({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                r: 0.4 + Math.random() * 1.4,
                alpha: 0.4 + Math.random() * 0.6,
                twinkle: Math.random() * Math.PI * 2,
                ts: 0.005 + Math.random() * 0.015,
            }));
            // planets are kept stable across resize — positions are fractional
        };

        init();
        const ro = new ResizeObserver(init);
        ro.observe(canvas);

        // ── Draw a single planet ──────────────────────────────────────────────
        const drawPlanet = (p: PlanetDef) => {
            const W = canvas.width;
            const H = canvas.height;
            const cx = p.fx * W;
            const cy = p.fy * H;
            const r  = p.r;

            // Ring — back half (drawn behind planet)
            if (p.hasRing) {
                ctx.save();
                ctx.globalAlpha = 0.55;
                ctx.strokeStyle = p.ringColor;
                ctx.lineWidth   = r * 0.28;
                ctx.beginPath();
                ctx.ellipse(cx, cy + r * 0.15, r * 1.75, r * 0.38, -0.18, Math.PI, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }

            // Planet base
            ctx.save();
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fillStyle = p.base;
            ctx.fill();

            // Surface bands — clip to circle, scroll by rotation
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.clip();

            const bandH = (r * 2) / p.bands.length;
            const scroll = (rotation * p.rotSpeed * r * 2) % (r * 2);

            for (let i = 0; i < p.bands.length; i++) {
                const by = cy - r + i * bandH;
                ctx.fillStyle = p.bands[i];
                // Draw twice side by side to create seamless wrap
                ctx.fillRect(cx - r + scroll,           by, r * 2, bandH + 1);
                ctx.fillRect(cx - r + scroll - r * 2,   by, r * 2, bandH + 1);
                ctx.fillRect(cx - r + scroll + r * 2,   by, r * 2, bandH + 1);
            }
            ctx.restore();

            // Atmosphere glow (outside clip)
            ctx.save();
            const atmoGrad = ctx.createRadialGradient(cx, cy, r * 0.78, cx, cy, r * 1.22);
            atmoGrad.addColorStop(0, p.atmosphere);
            atmoGrad.addColorStop(1, 'transparent');
            ctx.fillStyle = atmoGrad;
            ctx.beginPath();
            ctx.arc(cx, cy, r * 1.22, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // Terminator shadow (right-to-left dark crescent = subtle 3D lighting)
            ctx.save();
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.clip();
            const shadowGrad = ctx.createRadialGradient(cx + r * 0.45, cy, 0, cx + r * 0.45, cy, r * 1.4);
            shadowGrad.addColorStop(0,   'transparent');
            shadowGrad.addColorStop(0.6, 'transparent');
            shadowGrad.addColorStop(1,   'rgba(0,0,0,0.65)');
            ctx.fillStyle = shadowGrad;
            ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
            ctx.restore();

            // Specular highlight (top-left bright spot)
            ctx.save();
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.clip();
            const specGrad = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.38, 0, cx - r * 0.35, cy - r * 0.38, r * 0.7);
            specGrad.addColorStop(0,   'rgba(255,255,255,0.12)');
            specGrad.addColorStop(1,   'transparent');
            ctx.fillStyle = specGrad;
            ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
            ctx.restore();

            // Ring — front half (drawn over planet)
            if (p.hasRing) {
                ctx.save();
                ctx.globalAlpha = 0.55;
                ctx.strokeStyle = p.ringColor;
                ctx.lineWidth   = r * 0.28;
                ctx.beginPath();
                ctx.ellipse(cx, cy + r * 0.15, r * 1.75, r * 0.38, -0.18, 0, Math.PI);
                ctx.stroke();
                ctx.restore();
            }
        };

        const tick = () => {
            animId = requestAnimationFrame(tick);
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            rotation += 0.0004;   // very slow surface scroll

            // Stars
            for (const s of stars) {
                s.twinkle += s.ts;
                const a = s.alpha * (0.6 + 0.4 * Math.sin(s.twinkle));
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(200,220,255,${a})`;
                ctx.fill();
            }

            // Planets
            for (const p of planets) drawPlanet(p);

            // Shooting star
            if (!shooter && Math.random() < 0.003) {
                shooter = {
                    x: Math.random() * canvas.width * 0.6,
                    y: Math.random() * canvas.height * 0.4,
                    vx: 4 + Math.random() * 4,
                    vy: 2 + Math.random() * 3,
                    len: 80 + Math.random() * 80,
                    alpha: 1,
                };
            }

            if (shooter) {
                ctx.save();
                ctx.globalAlpha = shooter.alpha * 0.8;
                const grad = ctx.createLinearGradient(
                    shooter.x - shooter.vx * 10, shooter.y - shooter.vy * 10,
                    shooter.x, shooter.y
                );
                grad.addColorStop(0, "transparent");
                grad.addColorStop(1, "rgba(200,230,255,0.9)");
                ctx.strokeStyle = grad;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.moveTo(shooter.x - shooter.vx * (shooter.len / 10), shooter.y - shooter.vy * (shooter.len / 10));
                ctx.lineTo(shooter.x, shooter.y);
                ctx.stroke();
                ctx.restore();
                shooter.x    += shooter.vx;
                shooter.y    += shooter.vy;
                shooter.alpha -= 0.018;
                if (shooter.alpha <= 0 || shooter.x > canvas.width || shooter.y > canvas.height) shooter = null;
            }
        };

        tick();
        return () => { cancelAnimationFrame(animId); ro.disconnect(); };
    }, []);

    return <EffectCanvas canvasRef={ref} opacity={0.55} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Horror — Falling embers / ash with edge vignette pulse
// ─────────────────────────────────────────────────────────────────────────────

function EmberEffect({ accent }: { accent: string }) {
    const ref = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = ref.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const [r, g, b] = hexToRgb(accent);
        let animId: number;
        let frame = 0;
        let vigPhase = 0;

        interface Ember { x: number; y: number; vy: number; vx: number; size: number; alpha: number; glows: boolean; phase: number; }
        let embers: Ember[] = [];

        const init = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            embers = Array.from({ length: 45 }, () => ({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vy: 0.4 + Math.random() * 0.8,
                vx: (Math.random() - 0.5) * 0.5,
                size: 1 + Math.random() * 2.5,
                alpha: 0.3 + Math.random() * 0.5,
                glows: Math.random() < 0.2,
                phase: Math.random() * Math.PI * 2,
            }));
        };

        init();
        const ro = new ResizeObserver(init);
        ro.observe(canvas);

        const tick = () => {
            animId = requestAnimationFrame(tick);
            if (++frame % 2 !== 0) return;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Subtle vignette pulse on edges
            vigPhase += 0.008;
            const vigAlpha = 0.04 + 0.03 * Math.sin(vigPhase);
            const vgrad = ctx.createRadialGradient(
                canvas.width / 2, canvas.height / 2, canvas.height * 0.3,
                canvas.width / 2, canvas.height / 2, canvas.height * 0.9
            );
            vgrad.addColorStop(0, "transparent");
            vgrad.addColorStop(1, `rgba(${r},${g},${b},${vigAlpha})`);
            ctx.fillStyle = vgrad;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            for (const e of embers) {
                e.phase += 0.04;
                e.y += e.vy;
                e.x += e.vx + Math.sin(e.phase) * 0.3;
                if (e.y > canvas.height + 5) { e.y = -5; e.x = Math.random() * canvas.width; }
                if (e.x < 0) e.x = canvas.width;
                if (e.x > canvas.width) e.x = 0;

                ctx.save();
                ctx.globalAlpha = e.alpha;
                if (e.glows) {
                    ctx.shadowBlur = 6;
                    ctx.shadowColor = `rgba(${r},${g},${b},0.8)`;
                }
                ctx.fillStyle = e.glows ? `rgba(${r},${g},${b},0.9)` : `rgba(80,40,40,0.7)`;
                ctx.beginPath();
                ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        };

        tick();
        return () => { cancelAnimationFrame(animId); ro.disconnect(); };
    }, [accent]);

    return <EffectCanvas canvasRef={ref} opacity={0.35} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Post-Apocalyptic — Drifting ash
// ─────────────────────────────────────────────────────────────────────────────

function AshEffect() {
    const ref = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = ref.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animId: number;
        let frame = 0;

        interface Flake { x: number; y: number; vy: number; vx: number; size: number; alpha: number; phase: number; }
        let flakes: Flake[] = [];

        const init = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            flakes = Array.from({ length: 55 }, () => ({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vy: 0.3 + Math.random() * 0.6,
                vx: (Math.random() - 0.5) * 0.4,
                size: 1 + Math.random() * 3,
                alpha: 0.2 + Math.random() * 0.5,
                phase: Math.random() * Math.PI * 2,
            }));
        };

        init();
        const ro = new ResizeObserver(init);
        ro.observe(canvas);

        const tick = () => {
            animId = requestAnimationFrame(tick);
            if (++frame % 2 !== 0) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (const f of flakes) {
                f.phase += 0.025;
                f.y += f.vy;
                f.x += f.vx + Math.sin(f.phase) * 0.4;
                if (f.y > canvas.height + 5) { f.y = -5; f.x = Math.random() * canvas.width; }
                if (f.x < 0) f.x = canvas.width;
                if (f.x > canvas.width) f.x = 0;

                const shade = 100 + Math.floor(Math.random() * 50);
                ctx.globalAlpha = f.alpha;
                ctx.fillStyle = `rgb(${shade},${shade - 10},${shade - 20})`;
                ctx.beginPath();
                ctx.ellipse(f.x, f.y, f.size, f.size * 0.6, f.phase, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        };

        tick();
        return () => { cancelAnimationFrame(animId); ro.disconnect(); };
    }, []);

    return <EffectCanvas canvasRef={ref} opacity={0.28} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Nautical — Diagonal rain
// ─────────────────────────────────────────────────────────────────────────────

function RainEffect() {
    const ref = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = ref.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animId: number;

        interface Drop { x: number; y: number; len: number; speed: number; alpha: number; w: number; }
        let drops: Drop[] = [];

        const init = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            drops = Array.from({ length: 160 }, () => ({
                x:     Math.random() * (canvas.width + 300) - 150,
                y:     Math.random() * canvas.height,
                len:   14 + Math.random() * 30,
                speed: 8 + Math.random() * 12,
                alpha: 0.25 + Math.random() * 0.55,
                w:     0.6 + Math.random() * 1.2,
            }));
        };

        init();
        const ro = new ResizeObserver(init);
        ro.observe(canvas);

        const tick = () => {
            animId = requestAnimationFrame(tick);
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (const d of drops) {
                d.x += d.speed * 0.28;
                d.y += d.speed;
                if (d.y > canvas.height + 20 || d.x > canvas.width + 80) {
                    d.x = Math.random() * canvas.width - 150;
                    d.y = -20;
                }
                ctx.globalAlpha = d.alpha;
                ctx.strokeStyle = 'rgba(170,210,230,1)';
                ctx.lineWidth   = d.w;
                ctx.beginPath();
                ctx.moveTo(d.x, d.y);
                ctx.lineTo(d.x + d.len * 0.28, d.y + d.len);
                ctx.stroke();
            }
            ctx.globalAlpha = 1;
        };

        tick();
        return () => { cancelAnimationFrame(animId); ro.disconnect(); };
    }, []);

    return <EffectCanvas canvasRef={ref} opacity={0.55} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Mystery / Noir — Drifting smoke wisps
// ─────────────────────────────────────────────────────────────────────────────

function SmokeEffect() {
    const ref = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = ref.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animId: number;
        let frame = 0;

        interface Wisp { x: number; y: number; baseX: number; phase: number; ps: number; alpha: number; r: number; ry: number; }
        let wisps: Wisp[] = [];

        const init = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            wisps = Array.from({ length: 6 }, (_, i) => ({
                x: (canvas.width / 7) * (i + 1),
                y: canvas.height + Math.random() * 40,
                baseX: (canvas.width / 7) * (i + 1),
                phase: Math.random() * Math.PI * 2,
                ps: 0.008 + Math.random() * 0.01,
                alpha: 0.06 + Math.random() * 0.1,
                r: 18 + Math.random() * 28,
                ry: 24 + Math.random() * 20,
            }));
        };

        init();
        const ro = new ResizeObserver(init);
        ro.observe(canvas);

        const tick = () => {
            animId = requestAnimationFrame(tick);
            if (++frame % 3 !== 0) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (const w of wisps) {
                w.phase += w.ps;
                w.y -= 0.35;
                w.x = w.baseX + Math.sin(w.phase) * 22;
                w.alpha -= 0.00015;
                w.r += 0.06;

                if (w.y < -w.ry * 2 || w.alpha <= 0) {
                    w.y = canvas.height + Math.random() * 40;
                    w.alpha = 0.07 + Math.random() * 0.09;
                    w.r = 18 + Math.random() * 28;
                    w.phase = Math.random() * Math.PI * 2;
                }

                ctx.save();
                ctx.globalAlpha = w.alpha;
                const grad = ctx.createRadialGradient(w.x, w.y, 0, w.x, w.y, w.r);
                grad.addColorStop(0, "rgba(200,200,210,0.7)");
                grad.addColorStop(1, "transparent");
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.ellipse(w.x, w.y, w.r, w.ry, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        };

        tick();
        return () => { cancelAnimationFrame(animId); ro.disconnect(); };
    }, []);

    return <EffectCanvas canvasRef={ref} opacity={0.4} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Western — Drifting dust particles
// ─────────────────────────────────────────────────────────────────────────────

function DustEffect({ accent }: { accent: string }) {
    const ref = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = ref.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const [r, g, b] = hexToRgb(accent);
        let animId: number;
        let frame = 0;
        let gustTimer = 0;
        let gustStrength = 0;

        interface Mote { x: number; y: number; vx: number; vy: number; size: number; alpha: number; }
        let motes: Mote[] = [];

        const init = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            motes = Array.from({ length: 65 }, () => ({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: 0.2 + Math.random() * 0.7,
                vy: (Math.random() - 0.5) * 0.3,
                size: 0.8 + Math.random() * 2.2,
                alpha: 0.15 + Math.random() * 0.4,
            }));
        };

        init();
        const ro = new ResizeObserver(init);
        ro.observe(canvas);

        const tick = () => {
            animId = requestAnimationFrame(tick);
            if (++frame % 2 !== 0) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            gustTimer--;
            if (gustTimer <= 0) { gustTimer = 120 + Math.random() * 200; gustStrength = Math.random() < 0.3 ? 1.8 : 0; }
            if (gustStrength > 0) gustStrength = Math.max(0, gustStrength - 0.015);

            for (const m of motes) {
                m.x += m.vx + gustStrength * (0.5 + Math.random() * 1.5);
                m.y += m.vy;
                if (m.x > canvas.width + 5) { m.x = -5; m.y = Math.random() * canvas.height; }
                if (m.y < 0) m.y = canvas.height;
                if (m.y > canvas.height) m.y = 0;

                ctx.globalAlpha = m.alpha * (1 + gustStrength * 0.3);
                ctx.fillStyle = `rgba(${r + 30},${g + 15},${b},0.8)`;
                ctx.beginPath();
                ctx.arc(m.x, m.y, m.size, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        };

        tick();
        return () => { cancelAnimationFrame(animId); ro.disconnect(); };
    }, [accent]);

    return <EffectCanvas canvasRef={ref} opacity={0.28} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Steampunk — Rising steam puffs
// ─────────────────────────────────────────────────────────────────────────────

function SteamEffect() {
    const ref = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = ref.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animId: number;
        let frame = 0;

        interface Puff { x: number; y: number; baseX: number; phase: number; speed: number; alpha: number; r: number; }
        let puffs: Puff[] = [];

        const init = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            const slots = [0.1, 0.25, 0.4, 0.55, 0.7, 0.85, 0.95];
            puffs = slots.map((frac) => ({
                x: canvas.width * frac,
                y: canvas.height + Math.random() * canvas.height,
                baseX: canvas.width * frac,
                phase: Math.random() * Math.PI * 2,
                speed: 0.3 + Math.random() * 0.4,
                alpha: 0.08 + Math.random() * 0.12,
                r: 16 + Math.random() * 20,
            }));
        };

        init();
        const ro = new ResizeObserver(init);
        ro.observe(canvas);

        const tick = () => {
            animId = requestAnimationFrame(tick);
            if (++frame % 3 !== 0) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (const p of puffs) {
                p.phase += 0.02;
                p.y -= p.speed;
                p.x = p.baseX + Math.sin(p.phase) * 14;
                p.r += 0.08;
                p.alpha -= 0.0002;

                if (p.y < -p.r * 2 || p.alpha <= 0) {
                    p.y = canvas.height + 10 + Math.random() * 60;
                    p.alpha = 0.08 + Math.random() * 0.12;
                    p.r = 16 + Math.random() * 20;
                    p.phase = Math.random() * Math.PI * 2;
                }

                ctx.save();
                ctx.globalAlpha = p.alpha;
                const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
                grad.addColorStop(0, "rgba(230,210,180,0.8)");
                grad.addColorStop(0.5, "rgba(200,185,160,0.4)");
                grad.addColorStop(1, "transparent");
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        };

        tick();
        return () => { cancelAnimationFrame(animId); ro.disconnect(); };
    }, []);

    return <EffectCanvas canvasRef={ref} opacity={0.35} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Adventure / Jungle — Tumbling leaves
// ─────────────────────────────────────────────────────────────────────────────

const LEAF_COLORS = [
    "#4a7c40", "#5c9448", "#6daa4f", "#8fba5c",
    "#c4a035", "#b8802a", "#d4b44a",
];

function LeavesEffect() {
    const ref = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = ref.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animId: number;
        let frame = 0;

        interface Leaf { x: number; y: number; rot: number; rs: number; vx: number; vy: number; rx: number; ry: number; color: string; phase: number; }
        let leaves: Leaf[] = [];

        const init = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            leaves = Array.from({ length: 14 }, () => ({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                rot: Math.random() * Math.PI * 2,
                rs: (Math.random() - 0.5) * 0.06,
                vx: (Math.random() - 0.5) * 0.5,
                vy: 0.4 + Math.random() * 0.6,
                rx: 6 + Math.random() * 8,
                ry: 3 + Math.random() * 4,
                color: LEAF_COLORS[Math.floor(Math.random() * LEAF_COLORS.length)],
                phase: Math.random() * Math.PI * 2,
            }));
        };

        init();
        const ro = new ResizeObserver(init);
        ro.observe(canvas);

        const tick = () => {
            animId = requestAnimationFrame(tick);
            if (++frame % 2 !== 0) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (const l of leaves) {
                l.phase += 0.03;
                l.rot += l.rs;
                l.y += l.vy;
                l.x += l.vx + Math.sin(l.phase) * 0.4;

                if (l.y > canvas.height + 20) { l.y = -20; l.x = Math.random() * canvas.width; l.rot = Math.random() * Math.PI * 2; }
                if (l.x < -20) l.x = canvas.width + 20;
                if (l.x > canvas.width + 20) l.x = -20;

                ctx.save();
                ctx.translate(l.x, l.y);
                ctx.rotate(l.rot);
                ctx.globalAlpha = 0.65;
                ctx.fillStyle = l.color;
                ctx.shadowBlur = 4;
                ctx.shadowColor = l.color;
                ctx.beginPath();
                ctx.ellipse(0, 0, l.rx, l.ry, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        };

        tick();
        return () => { cancelAnimationFrame(animId); ro.disconnect(); };
    }, []);

    return <EffectCanvas canvasRef={ref} opacity={0.4} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Dune — Sandstorm: layered horizontal sand streams with gust waves
// ─────────────────────────────────────────────────────────────────────────────

function SandstormEffect() {
    const ref = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = ref.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animId: number;
        let frame = 0;

        // Sand colour palette — Arrakis desert tones
        const SAND_COLORS = [
            'rgba(210,170,90,',
            'rgba(195,150,70,',
            'rgba(230,190,110,',
            'rgba(180,130,55,',
            'rgba(245,210,140,',
        ];

        interface Grain {
            x: number; y: number;
            vx: number; vy: number;
            size: number; alpha: number;
            color: string; streak: number;
        }

        // Gust waves — periodic surges that accelerate the grains
        interface Gust { strength: number; y: number; height: number; life: number; maxLife: number; }
        let gusts: Gust[] = [];
        let gustTimer = 0;

        let grains: Grain[] = [];

        const init = () => {
            canvas.width  = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            grains = Array.from({ length: 260 }, () => ({
                x:      Math.random() * canvas.width,
                y:      Math.random() * canvas.height,
                vx:     0.6 + Math.random() * 1.4,
                vy:     (Math.random() - 0.5) * 0.3,
                size:   0.5 + Math.random() * 1.8,
                alpha:  0.15 + Math.random() * 0.55,
                color:  SAND_COLORS[Math.floor(Math.random() * SAND_COLORS.length)],
                streak: 2 + Math.random() * 6,   // horizontal streak length
            }));
        };

        init();
        const ro = new ResizeObserver(init);
        ro.observe(canvas);

        const tick = () => {
            animId = requestAnimationFrame(tick);
            if (++frame % 2 !== 0) return;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const W = canvas.width;
            const H = canvas.height;

            // ── Spawn gusts ────────────────────────────────────────────────
            gustTimer--;
            if (gustTimer <= 0) {
                gustTimer = 60 + Math.floor(Math.random() * 120);
                if (Math.random() < 0.65) {
                    gusts.push({
                        strength: 1.5 + Math.random() * 2.5,
                        y:        Math.random() * H,
                        height:   H * (0.15 + Math.random() * 0.4),
                        life:     0,
                        maxLife:  40 + Math.floor(Math.random() * 60),
                    });
                }
            }

            // ── Update gusts ───────────────────────────────────────────────
            for (const g of gusts) g.life++;
            gusts = gusts.filter(g => g.life < g.maxLife);

            // ── Gust strength at a given Y ─────────────────────────────────
            const gustAt = (y: number): number => {
                let total = 0;
                for (const g of gusts) {
                    const dist = Math.abs(y - g.y);
                    if (dist < g.height) {
                        const envelope = Math.sin((1 - dist / g.height) * Math.PI);
                        const fade     = Math.sin((g.life / g.maxLife) * Math.PI);
                        total += g.strength * envelope * fade;
                    }
                }
                return total;
            };

            // ── Draw grains ────────────────────────────────────────────────
            for (const gr of grains) {
                const boost = gustAt(gr.y);
                gr.x += gr.vx + boost;
                gr.y += gr.vy + (Math.random() - 0.5) * 0.15;

                if (gr.x > W + 10) { gr.x = -10; gr.y = Math.random() * H; }
                if (gr.y < 0)  gr.y = H;
                if (gr.y > H)  gr.y = 0;

                const alphaMod = 1 + boost * 0.25;
                ctx.globalAlpha = Math.min(1, gr.alpha * alphaMod);

                // Streak along direction of travel
                const stretchX = gr.streak * (1 + boost * 0.4);
                ctx.fillStyle = gr.color + (gr.alpha * alphaMod).toFixed(2) + ')';
                ctx.beginPath();
                ctx.ellipse(gr.x, gr.y, stretchX, gr.size * 0.5, 0, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;

            // ── Gust wave overlay — faint haze band ────────────────────────
            for (const g of gusts) {
                const fade = Math.sin((g.life / g.maxLife) * Math.PI);
                const hg = ctx.createLinearGradient(0, g.y - g.height, 0, g.y + g.height);
                hg.addColorStop(0, 'transparent');
                hg.addColorStop(0.5, `rgba(210,170,90,${0.04 * fade * g.strength})`);
                hg.addColorStop(1, 'transparent');
                ctx.fillStyle = hg;
                ctx.fillRect(0, g.y - g.height, W, g.height * 2);
            }
        };

        tick();
        return () => { cancelAnimationFrame(animId); ro.disconnect(); };
    }, []);

    return <EffectCanvas canvasRef={ref} opacity={0.45} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Fallout — Pip-Boy CRT: scanlines, phosphor glow, static noise, sweep bar
// ─────────────────────────────────────────────────────────────────────────────

function PipBoyEffect() {
    const ref = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = ref.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Pip-Boy phosphor green
        const GREEN   = '#4bff91';
        const GREEN_DIM = 'rgba(0,255,80,0.06)';

        let animId: number;
        let sweepY   = -1;          // scan bar Y position (-1 = idle)
        const sweepDir = 1;
        let flickerTimer = 0;
        let flickerAlpha = 0;

        const init = () => {
            canvas.width  = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        };
        init();
        const ro = new ResizeObserver(init);
        ro.observe(canvas);

        const tick = () => {
            animId = requestAnimationFrame(tick);
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const W = canvas.width;
            const H = canvas.height;

            // ── Scanlines ──────────────────────────────────────────────────
            for (let y = 0; y < H; y += 3) {
                ctx.fillStyle = GREEN_DIM;
                ctx.fillRect(0, y, W, 1);
            }

            // ── Phosphor edge vignette ─────────────────────────────────────
            const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.28, W / 2, H / 2, H * 0.85);
            vg.addColorStop(0, 'transparent');
            vg.addColorStop(1, 'rgba(0,20,5,0.35)');
            ctx.fillStyle = vg;
            ctx.fillRect(0, 0, W, H);

            // ── Random static pixels ───────────────────────────────────────
            const count = Math.floor(Math.random() * 180) + 60;
            for (let i = 0; i < count; i++) {
                const px = Math.random() * W;
                const py = Math.random() * H;
                const bright = Math.random();
                ctx.globalAlpha = bright * 0.55;
                ctx.fillStyle = bright > 0.7 ? '#ffffff' : GREEN;
                ctx.fillRect(px, py, 1, 1);
            }
            ctx.globalAlpha = 1;

            // ── Horizontal noise bars (occasional) ────────────────────────
            if (Math.random() < 0.04) {
                const by = Math.random() * H;
                const bh = 1 + Math.random() * 3;
                ctx.globalAlpha = 0.08 + Math.random() * 0.12;
                ctx.fillStyle = GREEN;
                ctx.fillRect(0, by, W * (0.4 + Math.random() * 0.6), bh);
                ctx.globalAlpha = 1;
            }

            // ── Sweep bar ─────────────────────────────────────────────────
            if (sweepY < 0 && Math.random() < 0.004) sweepY = 0;
            if (sweepY >= 0) {
                const sg = ctx.createLinearGradient(0, sweepY - 18, 0, sweepY + 18);
                sg.addColorStop(0, 'transparent');
                sg.addColorStop(0.5, 'rgba(0,255,80,0.07)');
                sg.addColorStop(1, 'transparent');
                ctx.fillStyle = sg;
                ctx.fillRect(0, sweepY - 18, W, 36);
                sweepY += sweepDir * 3;
                if (sweepY > H + 20) sweepY = -1;
            }

            // ── Phosphor flicker ──────────────────────────────────────────
            flickerTimer--;
            if (flickerTimer <= 0) {
                flickerTimer = 100 + Math.floor(Math.random() * 300);
                flickerAlpha = 0.03 + Math.random() * 0.07;
            }
            if (flickerAlpha > 0) {
                ctx.globalAlpha = flickerAlpha;
                ctx.fillStyle = GREEN_DIM;
                ctx.fillRect(0, 0, W, H);
                ctx.globalAlpha = 1;
                flickerAlpha = Math.max(0, flickerAlpha - 0.003);
            }
        };

        tick();
        return () => { cancelAnimationFrame(animId); ro.disconnect(); };
    }, []);

    return <EffectCanvas canvasRef={ref} opacity={0.55} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Cyberpunk 2077 — Yellow glitch: chromatic tears, noise bars, RGB offset
// ─────────────────────────────────────────────────────────────────────────────

function CyberpunkGlitchEffect() {
    const ref = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = ref.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animId: number;

        // Glitch event state
        interface GlitchSlice { y: number; h: number; shift: number; color: string; alpha: number; }
        let slices:    GlitchSlice[] = [];
        let glitchTimer   = 0;
        let glitchCooldown = 80;
        let flashAlpha    = 0;

        const spawnGlitch = (W: number, H: number) => {
            // 2-5 horizontal slices shifted sideways
            const n = 2 + Math.floor(Math.random() * 4);
            slices = Array.from({ length: n }, () => {
                const y = Math.random() * H;
                const h = 2 + Math.random() * 18;
                const shift = (Math.random() - 0.5) * 60;
                const roll = Math.random();
                const color = roll < 0.45
                    ? `rgba(255,214,0,${0.25 + Math.random() * 0.45})`   // CP yellow
                    : roll < 0.7
                    ? `rgba(0,255,255,${0.15 + Math.random() * 0.3})`    // cyan
                    : `rgba(255,0,100,${0.15 + Math.random() * 0.3})`;   // magenta
                return { y, h, shift, color, alpha: 0.8 + Math.random() * 0.2 };
            });
            flashAlpha = 0.04 + Math.random() * 0.08;
            glitchCooldown = 60 + Math.floor(Math.random() * 180);
        };

        const init = () => {
            canvas.width  = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        };
        init();
        const ro = new ResizeObserver(init);
        ro.observe(canvas);

        const tick = () => {
            animId = requestAnimationFrame(tick);
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const W = canvas.width;
            const H = canvas.height;

            // ── Ambient yellow pixel noise ─────────────────────────────────
            const count = 30 + Math.floor(Math.random() * 50);
            for (let i = 0; i < count; i++) {
                const px = Math.random() * W;
                const py = Math.random() * H;
                ctx.globalAlpha = 0.05 + Math.random() * 0.12;
                ctx.fillStyle = Math.random() < 0.7 ? 'rgba(255,214,0,1)' : 'rgba(0,255,255,1)';
                ctx.fillRect(px, py, Math.random() < 0.15 ? 2 : 1, 1);
            }
            ctx.globalAlpha = 1;

            // ── Spawn glitch event ────────────────────────────────────────
            glitchTimer++;
            if (glitchTimer >= glitchCooldown) {
                glitchTimer = 0;
                spawnGlitch(W, H);
            }

            // ── Render active glitch slices ───────────────────────────────
            for (const s of slices) {
                ctx.save();
                ctx.globalAlpha = s.alpha;
                ctx.fillStyle = s.color;
                // Main shifted bar
                ctx.fillRect(s.shift, s.y, W, s.h);
                // Thin echo bars (chromatic offset)
                ctx.globalAlpha = s.alpha * 0.4;
                ctx.fillStyle = 'rgba(255,214,0,0.5)';
                ctx.fillRect(s.shift + 6, s.y + 1, W, 1);
                ctx.fillStyle = 'rgba(0,255,255,0.5)';
                ctx.fillRect(s.shift - 6, s.y - 1, W, 1);
                ctx.restore();
                s.alpha -= 0.08;
            }
            slices = slices.filter(s => s.alpha > 0);

            // ── Full-screen yellow flash ──────────────────────────────────
            if (flashAlpha > 0) {
                ctx.globalAlpha = flashAlpha;
                ctx.fillStyle = 'rgba(255,214,0,1)';
                ctx.fillRect(0, 0, W, H);
                ctx.globalAlpha = 1;
                flashAlpha = Math.max(0, flashAlpha - 0.006);
            }

            // ── Occasional vertical noise bar ─────────────────────────────
            if (Math.random() < 0.015) {
                const bx = Math.random() * W;
                ctx.globalAlpha = 0.06 + Math.random() * 0.1;
                ctx.fillStyle = 'rgba(255,214,0,1)';
                ctx.fillRect(bx, 0, 1 + Math.random() * 3, H);
                ctx.globalAlpha = 1;
            }
        };

        tick();
        return () => { cancelAnimationFrame(animId); ro.disconnect(); };
    }, []);

    return <EffectCanvas canvasRef={ref} opacity={0.5} />;
}

// Stranger Things — Upside Down: floating spores, creeping vine tendrils, crimson vignette, lightning
function UpsideDownEffect() {
    const ref = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = ref.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animId: number;
        let t = 0;
        let flashAlpha = 0;
        let flashTimer = 0;

        interface Spore {
            x: number; y: number; r: number;
            vx: number; vy: number;
            alpha: number; wobble: number; wobbleSpeed: number;
        }

        interface Tendril {
            x0: number; y0: number;
            cx1: number; cy1: number;
            cx2: number; cy2: number;
            x1: number; y1: number;
            length: number;
            speed: number;
            alpha: number;
            width: number;
        }

        const rnd = (a: number, b: number) => a + Math.random() * (b - a);

        const makeTendril = (W: number, H: number): Tendril => {
            const edge = Math.floor(Math.random() * 4);
            let x0 = 0, y0 = 0;
            if (edge === 0) { x0 = rnd(0, W); y0 = 0; }
            else if (edge === 1) { x0 = W; y0 = rnd(0, H); }
            else if (edge === 2) { x0 = rnd(0, W); y0 = H; }
            else { x0 = 0; y0 = rnd(0, H); }

            const inX = W * 0.5 + rnd(-W * 0.3, W * 0.3);
            const inY = H * 0.5 + rnd(-H * 0.3, H * 0.3);
            const cx1 = x0 + (inX - x0) * 0.3 + rnd(-W * 0.12, W * 0.12);
            const cy1 = y0 + (inY - y0) * 0.3 + rnd(-H * 0.12, H * 0.12);
            const cx2 = x0 + (inX - x0) * 0.6 + rnd(-W * 0.12, W * 0.12);
            const cy2 = y0 + (inY - y0) * 0.6 + rnd(-H * 0.12, H * 0.12);

            return {
                x0, y0, cx1, cy1, cx2, cy2,
                x1: inX, y1: inY,
                length: 0,
                speed: rnd(0.0006, 0.002),
                alpha: rnd(0.25, 0.55),
                width: rnd(0.5, 2.0),
            };
        };

        let spores: Spore[] = [];
        let tendrils: Tendril[] = [];

        const init = () => {
            canvas.width  = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            const W = canvas.width, H = canvas.height;

            spores = Array.from({ length: 80 }, () => ({
                x: rnd(0, W),
                y: rnd(0, H),
                r: rnd(0.8, 2.6),
                vx: rnd(-0.18, 0.18),
                vy: rnd(-0.45, -0.08), // drift upward
                alpha: rnd(0.2, 0.65),
                wobble: Math.random() * Math.PI * 2,
                wobbleSpeed: rnd(0.006, 0.02),
            }));

            const count = 10 + Math.floor(Math.random() * 6);
            tendrils = Array.from({ length: count }, () => makeTendril(W, H));
        };

        init();
        const ro = new ResizeObserver(init);
        ro.observe(canvas);

        // Draw a cubic bezier tendril up to progress p (0–1)
        const drawTendril = (td: Tendril, p: number) => {
            if (p <= 0) return;
            const segments = Math.max(2, Math.floor(p * 60));
            ctx.save();
            ctx.globalAlpha = td.alpha;
            ctx.strokeStyle = '#5a1010';
            ctx.lineWidth = td.width;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(td.x0, td.y0);
            for (let i = 1; i <= segments; i++) {
                const u  = (i / segments) * p;
                const mu = 1 - u;
                const x  = mu*mu*mu*td.x0 + 3*mu*mu*u*td.cx1 + 3*mu*u*u*td.cx2 + u*u*u*td.x1;
                const y  = mu*mu*mu*td.y0 + 3*mu*mu*u*td.cy1 + 3*mu*u*u*td.cy2 + u*u*u*td.y1;
                ctx.lineTo(x, y);
            }
            ctx.stroke();
            ctx.restore();
        };

        const tick = () => {
            animId = requestAnimationFrame(tick);
            t += 0.016;

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const W = canvas.width, H = canvas.height;

            // ── Pulsing crimson vignette ─────────────────────────────────────
            const vigAlpha = 0.24 + 0.07 * Math.sin(t * 0.35);
            const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.18, W / 2, H / 2, H * 0.95);
            vig.addColorStop(0,   'transparent');
            vig.addColorStop(0.55, `rgba(75,4,4,${vigAlpha * 0.4})`);
            vig.addColorStop(1,   `rgba(50,0,0,${vigAlpha})`);
            ctx.fillStyle = vig;
            ctx.fillRect(0, 0, W, H);

            // ── Creeping vine tendrils ───────────────────────────────────────
            for (const td of tendrils) {
                td.length = Math.min(1, td.length + td.speed);
                drawTendril(td, td.length);
            }

            // ── Floating spores ──────────────────────────────────────────────
            for (const sp of spores) {
                sp.wobble += sp.wobbleSpeed;
                sp.x += sp.vx + 0.14 * Math.sin(sp.wobble);
                sp.y += sp.vy;
                if (sp.y < -6) sp.y = H + 6;
                if (sp.x < -6) sp.x = W + 6;
                if (sp.x > W + 6) sp.x = -6;

                const pulse = 0.65 + 0.35 * Math.sin(sp.wobble * 1.4);
                ctx.beginPath();
                ctx.arc(sp.x, sp.y, sp.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(210,165,165,${sp.alpha * pulse})`;
                ctx.fill();
            }

            // ── Rare purple-white lightning flicker ──────────────────────────
            flashTimer -= 1;
            if (flashTimer <= 0 && Math.random() < 0.003) {
                flashAlpha = rnd(0.05, 0.13);
                flashTimer = rnd(15, 50);
            }
            if (flashAlpha > 0) {
                ctx.fillStyle = `rgba(165,90,210,${flashAlpha})`;
                ctx.fillRect(0, 0, W, H);
                flashAlpha = Math.max(0, flashAlpha - 0.007);
            }
        };

        tick();
        return () => { cancelAnimationFrame(animId); ro.disconnect(); };
    }, []);

    return <EffectCanvas canvasRef={ref} opacity={0.75} />;
}

// Resident Evil / Walking Dead — Zombie: blood drips, toxic spore mist, infected vignette
function ZombieEffect() {
    const ref = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = ref.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animId: number;
        let t = 0;

        const rnd = (a: number, b: number) => a + Math.random() * (b - a);

        // ── Blood drips ───────────────────────────────────────────────────────
        interface Drip {
            x: number;
            topY: number;     // y of the source (ceiling / surface)
            tipY: number;     // current y of the drip tip
            maxLen: number;
            speed: number;
            baseW: number;    // half-width at top of streak
            alpha: number;
            dropR: number;    // teardrop radius
            noise: number[];  // pre-baked jagged-edge offsets
            done: boolean;
        }

        const makeDrip = (W: number): Drip => {
            const maxLen = rnd(28, 200);
            const noise  = Array.from({ length: 22 }, () => rnd(-1.2, 1.2));
            return {
                x:      rnd(0, W),
                topY:   rnd(-14, 2),
                tipY:   rnd(-14, 2),
                maxLen,
                speed:  rnd(0.22, 1.0),
                baseW:  rnd(1.8, 5.0),
                alpha:  rnd(0.50, 0.82),
                dropR:  rnd(2.8, 6.5),
                noise,
                done:   false,
            };
        };

        // Draw one blood drip: tapered filled path + glossy teardrop bulb
        const drawDrip = (d: Drip) => {
            const currentLen = d.tipY - d.topY;
            if (currentLen <= 0) return;
            ctx.save();
            ctx.globalAlpha = d.alpha;

            // Tapered streak — closed filled path with noise-perturbed edges
            const steps = Math.max(3, Math.floor(currentLen / 4));
            ctx.beginPath();
            for (let i = 0; i <= steps; i++) {
                const u     = i / steps;
                const ys    = d.topY + u * currentLen;
                const halfW = d.baseW * (1 - u * 0.78);
                const ni    = Math.floor(u * (d.noise.length - 1));
                const nx    = d.noise[ni] * (1 - u * 0.6);
                const xp    = d.x - halfW + nx;
                if (i === 0) ctx.moveTo(xp, ys); else ctx.lineTo(xp, ys);
            }
            for (let i = steps; i >= 0; i--) {
                const u     = i / steps;
                const ys    = d.topY + u * currentLen;
                const halfW = d.baseW * (1 - u * 0.78);
                const ni    = Math.min(d.noise.length - 1, Math.floor(u * (d.noise.length - 1)) + 1);
                const nx    = d.noise[ni] * (1 - u * 0.6);
                const xp    = d.x + halfW + nx;
                ctx.lineTo(xp, ys);
            }
            ctx.closePath();
            const sg = ctx.createLinearGradient(d.x, d.topY, d.x, d.tipY);
            sg.addColorStop(0,   'rgba(95,3,3,0.9)');
            sg.addColorStop(0.5, 'rgba(135,6,6,1.0)');
            sg.addColorStop(1,   'rgba(155,8,8,0.85)');
            ctx.fillStyle = sg;
            ctx.fill();

            // Teardrop bulb — bezier outline + radial gradient + specular glint
            const bx = d.x, by = d.tipY;
            const rx = d.dropR * 0.72, ry = d.dropR * 1.38;
            ctx.beginPath();
            ctx.moveTo(bx - rx * 0.55, by - ry * 0.5);
            ctx.bezierCurveTo(bx - rx * 1.15, by - ry * 0.05, bx - rx * 0.72, by + ry * 0.92, bx, by + ry * 1.08);
            ctx.bezierCurveTo(bx + rx * 0.72, by + ry * 0.92, bx + rx * 1.15, by - ry * 0.05, bx + rx * 0.55, by - ry * 0.5);
            ctx.closePath();
            const bg = ctx.createRadialGradient(bx - rx * 0.28, by - ry * 0.08, rx * 0.28, bx, by + ry * 0.3, ry * 1.45);
            bg.addColorStop(0,    'rgba(215,28,28,0.95)');
            bg.addColorStop(0.38, 'rgba(165,8,8,1.0)');
            bg.addColorStop(1,    'rgba(105,2,2,0.88)');
            ctx.fillStyle = bg;
            ctx.fill();
            // Wet glint
            ctx.beginPath();
            ctx.ellipse(bx - rx * 0.3, by - ry * 0.12, rx * 0.24, ry * 0.15, -0.45, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,185,185,0.40)';
            ctx.fill();

            ctx.restore();
        };

        // ── Toxic spores ──────────────────────────────────────────────────────
        interface Spore {
            x: number; y: number; r: number;
            vx: number; vy: number;
            alpha: number; wobble: number; ws: number;
        }

        let drips:  Drip[]  = [];
        let spores: Spore[] = [];

        const init = () => {
            canvas.width  = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            const W = canvas.width, H = canvas.height;

            // Seed drips pre-advanced so they aren't all at the top on load
            drips = Array.from({ length: 18 }, () => {
                const d = makeDrip(W);
                const pre = rnd(0, d.maxLen);
                d.tipY += pre;
                if (pre >= d.maxLen) d.done = true;
                return d;
            });

            spores = Array.from({ length: 55 }, () => ({
                x:  rnd(0, W),
                y:  rnd(0, H),
                r:  rnd(0.7, 2.2),
                vx: rnd(-0.12, 0.12),
                vy: rnd(-0.55, -0.10),
                alpha: rnd(0.15, 0.55),
                wobble: Math.random() * Math.PI * 2,
                ws: rnd(0.008, 0.022),
            }));
        };

        init();
        const ro = new ResizeObserver(init);
        ro.observe(canvas);

        const tick = () => {
            animId = requestAnimationFrame(tick);
            t += 0.016;

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const W = canvas.width, H = canvas.height;

            // ── Infected green vignette ───────────────────────────────────────
            const vigAlpha = 0.22 + 0.06 * Math.sin(t * 0.28);
            const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.15, W / 2, H / 2, H * 0.92);
            vig.addColorStop(0,   'transparent');
            vig.addColorStop(0.5, `rgba(10,35,4,${vigAlpha * 0.5})`);
            vig.addColorStop(1,   `rgba(8,28,2,${vigAlpha})`);
            ctx.fillStyle = vig;
            ctx.fillRect(0, 0, W, H);

            // ── Sickly green mist band at bottom ──────────────────────────────
            const mistY   = H * 0.72;
            const mistAlpha = 0.07 + 0.04 * Math.sin(t * 0.4);
            const mist = ctx.createLinearGradient(0, mistY, 0, H);
            mist.addColorStop(0, 'transparent');
            mist.addColorStop(0.4, `rgba(30,70,4,${mistAlpha})`);
            mist.addColorStop(1,   `rgba(18,50,2,${mistAlpha * 1.4})`);
            ctx.fillStyle = mist;
            ctx.fillRect(0, mistY, W, H - mistY);

            // ── Blood drips ───────────────────────────────────────────────────
            for (const d of drips) {
                if (!d.done) {
                    d.tipY += d.speed;
                    if (d.tipY - d.topY >= d.maxLen) d.done = true;
                }
                drawDrip(d);
            }

            // Recycle drips that have fallen off screen
            for (let i = 0; i < drips.length; i++) {
                if (drips[i].tipY > H + 20) {
                    drips[i] = makeDrip(W);
                }
            }
            // Occasionally spawn an extra drip
            if (drips.length < 26 && Math.random() < 0.008) {
                drips.push(makeDrip(W));
            }

            // ── Toxic spores ──────────────────────────────────────────────────
            for (const sp of spores) {
                sp.wobble += sp.ws;
                sp.x += sp.vx + 0.1 * Math.sin(sp.wobble);
                sp.y += sp.vy;
                if (sp.y < -4) { sp.y = H + 4; sp.x = rnd(0, W); }
                if (sp.x < -4) sp.x = W + 4;
                if (sp.x > W + 4) sp.x = -4;

                const pulse = 0.6 + 0.4 * Math.sin(sp.wobble * 1.6);
                const g = ctx.createRadialGradient(sp.x, sp.y, 0, sp.x, sp.y, sp.r * 2.2);
                g.addColorStop(0,   `rgba(140,200,40,${sp.alpha * pulse})`);
                g.addColorStop(0.5, `rgba(80,140,10,${sp.alpha * pulse * 0.5})`);
                g.addColorStop(1,   'transparent');
                ctx.beginPath();
                ctx.arc(sp.x, sp.y, sp.r * 2.2, 0, Math.PI * 2);
                ctx.fillStyle = g;
                ctx.fill();
            }
        };

        tick();
        return () => { cancelAnimationFrame(animId); ro.disconnect(); };
    }, []);

    return <EffectCanvas canvasRef={ref} opacity={0.8} />;
}

// Doctor Who — TARDIS flying through the Time Vortex
function TardisVortexEffect() {
    const ref = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = ref.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animId: number;
        let t = 0;

        // TARDIS travel state
        const TARDIS_H   = 68;
        const TARDIS_W   = TARDIS_H * 0.62;

        // Each crossing gets its own randomised parameters
        let tardisX       = -TARDIS_W - 20;
        let tardisSpeed   = 1.2;   // px/frame
        let tardisY       = 0;     // set on each spawn
        let tardisWait    = 180 + Math.floor(Math.random() * 480); // frames to wait before first appearance
        let tardisActive  = false;

        const spawnTardis = (H: number) => {
            tardisX      = -TARDIS_W - 20;
            tardisSpeed  = 0.7 + Math.random() * 1.2;           // slow to medium
            tardisY      = H * (0.28 + Math.random() * 0.44);   // random vertical band
            tardisActive = true;
        };

        const init = () => {
            canvas.width  = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            tardisActive = false;
            tardisWait   = 180 + Math.floor(Math.random() * 480);
        };

        init();
        const ro = new ResizeObserver(init);
        ro.observe(canvas);

        // ── Draw the TARDIS police box ────────────────────────────────────────
        const drawTardis = (x: number, y: number, tilt: number, alpha: number) => {
            if (alpha <= 0) return;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.translate(x, y);
            ctx.rotate(tilt);

            const w = TARDIS_W, h = TARDIS_H;

            // Body
            ctx.fillStyle   = '#0c3676';
            ctx.strokeStyle = '#1a5bbf';
            ctx.lineWidth   = 1;
            ctx.fillRect(-w / 2, -h / 2, w, h);
            ctx.strokeRect(-w / 2, -h / 2, w, h);

            // Top sign band ("POLICE PUBLIC CALL BOX")
            const bandH = h * 0.14;
            ctx.fillStyle = '#0e4a9e';
            ctx.fillRect(-w / 2, -h / 2, w, bandH);
            ctx.strokeStyle = '#1a5bbf';
            ctx.strokeRect(-w / 2, -h / 2, w, bandH);

            // Horizontal divider (middle)
            ctx.strokeStyle = '#1a5bbf';
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(-w / 2, 0); ctx.lineTo(w / 2, 0);
            ctx.stroke();

            // Vertical centre divider (door line)
            ctx.beginPath();
            ctx.moveTo(0, -h / 2 + bandH); ctx.lineTo(0, h / 2);
            ctx.stroke();

            // Windows — 2 columns × 2 rows
            const winW = w * 0.28, winH = h * 0.12;
            const winCols = [-w * 0.25, w * 0.25];
            const winRows = [-h / 2 + bandH + h * 0.07, -h / 2 + bandH + h * 0.07 + winH + h * 0.04];
            ctx.fillStyle   = 'rgba(140,200,255,0.65)';
            ctx.strokeStyle = '#3888d8';
            ctx.lineWidth   = 0.7;
            for (const wy of winRows) {
                for (const wx of winCols) {
                    ctx.fillRect(wx - winW / 2, wy, winW, winH);
                    ctx.strokeRect(wx - winW / 2, wy, winW, winH);
                }
            }

            // Lamp on top
            const lampW = w * 0.14, lampH = h * 0.09;
            ctx.fillStyle   = 'rgba(200,230,255,0.8)';
            ctx.strokeStyle = '#5599cc';
            ctx.lineWidth   = 0.8;
            ctx.fillRect(-lampW / 2, -h / 2 - lampH, lampW, lampH);
            ctx.strokeRect(-lampW / 2, -h / 2 - lampH, lampW, lampH);

            // Light glow from lamp
            const glow = ctx.createRadialGradient(0, -h / 2 - lampH / 2, 0, 0, -h / 2 - lampH / 2, 22);
            glow.addColorStop(0, 'rgba(180,220,255,0.42)');
            glow.addColorStop(1, 'transparent');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(0, -h / 2 - lampH / 2, 22, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        };

        const tick = () => {
            animId = requestAnimationFrame(tick);
            t += 1;

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const W = canvas.width, H = canvas.height;
            const cx = W / 2, cy = H / 2;

            // ── Rotating vortex tunnel ─────────────────────────────────────
            const vp = { x: cx, y: cy };
            const STREAKS = 20;
            const rot = t * 0.0018;

            for (let i = 0; i < STREAKS; i++) {
                const angle = (i / STREAKS) * Math.PI * 2 + rot;
                const hue   = 210 + 30 * Math.sin(t * 0.015 + i * 0.5);
                const alpha = 0.028 + 0.014 * Math.sin(t * 0.02 + i);

                // Each streak is a narrow trapezoid from near vanishing point to edge
                const innerR = 18;
                const outerR = Math.max(W, H) * 0.85;
                const spread = 0.055;   // angular half-width

                const x0l = vp.x + innerR * Math.cos(angle - spread);
                const y0l = vp.y + innerR * Math.sin(angle - spread);
                const x0r = vp.x + innerR * Math.cos(angle + spread);
                const y0r = vp.y + innerR * Math.sin(angle + spread);
                const x1l = vp.x + outerR * Math.cos(angle - spread * 0.3);
                const y1l = vp.y + outerR * Math.sin(angle - spread * 0.3);
                const x1r = vp.x + outerR * Math.cos(angle + spread * 0.3);
                const y1r = vp.y + outerR * Math.sin(angle + spread * 0.3);

                const sg = ctx.createLinearGradient(vp.x, vp.y, x1l, y1l);
                sg.addColorStop(0,   `hsla(${hue},90%,65%,0)`);
                sg.addColorStop(0.25,`hsla(${hue},90%,60%,${alpha})`);
                sg.addColorStop(1,   `hsla(${hue},80%,30%,0)`);

                ctx.beginPath();
                ctx.moveTo(x0l, y0l);
                ctx.lineTo(x1l, y1l);
                ctx.lineTo(x1r, y1r);
                ctx.lineTo(x0r, y0r);
                ctx.closePath();
                ctx.fillStyle = sg;
                ctx.fill();
            }

            // ── Depth rings (receding circles) ────────────────────────────
            const RINGS = 8;
            for (let i = 0; i < RINGS; i++) {
                const phase = ((i / RINGS) + t * 0.0008) % 1;
                const r     = phase * Math.min(W, H) * 0.72;
                const fade  = Math.sin(phase * Math.PI);
                if (fade < 0.05) continue;
                const hue   = 205 + 20 * Math.sin(t * 0.01 + i);
                ctx.save();
                ctx.globalAlpha = fade * 0.06;
                ctx.strokeStyle = `hsl(${hue},100%,68%)`;
                ctx.lineWidth   = 1.0;
                ctx.beginPath();
                ctx.ellipse(cx, cy, r, r * 0.55, 0, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }

            // ── Centre glow ───────────────────────────────────────────────
            const pulse = 0.7 + 0.3 * Math.sin(t * 0.04);
            const eg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(W, H) * 0.22);
            eg.addColorStop(0,   `rgba(60,130,220,${0.08 * pulse})`);
            eg.addColorStop(0.5, `rgba(15,60,170,${0.04 * pulse})`);
            eg.addColorStop(1,   'transparent');
            ctx.fillStyle = eg;
            ctx.fillRect(0, 0, W, H);

            // ── TARDIS ───────────────────────────────────────────────────
            if (!tardisActive) {
                tardisWait--;
                if (tardisWait <= 0) spawnTardis(H);
            } else {
                tardisX += tardisSpeed;
                if (tardisX > W + TARDIS_W + 20) {
                    tardisActive = false;
                    // Random wait before next appearance: 8–25 seconds at 60fps
                    tardisWait = 480 + Math.floor(Math.random() * 1020);
                }

                const tardisTilt = 0.06 * Math.sin(t * 0.016);
                const tardisYBob = tardisY + 18 * Math.sin(t * 0.022);

                const edgeFade = Math.min(
                    Math.min(1, (tardisX + TARDIS_W + 20) / 60),
                    Math.min(1, (W + TARDIS_W + 20 - tardisX) / 60)
                );
                drawTardis(tardisX, tardisYBob, tardisTilt, Math.max(0, edgeFade) * 0.78);
            }
        };

        tick();
        return () => { cancelAnimationFrame(animId); ro.disconnect(); };
    }, []);

    return <EffectCanvas canvasRef={ref} opacity={0.6} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API — auto-selects the right effect based on setting/archetype
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// HarryPotterEffect — floating candles + Golden Snitch
// ─────────────────────────────────────────────────────────────────────────────
function HarryPotterEffect() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        let W = 0, H = 0, raf = 0;

        const rnd  = (a: number, b: number) => a + Math.random() * (b - a);
        const rndI = (a: number, b: number) => Math.floor(rnd(a, b));

        // ── Floating candles ─────────────────────────────────────────────────
        interface Candle {
            x: number; y: number;
            vy: number;           // slow upward drift
            sway: number;         // x phase
            swaySpeed: number;
            swayAmp: number;
            flamePhase: number;
            height: number;       // candle body height
            alpha: number;
        }
        const makeCandle = (randomY = false): Candle => ({
            x:          rnd(W * 0.05, W * 0.95),
            y:          randomY ? rnd(0, H) : H + rnd(20, 120),
            vy:         rnd(0.18, 0.38),
            sway:       Math.random() * Math.PI * 2,
            swaySpeed:  rnd(0.008, 0.018),
            swayAmp:    rnd(6, 18),
            flamePhase: Math.random() * Math.PI * 2,
            height:     rnd(22, 42),
            alpha:      rnd(0.45, 0.72),
        });

        let candles: Candle[] = [];

        const drawCandle = (c: Candle) => {
            const fp = c.flamePhase;
            // Candle body — thin cream rectangle
            const w = 4.5;
            ctx.save();
            ctx.globalAlpha = c.alpha;

            // Drip wax effect — rounded bottom
            ctx.fillStyle = 'rgba(245,238,210,0.92)';
            ctx.beginPath();
            ctx.roundRect(c.x - w / 2, c.y - c.height, w, c.height, [0, 0, 3, 3]);
            ctx.fill();

            // Subtle wax sheen line
            ctx.strokeStyle = 'rgba(255,250,230,0.4)';
            ctx.lineWidth   = 1;
            ctx.beginPath();
            ctx.moveTo(c.x - w * 0.15, c.y - c.height + 3);
            ctx.lineTo(c.x - w * 0.15, c.y - 3);
            ctx.stroke();

            // Wick
            ctx.strokeStyle = 'rgba(80,55,30,0.9)';
            ctx.lineWidth   = 1;
            ctx.beginPath();
            ctx.moveTo(c.x, c.y - c.height);
            ctx.lineTo(c.x, c.y - c.height - 5);
            ctx.stroke();

            // Flame — outer glow
            const fx  = c.x + Math.sin(fp * 1.3) * 1.5;
            const fy  = c.y - c.height - 5;
            const flH = 10 + Math.sin(fp * 2.1) * 2.5;
            const flW = 4  + Math.sin(fp * 1.7) * 1.2;

            const flGlow = ctx.createRadialGradient(fx, fy - flH * 0.3, 0, fx, fy, flH * 1.4);
            flGlow.addColorStop(0,   'rgba(255,240,120,0.55)');
            flGlow.addColorStop(0.5, 'rgba(255,150,20,0.22)');
            flGlow.addColorStop(1,   'rgba(255,80,0,0)');
            ctx.fillStyle = flGlow;
            ctx.beginPath();
            ctx.arc(fx, fy - flH * 0.2, flH * 1.4, 0, Math.PI * 2);
            ctx.fill();

            // Flame body — teardrop
            ctx.beginPath();
            ctx.moveTo(fx, fy - flH);
            ctx.bezierCurveTo(fx + flW, fy - flH * 0.4, fx + flW * 0.7, fy + 2, fx, fy + 1);
            ctx.bezierCurveTo(fx - flW * 0.7, fy + 2, fx - flW, fy - flH * 0.4, fx, fy - flH);
            ctx.closePath();
            const flBody = ctx.createLinearGradient(fx, fy - flH, fx, fy + 1);
            flBody.addColorStop(0,   'rgba(255,250,200,0.95)');
            flBody.addColorStop(0.4, 'rgba(255,180,40,0.90)');
            flBody.addColorStop(1,   'rgba(255,80,0,0.70)');
            ctx.fillStyle = flBody;
            ctx.fill();

            ctx.restore();
        };

        // ── Golden Snitch ─────────────────────────────────────────────────────
        // State machine: hovering → dashing → hovering
        const snitch = {
            x: 0, y: 0,
            tx: 0, ty: 0,          // current target
            vx: 0, vy: 0,
            wingPhase: 0,
            mode: 'hover' as 'hover' | 'dash',
            modeTimer: 0,
            visible: false,
            alpha: 0,
            waitTimer: rndI(180, 400),   // frames before first appearance
        };

        const newSnitchTarget = () => {
            snitch.tx = rnd(W * 0.12, W * 0.88);
            snitch.ty = rnd(H * 0.08, H * 0.82);
        };

        const drawSnitch = () => {
            if (!snitch.visible || snitch.alpha <= 0) return;
            const x = snitch.x, y = snitch.y;
            const r = 7;    // orb radius
            const wf = Math.sin(snitch.wingPhase);  // -1..1 wing flap

            ctx.save();
            ctx.globalAlpha = snitch.alpha;

            // Glow halo
            const glow = ctx.createRadialGradient(x, y, 0, x, y, r * 4.5);
            glow.addColorStop(0,   'rgba(255,220,60,0.45)');
            glow.addColorStop(0.5, 'rgba(230,170,20,0.15)');
            glow.addColorStop(1,   'rgba(200,140,0,0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(x, y, r * 4.5, 0, Math.PI * 2);
            ctx.fill();

            // Wings — two curved ellipses that flap around the orb
            const wingSpread = r * 2.8;
            const wingH      = r * 1.0 + wf * r * 0.7;  // flap height change

            for (const side of [-1, 1]) {
                const wx = x + side * (r * 0.85);
                ctx.save();
                ctx.translate(wx, y);
                ctx.scale(1, 0.55 + Math.abs(wf) * 0.45);  // flatten as wings close
                ctx.beginPath();
                // Curved triangular wing
                ctx.moveTo(0, 0);
                ctx.bezierCurveTo(
                    side * wingSpread * 0.5, -wingH * 1.2,
                    side * wingSpread,       -wingH * 0.4,
                    side * wingSpread * 1.1,  wingH * 0.2,
                );
                ctx.bezierCurveTo(
                    side * wingSpread * 0.7,  wingH * 0.5,
                    side * wingSpread * 0.3,  wingH * 0.3,
                    0, 0,
                );
                ctx.closePath();

                const wingGrad = ctx.createLinearGradient(0, -wingH, 0, wingH * 0.5);
                wingGrad.addColorStop(0,   'rgba(255,240,160,0.80)');
                wingGrad.addColorStop(0.6, 'rgba(210,175,60,0.55)');
                wingGrad.addColorStop(1,   'rgba(180,140,20,0.20)');
                ctx.fillStyle = wingGrad;
                ctx.fill();
                ctx.strokeStyle = 'rgba(220,185,60,0.45)';
                ctx.lineWidth = 0.6;
                ctx.stroke();
                ctx.restore();
            }

            // Orb body
            const orb = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
            orb.addColorStop(0,   'rgba(255,248,180,1)');
            orb.addColorStop(0.5, 'rgba(220,175,40,0.95)');
            orb.addColorStop(1,   'rgba(180,130,10,0.90)');
            ctx.fillStyle = orb;
            ctx.shadowBlur  = 12;
            ctx.shadowColor = 'rgba(255,200,50,0.9)';
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();

            // Specular
            ctx.fillStyle = 'rgba(255,255,220,0.80)';
            ctx.shadowBlur = 0;
            ctx.beginPath();
            ctx.arc(x - r * 0.3, y - r * 0.35, r * 0.32, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        };

        // ── Init ──────────────────────────────────────────────────────────────
        const resize = () => {
            W = canvas.width  = canvas.offsetWidth;
            H = canvas.height = canvas.offsetHeight;
            candles = Array.from({ length: 18 }, () => makeCandle(true));
            snitch.x = rnd(W * 0.3, W * 0.7);
            snitch.y = rnd(H * 0.2, H * 0.6);
            newSnitchTarget();
        };
        const ro = new ResizeObserver(resize);
        ro.observe(canvas);
        resize();

        const tick = () => {
            ctx.clearRect(0, 0, W, H);
            for (let i = 0; i < candles.length; i++) {
                const c = candles[i];
                c.flamePhase += 0.09;
                c.sway       += c.swaySpeed;
                c.y          -= c.vy;
                c.x          += Math.sin(c.sway) * 0.25;

                if (c.y < -c.height - 20) candles[i] = makeCandle(false);

                drawCandle(c);
            }

            // ── Snitch state machine ───────────────────────────────────────
            if (!snitch.visible) {
                snitch.waitTimer--;
                if (snitch.waitTimer <= 0) {
                    snitch.visible = true;
                    snitch.x = rnd(W * 0.1, W * 0.9);
                    snitch.y = rnd(H * 0.1, H * 0.9);
                    newSnitchTarget();
                    snitch.mode      = 'hover';
                    snitch.modeTimer = rndI(120, 300);
                }
            } else {
                // Fade in/out
                if (snitch.alpha < 1) snitch.alpha = Math.min(1, snitch.alpha + 0.025);

                snitch.wingPhase += snitch.mode === 'dash' ? 0.28 : 0.13;
                snitch.modeTimer--;

                if (snitch.modeTimer <= 0) {
                    if (snitch.mode === 'hover') {
                        // Transition to dash — pick a dramatic far target
                        snitch.mode      = 'dash';
                        snitch.modeTimer = rndI(40, 90);
                        newSnitchTarget();
                    } else {
                        // End dash — hover briefly then maybe disappear
                        snitch.mode      = 'hover';
                        snitch.modeTimer = rndI(80, 220);
                        newSnitchTarget();
                        // 30% chance to vanish after hover
                        if (Math.random() < 0.30) {
                            snitch.modeTimer = rndI(40, 80);
                        }
                    }
                }

                // Check if hover timer expired and should vanish
                if (snitch.mode === 'hover' && snitch.modeTimer <= 30) {
                    if (Math.random() < 0.008) {
                        snitch.alpha     = 0;
                        snitch.visible   = false;
                        snitch.waitTimer = rndI(300, 700);
                    }
                }

                // Movement — ease toward target
                const dx   = snitch.tx - snitch.x;
                const dy   = snitch.ty - snitch.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const spd  = snitch.mode === 'dash' ? 5.5 : 0.8;
                if (dist > 2) {
                    snitch.vx += (dx / dist) * spd * 0.12;
                    snitch.vy += (dy / dist) * spd * 0.12;
                }
                // Damping
                const damp = snitch.mode === 'dash' ? 0.88 : 0.82;
                snitch.vx *= damp;
                snitch.vy *= damp;
                snitch.x  += snitch.vx;
                snitch.y  += snitch.vy;

                // Pick new hover target when close
                if (dist < 15 && snitch.mode === 'hover') newSnitchTarget();

                drawSnitch();
            }

            raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);

        return () => { cancelAnimationFrame(raf); ro.disconnect(); };
    }, []);

    return <EffectCanvas canvasRef={canvasRef} opacity={0.90} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// LotREffect — One Ring fire inscription + ember motes
// ─────────────────────────────────────────────────────────────────────────────
function LotREffect() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        let W = 0, H = 0, raf = 0, frame = 0;

        const rnd  = (a: number, b: number) => a + Math.random() * (b - a);
        const rndI = (a: number, b: number) => Math.floor(rnd(a, b));

        // Black Speech inscription — split into outer / inner arc
        const OUTER = 'ASH NAZG DURBATULÛK · ASH NAZG GIMBATUL ·';
        const INNER = 'ASH NAZG THRAKATULÛK · AGH BURZUM-ISHI KRIMPATUL ·';

        // ── Embers ────────────────────────────────────────────────────────────
        interface Ember { x: number; y: number; vx: number; vy: number; r: number; alpha: number; life: number; maxLife: number; }
        const makeEmber = (): Ember => ({
            x: rnd(W * 0.15, W * 0.85),
            y: H + rnd(0, 20),
            vx: rnd(-0.5, 0.5),
            vy: -rnd(0.4, 1.0),
            r:  rnd(1.2, 3.0),
            alpha: 0,
            life: 0, maxLife: rndI(140, 280),
        });

        let embers: Ember[] = [];

        const resize = () => {
            W = canvas.width  = canvas.offsetWidth;
            H = canvas.height = canvas.offsetHeight;
            embers = Array.from({ length: 28 }, () => {
                const e = makeEmber();
                e.life = rndI(0, e.maxLife);
                e.y    = rnd(0, H);
                return e;
            });
        };

        const ro = new ResizeObserver(resize);
        ro.observe(canvas);
        resize();

        // Helper: draw text character-by-character along a circular arc
        const drawTextOnArc = (
            text: string,
            cx: number, cy: number,
            radius: number,
            startAngle: number,   // radians, where first char sits
            arcSpan: number,       // total radians the text spans
            glowAlpha: number,
        ) => {
            const n = text.length;
            const angleStep = arcSpan / Math.max(n - 1, 1);
            const [r, g, b] = [210, 130, 20];  // molten gold-orange

            ctx.save();
            ctx.textAlign    = 'center';
            ctx.textBaseline = 'middle';

            for (let i = 0; i < n; i++) {
                const angle = startAngle + i * angleStep;
                const cx2 = cx + radius * Math.cos(angle);
                const cy2 = cy + radius * Math.sin(angle);

                ctx.save();
                ctx.translate(cx2, cy2);
                ctx.rotate(angle + Math.PI / 2);   // stand characters upright on the arc

                // Outer glow
                ctx.globalAlpha   = glowAlpha * 0.55;
                ctx.shadowBlur    = 18;
                ctx.shadowColor   = `rgba(255,120,0,1)`;
                ctx.fillStyle     = `rgba(255,180,40,1)`;
                ctx.fillText(text[i], 0, 0);

                // Crisp core
                ctx.globalAlpha   = glowAlpha;
                ctx.shadowBlur    = 4;
                ctx.fillStyle     = `rgba(${r},${g},${b},1)`;
                ctx.fillText(text[i], 0, 0);

                ctx.restore();
            }
            ctx.restore();
        };

        const tick = () => {
            frame++;
            ctx.clearRect(0, 0, W, H);

            // Breathing pulse — slow sine wave
            const pulse = 0.5 + 0.5 * Math.sin(frame * 0.018);

            const cx = W * 0.5;
            const cy = H * 0.52;  // slightly below center so text isn't behind header
            const outerR = Math.min(W, H) * 0.36;
            const innerR = outerR * 0.78;

            // ── Ring circle outline ─────────────────────────────────────────
            const ringAlpha = 0.06 + 0.06 * pulse;
            ctx.save();
            ctx.globalAlpha = ringAlpha;
            ctx.strokeStyle = `rgba(210,130,20,1)`;
            ctx.lineWidth   = 2.5;
            ctx.shadowBlur  = 22;
            ctx.shadowColor = `rgba(255,100,0,1)`;
            ctx.beginPath();
            ctx.arc(cx, cy, outerR + 12, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(cx, cy, innerR - 10, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();

            // ── Inscription text ───────────────────────────────────────────
            const textAlpha = (0.30 + 0.30 * pulse);
            const fontSize  = Math.max(11, Math.round(outerR * 0.115));
            ctx.font = `italic ${fontSize}px 'Georgia', serif`;

            // Outer arc — text runs clockwise along the top half
            drawTextOnArc(OUTER, cx, cy, outerR, -Math.PI * 0.92, Math.PI * 1.84, textAlpha);
            // Inner arc — text runs clockwise along the bottom half (flipped so it reads inward)
            drawTextOnArc(INNER, cx, cy, innerR,  Math.PI * 0.08, Math.PI * 1.84, textAlpha * 0.85);

            // ── Dark vignette to frame the ring ────────────────────────────
            const vg = ctx.createRadialGradient(cx, cy, outerR * 0.5, cx, cy, Math.max(W, H) * 0.75);
            vg.addColorStop(0,   `rgba(0,0,0,0)`);
            vg.addColorStop(0.6, `rgba(10,4,0,0.12)`);
            vg.addColorStop(1,   `rgba(10,4,0,0.40)`);
            ctx.fillStyle = vg;
            ctx.fillRect(0, 0, W, H);

            // ── Embers ──────────────────────────────────────────────────────
            for (let i = 0; i < embers.length; i++) {
                const e = embers[i];
                e.life++;
                const fi = e.maxLife * 0.15, fo = e.maxLife * 0.70;
                if (e.life < fi)       e.alpha = Math.min(0.85, e.life / fi * 0.85);
                else if (e.life > fo)  e.alpha = Math.max(0, 0.85 * (1 - (e.life - fo) / (e.maxLife - fo)));

                e.x += e.vx + Math.sin(frame * 0.04 + i) * 0.3;
                e.y += e.vy;

                if (e.life >= e.maxLife || e.y < -10) { embers[i] = makeEmber(); continue; }

                ctx.save();
                ctx.globalAlpha = e.alpha;
                const eg = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.r * 2.5);
                eg.addColorStop(0,    `rgba(255,220,100,1)`);
                eg.addColorStop(0.4,  `rgba(230,90,10,0.75)`);
                eg.addColorStop(1,    `rgba(200,40,0,0)`);
                ctx.fillStyle = eg;
                ctx.beginPath();
                ctx.arc(e.x, e.y, e.r * 2.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);

        return () => { cancelAnimationFrame(raf); ro.disconnect(); };
    }, []);

    return <EffectCanvas canvasRef={canvasRef} opacity={0.95} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// AvatarElementEffect — Air / Water / Fire / Earth particles
// ─────────────────────────────────────────────────────────────────────────────
function AvatarElementEffect() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        let W = 0, H = 0, raf = 0;

        const rnd  = (a: number, b: number) => a + Math.random() * (b - a);
        const rndI = (a: number, b: number) => Math.floor(rnd(a, b));

        // Nation colours
        const C = {
            air:   [220, 200, 120] as const,  // muted saffron-gold (Air Nomads)
            water: [ 48, 155, 220] as const,  // deep glacier blue (Water Tribe)
            fire:  [230,  70,  15] as const,  // ember orange-red (Fire Nation)
            earth: [ 80, 140,  45] as const,  // forest green (Earth Kingdom)
        };

        // ── Air petals — drifting ellipses, Air Nomad gold ─────────────────
        interface AirWisp {
            x: number; y: number;
            vx: number; vy: number;
            rot: number; rotSpeed: number;
            rx: number; ry: number;
            phase: number; phaseSpeed: number;
            alpha: number; maxAlpha: number;
            life: number; maxLife: number;
        }
        const makeAirWisp = (): AirWisp => ({
            x:          rnd(0, W),
            y:          rnd(-20, H * 0.85),
            vx:         rnd(-0.30, 0.30),
            vy:         rnd(0.25, 0.55),
            rot:        Math.random() * Math.PI * 2,
            rotSpeed:   rnd(-0.022, 0.022),
            rx:         rnd(7, 14),
            ry:         rnd(3, 6),
            phase:      Math.random() * Math.PI * 2,
            phaseSpeed: rnd(0.020, 0.040),
            alpha: 0, maxAlpha: rnd(0.45, 0.72),
            life: 0, maxLife: rndI(200, 400),
        });

        // ── Water droplets ────────────────────────────────────────────────────
        // Small spherical orbs that drift slowly vertically with a gentle lateral sway.
        interface WaterDrop {
            x: number; y: number;
            vx: number; vy: number;
            phase: number; phaseSpeed: number;
            sway: number;   // lateral sine amplitude
            r: number;      // radius
            alpha: number; maxAlpha: number;
            life: number; maxLife: number;
        }
        const makeWaterDrop = (): WaterDrop => {
            const fromTop = Math.random() < 0.6;
            return {
                x:         rnd(W * 0.05, W * 0.95),
                y:         fromTop ? -12 : H + 12,
                vx:        rnd(-0.15, 0.15),
                vy:        (fromTop ? 1 : -1) * rnd(0.25, 0.60),
                phase:     Math.random() * Math.PI * 2,
                phaseSpeed: rnd(0.02, 0.045),
                sway:      rnd(3, 8),   // small lateral oscillation
                r:         rnd(3, 7),
                alpha: 0, maxAlpha: rnd(0.50, 0.78),
                life: 0, maxLife: rndI(200, 380),
            };
        };

        // ── Fire embers ───────────────────────────────────────────────────────
        // Hot sparks rising from the bottom — shrink and dim as they rise.
        interface FireEmber {
            x: number; y: number;
            vx: number; vy: number;
            phase: number; phaseSpeed: number;
            r: number;       // initial radius
            alpha: number; maxAlpha: number;
            life: number; maxLife: number;
        }
        const makeFireEmber = (): FireEmber => ({
            x:          rnd(W * 0.08, W * 0.92),
            y:          H + rnd(0, 20),
            vx:         rnd(-0.3, 0.3),
            vy:         -rnd(0.40, 0.85),  // slow rise
            phase:      Math.random() * Math.PI * 2,
            phaseSpeed: rnd(0.035, 0.07),
            r:          rnd(2.5, 5.5),
            alpha: 0, maxAlpha: rnd(0.55, 0.82),
            life: 0, maxLife: rndI(160, 320),
        });

        // ── Earth pebbles — falling circles ─────────────────────────────────────
        interface EarthRock {
            x: number; y: number;
            vx: number; vy: number;
            r: number;
            alpha: number; maxAlpha: number;
            life: number; maxLife: number;
        }
        const makeEarthRock = (): EarthRock => ({
            x:        rnd(W * 0.06, W * 0.94),
            y:        rnd(-20, H * 0.4),
            vx:       rnd(-0.20, 0.20),
            vy:       rnd(0.30, 0.70),           // fall downward
            r:        rnd(3, 7),
            alpha: 0, maxAlpha: rnd(0.50, 0.75),
            life: 0, maxLife: rndI(240, 440),
        });

        // ── Leaves — same as LeavesEffect ────────────────────────────────────
        const AVATAR_LEAF_COLORS = ['#4a7c40','#5c9448','#6daa4f','#8fba5c','#c4a035','#b8802a','#d4b44a'];
        interface AvatarLeaf {
            x: number; y: number;
            rot: number; rotSpeed: number;
            vx: number; vy: number;
            rx: number; ry: number;
            color: string; phase: number;
        }
        const makeLeaf = (): AvatarLeaf => ({
            x:        rnd(0, W),
            y:        rnd(-20, H),
            rot:      Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.06,
            vx:       (Math.random() - 0.5) * 0.5,
            vy:       0.4 + Math.random() * 0.6,
            rx:       6 + Math.random() * 8,
            ry:       3 + Math.random() * 4,
            color:    AVATAR_LEAF_COLORS[Math.floor(Math.random() * AVATAR_LEAF_COLORS.length)],
            phase:    Math.random() * Math.PI * 2,
        });

        // Initialise pools — fewer particles, more space between them
        const AIR_N   = 14;
        const WATER_N = 12;
        const FIRE_N  = 14;
        const EARTH_N = 10;
        const LEAF_N  = 14;

        let airWisps:   AirWisp[]    = [];
        let waterDrops: WaterDrop[]  = [];
        let fireEmbers: FireEmber[]  = [];
        let earthRocks: EarthRock[]  = [];
        let leaves:     AvatarLeaf[] = [];

        const resize = () => {
            W = canvas.width  = canvas.offsetWidth;
            H = canvas.height = canvas.offsetHeight;
            airWisps   = Array.from({ length: AIR_N },   () => { const p = makeAirWisp();   p.life = rndI(0, p.maxLife); return p; });
            waterDrops = Array.from({ length: WATER_N }, () => { const p = makeWaterDrop(); p.life = rndI(0, p.maxLife); return p; });
            fireEmbers = Array.from({ length: FIRE_N },  () => { const p = makeFireEmber(); p.life = rndI(0, p.maxLife); return p; });
            earthRocks = Array.from({ length: EARTH_N }, () => { const p = makeEarthRock(); p.life = rndI(0, p.maxLife); return p; });
            leaves     = Array.from({ length: LEAF_N },  () => makeLeaf());
        };

        const ro = new ResizeObserver(resize);
        ro.observe(canvas);
        resize();

        const fadeAlpha = (p: { life: number; maxLife: number; alpha: number; maxAlpha: number }) => {
            const fi = p.maxLife * 0.18;
            const fo = p.maxLife * 0.72;
            if (p.life < fi) {
                p.alpha = Math.min(p.maxAlpha, p.life / fi * p.maxAlpha);
            } else if (p.life > fo) {
                p.alpha = Math.max(0, p.maxAlpha * (1 - (p.life - fo) / (p.maxLife - fo)));
            }
        };

        const tick = () => {
            ctx.clearRect(0, 0, W, H);

            // ── Subtle corner vignettes ───────────────────────────────────────
            const vR = Math.min(W, H) * 0.50;
            const corners = [
                { cx: 0,  cy: 0,  c: C.air   },
                { cx: W,  cy: 0,  c: C.fire  },
                { cx: 0,  cy: H,  c: C.water },
                { cx: W,  cy: H,  c: C.earth },
            ] as const;
            for (const v of corners) {
                const [r, g, b] = v.c;
                const grd = ctx.createRadialGradient(v.cx, v.cy, 0, v.cx, v.cy, vR);
                grd.addColorStop(0,   `rgba(${r},${g},${b},0.07)`);
                grd.addColorStop(0.6, `rgba(${r},${g},${b},0.02)`);
                grd.addColorStop(1,   `rgba(${r},${g},${b},0)`);
                ctx.fillStyle = grd;
                ctx.fillRect(0, 0, W, H);
            }

            // ── Air petals ────────────────────────────────────────────────────
            const [ar, ag, ab] = C.air;
            for (let i = 0; i < airWisps.length; i++) {
                const p = airWisps[i];
                p.life++;
                fadeAlpha(p);
                p.phase += p.phaseSpeed;
                p.rot += p.rotSpeed;
                p.x += p.vx + Math.sin(p.phase) * 0.40;
                p.y += p.vy;

                if (p.y > H + 20 || p.life >= p.maxLife) { airWisps[i] = makeAirWisp(); continue; }

                ctx.save();
                ctx.globalAlpha = p.alpha;
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rot);
                ctx.shadowBlur  = 8;
                ctx.shadowColor = `rgba(${ar},${ag},${ab},0.55)`;
                ctx.fillStyle   = `rgba(${ar},${ag},${ab},0.90)`;
                ctx.beginPath();
                ctx.ellipse(0, 0, p.rx, p.ry, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            // ── Water droplets ────────────────────────────────────────────────
            const [wr, wg, wb] = C.water;
            for (let i = 0; i < waterDrops.length; i++) {
                const p = waterDrops[i];
                p.life++;
                fadeAlpha(p);
                p.phase += p.phaseSpeed;
                p.x += p.vx + Math.sin(p.phase) * 0.35;  // very gentle sway
                p.y += p.vy;

                const off = p.y < -20 || p.y > H + 20;
                if (p.life >= p.maxLife || off) { waterDrops[i] = makeWaterDrop(); continue; }

                ctx.save();
                ctx.globalAlpha = p.alpha;
                // outer glow halo
                const halo = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 2.6);
                halo.addColorStop(0,   `rgba(${wr},${wg},${wb},0.45)`);
                halo.addColorStop(0.5, `rgba(${wr},${wg},${wb},0.18)`);
                halo.addColorStop(1,   `rgba(${wr},${wg},${wb},0)`);
                ctx.fillStyle = halo;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r * 2.6, 0, Math.PI * 2);
                ctx.fill();
                // solid core
                ctx.fillStyle = `rgba(${wr},${wg},${wb},0.90)`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fill();
                // specular
                ctx.fillStyle = `rgba(195,235,255,0.80)`;
                ctx.beginPath();
                ctx.arc(p.x - p.r * 0.28, p.y - p.r * 0.28, p.r * 0.36, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            // ── Fire embers ───────────────────────────────────────────────────
            const [fr, fg2, fb] = C.fire;
            for (let i = 0; i < fireEmbers.length; i++) {
                const p = fireEmbers[i];
                p.life++;
                fadeAlpha(p);
                p.phase += p.phaseSpeed;
                p.x += p.vx + Math.sin(p.phase) * 0.5;  // flicker
                p.y += p.vy;
                p.vy *= 0.9985;  // very gentle deceleration

                const off = p.y < -20;
                if (p.life >= p.maxLife || off) { fireEmbers[i] = makeFireEmber(); continue; }

                // size shrinks as ember cools
                const ageFrac = p.life / p.maxLife;
                const curR = p.r * (1 - ageFrac * 0.55);

                ctx.save();
                ctx.globalAlpha = p.alpha;
                const fg3 = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, curR * 2.5);
                fg3.addColorStop(0,    `rgba(255,230,120,1)`);      // hot white-yellow core
                fg3.addColorStop(0.4,  `rgba(${fr},${fg2},${fb},0.80)`);
                fg3.addColorStop(0.80, `rgba(160,30,5,0.28)`);
                fg3.addColorStop(1,    `rgba(160,30,5,0)`);
                ctx.fillStyle = fg3;
                ctx.beginPath();
                ctx.arc(p.x, p.y, curR * 2.5, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            // ── Earth pebbles ──────────────────────────────────────────────────
            const [er, eg, eb] = C.earth;
            for (let i = 0; i < earthRocks.length; i++) {
                const p = earthRocks[i];
                p.life++;
                fadeAlpha(p);
                p.x += p.vx;
                p.y += p.vy;

                if (p.y > H + 20 || p.life >= p.maxLife) { earthRocks[i] = makeEarthRock(); continue; }

                ctx.save();
                ctx.globalAlpha = p.alpha;

                // Outer glow halo
                const halo = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 2.4);
                halo.addColorStop(0,   `rgba(${er},${eg},${eb},0.40)`);
                halo.addColorStop(0.5, `rgba(${er},${eg},${eb},0.12)`);
                halo.addColorStop(1,   `rgba(${er},${eg},${eb},0)`);
                ctx.fillStyle = halo;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r * 2.4, 0, Math.PI * 2);
                ctx.fill();

                // Solid stone core — warm earthy gradient
                const core = ctx.createRadialGradient(p.x - p.r * 0.3, p.y - p.r * 0.3, 0, p.x, p.y, p.r);
                core.addColorStop(0,   `rgba(160,130,85,0.95)`);
                core.addColorStop(0.6, `rgba(100,78,45,0.95)`);
                core.addColorStop(1,   `rgba(65,50,28,0.90)`);
                ctx.fillStyle = core;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fill();

                // Specular highlight
                ctx.fillStyle = `rgba(190,165,115,0.65)`;
                ctx.beginPath();
                ctx.arc(p.x - p.r * 0.28, p.y - p.r * 0.28, p.r * 0.35, 0, Math.PI * 2);
                ctx.fill();

                ctx.restore();
            }

            // ── Leaves ────────────────────────────────────────────────────────
            for (const l of leaves) {
                l.phase += 0.03;
                l.rot   += l.rotSpeed;
                l.y     += l.vy;
                l.x     += l.vx + Math.sin(l.phase) * 0.4;

                if (l.y > H + 20) { l.y = -20; l.x = rnd(0, W); l.rot = Math.random() * Math.PI * 2; }
                if (l.x < -20)    l.x = W + 20;
                if (l.x > W + 20) l.x = -20;

                ctx.save();
                ctx.translate(l.x, l.y);
                ctx.rotate(l.rot);
                ctx.globalAlpha = 0.72;

                // Leaf shape: pointed tip at top (0,-ry), rounded base at (0,ry)
                // Two bezier curves form the leaf outline
                const lw = l.rx;   // half-width at widest
                const lh = l.ry * 2.4; // full height
                ctx.beginPath();
                ctx.moveTo(0, -lh * 0.5);  // tip
                ctx.bezierCurveTo( lw * 1.1, -lh * 0.15,  lw * 0.9,  lh * 0.35,  0,  lh * 0.5);  // right side
                ctx.bezierCurveTo(-lw * 0.9,  lh * 0.35, -lw * 1.1, -lh * 0.15,  0, -lh * 0.5);  // left side
                ctx.closePath();

                ctx.fillStyle   = l.color;
                ctx.shadowBlur  = 5;
                ctx.shadowColor = l.color;
                ctx.fill();

                // Center vein
                ctx.beginPath();
                ctx.moveTo(0, -lh * 0.48);
                ctx.lineTo(0,  lh * 0.45);
                ctx.strokeStyle = 'rgba(255,255,255,0.22)';
                ctx.lineWidth   = 0.6;
                ctx.shadowBlur  = 0;
                ctx.stroke();

                ctx.restore();
            }

            raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);

        return () => { cancelAnimationFrame(raf); ro.disconnect(); };
    }, []);

    return <EffectCanvas canvasRef={canvasRef} opacity={0.85} />;
}

// ─────────────────────────────────────────────────────────────────────────────

interface SettingEffectProps {
    setting: Setting;
    theme: SettingTheme;
}

export default function SettingEffect({ setting, theme }: SettingEffectProps) {
    const name = setting.name.toLowerCase();

    // ── Franchise-specific effects (highest priority) ─────────────────────
    if (name.includes('doctor who') || name.includes('dr who') || name.includes('dr. who')) {
        return <TardisVortexEffect />;
    }
    if (name.includes('avatar') && (name.includes('airbender') || name.includes('korra') || name.includes('aang'))) {
        return <AvatarElementEffect />;
    }
    if (name.includes('the last airbender') || name.includes('legend of korra')) {
        return <AvatarElementEffect />;
    }
    if (name.includes('stranger things')) {
        return <UpsideDownEffect />;
    }
    if (name.includes('resident evil') || name.includes('walking dead') ||
        name.includes('left 4 dead') || name.includes('dying light') ||
        name.includes('dead rising') || name.includes('world war z')) {
        return <ZombieEffect />;
    }
    if (name.includes('matrix')) {
        return <MatrixRain color={theme.accentStrong} opacity={0.10} fontSize={16} />;
    }
    if (name.includes('fallout')) {
        return <PipBoyEffect />;
    }
    if (name.includes('cyberpunk')) {
        return <CyberpunkGlitchEffect />;
    }
    if (name.includes('dune')) {
        return <SandstormEffect />;
    }
    if (name.includes('lord of the rings') || name.includes('lotr') ||
        name.includes('the hobbit') || name.includes('silmarillion') ||
        name.includes('middle-earth') || name.includes('middle earth')) {
        return <LotREffect />;
    }
    if (name.includes('harry potter') || name.includes('hogwarts') ||
        name.includes('wizarding world') || name.includes('fantastic beasts')) {
        return <HarryPotterEffect />;
    }

    const archetype = detectEffectArchetype(setting);

    switch (archetype) {
        case "fantasy":
            return <DragonEffect accent={theme.accent} accentStrong={theme.accentStrong} />;
        case "scifi":
            return <StarfieldEffect />;
        case "horror":
            return <EmberEffect accent={theme.accent} />;
        case "postapoc":
            return <AshEffect />;
        case "nautical":
            return <RainEffect />;
        case "mystery":
            return <SmokeEffect />;
        case "western":
            return <DustEffect accent={theme.accent} />;
        case "steampunk":
            return <SteamEffect />;
        case "adventure":
            return <LeavesEffect />;
        default:
            return null;
    }
}
