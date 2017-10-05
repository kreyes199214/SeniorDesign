define([
    "dojo/_base/declare",
    'dojo/request/script'
], function (declare, script) {
    /**
     * Class to insert Google Analytics tracking code asynchronously.
     * @requires dojo/_base/declare
     * @requires dojo/request/script
     * @class jpl.utils.Analytics
     */
    return declare([], /** @lends jpl.utils.Analytics.prototype */ {
        /**
         * Constructor function that initializes Google Analytics with provided tracking ID
         * @param {string} analyticsID - The Google Analytics tracking ID
         * @return {null}
         */
        constructor: function (analyticsID) {
            //initialize the google analytics objects on the window
            window.GoogleAnalyticsObject = 'ga';
            window.ga = function() {(window.ga.q = window.ga.q || []).push(arguments);};
            window.ga.l = 1 * new Date();
            //fetch the google analytics script and set our analytics ID to start tracking
            script.get('//google-analytics.com/analytics.js').then(function(data) {
                window.ga('create', analyticsID, 'auto');
                window.ga('send', 'pageview');
            });
        }
    });
});