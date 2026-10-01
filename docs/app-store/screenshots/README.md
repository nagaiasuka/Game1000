# 旧GAME100スクリーンショット撮影記録

**ASOBITへの移行前の素材です。現行App Store掲載用には使用しないでください。RAW原本は履歴として保持しています。**

撮影日：2026-10-01（日本時間）。撮影時に確認した最新main：`cd3bb00`（origin/mainとの差分0）。正式アイコンを含むGAME100単体のReleaseアプリを使用。

## 環境・保存形式

- Simulator：GAME100 App Store iPhone 13 Pro Max / iOS 26.5
- UDID：30F5CD5F-E010-4F50-8FDD-12FD2BF4E73F
- 論理解像度428×926、ネイティブ画像解像度1284×2778。
- ステータスバー：09:41、Wi-Fi、電波4本、バッテリー100%で統一。
- `xcrun simctl io … screenshot`で取得したPNG原本。拡大、切り抜き、色調補正、広告文字、AI加工なし。
- 全11枚の実ピクセルサイズとPNGのデコードを機械確認済み。SHA-256・容量は[manifest.json](manifest.json)に記録。
- 全画像はSimulator出力そのままのRGBA。アルファ値は全画素255（透明画素なし）。RAWは変更していない。

## 素材一覧

| ファイル | 実寸（幅×高さ） | 撮影内容 |
| --- | --- | --- |
| [raw/01-home.png](raw/01-home.png) | 1284×2778 | HOME。GAME100・企画紹介・ROAD TO 100。自然なスクロールで開発者ボタンを画面外へ。 |
| [raw/02-road-to-100.png](raw/02-road-to-100.png) | 1284×2778 | PROJECT。2030年12月31日までに100本、現在5本・残り95本。 |
| [raw/03-games.png](raw/03-games.png) | 1284×2778 | ゲーム一覧。BLOCK DROPとBLOCK BREAKのカードを中心に撮影。 |
| [raw/04-block-drop.png](raw/04-block-drop.png) | 1284×2778 | 実プレイ。複数色の積み上げ、落下中のブロック、スコア118・レベル01。 |
| [raw/05-block-break.png](raw/05-block-break.png) | 1284×2778 | 実プレイ。スコア300、コンボ×1、破壊演出、ボールの軌跡・パドル。 |
| [raw/06-neon-stack.png](raw/06-neon-stack.png) | 1284×2778 | 2人対戦。大小の駒、相手の駒を覆った2段のマス。 |
| [raw/07-neon-path.png](raw/07-neon-path.png) | 1284×2778 | 2人対戦中盤。前進した2人の駒、6枚の壁、残り各7枚。 |
| [raw/08-neon-sling.png](raw/08-neon-sling.png) | 1284×2778 | 対戦中。両陣地のパック、中央ゲート、右HUD、発射後の軌跡。 |
| [raw/09-random.png](raw/09-random.png) | 1284×2778 | 実際のランダム選択結果。BLOCK DROP、もう一度選ぶボタン。 |
| [raw/10-favorites.png](raw/10-favorites.png) | 1284×2778 | お気に入り3本登録済み。NEON STACKとBLOCK BREAKが見える位置。 |
| [raw/11-settings.png](raw/11-settings.png) | 1284×2778 | メインカラー5色・BGM・効果音設定を同時に表示。 |

## App Store・後工程

1284×2778はAppleが示すiPhone 6.5インチ縦スクリーンショットの受付サイズ。6.9インチの素材を提出しない場合の対象サイズとして使用可能。今回の11枚は候補素材で、掲載時は予定どおり6〜7枚を選定する（1セット最大10枚）。

参照：[Apple Screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/)

後工程の1284×2778完成画像へ、拡大せず配置できる。完成画像の書き出し時はRGB・アルファチャンネルなしのPNGにする。今回は原本保存を優先しているため、RAWをそのまま提出する前提ではない。広告コピー付き完成画像は今回の対象外。

## 撮影上の差異・問題

未撮影の指定画面はなし。各ゲームは実操作で状態を作成し、スコアや盤面の注入は行っていない。

- 現在のHOMEの見出しは「みんなの声で、育つゲームセンター。」。指示書の「今日は、何して遊ぶ？」に書き換えず、実際の最新版を撮影。
- HOME上端に現行アプリの開発者モード入口があるため、自然にスクロールして画面外へ出した。撮影画像内に開発者ボタンはない。
- 一覧のカードは大きく、5本すべてを同時表示できないため、2本を中心とする自然なスクロール位置で撮影。
- BLOCK DROPでは「次のブロック」の見出しが現行レイアウトで折り返される。撮影用のUI修正は行っていない。
- BLOCK BREAKはコンボ×1と破壊演出を取得。フィーバー発動中の素材は含めていない。

## コード・検証・容量

既存アプリコード、ゲームロジック、依存関係への変更なし。撮影専用fixtureなし。Simulatorの操作用XCTestは`/tmp`に分離し、リポジトリには含めていない。専用Simulatorを使用し、既存の利用者データは変更していない。

- `npm run typecheck`：成功
- `npm run lint`：成功
- `npm test`：187件成功、失敗0件
- RAW合計：6,682,998 bytes（約6.37 MiB）

今回追加した成果物はこのディレクトリ内のみ。コミット・pushは未実施。
