import type { HotkeyPreview, RecordedHotkey, UseHotkeyFormatterOptions } from "./types";
import {
	MAC_MOD_SYMBOLS,
	WIN_MOD_LABELS,
	baseLabelFromCode,
	detectOSPreference,
	getUnshiftedSymbolFromCode,
	orderModifiers,
} from "./keyboard";

type HotkeyLike = RecordedHotkey | HotkeyPreview;

const isPrintable = (value: string) => value.length === 1 && value.trim().length > 0;

/**
 * `RecordedHotkey` や modifier preview を OS 別の表記へ整形する helper ですわ。
 */
export function useHotkeyFormatter(options: UseHotkeyFormatterOptions = {}) {
	const { os = "auto", showShiftImplicit = false } = options;
	const resolvedOs = os === "auto" ? detectOSPreference() : os;

	const format = (input: HotkeyLike): string => {
		const modifiers = orderModifiers(input.modifiers);
		const base = baseLabelFromCode(input);
		const display = showShiftImplicit ? applyImplicitShift(base, input) : base;

		if (resolvedOs === "mac") {
			const prefix = modifiers.map((modifier) => MAC_MOD_SYMBOLS[modifier]).join("");
			return `${prefix}${display}`;
		}

		return [...modifiers.map((modifier) => WIN_MOD_LABELS[modifier]), display]
			.filter(Boolean)
			.join(" + ");
	};

	return { format };
}

const applyImplicitShift = (base: string, hotkey: HotkeyLike): string => {
	if (!hotkey.modifiers.includes("Shift")) {
		return base;
	}
	if (!hotkey.key || !isPrintable(hotkey.key)) {
		return base;
	}
	const unshifted = getUnshiftedSymbolFromCode(hotkey.code);
	if (!unshifted || unshifted === hotkey.key) {
		return base;
	}
	return `${base} ( ${hotkey.key} )`;
};
