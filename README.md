# ASOBIT

スマホの中に、ゲームセンターを。ひとりでも、みんなでも。

ASOBIT（アソビット）はiOS・Android向けミニゲームアプリです。Internal Project: GAME100 / GAME1000。既存リポジトリ・アプリ識別子・保存キーは維持しています。

ブランドは `src/data/brand.ts`、期間限定企画は `src/data/challenge.ts` に分離しています。現在の企画は「ゲーム制作未経験の会社員が、100日でゲーム30個作る。」（100 DAYS / 30 GAMES）。日本時間の2026年10月1日がDAY 01、2027年1月8日がDAY 100です。

HOMEのChallengeカードから `/project` のASOBIT CHALLENGEへ進めます。カタログのavailable件数から `005 / 030`・あと25ゲームを自動計算。30本達成でCHALLENGE CLEAR、期間終了で100 DAYS COMPLETEとRESULTを表示します。31本以降もカタログに登録でき、ASOBIT全体の収録数は実数を表示します。開始前は開始日と「まもなくスタート」を表示します。日付は日本時間で計算し、画面復帰時と表示中は毎分更新します。

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

### 正式アイコンから起動するiPhoneシミュレーター版

かさねいろと同じく、次のコマンドでMac上でビルド・インストール・起動します（macOS / Xcodeが必要）。

```sh
npm run ios
```

JS・画像・音声を同梱するReleaseビルドです。初回はネイティブ依存の準備に時間がかかります。インストール後はホーム画面の「ASOBIT」アイコンから起動でき、Expo Goや開発サーバーは不要です。コードや画像を変更した場合も、再び `npm run ios` を実行すれば更新できます。

Expo Goで確認したい場合は `npm run ios:go` を使います。`ios/` はExpoが生成し、Git管理から除外します。ネイティブ設定は `app.json` とconfig pluginで管理してください。既に生成済みの状態でアイコンやプラグイン設定を変更した場合は、`npx expo prebuild --platform ios --no-install` で反映してから `npm run ios` を実行します。

日本語を含むプロジェクトパスでCocoaPodsが失敗するHermesの文字コード問題には、`postinstall`の限定的な補正で対応しています。React Native更新時には `scripts/fix-ios-unicode-path.cjs` の必要性を再確認してください。

TestFlight用は既存のEAS `production`プロファイルを使用します。クラウドでシミュレーター版を作る場合のみ、EASの `simulator` プロファイルを使えます。

## 実装範囲

- ネオン調ホーム、ロゴ、プレイ可能ゲームの収録数、何やる？ボタン
- HOME / GAMES / RANDOM / FAVORITES / SETTINGSの5タブ
- HOMEは人数・おまかせから遊びを決める入口、GAMESはコンパクトな人数フィルターとゲーム一覧
- 1人 / 2人 / 3〜4人 / 5人以上の人数フィルター
- 人気・新着の一覧導線、準備中の空表示
- GAME #001「テトリス BLOCK DROP」、GAME #002「BLOCK BREAK」（10ステージ）、GAME #003「NEON STACK」（2人対戦）、GAME #004「NEON PATH」（2人の経路対戦）、GAME #005「NEON SLING」（2人同時パック対戦）
- HOMEの新作は公開済み新着の最大ゲーム番号を表示。Challengeは005 / 030・あと25ゲームへ自動更新
- Safe Area、縦画面、スクロール、押下フィードバック、Haptics

ランダム選択、お気に入り保存、メインカラー、BGM・効果音設定に対応しています。

## 構成

```text
src/
  app/
    _layout.tsx           # 全体のStackとダークテーマ
    (tabs)/              # Home / Games / Random / Favorites / Settings
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

正式なアプリアイコンとSplashは[ブランドアセット仕様](assets/images/README.md)を参照してください。アプリ内ブランドロゴは `GameLogo` 内で文字とネイティブ部品により構築しています。

## サウンド

共通のBGM・効果音と個別オン/オフ設定を追加。「設定」タブまたは各ゲームの遊び方から変更できます。[共通オーディオ仕様](docs/audio.md)・[自作仮音源の由来](assets/audio/README.md)を参照。

## 設定・メインカラー

「設定」タブでメインカラー5色とBGM・効果音を変更できます。選択は端末に保存されます。[設定とテーマの実装](docs/settings.md)を参照。

ブランド移行・手動更新項目は[ASOBITリブランディング](docs/asobit-rebrand.md)、公開用文章は[ストア・SNS文案](docs/app-store/asobit-copy.md)を参照してください。
