import { Field } from './field.js';
import { Player } from './player.js';
import { BulletManager } from './bullet_manager.js';
import { EnemyManager } from './enemy_manager.js';
import { ScoreManager } from './score_manager.js';

export class GameController {
  autoFireEnabled = false;
  fireCooldown = 0;
  turnCount = 0;
  gameOver = false;

  field: Field;
  player: Player;
  bulletManager: BulletManager;
  enemyManager: EnemyManager;
  scoreManager: ScoreManager;

  constructor(
    field: Field,
    player: Player,
    bulletManager: BulletManager,
    enemyManager: EnemyManager,
    scoreManager: ScoreManager
  ) {
    this.field = field;
    this.player = player;
    this.bulletManager = bulletManager;
    this.enemyManager = enemyManager;
    this.scoreManager = scoreManager;

    // Initialize BulletManager with references for fallback handling
    if (bulletManager && !bulletManager['enemyManager']) {
      bulletManager['enemyManager'] = enemyManager;
      bulletManager['scoreManager'] = scoreManager;
    }
  }

  tick(): void {
    // Step 1: Promote newborns to active bullets (so they can move and collide)
    this.bulletManager.promoteNewborns();

    // Update player position for hit detection
    const [playerX, playerY] = this.player.getPosition();
    this.bulletManager.setPlayer({ x: playerX, y: playerY });

    // Step 2: Move all bullets (including previously newborn, including wall reflection)
    this.bulletManager.moveBullets();

    // Check for player hit during bullet movement
    if (this.bulletManager.isPlayerHit()) {
      this.gameOver = true;
    }

    // Step 3: Handle bullet-enemy collisions
    const bullets = this.bulletManager.getBullets();
    this.bulletManager.handleEnemyCollisions(bullets);

    // Step 4: Handle bullet-bullet collisions
    this.bulletManager.handleBulletCollisions(this.bulletManager.getBullets());

    // Step 5: Merge same-direction bullets at same position
    this.bulletManager.mergeBullets();

    // Step 6: Build blockedCells set (player 5 cells + all bullet positions + existing enemies + safe zone)
    const blockedCells = new Set<string>();

    // Player's 5 cells
    const [px, py] = this.player.getPosition();
    for (let i = 0; i < this.player.getWidth(); i++) {
      blockedCells.add(`${px + i},${py}`);
    }

    // All bullet positions
    for (const b of this.bulletManager.getBullets()) {
      blockedCells.add(`${b.x},${b.y}`);
    }

    // Existing enemies
    for (const e of this.enemyManager.getEnemies()) {
      blockedCells.add(`${e.x},${e.y}`);
    }

    // Step 7: Ensure minimum enemies if none exist
    this.enemyManager.ensureMinimumEnemies(blockedCells);

    // Step 8: Probabilistic additional spawning
    this.enemyManager.maybeSpawnEnemy(this.turnCount, blockedCells);

    // Step 9: Check player hit by downward bullet
    if (this.bulletManager.checkPlayerHit(this.player)) {
      this.gameOver = true;
    }

    // Step 10: Auto-fire handling
    if (this.autoFireEnabled) {
      if (this.fireCooldown === 0) {
        const [playerX, playerY] = this.player.getPosition();
        this.bulletManager.fireBullet(playerX + Math.floor(this.player.getWidth() / 2), playerY - 1, 'up');
        this.fireCooldown = 3; // AUTO_FIRE_INTERVAL
      } else {
        this.fireCooldown -= 1;
      }
    }

    // Step 11: Increment turn count
    this.turnCount += 1;
  }

  handleInput(action: string): void {
    if (action === 'left') {
      this.player.moveLeft();
    } else if (action === 'right') {
      this.player.moveRight();
    } else if (action === 'fire') {
      // Toggle auto-fire ON/OFF
      this.autoFireEnabled = !this.autoFireEnabled;
      // Reset cooldown when enabling auto-fire for immediate firing
      if (this.autoFireEnabled) {
        this.fireCooldown = 0;
      }
    } else if (action === 'restart') {
      // Only valid when gameOver
      if (this.gameOver) {
        this.reset();
      }
    }
  }

  isGameOver(): boolean {
    return this.gameOver;
  }

  reset(): void {
    this.autoFireEnabled = false;
    this.fireCooldown = 0;
    this.turnCount = 0;
    this.gameOver = false;
    this.player.reset();
    this.bulletManager.clear();
    this.scoreManager.reset();
    // Clear enemies and spawn one fresh enemy
    const blockedCells = new Set<string>();
    this.enemyManager.clear();
    this.enemyManager.spawnEnemy(blockedCells);
  }

  getState(): any {
    return {
      playerX: this.player.getPosition()[0],
      playerY: this.player.getPosition()[1],
      playerWidth: this.player.getWidth(),
      bullets: this.bulletManager.getBullets(),
      enemies: this.enemyManager.getEnemies(),
      score: this.scoreManager.getScore(),
      turn: this.turnCount,
      gameOver: this.gameOver,
      autoFireEnabled: this.autoFireEnabled
    };
  }
}
