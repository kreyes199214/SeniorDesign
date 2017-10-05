define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/topic",
    "dojo/query",
    "dojo/html",
    "dojo/on",
    "dojox/gesture/tap",
    "dojo/aspect",
    "dojo/dom-style",
    "dojo/mouse",
    "jpl/events/ToolEvent",
    "jpl/events/MapEvent",
    "jpl/config/Config",
    "dojo/_base/fx",
    "dojo/dom-geometry",
    "jpl/utils/LabelFormatter",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dojo/text!./templates/ElevationPlot.html",
    "dojox/charting/Chart",
    "jpl/dijit/MouseIndicator",
    "dojox/charting/plot2d/Lines",
    "dojox/charting/action2d/Tooltip",
    "dojox/charting/action2d/Magnify",
    "dojox/charting/themes/Tufte",
    "dojox/charting/plot2d/Markers",
    "dojox/charting/axis2d/Default",
    "dojox/charting/plot2d/Areas",
"xstyle/css!./css/Tool.css"
], function (declare, lang, topic, query, html, on, tap, aspect, domStyle, mouse, ToolEvent, MapEvent,
            Config, baseFx, domGeom, LabelFormatter, _WidgetBase, _TemplatedMixin, template,
            Chart, MouseIndicator, LinesPlot, Tooltip, Magnify, theme ) {
    return declare([_WidgetBase, _TemplatedMixin], {
        templateString: template,
        widgetsInTemplate: true,
        elevationByDistanceSeries: [],
        elevationPlotId: "",
        floatingPane: null,
        chart: "",
        graphic: null,
        minElevationValue: "",
        maxElevationValue: "",
        isMoved: false,
        isPlayingEffect: false,
        plotCoverId: "",
        plotCover: "",
        eid: "",

        constructor: function (series, elevationPlotId, floatingPane, projection, graphic) {
            this.elevationByDistanceSeries = series;
            this.elevationPlotId = elevationPlotId;
            this.floatingPane = floatingPane;
            this.projection = projection;
            this.graphic = graphic;
            this.plotCoverId = elevationPlotId + "plotCoverId";
            this.eid = "export" + elevationPlotId;
        },

        postCreate: function () {
            var elevationPlot = this;
            this.floatingPane.set("content", "<div id='" + this.plotCoverId + "' style='height:100%;width:100%;display:none;color:transparent;position:absolute;z-index:99999;'></div>" +
                "<div id = '" + this.elevationPlotId + "'></div>" + 
                "<div>&nbsp;&nbsp;&nbsp;<input id='" + this.eid + "' data-dojo-attach-point='" + this.eid + "' type='button' class='btn btn-primary' value='Export profile to csv' style='cursor:pointer;'></div>");
            this.chartNode = query("#" + this.elevationPlotId)[0];
            this.plotCover = query("#" + this.plotCoverId)[0]

            this.calculateMaxMinElevationValues();

            this.createChart();

            this.initChartMouseover();

            this.chart.render();
        },

        startup: function() {
            this.config = Config.getInstance();

            topic.subscribe(MapEvent.prototype.PROJECTION_CHANGED, lang.hitch(this, this.projectionChanged));
            topic.subscribe(MapEvent.prototype.PREVENT_ELEVATION_PLOT_SCROLL, lang.hitch(this, this.preventElevationPlotScroll));
            topic.subscribe(MapEvent.prototype.MAP_VIEW, lang.hitch(this, this.show));
            topic.subscribe(MapEvent.prototype.TERRAIN_VIEW, lang.hitch(this, this.hide));

            //Resize the chart when the floating window is resized
            on(this.floatingPane._resizeHandle, "resize",lang.hitch(this, this.resize));

            //Resize the floating pane if the window is smaller than the floating pane itself.
            on(window, "resize", lang.hitch(this, this.reduceSize));

            //Hide the line position graphic when the mouse leaves the plot.
            on(this.chartNode, mouse.leave, this.onChartMouseOut);
            //Hide the line position graphic when the floating pane is closed.
            aspect.after(this.floatingPane, "close", this.onChartMouseOut);

            on(this.floatingPane.focusNode, "mousedown", lang.hitch(this, this.showPlotCover));
            on(document, "mouseup", lang.hitch(this, this.hidePlotCover));

            var o = dojo.byId(this.eid);
            on(o, "click", lang.hitch(this, this.doExport));
        },

        createChart: function() {
            this.chart = new Chart(this.chartNode);
            this.chart.setTheme(theme);
            this.chart.addPlot("default",{
                type: LinesPlot,
                tension: "S",
                shadows: {dx: 20, dy: 20},
                markers: false,
                areas: true,
                fill: "#CDA26E"
            });

            this.chart.addAxis("y", {
                title: "Elevation (Meters)",
                vertical: true,
                max: this.maxElevationValue
            });

            this.chart.addAxis("x",{
                title: "Distance (Meters)",
                horizontal: true,
                titleOrientation:"away"
            });

            this.chart.addSeries("elev by dist", this.elevationByDistanceSeries);
        },

        onChartMouseOut: function(evt) {
            topic.publish(ToolEvent.prototype.MOUSE_MOVED_OFF_ELEVATION_PLOT);
        },

        initChartMouseover: function() {
            var self = this;

            var mouseIndicator = new MouseIndicator(this.chart, "default", {
                series: "elev by dist",
                mouseOver:true,
                labels:true,
                markerFill: "#CDA26E",
                fillFunc: function(v){
                    return "#FFF";
                },
                labelFunc: lang.hitch(this, function(v){
                    this.currentMouseIndicatorValue = v;

                    if(!this.isFloatingPaneClosed()){
                        if(this.isMoved === false){
                            this.showLinePositionGraphic(this.getIndexOfCurrentDistance(v));
                        }
                    }
                    return LabelFormatter.prototype.distanceLabelFromValue(v.x) + "|" + LabelFormatter.prototype.distanceLabelFromValue(Number(v.y) - self.minElevationValue);
                })
            });
        },

        isFloatingPaneClosed: function(){
            return this.floatingPane.get("isClosed");
        },

        resize: function () {
            var width = parseFloat(this.floatingPane.domNode.style.width) - 17,
                height = parseFloat(this.floatingPane.domNode.style.height) - 73;

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
                var fPaneX = domGeom.position(thisNode, includeScroll).x
                var fPaneXRightEdge =  fPaneX + fPaneW;

                //Move pane to the left unless screen is small enough to resize
                if((winW - 46) < fPaneXRightEdge && !((winW - 46) < fPaneW)){
                    var xDifference = Math.abs(fPaneXRightEdge - winW);
                    var newLeftPosition =  (fPaneX - xDifference) - 46;
                    domStyle.set(thisNode, "left", newLeftPosition  + "px");
                }

                //If the pane is smaller than the window resize it.
                //46 is the width of the side nav bar
                if((winW - 46) < fPaneW){
                    this.floatingPane.resize({w: (winW - 25)});

                    //Resize puts the position back to where it was originally created ex:1080
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
            topic.publish(ToolEvent.prototype.SHOW_LINE_POSITION_GRAPHIC, this.elevationByDistanceSeries[seriesIndex].mapx , this.elevationByDistanceSeries[seriesIndex].mapy);
        },

        preventElevationPlotScroll: function(evt) {
            if(evt.graphic === this.graphic){
                this.isMoved = true;
            }
        },

        getIndexOfCurrentDistance: function(v){
            var index = 0;
            for (var i = 0; i < this.elevationByDistanceSeries.length; i++){
                if (parseInt(this.elevationByDistanceSeries[i].x, 10) == parseInt(v.x, 10)){
                    index = i;
                }
            }
            return index;
        },

        projectionChanged: function(evt) {
            if(evt.projection === this.projection) {
                this.show();
            } else {
                this.hide();
            }
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

        calculateMaxMinElevationValues: function(){
            this.minElevationValue = this.getSeriesMinimum(this.elevationByDistanceSeries);
            var maxElevationValue = this.getSeriesMaximum(this.elevationByDistanceSeries);

            //Increase the y maxElevation in order to keep the label from overlapping the values on the plot.
            var totalElevation = Math.abs(this.minElevationValue - maxElevationValue);
            var extraValue = totalElevation * 1/7;

            this.maxElevationValue = maxElevationValue + extraValue;
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

        doExport: function()
        {
          //console.log('doExport');
            var self = this;
//console.log('ElevationPlot::doExport() - self.elevationByDistanceSeries = ' + self.elevationByDistanceSeries);
//console.log(self.elevationByDistanceSeries)
            var data = 'Distance,Elevation,Longitude,Latitude\n';

            if (this.projection !== this.config.projection.EQUIRECT)
                data = 'Distance,Elevation,X,Y\n';

          for (var i=0; i<self.elevationByDistanceSeries.length; i++)
          {
            var val = self.elevationByDistanceSeries[i];
            data += val.x + ',' + val.y + ',' + val.mapx + ',' + val.mapy + '\n'; 
          }
//console.log('ElevationPlot::doExport() - data = ' + data);
          this.doSave(data, 'ElevationProfile.csv', 'csv');
        },

        doSave: function(data, filename, type)
        {
          var a = document.createElement("a"),
              file = new Blob([data], {type: type});
          if (window.navigator.msSaveOrOpenBlob) // IE10+
              window.navigator.msSaveOrOpenBlob(file, filename);
          else { // Others
              var url = URL.createObjectURL(file);
              a.href = url;
              a.download = filename;
              document.body.appendChild(a);
              a.click();
              setTimeout(function() {
                  document.body.removeChild(a);
                  window.URL.revokeObjectURL(url);
              }, 0);
          }
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
