define([
    "dojo/_base/declare"
], function (declare) {
    /**
     * Class to store user tools configuration flags
     * @requires dojo/_base/declare
     * @class jpl.config.Tools
     */
    return declare(null, /** @lends jpl.config.Tools.prototype */ {
        /**
         * @property {boolean} - Flag to determine if pin tool should be enabled
         * @type {boolean}
         * @default false
         * @description Flag to determine if pin tool should be enabled
         */
        pin: false,
        /**
         * @property {boolean} - Flag to determine if box tool should be enabled
         * @type {boolean}
         * @default false
         * @description Flag to determine if box tool should be enabled
         */
        box: false,
        /**
         * @property {boolean} - Flag to determine if ellipse tool should be enabled
         * @type {boolean}
         * @default false
         * @description Flag to determine if ellipse tool should be enabled
         */
        ellipse: false,
        /**
         * @property {boolean} - Flag to determine if line tool should be enabled
         * @type {boolean}
         * @default false
         * @description Flag to determine if line tool should be enabled
         */
        line: false,
        /**
         * @property {boolean} - Flag to determine if polyline tool should be enabled
         * @type {boolean}
         * @default false
         * @description Flag to determine if polyline tool should be enabled
         */
        polyline: true,
        /**
         * @property {boolean} - Flag to determine if freehand line tool should be enabled
         * @type {boolean}
         * @default false
         * @description Flag to determine if freehand line tool should be enabled
         */
        freeline: false,

        overHeadOrbiters: false,
        overHeadSunEarth: false,
        createBookmarks: false,
        /**
         * Constructor function that takes in a tools configuration object and determines which tools should be
         * enabled. By default, all tools are turned off.
         * @param {object} toolsConfig - The configuration key/value pairs for enabling tools
         * @return {null}
         */
        constructor: function (toolsConfig) {
            //initially set all controls to false
            this.overHeadOrbiters = false;
            this.overHeadSunEarth = false;
            this.createBookmarks = false;
            this.pin = false;
            this.box = false;
            this.ellipse = false;
            this.line = false;
            this.polyline = false;
            this.freeline = false;

            if(toolsConfig) {
                //if key exists and it is set to true, turn on the control
                if(toolsConfig.overHeadOrbiters) this.overHeadOrbiters = true;
                if(toolsConfig.overHeadSunEarth) this.overHeadSunEarth = true;
                if(toolsConfig.createBookmarks) this.createBookmarks = true;
                if(toolsConfig.pin) this.pin = true;
                if(toolsConfig.box) this.box = true;
                if(toolsConfig.ellipse) this.ellipse = true;
                if(toolsConfig.line) this.line = true;
                if(toolsConfig.polyline) this.polyline = true;
                if(toolsConfig.freeline) this.freeline = true;
            }
        }
    });
});