# Prompt Palette

プロンプト管理システム - 包括的なユーザー認証とステート管理機能を備えたデュアルパネルインターフェース

## 機能

### 主要機能
- **デュアルパネルインターフェース**
  - 効率的なワークスペース管理のための分割画面設計
  - 並列表示と編集機能
  - リアルタイムUIアップデート（楽観的更新）
  - カスタマイズ可能なリサイズ可能パネル
  - キーボードショートカット（Ctrl/Cmd + B）によるパネル切り替え

- **認証とセキュリティ**
  - ユーザー登録・ログインシステム
  - Twitter OAuth連携
  - AuthGuardによる保護されたルート管理
  - パスワード管理（表示制御付き）
  - JWTトークンによるセッション管理
  - XSS対策と入力サニタイズ
  - CSRF対策
  - レート制限

- **データベースとストレージ**
  - パフォーマンス向上のためのWALモードを採用したSQLiteデータベース
  - CRUD操作に対応したローカルストレージ
  - ロールバック対応の自動データベースマイグレーション
  - データの永続化とステート管理
  - 外部キー制約とインデックス
  - コネクションプーリングとタイムアウト処理
  - 自動クリーンアップと正常なシャットダウン

- **検索と整理**
  - リアルタイムフィルタリング機能付き高度な検索
  - タグベースの整理システム
  - カレンダーインターフェースによる日付範囲フィルタリング
  - フィールド指定検索
  - メタデータベースのフィルタリング
  - 全文検索機能
  - 複数条件によるソート

- **ユーザーエクスペリエンス**
  - プロファイル設定の構成
  - システム通知とトーストメッセージ
  - リアルタイムUIステート更新
  - 多言語対応（英語、日本語）
  - レスポンシブデザイン（モバイル・デスクトップ対応）
  - 一般的な操作のキーボードショートカット
  - ローカルキャッシュによるオフライン対応

### 技術的機能
- **ロギングとモニタリング**
  - Winstonロガーによるシステムイベント記録
  - デバッグロギングツール
  - リクエストタイミングとパフォーマンスモニタリング
  - スタックトレース付きエラー追跡
  - セキュリティイベントの監査ログ
  - ヘルスチェックエンドポイント
  - リクエストタイムアウトモニタリング

- **開発ツール**
  - 開発時のホットモジュールリプレイスメント
  - 自動データベースマイグレーション
  - TypeScript型チェック
  - ESLintとPrettier連携
  - 開発ワークフロー自動化
  - プロセス管理とクリーンアップ
  - 自動テストセットアップ

## プロジェクト構成

```
├── client/                 # フロントエンドReactアプリケーション
│   ├── src/
│   │   ├── components/    # Reactコンポーネント
│   │   │   ├── ui/       # 再利用可能なUIコンポーネント
│   │   │   └── ...       # 機能別コンポーネント
│   │   ├── hooks/        # カスタムReactフック
│   │   ├── lib/          # ユーティリティ関数
│   │   └── pages/        # ページコンポーネント
├── server/                # バックエンドExpressサーバー
│   ├── utils/            # サーバーユーティリティ
│   │   ├── logger.ts     # Winstonロガー設定
│   │   └── env-validator.ts # 環境変数バリデーション
│   ├── index.ts          # サーバーエントリーポイント
│   ├── routes.ts         # APIルート
│   └── db.ts             # データベース設定
├── db/                   # データベーススキーマとマイグレーション
├── migrations/           # データベースマイグレーションファイル
├── scripts/             # ユーティリティスクリプト
│   └── migrate.ts       # データベースマイグレーションスクリプト
└── logs/                # アプリケーションログ
```

## API ドキュメント

### 認証

#### ユーザー登録
- **POST** `/api/register`
- **説明**: 新規ユーザーアカウントの作成
- **リクエストボディ**:
  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```
- **レスポンス**: 
  ```json
  {
    "user": {
      "id": "number",
      "username": "string",
      "isAdmin": "boolean"
    }
  }
  ```

#### ログイン
- **POST** `/api/login`
- **説明**: ユーザー認証とJWTトークンの取得
- **リクエストボディ**:
  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```
- **レスポンス**:
  ```json
  {
    "user": {
      "id": "number",
      "username": "string",
      "isAdmin": "boolean"
    },
    "token": "string"
  }
  ```
- **注意**: トークンはHTTP-onlyクッキーとしても設定されます

#### ログアウト
- **POST** `/api/logout`
- **説明**: 認証トークンのクリア
- **レスポンス**:
  ```json
  {
    "message": "Logged out successfully"
  }
  ```

### プロンプト

#### プロンプト一覧取得
- **GET** `/api/prompts`
- **認証**: 必須
- **説明**: アクセス可能な全プロンプトの取得（自身のプロンプトと公開プロンプト）
- **レスポンス**: プロンプトオブジェクトの配列
  ```json
  [
    {
      "id": "number",
      "title": "string",
      "content": "string",
      "tags": "string[]",
      "metadata": "object",
      "isLiked": "boolean",
      "isNsfw": "boolean",
      "isPrivate": "boolean",
      "createdAt": "string",
      "updatedAt": "string",
      "userId": "number"
    }
  ]
  ```

