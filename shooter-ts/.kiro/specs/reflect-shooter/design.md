# 技術設計書 - 反射分裂シューティング

| 属性 | 値 |
|------|-----|
| 機能名 | reflect-shooter |
| 言語 | ja |
| 技術スタック | TypeScript (Node.js, raw mode + ANSI escape) |
| 作成日 | 2026-03-10 |
| 状態 | 生成済み |

---

## 1. システム概要

### 1.1 目的
ターン制 CLI シューティングゲームを TypeScript + Node.js raw mode で実装する。弾の壁反射・分裂・合体メカニクスを特徴とする。

### 1.2 範囲
- Node.js 22+ 環境での CLI ゲーム実行（`node --experimental-strip-types`）
- raw mode + ANSI エスケープによる画面描画とキー入力
- 外部ライブラリなし（Node.js 標準モジュールのみ）

---

## 2. アーキテクチャ

### 2.1 レイヤー構成

| レイヤー | 責務 | 対応モジュール |
|----------|------|----------------|
| Presentation | ANSI 描画、キー入力 | `renderer.ts`, `input_handler.ts` |
| Application | ゲーム進行、tick 制御 | `game_controller.ts` |
| Domain | ゲームロジック | `field.ts`, `bullet_manager.ts`, `enemy_manager.ts`, `player.ts` |
| Infrastructure | データ定義、スコア | `models.ts`, `score_manager.ts` |

### 2.2 依存関係図

```
index.ts (Entry Point)
  └── GameController
        ├── Field
        ├── Player
        ├── BulletManager ←→ BulletCombat (相互参照)
        ├── EnemyManager
        └── ScoreManager
  └── Renderer (ANSI escape)
  └── InputHandler (raw mode)
```

### 2.3 依存マトリクス

| From \ To | index | game_ctrl | field | player | bullet_mgr | bullet_combat | enemy_mgr | score_mgr | renderer | input | models |
|-----------|-------|-----------|-------|--------|------------|---------------|-----------|-----------|----------|-------|-------|
| index     | -     | ✓         | ✓     | ✓      | ✓          | ✓             | ✓         | ✓         | ✓        | ✓     | ✓     |
| game_ctrl | -     | -         | ✓     | ✓      | ✓          | -             | ✓         | ✓         | -        | -     | ✓     |
| field     | -     | -         | -     | -      | -          | -             | -         | -         | -        | -     | ✓     |
| player    | -     | -         | -     | -      | -          | -             | -         | -         | -        | -     | ✓     |
| bullet_mgr| -    | -         | ✓     | -      | -          | ✓             | -         | -         | -        | -     | ✓     |
| bullet_combat| -  | -         | ✓     | ✓      | ✓          | -             | ✓         | ✓         | -        | -     | ✓     |
| enemy_mgr | -    | -         | ✓     | -      | -          | -             | -         | -         | -        | -     | ✓     |
| score_mgr | -    | -         | -     | -      | -          | -             | -         | -         | -        | -     | -     |
| renderer  | -    | -         | ✓     | -      | -          | -             | -         | -         | -        | -     | ✓     |
| input     | -    | ✓         | -     | -      | -          | -             | -         | -         | -        | -     | ✓     |
| models    | -    | -         | -     | -      | -          | -             | -         | -         | -        | -     | -     |

---

## 3. コンポーネント設計

### 3.1 コンポーネント一覧

| ID | コンポーネント | ファイル | 責務 |
|----|----------------|----------|------|
| C1 | Models | `models.ts` | 型定義、定数 |
| C2 | Field | `field.ts` | グリッド管理 |
| C3 | ScoreManager | `score_manager.ts` | スコア管理 |
| C4 | Player | `player.ts` | 自機管理 |
| C5 | BulletManager | `bullet_manager.ts` | 弾管理（発射・移動・壁反射） |
| C5b | BulletCombat | `bullet_combat.ts` | 弾-的衝突・分裂・弾同士衝突・合体・被弾判定 |
| C6 | EnemyManager | `enemy_manager.ts` | 的管理 |
| C7 | GameController | `game_controller.ts` | ゲーム進行制御 |
| C8 | Renderer | `renderer.ts` | ANSI escape 画面描画 |
| C9 | InputHandler | `input_handler.ts` | raw mode キー入力 |
| C10 | Index | `index.ts` | エントリーポイント |

