# ASOBIT ブランドアセット

ASOBIT + 独自ゲームパッドのベクターデザイン。Dark Navy #070711、CyanからPinkのネオン。期間限定企画の数字は含めません。

| 用途 | ファイル | 仕様 |
| --- | --- | --- |
| 編集可能原稿 | branding/asobit-icon.svg | 独自パスの文字とゲームパッド。外部フォント不要 |
| Master | branding/asobit-icon-master.png | 1024×1024 RGB、アルファなし |
| iOS・共通・Splash | icon.png | Masterと同一、角丸はOS側 |
| Android foreground | adaptive-icon.png | 1024×1024 RGBA、中央安全領域内 |
| Android monochrome | monochrome-icon.png | 1024×1024、白とアルファ |

SplashはDark Navy背景に中央180幅で表示します。生成は `python scripts/generate-brand-assets.py`（rsvg-convert / Pillow使用）。アプリ実行依存は追加していません。小サイズとマスクを含む確認画像は `docs/screenshots/asobit-icon-review.png`。

旧添付原本 `branding/game100-icon-master.png` は履歴として保持し、現行アプリは参照しません。新アセットは[Expoのアイコン・Splash仕様](https://docs.expo.dev/develop/user-interface/splash-screen-and-app-icon/)に沿って設定しています。
