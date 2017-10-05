/**
 * Created by rkim on 10/22/16.
 */
define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/topic",
    "dojo/dom",
    "dojo/on"
], function (
    declare,
    lang,
    topic,
    dom,
    on
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
        keyStatus: {},
        setKeyStatus: function (key, down) {
            this.keyStatus[key] = down;
        },
        isKeyDown : function () {
            for (var key in this.keyStatus) {
                if (this.keyStatus[key]) {
                    return true;
                }
            }
            return false;
        },
        refresh : function () {
            this.keyStatus = {};
        }
    });
});