---

### C1: Models (`models.ts`)

**責務**: 共通型定義と定数

```typescript
// 定数
export const FIELD_WIDTH = 75;
export const FIELD_HEIGHT = 26;
export const SAFE_ZONE_ROWS = 7;
export const PLAYER_WIDTH = 5;
export const MAX_REFLECTION_COUNT = 3;
export const SCORE_PER_ENEMY = 100;
export const TICK_INTERVAL_MS = 100;
export const AUTO_FIRE_INTERVAL = 3;  // 3ターンに1発

export const PLAYER_DISPLAY = "==A==";
export const ENEMY_DISPLAY = "@";
export const BULLET_DISPLAY: Record<string, string> = {
  up: "^", down: "v", left: "<", right: ">"
};

// 方向
export const OPPOSITE_DIRECTION: Record<string, string> = {
  up: "down", down: "up", left: "right", right: "left"
};
export const CLOCKWISE_90: Record<string, string> = {
  up: "right", right: "down", down: "left", left: "up"
};
export const DIRECTION_DELTA: Record<string, [number, number]> = {
  up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0]
};

// InputAction: InputHandler → GameController の契約
// この4値のみ GameController.handleInput() に渡してよい
export const INPUT_ACTIONS = ["left", "right", "fire", "restart"] as const;
export type InputAction = typeof INPUT_ACTIONS[number];

// データ型
export interface Bullet {
  id: number;
  x: number;
  y: number;
  direction: string;  // "up" | "down" | "left" | "right"
  reflectionCount: number;
}

export interface Enemy {
  id: number;
  x: number;
  y: number;
}

export interface GameState {
  playerX: number;
  playerY: number;
  playerWidth: number;
  bullets: Bullet[];
  enemies: Enemy[];
  score: number;
  turn: number;
  gameOver: boolean;
  autoFireEnabled: boolean;
}
```

**依存関係**: なし

---

### C2: Field (`field.ts`)

**責務**: グリッド管理、境界判定

```typescript
import { FIELD_WIDTH, FIELD_HEIGHT, SAFE_ZONE_ROWS } from './models.js';

export class Field {
  readonly minX: number;
  readonly maxX: number;
  readonly minY: number;
  readonly maxY: number;
  private grid: string[][];  // grid[y][x], "empty" | "enemy" | "wall"

  constructor(width: number = FIELD_WIDTH, height: number = FIELD_HEIGHT) {
    // 壁は境界座標（x=0, x=width-1, y=0, y=height-1）
    // 弾と自機はグリッドに配置しない（座標で管理）
    // 座標系: 全体座標を使う。壁込みで 0 <= x < width, 0 <= y < height
    // プレイ可能エリア: minX..maxX, minY..maxY
    this.minX = 1;
    this.maxX = width - 2;
    this.minY = 1;
    this.maxY = height - 2;
  }

  isWall(x: number, y: number): boolean { /* ... */ }
  isWithinBounds(x: number, y: number): boolean { /* ... */ }
  isEmpty(x: number, y: number): boolean { /* ... */ }
  isSafeZone(y: number): boolean {
    // y > height - 1 - SAFE_ZONE_ROWS なら安全地帯
  }

  placeEntity(x: number, y: number, entityType: string): void { /* ... */ }
  removeEntity(x: number, y: number): void { /* ... */ }
  getEmptyCells(): [number, number][] {
    // 空きマスの [x, y] リストを返す（壁・敵を除く）
  }

  clear(): void { /* ... */ }
  getCell(x: number, y: number): string { /* ... */ }
}
```

**グリッド管理方針**:
- **的はグリッドに配置**: `placeEntity(x, y, "enemy")` / `removeEntity(x, y)`
- **弾・自機はグリッドに配置しない**: 座標で管理

