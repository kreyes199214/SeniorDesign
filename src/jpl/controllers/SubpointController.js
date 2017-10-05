

define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/topic",
    "dojo/request/xhr",
    "dijit/registry",
    "jpl/events/BrowserEvent",
    "jpl/data/BaseMaps",
    "jpl/config/Config",
    "jpl/utils/DOMUtil",
    "jpl/utils/MapUtil",
    "esri/graphic",
    "esri/geometry/Point",
    "esri/symbols/PictureMarkerSymbol"
], function (declare, lang, topic, xhr, registry, BrowserEvent, BaseMaps, Config, DOMUtil, MapUtil, Graphic, Point, PictureMarkerSymbol) {
    return declare(null, {
        //interval in seconds
        timeInterval: 3,
        //timeline length to request in minutes
        timeLength: 15,
        //default to sun
        type: "",
        results: [],
        resultsUpdate: [],
        lastDate: "",
        graphic: "",
        interval: "",
        callInterval: "",
        intervalCount: 0,
        endpoint: "",
        infoWindowVisible: false,
        isDownloading: false,
        isCurrentlyActive: false,

        constructor: function (type, map) {
            this.config = Config.getInstance();
            this.map = map;

            var markerSymbolURL;
            
            if(type){
                var subpoint = this.getSubpoint(type.toUpperCase());
                if(subpoint){
                    this.endpoint = subpoint.endpoint;
                    this.type = subpoint.type;
                    markerSymbolURL = subpoint.markerSymbolUrl;
                }
            }

            this.markerSymbol = MapUtil.prototype.createPictureMarker(markerSymbolURL);

            this.map.infoWindow.on("hide", lang.hitch(this, this.onInfoWindowHide));
            this.map.graphics.on("mouse-over", lang.hitch(this, this.onGraphicMouseOver));
            this.map.graphics.on("mouse-out", lang.hitch(this, this.onGraphicMouseOut));
            this.map.graphics.on("click", lang.hitch(this, this.onGraphicClick));
        },

        getSubpoint: function(type){
            for(var i = 0; i < this.config.services.subpoints.length; i++){
                if(this.config.services.subpoints[i].type === type){
                    return this.config.services.subpoints[i];
                }
            }
            console.log(name + " subpoint not found in config");
            return null;
        },

        getTimeObj: function(refDate) {
            var dt, dtLabel;

            if(refDate && refDate.time instanceof Date) {
                dt = new Date();
                dt.setTime(refDate.time.getTime() + (this.timeLength*60*1000));
            } else {
                dt = new Date();
            }

            dtLabel = dt.getFullYear() + "-" + (dt.getMonth() + 1) + "-" + dt.getDate() +
                "T" + dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds() +
                "." + dt.getMilliseconds();

            return {
                time: dt,
                label: dtLabel
            }
        },

        startSubpointService: function() {
            this.resetResults();

            var startTime = this.getTimeObj();
            var endTime = this.getTimeObj(startTime);
            this.lastDate = endTime;

            var searchURL = this.endpoint +
                startTime.label + "/" +
                endTime.label + "/" +
                this.timeInterval;


            this.isDownloading = true;
            xhr(searchURL, {
                handleAs: "xml",
                headers: {
                    "X-Requested-With": null
                }
            }).then(lang.hitch(this, this.parseResults));

        },

        updateResults: function(){
            this.resultsUpdate = [];

            var startTime = this.lastDate;
            startTime.time.setTime(startTime.time.getTime() + (this.timeInterval*1000));
            startTime.label = startTime.time.getFullYear() + "-" + (startTime.time.getMonth() + 1) + "-" + startTime.time.getDate() +
                "T" + startTime.time.getHours() + ":" + startTime.time.getMinutes() + ":" + startTime.time.getSeconds() +
                "." + startTime.time.getMilliseconds();

            var endTime = this.getTimeObj(startTime);

            var searchURL = this.endpoint +
                startTime.label + "/" +
                endTime.label + "/" +
                this.timeInterval;

            this.lastDate = endTime;

            xhr(searchURL, {
                handleAs: "xml",
                headers: {
                    "X-Requested-With": null
                }
            }).then(lang.hitch(this, this.parseUpdates));
        },

        parseResults: function(data) {
            this.isDownloading = false;
            var filteredData = DOMUtil.prototype.removeEmptyTextNodes(data);

            for(var i=0; i < filteredData.childNodes[0].childNodes[0].childNodes[1].childNodes.length; i++){
                var layerNode = filteredData.childNodes[0].childNodes[0].childNodes[1].childNodes[i];

                this.results.push({
                    time: layerNode.childNodes[0].textContent,
                    lat: layerNode.childNodes[1].textContent,
                    lon: layerNode.childNodes[2].textContent,
                    alt: layerNode.childNodes[3].textContent,
                    subpttime: layerNode.childNodes[4].textContent,
                    subptrange: layerNode.childNodes[5].textContent
                });
            }

            this.infoWindowVisible = true;
            this.subpointInterval();
            MapUtil.prototype.centerAndZoomMapAt(this.map, this.results[0].lon, this.results[0].lat, 2);

            this.interval = setInterval(lang.hitch(this, this.subpointInterval), this.timeInterval * 1000);
        },

        parseUpdates: function(data){
            var filteredData = DOMUtil.prototype.removeEmptyTextNodes(data);

            for(var i=0; i < filteredData.childNodes[0].childNodes[0].childNodes[1].childNodes.length; i++){
                var layerNode = filteredData.childNodes[0].childNodes[0].childNodes[1].childNodes[i];

                this.resultsUpdate.push({
                    time: layerNode.childNodes[0].textContent,
                    lat: layerNode.childNodes[1].textContent,
                    lon: layerNode.childNodes[2].textContent,
                    alt: layerNode.childNodes[3].textContent,
                    subpttime: layerNode.childNodes[4].textContent,
                    subptrange: layerNode.childNodes[5].textContent
                });
            }

            for (var i = 0; i < this.resultsUpdate.length; i++){
                this.results.push(this.resultsUpdate[i]);
            }
        },

        subpointInterval: function() {
            if(this.graphic) {
                this.map.graphics.remove(this.graphic);
            }

            var point = new Point(
                this.results[this.intervalCount].lon,
                this.results[this.intervalCount].lat,
                this.map.spatialReference);

            this.graphic = this.map.graphics.add(new Graphic(point, this.markerSymbol));

            if(this.infoWindowVisible) {
                //simulate click to move the info window
                this.updateInfoWindow({graphic: this.graphic});
            }

            this.intervalCount++;

            if(this.intervalCount === (this.results.length - 1)) {
                this.stopSubpointDisplay();
            }

            if(this.intervalCount === (this.results.length - 10)){
                this.updateResults();
            }


        },

        onGraphicMouseOver: function(evt) {
            if(evt.graphic === this.graphic) {
                this.map.setMapCursor("pointer");
            }
        },

        onGraphicMouseOut: function(evt) {
            if(evt.graphic === this.graphic) {
                this.map.setMapCursor("default");
            }
        },

        onGraphicClick: function(evt){
            if(evt.graphic === this.graphic){
                this.notifyToolsGallery(this.type);
            }
            this.updateInfoWindow({graphic: this.graphic});
        },

        notifyToolsGallery: function(type){
            //Detected by aspect
        },

        updateInfoWindow: function(evt) {
            if(evt.graphic === this.graphic && this.isCurrentlyActive) {
                var formattedTime = this.results[this.intervalCount].time;

                var year = formattedTime.substr(0,4);
                var day = formattedTime.substr(5,3);
                var time = formattedTime.substring(9,formattedTime.lastIndexOf(":"));
                var dt = new Date(year, 0)
                dt.setDate(day);

                this.map.infoWindow.setTitle("Current " + this.type + " Overhead Position");
                this.map.infoWindow.setContent(
                    '<table width="100%" class="nomenclature-info">' +
                    '<tr><th>Time:</th><td>' + dt.toLocaleDateString() +  ' ' + time + ' UTC</td></tr>' +
                    '<tr><th>Latitude:</th><td>' + Number(this.results[this.intervalCount].lat).toFixed(2) + '&deg;</td></tr>' +
                    '<tr><th>Longitude:</th><td>' + Number(this.results[this.intervalCount].lon).toFixed(2) + '&deg;</td></tr>' +
                    //'<tr><th>Altitude:</th><td>' + Number(this.results[this.intervalCount].alt).toFixed(2) + '</td></tr>' +
                    '</table>'
                );

                this.map.infoWindow.show(
                    evt.graphic.geometry,
                    evt.graphic.geometry
                );

                this.infoWindowVisible = true;
            }
        },

        onInfoWindowHide: function(evt) {
            this.infoWindowVisible = false;
        },

        setIsCurrentlyActive: function(isCurrentlyActive){
            this.isCurrentlyActive = isCurrentlyActive;
        },

        stopSubpointDisplay: function() {
            if(this.graphic) {
                this.map.graphics.remove(this.graphic);
            }

            if(this.infoWindowVisible) {
                this.map.infoWindow.hide();
            }

            clearInterval(this.interval);
        },

        stopCallInterval: function(){
            clearInterval(this.callInterval);
        },

        resetResults: function() {
            this.results = [];
            this.resultsUpdate = [];
            this.intervalCount = 0;
            this.stopSubpointDisplay();
        }

    });
});

