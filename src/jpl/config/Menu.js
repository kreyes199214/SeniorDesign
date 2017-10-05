define([
    "dojo/_base/declare"
], function (declare) {
    /**
     * Class to store user menu configuration flags
     * @requires dojo/_base/declare
     * @class jpl.config.Menu
     */
    return declare(null, /** @lends jpl.config.Menu.prototype */ {
        overHeadOrbiters: false,
        overHeadSunEarth: false,
        annotations: false,
        createBookmarks: false,
        about: false,
        contact: false,
        credits: false,
        relatedLinks: false,
        releaseNotes: false,
        systemRequirements: false,
        help: false,
        login: false,

        /**
         * Constructor function that takes in a menu configuration object and determines which menu should be
         * enabled. By default, all menu are turned off.
         * @param {object} menuConfig - The configuration key/value pairs for enabling menu
         * @return {null}
         */
        constructor: function (menuConfig) {
            //initially set all controls to false
            this.overHeadOrbiters = false;
            this.overHeadSunEarth = false;
            this.annotations = false;
            this.createBookmarks = false;
            this.about = false;
            this.contact = false;
            this.credits = false;
            this.relatedLinks = false;
            this.releaseNotes = false;
            this.systemRequirements = false;
            this.help = false;
            this.login = false;

            if(menuConfig) {
                //if key exists and it is set to true, turn on the control
                if(menuConfig.annotations) this.annotations = true;
                if(menuConfig.createBookmarks) this.createBookmarks = true;
                if(menuConfig.about) this.about = true;
                if(menuConfig.contact) this.contact = true;
                if(menuConfig.credits) this.credits = true;
                if(menuConfig.relatedLinks) this.relatedLinks = true;
                if(menuConfig.releaseNotes) this.releaseNotes = true;
                if(menuConfig.systemRequirements) this.systemRequirements = true;
                if(menuConfig.help) this.help = true;
                if(menuConfig.login) this.login = true;
            }
        }
    });
});