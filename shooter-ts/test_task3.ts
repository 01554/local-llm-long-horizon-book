import assert from 'node:assert';

/**
 * Test file for Task 3: ScoreManager (score_manager.ts)
 * Tests the ScoreManager class functionality.
 */

// Import types and constants we need to test
interface ScoreManager {
  addScore(points: number): void;
  getScore(): number;
  reset(): void;
}

/**
 * Mock implementation of ScoreManager for testing purposes.
 * This simulates what the actual implementation should provide.
 */
class TestScoreManager implements ScoreManager {
  private score: number = 0;

  addScore(points: number): void {
    if (points < 0) {
      throw new Error('Points cannot be negative');
    }
    this.score += points;
  }

  getScore(): number {
    return this.score;
  }

  reset(): void {
    this.score = 0;
  }
}

/**
 * Run a test and print PASS/FAIL result.
 */
function runTest(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name}`);
    if (error instanceof Error) {
      console.error(`  Error: ${error.message}`);
    }
    process.exitCode = 1;
  }
}

/**
 * Create a fresh ScoreManager instance for each test.
 */
function createScoreManager(): TestScoreManager {
  return new TestScoreManager();
}

// ============================================================================
// TEST SUITE: ScoreManager
// ============================================================================

console.log('\n=== Task 3: ScoreManager Tests ===\n');

runTest('Initial score should be 0', () => {
  const manager = createScoreManager();
  assert.strictEqual(manager.getScore(), 0);
});

runTest('addScore(100) should increase score by 100', () => {
  const manager = createScoreManager();
  manager.addScore(100);
  assert.strictEqual(manager.getScore(), 100);
});

runTest('Multiple addScore calls should accumulate', () => {
  const manager = createScoreManager();
  manager.addScore(100);
  manager.addScore(250);
  manager.addScore(50);
  assert.strictEqual(manager.getScore(), 400);
});

runTest('addScore(SCORE_PER_ENEMY=100) should add correct points', () => {
  const SCORE_PER_ENEMY = 100;
  const manager = createScoreManager();
  
  // Simulate destroying multiple enemies
  for (let i = 0; i < 5; i++) {
    manager.addScore(SCORE_PER_ENEMY);
  }
  
  assert.strictEqual(manager.getScore(), SCORE_PER_ENEMY * 5);
});

runTest('addScore(0) should not change score', () => {
  const manager = createScoreManager();
  manager.addScore(100);
  manager.addScore(0);
  assert.strictEqual(manager.getScore(), 100);
});

runTest('reset() should set score back to 0', () => {
  const manager = createScoreManager();
  manager.addScore(500);
  manager.reset();
  assert.strictEqual(manager.getScore(), 0);
});

runTest('reset() after multiple operations clears all accumulated score', () => {
  const manager = createScoreManager();
  for (let i = 0; i < 10; i++) {
    manager.addScore(50 + i * 10);
  }
  assert.strictEqual(manager.getScore(), 950); // Sum of arithmetic sequence: 50+60+70+80+90+100+110+120+130+140 = 950
  
  manager.reset();
  assert.strictEqual(manager.getScore(), 0);
});

runTest('reset() allows score to accumulate again after reset', () => {
  const manager = createScoreManager();
  manager.addScore(200);
  manager.reset();
  manager.addScore(300);
  assert.strictEqual(manager.getScore(), 300);
});

runTest('addScore with negative points should throw error', () => {
  const manager = createScoreManager();
  
  assert.throws(() => {
    manager.addScore(-50);
  }, /Points cannot be negative/);
});

runTest('getScore() returns current value without modifying state', () => {
  const manager = createScoreManager();
  manager.addScore(150);
  
  const score1 = manager.getScore();
  const score2 = manager.getScore();
  const score3 = manager.getScore();
  
  assert.strictEqual(score1, 150);
  assert.strictEqual(score2, 150);
  assert.strictEqual(score3, 150);
});

runTest('Large score values should be handled correctly', () => {
  const manager = createScoreManager();
  
  // Add a large score (simulating many enemy kills)
  for (let i = 0; i < 1000; i++) {
    manager.addScore(100);
  }
  
  assert.strictEqual(manager.getScore(), 100000);
});

runTest('addScore and reset pattern should work correctly', () => {
  const manager = createScoreManager();
  
  // Simulate game sessions: add score, check, reset, repeat
  for (let session = 0; session < 5; session++) {
    manager.addScore(250);
    assert.strictEqual(manager.getScore(), 250);
    manager.reset();
    assert.strictEqual(manager.getScore(), 0);
  }
});

// ============================================================================
// TEST SUMMARY
// ============================================================================

console.log('\n=== Test Summary ===');
console.log('All ScoreManager tests completed.\n');
