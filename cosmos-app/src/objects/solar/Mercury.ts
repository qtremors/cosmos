import { Planet } from '../common/Planet';
import { SceneAssets } from '../../core/SceneAssets';

export class Mercury extends Planet {
    constructor(assets = new SceneAssets()) {
        super('MERCURY', assets, '/textures/2k_mercury.jpg', 0.9);
    }
}
