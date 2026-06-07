# HPN Wiki

Next.js + Nextra + TinaCMS（セルフホスト）+ MongoDB + Netlify によるWikiサイトです。

## 技術スタック

| レイヤー | 技術 |
|---|---|
| フレームワーク | Next.js 14 + Nextra 2（ドキュメントテーマ） |
| CMS | TinaCMS（セルフホスト、TinaCloud不使用） |
| バックエンド | Netlify Functions（`@netlify/plugin-nextjs` 経由） |
| 認証 | Auth.js（next-auth v4 + ユーザーコレクション） |
| データベース | MongoDB（コンテンツインデックスキャッシュ） |
| Gitプロバイダー | GitHub（コンテンツの実体） |
| 数式 | KaTeX（`$...$` インライン・`$$...$$` ブロック対応） |

---

## セットアップ手順

### 1. リポジトリのクローンと依存関係のインストール

```bash
git clone https://github.com/<GITHUB_OWNER>/<GITHUB_REPO>.git
cd <GITHUB_REPO>
yarn install
```

### 2. MongoDB Atlas の設定

1. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) にサインアップ（無料プランで可）
2. 新しいクラスターを作成（例：`Cluster0`）
3. **Database Access** でDBユーザーを作成し、パスワードを控える
4. **Network Access** で `0.0.0.0/0`（すべてのIP）を許可（またはNetlifyのIPを指定）
5. **Connect → Connect your application** から接続文字列を取得
   - 例: `mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/<dbname>?retryWrites=true&w=majority`
6. `<password>` と `<dbname>` を実際の値に置き換えて控えておく

### 3. GitHub Personal Access Token の作成

1. GitHub → **Settings → Developer settings → Personal access tokens → Fine-grained tokens**
2. **Generate new token** をクリック
3. 以下のリポジトリ権限を付与:
   - **Contents**: Read and write
   - **Metadata**: Read-only
4. 生成されたトークンを控えておく

### 4. 環境変数の設定

`.env.example` をコピーして `.env.local` を作成し、値を入力します：

```bash
cp .env.example .env.local
```

```env
GITHUB_OWNER=your-github-username
GITHUB_REPO=your-repo-name
GITHUB_BRANCH=main
GITHUB_PERSONAL_ACCESS_TOKEN=ghp_xxxxxxxxxxxxxxxxxx

MONGO_URI=mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/hpnwiki

NEXTAUTH_SECRET=openssl-rand-base64-32の出力値
NEXTAUTH_URL=http://localhost:3000

TINA_PUBLIC_IS_LOCAL=true

NEXT_PUBLIC_GITHUB_OWNER=your-github-username
NEXT_PUBLIC_GITHUB_REPO=your-repo-name
```

> `NEXTAUTH_SECRET` の生成方法:
> ```bash
> openssl rand -base64 32
> ```

### 5. 初期ユーザーの設定

`content/users/index.json` のパスワードフィールドには **bcryptハッシュ** を設定します。
平文パスワードをそのまま書いてコミットしないでください。

bcryptハッシュの生成方法（Node.js）：

```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('your-password', 10).then(h => console.log(h))"
```

または `htpasswd` コマンドがある場合：

```bash
htpasswd -bnBC 10 "" your-password | tr -d ':\n'
```

生成したハッシュを `content/users/index.json` に設定します：

```json
{
  "name": "Admin",
  "email": "admin@example.com",
  "username": "admin",
  "password": "$2a$10$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
}
```

> **注意**: `content/users/` はGitで管理されます（TinaCMSの設計上必要）。
> パスワードがbcryptハッシュであれば平文は復元できません。
> ただしリポジトリは**プライベート**にすることを強く推奨します。

### 6. ローカル開発の起動

```bash
yarn dev
```

- サイト: http://localhost:3000
- TinaCMS 管理画面: http://localhost:3000/admin

ローカルでは `TINA_PUBLIC_IS_LOCAL=true` の設定により、MongoDBや GitHub を使わずにローカルファイルシステムで動作します。

---

## Netlify へのデプロイ

### 1. Netlify サイトの作成

1. [Netlify](https://app.netlify.com/) にサインアップ
2. **Add new site → Import an existing project** で GitHub リポジトリを接続
3. ビルド設定は `netlify.toml` から自動読み込みされます

### 2. Netlify 環境変数の設定

Netlify ダッシュボード → **Site settings → Environment variables** で以下を設定:

| 変数名 | 値 |
|---|---|
| `GITHUB_OWNER` | GitHubユーザー名 |
| `GITHUB_REPO` | リポジトリ名 |
| `GITHUB_BRANCH` | `main` |
| `GITHUB_PERSONAL_ACCESS_TOKEN` | 手順3で取得したトークン |
| `MONGO_URI` | 手順2で取得した接続文字列 |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` の出力 |
| `NEXTAUTH_URL` | `https://your-site.netlify.app` |
| `TINA_PUBLIC_IS_LOCAL` | `false` |
| `NEXT_PUBLIC_GITHUB_OWNER` | GitHubユーザー名 |
| `NEXT_PUBLIC_GITHUB_REPO` | リポジトリ名 |

### 3. デプロイの実行

Netlify ダッシュボードから **Trigger deploy** を実行するか、GitHub にプッシュすると自動デプロイされます。

---

## KaTeX 数式の使い方

Markdown/MDX ファイル内で数式を書くことができます。

**インライン数式:**
```
質量エネルギー等価式 $E = mc^2$ はアインシュタインが提唱しました。
```

**ブロック数式:**
```
$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$
```

---

## コンテンツの構成

```
content/
├── docs/          # Wiki ドキュメント（.mdx ファイル）
│   └── index.mdx  # ドキュメントのトップページ
└── users/         # ユーザーアカウント情報
    └── index.json # 初期管理者アカウント
```

`pages/` ディレクトリに Nextra のページファイルを配置します：

```
pages/
├── _app.tsx       # グローバル設定（KaTeX CSS のインポートなど）
├── index.mdx      # サイトトップページ
└── docs/
    └── [...].mdx  # Wiki ページ
```

---

## トラブルシューティング

**`yarn dev` でエラーが出る場合:**
- `.env.local` の値が正しく設定されているか確認
- `TINA_PUBLIC_IS_LOCAL=true` がローカル開発時に設定されているか確認

**Netlify デプロイが失敗する場合:**
- 環境変数がすべて設定されているか確認
- MongoDB Atlas の Network Access で Netlify のIPが許可されているか確認（`0.0.0.0/0` を推奨）

**TinaCMS 管理画面にログインできない場合:**
- `content/users/index.json` のユーザー情報が正しいか確認
- `NEXTAUTH_SECRET` が設定されているか確認
