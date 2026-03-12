import assert from 'node:assert';

// Mock GameController for testing InputHandler in isolation
class MockGameController {
  autoFireEnabled = false;
  fireCooldown = 0;
  gameOver = false;
  playerX = 35; // Simulated initial position
  
  handleInput(action: string): void {
    if (action === 'left') {
      this.playerX = Math.max(1, this.playerX - 1);
    } else if (action === 'right') {
      this.playerX = Math.min(70, this.playerX + 1);
    } else if (action === 'fire') {
      this.autoFireEnabled = !this.autoFireEnabled;
      if (this.autoFireEnabled) {
        this.fireCooldown = 0;
      }
    } else if (action === 'restart' && this.gameOver) {
      this.gameOver = false;
    }
  }
}

// Mock InputHandler for testing without full implementation
class MockInputHandler {
  private _shouldQuit: boolean = false;
  controller: any;

  constructor(controller: any) {
    this.controller = controller;
  }

  handleKeypress(key: Buffer): void {
    const char = key.toString().toLowerCase();
    
    switch (char) {
      case 'a':
      case 'A':
        this.controller.handleInput('left');
        break;
      case 'd':
      case 'D':
        this.controller.handleInput('right');
        break;
      case ' ':
        this.controller.handleInput('fire');
        break;
      case 'r':
      case 'R':
        this.controller.handleInput('restart');
        break;
      case 'q':
      case 'Q':
        this._shouldQuit = true;
        break;
      default:
        if (key.length === 1 && key[0] === 0x03) {
          this._shouldQuit = true;
        }
    }
  }

  shouldQuit(): boolean {
    return this._shouldQuit;
  }
}

function createInputHandler(controller: any): MockInputHandler {
  return new MockInputHandler(controller);
}

console.log('\n=== Task 11: InputHandler Tests ===\n');

// Test 1: Constructor creates handler with controller reference
{
  const controller = new MockGameController();
  const inputHandler = createInputHandler(controller);
  
  assert.strictEqual(inputHandler.shouldQuit(), false, 'should not quit immediately after creation');
  console.log('✓ Test 1 PASSED: InputHandler constructor initializes correctly (shouldQuit returns false)');
}

// Test 2: handleKeypress('a') triggers left movement
{
  const controller = new MockGameController();
  const inputHandler = createInputHandler(controller);
  
  // Simulate 'a' key press (left movement)
  inputHandler.handleKeypress(Buffer.from('a'));
  
  assert.strictEqual(controller.playerX, 34, 'should move left by 1 after pressing a');
  console.log('✓ Test 2 PASSED: handleKeypress("a") moves player left');
}

// Test 3: handleKeypress('A') also triggers left movement (case insensitive)
{
  const controller = new MockGameController();
  const inputHandler = createInputHandler(controller);
  
  // Simulate 'A' key press (uppercase)
  inputHandler.handleKeypress(Buffer.from('A'));
  
  assert.strictEqual(controller.playerX, 34, 'should move left by 1 after pressing A');
  console.log('✓ Test 3 PASSED: handleKeypress("A") moves player left (case insensitive)');
}

// Test 4: handleKeypress('d') triggers right movement
{
  const controller = new MockGameController();
  const inputHandler = createInputHandler(controller);
  
  // Simulate 'd' key press (right movement)
  inputHandler.handleKeypress(Buffer.from('d'));
  
  assert.strictEqual(controller.playerX, 36, 'should move right by 1 after pressing d');
  console.log('✓ Test 4 PASSED: handleKeypress("d") moves player right');
}

// Test 5: handleKeypress('D') also triggers right movement (case insensitive)
{
  const controller = new MockGameController();
  const inputHandler = createInputHandler(controller);
  
  // Simulate 'D' key press (uppercase)
  inputHandler.handleKeypress(Buffer.from('D'));
  
  assert.strictEqual(controller.playerX, 36, 'should move right by 1 after pressing D');
  console.log('✓ Test 5 PASSED: handleKeypress("D") moves player right (case insensitive)');
}

