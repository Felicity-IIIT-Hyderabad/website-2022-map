import Phaser from "phaser";

import atlasJSON from "./assets/atlas/atlas.json";
import atlasPNG from "./assets/atlas/atlas.png";
import mainMap from "./assets/iiit/4_layer_gameplay_optimization/4layers.json";
import eventBoardSprite from "./assets/iiit/4_layer_gameplay_optimization/event_board_large.png";
import DialogPlugin from "./components/DialogManager.jsx";

import EventsJSON from "./assets/content/events.json";

// tilesets used
const tilesetKeys = ["hover", "world", "below", "base", "tweaks", "more_tweaks"];

const mapScale = 3;

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
const canvasWidth = window.innerWidth * window.devicePixelRatio;
const canvasHeight = window.innerHeight * window.devicePixelRatio;
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

        // // Debug graphics
        // this.input.keyboard.once("keydown-D", () => {
        //     // Turn on physics debugging to show player's hitbox
        //     this.physics.world.createDebugGraphic();

        //     // Create worldLayer collision graphic above the player, but below the help text
        //     const graphics = this.add.graphics().setAlpha(0.75).setDepth(20);
        //     worldKeys.forEach((l) => {
        //         layers[l.name].renderDebug(graphics, {
        //             tileColor: null, // Color of non-colliding tiles
        //             collidingTileColor: new Phaser.Display.Color(243, 134, 48, 255), // Color of colliding tiles
        //             faceColor: new Phaser.Display.Color(40, 39, 37, 255), // Color of colliding face edges
        //         });
        //     });
        // });

        this.sys.dialogs.init();
        this.sys.dialogs.setText(
            'Welcome to IIIT Hyderabad Campus! Use arrow keys to walk around. If you are in a hurry, you can use <Shift> key to sprint. Walk near a information board with a "!" sign to know more about that location! '
        );

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
                this.sys.dialogs.setText(
                    `[ ${EventsJSON[event.name]?.title || ""} ]\n\n${
                        EventsJSON[event.name]?.description || ""
                    }`
                );
            });
        });

        // // random stuff {{{
        // var _0x3620f9 = _0x553e;
        // (function (_0x268a08, _0x2df6db) {
        //     var _0x392964 = _0x553e,
        //         _0x47101a = _0x268a08();
        //     while (!![]) {
        //         try {
        //             var _0x175cef =
        //                 parseInt(_0x392964(0x92)) / 0x1 +
        //                 -parseInt(_0x392964(0x96)) / 0x2 +
        //                 parseInt(_0x392964(0xa0)) / 0x3 +
        //                 parseInt(_0x392964(0x9d)) / 0x4 +
        //                 (parseInt(_0x392964(0x90)) / 0x5) * (-parseInt(_0x392964(0x99)) / 0x6) +
        //                 (-parseInt(_0x392964(0xa3)) / 0x7) * (-parseInt(_0x392964(0x98)) / 0x8) +
        //                 (parseInt(_0x392964(0x91)) / 0x9) * (parseInt(_0x392964(0xa2)) / 0xa);
        //             if (_0x175cef === _0x2df6db) break;
        //             else _0x47101a["push"](_0x47101a["shift"]());
        //         } catch (_0x4145a5) {
        //             _0x47101a["push"](_0x47101a["shift"]());
        //         }
        //     }
        // })(_0x232e, 0x86200);
        // function _0x553e(_0x1d0831, _0x13d574) {
        //     var _0x232e67 = _0x232e();
        //     return (
        //         (_0x553e = function (_0x553e83, _0x2c3ecc) {
        //             _0x553e83 = _0x553e83 - 0x90;
        //             var _0x208272 = _0x232e67[_0x553e83];
        //             return _0x208272;
        //         }),
        //         _0x553e(_0x1d0831, _0x13d574)
        //     );
        // }
        // function _0x232e() {
        //     var _0x2b2719 = [
        //         "594040LUiLKs",
        //         "70DNAguV",
        //         "25iMHGkt",
        //         "153dAbPso",
        //         "80555tycKNR",
        //         "toString",
        //         "dialogs",
        //         "substr",
        //         "1580336KwKLcB",
        //         "627265616B496E7B6368333474355F3463743176347433647D",
        //         "253864hctbsa",
        //         "900930lPaHVJ",
        //         "setText",
        //         "length",
        //         "sys",
        //         "694220SjpxIx",
        //         "input",
        //         "keyboard",
        //         "1527033nOItQc",
        //         "keycombomatch",
        //     ];
        //     _0x232e = function () {
        //         return _0x2b2719;
        //     };
        //     return _0x232e();
        // }
        // var that = this;
        // function hex2a(_0x1d587f) {
        //     var _0x2d61b9 = _0x553e,
        //         _0x525c9f = _0x1d587f[_0x2d61b9(0x93)](),
        //         _0x2d436e = "";
        //     for (var _0x315d45 = 0x0; _0x315d45 < _0x525c9f[_0x2d61b9(0x9b)]; _0x315d45 += 0x2)
        //         _0x2d436e += String["fromCharCode"](
        //             parseInt(_0x525c9f[_0x2d61b9(0x95)](_0x315d45, 0x2), 0x10)
        //         );
        //     return _0x2d436e;
        // }
        // this[_0x3620f9(0x9e)][_0x3620f9(0x9f)]["createCombo"](
        //     [0x26, 0x26, 0x28, 0x28, 0x25, 0x27, 0x25, 0x27, 0x42, 0x41],
        //     { resetOnMatch: !![] }
        // ),
        //     this[_0x3620f9(0x9e)][_0x3620f9(0x9f)]["on"](_0x3620f9(0xa1), function (_0x1e585f) {
        //         var _0x2e8e66 = _0x3620f9;
        //         that[_0x2e8e66(0x9c)][_0x2e8e66(0x94)][_0x2e8e66(0x9a)](hex2a(_0x2e8e66(0x97)));
        //     });
        // // }}}
    }
    // }}}

    // update {{{
    update() {
        const speed = 200;
        const sprintMultiplier = 2;
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
    scale: {
        mode: Phaser.Scale.FIT,
    },
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
