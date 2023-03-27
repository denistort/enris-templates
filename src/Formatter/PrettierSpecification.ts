import { format } from "prettier";
import { IFormattable } from "./types";

export class PrettierSpecification implements IFormattable {
	format(html: string): string {
		return format(html, { parser: "html" });
	}
}
