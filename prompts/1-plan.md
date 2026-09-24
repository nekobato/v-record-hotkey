# v-record-hotkey 開発計画

更新日: 2026-07-15

## 現在地

`useRecordHotkey(inputRef, options)` による input 向け API と、`useHotkeyRecorder` による headless API が実装されている。

単一キーコンビネーションの記録、表示整形、比較、禁止キー判定、修飾キーのプレビューを提供している。

composable、formatter、matcher には単体テストがある。

現在の公開 API は、旧計画にあった `useRecordHotkey(options?)` ではなく input-first の形である。

複数ストローク、シーケンス入力、タイムアウト確定は実装されていない。

## v1 の仕様判断

- [ ] v1 を単一キーコンビネーション専用として確定するか、複数ストロークを含めるか決める。
- [ ] 単一キーコンビネーション専用にする場合は、複数ストロークを将来候補として明記し、未実装の option を公開仕様へ含めない。
- [ ] Meta、Control、Alt、Shift のみを押した場合の確定条件を公開仕様として明記する。
- [ ] キーボード配列に依存する `KeyboardEvent.key` と物理位置を表す `KeyboardEvent.code` の利用方針を明記する。

## npm 公開準備

- [ ] npm と pnpm のどちらを正準の package manager とするか決め、重複する lockfile を整理する。
- [ ] `peerDependencies.vue` の範囲と README の対応バージョン表記を一致させる。
- [ ] MIT の `LICENSE` ファイルを追加し、`package.json` の license 表記と一致させる。
- [ ] repository、homepage、bugs、author、packageManager など、公開パッケージに必要な metadata を確認する。
- [ ] README と公開 TSDoc から開発時の人格表現を除き、利用者向けの説明へ統一する。
- [ ] `npm pack --dry-run` 相当で配布物を確認し、不要なソースや lockfile が含まれないようにする。
- [ ] 空の consumer project で ESM import、型解決、Vue への組み込みを確認する。
- [ ] 公開前に test、lint、format、build、pack 検証を実行する。
- [ ] CI と `prepublishOnly` の責務を決め、公開前検証の抜けを防ぐ。
- [ ] `main` ブランチの upstream tracking を設定する。

## 品質確認

- [ ] SSR 環境で import した際に `window` や DOM へ早期アクセスしないことを確認する。
- [ ] input ref の差し替え、unmount、再 mount で event listener が重複しないことを確認する。
- [ ] 日本語配列、US 配列、macOS、Windows の主要キーで表示と比較を確認する。
- [ ] IME composition、auto-repeat、blur、Escape、Backspace の境界動作をテストで固定する。
- [ ] reactive な options を対応範囲に含めるか決め、対応しない場合は制約を文書化する。

## 完了条件

v1 の仕様境界を決定し、公開 metadata とライセンスを整え、独立した consumer project と CI で配布物を検証できた時点を初回公開の完了条件とする。
