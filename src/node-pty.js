import * as os from "node:os";
import * as pty from "node-pty";
import {ipcMain} from "electron";
import settings from "../settings.json" with {type: "json"};
import {createZdotdir} from "./utils/zdotdir.js";

const shell = os.platform() === "win32" ? "powershell.exe" : (process.env.SHELL || "/bin/zsh");

export const createPty = (win) => {
    const promptStr = `%F{${settings.directory_color}}%d ~%f %F{${settings.delimiter_color}}${settings.delimiter_char}%f `;
    const zdotdir = createZdotdir(promptStr);

    const ptyProcess = pty.spawn(shell, [], {
        name: "xterm-color",
        cols: 80,
        rows: 30,
        cwd: process.env.HOME,
        env: {...process.env, ZDOTDIR: zdotdir},
    });

    ptyProcess.onData((data) => win.webContents.send("output", data));

    ipcMain.on("keystroke", (_, data) => ptyProcess.write(data));

    win.on("closed", () => ptyProcess.kill());

    return ptyProcess;
};
