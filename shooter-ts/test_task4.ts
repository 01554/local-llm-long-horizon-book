import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Player } from './src/player.js';
import { PLAYER_WIDTH, FIELD_WIDTH, FIELD_HEIGHT } from './src/models.js';

describe('Task 4: Player クラス', () => {

// Helper to create a player with custom dimensions for testing
function createPlayer(fieldWidth: number = FIELD_WIDTH, fieldHeight: number = FIELD_HEIGHT): Player {
  return new Player(fieldWidth, fieldHeight);
}

it('Constructor initializes player at center of bottom row', () => {
  const player = createPlayer();
  const [x, y] = player.getPosition();

  // Expected x = Math.floor(75 / 2) - Math.floor(5 / 2) = 37 - 2 = 35
  assert.strictEqual(x, 35, `Expected x=35, got ${x}`);
  // Expected y = fieldHeight - 2 = 26 - 2 = 24
  assert.strictEqual(y, 24, `Expected y=24, got ${y}`);
});

it('Player has correct width (5)', () => {
  const player = createPlayer();
  const width = player.getWidth();
  assert.strictEqual(width, PLAYER_WIDTH, `Expected width=${PLAYER_WIDTH}, got ${width}`);
});

it('moveLeft decreases x position by 1', () => {
  const player = createPlayer();
  let [x, y] = player.getPosition();
  assert.strictEqual(x, 35);

  player.moveLeft();
  [x, y] = player.getPosition();
  assert.strictEqual(x, 34, `Expected x=34 after moveLeft, got ${x}`);
});

it('moveRight increases x position by 1', () => {
  const player = createPlayer();
  let [x, y] = player.getPosition();
  assert.strictEqual(x, 35);

  player.moveRight();
  [x, y] = player.getPosition();
  assert.strictEqual(x, 36, `Expected x=36 after moveRight, got ${x}`);
});

it('Player cannot move left beyond boundary (minX=1)', () => {
  const player = createPlayer(10, 26); // Smaller field for easier testing
  // With width=10: minX=1, maxX=8. Player starts at x=Math.floor(10/2)-Math.floor(5/2)=5-2=3
  let [x] = player.getPosition();
  assert.strictEqual(x, 3);

  // Move left multiple times until boundary
  for (let i = 0; i < 10; i++) {
    player.moveLeft();
  }
  [x] = player.getPosition();
  assert.strictEqual(x, 1, `Expected x=1 at boundary, got ${x}`);

  // Try to move left again - should stay at boundary
  const beforeX = x;
  player.moveLeft();
  [x] = player.getPosition();
  assert.strictEqual(x, beforeX, 'Player should not move past minX');
});

it('Player cannot move right beyond boundary (maxX=fieldWidth-2)', () => {
  const player = createPlayer(10, 26);
  // With width=10: minX=1, maxX=8. Player starts at x=3
  let [x] = player.getPosition();

  // Move right multiple times until boundary
  for (let i = 0; i < 10; i++) {
    player.moveRight();
  }
  [x] = player.getPosition();
  assert.strictEqual(x, 4, `Expected x=4 at maxX-PLAYER_WIDTH+1 (since width=5), got ${x}`);

  // Try to move right again - should stay at boundary
  const beforeX = x;
  player.moveRight();
  [x] = player.getPosition();
  assert.strictEqual(x, beforeX, 'Player should not move past maxX');
});

it('Player Y position remains constant at fieldHeight-2', () => {
  const player = createPlayer(100, 50);
  let [, y] = player.getPosition();
  assert.strictEqual(y, 48); // 50 - 2

  for (let i = 0; i < 20; i++) {
    player.moveLeft();
    player.moveRight();
  }

  [y] = player.getPosition();
  assert.strictEqual(y, 48, 'Y position should remain constant');
});

it('collidesWith(x, y) returns true when (x,y) is within player width', () => {
  const player = createPlayer();
  let [px] = player.getPosition(); // px = 35

  // All positions from px to px+4 should collide
  for (let i = 0; i < PLAYER_WIDTH; i++) {
    assert.strictEqual(player.collidesWith(px + i, 24), true,
      `Should collide at x=${px + i}`);
  }
});

it('collidesWith(x, y) returns false when (x,y) is outside player width', () => {
  const player = createPlayer();
  let [px] = player.getPosition(); // px = 35

  // Positions just before and after should not collide
  assert.strictEqual(player.collidesWith(px - 1, 24), false);
  assert.strictEqual(player.collidesWith(px + PLAYER_WIDTH, 24), false);
});

it('collidesWith(x, y) returns false when y is not player row', () => {
  const player = createPlayer();
  let [px] = player.getPosition();

  // Same x but different y should not collide
  assert.strictEqual(player.collidesWith(px, 23), false);
  assert.strictEqual(player.collidesWith(px + 2, 25), false);
});

it('reset() restores player to initial center position', () => {
  const player = createPlayer(75, 26);

  // Move around - move left only (to ensure we're not at initial position)
  for (let i = 0; i < 10; i++) {
    player.moveLeft();
  }

  const [xAfterMoves] = player.getPosition();
  assert.notStrictEqual(xAfterMoves, 35, 'Player should have moved from initial position');

  // Reset and verify
  player.reset();
  const [xReset, yReset] = player.getPosition();
  assert.strictEqual(xReset, 35, `Expected x=35 after reset, got ${xReset}`);
  assert.strictEqual(yReset, 24, `Expected y=24 after reset, got ${yReset}`);
});

it('Player initializes correctly with custom field dimensions', () => {
  const player = createPlayer(50, 30);
  // x = Math.floor(50/2) - Math.floor(5/2) = 25 - 2 = 23
  // y = 30 - 2 = 28
  const [x, y] = player.getPosition();
  assert.strictEqual(x, 23, `Expected x=23 for width=50, got ${x}`);
  assert.strictEqual(y, 28, `Expected y=28 for height=30, got ${y}`);
});

it('Player stays at minX after multiple consecutive moveLeft calls', () => {
  const player = createPlayer(75, 26);

  // Move all the way to left
  for (let i = 0; i < 100; i++) {
    player.moveLeft();
  }

  const [x] = player.getPosition();
  assert.strictEqual(x, 1, 'Should be at minX');

  // Keep trying to move left - should stay put
  for (let i = 0; i < 100; i++) {
    player.moveLeft();
  }

  const [xAfter] = player.getPosition();
  assert.strictEqual(xAfter, 1, 'Should still be at minX after more moves');
});

it('Player stays at maxX-PLAYER_WIDTH+1 after multiple consecutive moveRight calls', () => {
  const player = createPlayer(75, 26);

  // Move all the way to right
  for (let i = 0; i < 100; i++) {
    player.moveRight();
  }

  const [x] = player.getPosition();
  assert.strictEqual(x, 69, 'Should be at maxX - PLAYER_WIDTH + 1');

  // Keep trying to move right - should stay put
  for (let i = 0; i < 100; i++) {
    player.moveRight();
  }

  const [xAfter] = player.getPosition();
  assert.strictEqual(xAfter, 69, 'Should still be at same position after more moves');
});

});
