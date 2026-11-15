import type { UseRecordHotkeyOptions } from "v-record-hotkey";

export interface DemoPreset {
	id: "basic" | "manual" | "modifier";
	options: UseRecordHotkeyOptions;
}

export const presets: DemoPreset[] = [
	{
		id: "basic",
		options: {},
	},
	{
		id: "manual",
		options: { confirmOnCapture: false },
	},
	{
		id: "modifier",
		options: { requireModifierForPrintable: true },
	},
];
