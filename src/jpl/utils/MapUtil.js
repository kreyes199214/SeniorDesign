define([
    "dojo/_base/declare",
    "dojo/topic",
    "dojo/_base/lang",
    "dojo/on",
    "dojo/i18n!./../dijit/nls/textContent",
    "dojo/request/xhr",
    "dojo/dom",
    "dojo/dom-construct",
    "dojo/_base/window",
    "esri/layers/ArcGISDynamicMapServiceLayer",
    "esri/layers/ArcGISTiledMapServiceLayer",
    "esri/layers/ArcGISImageServiceLayer",
    "esri/geometry/Extent",
    "esri/map",
    "esri/dijit/Attribution",
    "esri/SpatialReference",
    "jpl/config/Config",
    "jpl/data/Projection",
    "jpl/events/MapEvent",
    "esri/geometry/Polygon",
    "esri/geometry/Point",
    "esri/symbols/SimpleFillSymbol",
    "esri/symbols/SimpleLineSymbol",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/symbols/PictureMarkerSymbol",
    "esri/symbols/TextSymbol",
    "esri/symbols/Font",
    "esri/Color",
    "esri/graphic",
    "esri/layers/GraphicsLayer",
    "esri/layers/FeatureLayer",
    "esri/layers/LabelLayer",
    "esri/layers/LabelClass",
    "esri/tasks/query",
    "esri/renderers/SimpleRenderer",
    "jpl/plugins/esri/MarkerRenderer",
    "jpl/plugins/esri/TextRenderer",
    "esri/InfoTemplate",
    "jpl/plugins/esri/TrekWMTSLayer",
    "jpl/plugins/esri/WMTSReader",
    "esri/layers/WMTSLayer",
    "jpl/plugins/esri/ArcGISTiledMapReader",
    "jpl/events/NavigationEvent",
    "jpl/events/SearchEvent",
    "jpl/utils/JSONConverter"
], function (declare, topic, lang, on, textContent, xhr, dom, domConstruct, win, ArcGISDynamicMapServiceLayer, ArcGISTiledMapServiceLayer, ArcGISImageServiceLayer, Extent, Map,
             Attribution, SpatialReference, Config, Projection, MapEvent, Polygon, Point, SimpleFillSymbol, SimpleLineSymbol, SimpleMarkerSymbol, PictureMarkerSymbol,
             TextSymbol, Font, Color, Graphic, GraphicsLayer, FeatureLayer, LabelLayer, LabelClass, esriQuery, SimpleRenderer, MarkerRenderer, TextRenderer, InfoTemplate, TrekWMTSLayer,WMTSReader,WMTSLayer,
             ArcGISTiledMapReader, NavigationEvent, SearchEvent, JSONConverter){
    return declare(null, {
        slideShowData: null,
        json: new JSONConverter(),

        constructor: function () {
        },

        /***
         * Creates a new map
         * @param container - The container to place to map
         * @param zoomLevel - The initial zoom level of the map
         * @param projection - The projection string to get the extent
         */
        createMap: function(container, zoomLevel, projection) {
            var config = Config.getInstance();
            var initialExtent = this.getInitialExtent(projection);
            var map = null;

            // if(config.controls.slideshow){
            //     if(this.slideShowData === null){
            //         var self = this;
            //         url = "http://mars.nasa.gov/slideshows.json/explore/marsglobe/slideshow_manifest.txt";
            //         add
            //     }
            // }

            if(projection === config.projection.EQUIRECT) {

                map = new Map(container, {
                    logo: false,
                    //autoResize: false,
                    zoom: zoomLevel,
                    minZoom: 1,
                    slider: false,
                    sliderPosition: "bottom-right",
                    smartNavigation: false,
                    wrapAround180: false,
                    showAttribution: true,
                    showLabels: true,
                    optimizePanAnimation: false
                });
            } else if(projection === config.projection.N_POLE) {
                map = new Map(container, {
                    logo: false,
                    //autoResize: false,
                    zoom: zoomLevel,
                    slider: false,
                    sliderPosition: "bottom-right",
                    smartNavigation: false,
                    showAttribution: true
                });
            } else {
                map = new Map(container, {
                    logo: false,
                    //autoResize: false,
                    zoom: zoomLevel,
                    slider: false,
                    sliderPosition: "bottom-right",
                    smartNavigation: false,
                    showAttribution: true
                 });
            }

            return map;
        },

        /***
         * Centers the map to the lat,lon provided
         * @param map - The map object to add the layer
         * @param lat - latitude to center the map to
         * @param lon - longitude to center the map to
         */
        centerMapAt: function(map, lat, lon) {
            var centerPoint = new Point(lat, lon, map.spatialReference);
            return map.centerAt(centerPoint);
        },

        centerAndZoomMapAt: function(map, lon, lat, zoomLevel) {
            if(map.extent) {
                var centerPoint = new Point(lon, lat, map.extent.spatialReference);
                //esri map bahaves bad if zoom from 1 to 18
                if (map.getZoom() < 4 && zoomLevel > 16) {
                    map.setZoom(9).then(function () {
                        setTimeout(function(){
                            map.setZoom(zoomLevel).then(function () {
                                map.centerAt(centerPoint).then(function () {
                                    //workaround.  don't need to set the extent..however, centerAt here does not triger panEnd event for some reason.  setExtent is called just to fire panEnd event
                                    map.setExtent(map.extent);
                                    topic.publish(MapEvent.prototype.CENTERED_ZOOM_MAP_AT, {
                                        point: centerPoint,
                                        zoom: zoomLevel
                                    });

                                });
                            });
                        }, 1000);

                    });
                } else {
                    map.setZoom(zoomLevel).then(function () {
                        map.centerAt(centerPoint).then(function () {
                            //workaround.  don't need to set the extent..however, centerAt here does not triger panEnd event for some reason.  setExtent is called just to fire panEnd event
                            map.setExtent(map.extent);
                            topic.publish(MapEvent.prototype.CENTERED_ZOOM_MAP_AT, {
                                point: centerPoint,
                                zoom: zoomLevel
                            });

                        });
                    });
                }
            }
        },

        createMapPoint: function(x, y, map) {
            return new Point(x, y, map.spatialReference);
        },


        addRegionLayerToMap: function(layer, map, polar) {

            var template = new InfoTemplate();
            template.setTitle("Region");
            template.setContent(getTextContent);

            function getTextContent(graphic){
                var attr = graphic.attributes;

                var content = '<table width="100%" class="nomenclature-info">';

                content += '<tr><th>Name:</th><td>' + attr['title'] + '</td></tr>';


                // for (var i=0;i<keys.length; i++) {
                //     if (keys[i].toLowerCase() == "link") {
                //         if (/\S/.test(attr.link)) {
                //             content += '<tr><th></th><td><a href="' + attr.link + '" target="_blank">Additional Info</a></td></tr>';
                //         }
                //     } else {
                //         content += '<tr><th>' + fieldTable[keys[i]] + ':</th><td>' + attr[keys[i]] + '</td></tr>';
                //     }
                // }

                content += "</table>";
                if (attr['imageURL'] != undefined) {
                    var imagePath = attr.imageURL.substring(0, attr.imageURL.lastIndexOf(".")) + "-ci" + attr.imageURL.substring(attr.imageURL.lastIndexOf("."), (attr.imageURL.length));
                    content += "<img src='" + imagePath + "'>";
                }
                if (attr['ssid'] != undefined)
                    content += '<p class="popupButtonContainerP"><button type="button" value="' + attr["ssid"] + '" class="btn btn-link popupShowFeatureInSidebarBtn">More</button></p>';
                return content;
            }

            on(win.doc, '.popupShowFeatureInSidebarBtn:click', function(evt){
                var fid = evt.target.value;
                topic.publish(SearchEvent.prototype.FEATURE_MORE_BTN_PRESSED, {fid:fid,layer:layer});
            });

            var regionLayer = this.createRegionLayer(layer, template);
            var labelLayer = new LabelLayer({
                id: layer.productLabel + "_LABEL",
                mode: 'DYNAMIC'
            });

            map.addLayer(regionLayer);
            labelLayer.addFeatureLayer(regionLayer);

            map.addLayer(labelLayer);

                    //               dojo.query("#popupShowSlideShowButton" + pole).on("click", function(evt){
                    //                 if(isRegionSlideShowPopup){
                    //                     topic.publish(NavigationEvent.prototype.OPEN_SIDEBAR, {selectedOption: "Slideshows", resize: false});
                    //                     topic.publish(MapEvent.prototype.REGION_LABEL_SELECTED, {slideShow: slideShow});
                    //                 }
                    //               });
                    //           }
                    //       });
                    //     }
        },

        addFeatureLayerToMap: function(layer, map, polar) {
            for (var i=0; i<layer.services.length; i++) {
                var service = layer.services[i];
                if (service.serviceType === "Feature") {
                    this.addFeatureService(service, layer, map, polar);
                    return;
                }
            }

            this.addLayerToMap(layer, map, false, map.spatialReference);
        },

        /*addFeatureService: function(service, layer, map, polar) {
            function getTextContent (graphic) {
                var attributes = graphic.attributes;
                var content = '<table width="100%" class="nomenclature-info">';

                for (var key in attributes) {
                    content += '<tr><th><b>' + key + '</b>:</th><td>' + attributes[key] + '</td></tr>';
                }
                content += '</table>';

                return content;

            }


            var template = new InfoTemplate();
            template.setTitle("Information");
            template.setContent(getTextContent);

            var regionLayer = this.createFeatureLayer(service, layer, template);
            map.addLayer(regionLayer);
        },*/

        addFeatureService: function(service, layer, map, polar) {
            var self = this;
            /*function getTextContent (graphic) {
                var attributes = graphic.attributes;
                var content = '<table width="100%" class="nomenclature-info">';

                for (var key in attributes) {
                    content += '<tr><th><b>' + key + '</b>:</th><td>' + attributes[key] + '</td></tr>';
                }
                content += '</table>';

                return content;

            }*/
            /*var template = new InfoTemplate();
            template.setTitle("Information");
            template.setContent(getTextContent);*/

            // WORK AROUND FOR OLD BOOKMARK WAY POINT LAYERS.
            if (service.renderer && service.renderer === "waypoints") {
                function getTextContent (graphic) {
                    var attributes = graphic.attributes;
                    var idLabelForDiv = graphic.attributes.name.replace(/ /g, "_");
                    var content = '<div id="' + idLabelForDiv + '_waypointContentDiv' + '"></div>';

                    var url = attributes.template;
                    xhr(url, {
                        handleAs: "text",
                        headers: {"X-Requested-With": null}
                    }).then(lang.hitch(this, function (data) {
                        var contentDiv = dojo.query("#" + idLabelForDiv + '_waypointContentDiv');
                        contentDiv[0].innerHTML = data;
                    }), function (err) {
                        throw new Error("Could not retrieve waypoints for bookmark (" + service.endPoint + ") - " + err);
                    });

                    return content;

                }


                var template = new InfoTemplate();
                template.setTitle("${name}");
                template.setContent(getTextContent);
                var url = service.endPoint;
                var layerId = layer.productLabel;
                var serviceLayer = new FeatureLayer(url, {
                    id: layerId,
                    outFields: ["*"],
                    mode: FeatureLayer.MODE_AUTO,
                    infoTemplate: template
                });

                serviceLayer.setRenderer(this.createPointRenderer());

                map.addLayer(serviceLayer);

            }
            //END WORK AROUND FOR OLD BOOKMARK WAY POINT LAYERS.
            else{

                function getTextContent (graphic) {
                    var attributes = graphic.attributes;
                    var content = '<table width="100%" class="nomenclature-info">';

                    for (var key in attributes) {
                        if (key === "link") {
                            if(/\S/.test(attributes[key])){
                                var abstractText = self.json.loadTextFileAjaxSync(attributes[key], null);

                                content += '<tr><th><b>Desc:</b></th><td>' + abstractText + '</td></tr>';
                            }
                        } else {
                            content += '<tr><th><b>' + key + '</b>:</th><td>' + attributes[key] + '</td></tr>';
                        }
                    }
                    content += '</table>';
                    return content;

                }

                var template = new InfoTemplate();
                template.setTitle("Information");
                template.setContent(getTextContent);

                var serviceLayer = this.createFeatureLayer(service, layer, template);
                map.addLayer(serviceLayer);


                //workaround for showing label for mars 2020
                if (layer.productLabel === "mars2020") {
                    var label = this.createTextLabelSymbol("#f08080","'Roboto',sans-serif","300","0.8em",0,0);
                    var json = {
                        "labelExpressionInfo": {"value": "{Name}"},
                        "labelPlacement": "center-center"
                    };
                    var labelClass = new LabelClass(json);
                    labelClass.symbol = label;
                    serviceLayer.setLabelingInfo([ labelClass ]);


                    var featureLabelLayer = this.createFeatureLabelLayer(map, layer);
                    featureLabelLayer.addFeatureLayer(serviceLayer);
                    map.addLayer(featureLabelLayer);
                }

            }
        },

        addFeatureGroupLayerToMap: function(layer, map, polar) {
            var template = new InfoTemplate();
            template.setTitle("Information");
            template.setContent(getTextContent);

            var num = layer.services[0].numLayers;
            for (var i=0; i<num; i++) {
                var regionLayer = this.createFeatureGroupLayer(layer, i, template);
                map.addLayer(regionLayer);
            }

            function getTextContent (graphic) {
                var attributes = graphic.attributes;
                var content = '<table width="100%" class="nomenclature-info">';

                for (var key in attributes) {
                    content += '<tr><th><b>' + key + '</b>:</th><td>' + attributes[key] + '</td></tr>';
                }
                content += '</table>';

                return content;

            }
        },

        /***
         * Creates the appropriate arcgis feature layer from the
         * Layer object and adds it to the referenced map object
         * @param layer - Layer object of type jpl/data/Layer
         * @param map - The map object to add the layer
         */
        addNomenclatureToMap: function(layer, map, polar) {
            var config = Config.getInstance();
            var self = this;

            // setting Label Layer for all nomenclatures.
            var serviceLayer = this.createNomLabelLayer(map, layer);


            //setting up nomenclature feature layers
            if (polar) {
                // adding featurelayer for each level
                var nomLayer1 = this.createNomFeatureLayer(layer, config, "4", 7000000, 600000000, true);
                var nomLayer2 = this.createNomFeatureLayer(layer, config, "5", 3500000, 7000000, true);
                var nomLayer3 = this.createNomFeatureLayer(layer, config, "6", 1750000, 3500000, true);
                var nomLayer4 = this.createNomFeatureLayer(layer, config, "7", 0, 1750000, true);

                serviceLayer.addFeatureLayer(nomLayer1);
                serviceLayer.addFeatureLayer(nomLayer2);
                serviceLayer.addFeatureLayer(nomLayer3);
                serviceLayer.addFeatureLayer(nomLayer4);

                map.addLayer(nomLayer1);
                map.addLayer(nomLayer2);
                map.addLayer(nomLayer3);
                map.addLayer(nomLayer4);
                //map.addLayer(nomLayer5);

                serviceLayer.on("mouse-over", function(evt) {
                    map.setMapCursor("pointer");
                });
                serviceLayer.on("mouse-out", function() {
                    map.setMapCursor("default");
                });

            } else {
                // adding featurelayer for each level
                var nomLayer1 = this.createNomFeatureLayer(layer, config, "1", 144000000, 600000000, false);
                var nomLayer2 = this.createNomFeatureLayer(layer, config, "2", 60000000, 144000000, false);
                var nomLayer3 = this.createNomFeatureLayer(layer, config, "3", 35000000, 60000000, false);
                var nomLayer4 = this.createNomFeatureLayer(layer, config, "4", 15000000, 35000000, false);
                var nomLayer5 = this.createNomFeatureLayer(layer, config, "5", 8000000, 15000000, false);
                var nomLayer6 = this.createNomFeatureLayer(layer, config, "6", 4000000, 8000000, false);
                var nomLayer7 = this.createNomFeatureLayer(layer, config, "7", 0, 4000000, false);

                serviceLayer.addFeatureLayer(nomLayer1);
                serviceLayer.addFeatureLayer(nomLayer2);
                serviceLayer.addFeatureLayer(nomLayer3);
                serviceLayer.addFeatureLayer(nomLayer4);
                serviceLayer.addFeatureLayer(nomLayer5);
                serviceLayer.addFeatureLayer(nomLayer6);
                serviceLayer.addFeatureLayer(nomLayer7);

                map.addLayer(nomLayer1);
                map.addLayer(nomLayer2);
                map.addLayer(nomLayer3);
                map.addLayer(nomLayer4);
                map.addLayer(nomLayer5);
                map.addLayer(nomLayer6);
                map.addLayer(nomLayer7);
            }

            map.addLayer(serviceLayer);

            on(win.doc, '.popupShowNomenclatureInSidebarBtn' + self.getPole(layer, config) + ':click', function(evt){
                var fid = evt.target.value;
                topic.publish(SearchEvent.prototype.NOMENCLATURE_MORE_BTN_PRESSED, {fid:fid,layer:layer});
            });
        },

        createNomLabelLayer: function (map, layer) {
            var self = this;
            var config = Config.getInstance();

            var serviceLayer = new LabelLayer({
                id: layer.productLabel,
                mode: 'DYNAMIC'
            });

            //make template for popup.
            var template = new InfoTemplate();
            template.setTitle("Nomenclature");
            template.setContent(getTextContent);

            // var fieldTable = config.nomenclatureFields;
            // var keys = [];
            // for(var k in fieldTable) keys.push(k);
            // keys.push("FID");
            // console.log("keys", keys);

            function getTextContent(graphic){

                var featureLayer;
                var featureAttributes;
                var content;

                for(var j=0; j < graphic._graphicsLayer.featureLayers.length;j++) {
                    featureLayer = graphic._graphicsLayer.featureLayers[j].graphics;
                    for(var i=0; i < featureLayer.length; i++) {
                        if(featureLayer[i].attributes.clean_name === graphic.symbol.text) {
                            featureAttributes = featureLayer[i].attributes;
                        }
                    }
                }

                if(featureAttributes) {
                    var position = {
                        x: featureAttributes.x,
                        y: featureAttributes.y
                    };

                    var content = '<table width="100%" class="nomenclature-info">';

                    content += '<tr><th>Name:</th><td>' + featureAttributes.name + '</td></tr>';
                    content += '<tr><th>Lat :</th><td>' + position.y  + '</td></tr>';
                    content += '<tr><th>Lon :</th><td>' + position.x + '</td></tr>';


                    content += "</table>";
                    content += '<p class="popupButtonContainerP"><button type="button" value="' + featureAttributes["FID"] + '" class="btn btn-link popupShowNomenclatureInSidebarBtn' + self.getPole(layer, config) + '">More</button></p>';

                }
                return content;
            }



            // var self = this;
            // var config = Config.getInstance();
            //
            // function getTextContent(graphic){
            //     var attributes = graphic.attributes;
            //     var featureLayer;
            //     var featureAttributes;
            //
            //     for(var j=0; j < graphic._graphicsLayer.featureLayers.length;j++) {
            //         featureLayer = graphic._graphicsLayer.featureLayers[j].graphics;
            //         for(var i=0; i < featureLayer.length; i++) {
            //             if(featureLayer[i].attributes.clean_name === graphic.symbol.text) {
            //                 featureAttributes = featureLayer[i].attributes;
            //                 featureAttributes.x = graphic.geometry.x;
            //                 featureAttributes.y = graphic.geometry.y;
            //             }
            //         }
            //     }
            //
            //     if(featureAttributes) {
            //         var position = {
            //             x: featureAttributes.x,
            //             y: featureAttributes.y
            //         };
            //
            //         if(layer.layerProjection === config.projection.N_POLE) {
            //
            //             var convertedPosition = self.convertNorthPolarMetersToDegrees(position.x, position.y);
            //             position.x = convertedPosition.x.toFixed(2) + "&deg;";
            //             position.y = convertedPosition.y.toFixed(2) + "&deg;";
            //         } else if(layer.layerProjection === config.projection.S_POLE) {
            //             var convertedPosition = self.convertSouthPolarMetersToDegrees(position.x, position.y);
            //             position.x = convertedPosition.x.toFixed(2) + "&deg;";
            //             position.y = convertedPosition.y.toFixed(2) + "&deg;";
            //         } else {
            //             position.x = position.x.toFixed(2) + "&deg;";
            //             position.y = position.y.toFixed(2) + "&deg;";
            //         }
            //
            //         var content;
            //         if (featureAttributes.type === 'bookmark') {
            //             content = '<table width="100%" class="nomenclature-info">' +
            //                 '<tr><th>Name:</th><td>' + featureAttributes.name + '</td></tr>' +
            //                 '<tr><th>Latitude:</th><td>' + position.y + '</td></tr>' +
            //                 '<tr><th>Longitude:</th><td>' + position.x + '</td></tr></table><br>' +
            //                 '<p>' + featureAttributes.notes + '</p>';
            //
            //         } else {
            //             content = '<table width="100%" class="nomenclature-info">' +
            //                 '<tr><th>Name:</th><td>' + featureAttributes.name + '</td></tr>' +
            //                 '<tr><th>Diameter:</th><td>' + featureAttributes.diameter + ' km</td></tr>' +
            //                 '<tr><th>Latitude:</th><td>' + position.y + '</td></tr>' +
            //                 '<tr><th>Longitude:</th><td>' + position.x + '</td></tr>' +
            //                 '<tr><th>Origin:</th><td>' + featureAttributes.origin + '</td></tr>' +
            //                 '<tr><th>Ethnicity:</th><td>' + featureAttributes.ethnicity + '</td></tr>' +
            //                 '<tr><th>Type:</th><td>' + featureAttributes.type + '</td></tr>';
            //             if(featureAttributes.link){
            //                 if(/\S/.test(featureAttributes.link)){
            //                     content += '<tr><th></th><td><a href="' + featureAttributes.link + '" target="_blank">Additional Info</a></td></tr>';
            //                 }
            //             }
            //             content += '</table>';
            //             if (featureAttributes.notes != undefined && featureAttributes.notes) {
            //                 content += "<br><p>" + featureAttributes.notes + "</p>";
            //             }
            //         }
            //
            //         return content;
            //     }
            //}

            //var template = new InfoTemplate();
            //template.setContent(getTextContent);
            //template.setTitle("Nomenclature");
            serviceLayer.setInfoTemplate(template);
            return serviceLayer;
        },

        createFeatureLabelLayer: function (map, layer) {
            var self = this;
            var config = Config.getInstance();

            var serviceLayer = new LabelLayer({
                id: layer.productLabel + "_label",
                mode: 'DYNAMIC'
            });

            //var template = new InfoTemplate();
            //template.setContent(getTextContent);
            //template.setTitle("Nomenclature");
            //serviceLayer.setInfoTemplate(template);
            return serviceLayer;
        },

        /***
         * Creates the appropriate arcgis feature layer from the
         * Layer object and adds it to the referenced map object
         * @param layer - Layer object of type jpl/data/Layer
         * @param map - The map object to add the layer
         */
        addPointFeatureToMap: function(layer, map, title, polar) {
            var config = Config.getInstance();
            var self = this;

            // setting up info table

            var template = new InfoTemplate();
            template.setTitle(title);
            template.setContent(getTextContent);

            // var fieldTable = config.nomenclatureFields;
            // var keys = [];
            // for(var k in fieldTable) keys.push(k);
            // keys.push("FID");
            // console.log("keys", keys);

            function getTextContent(graphic){
                var attr = graphic.attributes;

                var content = '<table width="100%" class="nomenclature-info">';

                content += '<tr><th>Name:</th><td>' + attr['SLIDESHOWT'] + '</td></tr>';
                content += '<tr><th>X :</th><td>' + graphic.geometry.x + '</td></tr>';
                content += '<tr><th>Y :</th><td>' + graphic.geometry.y + '</td></tr>';


                // for (var i=0;i<keys.length; i++) {
                //     if (keys[i].toLowerCase() == "link") {
                //         if (/\S/.test(attr.link)) {
                //             content += '<tr><th></th><td><a href="' + attr.link + '" target="_blank">Additional Info</a></td></tr>';
                //         }
                //     } else {
                //         content += '<tr><th>' + fieldTable[keys[i]] + ':</th><td>' + attr[keys[i]] + '</td></tr>';
                //     }
                // }

                content += "</table>";
                content += '<p class="popupButtonContainerP"><button type="button" value="' + attr["SLIDESHOWI"] + '" class="btn btn-link popupShowSlideshowInSidebarBtn' + self.getPole(layer, config) + '">More</button></p>';
                return content;
            }

            var nomLayer1 = this.createPointFeatureLayer(layer, config, template);

            map.addLayer(nomLayer1);

            on(win.doc, '.popupShowSlideshowInSidebarBtn' + self.getPole(layer, config) + ':click', function(evt){
                var fid = evt.target.value;
                topic.publish(SearchEvent.prototype.SLIDESHOW_MORE_BTN_PRESSED, {fid:fid,layer:layer});
            });
        },

        addLayerToMap: function(layer, map, isBasemap, projectionInfo) {
            var config = Config.getInstance();
            var self = this;

            if(!isBasemap) {
                isBasemap = false;
            }
            var serviceLayer = null;

            if(layer.service.protocol) {


                var serviceOptions = this.createMapLayerOptions(layer, projectionInfo);
                serviceLayer = this.createMapLayer(layer, serviceOptions);
                serviceLayer.productType = layer.productType;
                if(serviceLayer !== null) {
                    if(isBasemap) {
                        if(map.layerIds.length > 0) {
                            var basemap = map.getLayer(map.layerIds[0]);
                            map.removeLayer(basemap);
                            map.addLayer(serviceLayer, 0);
                        }
                        else{
                            map.addLayer(serviceLayer);
                        }
                    } else {
                        if (layer.service.imageFormat) {
                            serviceLayer.setImageFormat(layer.service.imageFormat);
                            map.addLayer(serviceLayer);
                        }
                        if(layer.productType === "imagery"){
                            map.addLayer(serviceLayer, map.layerIds.length);
                            console.log("map.layerIds", map.layerIds);
                        }
                        else {
                            //map.addLayer(serviceLayer, map.layerIds.length-1);
                            map.addLayer(serviceLayer);
                        }

                    }
                }

            }

            var layerListener = on(serviceLayer, "update-end", function(evt) {
                //if(layerAdded.layer === serviceLayer){
                layerListener.remove();
                //console.log(evt.target.id + ":" + serviceLayer.id);

                topic.publish(MapEvent.prototype.LAYER_ADDED, {serviceLayer: serviceLayer});
                //}
            });

        },
        /*createFeatureLayer: function (service, layer, template) {
            var layerId = layer.productLabel;

            var url = service.endPoint;
            var serviceLayer;
            if (service.renderer && service.renderer === "waypoints") {
                serviceLayer = new FeatureLayer(url, {
                    id: layerId,
                    outFields: ["*"],
                    mode: FeatureLayer.MODE_AUTO
                });
                console.log("ADDING BOOKMARK WAYPOINTS LAYER", serviceLayer);
            } else {
                serviceLayer = new FeatureLayer(url, {
                    id: layerId,
                    outFields: ["*"],
                    mode: FeatureLayer.MODE_AUTO,
                    infoTemplate: template
                });
            }


            if (service.renderer) {
                if (service.renderer === "pathline") {
                    serviceLayer.setRenderer(this.createLineRenderer(serviceLayer, "solid", "", ""));
                } else if (service.renderer === "waypoints") {
                    serviceLayer.setRenderer(this.createPointRenderer());
                    serviceLayer.on("click", function(evt) {
                        console.log("WAYPOINT CLICKED evt", evt);
                        topic.publish(MapEvent.prototype.CLOSE_OVERHEAD_POPUP, null);
                        topic.publish(MapEvent.prototype.SHOW_INFOWINDOW, {
                            "title": evt.graphic.attributes.name,
                            "contentURL": evt.graphic.attributes.template,
                            "geometry": evt.graphic.geometry,
                            "screenPoint": evt.screenPoint
                        });
                    });
                } else if (service.renderer === "featureRegions") {
                    serviceLayer.setRenderer(this.createInvisibleMarkerRenderer());
                    serviceLayer.setMaxScale(12468599.566171873);
                }
            }

            return serviceLayer;
        },*/

        createFeatureLayer: function (service, layer, template) {
            var layerId = layer.productLabel;
            var url = service.endPoint;
            var serviceLayer;
            //var template = new InfoTemplate();
            if (service.renderer && service.renderer === "waypoints") {
                //MOVED OUT FOR WORKAROUND
            }
            else if(service.renderer && service.renderer === "pathline"){
                serviceLayer = new FeatureLayer(url, {
                    id: layerId,
                    outFields: ["*"],
                    mode: FeatureLayer.MODE_AUTO
                });
            }
            else if (service.renderer === "featureRegions") {
                serviceLayer = new FeatureLayer(url, {
                    id: layerId,
                    outFields: ["*"],
                    mode: FeatureLayer.MODE_AUTO
                });
                serviceLayer.setRenderer(this.createInvisibleMarkerRenderer());
                serviceLayer.setMaxScale(12468599.566171873);
            }
            else {
                serviceLayer = new FeatureLayer(url, {
                    id: layerId,
                    outFields: ["*"],
                    mode: FeatureLayer.MODE_AUTO,
                    infoTemplate: template,
                    opacity: layer.opacity
                });

                //serviceLayer.setRenderer(this.createInvisibleMarkerRenderer());
            }

            return serviceLayer;
        },

        createFeatureGroupLayer: function (layer, num, template) {
            var layerId = layer.productLabel + "_" + num;

            var url = layer.services[0].endPoint + "/" + num;
            var serviceLayer = new FeatureLayer(url, {
                id: layerId,
                outFields: ["*"],
                infoTemplate: template
            });

            return serviceLayer;
        },

        createRegionLayer: function (layer, template ) {
            var labelLayerId = layer.productLabel + "Label";
            var labelDisplayField = "";
            if(layer.layerTitle === "Regions"){
                outFields = ["*"];
                labelDisplayField = "title";
            }
            else if(layer.layerTitle === "Quadrangles Regions"){
                outFields = ["*"];
                labelDisplayField = "QUAD_NAME";
            }

            var regionsColor = new Color([255,255,255,0.35]);
            var regionsLine = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, regionsColor, 1);
            var regionsSymbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, regionsLine, null);
            var regionsRenderer = new SimpleRenderer(regionsSymbol);
            var url = layer.service.endPoint;
            var serviceLayer = new FeatureLayer(url, {
                id: layer.productLabel,
                infoTemplate:template,
                outFields: ["*"]
            });
            serviceLayer.setRenderer(regionsRenderer);

            var regionsLabel = new TextSymbol();
            regionsLabel.font.setSize("12pt");
            regionsLabel.setColor(new Color("#ffffcc"));

            var regionsLabelRenderer = new SimpleRenderer(regionsLabel);
            var labels = new LabelLayer({ id: labelLayerId });
            labels.addFeatureLayer(serviceLayer, regionsLabelRenderer, "{" + labelDisplayField + "}");

            return serviceLayer;
        },

        createNomFeatureLayer: function (layer, config, level, maxScale, minScale, useRenderer) {
            // setting labels
            var nomLabel = this.createTextLabelSymbol("#ffffff","'Roboto',sans-serif","300","0.8em",0,0);
            var json = {
                "labelExpressionInfo": {"value": "{LABEL}"},
                "labelPlacement": "center-center"
            };
            var labelClass = new LabelClass(json);
            labelClass.symbol = nomLabel; // symbol also can be set in LabelClass' json
            labelClass.labelPlacement = "center-center";

            // setting up to show differnt nomenclature at different level
            var nomLayer = new FeatureLayer(layer.service.endPoint, {
                id: layer.productLabel + level,
                mode: FeatureLayer.MODE_ONDEMAND,
                outFields: ["*"]
            });

            var projectionExpression = "1=1";
            if (layer.layerProjection === config.projection.N_POLE) {
                projectionExpression = "1=1";
            } else if (layer.layerProjection === config.projection.S_POLE) {
                projectionExpression = "1=1";
            }

            // if (useRenderer) {
            //     nomLayer.setRenderer(new TextRenderer(nomLabel));
            // } else {
                //TODO adding invisible marker is just a workaround.  should put real marker symbol once defined
                nomLayer.setRenderer(this.createInvisibleMarkerRenderer());
                nomLayer.setLabelingInfo([ labelClass ]);
            //}
            //nomLayer.setRenderer(new MarkerRenderer(config.nomenclatureMarkers, config.nomenclatureTypeKey ));


            var fieldsSelectionSymbol =
                new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
                    new SimpleLineSymbol(SimpleLineSymbol.STYLE_DASHDOT,
                        new Color([255, 0, 0]), 2), new Color([255, 255, 0, 0.5]));
            nomLayer.setSelectionSymbol(fieldsSelectionSymbol);


            nomLayer.setDefinitionExpression(projectionExpression + " AND level <= " + level);
            nomLayer.setMaxScale(maxScale);
            nomLayer.setMinScale(minScale);

            return nomLayer;
        },

        createNomFeatureLayerNew: function (layer, config, level, maxScale, minScale, template, useRenderer) {
            // setting labels
            var nomLabel = this.createTextLabelSymbol("#ffffff","'Roboto',sans-serif","300","0.8em",0,0);
            var json = {
                "labelExpressionInfo": {"value": "{LABEL}"},
                "labelPlacement": "center-center"
            };
            var labelClass = new LabelClass(json);
            labelClass.symbol = nomLabel; // symbol also can be set in LabelClass' json


            // setting up to show differnt nomenclature at different level
            var nomLayer = new FeatureLayer(layer.service.endPoint, {
                id: layer.productLabel + level,
                mode: FeatureLayer.MODE_ONDEMAND,
                infoTemplate:template,
                outFields: ["*"]
            });

            var projectionExpression = "1=1";
            if (layer.layerProjection === config.projection.N_POLE) {
                projectionExpression = "1=1";
            } else if (layer.layerProjection === config.projection.S_POLE) {
                projectionExpression = "1=1";
            }

            if (useRenderer) {
                nomLayer.setRenderer(new TextRenderer(nomLabel));
            } else {
                //TODO adding invisible marker is just a workaround.  should put real marker symbol once defined
                nomLayer.setRenderer(this.createInvisibleMarkerRenderer());
                nomLayer.setLabelingInfo([ labelClass ]);
            }
            //nomLayer.setRenderer(new MarkerRenderer(config.nomenclatureMarkers, config.nomenclatureTypeKey ));


            var fieldsSelectionSymbol =
                new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
                    new SimpleLineSymbol(SimpleLineSymbol.STYLE_DASHDOT,
                        new Color([255, 0, 0]), 2), new Color([255, 255, 0, 0.5]));
            nomLayer.setSelectionSymbol(fieldsSelectionSymbol);


            nomLayer.setDefinitionExpression(projectionExpression + " AND level <= " + level);
            nomLayer.setMaxScale(maxScale);
            nomLayer.setMinScale(minScale);

            return nomLayer;
        },

        createPointFeatureLayer: function (layer, config, template) {
            // setting labels
            // var symbol = new SimpleMarkerSymbol({
            //     "color": [255,255,0,200],
            //     "size": 12,
            //     "angle": -30,
            //     "xoffset": 0,
            //     "yoffset": 0,
            //     "type": "esriSMS",
            //     "style": "esriSMSCircle",
            //     "outline": {
            //         "color": [0,0,0,255],
            //         "width": 1,
            //         "type": "esriSLS",
            //         "style": "esriSLSSolid"
            //     }
            // })


            // setting up to show differnt nomenclature at different level
            var nomLayer = new FeatureLayer(layer.service.endPoint, {
                id: layer.productLabel,
                mode: FeatureLayer.MODE_ONDEMAND,
                infoTemplate:template,
                outFields: ["*"]
            });

            var projectionExpression = "1=1";
            if (layer.layerProjection === config.projection.N_POLE) {
                projectionExpression = "1=1";
            } else if (layer.layerProjection === config.projection.S_POLE) {
                projectionExpression = "1=1";
            }

            //nomLayer.setRenderer(new SimpleRenderer(symbol));
            nomLayer.setRenderer(new MarkerRenderer(config.nomenclatureMarkers, config.nomenclatureTypeKey ));
            //nomLayer.setLabelingInfo([ labelClass ]);

            nomLayer.setDefinitionExpression(projectionExpression); // + " AND level <= " + level);
            // nomLayer.setMaxScale(maxScale);
            // nomLayer.setMinScale(minScale);

            return nomLayer;
        },
        /***
         * Creates the appropriate arcgis service layer from the
         * Layer object and adds it to the referenced map object
         * @param layer - Layer object of type jpl/data/Layer
         * @param map - The map object to add the layer
         */
        // addLayerToMap: function(layer, map, isBasemap, projectionInfo) {
        //     var config = Config.getInstance();
        //     var self = this;
        //
        //     if(!isBasemap) {
        //         isBasemap = false;
        //     }
        //     var serviceLayer = null;
        //
        //     if(layer.service.protocol) {
        //
        //         if(layer.productType === "region"){
        //             var outFields = ["*"];
        //             var labelLayerId = layer.productLabel + "Label";
        //             var labelDisplayField = "";
        //             if(layer.layerTitle === "Regions"){
        //                 outFields = ["*"];
        //                 labelDisplayField = "title";
        //             }
        //             else if(layer.layerTitle === "Quadrangles Regions"){
        //                 outFields = ["*"];
        //                 labelDisplayField = "QUAD_NAME";
        //             }
        //
        //             var regionsColor = new Color([255,255,255,0.35]);
        //             var regionsLine = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, regionsColor, 1);
        //             var regionsSymbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, regionsLine, null);
        //             var regionsRenderer = new SimpleRenderer(regionsSymbol)
        //             var url = layer.service.endPoint;
        //             serviceLayer = new FeatureLayer(url, {
        //               id: layer.productLabel,
        //               outFields: outFields
        //             });
        //             serviceLayer.setRenderer(regionsRenderer);
        //             map.addLayer(serviceLayer);
        //
        //             var regionsLabel = new TextSymbol();
        //             regionsLabel.font.setSize("12pt");
        //             regionsLabel.setColor(new Color("#ffffcc"));
        //
        //             var regionsLabelRenderer = new SimpleRenderer(regionsLabel);
        //             var labels = new LabelLayer({ id: labelLayerId });
        //             labels.addFeatureLayer(serviceLayer, regionsLabelRenderer, "{" + labelDisplayField + "}");
        //             map.addLayer(labels);
        //
        //             if(layer.layerTitle === "Regions"){
        //               labels.on("mouse-over", function(evt) {
        //                   map.setMapCursor("pointer");
        //               });
        //               labels.on("mouse-out", function() {
        //                   map.setMapCursor("default");
        //               });
        //
        //               //Hack for now, need to move this to its own module
        //               labels.on("click", function(evt){
        //                   var featureAttributes;
        //
        //                   topic.publish(MapEvent.prototype.CLOSE_OVERHEAD_POPUP, null);
        //
        //                   for(var j=0; j < this.featureLayers.length;j++) {
        //                       featureLayer = this.featureLayers[j].graphics;
        //                       for(var i=0; i < featureLayer.length; i++) {
        //                           if(layer.layerTitle === "Regions"){
        //                               if(featureLayer[i].attributes.title === evt.graphic.symbol.text) {
        //                                   featureAttributes = featureLayer[i].attributes;
        //                                   featureAttributes.x = evt.graphic.geometry.x;
        //                                   featureAttributes.y = evt.graphic.geometry.y;
        //                               }
        //                           }
        //                           else if(layer.layerTitle === "Quadrangles Regions"){
        //                               if(featureLayer[i].attributes.QUAD_NAME === evt.graphic.symbol.text) {
        //                                   featureAttributes = featureLayer[i].attributes;
        //                                   featureAttributes.x = evt.graphic.geometry.x;
        //                                   featureAttributes.y = evt.graphic.geometry.y;
        //                               }
        //                           }
        //                       }
        //                   }
        //
        //                   if(featureAttributes) {
        //                       var isRegionSlideShowPopup= false;
        //                       var slideShow = null;
        //                       var position = {
        //                           x: featureAttributes.x,
        //                           y: featureAttributes.y
        //                       };
        //
        //                       var pole = ""
        //                       if(layer.layerProjection === config.projection.N_POLE) {
        //                           pole = "np";
        //                           var convertedPosition = self.convertNorthPolarMetersToDegrees(position.x, position.y);
        //                           position.x = convertedPosition.x.toFixed(2) + "&deg;";
        //                           position.y = convertedPosition.y.toFixed(2) + "&deg;";
        //                       } else if(layer.layerProjection === config.projection.S_POLE) {
        //                           pole = "sp";
        //                           var convertedPosition = self.convertSouthPolarMetersToDegrees(position.x, position.y);
        //                           position.x = convertedPosition.x.toFixed(2) + "&deg;";
        //                           position.y = convertedPosition.y.toFixed(2) + "&deg;";
        //                       } else {
        //                           pole = "";
        //                           position.x = position.x.toFixed(2) + "&deg;";
        //                           position.y = position.y.toFixed(2) + "&deg;";
        //                       }
        //
        //                       if(layer.layerTitle === "Regions"){
        //                           slideShow = null;
        //                           for(var i=0; i < self.slideShowData.SLIDESHOWS.length; i++) {
        //                               if(self.slideShowData.SLIDESHOWS[i].SLIDESHOWID == featureAttributes.ssid){
        //                                   slideShow = self.slideShowData.SLIDESHOWS[i]
        //                                   console.log("slideshow", slideShow);
        //                               }
        //                           }
        //                           if(slideShow !== null){
        //                               isRegionSlideShowPopup = true;
        //                               map.infoWindow.setTitle(slideShow.SLIDESHOWTITLE);
        //                               var content = '<table width="100%" class="nomenclature-info">';
        //                               content += '</table>';
        //                               if(slideShow.MAINIMAGEURL){
        //                                 if(slideShow.MAINIMAGEURL !== " "){
        //                                     var imageURL = slideShow.MAINIMAGEURL;
        //                                     var dotPos = slideShow.MAINIMAGEURL.lastIndexOf(".");
        //                                     var prefix = slideShow.MAINIMAGEURL.substring(0,dotPos);
        //                                     var suffix = slideShow.MAINIMAGEURL.substring(dotPos, slideShow.MAINIMAGEURL.length);
        //                                     prefix += "-br";
        //                                     imageURL = prefix + suffix;
        //
        //                                     content += '<img class="popup-image-tumbnail" src="' + imageURL + '">';
        //                                 }
        //                               }
        //                               content += "<br><p>" + slideShow.DESCRIPTION + "</p>";
        //                               content += '<div id="popupShowSlideShowButton' + pole + '" style="text-align: center;"><button type="button" class="btn btn-default">' + textContent.SlideShowGallery_popupShowSlideShowButtonLabel  + '</button></div>';
        //                           }
        //                       }
        //                       else if(layer.layerTitle === "Quadrangles Regions"){
        //                           var content = '<table width="100%" class="nomenclature-info">' +
        //                           '<tr><th>Quad Name:</th><td>' + featureAttributes.QUAD_NAME + '</td></tr>' +
        //                           '<tr><th>FID:</th><td>' + featureAttributes.FID + '</td></tr></table><br>';
        //                       }
        //                       map.infoWindow.setContent(
        //                           content
        //                       );
        //
        //                       map.infoWindow.show(evt.graphic.geometry, map.getInfoWindowAnchor(evt.screenPoint));
        //                       map.infoWindow._contentPane.scrollTop = 0;
        //                       map.infoWindow.resize(300,300);
        //
        //                       dojo.query("#popupShowSlideShowButton" + pole).on("click", function(evt){
        //                         if(isRegionSlideShowPopup){
        //                             topic.publish(NavigationEvent.prototype.OPEN_SIDEBAR, {selectedOption: "Slideshows", resize: false});
        //                             topic.publish(MapEvent.prototype.REGION_LABEL_SELECTED, {slideShow: slideShow});
        //                         }
        //                       });
        //                   }
        //               });
        //             }
        //         }
        //         else {
        //             var serviceOptions = this.createMapLayerOptions(layer, projectionInfo);
        //             serviceLayer = this.createMapLayer(layer, serviceOptions);
        //
        //             if(serviceLayer !== null) {
        //                 if(isBasemap) {
        //                     if(map.layerIds.length > 0) {
        //                         var basemap = map.getLayer(map.layerIds[0]);
        //                         map.removeLayer(basemap);
        //                         map.addLayer(serviceLayer, 0);
        //                     }
        //                     else{
        //                         map.addLayer(serviceLayer);
        //                     }
        //                 } else {
        //                     if(layer.productType === "FeatureGraticule") {
        //                         map.addLayer(serviceLayer);
        //                     }
        //                     if(layer.productType === "imagery"){
        //                         map.addLayer(serviceLayer, map.layerIds.length);
        //                         console.log("map.layerIds", map.layerIds);
        //                     }
        //                     else {
        //                         //map.addLayer(serviceLayer, map.layerIds.length-1);
        //                         map.addLayer(serviceLayer);
        //                     }
        //
        //                 }
        //             }
        //         }
        //
        //     }
        //
        //     var layerListener = on(serviceLayer, "update-end", function(evt) {
        //         //if(layerAdded.layer === serviceLayer){
        //             layerListener.remove();
        //             console.log(evt.target.id + ":" + serviceLayer.id);
        //
        //             topic.publish(MapEvent.prototype.LAYER_ADDED, {serviceLayer: serviceLayer});
        //         //}
        //     });
        //
        // },

        addAutoLayerToMap: function(layer, map, layerIndex) {
            var config = Config.getInstance();
            var self = this;

            var serviceOptions = this.createMapLayerOptions(layer, map.spatialReference);
            var serviceLayer = this.createMapLayer(layer, serviceOptions);

            if(serviceLayer !== null) {
                map.addLayer(serviceLayer, layerIndex);

           }


            var layerListener = on(serviceLayer, "update-end", function(evt) {
                //if(layerAdded.layer === serviceLayer){
                layerListener.remove();
                //console.log(evt.target.id + ":" + serviceLayer.id);

                topic.publish(MapEvent.prototype.LAYER_ADDED, {serviceLayer: serviceLayer});
                //}
            });

        },

        getPole: function(layer, config){
            var pole = "";
            if(layer.layerProjection === config.projection.N_POLE) {
                pole = "np";
            } else if(layer.layerProjection === config.projection.S_POLE) {
                pole = "sp";
            } else {
                pole = "";
            }

            return pole;
        },

        /***
         * Removes a layer from the map given the layerID.
         * @param layerID - LayerID assigned when layer was added to map
         * @param map - The map object to remove the layer from
         */
        removeLayerFromMap: function(layerID, map) {
            var layerToRemove = map.getLayer(layerID);
            if(layerToRemove) {
                map.removeLayer(layerToRemove);
            }
        },

        removeRegionLayerFromMap: function(layerID, map) {
            var keys = [];
            for(var k in map._layers)
                keys.push(k);

            for(var i = 0; i < keys.length; i++){
                if(keys[i].indexOf(layerID) !== -1){
                    var layerToRemove = map.getLayer(keys[i]);
                    if(layerToRemove) {
                        map.removeLayer(layerToRemove);
                    }
                }
            }
        },

        removeNomenclatureLayer: function(layerID, map){
            var keys = [];
            for(var k in map._layers) {
                keys.push(k);
            }

            for(var i = 0; i < keys.length; i++){
                if(keys[i].indexOf("nomenclature") !== -1){
                    map.removeLayer(map._layers[keys[i]]);
                }
            }
        },

        removeFeatureGroupLayer: function(productLabel, map){
            var keys = [];
            for(var k in map._layers)
                keys.push(k);

            for(var i = 0; i < keys.length; i++){
                if(keys[i].indexOf(productLabel) !== -1){
                    map.removeLayer(map._layers[keys[i]]);
                }
            }
        },

        removeMars2020WorkaroundLayer: function(layerID, map){
            this.removeLayerFromMap(layerID, map);
            this.removeLayerFromMap(layerID + "_label", map);
        },

        getLayerFromMap: function(layerID, map) {
            return map.getLayer(layerID);
        },

        reorderLayerOnMap: function(layer, map, order) {
            map.reorderLayer(layer, order);
        },

        /* spatialReference can be overriden by providing wkt for WMTS

         */
        createMapLayerOptions: function(layer, projectionInfo) {
            var options;

            switch (layer.service.protocol) {
                case "ArcGISFeature":
                    options = {
                        id: layer.productLabel,
                        outFields: ["*"],
                        mode: FeatureLayer.MODE_AUTO,
                        showLabels: true
                    };
                    break;
                case "WMTS":
                    options = {
                        id: layer.productLabel,
                        serviceMode: "RESTful",
                        opacity: layer.opacity,
                        overrideSpatialReference: projectionInfo
                    };
                    break;
                default:
                    options = {
                        id: layer.productLabel,
                        opacity: layer.opacity,
                        showAttribution: true,
                        hasAttributionData: true
                    };
                    break;
            }

            return options;
        },

        createMapLayer: function(layer, options) {
            var serviceLayer;

            switch (layer.service.protocol) {
                case "WMTS":
                    //this is ESRI WMTSLayer
                    //serviceLayer = new WMTSLayer(layer.service.endPoint, options);

                    //this is customized Trek WMTSLayer that works with current version of ESRI
                    serviceLayer = new TrekWMTSLayer(layer.service.endPoint, options);

                    //this is previous customeized Trek WMTSLayer that worked with previous version of ESRI
                    //serviceLayer = new WMTSReader(layer.service.endPoint, options);
                    //serviceLayer.setId(options.id);
                    break;
                case "ArcGISDynamic":
                    serviceLayer = new ArcGISDynamicMapServiceLayer(layer.service.endPoint, options);
                    if (layer.productType === "FeatureGraticule") {
                        serviceLayer.setImageFormat("png32");
                    }
                    break;
                case "ArcGISTiled":
                    serviceLayer = new ArcGISTiledMapReader(layer.service.endPoint, options);
                    break;
                case "ArcGISImage":
                    serviceLayer = new ArcGISImageServiceLayer(layer.service.endPoint, options);
                    break;

            }

            return serviceLayer;
        },

        changeLayerOpacity: function(layer, opacity) {
            layer.setOpacity(opacity);
        },

        showLayer: function(layer) {
            if(layer) {
                layer.show();
            }
        },

        hideLayer: function(layer) {
            if(layer) {
                layer.hide();
            }
        },

        isNomenclatureLayerHidden: function(productLabel, map){
            var keys = [];
            for(var k in map._layers)
                keys.push(k);

            var isHidden = true;
            for(var i = 0; i < keys.length; i++){
                if(keys[i].indexOf(productLabel) !== -1){
                    if(map._layers[keys[i]].visible){
                        isHidden = false;
                    }
                }
            }

            return isHidden;
        },

        showNomenclatureLayer: function(productLabel, map) {
            var keys = [];
            for(var k in map._layers)
                keys.push(k);

            for(var i = 0; i < keys.length; i++){
                if(keys[i].indexOf("nomenclature") !== -1){
                    map._layers[keys[i]].show();
                }
            }
        },

        showFeatureGroupLayer: function(productLabel, map) {
            var keys = [];
            for(var k in map._layers)
                keys.push(k);

            for(var i = 0; i < keys.length; i++){
                if(keys[i].indexOf(productLabel) !== -1){
                    map._layers[keys[i]].show();
                }
            }
        },

        hideNomenclatureLayer: function(productLabel, map){
            var keys = [];
            for(var k in map._layers)
                keys.push(k);

            for(var i = 0; i < keys.length; i++){
                if(keys[i].indexOf("nomenclature") !== -1){
                    map._layers[keys[i]].hide();
                }
            }
        },

        hideFeatureGroupLayer: function(productLabel, map) {
            var keys = [];
            for(var k in map._layers)
                keys.push(k);

            for(var i = 0; i < keys.length; i++){
                if(keys[i].indexOf(productLabel) !== -1){
                    map._layers[keys[i]].hide();
                }
            }
        },

        reorderLayers: function(productLabels, map) {
            var newLayersList = [];
            //Basemap is always at the bottom
            newLayersList.push(map.layerIds[0]);
            //Normal layers are in between
            for(var i = 0; i < productLabels.length; i++){
                newLayersList.push(productLabels[i]);
            }
            //Special layers are always at the top
            if(map.layerIds.indexOf("graticule") > -1){
                newLayersList.push(map.layerIds[map.layerIds.indexOf("graticule")]);
            }
            if(map.layerIds.indexOf("nomenclature") > -1){
                newLayersList.push(map.layerIds[map.layerIds.indexOf("nomenclature")]);
            }

            for(var i=0; i<newLayersList.length; i++) {
                var theLayer = this.getLayerFromMap(newLayersList[i], map);
                    this.reorderLayerOnMap(theLayer, map, i);
            }
        },

        /***
         * Given a projection, will return the initial extent object for the map
         * @param {string} projection - 3 accepted projection values: "equirectangular", "north_pole", "south_pole"
         * @returns {object} Extent - The extent object
         */
        getInitialExtent: function(projection) {
            var result, spatialRefType, spatialRefValue, config = Config.getInstance(),
                xmin, ymin, xmax, ymax;

            switch(projection) {
                case config.projection.EQUIRECT:
                    if(this.isWKIDDefined(config.projection.SPATIAL_REFERENCES.EQUIRECT.wkid)) {
                        spatialRefType = "wkid";
                        spatialRefValue = config.projection.SPATIAL_REFERENCES.EQUIRECT.wkid;
                    } else {
                        spatialRefType = "wkt";
                        spatialRefValue = config.projection.SPATIAL_REFERENCES.EQUIRECT.wtk;
                    }

                    xmin = config.projection.EXTENTS.EQUIRECT.xmin;
                    ymin = config.projection.EXTENTS.EQUIRECT.ymin;
                    xmax = config.projection.EXTENTS.EQUIRECT.xmax;
                    ymax = config.projection.EXTENTS.EQUIRECT.ymax;

                    break;
                case config.projection.N_POLE:
                    // if(this.isWKIDDefined(config.projection.SPATIAL_REFERENCES.N_POLE.wkid)) {
                    //     spatialRefType = "wkid";
                    //     spatialRefValue = config.projection.SPATIAL_REFERENCES.N_POLE.wkid;
                    // } else {
                    //     spatialRefType = "wkt";
                    //     spatialRefValue = config.projection.SPATIAL_REFERENCES.N_POLE.wtk;
                    // }

                    xmin = config.projection.EXTENTS.N_POLE.xmin;
                    ymin = config.projection.EXTENTS.N_POLE.ymin;
                    xmax = config.projection.EXTENTS.N_POLE.xmax;
                    ymax = config.projection.EXTENTS.N_POLE.ymax;

                    break;
                case config.projection.S_POLE:
                    // if(this.isWKIDDefined(config.projection.SPATIAL_REFERENCES.S_POLE.wkid)) {
                    //     spatialRefType = "wkid";
                    //     spatialRefValue = config.projection.SPATIAL_REFERENCES.S_POLE.wkid;
                    // } else {
                    //     spatialRefType = "wkt";
                    //     spatialRefValue = config.projection.SPATIAL_REFERENCES.S_POLE.wtk;
                    // }

                    xmin = config.projection.EXTENTS.S_POLE.xmin;
                    ymin = config.projection.EXTENTS.S_POLE.ymin;
                    xmax = config.projection.EXTENTS.S_POLE.xmax;
                    ymax = config.projection.EXTENTS.S_POLE.ymax;
                    break;
                default:
                    //not a valid projection
                    break;
            }
            var sr = new SpatialReference(spatialRefValue);

            result = new Extent(xmin,ymin,xmax,ymax,sr);

            return result;
        },

        getSpatialReference: function(projection) {
            var result, spatialRefType, spatialRefValue, config = Config.getInstance();

            switch(projection) {
                case config.projection.EQUIRECT:
                    if (this.isWKIDDefined(config.projection.SPATIAL_REFERENCES.EQUIRECT.wkid)) {
                        spatialRefType = "wkid";
                        spatialRefValue = config.projection.SPATIAL_REFERENCES.EQUIRECT.wkid;
                    } else {
                        spatialRefType = "wkt";
                        spatialRefValue = config.projection.SPATIAL_REFERENCES.EQUIRECT.wtk;
                    }
                    break;
                case config.projection.N_POLE:
                    if (this.isWKIDDefined(config.projection.SPATIAL_REFERENCES.N_POLE.wkid)) {
                        spatialRefType = "wkid";
                        spatialRefValue = config.projection.SPATIAL_REFERENCES.N_POLE.wkid;
                    } else {
                        spatialRefType = "wkt";
                        spatialRefValue = config.projection.SPATIAL_REFERENCES.N_POLE.wtk;
                    }

                    break;
                case config.projection.S_POLE:
                    if (this.isWKIDDefined(config.projection.SPATIAL_REFERENCES.S_POLE.wkid)) {
                        spatialRefType = "wkid";
                        spatialRefValue = config.projection.SPATIAL_REFERENCES.S_POLE.wkid;
                    } else {
                        spatialRefType = "wkt";
                        spatialRefValue = config.projection.SPATIAL_REFERENCES.S_POLE.wtk;
                    }

                    break;
                default:
                    //not a valid projection
                    break;
            }

            var sr = new SpatialReference(spatialRefValue);
            return sr;
        },

        setMapExtent: function(xmin, ymin, xmax, ymax, map) {
            var newExtent = new Extent({
                "xmin": Number(xmin),
                "ymin": Number(ymin),
                "xmax": Number(xmax),
                "ymax": Number(ymax),
                "spatialReference": map.spatialReference
            });

            map.setExtent(newExtent, true);
        },

        isWKIDDefined: function(wkid) {
            return (wkid !== '' && wkid !== null && wkid !== undefined);
        },

        createLayerPolygon: function(layer, map, outlineID) {
            var points = [
                new Point(layer.boundingBox.west, layer.boundingBox.north, map.spatialReference),
                new Point(layer.boundingBox.east, layer.boundingBox.north, map.spatialReference),
                new Point(layer.boundingBox.east, layer.boundingBox.south, map.spatialReference),
                new Point(layer.boundingBox.west, layer.boundingBox.south, map.spatialReference),
                new Point(layer.boundingBox.west, layer.boundingBox.north, map.spatialReference)
            ];

            var polygon = new Polygon();
            polygon.addRing(points);
            polygon.spatialReference = map.spatialReference;

            var symbol = new SimpleFillSymbol(
                SimpleFillSymbol.STYLE_SOLID,
                new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([247,235,14, 0.85]), 2),
                new Color([255,255,0,0])
            );

            var polygonGraphic = new Graphic(polygon, symbol, { keeper: true });
            var polyLayer = new GraphicsLayer({ id: outlineID });

            this.addLayerPolygon(polyLayer, map);

            polyLayer.add(polygonGraphic);

            return polyLayer;
        },

        addLayerPolygon: function(polygonLayer, map) {
            if(polygonLayer) {
                map.addLayer(polygonLayer);
            }
        },

        removeLayerPolygon: function(polygonLayer, map) {
            if(polygonLayer) {
                map.removeLayer(polygonLayer);
            }
        },

        getProjectionBySpatialReference: function(spatialReference) {
            var config = Config.getInstance(), projection;

            if(spatialReference.wkid == config.projection.SPATIAL_REFERENCES.EQUIRECT.wkid ||
                spatialReference.wkt == config.projection.SPATIAL_REFERENCES.EQUIRECT.wtk) {
                projection = config.projection.EQUIRECT;
            } else if(spatialReference.wkid == config.projection.SPATIAL_REFERENCES.N_POLE.wkid ||
                spatialReference.wkt == config.projection.SPATIAL_REFERENCES.N_POLE.wtk) {
                projection = config.projection.N_POLE;
            } else if(spatialReference.wkid == config.projection.SPATIAL_REFERENCES.S_POLE.wkid ||
                spatialReference.wkt == config.projection.SPATIAL_REFERENCES.S_POLE.wtk) {
                projection = config.projection.S_POLE;
            } else {
            }

            return projection;
        },

        checkAndSetMapProjection: function(projection, mapProjection) {
            if (projection !== mapProjection) {
                topic.publish(MapEvent.prototype.CHANGE_PROJECTION, {projectionLabel: projection});
            }
        },

        checkAndSetMapProjection3D: function(projection, mapProjection) {
                if (projection !== Config.getInstance().projection.EQUIRECT) {
                    topic.publish(MapEvent.prototype.CHANGE_PROJECTION, {projectionLabel: projection});
                }
        },

        
        resizeFix: function() {
            window.setTimeout(function(){
                on.emit(window, "resize", {
                    bubbles: true,
                    cancelable: true
                });
            },400);
        },
        

        /***
         * Function to return a formatted x/y coordinate value
         * @value {number} - value of the coordinate
         * @type {string} - type of coordinate: 'x' or 'y'
         * @returns {string} - Formatted numeric coordinate
         */
        formatCoordinate: function(value, type) {
            var num = parseFloat(value),
                multiplier = Math.pow(10, 5),
                result = (Number(Math["round"](num * multiplier) / multiplier));

             // if ((type === 'x' && result > -180 && result < 180) ||
             //     (type === 'y' && result > -90 && result < 90)) {
                return result;
             // } else {
             //    return '-';
             // }
        },

        createGraphicMarkerPoint: function(x, y, map, color, path) {
            if (color === undefined)
                 color = [255,255,0,200];
            var symbol = new SimpleMarkerSymbol({
                "color": color,
                "size": 12,
                //"angle": -30,
                "xoffset": 0,
                "yoffset": 0,
                "type": "esriSMS",
                "style": "esriSMSCircle",
                "outline": {
                    "color": [0,0,0,255],
                    "width": 1,
                    "type": "esriSLS",
                    "style": "esriSLSSolid"
                }
            });

            if(path){
                symbol.setPath(path);
            }

            var point = new Point(x, y, map.spatialReference);

            return new Graphic(point, symbol);
        },

        createGraphicMarkerPolygon: function(polygonJson, map) {
            var polygon = new Polygon(polygonJson);
            var sfs = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
                new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                    new Color([255,255,0]), 1),new Color([255,255,0,0.04]));

            return new Graphic(polygon, sfs);
        },

        createInvisibleMarkerRenderer: function() {
            var marker = new SimpleMarkerSymbol();
            //make it invisible
            marker.setSize(0.1);

            //return the renderer
            return new SimpleRenderer(marker);
        },

        createPictureMarker: function(url) {
            return new PictureMarkerSymbol({
                "angle": 0,
                "xoffset": 0,
                "yoffset": 0,
                "type": "esriPMS",
                "url": url,
                "contentType": "image/png",
                "width": 32,
                "height": 32
            });
        },

        createTextLabelSymbol: function (color, font, fontWeight, fontSize, offsetx, offsety) {
            var textSymbol = new TextSymbol();
            if(color) {
                textSymbol.setColor(new Color(color));
            }
            if(font) {
                textSymbol.font.setFamily(font);
            }
            if(fontWeight) {
                textSymbol.font.setWeight(fontWeight);
            }
            if(fontSize) {
                textSymbol.font.setSize(fontSize);
            }
            if(offsetx && offsety) {
                textSymbol.setOffset(offsetx,offsety);
            }
            return textSymbol;
        },

        createTextLabelRenderer: function(color, font, fontWeight, fontSize, offsetx, offsety) {
            //TODO: Type checking, assuming all values are passed in correctly for now

            return new SimpleRenderer(this.createTextLabelSymbol(color, font, fontWeight, fontSize, offsetx, offsety));
        },

        createLineRenderer: function(serviceLayer, lineStyle, color, width) {
            var lineSymbolStyle, symbol;

            switch(lineStyle) {
                case "dash":
                    lineSymbolStyle = SimpleLineSymbol.STYLE_DASH;
                    break;
                case "dot":
                    lineSymbolStyle = SimpleLineSymbol.STYLE_DOT;
                    break;
                default:
                    lineSymbolStyle = SimpleLineSymbol.STYLE_SOLID;
                    break;
            }

            symbol = new SimpleLineSymbol(lineSymbolStyle, new Color([135,206,250, 0.85]), 2);

            return new SimpleRenderer(symbol);
        },

        createMSLRenderer: function() {
            var defaultSymbol = new SimpleFillSymbol().setStyle(SimpleFillSymbol.STYLE_NULL);
            var renderer = new UniqueValueRenderer(defaultSymbol, "marker");
            renderer.addValue("msl", new PictureMarkerSymbol("jpl/assets/links/images/MSL.png", 62, 65));
            return renderer;

        },
        createPointRenderer: function() {

            var symbol = new SimpleMarkerSymbol({
                "color":[255,165,0,255],
                "size": 9,
                "angle":0,
                "xoffset":0,
                "yoffset":0,
                "type":"esriSMS",
                "style":"esriSMSCircle",
                "outline": {
                    "color":[0,0,128,255],
                    "width":1,
                    "type":"esriSLS",
                    "style":"esriSLSSolid"
                }
            });

            return new SimpleRenderer(symbol);
        },

        mapZoomIn: function(map) {
            var newZoom = map.getZoom() + 1,
                maxZoom = map.getMaxZoom();

            if(newZoom <= maxZoom) {
                map.setZoom(newZoom);
            }
        },

        mapZoomOut: function(map) {
            var newZoom = map.getZoom() - 1,
                minZoom = map.getMinZoom();

            if(newZoom >= minZoom) {
                map.setZoom(newZoom);
            }
        },

        calculateDistance: function(geometry, endpoint, radius) {

        },

        getActiveMap: function(basemap, mapDijit, projection) {
            if(basemap.currentMapProjection === projection.N_POLE) {
                return mapDijit.northPoleMap;
            } else if(basemap.currentMapProjection === projection.S_POLE) {
                return mapDijit.southPoleMap;
            } else {
                //default to equirect for all others
                return mapDijit.equirectMap;
            }
        },

        convertNorthPolarMetersToDegrees: function(x, y) {
            var config = Config.getInstance();

            var rad = config.ellipsoidRadius;
            var clat = 90;
            var j = Math.atan2(x,-y);
            var k = clat * (Math.PI/180);
            var b = Math.sqrt(Math.pow(x,2) + Math.pow(y,2));
            var h = 2 * Math.atan(b/(2 * rad));
            var d = Math.asin(Math.cos(h) * Math.sin(k));
            var lat = d * 180/Math.PI;
            var lon = j * 180/Math.PI;

            return {
                x: lon,
                y: lat
            }
        },

        convertSouthPolarMetersToDegrees: function(x,y) {
            var config = Config.getInstance();

            var rad = config.ellipsoidRadius;
            var clat = -90;
            var j = Math.atan2(x,y);
            var k = clat * (Math.PI/180);
            var b = Math.sqrt(Math.pow(x,2)+Math.pow(y,2));
            var h = 2 * Math.atan(b/(2*rad));
            var d = Math.asin(Math.cos(h) * Math.sin(k));
            var lat = d * 180/Math.PI;
            var lon = j * 180/Math.PI;

            return {
                x: lon,
                y: lat
            }
        },

        convertLatLonToNorthPolarMeters: function(x,y) {
            var config = Config.getInstance();

            var rad = config.ellipsoidRadius;
            var f = x * Math.PI/180;
            var c = y * Math.PI/180;

            return {
                x: (2*rad* Math.tan(Math.PI/4 - c/2)*Math.sin(f)),
                y: (-2*rad*Math.tan(Math.PI/4-c/2)*Math.cos(f))
            }
        },

        convertLatLonToSouthPolarMeters: function(x,y) {
            var config = Config.getInstance();

            var rad = config.ellipsoidRadius;
            var f = x * Math.PI/180;
            var c = y * Math.PI/180;

            return {
                x: 2*rad*Math.tan(Math.PI/4+c/2)*Math.sin(f),
                y: 2*rad*Math.tan(Math.PI/4+c/2)*Math.cos(f)
            }
        },

        estimateScaleDistance: function(startPoint, endPoint, mapExtent) {
            var config = Config.getInstance();

            if(mapExtent.spatialReference.wkt === config.projection.SPATIAL_REFERENCES.N_POLE.wtk ||
                mapExtent.spatialReference.wkt === config.projection.SPATIAL_REFERENCES.S_POLE.wtk) {

                var lowY = Math.min(startPoint.y, endPoint.y);
                var highY = Math.max(startPoint.y, endPoint.y);
                var lowX = Math.min(startPoint.x, endPoint.x);
                var highX = Math.max(startPoint.x, endPoint.x);

                var dy = highY - lowY;
                var dx = highX - lowX;

                var dtwo = Math.pow(dy, 2) + Math.pow(dx, 2);

                return (Math.sqrt(dtwo))/1000;
            } else {
                var R = config.ellipsoidRadius / 1000; //3396.200; // Radius of Mars in km
                var dLat = (endPoint.y - startPoint.y) * Math.PI / 180;  // deg2rad below
                var dLon = (endPoint.x - startPoint.x) * Math.PI / 180;
                var a = 0.5 - Math.cos(dLat)/2 + Math.cos(startPoint.y * Math.PI / 180) *
                    Math.cos(endPoint.y * Math.PI / 180) * (1 - Math.cos(dLon)) / 2;

                return R * 2 * Math.asin(Math.sqrt(a));
            }

        }
    });
});
