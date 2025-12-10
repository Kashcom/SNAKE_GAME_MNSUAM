"use client";

import React, { useState, useEffect } from "react";
import { Play, Pause, RotateCcw, Clock, Infinity as InfinityIcon, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useSnakeGame } from "@/hooks/useSnakeGame";

export default function SnakeGame() {
    const [mounted, setMounted] = useState(false);
    const {
        gameState,
        setGameState,
        gameMode,
        difficulty,
        setDifficulty,
        snake,
        food,
        bonusFood,
        score,
        highScore,
        timeLeft,
        resetGame,
        handleDirection,
        isPaused,
        togglePause,
        GRID_SIZE
    } = useSnakeGame();

    // Fix Hydration Error: Only render after mount
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-zinc-100 p-4 font-sans">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="h-8 w-48 bg-zinc-800 rounded mb-4"></div>
                    <div className="h-[500px] w-[500px] bg-zinc-900 rounded-lg"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-red-900 via-zinc-900 to-blue-900 text-zinc-100 p-2 font-sans relative overflow-hidden">
            {/* Background Blobs for "Moving Light in Parts" */}
            <div className="blob blob-1 mix-blend-overlay" />
            <div className="blob blob-2 mix-blend-overlay" />
            <div className="blob blob-3 mix-blend-overlay" />

            {/* Header - Hide during game */}
            {gameState !== "PLAYING" && (
                <div className="mb-6 text-center relative z-10">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-red-400 to-blue-400 bg-clip-text text-transparent mb-2">
                        NEON SNAKE
                    </h1>
                    <p className="text-zinc-400">Use Arrow Keys to Move</p>
                </div>
            )}

            <div className={`relative z-10 flex flex-col items-center justify-center w-full h-full`}>

                {/* Score Board - VISIBLE & NON-OVERLAPPING */}
                {/* Removed absolute positioning to prevent overlap */}
                <div className={`flex justify-between items-center bg-zinc-900/90 border border-zinc-800 backdrop-blur-md p-3 w-full shadow-lg transition-all z-20 mb-4 ${gameState === "PLAYING" ? 'max-w-[calc(100vmin-20px)] rounded-xl' : 'max-w-[500px] rounded-t-xl'}`}>
                    <div className="flex items-center gap-2">
                        <span className="text-zinc-400 text-sm font-medium uppercase tracking-wider">Score</span>
                        <span className="text-2xl font-bold text-white">{score}</span>
                    </div>

                    {gameMode === "TIMED" && (
                        <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-orange-400" />
                            <span className={`text-xl font-mono font-bold ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-zinc-200'}`}>
                                {timeLeft}s
                            </span>
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        <span className="text-zinc-500 text-xs uppercase">High Score</span>
                        <span className="text-zinc-300 font-bold">{highScore}</span>
                    </div>

                    {/* Pause Button */}
                    {gameState === "PLAYING" && (
                        <button
                            onClick={togglePause}
                            className="p-2 bg-zinc-800 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
                        >
                            {isPaused ? <Play size={20} /> : <Pause size={20} />}
                        </button>
                    )}
                </div>

                {/* Game Board */}
                <div
                    className="relative bg-black shadow-2xl overflow-hidden"
                    style={{
                        // Dynamic calculation to fit screen minus header height (approx 80px) + padding
                        width: gameState === "PLAYING" ? 'min(95vw, calc(100vh - 120px))' : 'min(90vw, 500px)',
                        height: gameState === "PLAYING" ? 'min(95vw, calc(100vh - 120px))' : 'min(90vw, 500px)',
                        display: 'grid',
                        gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                        gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
                        borderRadius: '0.75rem',
                        border: '1px solid #333'
                    }}
                >
                    {/* Grid Background Effect */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none"
                        style={{
                            backgroundImage: 'radial-gradient(circle, #333 1px, transparent 1px)',
                            backgroundSize: `${100 / GRID_SIZE}% ${100 / GRID_SIZE}%`
                        }}
                    />

                    {gameState === "PLAYING" && (
                        <>
                            {/* Food */}
                            <div
                                className="absolute bg-pink-500 rounded-full shadow-[0_0_10px_rgba(236,72,153,0.8)] animate-pulse"
                                style={{
                                    left: `${(food.x / GRID_SIZE) * 100}%`,
                                    top: `${(food.y / GRID_SIZE) * 100}%`,
                                    width: `${100 / GRID_SIZE}%`,
                                    height: `${100 / GRID_SIZE}%`,
                                    padding: '2px'
                                }}
                            >
                                <div className="w-full h-full bg-pink-400 rounded-full" />
                            </div>

                            {/* Bonus Food */}
                            {bonusFood && (
                                <div
                                    className="absolute bg-yellow-400 rounded-full shadow-[0_0_15px_rgba(250,204,21,0.8)] animate-bounce flex items-center justify-center z-20"
                                    style={{
                                        left: `${(bonusFood.x / GRID_SIZE) * 100}%`,
                                        top: `${(bonusFood.y / GRID_SIZE) * 100}%`,
                                        width: `${100 / GRID_SIZE}%`,
                                        height: `${100 / GRID_SIZE}%`,
                                    }}
                                >
                                    <span className="text-[8px] font-bold text-black">+10</span>
                                </div>
                            )}

                            {/* Snake */}
                            {snake.map((segment, index) => {
                                const isHead = index === 0;
                                let rotation = 0;
                                if (isHead) {
                                    const next = snake[1];
                                    if (next) {
                                        if (segment.x > next.x) rotation = 90;
                                        else if (segment.x < next.x) rotation = 270;
                                        else if (segment.y > next.y) rotation = 180;
                                        else rotation = 0;
                                    }
                                }

                                return (
                                    <div
                                        key={`${segment.x}-${segment.y}-${index}`}
                                        className={`absolute transition-all duration-100 ${isHead ? 'z-10' : 'z-0'}`}
                                        style={{
                                            left: `${(segment.x / GRID_SIZE) * 100}%`,
                                            top: `${(segment.y / GRID_SIZE) * 100}%`,
                                            width: `${100 / GRID_SIZE}%`,
                                            height: `${100 / GRID_SIZE}%`,
                                            transform: isHead ? `rotate(${rotation}deg)` : 'none'
                                        }}
                                    >
                                        {isHead ? (
                                            <div className="w-full h-full bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.5)] rounded-sm relative">
                                                <div className="absolute top-1 left-1 w-1.5 h-1.5 bg-black rounded-full" />
                                                <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-black rounded-full" />
                                                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0.5 h-2 bg-red-500" />
                                            </div>
                                        ) : (
                                            <div className="w-full h-full bg-emerald-600/90 rounded-sm scale-95" />
                                        )}
                                    </div>
                                );
                            })}
                        </>
                    )}

                    {/* Pause Overlay (Shade Background) */}
                    {isPaused && gameState === "PLAYING" && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-40 flex flex-col items-center justify-center">
                            <h2 className="text-4xl font-bold text-white mb-8 tracking-widest">PAUSED</h2>
                            <button
                                onClick={togglePause}
                                className="btn-animated group relative flex items-center justify-center gap-3 px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl shadow-lg transition-all"
                            >
                                <Play size={24} fill="currentColor" />
                                <span className="font-bold text-lg">RESUME</span>
                            </button>
                        </div>
                    )}

                    {/* Overlays - Menu without black background */}
                    {gameState === "MENU" && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-20">
                            <h2 className="text-3xl font-bold bg-gradient-to-br from-white to-zinc-500 bg-clip-text text-transparent mb-6 drop-shadow-md">
                                SELECT DIFFICULTY
                            </h2>

                            {/* Difficulty Selector */}
                            <div className="flex gap-2 mb-8 bg-zinc-900/50 p-1 rounded-lg border border-zinc-800">
                                {(["EASY", "MEDIUM", "HARD"] as const).map((d) => (
                                    <button
                                        key={d}
                                        onClick={() => setDifficulty(d)}
                                        className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${difficulty === d
                                            ? 'bg-emerald-500 text-white shadow-lg'
                                            : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                                            }`}
                                    >
                                        {d}
                                    </button>
                                ))}
                            </div>

                            <h3 className="text-xl font-semibold text-zinc-300 mb-4">CHOOSE MODE</h3>

                            <div className="flex flex-col gap-4 w-full max-w-xs">
                                <button
                                    onClick={() => resetGame("UNLIMITED")}
                                    className="btn-animated group relative flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 hover:border-blue-500 hover:bg-zinc-800 transition-all rounded-xl"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 text-blue-500">
                                            <InfinityIcon size={24} />
                                        </div>
                                        <div className="text-left">
                                            <div className="font-bold text-white">Unlimited Mode</div>
                                            <div className="text-xs text-zinc-500">Classic challenge</div>
                                        </div>
                                    </div>
                                    <Play size={20} className="text-zinc-600 group-hover:text-white" />
                                </button>

                                <button
                                    onClick={() => resetGame("TIMED")}
                                    className="btn-animated group relative flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 hover:border-purple-500 hover:bg-zinc-800 transition-all rounded-xl"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 text-purple-500">
                                            <Clock size={24} />
                                        </div>
                                        <div className="text-left">
                                            <div className="font-bold text-white">Time Interval</div>
                                            <div className="text-xs text-zinc-500">60s Score Attack</div>
                                        </div>
                                    </div>
                                    <Play size={20} className="text-zinc-600 group-hover:text-white" />
                                </button>
                            </div>
                        </div>
                    )}

                    {gameState === "GAME_OVER" && (
                        <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20">
                            <div className="mb-6">
                                <div className="text-5xl font-black text-white mb-2 tracking-tighter">GAME OVER</div>
                                <div className="text-zinc-400">Score: <span className="text-emerald-400 font-bold">{score}</span></div>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setGameState("MENU")}
                                    className="btn-animated px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
                                >
                                    Change Mode
                                </button>
                                <button
                                    onClick={() => resetGame(gameMode)}
                                    className="btn-animated px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] flex items-center gap-2"
                                >
                                    <RotateCcw size={18} />
                                    Try Again
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Mobile Controls - Always Visible on Small Screens */}
                {gameState === "PLAYING" && (
                    <div className="fixed bottom-12 left-0 right-0 z-30 flex items-center justify-center md:hidden pointer-events-none">
                        <div className="grid grid-cols-3 gap-2 bg-zinc-900/50 p-4 rounded-full backdrop-blur-sm pointer-events-auto shadow-2xl border border-zinc-800/50">
                            <div />
                            <button
                                onPointerDown={(e) => { e.preventDefault(); handleDirection("UP"); }}
                                className="w-14 h-14 bg-zinc-800/80 rounded-full flex items-center justify-center active:bg-blue-500 transition-colors shadow-lg border border-zinc-700"
                            >
                                <ChevronUp size={32} />
                            </button>
                            <div />
                            <button
                                onPointerDown={(e) => { e.preventDefault(); handleDirection("LEFT"); }}
                                className="w-14 h-14 bg-zinc-800/80 rounded-full flex items-center justify-center active:bg-blue-500 transition-colors shadow-lg border border-zinc-700"
                            >
                                <ChevronLeft size={32} />
                            </button>
                            <button
                                onPointerDown={(e) => { e.preventDefault(); handleDirection("DOWN"); }}
                                className="w-14 h-14 bg-zinc-800/80 rounded-full flex items-center justify-center active:bg-blue-500 transition-colors shadow-lg border border-zinc-700"
                            >
                                <ChevronDown size={32} />
                            </button>
                            <button
                                onPointerDown={(e) => { e.preventDefault(); handleDirection("RIGHT"); }}
                                className="w-14 h-14 bg-zinc-800/80 rounded-full flex items-center justify-center active:bg-blue-500 transition-colors shadow-lg border border-zinc-700"
                            >
                                <ChevronRight size={32} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
