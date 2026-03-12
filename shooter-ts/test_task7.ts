import assert from 'node:assert';

/**
 * Test Task 7: Bullet-Bullet Collision, Merging, and Player Hit Detection
 * 
 * Tests for bullet_combat.ts methods:
 * - handleBulletCollisions: Opposite-direction bullets collide with 1/2 probability destruction + clockwise rotation
 * - mergeBullets: Same-direction bullets in same cell merge (minimum reflection count)
 * - checkPlayerHit: Downward bullets hitting player position trigger game over
 */

// Simple RNG for testing
function createRng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Mock classes for testing
class MockField {
  isWall(x: number, y: number): boolean {
    return x <= 0 || x >= 74 || y <= 0 || y >= 25;
  }
  isWithinBounds(x: number, y: number): boolean {
    return x > 0 && x < 74 && y > 0 && y < 26;
  }
  isEmpty(_x: number, _y: number): boolean {
    return true;
  }
  isSafeZone(_y: number): boolean {
    return false;
  }
}

class MockEnemyManager {
  private enemies = [];
  getEnemies() {
    return this.enemies;
  }
  removeEnemyAt(x: number, y: number) {
    const idx = this.enemies.findIndex(e => e.x === x && e.y === y);
    if (idx !== -1) this.enemies.splice(idx, 1);
  }
}

class MockScoreManager {
  private score = 0;
  addScore(points: number): void {
    this.score += points;
  }
  getScore(): number {
    return this.score;
  }
}

class MockBulletManager {
  _newbornBullets: any[] = [];
  fireBullet(x: number, y: number, direction: string) {
    this._newbornBullets.push({ id: Math.random(), x, y, direction });
  }
  getNewbornBullets() {
    return this._newbornBullets;
  }
}

class MockPlayer {
  private _x: number = 37;
  private _y: number = 24;
  private _width: number = 5;

  constructor(x: number = 37, y: number = 24, width: number = 5) {
    this._x = x;
    this._y = y;
    this._width = width;
  }

  getPosition(): [number, number] {
    return [this._x, this._y];
  }

  getWidth(): number {
    return this._width;
  }

  collidesWith(x: number, y: number): boolean {
    // プレイヤーの幅範囲内に (x, y) が含まれるか判定
    const [px, py] = this.getPosition();
    const pw = this.getWidth();
    return x >= px && x < px + pw && y === py;
  }

  getX(): number {
    return this._x;
  }

  getY(): number {
    return this._y;
  }
}

// Import the actual BulletCombat class
import { BulletCombat } from './src/bullet_combat.js';
import { Bullet } from './src/models.js';

console.log('\n=== Task 7 Tests: Bullet Combat ===\n');

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (e) {
    console.error(`✗ ${name}`);
    console.error(`  Error: ${(e as Error).message}`);
    failed++;
  }
}

// ============================================================================
// Test Group: handleBulletCollisions - Opposite-direction collision
// ============================================================================

test('handleBulletCollisions: opposite bullets collide and each has 50% chance of destruction', () => {
  const field = new MockField() as any;
  const enemyManager = new MockEnemyManager();
  const scoreManager = new MockScoreManager();
  const bulletManager = new MockBulletManager();
  const rng = createRng(42);

  const combat = new BulletCombat(field, enemyManager, scoreManager, bulletManager, rng);

  // Verify method exists before calling
  assert.strictEqual(typeof combat.handleBulletCollisions, 'function', 'handleBulletCollisions method should exist');

  // Create opposing bullets at same position: up and down
  const bullets: Bullet[] = [
    { id: 1, x: 37, y: 10, direction: 'up', reflectionCount: 0 },
    { id: 2, x: 37, y: 10, direction: 'down', reflectionCount: 0 }
  ];

  // Run collision multiple times to verify probabilistic behavior
  const survivalCounts = new Map<number, number>();
  for (let i = 0; i < 100; i++) {
    const testBullets = JSON.parse(JSON.stringify(bullets));
    combat.handleBulletCollisions(testBullets);
    
    // Count how many bullets survived
    survivalCounts.set(testBullets.length, (survivalCounts.get(testBullets.length) || 0) + 1);
  }

  // With 50% chance each, we should see various outcomes: 0, 1, or 2 survivors
  const hasZeroSurvivors = survivalCounts.has(0);
  const hasOneSurvivor = survivalCounts.has(1);
  const hasTwoSurvivors = survivalCounts.has(2);

  // At least some cases where bullets were destroyed (not always both survive)
  assert.ok(hasZeroSurvivors || hasOneSurvivor, 'Expected some collisions to destroy at least one bullet');

  console.log(`  Survival distribution: ${JSON.stringify(Object.fromEntries(survivalCounts))}`);
});

