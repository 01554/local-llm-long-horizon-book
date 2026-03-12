import assert from 'node:assert';
import { Field } from './src/field.js';
import { BulletManager } from './src/bullet_manager.js';
import { Bullet, FIELD_WIDTH, FIELD_HEIGHT, MAX_REFLECTION_COUNT } from './src/models.js';

// Helper to create a bullet for testing
function createBullet(x: number, y: number, direction: string): Bullet {
  return {
    id: Math.floor(Math.random() * 10000),
    x,
    y,
    direction,
    reflectionCount: 0
  };
}

// Helper to create a bullet with specific reflection count
function createBulletWithReflections(x: number, y: number, direction: string, reflections: number): Bullet {
  return {
    id: Math.floor(Math.random() * 10000),
    x,
    y,
    direction,
    reflectionCount: reflections
  };
}

console.log('\n=== Task 5 Tests: Bullet Manager ===\n');

// Test 1: Constructor creates empty bullet lists
{
  console.log('Test 1: Constructor creates empty bullet lists...');
  const field = new Field(FIELD_WIDTH, FIELD_HEIGHT);
  const manager = new BulletManager(field);
  
  assert.deepStrictEqual(manager.getBullets(), [], 'Initial bullets should be empty array');
  console.log('✓ PASS: Constructor creates empty bullet lists\n');
}

// Test 2: fireBullet adds to newborn list (not immediately in main list)
{
  console.log('Test 2: fireBullet adds to newborn list...');
  const field = new Field(FIELD_WIDTH, FIELD_HEIGHT);
  const manager = new BulletManager(field);
  
  // Fire a bullet
  manager.fireBullet(10, 10, 'up');
  
  // Get bullets should not include the newly fired one yet (it's in newborn)
  const bullets = manager.getBullets();
  assert.strictEqual(bullets.length, 0, 'Newly fired bullet should not be in main list immediately');
  console.log('✓ PASS: fireBullet adds to newborn list\n');
}

// Test 3: promoteNewborns moves newborn bullets to main list
{
  console.log('Test 3: promoteNewborns moves newborn bullets to main list...');
  const field = new Field(FIELD_WIDTH, FIELD_HEIGHT);
  const manager = new BulletManager(field);
  
  // Fire a bullet (goes to newborn)
  manager.fireBullet(10, 10, 'up');
  assert.strictEqual(manager.getBullets().length, 0, 'Should be in newborn initially');
  
  // Promote newborns
  manager.promoteNewborns();
  
  const bullets = manager.getBullets();
  assert.strictEqual(bullets.length, 1, 'After promotion, should have 1 bullet');
  assert.strictEqual(bullets[0].x, 10, 'Bullet x position should be preserved');
  assert.strictEqual(bullets[0].y, 10, 'Bullet y position should be preserved');
  assert.strictEqual(bullets[0].direction, 'up', 'Bullet direction should be preserved');
  console.log('✓ PASS: promoteNewborns moves newborn bullets to main list\n');
}

// Test 4: moveBullets moves existing bullets in their direction
{
  console.log('Test 4: moveBullets moves existing bullets in their direction...');
  const field = new Field(FIELD_WIDTH, FIELD_HEIGHT);
  const manager = new BulletManager(field);
  
  // Add a bullet directly to main list (simulating promoted newborn)
  const testBullet: Bullet = { id: 1, x: 10, y: 10, direction: 'up', reflectionCount: 0 };
  (manager as any)._bullets.push(testBullet);
  
  // Move bullets
  manager.moveBullets();
  
  assert.strictEqual((testBullet as any).y, 9, 'Up bullet should move from y=10 to y=9');
  
  // Reset and test down direction
  (manager as any)._bullets = [];
  const downBullet: Bullet = { id: 2, x: 20, y: 15, direction: 'down', reflectionCount: 0 };
  (manager as any)._bullets.push(downBullet);
  
  manager.moveBullets();
  assert.strictEqual((downBullet as any).y, 16, 'Down bullet should move from y=15 to y=16');
  
  // Reset and test left direction
  (manager as any)._bullets = [];
  const leftBullet: Bullet = { id: 3, x: 20, y: 15, direction: 'left', reflectionCount: 0 };
  (manager as any)._bullets.push(leftBullet);
  
  manager.moveBullets();
  assert.strictEqual((leftBullet as any).x, 19, 'Left bullet should move from x=20 to x=19');
  
  // Reset and test right direction
  (manager as any)._bullets = [];
  const rightBullet: Bullet = { id: 4, x: 20, y: 15, direction: 'right', reflectionCount: 0 };
  (manager as any)._bullets.push(rightBullet);
  
  manager.moveBullets();
  assert.strictEqual((rightBullet as any).x, 21, 'Right bullet should move from x=20 to x=21');
  
  console.log('✓ PASS: moveBullets moves existing bullets in their direction\n');
}

