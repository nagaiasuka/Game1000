# GAME100 — ゲームヒャク

スマホの中に、ネオンのゲームセンターを。React Native / Expoで作るiOS・Android向けミニゲームアプリです。GAME #001「テトリス BLOCK DROP」、GAME #002「BLOCK BREAK」、GAME #003「NEON STACK」、GAME #004「NEON PATH」、GAME #005「NEON SLING」をプレイできます。

現在のユーザー向けブランドは **GAME100**。「2030年12月31日までにゲーム100本を作る会社員」という企画です。内部プロジェクト名は **GAME1000** のままです。

表示名は `app.json` の `expo.name`、目標数と読み方は `src/data/brand.ts` で管理し、ロゴ・カウンター・ホームのコピーで共用します。カウンターの収録数はカタログのavailable件数から自動計算します。将来GAME1000へ進める場合は表示名・目標数・読み方を更新してください。リポジトリ、slug、scheme、Bundle Identifier、Android Package、npmパッケージ名、保存キーは変更不要です。

HOMEの「ROAD TO 100」から `/project` の企画説明へ進めます。目標数・期限・基準タイムゾーンは `src/data/brand.ts` で管理し、カタログのavailable件数から収録数・残り本数・進捗率を自動計算します。残り日数は日本時間の暦日で計算し、期限当日は0日、翌日以降はPROJECT CONTINUESを表示します。画面復帰時と表示中は毎分更新します。計算は `src/utils/project.ts`、境界条件のテストは `tests/project.test.ts` に分離しています。

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
- GAME #001「テトリス BLOCK DROP」、GAME #002「BLOCK BREAK」（10ステージ）、GAME #003「NEON STACK」（2人対戦）、GAME #004「NEON PATH」（2人の経路対戦）、GAME #005「NEON SLING」（2人同時パック対戦）
- HOMEの新作は公開済み新着の最大ゲーム番号を表示。ROAD TO 100は005 / 100・残り95本へ自動更新
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
  games/002/             # BLOCK BREAK（10ステージ・アイテム・コンボ・FEVER）
  games/003/             # NEON STACK（2人のかぶせる三目並べ）
  games/004/             # NEON PATH（壁と移動で競う2人の頭脳戦）
  games/005/             # NEON SLING（上下から同時に引いて撃つパック対戦）
  theme/index.ts         # 共通色、余白、フォント
tests/                  # カタログ・BLOCK DROPのロジックと保存の検証
```

## ゲームの仕様と追加

操作・ルール・保存・検証結果は [BLOCK DROP README](src/games/001/README.md)、[BLOCK BREAK README](src/games/002/README.md)、[NEON STACK README](src/games/003/README.md)、[NEON PATH README](src/games/004/README.md)、[NEON SLING README](src/games/005/README.md) に記載しています。次のゲームは以下の手順で追加できます。

1. `src/games/004/GameScreen.tsx` にゲーム本体を実装。
2. `src/app/play/004.tsx` でその画面をexport。
3. `src/data/catalog.ts` に004の内容を実データに更新し、`status: 'available'` と `route: '/play/004'` を設定。
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

## サウンド

共通のBGM・効果音と個別オン/オフ設定を追加。「設定」タブまたは各ゲームの遊び方から変更できます。[共通オーディオ仕様](docs/audio.md)・[自作仮音源の由来](assets/audio/README.md)を参照。

## 設定・メインカラー

「設定」タブでメインカラー5色とBGM・効果音を変更できます。選択は端末に保存されます。[設定とテーマの実装](docs/settings.md)を参照。
