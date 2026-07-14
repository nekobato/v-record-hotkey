import { collectPressedModifiers, orderModifiers } from "./keyboard";
import type { MatchHotkeyOptions, RecordedHotkey } from "./types";

const equalsIgnoreCase = (left: string, right: string) =>
	left.toLowerCase() === right.toLowerCase();

/**
 * `KeyboardEvent` が録画済みショートカットと一致するかを判定いたしますの。
 *
 * @example
 * ```ts
 * window.addEventListener("keydown", (event) => {
 *   if (matchHotkey(event, savedShortcut)) {
 *     event.preventDefault();
 *     runCommand();
 *   }
 * });
 * ```
 */
export function matchHotkey(
	event: KeyboardEvent,
	target: RecordedHotkey,
	options: MatchHotkeyOptions = {},
): boolean {
	const { compareKey = false, compareLocation = false } = options;

	if (event.code !== target.code) {
		return false;
	}

	if (
		compareLocation &&
		typeof target.location === "number" &&
		target.location !== event.location
	) {
		return false;
	}

	const eventMods = orderModifiers(collectPressedModifiers(event));
	const targetMods = orderModifiers(target.modifiers);
	if (eventMods.length !== targetMods.length) {
		return false;
	}

	for (let i = 0; i < eventMods.length; i += 1) {
		if (eventMods[i] !== targetMods[i]) {
			return false;
		}
	}

	if (compareKey) {
		if (!event.key || !equalsIgnoreCase(target.key, event.key)) {
			return false;
		}
	}

	return true;
}
