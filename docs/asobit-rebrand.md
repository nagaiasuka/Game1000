# ASOBIT リブランディング

2026-10-01。ユーザー向けブランドをASOBITへ、期間限定企画を100 DAYS / 30 GAMESへ変更。

## 実装

- `app.json`の表示名、共通GameLogo、HOME、設定のロゴ、PROJECTを更新。
- `BRAND`と`CHALLENGE`を分離。2026-10-01をDAY 01、2027-01-08をDAY 100としてAsia/Tokyoで計算。
- 開始前・期間中・期間終了を分離。終了後は100 DAYS COMPLETE / RESULT。30本を早期達成してもCHALLENGE CLEARを表示。
- available件数を自動集計。チャレンジ数値は030 / 030で上限表示し、ASOBIT収録数は31本以降も実数を表示。
- ASOBIT + ゲームパッドの独自ベクターアイコンを作成。Master/iOSは1024×1024 RGB、Androidは透明Foregroundと単色版。Splashは新しいアイコンを使用。
- ゲーム#001〜#005のルール・音声基盤・保存処理・タブ構造は変更なし。

## 維持した識別子

| 項目 | 値 |
| --- | --- |
| GitHub | nagaiasuka/Game1000 |
| Expo slug / scheme | game1000 |
| iOS / Android | com.nagaiasuka.game1000 |
| EAS Project ID | c409765b-aef8-49ce-9832-f845079b922a |
| AsyncStorage prefix | @game1000/ |

保存データの移行・初期化は行わない。同じBundle Identifierへの更新として扱う。

## 公開前の手動更新

App Store Connectの表示名を「ASOBIT - みんなのゲームセンター」、サブタイトルを「100日でゲーム30本に挑戦」に変更する。説明とTikTokの文案は[公開用文案](app-store/asobit-copy.md)。外部管理画面の変更・TestFlight提出は実施していない。

ネイティブの表示名・アイコン更新は再ビルドが必要。既存TestFlightバイナリは自動で更新されない。既存EAS productionプロファイルで次回ビルド・提出する。

旧ブランドのスクリーンショットと添付アイコン原本は履歴として保存。旧RAWはASOBITの掲載画像には使用しない。新しい宣伝コピー付き掲載画像は今回作成していない。

## 検証

型チェック・lint成功。テスト190件成功（JST日付境界、DAY 01/02/100、開始前、終了後、うるう日、早期達成、31本以上を含む）。


iPhone 13 Pro Max / iOS 26.5でReleaseビルド・インストール成功。HOMEのDAY 01 / 100、005 / 030、あと25ゲーム、Challenge画面の100日目（2027年1月8日）、設定ロゴを目視確認。更新前に登録したお気に入り3本とBLOCK DROPの最高記録188も保持されていることを確認した。

| 確認画面 | 画像 |
| --- | --- |
| HOME | [asobit-home.png](screenshots/asobit-home.png) |
| Challenge | [asobit-challenge.png](screenshots/asobit-challenge.png) |
| 設定 | [asobit-settings.png](screenshots/asobit-settings.png) |
| お気に入り保持 | [asobit-favorites-preserved.png](screenshots/asobit-favorites-preserved.png) |
| OSホームの名前・アイコン | [asobit-simulator-icon.png](screenshots/asobit-simulator-icon.png) |

上記は1284×2778の動作確認用スクリーンショット。ストア掲載用の広告画像ではない。アプリ内HOMEには既存の開発者モード入口があり、掲載素材を撮る際は写さないこと。

ネイティブInfo.plistの表示名ASOBIT・既存Bundle Identifier・main.jsbundle同梱を確認済み。起動は従来どおり `npm run ios`。今回更新した専用シミュレーターではASOBITアイコンから起動できる。Androidは設定とアイコンの安全領域を確認し、実機ビルドは未実施。

TestFlight提出は未実施。
