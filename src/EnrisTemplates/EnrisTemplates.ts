import { opendir } from "fs/promises";
import { join } from "path";
import { Formatter } from "../Formatter/Formatter";
import { PrettierSpecification } from "../Formatter/PrettierSpecification";
import {
	readSingleTemplate,
	parseDataType,
	isNestedVar,
	isPrimitive,
	pipe,
	travers,
	isExistInObject,
	isType,
	TypeEnum,
} from "../utils/utils";
export interface IViewerOptions {
	cache: boolean;
}
const formatter = new Formatter(new PrettierSpecification());

export class EnrisTemplates {
	private baseTemplates = new Map<string, string>();
	private layoutTemplates = new Map<string, string>();
	private options: IViewerOptions = {
		cache: false,
	};
	private cache = new Map<any, any>();
	private pipes = new Map<string, Function>();

	constructor(options: IViewerOptions) {
		if (options) {
			this.options = options;
		}
	}

	public addPipe(pipeName: string, pipe: Function): void {
		if (!pipe("wewe")) {
			throw new Error(`${pipeName} should return an result`);
		}
		if (this.pipes.has(pipeName)) {
			throw new Error(`${pipeName} already exist`);
		}
		this.pipes.set(pipeName, pipe);
	}

	public deletePipe(pipeName: string): void {
		if (!this.pipes.has(pipeName)) {
			throw new Error(`${pipeName} doesnt exist`);
		}
		this.pipes.delete(pipeName);
	}

	getAllTemplatesNames(): string[] {
		return [...this.baseTemplates.keys(), ...this.layoutTemplates.keys()];
	}

	getAllLayoutTemplatesNames(): string[] {
		return [...this.layoutTemplates.keys()];
	}

	getAllBaseTemplatesNames(): string[] {
		return [...this.baseTemplates.keys()];
	}
	/**
	 *
	 * @param {String} viewsPath
	 * @returns {undefined}
	 */
	async init(viewsPath: string): Promise<ViewerTemplate> {
		try {
			const dir = await opendir(viewsPath);
			for await (const dirent of dir) {
				if (dirent.isFile() && dirent.name.includes(".html")) {
					const name = dirent.name;
					if (name.includes("base")) {
						const content = await readSingleTemplate(viewsPath, name);
						this.baseTemplates.set(name.split(".").at(0) as string, content);
					}
					if (name.includes("layout")) {
						const content = await readSingleTemplate(viewsPath, name);
						this.layoutTemplates.set(name.split(".").at(0) as string, content);
					}
				}
				if (dirent.isDirectory()) {
					await this.init(join(viewsPath, dirent.name));
				}
			}
		} catch (err) {
			console.error(err);
		}
		return this;
	}
	/**
	 * this method insert the data into the layout throws the errors in the case if
	 * data doesnt exist in data obj
	 * Insert only primitive type like strings, numbers, or boolean
	 * in the case if your try insert reference on object method the Error
	 * Examples:
	 * <h1>{{ $variable }}</h1>
	 * <h1>{{ $object.wewe }}</h1> support nested
	 * @param {String} template
	 * @param {Object} data
	 * @returns {String}
	 */
	insertData<T extends Record<string, unknown>>(
		template: string,
		data: T
	): string {
		// const regPipes =
		// 	/{{\s?((@pipe\.\w*|(\w*\|\w*)*)\s->)?\s\$((\w*)(\.?)(\w*))*\s?}}/gm;
		const regPipes =
			/\{\{\s?((@pipe\.(\w*|\w*\|\w*)*) ->)?\s\$((\w*)(\.?)(\w*))*\s?\}\}/gim;
		const res = template.replace(
			regPipes,
			(str, str2, str3, str4, str5, str6) => {
				console.log(str, str2, str3, str4, str5, str6, "LIST");
				const _withPipe = str;
				let variable = str5 as string;
				const pipeStr = str2;
				// Nested Var
				if (isNestedVar(variable)) {
					const splitNested = variable
						.split(".")
						.filter((str) => str.length > 0);
					const fromObject = travers(data, splitNested);
					console.log(fromObject);
					if (isPrimitive(fromObject)) {
						variable = fromObject;
					} else {
						throw new TypeError(
							`${variable} should be primitive type if it is object use dot notation`
						);
					}
				} else {
					if (isExistInObject(variable, data)) {
						if (isPrimitive(data[variable])) {
							variable = data[variable] as string;
						} else {
							throw new TypeError(
								`${variable} should be primitive type if it is object use dot notation`
							);
						}
					} else {
						throw new ReferenceError(`${variable} is not defined in data obj`);
					}
				}

				if (pipeStr) {
					const pipeName = pipeStr.split(".").at(-1).split(" ").at(0);
					// Checks if Pipe more than one
					if (pipeName.includes("|")) {
						const pipesNames = pipeName.split("|") as string[];
						let pipesResult = variable;
						pipesResult = pipesNames.reduce((acc: any, pipeName: string) => {
							if (!this.pipes.has(pipeName)) {
								throw new Error(
									`${pipeName} doesnt exist in pipes pls create this pipe`
								);
							}
							return this.pipes.get(pipeName)!(acc);
						}, pipesResult);
						return pipesResult;
					}
					if (!this.pipes.has(pipeName)) {
						throw new Error(
							`${pipeName} doesnt exist in pipes pls create this pipe`
						);
					}
					if (this.pipes.has(pipeName)) {
						variable = this.pipes.get(pipeName)!(variable);
					}
				}
				return variable;
			}
		);
		return res;
	}

