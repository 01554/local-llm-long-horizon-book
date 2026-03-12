import { SCORE_PER_ENEMY, CLOCKWISE_90 } from './models.js';
import type { Bullet } from './models.js';

export class BulletCombat {
    private field: any;
    private enemyManager: any;
    private scoreManager: any;
    private bulletManager: any;
    private rng: () => number;

    constructor(field: any, enemyManager: any, scoreManager: any, bulletManager: any, rng: () => number) {
        this.field = field;
        this.enemyManager = enemyManager;
        this.scoreManager = scoreManager;
        this.bulletManager = bulletManager;
        this.rng = rng;
    }
    handleEnemyCollisions(bullets: Bullet[]): void {
        const bulletsToRemove = new Set<number>();
        const enemiesToDestroy: { x: number; y: number }[] = [];
        for (const bullet of bullets) {
            // Check if bullet is at an enemy position
            const enemyIndex = this.enemyManager.getEnemies().findIndex(e => e.x === bullet.x && e.y === bullet.y);
            if (enemyIndex !== -1) {
                // Bullet hit an enemy
                bulletsToRemove.add(bullet.id);
                enemiesToDestroy.push({ x: bullet.x, y: bullet.y });
                // Handle splitting based on direction
                switch (bullet.direction) {
                    case 'up':
                        // Upward bullet splits into left and right
                        this.bulletManager.fireBullet(bullet.x, bullet.y, 'left');
                        this.bulletManager.fireBullet(bullet.x, bullet.y, 'right');
                        break;
                    case 'down':
                        // Downward bullet destroys enemy without splitting
                        break;
                    case 'left':
                    case 'right':
                        // Horizontal bullets split into up and down
                        this.bulletManager.fireBullet(bullet.x, bullet.y, 'up');
                        this.bulletManager.fireBullet(bullet.x, bullet.y, 'down');
                        break;
                }
            }
        }
        // Remove hit bullets from the array
        for (const id of bulletsToRemove) {
            const idx = bullets.findIndex(b => b.id === id);
            if (idx !== -1) {
                bullets.splice(idx, 1);
            }
        }
        // Destroy enemies and add score
        for (const enemyPos of enemiesToDestroy) {
            this.enemyManager.removeEnemyAt(enemyPos.x, enemyPos.y);
            this.scoreManager.addScore(SCORE_PER_ENEMY);
        }
    }

    handleBulletCollisions(bullets: Bullet[]): void {
        // Find opposite-direction bullet pairs at the same position
        const processed = new Set();
        for (let i = 0; i < bullets.length; i++) {
            if (processed.has(bullets[i].id))
                continue;
            const b1 = bullets[i];
            for (let j = i + 1; j < bullets.length; j++) {
                const b2 = bullets[j];
                // Check if at same position
                if (b1.x !== b2.x || b1.y !== b2.y)
                    continue;
                // Check if opposite directions
                let isOpposite = false;
                if ((b1.direction === 'up' && b2.direction === 'down') ||
                    (b1.direction === 'down' && b2.direction === 'up')) {
                    isOpposite = true;
                }
                else if ((b1.direction === 'left' && b2.direction === 'right') ||
                    (b1.direction === 'right' && b2.direction === 'left')) {
                    isOpposite = true;
                }
                if (!isOpposite)
                    continue;
                // Mark both as processed for this collision pair
                processed.add(b1.id);
                processed.add(b2.id);
                // Each bullet has 50% chance of destruction
                const destroyB1 = this.rng() >= 0.5;
                const destroyB2 = this.rng() >= 0.5;
                if (destroyB1) {
                    bullets.splice(i, 1);
                    // Adjust index for b2 if it was after b1
                    if (j > i) {
                        // b2's position shifted down by one
                    }
                }
                else if (!destroyB2) {
                    // Both survive - rotate clockwise and increment reflection count
                    bullets[i].direction = CLOCKWISE_90[b1.direction];
                    bullets[i].reflectionCount += 1;
                    // Find b2 in the modified array (index may have changed)
                    const b2Idx = bullets.findIndex(b => b.id === b2.id);
                    if (b2Idx !== -1) {
                        bullets[b2Idx].direction = CLOCKWISE_90[b2.direction];
                        bullets[b2Idx].reflectionCount += 1;
                    }
                }
                else {
                    // Only b2 destroyed, rotate b1
                    bullets[i].direction = CLOCKWISE_90[b1.direction];
                    bullets[i].reflectionCount += 1;
                }
                break; // Move to next bullet after processing collision
            }
        }
    }
    mergeBullets(bullets: Bullet[]): void {
        // Group bullets by (x, y, direction)
        const groups = new Map<string, Bullet[]>();
        for (const bullet of bullets) {
            const key = `${bullet.x},${bullet.y},${bullet.direction}`;
            if (!groups.has(key)) {
                groups.set(key, []);
            }
            groups.get(key)!.push(bullet);
        }
        // For each group with 2+ bullets, keep only the one with minimum reflection count
        const toRemove = new Set<Bullet>();
        for (const [key, group] of groups.entries()) {
            if (group.length >= 2) {
                let minBullet = group[0];
                for (const b of group) {
                    if (b.reflectionCount < minBullet.reflectionCount) {
                        minBullet = b;
                    }
                }
                for (const b of group) {
                    if (b !== minBullet) {
                        toRemove.add(b);
                    }
                }
            }
        }
        // Remove marked bullets
        const filtered = bullets.filter(b => !toRemove.has(b));
        // Update the original array in place
        bullets.length = 0;
        bullets.push(...filtered);
    }

    checkPlayerHit(bullets: Bullet[], playerX: number, playerY: number): boolean {
        for (const bullet of bullets) {
            // Only downward bullets at player position trigger game over
            if (bullet.direction === 'down' &&
                bullet.y === playerY &&
                bullet.x >= playerX &&
                bullet.x < playerX + 5) {
                return true;
            }
        }
        return false;
    }
}
