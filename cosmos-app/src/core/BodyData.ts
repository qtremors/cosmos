export interface BodyData {
    radiusKm: number;
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
    Earth: { radiusKm: 6371, axisKm: 149597870.7, periodDays: 365.25, parent: 'Sun', eccentricity: 0.017, fact: 'The only world currently known to support life.', source: `${nasa}earth/` },
    Mars: { radiusKm: 3389.5, axisKm: 227939200, periodDays: 687, parent: 'Sun', eccentricity: 0.093, fact: 'Iron minerals in its surface give the planet its red appearance.', source: `${nasa}mars/` },
    Jupiter: { radiusKm: 69911, axisKm: 778570000, periodDays: 4333, parent: 'Sun', eccentricity: 0.048, fact: 'The largest planet, with a long-lived storm called the Great Red Spot.', source: `${nasa}jupiter/` },
    Saturn: { radiusKm: 58232, axisKm: 1433530000, periodDays: 10759, parent: 'Sun', eccentricity: 0.054, fact: 'Its bright rings contain countless pieces of ice and rock.', source: `${nasa}saturn/` },
    Uranus: { radiusKm: 25362, axisKm: 2872460000, periodDays: 30687, parent: 'Sun', eccentricity: 0.047, fact: 'This ice giant rotates on its side.', source: `${nasa}uranus/` },
    Neptune: { radiusKm: 24622, axisKm: 4495060000, periodDays: 60190, parent: 'Sun', eccentricity: 0.009, fact: 'An ice giant with powerful winds and a methane-rich blue atmosphere.', source: `${nasa}neptune/` },
    Pluto: { radiusKm: 1188.3, axisKm: 5906380000, periodDays: 90560, parent: 'Sun', eccentricity: 0.248, fact: 'A dwarf planet in the Kuiper Belt with a large moon, Charon.', source: `${nasa}dwarf-planets/pluto/` },
    Moon: { radiusKm: 1737.4, axisKm: 384400, periodDays: 27.32, parent: 'Earth', eccentricity: 0.0549, fact: 'Earth’s natural satellite keeps approximately the same face toward Earth.', source: `${nasa}moon/` },
    Io: { radiusKm: 1821.6, axisKm: 421700, periodDays: 1.769, parent: 'Jupiter', eccentricity: 0.0041, fact: 'Tidal heating makes Io the most volcanically active world in the Solar System.', source: `${nasa}jupiter/moons/io/` },
    Europa: { radiusKm: 1560.8, axisKm: 671100, periodDays: 3.551, parent: 'Jupiter', eccentricity: 0.009, fact: 'Its icy surface likely covers a salty ocean.', source: `${nasa}jupiter/moons/europa/` },
    Ganymede: { radiusKm: 2634.1, axisKm: 1070400, periodDays: 7.155, parent: 'Jupiter', eccentricity: 0.0013, fact: 'The largest moon in the Solar System, larger than Mercury.', source: `${nasa}jupiter/moons/ganymede/` },
    Callisto: { radiusKm: 2410.3, axisKm: 1882700, periodDays: 16.689, parent: 'Jupiter', eccentricity: 0.0074, fact: 'An ancient, heavily cratered moon of Jupiter.', source: `${nasa}jupiter/moons/callisto/` },
    Titan: { radiusKm: 2574.7, axisKm: 1221870, periodDays: 15.945, parent: 'Saturn', eccentricity: 0.0288, fact: 'A thick atmosphere and lakes of liquid methane distinguish this moon.', source: `${nasa}saturn/moons/titan/` },
    Enceladus: { radiusKm: 252.1, axisKm: 238040, periodDays: 1.370, parent: 'Saturn', eccentricity: 0.0047, fact: 'Icy plumes escape from a subsurface ocean near its south pole.', source: `${nasa}saturn/moons/enceladus/` },
    Charon: { radiusKm: 606, axisKm: 19596, periodDays: 6.387, parent: 'Pluto', eccentricity: 0, fact: 'Pluto and Charon orbit a shared centre of mass outside Pluto.', source: `${nasa}dwarf-planets/pluto/moons/charon/` },
};
