import ivm from "isolated-vm";
import { readFile } from "node:fs/promises";
import { setTimeout } from "node:timers/promises";
import { URL } from "node:url";

const code = await readFile(new URL("../extension.js", import.meta.url), "utf8");

const isolate = new ivm.Isolate({ memoryLimit: 128 });

const context = await isolate.createContext();

await context.global.set(
	"exec",
	new ivm.Callback(
		async (type: string, ...args: unknown[]) => {
			console.log(type, ...args);

			if (type === "log") {
				console.log(`Sent log: `, ...args);
				return;
			}

			if (type === "read-item") {
				await setTimeout(1000);
				return "rijks-output";
			}

			throw new Error(`Type "${type}" doesn't exist.`);
		},
		{ async: true }
	), { promise: true }
);

const module = await isolate.compileModule(code);

try {
	await module.instantiate(context, () => {
		throw new Error("Importing modules is not allowed.");
	});

	await module.evaluate({ promise: true });

	const reference = module.namespace;

	const defaultExport = await reference.get("default", { reference: true });

	await defaultExport.apply(null, ["rijks-input"], { result: { promise: true }});

	console.log("Script done running");
} catch (err) {
	console.error(err);
}
