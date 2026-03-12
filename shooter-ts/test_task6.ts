import assert from 'node:assert';
import { Bullet, SCORE_PER_ENEMY } from './src/models.js';
import { BulletCombat } from './src/bullet_combat.js';
import { EnemyManager } from './src/enemy_manager.js';
import { ScoreManager } from './src/score_manager.js';
import { BulletManager } from './src/bullet_manager.js';

/**
 * Test file for Task 6: Bullet Combat (弾 - 的衝突と分裂)
 *
 * Tests verify:
 * - Upward bullets (^) split into left (<) and right (>) on enemy hit
 * - Horizontal bullets (<, >) split into up (^) and down (v) on enemy hit
 * - Downward bullets (v) destroy enemy without splitting
 * - Enemy is destroyed in all collision cases
 * - Score is added when enemy is destroyed
 * - Reflection count resets to 0 for spawned bullets
 */

// Helper to create a bullet using the Bullet class
function createBullet(id: number, x: number, y: number, direction: string): Bullet {
  return new Bullet(id, x, y, direction, 0);
}

// Mock field that always reports no walls for testing collisions
class TestField {
  isWall(x: number, y: number): boolean {
    return false;
  }
  isWithinBounds(x: number, y: number): boolean {
    return x >= 1 && x <= 73 && y >= 1 && y <= 24;
  }
  getEmptyCells(): [number, number][] {
    // Return a list of empty cells for testing
    const cells: [number, number][] = [];
    for (let y = 1; y <= 24; y++) {
      for (let x = 1; x <= 73; x++) {
        cells.push([x, y]);
      }
    }
    return cells;
  }
  placeEntity(x: number, y: number, entityType: string): void {
    // No-op for testing
  }
  removeEntity(x: number, y: number): void {
    // No-op for testing
  }
}

