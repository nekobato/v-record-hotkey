<script lang="ts" setup>
import { computed, ref } from "vue";
import { type RecordedHotkey, useRecordHotkey } from "v-record-hotkey";

const shortcutRef = ref<HTMLInputElement | null>(null);
const history = ref<string[]>([]);

const initial: RecordedHotkey = {
	code: "KeyK",
	key: "k",
	modifiers: ["Ctrl"],
	location: 0,
};

const {
	value,
	candidate,
	preview,
	error,
	isRecording,
	displayValue,
	inputAttrs,
	start,
	confirm,
	cancel,
	clear,
	reset,
} = useRecordHotkey(shortcutRef, {
	initial,
	placeholder: "Click to record a shortcut",
	disallow: ["Ctrl+S", "Meta+Q"],
	onConfirm(next) {
		history.value = [
			`${new Date().toLocaleTimeString()} | confirm | ${JSON.stringify(next)}`,
			...history.value,
		].slice(0, 8);
	},
	onCancel() {
		history.value = [`${new Date().toLocaleTimeString()} | cancel`, ...history.value].slice(0, 8);
	},
	onClear() {
		history.value = [`${new Date().toLocaleTimeString()} | clear`, ...history.value].slice(0, 8);
	},
});

const savedValue = computed(() =>
	value.value ? JSON.stringify(value.value, null, 2) : "// not set",
);
const candidateValue = computed(() =>
	candidate.value ? JSON.stringify(candidate.value, null, 2) : "// no candidate",
);
const previewValue = computed(() =>
	preview.value ? JSON.stringify(preview.value, null, 2) : "// no preview",
);
</script>

<template>
  <main class="shell">
    <section class="hero card">
      <div class="hero-copy">
        <p class="eyebrow">v-record-hotkey</p>
        <h1>Input-First Hotkey Recording</h1>
        <p class="lead">
          `<input ref="shortcutRef" />` を渡すだけで、設定画面向けのショートカット入力欄として振る舞います。
        </p>
      </div>
      <div class="status-panel">
        <span class="status" :data-state="isRecording ? 'recording' : 'idle'">
          {{ isRecording ? "Recording" : "Idle" }}
        </span>
        <p class="status-copy">
          Focus / click / Enter で録画開始、Escape で取消、Backspace / Delete で削除でございます。
        </p>
      </div>
    </section>

    <section class="workspace">
      <section class="card recorder">
        <header class="section-head">
          <div>
            <p class="section-label">Shortcut Field</p>
            <h2>{{ displayValue || "(empty)" }}</h2>
          </div>
          <div class="saved-chip">
            <span>Saved</span>
            <strong>{{ displayValue || "Not set" }}</strong>
          </div>
        </header>

        <div class="capture-surface" :data-recording="isRecording">
          <label class="surface-label" for="shortcut-input">Input</label>
          <input id="shortcut-input" ref="shortcutRef" class="capture-input" v-bind="inputAttrs" />
          <span v-if="error" class="surface-error">[{{ error.code }}] {{ error.message }}</span>
        </div>

        <div class="actions">
          <button type="button" class="primary" @click="start">Record</button>
          <button type="button" class="ghost" @click="confirm" :disabled="!candidate">Confirm</button>
          <button type="button" class="ghost" @click="cancel">Cancel</button>
          <button type="button" class="ghost" @click="clear">Clear</button>
          <button type="button" class="ghost" @click="reset">Reset</button>
        </div>
      </section>

      <section class="stack">
        <section class="card notes">
          <h2>Default UX</h2>
          <ul>
            <li>`useRecordHotkey(shortcutRef, options)` が主 API でございます。</li>
            <li>単独キーも修飾キー付きも、そのまま 1 コンボとして録画できます。</li>
            <li>`disallow` は利用側で決める拒否リストで、example では `Ctrl+S` と `Meta+Q` を拒否しております。</li>
          </ul>
        </section>

        <section class="card payload">
          <h2>State</h2>
          <p class="payload-label">Saved value</p>
          <pre>{{ savedValue }}</pre>
          <p class="payload-label">Candidate</p>
          <pre>{{ candidateValue }}</pre>
          <p class="payload-label">Preview</p>
          <pre>{{ previewValue }}</pre>
        </section>
      </section>
    </section>

    <section class="card history">
      <header class="section-head compact">
        <div>
          <p class="section-label">Session Log</p>
          <h2>Recent Events</h2>
        </div>
      </header>
      <ul>
        <li v-for="entry in history" :key="entry">{{ entry }}</li>
      </ul>
    </section>
  </main>
</template>

<style scoped>
.shell {
  max-width: 1120px;
  margin: 0 auto;
  padding: 56px 20px 72px;
  display: grid;
  gap: 24px;
}

.card {
  border: 1px solid rgba(37, 49, 84, 0.12);
  border-radius: 28px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(248, 244, 236, 0.86)),
    rgba(255, 255, 255, 0.9);
  box-shadow: 0 24px 60px rgba(34, 46, 74, 0.12);
  backdrop-filter: blur(18px);
}

