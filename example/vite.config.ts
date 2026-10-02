import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath } from "node:url";

export default defineConfig({
	base: "./",
	plugins: [vue()],
	resolve: {
		dedupe: ["vue"],
		alias: {
			"v-record-hotkey": fileURLToPath(new URL("../src", import.meta.url)),
		},
	},
	server: {
		fs: {
			allow: [".."],
		},
	},
});