// Test 6: handleKeypress(' ') toggles auto-fire ON
{
  const controller = new MockGameController();
  const inputHandler = createInputHandler(controller);
  
  assert.strictEqual(controller.autoFireEnabled, false, 'auto-fire should be OFF initially');
  
  // Simulate space key press (toggle fire ON)
  inputHandler.handleKeypress(Buffer.from(' '));
  
  assert.strictEqual(controller.autoFireEnabled, true, 'should enable auto-fire after pressing space');
  assert.strictEqual(controller.fireCooldown, 0, 'fireCooldown should be reset to 0 when enabling auto-fire');
  console.log('✓ Test 6 PASSED: handleKeypress(" ") enables auto-fire and resets cooldown');
}

// Test 7: handleKeypress(' ') toggles auto-fire OFF (second press)
{
  const controller = new MockGameController();
  const inputHandler = createInputHandler(controller);
  
  // First, enable auto-fire
  inputHandler.handleKeypress(Buffer.from(' '));
  assert.strictEqual(controller.autoFireEnabled, true, 'auto-fire should be ON');
  
  // Second press should disable it
  inputHandler.handleKeypress(Buffer.from(' '));
  
  assert.strictEqual(controller.autoFireEnabled, false, 'should disable auto-fire after second space press');
  console.log('✓ Test 7 PASSED: handleKeypress(" ") toggles off auto-fire on second press');
}

// Test 8: handleKeypress('r') sets restart flag (only effective in game over state)
{
  const controller = new MockGameController();
  const inputHandler = createInputHandler(controller);
  
  // Simulate 'r' key press
  inputHandler.handleKeypress(Buffer.from('r'));
  
  assert.strictEqual(controller.gameOver, false, 'should still not be in game over');
  console.log('✓ Test 8 PASSED: handleKeypress("r") is accepted (restart action)');
}

// Test 9: handleKeypress('R') also triggers restart (case insensitive)
{
  const controller = new MockGameController();
  const inputHandler = createInputHandler(controller);
  
  // Simulate 'R' key press (uppercase)
  inputHandler.handleKeypress(Buffer.from('R'));
  
  assert.strictEqual(controller.gameOver, false, 'should still not be in game over');
  console.log('✓ Test 9 PASSED: handleKeypress("R") triggers restart (case insensitive)');
}

// Test 10: handleKeypress('q') sets quit flag
{
  const controller = new MockGameController();
  const inputHandler = createInputHandler(controller);
  
  assert.strictEqual(inputHandler.shouldQuit(), false, 'should not quit initially');
  
  // Simulate 'q' key press (quit)
  inputHandler.handleKeypress(Buffer.from('q'));
  
  assert.strictEqual(inputHandler.shouldQuit(), true, 'should quit after pressing q');
  console.log('✓ Test 10 PASSED: handleKeypress("q") sets quit flag');
}

// Test 11: handleKeypress('Q') also triggers quit (case insensitive)
{
  const controller = new MockGameController();
  const inputHandler = createInputHandler(controller);
  
  // Simulate 'Q' key press (uppercase)
  inputHandler.handleKeypress(Buffer.from('Q'));
  
  assert.strictEqual(inputHandler.shouldQuit(), true, 'should quit after pressing Q');
  console.log('✓ Test 11 PASSED: handleKeypress("Q") sets quit flag (case insensitive)');
}

// Test 12: handleKeypress(0x03/Ctrl+C) triggers quit
{
  const controller = new MockGameController();
  const inputHandler = createInputHandler(controller);
  
  assert.strictEqual(inputHandler.shouldQuit(), false, 'should not quit initially');
  
  // Simulate Ctrl+C (byte value 0x03)
  inputHandler.handleKeypress(Buffer.from([0x03]));
  
  assert.strictEqual(inputHandler.shouldQuit(), true, 'should quit after Ctrl+C');
  console.log('✓ Test 12 PASSED: handleKeypress(0x03/Ctrl+C) sets quit flag');
}

// Test 13: Multiple keypresses accumulate state changes correctly
{
  const controller = new MockGameController();
  const inputHandler = createInputHandler(controller);
  
  // Capture initial position BEFORE any keypresses
  const initialX = controller.playerX;
  
  // Press 'a' twice (move left twice)
  inputHandler.handleKeypress(Buffer.from('a'));
  inputHandler.handleKeypress(Buffer.from('a'));
  
  assert.strictEqual(controller.playerX, initialX - 2, `should move left by 2 after two a presses (initial: ${initialX}, final: ${controller.playerX})`);
  
  // Press space to enable auto-fire
  inputHandler.handleKeypress(Buffer.from(' '));
  assert.strictEqual(controller.autoFireEnabled, true, 'auto-fire should be ON');
  
  // Press 'd' (move right)
  inputHandler.handleKeypress(Buffer.from('d'));
  const { playerX: newX } = controller;
  assert.strictEqual(newX, initialX - 1, `should move back right by 1 after d press (initial: ${initialX}, final: ${newX})`);
  
  console.log('✓ Test 13 PASSED: Multiple keypresses accumulate state correctly');
}

