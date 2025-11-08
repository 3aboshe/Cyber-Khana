"use client";

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowDown, Code } from 'lucide-react';

const CyberMatrixHero = ({ onCTAClick }: { onCTAClick: () => void }) => {
    const gridRef = useRef<HTMLDivElement>(null);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (!isClient || !gridRef.current) return;

        const grid = gridRef.current;
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<>/;:"{}|!@#$%^&*()_+-=';
        let columns = 0;
        let rows = 0;
        
        const createTile = () => {
            const tile = document.createElement('div');
            tile.classList.add('tile');
            
            tile.onclick = e => {
                const target = e.target as HTMLDivElement;
                target.textContent = chars[Math.floor(Math.random() * chars.length)];
                target.classList.add('glitch');
                setTimeout(() => target.classList.remove('glitch'), 200);
            };

            return tile;
        }

        const createTiles = (quantity: number) => {
            Array.from(Array(quantity)).forEach(() => {
                grid.appendChild(createTile());
            });
        }

        const createGrid = () => {
            if (!grid) return;
            grid.innerHTML = '';
            
            const size = 50; 
            columns = Math.floor(window.innerWidth / size);
            rows = Math.floor(window.innerHeight / size);
            
            grid.style.setProperty('--columns', String(columns));
            grid.style.setProperty('--rows', String(rows));
            
            createTiles(columns * rows);

            for(const tile of Array.from(grid.children) as HTMLDivElement[]) {
                tile.textContent = chars[Math.floor(Math.random() * chars.length)];
            }
        }

        const handleMouseMove = (e: MouseEvent) => {
            if (!grid) return;
            const mouseX = e.clientX;
            const mouseY = e.clientY;
            const radius = window.innerWidth / 4;

            for(const tile of Array.from(grid.children) as HTMLDivElement[]) {
                const rect = tile.getBoundingClientRect();
                const tileX = rect.left + rect.width / 2;
                const tileY = rect.top + rect.height / 2;

                const distance = Math.sqrt(
                    Math.pow(mouseX - tileX, 2) + Math.pow(mouseY - tileY, 2)
                );

                const intensity = Math.max(0, 1 - distance / radius);
                
                tile.style.setProperty('--intensity', String(intensity));
            }
        };

        window.addEventListener('resize', createGrid);
        window.addEventListener('mousemove', handleMouseMove);
        
        createGrid();

        return () => {
            window.removeEventListener('resize', createGrid);
            window.removeEventListener('mousemove', handleMouseMove);
        };

    }, [isClient]);

    const fadeUpVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: (i: number) => ({
            opacity: 1,
            y: 0,
            transition: {
                delay: i * 0.2 + 0.5,
                duration: 0.8,
                ease: "easeInOut",
            },
        }),
    };

    return (
        <div className="relative h-screen w-full bg-zinc-900 flex flex-col items-center justify-center overflow-hidden">
            <div ref={gridRef} id="tiles"></div>
            
            <style>{`
                #tiles {
                    --intensity: 0;
                    display: grid;
                    grid-template-columns: repeat(var(--columns), 1fr);
                    grid-template-rows: repeat(var(--rows), 1fr);
                    width: 100vw;
                    height: 100vh;
                    position: absolute;
                    top: 0;
                    left: 0;
                }
                .tile {
                    position: relative;
                    cursor: pointer;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    font-family: 'Courier New', Courier, monospace;
                    font-size: 1.1rem;
                    
                    opacity: calc(0.1 + var(--intensity) * 0.9);
                    color: hsl(145, 100%, calc(50% + var(--intensity) * 50%));
                    text-shadow: 0 0 calc(var(--intensity) * 15px) hsl(145, 100%, 50%);
                    transform: scale(calc(1 + var(--intensity) * 0.2));
                    transition: color 0.2s ease, text-shadow 0.2s ease, transform 0.2s ease, opacity 0.2s ease;
                }
                .tile.glitch {
                    animation: glitch-anim 0.2s ease;
                }
                @keyframes glitch-anim {
                    0% { transform: scale(1); color: #10B981; }
                    50% { transform: scale(1.2); color: #fff; text-shadow: 0 0 10px #fff; }
                    100% { transform: scale(1); color: #10B981; }
                }
            `}</style>

            <div className="relative z-10 text-center p-6 bg-zinc-900/60 backdrop-blur-md rounded-xl border border-zinc-100/10">
                <motion.div
                    custom={0}
                    variants={fadeUpVariants}
                    initial="hidden"
                    animate="visible"
                    className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6"
                >
                    <Code className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm font-medium text-zinc-300">
                        Capture The Flag
                    </span>
                </motion.div>

                <motion.h1
                    custom={1}
                    variants={fadeUpVariants}
                    initial="hidden"
                    animate="visible"
                    className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-400"
                >
                    CyberKhana
                </motion.h1>

                <motion.p
                    custom={2}
                    variants={fadeUpVariants}
                    initial="hidden"
                    animate="visible"
                    className="max-w-2xl mx-auto text-lg text-gray-400 mb-10"
                >
                    A new arena for cybersecurity enthusiasts. Sharpen your skills, solve challenges, and climb the leaderboard.
                </motion.p>

                <motion.div
                    custom={3}
                    variants={fadeUpVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <button 
                      onClick={onCTAClick}
                      className="px-8 py-4 bg-zinc-100 text-zinc-900 font-semibold rounded-lg shadow-lg hover:bg-zinc-200 transition-colors duration-300 flex items-center gap-2 mx-auto animate-pulse"
                    >
                        Scroll to Begin
                        <ArrowDown className="h-5 w-5" />
                    </button>
                </motion.div>
            </div>
        </div>
    );
};
export default CyberMatrixHero;