# NEON CASCADE 実装・検証・引き継ぎ

GAME #008の実装は `src/games/008/` に独立しています。新規依存はありません。Expo SDK 57 / React Native 0.86.3 / React 19.2.3 / TypeScript 6.0.3、Node.js 24.21.0で検証しました。構造・全10コース・保存仕様は [ゲームREADME](../src/games/008/README.md) を参照してください。

## 実装範囲と変更ファイル

| ファイル | 目的 |
| --- | --- |
| `src/games/008/logic/{types,physics,engine}.ts` | 純TS固定ステップ物理、sweep衝突、64球、増殖、爆弾・装甲・扉・コア・バンパー、連鎖・フィーバー・状態管理 |
| `src/games/008/stages.ts` | 攻略の異なる10コース、エンドレス |
| `src/games/008/storage/{records,index}.ts` | 解放・最高点・星・エンドレス記録・演出設定、破損復旧と直列保存 |
| `src/games/008/useNeonCascade.ts`, `src/games/008/GameScreen.tsx` | Reactと物理の分離、ライフサイクル、一時停止、選択・結果・日本語UI |
| `src/games/008/components/Field.tsx` | Reanimatedで球を表示、狙い操作、軌道予測、固定縦横比、小型画面 |
| `src/games/008/audio.ts` | 衝突音の集約・優先制御 |
| `src/app/play/008.tsx`, `src/app/_layout.tsx` | Expo Router登録、ゲーム中の戻るジェスチャー無効化 |
| `src/data/{catalog,ui-text}.ts` | ゲーム登録、日本語の遊び方。共通の一覧・お気に入り・「何やる？」が同じデータを使用 |
| `src/components/{game-artwork,arcade}.tsx` | 専用ネオンカード・アートワーク |
| `src/audio/{types,audio-manager,sounds}.ts` | 008の音源・シーン追加、同一シーンでのFEVER BGM変更、命中群の発音制限。既存APIは互換 |
| `assets/audio/game008/*.wav`, `assets/audio/manifest.json` | 専用2 BGM＋14 SEとアセット登録 |
| `scripts/generate-cascade-audio.py`, `scripts/generate-audio.py` | オリジナル音源の再生成、既存の全体生成への追加 |
| `tests/neon-cascade.test.ts`, `tests/cascade-solutions.json` | 合法入力の全コース攻略、物理・ゲーム状態・保存・音声・発見機能 |
| `tests/audio.test.ts` | 音声Managerの64球相当イベント、FEVER切り替え、停止・ミュートの回帰 |
| `tests/{catalog,discovery,block-break,neon-stack}.test.ts` | 収録数と1人用一覧の期待値を8本へ更新。既存ゲームのルールを変更しない |
| `scripts/cascade-{solve,replay-check,benchmark}.ts` | 攻略探索、角度近傍検証、CPU負荷計測 |
| `scripts/cascade-audio-check.py`, `scripts/cascade-ui-smoke.py` | PCM音源検査、任意のWeb検証環境での実操作スモーク |
| 各README、`docs/audio.md`, `docs/japanese-first-ui.md`, 本資料・`docs/validation/neon-cascade-*.json` | 引き継ぎ、再現方法、確認範囲 |

既存の `.gitignore`、`app.json` のバージョン変更、`tiktok/`、`scripts/tiktok/day02-*` は開始時からの変更として保持しています。今回の実装では削除・上書きしていません。`package.json` / lockfile / EAS設定は変更していません。既存GAME #001〜#007のゲーム本体・保存キー・音源は変更していません。

## 自動検証

- 全259テスト成功。既存ゲームの回帰テストを含みます。
- 全10ステージを合法な角度・待機時間・発射のみでクリア。30/60/120fps入力の計30リプレイで、得点・星3が一致。
- 壁・薄いブロック・角・円形バンパーの連続衝突、実際の6段ゲートで最大64球、同一系統でのゲート再増殖禁止、有限時間でのショット終了。
- 二重発射・加点・破壊、爆弾連鎖、扉、フィーバー限定コア、再開・リスタート、保存破損・同時保存・I/O失敗後の再試行。
- 1万回の衝突イベント集約と、共有Managerの同時音数・固定プール・FEVER切り替え・ミュート・背景移行・非同期キャンセル。
- lint・typecheck・`git diff --check`成功。
- 製品設定でiOS / AndroidのHermesバンドルをオフライン生成成功。両方に専用WAV16個が収録されていることを照合。[最終確認記録](validation/neon-cascade-checks.json)。ネイティブバイナリのビルド・EAS・配布は行っていません。

再現コマンドはゲームREADMEに記載。攻略fixtureを書き換える必要がなければ `npm test` だけで全コースを再検証できます。

## 画面と統合

Chromiumの390×844タッチ環境で、実際の盤面タッチによるステージ1・2のクリア、途中停止・確認キャンセル・再開、星と次ステージ解放のリロード保持、エンドレス第1波クリア→第2波へ得点引き継ぎ、リスタート、演出設定保存、一覧表示を確認。320×568では盤面と発射ボタンが画面内に収まることを確認。JavaScript page errorは0件です。[操作試験記録](validation/neon-cascade-ui.json)、[小型画面](screenshots/neon-cascade-web-small.png)、[クリア画面](screenshots/neon-cascade-web-result.png)を保存しています。

