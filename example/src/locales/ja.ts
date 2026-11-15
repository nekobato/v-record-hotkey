import type { DemoMessages } from "./en";

const ja: DemoMessages = {
	app: {
		title: "v-record-hotkey — デモ",
		description: "Vue 3のショートカット入力用composable。キーの記録と表示を試せるデモです。",
		skipToDemo: "デモへ移動",
		relatedLinks: "関連リンク",
		language: "言語",
		tagline: "Vue 3のショートカット入力用composable。",
		demo: "デモ",
		inputSettings: "入力設定",
		keyboardNote: "物理キーボードで操作してください。",
		usage: "使い方",
	},
	presets: {
		basic: {
			label: "基本",
			hint: "入力欄をクリックしてキーを入力。",
		},
		manual: {
			label: "手動確定",
			hint: "キー入力後に確定。フォーカス移動でも確定します。",
		},
		modifier: {
			label: "修飾キー必須",
			hint: "Ctrl / Alt / Meta と文字キーを入力。",
		},
	},
	recorder: {
		label: "ショートカット",
		placeholder: "クリックしてキーを入力",
		start: "記録開始",
		confirm: "確定",
		cancel: "取消",
		clear: "削除",
		reset: "リセット",
		result: "記録結果",
		details: "詳細",
		state: "状態",
		events: "イベント",
		options: "オプション",
	},
	status: {
		error: "入力エラー",
		candidate: "候補あり",
		recording: "記録中",
		saved: "確定済み",
		unset: "未設定",
	},
	errors: {
		disabled: "ショートカットの記録は無効です。",
		"invalid-target": "記録対象の入力欄を利用できません。",
		"modifier-not-allowed": "この修飾キーは使用できません。",
		"missing-modifier": "Ctrl / Alt / Meta を組み合わせてください。",
		disallowed: "Ctrl + S / Meta + Q はこのデモでは禁止しています。",
	},
	events: {
		start: "記録",
		confirm: "確定",
		cancel: "取消",
		clear: "削除",
		error: "拒否",
		match: "照合",
		reset: "リセット",
	},
	tester: {
		hint: "ここを選んで、記録したキーを入力。",
		label: "ショートカット照合領域",
		matched: "一致",
		unmatched: "不一致",
		prompt: "キーを入力",
		matches: "一致",
		times: "回",
	},
};

export default ja;
