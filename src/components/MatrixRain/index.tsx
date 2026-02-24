"use client";

import { useEffect, useRef } from "react";

interface MatrixRainProps {
    /** Primary glyph colour — defaults to Matrix green */
    color?: string;
    /** Opacity of the entire canvas layer (0–1) */
    opacity?: number;
    /** Font size in px; controls column density */
    fontSize?: number;
}

const CHARS =
    "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン" +
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&";

export default function MatrixRain({
    color = "#00ff41",
    opacity = 0.18,
    fontSize = 14,
}: MatrixRainProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animId: number;
        let drops: number[] = [];
        let frame = 0;

        const resize = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
            const cols = Math.floor(canvas.width / fontSize);
            drops = Array.from({ length: cols }, () =>
                Math.floor((Math.random() * canvas.height) / fontSize) * -1
            );
        };

        resize();
        const ro = new ResizeObserver(resize);
        ro.observe(canvas);

        const draw = () => {
            animId = requestAnimationFrame(draw);
            frame++;
            // Only advance every 4th frame — keeps the fall slow and subtle
            if (frame % 4 !== 0) return;

            // Faster fade = shorter trails
            ctx.fillStyle = "rgba(0, 0, 0, 0.12)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.font = `bold ${fontSize}px monospace`;

            for (let i = 0; i < drops.length; i++) {
                const char = CHARS[Math.floor(Math.random() * CHARS.length)];
                const y = drops[i] * fontSize;

                // Bright white head
                if (drops[i] >= 0) {
                    ctx.fillStyle = "rgba(255,255,255,0.8)";
                    ctx.fillText(char, i * fontSize, y);

                    // Second char — near-white
                    if (drops[i] > 1) {
                        ctx.fillStyle = `rgba(180, 255, 180, 0.5)`;
                        ctx.fillText(
                            CHARS[Math.floor(Math.random() * CHARS.length)],
                            i * fontSize,
                            y - fontSize
                        );
                    }

                    // Rest of trail — theme colour, dimmer
                    ctx.globalAlpha = 0.35;
                    ctx.fillStyle = color;
                    ctx.fillText(
                        CHARS[Math.floor(Math.random() * CHARS.length)],
                        i * fontSize,
                        y - fontSize * 2
                    );
                    ctx.globalAlpha = 1.0;
                }

                // Reset column randomly after it passes bottom
                if (y > canvas.height && Math.random() > 0.96) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
        };

        draw();

        return () => {
            cancelAnimationFrame(animId);
            ro.disconnect();
        };
    }, [color, fontSize]);

    return (
        <canvas
            ref={canvasRef}
            className="pointer-events-none absolute inset-0 h-full w-full"
            style={{ opacity, zIndex: 0 }}
            aria-hidden
        />
    );
}
