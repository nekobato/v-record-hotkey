# v-record-hotkey

Vue 3のショートカット設定画面向けcomposableライブラリです。
`useRecordHotkey()`に入力要素のrefを渡すと、キーの記録、表示、確定、取消、削除をまとめて扱えます。
入力欄のHTMLとスタイルはアプリ側で用意するため、既存のフォームに組み込めます。

- `A`、`F1`、`Ctrl + K`など、単一のキーコンビネーションを記録
- 修飾キーのプレビュー、自動確定と手動確定、禁止ショートカットの設定
- Windows/LinuxとmacOSに合わせた表示
- `RecordedHotkey`による保存と`KeyboardEvent`との照合

## 目次

- [インストール](#インストール)
- [クイックスタート](#クイックスタート)
- [入力欄の基本操作](#入力欄の基本操作)
- [使用例](#使用例)
- [APIリファレンス](#apiリファレンス)
- [制約と注意点](#制約と注意点)
- [ローカルデモ](#ローカルデモ)
- [ライセンス](#ライセンス)

## インストール

現在はnpm未公開です。
動作を試す場合は[ローカルデモ](#ローカルデモ)を起動してください。
公開後のインストールコマンドは次のとおりです。

```bash
pnpm add v-record-hotkey vue@3.5.24
```

```bash
npm install v-record-hotkey vue@3.5.24
```

必要なVueのバージョンは`3.5.24`です。
以下の使用例はVue Single-File Component（SFC）の`<script setup lang="ts">`を使用します。
composableを直接importするため、`app.use()`による登録は不要です。

## クイックスタート

次の内容をVueコンポーネントに置きます。
入力欄をクリックして`Ctrl + K`などを押すと、その組み合わせが確定します。

```vue
<script setup lang="ts">
import { useTemplateRef } from "vue";
import { useRecordHotkey } from "v-record-hotkey";

const inputRef = useTemplateRef<HTMLInputElement>("shortcutInput");
const { inputAttrs, value, isRecording, error, clear } = useRecordHotkey(inputRef, {
  placeholder: "クリックしてキーを入力",
});
</script>

<template>
  <label for="shortcut">ショートカット</label>
  <input
    id="shortcut"
    ref="shortcutInput"
    v-bind="inputAttrs"
    aria-describedby="shortcut-help shortcut-error"
  />
  <p id="shortcut-help">Escapeで取消、Backspace / Deleteで削除できます。</p>
  <p role="status">{{ isRecording ? "キーを入力してください" : "記録を開始できます" }}</p>
  <p id="shortcut-error" role="alert">{{ error?.message }}</p>
  <button type="button" :disabled="!value" @click="clear">削除</button>
</template>
```

`inputAttrs`には表示用の`value`と`readonly`などが含まれます。
入力欄には`v-bind="inputAttrs"`を使い、確定結果は`value`から読み取ります。
スクリプト内では`value.value`、テンプレート内では`value`で参照できます。
ラベル、補足、エラー表示、スタイルはアプリ側で用意してください。

## 入力欄の基本操作

既定の設定では次のように動作します。

| 操作 | 結果 |
| --- | --- |
| 入力欄へfocus / click、または待機中に修飾キーなしのEnter | 記録を開始 |
| `A`、`F1`、`Ctrl + K`、`Shift + A`などを入力 | 有効な組み合わせを即座に確定 |
| Ctrl / Alt / Shift / Metaだけを入力 | `preview`を更新し、記録を継続 |
| 記録中に修飾キーなしのEscape | 記録を取り消し、確定済みの値を保持 |
| 修飾キーなしのBackspace / Delete | 確定済みの値と記録中の候補を削除 |
| 記録中に入力欄からblur | 候補があれば確定し、なければ取消 |
| IME変換中の入力、キーのauto-repeat | 記録対象から除外 |

## 使用例

### 手動で確定する

`confirmOnCapture: false`にすると、入力した組み合わせは`candidate`に保持されます。
`confirm()`で`value`へ反映し、`cancel()`で確定済みの値を保持したまま候補を破棄します。

```vue
<script setup lang="ts">
import { useTemplateRef } from "vue";
import { useRecordHotkey } from "v-record-hotkey";

const inputRef = useTemplateRef<HTMLInputElement>("shortcutInput");
const { inputAttrs, candidate, value, isRecording, confirm, cancel } = useRecordHotkey(inputRef, {
  confirmOnCapture: false,
});
</script>

<template>
  <label for="manual-shortcut">ショートカット</label>
  <input id="manual-shortcut" ref="shortcutInput" v-bind="inputAttrs" />
  <button type="button" :disabled="!candidate" @pointerdown.prevent @click="confirm">確定</button>
  <button type="button" :disabled="!isRecording" @pointerdown.prevent @click="cancel">取消</button>
  <pre>{{ value }}</pre>
</template>
```

ボタンの`@pointerdown.prevent`は、クリック前に入力欄のfocusが外れるのを防ぎます。
既定の`confirmOnBlur: true`では、Tabなどで入力欄から移動した場合も候補が確定します。
`confirmOnBlur: false`にすると、blur時には記録が取り消されます。

### 入力条件とコールバックを設定する

クイックスタートの`useRecordHotkey()`に渡すオプションを、次のように変更します。

```ts
const { inputAttrs, value, isRecording, error, clear } = useRecordHotkey(inputRef, {
  allowedModifiers: ["Ctrl", "Shift", "Meta"],
  requireModifierForPrintable: true,
  disallow: ["Ctrl+S", "Meta+Q"],
  onConfirm(shortcut) {
    console.log("確定したショートカット", shortcut);
  },
  onClear() {
    console.log("ショートカットを削除しました");
  },
  onError(error) {
    console.error(error.code, error.message);
  },
});
```

この設定では文字キーにCtrl / Alt / Metaのいずれかが必要となり、Shiftだけでは条件を満たしません。
`allowedModifiers`からAltを除いているため、この例で文字キーに使えるのはCtrlまたはMetaです。
F1などの非文字キーにも修飾キーを要求する場合は、`allowUnmodifiedNonPrintable: false`を追加します。
`disallow`の既定値は空配列で、ライブラリ共通の禁止リストはありません。

### 記録した値をOS別に表示する

保存には`RecordedHotkey`を使い、表示時に`useHotkeyFormatter()`で文字列へ変換します。

```ts
import { useHotkeyFormatter, type RecordedHotkey } from "v-record-hotkey";

const shortcut: RecordedHotkey = {
  code: "KeyK",
  key: "K",
  modifiers: ["Ctrl", "Shift"],
  location: 0,
};

const windows = useHotkeyFormatter({ os: "win" });
const mac = useHotkeyFormatter({ os: "mac" });

windows.format(shortcut); // "Ctrl + Shift + K"
mac.format(shortcut); // "⌃⇧K"
```

`format()`には確定値だけでなく`HotkeyPreview`も渡せます。
文字列への変換は表示用です。
キー入力との照合には、元の`RecordedHotkey`を使用してください。

## APIリファレンス

| API | 用途 |
| --- | --- |
| `useRecordHotkey()` | input / textareaでの記録、表示、確定、取消、削除 |
| `useHotkeyRecorder()` | 任意の`EventTarget`でのキー記録 |
| `useHotkeyFormatter()` | 記録値とプレビューの表示 |
| `matchHotkey()` | `KeyboardEvent`と記録値の照合 |

### `useRecordHotkey(inputRef, options?)`

```ts
function useRecordHotkey(
  inputRef: MaybeRefOrGetter<HTMLInputElement | HTMLTextAreaElement | null | undefined>,
  options?: UseRecordHotkeyOptions,
): UseRecordHotkeyReturn;
```

`inputRef`は入力要素、Vueのref、または要素を返すgetterを受け取ります。
コンポーネントの`setup`内で呼び出すと、スコープの破棄時にイベントリスナーを解除します。

#### オプション

| オプション | 型 | 既定値 | 説明 |
| --- | --- | --- | --- |
| `initial` | `RecordedHotkey \| null` | `null` | 初期値。作成時に複製し、`reset()`時に復元 |
| `disallow` | `Array<string \| RecordedHotkey>` | `[]` | 拒否する組み合わせ |
| `allowedModifiers` | `ModKey[]` | `["Ctrl", "Alt", "Shift", "Meta"]` | 許可する修飾キー |
| `requireModifierForPrintable` | `boolean` | `false` | 文字キーにCtrl / Alt / Metaを要求 |
| `allowUnmodifiedNonPrintable` | `boolean` | `true` | F1などの非文字キーを修飾キーなしで許可 |
| `startOnFocus` | `boolean` | `true` | focusで記録開始 |
| `startOnClick` | `boolean` | `true` | clickで記録開始 |
| `startOnEnter` | `boolean` | `true` | 待機中に修飾キーなしのEnterで記録開始 |
| `confirmOnCapture` | `boolean` | `true` | 有効な入力を得た時点で確定 |
| `confirmOnBlur` | `boolean` | `true` | blur時に候補があれば確定。`false`なら取消 |
| `cancelOnEscape` | `boolean` | `true` | 記録中に修飾キーなしのEscapeで取消 |
| `clearKeys` | `string[]` | `["Backspace", "Delete"]` | 修飾キーなしで押したときに値を削除するキー。空配列で無効化 |
| `placeholder` | `string` | `undefined` | 入力欄のplaceholder |
| `formatOptions` | `UseHotkeyFormatterOptions` | `undefined` | OSなどの表示設定 |

設定はcomposable作成時に読み取ります。
`initial`の更新やオプションの切り替えを反映する場合は、composableを作り直してください。

#### コールバック

すべて省略可能です。

| オプション | 型 | 呼び出し条件 |
| --- | --- | --- |
| `onStart` | `() => void` | 記録開始時 |
| `onConfirm` | `(value: RecordedHotkey) => void` | 候補を確定したとき。確定値の複製を受け取る |
| `onCancel` | `() => void` | 記録状態、候補、プレビュー、エラーのいずれかを取り消したとき |
| `onClear` | `() => void` | 確定済みの値を削除したとき |
| `onError` | `(error: HotkeyRecordError) => void` | 記録を開始できない、または入力条件を満たさないとき |

#### 戻り値

| プロパティ | 型 | 説明 |
| --- | --- | --- |
| `value` | `Ref<RecordedHotkey \| null>` | 確定済みの値 |
| `candidate` | `Ref<RecordedHotkey \| null>` | 確定前の候補。自動確定後は`null` |
| `preview` | `Ref<HotkeyPreview \| null>` | 修飾キーだけを押している途中状態 |
| `error` | `Ref<HotkeyRecordError \| null>` | 記録エラー |
| `isRecording` | `Ref<boolean>` | 記録中かどうか |
| `displayValue` | `ComputedRef<string>` | 候補、プレビュー、確定値の順で選んだ表示文字列 |
| `inputAttrs` | `ComputedRef<UseRecordHotkeyInputAttrs>` | 入力欄へ渡す属性 |
| `start` | `() => void` | 記録を開始し、入力欄へfocus |
| `confirm` | `() => void` | 候補を確定。候補がなければ記録停止 |
| `cancel` | `() => void` | 候補と記録状態を破棄し、確定済みの値を保持 |
| `clear` | `() => void` | 確定値を`null`にし、記録状態を破棄 |
| `reset` | `() => void` | 記録状態を破棄し、確定値を作成時の`initial`へ戻す |

`inputAttrs`は`value`、`readonly: true`、`autocomplete: "off"`、`spellcheck: false`、`placeholder`を含みます。
エラー時は`aria-invalid: "true"`も付与します。
`reset()`は`onConfirm`、`onCancel`、`onClear`を呼び出しません。

### `useHotkeyRecorder(options?)`

入力欄以外の要素や`window`で記録するための低レベルAPIです。
確定値の管理やEscapeによる取消などの入力欄向け操作は、`useRecordHotkey()`が担当します。

```ts
import { useHotkeyRecorder } from "v-record-hotkey";

// コンポーネントのsetup内で呼び出します。
const { isRecording, candidate, preview, error, start, stop, reset } = useHotkeyRecorder({
  onCapture(shortcut) {
    console.log("記録したショートカット", shortcut);
  },
});
```

`start()`を呼ぶまで記録しません。
既定では最初の有効な組み合わせを`candidate`へ記録して停止し、`stop()`は候補を保持、`reset()`は候補も削除します。
コンポーネントのスコープを破棄するとリスナーを解除します。

`disallow`、`allowedModifiers`、`requireModifierForPrintable`、`allowUnmodifiedNonPrintable`、`onStart`、`onError`は`useRecordHotkey()`と共通です。
追加のオプションは次のとおりです。

| オプション | 型 | 既定値 | 説明 |
| --- | --- | --- | --- |
| `target` | `MaybeRefOrGetter<EventTarget \| null \| undefined>` | `window` | 記録対象。ブラウザ外では`null` |
| `enabled` | `MaybeRefOrGetter<boolean>` | `true` | 記録の有効状態。`false`になると記録停止 |
| `ignoreComposition` | `boolean` | `true` | IME変換中のイベントを無視 |
| `ignoreInEditable` | `boolean` | `true` | 編集可能なinput / textarea / contenteditable内の入力を無視 |
| `eventFilter` | `(event: KeyboardEvent) => boolean` | `() => true` | `false`を返すイベントを無視 |
| `preventDefault` | `boolean \| ((event: KeyboardEvent) => boolean)` | `true` | 記録対象のイベントの既定動作を抑制 |
| `stopPropagation` | `boolean \| ((event: KeyboardEvent) => boolean)` | `false` | 記録対象のイベントの伝播を停止 |
| `captureStopsRecording` | `boolean` | `true` | 有効な組み合わせを記録したら停止 |
| `onPreview` | `(current: HotkeyPreview \| null) => void` | `undefined` | 修飾キープレビューの更新を通知 |
| `onCapture` | `(result: RecordedHotkey) => void` | `undefined` | 記録結果の複製を通知 |

`target`と`enabled`はrefまたはgetterでも指定できます。
`target`は`start()`時に評価するため、記録中に対象を変更する場合は`stop()`してから`start()`し直してください。
戻り値は`isRecording`、`candidate`、`preview`、`error`のrefと、`start`、`stop`、`reset`です。

### `useHotkeyFormatter(options?)`

`{ format }`を返します。
`format(hotkey: RecordedHotkey | HotkeyPreview): string`で表示文字列を作ります。

| オプション | 型 | 既定値 | 説明 |
| --- | --- | --- | --- |
| `os` | `"auto" \| "mac" \| "win"` | `"auto"` | OSを自動判定、または明示。Windows/Linuxは`"win"` |
| `showShiftImplicit` | `boolean` | `false` | Shiftで変わる記号を補記。例：`Shift + 1 ( ! )` |

### `matchHotkey(event, target, options?)`

`KeyboardEvent`と`RecordedHotkey`が一致するかを返す関数です。
イベントリスナーの登録やコマンドの実行はアプリ側で行います。

```ts
import { matchHotkey, type RecordedHotkey } from "v-record-hotkey";

function handleShortcut(event: KeyboardEvent, shortcut: RecordedHotkey) {
  if (event.repeat || event.isComposing || event.key === "Process") return;

  if (matchHotkey(event, shortcut)) {
    event.preventDefault();
    console.log("ショートカットが一致しました");
  }
}
```

登録したリスナーは、コンポーネントの破棄時に解除してください。
入力欄や記録中のイベントを実行対象にするかも、アプリ側で判断します。

| オプション | 型 | 既定値 | 説明 |
| --- | --- | --- | --- |
| `compareKey` | `boolean` | `false` | `code`と修飾キーに加え、`key`も大文字小文字を区別せず比較 |
| `compareLocation` | `boolean` | `false` | `code`と修飾キーに加え、`location`も比較 |

既定では`code`と修飾キーの集合が一致した場合に`true`を返します。
修飾キーが余分に押されている場合は一致しません。

### データ型とエラー

```ts
type ModKey = "Ctrl" | "Alt" | "Shift" | "Meta";

interface RecordedHotkey {
  code: string;
  key: string;
  modifiers: ModKey[];
  location: number;
}

interface HotkeyPreview {
  code: string | null;
  key: string | null;
  modifiers: ModKey[];
}
```

`code`は物理的なキー位置（例：`"KeyK"`）、`key`は配列や修飾キーを反映した入力文字（例：`"k"`）です。
`location`は`KeyboardEvent.location`の値です。
formatterは主に`code`からラベルを作り、修飾キーだけのプレビューでは`code`と`key`が`null`になります。

`error`と`onError`は`{ code, message }`形式の`HotkeyRecordError`を返します。

| `code` | 原因 |
| --- | --- |
| `invalid-target` | 開始時に有効なイベント対象がない。入力要素のmount前など |
| `disabled` | `useHotkeyRecorder()`の`enabled`が`false`の状態で開始 |
| `modifier-not-allowed` | `allowedModifiers`に含まれない修飾キーを入力 |
| `missing-modifier` | 必須の修飾キーが不足 |
| `disallowed` | `disallow`に該当する組み合わせを入力 |

型はすべてパッケージから`import type`できます。

## 制約と注意点

- 対応するのは単一のキーコンビネーションです。`Ctrl + K`の後に`Ctrl + C`を押すような複数ストロークのシーケンスと、タイムアウト確定は未実装です。
- OSやブラウザが先に処理するショートカットは、ページ側で受信できない場合があります。
- 修飾キーだけでは確定しません。`preview`として扱います。
- `useRecordHotkey()`のEscape、Backspace、Deleteは既定で操作用です。記録対象にする場合は、`cancelOnEscape: false`や`clearKeys: []`を指定してください。
- 記録とキー照合はブラウザの`KeyboardEvent`を使います。SSR中には記録を開始せず、対象要素がmountされた後に開始してください。

## ローカルデモ

Node.js 24.22.1とpnpm 11.10.0を使用します。
リポジトリをcloneし、ルートで実行してください。

```bash
pnpm install --frozen-lockfile
pnpm run demo
```

ターミナルに表示されるURL（通常は`http://127.0.0.1:5173/`）を開きます。
終了するには`Ctrl+C`を押してください。

デモでは次の機能を確認できます。

- 基本入力、手動確定、修飾キー必須の設定切り替え
- 確定値、候補、修飾キープレビュー、エラーの表示
- Windows/LinuxとmacOSの表示比較
- `Details`内での`matchHotkey()`による照合、JSONの返り値、設定、操作履歴の確認

モードを切り替えると、入力値と履歴がリセットされます。
キー入力には物理キーボードを使用してください。

## ライセンス

MIT
