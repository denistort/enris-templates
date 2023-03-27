import { readFile } from "fs/promises";
import { join } from "path";

export const readSingleTemplate = async (
	viewsPath: string,
	templateName: string
): Promise<string> => {
	const readedTemplate = await readFile(join(viewsPath, templateName), {
		encoding: "utf-8",
	});
	return readedTemplate;
};

export const parseDataType = <T>(s: string): T | string =>
	typeof s === "string" ? `"${s}"` : s;
export const isNestedVar = (s: string): boolean =>
	s.match(/\./g) ? true : false;

export const travers = <T extends Record<string, unknown>>(
	dataObj: T,
	keys: string[]
): any => {
	const [head, ...tail] = keys;
	if (keys.length === 1) {
		return dataObj[keys[0]];
	}
	if (head in dataObj && typeof dataObj[head] === "object") {
		return travers(dataObj[head] as Record<string, unknown>, tail);
	} else {
		throw new ReferenceError(`${head} is not defined in data obj`);
	}
};

export const isPrimitive = <T>(something: T): boolean =>
	typeof something === "number" ||
	typeof something === "string" ||
	typeof something === "boolean";

export const pipe =
	(value: any) =>
	(...fns: Function[]) =>
		fns.reduce((accVal, curFn) => curFn(accVal), value);
export const isExistInObject = <T extends Object>(
	key: string,
	obj: T
): boolean => key in obj;

export enum TypeEnum {
	function = 'function',
	object = 'object',
	number = 'number',
	string = 'string',
	array = 'array',
	boolean = 'boolean',
	symbol = 'symbol',
	bigint = 'bigint',
	undefined = 'undefined'
}
export const isType = <T>(value: T, type: TypeEnum): boolean => {
	switch (type) {
		case TypeEnum.array:
			return Array.isArray(value)
		case TypeEnum.boolean:
			return typeof value === 'boolean'
		case TypeEnum.function:
			return typeof value === 'function'
		case TypeEnum.number:
			return typeof value === 'number'
		case TypeEnum.string:
			return typeof value === 'string'
		case TypeEnum.object:
			return typeof value === 'object'
		case TypeEnum.symbol:
			return typeof value === 'symbol'
		case TypeEnum.undefined:
			return typeof value === 'undefined'
		case TypeEnum.bigint:
			return value instanceof BigInt
		default: return false;
	}
}

