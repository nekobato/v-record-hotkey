import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	matchHotkey,
	type HotkeyPreview,
	type RecordedHotkey,
	useHotkeyFormatter,
	useHotkeyRecorder,
} from "../src";

describe("useHotkeyRecorder", () => {
	const dispatch = (target: EventTarget, event: KeyboardEvent) => {
		target.dispatchEvent(event);
	};

	const createEvent = (type: "keydown" | "keyup", init: KeyboardEventInit = {}) =>
		new KeyboardEvent(type, {
			bubbles: true,
			cancelable: true,
			code: "KeyK",
			key: "k",
			location: 0,
			...init,
		});

	beforeEach(() => {
		document.body.innerHTML = "";
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("records a modifier shortcut and stops after capture by default", () => {
		const onStart = vi.fn();
		const onCapture = vi.fn();
		const { start, isRecording, candidate, preview } = useHotkeyRecorder({
			onStart,
			onCapture,
		});

		start();
		expect(onStart).toHaveBeenCalledTimes(1);
		expect(isRecording.value).toBe(true);

		const event = createEvent("keydown", { ctrlKey: true });
		dispatch(window, event);

		expect(event.defaultPrevented).toBe(true);
		expect(isRecording.value).toBe(false);
		expect(preview.value).toBeNull();
		expect(candidate.value).toMatchObject({
			code: "KeyK",
			key: "k",
			modifiers: ["Ctrl"],
			location: 0,
		});
		expect(onCapture).toHaveBeenCalledWith(expect.objectContaining({ code: "KeyK" }));
	});

	it("can keep recording after capture when captureStopsRecording=false", () => {
		const { start, isRecording, candidate } = useHotkeyRecorder({
			captureStopsRecording: false,
		});

		start();
		dispatch(window, createEvent("keydown", { code: "KeyA", key: "a" }));

		expect(isRecording.value).toBe(true);
		expect(candidate.value).toMatchObject({
			code: "KeyA",
			key: "a",
			modifiers: [],
		});
	});

	it("records a plain printable key by default", () => {
		const { start, isRecording, candidate, error } = useHotkeyRecorder();

		start();
		const event = createEvent("keydown", { code: "KeyA", key: "a" });
		dispatch(window, event);

		expect(event.defaultPrevented).toBe(true);
		expect(isRecording.value).toBe(false);
		expect(error.value).toBeNull();
		expect(candidate.value).toMatchObject({
			code: "KeyA",
			key: "a",
			modifiers: [],
		});
	});

	it("records shift-only printable input as a shortcut", () => {
		const { start, candidate, error, isRecording } = useHotkeyRecorder();

		start();
		dispatch(window, createEvent("keydown", { code: "KeyA", key: "A", shiftKey: true }));

		expect(isRecording.value).toBe(false);
		expect(error.value).toBeNull();
		expect(candidate.value).toMatchObject({
			code: "KeyA",
			key: "A",
			modifiers: ["Shift"],
		});
	});

	it("allows unmodified non-printable keys by default", () => {
		const { start, candidate, isRecording } = useHotkeyRecorder();

		start();
		dispatch(window, createEvent("keydown", { code: "Escape", key: "Escape" }));

		expect(isRecording.value).toBe(false);
		expect(candidate.value).toMatchObject({
			code: "Escape",
			key: "Escape",
			modifiers: [],
		});
	});

	it("tracks modifier preview and clears it on keyup", () => {
		const onPreview = vi.fn();
		const { start, preview, candidate } = useHotkeyRecorder({ onPreview });

		start();
		dispatch(
			window,
			createEvent("keydown", {
				code: "ControlLeft",
				key: "Control",
				ctrlKey: true,
				location: 1,
			}),
		);

		const expectedPreview: HotkeyPreview = {
			code: null,
			key: null,
			modifiers: ["Ctrl"],
		};
		expect(preview.value).toEqual(expectedPreview);
		expect(candidate.value).toBeNull();

		dispatch(
			window,
			createEvent("keyup", {
				code: "ControlLeft",
				key: "Control",
				ctrlKey: false,
				location: 1,
			}),
		);

		expect(preview.value).toBeNull();
		expect(onPreview).toHaveBeenLastCalledWith(null);
	});

	it("ignores keydown events coming from editable elements by default", () => {
		const { start, candidate } = useHotkeyRecorder();
		const input = document.createElement("input");
		input.type = "text";
		document.body.appendChild(input);

		start();
		dispatch(input, createEvent("keydown", { ctrlKey: true }));

		expect(candidate.value).toBeNull();
	});

	it("respects user-provided disallow entries and keeps the recorder active", () => {
		const { start, candidate, error, isRecording } = useHotkeyRecorder({
			disallow: ["A", "Ctrl+S"],
			captureStopsRecording: false,
		});

		start();
		dispatch(window, createEvent("keydown", { code: "KeyA", key: "a" }));

		expect(candidate.value).toBeNull();
		expect(isRecording.value).toBe(true);
		expect(error.value?.code).toBe("disallowed");

		dispatch(window, createEvent("keydown", { code: "KeyS", key: "s", ctrlKey: true }));

		expect(candidate.value).toBeNull();
		expect(isRecording.value).toBe(true);
		expect(error.value?.code).toBe("disallowed");
	});

	it("rejects modifiers outside the allowed set", () => {
		const { start, candidate, error, isRecording } = useHotkeyRecorder({
			allowedModifiers: ["Ctrl", "Shift"],
			captureStopsRecording: false,
		});

		start();
		dispatch(window, createEvent("keydown", { code: "KeyK", key: "k", metaKey: true }));

		expect(candidate.value).toBeNull();
		expect(isRecording.value).toBe(true);
		expect(error.value?.code).toBe("modifier-not-allowed");
	});

	it("can require a modifier for non-printable keys too", () => {
		const { start, candidate, error, isRecording } = useHotkeyRecorder({
			allowUnmodifiedNonPrintable: false,
			captureStopsRecording: false,
		});

		start();
		dispatch(window, createEvent("keydown", { code: "Escape", key: "Escape" }));

		expect(candidate.value).toBeNull();
		expect(isRecording.value).toBe(true);
		expect(error.value?.code).toBe("missing-modifier");
	});

	it("can require modifiers for printable keys when explicitly configured", () => {
		const { start, candidate, error, isRecording } = useHotkeyRecorder({
			requireModifierForPrintable: true,
			captureStopsRecording: false,
		});

		start();
		dispatch(window, createEvent("keydown", { code: "KeyA", key: "a" }));

		expect(candidate.value).toBeNull();
		expect(isRecording.value).toBe(true);
		expect(error.value?.code).toBe("missing-modifier");
	});

	it("reset clears the candidate and stops the session", () => {
		const { start, reset, candidate, isRecording } = useHotkeyRecorder({
			captureStopsRecording: false,
		});

		start();
		dispatch(window, createEvent("keydown", { code: "KeyA", key: "a" }));

		expect(candidate.value).not.toBeNull();
		expect(isRecording.value).toBe(true);

		reset();

		expect(candidate.value).toBeNull();
		expect(isRecording.value).toBe(false);
	});
});

describe("matchHotkey", () => {
	const sample: RecordedHotkey = {
		code: "KeyP",
		key: "p",
		modifiers: ["Ctrl", "Shift"],
		location: 1,
	};

	it("matches keyboard events by code and modifiers by default", () => {
		const event = new KeyboardEvent("keydown", {
			code: "KeyP",
			key: "P",
			ctrlKey: true,
			shiftKey: true,
			location: 0,
			bubbles: true,
		});
		expect(matchHotkey(event, sample)).toBe(true);
	});

	it("can compare location and key when requested", () => {
		const event = new KeyboardEvent("keydown", {
			code: "KeyP",
			key: "P",
			ctrlKey: true,
			shiftKey: true,
			location: 0,
			bubbles: true,
		});
		expect(matchHotkey(event, sample, { compareLocation: true })).toBe(false);
		expect(matchHotkey(event, sample, { compareKey: true })).toBe(true);
	});

	it("fails when modifiers differ", () => {
		const event = new KeyboardEvent("keydown", {
			code: "KeyP",
			key: "p",
			ctrlKey: true,
			bubbles: true,
		});
		expect(matchHotkey(event, sample)).toBe(false);
	});
});

describe("useHotkeyFormatter", () => {
	const recorded: RecordedHotkey = {
		code: "KeyS",
		key: "s",
		modifiers: ["Ctrl", "Shift"],
		location: 0,
	};

	it("formats shortcuts in windows style by default", () => {
		const { format } = useHotkeyFormatter({ os: "win" });
		expect(format(recorded)).toBe("Ctrl + Shift + S");
	});

	it("formats mac glyphs", () => {
		const { format } = useHotkeyFormatter({ os: "mac" });
		expect(format(recorded)).toBe("⌃⇧S");
	});

	it("formats a modifier-only preview", () => {
		const { format } = useHotkeyFormatter({ os: "win" });
		expect(
			format({
				code: null,
				key: null,
				modifiers: ["Ctrl", "Shift"],
			}),
		).toBe("Ctrl + Shift");
	});

	it("shows implicit shift characters when requested", () => {
		const { format } = useHotkeyFormatter({
			os: "win",
			showShiftImplicit: true,
		});
		const semicolon: RecordedHotkey = {
			code: "Semicolon",
			key: ":",
			modifiers: ["Shift", "Ctrl"],
			location: 0,
		};
		expect(format(semicolon)).toBe("Ctrl + Shift + ; ( : )");
	});
});
