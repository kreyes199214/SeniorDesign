define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/topic",
    "dojo/query",
    "dojo/html",
    "dojo/date/locale",
    "dojo/dom-style",
    "jpl/events/ToolEvent",
    "jpl/utils/LabelFormatter",
    "dojox/gesture/tap",
    "jpl/events/MapEvent",
    "dojo/_base/fx",
    "dojo/dom-geometry",
    "dojo/on",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dojo/text!./templates/ElevationPlot.html",
    "dojox/charting/Chart",
    "dojox/charting/widget/Legend",
    "jpl/dijit/MouseIndicator",
    "dojox/charting/plot2d/Lines",
    "dojox/charting/action2d/Tooltip",
    "dojox/charting/action2d/Magnify",
    "dojox/charting/themes/Desert",
    "dojox/charting/plot2d/Markers",
    "dojox/charting/axis2d/Default",
    "dojox/charting/plot2d/Areas"
], function (declare, lang, topic, query, html, locale, domStyle, ToolEvent, LabelFormatter,
            tap, MapEvent, baseFx, domGeom, on, _WidgetBase, _TemplatedMixin, template,
            Chart, Legend, MouseIndicator, LinesPlot, Tooltip, Magnify, theme ) {
    return declare("SunAnglePlot", [_WidgetBase, _TemplatedMixin], {
        templateString: template,
        widgetsInTemplate: true,
        elevationByTimeSeries: [],
        sunAnglePlotId: "",
        sunAnglePlotLegendId: "",
        floatingPane: null,
        chart: null,
        toggler: null,
        isPlayingEffect: false,
        minYValue: "",
        maxYValue: "",
        plotCoverId: "",
        plotCover: "",

        constructor: function (elevationByTimeSeries, azimuthByTimeSeries, sunAnglePlotId, floatingPane, projection) {
            this.elevationByTimeSeries = elevationByTimeSeries;
            this.azimuthByTimeSeries = azimuthByTimeSeries;
            this.sunAnglePlotId = sunAnglePlotId;
            this.floatingPane = floatingPane;
            this.projection = projection;
            this.plotCoverId = sunAnglePlotId + "plotCoverId";
        },

        postCreate: function () {
            var sunAnglePlot = this;
            this.sunAnglePlotLegendId = this.sunAnglePlotId + "legend";

            this.floatingPane.set("content", "<div id='" + this.plotCoverId + "' style='height:100%;width:100%;display:none;color:transparent;position:absolute;z-index:99999;'></div>" +
                "<div id = '" + this.sunAnglePlotId + "'></div>" +
                "<div class='sunAnglePlotLegend'><div id = '" + this.sunAnglePlotLegendId + "'></div></div>");

            this.chartNode = query("#" + this.sunAnglePlotId)[0];
            this.plotCover = query("#" + this.plotCoverId)[0]

            this.calculateMaxMinYValues();

            this.createChart();

            this.initChartMouseover();

            this.chart.render();

            this.createLegend();
        },

        startup: function(){
            topic.subscribe(MapEvent.prototype.PROJECTION_CHANGED, lang.hitch(this, this.projectionChanged));
            topic.subscribe(MapEvent.prototype.MAP_VIEW, lang.hitch(this, this.show));
            topic.subscribe(MapEvent.prototype.TERRAIN_VIEW, lang.hitch(this, this.hide));

            //Resize the chart when the floating window is resized
            on(this.floatingPane._resizeHandle, "resize",lang.hitch(this, this.resize));

            //Resize the floating pane if the window is smaller than the floating pane itself.
            on(window, "resize", lang.hitch(this, this.reduceSize));

            on(this.floatingPane.focusNode, "mousedown", lang.hitch(this, this.showPlotCover));
            on(document, "mouseup", lang.hitch(this, this.hidePlotCover));
        },

        createChart: function(){
            var sunAnglePlot = this;
            this.chart = new Chart(this.chartNode);
            this.chart.setTheme(theme);
            this.chart.addPlot("default",{
                type: LinesPlot,
                tension: "S",
                shadows: {dx: 20, dy: 20}
            });

            this.chart.addAxis("y", {
                title: "Azimuth/Elevation",
                vertical: true,
                includeZero:true,
                fixUpper: "major",
                max: this.maxYValue
            });

            this.chart.addAxis("x",{
                title: "Time",
                horizontal: true,
                titleOrientation:"away",
                labelFunc: function(n){
                    //On smaller intervals (example:2) dojo makes n < 1.0; Indicies must be a whole number. 
                    if(n % 1 === 0){
                        return sunAnglePlot.generateXAxisLabel(n);
                    }
                    else
                        return "";
                },
                maxLabelSize: 150
            });

            this.chart.addSeries("Elevation&nbsp;&nbsp;&nbsp;", this.elevationByTimeSeries, { stroke: "#FD9734" });
            this.chart.addSeries("Azimuth&nbsp;&nbsp;&nbsp;", this.azimuthByTimeSeries, { stroke: "#089DE3" });
        },

        initChartMouseover: function(){
            var sunAnglePlot = this;

            new MouseIndicator(this.chart, "default", {
                series: "Azimuth&nbsp;&nbsp;&nbsp;",
                mouseOver: true,
                labels: false,

                markerOutline: {color: "#5C5C5C"},
                markerFill: "#19dd00",
                markerStroke: {color: "#5C5C5C"},

                fillFunc: function(v){
                    return "#FFF";
                },
                labelFunc: lang.hitch(this, function(v){
                    return "";
                })
            });

            new MouseIndicator(this.chart, "default", {
                series: "Elevation&nbsp;&nbsp;&nbsp;",
                mouseOver: true,
                labels: true,

                markerOutline: {color: "#5C5C5C"},
                markerFill: "#19dd00",
                markerStroke: {color: "#5C5C5C", style: "solid"},

                fillFunc: function(v){
                    return "#FFFFFF";
                },
                labelFunc: lang.hitch(this, function(v){
                    this.currentMouseIndicatorValue = v;
                    var azimuth = "";
                    var elevation = "";
                    var time = "";

                    if(!this.isFloatingPaneClosed()){
                        elevation = sunAnglePlot.elevationByTimeSeries[v.x].y;
                        azimuth = sunAnglePlot.azimuthByTimeSeries[v.x].y;
                        time = sunAnglePlot.azimuthByTimeSeries[v.x].xValue;
                    }
                    return LabelFormatter.prototype.decimalFormat(azimuth, 2) + "°|" + LabelFormatter.prototype.decimalFormat(elevation) + "°|" + time;
                })
            });
        },

        createLegend: function(){
            var legend = new Legend({
                chart: this.chart
            }, this.sunAnglePlotLegendId);
        },

        isFloatingPaneClosed: function(){
            return this.floatingPane.get("isClosed");
        },

        resize: function () {
            var width = parseFloat(this.floatingPane.domNode.style.width) - 17,
                height = parseFloat(this.floatingPane.domNode.style.height) - 70;

            this.chart.render();
            this.chart.resize(width, height);
        },

        reduceSize: function() {
            var includeScroll = false;
            var thisNode = query("#" + this.floatingPane.id);

            if(thisNode.length > 0){
                thisNode = thisNode[0];
                var winH = window.innerHeight;
                var winW = window.innerWidth;

                var fPaneH = domGeom.position(thisNode, includeScroll).h;
                var fPaneW = domGeom.position(thisNode, includeScroll).w;
                var fPaneX = domGeom.position(thisNode, includeScroll).x;
                var fPaneXRightEdge =  fPaneX + fPaneW;

                //Move pane to the left unless screen is small enough to resize
                //46 is the width of the side nav bar
                if((winW - 46) < fPaneXRightEdge && !((winW - 46) < fPaneW)){
                    var xDifference = Math.abs(fPaneXRightEdge - winW);
                    var newLeftPosition =  (fPaneX - xDifference) - 46;
                    domStyle.set(thisNode, "left", newLeftPosition  + "px");
                }

                if((winW - 46) < fPaneW){
                    this.floatingPane.resize({w: (winW - 25)});

                    //Resize puts the x position back to where it was originally created
                    //set to left side
                    domStyle.set(thisNode, "left", "0px");
                }

                if((winH - 50) < fPaneH){
                    this.floatingPane.resize({h: (winH - 65)});
                }

                if(!this.isPlayingEffect){
                    this.resize();
                }
            }
        },

        showLinePositionGraphic: function(seriesIndex){
            topic.publish(ToolEvent.prototype.SHOW_LINE_POSITION_GRAPHIC, this.elevationByTimeSeries[seriesIndex].mapx , this.elevationByDistanceSeries[seriesIndex].mapy);
        },

        getIndexOfCurrentDistance: function(v){
            var index = 0;
            for (var i = 0; i < this.elevationByTimeSeries.length; i++){
                if (parseInt(this.elevationByTimeSeries[i].x, 10) == parseInt(v.x, 10)){
                    index = i;
                }
            }
            return index;
        },

        formatLabel: function(azimuth, elevation, time){
            var dateStr = time.substring(0, 8);
            var timeStr = time.substring(9, time.lastIndexOf("."));
            var string = "";
            string += '<span style="width:50%;display:inline-block;text-align:left;margin-left:10px;">';
            string += '<strong>Azimuth:</strong> ';
            string += azimuth;
            string += '&nbsp;&nbsp;&nbsp;<strong>Elevation:</strong> ';
            string += elevation;
            string += '</span><span style="width:50%;display:inline-block;text-align:right;padding-right:20px;">';
            string += '<strong>Time:</strong> ' + dateStr + ' ' + timeStr;
            string += '</span>';
            return string;
        },

        generateXAxisLabel: function(n){
            var splitLabelText = this.elevationByTimeSeries[n].xValue.split("T");
            var date = new Date(0, 0, 0,
                splitLabelText[1].substring(0, splitLabelText[1].indexOf(":") ),
                splitLabelText[1].substring( splitLabelText[1].indexOf(":") + 1,splitLabelText[1].lastIndexOf(":") ),
                splitLabelText[1].substring( splitLabelText[1].lastIndexOf(":") + 1,splitLabelText[1].lastIndexOf(".")) );
            return splitLabelText[0] + "<br/>" + locale.format( date, {selector:"date", datePattern: "HH:mm:ss"} );
        },

        getSeriesMinimum: function(series) {
            var minVal = "";

            for(var a=0; a < series.length; a++) {
                if(parseFloat(series[a].y) < parseFloat(minVal) || minVal === "") {
                    minVal = series[a].y;
                }
            }

            return minVal;
        },

        getSeriesMaximum: function(series) {
            var maxVal = "";

            for(var a=0; a < series.length; a++) {
                if(parseFloat(series[a].y) > parseFloat(maxVal) || maxVal === "") {
                    maxVal = series[a].y;
                }
            }

            return maxVal;
        },

        calculateMaxMinYValues: function(){
            this.minYValue = Math.min(this.getSeriesMinimum(this.elevationByTimeSeries), this.getSeriesMinimum(this.azimuthByTimeSeries));
            var maxYValue = Math.max(this.getSeriesMaximum(this.elevationByTimeSeries), this.getSeriesMaximum(this.azimuthByTimeSeries));

            //Increase the max y in order to keep the label from overlapping the values on the plot.
            var totalElevation = Math.abs(this.minYValue - maxYValue);
            var extraValue = totalElevation * 1/6;

            this.maxYValue = maxYValue + extraValue;
        },

        projectionChanged: function(evt) {
            if(evt.projection === this.projection) {
                this.show();
            } else {
                this.hide();
            }
        },

        show: function(){
            this.effectHandler("show");
        },

        hide: function(){
            this.effectHandler("hide");
        },

        showPlotCover: function(){
            domStyle.set(this.plotCover, "display", "");
        },

        hidePlotCover:function(){
            domStyle.set(this.plotCover, "display", "none");
        },

        effectHandler: function(evt){
            var self = this;

            //During projection changes the plot should not be redrawn until the fadein effect is finished.
            this.isPlayingEffect = true;

            if (evt === "show"){
                 if(!self.floatingPane.isClosed){
                    //Need to set display twice to make sure it shows the animation and stays showing after.
                    domStyle.set(self.floatingPane.id, "display", "");
                    baseFx.fadeIn({
                        node: self.floatingPane.id,
                        onEnd: function(node){
                            domStyle.set(self.floatingPane.id, "display", "");
                            self.isPlayingEffect = false;
                        }
                    }).play();
                }
            }
            else if (evt === "hide"){
                if(!self.floatingPane.isClosed){
                    baseFx.fadeOut({
                        node: self.floatingPane.id,
                        onEnd: function(node){
                            domStyle.set(self.floatingPane.id, "display", "none");
                        }
                    }).play();
                }
            }
        }
    });
});
