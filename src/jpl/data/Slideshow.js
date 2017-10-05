define([
    "dojo/_base/declare"
], function (declare) {
    /**
     * Class to store slideshow information.
     * @requires dojo/_base/declare
     * @class jpl.data.Slideshow
     */
    return declare("gov.nasa.jpl.data.Slideshow",[], /** @lends jpl.data.Slideshow.prototype */ {
        /**
         * @property {string} - ID of the slideshow
         * @type {string}
         * @description ID of the slideshow
         */
        id: "",
        /**
         * @property {string} - slideshow name
         * @type {string}
         * @description  slideshow name
         */
        name: "",
        /**
         * @property {string} - slideshow description
         * @type {string}
         * @description slideshow description
         */
        description: "",
        /**
         * @property {string} - projection for the slideshow
         * @type {string}
         * @description projection for the slideshow
         */
        projection: "",
        /**
         * @property {string} - URL of thumbnail image
         * @type {string}
         * @description URL of thumbnail image
         */
        thumbnailURL: "",
        /**
         * @property {object} - center point of slideshow
         * @type {object}
         * @description center point of slideshow
         */
        centerPoint: {},
        /**
         * @property {Array} - slides contained in the slideshow
         * @type {Array}
         * @description slides contained in the slideshow
         */
        slides: []
	});
});