# 家族のダッシュボード

壁掛けタブレットで家族の情報を確認するための、静的なWebダッシュボードです。

## 公開ページ

- <https://monoposo.github.io/family_dashboard/>
- `master` ブランチへの変更は GitHub Actions経由で自動公開されます。

### iPadのホーム画面に追加

1. iPadのSafariで公開ページを開きます。
2. 共有ボタンから「ホーム画面に追加」を選びます。
3. 「追加」をタップすると、ホーム画面のアイコンからアプリのように開けます。

## 機能

- 現在時刻、日付、曜日（西暦・和暦）
- 東京の現在の天気と、7時・15時・19時の予報（Open-Meteo）
- Googleカレンダーの今日・明日の予定
- Firebase Authenticationでログインしたユーザー向けの預けメダル一覧
- 取得エラーは各カード内に表示

サーバー状態表示は現在未実装です。天気は30分ごとに自動更新し、時刻は1秒ごとに更新します。

## ローカルで実行

Node.jsなどのビルド環境は不要です。プロジェクトのルートで静的HTTPサーバーを起動します。

```powershell
python -m http.server 4187
```

ブラウザーで <http://localhost:4187> を開きます。`file://` ではなくHTTP経由で実行してください。

## 外部サービスの設定

### Firebase（預けメダル）

- `js/firebase-config.js` にメダルキーパーと同じFirebase Web設定を指定します。
- Firebase AuthenticationでGoogleプロバイダーを有効にし、利用するホスト名を承認済みドメインに登録します。
- Firestoreのトップレベル `/medals` コレクションを読み込みます。各ドキュメントは `title`、`amount`、Timestamp型の `expireDate` を使用し、`memo` は任意です。
- Firestore Security Rulesで、許可されたユーザーだけがデータを読める状態を維持してください。公開読み取り設定にはしないでください。

### Googleカレンダー

- Google CloudでGoogle Calendar APIを有効にし、Web OAuthクライアントを設定します。
- OAuthクライアントの承認済みJavaScript生成元に、ローカルおよび公開時のオリジンを登録します（例: `http://localhost:4187`）。
- 読み取り専用スコープで、ログインしたGoogleアカウントのメインカレンダーから予定を取得します。
- OAuthクライアントIDは `js/calendar.js` で設定します。アクセストークンはブラウザーのセッション中のみ保持します。

Firebase設定値やOAuthクライアントIDはブラウザーから参照できる値です。秘密鍵やサービスアカウント資格情報をフロントエンドへ置かず、API制限とFirestore Security Rulesを設定してください。

## ファイル構成

- `index.html` — ダッシュボードのマークアップ
- `manifest.json` — ホーム画面表示用のWebアプリ設定
- `icon-192.png`、`icon-512.png`、`apple-touch-icon.png` — アプリアイコン
- `styles.css` — レイアウトと表示スタイル
- `js/app.js` — 各機能の初期化
- `js/clock.js` — 時計、日付、現在時刻プロット
- `js/weather.js` — 天気取得と表示
- `js/calendar.js` — Googleカレンダー認証と予定取得
- `js/medals.js` — Firebase認証とFirestoreのメダル表示
- `js/server-status.js` — サーバー状態表示のプレースホルダー