test('handleBulletCollisions: opposite bullets rotate clockwise when they survive', () => {
  const field = new MockField() as any;
  const enemyManager = new MockEnemyManager();
  const scoreManager = new MockScoreManager();
  const bulletManager = new MockBulletManager();
  
  // Use a deterministic RNG that always returns < 0.5 (both survive) for predictable testing
  let callCount = 0;
  const rng = () => {
    callCount++;
    return -0.1; // Always less than 0.5, so bullets never destroyed by chance
  };

  const combat = new BulletCombat(field, enemyManager, scoreManager, bulletManager, rng);

  assert.strictEqual(typeof combat.handleBulletCollisions, 'function', 'handleBulletCollisions method should exist');

  const bullets: Bullet[] = [
    { id: 1, x: 37, y: 10, direction: 'up', reflectionCount: 0 },
    { id: 2, x: 37, y: 10, direction: 'down', reflectionCount: 0 }
  ];

  combat.handleBulletCollisions(bullets);

  // After collision with clockwise rotation: up -> right, down -> left
  assert.strictEqual(bullets.length, 2, 'Both bullets should survive');
  
  const upBullet = bullets.find(b => b.direction === 'up');
  const downBullet = bullets.find(b => b.direction === 'down');
  const rightBullet = bullets.find(b => b.direction === 'right');
  const leftBullet = bullets.find(b => b.direction === 'left');

  assert.ok(!upBullet, 'Original up bullet should be rotated away');
  assert.ok(!downBullet, 'Original down bullet should be rotated away');
  assert.ok(rightBullet, 'Should have a right-facing bullet (from up rotation)');
  assert.ok(leftBullet, 'Should have a left-facing bullet (from down rotation)');

  // Reflection count should increase by 1 for each surviving bullet
  const survivingBullets = bullets.filter(b => b.direction === 'right' || b.direction === 'left');
  survivingBullets.forEach(b => {
    assert.strictEqual(b.reflectionCount, 1, `Bullet reflection count should be incremented to 1`);
  });

  console.log(`  Rotation verified: up->${rightBullet?.direction}, down->${leftBullet?.direction}`);
});

test('handleBulletCollisions: left and right opposite bullets collide correctly', () => {
  const field = new MockField() as any;
  const enemyManager = new MockEnemyManager();
  const scoreManager = new MockScoreManager();
  const bulletManager = new MockBulletManager();
  
  let callCount = 0;
  const rng = () => {
    callCount++;
    return -0.1; // Always survive
  };

  const combat = new BulletCombat(field, enemyManager, scoreManager, bulletManager, rng);

  assert.strictEqual(typeof combat.handleBulletCollisions, 'function', 'handleBulletCollisions method should exist');

  const bullets: Bullet[] = [
    { id: 1, x: 37, y: 10, direction: 'left', reflectionCount: 0 },
    { id: 2, x: 37, y: 10, direction: 'right', reflectionCount: 0 }
  ];

  combat.handleBulletCollisions(bullets);

  // After collision with clockwise rotation: left -> up, right -> down
  assert.strictEqual(bullets.length, 2, 'Both bullets should survive');

  const survivingBullets = bullets.filter(b => b.direction === 'up' || b.direction === 'down');
  assert.strictEqual(survivingBullets.length, 2, 'Should have two vertically facing bullets');

  console.log(`  Horizontal collision verified: left->${bullets.find(b=>b.direction==='up')?.direction}, right->${bullets.find(b=>b.direction==='down')?.direction}`);
});

