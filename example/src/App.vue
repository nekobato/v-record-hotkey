<script setup lang="ts">
import { computed, ref } from "vue";
import RecorderDemo from "./components/RecorderDemo.vue";
import { presets } from "./presets";

const selected = ref("basic");
const preset = computed(() => presets.find((item) => item.id === selected.value) ?? presets[0]);
const usage = [
	'<script setup lang="ts">',
	'import { ref } from "vue";',
	'import { useRecordHotkey } from "v-record-hotkey";',
	"",
	"const inputRef = ref<HTMLInputElement | null>(null);",
	"const { value, inputAttrs } = useRecordHotkey(inputRef);",
	"</" + "script>",
	"",
	"<template>",
	'  <input ref="inputRef" v-bind="inputAttrs" />',
	"</template>",
].join("\n");
</script>

<template>
	<div class="page">
		<a class="skip-link" href="#demo">Demoへ移動</a>
		<header class="intro">
			<div class="title-row">
				<h1>v-record-hotkey</h1>
				<nav aria-label="関連リンク">
					<a href="https://github.com/nekobato/v-record-hotkey">GitHub</a>
					<a href="https://github.com/nekobato/v-record-hotkey#readme">README</a>
				</nav>
			</div>
			<p>Vue 3のショートカット入力用composable。</p>
		</header>
		<main>
			<section id="demo" class="demo-section" aria-labelledby="demo-title">
				<div class="section-head">
					<h2 id="demo-title">Demo</h2>
					<fieldset class="presets">
						<legend class="visually-hidden">入力設定</legend>
						<label v-for="item in presets" :key="item.id" class="preset" :class="{ 'is-selected': selected === item.id }">
							<input v-model="selected" type="radio" name="preset" :value="item.id" />
							<span>{{ item.label }}</span>
						</label>
					</fieldset>
				</div>
				<RecorderDemo :key="preset.id" :preset="preset" />
				<p class="keyboard-note">物理キーボードで操作してください。</p>
			</section>
			<section class="usage" aria-labelledby="usage-title">
				<h2 id="usage-title">Usage</h2>
				<pre class="code-block"><code>{{ usage }}</code></pre>
			</section>
		</main>
	</div>
</template>

<style scoped>
.page { max-width: 848px; margin-inline: auto; padding: 64px 24px; }
.intro { margin-bottom: 44px; }
.title-row { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px 24px; }
h1 { margin: 0; font: 650 clamp(1.625rem, 4vw, 2.25rem)/1.3 var(--mono); letter-spacing: -0.05em; }
.intro p { margin: 12px 0 0; color: var(--muted); font-size: 1rem; }
nav { display: flex; gap: 20px; }
nav a { display: inline-flex; align-items: center; min-height: 44px; color: var(--muted); text-decoration: none; font-size: 0.8125rem; }
nav a:hover { color: var(--accent); text-decoration: underline; text-underline-offset: 4px; }
.demo-section { scroll-margin-top: 24px; }
.section-head { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px 20px; margin-bottom: 20px; }
h2 { margin: 0; font-size: 1rem; font-weight: 650; }
.presets { display: flex; flex-wrap: wrap; gap: 4px; border: 0; padding: 0; margin: 0; }
.preset { position: relative; display: inline-flex; align-items: center; justify-content: center; min-height: 44px; padding-inline: 14px; border-radius: 6px; color: var(--muted); font-size: 0.8125rem; cursor: pointer; transition: background-color 140ms, color 140ms; }
.preset:hover { background: var(--subtle); color: var(--text); }
.preset.is-selected { background: var(--accent-soft); color: var(--accent); font-weight: 600; }
.preset:has(:focus-visible) { outline: 3px solid var(--focus); outline-offset: 2px; }
.preset input { position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; border: 0; }
.keyboard-note { margin: 12px 0 0; color: var(--muted); font-size: 0.75rem; }
.usage { margin-top: 36px; }
.usage h2 { margin-bottom: 16px; }
.code-block { margin: 0; padding: 20px 24px; overflow-x: auto; border: 1px solid var(--border); border-radius: 8px; background: var(--subtle); font: 0.8125rem/1.8 var(--mono); }
.skip-link { position: absolute; inset: -80px auto auto 16px; z-index: 2; padding: 10px 16px; background: var(--surface); color: var(--text); }
.skip-link:focus { top: 12px; }
@media (max-width: 600px) {
	.page { padding: 32px 20px 40px; }
	.intro { margin-bottom: 28px; }
	.title-row { align-items: start; flex-direction: column; gap: 4px; }
	nav { gap: 20px; }
	.intro p { margin-top: 8px; font-size: 0.875rem; }
	.section-head { align-items: start; flex-direction: column; gap: 12px; }
	.presets { margin-inline: -6px; }
	.preset { padding-inline: 12px; }
	.code-block { padding: 16px; font-size: 0.75rem; }
}
</style>
