# ゲーム本体

`001/` にGAME #001「テトリス BLOCK DROP」を実装しています。操作・内部構成は [001/README.md](001/README.md) を参照してください。

新しいゲームは `002/` 等に独立して配置し、`src/app/play/002.tsx` から画面をexportします。`src/data/catalog.ts` の該当ゲームに実データと `status: 'available'`, `route: '/play/002'` を登録すると、一覧と収録数に反映されます。

Router用ファイルは `src/app/` のみに置き、ゲーム内部の部品やロジックをルートに混ぜないでください。
