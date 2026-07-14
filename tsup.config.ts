import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/index.ts"],
	format: ["esm", "cjs"],
	dts: true,
	clean: true,
	target: "es2019",
	sourcemap: true,
	minify: false,
	splitting: false,
	treeshake: true,
	shims: false,
});
