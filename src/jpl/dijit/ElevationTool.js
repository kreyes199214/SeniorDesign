define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/on",
    "dojo/topic",
    "dojo/dom",
    "dojo/dom-construct",
    "dojo/request/xhr",
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    'dojo/text!./templates/ElevationTool.html',
    "xstyle/css!./css/ConstrainedFloatingPane.css",
    "xstyle/css!./css/ElevationPlot.css",
    "xstyle/css!../../dojox/layout/resources/ResizeHandle.css",
    "jpl/events/ToolEvent",
    "jpl/events/LoadingEvent",
    "jpl/events/MapEvent",
    "jpl/events/NavigationEvent",
    "esri/geometry/Polyline",
    "jpl/dijit/ElevationPlot",
    "jpl/data/BaseMaps",
    "jpl/utils/CatalogRastersUtil",
    "dojo/dom-style",
    "dojo/query",
    "dojo/fx/Toggler",
    "jpl/config/Config",
    "dojo/mouse",
    "jpl/dijit/ui/ConstrainedFloatingPane",
"xstyle/css!./css/Tool.css"
], function (declare, lang, on, topic, dom, domConstruct, xhr, _WidgetBase, _TemplatedMixin, template, floatingPaneCss, plotCss, resizeHandleCss,
             ToolEvent, LoadingEvent, MapEvent, NavigationEvent, Polyline, ElevationPlot, BaseMaps, CatalogRastersUtil, style, query, Toggler, Config, mouse,
             ConstrainedFloatingPane) {
    return declare([_WidgetBase, _TemplatedMixin], {
        templateString: template,
        widgetsInTemplate: true,
        floatingPaneId: 0,
        sidebarIsOpen: false,

        constructor: function () {
        },

        postCreate: function () {
            this.config = Config.getInstance();
            this.basemapSingleton = BaseMaps.getInstance();
        },

        startup: function () {
            topic.subscribe(ToolEvent.prototype.SHOW_ELEVATION_PLOT,  lang.hitch(this, this.showElevationPlot));
            topic.subscribe(NavigationEvent.prototype.OPEN_SIDEBAR, lang.hitch(this, this.sidebarOpened));
            topic.subscribe(NavigationEvent.prototype.CLOSE_SIDEBAR, lang.hitch(this, this.sidebarClosed));
        },

        sidebarOpened: function() {
            this.sidebarIsOpen = true;
        },

        sidebarClosed: function() {
            this.sidebarIsOpen = false;
        },

        showElevationPlot: function(evt){
            this.getEndPoint(evt);
        },

        getEndPoint: function(evt){
            var self = this;
/*
            var rasterServiceURL = this.config.services.catalogRastersService.equirect;
            if(this.basemapSingleton.currentMapProjection === this.config.projection.N_POLE) {
                rasterServiceURL = this.config.services.catalogRastersService.northpole;
            } else if(this.basemapSingleton.currentMapProjection === this.config.projection.S_POLE) {
                rasterServiceURL = this.config.services.catalogRastersService.southpole;
            }
*/

            var endPoint = this.config.services.globalDEMService.equirect;
            if(this.basemapSingleton.currentMapProjection === this.config.projection.N_POLE) {
                endPoint = this.config.services.globalDEMService.northpole;
            } else if(this.basemapSingleton.currentMapProjection === this.config.projection.S_POLE) {
                endPoint = this.config.services.globalDEMService.southpole;
            }


            console.log('ElevationTool::getEndPoint():: endPoint = ' + endPoint);

            topic.publish(LoadingEvent.prototype.BEGIN_DOWNLOAD, "Gathering Elevation Plot Data...");
            self.createElevationPlot(
                self.createElevationProfileRestServiceUrl(evt.graphic, endPoint),
                evt.projection,
                evt.graphic
            );
/*
            CatalogRastersUtil.prototype.getEndPoint(rasterServiceURL, evt.graphic).then(lang.hitch(this, function (endPoint) {
                self.createElevationPlot(
                    self.createElevationProfileRestServiceUrl(evt.graphic, endPoint),
                    evt.projection,
                    evt.graphic
                );
            }));
*/
        },

        createElevationProfileRestServiceUrl: function(graphic, endpoint){
            var polyline = new Polyline(graphic.geometry),
                urlCoordinates = "&path=[",
                elevationServiceURL = this.config.services.elevationService.equirect;

            if(this.basemapSingleton.currentMapProjection === this.config.projection.N_POLE) {
                elevationServiceURL = this.config.services.elevationService.northpole;
            } else if(this.basemapSingleton.currentMapProjection === this.config.projection.S_POLE) {
                elevationServiceURL = this.config.services.elevationService.southpole;
            }

            for (var path = 0; path < polyline.paths.length; path++){
                for (var pt = 0; pt < polyline.paths[path].length; pt++){
                    if(path === polyline.paths.length - 1 && pt === polyline.paths[path].length - 1){
                        urlCoordinates = urlCoordinates + "[" + polyline.paths[path][pt][0] + "," + polyline.paths[path][pt][1] + "]";
                    }
                    else{
                        urlCoordinates = urlCoordinates + "[" + polyline.paths[path][pt][0] + "," + polyline.paths[path][pt][1] + "],";
                    }
                }
            }
            urlCoordinates = urlCoordinates + "]";

            return elevationServiceURL + "?endpoint=" + endpoint + urlCoordinates +
                     "&numberOfPoints=" + this.config.elevationPoints +
                     "&radiusInMeters=" + this.config.ellipsoidRadius;
        },

        createElevationPlot: function(restUrl, projection, graphic) {
            var elevationProfileTool = this;
            var plotProjection = this.basemapSingleton.currentMapProjection;

            xhr(restUrl, {
                handleAs: "json",
                headers: {"X-Requested-With": null}
            }).then(lang.hitch(this, function(elevationJson) {
                topic.publish(LoadingEvent.prototype.END_DOWNLOAD);

                var elevationByDistanceSeries = this.getElevationByDistanceSeries(elevationJson);
                var newElevationPlotId = "elevationPlot" + this.floatingPaneId;

//console.log('ElevationTool::createElevationPlot() - elevationJson = ' + elevationJson);
//console.log(elevationJson);
//console.log('ElevationTool::createElevationPlot() - elevationByDistanceSeries = ' + elevationByDistanceSeries);
//console.log(elevationByDistanceSeries);

                var newFloatingPane = this.generateFloatingContainer(query("#floatingPaneContainer")[0], true, false);
                newFloatingPane.startup();
console.log('ElevationTool::createElevationPlot() - newFloatingPane = ' + newFloatingPane);
console.log(newFloatingPane);

                var elevationPlotChart = new ElevationPlot(elevationByDistanceSeries, newElevationPlotId, newFloatingPane, plotProjection, graphic);
                elevationPlotChart.startup();
                elevationPlotChart.reduceSize();

                if(plotProjection !==  this.basemapSingleton.currentMapProjection){
                    elevationPlotChart.hide();
                }

                this.floatingPaneId++;
            }), function(err) {
                console.log("error retrieving elevation data:" + err);
            });

        },

        generateFloatingContainer: function(containerNode, resizeable, dockable)
        {
            var newFloatingPaneId = "elevationFloatingPane" + this.floatingPaneId;
            var floatingPaneDiv = domConstruct.create("div", {id: newFloatingPaneId}, containerNode);
            //var id = "elevationPlot" + this.floatingPaneId; 
            //var html = '<div id="' + id + '" class="elevPlot"></div><div><input id="exportButton" type="button" class="btnTool" value="Export to csv" style="cursor:pointer;"></div>'; 
            //var floatingPaneDiv = domConstruct.create("div", {id: newFloatingPaneId, innerHTML: html}, containerNode);
            var paneWidth = 500;
            var paneLeftPos = window.innerWidth - (paneWidth + 60);

            //if sidebar is opened, need to offset by +300px
            if(this.sidebarIsOpen) {
                paneLeftPos += 300;
            }

            return new ConstrainedFloatingPane({
                title: "Elevation",
                resizable: resizeable,
                dockable: dockable,
                duration: 100,
                style: "overflow:hidden;position:relative;top:" + 50 + "px;left:" + paneLeftPos + "px;width:" + paneWidth + "px;height:385px;z-index:1"
            }, floatingPaneDiv);
        },

        getElevationByDistanceSeries: function(elevationJson){
            var elevationByDistanceSeries = [];

            var elevationByDistanceSeriesIndex = 0;
            for (var elevationJsonIndex = 1; elevationJsonIndex < elevationJson.line.length; elevationJsonIndex++){
                if(elevationJsonIndex === 1){
                    elevationByDistanceSeries[elevationByDistanceSeriesIndex] = {x:0, y: parseInt(elevationJson.line[elevationJsonIndex].elevation, 10), mapx:parseFloat(elevationJson.line[elevationJsonIndex].x), mapy:parseFloat(elevationJson.line[elevationJsonIndex].y)};
                }
                else{
                    var distance = parseInt(elevationByDistanceSeries[elevationByDistanceSeriesIndex - 1].x, 10) + parseInt(elevationJson.distance, 10);
                    elevationByDistanceSeries[elevationByDistanceSeriesIndex] = {x: distance,y: parseInt(elevationJson.line[elevationJsonIndex].elevation, 10), mapx:parseFloat(elevationJson.line[elevationJsonIndex].x), mapy:parseFloat(elevationJson.line[elevationJsonIndex].y)};
                }
                elevationByDistanceSeriesIndex++;
            }
            return elevationByDistanceSeries;

        }
    });
});
