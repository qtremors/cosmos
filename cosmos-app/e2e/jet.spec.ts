import { expect, test } from '@playwright/test';

test('pilots a ship with thrust, banking, momentum and braking after panel clicks', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error' && message.text().includes('THREE.WebGLProgram')) errors.push(message.text()); });
    await page.addInitScript(() => localStorage.setItem('cosmos-quality', 'low'));
    await page.goto('/');
    await page.getByRole('button', { name: 'Fly jet', exact: true }).click();
    await expect(page.locator('.stats-hud-title')).toHaveText('Jet flight');
    await expect(page.getByRole('button', { name: 'Engage FTL', exact: true })).toHaveCount(0);
    await expect(page.locator('.jet-controls')).toContainText('20 m');
    await expect(page.locator('.jet-controls')).not.toContainText('Loading jet');
    await expect(page.getByRole('button', { name: 'Retry loading' })).toHaveCount(0);
    await expect(page.locator('.stats-hud-value').first()).toHaveText('0 km/s');
    await page.getByRole('button', { name: 'Collapse jet controls', exact: true }).click();
    // Panel clicks must not disable the shared input actions.
    await page.keyboard.down('w');
    await expect.poll(async () => parseFloat(await page.locator('.flight-speed .stats-hud-value').innerText())).toBeGreaterThan(0.1);
    await expect.poll(async () => parseFloat(await page.locator('.flight-throttle .stats-hud-value').innerText())).toBeGreaterThan(20);
    await expect.poll(async () => parseFloat(await page.locator('.flight-speed .stats-hud-value').innerText())).toBeGreaterThan(90);
    expect(parseFloat(await page.locator('.flight-speed .stats-hud-value').innerText())).toBeLessThanOrEqual(100);
    await page.keyboard.up('w');
    await page.screenshot({ path: 'test-results/jet-true-size.png' });
    const marker = page.locator('#sun-blip');
    const left = await marker.evaluate(element => parseFloat(element.style.left));
    await page.keyboard.down('a');
    await expect.poll(async () => Math.abs(await marker.evaluate(element => parseFloat(element.style.left)) - left)).toBeGreaterThan(4);
    await expect.poll(async () => parseFloat(await page.locator('.flight-speed .stats-hud-value').innerText())).toBeGreaterThan(0.1);
    await page.screenshot({ path: 'test-results/jet-banking.png' });
    await page.keyboard.up('a');
    await page.keyboard.down('s');
    await expect(page.locator('.flight-speed .stats-hud-value')).toHaveText('0 km/s');
    await expect(page.locator('.flight-throttle .stats-hud-value')).toHaveText('0%');
    await page.keyboard.up('s');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'Fly jet', exact: true })).toBeVisible();
    await page.keyboard.press('j');
    await expect(page.getByRole('button', { name: 'Exit jet', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Explore objects and settings' }).click();
    await page.getByRole('button', { name: 'Earth', exact: true }).click();
    await expect(page.locator('.stats-hud-title')).toHaveText('Locked: Earth');
    await expect(page.locator('.nearest-object')).toContainText('Earth');
    await expect(page.locator('.nearest-distance')).toContainText('km');
    await expect(page.getByRole('button', { name: 'Fly jet', exact: true })).toBeVisible();
    expect(errors).toEqual([]);
});

test('adds speed with Shift, holds it on release and brakes to normal cruise before stopping', async ({ page }) => {
    await page.addInitScript(() => {
        localStorage.setItem('cosmos-quality', 'low');
        localStorage.setItem('cosmos-preferences', JSON.stringify({ version: 1, jetScale: 100_000_000 }));
    });
    await page.goto('/');
    await page.getByRole('button', { name: 'Fly jet', exact: true }).click();
    await expect(page.locator('.jet-controls')).not.toContainText('Loading jet');
    await expect(page.locator('.jet-controls input')).toHaveCount(0);
    await expect(page.locator('.jet-flight-hint')).toContainText('20 m jet');
    await page.getByRole('button', { name: 'Collapse jet controls', exact: true }).click();
    await page.keyboard.down('Shift');
    await expect.poll(async () => parseFloat(await page.locator('.flight-speed .stats-hud-value').innerText())).toBeGreaterThan(3000);
    await page.keyboard.up('Shift');
    const speed = page.locator('.flight-speed .stats-hud-value');
    // Wait for two telemetry frames to establish that the speed is held.
    await page.waitForFunction(() => new Promise(resolve => {
        let previous = '', stable = 0;
        const timer = setInterval(() => {
            const current = document.querySelector('.flight-speed .stats-hud-value')?.textContent ?? '';
            stable = current === previous ? stable + 1 : 0;
            previous = current;
            if (stable >= 2) { clearInterval(timer); resolve(true); }
        }, 200);
    }));
    const held = parseFloat(await speed.innerText());
    await page.screenshot({ path: 'test-results/jet-cruise.png' });
    await expect(speed).toHaveText(`${held} km/s`);
    for (let tap = 0; tap < 5; tap++) await page.keyboard.press('Shift');
    await expect.poll(async () => parseFloat(await speed.innerText())).toBeGreaterThan(held + 4500);
    await page.keyboard.down('s');
    await expect(speed).toHaveText('100 km/s');
    await page.keyboard.up('s');
    await page.keyboard.down('s');
    await expect(speed).toHaveText('0 km/s');
    await page.keyboard.up('s');
});

test('uses reasonable camera cruise and holds accumulated Shift speed until S slows it', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('cosmos-quality', 'low'));
    await page.goto('/');
    await expect(page.locator('.canvas-container canvas')).toBeVisible();
    await page.locator('.canvas-container canvas').focus();
    const speed = page.locator('.flight-speed .stats-hud-value');
    await page.keyboard.down('w');
    await expect(speed).toHaveText('100 km/s');
    await page.keyboard.up('w');
    await expect(speed).toHaveText('0 km/s');
    for (let tap = 0; tap < 5; tap++) await page.keyboard.press('Shift');
    await expect.poll(async () => parseFloat(await speed.innerText())).toBeGreaterThanOrEqual(5100);
    await page.keyboard.down('s');
    await expect(speed).toHaveText('100 km/s');
    await page.keyboard.up('s');
    await expect(speed).toHaveText('100 km/s');
    await page.screenshot({ path: 'test-results/camera-cruise.png' });
});

