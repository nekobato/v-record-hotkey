# v-record-hotkey 開発計画

更新日: 2026-10-02

## 現在地

`useRecordHotkey(inputRef, options)` による input 向け API と、`useHotkeyRecorder` による headless API が実装されている。

単一キーコンビネーションの記録、表示整形、比較、禁止キー判定、修飾キーのプレビューを提供している。

composable、formatter、matcher には単体テストがある。

現在の公開 API は、旧計画にあった `useRecordHotkey(options?)` ではなく input-first の形である。

複数ストローク、シーケンス入力、タイムアウト確定は実装されていない。

## v1 の仕様判断

- [ ] v1 を単一キーコンビネーション専用として確定するか、複数ストロークを含めるか決める。
- [ ] 単一キーコンビネーション専用にする場合は、複数ストロークを将来候補として明記し、未実装の option を公開仕様へ含めない。
- [x] Meta、Control、Alt、Shift のみを押した場合はプレビューを表示し、確定しないことを README に明記する。
- [x] キーボード配列に依存する `KeyboardEvent.key` と物理位置を表す `KeyboardEvent.code` の利用方針を README に明記する。

## npm 公開準備

- [x] pnpm を正準の package manager とし、本体と `example/` を workspace としてルートの `pnpm-lock.yaml` で管理する。
- [x] `peerDependencies.vue` と README の対応バージョン表記を `3.5.24` に一致させる。対応範囲を広げる場合の検証は別途必要。
- [ ] MIT の `LICENSE` ファイルを追加し、`package.json` の license 表記と一致させる。
- [ ] repository、homepage、bugs、author など、公開パッケージに必要な metadata を確認する。`packageManager` は `pnpm@11.10.0` に固定済み。
- [ ] 公開 TSDoc から開発時の人格表現を除き、利用者向けの説明へ統一する。README は通常の文体へ変更済み。
- [x] `pnpm pack --dry-run` で配布物を確認し、不要なソースファイルや lockfile が含まれないことを確認する。
- [ ] 空の consumer project で ESM import、型解決、Vue への組み込みを確認する。
- [ ] 公開前に test、lint、format、build、pack 検証を実行する。
- [ ] CI と `prepublishOnly` の責務を決め、公開前検証の抜けを防ぐ。
- [x] `main` ブランチの upstream tracking が `origin/main` であることを確認する。

## デモ

- [x] `example/` に基本入力、手動確定、修飾キー必須のデモを用意する。
- [x] 確定値、候補、プレビュー、OS 別表示、JSON、操作履歴、実行時の照合を表示する。
- [x] ローカルの静的ビルドで記録、取消、削除、禁止キー、手動確定、照合を確認する。
- [x] 相対 base でビルドし、`/v-record-hotkey/` 配下で表示できることを確認する。
- [x] GitHub Pages の手動公開用 workflow と操作手順を用意する。

デモの公開はまだ実施していない。Pages を利用できる状態になってから、ユーザーの公開判断に従って workflow を実行する。

## 品質確認

- [x] DOM のない Node.js 環境で ESM / CommonJS の import と `useRecordHotkey(null)` の作成が成功することを確認する。SSR アプリへの組み込みと hydration は未確認。
- [ ] input ref の差し替え、unmount、再 mount で event listener が重複しないことを確認する。
- [ ] 日本語配列、US 配列、macOS、Windows の主要キーで表示と比較を確認する。
- [ ] IME composition、auto-repeat、blur、Escape、Backspace の境界動作をテストで固定する。
- [ ] reactive な options を対応範囲に含めるか決め、対応しない場合は制約を文書化する。

## 完了条件

v1 の仕様境界を決定し、公開 metadata とライセンスを整え、独立した consumer project と CI で配布物を検証できた時点を初回公開の完了条件とする。

この計画には未完の仕様判断と公開準備が残っているため、現時点では削除しない。すべて完了したら、利用者向けの仕様と操作手順を README に残し、この開発計画を削除できる。
