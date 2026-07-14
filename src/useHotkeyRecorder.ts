import { getCurrentScope, onScopeDispose, ref, toValue, watchEffect } from "vue";
import type {
	HotkeyRecordError,
	HotkeyPreview,
	RecordedHotkey,
	UseHotkeyRecorderOptions,
	UseHotkeyRecorderReturn,
} from "./types";
import {
	MODIFIER_ORDER,
	buildHotkeySignatures,
	cloneHotkeyPreview,
	cloneRecordedHotkey,
	collectPressedModifiers,
	createModifierPreview,
	hasPrimaryModifier,
	isEditableTarget,
	isModifierEvent,
	isPrintableEvent,
	normalizeDisallowEntries,
	orderModifiers,
} from "./keyboard";

const defaultTarget = () => (typeof window !== "undefined" ? window : null);

const isFunction = (value: unknown): value is (...args: never[]) => unknown =>
	typeof value === "function";

const shouldApply = (
	option: boolean | ((event: KeyboardEvent) => boolean) | undefined,
	event: KeyboardEvent,
	fallback: boolean,
): boolean => {
	if (typeof option === "boolean") {
		return option;
	}
	if (isFunction(option)) {
		return option(event);
	}
	return fallback;
};

/**
 * 任意の target で 1 コンボの hotkey を録画する低レベル composable ですわ。
 * input 向けの UX は `useRecordHotkey()` 側で組み立てる前提でございます。
 */
export function useHotkeyRecorder(options: UseHotkeyRecorderOptions = {}): UseHotkeyRecorderReturn {
	const {
		ignoreComposition = true,
		ignoreInEditable = true,
		eventFilter = () => true,
		enabled = true,
		preventDefault = true,
		stopPropagation = false,
		allowedModifiers = [...MODIFIER_ORDER],
		requireModifierForPrintable = false,
		allowUnmodifiedNonPrintable = true,
		disallow = [],
		captureStopsRecording = true,
		target = defaultTarget,
		onStart,
		onPreview,
		onCapture,
		onError,
	} = options;

	const allowedSet = new Set(allowedModifiers);
	const disallowSet = normalizeDisallowEntries(disallow);
	const enabledSource = enabled;

	const isRecording = ref(false);
	const candidate = ref<RecordedHotkey | null>(null);
	const preview = ref<HotkeyPreview | null>(null);
	const error = ref<HotkeyRecordError | null>(null);

	let cleanupListeners: Array<() => void> = [];

	const detachListeners = () => {
		for (const cleanup of cleanupListeners) {
			cleanup();
		}
		cleanupListeners = [];
	};

	const emitPreview = (next: HotkeyPreview | null) => {
		preview.value = next ? cloneHotkeyPreview(next) : null;
		onPreview?.(preview.value ? cloneHotkeyPreview(preview.value) : null);
	};

	const setError = (code: HotkeyRecordError["code"], message: string) => {
		error.value = { code, message };
		onError?.({ code, message });
	};

	const clearTransient = () => {
		emitPreview(null);
		error.value = null;
	};

	const resolveTarget = (): EventTarget | null => {
		const resolved = toValue(target ?? defaultTarget);
		return resolved ?? null;
	};

	const stop = () => {
		if (!isRecording.value) {
			detachListeners();
			clearTransient();
			return;
		}

		detachListeners();
		isRecording.value = false;
		clearTransient();
	};

	const reset = () => {
		stop();
		candidate.value = null;
	};

	const capture = (recorded: RecordedHotkey) => {
		const snapshot = cloneRecordedHotkey(recorded);
		candidate.value = snapshot;
		error.value = null;
		emitPreview(null);
		onCapture?.(cloneRecordedHotkey(snapshot));
		if (captureStopsRecording) {
			stop();
		}
	};

	const handleKeyup = (event: KeyboardEvent) => {
		if (!isRecording.value) {
			return;
		}

		const pressed = collectPressedModifiers(event).filter((modifier) => allowedSet.has(modifier));
		emitPreview(createModifierPreview(pressed));
	};

	const handleKeydown = (event: KeyboardEvent) => {
		if (!isRecording.value) {
			return;
		}
		if (event.repeat) {
			return;
		}
		if (ignoreComposition && (event.isComposing || event.key === "Process")) {
			return;
		}
		if (ignoreInEditable && isEditableTarget(event.target)) {
			return;
		}
		if (!eventFilter(event)) {
			return;
		}

		if (shouldApply(preventDefault, event, true)) {
			event.preventDefault();
		}
		if (shouldApply(stopPropagation, event, false)) {
			event.stopPropagation();
		}

		const pressed = collectPressedModifiers(event);
		const invalidModifier = pressed.find((modifier) => !allowedSet.has(modifier));
		if (invalidModifier) {
			emitPreview(null);
			setError("modifier-not-allowed", `Modifier ${invalidModifier} is not allowed`);
			return;
		}

		if (isModifierEvent(event)) {
			error.value = null;
			emitPreview(createModifierPreview(pressed));
			return;
		}

		const modifiers = orderModifiers(pressed);
		const recorded: RecordedHotkey = {
			code: event.code,
			key: event.key,
			modifiers,
			location: event.location ?? 0,
		};

		if (isPrintableEvent(event) && requireModifierForPrintable && !hasPrimaryModifier(modifiers)) {
			emitPreview(createModifierPreview(modifiers));
			setError("missing-modifier", "Printable keys require Ctrl, Alt, or Meta");
			return;
		}

		if (!isPrintableEvent(event) && !allowUnmodifiedNonPrintable && modifiers.length === 0) {
			emitPreview(null);
			setError("missing-modifier", "This key requires a modifier");
			return;
		}

		if (disallowSet.size) {
			const signatures = buildHotkeySignatures(recorded);
			if (signatures.some((signature) => disallowSet.has(signature))) {
				emitPreview(null);
				setError("disallowed", "Hotkey is disallowed");
				return;
			}
		}

		capture(recorded);
	};

	const start = () => {
		if (isRecording.value) {
			return;
		}
		if (!toValue(enabledSource)) {
			setError("disabled", "Recording is disabled");
			return;
		}

		const targetElement = resolveTarget();
		if (!targetElement || !isFunction((targetElement as EventTarget).addEventListener)) {
			setError("invalid-target", "No valid event target");
			return;
		}

		const keydownListener = (event: Event) => {
			if (event instanceof KeyboardEvent) {
				handleKeydown(event);
			}
		};
		const keyupListener = (event: Event) => {
			if (event instanceof KeyboardEvent) {
				handleKeyup(event);
			}
		};
		const blurListener = () => {
			emitPreview(null);
		};

		targetElement.addEventListener("keydown", keydownListener as EventListener, { passive: false });
		targetElement.addEventListener("keyup", keyupListener as EventListener);
		targetElement.addEventListener("blur", blurListener as EventListener);
		cleanupListeners = [
			() => targetElement.removeEventListener("keydown", keydownListener as EventListener),
			() => targetElement.removeEventListener("keyup", keyupListener as EventListener),
			() => targetElement.removeEventListener("blur", blurListener as EventListener),
		];

		candidate.value = null;
		isRecording.value = true;
		clearTransient();
		onStart?.();
	};

	if (getCurrentScope()) {
		onScopeDispose(() => {
			if (isRecording.value) {
				stop();
			} else {
				detachListeners();
			}
		});
	}

	watchEffect(() => {
		if (!toValue(enabledSource) && isRecording.value) {
			stop();
		}
	});

	return {
		isRecording,
		candidate,
		preview,
		error,
		start,
		stop,
		reset,
	};
}
