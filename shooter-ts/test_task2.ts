import assert from 'node:assert';
import { Field } from './src/field.js';
import { FIELD_WIDTH, FIELD_HEIGHT, SAFE_ZONE_ROWS } from './src/models.js';

console.log('=== Test Task 2: Field Management ===\n');

// Helper to create a field with custom dimensions for testing
function createField(width: number = FIELD_WIDTH, height: number = FIELD_HEIGHT): Field {
  return new Field(width, height);
}

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

// Test Task 2.1: Grid initialization with correct dimensions
test('Field initializes with correct dimensions', () => {
  const field = createField();

  assert.strictEqual(field.minX, 1, 'minX should be 1');
  assert.strictEqual(field.maxX, FIELD_WIDTH - 2, 'maxX should be width-2');
  assert.strictEqual(field.minY, 1, 'minY should be 1');
  assert.strictEqual(field.maxY, FIELD_HEIGHT - 2, 'maxY should be height-2');
});

// Test Task 2.2: Custom field dimensions
test('Field accepts custom width and height', () => {
  const field = createField(50, 20);

  assert.strictEqual(field.minX, 1, 'minX should be 1 for custom field');
  assert.strictEqual(field.maxX, 48, 'maxX should be width-2 for custom field');
  assert.strictEqual(field.minY, 1, 'minY should be 1 for custom field');
  assert.strictEqual(field.maxY, 18, 'maxY should be height-2 for custom field');
});

// Test Task 2.3: isWall - left wall
test('isWall returns true for left wall (x=0)', () => {
  const field = createField();

  assert.strictEqual(field.isWall(0, 5), true, 'left edge should be wall');
});

// Test Task 2.4: isWall - right wall
test('isWall returns true for right wall (x=width-1)', () => {
  const field = createField();

  assert.strictEqual(field.isWall(FIELD_WIDTH - 1, 5), true, 'right edge should be wall');
});

// Test Task 2.5: isWall - top wall
test('isWall returns true for top wall (y=0)', () => {
  const field = createField();

  assert.strictEqual(field.isWall(10, 0), true, 'top edge should be wall');
});

// Test Task 2.6: isWall - bottom wall
test('isWall returns true for bottom wall (y=height-1)', () => {
  const field = createField();

  assert.strictEqual(field.isWall(10, FIELD_HEIGHT - 1), true, 'bottom edge should be wall');
});

// Test Task 2.7: isWall - interior cells are not walls
test('isWall returns false for interior cells', () => {
  const field = createField();

  assert.strictEqual(field.isWall(5, 5), false, 'interior cell should not be wall');
  assert.strictEqual(field.isWall(FIELD_WIDTH / 2, FIELD_HEIGHT / 2), false, 'center cell should not be wall');
});

// Test Task 2.8: isWithinBounds - within playable area
test('isWithinBounds returns true for cells inside bounds', () => {
  const field = createField();

  assert.strictEqual(field.isWithinBounds(5, 5), true, 'cell inside bounds should return true');
  assert.strictEqual(field.isWithinBounds(FIELD_WIDTH / 2, FIELD_HEIGHT / 2), true, 'center cell should be within bounds');
});

// Test Task 2.9: isWithinBounds - outside left boundary
test('isWithinBounds returns false for cells to the left', () => {
  const field = createField();

  assert.strictEqual(field.isWithinBounds(0, 5), false, 'left of playable area should be out of bounds');
});

// Test Task 2.10: isWithinBounds - outside right boundary
test('isWithinBounds returns false for cells to the right', () => {
  const field = createField();

  assert.strictEqual(field.isWithinBounds(FIELD_WIDTH, 5), false, 'right of playable area should be out of bounds');
});

// Test Task 2.11: isWithinBounds - outside top boundary
test('isWithinBounds returns false for cells above', () => {
  const field = createField();

  assert.strictEqual(field.isWithinBounds(5, 0), false, 'above playable area should be out of bounds');
});

// Test Task 2.12: isWithinBounds - outside bottom boundary
test('isWithinBounds returns false for cells below', () => {
  const field = createField();

  assert.strictEqual(field.isWithinBounds(5, FIELD_HEIGHT), false, 'below playable area should be out of bounds');
});

// Test Task 2.13: isEmpty - empty cell returns true
test('isEmpty returns true for cells without entities', () => {
  const field = createField();

  assert.strictEqual(field.isEmpty(5, 5), true, 'empty cell should return true');
});

// Test Task 2.14: placeEntity and isEmpty - placing enemy makes cell not empty
test('placeEntity marks cell as occupied', () => {
  const field = createField();

  assert.strictEqual(field.isEmpty(10, 10), true, 'cell should be empty before placement');

  field.placeEntity(10, 10, 'enemy');

  assert.strictEqual(field.isEmpty(10, 10), false, 'cell with enemy should not be empty');
});

// Test Task 2.15: placeEntity - multiple entities at different positions
test('placeEntity can place multiple entities', () => {
  const field = createField();

  field.placeEntity(5, 5, 'enemy');
  field.placeEntity(10, 10, 'enemy');
  field.placeEntity(20, 15, 'enemy');

  assert.strictEqual(field.isEmpty(5, 5), false);
  assert.strictEqual(field.isEmpty(10, 10), false);
  assert.strictEqual(field.isEmpty(20, 15), false);
  assert.strictEqual(field.isEmpty(15, 15), true);
});

