import { Planet } from '../common/Planet';
import { SceneAssets } from '../../core/SceneAssets';
import type { Moon } from '../common/Moon';

export class Pluto extends Planet {
    readonly charon: Moon;
    constructor(assets = new SceneAssets()) {
        super('PLUTO', assets, '/textures/Pluto.jpg', 0.8);
        this.charon = this.addMoon({ name: 'Charon', radius: 0.6, distance: 8, color: 0x8a8a8a });
    }
}
