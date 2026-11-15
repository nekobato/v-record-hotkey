<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { matchHotkey, useHotkeyFormatter, useRecordHotkey } from "v-record-hotkey";
import type { RecordedHotkey } from "v-record-hotkey";
import { useDemoI18n } from "../i18n";
import type { DemoMessages } from "../i18n";
import type { DemoPreset } from "../presets";

const props = defineProps<{ preset: DemoPreset }>();
const { messages } = useDemoI18n();
type DemoEvent = keyof DemoMessages["events"];
const inputRef = ref<HTMLInputElement | null>(null);
const history = ref<Array<{ id: number; type: DemoEvent; detail: string }>>([]);
let nextId = 0;
const log = (type: DemoEvent, detail = "") => {
	history.value = [{ id: ++nextId, type, detail }, ...history.value].slice(0, 5);
};
const initial: RecordedHotkey = { code: "KeyK", key: "k", modifiers: ["Ctrl"], location: 0 };
const disallow = ["Ctrl+S", "Meta+Q"];
const windows = useHotkeyFormatter({ os: "win" });
const mac = useHotkeyFormatter({ os: "mac" });
const {
	value,
	candidate,
	preview,
	error,
	isRecording,
	inputAttrs,
	start,
	confirm,
	cancel,
	clear,
	reset,
} = useRecordHotkey(inputRef, {
	...props.preset.options,
	initial,
	disallow,
	onStart: () => log("start"),
	onConfirm: (next) => log("confirm", windows.format(next)),
	onCancel: () => log("cancel"),
	onClear: () => log("clear"),
	onError: (next) => log("error", next.code),
});
const errorMessage = computed(() =>
	error.value ? messages.value.errors[error.value.code] : "",
);
const savedWindows = computed(() => (value.value ? windows.format(value.value) : "—"));
const savedMac = computed(() => (value.value ? mac.format(value.value) : "—"));
const status = computed(() => {
	if (error.value) return messages.value.status.error;
	if (isRecording.value)
		return candidate.value ? messages.value.status.candidate : messages.value.status.recording;
	return value.value ? messages.value.status.saved : messages.value.status.unset;
});
const stateJson = computed(() =>
	JSON.stringify(
		{ value: value.value, candidate: candidate.value, preview: preview.value, error: error.value },
		null,
		2,
	),
);
const optionsJson = computed(() =>
	JSON.stringify({ ...props.preset.options, initial, disallow }, null, 2),
);
const matches = ref(0);
const tried = ref(false);
const lastMatch = ref(false);
const tryShortcut = (event: KeyboardEvent) => {
	if (event.repeat || event.isComposing || event.key === "Process") return;
	if (["Control", "Alt", "Shift", "Meta", "Tab"].includes(event.key)) return;
	tried.value = true;
	lastMatch.value = Boolean(value.value && matchHotkey(event, value.value));
	if (lastMatch.value) {
		event.preventDefault();
		matches.value += 1;
		log("match", savedWindows.value);
	}
};
watch(value, () => {
	matches.value = 0;
	tried.value = false;
	lastMatch.value = false;
});
const restoreInitial = () => {
	reset();
	log("reset", windows.format(initial));
};
</script>

<template>
	<div class="recorder">
		<div class="field-head">
			<label for="shortcut-input">{{ messages.recorder.label }}</label>
			<span class="status" :class="{ 'is-recording': isRecording, 'has-error': error }" role="status">{{ status }}</span>
		</div>
		<input id="shortcut-input" ref="inputRef" class="shortcut" v-bind="inputAttrs" :placeholder="messages.recorder.placeholder" aria-describedby="shortcut-help shortcut-error" />
		<p id="shortcut-help" class="hint">{{ messages.presets[preset.id].hint }}</p>
		<p id="shortcut-error" class="error" role="alert">{{ errorMessage }}</p>
		<div class="actions">
			<button type="button" class="primary" :disabled="isRecording" @pointerdown.prevent @click="start">{{ messages.recorder.start }}</button>
			<button v-if="preset.id === 'manual'" type="button" class="primary" :disabled="!candidate" @pointerdown.prevent @click="confirm">{{ messages.recorder.confirm }}</button>
			<button v-if="isRecording" type="button" @pointerdown.prevent @click="cancel">{{ messages.recorder.cancel }}</button>
			<button type="button" :disabled="!value && !isRecording" @pointerdown.prevent @click="clear">{{ messages.recorder.clear }}</button>
			<button type="button" class="quiet" @pointerdown.prevent @click="restoreInitial">{{ messages.recorder.reset }}</button>
		</div>
		<p class="commands"><kbd>Esc</kbd> {{ messages.recorder.cancel }} <span>·</span> <kbd>Backspace</kbd> / <kbd>Delete</kbd> {{ messages.recorder.clear }}</p>
		<section class="result" :aria-label="messages.recorder.result">
			<dl class="formats">
				<div><dt>Windows / Linux</dt><dd data-testid="saved-value">{{ savedWindows }}</dd></div>
				<div><dt>macOS</dt><dd>{{ savedMac }}</dd></div>
			</dl>
		</section>
		<details class="inspector">
			<summary>{{ messages.recorder.details }}</summary>
			<div class="inspector-grid">
				<section aria-labelledby="state-title">
					<h3 id="state-title">{{ messages.recorder.state }}</h3>
					<pre data-testid="state-json">{{ stateJson }}</pre>
				</section>
				<div>
					<section class="tester" aria-labelledby="tester-title">
						<h3 id="tester-title">matchHotkey</h3>
						<p id="test-help" class="hint">{{ messages.tester.hint }}</p>
						<div id="test-shortcut" class="test-surface" :class="{ 'is-matched': tried && lastMatch }" tabindex="0" role="group" :aria-label="messages.tester.label" aria-describedby="test-help" @keydown="tryShortcut">
							<span>{{ !value ? messages.status.unset : tried ? lastMatch ? messages.tester.matched : messages.tester.unmatched : messages.tester.prompt }}</span>
							<span class="match-count" role="status">{{ messages.tester.matches }} <strong>{{ matches }}</strong> {{ messages.tester.times }}</span>
						</div>
					</section>
					<section class="history" aria-labelledby="history-title">
						<h3 id="history-title">{{ messages.recorder.events }}</h3>
						<ol v-if="history.length" class="event-list">
							<li v-for="event in history" :key="event.id"><span>{{ messages.events[event.type] }}</span><code>{{ event.detail || "—" }}</code></li>
						</ol>
						<p v-else class="hint">—</p>
					</section>
				</div>
				<section class="options" aria-labelledby="options-title">
					<h3 id="options-title">{{ messages.recorder.options }}</h3>
					<pre>{{ optionsJson }}</pre>
				</section>
			</div>
		</details>
	</div>
