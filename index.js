import {app, BrowserWindow} from "electron";
import {createPty} from "./src/node-pty.js";
import {startOllama} from "./src/utils/start-ollama.js";
import settings from "./settings.json" with {type: "json"};

let ollamaProcess;
if (settings.llm.isEnabled) ollamaProcess = await startOllama();

const createWindow = () => {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: new URL("./src/preload.js", import.meta.url).pathname,
        },
    });

    if (app.isPackaged) {
        win.loadFile(new URL("./dist/index.html", import.meta.url).pathname);
    } else {
        win.webContents.openDevTools();
        win.loadURL("http://localhost:5173");
    }
    win.webContents.once("did-finish-load", () => createPty(win));
};

app.whenReady().then(() => {
    createWindow();
});

app.on("window-all-closed", () => {
    if (settings.llm.isEnabled) {
        ollamaProcess?.kill();
        console.log("\nKilled Ollama. RIP.");
    }
    app.quit();
});
