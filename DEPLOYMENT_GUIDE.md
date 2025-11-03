# 🚀 デプロイガイド

## ⚠️ セキュリティ重要事項

**絶対に以下のファイルを Git にコミットしないでください：**
- `.env` ファイル（すべて）
- `database.sqlite` ファイル
- パスワードや秘密鍵が含まれるファイル

`.gitignore` が正しく設定されているか確認してください。

---

## 📋 デプロイ前チェックリスト

### 1. 環境変数の設定

#### バックエンド
```bash
cd backend
cp .env.production.example .env.production
```

`.env.production` を開いて、以下を**自分で書き換えてください**：
- ✅ `DB_HOST`, `DB_USER`, `DB_PASSWORD` → 本番データベース情報
- ✅ `JWT_SECRET` → 強力なランダム文字列（下記コマンドで生成）
- ✅ `GOOGLE_SHEETS_ID` → Google Sheets ID
- ✅ `GOOGLE_SERVICE_ACCOUNT_EMAIL` → サービスアカウントメール
- ✅ `GOOGLE_PRIVATE_KEY` → サービスアカウント秘密鍵
- ✅ `CORS_ORIGIN` → フロントエンドのドメイン

**JWT_SECRET の生成方法：**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

#### フロントエンド
```bash
cd frontend
cp .env.production.example .env.production
```

`.env.production` を開いて、以下を**自分で書き換えてください**：
- ✅ `REACT_APP_API_URL` → 本番APIサーバーのURL

---

### 2. データベースの準備

本番環境では **PostgreSQL** を使用することを推奨します。

#### PostgreSQL のセットアップ
```bash
# PostgreSQLにログイン
psql -U postgres

# データベース作成
CREATE DATABASE clinic_evaluation_prod;

# ユーザー作成（オプション）
CREATE USER clinic_user WITH PASSWORD '強力なパスワード';
GRANT ALL PRIVILEGES ON DATABASE clinic_evaluation_prod TO clinic_user;
```

---

### 3. ビルドとテスト

#### バックエンド
```bash
cd backend
npm install --production
npm run build
npm start
```

#### フロントエンド
```bash
cd frontend
npm install
npm run build
```

ビルドが成功すれば `frontend/build/` フォルダが作成されます。

---

### 4. デプロイ方法

#### オプション A: Vercel + Render（推奨）

**フロントエンド（Vercel）:**
1. Vercel にログイン
2. プロジェクトをインポート
3. Build Command: `npm run build`
4. Output Directory: `build`
5. Environment Variables に `REACT_APP_API_URL` を設定

**バックエンド（Render）:**
1. Render にログイン
2. New Web Service を作成
3. Build Command: `npm install && npm run build`
4. Start Command: `npm start`
5. Environment Variables を設定（.env.production の内容）

---

#### オプション B: VPS（Ubuntu/Debian）

**必要なソフトウェア:**
- Node.js 18+
- PostgreSQL 14+
- Nginx
- PM2（プロセス管理）

**セットアップ手順:**

1. **Node.js インストール**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

2. **PostgreSQL インストール**
```bash
sudo apt-get install postgresql postgresql-contrib
```

3. **PM2 インストール**
```bash
sudo npm install -g pm2
```

4. **アプリケーションのデプロイ**
```bash
# リポジトリをクローン
git clone <your-repo-url>
cd clinic-evaluation-app

# バックエンドセットアップ
cd backend
npm install --production
npm run build

# .env.production を作成して設定
cp .env.production.example .env.production
nano .env.production  # 値を編集

# PM2で起動
pm2 start dist/server.js --name clinic-backend
pm2 save
pm2 startup

# フロントエンドビルド
cd ../frontend
npm install
npm run build
```

5. **Nginx 設定**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # フロントエンド
    location / {
        root /path/to/clinic-evaluation-app/frontend/build;
        try_files $uri /index.html;
    }

    # バックエンド API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🔒 セキュリティチェックリスト

デプロイ前に確認：

- [ ] `.gitignore` が正しく設定されている
- [ ] `.env` ファイルがGitにコミットされていない
- [ ] JWT_SECRET が強力なランダム文字列になっている
- [ ] データベースのパスワードが強力
- [ ] CORS設定が正しい（本番ドメインのみ許可）
- [ ] HTTPS を使用している
- [ ] Google Service Account の権限が最小限
- [ ] 不要なログが出力されていない

---

## 📊 デプロイ後の確認

1. **動作確認**
   - ログインができるか
   - いいね送信ができるか
   - ポイント交換ができるか
   - 管理者機能が動作するか

2. **パフォーマンス確認**
   - ページ読み込み速度
   - API レスポンス速度

3. **セキュリティ確認**
   - HTTPS が有効か
   - 不正アクセス対策が機能しているか

---

## 🆘 トラブルシューティング

### データベース接続エラー
- `.env.production` のDB設定を確認
- PostgreSQL が起動しているか確認
- ファイアウォール設定を確認

### CORS エラー
- バックエンドの `CORS_ORIGIN` 設定を確認
- フロントエンドのドメインが正しいか確認

### ビルドエラー
```bash
# node_modules を削除して再インストール
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## 📞 サポート

問題が発生した場合は、先生やチームメンバーに相談してください。

**機密情報（パスワード、APIキー等）は絶対に共有しないでください！**
