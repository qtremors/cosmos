import * as THREE from 'three';
import { SceneAssets } from './SceneAssets';
import { Cosmos } from './SDK';
import { SystemManager, SystemId } from './SystemManager';
import { EntityCategory, type EntityInfo } from './Entity';
import { SystemRenderer } from './SystemRenderer';
import { installSolarOcclusion } from './SolarOcclusion';
import { BODY_DATA } from './BodyData';
import { DwarfPlanet } from '../objects/solar/DwarfPlanet';
import { Sun } from '../objects/solar/Sun';
import { Stars } from '../objects/Stars';
import { Mercury } from '../objects/solar/Mercury';
import { Venus } from '../objects/solar/Venus';
import { Earth } from '../objects/solar/Earth';
import { Mars } from '../objects/solar/Mars';
import { Jupiter } from '../objects/solar/Jupiter';
import { Saturn } from '../objects/solar/Saturn';
import { Uranus } from '../objects/solar/Uranus';
import { Neptune } from '../objects/solar/Neptune';
import { AsteroidBelt } from '../objects/solar/AsteroidBelt';
import { OrbitPath } from '../objects/common/OrbitPath';
import { Pluto } from '../objects/solar/Pluto';
import { Heliosphere } from '../objects/common/Heliosphere';
import { Explorer } from '../objects/solar/Explorer';
import { TheKyln } from '../objects/solar/TheKyln';
import { AlienX } from '../objects/AlienX';
import { BlackHole } from '../objects/BlackHole';
import { QuantumaniaSystem } from '../objects/quantumania/QuantumaniaSystem';
import { CosmicEntity } from '../objects/CosmicEntity';

