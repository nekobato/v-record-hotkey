前提から申しますと、`v-record-hotkey` は

> 「**1 回分のショートカット入力を “録画” して、`code + modifiers` などの構造化データとして返す Hooks ライブラリ**」

という立ち位置にすると整理がよろしいですわ。

---

## 1. 基本コンセプト

- **対象**: Vue 3 Composition API（`useXxx` な composable）

- **責務**:

  1. `keydown` をフックして「ショートカット 1 発」を録画
  2. IME・入力要素・予約ショートカットを安全に除外
  3. 結果を **`code + modifiers` ベースの構造体**として返す
  4. UI（ボタン・入力欄）は一切持たない

- **ショートカットモデル例**:

```ts
export type ModKey = "Ctrl" | "Alt" | "Shift" | "Meta";

export interface RecordedHotkey {
  code: string; // e.code (例: "KeyK", "Semicolon", "Digit1")
  mods: ModKey[]; // ["Ctrl", "Shift"] など
  location: number; // KeyboardEvent.location
  // オプション
  key?: string; // e.key (例: "k", ":" など)
}
```

---

## 2. コア composable：`useRecordHotkey`

### シグネチャ

```ts
function useRecordHotkey(
  options?: UseRecordHotkeyOptions
): UseRecordHotkeyReturn;
```

### options（＝このライブラリで言う「props」）

```ts
export interface UseRecordHotkeyOptions {
  /** どこで keydown を聴くか（既定: window） */
  target?: EventTarget | (() => EventTarget | null);

  /** 記録モード：codeベース/文字ベース/両方 */
  mode?: "code" | "key" | "both"; // 既定: "code"

  /** IME中のイベントを無視するか（isComposing, key==="Process"） */
  ignoreComposition?: boolean; // 既定: true

  /** input/textarea/contenteditable 内で無効にするか */
  ignoreInEditable?: boolean; // 既定: true

  /**
   * 上記 ignoreInEditable をもう少し柔らかくしたい場合のフィルタ。
   * true を返したイベントだけ録画対象にする。
   */
  eventFilter?: (e: KeyboardEvent) => boolean;

  /** 一度記録したら自動で録画を止めるか */
  once?: boolean; // 既定: true

  /** false のときは内部リスナを張らない（外部で start/stop を制御） */
  enabled?: boolean; // 既定: true

  /** 記録中に preventDefault するか（or 条件関数） */
  preventDefault?: boolean | ((e: KeyboardEvent) => boolean); // 既定: true

  /** stopPropagation するか */
  stopPropagation?: boolean | ((e: KeyboardEvent) => boolean); // 既定: false

  /** 許可する修飾キーの種類 */
  allowedModifiers?: ModKey[]; // 既定: ["Ctrl","Alt","Shift","Meta"]

  /** 禁止する組み合わせ（"Ctrl+S" などブラウザ/OS既定） */
  disallow?: string[]; // 例: ["Ctrl+S","Meta+Q"]

  /**
   * マルチストローク対応: true なら「Ctrl+K → C」のような
   * シーケンスを録画（配列）／数値なら最大ストローク数。
   */
  multiStroke?: boolean | number; // 既定: false

  /** 録画タイムアウト（ms）。multiStroke時に有効。null なら無制限。 */
  timeoutMs?: number | null; // 既定: 3000

  /** 初期値（既存のショートカットを表示用に返す目的） */
  initial?: RecordedHotkey | RecordedHotkey[] | null;

  /** 記録開始時フック */
  onStart?: () => void;

  /** 各ストローク更新時フック（multiStroke用） */
  onUpdate?: (current: RecordedHotkey | RecordedHotkey[]) => void;

  /** 記録終了時フック */
  onEnd?: (
    result: RecordedHotkey | RecordedHotkey[] | null,
    reason: "recorded" | "cancel" | "timeout"
  ) => void;
}
```

### 戻り値