// Run tests
console.log('Running Task 6 tests: Bullet Combat (弾 - 的衝突と分裂)\n');

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void): void {
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

// Test 1: Upward bullet splits into left and right
test('Upward bullet (^) should split into left (<) and right (>) on enemy hit', () => {
  const field = new TestField();
  const rng = () => 0.5;
  const enemyManager = new EnemyManager(field, rng);
  const scoreManager = new ScoreManager();
  const bulletManager = new BulletManager(field);
  const combat = new BulletCombat(field, enemyManager, scoreManager, bulletManager, rng);

  // Set enemy at test position for collision testing
  enemyManager.setEnemies([{ id: 1, x: 37, y: 10 }]);

  const bullets: Bullet[] = [createBullet(1, 37, 10, 'up')];

  combat.handleEnemyCollisions(bullets);

  assert.strictEqual(bullets.length, 0, 'Original upward bullet should be removed');
  assert.strictEqual(scoreManager.getScore(), SCORE_PER_ENEMY, 'Score should be added once');

  const fired = bulletManager.getNewbornBullets();
  // Check that split bullets were spawned with correct directions and reflectionCount = 0
  const upBullets = fired.filter(b => b.direction === 'up');
  const downBullets = fired.filter(b => b.direction === 'down');
  const leftBullets = fired.filter(b => b.direction === 'left');
  const rightBullets = fired.filter(b => b.direction === 'right');

  // Upward bullet should split into left and right (not up/down)
  assert.strictEqual(leftBullets.length, 1, 'Should spawn one left bullet');
  assert.strictEqual(rightBullets.length, 1, 'Should spawn one right bullet');

  // Check reflection count is reset to 0
  for (const b of fired) {
    assert.strictEqual(b.reflectionCount, 0, `Split bullet ${b.direction} should have reflectionCount = 0`);
  }
});

// Test 2: Downward bullet destroys enemy without splitting
test('Downward bullet (v) should destroy enemy without splitting', () => {
  const field = new TestField();
  const rng = () => 0.5;
  const enemyManager = new EnemyManager(field, rng);
  const scoreManager = new ScoreManager();
  const bulletManager = new BulletManager(field);
  const combat = new BulletCombat(field, enemyManager, scoreManager, bulletManager, rng);

  // Set enemy at test position for collision testing
  enemyManager.setEnemies([{ id: 1, x: 37, y: 10 }]);

  const bullets: Bullet[] = [createBullet(1, 37, 10, 'down')];

  combat.handleEnemyCollisions(bullets);

  assert.strictEqual(bullets.length, 0, 'Original downward bullet should be removed');
  assert.strictEqual(scoreManager.getScore(), SCORE_PER_ENEMY, 'Score should be added once');

  const fired = bulletManager.getNewbornBullets();
  assert.strictEqual(fired.length, 0, 'No new bullets should be spawned (no split)');
});

// Test 3: Leftward bullet splits into up and down
test('Leftward bullet (<) should split into up (^) and down (v) on enemy hit', () => {
  const field = new TestField();
  const rng = () => 0.5;
  const enemyManager = new EnemyManager(field, rng);
  const scoreManager = new ScoreManager();
  const bulletManager = new BulletManager(field);
  const combat = new BulletCombat(field, enemyManager, scoreManager, bulletManager, rng);

  // Set enemy at test position for collision testing
  enemyManager.setEnemies([{ id: 1, x: 37, y: 10 }]);

  const bullets: Bullet[] = [createBullet(1, 37, 10, 'left')];

  combat.handleEnemyCollisions(bullets);

  assert.strictEqual(bullets.length, 0, 'Original leftward bullet should be removed');
  assert.strictEqual(scoreManager.getScore(), SCORE_PER_ENEMY, 'Score should be added once');

  const fired = bulletManager.getNewbornBullets();
  assert.strictEqual(fired.length, 2, 'Two new bullets should be spawned');

  // Check directions (order may vary)
  const upBullets = fired.filter(b => b.direction === 'up');
  const downBullets = fired.filter(b => b.direction === 'down');
  assert.strictEqual(upBullets.length, 1, 'Should spawn one up bullet');
  assert.strictEqual(downBullets.length, 1, 'Should spawn one down bullet');

  // Check reflection count is reset to 0
  for (const b of fired) {
    assert.strictEqual(b.reflectionCount, 0, `Split bullet ${b.direction} should have reflectionCount = 0`);
  }
});

// Test 4: Rightward bullet splits into up and down
test('Rightward bullet (>) should split into up (^) and down (v) on enemy hit', () => {
  const field = new TestField();
  const rng = () => 0.5;
  const enemyManager = new EnemyManager(field, rng);
  const scoreManager = new ScoreManager();
  const bulletManager = new BulletManager(field);
  const combat = new BulletCombat(field, enemyManager, scoreManager, bulletManager, rng);

  // Set enemy at test position for collision testing
  enemyManager.setEnemies([{ id: 1, x: 37, y: 10 }]);

  const bullets: Bullet[] = [createBullet(1, 37, 10, 'right')];

  combat.handleEnemyCollisions(bullets);

  assert.strictEqual(bullets.length, 0, 'Original rightward bullet should be removed');
  assert.strictEqual(scoreManager.getScore(), SCORE_PER_ENEMY, 'Score should be added once');

  const fired = bulletManager.getNewbornBullets();
  assert.strictEqual(fired.length, 2, 'Two new bullets should be spawned');

  // Check directions (order may vary)
  const upBullets = fired.filter(b => b.direction === 'up');
  const downBullets = fired.filter(b => b.direction === 'down');
  assert.strictEqual(upBullets.length, 1, 'Should spawn one up bullet');
  assert.strictEqual(downBullets.length, 1, 'Should spawn one down bullet');

  // Check reflection count is reset to 0
  for (const b of fired) {
    assert.strictEqual(b.reflectionCount, 0, `Split bullet ${b.direction} should have reflectionCount = 0`);
  }
});

// Test 5: Score is added correctly for each enemy destroyed
test('Score should be SCORE_PER_ENEMY (100) for each enemy destroyed', () => {
  const field = new TestField();
  const rng = () => 0.5;
  const enemyManager = new EnemyManager(field, rng);
  const scoreManager = new ScoreManager();
  const bulletManager = new BulletManager(field);
  const combat = new BulletCombat(field, enemyManager, scoreManager, bulletManager, rng);

  // Set enemy at test position for collision testing
  enemyManager.setEnemies([{ id: 1, x: 37, y: 10 }]);

  const bullets: Bullet[] = [createBullet(1, 37, 10, 'down')];

  combat.handleEnemyCollisions(bullets);

  assert.strictEqual(scoreManager.getScore(), SCORE_PER_ENEMY, `Score should be ${SCORE_PER_ENEMY}`);
});

// Test 6: Multiple bullets hitting enemies
test('Multiple bullets should each destroy an enemy and spawn split bullets', () => {
  const field = new TestField();
  const rng = () => 0.5;
  const enemyManager = new EnemyManager(field, rng);
  const scoreManager = new ScoreManager();
  const bulletManager = new BulletManager(field);
  const combat = new BulletCombat(field, enemyManager, scoreManager, bulletManager, rng);

  // Set enemies at test positions for collision testing
  enemyManager.setEnemies([
    { id: 1, x: 37, y: 10 },
    { id: 2, x: 40, y: 15 }
  ]);

  const bullets: Bullet[] = [
    createBullet(1, 37, 10, 'up'),
    createBullet(2, 40, 15, 'left')
  ];

  combat.handleEnemyCollisions(bullets);

  assert.strictEqual(bullets.length, 0, 'All original bullets should be removed');
  assert.strictEqual(scoreManager.getScore(), SCORE_PER_ENEMY * 2, 'Score should be added twice');

  const fired = bulletManager.getNewbornBullets();
  assert.strictEqual(fired.length, 4, 'Four new bullets should be spawned (2 from each)');

  // Check all split bullets have reflectionCount = 0
  for (const b of fired) {
    assert.strictEqual(b.reflectionCount, 0, `Split bullet ${b.direction} should have reflectionCount = 0`);
  }
});

// Test 7: Empty bullet list should not cause errors
test('Empty bullet list should handle gracefully', () => {
  const field = new TestField();
  const rng = () => 0.5;
  const enemyManager = new EnemyManager(field, rng);
  const scoreManager = new ScoreManager();
  const bulletManager = new BulletManager(field);
  const combat = new BulletCombat(field, enemyManager, scoreManager, bulletManager, rng);

  const bullets: Bullet[] = [];

  // Should not throw
  combat.handleEnemyCollisions(bullets);

  assert.strictEqual(scoreManager.getScore(), 0, 'Score should not change');
});

// Test 8: Bullet position is preserved in split bullets
test('Split bullets should spawn at the same position as original bullet', () => {
  const field = new TestField();
  const rng = () => 0.5;
  const enemyManager = new EnemyManager(field, rng);
  const scoreManager = new ScoreManager();
  const bulletManager = new BulletManager(field);
  const combat = new BulletCombat(field, enemyManager, scoreManager, bulletManager, rng);

  // Set enemy at test position for collision testing
  enemyManager.setEnemies([{ id: 1, x: 50, y: 20 }]);

  const bullets: Bullet[] = [createBullet(1, 50, 20, 'up')];

  combat.handleEnemyCollisions(bullets);

  const fired = bulletManager.getNewbornBullets();
  for (const b of fired) {
    assert.strictEqual(b.x, 50, `Split bullet x should be 50`);
    assert.strictEqual(b.y, 20, `Split bullet y should be 20`);
  }
});

// Test 9: Reflection count resets for split bullets (verified with actual implementation)
test('Split bullets should have reflectionCount reset to 0', () => {
  const field = new TestField();
  const rng = () => 0.5;
  const enemyManager = new EnemyManager(field, rng);
  const scoreManager = new ScoreManager();
  const bulletManager = new BulletManager(field);
  const combat = new BulletCombat(field, enemyManager, scoreManager, bulletManager, rng);

  // Set enemy at test position for collision testing
  enemyManager.setEnemies([{ id: 1, x: 37, y: 10 }]);

  // Create a bullet with high reflection count (simulated by modifying after creation)
  const bullets: Bullet[] = [createBullet(1, 37, 10, 'up')];
  bullets[0].reflectionCount = 5; // Simulate a bullet that has reflected multiple times

  combat.handleEnemyCollisions(bullets);

  const fired = bulletManager.getNewbornBullets();
  assert.strictEqual(fired.length > 0, true, 'Should have spawned bullets');

  // Verify all split bullets have reflectionCount reset to 0 (not inherited from parent)
  for (const b of fired) {
    assert.strictEqual(b.reflectionCount, 0, `Split bullet ${b.direction} should have reflectionCount = 0, got ${b.reflectionCount}`);
  }
});

// Summary
console.log('\n' + '='.repeat(50));
console.log(`Tests completed: ${passed} passed, ${failed} failed`);
console.log('='.repeat(50));

if (failed > 0) {
  process.exit(1);
}
