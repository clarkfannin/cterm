import ps from "ps-node";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";

const CANDIDATE_PATHS = [
	"/opt/homebrew/bin/ollama",
	"/usr/local/bin/ollama",
	"/Applications/Ollama.app/Contents/Resources/ollama",
];

const resolveOllamaBin = () => CANDIDATE_PATHS.find(existsSync) ?? "ollama";

export const startOllama = () =>
	new Promise((resolve, reject) => {
		ps.lookup({ command: "ollama", psargs: "ux" }, (err, resultList) => {
			if (err) return reject(new Error(err));

			if (resultList.some(Boolean)) {
				console.log("Ollama already running, reusing existing process.");
				return resolve(null);
			}

			console.log("Ollama is not running. Starting now.");
			const bin = resolveOllamaBin();
			const child = spawn(bin, ["serve"], { stdio: "ignore" });
			child.on("error", (e) => {
				console.error(`Failed to start ollama (${bin}):`, e.message);
			});
			resolve(child);
		});
	});