// Test 5: moveBullets handles wall reflection for up bullets hitting top wall
{
  console.log('Test 5: moveBullets handles wall reflection for up bullets...');
  const field = new Field(FIELD_WIDTH, FIELD_HEIGHT);
  const manager = new BulletManager(field);
  
  // Place an up bullet at y=1 (one step below top wall which is y=0)
  const testBullet: Bullet = { id: 5, x: 37, y: 1, direction: 'up', reflectionCount: 0 };
  (manager as any)._bullets.push(testBullet);
  
  manager.moveBullets();
  
  // Should reflect and become down, position stays at y=1, reflection count becomes 1
  assert.strictEqual((testBullet as any).direction, 'down', 'Up bullet should change to down when hitting top wall');
  assert.strictEqual((testBullet as any).y, 1, 'Position should not change on reflection turn');
  assert.strictEqual((testBullet as any).reflectionCount, 1, 'Reflection count should increment to 1');
  
  console.log('✓ PASS: moveBullets handles wall reflection for up bullets\n');
}

// Test 6: moveBullets handles wall reflection for down bullets hitting bottom wall
{
  console.log('Test 6: moveBullets handles wall reflection for down bullets...');
  const field = new Field(FIELD_WIDTH, FIELD_HEIGHT);
  const manager = new BulletManager(field);
  
  // Place a down bullet at y=maxY (one step above bottom wall)
  const testBullet: Bullet = { id: 6, x: 37, y: field.maxY, direction: 'down', reflectionCount: 0 };
  (manager as any)._bullets.push(testBullet);
  
  manager.moveBullets();
  
  // Should reflect and become up, position stays at maxY, reflection count becomes 1
  assert.strictEqual((testBullet as any).direction, 'up', 'Down bullet should change to up when hitting bottom wall');
  assert.strictEqual((testBullet as any).y, field.maxY, 'Position should not change on reflection turn');
  assert.strictEqual((testBullet as any).reflectionCount, 1, 'Reflection count should increment to 1');
  
  console.log('✓ PASS: moveBullets handles wall reflection for down bullets\n');
}

// Test 7: moveBullets handles wall reflection for left bullets hitting left wall
{
  console.log('Test 7: moveBullets handles wall reflection for left bullets...');
  const field = new Field(FIELD_WIDTH, FIELD_HEIGHT);
  const manager = new BulletManager(field);
  
  // Place a left bullet at x=1 (one step right of left wall which is x=0)
  const testBullet: Bullet = { id: 7, x: 1, y: 13, direction: 'left', reflectionCount: 0 };
  (manager as any)._bullets.push(testBullet);
  
  manager.moveBullets();
  
  // Should reflect and become right, position stays at x=1, reflection count becomes 1
  assert.strictEqual((testBullet as any).direction, 'right', 'Left bullet should change to right when hitting left wall');
  assert.strictEqual((testBullet as any).x, 1, 'Position should not change on reflection turn');
  assert.strictEqual((testBullet as any).reflectionCount, 1, 'Reflection count should increment to 1');
  
  console.log('✓ PASS: moveBullets handles wall reflection for left bullets\n');
}