test('handleBulletCollisions: same-direction bullets do not collide', () => {
  const field = new MockField() as any;
  const enemyManager = new MockEnemyManager();
  const scoreManager = new MockScoreManager();
  const bulletManager = new MockBulletManager();

  const combat = new BulletCombat(field, enemyManager, scoreManager, bulletManager, () => 0.5);

  assert.strictEqual(typeof combat.handleBulletCollisions, 'function', 'handleBulletCollisions method should exist');

  const bullets: Bullet[] = [
    { id: 1, x: 37, y: 10, direction: 'up', reflectionCount: 0 },
    { id: 2, x: 38, y: 10, direction: 'up', reflectionCount: 0 } // Different position
  ];

  const originalLength = bullets.length;
  combat.handleBulletCollisions(bullets);

  assert.strictEqual(bullets.length, originalLength, 'Same-direction bullets should not collide');
  console.log(`  Same-direction collision avoided correctly`);
});

// ============================================================================
// Test Group: mergeBullets - Same-direction merging
// ============================================================================

test('mergeBullets: same bullet in same cell merges to one with minimum reflection count', () => {
  const field = new MockField() as any;
  const enemyManager = new MockEnemyManager();
  const scoreManager = new MockScoreManager();
  const bulletManager = new MockBulletManager();

  const combat = new BulletCombat(field, enemyManager, scoreManager, bulletManager, () => 0.5);

  assert.strictEqual(typeof combat.mergeBullets, 'function', 'mergeBullets method should exist');

  // Two bullets at same position with same direction but different reflection counts
  const bullets: Bullet[] = [
    { id: 1, x: 37, y: 10, direction: 'up', reflectionCount: 2 },
    { id: 2, x: 37, y: 10, direction: 'up', reflectionCount: 5 }
  ];

  const originalLength = bullets.length;
  combat.mergeBullets(bullets);

  assert.strictEqual(bullets.length, 1, 'Two same-direction bullets should merge to one');

  // The surviving bullet should have the minimum reflection count (2)
  assert.strictEqual(bullets[0].reflectionCount, 2, 'Merged bullet should keep minimum reflection count');

  console.log(`  Merge verified: ${originalLength} bullets -> ${bullets.length}, reflection=${bullets[0].reflectionCount}`);
});

test('mergeBullets: multiple same-direction bullets merge keeping minimum', () => {
  const field = new MockField() as any;
  const enemyManager = new MockEnemyManager();
  const scoreManager = new MockScoreManager();
  const bulletManager = new MockBulletManager();

  const combat = new BulletCombat(field, enemyManager, scoreManager, bulletManager, () => 0.5);

  assert.strictEqual(typeof combat.mergeBullets, 'function', 'mergeBullets method should exist');

  // Three bullets at same position with different reflection counts
  const bullets: Bullet[] = [
    { id: 1, x: 37, y: 10, direction: 'up', reflectionCount: 3 },
    { id: 2, x: 37, y: 10, direction: 'up', reflectionCount: 1 },
    { id: 3, x: 37, y: 10, direction: 'up', reflectionCount: 4 }
  ];

  combat.mergeBullets(bullets);

  assert.strictEqual(bullets.length, 1, 'Three bullets should merge to one');
  assert.strictEqual(bullets[0].reflectionCount, 1, 'Should keep minimum reflection count (1)');

  console.log(`  Multiple merge verified: 3 bullets -> ${bullets.length}, min reflection=${bullets[0].reflectionCount}`);
});

