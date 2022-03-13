import Phaser from "phaser";
import React from "react";
import ReactDOM from "react-dom";

import atlasJSON from "./assets/atlas/atlas.json";
import atlasPNG from "./assets/atlas/atlas.png";
import mainMap from "./assets/iiit/4_layer_gameplay_optimization/4layers.json";
import eventBoardSprite from "./assets/iiit/4_layer_gameplay_optimization/event_board_large.png";
import DialogPlugin from "./components/DialogManager.jsx";

import EventsJSON from "./assets/content/events.json";

import App from "./components/App.jsx";

// tilesets used
const tilesetKeys = ["hover", "world", "below", "base"];

const mapScale = 2;

// layer keys {{{
const aboveKeys = mainMap.layers
    .filter((l) => l.name === "hover_layer")
    .map((l) => ({ name: l.name, x: l.offsetx, y: l.offsety }));
const worldKeys = mainMap.layers
    .filter((l) => l.name === "world_layer")
    .map((l) => ({ name: l.name, x: l.offsetx, y: l.offsety }));
const belowKeys = mainMap.layers
    .filter((l) => l.name === "below_layer")
    .map((l) => ({ name: l.name, x: l.offsetx, y: l.offsety }));
const baseKeys = mainMap.layers
    .filter((l) => l.name === "base_layer")
    .map((l) => ({ name: l.name, x: 0, y: 0 }));
// }}}

let cursors;
let player;

// keys
var shiftKey;
var isSprinting = false;

// canvas dimensions {{{
const canvasMarginWidth = 200;
const canvasMarginHeight = 150;
const canvasWidth = window.innerWidth * window.devicePixelRatio - canvasMarginWidth;
const canvasHeight = window.innerHeight * window.devicePixelRatio - canvasMarginHeight;
// }}}

class IIITCampus extends Phaser.Scene {
    // constructor {{{
    constructor() {
        super();
    }
    // }}}

    // preload {{{
    preload() {
        // loading screen
        const progressLength = 320;
        const progressHeight = 30;
        var progressBar = this.add.graphics();
        var progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(
            (canvasWidth - progressLength) / 2,
            (canvasHeight - progressHeight) / 2,
            progressLength,
            progressHeight
        );

        var width = this.cameras.main.width;
        var height = this.cameras.main.height;
        var loadingText = this.make.text({
            x: width / 2,
            y: height / 2 - 50,
            text: "Felicity '22",
            style: {
                font: "20px monospace",
                fill: "#ffffff",
            },
        });
        loadingText.setOrigin(0.5, 0.5);

        this.load.on("progress", function (value) {
            progressBar.clear();
            progressBar.fillStyle(0xffffff, 1.0);
            progressBar.fillRect(
                (canvasWidth - progressLength) / 2 + 10,
                (canvasHeight - progressHeight) / 2 + 10,
                (progressLength - 20) * value,
                progressHeight - 20
            );
        });

        this.load.on("complete", function () {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
        });

        // map
        this.load.tilemapTiledJSON("main-map", mainMap);

        // load tilesets
        tilesetKeys.forEach((ts) => {
            this.load.image(ts, require(`./assets/iiit/4_layer_gameplay_optimization/${ts}.png`));
        });

        // atlas (for player sprite)
        this.load.atlas("atlas", atlasPNG, atlasJSON);

        // event board sprites
        this.load.image("event-board", eventBoardSprite);
    }
    // }}}