// Test Task 2.16: removeEntity - removes entity and makes cell empty again
test('removeEntity clears entity from cell', () => {
  const field = createField();

  field.placeEntity(10, 10, 'enemy');
  assert.strictEqual(field.isEmpty(10, 10), false);

  field.removeEntity(10, 10);

  assert.strictEqual(field.isEmpty(10, 10), true, 'cell should be empty after removal');
});

// Test Task 2.17: removeEntity - removing non-existent entity doesn't crash
test('removeEntity on empty cell does not throw', () => {
  const field = createField();

  assert.doesNotThrow(() => {
    field.removeEntity(5, 5);
  }, 'removing from empty cell should not throw');
});

// Test Task 2.18: getCell - returns correct entity type
test('getCell returns the correct entity type', () => {
  const field = createField();

  assert.strictEqual(field.getCell(5, 5), 'empty', 'empty cell should return "empty"');

  field.placeEntity(10, 10, 'enemy');
  assert.strictEqual(field.getCell(10, 10), 'enemy', 'cell with enemy should return "enemy"');
});

// Test Task 2.19: isSafeZone - bottom rows are safe zone
test('isSafeZone returns true for safe zone (bottom rows)', () => {
  const field = createField();

  // Safe zone should be the bottom SAFE_ZONE_ROWS cells of playable area
  const safeY = FIELD_HEIGHT - 2; // Bottom playable row
  assert.strictEqual(field.isSafeZone(safeY), true, 'bottom playable row should be safe zone');
});

// Test Task 2.20: isSafeZone - upper rows are not safe zone
test('isSafeZone returns false for non-safe zone (upper rows)', () => {
  const field = createField();

  // Top of playable area should NOT be safe zone
  assert.strictEqual(field.isSafeZone(1), false, 'top playable row should not be safe zone');
});

// Test Task 2.21: getEmptyCells - returns all empty cells in playable area
test('getEmptyCells returns list of empty cell coordinates', () => {
  const field = createField();

  const emptyCells = field.getEmptyCells();

  assert(Array.isArray(emptyCells), 'should return an array');
  assert(emptyCells.length > 0, 'should have some empty cells initially');

  // Each element should be [x, y] tuple
  for (const cell of emptyCells) {
    assert(Array.isArray(cell), 'each cell should be an array');
    assert.strictEqual(cell.length, 2, 'each cell should have x and y coordinates');
    const [x, y] = cell;
    assert(field.isWithinBounds(x, y), `${[x, y]} should be within bounds`);
  }
});

// Test Task 2.22: getEmptyCells - excludes cells with entities
test('getEmptyCells excludes cells occupied by entities', () => {
  const field = createField();

  // Place some enemies
  field.placeEntity(10, 10, 'enemy');
  field.placeEntity(20, 20, 'enemy');

  const emptyCells = field.getEmptyCells();

  // Verify [10, 10] is not in the list
  const has10_10 = emptyCells.some(cell => cell[0] === 10 && cell[1] === 10);
  assert.strictEqual(has10_10, false, '[10, 10] should not be in empty cells');

  // Verify [20, 20] is not in the list
  const has20_20 = emptyCells.some(cell => cell[0] === 20 && cell[1] === 20);
  assert.strictEqual(has20_20, false, '[20, 20] should not be in empty cells');
});

// Test Task 2.23: clear - clears all entities from field
test('clear removes all entities', () => {
  const field = createField();

  // Place multiple enemies in the playable area
  for (let i = 0; i < 10; i++) {
    field.placeEntity(5 + i, 5 + i, 'enemy');
  }

  const beforeClearEmptyCount = field.getEmptyCells().length;

  field.clear();

  const afterClearEmptyCount = field.getEmptyCells().length;
  assert.strictEqual(afterClearEmptyCount, beforeClearEmptyCount + 10, 'all cells should be empty after clear');
});

// Test Task 2.24: Boundary coordinates are not in playable area
test('Boundary walls are excluded from getEmptyCells', () => {
  const field = createField();

  const emptyCells = field.getEmptyCells();

  // Wall cells should never be in the empty cells list
  for (const cell of emptyCells) {
    const [x, y] = cell;
    assert(!field.isWall(x, y), `${[x, y]} should not be a wall`);
    assert(field.isWithinBounds(x, y), `${[x, y]} should be within bounds`);
  }
});

// Test Task 2.25: Safe zone calculation correctness
test('isSafeZone correctly identifies SAFE_ZONE_ROWS from bottom', () => {
  const field = createField();

  // Calculate expected safe zone threshold
  const safeThreshold = FIELD_HEIGHT - 1 - SAFE_ZONE_ROWS;

  for (let y = 0; y < FIELD_HEIGHT; y++) {
    if (y >= safeThreshold) {
      assert.strictEqual(field.isSafeZone(y), true, `y=${y} should be in safe zone`);
    } else {
      assert.strictEqual(field.isSafeZone(y), false, `y=${y} should not be in safe zone`);
    }
  }
});

// Summary
console.log('\n=== Test Summary ===');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total: ${passed + failed}\n`);

if (failed > 0) {
  process.exit(1);
}
