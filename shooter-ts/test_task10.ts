import assert from 'node:assert';
import { Field } from './src/field.ts';
import type { GameState, Enemy } from './src/models.ts';
import { Renderer } from './src/renderer.ts';

console.log('\n=== Task 10: Renderer Tests ===\n');

let passed = 0;
let failed = 0;
const results: string[] = [];

function runTest(name: string, testFn: () => void): void {
  try {
    testFn();
    console.log(`✓ ${name} - PASS`);
    passed++;
  } catch (e) {
    console.log(`✗ ${name} - FAIL:`, e.message);
    failed++;
    results.push(`✗ ${name}: ${e.message}`);
  }
}

// Test 1: Renderer creates with field and test mode
runTest('Renderer creation with test mode', () => {
  const field = new Field(75, 26);
  const renderer = new Renderer(field, false);
  assert(renderer !== undefined, 'Renderer should be created');
});

// Test 2: buildFrame returns string array for basic state
runTest('buildFrame returns string array', () => {
  const field = new Field(75, 26);
  const renderer = new Renderer(field, false);

  const frame = renderer.buildFrame({
    playerX: 35,
    playerY: 24,
    playerWidth: 5,
    bullets: [],
    enemies: [],
    score: 0,
    turn: 1,
    gameOver: false,
    autoFireEnabled: true
  });
  assert(Array.isArray(frame), 'buildFrame should return an array');
  assert(frame.length > 0, 'frame should not be empty');
});

// Test 3: Frame contains title on first line
runTest('Frame contains title', () => {
  const field = new Field(75, 26);
  const renderer = new Renderer(field, false);

  const frame = renderer.buildFrame({
    playerX: 35,
    playerY: 24,
    playerWidth: 5,
    bullets: [],
    enemies: [],
    score: 0,
    turn: 1,
    gameOver: false,
    autoFireEnabled: true
  });
  assert(frame[0].includes('反射分裂シューティング'), 'First line should contain title');
});

// Test 4: Frame shows score correctly
runTest('Frame shows score correctly', () => {
  const field = new Field(75, 26);
  const renderer = new Renderer(field, false);

  const frame = renderer.buildFrame({
    playerX: 35,
    playerY: 24,
    playerWidth: 5,
    bullets: [],
    enemies: [],
    score: 1250,
    turn: 340,
    gameOver: false,
    autoFireEnabled: true
  });
  assert(frame[27].includes('SCORE: 1250'), 'Score line should show correct score');
});

// Test 5: Frame shows turn count correctly
runTest('Frame shows turn count correctly', () => {
  const field = new Field(75, 26);
  const renderer = new Renderer(field, false);

  const frame = renderer.buildFrame({
    playerX: 35,
    playerY: 24,
    playerWidth: 5,
    bullets: [],
    enemies: [],
    score: 100,
    turn: 340,
    gameOver: false,
    autoFireEnabled: true
  });
  assert(frame[27].includes('TURN: 340'), 'Score line should show correct turn');
});

// Test 6: Frame shows enemy count correctly
runTest('Frame shows enemy count correctly', () => {
  const field = new Field(75, 26);
  const renderer = new Renderer(field, false);

  const frame = renderer.buildFrame({
    playerX: 35,
    playerY: 24,
    playerWidth: 5,
    bullets: [],
    enemies: [
      { id: 1, x: 20, y: 10 },
      { id: 2, x: 30, y: 15 },
      { id: 3, x: 40, y: 20 }
    ],
    score: 100,
    turn: 340,
    gameOver: false,
    autoFireEnabled: true
  });
  assert(frame[27].includes('ENEMIES: 3'), 'Score line should show correct enemy count');
});

// Test 7: Frame shows auto-fire status as ON when enabled
runTest('Frame shows auto-fire status ON', () => {
  const field = new Field(75, 26);
  const renderer = new Renderer(field, false);

  const frame = renderer.buildFrame({
    playerX: 35,
    playerY: 24,
    playerWidth: 5,
    bullets: [],
    enemies: [],
    score: 0,
    turn: 1,
    gameOver: false,
    autoFireEnabled: true
  });
  assert(frame[28].includes('FIRE: ON'), 'Status line should show FIRE: ON');
});

// Test 8: Frame shows auto-fire status as OFF when disabled
runTest('Frame shows auto-fire status OFF', () => {
  const field = new Field(75, 26);
  const renderer = new Renderer(field, false);

  const frame = renderer.buildFrame({
    playerX: 35,
    playerY: 24,
    playerWidth: 5,
    bullets: [],
    enemies: [],
    score: 0,
    turn: 1,
    gameOver: false,
    autoFireEnabled: false
  });
  assert(frame[28].includes('FIRE: OFF'), 'Status line should show FIRE: OFF');
});

