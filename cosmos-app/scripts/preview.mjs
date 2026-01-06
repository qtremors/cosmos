import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { spawn } from 'node:child_process';

/** Invoke Vite through Node directly, without an npm shell shim or extra process tree. */
export function previewCommand() {
    const require = createRequire(import.meta.url);
    const manifest = require.resolve('vite/package.json');
    const bin = JSON.parse(readFileSync(manifest, 'utf8')).bin.vite;
    return { command: process.execPath, args: [resolve(dirname(manifest), bin), 'preview', '--host', '127.0.0.1', '--port', '5174', '--strictPort'] };
}

export function startPreview() {
    const { command, args } = previewCommand();
    return spawn(command, args, { stdio: 'ignore', windowsHide: true });
}
