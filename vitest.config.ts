import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "happy-dom",
		setupFiles: [fileURLToPath(new URL("./vitest.setup.ts", import.meta.url))],
		coverage: {
			reporter: ["text", "html"],
			include: ["src/**/*.{ts,vue}"],
		},
	},
});