test('uses shared touch actions for ship thrust and braking and retries a failed jet request', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(() => localStorage.setItem('cosmos-quality', 'low'));
    let failed = true;
    await page.route('**/models/Jet.glb', route => failed ? route.abort('failed') : route.continue());
    await page.goto('/');
    await page.getByRole('button', { name: 'Fly jet', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Retry loading' })).toBeVisible();
    failed = false;
    await page.getByRole('button', { name: 'Retry loading' }).click();
    await expect(page.getByRole('button', { name: 'Retry loading' })).toHaveCount(0);
    await expect(page.locator('.jet-controls')).not.toContainText('Jet unavailable');
    await expect(page.locator('.nearest-object')).toBeVisible();
    await expect(page.locator('.nearest-distance')).toBeVisible();
    await expect(page.locator('.nearest-distance')).toContainText('km');
    await expect(page.locator('.nearest-distance-hint')).toBeVisible();
    const controls = await page.locator('.touch-controls').boundingBox();
    const panel = await page.locator('.jet-controls').boundingBox();
    expect(panel!.y + panel!.height).toBeLessThanOrEqual(controls!.y);
    expect(panel!.y).toBeGreaterThan(844 * 0.64);
    const forward = page.getByRole('button', { name: 'Jet thrust', exact: true });
    await forward.dispatchEvent('pointerdown', { pointerId: 1 });
    await expect.poll(async () => parseFloat(await page.locator('.flight-speed .stats-hud-value').innerText())).toBeGreaterThan(0.1);
    await forward.dispatchEvent('pointercancel', { pointerId: 1 });
    const boost = page.getByRole('button', { name: 'Boost flight', exact: true });
    await boost.dispatchEvent('pointerdown', { pointerId: 1 });
    await expect.poll(async () => parseFloat(await page.locator('.flight-speed .stats-hud-value').innerText())).toBeGreaterThan(2000);
    await boost.dispatchEvent('pointerup', { pointerId: 1 });
    await page.screenshot({ path: 'test-results/jet-cruise-mobile.png' });
    const brake = page.getByRole('button', { name: 'Brake jet', exact: true });
    await brake.dispatchEvent('pointerdown', { pointerId: 1 });
    await expect(page.locator('.stats-hud-value').first()).toHaveText('100 km/s');
    await brake.dispatchEvent('pointerup', { pointerId: 1 });
    await brake.dispatchEvent('pointerdown', { pointerId: 1 });
    await expect(page.locator('.stats-hud-value').first()).toHaveText('0 km/s');
    await brake.dispatchEvent('pointerup', { pointerId: 1 });
    await page.getByRole('button', { name: 'Roll left', exact: true }).dispatchEvent('pointerdown', { pointerId: 1 });
    await page.getByRole('button', { name: 'Roll left', exact: true }).dispatchEvent('pointerup', { pointerId: 1 });
    await page.screenshot({ path: 'test-results/jet-mobile.png' });
    expect(errors).toEqual([]);
});
