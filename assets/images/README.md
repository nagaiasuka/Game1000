# GAME100 正式ブランドアセット

添付された「GAME100 — ROAD TO 2030」が正式デザイン。カラー版の文字・色・配置・ゲームパッドを描き直さない。

| 用途 | ファイル | 仕様 |
| --- | --- | --- |
| 原本 | `branding/game100-icon-master.png` | 1254×1254 RGB、添付ファイルとバイト単位で一致 |
| iOS / 共通 | `icon.png` | 1024×1024 RGB、Alphaなし。原本をLanczos縮小したもの |
| Android Foreground | `adaptive-icon.png` | 1024×1024 RGBA。原本全体を594×594へ縮小し、中央(215,215)へ配置。外側のみ透明 |
| Android Background | app.json | Dark Navy `#070711` |
| Android Monochrome | `monochrome-icon.png` | 1024×1024 RGBA。元画像の「100」の輪郭を白＋Alphaにしたテーマ専用派生版 |
| Splash | `icon.png`を共用 | Dark Navy `#070711`背景、中央180幅、contain。全画面への引き伸ばしなし |

原本SHA-256: `18f4b203e07ef5ee102ca6caaf51e8f4d221f9e4c463c4f4163528e67e228a8d`

追加の角丸マスクは配布アセットに焼き込んでいない。原本に含まれる角丸風表現と黒い四隅はそのまま維持した。Androidカラー版は背景を含む原本全体を保存し、余白だけを追加している。

Monochromeは原本の矩形 `(110,420)-(1140,795)` を切り出し、赤チャンネルから `clamp((R-145)*8, 0, 255)` でAlphaを生成。560×204へLanczos縮小し、1024角の透明キャンバスの `(232,410)` に配置した。通常のカラー版にはこの処理を適用しない。

## 確認（2026-09-30）

- 1024 / 180 / 120 / 60 / 40pxを目視確認。40〜60pxでも「100」を識別できる。
- [マスク・小サイズ確認画像](../../docs/screenshots/brand-icon-review.png)：iOS近似角丸、Android円形・角丸四角・安全領域円、テーマ版。主要文字とゲームパッドの欠けなし。OS実機のスクリーンショットではない。
- `npm run typecheck`、`npm run lint`、`npm test`成功（187件）。音声のBGM切り替え、独立ON/OFF、効果音、シーン遷移など既存の回帰テストを含む。実機での音声再生は未確認。
- `npx expo config --type public --json`成功。全画像パスの存在とPNGの読み込みを確認。
- 当初の `npx expo-doctor`は16/18成功。その後、独立したシミュレーター版の作成に伴い `expo-asset`（expo-audioのpeer）をExpo推奨版で追加し、17/18成功。expo 57.0.25→57.0.26、expo-constants 57.0.19→57.0.20、expo-router 57.0.23→57.0.24のパッチ版差分は残っている。

ゲーム・音声コード、保存キー、内部識別子、Version 1.0.0、既存EAS productionの `autoIncrement: true` は維持。シミュレーター用には独立した `simulator` プロファイルを追加。TestFlightへの提出は実行していない。次回productionビルドでは上記doctor指摘を確認し、TestFlightインストール後のホーム画面、Splash、音声、App Store Connectのアイコンを実機・管理画面で確認する。

### 独立したシミュレーター版

2026-09-30、[EASビルド](https://expo.dev/accounts/asukanagai/projects/game1000/builds/3f508f68-8c30-458d-9d3a-c276942c3017)が成功。`Kasane iPhone SE (small)`（iOS 26.5）へ `com.nagaiasuka.game1000` をインストールして起動を確認した。

- [ホーム画面の正式アイコン](../../docs/screenshots/game100-simulator-icon.png)
- [独立アプリの起動画面](../../docs/screenshots/game100-simulator-home.png)

このビルドはJS・アセットを同梱し、Expo Go・Metroサーバーを必要としない。ソース更新の反映には再ビルドが必要。

同日、かさねいろと起動方法を揃え、`npm run ios` を `expo run:ios --configuration Release --no-bundler` に変更。日本語パスのHermes文字コード問題をpostinstallで補正し、MacでのReleaseビルド・同シミュレーターへのインストール・起動が成功した。型チェックとlintも成功。[ローカル版の起動画面](../../docs/screenshots/game100-local-ios-home.png)。今後の通常のビルド・更新・起動には `npm run ios` を使う。

## 参照

- [Expo SDK 57 アプリ設定](https://docs.expo.dev/versions/v57.0.0/config/app/)
- [Expo SDK 57 SplashScreen](https://docs.expo.dev/versions/v57.0.0/sdk/splash-screen/)
- [Android Adaptive icons](https://developer.android.com/develop/ui/compose/system/icon_design_adaptive)
