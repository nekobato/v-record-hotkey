import { computed, ref } from "vue";
import en from "./locales/en";
import ja from "./locales/ja";

export type { DemoMessages } from "./locales/en";

const dictionaries = { en, ja };
type DemoLocale = keyof typeof dictionaries;
const storageKey = "v-record-hotkey-demo-locale";

const readLocale = (): DemoLocale => {
	try {
		return localStorage.getItem(storageKey) === "ja" ? "ja" : "en";
	} catch {
		return "en";
	}
};

const currentLocale = ref<DemoLocale>(readLocale());
const locale = computed({
	get: () => currentLocale.value,
	set: (next: DemoLocale) => {
		currentLocale.value = next;
		try {
			localStorage.setItem(storageKey, next);
		} catch {
			// Language switching also works when browser storage is unavailable.
		}
	},
});
const messages = computed(() => dictionaries[currentLocale.value]);

export function useDemoI18n() {
	return { locale, messages };
}
