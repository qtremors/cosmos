import { expect, test } from '@playwright/test';

test('Strict Mode owns one animation loop and radar survives HUD toggles', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error' && message.text().includes('THREE.WebGLProgram')) errors.push(message.text()); });
    await page.addInitScript(() => {
        const pending = new Map<number, string>();
        Object.defineProperty(window, '__pendingFrames', { value: pending });
        const request = window.requestAnimationFrame.bind(window);
        const cancel = window.cancelAnimationFrame.bind(window);
        window.requestAnimationFrame = callback => {
            const id = request(now => { pending.delete(id); callback(now); });
            pending.set(id, callback.name);
            return id;
        };
        window.cancelAnimationFrame = id => { pending.delete(id); cancel(id); };
    });
    await page.goto('/');
    const radar = page.locator('.radar-blip');
    await expect.poll(() => radar.count()).toBeGreaterThan(40);
    const count = await radar.count();
    const loops = await page.evaluate(() => [...(window as Window & { __pendingFrames: Map<number, string> }).__pendingFrames.values()].filter(name => name === 'frame').length);
    expect(loops).toBe(1);
    await expect(page.locator('.stats-hud-value').first()).toHaveText('0 km/s');
    await page.keyboard.press('h');
    await expect(page.locator('.hud-layer')).toBeHidden();
    await page.keyboard.press('h');
    await expect(page.locator('.hud-layer')).toBeVisible();
    await expect(radar).toHaveCount(count);
    expect(errors).toEqual([]);
});

