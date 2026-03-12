import { Field } from './field.js';
import { Player } from './player.js';
import { ScoreManager } from './score_manager.js';
import { EnemyManager } from './enemy_manager.js';
import { BulletManager } from './bullet_manager.js';
import { BulletCombat } from './bullet_combat.js';
import { GameController } from './game_controller.js';
import { Renderer } from './renderer.js';
import { InputHandler } from './input_handler.js';
import { FIELD_WIDTH, FIELD_HEIGHT, TICK_INTERVAL_MS } from './models.js';

function main(): void {
  // Step 1: Base components first
  const field = new Field(FIELD_WIDTH, FIELD_HEIGHT);
  const scoreManager = new ScoreManager();
  const player = new Player(FIELD_WIDTH, FIELD_HEIGHT);

  // Step 2: Managers with RNG
  const rng = () => Math.random();
  const enemyManager = new EnemyManager(field, rng);
  const bulletManager = new BulletManager(field);
  const bulletCombat = new BulletCombat(field, enemyManager, scoreManager, bulletManager, rng);
  bulletManager.setCombat(bulletCombat);

  // Step 3: Controller
  const controller = new GameController(
    field,
    player,
    bulletManager,
    enemyManager,
    scoreManager
  );

  // Step 4: Renderer and InputHandler
  const renderer = new Renderer(field);
  const inputHandler = new InputHandler(controller);

  // Step 5: Terminal setup (raw mode + ANSI escape)
  process.stdout.write('\x1b[?25l');   // Hide cursor
  process.stdout.write('\x1b[2J');     // Clear screen
  process.stdin.setRawMode(true);
  process.stdin.resume();

  process.stdin.on('data', (key: Buffer): void => {
    inputHandler.handleKeypress(key);
  });

  // Step 6: Initial enemy spawn (empty blockedCells for initial state)
  const blockedCells = new Set<string>();
  enemyManager.spawnEnemy(blockedCells);

  // Step 7: Game loop with setInterval
  const gameLoop = setInterval((): void => {
    if (inputHandler.shouldQuit()) {
      clearInterval(gameLoop);
      process.stdout.write('\x1b[?25h');  // Restore cursor
      process.stdin.setRawMode(false);
      process.exit(0);
    }

    if (controller.isGameOver()) {
      renderer.renderGameOver(controller.getState());
    } else {
      controller.tick();
      if (controller.isGameOver()) {
        renderer.renderGameOver(controller.getState());
      } else {
        renderer.render(controller.getState());
      }
    }
  }, TICK_INTERVAL_MS);

  // Cleanup on process exit
  process.on('exit', (): void => {
    process.stdout.write('\x1b[?25h');  // Restore cursor
    process.stdin.setRawMode(false);
  });
}

main();
