define([
    "dojo/_base/declare"
], function (declare) {
    /**
     * Class to store landing site information.
     * @requires dojo/_base/declare
     * @class jpl.data.LandingSite
     */
    return declare("gov.nasa.jpl.data.LandingSite",[], /** @lends jpl.data.LandingSite.prototype */ {
        /**
         * @property {string} - ID of the landing site
         * @type {string}
         * @description ID of the landing site
         */
        id: "",
        /**
         * @property {string} - Landing site name
         * @type {string}
         * @description  Landing site name
         */
        name: "",
        /**
         * @property {string} - Landing site description
         * @type {string}
         * @description Landing site description
         */
        description: "",
        /**
         * @property {string} - Slideshow content
         * @type {string}
         * @description Slideshow content
         */
        slideshow: "",
        /**
         * @property {string} - projection for the Landing site
         * @type {string}
         * @description projection for the Landing site
         */
        projection: "",
        /**
         * @property {string} - URL of thumbnail image
         * @type {string}
         * @description URL of thumbnail image
         */
        thumbnailURL: "",
        /**
         * @property {string} - URL of teaser image
         * @type {string}
         * @description URL of teaser image
         */
        teaserImage: "",
        /**
         * @property {string} - URL of teaser big image
         * @type {string}
         * @description URL of teaser big image
         */
        teaserBigImage: "",
        /**
         * @property {string} - URL of landing site full story page
         * @type {string}
         * @description URL of landing site full story page
         */
        fullStoryURL: "",
        /**
         * @property {object} - Items contained in the landing site (layers, features, etc.)
         * @type {object}
         * @description Items contained in the landing site (layers, features, etc.)
         */
        items: {},
        /**
         * @property {string} - Content description of STL file
         * @type {string}
         * @description Content description of STL file
         */
        stlContent: "",
        sections: [],

        constructor: function () {
        }
    });
});