test('keyboard navigation and search do not teleport the camera', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Explore objects and settings' }).click();
    await expect(page.getByRole('button', { name: 'Close objects and settings' })).toBeFocused();
    await page.keyboard.press('Tab');
    const search = page.getByRole('searchbox', { name: 'Find an object' });
    await expect(search).toBeFocused();
    await search.fill('earth');
    await expect(page.getByRole('button', { name: 'Earth', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Mars', exact: true })).toHaveCount(0);
    await expect(page.locator('.stats-hud-title')).toHaveText('🚀 Free Flight');
    await page.getByRole('button', { name: 'Earth', exact: true }).click();
    await expect(page.locator('.stats-hud-title')).toHaveText('Locked: Earth');
    await expect(page.locator('canvas')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.locator('.stats-hud-title')).toHaveText('🚀 Free Flight');
});

test('quality selection persists without rebuilding the scene', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Explore objects and settings' }).click();
    const canvas = await page.locator('canvas').elementHandle();
    await page.getByRole('button', { name: 'Low', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Low', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(() => page.evaluate(() => localStorage.getItem('cosmos-quality'))).toBe('low');
    expect(await canvas?.evaluate(node => node.isConnected)).toBe(true);
    await page.reload();
    await page.getByRole('button', { name: 'Explore objects and settings' }).click();
    await expect(page.getByRole('button', { name: 'Low', exact: true })).toHaveAttribute('aria-pressed', 'true');
});

test('mobile panels fit the viewport and settings remain reachable', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.getByRole('button', { name: 'Explore objects and settings' }).click();
    for (const selector of ['.navigation-panels', '.radar-panel', '.settings-panel-inline']) {
        const bounds = await page.locator(selector).boundingBox();
        expect(bounds).not.toBeNull();
        expect(bounds!.x).toBeGreaterThanOrEqual(0);
        expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390);
    }
    await page.getByRole('button', { name: 'Low', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Low', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: 'Close objects and settings' }).click();
    await expect(page.getByRole('button', { name: 'Explore objects and settings' })).toBeFocused();
    await page.getByRole('button', { name: 'Explore objects and settings' }).click();
    await page.getByRole('button', { name: 'Earth', exact: true }).click();
    await expect(page.locator('.object-info')).toHaveCount(0);
    await page.getByRole('button', { name: 'Object information', exact: true }).click();
    await expect(page.locator('.object-info')).toContainText('Source: NASA Science');
    const infoBounds = (await page.locator('.object-info').boundingBox())!;
    const flightBounds = (await page.getByRole('button', { name: 'Fly forward', exact: true }).boundingBox())!;
    expect(infoBounds.y + infoBounds.height).toBeLessThanOrEqual(flightBounds.y);
    await page.getByRole('button', { name: 'Close object information', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Object information', exact: true })).toBeVisible();
});

test('texture failures have a visible retry path', async ({ page }) => {
    let failed = true;
    await page.route('**/textures/2k_mercury.jpg', route => failed ? route.abort('failed') : route.continue());
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Retry loading' })).toBeVisible();
    failed = false;
    await page.getByRole('button', { name: 'Retry loading' }).click();
    await expect(page.getByRole('button', { name: 'Retry loading' })).toHaveCount(0);
    await expect(page.locator('canvas')).toBeVisible();
});

test('distant cosmic models are deferred and all Quantumania models load on selection', async ({ page }) => {
    test.setTimeout(120_000);
    const models: string[] = [];
    page.on('request', request => { if (request.url().endsWith('.glb')) models.push(request.url()); });
    await page.addInitScript(() => localStorage.setItem('cosmos-quality', 'low'));
    await page.goto('/?profile=1');
    await expect(page.locator('.asset-status')).toHaveCount(0);
    expect(models).toEqual([]);
    await page.getByRole('button', { name: 'Explore objects and settings' }).click();
    await expect(page.getByRole('button', { name: 'Fictional extras', exact: true })).toHaveAttribute('aria-pressed', 'true');
    for (const name of ['Arishem (Cosmic Entity)', 'Explorer', 'The Kyln', 'Alien X', 'Black Hole']) await expect(page.getByRole('button', { name, exact: true })).toBeAttached();
    await page.getByRole('button', { name: 'Quantumania', exact: true }).click();
    await expect.poll(() => models.some(url => url.endsWith('/Cube.glb'))).toBe(true);
    await expect.poll(async () => {
        const text = await page.locator('[data-performance]').textContent();
        return text ? JSON.parse(text).residentModels : 0;
    }, { timeout: 90_000 }).toBe(26);
    expect(models.some(url => url.endsWith('/Arishem.glb'))).toBe(false);
    await expect(page.getByRole('button', { name: 'Retry loading' })).toHaveCount(0);
});

test('losing focus clears a movement key even without keyup', async ({ page }) => {
    await page.goto('/');
    await page.locator('canvas').focus();
    await page.keyboard.down('w');
    await expect.poll(() => page.locator('.stats-hud-value').first().innerText()).not.toBe('0 km/s');
    await page.evaluate(() => window.dispatchEvent(new Event('blur')));
    await expect(page.locator('.stats-hud-value').first()).toHaveText('0 km/s');
    await page.keyboard.up('w');
});

test('black-hole top view compiles at low shader quality', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error' && message.text().includes('THREE.WebGLProgram')) errors.push(message.text()); });
    await page.goto('/');
    await page.getByRole('button', { name: 'Explore objects and settings' }).click();
    await page.getByRole('button', { name: 'Low', exact: true }).click();
    await page.getByRole('button', { name: 'Black Hole', exact: true }).click();
    await expect(page.locator('.stats-hud-title')).toHaveText('Locked: Black Hole');
    await page.keyboard.press('t');
    await expect(page.locator('canvas')).toBeVisible();
    expect(errors).toEqual([]);
});

test('moons show their parent reference and sourced physical facts', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Explore objects and settings' }).click();
    for (const name of ['Io', 'Ganymede', 'Callisto', 'Enceladus']) await expect(page.getByRole('button', { name, exact: true })).toBeAttached();
    await page.getByRole('button', { name: 'Moon', exact: true }).click();
    await expect(page.locator('.stats-hud-title')).toHaveText('Locked: Moon');
    await expect(page.locator('.stats-hud')).toContainText('From Earth:');
    await expect(page.locator('.object-info')).toContainText('27.32 Earth days');
    await expect(page.getByRole('link', { name: 'Source: NASA Science' })).toHaveAttribute('href', 'https://science.nasa.gov/moon/');
    await expect(page.locator('.stats-hud')).not.toContainText('From Sun:');
});

test('touch flight releases on pointer cancellation and zoom is available', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/?profile=1');
    const forward = page.getByRole('button', { name: 'Fly forward', exact: true });
    await expect(forward).toBeVisible();
    await page.mouse.move((await forward.boundingBox())!.x + 10, (await forward.boundingBox())!.y + 10);
    await page.mouse.down();
    await expect.poll(() => page.locator('.stats-hud-value').first().innerText()).not.toBe('0 km/s');
    await forward.dispatchEvent('pointercancel', { pointerId: 1 });
    await page.mouse.up();
    await expect(page.locator('.stats-hud-value').first()).toHaveText('0 km/s');
    const zoom = page.getByRole('button', { name: 'Zoom in', exact: true });
    await expect(zoom).toBeVisible();
    const positionBeforeZoom = JSON.parse((await page.locator('[data-performance]').textContent())!).cameraPosition;
    const zoomBounds = (await zoom.boundingBox())!;
    await page.mouse.move(zoomBounds.x + zoomBounds.width / 2, zoomBounds.y + zoomBounds.height / 2);
    await page.mouse.down();
    await expect.poll(async () => JSON.parse((await page.locator('[data-performance]').textContent())!).cameraPosition).not.toEqual(positionBeforeZoom);
    await page.mouse.up();
    await page.getByRole('button', { name: 'Close performance' }).click();
    await expect(page.getByRole('button', { name: 'Roll left', exact: true })).toBeVisible();
});

test('pause freezes scene time while camera flight remains available', async ({ page }) => {
    await page.goto('/?profile=1');
    await expect(page.locator('[data-performance]')).toBeAttached();
    await page.getByRole('button', { name: 'Explore objects and settings' }).click();
    await page.getByRole('button', { name: '⏸ Pause', exact: true }).click();
    await page.getByRole('button', { name: 'Close objects and settings' }).click();
    const profile = () => page.locator('[data-performance]').textContent().then(text => JSON.parse(text!));
    await expect.poll(async () => (await profile()).samples).toBeGreaterThan(20);
    const first = await profile();
    await page.locator('canvas').focus();
    await page.keyboard.down('w');
    await expect.poll(async () => (await profile()).cameraPosition).not.toEqual(first.cameraPosition);
    await page.keyboard.up('w');
    expect((await profile()).simulationTime).toBe(first.simulationTime);
});

test('separate render passes isolate solar light from quantum materials', async ({ page }) => {
    await page.goto('/');
    const result = await page.evaluate(async () => {
        // Load the same runtime modules through Vite for a small real WebGL regression scene.
        const modulePath = '/src/core/SystemRenderer.ts';
        const rendererModule = await import(/* @vite-ignore */ modulePath);
        const threePath = '/node_modules/.vite/deps/three.js';
        const THREE = await import(/* @vite-ignore */ threePath);
        const renderer = new THREE.WebGLRenderer({ preserveDrawingBuffer: true }); renderer.setSize(32, 32);
        const root = new THREE.Scene(); root.background = new THREE.Color(0);
        const camera = new THREE.OrthographicCamera(-2, 2, 1, -1, 0.1, 10); camera.position.z = 3;
        const light = new THREE.DirectionalLight(0xff0000, 0); light.position.z = 2;
        const geometry = new THREE.PlaneGeometry(0.8, 0.8);
        const left = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: 0xffffff })); left.position.x = -1;
        const right = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: 0xffffff })); right.position.x = 1;
        const world = new rendererModule.SystemRenderer(root, [left, light], [right, new THREE.AmbientLight(0xffffff, 1)], []);
        const read = (x: number) => { const pixel = new Uint8Array(4); const gl = renderer.getContext(); gl.readPixels(x, 16, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel); return [...pixel]; };
        world.render(renderer, camera, true, true); const darkSolar = read(8), quantumBefore = read(24);
        light.intensity = 5;
        world.render(renderer, camera, true, true); const litSolar = read(8), quantumAfter = read(24);
        geometry.dispose(); left.material.dispose(); right.material.dispose(); renderer.dispose(); renderer.forceContextLoss();
        return { darkSolar, litSolar, quantumBefore, quantumAfter };
    });
    expect(result.litSolar[0]).toBeGreaterThan(result.darkSolar[0] + 50);
    expect(result.quantumBefore[0]).toBeGreaterThan(50);
    expect(result.quantumAfter).toEqual(result.quantumBefore);
});

