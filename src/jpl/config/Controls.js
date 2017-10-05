define([
    "dojo/_base/declare"
], function (declare) {
    /**
     * Class to store user controls configuration flags
     * @requires dojo/_base/declare
     * @class jpl.config.Controls
     */
    return declare(null, /** @lends jpl.config.Controls.prototype */ {
        /**
         * @property {boolean} - Flag to determine if search widget should be enabled
         * @type {boolean}
         * @default false
         * @description Flag to determine if search widget should be enabled
         */
        search: false,
        /**
         * @property {boolean} - Flag to determine if login widget should be enabled
         * @type {boolean}
         * @default false
         * @description Flag to determine if login widget should be enabled
         */
        login: false,
        /**
         * @property {boolean} - Flag to determine if help widget should be enabled
         * @type {boolean}
         * @default false
         * @description Flag to determine if help widget should be enabled
         */
        help: false,
        /**
         * @property {boolean} - Flag to determine if layers widget should be enabled
         * @type {boolean}
         * @default false
         * @description Flag to determine if layers widget should be enabled
         */
        layers: false,
        /**
         * @property {boolean} - Flag to determine if explore widget should be enabled
         * @type {boolean}
         * @default false
         * @description Flag to determine if explore widget should be enabled
         */
        explore: true,
        /**
         * @property {boolean} - Flag to determine if tools widget should be enabled
         * @type {boolean}
         * @default false
         * @description Flag to determine if tools widget should be enabled
         */
        tools: false,
        /**
         * @property {boolean} - Flag to determine if projection selection widget should be enabled
         * @type {boolean}
         * @default false
         * @description Flag to determine if projection selection widget should be enabled
         */
        projection: false,
        /**
         * @property {boolean} - Flag to determine if basemap selection widget should be enabled
         * @type {boolean}
         * @default false
         * @description Flag to determine if basemap selection widget should be enabled
         */
        basemaps: false,
        /**
         * @property {boolean} - Flag to determine if bookmarks widget should be enabled
         * @type {boolean}
         * @default false
         * @description Flag to determine if bookmarks widget should be enabled
         */
        bookmarks: false,
        /**
         * @property {boolean} - Flag to determine if slideshows widget should be enabled
         * @type {boolean}
         * @default false
         * @description Flag to determine if slideshows widget should be enabled
         */
        slideshow: false,
        /**
         * @property {object} - Has configuration object for dojo config. Flags to show which modules should be included/excluded
         * @type {object}
         * @description Has configuration object for dojo config. Flags to show which modules should be included/excluded
         */
        socialmedia: false,
        /**
         * @property {boolean} - Flag to determine if tree widget should be enabled
         * @type {boolean}
         * @default false
         * @description Flag to determine if tree widget should be enabled
         */
        tree: false,

        scalebars: false,

        hasConfig: {},
        /**
         * Constructor function that takes in a controls configuration object and determines which controls should be
         * enabled. By default, all controls are turned off.
         * @param {object} controlsConfig - The configuration key/value pairs for enabling controls
         * @return {null}
         */
        constructor: function (controlsConfig) {
            //initially set all controls to false
            this.search = false;
            this.login = false;
            this.help = false;
            this.layers = false;
            this.explore = false;
            this.tools = false;
            this.projection = false;
            this.basemaps = false;
            this.bookmarks = false;
            this.slideshow = false;
            this.mappermalink = false;
            this.socialmedia = false;
            this.scalebars = false;
            this.flyto = false;
            this.tree = false;

            if(controlsConfig) {
                //if key exists and it is set to true, turn on the control
                if(controlsConfig.search) this.search = true;
                if(controlsConfig.login) this.login = true;
                if(controlsConfig.help) this.help = true;
                if(controlsConfig.layers) this.layers = true;
                if(controlsConfig.explore) this.explore = true;
                if(controlsConfig.tools) this.tools = true;
                if(controlsConfig.projection) this.projection = true;
                if(controlsConfig.basemaps) this.basemaps = true;
                if(controlsConfig.bookmarks) this.bookmarks = true;
                if(controlsConfig.mappermalink) this.mappermalink = true;
                if(controlsConfig.slideshow) this.slideshow = true;
                if(controlsConfig.socialmedia) this.socialmedia = true;
                if(controlsConfig.scalebars) this.scalebars = true;
                if(controlsConfig.flyto) this.flyto = true;
                if(controlsConfig.tree) this.tree = true;
            }

            this.hasConfig = {
                'config-control-search': this.search,
                'config-control-login': this.login,
                'config-control-help': this.help,
                'config-control-layers': this.layers,
                'config-control-explore': this.explore,
                'config-control-tools': this.tools,
                'config-control-projection': this.projection,
                'config-control-basemaps': this.basemaps,
                'config-control-bookmarks': this.bookmarks,
                'config-control-mappermalink': this.mappermalink,
                'config-control-slideshow': this.slideshow,
                'config-control-socialmedia': this.socialmedia,
                'config-control-scalebars': this.scalebars,
                'config-control-flyto': this.flyto,
                'config-control-tree': this.tree
            }
        }

    });
});