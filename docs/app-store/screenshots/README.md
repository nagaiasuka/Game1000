# ASOBIT App Store スクリーンショット

2026年10月1日撮影・制作。完成画像7枚、未加工RAW13枚。

[完成画像の横並びプレビュー](overview.png) / [完成PNGフォルダ](final/) / [RAWフォルダ](raw/)

## 撮影環境

- macOS 26.5.2 / Xcode 26.6 / Expo SDK 57、iOS Release Simulator build（JavaScript同梱）。Metroへの接続不要。
- iPhone 13 Pro Max / iOS 26.5。専用Simulator名: `GAME100 App Store iPhone 13 Pro Max`。
- Simulator UDID: `30F5CD5F-E010-4F50-8FDD-12FD2BF4E73F`。
- 撮影対象: `8aaa873`（TikTok導線追加済み）のASOBIT。全画面1284 × 2778 px。
- 時計09:41、電池100%、通信状態をSimulator標準機能で統一。
- 実際の画面をXCTestでタップ・ドラッグして撮影。ゲーム盤面・スコア・矢印の描き足しなし。
- ChallengeのDAY 01 / 100、005 / 030、2027年1月8日は撮影日の実表示。30ゲームは制作目標であり、現在の収録数は5。

## 完成画像7枚

全画像1284 × 2778 px、RGB PNG、アルファチャンネル・透過なし。ファイル番号順に登録。

| 完成画像 | メインコピー | サブコピー | 使用画面 | サイズ（bytes） |
|---|---|---|---|---:|
| [01-arcade.png](final/01-arcade.png) | スマホの中に、<br>ゲームセンターを。 | ひとりでも、みんなでも。 | 01-home.png | 600,722 |
| [02-100days.png](final/02-100days.png) | 100日で、<br>ゲーム30個。 | ゲーム制作未経験の会社員が、本気で挑戦中。 | 02-challenge.png | 673,981 |
| [03-games.png](final/03-games.png) | 今日は、<br>何して遊ぶ？ | パズルも、アクションも、頭脳戦も。 | 03-games.png, 12-games-more.png, 13-games-sling.png | 1,056,292 |
| [04-solo.png](final/04-solo.png) | ひとりで、<br>気づけば夢中。 | スキマ時間が、ゲーム時間に変わる。 | 05-block-break.png | 231,605 |
| [05-versus.png](final/05-versus.png) | スマホ1台で、<br>すぐ対戦。 | 友達と。家族と。向かい合って遊ぼう。 | 06-neon-stack.png | 361,768 |
| [06-simultaneous.png](final/06-simultaneous.png) | 2人同時に、<br>本気で勝負。 | 引いて、狙って、離して撃て。 | 08-neon-sling.png | 324,685 |
| [07-growing.png](final/07-growing.png) | まずは30本。<br>ゲームは、<br>まだまだ増える。 | 100日後、このゲームセンターはどこまで大きくなる？ | 02-challenge.png, 03-games.png, 12-games-more.png | 851,720 |

完成7枚の合計: **4,100,773 bytes（3.91 MiB）**。

## RAW画像

PNG原本を保持。拡大・色調補正・文字合成・アルファ除去などの加工なし。完成画像への縮小・切り抜きは別ファイルにのみ実施。

| RAW | 内容 | 実寸 | サイズ（bytes） |
|---|---|---|---:|
| [01-home.png](raw/01-home.png) | HOME（TikTok・Challenge表示） | 1284 × 2778 | 583,529 |
| [02-challenge.png](raw/02-challenge.png) | Challenge詳細（DAY 01 / 100、005 / 030） | 1284 × 2778 | 664,936 |
| [03-games.png](raw/03-games.png) | ゲーム一覧: BLOCK DROP / BLOCK BREAK | 1284 × 2778 | 1,457,789 |
| [04-block-drop.png](raw/04-block-drop.png) | BLOCK DROP: 実プレイ中、スコア208 | 1284 × 2778 | 173,806 |
| [05-block-break.png](raw/05-block-break.png) | BLOCK BREAK: 実プレイ中、スコア200、コンボ×1 | 1284 × 2778 | 152,964 |
| [06-neon-stack.png](raw/06-neon-stack.png) | NEON STACK: 2人対戦中、大小・重なりのある盤面 | 1284 × 2778 | 268,286 |
| [07-neon-path.png](raw/07-neon-path.png) | NEON PATH: 移動・壁配置を行った対戦盤面 | 1284 × 2778 | 319,081 |
| [08-neon-sling.png](raw/08-neon-sling.png) | NEON SLING: パックを引いて狙っている瞬間 | 1284 × 2778 | 445,626 |
| [09-random.png](raw/09-random.png) | ランダム: 実際の抽選結果NEON PATH | 1284 × 2778 | 953,973 |
| [10-favorites.png](raw/10-favorites.png) | お気に入り: 登録済みゲーム | 1284 × 2778 | 1,366,952 |
| [11-settings.png](raw/11-settings.png) | 設定: テーマカラー・BGM・効果音 | 1284 × 2778 | 291,932 |
| [12-games-more.png](raw/12-games-more.png) | 追加一覧: NEON STACK / NEON PATH | 1284 × 2778 | 1,484,467 |
| [13-games-sling.png](raw/13-games-sling.png) | 追加一覧: NEON PATH / NEON SLING | 1284 × 2778 | 1,195,517 |

RAW合計: **9,358,858 bytes（8.93 MiB）**。

## 制作・再生成

既存のASOBITベクターロゴを使用。背景は濃紺、アクセントはシアン・ピンク・紫。端末枠は独自の単純な角丸枠で、Apple端末素材は使用していません。日本語はmacOS付属ヒラギノ角ゴシックを使用し、フォントファイルは配布しません。

```bash
python scripts/compose-app-store.py
```

必要環境: Python + Pillow、rsvg-convert、macOSヒラギノ角ゴシック。RAWから7枚とoverviewを再生成できます。画像生成AIは使っていません。

切り抜き座標・配置・コピー・SHA-256は [final-manifest.json](final-manifest.json)、RAWのSHA-256は [manifest.json](manifest.json) に記録。

## 検証

- RAW13枚と完成7枚を全件デコードし、寸法を機械検証。完成7枚のRGB・透過なし・SHA-256を確認。
- 全RAWと完成7枚を目視確認。日本語の文字化け、完成コピーの文字切れ、黒画像、破損なし。7枚横並びも確認。
- 1284 × 2778はAppleの6.5インチ枠の対応サイズ。7枚は1〜10枚の範囲。6.9インチ用画像ではありません。
- [Apple公式スクリーンショット仕様](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/)を確認。App Store Connectへのアップロードは未実施。
- `npm run typecheck`: 成功。
- `npm run lint`: 成功。
- `npm test`: **190件成功、0件失敗**。
- iOS Release Simulatorビルド: 成功（エラー0）。

## 変更範囲・旧素材

本番アプリのコード・ゲームロジック・依存関係は変更なし。変更は画像、制作スクリプト、マニフェスト、本文書のみ。撮影用fixtureも追加していません。

旧GAME100の撮影素材と当時の報告は [archive/game100-cd3bb00](archive/game100-cd3bb00/) に保管。今回の登録には `final/` 内の7枚を使用してください。
