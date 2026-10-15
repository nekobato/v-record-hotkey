import type { UseRecordHotkeyOptions } from "v-record-hotkey";

export interface DemoPreset {
	id: string;
	label: string;
	hint: string;
	options: UseRecordHotkeyOptions;
}

export const presets: DemoPreset[] = [
	{
		id: "basic",
		label: "基本",
		hint: "入力欄をクリックしてキーを入力。",
		options: {},
	},
	{
		id: "manual",
		label: "手動確定",
		hint: "キー入力後に確定。フォーカス移動でも確定します。",
		options: { confirmOnCapture: false },
	},
	{
		id: "modifier",
		label: "修飾キー必須",
		hint: "Ctrl / Alt / Meta と文字キーを入力。",
		options: { requireModifierForPrintable: true },
	},
];
