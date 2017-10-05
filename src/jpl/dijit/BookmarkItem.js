define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/on",
    "dojo/topic",
    "dojo/request/xhr",
    "dijit/registry",
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    'dojo/text!./templates/BookmarkItem.html',
    "jpl/events/LayerEvent",
    "jpl/events/LoadingEvent",
    "jpl/events/BookmarkEvent",
    "jpl/events/MapEvent",
    "jpl/utils/MapUtil",
    "jpl/config/Config"
], function (declare, lang, on, topic, xhr, registry, _WidgetBase, _TemplatedMixin, template, css, LayerEvent, LoadingEvent, BookmarkEvent, MapEvent,
             MapUtil, Config) {
    return declare([_WidgetBase, _TemplatedMixin], {
        templateString: template,
        addedLayers: [],
        added: false,
        map: null,
        waypoints: [],
        waypointLayer: null,
        pathLayer: null,
        waypointsHidden: false,
        graphicPoint: null,
        stlContent: "",

        constructor: function (bookmark, map) {
            this.bookmark = bookmark;
            this.map = map;
            this.config = Config.getInstance();
        },

        startup: function () {
            this.mapDijit = registry.byId("mainSearchMap");

            this.retrieveWaypoints(this.bookmark.items);

            on(this.bookmarkContainer, "click", lang.hitch(this, this.bookmarkContainerClicked));
        },

        findWaypointService: function(items) {
            var service;

            for(var i=0; i < items.features.length; i++) {
                if(items.features[i].productType === "FeatureWaypoints") {
                    service = items.features[i].services[0];
                }
            }

            return service;
        },

        retrieveWaypoints: function(items) {
            var service = this.findWaypointService(items)

            if(service && service.endPoint) {
                xhr(service.endPoint + "/query?f=json&where=1=1&outFields=*", {
                    handleAs: "json",
                    headers: {"X-Requested-With": null}
                }).then(lang.hitch(this, function (data) {
                    if(data.features){

                        var testDate = "2014-09-24T04:38Z";
                        for(var i=0; i < data.features.length; i++) {
                            switch(i){
                                case 0:
                                    testDate = "2010-01-04T04:38Z";
                                    break;
                                case 1:
                                    testDate = "2010-01-04T04:38Z";
                                    break;
                                case 2:
                                    testDate = "2010-01-05T04:38Z";
                                    break;
                                case 3:
                                    testDate = "2010-01-6T04:38Z";
                                    break;
                                case 4:
                                    testDate = "2010-01-12T04:38Z";
                                    break;
                                case 5:
                                    testDate = "2010-01-15T04:38Z";
                                    break;
                                case 6:
                                    testDate = "2010-01-20T04:38Z";
                                    break;
                                case 7:
                                    testDate = "2010-01-25T04:38Z";
                                    break;
                                case 8:
                                    testDate = "2010-01-30T04:38Z";
                                    break;
                                    //January 26 2010
                            }
                            data.features[i].attributes.date = testDate;

                        }
                        this.waypoints = data.features;
                    }
                }), function (err) {
                    throw new Error("Could not retrieve waypoints for bookmark (" + service.endPoint + ") - " + err);
                });
            }

        },

        bookmarkContainerClicked: function() {
            topic.publish(BookmarkEvent.prototype.SELECT_BOOKMARK, {bookmark: this.bookmark});
        },

        addWaypointGraphic: function(x, y, projection) {
            var map = this.getMap(projection);

            if(this.graphicPoint) {
                map.graphics.remove(this.graphicPoint);
            }

            this.graphicPoint = MapUtil.prototype.createGraphicMarkerPoint(x, y, map);

            map.graphics.add(this.graphicPoint);
        },

        removeWaypointGraphic: function(projection) {
            if(this.graphicPoint) {
                var map = this.getMap(projection);
                map.graphics.remove(this.graphicPoint);
                this.graphicPoint = null;
            }
        },

        showInfoWindow: function(x, y, projection, name, templateURL) {
            var map = this.getMap(projection)

            topic.publish(MapEvent.prototype.CLOSE_OVERHEAD_POPUP, null);

            MapUtil.prototype.checkAndSetMapProjection(
                this.bookmark.projection,
                this.mapDijit.currentMapProjection
            );

            // Center the map, then get the html detail info, then create a point and create the info window
            MapUtil.prototype.centerMapAt(map, x, y)
            .then(function(){
                xhr(templateURL)
                .then(function(content) {
                    var screenPoint = map.toScreen(MapUtil.prototype.createMapPoint(x, y, map));

                    map.infoWindow.setTitle(name);
                    map.infoWindow.setContent(content);
                    map.infoWindow.resize(400, 400)
                    map.infoWindow.show(screenPoint, map.getInfoWindowAnchor(screenPoint));
                    map.infoWindow._contentPane.scrollTop = 0;
                });
            })
        },

        containInAddedLayers: function(layer) {
            for (var i=0; i < this.addedLayers.length; i++) {
                if (this.addedLayers[i].productLabel === layer.id)
                    return true;
            }
            return false;
        },

        addBookmarkToMap: function(is3D, zoomTo) {
            var self = this;
            topic.publish(LoadingEvent.prototype.SHOW_BOOKMARK);
            var totalLayerCount = 0;
            var loadingLayerCount = 0;

            topic.subscribe(MapEvent.prototype.LAYER_ADDED, function(evt) {
                if (self.containInAddedLayers(evt.serviceLayer )) {
                    loadingLayerCount++;
                    if (loadingLayerCount >= totalLayerCount) {
                        topic.publish(BookmarkEvent.prototype.BOOKMARK_LAYERS_ADDED, this);
                    }
                }
            });

            setTimeout(lang.hitch(this, function() {
                //loop over layers and add to the map
                for(var l=0; l < this.bookmark.items.layers.length; l++) {
                    var layer = this.bookmark.items.layers[l];
                    this.addToMap(layer);
                    totalLayerCount++;
                }

                //loop over features and add to the map
                for(var f=0; f < this.bookmark.items.features.length; f++) {
                    var feature = this.bookmark.items.features[f];

                    if(feature.productType === "FeatureWaypoints") {
                        this.waypointLayer = feature;
                    } else if (feature.productType === "Feature") {
                        this.pathLayer = feature;
                    }

                    this.addToMap(feature);
                    totalLayerCount++;
                }

                if (zoomTo) {
                    if (is3D) {
                        this.zoomToExtent(is3D);
                    }
                    else {
                        this.zoomToExtent();
                    }
                }
                topic.publish(BookmarkEvent.prototype.BOOKMARK_ADDED, this);
            }), 600);
        },

        removeBookmarkFromMap: function() {
            for(var i=0; i < this.addedLayers.length; i++) {
                var layer = this.addedLayers[i];

                topic.publish(
                    LayerEvent.prototype.REMOVE_LAYER_CONTROL,
                    {"layer": layer}
                );
            }

            this.addedLayers = [];
            this.added = false;
            this.waypointsHidden = false;

            topic.publish(BookmarkEvent.prototype.BOOKMARK_REMOVED, this);
        },

        addToMap: function(layer) {
            //only add if it hasn't been added yet
            if(!registry.byId("myLayer_" + layer.productLabel)) {
                topic.publish(LayerEvent.prototype.ADD_TO_MY_DATA, {
                    productLabel: layer.productLabel,
                    projection: layer.layerProjection,
                    thumbnailURL: layer.thumbnailImage
                });

                
            }
            this.addedLayers.push(layer);
                this.added = true;
        },

        zoomToExtent: function(is3D) {
            var map = this.getMap(this.bookmark.projection);

            //zoom to extent of the bookmark
            MapUtil.prototype.setMapExtent(
                this.bookmark.bounding.leftbc,
                this.bookmark.bounding.bottombc,
                this.bookmark.bounding.rightbc,
                this.bookmark.bounding.topbc,
                map
            );

            if(is3D){
                MapUtil.prototype.checkAndSetMapProjection3D(
                    this.bookmark.projection,
                    this.mapDijit.currentMapProjection
                );

                //now that terrain start from 0, flyToExtent behaves little differently since the terrain is further away from ellipsoid surface.  widening
                //extent range by 0.2 degree.  this is a workaround solution.

                topic.publish(MapEvent.prototype.GLOBE_SET_EXTENT, {
                    xmin: this.bookmark.bounding.leftbc - 0.1,
                    xmax: this.bookmark.bounding.rightbc + 0.1,
                    ymin: this.bookmark.bounding.bottombc - 0.1,
                    ymax: this.bookmark.bounding.topbc + 0.1
                });
            }
            else{
                MapUtil.prototype.checkAndSetMapProjection(
                    this.bookmark.projection,
                    this.mapDijit.currentMapProjection
                );

                topic.publish(MapEvent.prototype.GLOBE_SET_EXTENT, {
                    xmin: this.bookmark.bounding.leftbc,
                    xmax: this.bookmark.bounding.rightbc,
                    ymin: this.bookmark.bounding.bottombc,
                    ymax: this.bookmark.bounding.topbc
                });

            }


        },

        viewRegion: function() {
            topic.publish(MapEvent.prototype.CLOSE_OVERHEAD_POPUP, null);

            var map = this.getMap(this.bookmark.projection),
                x = this.bookmark.regionInfo.x,
                y = this.bookmark.regionInfo.y,
                zoom = this.bookmark.regionInfo.zoom,
                name = this.bookmark.regionInfo.name,
                template = this.bookmark.regionInfo.template;

            MapUtil.prototype.centerMapAt(map, x, y).then(function() {
                map.setZoom(zoom).then(function () {
                    xhr(template).then(function (content) {
                        var screenPoint = map.toScreen(MapUtil.prototype.createMapPoint(x, y, map));

                        map.infoWindow.setTitle(name);
                        map.infoWindow.setContent(content);
                        map.infoWindow.resize(400, 400);
                        map.infoWindow.show(screenPoint, map.getInfoWindowAnchor(screenPoint));
                        map.infoWindow._contentPane.scrollTop = 0;
                    });
                })
            });

        },

        toggleWaypoints: function(isHidden) {
            topic.publish(LayerEvent.prototype.TOGGLE_VISIBILITY, {layer: this.waypointLayer});

            this.waypointsHidden = isHidden;
        },

        getMap: function(projection) {
            var map;

            if(projection === this.config.projection.EQUIRECT) {
                map = this.mapDijit.equirectMap;
            } else if(projection === this.config.projection.N_POLE) {
                map = this.mapDijit.northPoleMap;
            } else if(projection === this.config.projection.S_POLE) {
                map = this.mapDijit.southPoleMap;
            }

            return map;
        },

        hideInfoWindow: function(){
            var map = this.getMap(this.bookmark.projection);
            map.infoWindow.hide();
        }

    });
});