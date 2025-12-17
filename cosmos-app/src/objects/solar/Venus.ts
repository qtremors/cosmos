import { Planet } from '../common/Planet';
import { SceneAssets } from '../../core/SceneAssets';

export class Venus extends Planet {
    constructor(assets = new SceneAssets()) {
        super('VENUS', assets, '/textures/2k_venus_atmosphere.jpg', 0.8);
    }
}
