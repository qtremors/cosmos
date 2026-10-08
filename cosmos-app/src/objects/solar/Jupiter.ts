import { Planet } from '../common/Planet';
import { SceneAssets } from '../../core/SceneAssets';
import type { Moon } from '../common/Moon';

export class Jupiter extends Planet {
    readonly europa: Moon;
    constructor(assets = new SceneAssets()) {
        super('JUPITER', assets, '/textures/2k_jupiter.jpg', 0.4);
        this.addMoon({ name: 'Io', radius: 1.6, distance: 20, color: 0xffca70 });
        this.europa = this.addMoon({ name: 'Europa', radius: 1.5, distance: 30, color: 0xe0e0e0 });
        this.addMoon({ name: 'Ganymede', radius: 2.5, distance: 44, color: 0xa9a193 });
        this.addMoon({ name: 'Callisto', radius: 2.2, distance: 64, color: 0x817969 });
    }
}
