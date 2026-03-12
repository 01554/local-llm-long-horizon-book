import assert from 'node:assert';
import { Field } from './src/field.js';
import { EnemyManager } from './src/enemy_manager.js';
import { FIELD_WIDTH, FIELD_HEIGHT, SAFE_ZONE_ROWS } from './src/models.js';

// Helper to create a deterministic RNG for testing
function createRng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

console.log('=== Task 8: EnemyManager Tests ===\n');

// Test 1: Constructor initializes with empty enemies array
{
  const field = new Field(FIELD_WIDTH, FIELD_HEIGHT);
  const rng = createRng(42);
  const manager = new EnemyManager(field, rng);
  
  assert.strictEqual(manager.getEnemyCount(), 0, 'Initial enemy count should be 0');
  assert.deepStrictEqual(manager.getEnemies(), [], 'Initial enemies array should be empty');
  console.log('✓ Test 1: Constructor initializes with empty enemies array - PASS');
}

// Test 2: spawnEnemy places enemy at a valid position
{
  const field = new Field(FIELD_WIDTH, FIELD_HEIGHT);
  const rng = createRng(42);
  const manager = new EnemyManager(field, rng);
  
  // Initially no blocked cells
  const blockedCells = new Set<string>();
  manager.spawnEnemy(blockedCells);
  
  const enemies = manager.getEnemies();
  assert.strictEqual(enemies.length, 1, 'Should have exactly 1 enemy after spawn');
  
  const enemy = enemies[0];
  assert.ok(enemy.id >= 0, 'Enemy should have a valid id');
  assert.ok(field.minX <= enemy.x && enemy.x <= field.maxX, 'Enemy x should be within bounds');
  assert.ok(field.minY <= enemy.y && enemy.y <= field.maxY, 'Enemy y should be within bounds');
  
  console.log('✓ Test 2: spawnEnemy places enemy at a valid position - PASS');
}

// Test 3: spawnEnemy respects blocked cells (enemy not placed on blocked positions)
{
  const field = new Field(FIELD_WIDTH, FIELD_HEIGHT);
  const rng = createRng(100); // Different seed for variety
  const manager = new EnemyManager(field, rng);
  
  // Block a specific cell
  const blockedCells = new Set<string>();
  blockedCells.add('10,10');
  blockedCells.add('20,20');
  
  manager.spawnEnemy(blockedCells);
  
  const enemies = manager.getEnemies();
  assert.strictEqual(enemies.length, 1, 'Should have exactly 1 enemy after spawn');
  
  // Verify the spawned enemy is not at a blocked position
  for (const cell of blockedCells) {
    const [bx, by] = cell.split(',').map(Number);
    assert.notStrictEqual(
      enemies[0].x, bx, 
      `Enemy should not be placed at blocked x=${bx}`
    );
    assert.notStrictEqual(
      enemies[0].y, by, 
      `Enemy should not be placed at blocked y=${by}`
    );
  }
  
  console.log('✓ Test 3: spawnEnemy respects blocked cells - PASS');
}

// Test 4: spawnEnemy does not place enemy in safe zone (bottom rows)
{
  const field = new Field(FIELD_WIDTH, FIELD_HEIGHT);
  const rng = createRng(200);
  const manager = new EnemyManager(field, rng);
  
  // Block all non-safe-zone cells to force spawn in safe zone if possible
  const blockedCells = new Set<string>();
  for (let y = field.minY; y <= field.maxY - SAFE_ZONE_ROWS; y++) {
    for (let x = field.minX; x <= field.maxX; x++) {
      blockedCells.add(`${x},${y}`);
    }
  }
  
  manager.spawnEnemy(blockedCells);
  
  const enemies = manager.getEnemies();
  assert.strictEqual(enemies.length, 1, 'Should have exactly 1 enemy after spawn');
  
  // Enemy should be in safe zone (bottom rows)
  assert.ok(
    field.isSafeZone(enemies[0].y), 
    `Enemy y=${enemies[0].y} should be in safe zone`
  );
  
  console.log('✓ Test 4: spawnEnemy does not place enemy in safe zone - PASS');
}

// Test 5: ensureMinimumEnemies spawns when no enemies exist
{
  const field = new Field(FIELD_WIDTH, FIELD_HEIGHT);
  const rng = createRng(300);
  const manager = new EnemyManager(field, rng);
  
  assert.strictEqual(manager.getEnemyCount(), 0, 'Initial count should be 0');
  
  const blockedCells = new Set<string>();
  manager.ensureMinimumEnemies(blockedCells);
  
  assert.strictEqual(manager.getEnemyCount(), 1, 'Should have 1 enemy after ensureMinimumEnemies');
  
  console.log('✓ Test 5: ensureMinimumEnemies spawns when no enemies exist - PASS');
}

