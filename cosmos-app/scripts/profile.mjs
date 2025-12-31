import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { platform, arch, cpus } from 'node:os';

// Run against the production preview. Use PROFILE_BASE_URL to profile an existing deployment.
const baseURL = process.env.PROFILE_BASE_URL ?? 'http://127.0.0.1:5174';
const preview = process.env.PROFILE_BASE_URL ? null : spawn('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', '5174', '--strictPort'], { stdio: 'ignore' });
let browser;
try {
    for (let attempt = 0; attempt < 100; attempt++) {
        if (preview?.exitCode !== null && preview?.exitCode !== undefined) throw new Error('Production preview exited. Run npm run build first.');
        try { if ((await fetch(baseURL)).ok) break; } catch { /* Preview is starting. */ }
        if (attempt === 99) throw new Error('Preview did not start');
        await new Promise(resolve => setTimeout(resolve, 200));
    }
    browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH, args: ['--enable-unsafe-swiftshader'] });
    const measurements = [];
    const sampleCount = Number(process.env.PROFILE_SAMPLES ?? 60);
    const read = page => page.locator('[data-performance]').textContent().then(text => JSON.parse(text));
    const settle = async page => {
        await page.waitForFunction(sampleCount => {
            const data = document.querySelector('[data-performance]')?.textContent;
            return data && JSON.parse(data).samples >= sampleCount;
        }, sampleCount, { timeout: 90_000 });
    };
    if (!process.env.PROFILE_SYSTEM) for (const viewport of [{ width: 1280, height: 720 }, { width: 390, height: 844 }]) {
        for (const quality of ['low', 'medium', 'high']) {
            const context = await browser.newContext({ viewport, deviceScaleFactor: viewport.width < 600 ? 2 : 1, hasTouch: viewport.width < 600 });
            await context.addInitScript(quality => {
                localStorage.setItem('cosmos-quality', quality);
                let seed = 12345;
                Math.random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
            }, quality);
            const page = await context.newPage();
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            page.on('console', message => { if (message.type() === 'error' && message.text().includes('THREE.WebGLProgram')) errors.push(message.text()); });
            await page.goto(`${baseURL}/?profile=1`);
            await page.locator('.asset-status').waitFor({ state: 'hidden', timeout: 90_000 });
            await settle(page);
            const gpu = await page.locator('canvas').evaluate(canvas => {
                const gl = canvas.getContext('webgl2');
                const debug = gl?.getExtension('WEBGL_debug_renderer_info');
                return debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : 'Unavailable';
            });
            const sample = { scenario: 'solar-overview', viewport, quality, gpu, errors, ...(await read(page)) };
            measurements.push(sample);
            if (errors.length) throw new Error(`Overview errors: ${errors.join('; ')}`);
            console.log(`${viewport.width}px ${quality}: p95 ${sample.frameMsP95} ms, shadow estimate ${sample.estimatedShadowMiB} MiB`);
            await context.close();
        }
    }
    // Exercise actual model files, eviction and reloading in each model area.
    const areas = process.env.PROFILE_SYSTEM === 'cosmic' ? [['Arishem (Cosmic Entity)', 7, 'cosmic']] : [['Quantumania', 26, 'quantum'], ['Arishem (Cosmic Entity)', 7, 'cosmic']];
    for (const [destination, count, area] of areas) {
        const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
        await context.addInitScript(() => localStorage.setItem('cosmos-quality', 'low'));
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        page.on('console', message => { if (message.type() === 'error' && message.text().includes('THREE.WebGLProgram')) errors.push(message.text()); });
        await page.goto(`${baseURL}/?profile=1`);
        await settle(page);
        measurements.push({ scenario: `travel-${area}-before`, errors: [...errors], ...(await read(page)) });
        const visit = async () => {
            await page.getByRole('button', { name: 'Explore objects and settings' }).click();
            const fiction = page.getByRole('button', { name: 'Fictional extras', exact: true });
            if (await fiction.getAttribute('aria-pressed') === 'false') await fiction.click();
            await page.getByRole('button', { name: destination, exact: true }).click();
            await page.waitForFunction(count => {
                const data = document.querySelector('[data-performance]')?.textContent;
                return data && JSON.parse(data).residentModels === count;
            }, count, { timeout: 180_000 });
        };
        await visit();
        measurements.push({ scenario: `travel-${area}-loaded`, errors: [...errors], ...(await read(page)) });
        console.log(`${destination}: loaded ${count} models`);
        await page.keyboard.press('Home');
        await page.waitForFunction(() => {
            const data = document.querySelector('[data-performance]')?.textContent;
            return data && JSON.parse(data).residentModels === 0;
        }, null, { timeout: 180_000 });
        measurements.push({ scenario: `travel-${area}-evicted`, errors: [...errors], ...(await read(page)) });
        console.log(`${destination}: evicted models`);
        await visit();
        measurements.push({ scenario: `travel-${area}-reloaded`, errors: [...errors], ...(await read(page)) });
        console.log(`${destination}: reloaded ${count} models`);
        if (errors.length) throw new Error(`${destination}: ${errors.join('; ')}`);
        await context.close();
    }
    const result = {
        recordedAt: new Date().toISOString(), platform: platform(), architecture: arch(), cpu: cpus()[0]?.model,
        browser: browser.version(), note: 'Headless browser measurements on the named renderer. Mobile viewport emulation is not physical phone or integrated GPU validation. Memory values are estimates, not total GPU usage.', measurements,
    };
    const output = resolve(process.env.PROFILE_OUTPUT ?? 'test-results/performance.json');
    await mkdir(resolve(output, '..'), { recursive: true });
    await writeFile(output, JSON.stringify(result, null, 2) + '\n');
    console.log(`Saved ${output}`);
} finally {
    await browser?.close();
    preview?.kill('SIGTERM');
}
