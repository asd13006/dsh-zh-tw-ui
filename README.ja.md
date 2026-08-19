# dsh-multi-lang-ui

**言語 / Languages:** [English](README.md) · [繁體中文](README.zh-TW.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Español](README.es.md)

[DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) Web UI の言語オプションに**複数言語**を追加する DSH プラグインです — **繁體中文, 日本語, 한국어, Français, Deutsch, Español**。既知の UI 文字列には手作業で磨き上げた翻訳を使用します（各言語は英語ベースラインから翻訳）。新規・更新・サードパーティ製の文字列は英語にフォールバックします（繁體中文 は実行時に簡体字→繁体字コンバーターを使用）。つまり、アップストリームの UI 更新や他のプラグインにも、**全言語を翻訳し直すことなく**対応できます。

## 機能

- 「Settings → General → Language」メニューに**6言語**を追加（組み込みの 中文 / English に加えて）: 繁體中文, 日本語, 한국어, Français, Deutsch, Español。
- **言語ごとの手磨き翻訳**: 公式の全ロケール名前空間を、**英語ベースライン**から文字列単位で翻訳（各言語 700 文字列以上）。
- **未翻訳文字列のフォールバック**: アップストリーム追加分やサードパーティプラグインの文字列 — 繁體中文 は組み込みの簡体字→繁体字変換テーブル（720 文字以上）でオンザフライ変換、他の言語は英語にフォールバックします（公式 `en` 辞書は全名前空間で完備しているため、文字化けや欠落は発生しません）。
- **DOM レベルのフォールバック変換（zh-TW のみ）**: 辞書にないコンテンツ（例: プラグインマーケットの説明文）は、zh-TW モードで MutationObserver により簡体字から繁体字に変換されます（入力欄・コードブロックなどのユーザーコンテンツは常に除外）。
- **永続化**: 言語の選択はブラウザの `localStorage` に保存され、リロード後も維持されます。
- **非干渉設計**: 純粋なクライアントプラグイン — アップストリームのパッケージは一切変更しません。ロケールサービスが利用できない場合は静かに劣化し、他のプラグインに影響を与えません。

## インストール

**推奨: GitHub からインストール（このリンクをエージェントに渡すか、ご自身で実行）**

```bash
dsh plugin --profile web add https://github.com/asd13006/dsh-multi-lang-ui
```

またはエージェントにインストールさせることもできます: このリポジトリのリンクを DSH に貼り付け、上記のコマンドを実行するようエージェントに依頼してください。

インストール後、`dsh web` を再起動し、「Settings → General → Language」で言語を選択してください。

**削除（重要）**: 必ず `dsh plugin remove` を使用してください — プロファイルのバンドル一覧を正しくクリーンアップします。パッケージを手動で削除すると、DSH の起動を妨げる宙ぶらりんの参照が残る可能性があります:

```bash
dsh plugin --profile web remove dsh-multi-lang-ui
```

**npm install（公開後）**:

```bash
dsh plugin --profile web add dsh-multi-lang-ui
```

## 仕組み

```
locale translate(ns, key)
        │
        ├─ active is one of our languages ?
        │     ├─ curated translation exists (DICTS) ?  → return it
        │     └─ missing (new strings / third-party plugins)
        │           ├─ zh-TW  → convert the zh value via the char table
        │           └─ others → fall back to the en value
        └─ other languages → handled by dsh-client-locale as usual
```

起動時にプラグインは以下を行います:

1. 全ロケール名前空間について、言語ごとの辞書を登録;
2. `locale.translate`（手磨き → フォールバック）と `locale.setLocale`（対応言語 id を受け入れ、`localStorage` に書き込む）をラップ;
3. 対応言語をすべて言語オプション一覧に追加（ロケールスナップショットをパッチし、`locale/change` を発火して設定行を更新）;
4. `locale.adopt` をラップ — 組み込みロケールのホスト設定は非同期で読み込まれ、`active` が `locale.preference ?? browser language` にリセットされます。ユーザーの設定が対応言語の場合は再適用されます;
5. zh-TW モードで辞書外コンテンツ向けの DOM レベルフォールバック変換（MutationObserver）を開始し、別の言語に切り替えると元に戻します。

## アップストリーム更新後に再翻訳は必要ですか?

**いいえ。** 3 層の保護があります:

1. アップストリーム追加の文字列 → フォールバック機構が即座にカバー;
2. アップストリーム変更の文字列 → 手磨き辞書は旧値を維持し、新規・サードパーティ製の文字列は引き続き自動フォールバック。完全に同期したい場合は手磨き辞書を再生成（下記）;
3. 手磨き翻訳を完全同期するには: 再生成フローを一度実行するだけ — 文字列単位の手作業は不要です。

### 手磨き辞書の再生成（任意）

```bash
node scripts/extract.mjs <path-to-node_modules/@deepseek-ai>   # 1. extract the latest zh/en dicts into src/zh-src/ and src/en/
# 2. translate src/en/*.json → src/<lang>/*.json (LLM batch OK; keys and placeholders must match)
node scripts/assemble.mjs                                     # 3. regenerate lib/client.js
```