この検証は、既存の別プロジェクトにあるReact Native Webを一時的なMetro設定から参照したローカル検証です。依存をインストールせず、製品の対応プラットフォームも追加していません。音はミュートしており、ブラウザー結果をネイティブ音声・FPS検証に代用していません。再実行用の `scripts/cascade-ui-smoke.py` はPython Playwrightと別途起動済みの検証用Webサーバーが必要です。`CASCADE_WEB_URL` でURLを指定できます。

iPhone 17 Proシミュレーター / Expo Go SDK 57では `/play/008` の起動と[ネイティブのステージ選択画面](screenshots/neon-cascade-ios-select.png)の表示を確認しています。ネイティブ実操作の全コースクリア、Androidエミュレーター、実機は未確認です。

## 性能と限界

[CPU計測JSON](validation/neon-cascade-cpu.json) はNode上の物理演算だけを計測しています。160装甲＋2バンパー、各1,800フレーム、1/16/32/64球。64球は6段ゲートで生成できることを確認後、負荷用の位置・速度を設定します。この負荷fixtureは通常プレイの攻略証明とは分けています。

64球の1フレーム分（1/60秒）の処理：中央値0.1572ms、95%点0.3972ms、99%点0.6038ms、最大35.9948ms。最大値の外れは残して報告します。GC後のヒープ差は単回計測で約-608 bytes。これらはHermes上の描画込み60fps保証、長時間のメモリリーク否定、発熱・電池消費の証明ではありません。

物理はJS側、球座標表示はSharedValue、HUD更新は原則10Hz。球プール64、エフェクト18、SE同時4で制限します。端末で遅ければ、演出削減→HUD更新頻度と座標配列転送の計測→必要箇所の割り当て削減の順で調整します。新規ライブラリ導入や共通基盤の大幅変更は、別途承認が必要です。

[近傍試験JSON](validation/neon-cascade-nearby.json) は攻略角度へ±0.0075/0.015radを加えた参考試験。50通り中37通りが同じショット数でクリア。失敗した近傍でも未使用ショットは残りますが、最短攻略の角度依存はあります。端末でのプレイ感を見て難易度を追加調整してください。

## 音声

[PCM検査JSON](validation/neon-cascade-audio.json) に実音源の長さ・振幅・RMS・ループ境界を記録。専用曲は各約29秒のオリジナル16小節、効果音14個。無音や他ゲームの仮曲の流用ではありません。共通開始音を含む最も大きい4 SE＋BGMの保守的振幅合計は、設定音量1でも0.93695。ネイティブミキサーや端末の処理結果を測った値ではありません。

FEVERでは1 BGMプレーヤーを120msのフェードで交換し、SEプールは保持。拍位置を合わせたトランジションではありません。衝突音はカウンター集約、発音間隔、最大4同時音、重要ジングル優先で制御し、衝突ごとの無制限再生は行いません。

## iOS / Android 実機確認票（未実施）

- [ ] 小型iPhone、通常iPhone、AndroidでSafeArea・戻るキー・ジェスチャー・通知領域・大きい文字を確認。
- [ ] ドラッグ、途中キャンセル、2本指、連打、発射中の操作制限、発射角調整、停止中のリスタートを確認。
- [ ] 全10ステージとエンドレス10波以上を人が操作し、ヒント・難易度・制限時間・疲れにくさを評価。
- [ ] 64球の連続衝突・爆発・FEVERでJS/UIのFPSを別々に測定。目標は60fps。フレーム時間の95/99%点・最大値、操作遅延を記録。
- [ ] 10分以上のプレイと20回以上の出入り後にメモリ、プレーヤー解放、発熱、電池、停止後のCPUを測定。
- [ ] スピーカー・イヤホン・Bluetoothで通常曲を3周以上再生。ループ継ぎ目、FEVER切り替え、衝突音の遅延、音割れ、重なり、疲労感を聴いて確認。
- [ ] BGM/SEの個別ミュート、端末消音、最大設定音量、他アプリ音楽との共存を確認。
- [ ] ホーム移行、着信、ロック、通知シェード、音声経路切り替え、バックグラウンド復帰で停止と明示再開を確認。
- [ ] アプリ強制終了・再起動後の星・解放・最高点・エンドレス記録・設定を確認。
- [ ] #001〜#007の開始・音・終了、カード、お気に入り、「何やる？」、画面遷移を端末で回帰確認。

実装検証時点ではGit push・EASビルド・ストア提出は未実施です。その後、ユーザーからGitへの公開承認を受けました。EASビルド・ストア提出は引き続き別途承認が必要です。


## シミュレーター追加確認

Expo Goがネイティブ側の `ExpoFabricView.injectInitializer` 内で異常終了した記録を確認。以前から残っていた開発サーバーを停止して起動し直し、Expo Goを再起動しました。異常終了の根本原因は未確定です。

再接続後、開発用デバッガーから画面の既存onPressを呼び、ステージ開始・一時停止からの再開・発射処理を確認。物理時刻が7.375秒から7.992秒へ進み、球の座標・球数が変化し、加点後に次の発射待ち画面へ戻ることを確認しました。これはタッチ操作の自動化や、ネイティブの全コース攻略・FPS・音声品質の検証ではありません。
