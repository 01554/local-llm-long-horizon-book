export class EnemyManager {
    _enemies = [];
    _nextId = 0;
    field;
    rng;
    constructor(field, rng) {
        this.field = field;
        this.rng = rng;
    }
    spawnEnemy(blockedCells) {
        const emptyCells = this.field.getEmptyCells();
        // Filter out blocked cells
        const candidates = emptyCells.filter(([x, y]) => !blockedCells.has(`${x},${y}`));
        if (candidates.length === 0) {
            return; // No valid positions available
        }
        // Random selection using the provided RNG function
        const index = Math.floor(this.rng() * candidates.length);
        const [x, y] = candidates[index];
        this._enemies.push({
            id: this._nextId++,
            x,
            y
        });
        this.field.placeEntity(x, y, 'enemy');
    }
    ensureMinimumEnemies(blockedCells) {
        // If no enemies exist, spawn one immediately (Req 8.3)
        if (this._enemies.length === 0) {
            this.spawnEnemy(blockedCells);
        }
    }
    removeEnemyAt(x, y) {
        const idx = this._enemies.findIndex(e => e.x === x && e.y === y);
        if (idx !== -1) {
            this.field.removeEntity(x, y);
            this._enemies.splice(idx, 1);
        }
    }
    getEnemies() {
        return [...this._enemies];
    }
    getEnemyCount() {
        return this._enemies.length;
    }
    maybeSpawnEnemy(turnCount, blockedCells) {
        // Spawn frequency increases every 30 turns (Req 8.2)
        const SPAWN_RATES = [
            [0, 0.1], // Initial rate
            [30, 0.15],
            [60, 0.2],
            [90, 0.25],
            [120, 0.3] // Cap at 30%
        ];
        let spawnRate = 0.1;
        for (const [minTurn, rate] of SPAWN_RATES) {
            if (turnCount >= minTurn) {
                spawnRate = rate;
            }
        }
        // Probability check using RNG
        if (this.rng() < spawnRate) {
            this.spawnEnemy(blockedCells);
        }
    }
    clear() {
        for (const enemy of this._enemies) {
            this.field.removeEntity(enemy.x, enemy.y);
        }
        this._enemies = [];
        this._nextId = 0;
    }
    // Test helper: set enemies directly (for testing only)
    setEnemies(enemies) {
        this.clear();
        for (const enemy of enemies) {
            this._enemies.push(enemy);
            this.field.placeEntity(enemy.x, enemy.y, 'enemy');
        }
    }
}
