import type { ComputedRef, MaybeRefOrGetter, Ref } from "vue";

export type ModKey = "Ctrl" | "Alt" | "Shift" | "Meta";

export interface RecordedHotkey {
	code: string;
	key: string;
	modifiers: ModKey[];
	location: number;
}

export interface HotkeyPreview {
	code: string | null;
	key: string | null;
	modifiers: ModKey[];
}

export type HotkeyRecordErrorCode =
	| "disabled"
	| "invalid-target"
	| "modifier-not-allowed"
	| "missing-modifier"
	| "disallowed";

export interface HotkeyRecordError {
	code: HotkeyRecordErrorCode;
	message: string;
}

export interface UseHotkeyRecorderOptions {
	target?: MaybeRefOrGetter<EventTarget | null | undefined>;
	ignoreComposition?: boolean;
	ignoreInEditable?: boolean;
	eventFilter?: (e: KeyboardEvent) => boolean;
	enabled?: MaybeRefOrGetter<boolean>;
	preventDefault?: boolean | ((e: KeyboardEvent) => boolean);
	stopPropagation?: boolean | ((e: KeyboardEvent) => boolean);
	allowedModifiers?: ModKey[];
	requireModifierForPrintable?: boolean;
	allowUnmodifiedNonPrintable?: boolean;
	disallow?: Array<string | RecordedHotkey>;
	captureStopsRecording?: boolean;
	onStart?: () => void;
	onPreview?: (current: HotkeyPreview | null) => void;
	onCapture?: (result: RecordedHotkey) => void;
	onError?: (error: HotkeyRecordError) => void;
}

export interface UseHotkeyRecorderReturn {
	isRecording: Ref<boolean>;
	candidate: Ref<RecordedHotkey | null>;
	preview: Ref<HotkeyPreview | null>;
	error: Ref<HotkeyRecordError | null>;
	start: () => void;
	stop: () => void;
	reset: () => void;
}

export type HotkeyInputElement = HTMLInputElement | HTMLTextAreaElement;

export interface UseRecordHotkeyOptions {
	initial?: RecordedHotkey | null;
	disallow?: Array<string | RecordedHotkey>;
	allowedModifiers?: ModKey[];
	requireModifierForPrintable?: boolean;
	allowUnmodifiedNonPrintable?: boolean;
	startOnFocus?: boolean;
	startOnClick?: boolean;
	startOnEnter?: boolean;
	confirmOnCapture?: boolean;
	confirmOnBlur?: boolean;
	cancelOnEscape?: boolean;
	clearKeys?: string[];
	placeholder?: string;
	formatOptions?: UseHotkeyFormatterOptions;
	onStart?: () => void;
	onConfirm?: (value: RecordedHotkey) => void;
	onCancel?: () => void;
	onClear?: () => void;
	onError?: (error: HotkeyRecordError) => void;
}

export interface UseRecordHotkeyInputAttrs {
	value: string;
	readonly: boolean;
	autocomplete: "off";
	spellcheck: false;
	placeholder?: string;
	"aria-invalid"?: "true";
}

export interface UseRecordHotkeyReturn {
	isRecording: Ref<boolean>;
	value: Ref<RecordedHotkey | null>;
	candidate: Ref<RecordedHotkey | null>;
	preview: Ref<HotkeyPreview | null>;
	error: Ref<HotkeyRecordError | null>;
	displayValue: ComputedRef<string>;
	inputAttrs: ComputedRef<UseRecordHotkeyInputAttrs>;
	start: () => void;
	confirm: () => void;
	cancel: () => void;
	clear: () => void;
	reset: () => void;
}

export interface MatchHotkeyOptions {
	compareKey?: boolean;
	compareLocation?: boolean;
}

export interface UseHotkeyFormatterOptions {
	os?: "auto" | "mac" | "win";
	showShiftImplicit?: boolean;
}
