# v-record-hotkey

English | [日本語](README.ja.md)

Vue 3 composables for keyboard shortcut settings.
Pass an input element ref to `useRecordHotkey()` to handle recording, display, confirmation, cancellation, and clearing.
You provide the input markup and styles, so it fits into your existing forms.

- Record a single key combination, such as `A`, `F1`, or `Ctrl + K`
- Preview modifier keys, confirm automatically or manually, and disallow specific shortcuts
- Format shortcuts for Windows/Linux and macOS
- Store shortcuts as `RecordedHotkey` and match them against `KeyboardEvent`

[Try the demo](https://nekobato.github.io/v-record-hotkey/)

## Contents

- [Installation](#installation)
- [Quick start](#quick-start)
- [Default input behavior](#default-input-behavior)
- [Examples](#examples)
- [API reference](#api-reference)
- [Limitations and notes](#limitations-and-notes)
- [License](#license)

## Installation

The package has not been published to npm yet.
You can try it in the [demo](https://nekobato.github.io/v-record-hotkey/).
Once it is published, install it with:

```bash
pnpm add v-record-hotkey vue@3.5.24
```

```bash
npm install v-record-hotkey vue@3.5.24
```

Vue `3.5.24` is required.
The examples below use `<script setup lang="ts">` in Vue Single-File Components (SFCs).
Import the composables directly; no `app.use()` registration is needed.

## Quick start

Add the following to a Vue component.
Click the input and press a shortcut such as `Ctrl + K` to confirm it.

```vue
<script setup lang="ts">
import { useTemplateRef } from "vue";
import { useRecordHotkey } from "v-record-hotkey";

const inputRef = useTemplateRef<HTMLInputElement>("shortcutInput");
const { inputAttrs, value, isRecording, error, clear } = useRecordHotkey(inputRef, {
  placeholder: "Click and press a key",
});
</script>

<template>
  <label for="shortcut">Shortcut</label>
  <input
    id="shortcut"
    ref="shortcutInput"
    v-bind="inputAttrs"
    aria-describedby="shortcut-help shortcut-error"
  />
  <p id="shortcut-help">Press Escape to cancel or Backspace / Delete to clear.</p>
  <p role="status">{{ isRecording ? "Press a key" : "Ready to record" }}</p>
  <p id="shortcut-error" role="alert">{{ error?.message }}</p>
  <button type="button" :disabled="!value" @click="clear">Clear</button>
</template>
```

`inputAttrs` includes the display `value`, `readonly`, and other input attributes.
Bind it with `v-bind="inputAttrs"` and read the confirmed shortcut from `value`.
Use `value.value` in scripts and `value` in templates.
Provide your own labels, help text, error messages, and styles.

## Default input behavior

With the default options:

| Action | Result |
| --- | --- |
| Focus or click the input, or press Enter without modifiers while idle | Start recording |
| Press `A`, `F1`, `Ctrl + K`, `Shift + A`, or another valid combination | Confirm immediately |
| Press only Ctrl / Alt / Shift / Meta | Update `preview` and keep recording |
| Press Escape without modifiers while recording | Cancel recording and keep the confirmed value |
| Press Backspace / Delete without modifiers | Clear the confirmed value and the current candidate |
| Blur the input while recording | Confirm if there is a candidate; otherwise cancel |
| Enter keys during IME composition, or hold a key to trigger auto-repeat | Ignore the events |

## Examples

### Confirm manually

Set `confirmOnCapture: false` to keep the captured combination in `candidate`.
Call `confirm()` to copy it to `value`, or `cancel()` to discard the candidate while keeping the confirmed value.

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
  <label for="manual-shortcut">Shortcut</label>
  <input id="manual-shortcut" ref="shortcutInput" v-bind="inputAttrs" />
  <button type="button" :disabled="!candidate" @pointerdown.prevent @click="confirm">Confirm</button>
  <button type="button" :disabled="!isRecording" @pointerdown.prevent @click="cancel">Cancel</button>
  <pre>{{ value }}</pre>
</template>
```

The buttons use `@pointerdown.prevent` to keep the input from losing focus before the click.
With the default `confirmOnBlur: true`, moving focus away from the input also confirms the candidate.
Set `confirmOnBlur: false` to cancel recording on blur instead.

### Configure input rules and callbacks

Replace the options passed to `useRecordHotkey()` in the quick start with:

```ts
const { inputAttrs, value, isRecording, error, clear } = useRecordHotkey(inputRef, {
  allowedModifiers: ["Ctrl", "Shift", "Meta"],
  requireModifierForPrintable: true,
  disallow: ["Ctrl+S", "Meta+Q"],
  onConfirm(shortcut) {
    console.log("Confirmed shortcut", shortcut);
  },
  onClear() {
    console.log("Shortcut cleared");
  },
  onError(error) {
    console.error(error.code, error.message);
  },
});
```

This configuration requires Ctrl, Alt, or Meta for printable keys; Shift alone is not enough.
Because Alt is excluded from `allowedModifiers`, printable keys in this example require Ctrl or Meta.
To require modifiers for non-printable keys such as F1 as well, add `allowUnmodifiedNonPrintable: false`.
The default `disallow` value is an empty array; the library has no built-in list of forbidden shortcuts.

### Format a recorded shortcut for each OS

Use `RecordedHotkey` for storage and `useHotkeyFormatter()` to produce a display string.

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

`format()` accepts both confirmed values and `HotkeyPreview`.
The resulting string is for display.
Use the original `RecordedHotkey` when matching keyboard events.

## API reference

| API | Purpose |
| --- | --- |
| `useRecordHotkey()` | Record, display, confirm, cancel, and clear shortcuts in an input / textarea |
| `useHotkeyRecorder()` | Record keys on any `EventTarget` |
| `useHotkeyFormatter()` | Format recorded shortcuts and previews |
| `matchHotkey()` | Match a `KeyboardEvent` against a recorded shortcut |

### `useRecordHotkey(inputRef, options?)`

```ts
function useRecordHotkey(
  inputRef: MaybeRefOrGetter<HTMLInputElement | HTMLTextAreaElement | null | undefined>,
  options?: UseRecordHotkeyOptions,
): UseRecordHotkeyReturn;
```

`inputRef` accepts an input element, a Vue ref, or a getter that returns the element.
When called inside a component's `setup`, event listeners are removed when the scope is disposed.

#### Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `initial` | `RecordedHotkey \| null` | `null` | Initial value; cloned on creation and restored by `reset()` |
| `disallow` | `Array<string \| RecordedHotkey>` | `[]` | Combinations to reject |
| `allowedModifiers` | `ModKey[]` | `["Ctrl", "Alt", "Shift", "Meta"]` | Allowed modifier keys |
| `requireModifierForPrintable` | `boolean` | `false` | Require Ctrl / Alt / Meta for printable keys |
| `allowUnmodifiedNonPrintable` | `boolean` | `true` | Allow non-printable keys such as F1 without modifiers |
| `startOnFocus` | `boolean` | `true` | Start recording on focus |
| `startOnClick` | `boolean` | `true` | Start recording on click |
| `startOnEnter` | `boolean` | `true` | Start recording on Enter without modifiers while idle |
| `confirmOnCapture` | `boolean` | `true` | Confirm as soon as a valid combination is captured |
| `confirmOnBlur` | `boolean` | `true` | Confirm the candidate on blur; cancel if `false` |
| `cancelOnEscape` | `boolean` | `true` | Cancel on Escape without modifiers while recording |
| `clearKeys` | `string[]` | `["Backspace", "Delete"]` | Keys that clear the value when pressed without modifiers; an empty array disables this |
| `placeholder` | `string` | `undefined` | Input placeholder |
| `formatOptions` | `UseHotkeyFormatterOptions` | `undefined` | Display options such as the OS |

Options are read when the composable is created.
Recreate the composable to apply a new `initial` value or different options.

#### Callbacks

All callbacks are optional.

| Option | Type | Called when |
| --- | --- | --- |
| `onStart` | `() => void` | Recording starts |
| `onConfirm` | `(value: RecordedHotkey) => void` | A candidate is confirmed; receives a clone of the confirmed value |
| `onCancel` | `() => void` | Recording, a candidate, a preview, or an error is canceled |
| `onClear` | `() => void` | A confirmed value is cleared |
| `onError` | `(error: HotkeyRecordError) => void` | Recording cannot start or input does not meet the configured rules |

#### Return value

| Property | Type | Description |
| --- | --- | --- |
| `value` | `Ref<RecordedHotkey \| null>` | Confirmed value |
| `candidate` | `Ref<RecordedHotkey \| null>` | Candidate awaiting confirmation; `null` after automatic confirmation |
| `preview` | `Ref<HotkeyPreview \| null>` | Intermediate state while only modifier keys are pressed |
| `error` | `Ref<HotkeyRecordError \| null>` | Recording error |
| `isRecording` | `Ref<boolean>` | Whether recording is active |
| `displayValue` | `ComputedRef<string>` | Display string, using the candidate, preview, or confirmed value in that order |
| `inputAttrs` | `ComputedRef<UseRecordHotkeyInputAttrs>` | Attributes to bind to the input |
| `start` | `() => void` | Start recording and focus the input |
| `confirm` | `() => void` | Confirm the candidate; stop recording if there is no candidate |
| `cancel` | `() => void` | Discard the candidate and recording state, keeping the confirmed value |
| `clear` | `() => void` | Set the confirmed value to `null` and discard the recording state |
| `reset` | `() => void` | Discard the recording state and restore the original `initial` value |

`inputAttrs` includes `value`, `readonly: true`, `autocomplete: "off"`, `spellcheck: false`, and `placeholder`.
When there is an error, it also includes `aria-invalid: "true"`.
`reset()` does not call `onConfirm`, `onCancel`, or `onClear`.

### `useHotkeyRecorder(options?)`

A lower-level API for recording keys on elements other than inputs, or on `window`.
`useRecordHotkey()` handles confirmed values and input-specific actions such as cancellation with Escape.

```ts
import { useHotkeyRecorder } from "v-record-hotkey";

// Call inside a component's setup.
const { isRecording, candidate, preview, error, start, stop, reset } = useHotkeyRecorder({
  onCapture(shortcut) {
    console.log("Recorded shortcut", shortcut);
  },
});
```

Recording does not begin until `start()` is called.
By default, the first valid combination is stored in `candidate` and recording stops.
`stop()` keeps the candidate; `reset()` clears it.
Listeners are removed when the component's scope is disposed.

`disallow`, `allowedModifiers`, `requireModifierForPrintable`, `allowUnmodifiedNonPrintable`, `onStart`, and `onError` are shared with `useRecordHotkey()`.
Additional options:

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `target` | `MaybeRefOrGetter<EventTarget \| null \| undefined>` | `window` | Recording target; `null` outside the browser |
| `enabled` | `MaybeRefOrGetter<boolean>` | `true` | Whether recording is enabled; recording stops when it becomes `false` |
| `ignoreComposition` | `boolean` | `true` | Ignore events during IME composition |
| `ignoreInEditable` | `boolean` | `true` | Ignore input inside editable input / textarea / contenteditable elements |
| `eventFilter` | `(event: KeyboardEvent) => boolean` | `() => true` | Ignore events when this returns `false` |
| `preventDefault` | `boolean \| ((event: KeyboardEvent) => boolean)` | `true` | Prevent the default action of recorded events |
| `stopPropagation` | `boolean \| ((event: KeyboardEvent) => boolean)` | `false` | Stop propagation of recorded events |
| `captureStopsRecording` | `boolean` | `true` | Stop recording after capturing a valid combination |
| `onPreview` | `(current: HotkeyPreview \| null) => void` | `undefined` | Notify when the modifier preview changes |
| `onCapture` | `(result: RecordedHotkey) => void` | `undefined` | Notify with a clone of the captured shortcut |

`target` and `enabled` also accept refs or getters.
`target` is evaluated when `start()` is called.
To change the target while recording, call `stop()` and then `start()` again.
Returns the `isRecording`, `candidate`, `preview`, and `error` refs, plus `start`, `stop`, and `reset`.

### `useHotkeyFormatter(options?)`

Returns `{ format }`.
Call `format(hotkey: RecordedHotkey | HotkeyPreview): string` to produce a display string.

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `os` | `"auto" \| "mac" \| "win"` | `"auto"` | Detect the OS automatically or set it explicitly; use `"win"` for Windows/Linux |
| `showShiftImplicit` | `boolean` | `false` | Include the symbol produced with Shift, for example `Shift + 1 ( ! )` |

### `matchHotkey(event, target, options?)`

Returns whether a `KeyboardEvent` matches a `RecordedHotkey`.
Your application registers event listeners and runs commands.

```ts
import { matchHotkey, type RecordedHotkey } from "v-record-hotkey";

function handleShortcut(event: KeyboardEvent, shortcut: RecordedHotkey) {
  if (event.repeat || event.isComposing || event.key === "Process") return;

  if (matchHotkey(event, shortcut)) {
    event.preventDefault();
    console.log("Shortcut matched");
  }
}
```

Remove registered listeners when the component is disposed.
Your application also decides whether to run shortcuts from input fields or during recording.

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `compareKey` | `boolean` | `false` | Compare `key` case-insensitively in addition to `code` and modifiers |
| `compareLocation` | `boolean` | `false` | Compare `location` in addition to `code` and modifiers |

By default, matching requires the same `code` and the same set of modifiers.
Events with extra modifiers do not match.

### Data types and errors

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

`code` identifies the physical key position, such as `"KeyK"`.
`key` is the input character after applying the keyboard layout and modifiers, such as `"k"`.
`location` is the value of `KeyboardEvent.location`.
The formatter derives labels primarily from `code`.
For modifier-only previews, `code` and `key` are `null`.

`error` and `onError` provide a `HotkeyRecordError` in the form `{ code, message }`.

| `code` | Cause |
| --- | --- |
| `invalid-target` | No valid event target when recording starts, for example before the input is mounted |
| `disabled` | Recording is started while `useHotkeyRecorder()` has `enabled` set to `false` |
| `modifier-not-allowed` | A modifier outside `allowedModifiers` is pressed |
| `missing-modifier` | A required modifier is missing |
| `disallowed` | The combination matches an entry in `disallow` |

All types can be imported from the package with `import type`.

## Limitations and notes

- Only a single key combination is supported. Multi-stroke sequences such as `Ctrl + K` followed by `Ctrl + C` and timeout-based confirmation are not implemented.
- Shortcuts handled by the OS or browser may never reach the page.
- Modifier keys alone do not confirm a shortcut; they are exposed as `preview`.
- In `useRecordHotkey()`, Escape, Backspace, and Delete are reserved for control actions by default. To record them, set `cancelOnEscape: false` or `clearKeys: []` as appropriate.
- Recording and matching use the browser's `KeyboardEvent`. Do not start recording during SSR; wait until the target element is mounted.

## License

MIT
