import ps from "ps-node";
import { spawn } from "node:child_process";

export const startOllama = () =>
	new Promise((resolve, reject) => {
		ps.lookup({ command: "ollama", psargs: "ux" }, (err, resultList) => {
			if (err) return reject(new Error(err));

			let found = false;
			resultList.forEach((process) => {
				if (process) {
					found = true;
					console.log(`Ollama process found: ${process.pid}`);
					ps.kill(process.pid, () => {
						console.log("Killed " + process.pid);
					});
				}
			});
			if (!found) console.log("Ollama is not running. Starting now.");
			resolve(spawn("ollama", ["serve"], { stdio: "ignore" }));
		});
	});
