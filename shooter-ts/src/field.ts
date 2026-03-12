import { SAFE_ZONE_ROWS, FIELD_WIDTH, FIELD_HEIGHT } from './models.js';
export class Field {
    minX;
    maxX;
    minY;
    maxY;
    grid; // grid[y][x], "empty" | "enemy" | "wall"
    width;
    height;
    constructor(width = FIELD_WIDTH, height = FIELD_HEIGHT) {
        this.width = width;
        this.height = height;
        this.minX = 1;
        this.maxX = width - 2;
        this.minY = 1;
        this.maxY = height - 2;
        // Initialize grid with "empty" cells
        this.grid = [];
        for (let y = 0; y < height; y++) {
            const row = [];
            for (let x = 0; x < width; x++) {
                if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
                    row.push("wall");
                }
                else {
                    row.push("empty");
                }
            }
            this.grid.push(row);
        }
    }
    /**
     * Check if a cell is a wall (boundary)
     */
    isWall(x, y) {
        return x === 0 || x === this.width - 1 || y === 0 || y === this.height - 1;
    }
    /**
     * Check if coordinates are within the playable area (excluding walls)
     */
    isWithinBounds(x, y) {
        return x >= this.minX && x <= this.maxX && y >= this.minY && y <= this.maxY;
    }
    /**
     * Check if a cell is empty (no entity present)
     */
    isEmpty(x, y) {
        if (!this.isWithinBounds(x, y)) {
            return false;
        }
        return this.grid[y][x] === "empty";
    }
    /**
     * Check if a Y coordinate is in the safe zone (bottom rows where enemies cannot spawn)
     */
    isSafeZone(y) {
        // Safe zone is the bottom SAFE_ZONE_ROWS cells of playable area
        return y > this.maxY - SAFE_ZONE_ROWS;
    }
    /**
     * Place an entity at the given position
     */
    placeEntity(x, y, entityType) {
        if (this.isWithinBounds(x, y)) {
            this.grid[y][x] = entityType;
        }
    }
    /**
     * Remove any entity at the given position
     */
    removeEntity(x, y) {
        if (this.isWithinBounds(x, y)) {
            this.grid[y][x] = "empty";
        }
    }
    /**
     * Get all empty cells in the playable area as [x, y] tuples
     */
    getEmptyCells() {
        const empty = [];
        for (let y = this.minY; y <= this.maxY; y++) {
            for (let x = this.minX; x <= this.maxX; x++) {
                if (this.grid[y][x] === "empty") {
                    empty.push([x, y]);
                }
            }
        }
        return empty;
    }
    /**
     * Clear all entities from the field (reset to empty)
     */
    clear() {
        for (let y = this.minY; y <= this.maxY; y++) {
            for (let x = this.minX; x <= this.maxX; x++) {
                this.grid[y][x] = "empty";
            }
        }
    }
    /**
     * Get the entity type at a specific position
     */
    getCell(x, y) {
        if (!this.isWithinBounds(x, y)) {
            return "wall";
        }
        return this.grid[y][x];
    }
}
