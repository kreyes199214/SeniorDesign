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
    'dojo/text!./templates/SunAngleTool.html',

    "xstyle/css!./css/ConstrainedFloatingPane.css",
    "xstyle/css!../../dojox/layout/resources/ResizeHandle.css",
    "xstyle/css!./css/SunAnglePlot.css",
    "jpl/events/ToolEvent",
    "jpl/events/LoadingEvent",
    "jpl/events/MapEvent",
    "jpl/events/NavigationEvent",
    "esri/geometry/Polyline",

    "jpl/dijit/SunAnglePlot",
    "dojo/dom-style",
    "dojo/query",
    "dojo/fx/Toggler",
    "jpl/config/Config",
    "dojo/mouse",
    "jpl/dijit/ui/ConstrainedFloatingPane",
    "dojox/xml/DomParser",
    "esri/geometry/Point",

    "jpl/dijit/ui/SunAngleDialog",
    "jpl/data/BaseMaps",
"dojo/dom-attr",
    "jpl/utils/MapUtil"
], function (declare, lang, on, topic, dom, domConstruct, xhr, _WidgetBase, _TemplatedMixin, template,
             floatingPaneCss, resizeHandleCss, sunAnglePlotCss, ToolEvent, LoadingEvent, MapEvent, NavigationEvent, Polyline,
             SunAnglePlot, style, query, Toggler, Config, mouse, ConstrainedFloatingPane, DomParser, Point,
             SunAngleDialog, BaseMaps, domAttr, MapUtil) {
    return declare([_WidgetBase, _TemplatedMixin], {
        templateString: template,
        floatingPaneId: 0,
        sunAngleDialog: null,
        graphic: null,
        urlPrefix: null,
        ltd: null,
        alt: null,
        projection: null,
        sidebarIsOpen: false,
        parent: null,
        graphic: null,
        editToolbar: null,

        constructor: function () {
        },

        postCreate: function () {
            this.config = Config.getInstance();
            this.basemapSingleton = BaseMaps.getInstance();
        },

        startup: function () {
            topic.subscribe(ToolEvent.prototype.SHOW_SUN_ANGLE_PLOT,  lang.hitch(this, this.showSunAngleDialog));
            topic.subscribe(ToolEvent.prototype.SUN_ANGLE_DIALOG_RESPONSE,  lang.hitch(this, this.showSunAnglePlot));
            topic.subscribe(NavigationEvent.prototype.OPEN_SIDEBAR, lang.hitch(this, this.sidebarOpened));
            topic.subscribe(NavigationEvent.prototype.CLOSE_SIDEBAR, lang.hitch(this, this.sidebarClosed));
        },

        sidebarOpened: function() {
            this.sidebarIsOpen = true;
        },

        sidebarClosed: function() {
            this.sidebarIsOpen = false;
        },

        showSunAngleDialog: function(evt){
console.log('SunAngleTool::showSunAngleDialog() - evt = ' + evt);
console.log(evt);
            this.graphic = evt.graphic;
            this.urlPrefix = evt.endpoint;
            this.ltd = evt.ltd;
            this.alt = evt.alt;
            this.projection = evt.projection;
            this.parent = evt.parent;
            this.editToolbar = evt.editToolbar;

            this.sunAngleDialog = new SunAngleDialog();
            this.sunAngleDialog.startup(this.parent, this.editToolbar, this.graphic);
/*
            if(this.sunAngleDialog === null){
                this.sunAngleDialog = new SunAngleDialog();
            }else{
                this.sunAngleDialog.show();
            }
*/
        },

        showSunAnglePlot: function(startDate, startTime, endDate, endTime, intervalInSeconds){
            this.createPlot(
                this.createSunAngleRestServiceUrl(startDate, startTime, endDate, endTime, intervalInSeconds),
                this.projection
            );
        },

        createSunAngleRestServiceUrl: function(startDate, startTime, endDate, endTime, intervalInSeconds){
            var timePeriod = startDate + "T" + startTime + "/" + endDate + "T" + endTime + "/" + intervalInSeconds;
            var pointLocation = this.getPointLocation(this.graphic, this.alt);

            var sunAngleRestServiceUrl = this.urlPrefix + "/" + this.ltd + "," + pointLocation + ",1,1/Sun/" + timePeriod;

console.log('SunAngleTool::createSunAngleRestServiceUrl() - sunAngleRestServiceUrl = ' + sunAngleRestServiceUrl);
console.log(sunAngleRestServiceUrl);
//alert(sunAngleRestServiceUrl);

            return sunAngleRestServiceUrl;
        },

        getPointLocation: function(graphic, alt){
            var x = graphic.geometry.x,
                y = graphic.geometry.y;

            if(this.basemapSingleton.currentMapProjection === this.config.projection.N_POLE) {
                var degObj = MapUtil.prototype.convertNorthPolarMetersToDegrees(x, y);
                x = degObj.x;
                y = degObj.y;
            } else if(this.basemapSingleton.currentMapProjection === this.config.projection.S_POLE) {
                var degObj = MapUtil.prototype.convertSouthPolarMetersToDegrees(x, y);
                x = degObj.x;
                y = degObj.y;
            }

            return y + "," + x + "," + alt + "," + y + "," + x;
        },

        createPlot: function(restUrl, projection) {

            //restUrl = 'http:' + restUrl;

console.log('SunAngleTool::createPlot() - restUrl = ' + restUrl);
console.log(restUrl);

            var sunAngleTool = this;
            topic.publish(LoadingEvent.prototype.BEGIN_DOWNLOAD, "Gathering Sun Angle Data...");
            var plotProjection = this.basemapSingleton.currentMapProjection;

            xhr(restUrl, {
                handleAs: "text",
                headers: {"X-Requested-With": null}
            }).then(lang.hitch(this, function(data) {

                topic.publish(LoadingEvent.prototype.END_DOWNLOAD);

                var parsedData = DomParser.parse(data);
                var elevationByTimeSeries = this.getElevationByTimeSeries(parsedData);
                var azimuthByTimeSeries = this.getAzimuthByTimeSeries(parsedData);

                var newSunAnglePlotId = "sunAnglePlot" + this.floatingPaneId;
                var newFloatingPane = this.generateFloatingContainer(query("#floatingPaneContainer")[0], true, false);
                newFloatingPane.startup();

                var sunAnglePlot = new SunAnglePlot(elevationByTimeSeries, azimuthByTimeSeries, newSunAnglePlotId, newFloatingPane, plotProjection);
                sunAnglePlot.startup();
                sunAnglePlot.reduceSize();

                if(plotProjection !==  this.basemapSingleton.currentMapProjection){
                    sunAnglePlot.hide();
                }

                this.floatingPaneId++;
            }), function(err) {
                console.log("error retrieving basemaps:" + err);
            });
        },

        generateFloatingContainer: function(containerNode, resizeable, dockable){

            var newFloatingPaneId = "sunAngleFloatingPane" + this.floatingPaneId,
                floatingPaneDiv = domConstruct.create("div", {id: newFloatingPaneId}, containerNode),
                paneWidth = 500,
                paneLeftPos = window.innerWidth - (paneWidth + 60);

domAttr.set(floatingPaneDiv, "style", "overlow:auto");

            //if sidebar is opened, need to offset by +300px
            if(this.sidebarIsOpen) {
                paneLeftPos += 300;
            }
            return new ConstrainedFloatingPane({
                title: "Sun Angle",
                resizable: resizeable,
                dockable: dockable,
                duration: 100,
                //style: "position:absolute;top:" + 50 + "px;left:" + paneLeftPos + "px;width:" + paneWidth + "px;height:352px;z-index:10",
                style: "overflow:hidden;position:relative;top:" + 50 + "px;left:" + paneLeftPos + "px;width:" + paneWidth + "px;height:352px;z-index:10",
                id: newFloatingPaneId
            }, floatingPaneDiv);
        },

        getElevationByTimeSeries: function(data){
            var samples = data.childNodes[1].childNodes[0].childNodes[2].childNodes;
            var elevationByTimeSeries = [];
            var elevationByTimeSeriesIndex = 0;

            for(var sampleIndex = 1; sampleIndex < samples.length; sampleIndex++){
                elevationByTimeSeries[elevationByTimeSeriesIndex] = {
                    x: elevationByTimeSeriesIndex,
                    y: samples[sampleIndex].childNodes[3].childNodes[0].nodeValue,
                    xValue: samples[sampleIndex].childNodes[1].childNodes[0].nodeValue
                };
                elevationByTimeSeriesIndex++;
            }
            return elevationByTimeSeries;
        },

        getAzimuthByTimeSeries: function(data){
            var samples = data.childNodes[1].childNodes[0].childNodes[2].childNodes;
            var azimuthByTimeSeries = [];
            var azimuthByTimeSeriesIndex = 0;

            for(var sampleIndex = 1; sampleIndex < samples.length; sampleIndex++){
                azimuthByTimeSeries[azimuthByTimeSeriesIndex] = {
                    x: azimuthByTimeSeriesIndex,
                    y: samples[sampleIndex].childNodes[2].childNodes[0].nodeValue,
                    xValue: samples[sampleIndex].childNodes[1].childNodes[0].nodeValue
                };
                azimuthByTimeSeriesIndex++;
            }
            return azimuthByTimeSeries;
        }
    });
});