// Test 8: moveBullets handles wall reflection for right bullets hitting right wall
{
  console.log('Test 8: moveBullets handles wall reflection for right bullets...');
  const field = new Field(FIELD_WIDTH, FIELD_HEIGHT);
  const manager = new BulletManager(field);
  
  // Place a right bullet at x=maxX (one step left of right wall)
  const testBullet: Bullet = { id: 8, x: field.maxX, y: 13, direction: 'right', reflectionCount: 0 };
  (manager as any)._bullets.push(testBullet);
  
  manager.moveBullets();
  
  // Should reflect and become left, position stays at maxX, reflection count becomes 1
  assert.strictEqual((testBullet as any).direction, 'left', 'Right bullet should change to left when hitting right wall');
  assert.strictEqual((testBullet as any).x, field.maxX, 'Position should not change on reflection turn');
  assert.strictEqual((testBullet as any).reflectionCount, 1, 'Reflection count should increment to 1');
  
  console.log('✓ PASS: moveBullets handles wall reflection for right bullets\n');
}

// Test 9: Bullet is destroyed when reflection count reaches MAX_REFLECTION_COUNT
{
  console.log('Test 9: Bullet is destroyed when reflection count reaches MAX_REFLECTION_COUNT...');
  const field = new Field(FIELD_WIDTH, FIELD_HEIGHT);
  const manager = new BulletManager(field);
  
  // Create a bullet with reflectionCount already at MAX - 1
  const testBullet: Bullet = { id: 9, x: 37, y: 1, direction: 'up', reflectionCount: MAX_REFLECTION_COUNT - 1 };
  (manager as any)._bullets.push(testBullet);
  
  manager.moveBullets();
  
  // After reflecting again, should be destroyed (reflection count becomes MAX)
  const bullets = manager.getBullets();
  assert.strictEqual(bullets.length, 0, 'Bullet should be removed when reflection count reaches max');
  
  console.log('✓ PASS: Bullet is destroyed when reflection count reaches MAX_REFLECTION_COUNT\n');
}

// Test 10: getBullets returns a copy (not the original array)
{
  console.log('Test 10: getBullets returns a copy...');
  const field = new Field(FIELD_WIDTH, FIELD_HEIGHT);
  const manager = new BulletManager(field);
  
  // Add a bullet directly to main list
  const testBullet: Bullet = { id: 10, x: 37, y: 13, direction: 'up', reflectionCount: 0 };
  (manager as any)._bullets.push(testBullet);
  
  const bullets = manager.getBullets();
  
  // Modify the returned array - should not affect internal state
  bullets.pop();
  assert.strictEqual(manager.getBullets().length, 1, 'Internal list should be unchanged after modifying returned copy');
  
  console.log('✓ PASS: getBullets returns a copy\n');
}

// Test 11: clear removes all bullets from main list (not newborn)
{
  console.log('Test 11: clear removes all bullets from main list...');
  const field = new Field(FIELD_WIDTH, FIELD_HEIGHT);
  const manager = new BulletManager(field);
  
  // Add a bullet to main list
  const testBullet: Bullet = { id: 11, x: 37, y: 13, direction: 'up', reflectionCount: 0 };
  (manager as any)._bullets.push(testBullet);
  
  // Also add one to newborn
  manager.fireBullet(40, 20, 'down');
  
  manager.clear();
  
  assert.strictEqual(manager.getBullets().length, 0, 'Main list should be empty after clear');
  const bullets = manager.getBullets();
  assert.ok(!bullets.includes(testBullet), 'Original bullet reference should not be in list after clear');
  
  console.log('✓ PASS: clear removes all bullets from main list\n');
}