**依存関係**: `models.ts`

---

### C3: ScoreManager (`score_manager.ts`)

**責務**: スコア加算・保持

```typescript
export class ScoreManager {
  private score: number = 0;

  addScore(points: number): void { /* ... */ }
  getScore(): number { /* ... */ }
  reset(): void { /* ... */ }
}
```

**依存関係**: なし

---

### C4: Player (`player.ts`)

**責務**: 自機位置管理

```typescript
import { PLAYER_WIDTH } from './models.js';

export class Player {
  constructor(fieldWidth: number, fieldHeight: number) {
    // 初期位置: x = Math.floor(fieldWidth / 2) - Math.floor(PLAYER_WIDTH / 2)
    // y = fieldHeight - 2
    //（y=0 が上壁、y=fieldHeight-1 が下壁なので、fieldHeight-2 がプレイエリアの最下行）
    // fieldWidth, fieldHeight は数値。Field オブジェクトではない。
  }

  moveLeft(): void { /* ... */ }
  moveRight(): void { /* ... */ }
  getPosition(): [number, number] {
    // [x, y] を返す
  }
  getWidth(): number {
    // 5 を返す
  }
  collidesWith(x: number, y: number): boolean {
    // (x, y) が自機の5マス幅に含まれるか
  }
  reset(): void { /* ... */ }
}
```

**依存関係**: `models.ts`（PLAYER_WIDTH のみ）

---

### C5: BulletManager (`bullet_manager.ts`)

**責務**: 弾管理（発射・移動・壁反射）

```typescript
import { Field } from './field.js';
import { Bullet, DIRECTION_DELTA, OPPOSITE_DIRECTION, MAX_REFLECTION_COUNT } from './models.js';
import type { BulletCombat } from './bullet_combat.js';
import type { Player } from './player.js';

export class BulletManager {
  private _bullets: Bullet[] = [];
  private _newbornBullets: Bullet[] = [];
  private _nextId: number = 0;
  private _combat: BulletCombat | null = null;

  constructor(private field: Field) {}

  setCombat(combat: BulletCombat): void {
    // BulletCombat を注入（循環参照回避のため後から設定）
  }

  fireBullet(x: number, y: number, direction: string): void {
    // 弾を生成して _newbornBullets に追加（そのターンは移動・衝突に参加しない）
  }

  moveBullets(): void {
    // 既存弾（_bullets）のみを進行方向に1マス移動。
    // 次の位置が壁なら移動せず方向だけ反転し reflectionCount += 1。
    // reflectionCount が MAX_REFLECTION_COUNT に達したら消滅。
    // 壁マスには絶対に入らない（反射ターンでは位置変わらず）。
  }

  promoteNewborns(): void {
    // _newbornBullets を _bullets に合流させ、_newbornBullets を空にする
  }

  getBullets(): Bullet[] {
    // _bullets のコピーを返す（外部からの破壊を防ぐ）
  }
  clear(): void { /* ... */ }

  // 以下は BulletCombat に委譲
  handleEnemyCollisions(): void {
    this._combat!.handleEnemyCollisions(this._bullets);
  }

  handleBulletCollisions(): void {
    this._combat!.handleBulletCollisions(this._bullets);
  }

  mergeBullets(): void {
    this._combat!.mergeBullets(this._bullets);
  }

  checkPlayerHit(player: Player): boolean {
    return this._combat!.checkPlayerHit(this._bullets, player);
  }
}
```

**依存関係**: `Field`, `BulletCombat`（setCombat で注入）, `models.ts`

---

### C5b: BulletCombat (`bullet_combat.ts`)

**責務**: 弾-的衝突・分裂・弾同士衝突・合体・被弾判定

