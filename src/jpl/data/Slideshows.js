define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/topic",
    "dojo/request/xhr",
    "jpl/data/Slideshow",
    "jpl/utils/MakeSingletonUtil",
    "jpl/config/Config",
    "jpl/events/SlideshowEvent",
    "jpl/events/MapEvent"
], function(declare, lang, topic, xhr, Slideshow, MakeSingletonUtil, Config, SlideshowEvent, MapEvent) {
    /**
     * Class to store slideshow information.
     * @requires dojo/_base/declare
     * @requires dojo/_base/lang
     * @requires dojo/_base/declare
     * @requires dojo/request/xhr
     * @requires jpl/data/Slideshow
     * @requires jpl/utils/MakeSingletonUtil
     * @requires jpl/config/Config
     * @requires jpl/events/SlideshowEvent
     * @requires jpl/events/MapEvent
     * @class jpl.data.Slideshows
     */
    return MakeSingletonUtil(
        declare("gov.nasa.jpl.data.Slideshows", [], /** @lends jpl.data.Slideshows.prototype */ {
            /**
             * @property {string} - URL to retrieve the slideshows from.
             * @type {string}
             * @description URL to retrieve the slideshows from.
             */
            url: "",
            /**
             * @property {string} - The active map projection, used as a reference from other modules
             * @type {string}
             * @description The active map projection, used as a reference from other modules
             */
            currentMapProjection: null,
            /**
             * @property {Array} - Collection for all equirectangular projection base map layers
             * @type {Array}
             * @description Collection for all equirectangular projection slideshows
             */
            categoriesList: [],

            /**
             * Constructor function that is used once to setup, and is destroyed immediately after. Since this is a
             * Singleton, you do not use the new() operator, but instead use getInstance(). URL property should be overridden
             * before the constructor is called, otherwise the Layer Service URL is used by default. All layers will be
             * loaded into a corresponding projection collection.
             * @return {null}
             */
            constructor: function () {
                this.config = Config.getInstance();
                this.url = this.config.slideshowServiceUrl;

                var self = this;
                //get and set the layers
                this.getAllCategories(this.url)
                    .then(function (dataList) {
                        self.setAllCategories(dataList);
                    });

                //default to equirect projection
                this.currentMapProjection = this.config.projection.EQUIRECT;

                //when projection is changed, update the current projection here
                topic.subscribe(MapEvent.prototype.PROJECTION_CHANGED, lang.hitch(this, function (evt) {
                    this.currentMapProjection = evt.projection;
                }));
            },

            /**
             * Retrieves all layers and returns a promise containing an array of slideshows.
             * @param {string} url - The url to call to get the slideshow data.
             * @return {promise} A promise that will return an array of slideshows.
             */
            getAllCategories: function (url) {
                //return the promise
                return xhr(url, {
                    handleAs: "json",
                    headers: {
                        "X-Requested-With": null
                    }
                }).then(function (data) {
                    //return the actual data once the call is done
                    return data.MarsTrek.Category;
                }, function (err) {
                    throw new Error("Could not retrieve slideshows from (" + url + ") - " + err);
                });
            },

            /**
             * Retrieves a slideshow given a slideshowID
             * @param {number} slideshowID - slideshowID to retrieve
             * @return {object} A slideshow object
             */
            /*getSlideshowByID: function(slideshowID) {
                for(var i=0; i < this.slideshowList.length; i++) {
                    if(slideshowID === this.slideshowList[i].id) {
                        return this.slideshowList[i];
                    }
                }

                throw new Error("Slideshow not found with SlideshowID: " + slideshowID);
            },*/

            /**
             * Stores all slideshows into their corresponding collection to be used throughout the application.
             * @param {Array} slideshows - The array of slideshows to be stored.
             * @return {null}
             */
            setAllCategories: function (categories) {
                for (var i = 0; i < categories.length; i++) {
                    this.categoriesList.push(categories[i]);
                    //create the slideshows
                    //var slideshows = this.createSlideshow(slideshows[i]);
                    //this.slideshowList.push(slideshows);
                }

                topic.publish(SlideshowEvent.prototype.SLIDESHOWS_LOADED, {slideshowCount: this.categoriesList.length});
                //topic.publish(SlideshowEvent.prototype.SLIDESHOWS_LOADED, {slideshowCount: this.slideshowList.length});
            },

            /**
             * Creates a layer object to be stored into a collection
             * @param {object} attributes - The layer attributes from the retrieved data
             * @return {layer} A Layer object with all attributes set
             */
            createSlideshow: function (attributes) {
                /*var slideshow = new Slideshow();
                slideshow.id = attributes.id;
                slideshow.name = attributes.name;
                slideshow.thumbnailImage = attributes.thumbnailImage;
                slideshow.description = attributes.description;
                slideshow.projection = attributes.projection;
                slideshow.centerPoint = attributes.centerPoint;
                slideshow.slides = attributes.slides;*/

                //return slideshow;
            }

        }
    ));
});