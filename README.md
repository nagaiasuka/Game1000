# GAME1000 — ゲームセン

スマホの中に、ネオンのゲームセンターを。React Native / Expoで作るiOS・Android向けミニゲームアプリの基盤です。GAME #001「テトリス BLOCK DROP」をプレイできます。

## 起動

Node.js 24を利用します（`.nvmrc`）。nvmがある環境では以下を実行してください。

```sh
nvm install
nvm use
npm ci
npm run ios      # Xcode / iOS Simulator
npm run android  # Android Studioのエミュレーター、または接続したAndroid端末
```

実機のExpo Goでは `npm start` を実行し、同じネットワーク上の端末でQRコードを読み取ります。Expo SDK 57対応のExpo Goが必要です。Webは対象外です。

## 実装範囲

- ネオン調ホーム、ロゴ、プレイ可能ゲームの収録数、何やる？ボタン
- HOME / GAMES / RANDOM / FAVORITESの4タブ
- HOMEは人数・おまかせから遊びを決める入口、GAMESはコンパクトな人数フィルターとゲーム一覧
- 1人 / 2人 / 3〜4人 / 5人以上の人数フィルター
- 人気・新着の一覧導線、準備中の空表示
- GAME #001「テトリス BLOCK DROP」と準備中ゲーム2件、再利用可能なGameCard
- Safe Area、縦画面、スクロール、押下フィードバック、Haptics

ランダム選択・お気に入り保存は準備中画面です。プレイ履歴、音、サーバー、課金、広告は未導入です。

## 構成

```text
src/
  app/
    _layout.tsx           # 全体のStackとダークテーマ
    (tabs)/              # Home / Games / Random / Favorites
  components/
    ui.tsx               # Safe Area付き画面、ボタン、見出し、空表示
    arcade.tsx           # ロゴ、カウンター、人数選択、GameCardなど
  data/catalog.ts        # Game型、ゲーム情報、人数フィルター
  games/001/             # BLOCK DROP（UI・ロジック・保存を分離）
  theme/index.ts         # 共通色、余白、フォント
tests/                  # カタログ・BLOCK DROPのロジックと保存の検証
```

## GAME #001と次のゲームの追加

GAME #001の操作・ルール・保存・検証結果は [BLOCK DROP README](src/games/001/README.md) に記載しています。次のゲームは以下の手順で追加できます。

1. `src/games/002/GameScreen.tsx` にゲーム本体を実装。
2. `src/app/play/002.tsx` でその画面をexport。
3. `src/data/catalog.ts` の002の内容を実データに更新し、`status: 'available'` と `route: '/play/002'` を設定。
4. ゲームから戻る導線をルートStackに追加。

収録数は `available` の件数から自動計算されます。詳細は [src/games/README.md](src/games/README.md) を参照。

## 主なライブラリ

Expo SDK 57、React Native 0.86、React 19、TypeScript、Expo Router、Safe Area Context、Expo Linear Gradient、Expo Haptics、Expo Vector Icons、AsyncStorage。Routerの互換依存としてReanimated / Worklets等も公式テンプレートのバージョンに固定しています。

## 検証

```sh
npm run typecheck
npm run lint
npm test
npx expo-doctor
npx expo export --platform ios --platform android
```

正式なアプリアイコン・スプラッシュ画像は今後追加してください。ブランドロゴは `GameLogo` 内で画像に差し替えられます。現状は文字とネイティブ部品で構築しています。