#### プロンプト作成
- **POST** `/api/prompts`
- **認証**: 必須
- **リクエストボディ**:
  ```json
  {
    "title": "string",
    "content": "string",
    "tags": "string[]",
    "metadata": "object",
    "isLiked": "boolean",
    "isNsfw": "boolean",
    "isPrivate": "boolean"
  }
  ```
- **レスポンス**: 作成されたプロンプトオブジェクト

#### プロンプト更新
- **PUT** `/api/prompts/:id`
- **認証**: 必須
- **説明**: 既存プロンプトの更新
- **リクエストボディ**: プロンプト作成と同じ
- **レスポンス**: 更新されたプロンプトオブジェクト

#### プロンプト削除
- **DELETE** `/api/prompts/:id`
- **認証**: 必須
- **レスポンス**:
  ```json
  {
    "message": "Prompt deleted successfully"
  }
  ```

### ユーザー管理

#### 現在のユーザー情報取得
- **GET** `/api/user`
- **認証**: 必須
- **レスポンス**: 現在のユーザーオブジェクト

#### ユーザー設定更新
- **PUT** `/api/user/settings`
- **認証**: 必須
- **リクエストボディ**:
  ```json
  {
    "username": "string",
    "currentPassword": "string",
    "newPassword": "string"
  }
  ```
- **レスポンス**: 更新されたユーザーオブジェクト

#### ユーザー一覧取得（管理者専用）
- **GET** `/api/users`
- **認証**: 必須（管理者権限）
- **レスポンス**: ユーザーオブジェクトの配列

#### 管理者権限の切り替え（管理者専用）
- **PUT** `/api/users/:id/toggle-admin`
- **認証**: 必須（管理者権限）
- **レスポンス**:
  ```json
  {
    "message": "Admin status granted/revoked successfully",
    "user": "UserObject"
  }
  ```

#### ユーザー削除（管理者専用）
- **DELETE** `/api/users/:id`
- **認証**: 必須（管理者権限）
- **レスポンス**:
  ```json
  {
    "message": "User deleted successfully"
  }
  ```

### システム

#### ヘルスチェック
- **GET** `/api/health`
- **説明**: システムの健全性確認
- **レスポンス**:
  ```json
  {
    "status": "healthy",
    "uptime": "number",
    "database": "connected",
    "environment": "string",
    "timestamp": "string"
  }
  ```

### エラーレスポンス

全エンドポイントで返される可能性のあるエラーレスポンス:

- **401 Unauthorized**:
  ```json
  {
    "error": "Authentication required"
  }
  ```

- **403 Forbidden**:
  ```json
  {
    "error": "Not authorized to perform this action"
  }
  ```

- **404 Not Found**:
  ```json
  {
    "error": "Resource not found"
  }
  ```

- **500 Internal Server Error**:
  ```json
  {
    "error": "Internal server error message",
    "timestamp": "ISO date string"
  }
  ```

## 技術スタック

### フロントエンド
- React with TypeScript
- Tailwind CSS（スタイリング）
- Radix UI Components
- SWR（データフェッチング）
- React Hook Form
- Date-fns（日付処理）
- Lucide React（アイコン）
- React Resizable Panels

### バックエンド
- Node.js with Express
- SQLite（WALモード）
- Drizzle ORM
- Winston（ロギング）
- JWT（認証）
- Express Session
- Better SQLite3

### 開発ツール
- Vite（開発サーバー）
- TypeScript（型安全性）
- Drizzle Kit（マイグレーション）
- ESBuild（プロダクションビルド）
- Prettier（コードフォーマット）
- ESLint（コード品質）

## 環境設定

必要な環境変数:

```env
NODE_ENV=development|production
PORT=5000
JWT_SECRET=your-jwt-secret
DATABASE_URL=file:./sqlite.db
```

## 開発ワークフロー

Replitで管理される定義済みワークフロー:

- **開発サーバー**: ホットリロード付き開発サーバーの実行
  ```bash
  NODE_ENV=development tsx server/index.ts
  ```

- **データベースマイグレーション**: データベーススキーマの更新
  ```bash
  tsx scripts/migrate.ts
  ```

- **マイグレーション生成**: 新規マイグレーションファイルの作成
  ```bash
  npx drizzle-kit generate:sqlite
  ```

## 開始方法

1. リポジトリのクローン
2. 依存関係のインストール:
   ```bash
   npm install
   ```

3. 環境変数の設定

4. データベースマイグレーションの実行:
   ```bash
   npm run db:push
   ```

5. 開発サーバーの起動:
   ```bash
   npm run dev
   ```

## ヘルスチェック

アプリケーションには `/health` エンドポイントがあり、以下を監視:
- サーバーアップタイム
- データベース接続性
- 環境設定
- システムステータス

## エラー処理

- 包括的なエラー追跡
- 正常なシャットダウン処理
- リクエストタイムアウト管理（デフォルト30秒）
- 自動クリーンアップ手順
- スタックトレースロギング

## ライセンス

[MIT License](LICENSE)
