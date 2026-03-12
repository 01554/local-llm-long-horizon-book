import { describe, it } from 'node:test';
import assert from 'node:assert';
import * as models from './src/models.ts';

describe('Task 1: models.ts - データ定義と定数', () => {
  it('FIELD_WIDTH は 75 でなければならない', () => {
    assert.strictEqual(models.FIELD_WIDTH, 75);
  });

  it('FIELD_HEIGHT は 26 でなければならない', () => {
    assert.strictEqual(models.FIELD_HEIGHT, 26);
  });

  it('SAFE_ZONE_ROWS は 7 でなければならない', () => {
    assert.strictEqual(models.SAFE_ZONE_ROWS, 7);
  });

  it('PLAYER_WIDTH は 5 でなければならない', () => {
    assert.strictEqual(models.PLAYER_WIDTH, 5);
  });

  it('MAX_REFLECTION_COUNT は 3 でなければならない', () => {
    assert.strictEqual(models.MAX_REFLECTION_COUNT, 3);
  });

  it('SCORE_PER_ENEMY は 100 でなければならない', () => {
    assert.strictEqual(models.SCORE_PER_ENEMY, 100);
  });

  it('TICK_INTERVAL_MS は 100 でなければならない', () => {
    assert.strictEqual(models.TICK_INTERVAL_MS, 100);
  });

  it('AUTO_FIRE_INTERVAL は 3 でなければならない', () => {
    assert.strictEqual(models.AUTO_FIRE_INTERVAL, 3);
  });

  it('PLAYER_DISPLAY は "==A==" でなければならない', () => {
    assert.strictEqual(models.PLAYER_DISPLAY, '==A==');
  });

  it('ENEMY_DISPLAY は "@" でなければならない', () => {
    assert.strictEqual(models.ENEMY_DISPLAY, '@');
  });

  it('BULLET_DISPLAY.up は "^" でなければならない', () => {
    assert.strictEqual(models.BULLET_DISPLAY.up, '^');
  });

  it('BULLET_DISPLAY.down は "v" でなければならない', () => {
    assert.strictEqual(models.BULLET_DISPLAY.down, 'v');
  });

  it('BULLET_DISPLAY.left は "<" でなければならない', () => {
    assert.strictEqual(models.BULLET_DISPLAY.left, '<');
  });

  it('BULLET_DISPLAY.right は ">" でなければならない', () => {
    assert.strictEqual(models.BULLET_DISPLAY.right, '>');
  });

  it('OPPOSITE_DIRECTION.up は "down" でなければならない', () => {
    assert.strictEqual(models.OPPOSITE_DIRECTION.up, 'down');
  });

  it('OPPOSITE_DIRECTION.down は "up" でなければならない', () => {
    assert.strictEqual(models.OPPOSITE_DIRECTION.down, 'up');
  });

  it('OPPOSITE_DIRECTION.left は "right" でなければならない', () => {
    assert.strictEqual(models.OPPOSITE_DIRECTION.left, 'right');
  });

  it('OPPOSITE_DIRECTION.right は "left" でなければならない', () => {
    assert.strictEqual(models.OPPOSITE_DIRECTION.right, 'left');
  });

  it('CLOCKWISE_90.up は "right" でなければならない', () => {
    assert.strictEqual(models.CLOCKWISE_90.up, 'right');
  });

  it('CLOCKWISE_90.right は "down" でなければならない', () => {
    assert.strictEqual(models.CLOCKWISE_90.right, 'down');
  });

  it('CLOCKWISE_90.down は "left" でなければならない', () => {
    assert.strictEqual(models.CLOCKWISE_90.down, 'left');
  });

  it('CLOCKWISE_90.left は "up" でなければならない', () => {
    assert.strictEqual(models.CLOCKWISE_90.left, 'up');
  });

  it('DIRECTION_DELTA.up は [0, -1] でなければならない', () => {
    assert.deepStrictEqual(models.DIRECTION_DELTA.up, [0, -1]);
  });

  it('DIRECTION_DELTA.down は [0, 1] でなければならない', () => {
    assert.deepStrictEqual(models.DIRECTION_DELTA.down, [0, 1]);
  });

  it('DIRECTION_DELTA.left は [-1, 0] でなければならない', () => {
    assert.deepStrictEqual(models.DIRECTION_DELTA.left, [-1, 0]);
  });

  it('DIRECTION_DELTA.right は [1, 0] でなければならない', () => {
    assert.deepStrictEqual(models.DIRECTION_DELTA.right, [1, 0]);
  });

  it('INPUT_ACTIONS は ["left", "right", "fire", "restart"] でなければならない', () => {
    assert.deepStrictEqual(models.INPUT_ACTIONS, ['left', 'right', 'fire', 'restart']);
  });

  it('Bullet インターフェースは id, x, y, direction, reflectionCount を含むべき', () => {
    const bullet: models.Bullet = {
      id: 1,
      x: 10,
      y: 5,
      direction: 'up',
      reflectionCount: 0
    };
    assert.strictEqual(bullet.id, 1);
    assert.strictEqual(bullet.x, 10);
    assert.strictEqual(bullet.y, 5);
    assert.strictEqual(bullet.direction, 'up');
    assert.strictEqual(bullet.reflectionCount, 0);
  });

  it('Enemy インターフェースは id, x, y を含むべき', () => {
    const enemy: models.Enemy = {
      id: 1,
      x: 20,
      y: 10
    };
    assert.strictEqual(enemy.id, 1);
    assert.strictEqual(enemy.x, 20);
    assert.strictEqual(enemy.y, 10);
  });

  it('GameState インターフェースは必要な全プロパティを含むべき', () => {
    const state: models.GameState = {
      playerX: 35,
      playerY: 24,
      playerWidth: 5,
      bullets: [],
      enemies: [],
      score: 0,
      turn: 0,
      gameOver: false,
      autoFireEnabled: false
    };
    assert.strictEqual(state.playerX, 35);
    assert.strictEqual(state.playerY, 24);
    assert.strictEqual(state.playerWidth, 5);
    assert.deepStrictEqual(state.bullets, []);
    assert.deepStrictEqual(state.enemies, []);
    assert.strictEqual(state.score, 0);
    assert.strictEqual(state.turn, 0);
    assert.strictEqual(state.gameOver, false);
    assert.strictEqual(state.autoFireEnabled, false);
  });
});
