import Phaser from "phaser";

export default class DialogPlugin extends Phaser.Plugins.ScenePlugin {
    boot() {
        const events = this.systems.events;

        events.on("update", this.sceneUpdate, this);
        events.on("shutdown", this.sceneShutdown, this);
        events.once("destroy", this.sceneDestroy, this);
    }

    init(opts) {
        if (!opts) opts = {};

        this.borderThickness = opts.borderThickness || 3;
        this.borderColor = opts.borderColor || 0x907748;
        this.borderAlpha = opts.borderAlpha || 1;
        this.windowAlpha = opts.windowAlpha || 0.8;
        // this.windowColor = opts.windowColor || 0x303030;
        this.windowColor = opts.windowColor || 0x303030;
        this.windowHeight = opts.windowHeight || 150;
        this.padding = opts.padding || 64;
        this.dialogSpeed = opts.dialogSpeed || 3;
        // used for animating the text
        this.eventCounter = 0;
        // if the dialog window is shown
        this.visible = true;
        // the current text in the window
        this.text;
        // the text that will be displayed in the window
        this.dialog;
        this.graphics;
        // Create the dialog window
        this._createWindow();
    }

    sceneUpdate() {}

    sceneShutdown() {}

    sceneDestroy() {
        const events = this.systems.events;

        events.off("shutdown", this.sceneShutdown, this);
        events.off("destroy", this.sceneDestroy, this);

        this.scene = null;
        this.systems = null;
    }

    // Gets the width of the game (based on the scene)
    _getGameWidth() {
        return this.scene.sys.game.config.width;
    }

    // Gets the height of the game (based on the scene)
    _getGameHeight() {
        return this.scene.sys.game.config.height;
    }

    // Calculates where to place the dialog window based on the game size
    _calculateWindowDimensions(width, height) {
        const x = this.padding;
        const y = height - this.windowHeight - this.padding;
        const rectWidth = width - this.padding * 2;
        const rectHeight = this.windowHeight;
        return {
            x,
            y,
            rectWidth,
            rectHeight,
        };
    }

    // Creates the inner dialog window (where the text is displayed)
    _createInnerWindow(x, y, rectWidth, rectHeight) {
        this.graphics.fillStyle(this.windowColor, this.windowAlpha);
        this.graphics.fillRect(x + 1, y + 1, rectWidth - 1, rectHeight - 1);
    }

    // Creates the border rectangle of the dialog window
    _createOuterWindow(x, y, rectWidth, rectHeight) {
        this.graphics.lineStyle(this.borderThickness, this.borderColor, this.borderAlpha);
        this.graphics.strokeRect(x, y, rectWidth, rectHeight);
    }

    // Creates the dialog window
    _createWindow() {
        const gameHeight = this._getGameHeight();
        const gameWidth = this._getGameWidth();
        const dimensions = this._calculateWindowDimensions(gameWidth, gameHeight);
        this.graphics = this.scene.add.graphics().setScrollFactor(0);
        this.graphics.setDepth(100);
        this._createOuterWindow(
            dimensions.x,
            dimensions.y,
            dimensions.rectWidth,
            dimensions.rectHeight
        );
        this._createInnerWindow(
            dimensions.x,
            dimensions.y,
            dimensions.rectWidth,
            dimensions.rectHeight
        );
    }

    // Hide/Show the dialog window
    toggleWindow() {
        this.visible = !this.visible;
        if (this.text) this.text.visible = this.visible;
        if (this.graphics) this.graphics.visible = this.visible;

        console.log(this.visible);
        if (this.visible) {
            this.setText(this.dialog.join(""));
        }
    }

    setText(text) {
        // Reset the dialog
        this.eventCounter = 0;
        this.dialog = text.split("");
        if (this.timedEvent) this.timedEvent.remove();
        var tempText = "";
        this._setText(tempText);
        this.timedEvent = this.scene.time.addEvent({
            delay: 150 - this.dialogSpeed * 30,
            callback: this._animateText,
            callbackScope: this,
            loop: true,
        });
    }

    _setText(text) {
        // Reset the dialog
        if (this.text) this.text.destroy();

        const x = this.padding + 10;
        const y = this._getGameHeight() - this.windowHeight - this.padding + 10;

        this.text = this.scene.make
            .text({
                x,
                y,
                text,
                style: {
                    wordWrap: { width: this._getGameWidth() - this.padding * 2 - 25 },
                },
            })
            .setScrollFactor(0);
        this.text.setDepth(110);
    }

    // Slowly displays the text in the window to make it appear annimated
    _animateText() {
        this.eventCounter++;
        this.text.setText(this.text.text + this.dialog[this.eventCounter - 1]);
        if (this.eventCounter === this.dialog.length) {
            this.timedEvent.remove();
        }
    }
}
