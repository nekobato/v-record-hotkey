import type { HotkeyPreview, ModKey, RecordedHotkey } from "./types";

export const MODIFIER_ORDER: readonly ModKey[] = ["Ctrl", "Alt", "Shift", "Meta"];
export const PRIMARY_MODIFIERS: readonly ModKey[] = ["Ctrl", "Alt", "Meta"];

const MODIFIER_FLAG: Record<ModKey, "ctrlKey" | "altKey" | "shiftKey" | "metaKey"> = {
	Ctrl: "ctrlKey",
	Alt: "altKey",
	Shift: "shiftKey",
	Meta: "metaKey",
};

const MODIFIER_ALIASES: Record<string, ModKey> = {
	ctrl: "Ctrl",
	control: "Ctrl",
	command: "Meta",
	cmd: "Meta",
	meta: "Meta",
	win: "Meta",
	super: "Meta",
	option: "Alt",
	alt: "Alt",
	shift: "Shift",
};

const MODIFIER_KEYS = new Set(["Alt", "AltGraph", "Control", "Meta", "OS", "Shift"]);
const MODIFIER_CODES = new Set([
	"AltLeft",
	"AltRight",
	"ControlLeft",
	"ControlRight",
	"MetaLeft",
	"MetaRight",
	"OSLeft",
	"OSRight",
	"ShiftLeft",
	"ShiftRight",
]);

const NON_TEXT_INPUT_TYPES = new Set([
	"button",
	"checkbox",
	"color",
	"file",
	"hidden",
	"image",
	"radio",
	"range",
	"reset",
	"submit",
]);

const CODE_SYMBOL_MAP: Record<string, string> = {
	Semicolon: ";",
	Equal: "=",
	Comma: ",",
	Minus: "-",
	Period: ".",
	Slash: "/",
	Backquote: "`",
	BracketLeft: "[",
	BracketRight: "]",
	Backslash: "\\",
	Quote: "'",
};

export const WIN_MOD_LABELS: Record<ModKey, string> = {
	Ctrl: "Ctrl",
	Alt: "Alt",
	Shift: "Shift",
	Meta: "Meta",
};

export const MAC_MOD_SYMBOLS: Record<ModKey, string> = {
	Ctrl: "⌃",
	Alt: "⌥",
	Shift: "⇧",
	Meta: "⌘",
};

export function orderModifiers(modifiers: ModKey[]): ModKey[] {
	const unique = Array.from(new Set(modifiers));
	return MODIFIER_ORDER.filter((modifier) => unique.includes(modifier));
}

export function collectPressedModifiers(event: KeyboardEvent): ModKey[] {
	return MODIFIER_ORDER.filter((modifier) => Boolean(event[MODIFIER_FLAG[modifier]]));
}

export function hasPrimaryModifier(modifiers: ModKey[]): boolean {
	return PRIMARY_MODIFIERS.some((modifier) => modifiers.includes(modifier));
}

export function isModifierEvent(event: KeyboardEvent): boolean {
	return MODIFIER_KEYS.has(event.key) || MODIFIER_CODES.has(event.code);
}

export function isPrintableEvent(event: KeyboardEvent): boolean {
	return event.key === " " || event.key.length === 1;
}

export function cloneRecordedHotkey(source: RecordedHotkey): RecordedHotkey {
	return {
		code: source.code,
		key: source.key,
		modifiers: [...source.modifiers],
		location: source.location,
	};
}

export function cloneHotkeyPreview(source: HotkeyPreview): HotkeyPreview {
	return {
		code: source.code,
		key: source.key,
		modifiers: [...source.modifiers],
	};
}

export function createModifierPreview(modifiers: ModKey[]): HotkeyPreview | null {
	if (!modifiers.length) {
		return null;
	}
	return {
		code: null,
		key: null,
		modifiers: orderModifiers(modifiers),
	};
}

export function isEditableTarget(target: EventTarget | null): boolean {
	const element = target as HTMLElement | null;
	if (!element) {
		return false;
	}

	if (element.isContentEditable) {
		return true;
	}

	const tag = element.tagName?.toLowerCase();
	if (tag === "textarea") {
		const textarea = element as HTMLTextAreaElement;
		return !textarea.readOnly && !textarea.disabled;
	}

	if (tag === "input") {
		const input = element as HTMLInputElement;
		const type = input.type?.toLowerCase?.() ?? "text";
		if (NON_TEXT_INPUT_TYPES.has(type)) {
			return false;
		}
		return !input.readOnly && !input.disabled;
	}

	return false;
}