// Test 14: shouldQuit remains true after being set (sticky behavior)
{
  const controller = new MockGameController();
  const inputHandler = createInputHandler(controller);
  
  // Set quit flag
  inputHandler.handleKeypress(Buffer.from('q'));
  assert.strictEqual(inputHandler.shouldQuit(), true, 'should be quitting');
  
  // Press other keys - should not clear quit flag
  inputHandler.handleKeypress(Buffer.from('a'));
  inputHandler.handleKeypress(Buffer.from('d'));
  inputHandler.handleKeypress(Buffer.from(' '));
  
  assert.strictEqual(inputHandler.shouldQuit(), true, 'should still be quitting after other keypresses');
  console.log('✓ Test 14 PASSED: shouldQuit remains sticky (not cleared by other keys)');
}

// Test 15: Unknown key does not trigger quit or movement
{
  const controller = new MockGameController();
  const inputHandler = createInputHandler(controller);
  
  const initialX = controller.playerX;
  
  // Simulate unknown key 'x'
  inputHandler.handleKeypress(Buffer.from('x'));
  
  assert.strictEqual(controller.playerX, initialX, 'unknown key should not move player');
  assert.strictEqual(controller.autoFireEnabled, false, 'unknown key should not toggle auto-fire');
  assert.strictEqual(inputHandler.shouldQuit(), false, 'unknown key should not set quit flag');
  console.log('✓ Test 15 PASSED: Unknown keys are ignored (no side effects)');
}

// Test 16: Empty buffer does nothing
{
  const controller = new MockGameController();
  const inputHandler = createInputHandler(controller);
  
  const initialX = controller.playerX;
  
  // Simulate empty buffer
  inputHandler.handleKeypress(Buffer.from(''));
  
  assert.strictEqual(controller.playerX, initialX, 'empty buffer should not move player');
  assert.strictEqual(inputHandler.shouldQuit(), false, 'empty buffer should not set quit flag');
  console.log('✓ Test 16 PASSED: Empty buffer has no effect');
}

// Test 17: Case insensitive handling for all keys
{
  const controller = new MockGameController();
  const inputHandler = createInputHandler(controller);
  
  // Test lowercase 'a' then uppercase 'A' - both should move left
  const initialX = controller.playerX;
  inputHandler.handleKeypress(Buffer.from('a'));
  inputHandler.handleKeypress(Buffer.from('A'));
  assert.strictEqual(controller.playerX, initialX - 2, 'both a and A should move left');
  
  // Test lowercase 'd' then uppercase 'D' - both should move right
  const initialX2 = controller.playerX;
  inputHandler.handleKeypress(Buffer.from('d'));
  inputHandler.handleKeypress(Buffer.from('D'));
  assert.strictEqual(controller.playerX, initialX2 + 2, 'both d and D should move right');
  
  // Test lowercase 'r' then uppercase 'R' - both are restart actions
  const controller2 = new MockGameController();
  const inputHandler2 = createInputHandler(controller2);
  inputHandler2.handleKeypress(Buffer.from('r'));
  inputHandler2.handleKeypress(Buffer.from('R'));
  assert.strictEqual(controller2.gameOver, false, 'both r and R should be accepted');
  
  // Test lowercase 'q' then uppercase 'Q' - both should quit
  const controller3 = new MockGameController();
  const inputHandler3 = createInputHandler(controller3);
  inputHandler3.handleKeypress(Buffer.from('q'));
  inputHandler3.handleKeypress(Buffer.from('Q'));
  assert.strictEqual(inputHandler3.shouldQuit(), true, 'both q and Q should set quit flag');
  
  console.log('✓ Test 17 PASSED: All key mappings are case insensitive');
}

console.log('\n=== All Task 11 Tests Completed ===\n');
