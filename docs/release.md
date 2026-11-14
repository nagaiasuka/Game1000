# ASOBITの配布とストア公開

## 1. 権限とビルド対象

- 開発者本人のアカウントに、既存のExpoプロジェクトのビルド権限と、App Store ConnectのASOBITで提出・公開に必要な権限を付与してもらいます。Appleの契約や署名を扱う必要がある場合は、アカウント管理者に対応を依頼します。APIキー、証明書、パスワードはGitHubに保存せず、既存のEAS管理の認証情報を利用します。 [ExpoのiOS提出手順](https://docs.expo.dev/submit/ios/)
- 公開対象のコミットを決め、そのコミットからクリーンな作業ツリーを用意します。EAS Buildにはコマンドを実行した作業ツリーが使われるため、未コミットのゲームや素材が混入していないか確認してください。
- App Store Connectで公開中・審査中のバージョンを確認し、次の公開番号を `app.json` の `expo.version` に設定してコミットします。iOSのビルド番号とAndroidのversionCodeは、本番プロファイルの `appVersionSource: remote` と `autoIncrement: true` でEAS側が管理します。Gitの `main` に残る古いバージョンをそのまま次回の公開番号に使わないでください。 [Expoのバージョン管理](https://docs.expo.dev/build-reference/app-versions/)

```sh
git status --short
git rev-parse HEAD
npm ci
npm run lint
npm run typecheck
npm test
npx expo-doctor@latest
npx eas-cli@latest whoami
npx eas-cli@latest project:info
```

Expoに未ログインなら `npx eas-cli@latest login` を実行します。既存のExpoプロジェクトにアクセスできることを `project:info` で確認してください。紐付け先は `app.json` の `extra.eas.projectId` です。

## 2. iOSをビルドしてTestFlightで確認する

```sh
npx eas-cli@latest build --platform ios --profile production
```

EASのビルド詳細で成功・アプリのバージョン・ビルド番号を確認します。対象のビルドIDを指定してアップロードします。 `<EAS_BUILD_ID>` は実際のIDに置き換えてください。iOS用の `submit.production.ios.ascAppId` を設定する場合、既存のASOBITのApple IDは `6817633932` です。設定が空の場合はCLIで既存アプリを選ぶか、このIDを設定します。 [ExpoのiOS提出手順](https://docs.expo.dev/submit/ios/)

```sh
npx eas-cli@latest submit --platform ios --profile production --id '<EAS_BUILD_ID>'
```

[App Store ConnectのASOBIT](https://appstoreconnect.apple.com/apps/6817633932/appstore) のTestFlightにビルドが表示されたら、処理と必要なコンプライアンス回答を済ませ、テスターのグループへ追加します。実機にインストールし、公開予定版からの更新、起動、収録本数、追加ゲームのクリア、保存データと音声設定を確認します。外部テストではBeta App Reviewが必要になる場合があります。修正が入った場合はコミットから再ビルドし、再確認したビルドを提出します。 [ExpoのTestFlight手順](https://docs.expo.dev/submit/testflight/)

## 3. App Storeの審査提出と公開

1. App Store ConnectのASOBITで新しいiOSバージョンを作り、TestFlightで確認済みのビルド番号を選びます。
2. 日本語の「このバージョンの最新情報」、説明、掲載画像を提出版と照合します。サポートURL、プライバシー申告、年齢区分、輸出コンプライアンス、審査用の連絡先や補足情報を確認します。 [ストア文案](app-store/asobit-copy.md)
3. リリース方式を決めます。手動公開なら承認後に担当者がリリース操作を行います。自動公開なら承認後にAppleが公開します。2026年10月の1.0.2は自動公開を選択しました。 [Appleの公開オプション](https://developer.apple.com/help/app-store-connect/manage-your-apps-availability/select-an-app-store-version-release-option/)
4. 審査対象に追加し、審査提出を完了します。状況と審査連絡はApp Store Connectで追跡してください。EAS Submitの成功で確認できるのはビルドのアップロードまでです。 [Appleの審査提出手順](https://developer.apple.com/help/app-store-connect/manage-submissions-to-app-review/submit-an-app/)
5. 公開後、日本のApp Storeでバージョンを確認し、実機で更新・起動します。公開日、バージョン、ビルド番号、Gitコミット、EASビルドID、収録本数を次の担当者に残します。

審査前に不具合が見つかった場合は、問題を修正して新しいビルドへ差し替えます。審査中はApp Store Connectで提出の取り下げ可否を確認してください。公開済みの不具合は、修正版のバージョンを作り、同じ手順で審査に出します。段階的リリースを利用している場合は、配信の一時停止も検討できます。

## Androidで配布する場合

Androidの動作確認用には `npx eas-cli@latest build --platform android --profile preview`、Google Play向けのAABには `--profile production` を使います。Google Play公開の運用実績はこの引き継ぎでは確認できていません。ストアアカウントと既存のアプリ登録・署名を確認し、初回登録の場合はPlay Consoleで最初のアップロードを行います。その後、内部テストで確認してから、Play Consoleで対象トラックのリリースを審査・公開へ進めます。EAS Submitを使う場合は、Play側のAPI権限と送信先トラックを先に設定します。 [ExpoのAndroid提出手順](https://docs.expo.dev/submit/android/)
