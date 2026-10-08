export interface BodyData {
    radiusKm: number;
    equatorialKm?: number;
    polarKm?: number;
    shapeKm?: [number, number, number];
    fact: string;
    source: string;
    axisKm?: number;
    periodDays?: number;
    parent?: string;
    eccentricity?: number;
}
const nasa = 'https://science.nasa.gov/';
export const BODY_DATA: Record<string, BodyData> = {
    Sun: { radiusKm: 695700, fact: 'A star powered by nuclear fusion, holding most of the Solar System’s mass.', source: `${nasa}sun/` },
    Mercury: { radiusKm: 2439.7, axisKm: 57909050, periodDays: 87.97, parent: 'Sun', eccentricity: 0.206, fact: 'The smallest planet and the closest to the Sun.', source: `${nasa}mercury/` },
    Venus: { radiusKm: 6051.8, axisKm: 108208000, periodDays: 224.7, parent: 'Sun', eccentricity: 0.007, fact: 'Its dense atmosphere traps heat, making it the hottest planet.', source: `${nasa}venus/` },
    Earth: { equatorialKm: 6378.137, polarKm: 6356.752, radiusKm: 6371, axisKm: 149597870.7, periodDays: 365.25, parent: 'Sun', eccentricity: 0.017, fact: 'The only world currently known to support life.', source: `${nasa}earth/` },
    Mars: { equatorialKm: 3396.19, polarKm: 3376.2, radiusKm: 3389.5, axisKm: 227939200, periodDays: 687, parent: 'Sun', eccentricity: 0.093, fact: 'Iron minerals in its surface give the planet its red appearance.', source: `${nasa}mars/` },
    Jupiter: { equatorialKm: 71492, polarKm: 66854, radiusKm: 69911, axisKm: 778570000, periodDays: 4333, parent: 'Sun', eccentricity: 0.048, fact: 'The largest planet, with a long-lived storm called the Great Red Spot.', source: `${nasa}jupiter/` },
    Saturn: { equatorialKm: 60268, polarKm: 54364, radiusKm: 58232, axisKm: 1433530000, periodDays: 10759, parent: 'Sun', eccentricity: 0.054, fact: 'Its bright rings contain countless pieces of ice and rock.', source: `${nasa}saturn/` },
    Uranus: { equatorialKm: 25559, polarKm: 24973, radiusKm: 25362, axisKm: 2872460000, periodDays: 30687, parent: 'Sun', eccentricity: 0.047, fact: 'This ice giant rotates on its side.', source: `${nasa}uranus/` },
    Neptune: { equatorialKm: 24764, polarKm: 24341, radiusKm: 24622, axisKm: 4495060000, periodDays: 60190, parent: 'Sun', eccentricity: 0.009, fact: 'An ice giant with powerful winds and a methane-rich blue atmosphere.', source: `${nasa}neptune/` },
    Pluto: { radiusKm: 1188.3, axisKm: 5906380000, periodDays: 90560, parent: 'Sun', eccentricity: 0.248, fact: 'A dwarf planet in the Kuiper Belt with a large moon, Charon.', source: `${nasa}dwarf-planets/pluto/` },
    Moon: { radiusKm: 1737.4, axisKm: 384400, periodDays: 27.32, parent: 'Earth', eccentricity: 0.0549, fact: 'Earth’s natural satellite keeps approximately the same face toward Earth.', source: `${nasa}moon/` },
    Io: { radiusKm: 1821.6, axisKm: 421700, periodDays: 1.769, parent: 'Jupiter', eccentricity: 0.0041, fact: 'Tidal heating makes Io the most volcanically active world in the Solar System.', source: `${nasa}jupiter/moons/io/` },
    Europa: { radiusKm: 1560.8, axisKm: 671100, periodDays: 3.551, parent: 'Jupiter', eccentricity: 0.009, fact: 'Its icy surface likely covers a salty ocean.', source: `${nasa}jupiter/moons/europa/` },
    Ganymede: { radiusKm: 2634.1, axisKm: 1070400, periodDays: 7.155, parent: 'Jupiter', eccentricity: 0.0013, fact: 'The largest moon in the Solar System, larger than Mercury.', source: `${nasa}jupiter/moons/ganymede/` },
    Callisto: { radiusKm: 2410.3, axisKm: 1882700, periodDays: 16.689, parent: 'Jupiter', eccentricity: 0.0074, fact: 'An ancient, heavily cratered moon of Jupiter.', source: `${nasa}jupiter/moons/callisto/` },
    Titan: { radiusKm: 2574.7, axisKm: 1221870, periodDays: 15.945, parent: 'Saturn', eccentricity: 0.0288, fact: 'A thick atmosphere and lakes of liquid methane distinguish this moon.', source: `${nasa}saturn/moons/titan/` },
    Enceladus: { radiusKm: 252.1, axisKm: 238040, periodDays: 1.370, parent: 'Saturn', eccentricity: 0.0047, fact: 'Icy plumes escape from a subsurface ocean near its south pole.', source: `${nasa}saturn/moons/enceladus/` },
    Charon: { radiusKm: 606, axisKm: 19596, periodDays: 6.387, parent: 'Pluto', eccentricity: 0, fact: 'Pluto and Charon orbit a shared centre of mass outside Pluto.', source: `${nasa}dwarf-planets/pluto/moons/charon/` },
    Phobos: { radiusKm: 11.08, axisKm: 9376, periodDays: 0.31891, parent: 'Mars', eccentricity: 0.0151, fact: 'An irregular moon slowly spiralling inward toward Mars.', source: 'https://science.nasa.gov/mars/moons/', shapeKm: [13.4, 11.2, 9.2] },
    Deimos: { radiusKm: 6.2, axisKm: 23463, periodDays: 1.26244, parent: 'Mars', eccentricity: 0.00033, fact: 'The smaller and more distant of Mars’s two moons.', source: 'https://science.nasa.gov/mars/moons/', shapeKm: [7.5, 6.1, 5.5] },
    Mimas: { radiusKm: 198.2, axisKm: 185539, periodDays: 0.94242, parent: 'Saturn', eccentricity: 0.0196, fact: 'A small icy moon with the enormous Herschel impact crater.', source: 'https://science.nasa.gov/saturn/moons/' },
    Tethys: { radiusKm: 531.1, axisKm: 294619, periodDays: 1.8878, parent: 'Saturn', eccentricity: 0.0001, fact: 'An icy moon with a giant impact basin.', source: 'https://science.nasa.gov/saturn/moons/' },
    Dione: { radiusKm: 561.4, axisKm: 377396, periodDays: 2.7369, parent: 'Saturn', eccentricity: 0.0022, fact: 'An icy moon with bright fractures across its trailing hemisphere.', source: 'https://science.nasa.gov/saturn/moons/' },
    Rhea: { radiusKm: 763.8, axisKm: 527108, periodDays: 4.5182, parent: 'Saturn', eccentricity: 0.001, fact: 'Saturn’s second-largest moon.', source: 'https://science.nasa.gov/saturn/moons/' },
    Iapetus: { radiusKm: 734.5, axisKm: 3560820, periodDays: 79.3215, parent: 'Saturn', eccentricity: 0.0286, fact: 'A distant moon with strikingly different bright and dark hemispheres.', source: 'https://science.nasa.gov/saturn/moons/' },
    Miranda: { radiusKm: 235.8, axisKm: 129390, periodDays: 1.4135, parent: 'Uranus', eccentricity: 0.0013, fact: 'A small moon with dramatic cliffs and fractured terrain.', source: 'https://science.nasa.gov/uranus/moons/' },
    Ariel: { radiusKm: 578.9, axisKm: 191020, periodDays: 2.5204, parent: 'Uranus', eccentricity: 0.0012, fact: 'An icy moon crossed by valleys and canyons.', source: 'https://science.nasa.gov/uranus/moons/' },
    Umbriel: { radiusKm: 584.7, axisKm: 266300, periodDays: 4.1442, parent: 'Uranus', eccentricity: 0.0039, fact: 'A dark, heavily cratered Uranian moon.', source: 'https://science.nasa.gov/uranus/moons/' },
    Titania: { radiusKm: 788.9, axisKm: 435910, periodDays: 8.7059, parent: 'Uranus', eccentricity: 0.0011, fact: 'Uranus’s largest moon.', source: 'https://science.nasa.gov/uranus/moons/' },
    Oberon: { radiusKm: 761.4, axisKm: 583520, periodDays: 13.4632, parent: 'Uranus', eccentricity: 0.0014, fact: 'The outermost of Uranus’s five major moons.', source: 'https://science.nasa.gov/uranus/moons/' },
    Triton: { radiusKm: 1353.4, axisKm: 354759, periodDays: 5.87685, parent: 'Neptune', eccentricity: 2e-05, fact: 'A captured icy world orbiting Neptune in the retrograde direction.', source: 'https://science.nasa.gov/neptune/moons/' },
    Ceres: { radiusKm: 469.7, axisKm: 413690000, periodDays: 1681.63, parent: 'Sun', eccentricity: 0.079, fact: 'The largest object in the main asteroid belt and a dwarf planet.', source: 'https://science.nasa.gov/dwarf-planets/ceres/' },
    Eris: { radiusKm: 1163, axisKm: 10125000000, periodDays: 203830, parent: 'Sun', eccentricity: 0.44, fact: 'A distant dwarf planet with the moon Dysnomia.', source: 'https://science.nasa.gov/dwarf-planets/eris/' },
    Haumea: { radiusKm: 798, axisKm: 6464000000, periodDays: 103774, parent: 'Sun', eccentricity: 0.19, fact: 'A rapidly spinning, elongated dwarf planet.', source: 'https://science.nasa.gov/dwarf-planets/haumea/', shapeKm: [1161, 852, 513] },
    Makemake: { radiusKm: 715, axisKm: 6839000000, periodDays: 112897, parent: 'Sun', eccentricity: 0.16, fact: 'An icy dwarf planet in the Kuiper Belt.', source: 'https://science.nasa.gov/dwarf-planets/makemake/' },
    Halley: { radiusKm: 5.5, shapeKm: [7.5, 4, 4], axisKm: 2671744916.96224, periodDays: 27568, parent: 'Sun', eccentricity: 0.9680289680972473, fact: 'A periodic comet with a highly eccentric, retrograde orbit. The nucleus is shown; its changing coma and tails are not modelled.', source: 'https://science.nasa.gov/solar-system/comets/1p-halley/' },
};
