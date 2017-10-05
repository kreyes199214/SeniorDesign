define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/topic",
    "dojo/request",
    "dojo/on",
    "dojo/request/xhr",
    "jpl/data/Layers",
    "jpl/data/Bookmark",
    "jpl/utils/MakeSingletonUtil",
    "jpl/config/Config",
    "jpl/events/BookmarkEvent",
    "jpl/events/MapEvent"
], function(declare, lang, topic, request, on, xhr, Layers, Bookmark, MakeSingletonUtil, Config, BookmarkEvent, MapEvent) {
    /**
     * Class to store bookmark information.
     * @requires dojo/_base/declare
     * @requires dojo/_base/lang
     * @requires dojo/_base/declare
     * @requires dojo/request
     * @requires dojo/on
     * @requires dojo/request/xhr
     * @requires jpl/data/Bookmark
     * @requires jpl/utils/MakeSingletonUtil
     * @requires jpl/config/Config
     * @requires jpl/events/BookmarksEvent
     * @requires jpl/events/MapEvent
     * @class jpl.data.Bookmarks
     */
    return MakeSingletonUtil(
        declare("gov.nasa.jpl.data.Bookmarks", [], /** @lends jpl.data.Bookmarks.prototype */ {
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
             * @description Collection for all equirectangular projection base map Bookmarks
             */
            bookmarkList: [],
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
                    this.url = this.config.bookmarkServiceURL;

                    var self = this;
                    //get and set the layers
                    this.getAllBookmarks(this.url)
                        .then(function (dataList) {
                            self.setAllBookmarks(dataList);
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
            getAllBookmarks: function (url) {
                //return the promise
                return xhr(url, {
                    handleAs: "json",
                    headers: {
                        "X-Requested-With": null
                    }
                }).then(function (data) {
                    //return the actual data once the call is done
                    return data.Bookmarks;
                }, function (err) {
                    throw new Error("Could not retrieve bookmarks from (" + url + ") - " + err);
                });
            },

            /**
             * Retrieves a bookmark given a bookmarkID
             * @param {number} bookmarkID - bookmarkID to retrieve
             * @return {object} A bookmark object
             */
            getBookmarkByID: function(bookmarkID) {
                for(var i=0; i < this.bookmarkList.length; i++) {
                    if(bookmarkID === this.bookmarkList[i].id) {
                        return this.bookmarkList[i];
                    }
                }

                throw new Error("Bookmark not found with BookmarkID: " + bookmarkID);
            },

            /**
             * Stores all base maps into their corresponding collection to be used throughout the application.
             * @param {Array} layers - The array of layers to be stored.
             * @return {null}
             */
            setAllBookmarks: function (layers) {
                for (var i = 0; i < layers.length; i++) {
                    //create the layer
                    var layer = this.createBookmark(layers[i]);
                    this.bookmarkList.push(layer);
                }

                topic.publish(BookmarkEvent.prototype.BOOKMARKS_LOADED, {bookmarkCount: this.bookmarkList.length});
            },

            /**
             * Creates a layer object to be stored into a collection
             * @param {object} attributes - The layer attributes from the retrieved data
             * @return {layer} A Layer object with all attributes set
             */
            createBookmark: function (attributes) {
                var bookmark = new Bookmark();
                bookmark.id = attributes.id;
                bookmark.name = attributes.name;
                bookmark.thumbnailImage = attributes.thumbnailImage;
                bookmark.description = attributes.description;
                bookmark.projection = attributes.projection;
                bookmark.regionInfo = attributes.regionInfo;
                bookmark.bounding = attributes.bounding;
                bookmark.pathInfo = attributes.pathInfo;
                bookmark.teaserImage = attributes.teaserImage;
                bookmark.teaserBigImage = attributes.teaserBigImage;
                bookmark.sections = attributes.sections;
                bookmark.items = {
                    layers: [],
                    features: []
                };
                bookmark.stlContent = attributes.stlContent;

                for (var i=0; i < attributes.items.layers.length; i++) {
                    var layer = Layers.getInstance().createLayer(attributes.items.layers[i]);
                    bookmark.items.layers.push(layer);
                }

                for (var f=0; f < attributes.items.features.length; f++) {
                    var feature = Layers.getInstance().createLayer(attributes.items.features[f]);
                    bookmark.items.features.push(feature);
                }
                return bookmark;
            }

        }
    ));
});