# プロジェクト仕様書 (Project Specification)

概要: 本ファイルは設計書群の入口（Landing）です。プロジェクトの目的、コア要件、および各詳細設計書への参照と推奨読む順を示します。まず読むべきドキュメントとその目的を明確にすることで、実装チームの認識合わせを短時間で行えるようにしています。

推奨読者: プロジェクト関係者全員（プロダクトオーナー、開発者、運用、セキュリティ担当）。

推奨読む順（短時間で実装を始めるための優先度）:

1. `database-design.md` — DB スキーマとマイグレーションを先に固めることで、後続の実装が安定します。
2. `api-design.md` — API 契約（Zod スキーマ含む）を確定してフロント/バックの型整合を担保します。
3. `frontend-design.md` — UI/UX とフロント実装のガイドラインを確認します。
4. `implementation_detail.md` — 実装手順、環境変数、シード、CI を参照してローカル起動とデプロイ手順を把握しますn+5. `architecture.md` — 全体構成、運用・拡張方針を確認します。
5. `development-guidelines.md` — コーディング規約、テスト方針、ブランチ運用を確認します。
6. `security.md` — デプロイ前に必須のセキュリティチェックリストを確認します。

簡易概要（1行説明）:

- [architecture.md](./architecture.md): システム全体設計とデプロイ方針
- [database-design.md](./database-design.md): テーブル定義・FTS・マイグレーション
- [api-design.md](./api-design.md): API 仕様・レスポンス/エラー設計
- [frontend-design.md](./frontend-design.md): フロント実装・コンポーネント設計
- [implementation_detail.md](./implementation_detail.md): 実装順・環境設定・CI
- [development-guidelines.md](./development-guidelines.md): コーディング規約・テスト
- [security.md](./security.md): セキュリティ対策・運用チェックリスト

次のステップ:

- まず `database-design.md` を参照して `schema.ts` を用意し、マイグレーションを生成してください。
- 次に `api-design.md` の Zod スキーマを `packages/shared` に配置してフロント/バックで共有してください。
