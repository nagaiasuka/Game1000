# ASOBIT 無加工RAWスクリーンショット

2026年10月1日取得。後工程の広告制作向けRAW PNG **20枚**。文字・ロゴ・背景・枠の追加、トリミング、リサイズ、色調補正、再エンコードはしていません。

## 撮影環境

- macOS 26.5.2 / Xcode 26.6 / iOS Simulator 26.5。
- **iPhone 13 Pro Max**。Simulator管理名は `GAME100 App Store iPhone 13 Pro Max`。
- 最新ASOBIT単体のReleaseビルド。アプリ本体は `8aaa873`。撮影時HEAD `8e97bdd` との差分は前回の画像・文書などで、本番コードは同一です。
- Expo Go、Metro、Developer Menu、エラー、Macウィンドウ枠、カーソルを含みません。
- Simulator標準機能で09:41・通信・電池表示を統一。アプリコードでの固定なし。
- 全20枚、端末のネイティブ解像度 **1284 × 2778 px**。`xcrun simctl io screenshot` で取得。

## 原本について

前回の最新ASOBIT撮影原本13枚をバイト単位で同一のまま再利用し、7枚を追加撮影しました。旧GAME100画像や完成広告画像は使用していません。再利用元、実寸、サイズ、SHA-256は [manifest.json](manifest.json) に記録しています。

## 各素材の状態と選定

- `01-challenge.png`: ASOBIT、100 DAYS / 30 GAMES、会社員の挑戦、次のゲームはあなたの声から。**005 / 030、あと25ゲーム、16.7%、DAY 01 / 100、100日目2027年1月8日**。すべて撮影日の実表示です。
- `02-home.png`: ASOBITロゴ、キャッチコピー、TikTok、Challenge、ゲーム一覧タブ。
- `03-games-top.png`: BLOCK DROP / BLOCK BREAK。
- `03-games-middle.png`: NEON STACK / NEON PATH。
- `03-games-bottom.png`: NEON PATH / NEON SLING。上記3枚で現行5ゲームを網羅。
- `04-block-break-a.png`: 推奨。スコア200、コンボ×1、残り2、動くボールと一部蓄積したフィーバー。
- `04-block-break-b.png`: 予備。スコア200、コンボ×1、残り2、右端の破壊エフェクト。再発射時の案内が一時的に残る瞬間。
- `04-block-break-c.png`: 予備。スコア300、コンボ×1、残り1、右端の破壊エフェクト。再発射時の案内が一時的に残る瞬間。
- `04-block-break-d.png`: 推奨予備。スコア100、コンボ×1、残り3、ボールの軌跡と破壊済みブロック。
- `05-neon-stack.png`: 9手進行、両者の大小の駒、2段のスタック2箇所、プレイヤー2の番。
- `06-neon-sling-a.png`: 推奨。下側がパックを引いて狙う瞬間。黄色のAim表示、双方5パック。
- `06-neon-sling-b.png`: 予備。発射後のパック移動・衝突エフェクト、双方5パック。
- `06-neon-sling-c.png`: 予備。相手陣地へ送り込んだ後。上側4・下側6パック、軌跡・衝突エフェクト。
- `07-progress.png`: HOMEのChallenge全体と新作NEON SLINGカード。
- `07-games.png`: 一覧の5件表示・絞り込み導線・BLOCK DROP / BLOCK BREAK。
- `extra-block-drop.png`: スコア208、複数の積まれたブロック、落下中ブロックと着地点ガイド。
- `extra-neon-path.png`: 両者とも移動済み。壁6枚配置、両者残り7枚。
- `extra-random.png`: 実際の抽選結果NEON PATH。
- `extra-favorites.png`: お気に入り3本。STACKとBREAKのカードが見える位置。
- `extra-settings.png`: テーマカラー5色、BGM・効果音オン。

BLOCK BREAKは全候補ステージ1の実プレイです。希望例のステージ2〜5・大幅に崩れた盤面は未取得。案内文字のない `a` / `d` を優先してください。NEON SLINGの上側UIの180度反転は実ゲームの正常な仕様です。

## 検証・コード・Git

- 全PNGの検証・デコード・実寸取得・SHA-256記録と、全候補の目視確認を実施。
- RAWは画面全体を保持。スクロール途中の隣接カードや画面下端に続くコンテンツも実表示のままです。
- 実際のタップ・ドラッグ操作で撮影。本番コード変更、撮影用fixture、固定スコア・盤面・進捗、強制フィーバーはありません。
- `npm run typecheck` / `npm run lint`: 成功。
- `npm test`: **190件成功、0件失敗**。
- Git追加対象はこのフォルダの選定済みPNG20枚、manifest.json、README.md。失敗画像・確認用縮小画像は含みません。
- push・App Store Connectへのアップロードは未実施。

## ファイル実寸・容量

| PNG | Pixels | Bytes | Source |
|---|---|---:|---|
| [01-challenge.png](01-challenge.png) | 1284 x 2778 | 664,936 | reused original |
| [02-home.png](02-home.png) | 1284 x 2778 | 583,529 | reused original |
| [03-games-bottom.png](03-games-bottom.png) | 1284 x 2778 | 1,195,517 | reused original |
| [03-games-middle.png](03-games-middle.png) | 1284 x 2778 | 1,484,467 | reused original |
| [03-games-top.png](03-games-top.png) | 1284 x 2778 | 1,457,789 | reused original |
| [04-block-break-a.png](04-block-break-a.png) | 1284 x 2778 | 152,964 | reused original |
| [04-block-break-b.png](04-block-break-b.png) | 1284 x 2778 | 171,365 | new capture |
| [04-block-break-c.png](04-block-break-c.png) | 1284 x 2778 | 171,174 | new capture |
| [04-block-break-d.png](04-block-break-d.png) | 1284 x 2778 | 152,110 | new capture |
| [05-neon-stack.png](05-neon-stack.png) | 1284 x 2778 | 268,286 | reused original |
| [06-neon-sling-a.png](06-neon-sling-a.png) | 1284 x 2778 | 445,626 | reused original |
| [06-neon-sling-b.png](06-neon-sling-b.png) | 1284 x 2778 | 497,246 | new capture |
| [06-neon-sling-c.png](06-neon-sling-c.png) | 1284 x 2778 | 512,799 | new capture |
| [07-games.png](07-games.png) | 1284 x 2778 | 1,373,512 | new capture |
| [07-progress.png](07-progress.png) | 1284 x 2778 | 874,289 | new capture |
| [extra-block-drop.png](extra-block-drop.png) | 1284 x 2778 | 173,806 | reused original |
| [extra-favorites.png](extra-favorites.png) | 1284 x 2778 | 1,366,952 | reused original |
| [extra-neon-path.png](extra-neon-path.png) | 1284 x 2778 | 319,081 | reused original |
| [extra-random.png](extra-random.png) | 1284 x 2778 | 953,973 | reused original |
| [extra-settings.png](extra-settings.png) | 1284 x 2778 | 291,932 | reused original |

Total: 13,111,353 bytes (12.50 MiB). New captures: 3,752,495 bytes (3.58 MiB).

The 13 reused originals share existing Git blobs; their PNG contents are unchanged.
