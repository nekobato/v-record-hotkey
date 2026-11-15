const en = {
	app: {
		title: "v-record-hotkey — Demo",
		description:
			"Vue 3 composables for keyboard shortcut inputs. Try recording and formatting shortcuts in this demo.",
		skipToDemo: "Skip to demo",
		relatedLinks: "Related links",
		language: "Language",
		tagline: "Vue 3 composables for keyboard shortcut inputs.",
		demo: "Demo",
		inputSettings: "Input settings",
		keyboardNote: "Use a physical keyboard to try the demo.",
		usage: "Usage",
	},
	presets: {
		basic: {
			label: "Basic",
			hint: "Click the input and press a key combination.",
		},
		manual: {
			label: "Manual confirm",
			hint: "Press a key combination, then confirm. Moving focus also confirms it.",
		},
		modifier: {
			label: "Require modifier",
			hint: "Combine Ctrl / Alt / Meta with a printable key.",
		},
	},
	recorder: {
		label: "Shortcut",
		placeholder: "Click and press a key",
		start: "Start recording",
		confirm: "Confirm",
		cancel: "Cancel",
		clear: "Clear",
		reset: "Reset",
		result: "Recorded shortcut",
		details: "Details",
		state: "State",
		events: "Events",
		options: "Options",
	},
	status: {
		error: "Input error",
		candidate: "Ready to confirm",
		recording: "Recording",
		saved: "Confirmed",
		unset: "Not set",
	},
	errors: {
		disabled: "Shortcut recording is disabled.",
		"invalid-target": "The recording target is unavailable.",
		"modifier-not-allowed": "This modifier key is not allowed.",
		"missing-modifier": "Include Ctrl / Alt / Meta in the key combination.",
		disallowed: "Ctrl + S / Meta + Q are not allowed in this demo.",
	},
	events: {
		start: "Started",
		confirm: "Confirmed",
		cancel: "Cancelled",
		clear: "Cleared",
		error: "Rejected",
		match: "Matched",
		reset: "Reset",
	},
	tester: {
		hint: "Focus this area and press the recorded shortcut.",
		label: "Shortcut matching area",
		matched: "Match",
		unmatched: "No match",
		prompt: "Press a key combination",
		matches: "Matches",
		times: "",
	},
};

export type DemoMessages = typeof en;
export default en;
