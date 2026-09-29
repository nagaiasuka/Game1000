# 初期構築の検証（2026-09-28）

- Node.js 24でlint・TypeScriptチェック成功。
- カタログのテスト3件成功（収録数、人数範囲、人気・新着の空表示）。
- Expo Doctor: 21/21項目成功。
- iOS・Androidの本番用JavaScript/Hermesバンドル生成成功。
- iPhone 17 Pro / iOS 26.5 / Expo Go 57.0.9で起動し、ホームの描画を確認。

## 未確認

- Expo Go初回案内を閉じた後のタブの手動タップ・スクロール確認。Macのアクセシビリティ権限により自動キー操作は実行できなかったため、Simulator上で初回の「Continue」を押して確認してください。
- Android実機・エミュレーターの表示、実機Haptics、小型画面・拡大文字の実機検証。
- ストア配布用ネイティブビルド、署名、正式アイコン。

## このMacでの注意

標準のNode.js 23は今回のReact Nativeの対応範囲外です。`.nvmrc` に合わせてNode.js 24を使ってください。
Expoを `--localhost` で起動するとIPv6だけで待ち受けることがあり、IPv4接続が失敗しました。通常の `npm run ios` または次を利用できます。

```sh
REACT_NATIVE_PACKAGER_HOSTNAME=127.0.0.1 npx expo start --lan --ios
```
