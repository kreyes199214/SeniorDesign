

define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/topic",
    "dojo/request",
    "dojo/on",
    "dojo/request/xhr",
    "jpl/data/Layers",
    "jpl/data/LandingSite",
    "jpl/utils/MakeSingletonUtil",
    "jpl/config/Config",
    "jpl/events/LandingSiteEvent",
    "jpl/events/MapEvent"
], function(declare, lang, topic, request, on, xhr, Layers, LandingSite, MakeSingletonUtil, Config, LandingSiteEvent, MapEvent) {
    /**
     * Class to store landing site information.
     * @requires dojo/_base/declare
     * @requires dojo/_base/lang
     * @requires dojo/_base/declare
     * @requires dojo/request
     * @requires dojo/on
     * @requires dojo/request/xhr
     * @requires jpl/data/LaningSite
     * @requires jpl/utils/MakeSingletonUtil
     * @requires jpl/config/Config
     * @requires jpl/events/LandingSiteEvent
     * @requires jpl/events/MapEvent
     * @class jpl.data.LandingSites
     */
    return MakeSingletonUtil(
        declare("gov.nasa.jpl.data.LandingSites", [], /** @lends jpl.data.LandingSites.prototype */ {
                /**
                 * @property {string} - URL to retrieve the layers from. Should be set in the class that extends LayerCollection,
                 * otherwise will default to the configuration layer service URL.
                 * @type {string}
                 * @description URL to retrieve the layers from. Should be set in the class that extends LayerCollection,
                 * otherwise will default to the configuration layer service URL.
                 */
                url: "",
                /**
                 * @property {boolean} - Value to determine if base maps have been loaded previously
                 * @type {boolean}
                 * @description Value to determine if base maps have been loaded previously
                 */
                mapsLoaded: false,
                /**
                 * @property {string} - The active map projection, used as a reference from other modules
                 * @type {string}
                 * @description The active map projection, used as a reference from other modules
                 */
                currentMapProjection: null,
                /**
                 * @property {Array} - Collection for all equirectangular projection base map layers
                 * @type {Array}
                 * @description Collection for all equirectangular projection base map LandingSites
                 */
                landingSiteList: [],
                /**
                 * @property {string} - The topic name to publish when all items have finished loading
                 * @type {string}
                 * @description The topic name to publish when all items have finished loading
                 */
                loadedTopic: "",

                /**
                 * Constructor function that is used once to setup, and is destroyed immediately after. Since this is a
                 * Singleton, you do not use the new() operator, but instead use getInstance(). URL property should be overridden
                 * before the constructor is called, otherwise the Layer Service URL is used by default. All layers will be
                 * loaded into a corresponding projection collection.
                 * @return {null}
                 */
                constructor: function () {
                    if (!this.mapsLoaded) {
                        this.config = Config.getInstance();
                        
                        this.url = this.config.landingSiteServiceUrl;

                        var self = this;
                        //get and set the layers
                        this.getAllLandingSites(this.url)
                            .then(function (dataList) {
                                self.setAllLandingSites(dataList);
                            });

                        //default to equirect projection
                        this.currentMapProjection = this.config.projection.EQUIRECT;

                        //when projection is changed, update the current projection here
                        topic.subscribe(MapEvent.prototype.PROJECTION_CHANGED, lang.hitch(this, function (evt) {
                            this.currentMapProjection = evt.projection;
                        }));
                    }
                },

                /**
                 * Retrieves all layers and returns a promise containing an array of base maps.
                 * @param {string} url - The url to call to get the base map data.
                 * @return {promise} A promise that will return an array of base maps.
                 */
                getAllLandingSites: function (url) {
                    //return the promise
                    return xhr(url, {
                        handleAs: "json",
                        headers: {
                            "X-Requested-With": null
                        }
                    }).then(function (data) {
                        //return the actual data once the call is done
                        return data.LandingSites;
                    }, function (err) {
                        throw new Error("Could not retrieve landing sites from (" + url + ") - " + err);
                    });
                },

                /**
                 * Retrieves a landing sites given a landingSiteID
                 * @param {number} landingSiteID - landingSiteID to retrieve
                 * @return {object} A landing site object
                 */
                getLandingSiteByID: function(landingSiteID) {
                    for(var i=0; i < this.landingSiteList.length; i++) {
                        if(landingSiteID === this.landingSiteList[i].id) {
                            return this.landingSiteList[i];
                        }
                    }

                    throw new Error("Landing site not found with landing site id: " + landingSiteID);
                },

                /**
                 * Stores all base maps into their corresponding collection to be used throughout the application.
                 * @param {Array} layers - The array of layers to be stored.
                 * @return {null}
                 */
                setAllLandingSites: function (layers) {
                    for (var i = 0; i < layers.length; i++) {
                        //create the layer
                        var layer = this.createLandingSite(layers[i]);
                        this.landingSiteList.push(layer);
                    }

                    topic.publish(LandingSiteEvent.prototype.LANDING_SITES_LOADED, {landingSitesCount: this.landingSiteList.length});
                },

                /**
                 * Creates a layer object to be stored into a collection
                 * @param {object} attributes - The layer attributes from the retrieved data
                 * @return {layer} A Layer object with all attributes set
                 */
                createLandingSite: function (attributes) {
                    var landingSite = new LandingSite();
                    landingSite.id = attributes.id;
                    landingSite.name = attributes.name;
                    landingSite.thumbnailImage = attributes.thumbnailImage;
                    landingSite.description = attributes.description;
                    landingSite.projection = attributes.projection;
                    landingSite.regionInfo = attributes.regionInfo;
                    landingSite.bounding = attributes.bounding;
                    landingSite.pathInfo = attributes.pathInfo;
                    landingSite.teaserImage = attributes.teaserImage;
                    landingSite.teaserBigImage = attributes.teaserBigImage;
                    landingSite.sections = attributes.sections;
                    landingSite.items = {
                        layers: [],
                        features: []
                    };
                    landingSite.stlContent = attributes.stlContent;

                    for (var i=0; i < attributes.items.layers.length; i++) {
                        var layer = Layers.getInstance().createLayer(attributes.items.layers[i]);
                        landingSite.items.layers.push(layer);
                    }

                    for (var f=0; f < attributes.items.features.length; f++) {
                        var feature = Layers.getInstance().createLayer(attributes.items.features[f]);
                        landingSite.items.features.push(feature);
                    }

                    return landingSite;
                }

            }
        ));
});