```typescript
import { Field } from './field.js';
import { EnemyManager } from './enemy_manager.js';
import { ScoreManager } from './score_manager.js';
import { BulletManager } from './bullet_manager.js';
import { Player } from './player.js';
import { Bullet, SCORE_PER_ENEMY, CLOCKWISE_90 } from './models.js';

export class BulletCombat {
  constructor(
    private field: Field,
    private enemyManager: EnemyManager,
    private scoreManager: ScoreManager,
    private bulletManager: BulletManager,
    private rng: () => number  // 0〜1の乱数を返す関数
  ) {}

  handleEnemyCollisions(bullets: Bullet[]): void {
    // 弾-的衝突。上向き→左右分裂、横向き→上下分裂、下向き→消去のみ。
    // 分裂時は bulletManager.fireBullet() で新弾を追加。
    // 的消滅 + スコア加算。
  }

  handleBulletCollisions(bullets: Bullet[]): void {
    // 反対方向弾の衝突。各弾1/2確率で消滅、生存弾は時計回り90度回転
  }

  mergeBullets(bullets: Bullet[]): void {
    // 同じマス・同じ方向の弾を合体。反射回数は少ない方を採用
  }

  checkPlayerHit(bullets: Bullet[], player: Player): boolean {
    // 下向き弾が自機位置にあるか判定
  }
}
```

**分裂ロジック** (`handleEnemyCollisions` 内):
```typescript
// 上向き弾が的に命中 (Req 4.1)
if (bullet.direction === "up") {
  // 弾消滅 + 左右に分裂（反射回数0）
  this.bulletManager.fireBullet(x, y, "left");
  this.bulletManager.fireBullet(x, y, "right");
}

// 横向き弾が的に命中 (Req 4.2)
if (bullet.direction === "left" || bullet.direction === "right") {
  // 弾消滅 + 上下に分裂（反射回数0）
  this.bulletManager.fireBullet(x, y, "up");
  this.bulletManager.fireBullet(x, y, "down");
}

// 下向き弾が的に命中 (Req 4.3)
if (bullet.direction === "down") {
  // 弾も的も消滅。分裂しない
}
```

**弾-弾衝突ロジック** (`handleBulletCollisions` 内, Req 6.1):
```typescript
// 反対方向ペアを検出（同じマスの上/下、左/右）
// 各弾は独立に this.rng() < 0.5 で消滅判定
// 生存弾は CLOCKWISE_90 で方向回転 + reflectionCount += 1
```

**合体ロジック** (`mergeBullets` 内, Req 7.1):
```typescript
// (x, y, direction) でグループ化
// グループ内に2個以上 → 反射回数最小の弾1つを残し、他を削除
```

**依存関係**: `Field`, `EnemyManager`, `ScoreManager`, `BulletManager`, `models.ts`

**RNG注意**: Python版では `random.Random` オブジェクトを渡していたが、TypeScript版では `() => number` 型の関数を渡す。テスト時はシード付き乱数関数を渡せるようにするため。

---

### C6: EnemyManager (`enemy_manager.ts`)

**責務**: 的の生成・消滅管理

```typescript
import { Field } from './field.js';
import { Enemy } from './models.js';

export class EnemyManager {
  private _enemies: Enemy[] = [];
  private _nextId: number = 0;

  constructor(
    private field: Field,
    private rng: () => number  // 0〜1の乱数を返す関数
  ) {}

  spawnEnemy(blockedCells: Set<string>): void {
    // blockedCells を除いた空きマスからランダムに 1 マス選んで的を配置。
    // blockedCells には "x,y" 形式の文字列を格納する（Set<string>）。
    // GameController が組み立てて渡す。
    // ランダム選択: Math.floor(this.rng() * candidates.length) を使う
  }

  ensureMinimumEnemies(blockedCells: Set<string>): void {
    // 的が0個なら即座に1個生成 (Req 8.3)。blockedCells を spawnEnemy に渡す
  }

  removeEnemyAt(x: number, y: number): void {
    // 指定座標の的を除去
  }

  getEnemies(): Enemy[] {
    // _enemies のコピーを返す（外部からの破壊を防ぐ）
  }
  getEnemyCount(): number { /* ... */ }

  maybeSpawnEnemy(turnCount: number, blockedCells: Set<string>): void {
    // 30ターンごとに頻度上昇。確率判定（this.rng()）で spawnEnemy 呼び出し
  }

  clear(): void { /* ... */ }
}
```

