import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "node:path";
export default defineConfig({
	plugins: [vue()],
	resolve: {
		alias: {
			"v-record-hotkey": path.resolve(__dirname, "../src"),
		},
	},
	server: {
		fs: {
			allow: [".."],
		},
	},
});
