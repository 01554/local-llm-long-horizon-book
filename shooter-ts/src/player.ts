import { PLAYER_WIDTH } from './models.js';
export class Player {
    x;
    y;
    fieldWidth;
    fieldHeight;
    constructor(fieldWidth, fieldHeight) {
        this.fieldWidth = fieldWidth;
        this.fieldHeight = fieldHeight;
        // Initial position: center of bottom row
        // x = Math.floor(fieldWidth / 2) - Math.floor(PLAYER_WIDTH / 2)
        // y = fieldHeight - 2 (y=0 is top wall, y=fieldHeight-1 is bottom wall)
        this.x = Math.floor(fieldWidth / 2) - Math.floor(PLAYER_WIDTH / 2);
        this.y = fieldHeight - 2;
    }
    moveLeft() {
        // Cannot move left beyond minX (which is 1 in Field)
        if (this.x > 1) {
            this.x--;
        }
    }
    moveRight() {
        // Cannot move right beyond maxX - PLAYER_WIDTH + 1
        // maxX = fieldWidth - 2, so max position = fieldWidth - 2 - PLAYER_WIDTH + 1
        const maxX = this.fieldWidth - 2;
        if (this.x < maxX - PLAYER_WIDTH + 1) {
            this.x++;
        }
    }
    getPosition() {
        return [this.x, this.y];
    }
    getWidth(): number {
        return PLAYER_WIDTH;
    }

    getX(): number {
        return this.x;
    }

    getY(): number {
        return this.y;
    }

    collidesWith(x, y) {
        // Check if (x, y) is within player's width (5 cells horizontally on row y)
        if (y !== this.y) {
            return false;
        }
        for (let i = 0; i < PLAYER_WIDTH; i++) {
            if (x === this.x + i) {
                return true;
            }
        }
        return false;
    }
    reset() {
        // Restore initial center position
        this.x = Math.floor(this.fieldWidth / 2) - Math.floor(PLAYER_WIDTH / 2);
        this.y = this.fieldHeight - 2;
    }
}
