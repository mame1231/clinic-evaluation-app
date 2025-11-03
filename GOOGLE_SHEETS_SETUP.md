# 📊 Google Sheets API セットアップガイド

このガイドに従って、いいね履歴をGoogle Sheetsに自動保存する機能を有効化します。

## 🎯 概要

- **アプリ内**：最新100件のいいね履歴を表示
- **Google Sheets**：全てのいいね履歴を永久保存
- **管理者**：Google Sheetsで全履歴を確認可能

---

## 📋 セットアップ手順

### ステップ1: Google Cloud Projectを作成

1. **Google Cloud Console にアクセス**
   - https://console.cloud.google.com/

2. **新しいプロジェクトを作成**
   - プロジェクト名: `clinic-evaluation-app`（任意）
   - 作成ボタンをクリック

### ステップ2: Google Sheets API を有効化

1. **APIとサービス > ライブラリ** に移動
   - https://console.cloud.google.com/apis/library

2. **「Google Sheets API」を検索**

3. **「有効にする」をクリック**

### ステップ3: サービスアカウントを作成

1. **APIとサービス > 認証情報** に移動
   - https://console.cloud.google.com/apis/credentials

2. **「認証情報を作成」→「サービスアカウント」を選択**

3. **サービスアカウントの詳細を入力**
   - 名前: `clinic-sheets-service`（任意）
   - ID: 自動生成される
   - 「作成して続行」をクリック

4. **ロールを付与（スキップ可能）**
   - 「続行」をクリック

5. **「完了」をクリック**

### ステップ4: サービスアカウントキーを作成

1. **作成したサービスアカウントをクリック**

2. **「キー」タブに移動**

3. **「鍵を追加」→「新しい鍵を作成」**

4. **「JSON」を選択して「作成」**
   - JSONファイルがダウンロードされます
   - ⚠️ **このファイルは絶対に Git にコミットしないでください！**

### ステップ5: Google Spreadsheetsを作成

1. **Google Spreadsheetsにアクセス**
   - https://sheets.google.com/

2. **新しいスプレッドシートを作成**
   - タイトル: `クリニック評価システム - いいね履歴`（任意）

3. **1行目にヘッダーを追加**（重要！）
   ```
   A1: 日時
   B1: 送信者
   C1: 受信者
   D1: コメント
   ```

4. **スプレッドシートのIDをコピー**
   - URL: `https://docs.google.com/spreadsheets/d/【ここがID】/edit`
   - 例: `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`

### ステップ6: スプレッドシートを共有

1. **「共有」ボタンをクリック**

2. **サービスアカウントのメールアドレスを追加**
   - JSONファイルの `client_email` の値をコピー
   - 例: `clinic-sheets-service@project-id.iam.gserviceaccount.com`
   - 権限: **編集者**

3. **「送信」をクリック**
   - ⚠️ 「このメールアドレスにお知らせを送信する」のチェックを外す

### ステップ7: 環境変数を設定

1. **ダウンロードしたJSONファイルを開く**

2. **以下の値をコピー**

   **GOOGLE_SHEETS_ID:**
   ```
   # スプレッドシートのURL から取得
   ```

   **GOOGLE_SERVICE_ACCOUNT_EMAIL:**
   ```json
   // JSONファイルの client_email の値
   "client_email": "clinic-sheets-service@project-id.iam.gserviceaccount.com"
   ```

   **GOOGLE_PRIVATE_KEY:**
   ```json
   // JSONファイルの private_key の値
   // ⚠️ \n を含めてコピーすること！
   "private_key": "-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
   ```

3. **backend/.env または .env.production に貼り付け**

   ```bash
   # Google Sheets
   GOOGLE_SHEETS_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
   GOOGLE_SERVICE_ACCOUNT_EMAIL=clinic-sheets-service@project-id.iam.gserviceaccount.com
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQE...\n-----END PRIVATE KEY-----\n"
   ```

   ⚠️ **GOOGLE_PRIVATE_KEY は必ずダブルクォーテーションで囲むこと！**

4. **JSONファイルを削除または安全な場所に保管**
   - ⚠️ Git リポジトリに含めないこと！

---

## ✅ 動作確認

1. **バックエンドサーバーを起動**
   ```bash
   cd backend
   npm run dev
   ```

2. **アプリでいいねを送信**

3. **Google Spreadsheetsを確認**
   - 2行目に新しいデータが追加されているはず
   - 日時、送信者、受信者、コメントが記録される

---

## 🔒 セキュリティ注意事項

### ❌ 絶対にやってはいけないこと

1. **JSONキーファイルを Git にコミット**
2. **GOOGLE_PRIVATE_KEY をスクリーンショットに含める**
3. **サービスアカウントのメールとキーを公開**
4. **スプレッドシートを一般公開**

### ✅ 安全な管理方法

1. **JSONファイルは .gitignore で除外**
2. **.env ファイルも .gitignore で除外**（既に設定済み）
3. **スプレッドシートの共有はサービスアカウントのみ**
4. **本番環境では環境変数で管理**

---

## 🆘 トラブルシューティング

### エラー: "Error writing to Google Sheets"

**原因と対処法：**

1. **GOOGLE_SHEETS_ID が間違っている**
   - スプレッドシートのURLを確認
   - IDだけをコピー（余分な文字が入っていないか）

2. **サービスアカウントに共有していない**
   - スプレッドシートの「共有」設定を確認
   - サービスアカウントのメールが追加されているか
   - 権限が「編集者」になっているか

3. **GOOGLE_PRIVATE_KEY の形式が間違っている**
   - `\n` が正しく含まれているか
   - ダブルクォーテーションで囲んでいるか
   - 改行コードが正しいか

### エラー: "Google Sheets API has not been used in project"

**対処法：**
- Google Cloud Console で Google Sheets API が有効化されているか確認
- 数分待ってから再試行

### データが記録されない

**確認事項：**
1. バックエンドのログを確認
   ```bash
   # ターミナルで確認
   "Google Sheets error:" が出ていないか
   ```

2. スプレッドシートのシート名が `Sheet1` になっているか
   - 別の名前の場合、コードを修正する必要があります

3. 環境変数が正しく読み込まれているか
   ```javascript
   // backend/src/server.ts で確認
   console.log('GOOGLE_SHEETS_ID:', process.env.GOOGLE_SHEETS_ID);
   ```

---

## 📊 Google Sheets の使い方

### データの見方

| 日時 | 送信者 | 受信者 | コメント |
|------|--------|--------|----------|
| 2025/10/27 10:30 | 田中太郎 | 佐藤花子 | 本日もお疲れ様でした！ |
| 2025/10/27 11:00 | 佐藤花子 | 鈴木一郎 | いつもありがとうございます |

### フィルター機能

1. **特定のユーザーだけ表示**
   - B列（送信者）またはC列（受信者）でフィルタ

2. **期間で絞り込み**
   - A列（日時）でフィルタ

### データのエクスポート

1. **ファイル > ダウンロード > CSV**
   - Excel等で分析可能

---

## 🎉 完了！

これで、いいね履歴が自動でGoogle Sheetsに記録されるようになりました！

- アプリ内：最新100件
- Google Sheets：全履歴

管理者はGoogle Sheetsでいつでも全履歴を確認できます。
