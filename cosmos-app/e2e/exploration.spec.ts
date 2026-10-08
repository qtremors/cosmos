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

test('hidden cosmic models are deferred and Quantumania models load on selection', async ({ page }) => {
    const models: string[] = [];
    page.on('request', request => { if (request.url().endsWith('.glb')) models.push(request.url()); });
    await page.goto('/');
    await expect(page.locator('.asset-status')).toHaveCount(0);
    expect(models).toEqual([]);
    await page.getByRole('button', { name: 'Explore objects and settings' }).click();
    await page.getByRole('button', { name: 'Quantumania', exact: true }).click();
    await expect.poll(() => models.some(url => url.endsWith('/Cube.glb'))).toBe(true);
    await expect.poll(() => models.length).toBeGreaterThan(1);
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
