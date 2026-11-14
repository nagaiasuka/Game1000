# ASOBIT 開発引き継ぎ

ASOBIT（みんなのゲームセンター）は、Expo SDK 57・React Native・TypeScriptで作るiOS／Android向けミニゲーム集です。GitHubでは `nagaiasuka/Game1000`、旧称はGAME100／GAME1000です。iOSのBundle IDとAndroidのパッケージ名は `com.nagaiasuka.game1000`、URLスキームは `game1000` です。アップデートで既存ユーザーのアプリとデータを引き継ぐため、これらの識別子と保存キーを維持してください。

## 最初に動かす

GitHubのリポジトリを読めるアカウントとNode.js 24を用意します。以下はnvmを使う例です。cloneで権限エラーが出た場合は、GitHubのオーナーに自分のアカウントへのアクセス付与を依頼してください。

```sh
git clone https://github.com/nagaiasuka/Game1000.git
cd Game1000
nvm install
nvm use
npm ci
npm start
```

- 実機ではExpo SDK 57対応のExpo Goで、開発サーバーが表示するQRコードを読み取ります。通常はPCと実機を同じネットワークに接続します。
- MacではXcodeでiOS Simulatorを用意し、`npm run ios:go` でExpo Go、`npm run ios` でASOBITアイコンから起動するローカルRelease版を作れます。
- AndroidはAndroid Studioでエミュレーターを起動するか、USBデバッグを有効にした端末を接続して `npm run android` を実行します。
- `ios/` と `android/` はExpoが生成します。ネイティブ設定は `app.json` とconfig pluginに置きます。既に生成した端末向けプロジェクトへ設定変更を反映するときは、対象プラットフォームで `npx expo prebuild --platform ios --no-install` などを実行してから再ビルドします。 [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/)

## ゲームの追加と修正

1. `src/games/NNN/` に画面とゲームロジックを置き、`src/app/play/NNN.tsx` から画面を公開します。画面遷移と向きは `src/app/_layout.tsx` を確認します。
2. `src/data/catalog.ts` に番号・タイトル・人数・分類・ルートを登録します。遊べる状態になったゲームを `available` にすると、一覧と企画の進捗に反映されます。公式名称は `src/data/brand.ts`、100日で30本の企画設定は `src/data/challenge.ts` にあります。
3. `src/data/ui-text.ts` に日本語の遊び方を登録し、共通ボタンやヘルプを使います。ホームの新作・一覧・ランダム・お気に入りから起動できるか確認します。 [ゲーム別資料](../src/games/README.md) · [共通UI](japanese-first-ui.md)
4. 新しい音源は共通Audio基盤に登録します。BGMと効果音の設定を個別に検証します。新しいセーブデータはゲーム固有のキーで保存し、既存データや破損データの扱いも確認します。 [音声](audio.md) · [設定](settings.md)
5. 変更をブランチで作業し、以下と実機の確認をしてからpull requestに結果を残します。実機では起動、ゲーム開始から結果、再挑戦、アプリ中断と復帰、音声設定と既存の保存データを確認します。

```sh
npm run lint
npm run typecheck
npm test
npx expo export --platform ios --platform android
```

## 2026年11月14日の引き継ぎ時点

- GitHubの `main` に収録されているのは #001〜#008。#008はNEON CASCADEで、コードのコミットは `1e0f5f2` です。
- 2026年10月のiOSリリース記録は **1.0.2、ビルド9、8本収録**。次回作業時の公開・審査状況はApp Store Connectで確認してください。 [App Storeの公開ページ](https://apps.apple.com/jp/app/id6817633932)
- 手元の作業ツリーには **#009 NEON CROSS** と **#010 ニュル猫** の実装があります。この時点では、両ゲームともGitHubからcloneしただけでは取得できません。続きは元の作業ツリーを持つ担当者から、ゲーム本体・ルート・カタログ・音源や画像・テストをまとめた開発ブランチを引き継いでください。
- NEON CROSSは3駒を相手陣地へ運ぶ2人用ゲーム。ニュル猫は室内外5コースの横画面アクションで、左右・ジャンプ・溶ける・猫パンチを使います。犬は避け、小物を落とし、段ボール箱を目指します。ニュル猫はiPhoneシミュレーターで起動確認済みで、実機の同時押しと操作感は引き継ぎ時の確認項目です。
- ストア用の説明文とスクリーンショット原稿は下記を参照してください。収録本数と紹介内容は提出するビルドの画面に合わせます。 [ストア文案](app-store/asobit-copy.md) · [掲載画像](app-store/screenshots/README.md)

[TestFlight配布とストア公開の手順](release.md)