**頻度管理**:
```typescript
const SPAWN_RATES: [number, number][] = [
  [0, 0.1],    // 初期
  [30, 0.15],
  [60, 0.2],
  [90, 0.25],
  [120, 0.3],  // 上限
];
```

**blockedCells の型**: Python版では `set[tuple[int, int]]` だったが、TypeScript では `Set<string>` を使い、`"x,y"` 形式の文字列で管理する。`Set` にタプルは使えないため。

**依存関係**: `Field`, `models.ts`

---

### C7: GameController (`game_controller.ts`)

**責務**: ゲーム進行統制

```typescript
import { Field } from './field.js';
import { Player } from './player.js';
import { BulletManager } from './bullet_manager.js';
import { EnemyManager } from './enemy_manager.js';
import { ScoreManager } from './score_manager.js';
import { GameState, AUTO_FIRE_INTERVAL, SAFE_ZONE_ROWS } from './models.js';

export class GameController {
  autoFireEnabled: boolean = false;
  fireCooldown: number = 0;

  constructor(
    private field: Field,
    private player: Player,
    private bulletManager: BulletManager,
    private enemyManager: EnemyManager,
    private scoreManager: ScoreManager
  ) {}

  tick(): void {
    // 1ターン進行。以下の順序で処理（この順序を厳守すること）:
    // 1. 既存弾を1ターン進める (moveBullets) — 壁反射もこの中で処理
    // 2. 弾-的衝突を解決する (handleEnemyCollisions) — 分裂弾は newborn に積む
    // 3. 弾-弾衝突を解決する (handleBulletCollisions) — 既存弾のみ
    // 4. newborn を本体に合流する (promoteNewborns)
    // 5. 同方向弾の合体 (mergeBullets)
    // 6. blockedCells を組み立てる（自機5マス + 全弾座標 + 既存敵 + 安全地帯）
    // 7. 的0なら即生成 (ensureMinimumEnemies(blockedCells))
    // 8. 確率による追加生成 (maybeSpawnEnemy(turnCount, blockedCells))
    // 9. 自機被弾判定 (checkPlayerHit)
    // 10. 自動連射: autoFireEnabled が ON なら
    //     - fireCooldown === 0 → 弾を発射（newborn に積む）して fireCooldown = AUTO_FIRE_INTERVAL
    //     - fireCooldown > 0 → fireCooldown -= 1
    // 11. turnCount += 1
    // 注意: tick() 内で描画は行わない
  }

  handleInput(action: string): void {
    // action は "left" | "right" | "fire" | "restart" を受け付ける。
    // "fire" はトグル: autoFireEnabled を反転。
    //   ON にしたら fireCooldown = 0（即発射可能にする）。
    // "restart" は gameOver 状態の時のみ有効。reset() を呼ぶ。
  }

  isGameOver(): boolean { /* ... */ }
  reset(): void { /* ... */ }
  getState(): GameState {
    // GameState を返す。autoFireEnabled を含める
  }
}
```

**blockedCells の組み立て** (tick ステップ 6):
```typescript
const blockedCells = new Set<string>();
// 自機の5マス
const [px, py] = this.player.getPosition();
for (let i = 0; i < this.player.getWidth(); i++) {
  blockedCells.add(`${px + i},${py}`);
}
// 全弾座標
for (const b of this.bulletManager.getBullets()) {
  blockedCells.add(`${b.x},${b.y}`);
}
// 既存敵
for (const e of this.enemyManager.getEnemies()) {
  blockedCells.add(`${e.x},${e.y}`);
}
// 安全地帯
for (let y = this.field.maxY - SAFE_ZONE_ROWS + 1; y <= this.field.maxY; y++) {
  for (let x = this.field.minX; x <= this.field.maxX; x++) {
    blockedCells.add(`${x},${y}`);
  }
}
```

**依存関係**: `Field`, `Player`, `BulletManager`, `EnemyManager`, `ScoreManager`

---

### C8: Renderer (`renderer.ts`)

