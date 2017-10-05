define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/topic",
    "dojo/dom",
    "dojo/on",
    "cesium/Core/ScreenSpaceEventHandler",
    "cesium/Core/ScreenSpaceEventType",
    "cesium/Core/Cartesian3",
    "jpl/events/BrowserEvent",
    "jpl/config/Config",
    "jpl/gamePad/KeyStatus"
], function (
    declare,
    lang,
    topic,
    dom,
    on,
    ScreenSpaceEventHandler,
    ScreenSpaceEventType,
    Cartesian3,
    BrowserEvent,
    Config,
    KeyStatus
) {
    /**
     * Controller to handle STL file generation
     * @requires dojo/_base/declare
     * @requires dojo/topic
     * @requires dojo/dom
     * @requires jpl/events/BrowserEvent
     * @class jpl.controllers.STLController
     */
    return declare(null, /** @lends jpl.controllers.STLController.prototype */ {
        removeGameControlTickHandler: undefined,
        cesiumWidget: null,
        renderBoost: 1,
        gameMode: false,
        gamePad: undefined,
        gamePadConnected: false,
        keyboardMoveRate: 1,
        gamePadMoveBoost: 0.75,
        mouseLookBoost: 0.025,
        gamePadLookBoost: 0.004,
        keyStatus: new KeyStatus(),
        mosueDown: false,
        gamePadDown: false,
        startMousePosition: 0.0,
        mousePosition: 0.0,

        axis: {
            axis0: 0.0,
            axis1: 0.0,
            axis2: 0.0,
            axis3: 0.0,
            axis4: 0.0,
            axis5: 0.0
        },

        constructor: function () {
            var self = this;

            topic.subscribe(BrowserEvent.prototype.CONFIG_LOADED, lang.hitch(this, function(){
                self.config = Config.getInstance();
            }));



            //gamepadconnect disconnect event doens't work well.  disabling for now.
            // window.addEventListener("gamepadconnected", function(e) {
            //     //there is problem with this event.  sometimes..when gamepad is disconnected,
            //     //this event is fired.  therefore need to check if gamepad is connected from this handler
            //     self.checkGamePadandInitialize(e.gamePad);
            // });
            //
            // window.addEventListener("gamepaddisconnected", function(e) {
            //     self.checkGamePadandInitialize(e.gamePad);
            //
            // });
        },

        setUpController: function(type) {
            if (type == "game") {
                this.turnOnGameControl();
            } else {
                this.turnOnNormalControl();
            }
        },

        gamePadCleanup: function () {
            this.gamePad = undefined;
        },

        keyMouseControlCleanup: function () {
            this.resetAxis();
            if (this.controlsHandler && !this.controlsHandler.isDestroyed())
                this.controlsHandler.destroy();
            if (this.gameControlKUListener)
                this.gameControlKUListener.remove();
            if (this.gameControlKDListener)
                this.gameControlKDListener.remove();
        },

        gameControlCleanup: function () {
            if (this.removeGameControlTickHandler)
                this.removeGameControlTickHandler();

        },

        turnOnNormalControl: function () {
            this.gameControlCleanup();
            this.gamePadCleanup();
            this.keyMouseControlCleanup();

            this.gamePadMode = false;
            this.cesiumWidget.scene.screenSpaceCameraController.enableRotate = true;
            this.cesiumWidget.scene.screenSpaceCameraController.enableTranslate = true;
            this.cesiumWidget.scene.screenSpaceCameraController.enableZoom = true;
            this.cesiumWidget.scene.screenSpaceCameraController.enableTilt = true;
            this.cesiumWidget.scene.screenSpaceCameraController.enableLook = false;

        },

        turnOnGameControl: function () {
            //setup cesium
            this.keyStatus.refresh();
            this.gamePadMode = true;
            this.cesiumWidget.scene.screenSpaceCameraController.enableRotate = false;
            this.cesiumWidget.scene.screenSpaceCameraController.enableTranslate = false;
            this.cesiumWidget.scene.screenSpaceCameraController.enableZoom = false;
            this.cesiumWidget.scene.screenSpaceCameraController.enableTilt = true;
            this.cesiumWidget.scene.screenSpaceCameraController.enableLook = false;

            this.setupGameMouseKey();
            this.setupGamePad();

            this.render();
        },

        setupGamePad: function() {
            var self = this;
            var count = 0;
            var interval = setInterval(function() {
                console.log("looking for gamepad " + count);
                var selectGamePad = self.selectGamePad();
                if (selectGamePad != undefined) {
                    clearInterval(interval);
                    self.keyMouseControlCleanup();
                    self.checkGamePadandInitialize(selectGamePad);
                } else {
                    if (count >= 4) {
                        console.log("giving up looking for gamepad");
                        clearInterval(interval);
                    }
                }

                count++;
            }, 500);
        },

        selectGamePad: function () {
            var gamePads =  navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads : []);
            var selectGamePad = undefined;
            for (var i=0; i < gamePads.length; i++) {
                if (gamePads[i] != undefined && gamePads[i].axes.length < 7) {

                    if (selectGamePad == undefined) {
                        selectGamePad = gamePads[i];
                    } else if (selectGamePad.axes.length < gamePads[i].axes.length) {
                        selectGamePad = gamePads[i];
                    }
                }
            }
            return selectGamePad;
        },

        checkGamePadandInitialize: function (gamePad) {

            if (gamePad != undefined) {

                console.log("Gamepad connected at index %d: %s. %d buttons, %d axes.", gamePad.index, gamePad.id);
                this.gamePad = gamePad;
                this.gamePadConnected = true;

                this.updateGamePadStatus();
            } else {
                console.log("Gamepad disconnected");
                this.gamePadConnected = false;
                this.gamePadCleanup();
            }
        },

        updateGamePadStatus: function() {
            var self = this;
            var updateFunction = function() {
                var me = self;
                if (me.gamePadMode && me.gamePadConnected) {
                    var selectGamePad = self.selectGamePad();
                    if (selectGamePad === undefined) {
                        //gamepad disappeared.  turn off gamepad and turn on keyboard/mouse
                        me.setupGameMouseKey();
                        me.gamePadCleanup();
                        window.cancelAnimationFrame(updateFunction);
                    } else {
                        me.gamePad = selectGamePad;
                        me.changeAxisFromGamePad();
                        window.requestAnimationFrame(updateFunction);
                    }
                } else {
                    me.gamePadCleanup();
                    window.cancelAnimationFrame(updateFunction);
                }
            };

            window.requestAnimationFrame(updateFunction);


        },

        setupGameMouseKey: function () {

            var me = this;
            //setup keyboard mouse
            this.controlsHandler = new ScreenSpaceEventHandler(this.cesiumWidget.scene.canvas);
            this.controlsHandler.setInputAction(function(movement) {
                me.mousePosition = me.startMousePosition = Cartesian3.clone(movement.position);
            }, ScreenSpaceEventType.LEFT_DOWN);
            this.controlsHandler.setInputAction(function(movement) {
                if (me.startMousePosition == 0)
                    return;

                me.mousePosition = movement.endPosition;

                var lookFactor = me.mouseLookBoost;
                // up down
                var height = me.cesiumWidget.scene.canvas.clientHeight;
                var width = me.cesiumWidget.scene.canvas.clientWidth;
                if (me.mousePosition.y != me.startMousePosition.y) {
                    var y = -(me.mousePosition.y - me.startMousePosition.y) / height;
                    me.axis.axis3 = y * lookFactor;
                }
                if (me.mousePosition.x != me.startMousePosition.x) {
                    var x = (me.mousePosition.x - me.startMousePosition.x) / width;
                    me.axis.axis5 = x * lookFactor;
                }
            }, ScreenSpaceEventType.MOUSE_MOVE);
            this.controlsHandler.setInputAction(function(position) {
                me.startMousePosition = 0;
                me.axis.axis3 = 0.0;
                me.axis.axis5 = 0.0;
            }, ScreenSpaceEventType.LEFT_UP);

            this.gameControlKDListener = on(document, 'keydown', lang.hitch(this, function(e) {
                me.keyStatus.setKeyStatus(e.key, true);
                var flagName = me.verifyKeystore(e.keyCode);
                if (flagName === "faster") {
                    me.renderBoost = 5;
                } else if (flagName === "good") {
                    me.changeAxis(e.keyCode, me.keyboardMoveRate);
                }

            }));

            this.gameControlKUListener = on(document, 'keyup', lang.hitch(this, function(e) {
                me.keyStatus.setKeyStatus(e.key, false);
                var flagName = me.verifyKeystore(e.keyCode);
                if (flagName === "bad") {
                    me.resetAxis();
                } else if (flagName === "faster") {
                    me.renderBoost = 1;
                    console.log("rate : set to 0.5");
                } else if (flagName === "good") {
                    me.changeAxis(e.keyCode, 0.0);
                }

            }));
        },

        gamePadBoostRate: function(camera) {
            var cameraHeight = this.cesiumWidget.scene.globe.ellipsoid.cartesianToCartographic(camera.position).height - this.config.elevationMinValue;

            var moveRate = 0;


            if (cameraHeight > 54800) {
                moveRate = cameraHeight / 100
            } else {
                moveRate = cameraHeight/ 250;
            }


            if (moveRate < 15.0 )
                moveRate = 15.0;

            return moveRate;
        },

        keyboardBoostRate: function(camera) {
            // Change movement speed based on the distance of the camera to the surface of the ellipsoid. Offset camera height for hack fix for now.
            var cameraHeight = this.cesiumWidget.scene.globe.ellipsoid.cartesianToCartographic(camera.position).height - this.config.elevationMinValue;

            var moveRate = 0;
            if (cameraHeight > 2246400) {
                moveRate = cameraHeight / 200;
            } else if (cameraHeight > 1131200) {
                moveRate = cameraHeight / 250;
            } else if (cameraHeight > 569600) {
                moveRate = cameraHeight / 300;
            } else if (cameraHeight > 288800) {
                moveRate = cameraHeight / 350;
            } else if (cameraHeight > 148400) {
                moveRate = cameraHeight / 400;
            } else if (cameraHeight > 54800) {
                moveRate = cameraHeight / 600;
            } else {
                moveRate = cameraHeight / 700;
            }


            // } else if (cameraHeight > 31400) {
            //     moveRate = cameraHeight / 700;
            // } else if (cameraHeight > 16000) {
            //     moveRate = cameraHeight / 1000;
            // }
            // } else if (cameraHeight > 15500) {
            //     moveRate = cameraHeight / 1500;
            // }
            // else if (cameraHeight > 14500) {
            //     console.log("14500");
            //     moveRate = cameraHeight / 3000;
            // } else if (cameraHeight > 10925) {
            //     console.log("10925");
            //     moveRate = cameraHeight / 2000;
            // }

            if (moveRate < 15.0 )
                moveRate = 15.0;

            //console.log("height = " + cameraHeight + ":" + moveRate);
            return moveRate;
        },

        render: function() {
            //listener
            var me = this;


            this.removeGameControlTickHandler = this.cesiumWidget.clock.onTick.addEventListener(lang.hitch(this, function(clock) {
                var camera = me.cesiumWidget.scene.camera;
                var scene = me.cesiumWidget.scene;

                var cameraBoost = 1;
                if (me.gamePad === undefined) {
                    cameraBoost = me.keyboardBoostRate(camera);
                } else {
                    cameraBoost = me.gamePadBoostRate(camera);
                }
                if (this.axis.axis3 != 0.0) {
                    camera.lookUp(this.axis.axis3);
                }

                if (this.axis.axis4 != 0.0) {
                    camera.twistLeft(this.axis.axis4);
                }

                if (this.axis.axis5 != 0.0) {
                    camera.lookRight(this.axis.axis5);
                }

                if (this.axis.axis0 != 0.0) {
                    camera.moveRight(this.axis.axis0 * cameraBoost * this.renderBoost);
                }

                if (this.axis.axis1 != 0.0) {
                    camera.moveBackward(this.axis.axis1 * cameraBoost * this.renderBoost);
                }

                if (this.axis.axis2 != 0.0) {
                    camera.moveDown(this.axis.axis2 * cameraBoost * this.renderBoost);
                }
            }));
        },

        resetAxis: function () {
            this.axis.axis0 = 0.0;
            this.axis.axis1 = 0.0;
            this.axis.axis2 = 0.0;
            this.axis.axis3 = 0.0;
            this.axis.axis4 = 0.0;
            this.axis.axis5 = 0.0;
        },

        changeAxisFromGamePad: function () {
            if (this.gamePad.axes.length == 6) {
                this.axis.axis0 = this.gamePad.axes[0] * this.gamePadMoveBoost; //forward
                this.axis.axis1 = this.gamePad.axes[1] * this.gamePadMoveBoost; //strafe
                this.axis.axis2 = this.gamePad.axes[2] * this.gamePadMoveBoost; //vertical
                this.axis.axis3 = this.gamePad.axes[3] * this.gamePadLookBoost; //tilt
                this.axis.axis4 = this.gamePad.axes[4] * this.gamePadLookBoost; //yaw
                this.axis.axis5 = this.gamePad.axes[5] * this.gamePadLookBoost; //rotate
            } else if (this.gamePad.axes.length == 4) {
                if (this.gamePad.axes[0] > 0.2 || this.gamePad.axes[0] < -0.2)
                    this.axis.axis0 = this.gamePad.axes[0] * this.gamePadMoveBoost; //forward
                else
                    this.axis.axis0 = 0;

                if (this.gamePad.axes[1] > 0.2 || this.gamePad.axes[1] < -0.2)
                    this.axis.axis1 = this.gamePad.axes[1] * this.gamePadMoveBoost; //STRAFE
                else
                    this.axis.axis1 = 0;

                if (this.gamePad.axes[2] > 0.2 || this.gamePad.axes[2] < -0.2)
                    this.axis.axis4 = -1 * this.gamePad.axes[2] * this.mouseLookBoost; //vertical
                else
                    this.axis.axis4 = 0;

                if (this.gamePad.axes[3] > 0.2 || this.gamePad.axes[3] < -0.2)
                    this.axis.axis3 = this.gamePad.axes[3] * this.mouseLookBoost; //tilt
                else
                    this.axis.axis3 = 0;
            }


        },

        changeAxis: function(keyCode, moveRate) {
            switch (keyCode) {
                //move camera forward
                case 'W'.charCodeAt(0):
                    this.axis.axis1 = -1 * moveRate;
                    break;
                case '&'.charCodeAt(0):
                    this.axis.axis1 = -1 * moveRate;
                    break;
                ///move camera backward
                case 'S'.charCodeAt(0):
                    this.axis.axis1 = moveRate;
                    break;
                case '('.charCodeAt(0):
                    this.axis.axis1 = moveRate;
                    break;

                //move camera up
                case 'Q'.charCodeAt(0):
                    this.axis.axis2= -1 * moveRate;
                    break;
                //move camera down
                case 'E'.charCodeAt(0):
                    this.axis.axis2 = moveRate;
                    break;
                //move camera right
                case 'D'.charCodeAt(0):
                    this.axis.axis0 = moveRate;
                    break;
                case "'".charCodeAt(0):
                    this.axis.axis0 = moveRate;
                    break;
                //move camera left
                case 'A'.charCodeAt(0):
                    this.axis.axis0 = -1 * moveRate;
                    break;
                case '%'.charCodeAt(0):
                    this.axis.axis0 = -1 * moveRate;
                    break;
                case 'C'.charCodeAt(0):
                    if (moveRate == 0.0)
                        this.axis.axis4 = 0.0;
                    else
                        this.axis.axis4 = -1 * Math.PI / 500;
                    break;
                case 'Z'.charCodeAt(0):
                    if (moveRate == 0.0)
                        this.axis.axis4 = 0.0;
                    else
                        this.axis.axis4 = (Math.PI / 500);
                    break;

                // default:
                //     return undefined;
            }
        },

        verifyKeystore: function(keyCode) {
            switch (keyCode) {
                case 16:
                    return 'faster';
                //bad keys
                case 17:
                    return 'bad';
                case 18:
                    return 'bad';
                case 91:
                    return 'bad';
                case 9:
                    return 'bad';
                default:
                    return 'good';
            }
        }

    });
});