	private pipeProcess() {}
	/**
	 * Parse template string and insert base html templates
	 * Waring! Base template must be not contain include on itself
	 * In the case if it contains method throw the Error
	 * @param {String} template
	 * @returns {String}
	 */
	parseIncludes(template: string): string {
		const reg = /{{ @include \$\w* }}/g;
		const matches = [...template.matchAll(reg)];
		if (matches.length === 0) {
			return template;
		}
		let resulttemplate = "";

		for (const findedInclude of matches) {
			const includeName = findedInclude[0]
				.replace(/\{|\}|\$|(@include)/gm, "")
				.trim();

			const content = this.baseTemplates.get(includeName);
			if (!content) {
				throw new Error(
					`${includeName} doesnt exist in views folder check the file in folder or naming convention name should contains .base.`
				);
			}
			if (content.includes(findedInclude[0])) {
				throw new Error(
					`This template ${includeName} cannot contain a include to itself`
				);
			}
			if (resulttemplate.length === 0) {
				resulttemplate = template.replaceAll(findedInclude[0], content);
			} else {
				resulttemplate = resulttemplate.replaceAll(findedInclude[0], content);
			}
		}
		return this.parseIncludes(resulttemplate);
	}
	/**
	 * Parse if statement from template
	 * @param {String} template
	 * @param {Object} data
	 * @returns {String} template
	 */
	parseIfStatements<T extends Record<string, unknown>>(
		template: string,
		data: T
	): string {
		const regIfstart = /{{\s#if\s(\(.*\))\s}}\s*(.*)\s*{{\s#endif\s}}/gm;
		const matchAllIfStatementsRes = [...template.matchAll(regIfstart)];
		const matchesCount = matchAllIfStatementsRes.length;
		if (matchesCount === 0) {
			return template;
		}
		let globalParseRes = "";
		for (const s of matchAllIfStatementsRes) {
			//
			const fullStatement = s[0];
			const body = s[2];
			//
			const reg = /\((.*)\)/g;
			const regDot = /\w{4}\.(\w*)/g;
			const exp = reg.exec(s)[1];
			const replaced$Exp = exp.replaceAll("$", "data.").trim();
			const allVarsMatch = replaced$Exp.matchAll(regDot);
			let replaceAllVarToValueRes = "";
			for (const match of allVarsMatch) {
				const withDataContext = match[0],
					justVariableName = match[1];

				if (isExistInObject(justVariableName, data)) {
					if (replaceAllVarToValueRes.length === 0) {
						replaceAllVarToValueRes = replaced$Exp.replaceAll(
							withDataContext,
							parseDataType(data[justVariableName] as string)
						);
					} else {
						replaceAllVarToValueRes = replaceAllVarToValueRes.replaceAll(
							withDataContext,
							parseDataType(data[justVariableName] as string)
						);
					}
				} else {
					throw new ReferenceError(
						`No data ${justVariableName} in data object`
					);
				}
			}

			if (eval(replaceAllVarToValueRes)) {
				if (globalParseRes.length === 0) {
					globalParseRes = template.replaceAll(fullStatement, body);
				} else {
					globalParseRes = globalParseRes.replaceAll(fullStatement, body);
				}
			} else {
				if (globalParseRes.length === 0) {
					globalParseRes = template.replaceAll(fullStatement, "");
				} else {
					globalParseRes = globalParseRes.replaceAll(fullStatement, "");
				}
			}
		}
		return globalParseRes;
	}

	/**
	 *
	 * @param {String} template
	 * @param {Object} data
	 * @returns {String}
	 */
	loopExpressinParse<T extends Record<string, unknown>>(
		template: string,
		data: T
	): string {
		const regIfstart = /{{\s#for\s(\(.*\))\s}}(\s*(.*)\s*){{\s#endfor\s}}/gm;
		const matches = [...template.matchAll(regIfstart)];
		const matchesCount = matches.length;
		if (matchesCount === 0) {
			return template;
		}
		let newTemplate = "";

		for (const match of matches) {
			const body = match[2];
			const expression = match[1].replace(/\(|\)/g, "").split(/\sin\s/g);
			const fullstatement = match[0];

			if (!isExistInObject(expression[1], data)) {
				throw new Error(`Undefined ${expression[1]} in data object`);
			}

			if (!isType(data[expression[1]], TypeEnum.array)) {
				throw new TypeError(
					`For statement onlyworks for Array type not for object or primitive types`
				);
			}
			const arr = data[expression[1]] as any[];
			const res = arr.reduce((acc: string, cur: any) => {
				acc += `${body.replace(/{{\s*(\w*)\s*}}/g, cur)}\n`;
				return acc;
			}, "");

			if (newTemplate.length === 0) {
				newTemplate = template.replaceAll(fullstatement, res);
			} else {
				newTemplate = newTemplate.replaceAll(fullstatement, res);
			}
		}
		return newTemplate;
	}

	private format(template: string): string {
		return formatter.format(template);
	}
	render<T extends Record<string, unknown>>(
		templateName: string,
		data: T
	): string {
		const template = this.layoutTemplates.get(templateName);
		if (!template) {
			throw new Error(`${templateName} doesnt exist in the template folder`);
		}
		if (this.options.cache === true) {
			if (this.cache.has(templateName)) {
				const e = this.cache.get(templateName);
				const dataToSting = JSON.stringify(data);
				if (e.has(dataToSting)) {
					console.log("FROM CACHE", e.get(dataToSting));
					return e.get(dataToSting);
				}
			}
		}
		const pipeFn = pipe(template);
		const html = pipeFn(
			(template: string) => this.parseIncludes(template),
			(template: string) => this.parseIfStatements(template, data),
			(template: string) => this.insertData(template, data),
			(template: string) => this.loopExpressinParse(template, data)
		);
		const formatted = this.format(html);
		if (this.options.cache === true) {
			this.cache.set(
				templateName,
				new Map().set(JSON.stringify(data), formatted)
			);
		}
		return formatted;
	}
}