**責務**: ANSI escape による画面描画

```typescript
import { Field } from './field.js';
import { GameState, BULLET_DISPLAY, ENEMY_DISPLAY, PLAYER_DISPLAY } from './models.js';

export class Renderer {
  private useAnsi: boolean;

  constructor(private field: Field, useAnsi: boolean = true) {
    // useAnsi=false ならテストモード（process.stdout.write を呼ばない）
    this.useAnsi = useAnsi;
  }

  buildFrame(state: GameState): string[] {
    // 画面内容を文字列リストとして構築（純粋ロジック、ANSI 不要）。
    // 戻り値は各行の文字列のリスト。
  }

  render(state: GameState): void {
    // buildFrame() の結果を ANSI escape で画面に出力。
    // "\x1b[H" でカーソルを左上に移動してから各行を出力
  }

  renderGameOver(state: GameState): void {
    // ゲームオーバー画面
  }
}
```

**描画フォーマット** (`buildFrame()` の返す行):
```
行 0:   タイトル "反射分裂シューティング"（中央寄せ）
行 1:   上壁 "+-----------...----------+"
行 2-25: フィールド本体（"|" + 73文字 + "|"）
行 26:  下壁 "+-----------...----------+"
行 27:  スコア "SCORE: 1250  TURN: 340  ENEMIES: 4"
行 28:  状態表示 "FIRE: ON  [SPACE] TOGGLE  [A/D] MOVE  [R] RESTART  [Q] QUIT"
```

**テスト方針**: `new Renderer(field, false)` で生成し、`buildFrame(state)` を呼んで返り値の文字列リストを検証する。`render()` は ANSI 依存なのでテストでは呼ばない。

**依存関係**: `Field`, `models.ts`

---

### C9: InputHandler (`input_handler.ts`)

**責務**: raw mode キー入力処理

```typescript
import { GameController } from './game_controller.js';

export class InputHandler {
  private _shouldQuit: boolean = false;

  constructor(private controller: GameController) {}

  handleKeypress(key: Buffer): void {
    // process.stdin の 'data' イベントから受け取った Buffer を処理。
    // キーマッピング:
    //   'a' / 'A' → controller.handleInput("left")
    //   'd' / 'D' → controller.handleInput("right")
    //   ' '       → controller.handleInput("fire")  // トグル連射
    //   'r' / 'R' → controller.handleInput("restart")  // gameOver 時のみ有効
    //   'q' / 'Q' / Ctrl+C (0x03) → ゲーム終了フラグを立てる
  }

  shouldQuit(): boolean {
    return this._shouldQuit;
  }
}
```

**Python版との違い**:
- Python版: `getch()` でポーリング → `poll_input()` メソッド
- TypeScript版: `process.stdin` の `'data'` イベント → `handleKeypress()` メソッド
- TypeScript版ではイベント駆動のため、`poll_input()` は不要。代わりに `index.ts` で `process.stdin.on('data', ...)` で `handleKeypress` を呼ぶ。

**依存関係**: `GameController`, `models.ts`

---

### C10: Index (`index.ts`)

**責務**: エントリーポイント

```typescript
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
  // Step 1: 基盤コンポーネント
  const field = new Field(FIELD_WIDTH, FIELD_HEIGHT);
  const scoreManager = new ScoreManager();
  const player = new Player(FIELD_WIDTH, FIELD_HEIGHT);  // 数値を渡す。Field ではない

  // Step 2: マネージャー
  const rng = () => Math.random();  // テスト時はシード付き関数に置き換え可能
  const enemyManager = new EnemyManager(field, rng);
  const bulletManager = new BulletManager(field);
  const bulletCombat = new BulletCombat(field, enemyManager, scoreManager, bulletManager, rng);
  bulletManager.setCombat(bulletCombat);

  // Step 3: コントローラー
  const controller = new GameController(field, player, bulletManager, enemyManager, scoreManager);

  // Step 4: 描画・入力
  const renderer = new Renderer(field);
  const inputHandler = new InputHandler(controller);

  // Step 5: ターミナル設定
  process.stdout.write("\x1b[?25l");   // カーソル非表示
  process.stdout.write("\x1b[2J");     // 画面クリア
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.on('data', (key: Buffer) => {
    inputHandler.handleKeypress(key);
  });

  // Step 6: 初期の的を配置（blockedCells は初期状態なので空でよい）
  const blockedCells = new Set<string>();
  enemyManager.spawnEnemy(blockedCells);

  // Step 7: ゲームループ（setInterval ベースの tick 管理）
  const gameLoop = setInterval(() => {
    if (inputHandler.shouldQuit()) {
      clearInterval(gameLoop);
      // 終了処理
      process.stdout.write("\x1b[?25h");  // カーソル復元
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
}

main();
```

