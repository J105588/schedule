# 演劇祭スケジュール（静的サイト）

静的な HTML/CSS/JavaScript と CSV データで構成された、演劇祭の公演スケジュール閲覧サイトです。GitHub Pages 等の静的ホスティングで動作します（サーバーサイド不要）。

## 構成
- `index.html`: トップページ。クラス一覧とカウントダウンを表示。
- `1.html` ～ `8.html`: 各クラスのスケジュールページ。DOM の土台のみを持ち、内容は JS が CSV から生成。
- `404.html`: 停止時や未存在ページ用のエラーページ。
- `styles.css`: 共有スタイル。
- `script.js`: 共有ロジック。CSV 読み込み、DOM 生成、モーダル、サイドバー、カウントダウン等。
- `data.csv`: スケジュールデータ（UTF-8, 先頭行ヘッダー必須）。
- `CNAME`: カスタムドメイン設定（GitHub Pages 用）。

## データ仕様（CSV）
ヘッダー行（必須）:
```
class,day,time,title,cast,staff,play_title
```
- `class`: 例 `1組` ～ `8組`
- `day`: `1日目` or `2日目`
- `time`: `HH:MM`（例 `9:15`）
- `title`: 公演回名（第一公演/第二公演/第三公演 など）
- `cast`: 役者名のカンマ区切り
- `staff`: `音響: XXX, 照明: YYY` のようなカンマ区切り
- `play_title`: 作品名（クラスの見出しに使用）

注意:
- 値にカンマを含む場合はダブルクォートで囲むこと（既存行に準拠）。
- 空白は JS 側で `trim()` 済み。未入力は空文字として扱われます。

## 画面/DOM 要件
- すべてのページで共通:
  - サイドバー: `#sidebar` と `#sidebar-overlay`
  - ヘッダー: `.header`（メニューボタンでサイドバー開閉）
- トップ（`index.html`）:
  - カウントダウン要素: `#countdown-days`, `#countdown-hours`, `#countdown-minutes`, `#countdown-seconds`
  - クラス一覧コンテナ: `#classes-grid`
- クラスページ（`N.html`）:
  - 見出し: `#schedule-title`, 説明: `#schedule-description`
  - テーブル挿入先: `#schedule-tables`

## 動作概要（`script.js`）
- ページ読込時:
  1. 停止フラグを確認し、停止中かつ `404.html` 以外なら `404.html` へリダイレクト
  2. `data.csv` を `fetch` してパース
  3. ページ種別に応じて DOM を生成
     - トップ: クラスカードを動的生成、統計（クラス数/公演数/役者数）を表示
     - クラスページ: 1日目/2日目のテーブル、モーダル（キャスト/スタッフ）を生成
  4. サイドバー/モーダルのイベントハンドラ登録
  5. カウントダウン開始（トップ）

主な関数:
- `loadCSVData()`, `parseCSV()/parseCSVLine()`
- `displayMainPage()`, `generateClassCards()`
- `displayClassSchedule(className)`, `generateScheduleTables()`, `generateModals()`
- `updateSidebarClasses()`
- `startCountdown()`

## 運用/更新手順
- **データ更新**: `data.csv` を編集してコミット/デプロイ。ページ側は自動反映。
- **クラスの追加/削除**:
  - CSV に存在するクラス名（例 `9組`）はトップ/サイドバーに自動反映。
  - 個別ページ遷移は `N.html` が必要（例 `9.html`）。`1.html` をコピーして `<title>` と既定テキストを `9組` に変更してください。本文の詳細は JS が CSV から埋めます。
- **停止モード**:
  - 任意のページの `<head>` 内で `window.IS_STOPPED = true;` を設定すると、そのページ閲覧時に停止モード判定が働き、`404.html` にリダイレクトされます。
  - 全体停止にしたい場合は、全ページの該当スクリプトタグを `true` に揃えるか、共通レイアウトを用意して一括管理してください。
- **カウントダウン日程**:
  - `script.js` の `startCountdown()` 内の日時（デフォルト: 日本時間 2025-09-20 09:15）を更新。

## ローカル確認
- そのままファイルをブラウザで開くと、CSV の `fetch` が CORS/ファイルスキーム制約で失敗する場合があります。簡易サーバーで起動してください。
  - Python: `python -m http.server 8080`（`http://localhost:8080`）
  - Node: `npx serve .` など

## デプロイ（GitHub Pages 例）
- `CNAME` のドメインで公開。`settings -> Pages` を `main`/`root` に設定。
- 反映には数分かかる場合があります。キャッシュが残る場合はハードリロードしてください。

## アクセシビリティ/表示
- フォント: Google Fonts `Noto Sans JP`
- アイコン: Font Awesome
- レイアウト: レスポンシブ。キーボードフォーカス可視化対応。

## 既知事項/制限
- `data.csv` の整形に依存（欠損や異常値はそのまま表示/集計されます）。
- タイムゾーンは JST を基準に算出。端末のローカルオフセットを考慮して JST に補正しています。

## ライセンス
- `LICENSE` を参照してください。