/** Builds independently lit systems; all resources are owned by the scene controller. */
export function createWorld(scene: THREE.Scene, assets: SceneAssets) {
    const sunLight = new THREE.PointLight(
        Cosmos.LIGHTING.SUN_COLOR,
        Cosmos.LIGHTING.SUN_INTENSITY * Cosmos.UNITS.AU ** 2,
        0, 2
    );
    sunLight.position.set(0, 0, 0);
    sunLight.castShadow = false;
    sunLight.shadow.mapSize.width = 512;
    sunLight.shadow.mapSize.height = 512;
    sunLight.shadow.bias = -0.00001;
    sunLight.layers.set(1);
    scene.add(sunLight);

    const ambientLight = new THREE.AmbientLight(Cosmos.LIGHTING.AMBIENT_COLOR, Cosmos.LIGHTING.AMBIENT_INTENSITY);
    ambientLight.layers.enableAll();
    scene.add(ambientLight);

    // =====================================================================
    // OBJECTS
    // =====================================================================

    // 1. SOLAR SYSTEM (Layer 1)
    const sun = new Sun(Cosmos.UNITS.SOLAR_RADIUS, assets);
    sun.layers.set(1);
    scene.add(sun);

    const stars = new Stars(8000, 100000);
    scene.add(stars);

    const mercury = new Mercury(assets);
    mercury.layers.set(1);
    mercury.traverse(c => c.layers.set(1));
    scene.add(mercury);

    const venus = new Venus(assets);
    venus.layers.set(1);
    venus.traverse(c => c.layers.set(1));
    scene.add(venus);

    const earth = new Earth(assets);
    earth.layers.set(1);
    earth.traverse(c => c.layers.set(1));
    scene.add(earth);

    const mars = new Mars(assets);
    mars.layers.set(1);
    mars.traverse(c => c.layers.set(1));
    scene.add(mars);

    const jupiter = new Jupiter(assets);
    jupiter.layers.set(1);
    jupiter.traverse(c => c.layers.set(1));
    scene.add(jupiter);

    const saturn = new Saturn(assets);
    saturn.layers.set(1);
    saturn.traverse(c => c.layers.set(1));
    scene.add(saturn);

    const uranus = new Uranus(assets);
    uranus.layers.set(1);
    uranus.traverse(c => c.layers.set(1));
    scene.add(uranus);

    const neptune = new Neptune(assets);
    neptune.layers.set(1);
    neptune.traverse(c => c.layers.set(1));
    scene.add(neptune);

    const pluto = new Pluto(assets);
    pluto.layers.set(1);
    pluto.traverse(c => c.layers.set(1));
    scene.add(pluto);

    const belt = new AsteroidBelt();
    belt.layers.set(1);
    scene.add(belt);

    const kuiperBelt = new AsteroidBelt(30 * Cosmos.UNITS.AU, 50 * Cosmos.UNITS.AU, 500, 50);
    kuiperBelt.traverse(child => child.layers.set(1)); scene.add(kuiperBelt);

    const explorer = new Explorer();
    explorer.layers.set(1);
    explorer.traverse(c => c.layers.set(1));
    scene.add(explorer);

    const theKyln = new TheKyln('The Kyln');
    theKyln.layers.set(1);
    theKyln.traverse(c => c.layers.set(1));
    scene.add(theKyln);

    // HELIOSPHERE - Solar System boundary (Layer 1)
    const solarHeliosphere = new Heliosphere(
        SystemManager.SOLAR_SYSTEM_RADIUS,
        SystemManager.SOLAR_SYSTEM_COLOR,
        SystemManager.SOLAR_SYSTEM_CENTER,
        SystemId.SOLAR_SYSTEM
    );
    solarHeliosphere.layers.set(1);
    solarHeliosphere.traverse(c => c.layers.set(1));
    scene.add(solarHeliosphere);

    const createSolarBeacon = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.clearRect(0, 0, 64, 64);
            const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
            g.addColorStop(0, 'rgba(255, 200, 50, 1)');
            g.addColorStop(0.2, 'rgba(255, 200, 50, 0.6)');
            g.addColorStop(1, 'rgba(255, 200, 50, 0)');
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, 64, 64);
        }
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({
            map: texture,
            color: 0xffcc33,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            depthTest: false,
        });
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(600, 600, 1);
        sprite.visible = false;
        return sprite;
    };
    const solarBeacon = createSolarBeacon();
    scene.add(solarBeacon);

    const quantumania = new QuantumaniaSystem(assets);
    quantumania.layers.set(2);
    quantumania.traverse(c => c.layers.set(2));
    scene.add(quantumania);

    // ORBIT PATHS (Layer 1)
    const dwarfPlanets = [new DwarfPlanet('Ceres', 0x99918a), new DwarfPlanet('Eris', 0xebe7df), new DwarfPlanet('Haumea', 0xd7d2c4), new DwarfPlanet('Makemake', 0xb9a08b), new DwarfPlanet('Halley', 0x6c6560)];
    for (const dwarf of dwarfPlanets) { dwarf.traverse(child => child.layers.set(1)); scene.add(dwarf); }
    const orbitPaths = ['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto', ...dwarfPlanets.map(dwarf => dwarf.name)].map(name => new OrbitPath(name));
    orbitPaths.forEach(path => {
        path.layers.set(1);
        scene.add(path);
    });

    const alienX = new AlienX(assets);
    alienX.layers.set(1);
    alienX.traverse(c => c.layers.set(1));
    scene.add(alienX);

    const blackHole = new BlackHole();
    blackHole.layers.set(1);
    blackHole.traverse(c => c.layers.set(1));
    scene.add(blackHole);

    const cosmicEntity = new CosmicEntity(assets);
    scene.add(cosmicEntity);


    const solarSystemEntities: EntityInfo[] = [
        { mesh: sun, id: 'sun-blip', color: Cosmos.RADAR.COLORS.SUN, label: 'Sun', radius: Cosmos.UNITS.SOLAR_RADIUS * 4, system: SystemId.SOLAR_SYSTEM, category: EntityCategory.STAR },
        { mesh: mercury, id: 'mercury-blip', color: Cosmos.RADAR.COLORS.MERCURY, label: 'Mercury', radius: 10, system: SystemId.SOLAR_SYSTEM, category: EntityCategory.PLANET },
        { mesh: venus, id: 'venus-blip', color: Cosmos.RADAR.COLORS.VENUS, label: 'Venus', radius: 15, system: SystemId.SOLAR_SYSTEM, category: EntityCategory.PLANET },
        { mesh: earth, id: 'earth-blip', color: Cosmos.RADAR.COLORS.EARTH, label: 'Earth', radius: 15, system: SystemId.SOLAR_SYSTEM, category: EntityCategory.PLANET },
        { mesh: earth.moon, id: 'moon-blip', color: Cosmos.RADAR.COLORS.MOON, label: 'Moon', radius: 5, system: SystemId.SOLAR_SYSTEM, category: EntityCategory.MOON },
        { mesh: mars, id: 'mars-blip', color: Cosmos.RADAR.COLORS.MARS, label: 'Mars', radius: 12, system: SystemId.SOLAR_SYSTEM, category: EntityCategory.PLANET },
        { mesh: belt, id: 'belt-blip', color: '#888888', label: 'Asteroid Belt', radius: 100, system: SystemId.SOLAR_SYSTEM, category: EntityCategory.ASTEROID },
        { mesh: jupiter, id: 'jupiter-blip', color: Cosmos.RADAR.COLORS.JUPITER, label: 'Jupiter', radius: 40, system: SystemId.SOLAR_SYSTEM, category: EntityCategory.PLANET },
        { mesh: jupiter.europa, id: 'europa-blip', color: '#fff', label: 'Europa', radius: 5, system: SystemId.SOLAR_SYSTEM, category: EntityCategory.MOON },
        { mesh: saturn, id: 'saturn-blip', color: Cosmos.RADAR.COLORS.SATURN, label: 'Saturn', radius: 35, system: SystemId.SOLAR_SYSTEM, category: EntityCategory.PLANET },
        { mesh: saturn.titan, id: 'titan-blip', color: '#e6d4be', label: 'Titan', radius: 6, system: SystemId.SOLAR_SYSTEM, category: EntityCategory.MOON },
        { mesh: uranus, id: 'uranus-blip', color: Cosmos.RADAR.COLORS.URANUS, label: 'Uranus', radius: 25, system: SystemId.SOLAR_SYSTEM, category: EntityCategory.PLANET },
        { mesh: neptune, id: 'neptune-blip', color: Cosmos.RADAR.COLORS.NEPTUNE, label: 'Neptune', radius: 25, system: SystemId.SOLAR_SYSTEM, category: EntityCategory.PLANET },
        { mesh: pluto, id: 'pluto-blip', color: Cosmos.RADAR.COLORS.PLUTO, label: 'Pluto', radius: 8, system: SystemId.SOLAR_SYSTEM, category: EntityCategory.DWARF_PLANET },
        { mesh: pluto.charon, id: 'charon-blip', color: '#8a8a8a', label: 'Charon', radius: 4, system: SystemId.SOLAR_SYSTEM, category: EntityCategory.MOON },
        // Physical data and source attribution are maintained in BodyData.
        { mesh: explorer, id: 'explorer-blip', color: '#00aaff', label: 'Explorer', radius: 5, system: SystemId.SOLAR_SYSTEM, category: EntityCategory.EASTER_EGG },
        { mesh: theKyln, id: 'kyln-blip', color: '#4488cc', label: 'The Kyln', radius: 8, system: SystemId.SOLAR_SYSTEM, category: EntityCategory.EASTER_EGG },
        // Solar System Proxy (only visible from afar)
        { mesh: sun, id: 'solar-proxy-blip', color: '#fc3', label: 'Solar System', radius: Cosmos.UNITS.SOLAR_RADIUS * 10, system: SystemId.SOLAR_SYSTEM, isSystemProxy: true, category: EntityCategory.PROXY },
    ];

    for (const entity of solarSystemEntities) {
        const data = BODY_DATA[entity.label];
        if (data) entity.radius = 'radius' in entity.mesh ? Number(entity.mesh.radius) : Cosmos.UNITS.SOLAR_RADIUS;
        if (entity.label === 'Saturn') entity.radius = Cosmos.PLANETS.SATURN.RING.OUTER_RADIUS;
        if (entity.isSystemProxy) entity.radius = 4000;
    }
    const extraMoons = [...mars.moons, ...jupiter.moons.filter(moon => moon !== jupiter.europa), ...saturn.moons.filter(moon => moon !== saturn.titan), ...uranus.moons, ...neptune.moons];
    for (const moon of extraMoons) {
        solarSystemEntities.push({ mesh: moon, id: `${moon.name.toLowerCase()}-blip`, label: moon.name, color: '#ddd', radius: moon.radius, system: SystemId.SOLAR_SYSTEM, category: EntityCategory.MOON });
    }
    for (const dwarf of dwarfPlanets) solarSystemEntities.push({ mesh: dwarf, id: `${dwarf.name.toLowerCase()}-blip`, label: dwarf.name, color: '#bcb4a3', radius: dwarf.radius, system: SystemId.SOLAR_SYSTEM, category: dwarf.name === 'Halley' ? EntityCategory.COMET : EntityCategory.DWARF_PLANET });

    solarSystemEntities.push({ mesh: kuiperBelt, id: 'kuiper-blip', label: 'Kuiper Belt', color: '#869ca8', radius: 3500, system: SystemId.SOLAR_SYSTEM, category: EntityCategory.ASTEROID });

    const interstellarEntities: EntityInfo[] = [
        { mesh: alienX, id: 'alienX-blip', color: '#00ff00', label: 'Alien X', radius: 10, system: SystemId.INTERSTELLAR, category: EntityCategory.EASTER_EGG },
        { mesh: blackHole, id: 'blackhole-blip', color: '#ff6600', label: 'Black Hole', radius: 100, system: SystemId.INTERSTELLAR, category: EntityCategory.EASTER_EGG },
        // Target the HEAD for lock/radar
        // Increased radius (1500) to keep camera at a safe distance from the massive model
        { mesh: cosmicEntity.head, id: 'architect-blip', color: '#00ffff', label: 'Arishem (Cosmic Entity)', radius: 1500, system: SystemId.INTERSTELLAR, category: EntityCategory.EASTER_EGG },
    ];

    // QUANTUMANIA ENTITIES
    const quantumaniaEntities: EntityInfo[] = quantumania.getEntities();
    // Add Quantumania Proxy (Nexus as target)
    const nexusMountain = quantumania.nexus; // Nexus is the main target
    quantumaniaEntities.push({
        mesh: nexusMountain,
        id: 'quantumania-proxy-blip',
        color: '#bb88ff',
        label: 'Quantumania',
        radius: 200,
        system: SystemId.QUANTUMANIA,
        isSystemProxy: true,
        category: EntityCategory.PROXY
    });

    // Each real body's direct sunlight can be eclipsed by its parent or major moons.
    const physical = solarSystemEntities.filter(entity => BODY_DATA[entity.label]);
    for (const entity of physical) {
        if (entity.label === 'Sun') continue;
        const data = BODY_DATA[entity.label];
        const occluders = entity.category === EntityCategory.MOON
            ? physical.filter(candidate => candidate.label === data.parent).map(candidate => ({ mesh: candidate.mesh, radius: Number((candidate.mesh as THREE.Object3D & { radius: number }).radius) }))
            : physical.filter(candidate => BODY_DATA[candidate.label].parent === entity.label).map(candidate => ({ mesh: candidate.mesh, radius: candidate.radius }));
        entity.mesh.traverse(mesh => {
            if (!(mesh instanceof THREE.Mesh) || mesh.userData.orbit) return;
            // Moon meshes themselves are handled below, not again through their parent.
            const ringOccluders = mesh.geometry instanceof THREE.RingGeometry ? [{ mesh: entity.mesh, radius: Number((entity.mesh as THREE.Object3D & { radius: number }).radius) }] : occluders;
            installSolarOcclusion(mesh, ringOccluders);
        });
        if (entity.mesh instanceof THREE.Mesh) installSolarOcclusion(entity.mesh, occluders);
    }

    const solarAmbient = new THREE.AmbientLight(0xffffff, 0);
    const quantumAmbient = new THREE.AmbientLight(0xffffff, 0.25);
    const renderWorld = new SystemRenderer(scene,
        [sunLight, solarAmbient, sun, mercury, venus, earth, mars, jupiter, saturn, uranus, neptune, pluto, ...dwarfPlanets, belt, kuiperBelt, explorer, theKyln, solarHeliosphere, ...orbitPaths],
        [quantumania, quantumAmbient],
        [ambientLight, stars, solarBeacon, alienX, blackHole, cosmicEntity]);

    const entities = [...solarSystemEntities, ...quantumaniaEntities, ...interstellarEntities];
    return {
        sun, stars, mercury, venus, earth, mars, jupiter, saturn, uranus, neptune, pluto,
        belt, kuiperBelt, dwarfPlanets, explorer, theKyln, solarHeliosphere, solarBeacon, quantumania, orbitPaths,
        alienX, blackHole, cosmicEntity, renderWorld, entities,
    };
}
