<script setup lang="ts">
import { ref } from "vue";
import { useDemoI18n } from "../i18n";

const { locale, messages } = useDemoI18n();
const supportsPopover = "popover" in HTMLElement.prototype;
const trigger = ref<HTMLButtonElement | null>(null);
const popover = ref<HTMLElement | null>(null);
const languages = [
	{ code: "en", label: "English" },
	{ code: "ja", label: "日本語" },
] as const;

const selectLanguage = (next: typeof locale.value) => {
	locale.value = next;
	popover.value?.hidePopover();
	trigger.value?.focus();
};
</script>

<template>
	<select v-if="!supportsPopover" v-model="locale" class="fallback" :aria-label="messages.app.language">
		<option v-for="language in languages" :key="language.code" :value="language.code" :lang="language.code">{{ language.label }}</option>
	</select>
	<button v-else ref="trigger" type="button" class="trigger" popovertarget="demo-languages">
		{{ messages.app.language }}
	</button>
	<div v-if="supportsPopover" id="demo-languages" ref="popover" class="popover" popover="auto" role="group" :aria-label="messages.app.language">
		<button
			v-for="language in languages"
			:key="language.code"
			type="button"
			class="option"
			:class="{ 'is-selected': locale === language.code }"
			:lang="language.code"
			:aria-pressed="locale === language.code"
			:autofocus="locale === language.code"
			@click="selectLanguage(language.code)"
		>
			<span>{{ language.label }}</span>
			<svg v-if="locale === language.code" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
				<path d="m3.5 8 3 3 6-6" />
			</svg>
		</button>
	</div>
</template>

<style scoped>
.trigger { display: inline-flex; align-items: center; justify-content: center; min-width: 44px; min-height: 44px; padding: 0; border: 0; background: transparent; color: var(--muted); font-size: 0.8125rem; cursor: pointer; }
.trigger:hover { color: var(--accent); text-decoration: underline; text-underline-offset: 4px; }
.fallback { min-height: 44px; padding: 8px; border: 1px solid var(--input-border); border-radius: 6px; background: var(--surface); color: var(--text); font-size: 0.8125rem; }
.popover { min-width: 160px; max-width: calc(100vw - 24px); padding: 4px; border: 1px solid var(--border); border-radius: 8px; background: var(--surface); color: var(--text); box-shadow: 0 8px 24px rgb(37 43 40 / 12%); }
.option { display: flex; align-items: center; justify-content: space-between; gap: 16px; width: 100%; min-height: 44px; padding: 8px 12px; border: 0; border-radius: 4px; background: transparent; color: var(--text); font-size: 0.8125rem; text-align: start; cursor: pointer; }
.option:hover { background: var(--subtle); }
.option.is-selected { background: var(--accent-soft); color: var(--accent); font-weight: 600; }
.option:focus-visible { outline-offset: -3px; }
@supports (position-area: block-end span-inline-start) {
	.popover { inset: auto; margin: 8px 0 0; position-area: block-end span-inline-start; position-try-fallbacks: flip-block, flip-inline, flip-block flip-inline; }
}
</style>
