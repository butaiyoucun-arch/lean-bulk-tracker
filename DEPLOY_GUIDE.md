# Lean Bulk Tracker — Vercelデプロイ手順書

このガイドでは、Lean Bulk Trackerを **Vercel** にデプロイして、24時間いつでもアクセスできる独立したPWAアプリとして公開する手順を説明します。Manusアカウントとは完全に独立して動作します。

---

## 前提条件

以下のものが必要です。

| 項目 | 説明 |
|------|------|
| GitHubアカウント | 無料で作成可能（[github.com](https://github.com)） |
| Vercelアカウント | GitHubアカウントでサインアップ可能（[vercel.com](https://vercel.com)） |
| Node.js | v18以上（ローカルでビルドする場合のみ必要） |

---

## 方法1: GitHub + Vercel（推奨・最も簡単）

### ステップ1: GitHubにリポジトリを作成

1. [github.com](https://github.com) にログインします
2. 右上の「+」ボタン → 「New repository」をクリック
3. リポジトリ名を入力（例: `lean-bulk-tracker`）
4. **Private**（非公開）を選択（自分だけが使うため）
5. 「Create repository」をクリック

### ステップ2: コードをGitHubにアップロード

**方法A: GitHubのWebインターフェースからアップロード**

1. 作成したリポジトリのページで「uploading an existing file」をクリック
2. ダウンロードしたプロジェクトフォルダ内の全ファイルをドラッグ&ドロップ
3. 「Commit changes」をクリック

**方法B: コマンドライン（Git経験者向け）**

```bash
# ダウンロードしたフォルダに移動
cd lean-bulk-tracker

# Gitを初期化
git init
git add .
git commit -m "Initial commit"

# GitHubリポジトリに接続してプッシュ
git remote add origin https://github.com/あなたのユーザー名/lean-bulk-tracker.git
git branch -M main
git push -u origin main
```

### ステップ3: Vercelでデプロイ

1. [vercel.com](https://vercel.com) にアクセスし、GitHubアカウントでサインアップ/ログイン
2. ダッシュボードで「Add New...」→「Project」をクリック
3. 「Import Git Repository」で先ほど作成したリポジトリを選択
4. **ビルド設定を以下のように変更**:

| 設定項目 | 値 |
|---------|-----|
| Framework Preset | Vite |
| Root Directory | `.` （デフォルトのまま） |
| Build Command | `cd client && npx vite build --outDir ../dist` |
| Output Directory | `dist` |
| Install Command | `cd client && npm install` |

5. 「Deploy」ボタンをクリック
6. 数分待つとデプロイ完了！ `https://あなたのプロジェクト名.vercel.app` でアクセスできます

### ステップ4: iPhoneのホーム画面に追加

1. iPhoneのSafariで `https://あなたのプロジェクト名.vercel.app` にアクセス
2. 画面下部の共有ボタン（□に↑のアイコン）をタップ
3. 「ホーム画面に追加」をタップ
4. 名前を確認して「追加」をタップ

これで、ネイティブアプリのようにホーム画面から直接起動できます。Manusアカウントとは完全に独立しています。

---

## 方法2: Netlifyでデプロイ（代替案）

1. [netlify.com](https://netlify.com) にGitHubアカウントでサインアップ
2. 「Add new site」→「Import an existing project」
3. GitHubリポジトリを選択
4. ビルド設定:

| 設定項目 | 値 |
|---------|-----|
| Build Command | `cd client && npx vite build --outDir ../dist` |
| Publish Directory | `dist` |

5. 「Deploy site」をクリック

---

## 方法3: ローカルビルド + 手動アップロード

Gitを使わない場合の方法です。

```bash
# プロジェクトフォルダに移動
cd lean-bulk-tracker/client

# 依存関係をインストール
npm install

# ビルド
npx vite build --outDir ../dist
```

ビルド後に生成される `dist` フォルダの中身を、以下のサービスにドラッグ&ドロップでデプロイできます:

- **Vercel**: [vercel.com](https://vercel.com) → ダッシュボード → フォルダをドラッグ&ドロップ
- **Netlify**: [app.netlify.com/drop](https://app.netlify.com/drop) → フォルダをドラッグ&ドロップ
- **Surge**: `npx surge dist` コマンドで即デプロイ

---

## SPA（シングルページアプリ）のルーティング設定

このアプリはクライアントサイドルーティングを使用しているため、以下の設定が必要です。

### Vercelの場合

プロジェクトのルートに `vercel.json` を作成（既に含まれています）:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Netlifyの場合

`dist` フォルダに `_redirects` ファイルを作成:

```
/*    /index.html   200
```

---

## データについて

このアプリのデータは全て **ブラウザのlocalStorage** に保存されます。

- サーバーやデータベースは不要です
- データはデバイスのブラウザ内にのみ存在します
- ブラウザのデータを消去するとデータも消えます
- 設定画面からJSON形式でバックアップを取ることをお勧めします

---

## トラブルシューティング

| 問題 | 解決策 |
|------|--------|
| ページが真っ白になる | ブラウザのキャッシュをクリアして再読み込み |
| PWAとしてインストールできない | HTTPSでアクセスしているか確認（Vercel/Netlifyは自動でHTTPS） |
| ルーティングが404になる | `vercel.json` のrewrite設定を確認 |
| データが消えた | localStorageがクリアされた可能性。定期的にJSONバックアップを推奨 |

---

## カスタムドメイン（オプション）

Vercelでは無料でカスタムドメインを設定できます:

1. Vercelダッシュボード → プロジェクト → Settings → Domains
2. 独自ドメインを入力して追加
3. DNSの設定を指示に従って変更

---

*このガイドは Lean Bulk Tracker v2.0 向けに作成されました。*
