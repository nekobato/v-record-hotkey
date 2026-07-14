# v-record-hotkey

Vue 3 Composition API 向けの、ショートカット入力欄を作るためのライブラリですわ。  
`<input ref="shortcutRef" />` を渡すだけで、録画開始、表示、取消、削除、利用側定義の拒否リストまでまとめて扱えますの。

## 特徴

- **input ファースト**: `useRecordHotkey(inputRef, options)` が公開 API の中心でございますわ。
- **単独キーも修飾キー付きも対応**: `A`、`F1`、`Ctrl + K`、`Shift + A` を 1 コンボとして録画できますの。
- **modifier preview**: 修飾キーだけ押している途中状態も `preview` で取得できますわ。
- **利用側定義の拒否リスト**: `disallow` に配列を渡したときだけ、その組み合わせを拒否いたしますの。
- **低レベル API も同梱**: 高度な UI を作りたい場合は `useHotkeyRecorder()` を直接使えますわ。

## インストール

```bash
npm install v-record-hotkey
npm install vue@^3.3
```

## クイックスタート

```ts
import { ref } from "vue";
import { useRecordHotkey } from "v-record-hotkey";

const shortcutRef = ref<HTMLInputElement | null>(null);

const {
  inputAttrs,
  value,
  isRecording,
  start,
  cancel,
  clear,
} = useRecordHotkey(shortcutRef, {
  disallow: ["Ctrl+S", "Meta+Q"],
});
```

```vue
<template>
  <input ref="shortcutRef" v-bind="inputAttrs" />

  <button type="button" @click="start">Record</button>
  <button type="button" @click="cancel">Cancel</button>
  <button type="button" @click="clear">Clear</button>
</template>
```

`focus`、`click`、`Enter` で録画を開始し、既定では有効なキー入力が入った時点で確定いたしますわ。`Escape` で取消、`Backspace` / `Delete` で削除できますの。

## デフォルト挙動

- `focus` で録画開始
- `click` で録画開始
- `Enter` で録画開始
- 有効な hotkey を 1 回記録したら即確定
- `Escape` で取消
- `Backspace` / `Delete` でクリア
- `blur` 時に候補が残っていれば確定、なければ取消
- 固定の予約ショートカットは持たず、`disallow` へ渡されたものだけ拒否

## `useRecordHotkey`

```ts
function useRecordHotkey(
  inputRef: MaybeRefOrGetter<HTMLInputElement | HTMLTextAreaElement | null | undefined>,
  options?: UseRecordHotkeyOptions,
): UseRecordHotkeyReturn;
```

### 主なオプション

| オプション | 既定値 | 説明 |
| --- | --- | --- |
| `initial` | `null` | 初期ショートカットですわ。 |
| `disallow` | `[]` | 利用側が拒否したいコンボを、文字列または `RecordedHotkey` 配列で渡せますの。 |
| `allowedModifiers` | `Ctrl/Alt/Shift/Meta` | 許可する修飾キー集合でございますわ。 |
| `requireModifierForPrintable` | `false` | `true` にすると文字キーに `Ctrl` / `Alt` / `Meta` を要求いたしますの。 |
| `allowUnmodifiedNonPrintable` | `true` | `Escape` や `F1` などの単独キーを許可いたしますわ。 |
| `startOnFocus` | `true` | input focus で録画を始めますの。 |
| `startOnClick` | `true` | input click で録画を始めますわ。 |
| `startOnEnter` | `true` | idle 状態の Enter で録画を始めますの。 |
| `confirmOnCapture` | `true` | 有効な入力を得た時点で即確定いたしますわ。 |
| `confirmOnBlur` | `true` | 録画中に blur したとき、候補があれば確定いたしますの。 |
| `cancelOnEscape` | `true` | 録画中の Escape で取消いたしますわ。 |
| `clearKeys` | `["Backspace", "Delete"]` | このキーで現在値を削除いたしますの。 |
| `placeholder` | - | input へ渡す placeholder ですわ。 |
| `formatOptions` | - | `useHotkeyFormatter()` へ渡す表示設定でございますの。 |
| `onStart` / `onConfirm` / `onCancel` / `onClear` / `onError` | - | UI 連携用フックですわ。 |

### 戻り値

| プロパティ | 説明 |
| --- | --- |
| `value` | 確定済みショートカットですわ。 |
| `candidate` | 録画セッション中の候補でございますの。 |
| `preview` | 修飾キーだけ押している途中状態ですわ。 |
| `error` | `{ code, message }` のエラー情報ですの。 |
| `isRecording` | 現在録画中かどうかでございますわ。 |
| `displayValue` | input に出す表示文字列ですの。 |
| `inputAttrs` | `v-bind` 用の属性セットでございますわ。 |
| `start` / `confirm` / `cancel` / `clear` / `reset` | 制御メソッドですの。 |

### `inputAttrs`

```ts
{
  value: string;
  readonly: true;
  autocomplete: "off";
  spellcheck: false;
  placeholder?: string;
  "aria-invalid"?: "true";
}
```

基本は `<input ref="shortcutRef" v-bind="inputAttrs" />` としてお使いくださいませ。

## `useHotkeyRecorder`

```ts
function useHotkeyRecorder(options?: UseHotkeyRecorderOptions): UseHotkeyRecorderReturn;
```

こちらは低レベル API で、任意の `target` に録画エンジンだけを張りたい場合に使いますの。公開面の既定は `useRecordHotkey()` で、`useHotkeyRecorder()` は headless な escape hatch とお考えくださいませ。

## `RecordedHotkey`

```ts
interface RecordedHotkey {
  code: string;
  key: string;
  modifiers: ("Ctrl" | "Alt" | "Shift" | "Meta")[];
  location: number;
}
```

`code` は実行時照合向け、`key` は表示補助向け、`modifiers` は修飾キー集合でございます。

## `useHotkeyFormatter`

```ts
const { format } = useHotkeyFormatter({
  os?: "auto" | "mac" | "win",
  showShiftImplicit?: boolean,
});
```

- Windows/Linux では `Ctrl + Shift + K`
- macOS では `⌃⇧K`
- `preview` もそのまま渡せますの

## `matchHotkey`

```ts
const isMatch = matchHotkey(event, recorded, {
  compareKey?: boolean,
  compareLocation?: boolean,
});
```

既定では `code + modifiers` で照合し、必要時だけ `key` や `location` を厳密比較できますわ。

## example

ルート配下の `example/` は、新しい input ファースト API を使ったデモでございます。

```bash
cd example
npm install
npm run dev
```

## ビルドとテスト

```bash
npm run test
npm run lint
npm run format
npm run typecheck
npm run build
```

## ライセンス

MIT License でございます。