    // create {{{
    create() {
        const map = this.make.tilemap({ key: "main-map" });

        // parameters are the name you gave the tileset in Tiled and then the key of the tileset
        // image in Phaser's cache (i.e. the name you used in preload)
        var tilesetImages = {};
        tilesetKeys.forEach((ts) => {
            tilesetImages[ts] = map.addTilesetImage(ts, ts);
        });

        // parameters: layer name (or index) from Tiled, tileset, x, y
        var layers = {};
        [baseKeys, belowKeys, worldKeys, aboveKeys].forEach((layerKeys) => {
            layerKeys.forEach((l) => {
                layers[l.name] = map.createLayer(
                    l.name,
                    Object.values(tilesetImages),
                    l.x * mapScale,
                    l.y * mapScale
                );
                layers[l.name].setScale(mapScale, mapScale);
            });
        });

        // Enable collisions
        worldKeys.forEach((l) => layers[l.name].setCollisionByProperty({ collides: true }));

        // By default, everything gets depth sorted on the screen in the order we created things.
        // Here, we want the "Above Player" layer to sit on top of the player, so we explicitly give
        // it a depth. Higher depths will sit on top of lower depth objects.
        aboveKeys.forEach((l) => layers[l.name].setDepth(20));

        // Object layers in Tiled let you embed extra info into a map - like a spawn point or custom
        // collision shapes. In the tmx file, there's an object layer with a point named "Spawn
        // Point"
        const spawnPoint = map.findObject("object_layer", (obj) => obj.name === "spawn_point");

        // Create a sprite with physics enabled via the physics system. The image used for the
        // sprite has a bit of whitespace, so I'm using setSize & setOffset to control the size of
        // the player's body.
        player = this.physics.add
            .sprite(spawnPoint.x * mapScale, spawnPoint.y * mapScale, "atlas", "player-front")
            .setSize(30, 40)
            .setOffset(0, 24);

        this.player = player;

        // Watch the player and worldLayer for collisions, for the duration of the scene:
        worldKeys.forEach((l) => {
            this.physics.add.collider(player, layers[l.name]);
        });

        // player sprite animations {{{
        const anims = this.anims;
        anims.create({
            key: "player-left-walk",
            frames: anims.generateFrameNames("atlas", {
                prefix: "player-left-walk.",
                start: 0,
                end: 3,
                zeroPad: 3,
            }),
            frameRate: 10,
            repeat: -1,
        });
        anims.create({
            key: "player-right-walk",
            frames: anims.generateFrameNames("atlas", {
                prefix: "player-right-walk.",
                start: 0,
                end: 3,
                zeroPad: 3,
            }),
            frameRate: 10,
            repeat: -1,
        });
        anims.create({
            key: "player-front-walk",
            frames: anims.generateFrameNames("atlas", {
                prefix: "player-front-walk.",
                start: 0,
                end: 3,
                zeroPad: 3,
            }),
            frameRate: 10,
            repeat: -1,
        });
        anims.create({
            key: "player-back-walk",
            frames: anims.generateFrameNames("atlas", {
                prefix: "player-back-walk.",
                start: 0,
                end: 3,
                zeroPad: 3,
            }),
            frameRate: 10,
            repeat: -1,
        });
        // }}}

        const camera = this.cameras.main;
        camera.startFollow(player);
        camera.setBounds(0, 0, map.widthInPixels * mapScale, map.heightInPixels * mapScale);

        cursors = this.input.keyboard.createCursorKeys();

        // Help text that has a "fixed" position on the screen
        // this.add
        //     .text(16, 16, "Use Arrow keys to move", {
        //         font: "18px monospace",
        //         fill: "#000000",
        //         padding: { x: 20, y: 10 },
        //         backgroundColor: "#ffffff",
        //     })
        //     .setScrollFactor(0)
        //     .setDepth(30);

        // Debug graphics
        this.input.keyboard.once("keydown-D", () => {
            // Turn on physics debugging to show player's hitbox
            this.physics.world.createDebugGraphic();

            // Create worldLayer collision graphic above the player, but below the help text
            const graphics = this.add.graphics().setAlpha(0.75).setDepth(20);
            worldKeys.forEach((l) => {
                layers[l.name].renderDebug(graphics, {
                    tileColor: null, // Color of non-colliding tiles
                    collidingTileColor: new Phaser.Display.Color(243, 134, 48, 255), // Color of colliding tiles
                    faceColor: new Phaser.Display.Color(40, 39, 37, 255), // Color of colliding face edges
                });
            });
        });

        this.input.keyboard.on("keydown-SPACE", () => {
            this.sys.dialogs.toggleWindow();
        });

        this.sys.dialogs.init();
        this.sys.dialogs.setText("Welcome to IIIT Hyderabad Campus!");

        // sprint key
        shiftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);

        // event objects
        const eventBoards = map.createFromObjects("event_layer", {
            key: "event-board",
        });

        eventBoards.forEach((board) => {
            // scale up
            board.setPosition(board.x * mapScale, board.y * mapScale);
            board.setSize(board.width * mapScale, board.height * mapScale);
            board.setDisplaySize(board.width, board.height);

            // trigger dialog on collision
            this.physics.world.enable(board);
            board.body.immovable = true;
            this.physics.add.collider(player, board, (_, event) => {
                console.log(EventsJSON[event.name]);

                this.sys.dialogs.setText(
                    EventsJSON[event.name].map((e) => `${e.title}\n${e.description}`).join("\n")
                );
            });
        });
    }
    // }}}

    // update {{{
    update() {
        const speed = 200;
        const sprintMultiplier = 4;
        const prevVelocity = player.body.velocity.clone();

        // Stop any previous movement from the last frame
        player.body.setVelocity(0);

        if (shiftKey.isDown) {
            isSprinting = true;
        } else {
            isSprinting = false;
        }

        // Horizontal movement
        if (cursors.left.isDown) {
            player.body.setVelocityX(-speed * (isSprinting ? sprintMultiplier : 1));
        } else if (cursors.right.isDown) {
            player.body.setVelocityX(speed * (isSprinting ? sprintMultiplier : 1));
        }

        // Vertical movement
        if (cursors.up.isDown) {
            player.body.setVelocityY(-speed * (isSprinting ? sprintMultiplier : 1));
        } else if (cursors.down.isDown) {
            player.body.setVelocityY(speed * (isSprinting ? sprintMultiplier : 1));
        }

        // Normalize and scale the velocity so that player can't move faster along a diagonal
        player.body.velocity.normalize().scale(speed * (isSprinting ? sprintMultiplier : 1));

        // Update the animation last and give left/right animations precedence over up/down
        // animations
        if (cursors.left.isDown) {
            player.anims.play("player-left-walk", true);
        } else if (cursors.right.isDown) {
            player.anims.play("player-right-walk", true);
        } else if (cursors.up.isDown) {
            player.anims.play("player-back-walk", true);
        } else if (cursors.down.isDown) {
            player.anims.play("player-front-walk", true);
        } else {
            player.anims.stop();

            // If we were moving, pick and idle frame to use
            if (prevVelocity.x < 0) player.setTexture("atlas", "player-left");
            else if (prevVelocity.x > 0) player.setTexture("atlas", "player-right");
            else if (prevVelocity.y < 0) player.setTexture("atlas", "player-back");
            else if (prevVelocity.y > 0) player.setTexture("atlas", "player-front");
        }
    }
    // }}}
}

// phaser config {{{
const config = {
    type: Phaser.AUTO,
    parent: "main-container",
    pixelArt: true,
    width: canvasWidth,
    height: canvasHeight,
    scene: IIITCampus,
    physics: {
        default: "arcade",
        arcade: {
            gravity: { y: 0 }, // Top down game, so no gravity
        },
    },
    plugins: {
        scene: [{ key: "dialogPlugin", plugin: DialogPlugin, mapping: "dialogs" }],
    },
};
// }}}

const game = new Phaser.Game(config);

ReactDOM.render(<App />, document.getElementById("root"));
