define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/on",
    "dojo/query",
    "dojo/topic",
    "dojo/request/xhr",
    "dojo/window",
    "dojo/dom-class",
    "dojo/dom-construct",
    "dojo/dom-attr",
    "dojo/mouse",
    "dijit/registry",
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    'dojo/text!./templates/BookmarkViewer.html',
    "jpl/events/LayerEvent",
    "jpl/events/LoadingEvent",
    "jpl/events/BookmarkEvent",
    "jpl/events/MapEvent",
    "jpl/utils/MapUtil",
    "jpl/config/Config",
    "jpl/utils/WKTUtil",
    "jpl/utils/IndexerUtil",
    "bootstrap/Modal",
    "esri/layers/GraphicsLayer",
    "esri/InfoTemplate",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/symbols/SimpleLineSymbol",
    "esri/symbols/SimpleFillSymbol",
    "esri/symbols/PictureMarkerSymbol",
    "esri/geometry/jsonUtils",
    "esri/Color",
    "esri/symbols/Font",
    "esri/symbols/TextSymbol",
    "esri/graphic",
    "jpl/data/Bookmark",
    "dijit/form/CheckBox",
    "xstyle/css!./css/BookmarkViewer.css"
], function (declare, lang, on, query, topic, xhr, win, domClass, domConstruct, domAttr, mouse, registry,
             _WidgetBase, _TemplatedMixin, template, LayerEvent, LoadingEvent, BookmarkEvent, MapEvent,
             MapUtil, Config, WKTUtil, IndexerUtil, Modal, GraphicsLayer, InfoTemplate, SimpleMarkerSymbol,
             SimpleLineSymbol, SimpleFillSymbol, PictureMarkerSymbol, EsriJsonUtil, Color, Font, TextSymbol, Graphic,
             OldBookmark, CheckBox) {
    return declare([_WidgetBase, _TemplatedMixin], {
        templateString: template,
        bookmark: null,
        sidebar: null,
        backButtonListener: null,
        mapDijit: "",
        mapShapeGraphicLayer: null,
        mapAnnotationsGraphicLayer: null,
        waypointLayer: null,
        pathLayer: null,
        waypoints: null,


        startup: function() {
            this.mapDijit = registry.byId("mainSearchMap");
            this.config = Config.getInstance();
            this.wktUtil = new WKTUtil();
            this.indexerUtil = new IndexerUtil();

            on(this.sideBarLinkClose, "click", lang.hitch(this, this.closeSidebar));
            on(this.addBookmarkButton, "click", lang.hitch(this, this.addBookmarkToMap));
            on(this.removeBookmarkButton, "click", lang.hitch(this, this.removeBookmarkFromMap));
            on(this.ZoomBtn, "click", lang.hitch(this, this.ZoomBtnClicked));

            /*domClass.add(this.start3DTourButton, "hidden");
            on(this.deleteBookmarkButton, "click", lang.hitch(this, this.deleteThisBookmark));
            this.setContent();
            this.setUpMap();*/

            this.setContent();

            if(this.sidebar.bookmarkManager.hasBookmark(this.bookmark)){
                this.bookmark = this.sidebar.bookmarkManager.getBookmark(this.bookmark);
                this.showRemoveBookmarkButton();
                this.waypointLayer = this.sidebar.bookmarkManager.getBookmarkWaypointLayer(this.bookmark);
                this.pathLayer = this.sidebar.bookmarkManager.getBookmarkPathLayer(this.bookmark);
                this.waypoints = this.sidebar.bookmarkManager.getBookmarkWaypoints(this.bookmark);

                this.setWaypointsContent();
                domClass.remove(this.bookmarkWaypoints, "hidden");

                if(this.bookmark.tour){
                    domClass.remove(this.start3DTourButton, "hidden");
                    domClass.remove(this.bookmarkWaypoints, "hidden");
                    on(this.start3DTourButton, "click", lang.hitch(this, this.start3DTour));
                    topic.subscribe(MapEvent.prototype.EXIT_TOUR_3D, lang.hitch(this, this.exitTour));
                }
            }
            else{
                this.bookmark.mapLayers = [];
                this.showAddBookmarkButton();
            }

            this.backButtonListener = on(this.backButton, "click", lang.hitch(this, this.closeViewer));
        },

        setBookmark: function(bookmark){
            this.bookmark = bookmark;
        },

        setSidebar: function(sidebar){
            this.sidebar = sidebar;
        },

        closeViewer: function(evt){
            this.sidebar.showSearchContainer();
            this.backButtonListener.remove();
        },

        closeSidebar: function(){
            this.sidebar.closeThisSidebar();
        },

        setContent: function() {
            this.title.innerHTML = this.bookmark.title;
            this.itemType.innerHTML = this.bookmark.itemType;
            var bbox = this.bookmark.bbox;
            bbox = bbox.replace(",","<br>").replace(",","<br>").replace(",","<br>");
            this.extent.innerHTML = bbox;
            var layers = this.parseLayerList(this.bookmark.layers);
            var layersString = "";
            //TODO should use title instead of productLabel
            for (var i=0; i<layers.length; i++) {
                var layer = layers[i];
                layersString += layer.productLabel + "<br>";
            }
            this.layers.innerHTML = layersString;
            this.description.innerHTML = this.bookmark.description;

            if(this.bookmark.mediaURL){
                domClass.remove(this.bookmarkImage, "hidden");
                domAttr.set(this.bookmarkImage, "src", this.bookmark.mediaURL);
            }
            else{
                domClass.add(this.bookmarkImage, "hidden");
            }

            var self = this;
            new CheckBox({
                value: "",
                checked: false,
                onChange: function(evt){self.toggleWaypoints(evt)}
            }, this.checkbox).startup();

        },

        setUpMap: function(){
            if(this.bookmark.bookmarkType){
                if(this.bookmark.bookmarkType === "adhoc"){
                    domClass.add(this.deleteBookmarkButton, "hidden");
                    domClass.remove(this.bookmarkWaypoints, "hidden");

                    //special array needs path first, waypoints second or only waypoints if no path.
                    var pathAndWaypointLabels = [];
                    if(this.bookmark.path){
                        pathAndWaypointLabels.push(this.bookmark.path);
                    }
                    if(this.bookmark.waypoints){
                        pathAndWaypointLabels.push(this.bookmark.waypoints);
                    }
                    this.addSpecialLayersToMap(pathAndWaypointLabels);

                    if(this.bookmark.tour){
                        domClass.remove(this.start3DTourButton, "hidden");
                        this.start3DTourButton.disabled = true;

                        on(this.start3DTourButton, "click", lang.hitch(this, this.start3DTour));
                        topic.subscribe(MapEvent.prototype.EXIT_TOUR_3D, lang.hitch(this, this.exitTour));
                    }
                }
            }

            var self = this;

            //SET MAP TO EXTENT
            var projection = this.bookmark.dataProjection;
            var xmin = this.bookmark.bbox.split(",")[0];
            var ymin = this.bookmark.bbox.split(",")[1];
            var xmax = this.bookmark.bbox.split(",")[2];
            var ymax = this.bookmark.bbox.split(",")[3];

            var extent = {
                "xmin": xmin,
                "ymin": ymin,
                "xmax": xmax,
                "ymax": ymax,
                "projection": projection
            };
            topic.publish(MapEvent.prototype.SET_EXTENT, {"extent": extent});

            if(projection === this.config.data.projections.equirect) {
                topic.publish(MapEvent.prototype.GLOBE_SET_EXTENT, {
                    "xmin": xmin,
                    "xmax": xmax,
                    "ymin": ymin,
                    "ymax": ymax
                });
            }

            //ADD LAYERS TO MAP
            var layers = this.parseLayerList(this.bookmark.layers);

            //Start from 1 to skip the basemap layer
            for (var i = 1; i < layers.length; i++) {
                var getItemUrl = this.indexerUtil.createGetItemUrl({
                    productLabel: layers[i].productLabel,
                    projection: this.bookmark.dataProjection
                });
                console.log("getItemUrl", getItemUrl);

                var syncXhr = new XMLHttpRequest();
                syncXhr.open('GET', getItemUrl, false);

                syncXhr.send();

                if (syncXhr.status === 200) {
                    // do something to response
                    var reponseJson = JSON.parse(syncXhr.responseText);
                    //}

                    // xhr(getItemUrl, {
                    //     handleAs: "json",
                    //     headers: {"X-Requested-With": null}
                    // }).then(function (itemData) {
                    var item = reponseJson.response.docs[0];
                    if (item === undefined) {
                        continue;
                    }

                    var getLayerServiceUrl = self.indexerUtil.createLayerServicesUrl(reponseJson.response.docs[0].item_UUID);
                    console.log("getLayerServiceUrl", getLayerServiceUrl);

                    var syncXhr2 = new XMLHttpRequest();
                    syncXhr2.open('GET', getLayerServiceUrl, false);
                    syncXhr2.send();

                    if (syncXhr2.status === 200) {
                        // do something to response
                        var serviceResponse = JSON.parse(syncXhr2.responseText);
                        var layerService = serviceResponse.response.docs[0];

                        var map = null,
                            layerOutline = null,
                            newLayerId = "myLayer_" + item.productLabel,
                            layer = self.indexerUtil.createLayer(reponseJson, serviceResponse);

                        //if the layer is not found in the layer list, do not add
                        if (layer == null)
                            return;

                        map = self.getMap(layer.layerProjection);

                        self.bookmark.mapLayers.push(layer);

                        var layerIsOnMap;
                        for (var i = 0; i < map.layerIds.length; i++) {
                            layerIsOnMap = layer.productLabel === map.layerIds[i];
                            if (layerIsOnMap) {
                                i = map.layerIds.length + 1;
                            }
                        }

                        if (layerIsOnMap) {
                            MapUtil.prototype.removeLayerFromMap(layer.productLabel, map);
                            topic.publish(LayerEvent.prototype.REMOVE_FROM_ACTIVE_LAYERS, {
                                "productLabel": layer.productLabel,
                                "projection": this.bookmark.dataProjection
                            });

                            MapUtil.prototype.addLayerToMap(layer, map);
                            topic.publish(LayerEvent.prototype.ADD_TO_ACTIVE_LAYERS, {"layer": layer});
                        }
                        else {
                            MapUtil.prototype.addLayerToMap(layer, map);
                            topic.publish(LayerEvent.prototype.ADD_TO_ACTIVE_LAYERS, {"layer": layer});
                        }

                    }
                }
            }

            topic.publish(LayerEvent.prototype.REORDER_LAYERS_REQUST, { });

            //ADD SHAPES TO MAP
            var shapeListUrl = this.createBookmarkServiceGetShapesInCollectionUrl() + this.bookmark.item_UUID;
            console.log("shape list url", shapeListUrl);
            xhr(shapeListUrl, {
                handleAs: "json",
                headers: {
                    "X-Requested-With": null,
                    "Content-Type" : "application/json"
                }
            }).then(function (bookmarkGraphics) {
                //console.log("shapes", bookmarkGraphics);

                var graphics = bookmarkGraphics.response.docs;
                var infoTemplate = new InfoTemplate();
                infoTemplate.setTitle("Feature");
                infoTemplate.setContent(self.getTextContent);

                var shapeGraphicLayer = new GraphicsLayer();
                shapeGraphicLayer.setInfoTemplate(infoTemplate);

                //console.log("shape graphic", graphic);
                for(var i = 0; i < graphics.length; i++){
                    var componentWrap = self.wktUtil.convertWktToComponents(graphics[i].shape);
                    var geometry = self.wktUtil.convertComponentWrapToGeometry(componentWrap);
                    geometry.spatialReference.wkid = self.config.data.extents.equirect.wkid;
                    //console.log("geometry", geometry);

                    //create graphic and add to map
                    var borderColorString = graphics[i].borderColor;
                    var fillColorString = graphics[i].fillColor;
                    var graphic = self.createGraphic(geometry, borderColorString, fillColorString);

                    if(graphic){
                        var graphicMediaUrl;
                        if(graphics[i].mediaUrl){
                            if(graphics[i].mediaUrl.length > 0){
                                graphicMediaUrl = graphics[i].mediaUrl[0];
                            }
                        }
                        var attributes = {
                            "title": graphics[i].title,
                            "description": graphics[i].description,
                            "img": graphicMediaUrl
                        };
                        graphic.setAttributes(attributes);

                        shapeGraphicLayer.add(graphic);
                        self.addGraphicToTerrain(graphic);
                    }
                }

                var map = self.getMap(self.bookmark.dataProjection);

                self.mapShapeGraphicLayer = shapeGraphicLayer;

                map.addLayer(shapeGraphicLayer);

            }, function (err) {
                console.log("error retrieving bookmark items:" + err);
            });


            //ADD ANNOTATIONS TO MAP
            var annotationsListUrl = this.createBookmarkServiceGetAnnotationsInCollectionUrl() + this.bookmark.item_UUID;
            console.log("annotation list url", annotationsListUrl);
            xhr(annotationsListUrl, {
                handleAs: "json",
                headers: {
                    "X-Requested-With": null,
                    "Content-Type" : "application/json"
                }
            }).then(function (bookmarkGraphics) {
                //console.log("annotations", bookmarkGraphics);

                var annotationsGraphicLayer = new GraphicsLayer();

                var graphics = bookmarkGraphics.response.docs;
                //console.log("annotation graphics", graphics);
                for(var i = 0; i < graphics.length; i++){
                    //console.log("annotation graphic[" + i + "]", graphics[i]);
                    var componentWrap = self.wktUtil.convertWktToComponents(graphics[i].shape);
                    var geometry = self.wktUtil.convertComponentWrapToGeometry(componentWrap);
                    geometry.spatialReference.wkid = self.config.data.extents.equirect.wkid;
                    //console.log("geometry", geometry);

                    //create graphic and add to map
                    var borderColorString = graphics[i].borderColor;
                    var fillColorString = graphics[i].fillColor;

                    for(var j = 0; j < geometry.paths.length; j++){
                        var json = geometry.toJson();
                        var newGeometry = EsriJsonUtil.fromJson(json);
                        newGeometry.paths = [];
                        newGeometry.paths.push(geometry.paths[j]);

                        var graphic = self.createGraphic(newGeometry, borderColorString, fillColorString);
                        //console.log("ANNOTATION GRAPHIC", graphic);
                        annotationsGraphicLayer.add(graphic);
                        self.addGraphicToTerrain(graphic);
                    }
                }

                var map = self.getMap(self.bookmark.dataProjection);
                self.mapAnnotationsGraphicLayer = annotationsGraphicLayer;
                map.addLayer(annotationsGraphicLayer);

            }, function (err) {
                console.log("error retrieving bookmark items:" + err);
            });
        },

        parseLayerList: function(layersString){
            var layersString = layersString.slice(1,layersString.length - 1);

            var layersArray = [];
            this.parseLayerListHelper(layersString, layersArray);
            return layersArray;
        },

        parseLayerListHelper: function(layersString, layersArray){
            var indexOfFirstBracket = layersString.indexOf("{");
            var indexOfFirstEndBracket = layersString.indexOf("}");

            var firstLayerString = layersString.slice(indexOfFirstBracket + 1, indexOfFirstEndBracket);

            var productLabel = firstLayerString.split(",")[0];
            productLabel = productLabel.slice(1,productLabel.length - 1);
            var transparency = parseFloat(firstLayerString.split(",")[1]);

            layersArray.push({
                "productLabel": productLabel,
                "transparency": transparency
            });

            var secondLayerString = layersString.slice(indexOfFirstEndBracket + 1, layersString.length);

            if(secondLayerString.length > 1){
                this.parseLayerListHelper(secondLayerString, layersArray);
            }
        },

        getMap: function(projection) {
            var map;
            if(projection === this.config.data.projections.equirect) {
                map = this.mapDijit.equirectMap;
            } else if(projection === this.config.data.projections.northpole) {
                map = this.mapDijit.northPoleMap;
            } else if(projection === this.config.data.projections.southpole) {
                map = this.mapDijit.southPoleMap;
            }

            return map;
        },

        createGraphic: function(geometry, borderColorString, fillColorString){
            var borderColor = this.convertStringToColor(borderColorString);
            var fillColor = this.convertStringToColor(fillColorString);

            var graphic = null;

            if(geometry.type === "point"){
                var symbol = new SimpleMarkerSymbol({
                    "color": fillColor,
                    "size": 12,
                    "angle": -30,
                    "xoffset": 0,
                    "yoffset": 0,
                    "type": "esriSMS",
                    "style": "esriSMSCircle",
                    "outline": {
                        "color": borderColor,
                        "width": 1,
                        "type": "esriSLS",
                        "style": "esriSLSSolid"
                    }
                });

                graphic = new Graphic(geometry, symbol);
            }
            else if(geometry.type === "polyline"){
                var symbol = new SimpleLineSymbol(
                    SimpleLineSymbol.STYLE_SOLID,
                    new Color(borderColor),
                    5
                );

                graphic = new Graphic(geometry, symbol);
            }
            else {
                var sfs = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
                    new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                        new Color(borderColor), 1), new Color(fillColor));

                graphic = new Graphic(geometry, sfs);
            }

            return graphic;
        },

        createBookmarkServiceGetShapesInCollectionUrl: function(){
            var url = null;
            if(this.bookmark.dataProjection === this.config.data.projections.northpole){
                url = this.config.bookmarkServiceGetShapesInCollectionUrl.replace("PROJECTION", "polar");
            }
            if(this.bookmark.dataProjection === this.config.data.projections.southpole){
                url = this.config.bookmarkServiceGetShapesInCollectionUrl.replace("PROJECTION", "polar");
            }
            if(this.bookmark.dataProjection === this.config.data.projections.equirect){
                url = this.config.bookmarkServiceGetShapesInCollectionUrl.replace("PROJECTION", "eq");
            }

            return url;
        },

        createBookmarkServiceGetAnnotationsInCollectionUrl: function(){
            var url = null;
            if(this.bookmark.dataProjection === this.config.data.projections.northpole){
                url = this.config.bookmarkServiceGetAnnotationsInCollectionUrl.replace("PROJECTION", "polar");
            }
            if(this.bookmark.dataProjection === this.config.data.projections.southpole){
                url = this.config.bookmarkServiceGetAnnotationsInCollectionUrl.replace("PROJECTION", "polar");
            }
            if(this.bookmark.dataProjection === this.config.data.projections.equirect){
                url = this.config.bookmarkServiceGetAnnotationsInCollectionUrl.replace("PROJECTION", "eq");
            }

            return url;
        },

        convertStringToColor: function(colorString){
            var rgbaString = colorString.split(",");
            var color = new Color(rgbaString);

            return color;
        },

        cleanUp: function(){
        },

        removeLayers: function(){
            var map = this.getMap(this.bookmark.dataProjection);
            //
            // for (var i = this.bookmark.mapLayers.length-1; i > -1; i--) {
            //     MapUtil.prototype.removeLayerFromMap(this.bookmark.mapLayers[i].productLabel, map);
            //     topic.publish(LayerEvent.prototype.REMOVE_FROM_ACTIVE_LAYERS, {
            //         "productLabel":this.bookmark.mapLayers[i].productLabel,
            //         "projection": this.bookmark.dataProjection
            //     });
            //     this.bookmark.mapLayers.pop()
            // }
            //
            var mapLayer = this.bookmark.mapLayers.pop();
            while (mapLayer !== undefined) {
                MapUtil.prototype.removeLayerFromMap(mapLayer.productLabel, map);
                topic.publish(LayerEvent.prototype.REMOVE_FROM_ACTIVE_LAYERS, {
                    "productLabel":mapLayer.productLabel,
                    "projection": this.bookmark.dataProjection
                });
                mapLayer = this.bookmark.mapLayers.pop();
            }

        },

        removeGraphicShapes: function(){
            if(this.mapShapeGraphicLayer){
                var map = this.getMap(this.bookmark.dataProjection);
                map.removeLayer(this.mapShapeGraphicLayer);
            }
        },

        removeGraphicAnnotations: function(){
            if(this.mapAnnotationsGraphicLayer){
                var map = this.getMap(this.bookmark.dataProjection);
                map.removeLayer(this.mapAnnotationsGraphicLayer);
            }
        },

        getTextContent: function(graphic){
            var attr = graphic.attributes;

            var content = '<p>Title:' + attr.title + '</p>';
            var imgContent = "";
            if (attr.img != undefined) {
                var imagePath = attr.img;
                imgContent = "<img src='" + imagePath + "'>";
            }
            content += imgContent;
            content += '<p>Description:' + attr.description + '</p>';

            return content;
        },

        deleteThisBookmark: function(){
            var self = this;
            //console.log("removebookmark");

            var deleteUrl = this.config.bookmarkServiceDeleteUrl + this.bookmark.item_UUID;
            console.log("deleteUrl", deleteUrl);
            xhr(deleteUrl, {
                headers: {
                    "X-Requested-With": null
                },
                method: "DELETE"
            }).then(lang.hitch(this, function() {
                self.closeViewer();
                self.sidebar.submitSearch();
            }), function(err) {
                console.log("error deleting bookmark:" + err);
            });
        },

        addGraphicToTerrain: function(graphic){
            topic.publish(BookmarkEvent.prototype.ADD_GRAPHIC_TO_TERRAIN, {"graphic": graphic});
        },

        removeGraphicsFromTerrain: function(){
            topic.publish(BookmarkEvent.prototype.REMOVE_GRAPHIC_FROM_TERRAIN, null);
        },

        exitTour: function(evt){
            this.sidebar.controlBar.showButtonsFor3D();
            this.sidebar.controlBar.closeSideBars();
            this.sidebar.controlBar.activateSearch();
        },

        start3DTour: function(evt){
            var bookmarkItem = {
                "pathLayer": this.pathLayer,
                "waypointLayer": this.waypointLayer,
                "waypoints": this.waypoints
            };
            this.sidebar.controlBar.view3DClicked();
            this.sidebar.controlBar.hideButtonsFor3D();
            this.sidebar.controlBar.closeSideBars();
            topic.publish(MapEvent.prototype.BEGIN_TOUR_3D, bookmarkItem);
        },

        retrieveWaypoints: function(layer) {
            var self = this;
            //var service = this.findWaypointService(items);
            var service = layer.services[0];

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
                        self.sidebar.bookmarkManager.setBookmarkWaypoints(self.bookmark, this.waypoints);

                        self.setWaypointsContent();

                        self.start3DTourButton.disabled = false;
                    }
                }), function (err) {
                    throw new Error("Could not retrieve waypoints for bookmark (" + service.endPoint + ") - " + err);
                });
            }

        },

        isOldBookmark: function(){
            if(this.bookmark.bookmarkType){
                if(this.bookmark.bookmarkType === "adhoc"){
                    return true;
                }
            }

            return false;
        },

        isOldBookmarkWithPath: function(){
            if(this.bookmark.path){
                return true;
            }
            return false;
        },

        addSpecialLayersToMap: function(productLabelList){
            var self = this;

            xhr("jpl/config/bookmarklayers.json", {
                handleAs: "json",
                headers: {
                    "X-Requested-With": null,
                    "Content-Type" : "application/json"
                }
            }).then(function (bookmarklayersjson) {
                var specialLayers = self.getSpecialLayersList(productLabelList, bookmarklayersjson);

                if(self.isOldBookmarkWithPath()) {
                    //loop over features and add to the map
                    for (var f = 0; f < specialLayers.length; f++) {
                        var feature = specialLayers[f];

                        if (f === 0) {
                            self.pathLayer = feature;
                            self.sidebar.bookmarkManager.setBookmarkPathLayer(self.bookmark, self.pathLayer);
                        }
                        if (f === 1) {
                            self.waypointLayer = feature;
                            self.sidebar.bookmarkManager.setBookmarkWaypointLayer(self.bookmark, self.waypointLayer);
                            self.retrieveWaypoints(feature);
                        }

                        self.addSpecialLayerToMap(feature);
                    }
                }
                else{
                    if(specialLayers.length > 0){
                        var feature = specialLayers[0];

                        self.waypointLayer = feature;
                        self.sidebar.bookmarkManager.setBookmarkWaypointLayer(self.bookmark, self.waypointLayer);
                        self.retrieveWaypoints(feature);

                        self.addSpecialLayerToMap(feature);
                    }
                }
            }, function (err) {
                console.log("error retrieving bookmark items:" + err);
            });
        },

        addSpecialLayerToMap: function(layer){
            MapUtil.prototype.addFeatureLayerToMap(layer, this.mapDijit.equirectMap, false);
            topic.publish(LayerEvent.prototype.ADD_LAYER_TO_3D_FOR_MARTIAN, {
                "layer": layer
            });
        },

        removeSpecialLayerFromMap: function(layer){
            var map = this.getMap(layer.layerProjection);
            MapUtil.prototype.removeLayerFromMap(layer.productLabel, map);
        },

        getSpecialLayersList: function(productLabelList, layerJson){
            var layers = [];
            for(var i = 0; i < productLabelList.length; i++){
                for(var j = 0; j < layerJson.length; j++){
                    if(productLabelList[i] === layerJson[j].productLabel){
                        var layer = this.indexerUtil.createLayerFromOldJson(layerJson[j]);
                        layers.push(layer);
                        j = layerJson.length;
                    }
                }
            }

            return layers;

        },

        createOldBookmark: function (attributes) {
            var bookmark = new OldBookmark();
            bookmark.id = attributes.id;
            bookmark.name = attributes.name;
            bookmark.thumbnailImage = attributes.thumbnailImage;
            bookmark.description = attributes.description;
            bookmark.projection = attributes.projection;
            bookmark.regionInfo = attributes.regionInfo;
            bookmark.bounding = attributes.bounding;
            bookmark.pathInfo = attributes.pathInfo;
            bookmark.teaser = attributes.teaser;
            bookmark.teaserImage = attributes.teaserImage;
            bookmark.teaserBigImage = attributes.teaserBigImage;
            bookmark.items = {
                layers: [],
                features: []
            };
            bookmark.stlContent = attributes.stlContent;

            for (var i=0; i < attributes.items.layers.length; i++) {
                //var layer = Layers.getInstance().createLayer(attributes.items.layers[i]);
                var layer = this.indexerUtil.createLayerFromOldJson(attributes.items.layers[i]);
                bookmark.items.layers.push(layer);
            }

            for (var f=0; f < attributes.items.features.length; f++) {
                var feature = this.indexerUtil.createLayerFromOldJson(attributes.items.features[f]);
                //var feature = Layers.getInstance().createLayer(attributes.items.features[f]);
                bookmark.items.features.push(feature);
            }

            return bookmark;
        },

        setWaypointsContent: function(){
            domConstruct.empty(this.bookmarkWaypointList);

            for(var w=0; w < this.waypoints.length; w++) {
                var node = "<a class='list-group-item waypoint-item' " +
                    "data-map-x='" + this.waypoints[w].geometry.x +
                    "' data-map-y='" + this.waypoints[w].geometry.y +
                    "' data-map-template='" + this.waypoints[w].attributes.template +
                    "' data-map-proj='" + this.bookmark.dataProjection +
                    "' data-waypoint-id='" + this.waypointLayer.productLabel + "-" + this.waypoints[w].attributes.name +
                    "' style='cursor:pointer;border-left:none;border-right:none'>" + this.waypoints[w].attributes.name + "</a>";

                var waypointItem = domConstruct.place(node, this.bookmarkWaypointList);
                on(waypointItem, mouse.enter, lang.hitch(this, this.waypointMouseOver));
                on(waypointItem, mouse.leave, lang.hitch(this, this.waypointMouseOut));
                on(waypointItem, "click", lang.hitch(this, this.waypointClicked));
            }
        },

        waypointMouseOver: function(evt) {
            var x = Number(evt.target.attributes["data-map-x"].value),
                y = Number(evt.target.attributes["data-map-y"].value),
                proj = evt.target.attributes["data-map-proj"].value,
                id = evt.target.attributes["data-waypoint-id"].value;

            topic.publish(BookmarkEvent.prototype.WAYPOINT_HOVER, id);
            this.addWaypointGraphic(x,y,proj);
        },

        addWaypointGraphic: function(x, y, projection) {
            var map = this.getMap(projection);

            if(this.graphicPoint) {
                map.graphics.remove(this.graphicPoint);
            }

            this.graphicPoint = MapUtil.prototype.createGraphicMarkerPoint(x, y, map);

            map.graphics.add(this.graphicPoint);
        },

        waypointMouseOut: function(evt) {
            var proj = evt.target.attributes["data-map-proj"].value;
            var id = evt.target.attributes["data-waypoint-id"].value;

            //topic.publish(BookmarkEvent.prototype.WAYPOINT_LEAVE, evt.target.childNodes[0].data);
            topic.publish(BookmarkEvent.prototype.WAYPOINT_LEAVE, id);
            this.removeWaypointGraphic(proj);
        },

        removeWaypointGraphic: function(projection) {
            if(this.graphicPoint) {
                var map = this.getMap(projection);
                map.graphics.remove(this.graphicPoint);
                this.graphicPoint = null;
            }
        },

        waypointClicked: function(evt) {
            var x = Number(evt.target.attributes["data-map-x"].value),
                y = Number(evt.target.attributes["data-map-y"].value),
                proj = evt.target.attributes["data-map-proj"].value,
                name = evt.target.innerHTML,
                template = evt.target.attributes["data-map-template"].value;
            var id = evt.target.attributes["data-waypoint-id"].value;

            topic.publish(BookmarkEvent.prototype.WAYPOINT_CLICK, id);
            this.showInfoWindow(x, y, proj, name, template);
        },

        showInfoWindow: function(x, y, projection, name, templateURL) {
            var map = this.getMap(projection);

            topic.publish(MapEvent.prototype.CLOSE_OVERHEAD_POPUP, null);

            MapUtil.prototype.checkAndSetMapProjection(
                this.bookmark.dataProjection,
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
                            map.infoWindow.resize(400, 400);
                            map.infoWindow.show(screenPoint, map.getInfoWindowAnchor(screenPoint));
                            map.infoWindow._contentPane.scrollTop = 0;
                        });
                })
        },

        toggleWaypoints: function(evt) {
            if(!evt){
                var map = this.getMap(this.bookmark.dataProjection);
                var layer = map.getLayer(this.waypointLayer.productLabel);

                MapUtil.prototype.showLayer(layer);
                topic.publish(BookmarkEvent.prototype.SHOW_WAYPOINTS_3D, {"layer":layer});
            }
            else{
                var map = this.getMap(this.bookmark.dataProjection);
                var layer = map.getLayer(this.waypointLayer.productLabel);

                MapUtil.prototype.hideLayer(layer);
                topic.publish(BookmarkEvent.prototype.HIDE_WAYPOINTS_3D, {"layer":layer});
            }
        },

        addBookmarkToMap: function(){
            this.sidebar.addBookmarkToManager(this.bookmark);

            this.setUpMap();

            if(this.isOldBookmark()){
                //this.setUpOldBookmark();
                domClass.remove(this.bookmarkWaypoints, "hidden");
            }
            else {
                //this.setUpMap();
                domClass.add(this.start3DTourButton, "hidden");

                domClass.remove(this.deleteBookmarkButton, "hidden");
                on(this.deleteBookmarkButton, "click", lang.hitch(this, this.deleteThisBookmark));
            }

            this.showRemoveBookmarkButton();
        },

        removeBookmarkFromMap: function(){
            this.sidebar.removeBookmarkFromManager(this.bookmark);

            if(this.isOldBookmark()){
                domClass.add(this.bookmarkWaypoints, "hidden");
                domClass.add(this.start3DTourButton, "hidden");
            }
            else {
                domClass.add(this.start3DTourButton, "hidden");
                domClass.add(this.deleteBookmarkButton, "hidden");
            }

            this.cleanUpOnRemove();
            this.showAddBookmarkButton();
        },

        showAddBookmarkButton: function(){
            domClass.remove(this.addBookmarkButton, "hidden");
            domClass.add(this.removeBookmarkButton, "hidden");
        },

        showRemoveBookmarkButton: function(){
            domClass.add(this.addBookmarkButton, "hidden");
            domClass.remove(this.removeBookmarkButton, "hidden");
        },

        cleanUpOnRemove: function(){
            this.removeLayers();
            this.removeGraphicShapes();
            this.removeGraphicAnnotations();
            this.removeGraphicsFromTerrain();

            if(this.isOldBookmark()){
                var bookmarkItem = {
                    "pathLayer": this.pathLayer,
                    "waypointLayer": this.waypointLayer,
                    "waypoints": this.waypoints
                };
                topic.publish(BookmarkEvent.prototype.BOOKMARK_REMOVED, bookmarkItem);

                if(this.isOldBookmarkWithPath()){
                    this.removeSpecialLayerFromMap(this.pathLayer);
                }
                this.removeSpecialLayerFromMap(this.waypointLayer);
            }
        },

        ZoomBtnClicked: function(){
            var projection = this.bookmark.dataProjection;
            var xmin = this.bookmark.bbox.split(",")[0];
            var ymin = this.bookmark.bbox.split(",")[1];
            var xmax = this.bookmark.bbox.split(",")[2];
            var ymax = this.bookmark.bbox.split(",")[3];

            var extent = {
                "xmin": xmin,
                "ymin": ymin,
                "xmax": xmax,
                "ymax": ymax,
                "projection": projection
            };
            topic.publish(MapEvent.prototype.SET_EXTENT, {"extent": extent});
            topic.publish(MapEvent.prototype.GLOBE_SET_EXTENT, {
                "xmin": xmin,
                "xmax": xmax,
                "ymin": ymin,
                "ymax": ymax
            });
        }

    });
});
