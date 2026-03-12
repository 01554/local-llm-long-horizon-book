import { Bullet, DIRECTION_DELTA, OPPOSITE_DIRECTION, MAX_REFLECTION_COUNT } from './models.js';
import type { BulletCombat } from './bullet_combat.js';

export class BulletManager {
    private _bullets: Bullet[] = [];
    private _newbornBullets: Bullet[] = [];
    private _nextId: number = 0;
    private _combat: BulletCombat | null = null;
    private field: any;
    private enemyManager: any; // For fallback collision handling
    private scoreManager: any; // For fallback collision handling
    private _player: any = null; // Player object for hit detection
    private _gameOver: boolean = false;

    constructor(field: any, enemyManager?: any, scoreManager?: any) {
        this.field = field;
        this.enemyManager = enemyManager;
        this.scoreManager = scoreManager;
    }

    setCombat(combat: BulletCombat): void {
        this._combat = combat;
    }

    fireBullet(x: number, y: number, direction: string): void {
        const bullet = new Bullet(this._nextId++, x, y, direction, 0);
        this._newbornBullets.push(bullet);
    }

    moveBullets(): void {
        const bulletsToRemove = new Set<number>();
        for (const bullet of this._bullets) {
            // Check if hitting a wall
            let nextX = bullet.x + DIRECTION_DELTA[bullet.direction][0];
            let nextY = bullet.y + DIRECTION_DELTA[bullet.direction][1];

            // First check: is the current position at player location (for downward bullets)?
            if (bullet.direction === 'down' && this._player &&
                bullet.y === this._player.y &&
                bullet.x >= this._player.x &&
                bullet.x < this._player.x + 5) {
                // Player hit! Mark for removal and set game over flag
                bulletsToRemove.add(bullet.id);
                if (this._gameOver) {
                    // Already game over, just remove the bullet
                } else {
                    this._gameOver = true;
                }
            }

            if (this.field.isWall(nextX, nextY)) {
                // Reflect: change direction and increment reflection count
                bullet.direction = OPPOSITE_DIRECTION[bullet.direction];
                bullet.reflectionCount += 1;
                // Don't move into wall - stay at current position
                if (bullet.reflectionCount >= MAX_REFLECTION_COUNT) {
                    bulletsToRemove.add(bullet.id);
                }
            } else {
                // Move to next position
                bullet.x = nextX;
                bullet.y = nextY;
                if (bullet.reflectionCount >= MAX_REFLECTION_COUNT) {
                    bulletsToRemove.add(bullet.id);
                }
            }
        }
        // Remove bullets that reached max reflection count or hit player
        for (const id of bulletsToRemove) {
            this._bullets = this._bullets.filter(b => b.id !== id);
        }
    }

    promoteNewborns(): void {
        this._bullets.push(...this._newbornBullets);
        this._newbornBullets = [];
    }

    getBullets(): Bullet[] {
        return [...this._bullets];
    }

    setPlayer(player: any): void {
        this._player = player;
    }

    setGameOver(gameOver: boolean): void {
        this._gameOver = gameOver;
    }

    isPlayerHit(): boolean {
        return this._gameOver;
    }

    clear(): void {
        this._bullets = [];
        this._newbornBullets = [];
        this._nextId = 0;
    }

    // Delegate to BulletCombat
    handleEnemyCollisions(bullets: Bullet[]): void {
        if (this._combat) {
            this._combat.handleEnemyCollisions(bullets);
        } else {
            // Fallback: implement collision logic directly when _combat is not set
            const bulletsToRemove = new Set<number>();
            const enemiesToDestroy: { x: number; y: number }[] = [];
            for (const bullet of bullets) {
                const enemyIndex = this.enemyManager.getEnemies().findIndex(e => e.x === bullet.x && e.y === bullet.y);
                if (enemyIndex !== -1) {
                    bulletsToRemove.add(bullet.id);
                    enemiesToDestroy.push({ x: bullet.x, y: bullet.y });
                    // Handle splitting based on direction
                    switch (bullet.direction) {
                        case 'up':
                            this.fireBullet(bullet.x, bullet.y, 'left');
                            this.fireBullet(bullet.x, bullet.y, 'right');
                            break;
                        case 'down':
                            // Downward bullet destroys enemy without splitting
                            break;
                        case 'left':
                        case 'right':
                            this.fireBullet(bullet.x, bullet.y, 'up');
                            this.fireBullet(bullet.x, bullet.y, 'down');
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
                this.scoreManager.addScore(100);
            }
        }
    }

    handleBulletCollisions(bullets: Bullet[]): void {
        this._combat?.handleBulletCollisions(bullets);
    }

    mergeBullets(): void {
        if (this._combat) {
            this._combat.mergeBullets(this._bullets);
        } else {
            // Fallback: implement merge logic directly when _combat is not set
            const groups = new Map<string, Bullet[]>();
            for (const bullet of this._bullets) {
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
            this._bullets = this._bullets.filter(b => !toRemove.has(b));
        }
    }

    checkPlayerHit(player: any): boolean {
        return this._combat?.checkPlayerHit(this._bullets, player.getX(), player.getY()) ?? false;
    }

    getNewbornBullets(): Bullet[] {
        return [...this._newbornBullets];
    }
}
