import { beforeEach, describe, expect, it, vi } from "vitest";
import { nextTick, ref } from "vue";
import { type RecordedHotkey, useRecordHotkey } from "../src";

describe("useRecordHotkey", () => {
	const dispatchKeyboard = (target: EventTarget, init: KeyboardEventInit) => {
		const event = new KeyboardEvent("keydown", {
			bubbles: true,
			cancelable: true,
			location: 0,
			...init,
		});
		target.dispatchEvent(event);
		return event;
	};

	const dispatchFocus = (target: EventTarget) => {
		target.dispatchEvent(new FocusEvent("focus"));
	};

	const dispatchBlur = (target: EventTarget) => {
		target.dispatchEvent(new FocusEvent("blur"));
	};

	const dispatchClick = (target: EventTarget) => {
		target.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
	};

	beforeEach(() => {
		document.body.innerHTML = "";
	});

	it("starts recording on focus and confirms on capture by default", async () => {
		const input = document.createElement("input");
		document.body.appendChild(input);
		const inputRef = ref<HTMLInputElement | null>(input);
		const onConfirm = vi.fn();
		const hotkey = useRecordHotkey(inputRef, { onConfirm });

		await nextTick();
		dispatchFocus(input);

		expect(hotkey.isRecording.value).toBe(true);

		dispatchKeyboard(input, { code: "KeyA", key: "a" });

		expect(hotkey.isRecording.value).toBe(false);
		expect(hotkey.value.value).toMatchObject({
			code: "KeyA",
			key: "a",
			modifiers: [],
		});
		expect(hotkey.displayValue.value).toBe("A");
		expect(hotkey.inputAttrs.value.value).toBe("A");
		expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({ code: "KeyA" }));
	});

	it("can start recording on click when focus auto-start is disabled", async () => {
		const input = document.createElement("input");
		document.body.appendChild(input);
		const hotkey = useRecordHotkey(ref(input), {
			startOnFocus: false,
			startOnClick: true,
		});

		await nextTick();
		dispatchClick(input);

		expect(hotkey.isRecording.value).toBe(true);
	});

	it("can start recording on Enter when idle", async () => {
		const input = document.createElement("input");
		document.body.appendChild(input);
		const hotkey = useRecordHotkey(ref(input), {
			startOnFocus: false,
			startOnClick: false,
			startOnEnter: true,
		});

		await nextTick();
		const enter = dispatchKeyboard(input, { code: "Enter", key: "Enter" });

		expect(enter.defaultPrevented).toBe(true);
		expect(hotkey.isRecording.value).toBe(true);
	});

	it("cancels on Escape and preserves the saved value", async () => {
		const input = document.createElement("input");
		document.body.appendChild(input);
		const initial: RecordedHotkey = {
			code: "KeyP",
			key: "p",
			modifiers: ["Ctrl"],
			location: 0,
		};
		const onCancel = vi.fn();
		const hotkey = useRecordHotkey(ref(input), {
			initial,
			onCancel,
		});

		await nextTick();
		dispatchFocus(input);
		expect(hotkey.isRecording.value).toBe(true);

		const escapeEvent = dispatchKeyboard(input, { code: "Escape", key: "Escape" });

		expect(escapeEvent.defaultPrevented).toBe(true);
		expect(hotkey.isRecording.value).toBe(false);
		expect(hotkey.value.value).toEqual(initial);
		expect(onCancel).toHaveBeenCalledTimes(1);
	});

	it("clears the saved shortcut via clearKeys when idle", async () => {
		const input = document.createElement("input");
		document.body.appendChild(input);
		const initial: RecordedHotkey = {
			code: "KeyP",
			key: "p",
			modifiers: ["Ctrl"],
			location: 0,
		};
		const onClear = vi.fn();
		const hotkey = useRecordHotkey(ref(input), {
			initial,
			startOnFocus: false,
			startOnClick: false,
			onClear,
		});

		await nextTick();
		dispatchKeyboard(input, { code: "Delete", key: "Delete" });

		expect(hotkey.value.value).toBeNull();
		expect(hotkey.displayValue.value).toBe("");
		expect(onClear).toHaveBeenCalledTimes(1);
	});

	it("confirms on blur when confirmOnCapture=false", async () => {
		const input = document.createElement("input");
		document.body.appendChild(input);
		const onConfirm = vi.fn();
		const hotkey = useRecordHotkey(ref(input), {
			confirmOnCapture: false,
			onConfirm,
		});

		await nextTick();
		dispatchFocus(input);
		dispatchKeyboard(input, { code: "KeyA", key: "a" });

		expect(hotkey.isRecording.value).toBe(true);
		expect(hotkey.candidate.value).toMatchObject({ code: "KeyA" });
		expect(hotkey.value.value).toBeNull();

		dispatchBlur(input);

		expect(hotkey.isRecording.value).toBe(false);
		expect(hotkey.candidate.value).toBeNull();
		expect(hotkey.value.value).toMatchObject({ code: "KeyA" });
		expect(onConfirm).toHaveBeenCalledTimes(1);
	});

	it("cancels on blur when there is no candidate", async () => {
		const input = document.createElement("input");
		document.body.appendChild(input);
		const onCancel = vi.fn();
		const hotkey = useRecordHotkey(ref(input), {
			confirmOnCapture: false,
			onCancel,
		});

		await nextTick();
		dispatchFocus(input);

		expect(hotkey.isRecording.value).toBe(true);
		dispatchBlur(input);

		expect(hotkey.isRecording.value).toBe(false);
		expect(hotkey.value.value).toBeNull();
		expect(onCancel).toHaveBeenCalledTimes(1);
	});

	it("surfaces recorder errors and aria-invalid state", async () => {
		const input = document.createElement("input");
		document.body.appendChild(input);
		const hotkey = useRecordHotkey(ref(input), {
			disallow: ["A"],
		});

		await nextTick();
		dispatchFocus(input);
		dispatchKeyboard(input, { code: "KeyA", key: "a" });

		expect(hotkey.error.value?.code).toBe("disallowed");
		expect(hotkey.inputAttrs.value["aria-invalid"]).toBe("true");
		expect(hotkey.value.value).toBeNull();
		expect(hotkey.isRecording.value).toBe(true);
	});

	it("reset restores the initial saved value", async () => {
		const input = document.createElement("input");
		document.body.appendChild(input);
		const initial: RecordedHotkey = {
			code: "KeyP",
			key: "p",
			modifiers: ["Ctrl"],
			location: 0,
		};
		const hotkey = useRecordHotkey(ref(input), { initial });

		await nextTick();
		dispatchFocus(input);
		dispatchKeyboard(input, { code: "KeyA", key: "a" });

		expect(hotkey.value.value).toMatchObject({ code: "KeyA" });

		hotkey.reset();

		expect(hotkey.value.value).toEqual(initial);
		expect(hotkey.isRecording.value).toBe(false);
		expect(hotkey.candidate.value).toBeNull();
		expect(hotkey.preview.value).toBeNull();
	});

	it("provides readonly input attrs for direct binding", async () => {
		const input = document.createElement("input");
		document.body.appendChild(input);
		const hotkey = useRecordHotkey(ref(input), {
			placeholder: "Press keys",
		});

		await nextTick();

		expect(hotkey.inputAttrs.value.readonly).toBe(true);
		expect(hotkey.inputAttrs.value.autocomplete).toBe("off");
		expect(hotkey.inputAttrs.value.spellcheck).toBe(false);
		expect(hotkey.inputAttrs.value.placeholder).toBe("Press keys");
	});
});
