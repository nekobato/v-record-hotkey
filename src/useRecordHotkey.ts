import {
	computed,
	getCurrentScope,
	onScopeDispose,
	ref,
	toValue,
	type MaybeRefOrGetter,
	watchEffect,
} from "vue";
import { cloneRecordedHotkey } from "./keyboard";
import type {
	HotkeyInputElement,
	RecordedHotkey,
	UseRecordHotkeyOptions,
	UseRecordHotkeyReturn,
} from "./types";
import { useHotkeyFormatter } from "./useHotkeyFormatter";
import { useHotkeyRecorder } from "./useHotkeyRecorder";

const DEFAULT_CLEAR_KEYS = ["Backspace", "Delete"];

const hasNoModifier = (event: KeyboardEvent) =>
	!event.ctrlKey && !event.altKey && !event.metaKey && !event.shiftKey;

const matchesKeyCommand = (event: KeyboardEvent, keys: string[]) => {
	const candidates = [event.key, event.code].filter(Boolean).map((value) => value.toLowerCase());
	return keys.some((key) => candidates.includes(key.toLowerCase()));
};

const stopNativePropagation = (event: KeyboardEvent) => {
	event.preventDefault();
	event.stopPropagation();
	event.stopImmediatePropagation();
};

/**
 * input 要素へ ref を渡すだけで、ショートカット入力欄として扱える高レベル composable ですわ。
 */
export function useRecordHotkey(
	inputRef: MaybeRefOrGetter<HotkeyInputElement | null | undefined>,
	options: UseRecordHotkeyOptions = {},
): UseRecordHotkeyReturn {
	const {
		initial = null,
		disallow = [],
		allowedModifiers,
		requireModifierForPrintable = false,
		allowUnmodifiedNonPrintable = true,
		startOnFocus = true,
		startOnClick = true,
		startOnEnter = true,
		confirmOnCapture = true,
		confirmOnBlur = true,
		cancelOnEscape = true,
		clearKeys = DEFAULT_CLEAR_KEYS,
		placeholder,
		formatOptions,
		onStart,
		onConfirm,
		onCancel,
		onClear,
		onError,
	} = options;

	const initialSnapshot = initial ? cloneRecordedHotkey(initial) : null;
	const value = ref<RecordedHotkey | null>(
		initialSnapshot ? cloneRecordedHotkey(initialSnapshot) : null,
	);
	const cleanupListeners = ref<(() => void) | null>(null);

	const recorder = useHotkeyRecorder({
		target: inputRef,
		ignoreInEditable: false,
		allowedModifiers,
		requireModifierForPrintable,
		allowUnmodifiedNonPrintable,
		disallow,
		captureStopsRecording: false,
		onStart,
		onError,
	});

	const { format } = useHotkeyFormatter(formatOptions);

	const displayValue = computed(() => {
		if (recorder.candidate.value) {
			return format(recorder.candidate.value);
		}
		if (recorder.preview.value) {
			return format(recorder.preview.value);
		}
		if (value.value) {
			return format(value.value);
		}
		return "";
	});

	const inputAttrs = computed(() => ({
		value: displayValue.value,
		readonly: true,
		autocomplete: "off" as const,
		spellcheck: false as const,
		placeholder,
		...(recorder.error.value ? { "aria-invalid": "true" as const } : {}),
	}));

	const resolveInput = () => toValue(inputRef) ?? null;

	const start = () => {
		const input = resolveInput();
		recorder.start();
		input?.focus();
	};

	const confirm = () => {
		const current = recorder.candidate.value;
		if (!current) {
			recorder.stop();
			return;
		}

		const snapshot = cloneRecordedHotkey(current);
		value.value = snapshot;
		recorder.reset();
		onConfirm?.(cloneRecordedHotkey(snapshot));
	};

	const cancel = () => {
		const hadActivity =
			recorder.isRecording.value ||
			Boolean(recorder.candidate.value) ||
			Boolean(recorder.preview.value) ||
			Boolean(recorder.error.value);

		recorder.reset();
		if (hadActivity) {
			onCancel?.();
		}
	};

	const clear = () => {
		const hadValue = Boolean(value.value);
		value.value = null;
		recorder.reset();
		if (hadValue) {
			onClear?.();
		}
	};

	const reset = () => {
		recorder.reset();
		value.value = initialSnapshot ? cloneRecordedHotkey(initialSnapshot) : null;
	};

	watchEffect(
		() => {
			if (confirmOnCapture && recorder.isRecording.value && recorder.candidate.value) {
				confirm();
			}
		},
		{ flush: "sync" },
	);

	watchEffect((onCleanup) => {
		const input = resolveInput();
		if (!input) {
			cleanupListeners.value?.();
			cleanupListeners.value = null;
			return;
		}

		const handleFocus = () => {
			if (startOnFocus && !recorder.isRecording.value) {
				start();
			}
		};

		const handleClick = () => {
			if (startOnClick && !recorder.isRecording.value) {
				start();
			}
		};

		const handleBlur = () => {
			if (!recorder.isRecording.value) {
				return;
			}
			if (confirmOnBlur && recorder.candidate.value) {
				confirm();
				return;
			}
			cancel();
		};

			const handleKeydown = (event: KeyboardEvent) => {
			if (!recorder.isRecording.value) {
				if (startOnEnter && event.key === "Enter" && hasNoModifier(event)) {
					stopNativePropagation(event);
					start();
					return;
				}

				if (value.value && matchesKeyCommand(event, clearKeys) && hasNoModifier(event)) {
					stopNativePropagation(event);
					clear();
				}
				return;
			}

			if (cancelOnEscape && event.key === "Escape" && hasNoModifier(event)) {
				stopNativePropagation(event);
				cancel();
				return;
			}

			if (matchesKeyCommand(event, clearKeys) && hasNoModifier(event)) {
				stopNativePropagation(event);
				clear();
				}
			};
			const keydownListener = handleKeydown as EventListener;

			input.addEventListener("focus", handleFocus);
			input.addEventListener("click", handleClick);
			input.addEventListener("blur", handleBlur);
			input.addEventListener("keydown", keydownListener);

			const detach = () => {
				input.removeEventListener("focus", handleFocus);
				input.removeEventListener("click", handleClick);
				input.removeEventListener("blur", handleBlur);
				input.removeEventListener("keydown", keydownListener);
			};

		cleanupListeners.value?.();
		cleanupListeners.value = detach;

		onCleanup(() => {
			detach();
			if (cleanupListeners.value === detach) {
				cleanupListeners.value = null;
			}
		});
	});

	if (getCurrentScope()) {
		onScopeDispose(() => {
			cleanupListeners.value?.();
			cleanupListeners.value = null;
		});
	}

	return {
		isRecording: recorder.isRecording,
		value,
		candidate: recorder.candidate,
		preview: recorder.preview,
		error: recorder.error,
		displayValue,
		inputAttrs,
		start,
		confirm,
		cancel,
		clear,
		reset,
	};
}