**重要な制約**:
- Player は `new Player(FIELD_WIDTH, FIELD_HEIGHT)` で生成。`new Player(field)` は**間違い**
- BulletManager は `new BulletManager(field)` で生成し、`BulletCombat` を `setCombat()` で注入する
- GameController に Renderer は含めない（5引数のみ）
- `process.stdin.setRawMode(true)` で raw mode に設定
- 終了時は `process.stdout.write("\x1b[?25h")` でカーソルを復元

**Python版との主な違い**:
- curses → raw mode + ANSI escape
- `curses.wrapper()` の自動クリーンアップ → `process.on('exit', ...)` で手動クリーンアップ
- `time.monotonic()` ベースのループ → `setInterval()` ベースのループ
- `random.Random()` → `() => Math.random()` 関数

**依存関係**: 全コンポーネント

---

## 4. ディレクトリ構成

```
src/
├── index.ts              (C10: Entry Point)
├── game_controller.ts    (C7: Game Controller)
├── field.ts              (C2: Field)
├── player.ts             (C4: Player)
├── bullet_manager.ts     (C5: Bullet Manager)
├── bullet_combat.ts      (C5b: Bullet Combat)
├── enemy_manager.ts      (C6: Enemy Manager)
├── score_manager.ts      (C3: Score Manager)
├── renderer.ts           (C8: Renderer)
├── input_handler.ts      (C9: Input Handler)
└── models.ts             (C1: Models)
```

---

## 5. 要件トレーサビリティ

| 要件 ID | 対応コンポーネント | 実装箇所 |
|---------|-------------------|----------|
| 1.1 | Field | `field.ts` コンストラクタ |
| 1.2 | Renderer | `renderer.ts` render() |
| 1.3 | GameController | `game_controller.ts` tick() |
| 2.1 | Player | `player.ts` コンストラクタ |
| 2.2 | Player | `player.ts` moveLeft/moveRight() |
| 2.3 | BulletManager | `bullet_manager.ts` checkPlayerHit() |
| 3.1 | BulletManager | `bullet_manager.ts` fireBullet() |
| 3.2 | GameController | `game_controller.ts` handleInput() |
| 4.1-4.3 | BulletCombat | `bullet_combat.ts` handleEnemyCollisions() |
| 5.1-5.2 | BulletManager | `bullet_manager.ts` moveBullets() |
| 6.1 | BulletCombat | `bullet_combat.ts` handleBulletCollisions() |
| 7.1 | BulletCombat | `bullet_combat.ts` mergeBullets() |
| 8.1-8.3 | EnemyManager | `enemy_manager.ts` spawn/ensure |
| 9.1 | ScoreManager | `score_manager.ts` addScore() |
| 10.1-10.2 | 全体 | TypeScript + Node.js raw mode |
| 10.3 | 全体 | モジュール分割 |

## 6. import パス規約

TypeScript を `node --experimental-strip-types` で実行する場合、import パスには **`.js` 拡張子** を付ける必要がある。

```typescript
// 正しい
import { Field } from './field.js';
import { FIELD_WIDTH } from './models.js';

// 間違い（実行時エラーになる）
import { Field } from './field';
import { Field } from './field.ts';
```

これは Node.js の ESM 解決ルールに従うためであり、実際のファイルは `.ts` だが import では `.js` と書く。