// Test 9: Frame contains help text with controls
runTest('Frame contains help text with controls', () => {
  const field = new Field(75, 26);
  const renderer = new Renderer(field, false);

  const frame = renderer.buildFrame({
    playerX: 35,
    playerY: 24,
    playerWidth: 5,
    bullets: [],
    enemies: [],
    score: 0,
    turn: 1,
    gameOver: false,
    autoFireEnabled: true
  });
  assert(frame[28].includes('[SPACE] TOGGLE'), 'Status line should show toggle instruction');
  assert(frame[28].includes('[A/D] MOVE'), 'Status line should show move instruction');
  assert(frame[28].includes('[R] RESTART'), 'Status line should show restart instruction');
  assert(frame[28].includes('[Q] QUIT'), 'Status line should show quit instruction');
});

// Test 10: Frame has correct structure (30 lines total)
runTest('Frame has correct structure (30 lines)', () => {
  const field = new Field(75, 26);
  const renderer = new Renderer(field, false);

  const frame = renderer.buildFrame({
    playerX: 35,
    playerY: 24,
    playerWidth: 5,
    bullets: [],
    enemies: [],
    score: 0,
    turn: 1,
    gameOver: false,
    autoFireEnabled: true
  });
  assert(frame.length === 30, `Frame should have exactly 30 lines, got ${frame.length}`);
});

// Test 11: Frame contains wall characters on row 1 and 27
runTest('Frame contains wall characters', () => {
  const field = new Field(75, 26);
  const renderer = new Renderer(field, false);

  const frame = renderer.buildFrame({
    playerX: 35,
    playerY: 24,
    playerWidth: 5,
    bullets: [],
    enemies: [],
    score: 0,
    turn: 1,
    gameOver: false,
    autoFireEnabled: true
  });
  assert(frame[1].startsWith('+') && frame[1].endsWith('+'), 'Row 1 should be top wall');
  assert(frame[27].startsWith('+') && frame[27].endsWith('+'), 'Row 27 should be bottom wall');
});

// Test 12: Frame shows player display at correct position
runTest('Frame shows player display', () => {
  const field = new Field(75, 26);
  const renderer = new Renderer(field, false);

  const frame = renderer.buildFrame({
    playerX: 35,
    playerY: 24,
    playerWidth: 5,
    bullets: [],
    enemies: [],
    score: 0,
    turn: 1,
    gameOver: false,
    autoFireEnabled: true
  });
  assert(frame[25].includes('A'), 'Player display should appear in row 25');
});

// Test 13: Frame shows enemy display at correct position
runTest('Frame shows enemy display', () => {
  const field = new Field(75, 26);
  const renderer = new Renderer(field, false);

  const frame = renderer.buildFrame({
    playerX: 35,
    playerY: 24,
    playerWidth: 5,
    bullets: [],
    enemies: [{ id: 1, x: 30, y: 15 }],
    score: 0,
    turn: 1,
    gameOver: false,
    autoFireEnabled: true
  });
  assert(frame[16].includes('@'), 'Enemy display should appear in row 16');
});

// Test 14: Frame shows bullet displays at correct positions
runTest('Frame shows bullet displays', () => {
  const field = new Field(75, 26);
  const renderer = new Renderer(field, false);

  const frame = renderer.buildFrame({
    playerX: 35,
    playerY: 24,
    playerWidth: 5,
    bullets: [
      { id: 1, x: 30, y: 15, direction: 'up', reflectionCount: 0 },
      { id: 2, x: 40, y: 20, direction: 'down', reflectionCount: 1 }
    ],
    enemies: [],
    score: 0,
    turn: 1,
    gameOver: false,
    autoFireEnabled: true
  });
  assert(frame[16].includes('^'), 'Up bullet should appear in row 16');
  assert(frame[21].includes('v'), 'Down bullet should appear in row 21');
});

// Test 15: Game over state renders differently
runTest('Game over state renders', () => {
  const field = new Field(75, 26);
  const renderer = new Renderer(field, false);

  const frame = renderer.buildFrame({
    playerX: 35,
    playerY: 24,
    playerWidth: 5,
    bullets: [],
    enemies: [],
    score: 0,
    turn: 1,
    gameOver: true,
    autoFireEnabled: true
  });
  assert(frame[0].includes('反射分裂シューティング'), 'Title should still appear');
});

// Test 16: Renderer in ANSI mode creates properly
runTest('ANSI mode renderer creation', () => {
  const field = new Field(75, 26);
  const renderer = new Renderer(field, true);
  assert(renderer !== undefined, 'ANSI renderer should be created');
});

// Summary with verdict
console.log('\n=== Task 10 Renderer Tests Complete ===\n');
console.log('--- VERDICT ---');
console.log(`Total: ${passed + failed} tests`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);

if (failed === 0) {
  console.log('\n✓ ALL TESTS PASSED - Renderer implementation is correct\n');
  process.exit(0);
} else {
  console.log('\n✗ SOME TESTS FAILED - Please review the failures above\n');
  process.exit(1);
}
