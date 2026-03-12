// Constants for the reflect-shooter game
export const FIELD_WIDTH = 75;
export const FIELD_HEIGHT = 26;
export const SAFE_ZONE_ROWS = 7;
export const PLAYER_WIDTH = 5;
export const MAX_REFLECTION_COUNT = 3;
export const SCORE_PER_ENEMY = 100;
export const TICK_INTERVAL_MS = 100;
export const AUTO_FIRE_INTERVAL = 3;
// Display characters
export const PLAYER_DISPLAY = "==A==";
export const ENEMY_DISPLAY = "@";
export const BULLET_DISPLAY = {
    up: "^", down: "v", left: "<", right: ">"
};
// Direction mappings
export const OPPOSITE_DIRECTION = {
    up: "down", down: "up", left: "right", right: "left"
};
export const CLOCKWISE_90 = {
    up: "right", right: "down", down: "left", left: "up"
};
export const DIRECTION_DELTA = {
    up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0]
};
// Input actions for GameController.handleInput()
export const INPUT_ACTIONS = ["left", "right", "fire", "restart"];
// Bullet entity class (for runtime compatibility) - renamed to avoid interface conflict
export class BulletEntity {
    id;
    x;
    y;
    direction; // "up" | "down" | "left" | "right"
    reflectionCount;
    constructor(id, x, y, direction, reflectionCount) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.direction = direction;
        this.reflectionCount = reflectionCount;
    }
}

// Bullet class for runtime use (constructor available)
export class Bullet {
    id: number;
    x: number;
    y: number;
    direction: "up" | "down" | "left" | "right";
    reflectionCount: number;

    constructor(
        id: number,
        x: number,
        y: number,
        direction: "up" | "down" | "left" | "right",
        reflectionCount: number = 0
    ) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.direction = direction;
        this.reflectionCount = reflectionCount;
    }
}

// Type definitions (interfaces for TypeScript type checking)
export interface BulletData {
    id: number;
    x: number;
    y: number;
    direction: "up" | "down" | "left" | "right";
    reflectionCount: number;
}

export interface Enemy {
    id: number;
    x: number;
    y: number;
}

export interface GameState {
    playerX: number;
    playerY: number;
    playerWidth: number;
    bullets: BulletData[];
    enemies: Enemy[];
    score: number;
    turn: number;
    gameOver: boolean;
    autoFireEnabled: boolean;
}

// Runtime types (for use with --experimental-strip-types)
export const GameStateType = Symbol('GameState');
export const EnemyType = Symbol('Enemy');
export const BulletType = Symbol('Bullet');