// Test 12: setCombat sets the BulletCombat instance for delegation
{
  console.log('Test 12: setCombat sets the BulletCombat instance...');
  const field = new Field(FIELD_WIDTH, FIELD_HEIGHT);
  const manager = new BulletManager(field);
  
  // Create a mock combat object (we can't import BulletCombat yet as it's not implemented)
  const mockCombat = {
    handleEnemyCollisions: () => {},
    handleBulletCollisions: () => {},
    mergeBullets: () => {},
    checkPlayerHit: () => false
  };
  
  manager.setCombat(mockCombat);
  
  // Verify the combat was set by checking internal state (accessing private field)
  const actualCombat = (manager as any)._combat;
  assert.strictEqual(actualCombat, mockCombat, 'setCombat should store the combat instance');
  
  console.log('✓ PASS: setCombat sets the BulletCombat instance\n');
}

// Test 13: Multiple bullets move independently in different directions
{
  console.log('Test 13: Multiple bullets move independently...');
  const field = new Field(FIELD_WIDTH, FIELD_HEIGHT);
  const manager = new BulletManager(field);
  
  // Add multiple bullets with different directions and positions
  const bullet1: Bullet = { id: 130, x: 10, y: 5, direction: 'up', reflectionCount: 0 };
  const bullet2: Bullet = { id: 131, x: 20, y: 15, direction: 'down', reflectionCount: 0 };
  const bullet3: Bullet = { id: 132, x: 30, y: 10, direction: 'left', reflectionCount: 0 };
  const bullet4: Bullet = { id: 133, x: 40, y: 12, direction: 'right', reflectionCount: 0 };
  
  (manager as any)._bullets.push(bullet1, bullet2, bullet3, bullet4);
  
  manager.moveBullets();
  
  assert.strictEqual((bullet1 as any).y, 4, 'Bullet 1 should move up');
  assert.strictEqual((bullet2 as any).y, 16, 'Bullet 2 should move down');
  assert.strictEqual((bullet3 as any).x, 29, 'Bullet 3 should move left');
  assert.strictEqual((bullet4 as any).x, 41, 'Bullet 4 should move right');
  
  console.log('✓ PASS: Multiple bullets move independently\n');
}

// Test 14: promoteNewborns clears the newborn list after promotion
{
  console.log('Test 14: promoteNewborns clears the newborn list...');
  const field = new Field(FIELD_WIDTH, FIELD_HEIGHT);
  const manager = new BulletManager(field);
  
  // Fire multiple bullets (goes to newborn)
  manager.fireBullet(10, 10, 'up');
  manager.fireBullet(20, 20, 'down');
  
  assert.strictEqual((manager as any)._newbornBullets.length, 2, 'Should have 2 newborn bullets initially');
  
  // Promote and verify newborn list is cleared
  manager.promoteNewborns();
  
  assert.strictEqual((manager as any)._newbornBullets.length, 0, 'Newborn list should be empty after promotion');
  assert.strictEqual(manager.getBullets().length, 2, 'Main list should have 2 bullets after promotion');
  
  console.log('✓ PASS: promoteNewborns clears the newborn list\n');
}

// Test 15: Fire and move cycle - bullet fires then moves in next tick
{
  console.log('Test 15: Fire and move cycle...');
  const field = new Field(FIELD_WIDTH, FIELD_HEIGHT);
  const manager = new BulletManager(field);
  
  // Fire a bullet (goes to newborn)
  manager.fireBullet(37, 20, 'up');
  assert.strictEqual(manager.getBullets().length, 0, 'Should be in newborn initially');
  
  // Promote it
  manager.promoteNewborns();
  assert.strictEqual(manager.getBullets().length, 1, 'Should have 1 bullet after promotion');
  
  // Move bullets (bullet should move up)
  manager.moveBullets();
  const bullets = manager.getBullets();
  assert.strictEqual(bullets[0].y, 19, 'Bullet should move from y=20 to y=19');
  
  console.log('✓ PASS: Fire and move cycle\n');
}

console.log('=== All Task 5 Tests Completed ===\n');