.hero {
  padding: 32px;
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(280px, 1fr);
  gap: 24px;
  align-items: end;
}

.eyebrow,
.section-label,
.payload-label {
  margin: 0 0 8px;
  font-size: 0.8rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #7b6d54;
}

h1,
h2,
.saved-chip strong {
  font-family: "Avenir Next", "Hiragino Mincho ProN", "Yu Mincho", serif;
}

h1 {
  margin: 0;
  font-size: clamp(2.5rem, 6vw, 4.2rem);
  line-height: 0.95;
  color: #152238;
}

.lead,
.status-copy,
li,
button,
.capture-input,
.saved-chip span {
  font-family: "Avenir Next", "Hiragino Sans", "Yu Gothic", sans-serif;
}

.lead {
  max-width: 44rem;
  margin: 16px 0 0;
  color: #42506b;
  line-height: 1.7;
}

.status-panel {
  display: grid;
  gap: 12px;
  padding: 20px;
  border-radius: 22px;
  background: rgba(247, 239, 222, 0.7);
}

.status {
  justify-self: start;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.status[data-state="idle"] {
  background: rgba(32, 84, 68, 0.12);
  color: #1f5c49;
}

.status[data-state="recording"] {
  background: rgba(172, 82, 43, 0.14);
  color: #9a4c27;
}

.status-copy {
  margin: 0;
  color: #4f5b75;
  line-height: 1.6;
}

.workspace {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(280px, 0.8fr);
  gap: 24px;
}

.recorder,
.notes,
.payload,
.history {
  padding: 28px;
}

.stack {
  display: grid;
  gap: 24px;
}

.section-head {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 24px;
}

.section-head.compact {
  margin-bottom: 12px;
}

.section-head h2 {
  margin: 0;
  font-size: clamp(1.8rem, 4vw, 2.6rem);
  color: #1d2840;
}

.saved-chip {
  min-width: 180px;
  padding: 14px 18px;
  border-radius: 18px;
  background: rgba(28, 46, 82, 0.06);
  display: grid;
  gap: 6px;
}

.saved-chip span {
  font-size: 0.75rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #6f7a91;
}

.saved-chip strong {
  font-size: 1.05rem;
  color: #1d2840;
}

.capture-surface {
  margin-top: 28px;
  padding: 24px;
  border-radius: 24px;
  background:
    radial-gradient(circle at top left, rgba(219, 190, 131, 0.28), transparent 42%),
    linear-gradient(135deg, rgba(245, 239, 228, 0.94), rgba(255, 255, 255, 0.94));
  border: 1px solid rgba(208, 186, 145, 0.42);
  display: grid;
  gap: 12px;
}

.capture-surface[data-recording="true"] {
  box-shadow: inset 0 0 0 1px rgba(163, 89, 46, 0.2), 0 18px 40px rgba(160, 86, 44, 0.1);
}

.surface-label {
  font-size: 0.8rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #866d49;
}

.capture-input {
  width: 100%;
  border: 1px solid rgba(24, 35, 59, 0.12);
  border-radius: 18px;
  padding: 16px 18px;
  font-size: 1.05rem;
  color: #16233b;
  background: rgba(255, 255, 255, 0.88);
}

.capture-input:focus {
  outline: 2px solid rgba(45, 95, 136, 0.22);
  border-color: rgba(45, 95, 136, 0.36);
}

.surface-error {
  color: #a64a2a;
  font-size: 0.95rem;
}

.actions {
  margin-top: 24px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

button {
  border: none;
  border-radius: 999px;
  padding: 12px 18px;
  font-size: 0.95rem;
  cursor: pointer;
  transition:
    transform 160ms ease,
    box-shadow 160ms ease,
    background-color 160ms ease;
}

button:hover:not(:disabled) {
  transform: translateY(-1px);
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.42;
}

.primary {
  background: linear-gradient(135deg, #1a365f, #2d5f88);
  color: #fffaf2;
  box-shadow: 0 14px 30px rgba(37, 70, 112, 0.22);
}

.ghost {
  background: rgba(24, 35, 59, 0.07);
  color: #24324f;
}

.notes ul,
.history ul {
  list-style: none;
  padding: 0;
  margin: 20px 0 0;
}

.notes li,
.history li {
  padding: 12px 0;
  border-bottom: 1px solid rgba(30, 44, 74, 0.08);
  color: #44506a;
  line-height: 1.6;
}

.payload pre {
  margin: 12px 0 0;
  padding: 18px;
  border-radius: 18px;
  background: rgba(24, 35, 59, 0.94);
  color: #eaf1ff;
  overflow: auto;
  font-family: "IBM Plex Mono", "SFMono-Regular", "Menlo", monospace;
  font-size: 0.9rem;
  line-height: 1.6;
}

.history li {
  font-family: "IBM Plex Mono", "SFMono-Regular", "Menlo", monospace;
  font-size: 0.86rem;
}

@media (max-width: 900px) {
  .hero,
  .workspace {
    grid-template-columns: 1fr;
  }

  .section-head {
    flex-direction: column;
  }

  .saved-chip {
    width: 100%;
  }
}
</style>
