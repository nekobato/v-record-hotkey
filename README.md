# v-record-hotkey

Vue 3 Composition APIでショートカット入力欄を作るライブラリです。
`useRecordHotkey(inputRef, options)`で、キーの記録、表示、確定、取消、削除をまとめて扱います。

現在は単一のキーコンビネーションに対応しています。
複数ストロークのシーケンスやタイムアウト確定は実装されていません。

## ローカルデモ

Node.js 24とpnpm 11.10.0で動作確認しています。
リポジトリのルートで実行してください。

```bash
pnpm install --frozen-lockfile
pnpm run demo
```

ターミナルに表示されるURL（通常は `http://127.0.0.1:5173/`）を開きます。
終了するには `Ctrl+C` を押してください。

デモには次の機能があります。

- 基本入力、手動確定、修飾キー必須の設定切り替え
- 確定値、候補、修飾キープレビュー、エラーの表示
- Windows/LinuxとmacOSの表示比較
- `Details`内での`matchHotkey`による記録済みキーの照合
- `Details`内でのJSONの返り値、設定、操作履歴の確認

設定の切り替え時にはcomposableを作り直し、入力値と履歴を初期化します。
キー入力には物理キーボードを使用してください。

静的な配布物のビルドと確認は次のコマンドで行います。

```bash
pnpm run demo:build
pnpm run demo:preview
```

出力先は `example/dist/` です。
HTMLとJavaScript、CSSのみで動き、バックエンドは不要です。
Viteの `base: "./"` を指定しているため、GitHub Pagesのリポジトリ配下などにも配置できます。

### 将来のGitHub Pages公開

`.github/workflows/demo-pages.yml`は手動実行専用です。
pushによる自動公開は行いません。

公開する際は、リポジトリがPagesを利用できる状態になってから、次の手順で操作します。

1. workflowをデフォルトブランチに反映する。
2. GitHubの `Settings > Pages > Build and deployment > Source` を `GitHub Actions` にする。
3. `Actions > Publish demo to GitHub Pages > Run workflow` を実行する。

workflowはデモだけをビルドして公開します。
npmパッケージの公開は別の作業です。

## インストール

npmへの初回公開は準備中です。
公開後は次のコマンドでインストールできます。
現在の `peerDependencies` はVue `3.5.24`を指定しています。

```bash
pnpm add v-record-hotkey vue@3.5.24
```

## クイックスタート

```ts
import { ref } from "vue";
import { useRecordHotkey } from "v-record-hotkey";

const shortcutRef = ref<HTMLInputElement | null>(null);
const { inputAttrs, value, isRecording, start, cancel, clear } = useRecordHotkey(shortcutRef, {
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

## 標準の動作

- focus、click、idle状態のEnterで記録を開始します。
- `A`、`F1`、`Ctrl + K`、`Shift + A`などの入力を記録し、即座に確定します。
- 修飾キーだけを押した場合は `preview` を更新します。修飾キーだけでは確定しません。
- 修飾キーなしのEscapeで取消し、確定済みの値を保持します。
- 修飾キーなしのBackspace / Deleteで値を削除します。
- blur時に候補があれば確定し、候補がなければ取消します。
- IME変換中の記録とキーのauto-repeatを無視します。
- 固定の禁止リストは持ちません。`disallow`に指定した組み合わせだけを拒否します。

OSやブラウザが先に処理するショートカットは、ページ側で受信できない場合があります。

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
| `initial` | `null` | 初期ショートカット |
| `disallow` | `[]` | 拒否する文字列または `RecordedHotkey` の配列 |
| `allowedModifiers` | `Ctrl/Alt/Shift/Meta` | 許可する修飾キー |
| `requireModifierForPrintable` | `false` | 文字キーにCtrl / Alt / Metaを要求 |
| `allowUnmodifiedNonPrintable` | `true` | F1などの非文字キーを単独で許可 |
| `startOnFocus` / `startOnClick` / `startOnEnter` | `true` | 記録の開始条件 |
| `confirmOnCapture` | `true` | 有効な入力を得た時点で確定 |
| `confirmOnBlur` | `true` | blur時に候補があれば確定 |
| `cancelOnEscape` | `true` | Escapeで取消 |
| `clearKeys` | `["Backspace", "Delete"]` | 値を削除するキー |
| `placeholder` | - | 入力欄のplaceholder |
| `formatOptions` | - | 表示設定 |
| `onStart` / `onConfirm` / `onCancel` / `onClear` / `onError` | - | 操作に応じたコールバック |

optionsはcomposable作成時に読み取ります。
作成後の設定変更を反映する場合はcomposableを作り直してください。
input refはVueのref、getter、要素を受け取れます。

### 戻り値

| プロパティ | 説明 |
| --- | --- |
| `value` | 確定済みのショートカット |
| `candidate` | 記録中の候補 |
| `preview` | 修飾キーだけを押している途中状態 |
| `error` | `{ code, message }` のエラー情報 |
| `isRecording` | 記録中かどうか |
| `displayValue` | 入力欄に表示する文字列 |
| `inputAttrs` | `v-bind`用の属性。value、readonly、autocomplete、spellcheck、placeholder、aria-invalidを含む |
| `start` / `confirm` / `cancel` / `clear` / `reset` | 制御メソッド。resetは初期値へ戻す |

## 低レベルAPIと補助API

`useHotkeyRecorder(options)`は任意の `target` に記録エンジンを接続します。
既定のtargetはwindowです。
編集可能なinput / textarea / contenteditable内の入力は既定で無視します。
`target`と `enabled` はrefまたはgetterでも指定できます。

```ts
interface RecordedHotkey {
  code: string;
  key: string;
  modifiers: ("Ctrl" | "Alt" | "Shift" | "Meta")[];
  location: number;
}
```

`code`は物理的なキー位置に基づく照合に使います。
`key`はキーボード配列や修飾キーによって変わる入力文字を保持します。
formatterは主にcodeを使ってラベルを作ります。

```ts
const { format } = useHotkeyFormatter({ os: "mac", showShiftImplicit: false });
const isMatch = matchHotkey(event, recorded, { compareKey: false, compareLocation: false });
```

formatterの `os` は `"auto" | "mac" | "win"` を指定できます。
既定のautoはOSを判定し、Windows/Linuxでは `Ctrl + Shift + K`、macOSでは `⌃⇧K` のように表示します。
previewもformatに渡せます。

matcherは既定でcodeとmodifiersを比較します。
必要に応じてkeyとlocationも比較できます。

## 開発

pnpmで管理しています。
`package.json`の `packageManager` にpnpmのバージョンを固定しています。
本体と `example/` はworkspaceとして管理し、ルートの `pnpm-lock.yaml` を共有します。
依存のインストールはリポジトリのルートで一度だけ行ってください。

```bash
pnpm install --frozen-lockfile
pnpm run test
pnpm run lint
pnpm run format
pnpm run typecheck
pnpm run build
```

`pnpm run format`はファイルを書き換えます。
ライブラリ本体は `dist/` へESM、CommonJS、型定義を出力します。

## ライセンス

`package.json`のlicenseはMITです。
LICENSEファイルの追加は公開前の残作業です。
