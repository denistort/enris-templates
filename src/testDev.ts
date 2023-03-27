import { EnrisTemplates } from "./EnrisTemplates/EnrisTemplates";
import { join } from "path";

const main = async (): Promise<void> => {
	const dataSecond = {
		variable: "Шляпа",
		parse: 1000,
		array: ["denis", "sexys", "big"],
		object: {
			wewe: "Дерьмо",
		},
		sexyGuys: {
			weqwzc: "sdasdasd",
		},
	};
	
	const templater = new EnrisTemplates({ cache: true });
	const viewsPath = join(__dirname, "../", "views");
	
	await templater.init(viewsPath);

	templater.addPipe("toUpperCase", (v: string) => v.toUpperCase());
	templater.addPipe("toLowerCase", (v: string) => v.toLowerCase());
	templater.addPipe(
		"toFirstUpper",
		(v: string) => v.at(0)?.toLocaleUpperCase() + v.substring(1).toLowerCase()
	);

	console.log(templater.render("index", dataSecond));
};
main();