### 未カバーの簡体字の確認（アップストリーム・サードパーティ更新後）

```bash
node scripts/collect-chars.mjs [third-party-client.js...]   # collect all Simplified characters in use
node scripts/check-missing-chars.mjs                        # list Simplified-only characters missing from the char table
```

報告された文字がある場合は、`src/zh-tw-parts/chars.json` に `"简字": "繁字"` のマッピングを追加し、`node scripts/assemble.mjs` を実行してください。

## リポジトリ構成

```
dsh-multi-lang-ui/
├── package.json              # plugin manifest (dsh.client.inject / bundle.patch)
├── index.mjs                 # Host side: no-op entry (pure client plugin)
├── cordis.patch.yml          # Host plugin entry
├── lib/client.js             # generated browser bundle (do not edit by hand)
├── src/
│   ├── zh-src/               # extracted zh (Simplified Chinese) dicts (generated data)
│   ├── en/                   # extracted en dicts (translation baseline for all languages)
│   ├── zh-tw/ ja/ ko/ fr/ de/ es/   # per-language curated translations (quality baseline)
│   ├── zh-tw-parts/
│   │   ├── chars.json        # Simplified→Traditional char table (zh-TW runtime fallback)
│   │   ├── simplified-only.txt  # Simplified-only character checklist (maintenance)
│   │   └── collected-chars.txt  # collect-chars output
│   └── TERMINOLOGY.md        # terminology reference (used when polishing translations)
├── scripts/                  # extract / assemble / verify / collect / check
└── verify/                   # Playwright end-to-end verification scripts
```

## 既知の制限

- 一対多の簡体字（例: 复制/恢复/复杂 の 复 は異なる繁体字にマッピングされる）は単一マッピング（復）を使用します。手磨き辞書が主要な文字列をカバーしますが、一部の新しい文字列は変換が不完全になる場合があります。
- 言語設定はブラウザの `localStorage` に保存されます（ブラウザごと）。組み込みロケールもリモートブラウザでは非永続 — これは一貫した設計です。
- 文字テーブルにない簡体字はそのまま素通りします — `check-missing-chars.mjs` を定期的に実行し、テーブルを拡張してください。

## セキュリティとプライバシー

- **ネットワーク通信なし**: プラグインは一切のネットワークリクエストを行いません（fetch / WebSocket / テレメトリなし）。唯一の外部 URL はこの README 内のドキュメントリンクです。
- **データ収集なし**: テレメトリ・分析・エラー報告はありません。永続化されるのは `localStorage["dsh-multi-lang-ui.preference"]`（`"ja"` などの言語 id）のみです。
- **機密データへのアクセスなし**: 認証情報・トークン・セッション記録・ファイルシステムへのアクセスはありません。ホスト側（`index.mjs`）は何もしないエントリです。
- **読み取り専用の DOM 変換**: 書き換えられるのはテキストノードのみです（innerHTML なし・注入なし）。入力欄、textarea、contenteditable、コードブロック（pre/code）は常に除外されるため、入力やコードに影響はありません。表示中のセッションメッセージは変換されますが（読み取り専用の表示効果。保存データは不変）、元の言語に戻すと復元されます。
- **サプライチェーンリスクゼロ**: `dependencies` は空 — インストール時に新しいものは何もダウンロードされません。クライアントバンドルは完全に自己完結型（`require` はゼロ）。peer dependencies は DSH に既に存在する公式パッケージのみです。

## FAQ

**Q: dshmarket にプラグインの説明が表示されないのはなぜですか?**
A: マーケットの説明とカテゴリは、ローカルの package.json ではなく、キュレーションされた「awesome-dsh-plugin」レジストリ（`data/plugins/<owner>__<repo>.yml`）から取得されます。そのレジストリにエントリがマージされれば表示されます。

**Q: マーケットにバージョン番号を表示するには npm に公開する必要がありますか?**
A: いいえ。インストール済みプラグインのバージョンはローカルの `node_modules` の package.json から読み取られます（GitHub インストールでも `v0.1.0` と表示されます）。npm への公開は npm 検索と通常の npm インストールにのみ影響します。

**Q: アップストリームが新しい文字列を追加した場合、プラグインを更新する必要がありますか?**
A: いいえ — 実行時のフォールバックが新しい文字列を即座にカバーします（サードパーティプラグインの簡体字中国語の文字列も含む）。最高品質の同期が必要な場合は、`scripts/` で手磨き辞書を再生成してください。

**Q: プラグイン削除後に DSH が起動しなくなりました。**
A: 必ず `dsh plugin --profile web remove dsh-multi-lang-ui` で削除してください（プロファイルのバンドル一覧をクリーンアップします）。パッケージを手動で削除すると、起動を壊す宙ぶらりんの参照が残る可能性があります。

## ライセンス

MIT
