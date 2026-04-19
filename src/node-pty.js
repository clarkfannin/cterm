import * as os from "node:os";
import * as fs from "node:fs";
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

    let cwd = process.env.HOME;
    ptyProcess.onData((data) => {
        // OSC 7 escape sequence - CWD
        const m = data.match(/\x1b\]7;file:\/\/([^\x1b\x07]+)/);
        if (m) cwd = decodeURIComponent(m[1]);
        win.webContents.send("output", data);
    });

    ipcMain.on("keystroke", (_, data) => ptyProcess.write(data));
    ipcMain.handle("list-cwd", () => {
        try {
            return fs.readdirSync(cwd);
        } catch {
            return [];
        }
    });

    win.on("closed", () => ptyProcess.kill());

    return ptyProcess;
};
