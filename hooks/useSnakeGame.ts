import { useState, useEffect, useCallback, useRef } from "react";

export type Point = {
    x: number;
    y: number;
};

export type GameState = "MENU" | "PLAYING" | "GAME_OVER";
export type GameMode = "UNLIMITED" | "TIMED";
export type Difficulty = "EASY" | "MEDIUM" | "HARD";

const GRID_SIZE = 20;
const TIMED_DURATION = 60;

const SPEEDS: Record<Difficulty, number> = {
    EASY: 200,
    MEDIUM: 140,
    HARD: 90
};

export function useSnakeGame() {
    const [gameState, setGameState] = useState<GameState>("MENU");
    const [gameMode, setGameMode] = useState<GameMode>("UNLIMITED");
    const [difficulty, setDifficulty] = useState<Difficulty>("MEDIUM");
    const [snake, setSnake] = useState<Point[]>([{ x: 10, y: 10 }]);
    const [food, setFood] = useState<Point>({ x: 15, y: 10 });
    const [direction, setDirection] = useState<Point>({ x: 1, y: 0 }); // Keeps UI in sync
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [timeLeft, setTimeLeft] = useState(TIMED_DURATION);
    const [isPaused, setIsPaused] = useState(false);

    const directionRef = useRef<Point>({ x: 1, y: 0 });
    const speedRef = useRef(SPEEDS["MEDIUM"]);
    const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

    const generateFood = useCallback((currentSnake: Point[]): Point => {
        let newFood: Point;
        while (true) {
            newFood = {
                x: Math.floor(Math.random() * GRID_SIZE),
                y: Math.floor(Math.random() * GRID_SIZE),
            };
            const onSnake = currentSnake.some(
                (segment) => segment.x === newFood.x && segment.y === newFood.y
            );
            if (!onSnake) break;
        }
        return newFood;
    }, []);

    const handleGameOver = useCallback(() => {
        setGameState("GAME_OVER");
        setHighScore((prev) => (score > prev ? score : prev));
        if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    }, [score]);

    const [bonusFood, setBonusFood] = useState<Point | null>(null);

    // ... (rest of state)

    // Bonus Food Timer
    useEffect(() => {
        if (!bonusFood) return;
        const timer = setTimeout(() => setBonusFood(null), 5000); // Disappear after 5s
        return () => clearTimeout(timer);
    }, [bonusFood]);

    const togglePause = useCallback(() => {
        setIsPaused((prev) => !prev);
    }, []);

    const resetGame = useCallback((mode: GameMode) => {
        setGameState("PLAYING");
        setGameMode(mode);
        setIsPaused(false);
        setSnake([{ x: 10, y: 10 }]);
        setFood(generateFood([{ x: 10, y: 10 }]));
        setBonusFood(null);

        // Reset Direction
        const initialDir = { x: 1, y: 0 };
        setDirection(initialDir);
        directionRef.current = initialDir;

        setScore(0);
        setTimeLeft(TIMED_DURATION);
        // Set speed based on current difficulty
        speedRef.current = SPEEDS[difficulty];
    }, [difficulty, generateFood]);

    const moveSnake = useCallback(() => {
        setSnake((prevSnake) => {
            const head = prevSnake[0];
            const newHead = {
                x: head.x + directionRef.current.x,
                y: head.y + directionRef.current.y,
            };

            // Wall Collision
            if (
                newHead.x < 0 ||
                newHead.x >= GRID_SIZE ||
                newHead.y < 0 ||
                newHead.y >= GRID_SIZE
            ) {
                handleGameOver();
                return prevSnake;
            }

            // Self Collision
            if (prevSnake.some((seg) => seg.x === newHead.x && seg.y === newHead.y)) {
                handleGameOver();
                return prevSnake;
            }

            const newSnake = [newHead, ...prevSnake];

            // Bonus Food Collision
            if (bonusFood && newHead.x === bonusFood.x && newHead.y === bonusFood.y) {
                setScore((s) => s + 10);
                setBonusFood(null);
            }

            // Food Collision
            if (newHead.x === food.x && newHead.y === food.y) {
                setScore((s) => s + 1);
                setFood(generateFood(newSnake));

                // 20% chance to spawn bonus food if none exists
                if (!bonusFood && Math.random() > 0.8) {
                    setBonusFood(generateFood(newSnake));
                }

                if (gameMode === "UNLIMITED") {
                    const minSpeed = 50;
                    speedRef.current = Math.max(minSpeed, speedRef.current - 2);
                }
            } else if (!(bonusFood && newHead.x === bonusFood.x && newHead.y === bonusFood.y)) {
                // Only pop tail if we DIDN'T eat any food (regular or bonus)
                // NOTE: Snake usually grows on regular food. Does user want growth on bonus?
                // Standard snake logic: eat = grow. Let's grow on both.
                // If we ate bonus food above, we continue. If we ate regular, we continue.
                // If we ate NEITHER, we pop.
                newSnake.pop();
            }

            return newSnake;
        });
    }, [food, bonusFood, gameMode, difficulty, generateFood, handleGameOver]);

    const handleDirection = useCallback((newDir: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
        switch (newDir) {
            case "UP":
                if (directionRef.current.y !== 1) {
                    directionRef.current = { x: 0, y: -1 };
                    setDirection({ x: 0, y: -1 });
                }
                break;
            case "DOWN":
                if (directionRef.current.y !== -1) {
                    directionRef.current = { x: 0, y: 1 };
                    setDirection({ x: 0, y: 1 });
                }
                break;
            case "LEFT":
                if (directionRef.current.x !== 1) {
                    directionRef.current = { x: -1, y: 0 };
                    setDirection({ x: -1, y: 0 });
                }
                break;
            case "RIGHT":
                if (directionRef.current.x !== -1) {
                    directionRef.current = { x: 1, y: 0 };
                    setDirection({ x: 1, y: 0 });
                }
                break;
        }
    }, []);

    // Input Handler
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
                e.preventDefault();
            }

            switch (e.key) {
                case "ArrowUp": handleDirection("UP"); break;
                case "ArrowDown": handleDirection("DOWN"); break;
                case "ArrowLeft": handleDirection("LEFT"); break;
                case "ArrowRight": handleDirection("RIGHT"); break;
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleDirection]);

    // Game Loop
    useEffect(() => {
        if (gameState !== "PLAYING" || isPaused) return;

        if (gameLoopRef.current) clearInterval(gameLoopRef.current);

        gameLoopRef.current = setInterval(moveSnake, speedRef.current);

        return () => {
            if (gameLoopRef.current) clearInterval(gameLoopRef.current);
        };
    }, [gameState, moveSnake, score, isPaused]);

    // Timer
    useEffect(() => {
        if (gameState === "PLAYING" && gameMode === "TIMED" && !isPaused) {
            const timer = setInterval(() => {
                setTimeLeft((t) => {
                    if (t <= 1) {
                        handleGameOver();
                        return 0;
                    }
                    return t - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [gameState, gameMode, handleGameOver, isPaused]);

    return {
        gameState,
        setGameState,
        gameMode,
        difficulty,
        setDifficulty,
        snake,
        food,
        bonusFood,
        direction,
        score,
        highScore,
        timeLeft,
        resetGame,
        handleDirection,
        isPaused,
        togglePause,
        GRID_SIZE
    };
}
