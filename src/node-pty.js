import * as os from "node:os";
import * as pty from "node-pty";
import { ipcMain } from "electron";

const shell = os.platform() === "win32" ? "powershell.exe" : (process.env.SHELL || "/bin/zsh");

export const createPty = (win) => {
	const ptyProcess = pty.spawn(shell, [], {
		name: "xterm-color",
		cols: 80,
		rows: 30,
		cwd: process.env.HOME,
		env: {
			...process.env,
			PROMPT: "%F{red}%1~%f %F{yellow}➜%f ",
		},
	});

	ptyProcess.onData((data) => win.webContents.send("output", data));

	ipcMain.on("keystroke", (_, data) => ptyProcess.write(data));

	win.on("closed", () => ptyProcess.kill());

	return ptyProcess;
};
