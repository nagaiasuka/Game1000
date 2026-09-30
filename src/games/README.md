# ゲーム本体

`001/` にGAME #001「テトリス BLOCK DROP」を実装しています。操作・内部構成は [001/README.md](001/README.md) を参照してください。

`002/` はGAME #002「BLOCK BREAK」。操作・ステージ・保存は [002/README.md](002/README.md) を参照してください。

`003/` はGAME #003「NEON STACK」。ルール・構造・検証は [003/README.md](003/README.md) を参照してください。

新しいゲームは `004/` 等に独立して配置し、`src/app/play/004.tsx` から画面をexportします。`src/data/catalog.ts` の該当ゲームに実データと `status: 'available'`, `route: '/play/004'` を登録すると、一覧と収録数に反映されます。

Router用ファイルは `src/app/` のみに置き、ゲーム内部の部品やロジックをルートに混ぜないでください。

## 共通UI

新規・既存ゲームとも [日本語ファースト共通仕様](../../docs/japanese-first-ui.md) を適用します。共通ボタン・遊び方・終了確認は `src/components/game/common.tsx`、文言と説明は `src/data/ui-text.ts` を利用してください。