</template>

<style scoped>
.recorder { min-width: 0; padding: 24px; border: 1px solid var(--border); border-radius: 8px; background: var(--surface); }
.field-head { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 12px; }
.field-head label { font-size: 0.875rem; font-weight: 600; }
.status { color: var(--muted); font-size: 0.75rem; }
.status.is-recording { color: var(--accent); }
.status.has-error { color: var(--error); }
.shortcut { width: 100%; min-height: 60px; padding: 12px 16px; border: 1px solid var(--input-border); border-radius: 6px; background: var(--surface); color: var(--text); font: 1.375rem var(--mono); cursor: pointer; }
.shortcut::placeholder { color: var(--muted); font: 0.875rem var(--sans); }
.shortcut[aria-invalid="true"] { border-color: var(--error); }
.hint { margin: 10px 0 0; color: var(--muted); font-size: 0.8125rem; line-height: 1.7; }
.error { margin: 0; min-height: 24px; color: var(--error); font-size: 0.8125rem; line-height: 1.7; }
.actions { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-top: 8px; }
button { min-height: 44px; padding: 8px 16px; border: 1px solid var(--input-border); border-radius: 6px; background: var(--surface); color: var(--text); font-size: 0.8125rem; font-weight: 500; cursor: pointer; transition: background-color 140ms, border-color 140ms; }
button:hover:not(:disabled) { background: var(--subtle); border-color: var(--accent); }
button.primary { background: var(--accent); border-color: var(--accent); color: var(--on-accent); }
button.primary:hover:not(:disabled) { background: var(--accent-hover); border-color: var(--accent-hover); }
button.quiet { margin-left: auto; border-color: transparent; color: var(--muted); }
button:disabled { opacity: 0.45; cursor: not-allowed; }
.commands { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin: 12px 0 24px; color: var(--muted); font-size: 0.75rem; }
.commands kbd { font-size: 0.6875rem; }
.commands span { margin-inline: 4px; }
.result { padding: 20px 0; border-top: 1px solid var(--border); }
.formats { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin: 0; }
.formats dt { margin-bottom: 6px; color: var(--muted); font-size: 0.75rem; }
.formats dd { margin: 0; overflow-wrap: anywhere; font: 1.125rem/1.5 var(--mono); }
.inspector { border-top: 1px solid var(--border); }
.inspector summary { min-height: 44px; padding-block: 14px 6px; color: var(--muted); font-size: 0.8125rem; cursor: pointer; }
.inspector summary:hover { color: var(--text); }
.inspector-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px; padding-top: 20px; }
.inspector-grid > * { min-width: 0; }
h3 { margin: 0 0 12px; font: 500 0.8125rem var(--mono); }
.inspector pre { margin: 0; padding: 16px; overflow: auto; border-radius: 6px; background: var(--subtle); font: 0.75rem/1.7 var(--mono); }
.tester .hint { margin-block: 0 12px; }
.test-surface { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; min-height: 64px; padding: 16px; border: 1px dashed var(--input-border); border-radius: 6px; background: var(--subtle); font-size: 0.8125rem; cursor: pointer; }
.test-surface.is-matched { border-style: solid; border-color: var(--accent); background: var(--accent-soft); }
.match-count { color: var(--muted); font-size: 0.75rem; }
.match-count strong { color: var(--accent); font: 1rem var(--mono); }
.history { margin-top: 24px; }
.event-list { margin: 0; padding: 0; list-style: none; }
.event-list li { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 8px; padding-block: 6px; font-size: 0.8125rem; }
.event-list code { color: var(--muted); font-size: 0.75rem; overflow-wrap: anywhere; }
.options { grid-column: 1 / -1; }
@media (max-width: 600px) {
	.recorder { padding: 20px; }
	.actions { gap: 6px; }
	button { padding-inline: 12px; }
	.formats { grid-template-columns: 1fr; }
	.inspector-grid { grid-template-columns: 1fr; }
}
</style>
