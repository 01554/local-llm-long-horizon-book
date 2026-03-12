import { GameController } from './game_controller.js';

export class InputHandler {
  private _shouldQuit: boolean = false;
  private controller: GameController;

  constructor(controller: GameController) {
    this.controller = controller;
  }

  handleKeypress(key: Buffer): void {
    // Handle Ctrl+C (byte value 0x03) first - always quits
    if (key.length === 1 && key[0] === 0x03) {
      this._shouldQuit = true;
      return;
    }

    // Convert to string and check for known keys
    const char = key.toString();
    
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
        // Unknown keys are ignored
        break;
    }
  }

  shouldQuit(): boolean {
    return this._shouldQuit;
  }
}