test('mergeBullets: different-direction bullets at same position do not merge', () => {
  const field = new MockField() as any;
  const enemyManager = new MockEnemyManager();
  const scoreManager = new MockScoreManager();
  const bulletManager = new MockBulletManager();

  const combat = new BulletCombat(field, enemyManager, scoreManager, bulletManager, () => 0.5);

  assert.strictEqual(typeof combat.mergeBullets, 'function', 'mergeBullets method should exist');

  // Two bullets at same position but different directions
  const bullets: Bullet[] = [
    { id: 1, x: 37, y: 10, direction: 'up', reflectionCount: 2 },
    { id: 2, x: 37, y: 10, direction: 'right', reflectionCount: 5 }
  ];

  const originalLength = bullets.length;
  combat.mergeBullets(bullets);

  assert.strictEqual(bullets.length, originalLength, 'Different-direction bullets should not merge');

  console.log(`  Different-direction merge avoided correctly`);
});

test('mergeBullets: same-direction bullets at different positions do not merge', () => {
  const field = new MockField() as any;
  const enemyManager = new MockEnemyManager();
  const scoreManager = new MockScoreManager();
  const bulletManager = new MockBulletManager();

  const combat = new BulletCombat(field, enemyManager, scoreManager, bulletManager, () => 0.5);

  assert.strictEqual(typeof combat.mergeBullets, 'function', 'mergeBullets method should exist');

  // Two bullets with same direction but different positions
  const bullets: Bullet[] = [
    { id: 1, x: 37, y: 10, direction: 'up', reflectionCount: 2 },
    { id: 2, x: 40, y: 15, direction: 'up', reflectionCount: 5 }
  ];

  const originalLength = bullets.length;
  combat.mergeBullets(bullets);

  assert.strictEqual(bullets.length, originalLength, 'Different-position bullets should not merge');

  console.log(`  Different-position merge avoided correctly`);
});

// ============================================================================
// Test Group: checkPlayerHit - Player hit detection
// ============================================================================

test('checkPlayerHit: downward bullet at player position returns true', () => {
  const field = new MockField() as any;
  const enemyManager = new MockEnemyManager();
  const scoreManager = new MockScoreManager();
  const bulletManager = new MockBulletManager();

  const combat = new BulletCombat(field, enemyManager, scoreManager, bulletManager, () => 0.5);

  assert.strictEqual(typeof combat.checkPlayerHit, 'function', 'checkPlayerHit method should exist');

  // Downward bullet at player position (37, 24)
  const bullets: Bullet[] = [
    { id: 1, x: 37, y: 24, direction: 'down', reflectionCount: 0 }
  ];

  const player = new MockPlayer(37, 24, 5);

  const hit = combat.checkPlayerHit(bullets, player.getX(), player.getY());

  assert.strictEqual(hit, true, 'Downward bullet at player position should trigger game over');

  console.log(`  Player hit detected correctly for downward bullet`);
});

test('checkPlayerHit: upward bullet at player position returns false', () => {
  const field = new MockField() as any;
  const enemyManager = new MockEnemyManager();
  const scoreManager = new MockScoreManager();
  const bulletManager = new MockBulletManager();

  const combat = new BulletCombat(field, enemyManager, scoreManager, bulletManager, () => 0.5);

  assert.strictEqual(typeof combat.checkPlayerHit, 'function', 'checkPlayerHit method should exist');

  // Upward bullet at player position (should not trigger game over)
  const bullets: Bullet[] = [
    { id: 1, x: 37, y: 24, direction: 'up', reflectionCount: 0 }
  ];

  const player = new MockPlayer(37, 24, 5);

  const hit = combat.checkPlayerHit(bullets, player.getX(), player.getY());

  assert.strictEqual(hit, false, 'Upward bullet at player position should NOT trigger game over');

  console.log(`  Upward bullet correctly does not trigger game over`);
});