test('scientific view includes added real bodies and keeps a tiny moon in physical scale across date changes', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('cosmos-quality', 'low'));
    await page.goto('/?profile=1');
    await page.getByRole('button', { name: 'Explore objects and settings' }).click();
    await page.getByRole('button', { name: 'Fictional extras', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Fictional extras', exact: true })).toHaveAttribute('aria-pressed', 'false');
    await expect(page.getByRole('button', { name: 'Quantumania', exact: true })).toHaveCount(0);
    for (const name of ['Phobos', 'Deimos', 'Rhea', 'Iapetus', 'Titania', 'Triton', 'Ceres', 'Eris', 'Haumea', 'Makemake', 'Halley', 'Kuiper Belt']) {
        await expect(page.getByRole('button', { name, exact: true })).toBeAttached();
    }
    await page.getByRole('button', { name: '⏸ Pause', exact: true }).click();
    await page.getByLabel('Simulation date UTC').fill('2026-10-08T00:00');
    await page.getByRole('button', { name: 'Phobos', exact: true }).click();
    await expect(page.locator('.simulation-date')).toContainText('2026-10-08 00:00:00');
    const distance = async () => {
        const data = JSON.parse((await page.locator('[data-performance]').textContent())!);
        if (!data.lockedTargetPosition) return Infinity;
        return Math.hypot(...data.cameraPosition.map((value: number, index: number) => value - data.lockedTargetPosition[index])) * 149597870.7 / 200;
    };
    await expect.poll(distance).toBeGreaterThan(25);
    await expect.poll(distance).toBeLessThan(50);
    await expect.poll(async () => JSON.parse((await page.locator('[data-performance]').textContent())!).cameraNear).toBeLessThan(0.000001);
    await page.getByRole('button', { name: 'Explore objects and settings' }).click();
    await page.getByLabel('Simulation date UTC').fill('2026-10-10T00:00');
    await page.getByRole('button', { name: 'Close objects and settings' }).click();
    await expect(page.locator('.simulation-date')).toContainText('2026-10-10 00:00:00');
    await expect.poll(distance).toBeLessThan(50);
    await expect(page.locator('.stats-hud')).toContainText('From Mars:');
});

