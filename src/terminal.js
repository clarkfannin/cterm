import {Terminal} from "@xterm/xterm";
import "@xterm/xterm/css/xterm.css";
import {debounce} from "./utils/debounce.js";
import settings from "../settings.json" with {type: "json"};
import {trie} from "./trie.js";

const term = new Terminal(settings.xterm_theme);
term.open(document.getElementById("xtermContainer"));

const fetchLLMSuggestions = async (query) => {
    const res = await fetch("http://127.0.0.1:11434/api/generate", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            model: settings.llm.model,
            prompt: `<|fim_prefix|>${query}<|fim_suffix|><|fim_middle|>`,
            stream: false,
            options: {
                temperature: 0.1,
                num_predict: 5,
                stop: [
                    "\n",
                    "<|endoftext|>",
                    "<|fim_prefix|>",
                    "<|fim_suffix|>",
                    "<|fim_middle|>",
                ],
            },
        }),
    });
    const {response} = await res.json();
    return response;
};

const loadTrieCommands = async () => {
    // get commands from txt
    const res = await fetch("./commands.txt");
    const text = await res.text();
    const commands = text.split("\n");

    // insert into trie
    commands.forEach((command) => trie.insert(command));
};
await loadTrieCommands();
const fetchTrieSuggestions = async (input) => {
    const suggestions = trie.search(input);
    return suggestions[0]?.slice(input.length);
};

const debouncedLLMFetch = debounce(
    fetchLLMSuggestions,
    settings.debounce.delay,
);
const debouncedTrieFetch = debounce(
    fetchTrieSuggestions,
    settings.debounce.delay,
);

let line = "";
let currentSuggestion = "";
let requestId = 0;

const hexToAnsi = (hex) => {
    let h = hex.replace("#", "");
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    const n = parseInt(h, 16);
    return `\x1b[38;2;${(n >> 16) & 255};${(n >> 8) & 255};${n & 255}m`;
};
const ghostColor = hexToAnsi(settings.autocomplete_color.hex_color);

const renderSuggestion = (suggestion) => {
    currentSuggestion = suggestion || "";
    if (!currentSuggestion) return;
    term.write(
        `\x1b[K${ghostColor}${currentSuggestion}\x1b[0m\x1b[${currentSuggestion.length}D`,
    );
};

term.onData((data) => {
    // ctrl-c / ctrl-u / ctrl-w
    if (data === "\x03" || data === "\x15" || data === "\x17") {
        if (currentSuggestion) {
            term.write("\x1b[K");
            currentSuggestion = "";
        }
        line = "";
        window.electron.send("keystroke", data);
        return;
    }

    // enter
    if (data === "\r") {
        if (currentSuggestion) {
            term.write("\x1b[K"); // clear ghost text from cursor to end of line
            currentSuggestion = "";
        }
        line = "";
        window.electron.send("keystroke", data);
        return;
    }

    // backspace
    if (data === "\x7f") {
        if (currentSuggestion) {
            term.write("\x1b[K");
            currentSuggestion = "";
        }
        line = line.slice(0, -1);
        window.electron.send("keystroke", data);
        return;
    }

    // tab
    if (data === "\t" && currentSuggestion) {
        window.electron.send("keystroke", currentSuggestion);
        line += currentSuggestion;
        currentSuggestion = "";
        return;
    }

    window.electron.send("keystroke", data);

    line += data;

    const myId = ++requestId;
    const fetcher = settings.llm.isEnabled
        ? settings.debounce.isEnabled
            ? debouncedLLMFetch
            : fetchLLMSuggestions
        : settings.debounce.isEnabled
            ? debouncedTrieFetch
            : fetchTrieSuggestions;

    Promise.resolve(fetcher(line)).then((suggestion) => {
        if (myId !== requestId) return;
        renderSuggestion(suggestion);
    });
});

window.electron.on("output", (data) => {
    term.write(data);
});