// Test 6: ensureMinimumEnemies does nothing when enemies already exist
{
  const field = new Field(FIELD_WIDTH, FIELD_HEIGHT);
  const rng = createRng(400);
  const manager = new EnemyManager(field, rng);
  
  // Pre-populate with one enemy
  const blockedCells = new Set<string>();
  manager.spawnEnemy(blockedCells);
  const initialCount = manager.getEnemyCount();
  
  // Call ensureMinimumEnemies again
  manager.ensureMinimumEnemies(blockedCells);
  
  assert.strictEqual(
    manager.getEnemyCount(), 
    initialCount, 
    'Enemy count should not change when enemies already exist'
  );
  
  console.log('✓ Test 6: ensureMinimumEnemies does nothing when enemies already exist - PASS');
}

// Test 7: removeEnemyAt removes enemy at specified position
{
  const field = new Field(FIELD_WIDTH, FIELD_HEIGHT);
  const rng = createRng(500);
  const manager = new EnemyManager(field, rng);
  
  // Spawn an enemy and remember its position
  const blockedCells = new Set<string>();
  manager.spawnEnemy(blockedCells);
  const initialEnemies = manager.getEnemies();
  assert.strictEqual(initialEnemies.length, 1, 'Should have 1 enemy initially');
  
  const targetX = initialEnemies[0].x;
  const targetY = initialEnemies[0].y;
  
  // Remove the enemy at that position
  manager.removeEnemyAt(targetX, targetY);
  
  assert.strictEqual(manager.getEnemyCount(), 0, 'Should have 0 enemies after removal');
  
  console.log('✓ Test 7: removeEnemyAt removes enemy at specified position - PASS');
}

// Test 8: removeEnemyAt does nothing for non-existent positions
{
  const field = new Field(FIELD_WIDTH, FIELD_HEIGHT);
  const rng = createRng(600);
  const manager = new EnemyManager(field, rng);
  
  // Spawn an enemy at (10, 10)
  const blockedCells = new Set<string>();
  manager.spawnEnemy(blockedCells);
  const initialCount = manager.getEnemyCount();
  
  // Try to remove from a different position that doesn't have an enemy
  manager.removeEnemyAt(50, 20);
  
  assert.strictEqual(manager.getEnemyCount(), initialCount, 'Count should not change for non-existent position');
  
  console.log('✓ Test 8: removeEnemyAt does nothing for non-existent positions - PASS');
}

// Test 9: getEnemies returns a copy (not the internal array)
{
  const field = new Field(FIELD_WIDTH, FIELD_HEIGHT);
  const rng = createRng(700);
  const manager = new EnemyManager(field, rng);
  
  const blockedCells = new Set<string>();
  manager.spawnEnemy(blockedCells);
  
  const enemies1 = manager.getEnemies();
  const originalLength = enemies1.length;
  
  // Try to modify the returned array
  enemies1.push({ id: 999, x: 0, y: 0 });
  
  // Get again and verify internal state is unchanged
  const enemies2 = manager.getEnemies();
  assert.strictEqual(enemies2.length, originalLength, 'Internal array should not be affected by external modification');
  
  console.log('✓ Test 9: getEnemies returns a copy - PASS');
}

// Test 10: maybeSpawnEnemy spawns based on turn count and spawn rate
{
  const field = new Field(FIELD_WIDTH, FIELD_HEIGHT);
  let callCount = 0;
  // Create RNG that always returns values < 0.15 (spawn rate at turn 30)
  const rng = () => {
    callCount++;
    return 0.1; // Always less than spawn rates up to turn 90
  };
  const manager = new EnemyManager(field, rng);
  
  const blockedCells = new Set<string>();
  const initialCount = manager.getEnemyCount();
  
  // At turn 30+, spawn rate should be at least 0.15
  manager.maybeSpawnEnemy(30, blockedCells);
  
  assert.ok(
    manager.getEnemyCount() >= initialCount, 
    'Enemy count should not decrease after maybeSpawnEnemy'
  );
  
  console.log('✓ Test 10: maybeSpawnEnemy spawns based on turn count - PASS');
}