test('accelerated ephemeris keeps the camera close to Earth and viewing aids can be disabled', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error' && message.text().includes('THREE.WebGLProgram')) errors.push(message.text()); });
    await page.addInitScript(() => localStorage.setItem('cosmos-quality', 'low'));
    await page.goto('/?profile=1');
    await page.getByRole('button', { name: 'Explore objects and settings' }).click();
    await page.getByRole('button', { name: 'Orbit guides', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Orbit guides', exact: true })).toHaveAttribute('aria-pressed', 'false');
    await page.getByRole('button', { name: '1 Day/s', exact: true }).click();
    await page.getByRole('button', { name: 'Earth', exact: true }).click();
    const read = async () => JSON.parse((await page.locator('[data-performance]').textContent())!);
    await expect.poll(async () => (await read()).lockedTargetPosition).not.toBeNull();
    const first = await read();
    await expect.poll(async () => (await read()).simulationTime).toBeGreaterThan(first.simulationTime + 86400);
    const data = await read();
    const distanceKm = Math.hypot(...data.cameraPosition.map((value: number, index: number) => value - data.lockedTargetPosition[index])) * 149597870.7 / 200;
    expect(distanceKm).toBeGreaterThan(18000);
    expect(distanceKm).toBeLessThan(21000);
    await page.getByRole('button', { name: 'Explore objects and settings' }).click();
    await page.getByRole('button', { name: 'Automatic exposure', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Automatic exposure', exact: true })).toHaveAttribute('aria-pressed', 'false');
    await page.getByRole('button', { name: 'Close objects and settings' }).click();
    await page.getByRole('button', { name: 'Close performance', exact: true }).click();
    await page.keyboard.press('l');
    await page.keyboard.press('h');
    await expect(page.locator('.hud-layer')).toBeHidden();
    expect(errors).toEqual([]);
});

test('Arishem remains discoverable by default and loads its actual model system on selection', async ({ page }) => {
    test.setTimeout(120_000);
    const errors: string[] = [];
    const models: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error' && message.text().includes('THREE.WebGLProgram')) errors.push(message.text()); });
    page.on('request', request => { if (request.url().endsWith('.glb')) models.push(request.url()); });
    await page.addInitScript(() => localStorage.setItem('cosmos-quality', 'low'));
    await page.goto('/?profile=1');
    await page.getByRole('button', { name: 'Explore objects and settings' }).click();
    await page.getByRole('button', { name: 'Arishem (Cosmic Entity)', exact: true }).click();
    await expect(page.locator('.stats-hud-title')).toHaveText('Locked: Arishem (Cosmic Entity)');
    await expect.poll(async () => {
        const text = await page.locator('[data-performance]').textContent();
        return text ? JSON.parse(text).residentModels : 0;
    }, { timeout: 90_000 }).toBe(7);
    expect(models.some(url => url.endsWith('/Arishem.glb'))).toBe(true);
    expect(models.some(url => url.endsWith('/Cube.glb'))).toBe(false);
    await expect(page.getByRole('button', { name: 'Retry loading' })).toHaveCount(0);
    expect(errors).toEqual([]);
});