```ts
export interface UseRecordHotkeyReturn {
  /** 現在録画中かどうか */
  isRecording: Ref<boolean>;

  /** 直近に確定したショートカット（multiStroke=false） */
  last: Ref<RecordedHotkey | null>;

  /** multiStroke時の現在シーケンス */
  sequence: Ref<RecordedHotkey[]>;

  /** タイムアウト中か／エラー情報 */
  isTimeout: Ref<boolean>;
  error: Ref<string | null>;

  /** 録画開始・停止・トグル */
  start: () => void;
  stop: () => void;
  toggle: () => void;

  /** 内部状態をクリア（last/sequence/error） */
  reset: () => void;
}
```

---

## 3. 補助 composable（v1 から用意しておくと便利）

### 3-1. 表示用：`useHotkeyFormatter`

ショートカットの表記ルールは各プロジェクトで悩ましいので、**デフォルト実装をヘルパとして提供**しておくと親切ですわ。

```ts
interface UseHotkeyFormatterOptions {
  os?: "auto" | "mac" | "win"; // 既定: auto判定
  showShiftImplicit?: boolean; // "Shift + ; ( : )" のような併記ルール
}

function useHotkeyFormatter(options?: UseHotkeyFormatterOptions) {
  function format(h: RecordedHotkey | RecordedHotkey[]): string;
  return { format };
}
```

- mac のとき: `⌘` / `⌥` / `⇧` / `⌃` ベース
- Win/Linux のとき: `Ctrl + Alt + Shift + ...`
- `Semicolon` + `Shift` の場合は **`Shift + ; ( : )`** など。

### 3-2. マッチング用：`matchHotkey`

保存したショートカットを実際の `KeyboardEvent` と突き合わせる Helper。

```ts
function matchHotkey(e: KeyboardEvent, target: RecordedHotkey): boolean;
```

これがあると、

- 「録画 UI」 → `RecordedHotkey` を保存
- 「実行側」 → `matchHotkey(event, shortcut)` で判定

という責務分離ができ、ライブラリの使い勝手が向上いたしますわ。

---

## 4. 典型的な利用イメージ

```ts
// v-record-hotkey の利用側（Vue3コンポーネント）
import { useRecordHotkey, useHotkeyFormatter } from "v-record-hotkey";

const { isRecording, last, start } = useRecordHotkey({
  mode: "code",
  once: true,
  disallow: ["Meta+Q", "Ctrl+S"],
  onEnd(result, reason) {
    if (reason === "recorded" && result) {
      saveToStore(result); // code+mods を状態管理などへ
    }
  }
});

const { format } = useHotkeyFormatter({ os: "auto" });
const label = computed(() =>
  last.value ? format(last.value) : "ショートカット未設定"
);
```

UI 側は自由に：

- ボタン：「録画開始」→ `start()`
- ラベル：`label` を `<kbd>` で装飾

という形で組めますわ。

---

## 5. v1 で必ず押さえたい「基本機能」まとめ

1. **録画**

   - 1 ショートカット／オプションでマルチストローク
   - `KeyboardEvent.code + modifiers` 基準で保存

2. **安全性**

   - IME (`isComposing`, `"Process"`) 無視
   - `input/textarea/contenteditable` 内での無効化
   - OS/ブラウザ予約ショートカットの blacklist

3. **API**

   - composable: `useRecordHotkey(options?)`
   - 状態: `isRecording`, `last`, `sequence`, `error`
   - 制御: `start`, `stop`, `toggle`, `reset`
   - コールバック: `onStart`, `onUpdate`, `onEnd`

4. **補助**

   - `useHotkeyFormatter`（OS 別ラベル整形）
   - `matchHotkey`（実行側の判定）

このあたりまでを v1 として切っておくと、後から

- `navigator.keyboard.getLayoutMap()` 対応
- 設定のシリアライズ／デシリアライズ helper

などを拡張しやすくなりますわ。
