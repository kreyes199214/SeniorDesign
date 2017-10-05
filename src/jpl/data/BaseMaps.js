define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/topic",
    "dojo/request",
    "dojo/on",
    "dojo/request/xhr",
    "jpl/data/Layer",
    "jpl/utils/MakeSingletonUtil",
    "jpl/utils/IndexerUtil",
    "jpl/config/Config",
    "jpl/events/LayerEvent",
    "jpl/events/MapEvent",
    "dojo/promise/all"
], function(declare, lang, topic, request, on, xhr, Layer, MakeSingletonUtil, IndexerUtil, Config, LayerEvent, MapEvent, all) {
    /**
     * Class to store basemap information.
     * @requires dojo/_base/declare
     * @requires dojo/_base/lang
     * @requires dojo/_base/declare
     * @requires dojo/request
     * @requires dojo/on
     * @requires dojo/request/xhr
     * @requires jpl/data/Layer
     * @requires jpl/utils/MakeSingletonUtil
     * @requires jpl/config/Config
     * @requires jpl/events/LayerEvent
     * @requires jpl/events/MapEvent
     * @class jpl.data.BaseMaps
     */
    return MakeSingletonUtil(
        declare("gov.nasa.jpl.data.BaseMaps", [], /** @lends jpl.data.BaseMaps.prototype */ {
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
             * @property {array} - Collection for all equirectangular projection base map layers
             * @type {array}
             * @description Collection for all equirectangular projection base map layers
             */
            centerLayerList: [],
            /**
             * @property {array} - Collection for all north pole projection base map layers
             * @type {array}
             * @description Collection for all north pole projection base map layers
             */
            northLayerList: [],
            /**
             * @property {array} - Collection for all south pole projection base map layers
             * @type {array}
             * @description Collection for all south pole projection base map layers
             */
            southLayerList: [],
            /**
             * @property {string} - The topic name to publish when all items have finished loading
             * @type {string}
             * @description The topic name to publish when all items have finished loading
             */
            loadedTopic: "",

            defaultBasemaps: [],

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
                    this.indexerUtil = new IndexerUtil();
                    this.url = this.config.basemapServiceURL + "?_q=" + Math.random();
                    this.loadedTopic = LayerEvent.prototype.BASEMAPS_LOADED;

                    var self = this;
                    //get and set the layers
                    if(this.config.useIndexerLayers) {
                        this.getAllLayersUsingIndexer(this.url);
                    }
                    else if(this.config.controls.tree){
                        this.getAllLayersUsingStaticFile(this.url).then(function (dataList) {
                            self.setAllLayersUsingStaticFile(dataList, self.config.projection);
                        });
                    }
                    else{
                        this.getAllLayersUsingStaticFile(this.url).then(function (dataList) {
                            self.setAllLayersUsingStaticFile(dataList, self.config.projection);
                        });
                    }

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
             getAllLayersUsingIndexer: function (url) {
                var self = this;
                xhr(url, {
                    handleAs: "json",
                    headers: {"X-Requested-With": null}
                }).then(function (data) {
                    self.defaultBasemaps = data.defaultBasemaps;
                    var productEQLabels = data.basemaps.equirect;
                    var productNPLabels = data.basemaps.n_pole;
                    var productSPLabels = data.basemaps.s_pole;

                    var items = {};
                    var itemPromises = [];
                    for (var eqI=0; eqI<productEQLabels.length; eqI++) {
                        var itemUrl = self.indexerUtil.createGetItemUrl({productLabel:productEQLabels[eqI], projection: self.config.projection.EQUIRECT} );
                        var itemPromise = xhr(itemUrl, {
                            handleAs: "json",
                            headers: {"X-Requested-With": null}
                        }).then(function(data){
                            items[data.response.docs[0].item_UUID] = data;
                        }, function(err){
                            throw new Error("Could not retrieve item from (" + itemUrl + ") - " + err);
                        });
                        itemPromises.push(itemPromise);
                    }

                    for (var npI=0; npI<productNPLabels.length; npI++) {
                        var itemUrl = self.indexerUtil.createGetItemUrl({productLabel:productNPLabels[npI], projection: self.config.projection.N_POLE} );
                        var itemPromise = xhr(itemUrl, {
                            handleAs: "json",
                            headers: {"X-Requested-With": null}
                        }).then(function(data){
                            items[data.response.docs[0].item_UUID] = data;
                        }, function(err){
                            throw new Error("Could not retrieve item from (" + itemUrl + ") - " + err);
                        });
                        itemPromises.push(itemPromise);
                    }

                    for (var spI=0; spI<productSPLabels.length; spI++) {
                        var itemUrl = self.indexerUtil.createGetItemUrl({productLabel:productSPLabels[spI], projection: self.config.projection.S_POLE} );
                        var itemPromise = xhr(itemUrl, {
                            handleAs: "json",
                            headers: {"X-Requested-With": null}
                        }).then(function(data){
                            items[data.response.docs[0].item_UUID] = data;
                        }, function(err){
                            throw new Error("Could not retrieve item from (" + itemUrl + ") - " + err);
                        });
                        itemPromises.push(itemPromise);
                    }


                    all(itemPromises).then(function() {
                        var layerServices = {};
                        var layerServicePromises = [];
                        for (var key in items) {
                            var item = items[key];
                            var layerServiceUrl = self.indexerUtil.createLayerServicesUrl(item.response.docs[0].item_UUID);
                            var layerServicePromise = xhr(layerServiceUrl, {
                                handleAs: "json",
                                headers: {"X-Requested-With": null}
                            }).then(function(data){
                                layerServices[data.response.docs[0].item_UUID] = data;
                            }, function(err){
                                throw new Error("Could not retrieve layer service from (" + layerServiceUrl + ") - " + err);
                            });
                            layerServicePromises.push(layerServicePromise);
                        }

                        all(layerServicePromises).then(function(results) {
                            self.setAllLayersUsingIndexer(items, layerServices);
                        });
                    });


                }, function (err) {
                    throw new Error("Could not retrieve layers from (" + url + ") - " + err);
                });
             },

            /**
             * Stores all base maps into their corresponding collection to be used throughout the application.
             * @param {array} layers - The array of layers to be stored.
             * @param {object} projections - A projection object, generally copied from the config before passed.
             * @return {null}
             */
            setAllLayersUsingIndexer: function (items, layerServices) {
                console.info("loading basemap attempt");
                for (var key in items) {
                    //create the layer
                    var layer = this.indexerUtil.createLayer(items[key], layerServices[key]);
                    //determine the projectin of the layer and store in that collection
                    if (layer.layerProjection === this.config.projection.N_POLE) {
                        this.northLayerList.push(layer);
                    } else if (layer.layerProjection === this.config.projection.S_POLE) {
                        this.southLayerList.push(layer);
                    } else if (layer.layerProjection === this.config.projection.EQUIRECT) {
                        this.centerLayerList.push(layer);
                    }
                }

                //set the flag that all layers have been loaded and fire off an event for anyone listening
                this.mapsLoaded = true;
                //if a topic was passed in, fire it off to signify completion
                if (this.loadedTopic !== "") {
                    console.info("loading basemap loaded");
                    topic.publish(this.loadedTopic, null);
                }
            },

            getAllLayersUsingStaticFile: function (url) {
                //return the promise
                return xhr(url, {
                    handleAs: "json",
                    headers: {"X-Requested-With": null}
                }).then(function (data) {
                    //return the actual data once the call is done
                    return data.Layers;
                }, function (err) {
                    throw new Error("Could not retrieve layers from (" + url + ") - " + err);
                });
            },

            setAllLayersUsingStaticFile: function (layers, projections) {
                console.info("loading basemap attempt");
                layers = layers.Layer;
                for (var i = 0; i < layers.length; i++) {
                    //create the layer
                    var layer = this.createLayer(layers[i]);
                    //determine the projectin of the layer and store in that collection
                    if (layer.layerProjection === projections.N_POLE) {
                        this.northLayerList.push(layer);
                    } else if (layer.layerProjection === projections.S_POLE) {
                        this.southLayerList.push(layer);
                    } else if (layer.layerProjection === projections.EQUIRECT) {
                        this.centerLayerList.push(layer);
                    }
                }

                //set the flag that all layers have been loaded and fire off an event for anyone listening
                this.mapsLoaded = true;
                //if a topic was passed in, fire it off to signify completion
                if (this.loadedTopic !== "") {
                    console.info("loading basemap loaded");
                    topic.publish(this.loadedTopic, null);
                }
            },

            /**
             * Finds and returns a specified service from the list of services available to the basemap.
             * @param {array} services - The array of services for the basemap.
             * @param {string} protocol - The protocol to select from list of services
             * @return {object}
             */
            selectServiceByType: function(services, type) {
                var result;


                for(var i=0; i < services.length; i++) {
                    if(services[i].serviceType === type) {
                        return services[i];
                    }
                }

                if(!result) {
                    //if nothing was found, throw an error
                    throw new Error("service '" + type + "' was not found in list of services for basemap");
                }

            },

            /**
             * Searches and retrieves a base map from a collection. If projection and projections are not passed, it will search
             * all collections for a match.
             * @param {string} productLabel - The product label for the layer to be retrieved
             * @param {string} projection - Optional, The projection of the product to determine the collection to search in
             * @param {object} projections - Optional, A projection object, generally copied from the config before passed
             * @return {layer} A Layer object
             */
            getLayerByProductLabel: function (productLabel, projection) {
                if (projection && this.config.projection) {
                    var layerCollection;
                    //get the collection to use from the projection passed in
                    if (projection === this.config.projection.N_POLE) {
                        layerCollection = this.northLayerList;
                    } else if (projection === this.config.projection.S_POLE) {
                        layerCollection = this.southLayerList;
                    } else if (projection === this.config.projection.EQUIRECT) {
                        layerCollection = this.centerLayerList;
                    }

                    //cycle through the collection to find the match
                    for (var i = 0; i < layerCollection.length; i++) {
                        if (layerCollection[i].productLabel === productLabel) {
                            return layerCollection[i];
                            break;
                        }
                    }
                } else {
                    //search equirect layers
                    for (var cidx = 0; cidx < this.centerLayerList.length; cidx++) {
                        if (this.centerLayerList[cidx].productLabel === productLabel) {
                            return this.centerLayerList[cidx];
                        }
                    }

                    //search north pole layers
                    for (var nidx = 0; nidx < this.northLayerList.length; nidx++) {
                        if (this.northLayerList[nidx].productLabel === productLabel) {
                            return this.northLayerList[nidx];
                        }
                    }

                    //search south pole layers
                    for (var sidx = 0; sidx < this.southLayerList.length; sidx++) {
                        if (this.southLayerList[sidx].productLabel === productLabel) {
                            return this.southLayerList[sidx];
                        }
                    }
                }

                return null;
            },

            createLayer: function (attributes) {
                var layer = new Layer();
                if(attributes.bbox) {
                    var bbox = {
                        west: attributes.bbox.leftbc,
                        east: attributes.bbox.rightbc,
                        north: attributes.bbox.topbc,
                        south: attributes.bbox.bottombc
                    };
                }
                if(attributes.bounding){
                    var bbox = {
                        west: attributes.bounding.leftbc,
                        east: attributes.bounding.rightbc,
                        north: attributes.bounding.topbc,
                        south: attributes.bounding.bottombc
                    };
                }

                layer.uuid = attributes.UUID;
                layer.mission = attributes.mission;
                layer.instrument = attributes.instrument;
                layer.productLabel = attributes.productLabel;
                layer.productType = attributes.productType;

                layer.service = this.selectServiceByType(attributes.services, "Mosaic");


                layer.services = attributes.services;

                layer.serviceProtocol = layer.service.protocol;
                layer.arcGISType = "";
                layer.endPoint = layer.service.EndPoint;
                layer.WMSEndPoint = "";
                layer.WMSLayers = "";
                layer.layerTitle = attributes.title;
                layer.description = attributes.description;
                layer.thumbnailImage = attributes.thumbnailImage;
                layer.layerProjection = attributes.layerProjection;
                layer.boundingBox = bbox;
                layer.legendURL = attributes.legend;

                return layer;
            }
        }
    ));
});