/**
 * ScoreManager - Manages game score
 */
export class ScoreManager {
    score = 0;
    /**
     * Add points to the score
     * @param points - Number of points to add (must be non-negative)
     * @throws Error if points is negative
     */
    addScore(points) {
        if (points < 0) {
            throw new Error('Points cannot be negative');
        }
        this.score += points;
    }
    /**
     * Get the current score
     * @returns Current score value
     */
    getScore() {
        return this.score;
    }
    /**
     * Reset the score to zero
     */
    reset() {
        this.score = 0;
    }
}
