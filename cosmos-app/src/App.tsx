import { useEffect, useRef } from 'react';
import { createSceneController } from './core/SceneController';
import type { EntityInfo } from './core/Entity';
export default function App() {
    const mountRef = useRef<HTMLDivElement>(null), selectRef = useRef<HTMLSelectElement>(null);
    useEffect(() => {
        let entities: EntityInfo[] = [];
        const select = selectRef.current!;
        const controller = createSceneController(mountRef.current!, {
            quality: 'medium', showLabels: true, timeScale: 1, paused: false, darkSideFill: 0.15,
            diagnostics: false, epoch: Date.now() / 1000, showOrbits: true, fiction: true, autoExposure: true, radarButton: null,
            onDate: () => {}, onAssets: () => {}, onError: error => { select.setCustomValidity(error); select.reportValidity(); },
            onEntities: values => { entities = values; select.replaceChildren(new Option('Overview', '')); values.forEach((entity, index) => select.add(new Option(entity.label, String(index)))); },
            onSpeed: () => {}, onLockedInfo: () => {}, onNearest: () => {}, onSystem: () => {}, onLock: () => {},
            onCloseRadar: () => {}, onToggleLabels: () => {}, onToggleHUD: () => {}, onPerformance: () => {},
        });
        select.onchange = () => { if (select.value === '') controller.unlock(); else controller.lock(entities[Number(select.value)]); };
        return () => { select.onchange = null; controller.dispose(); };
    }, []);
    return <><div ref={mountRef} style={{ position: 'fixed', inset: 0 }} /><label style={{ position: 'fixed', top: 16, left: 16, background: '#111d', padding: 16 }}>Destination <select ref={selectRef} aria-label="Destination" /></label></>;
}
