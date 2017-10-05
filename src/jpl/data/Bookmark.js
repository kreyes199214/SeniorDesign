define([
    "dojo/_base/declare"
], function (declare) {
    /**
     * Class to store bookmark information.
     * @requires dojo/_base/declare
     * @class jpl.data.Bookmark
     */
    return declare("gov.nasa.jpl.data.Bookmark",[], /** @lends jpl.data.Bookmark.prototype */ {
        /**
         * @property {string} - ID of the bookmark
         * @type {string}
         * @description ID of the bookmark
         */
        id: "",
        /**
         * @property {string} - Bookmark name
         * @type {string}
         * @description  Bookmark name
         */
        name: "",
        /**
         * @property {string} - Bookmark description
         * @type {string}
         * @description Bookmark description
         */
        description: "",
        /**
         * @property {string} - Slideshow content
         * @type {string}
         * @description Slideshow content
         */
        slideshow: "",
        /**
         * @property {string} - projection for the bookmark
         * @type {string}
         * @description projection for the bookmark
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
         * @property {string} - URL of bookmark full story page
         * @type {string}
         * @description URL of bookmark full story page
         */
        fullStoryURL: "",
        /**
         * @property {object} - Items contained in the bookmark (layers, features, etc.)
         * @type {object}
         * @description Items contained in the bookmark (layers, features, etc.)
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