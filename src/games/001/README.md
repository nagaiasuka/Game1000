# GAME #001 — テトリス BLOCK DROP

1人用・PUZZLE・SCORE ATTACK・ENDLESS。HOMEの新着導線またはGAMESのカードから起動します。

## ファイル構成

```text
src/app/play/001.tsx           Expo Routerの入口
src/games/001/
  GameScreen.tsx              盤面レイアウト・HUD・開始/Pause/終了メニュー
  components/Board.tsx        固定/操作/ゴースト/消去中ブロック、NEXT
  components/GestureSurface.tsx 盤面のタッチイベント
  logic/gestures.ts           タップ/ドラッグ/長押しの排他判定
  components/Controls.tsx     48ptの操作ボタン、押下/解放イベント
  hooks/useBlockDrop.ts       RAF、AppState、画面フォーカス、Haptics、記録保存
  logic/pieces.ts             7種類の形状、回転、衝突、着地点、7-bag
  logic/engine.ts             固定ステップの進行、入力、消去、スコア
  storage/best-store.ts       保存の直列化と不正データ処理（ネイティブ非依存）
  storage/index.ts            AsyncStorageアダプター
  theme.ts                   ゲーム固有のブロック色
```

アプリ側の変更はカタログ、HOMEの新着1件、ルートStackへの登録です。準備中のGAME #002/#003はそのまま残しています。

## 操作

- TAP TO START → 3・2・1・GO! → プレイ開始。
- 標準はタッチ操作。ブロックの位置に関係なく盤面上で操作できます。
- 短くタップ：時計回り90度回転。左右最大2マス、上最大2マスの簡易Wall Kick。
- 左右にドラッグ：指の移動距離に合わせて1マスずつ移動。
- 下にドラッグ：移動距離に合わせてSoft Drop。移動できた1マスにつき1点。
- その場で500ms長押し：ゴースト位置にHard Drop。落下1マスにつき2点。進捗バーを表示します。
- ドラッグ開始・複数指・指を離す・Pause・画面離脱・図形固定で長押し判定を取り消します。固定前の操作を次の図形へ持ち越しません。
- HOLD/交換は廃止。NEXTは次の図形の予告のみです。
- 右上の⏸（開始前・終了後は設定アイコン）→「操作方法」でタッチ／ボタンを切り替えます。ボタンでは左右・回転・Soft Drop・DROPが使えます。左右は170ms長押し後65ms間隔、下は35ms間隔で連続操作。
- ⏸：操作方法 / RESUME / RESTART / EXIT。プレイ中の左上の戻る操作もPauseを開きます。
- タッチ操作中は下部の操作パネルを省き、画面の空き幅・高さに合わせて盤面を拡大します。操作案内は開始画面と設定メニュー内に表示します。
- GAME OVER：RETRY / HOME。今回の開始前の最高点を超えていればNEW BEST!。

音、ネットワークランキングは未導入です。

## ゲームルールと進行

10×20の盤面。7種類をFisher–Yatesでシャッフルし、7個以上のNEXTキューを維持。React Nativeに依存しないエンジンがBoard / Piece / Ghost / Scoreを管理します。

requestAnimationFrameの経過時間を1/60秒の固定ステップに蓄積。描画は盤面や表示値の変更時に更新し、毎フレームReactを再レンダリングしません。1秒を超える処理停止は追いつき処理をせず自動Pauseします。

接地猶予は450ms。接地時の有効な移動・回転で最大15回まで猶予をリセット。列が埋まると180msの発光表示後に消去・詰め直し・次ブロック生成を行います。

1/2/3/4ラインの得点は100/300/500/800 × 消去時LEVEL。累計10ラインごとにLEVELが1上がります。

自然落下間隔は `max(75, 850 × 0.8^(LEVEL−1))` msです。

| LEVEL | 1マスの落下間隔 |
|---|---:|
| 1 | 850ms |
| 5 | 約348ms |
| 10 | 約114ms |
| 15以上 | 75ms |

Pause中は落下・長押し・消去演出・カウントダウン・経過時間を停止。バックグラウンド/非アクティブ化、Android通知シェードのblur、画面離脱でPauseし、復帰後も明示的なRESUMEが必要です。画面フォーカスを失うとRAFとリスナーを解除します。

## BEST SCORE

AsyncStorageの `@game1000/game001/best-score/v1` に保存。固定・ライン得点確定・Game Over・レベルアップ・Pause・再開始・画面離脱で保存します。画面再表示時に読み込み、今回の得点と既存記録の最大値だけを書きます。保存処理は直列化し、リトライによる書き込み順序の逆転を防ぎます。読み込み不正値は0、I/Oエラー時はゲームを継続し、画面に保存失敗を表示します。

## 検証

`npm test` による37テスト成功（ゲーム24件＋ジェスチャー10件＋カタログ3件）。

- 7種類・回転全方向・バッグの偏り防止
- 両壁・床・積みブロック・Wall Kick・上部でのGame Over
- NEXT・Ghost・ハード/ソフトドロップ
- タップとドラッグの区別、長押しの1回制限、ドラッグ/複数指/Pause/次図形への切替時のキャンセル
- 単発/長押し/解放・450ms固定猶予・15回リセット上限
- 1/2/3/4ラインの演出待ち・詰め直し・得点・LEVEL更新
- 異なるフレーム間隔で同じゲーム状態になること
- Ready・Countdown・Pause・Resume・Restart・Game Over
- 保存キー、同時保存での最大値保持、ストア再生成後の復元、失敗後の再試行

TypeScript・lint・Expo Doctor 21/21・iOS/Androidの本番用JS/Hermesバンドル生成も成功。

旧ボタン操作版はiPhone 17 Pro / iOS 26.5 / Expo Go 57.0.9でゲームルートの起動とプレイ中の盤面・操作パネル・NEXT・Ghost表示、およびPAUSEDメニュー表示を確認。画像は `docs/screenshots/block-drop-iphone17pro.png`。

タッチ操作版はiPhone 17 ProでHOLDのないHUD・カウントダウン・操作案内の表示を確認（`docs/screenshots/block-drop-touch.png`）。ジェスチャーの判定はロジックテストで検証。指での操作感は実機での確認が必要です。

## 残る実機検証

- 指での連続操作の感触、Haptics、通知・バックグラウンドからの復帰。
- iPhone SEシミュレーターは開始画面の描画まで確認。Expo Go初回案内が重なるため、案内を閉じた後の操作・全画面確認は未完了。
- Androidはバンドル生成まで確認。実機/エミュレーターでのプレイは未確認。
- 保存の自動テストはストレージアダプターで実施。実機プロセス再起動後のAsyncStorage復元は未確認。
- 配布用の署名付きネイティブビルド、長時間プレイによる難易度/速度調整。
