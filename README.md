# クリニック人事評価アプリ

ポイント制人事評価システム - 看護師と事務員向けのポジティブな評価アプリケーション

## 機能概要

- **いいね機能**: スタッフ同士でいいねとコメントを送信（1日最大5回）
- **ポイント管理**: いいねをポイントに交換（1いいね = 100ポイント）
- **管理者機能**: ポイントチャージ、ユーザー管理、統計表示
- **Google Sheets連携**: 全てのいいね履歴を自動記録
- **データ自動削除**: 1年経過したデータを自動削除

## セットアップ手順

### 1. 環境変数の設定

#### バックエンド (.env ファイル)
```bash
cd backend
cp .env.example .env
```

以下の環境変数を設定:
- `DB_HOST`: PostgreSQLホスト
- `DB_PORT`: PostgreSQLポート
- `DB_NAME`: データベース名
- `DB_USER`: データベースユーザー
- `DB_PASSWORD`: データベースパスワード
- `JWT_SECRET`: JWT署名用のシークレットキー
- `GOOGLE_SHEETS_ID`: Google SheetsのID
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`: サービスアカウントメール
- `GOOGLE_PRIVATE_KEY`: サービスアカウントの秘密鍵

### 2. バックエンドのセットアップ

```bash
cd backend
npm install
npm run dev  # 開発環境
npm run build && npm start  # 本番環境
```

### 3. フロントエンドのセットアップ

```bash
cd frontend
npm install
npm start  # 開発環境
npm run build  # 本番ビルド
```

## 技術スタック

### バックエンド
- Node.js + Express + TypeScript
- PostgreSQL + Sequelize ORM
- JWT認証
- Google Sheets API

### フロントエンド
- React + TypeScript
- Tailwind CSS (レスポンシブ対応)
- React Router
- Axios

## API エンドポイント

### 認証
- `POST /api/auth/register` - 新規登録
- `POST /api/auth/login` - ログイン
- `GET /api/auth/profile` - プロフィール取得

### いいね
- `POST /api/likes/send` - いいね送信
- `GET /api/likes/received` - 受信いいね一覧
- `GET /api/likes/sent` - 送信いいね一覧
- `GET /api/likes/receivers` - 送信可能ユーザー一覧

### ポイント
- `POST /api/points/convert` - いいねをポイントに交換
- `GET /api/points/balance` - ポイント残高
- `GET /api/points/history` - ポイント履歴

### 管理者
- `GET /api/admin/users` - 全ユーザー一覧
- `POST /api/admin/charge-points` - ポイントチャージ
- `DELETE /api/admin/users/:userId` - ユーザー削除
- `GET /api/admin/stats` - システム統計

## データベース構造

### users テーブル
- id (PK)
- name
- email (unique)
- password (hashed)
- role (nurse/office/admin)
- points

### likes テーブル
- id (PK)
- senderId (FK)
- receiverId (FK)
- comment
- isConverted

### point_transactions テーブル
- id (PK)
- userId (FK)
- type (charge/convert/use)
- amount
- description
- adminId (FK, nullable)

## セキュリティ

- パスワードはbcryptでハッシュ化
- JWT認証
- Rate limiting実装
- Helmet.jsでセキュリティヘッダー設定
- CORS設定

## 注意事項

- PostgreSQLが必要です
- Google Sheetsの設定が必要です（サービスアカウント作成、スプレッドシート共有）
- データは1年後に自動削除されます