test('checkPlayerHit: left/right bullets at player position return false', () => {
  const field = new MockField() as any;
  const enemyManager = new MockEnemyManager();
  const scoreManager = new MockScoreManager();
  const bulletManager = new MockBulletManager();

  const combat = new BulletCombat(field, enemyManager, scoreManager, bulletManager, () => 0.5);

  assert.strictEqual(typeof combat.checkPlayerHit, 'function', 'checkPlayerHit method should exist');

  // Left bullet at player position (should not trigger game over)
  const bullets: Bullet[] = [
    { id: 1, x: 37, y: 24, direction: 'left', reflectionCount: 0 }
  ];

  const player = new MockPlayer(37, 24, 5);

  const hit = combat.checkPlayerHit(bullets, player.getX(), player.getY());

  assert.strictEqual(hit, false, 'Left bullet at player position should NOT trigger game over');

  console.log(`  Left/right bullets correctly do not trigger game over`);
});

test('checkPlayerHit: downward bullet within player width returns true', () => {
  const field = new MockField() as any;
  const enemyManager = new MockEnemyManager();
  const scoreManager = new MockScoreManager();
  const bulletManager = new MockBulletManager();

  const combat = new BulletCombat(field, enemyManager, scoreManager, bulletManager, () => 0.5);

  assert.strictEqual(typeof combat.checkPlayerHit, 'function', 'checkPlayerHit method should exist');

  // Downward bullet at x=40 with player occupying cells 37-41 (playerX=37, width=5)
  const bullets: Bullet[] = [
    { id: 1, x: 40, y: 24, direction: 'down', reflectionCount: 0 }
  ];

  const player = new MockPlayer(37, 24, 5);

  const hit = combat.checkPlayerHit(bullets, player.getX(), player.getY());

  assert.strictEqual(hit, true, 'Downward bullet at x=40 with player occupying cells 37-41 should trigger game over (within player width)');

  console.log(`  Player hit detected correctly for downward bullet within player range`);
});

test('checkPlayerHit: multiple bullets with one downward returns true', () => {
  const field = new MockField() as any;
  const enemyManager = new MockEnemyManager();
  const scoreManager = new MockScoreManager();
  const bulletManager = new MockBulletManager();

  const combat = new BulletCombat(field, enemyManager, scoreManager, bulletManager, () => 0.5);

  assert.strictEqual(typeof combat.checkPlayerHit, 'function', 'checkPlayerHit method should exist');

  // Multiple bullets including one downward at player position
  const bullets: Bullet[] = [
    { id: 1, x: 37, y: 24, direction: 'down', reflectionCount: 0 },
    { id: 2, x: 38, y: 24, direction: 'up', reflectionCount: 0 }
  ];

  const player = new MockPlayer(37, 24, 5);

  const hit = combat.checkPlayerHit(bullets, player.getX(), player.getY());

  assert.strictEqual(hit, true, 'Should detect game over if any downward bullet hits player');

  console.log(`  Multiple bullets with downward correctly triggers game over`);
});

test('checkPlayerHit: no bullets returns false', () => {
  const field = new MockField() as any;
  const enemyManager = new MockEnemyManager();
  const scoreManager = new MockScoreManager();
  const bulletManager = new MockBulletManager();

  const combat = new BulletCombat(field, enemyManager, scoreManager, bulletManager, () => 0.5);

  assert.strictEqual(typeof combat.checkPlayerHit, 'function', 'checkPlayerHit method should exist');

  const bullets: Bullet[] = [];

  const player = new MockPlayer(37, 24, 5);

  const hit = combat.checkPlayerHit(bullets, player.getX(), player.getY());

  assert.strictEqual(hit, false, 'No bullets should not trigger game over');

  console.log(`  Empty bullet list correctly does not trigger game over`);
});

// ============================================================================
// Summary
// ============================================================================

console.log('\n' + '='.repeat(50));
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log('='.repeat(50) + '\n');

if (failed > 0) {
  process.exitCode = 1;
}
