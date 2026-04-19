import ps from "ps-node";
import { spawn } from "node:child_process";

export const startOllama = () => {
	ps.lookup(
		{
			command: "ollama",
			psargs: "ux",
		},
		function (err, resultList) {
			if (err) {
				throw new Error(err);
			}

			let found = false;
			resultList.forEach(function (process) {
				if (process) {
					found = true;
					console.log(`Ollama process found: ${process.pid}`);
					ps.kill(process.pid, () => {
						console.log("Killed " + process.pid);
					});
				}
			});
			if (!found) console.log("Ollama is not running. Starting now.");
			const proc = spawn("ollama", ["serve"], {
				stdio: "ignore", // "ignore" to silence console output
			});
			return proc;
		},
	);
};