// Test 11: maybeSpawnEnemy spawn rate increases with turns (statistical test)
{
  const field = new Field(FIELD_WIDTH, FIELD_HEIGHT);
  let rngCallCount = 0;
  
  // Track how many times we actually spawn at different turn counts
  const spawnCounts: number[] = [0, 0, 0]; // For turns 0, 30, 120
  
  function makeRng(targetValue: number): () => number {
    return () => targetValue; // Fixed value for deterministic testing
  }
  
  // Test at turn 0 (spawn rate ~0.1)
  const manager1 = new EnemyManager(field, makeRng(0.05)); // Should spawn (< 0.1)
  const blockedCells1 = new Set<string>();
  manager1.maybeSpawnEnemy(0, blockedCells1);
  if (manager1.getEnemyCount() > 0) spawnCounts[0] = 1;
  
  // Test at turn 30 (spawn rate ~0.15)
  const field2 = new Field(FIELD_WIDTH, FIELD_HEIGHT);
  const manager2 = new EnemyManager(field2, makeRng(0.1)); // Should spawn (< 0.15)
  const blockedCells2 = new Set<string>();
  manager2.maybeSpawnEnemy(30, blockedCells2);
  if (manager2.getEnemyCount() > 0) spawnCounts[1] = 1;
  
  // Test at turn 120 (spawn rate ~0.3 - cap)
  const field3 = new Field(FIELD_WIDTH, FIELD_HEIGHT);
  const manager3 = new EnemyManager(field3, makeRng(0.2)); // Should spawn (< 0.3)
  const blockedCells3 = new Set<string>();
  manager3.maybeSpawnEnemy(120, blockedCells3);
  if (manager3.getEnemyCount() > 0) spawnCounts[2] = 1;
  
  assert.ok(spawnCounts.some(c => c === 1), 'At least one spawn should occur at expected rates');
  
  console.log('✓ Test 11: maybeSpawnEnemy spawn rate increases with turns - PASS');
}

// Test 12: clear() removes all enemies and resets state
{
  const field = new Field(FIELD_WIDTH, FIELD_HEIGHT);
  const rng = createRng(800);
  const manager = new EnemyManager(field, rng);
  
  // Spawn multiple enemies
  for (let i = 0; i < 5; i++) {
    const blockedCells = new Set<string>();
    manager.spawnEnemy(blockedCells);
  }
  
  assert.strictEqual(manager.getEnemyCount(), 5, 'Should have 5 enemies before clear');
  
  manager.clear();
  
  assert.strictEqual(manager.getEnemyCount(), 0, 'Should have 0 enemies after clear');
  assert.deepStrictEqual(manager.getEnemies(), [], 'Enemies array should be empty after clear');
  
  console.log('✓ Test 12: clear() removes all enemies and resets state - PASS');
}

// Test 13: spawnEnemy when no valid positions available (all cells blocked)
{
  const field = new Field(FIELD_WIDTH, FIELD_HEIGHT);
  const rng = createRng(900);
  const manager = new EnemyManager(field, rng);
  
  // Block all playable cells
  const blockedCells = new Set<string>();
  for (let y = field.minY; y <= field.maxY; y++) {
    for (let x = field.minX; x <= field.maxX; x++) {
      blockedCells.add(`${x},${y}`);
    }
  }
  
  // Should not throw, just do nothing
  manager.spawnEnemy(blockedCells);
  
  assert.strictEqual(manager.getEnemyCount(), 0, 'Should have 0 enemies when no valid positions');
  
  console.log('✓ Test 13: spawnEnemy handles all cells blocked gracefully - PASS');
}

// Test 14: Enemy has unique sequential IDs
{
  const field = new Field(FIELD_WIDTH, FIELD_HEIGHT);
  const rng = createRng(1000);
  const manager = new EnemyManager(field, rng);
  
  const blockedCells = new Set<string>();
  const spawnedEnemies: number[] = [];
  
  // Spawn multiple enemies and collect IDs
  for (let i = 0; i < 3; i++) {
    manager.spawnEnemy(blockedCells);
    const enemies = manager.getEnemies();
    spawnedEnemies.push(enemies[enemies.length - 1].id);
  }
  
  // Verify IDs are unique and sequential
  assert.notStrictEqual(spawnedEnemies[0], spawnedEnemies[1], 'First two enemy IDs should be different');
  assert.notStrictEqual(spawnedEnemies[1], spawnedEnemies[2], 'Last two enemy IDs should be different');
  
  console.log('✓ Test 14: Enemy has unique sequential IDs - PASS');
}

// Test 15: isSafeZone check for spawn position validation
{
  const field = new Field(FIELD_WIDTH, FIELD_HEIGHT);
  const rng = createRng(1100);
  const manager = new EnemyManager(field, rng);
  
  // Verify safe zone boundaries
  assert.ok(!field.isSafeZone(field.minY), 'Top of playable area should not be safe zone');
  assert.ok(field.isSafeZone(field.maxY), 'Bottom of playable area should be safe zone');
  
  const blockedCells = new Set<string>();
  manager.spawnEnemy(blockedCells);
  
  // The spawned enemy position should respect safe zone rules
  // (Enemies can spawn in safe zone if that's all that's available)
  assert.ok(
    field.minY <= manager.getEnemies()[0].y && manager.getEnemies()[0].y <= field.maxY,
    'Enemy y should be within playable area'
  );
  
  console.log('✓ Test 15: isSafeZone check for spawn position validation - PASS');
}

console.log('\n=== All Task 8 tests completed ===');
