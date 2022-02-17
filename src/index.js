import Phaser from 'phaser';
import React from 'react';
import ReactDOM from 'react-dom';

import mainMap from './assets/tuxemon-town.json';
import mainTileset from './assets/tuxmon-sample-32px-extruded.png';
import App from './components/App.jsx';

class IIITCampus extends Phaser.Scene {
    constructor() {
        super();
    }

    preload() {
        this.load.image('main-tileset', mainTileset);
        this.load.tilemapTiledJSON('main-map', mainMap);
    }

    create() {
        const map = this.make.tilemap({key: 'main-map'});

        // Parameters are the name you gave the tileset in Tiled and then the key of the tileset
        // image in Phaser's cache (i.e. the name you used in preload)
        const tileset = map.addTilesetImage('tuxmon-sample-32px-extruded', 'main-tileset');

        // Parameters: layer name (or index) from Tiled, tileset, x, y
        const belowLayer = map.createLayer('Below Player', tileset, 0, 0);
        const worldLayer = map.createLayer('World', tileset, 0, 0);
        const aboveLayer = map.createLayer('Above Player', tileset, 0, 0);
    }
}

// Phaser config
const config = {
    type: Phaser.AUTO,
    parent: 'main-container',
    width: 800,
    height: 600,
    scene: IIITCampus,
};

const game = new Phaser.Game(config);

ReactDOM.render(<App />, document.getElementById('root'));
