# Neutron @ Pressure Wiki

高圧下における中性子散乱実験に関するノウハウをまとめています。

## 技術スタック

Next.js 14 + Nextra 2 をフロントエンドに、TinaCMS（セルフホスト）をCMSとして使用。コンテンツの実体はGitHub上のMDXファイルで管理し、MongoDBをインデックスキャッシュ、Netlifyでホスティングしています。

## 開発者向け

詳細なセットアップ手順・アーキテクチャ・環境変数の説明は [CLAUDE.md](./CLAUDE.md) を参照してください。

```bash
yarn dev    # ローカル開発サーバー起動 (localhost:3000)
yarn build  # プロダクションビルド
```

ローカル開発は外部サービス不要（`MONGO_URI` 未設定で自動的にローカルモードで動作）。
