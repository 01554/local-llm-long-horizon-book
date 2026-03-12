# 実装タスク - 反射分裂シューティング

| 属性 | 値 |
|------|-----|
| 機能名 | reflect-shooter |
| 言語 | ja |
| 技術スタック | TypeScript (Node.js) |
| 作成日 | 2026-03-10 |
| 状態 | 生成済み |

---

## タスク一覧

- [x] Task 1: データ定義と定数 (models.ts)
  - interface 定義: Bullet, Enemy, GameState（autoFireEnabled: boolean を含む）
  - 全定数定義: FIELD_WIDTH, FIELD_HEIGHT, SAFE_ZONE_ROWS, PLAYER_WIDTH, MAX_REFLECTION_COUNT, SCORE_PER_ENEMY, TICK_INTERVAL_MS, AUTO_FIRE_INTERVAL
  - 方向関連辞書: OPPOSITE_DIRECTION, CLOCKWISE_90, DIRECTION_DELTA
  - 表示定数: BULLET_DISPLAY, ENEMY_DISPLAY, PLAYER_DISPLAY
  - INPUT_ACTIONS = ["left", "right", "fire", "restart"] as const

- [x] Task 2: フィールド管理 (field.ts)
  - Field クラス（75x26 グリッド初期化）
  - 座標系便利定数: minX, maxX, minY, maxY
  - isWall, isWithinBounds, isEmpty, isSafeZone
  - placeEntity, removeEntity, getEmptyCells, clear, getCell

- [x] Task 3: スコア管理 (score_manager.ts)
  - ScoreManager クラス
  - addScore, getScore, reset

- [x] Task 4: 自機管理 (player.ts)
  - Player クラス（fieldWidth, fieldHeight を数値で受け取る）
  - 初期位置計算、moveLeft, moveRight, getPosition, getWidth, collidesWith, reset

### Milestone 1: Field + Player + ScoreManager 統合テスト
  - 対象タスク: 1, 2, 3, 4
  - テストファイル: test_milestone_1.ts
  - 検証内容: Field に的を配置 → Player 移動 → ScoreManager 加算の連携

- [x] Task 5: 弾の発射・移動・壁反射 (bullet_manager.ts)
  - BulletManager クラス（コンストラクタ: field）
  - _bullets と _newbornBullets の二重リスト管理
  - fireBullet（newborn に追加）、moveBullets（既存弾のみ移動、壁なら方向反転・反射カウント、3回で消滅）
  - promoteNewborns（newborn を本体に合流）
  - getBullets（コピー返し）、clear
  - setCombat（BulletCombat を後から注入）
  - 委譲メソッド: handleEnemyCollisions, handleBulletCollisions, mergeBullets, checkPlayerHit

- [x] Task 6: 弾-的衝突と分裂 (bullet_combat.ts)
  - BulletCombat クラス（コンストラクタ: field, enemyManager, scoreManager, bulletManager, rng）
  - handleEnemyCollisions メソッド
  - 上向き→左右分裂、横向き→上下分裂、下向き→消去のみ
  - 分裂弾は bulletManager.fireBullet() で newborn に追加
  - 的消滅 + スコア加算

- [x] Task 7: 弾-弾衝突・合体・被弾判定 (bullet_combat.ts)
  - handleBulletCollisions メソッド（this.rng() で確率消滅 + 時計回り回転）
  - mergeBullets メソッド（同マス同方向の合体、反射回数最小を採用）
  - checkPlayerHit メソッド（下向き弾が自機位置にあるか判定）

- [x] Task 8: 的管理 (enemy_manager.ts)
  - EnemyManager クラス（コンストラクタ: field, rng）
  - spawnEnemy(blockedCells)、ensureMinimumEnemies(blockedCells)、removeEnemyAt
  - getEnemies（コピー返し）、getEnemyCount
  - maybeSpawnEnemy(turnCount, blockedCells)（30ターンごとに頻度上昇）

### Milestone 2: 弾ライフサイクル統合テスト
  - 対象タスク: 5, 6, 7, 8
  - テストファイル: test_milestone_2.ts
  - 検証内容: 弾発射 → 移動 → 壁反射 → 的命中 → 分裂 → スコア加算

- [x] Task 9: ゲーム進行制御 (game_controller.ts)
  - GameController クラス（5引数コンストラクタ）
  - autoFireEnabled, fireCooldown の状態管理
  - tick() の11ステップ処理順序（design.md 厳守）
  - handleInput（"left" | "right" | "fire" | "restart"）
  - "fire" はトグル（ON時 fireCooldown=0）、"restart" は gameOver 時のみ
  - isGameOver, reset, getState（autoFireEnabled を含む）

- [x] Task 10: 画面描画 (renderer.ts)
  - Renderer クラス（field, useAnsi を受け取る、useAnsi=false でテストモード）
  - buildFrame(state) → string[]（純粋ロジック）
  - 表示: タイトル、壁、フィールド内容、スコア+TURN+ENEMIES、FIRE状態+操作説明
  - render: buildFrame() → ANSI escape 出力
  - renderGameOver: ゲームオーバー画面

- [x] Task 11: キー入力処理 (input_handler.ts)
  - InputHandler クラス（controller を受け取る）
  - handleKeypress: Buffer → handleInput 変換（A/D/Space/R/Q）
  - shouldQuit

- [x] Task 12: エントリーポイント (index.ts)
  - main 関数
  - コンポーネント組み立て（design.md C10 の順序厳守）
  - rng = () => Math.random() を EnemyManager と BulletCombat に渡す
  - raw mode 設定（setRawMode, カーソル非表示）
  - setInterval ベースのゲームループ

### Milestone 3: フルゲーム統合テスト
  - 対象タスク: 9, 10, 11, 12
  - テストファイル: test_milestone_3.ts
  - 検証内容: tick フロー全体（入力 → 移動 → 衝突 → スコア → ゲームオーバー）
