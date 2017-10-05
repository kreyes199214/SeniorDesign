define([
    "dojo/_base/declare",
    "dojo/request/xhr",
    "jpl/utils/LabelFormatter"
], function (declare, xhr, LabelFormatter) {
    /**
     * Controller to handle distance calculation functionality
     * @requires dojo/_base/declare
     * @requires dojo/request/xhr
     * @requires jpl/utils/LabelFormatter
     * @class jpl.controllers.DistanceController
     */
    return declare(null,  /** @lends jpl.controllers.DistanceController.prototype */ {

        /**
         * Retrieves configuration JSON file from provided path. Path to config should be defined in app/App module.
         * @param {string} serviceURL - The distance service URL.
         * @param {string} endpointURL - The elevation (DEM) image service url.
         * @param {array} paths - Array of [x,y] points to describe the line path.
         * @param {string} radius - Radius of the ellipsoid in meters.
         * @return {number} Total distance of line in meters
         */
        calculateDistance: function(serviceURL, endpointURL, paths, radius) {
            var distanceURL = serviceURL + "?endpoint=" + endpointURL +
                "&path=" + encodeURIComponent(JSON.stringify(paths)) + "&radiusInMeters=" + radius;

            return this.getDistanceValue(distanceURL);
        },

        /**
         * Makes an XHR call to distanceURL and returns a formatted total distance
         * @private
         * @param {string} distanceURL - The distance service URL.
         * @return {number} Total distance of line in meters
         */
        getDistanceValue: function(distanceURL) {
            return xhr(distanceURL, {
                handleAs: "json",
                headers: {
                    "X-Requested-With": null
                }
            }).then(function(data) {
                return LabelFormatter.prototype.distanceLabelFromValue(data.totalDistance);
            }, function(err) {
                throw new Error("Error Calculating Distance: " + err);
            });
        }

    });
});