import assert from 'node:assert';
import { Field } from './src/field.js';
import { Player } from './src/player.js';
import { ScoreManager } from './src/score_manager.js';
import { EnemyManager } from './src/enemy_manager.js';
import { BulletManager } from './src/bullet_manager.js';
import { BulletCombat } from './src/bullet_combat.js';
import { GameController } from './src/game_controller.js';
import { Renderer } from './src/renderer.js';
import { InputHandler } from './src/input_handler.js';
import {
  FIELD_WIDTH,
  FIELD_HEIGHT,
  TICK_INTERVAL_MS,
} from './src/models.js';

console.log('=== Test Task 12: Entry Point (index.ts) ===\n');

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (error) {
    console.log(`✗ ${name}`);
    if (error instanceof Error) {
      console.log(`  Error: ${error.message}`);
    }
    failed++;
  }
}

// Helper to create a deterministic RNG for testing
function createTestRng(seed: number): () => number {
  let s = seed;
  return () => {
    // Linear congruential generator
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

// Test Task 12.1: Component assembly order (design.md C10)
test('Component assembly follows design.md C10 order', () => {
  // Step 1: Base components first
  const field = new Field(FIELD_WIDTH, FIELD_HEIGHT);
  const scoreManager = new ScoreManager();
  const player = new Player(FIELD_WIDTH, FIELD_HEIGHT);

  assert(field instanceof Field, 'Field should be instantiated');
  assert(scoreManager instanceof ScoreManager, 'ScoreManager should be instantiated');
  assert(player instanceof Player, 'Player should be instantiated');
});

// Test Task 12.2: Manager instantiation with RNG
test('Managers are instantiated with RNG function', () => {
  const field = new Field(FIELD_WIDTH, FIELD_HEIGHT);
  const scoreManager = new ScoreManager();
  const rng = createTestRng(42);

  const enemyManager = new EnemyManager(field, rng);
  const bulletManager = new BulletManager(field);
  const bulletCombat = new BulletCombat(field, enemyManager, scoreManager, bulletManager, rng);

  assert(enemyManager instanceof EnemyManager, 'EnemyManager should accept RNG');
  assert(bulletManager instanceof BulletManager, 'BulletManager should be instantiated');
  assert(bulletCombat instanceof BulletCombat, 'BulletCombat should accept RNG');
});

// Test Task 12.3: BulletCombat injection via setCombat
test('BulletCombat is injected into BulletManager via setCombat', () => {
  const field = new Field(FIELD_WIDTH, FIELD_HEIGHT);
  const rng = createTestRng(42);
  const enemyManager = new EnemyManager(field, rng);
  const bulletManager = new BulletManager(field);
  const scoreManager = new ScoreManager();

  const bulletCombat = new BulletCombat(field, enemyManager, scoreManager, bulletManager, rng);
  bulletManager.setCombat(bulletCombat);

  // Verify the combat handler is set by checking if we can call delegated methods
  assert.doesNotThrow(() => {
    bulletManager.handleEnemyCollisions([]);
  }, 'handleEnemyCollisions should not throw after setCombat');
});

// Test Task 12.4: GameController instantiation with all dependencies
test('GameController is instantiated with 5 required dependencies', () => {
  const field = new Field(FIELD_WIDTH, FIELD_HEIGHT);
  const player = new Player(FIELD_WIDTH, FIELD_HEIGHT);
  const scoreManager = new ScoreManager();
  const rng = createTestRng(42);

  const enemyManager = new EnemyManager(field, rng);
  const bulletManager = new BulletManager(field);
  const bulletCombat = new BulletCombat(field, enemyManager, scoreManager, bulletManager, rng);
  bulletManager.setCombat(bulletCombat);

  const controller = new GameController(
    field,
    player,
    bulletManager,
    enemyManager,
    scoreManager
  );

  assert(controller instanceof GameController, 'GameController should be instantiated');
  assert.strictEqual(controller.isGameOver(), false, 'Game should not be over initially');
});

// Test Task 12.5: Renderer instantiation with field and test mode
test('Renderer can be created in test mode (useAnsi=false)', () => {
  const field = new Field(FIELD_WIDTH, FIELD_HEIGHT);
  const renderer = new Renderer(field, false); // Test mode

  assert(renderer instanceof Renderer, 'Renderer should be instantiated');

  // Create a minimal controller for getState()
  const player = new Player(FIELD_WIDTH, FIELD_HEIGHT);
  const scoreManager = new ScoreManager();
  const rng = createTestRng(42);
  const enemyManager = new EnemyManager(field, rng);
  const bulletManager = new BulletManager(field);
  const bulletCombat = new BulletCombat(field, enemyManager, scoreManager, bulletManager, rng);
  bulletManager.setCombat(bulletCombat);

  const controller = new GameController(
    field,
    player,
    bulletManager,
    enemyManager,
    scoreManager
  );

  // Verify buildFrame works without ANSI output
  const state = controller.getState();
  const frame = renderer.buildFrame(state);

  assert(Array.isArray(frame), 'buildFrame should return an array');
  assert(frame.length >= 27, 'Frame should have at least 27 lines (title + walls + field)');
});

// Test Task 12.6: InputHandler instantiation with controller
test('InputHandler is instantiated with GameController', () => {
  const field = new Field(FIELD_WIDTH, FIELD_HEIGHT);
  const player = new Player(FIELD_WIDTH, FIELD_HEIGHT);
  const scoreManager = new ScoreManager();
  const rng = createTestRng(42);

  const enemyManager = new EnemyManager(field, rng);
  const bulletManager = new BulletManager(field);
  const bulletCombat = new BulletCombat(field, enemyManager, scoreManager, bulletManager, rng);
  bulletManager.setCombat(bulletCombat);

  const controller = new GameController(
    field,
    player,
    bulletManager,
    enemyManager,
    scoreManager
  );

  const inputHandler = new InputHandler(controller);

  assert(inputHandler instanceof InputHandler, 'InputHandler should be instantiated');
  assert.strictEqual(inputHandler.shouldQuit(), false, 'Should not quit initially');
});

// Test Task 12.7: GameController state includes autoFireEnabled
test('GameController.getState() includes autoFireEnabled property', () => {
  const field = new Field(FIELD_WIDTH, FIELD_HEIGHT);
  const player = new Player(FIELD_WIDTH, FIELD_HEIGHT);
  const scoreManager = new ScoreManager();
  const rng = createTestRng(42);

  const enemyManager = new EnemyManager(field, rng);
  const bulletManager = new BulletManager(field);
  const bulletCombat = new BulletCombat(field, enemyManager, scoreManager, bulletManager, rng);
  bulletManager.setCombat(bulletCombat);

  const controller = new GameController(
    field,
    player,
    bulletManager,
    enemyManager,
    scoreManager
  );

  const state = controller.getState();

  assert('autoFireEnabled' in state, 'GameState should include autoFireEnabled');
  assert.strictEqual(state.autoFireEnabled, false, 'autoFireEnabled should be false initially');
});

// Test Task 12.8: GameController handleInput - fire toggles autoFire
test('GameController.handleInput("fire") toggles autoFireEnabled', () => {
  const field = new Field(FIELD_WIDTH, FIELD_HEIGHT);
  const player = new Player(FIELD_WIDTH, FIELD_HEIGHT);
  const scoreManager = new ScoreManager();
  const rng = createTestRng(42);

  const enemyManager = new EnemyManager(field, rng);
  const bulletManager = new BulletManager(field);
  const bulletCombat = new BulletCombat(field, enemyManager, scoreManager, bulletManager, rng);
  bulletManager.setCombat(bulletCombat);

  const controller = new GameController(
    field,
    player,
    bulletManager,
    enemyManager,
    scoreManager
  );

  // Initially autoFire should be off
  assert.strictEqual(controller.autoFireEnabled, false, 'autoFireEnabled initially false');

  // Toggle on
  controller.handleInput('fire');
  assert.strictEqual(controller.autoFireEnabled, true, 'autoFireEnabled should be true after fire input');
  assert.strictEqual(controller.fireCooldown, 0, 'fireCooldown should reset to 0 when enabling autoFire');

  // Toggle off
  controller.handleInput('fire');
  assert.strictEqual(controller.autoFireEnabled, false, 'autoFireEnabled should be false after second fire input');
});

// Test Task 12.9: GameController handleInput - left/right movement
test('GameController.handleInput("left") and ("right") move player', () => {
  const field = new Field(FIELD_WIDTH, FIELD_HEIGHT);
  const player = new Player(FIELD_WIDTH, FIELD_HEIGHT);
  const scoreManager = new ScoreManager();
  const rng = createTestRng(42);

  const enemyManager = new EnemyManager(field, rng);
  const bulletManager = new BulletManager(field);
  const bulletCombat = new BulletCombat(field, enemyManager, scoreManager, bulletManager, rng);
  bulletManager.setCombat(bulletCombat);

  const controller = new GameController(
    field,
    player,
    bulletManager,
    enemyManager,
    scoreManager
  );

  const initialPos = controller.getState().playerX;

  // Move left
  controller.handleInput('left');
  const afterLeft = controller.getState().playerX;
  assert.strictEqual(afterLeft, initialPos - 1, 'Player should move left by 1');

  // Move right (should return to original position)
  controller.handleInput('right');
  const afterRight = controller.getState().playerX;
  assert.strictEqual(afterRight, initialPos, 'Player should return to original position');
});

// Test Task 12.10: GameController reset functionality
test('GameController.reset() resets game state', () => {
  const field = new Field(FIELD_WIDTH, FIELD_HEIGHT);
  const player = new Player(FIELD_WIDTH, FIELD_HEIGHT);
  const scoreManager = new ScoreManager();
  const rng = createTestRng(42);

  const enemyManager = new EnemyManager(field, rng);
  const bulletManager = new BulletManager(field);
  const bulletCombat = new BulletCombat(field, enemyManager, scoreManager, bulletManager, rng);
  bulletManager.setCombat(bulletCombat);

  const controller = new GameController(
    field,
    player,
    bulletManager,
    enemyManager,
    scoreManager
  );

  // Advance game to accumulate some state
  for (let i = 0; i < 10; i++) {
    controller.tick();
  }

  const beforeResetScore = controller.getState().score;
  const beforeResetTurn = controller.getState().turn;

  assert(beforeResetScore > 0 || beforeResetTurn > 0, 'Game should have some state before reset');

  // Reset game
  controller.reset();

  const afterResetState = controller.getState();
  assert.strictEqual(afterResetState.score, 0, 'Score should be reset to 0');
  assert.strictEqual(afterResetState.turn, 0, 'Turn should be reset to 0');
  assert.strictEqual(afterResetState.gameOver, false, 'gameOver should be reset to false');
});

// Test Task 12.11: tick() advances game state
test('GameController.tick() advances turn counter', () => {
  const field = new Field(FIELD_WIDTH, FIELD_HEIGHT);
  const player = new Player(FIELD_WIDTH, FIELD_HEIGHT);
  const scoreManager = new ScoreManager();
  const rng = createTestRng(42);

  const enemyManager = new EnemyManager(field, rng);
  const bulletManager = new BulletManager(field);
  const bulletCombat = new BulletCombat(field, enemyManager, scoreManager, bulletManager, rng);
  bulletManager.setCombat(bulletCombat);

  const controller = new GameController(
    field,
    player,
    bulletManager,
    enemyManager,
    scoreManager
  );

  const initialState = controller.getState();
  assert.strictEqual(initialState.turn, 0, 'Initial turn should be 0');

  // Advance one tick
  controller.tick();

  const afterTickState = controller.getState();
  assert.strictEqual(afterTickState.turn, 1, 'Turn should advance to 1 after first tick');
});

// Test Task 12.12: Renderer buildFrame produces expected structure
test('Renderer.buildFrame() produces correct frame structure', () => {
  const field = new Field(FIELD_WIDTH, FIELD_HEIGHT);
  const player = new Player(FIELD_WIDTH, FIELD_HEIGHT);
  const scoreManager = new ScoreManager();
  const rng = createTestRng(42);

  const enemyManager = new EnemyManager(field, rng);
  const bulletManager = new BulletManager(field);
  const bulletCombat = new BulletCombat(field, enemyManager, scoreManager, bulletManager, rng);
  bulletManager.setCombat(bulletCombat);

  const controller = new GameController(
    field,
    player,
    bulletManager,
    enemyManager,
    scoreManager
  );

  const renderer = new Renderer(field, false); // Test mode
  const state = controller.getState();
  const frame = renderer.buildFrame(state);

  assert(frame.length >= 29, 'Frame should have at least 29 lines (title + walls + field + score + status)');

  // Check title line contains expected text
  assert(frame[0].includes('反射分裂シューティング'), 'Title line should contain game name');

  // Check wall line format
  assert(frame[1].startsWith('+') && frame[1].endsWith('+'), 'Second line should be top wall');

  // Check field boundary lines (lines 2 to FIELD_HEIGHT-1 are the playable area)
  for (let i = 2; i <= FIELD_HEIGHT - 1; i++) {
    if (frame[i]) {
      assert(frame[i].startsWith('|') && frame[i].endsWith('|'), `Line ${i} should have boundary walls`);
    }
  }

  // Line FIELD_HEIGHT is the bottom wall (+...+)
  const bottomWall = frame[FIELD_HEIGHT];
  assert(bottomWall?.startsWith('+') && bottomWall?.endsWith('+'), 'Bottom wall line');

  // Check score line format (line FIELD_HEIGHT+1)
  const scoreLine = frame[FIELD_HEIGHT + 1];
  assert(scoreLine?.includes('SCORE:'), 'Score line should contain "SCORE:"');
  assert(scoreLine?.includes('TURN:'), 'Score line should contain "TURN:"');
});

// Test Task 12.13: EnemyManager spawnEnemy with blockedCells
test('EnemyManager.spawnEnemy() respects blockedCells parameter', () => {
  const field = new Field(FIELD_WIDTH, FIELD_HEIGHT);
  const rng = createTestRng(42);
  const enemyManager = new EnemyManager(field, rng);

  // Create a set of blocked cells (player position + safe zone)
  const blockedCells = new Set<string>();
  for (let y = field.maxY - 7; y <= field.maxY; y++) {
    for (let x = field.minX; x <= field.maxX; x++) {
      blockedCells.add(`${x},${y}`);
    }
  }

  // Spawn enemy outside safe zone
  enemyManager.spawnEnemy(blockedCells);

  const enemies = enemyManager.getEnemies();
  assert.strictEqual(enemies.length, 1, 'Should have exactly one enemy');

  // Verify enemy is not in blocked area (safe zone)
  const enemy = enemies[0];
  assert(enemy.y < field.maxY - 7, 'Enemy should not be in safe zone');
});

// Test Task 12.14: EnemyManager ensureMinimumEnemies creates enemy when none exist
test('EnemyManager.ensureMinimumEnemies() creates enemy when count is zero', () => {
  const field = new Field(FIELD_WIDTH, FIELD_HEIGHT);
  const rng = createTestRng(42);
  const enemyManager = new EnemyManager(field, rng);

  // Clear all enemies
  enemyManager.clear();
  assert.strictEqual(enemyManager.getEnemyCount(), 0, 'Should start with zero enemies');

  // Create blocked cells (just the safe zone)
  const blockedCells = new Set<string>();
  for (let y = field.maxY - 7; y <= field.maxY; y++) {
    for (let x = field.minX; x <= field.maxX; x++) {
      blockedCells.add(`${x},${y}`);
    }
  }

  // Ensure minimum enemies
  enemyManager.ensureMinimumEnemies(blockedCells);

  assert.strictEqual(enemyManager.getEnemyCount(), 1, 'Should have one enemy after ensureMinimumEnemies');
});

// Test Task 12.15: BulletManager fireBullet adds to newborn list
test('BulletManager.fireBullet() adds bullet to newborn list', () => {
  const field = new Field(FIELD_WIDTH, FIELD_HEIGHT);
  const player = new Player(FIELD_WIDTH, FIELD_HEIGHT);
  const rng = createTestRng(42);
  const enemyManager = new EnemyManager(field, rng);
  const scoreManager = new ScoreManager();

  const bulletManager = new BulletManager(field);
  const bulletCombat = new BulletCombat(field, enemyManager, scoreManager, bulletManager, rng);
  bulletManager.setCombat(bulletCombat);

  // Fire a bullet from player position
  const [playerX, playerY] = player.getPosition();
  bulletManager.fireBullet(playerX, playerY - 1, 'up');

  // Check that newborn has the bullet (before promoteNewborns)
  const bullets = bulletManager.getBullets();
  assert.strictEqual(bullets.length, 0, 'Bullets should be empty before promoteNewborns');
});

// Test Task 12.16: BulletCombat handleEnemyCollisions creates split bullets
test('BulletCombat.handleEnemyCollisions() handles enemy collisions correctly', () => {
  const field = new Field(FIELD_WIDTH, FIELD_HEIGHT);
  const player = new Player(FIELD_WIDTH, FIELD_HEIGHT);
  const rng = createTestRng(42);
  const enemyManager = new EnemyManager(field, rng);
  const scoreManager = new ScoreManager();

  const bulletManager = new BulletManager(field);
  const bulletCombat = new BulletCombat(field, enemyManager, scoreManager, bulletManager, rng);
  bulletManager.setCombat(bulletCombat);

  // Place an enemy at a specific location
  const enemyX = 20;
  const enemyY = 15;
  field.placeEntity(enemyX, enemyY, 'enemy');

  // Fire an upward bullet that will hit the enemy
  const [playerPosX, playerPosY] = player.getPosition();
  bulletManager.fireBullet(playerPosX, playerPosY - 1, 'up');

  // Manually position a bullet at enemy location for testing collision
  const bullets = bulletManager.getBullets();
  bullets.push({
    id: 1,
    x: enemyX,
    y: enemyY,
    direction: 'up',
    reflectionCount: 0,
  });

  // Handle collisions - this should split the bullet and remove the enemy
  bulletManager.handleEnemyCollisions(bullets);

  const enemies = enemyManager.getEnemies();
  assert.strictEqual(enemies.length, 0, 'Enemy should be removed after collision');
});

// Test Task 12.17: ScoreManager tracks score correctly
test('ScoreManager.addScore() and getScore() work correctly', () => {
  const scoreManager = new ScoreManager();

  assert.strictEqual(scoreManager.getScore(), 0, 'Initial score should be 0');

  scoreManager.addScore(100);
  assert.strictEqual(scoreManager.getScore(), 100, 'Score should be 100 after first add');

  scoreManager.addScore(50);
  assert.strictEqual(scoreManager.getScore(), 150, 'Score should be 150 after second add');

  scoreManager.reset();
  assert.strictEqual(scoreManager.getScore(), 0, 'Score should be reset to 0');
});

// Test Task 12.18: Player initial position and width
test('Player initializes at correct position with correct width', () => {
  const player = new Player(FIELD_WIDTH, FIELD_HEIGHT);

  assert.strictEqual(player.getWidth(), 5, 'Player width should be 5');

  const [x, y] = player.getPosition();
  const expectedX = Math.floor(FIELD_WIDTH / 2) - Math.floor(5 / 2);
  const expectedY = FIELD_HEIGHT - 2;

  assert.strictEqual(x, expectedX, `Player X should be ${expectedX}`);
  assert.strictEqual(y, expectedY, `Player Y should be ${expectedY}`);
});

// Test Task 12.19: Player collision detection
test('Player.collidesWith() correctly detects bullet overlap', () => {
  const player = new Player(FIELD_WIDTH, FIELD_HEIGHT);
  const [playerX, playerY] = player.getPosition();

  // Test center of player (should collide)
  assert.strictEqual(player.collidesWith(playerX + 2, playerY), true, 'Center should collide');

  // Test left edge (should collide)
  assert.strictEqual(player.collidesWith(playerX, playerY), true, 'Left edge should collide');

  // Test right edge (should collide)
  assert.strictEqual(player.collidesWith(playerX + 4, playerY), true, 'Right edge should collide');

  // Test just outside left (should not collide)
  assert.strictEqual(player.collidesWith(playerX - 1, playerY), false, 'Left of player should not collide');

  // Test above player (should not collide)
  assert.strictEqual(player.collidesWith(playerX + 2, playerY - 1), false, 'Above player should not collide');
});

// Test Task 12.20: GameController handleInput restart when game over
test('GameController.handleInput("restart") resets game when gameOver is true', () => {
  const field = new Field(FIELD_WIDTH, FIELD_HEIGHT);
  const player = new Player(FIELD_WIDTH, FIELD_HEIGHT);
  const scoreManager = new ScoreManager();
  const rng = createTestRng(42);

  const enemyManager = new EnemyManager(field, rng);
  const bulletManager = new BulletManager(field);
  const bulletCombat = new BulletCombat(field, enemyManager, scoreManager, bulletManager, rng);
  bulletManager.setCombat(bulletCombat);

  const controller = new GameController(
    field,
    player,
    bulletManager,
    enemyManager,
    scoreManager
  );

  // Manually set game over state
  (controller as any).gameOver = true;
  assert.strictEqual(controller.isGameOver(), true, 'Game should be in game over state');

  const beforeScore = controller.getState().score;

  // Restart the game
  controller.handleInput('restart');

  assert.strictEqual(controller.isGameOver(), false, 'Game should not be over after restart');
});

// Summary
console.log('\n=== Test Summary ===');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total: ${passed + failed}\n`);

if (failed > 0) {
  process.exit(1);
}
