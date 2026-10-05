# GAME #006 — NEON PUSH

1台を机の中央に置いて向かい合う2人の戦略ゲーム。下の1はシアン、上の2はピンク。各11駒・半径4の61セル、1が先攻。相手を5個押し出すと勝ち。

開始前に共通の任意プレイヤー名入力（12文字まで）を表示する。未入力・空白のみなら「プレイヤー1・2」。HUD・勝利表示に名前を反映し、再戦でも保持する。

## 操作とルール

自分の駒をタップし、隣接する一直線の最大3個を選ぶ。同じ駒を再タップで解除。光る移動先または6方向ボタンで1マス移動。駒は盤面から直接選び、方向ボタンは44pt以上のタップ領域を確保する。

列方向の押しは自分の数が相手の連続した数より多い場合のみ。相手の後ろに自分の駒があると押せない。横移動はすべて空きセルの場合だけ。相手のみ盤外へ押せ、自分から盤外へは移動不可。

遊び方の上部には同梱の15秒ルール動画（`assets/videos/neon-push-rules.mp4`）を表示する。Expo SDK 57の `expo-video` で遊び方を開いたときの自動再生・一時停止・拡大・再視聴に対応し、遊び方を閉じたらプレイヤーを解放する。動画の音声は効果音のみで共通SE設定・音量に追従する。バックグラウンド移行でも停止し、自動再開しない。

## 既存基盤

Expo Router `/play/006`、共通テーマ・遊び方・サウンド設定・Audio Manager・カタログを使用。お気に入りと「何やる？」はカタログ登録に追従。BGMは既存#003の戦略曲を共有。専用の7種類の自作SEは `scripts/generate-push-audio.py` で生成。共通の音声生成スクリプトからも自動実行する。

UIと独立したaxial座標エンジン＋revisionで二重操作を拒否するreducer。描画は入力時だけ更新。移動・衝撃波・盤外粒子はnative driverで再生し、200〜430msだけ入力をロックする。プレイヤー2のHUDと方向操作は180度回転。再戦は1が先攻の新規盤面。履歴・個別設定は永続保存しない。

遊び方表示中と終了・リセット確認中は入力を止める。時間制限のない交互対戦のため遊び方を閉じると同じ手番へ戻る。明示的な一時停止とOS中断後は「ゲームに戻る」が必要。終了とリセットには日本語の確認を表示する。

## 検証

`npm test` は通常移動、全6方向の押し、2対1・3対1・3対2、同数拒否、塞がった押し、盤外・両者の5点勝利、飛び越え拒否、4駒・非直線・非連続・重複選択拒否、横移動、連打、再戦、音声登録とランダム手順の駒数保存を検証する。`npm run lint`、`npm run typecheck` を併用する。

実機での3〜5分のテンポ、文字拡大・安全領域と60fpsの計測は別途プレイ確認が必要。

## 変更ファイル一覧

- `src/games/006/GameScreen.tsx`、`components/Board.tsx`、`useNeonPush.ts`、`logic/engine.ts`、`logic/session.ts`、`audio.ts`、`README.md`
- `src/app/play/006.tsx`、`src/app/_layout.tsx`、`src/app/(tabs)/index.tsx`
- `src/data/catalog.ts`、`src/data/ui-text.ts`、`src/components/arcade.tsx`、`src/components/game-artwork.tsx`
- `src/audio/types.ts`、`src/audio/sounds.ts`、`assets/audio/manifest.json`、`assets/audio/game006/` の7つのWAV
- `scripts/generate-audio.py`、`scripts/generate-push-audio.py`、`docs/japanese-first-ui.md`
- `tests/neon-push.test.ts`、`tests/audio.test.ts`、`tests/catalog.test.ts`、`tests/discovery.test.ts`、`tests/block-break.test.ts`、`tests/neon-stack.test.ts`

既存テストのゲーム数・進捗の期待値は6本に更新。既存ゲームのルール・保存形式は変更していない。
