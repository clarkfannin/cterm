import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

export const createZdotdir = (prompt) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cterm-"));
    fs.writeFileSync(
        path.join(dir, ".zshrc"),
        `[ -f "$HOME/.zshrc" ] && source "$HOME/.zshrc"\nPROMPT='${prompt}'\n`,
    );
    return dir;
};