export function normalizeDisallowEntries(entries: Array<string | RecordedHotkey>): Set<string> {
	const normalized = new Set<string>();
	for (const entry of entries) {
		for (const signature of signaturesFromEntry(entry)) {
			normalized.add(signature);
		}
	}
	return normalized;
}

function signaturesFromEntry(entry: string | RecordedHotkey): string[] {
	if (typeof entry === "string") {
		const value = normalizeDisallowEntry(entry);
		return value ? [value] : [];
	}
	return buildHotkeySignatures(entry);
}

function normalizeDisallowEntry(entry: string): string | null {
	const tokens = entry
		.split("+")
		.map((token) => token.trim())
		.filter(Boolean);
	if (!tokens.length) {
		return null;
	}

	const modifiers: ModKey[] = [];
	let base: string | null = null;

	for (const token of tokens) {
		const alias = MODIFIER_ALIASES[token.toLowerCase()];
		if (alias) {
			if (!modifiers.includes(alias)) {
				modifiers.push(alias);
			}
			continue;
		}
		base = token;
	}

	return normalizeCombo(modifiers, base);
}

export function normalizeCombo(modifiers: ModKey[], base: string | null | undefined): string {
	const orderedModifiers = orderModifiers(modifiers);
	const normalizedBase = base ? normalizeKeyToken(base) : "";
	return [...orderedModifiers, normalizedBase].filter(Boolean).join("+").toLowerCase();
}

function normalizeKeyToken(token: string): string {
	if (token === " ") {
		return "Space";
	}
	if (token.length === 1) {
		return token.toUpperCase();
	}
	return token;
}

export function buildHotkeySignatures(record: RecordedHotkey): string[] {
	const signatures = [normalizeCombo(record.modifiers, record.code)];
	if (record.key) {
		signatures.push(normalizeCombo(record.modifiers, record.key));
	}
	return signatures;
}

export function detectOSPreference(): "mac" | "win" {
	if (typeof navigator === "undefined") {
		return "win";
	}
	const ua = navigator.userAgent || navigator.platform || "";
	return /mac|darwin/i.test(ua) ? "mac" : "win";
}

export function baseLabelFromCode(
	record: Pick<RecordedHotkey, "code" | "key"> | HotkeyPreview,
): string {
	const { code, key } = record;

	if (code?.startsWith("Key")) {
		return code.slice(3).toUpperCase();
	}
	if (code?.startsWith("Digit")) {
		return code.slice(5);
	}
	if (code?.startsWith("Numpad")) {
		const tail = code.slice(6);
		return `Num ${tail}`;
	}
	if (code && CODE_SYMBOL_MAP[code]) {
		return CODE_SYMBOL_MAP[code];
	}
	switch (code) {
		case "Space":
			return "Space";
		case "ArrowUp":
			return "Arrow Up";
		case "ArrowDown":
			return "Arrow Down";
		case "ArrowLeft":
			return "Arrow Left";
		case "ArrowRight":
			return "Arrow Right";
		case "Escape":
			return "Esc";
		case "Enter":
			return "Enter";
		case "Backspace":
			return "Backspace";
		case "Tab":
			return "Tab";
		case "Delete":
			return "Del";
		case "Insert":
			return "Ins";
		case "Home":
			return "Home";
		case "End":
			return "End";
		case "PageUp":
			return "Page Up";
		case "PageDown":
			return "Page Down";
		default:
			if (key === " ") {
				return "Space";
			}
			if (key?.length === 1) {
				return key.toUpperCase();
			}
			return key ?? "";
	}
}

export function getUnshiftedSymbolFromCode(code: string | null): string | null {
	if (!code) {
		return null;
	}
	if (CODE_SYMBOL_MAP[code]) {
		return CODE_SYMBOL_MAP[code];
	}
	if (code.startsWith("Digit")) {
		return code.slice(5);
	}
	if (code.startsWith("Key")) {
		return code.slice(3).toUpperCase();
	}
	return null;
}
