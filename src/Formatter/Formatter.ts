import { IFormattable } from "./types";

export class Formatter {
	private engine: IFormattable;

	constructor(engine: IFormattable) {
		if (!engine.format || typeof engine.format !== "function") {
			throw new TypeError("Engine should have format Function");
		}
		this.engine = engine;
	}

	format(html: string) {
		return this.engine.format(html);
	}
}
