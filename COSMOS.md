# Cosmos Scientific Model

> Physical scale, reference frames, astronomical sources, and accuracy limits.

**Last Updated:** 2026-10-20

## Scale and time

Cosmos uses physical geometry in a **heliocentric, J2000 ecliptic frame**. The Sun is the coordinate origin. One astronomical unit is 200 render units; one unit is 747,989.3535 km. This single conversion applies to body radii, moon spacing, ring radii, and orbital positions. Sizes are not enlarged independently. Earth’s equatorial radius is about 0.00853 render units, compared with an orbital radius near 200.

The simulation opens at the current UTC date at real-time speed. Settings accepts dates between 1900 and 2100, provides a Now button, and offers faster rates. The astronomical clock advances using active wall time, including slow frames, while camera integration uses a bounded frame delta. Hidden tabs suspend advancement. Pause freezes both astronomical and decorative clocks, but a deliberate date change still recomputes the model. The selected body stays at the same camera distance as it moves, including under accelerated time or a date jump.

## Motion and reference frames

[Astronomy Engine 2.1.19](https://github.com/cosinekitty/astronomy) provides geometric positions and velocity vectors for all eight planets and Pluto, the Moon, and the four Galilean moons. Its models include perturbations and are more accurate than isolated Kepler ellipses. These are simultaneous positions, without observer light-time or aberration corrections. Coordinates are converted from J2000 equatorial to J2000 ecliptic and then to the renderer’s right-handed axes: X = ecliptic X, Y = ecliptic north, Z = negative ecliptic Y.

The other moons, dwarf planets, and Halley use [JPL Horizons](https://ssd.jpl.nasa.gov/horizons/) osculating elements at **JD 2461321.5 TDB (2026-10-08 00:00 TDB)**. Elements and rates are stored in `cosmos-app/src/core/SmallBodyElements.json`. Kepler’s equation is solved using mean anomaly, eccentricity, inclination, ascending node, and argument of periapsis. The resulting position and velocity are in the same frame as the planetary ephemerides. UTC is converted to terrestrial time by Astronomy Engine; the millisecond-scale TDB–TT difference is neglected.

These isolated orbits are approximations. Moon precession, resonances, tides, and perturbations cause increasing error away from the reference epoch; accurate 2026 elements do not make their propagated 1900 or 2100 positions accurate. Their information panels identify this limitation. The application neither downloads live ephemerides at runtime nor runs an unrestricted N-body integrator. Sun-centred coordinates omit the Sun’s motion relative to the Galactic or Solar System barycentre. Pluto–Charon’s barycentric wobble is not resolved separately from the planetary ephemeris.

Orbit lines are optional **instantaneous osculating ellipses**, refreshed each model month. They illustrate the local orbital plane and shape; a perturbed body’s later path can depart from the guide. HUD distances come from the physical geometry, and speeds come from the model’s velocity vector, in km/s of simulation time. Camera speeds represent an unconstrained exploration camera, not a spacecraft trajectory.

## Bodies, shapes, and spin

The scene contains the Sun, eight planets, five recognised dwarf planets (Pluto, Ceres, Eris, Haumea, Makemake), 21 major moons, Halley’s nucleus, and representative main-belt/Kuiper-belt populations. The added satellites are Phobos, Deimos, Mimas, Tethys, Dione, Rhea, Iapetus, Miranda, Ariel, Umbriel, Titania, Oberon, and Triton. This is not a complete catalogue of the Solar System’s moons, asteroids, or comets.

Planetary and lunar spin/poles use Astronomy Engine’s [IAU 2015 rotational models](https://astropedia.astrogeology.usgs.gov/download/Docs/WGCCRE/WGCCRE2015reprint.pdf). The body frame is separate from the orbit frame: axial tilt never tilts the planet’s path, and rings share the equatorial pole without spinning the moons with the surface. Mercury’s slow spin and the retrograde rotations of Venus and Uranus follow these models. Other moons use approximate synchronous spin about their orbital normal, with Triton’s retrograde orbit retained.

Earth, Mars and the giant planets use measured equatorial/polar radii, including Jupiter’s and Saturn’s flattening. Phobos, Deimos, Haumea and Halley have approximate ellipsoidal shapes. Small-body spin periods are approximate (Haumea 3.9155 h, Ceres 9.07417 h, Makemake 22.8266 h, Eris 15.7859 d, Halley 52.8 h); their poles and prime meridians are illustrative. Haumea’s dimensions are an estimate, not a unique measured surface model. Existing global textures are static illustrations; their longitude registration is not certified against the IAU prime meridian. Small moons and added dwarf planets have generic surface colours rather than fabricated detailed maps.

Saturn’s rings use physical D/C/B/A/F extents, including the Cassini division. Jupiter’s faint main ring and Uranus/Neptune’s ring systems use approximate physical extents. Ring opacity and fine structure are illustrative; there is no particle-by-particle simulation or exact ring photometry. Haumea’s ring, the smaller planetary satellites, and comet coma/tails are not included.

## Lighting and viewing aids

Direct solar illumination falls with distance squared. Automatic exposure compensates for distant worlds during flight and close-ups, as a camera changes its exposure; it can be switched off. Soft fill light defaults to 15% and can be set to zero for fully dark night sides. Its intensity compensates for exposure to avoid washing out distant worlds. A small, steady Sun glare blends in between 2 and 4 AU to keep the unresolved Sun visible, including beyond the Solar region. Fill light and distant glare are viewing aids. Analytic apparent-disc overlap produces spherical-occluder umbrae and penumbrae for major moons/planets and the planet’s shadow on its rings, without a Solar shadow cubemap. Overlapping occluders use the largest individual obscuration rather than an exact union. Oblate silhouettes, atmospheric refraction/red lunar eclipses, reflected planet light, ring shadows onto planets, and volumetric scattering remain approximations or omissions.

Labels and orbit guides can be hidden. Stars are a decorative background, not a measured catalogue. Original destinations are available by default. **Fictional extras** can be switched off for an astronomy-only view; these destinations and the heliosphere shell use artistic scales and positions; Quantumania and Arishem remain separate render passes with bounded loading/eviction. Navigation radii do not alter physical meshes. Instant object selection, adaptive near clipping, proportional zoom and local flight speed make tiny objects inspectable without enlarging them.

Asteroid and Kuiper belt rocks retain their physical sizes and orbital distances. Small screen markers make these representative populations visible in wide views; marker size is a viewing aid.

## Sources and verification

- [NASA Planetary Fact Sheets](https://nssdc.gsfc.nasa.gov/planetary/factsheet/) and [NASA Science](https://science.nasa.gov/solar-system/) for physical parameters and object facts.
- [JPL planetary physical parameters](https://ssd.jpl.nasa.gov/planets/phys_par.html) and [satellite physical parameters](https://ssd.jpl.nasa.gov/sats/phys_par/) for sizes; information panels link object-specific NASA pages.
- [Astronomy Engine](https://github.com/cosinekitty/astronomy) for planetary/lunar/Galilean ephemerides and IAU rotational models; its dependency is MIT licensed.
- [JPL Horizons API](https://ssd.jpl.nasa.gov/api/horizons.api) for the checked-in orbital elements and independent reference vectors. Element queries specify `EPHEM_TYPE=ELEMENTS`, `CENTER=500@<parent>`, `TLIST=2461321.5`, `REF_PLANE=ECLIPTIC`, `OUT_UNITS=KM-S`, `CSV_FORMAT=YES`. The fixture stores the exact command and centre identifiers for each vector query; vectors use `VEC_CORR=NONE`.

Unit tests compare 11 independently retrieved Horizons vectors with the model at the reference epoch. The regression tolerances are a one-arcminute-equivalent 3D position budget for the checked planets, 200 km for the Moon, 1500 km for Io, and 20 metres for the sampled two-body objects at the element epoch. These bounds cover those samples, not every date or body.

Tests also check true scale ratios, Earth’s obliquity/sidereal spin, orbital velocity, orbit planes, and the observed 2022-11-08 total lunar eclipse. Browser tests exercise tiny-moon close-ups, date changes, accelerated camera tracking, viewing aids, and navigation/loading behavior. See [DEVELOPMENT.md](DEVELOPMENT.md#testing) for test commands and [TASKS.md](TASKS.md) for unfinished device validation.
