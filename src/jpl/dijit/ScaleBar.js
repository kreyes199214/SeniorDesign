/**
 * Scalebar that extends Scalebar and allows calculation of custom units rather than just km/m/mi
 *
 * @module jpl/dijit/ScaleBar
 **/

define([
    "dojo/_base/declare",
    "esri/dijit/Scalebar",
    "esri/geometry/Point",
    "jpl/data/ScaleBarUnits",
    "jpl/dijit/ui/ScaleBarDialog",
    "jpl/utils/LabelFormatter",
    "jpl/utils/MapUtil",
    "xstyle/css!./css/ScaleBar.css",
    "dojo/on",
    "dojo/_base/lang",
    "jpl/events/MapEvent",
    "jpl/config/Config",
    "dojo/topic"
], function(declare, Scalebar, Point, ScaleBarUnits, ScaleBarDialog, LabelFormatter, MapUtil, ScaleBarCSS, on,
            lang, MapEvent, Config, topic){
    return declare(Scalebar,{
        scaleBarUnits: null,
        scaleBarDialog: null,
        unitId: 0,
        scalebarAcb: null,

        startup: function(){
            this.inherited(arguments);

            this.config = Config.getInstance();

            on(this.metricScalebar, "click", lang.hitch(this, function(){
                this.showScaleBarDialog();
            }));

            topic.subscribe(MapEvent.prototype.CHANGE_SCALEBAR,  lang.hitch(this, this.changeScaleBarUnits));
        },

        //Scale bar overridden method which calculates and sets the bar and label on the scale;
        _drawScaleBar: function(a, c, b) {
            //Save a,c and b in case of a necessary forced redraw
            this.scalebarAcb = {a:a, c:c, b:b};

            //Let original _drawScaleBar method finish before any new changes.
            this.inherited(arguments);

            this.convertToCustomUnits(b);
        },

        convertToCustomUnits: function(b){
            this.getScaleBarUnits();
            var unit = this.scaleBarUnits.getUnitById(this.unitId);

            var convertedDistance = this.convertUnits(
                b,
                this.getEsriScaleDistance(b),
                unit
            );

            this.setNewTextLabel(convertedDistance, unit);
        },

        getScaleBarUnits: function(){
            if(this.scaleBarUnits === null){
                this.scaleBarUnits = ScaleBarUnits.getInstance();
            }
        },

        getEsriScaleDistance: function(units){
            var currentScaleString = this.metricScalebar.getElementsByClassName("esriScalebarLabel esriScalebarLineLabel esriScalebarSecondNumber")[0].innerHTML;
            if(units === "km"){
                return currentScaleString.substring(0, currentScaleString.indexOf("k"));
            }
            else if(units === "ft"){
                return currentScaleString.substring(0, currentScaleString.indexOf("f"));
            }
            else
                return currentScaleString.substring(0, currentScaleString.indexOf("m"));
        },

        getEsriScaleDistance: function(units){
            var currentScaleString = this.metricScalebar.getElementsByClassName("esriScalebarLabel esriScalebarLineLabel esriScalebarSecondNumber")[0].innerHTML;
            if(units === "km"){
                var value = currentScaleString.substring(0, currentScaleString.indexOf("k"));
                //value = value * 0.532;
                value = value * this.config.equatorialRadiusKm;
                return value;
            }
            else if(units === "ft"){
                var value = currentScaleString.substring(0, currentScaleString.indexOf("f"));
                //value = value * 0.532;
                value = value * this.config.equatorialRadiusKm;
                return value;
            }
            else{
                var value = currentScaleString.substring(0, currentScaleString.indexOf("m"));
                //value = value * 0.532;
                value = value * this.config.equatorialRadiusKm;
                return value;
            }
        },

        //Currently only converts if scalebar is started up as metric
        convertUnits: function(esriUnits, esriScaleDistance, scaleBarUnit){
            if(esriUnits === "km"){
                var calculatedValue = esriScaleDistance / (scaleBarUnit.lengthMeters / 1000);
                    return parseFloat(calculatedValue);
            } else if(esriUnits === "m"){
                var calculatedValue = esriScaleDistance / scaleBarUnit.lengthMeters;
                return parseFloat(calculatedValue);
            }
        },

        setNewTextLabel: function(distance, scaleBarUnit){
            var label = distance,
                formattedDistance = LabelFormatter.prototype.decimalFormat(distance);

            if(scaleBarUnit.name === "Kilometers"){
                if (formattedDistance < 1){
                    formattedDistance = LabelFormatter.prototype.kilometersToMeters(distance, 2);
                    label = "<span class='scaleBarDistanceLabelNoIcon'><span class='scaleBarDistanceTextNoIcon'>" + formattedDistance.toFixed(0) + "&nbsp;&nbsp;</span><span class='scaleBarDistanceIconNoIcon'>m</span></span>";
                }
                else if (formattedDistance < 100){
                    label = "<span class='scaleBarDistanceLabelNoIcon'><span class='scaleBarDistanceTextNoIcon'>" + formattedDistance.toFixed(0) + "&nbsp;&nbsp;</span><span class='scaleBarDistanceIconNoIcon'>km</span></span>";
                }
                else{
                    label = "<span class='scaleBarDistanceLabelNoIcon'><span class='scaleBarDistanceTextNoIcon'>" + this.roundTen(formattedDistance.toFixed(0)) + "&nbsp;&nbsp;</span><span class='scaleBarDistanceIconNoIcon'>km</span></span>";
                }
            }
            else if(scaleBarUnit.name === "Miles"){
                if (formattedDistance < 1){
                    formattedDistance = LabelFormatter.prototype.milesToFeet(distance, 2);
                    label = "<span class='scaleBarDistanceLabelNoIcon'><span class='scaleBarDistanceTextNoIcon'>" + formattedDistance.toFixed(0) + "&nbsp;&nbsp;</span><span class='scaleBarDistanceIconNoIcon'>ft</span></span>";
                }
                else if (formattedDistance < 100){
                    label = "<span class='scaleBarDistanceLabelNoIcon'><span class='scaleBarDistanceTextNoIcon'>" + formattedDistance.toFixed(0) + "&nbsp;&nbsp;</span><span class='scaleBarDistanceIconNoIcon'>mi</span></span>";
                }
                else {
                    label = "<span class='scaleBarDistanceLabelNoIcon'><span class='scaleBarDistanceTextNoIcon'>" + this.roundTen(formattedDistance.toFixed(0)) + "&nbsp;&nbsp;</span><span class='scaleBarDistanceIconNoIcon'>mi</span></span>";
                }
            }
            else{
                if(formattedDistance < 10){
                    label = "<span class='scaleBarDistanceLabel'><span class='scaleBarDistanceText'>" + formattedDistance.toFixed(2) + "&nbsp;x&nbsp;</span><span class='scaleBarDistanceIcon'><span class='" + scaleBarUnit.icon + "'></span></span></span>";
                }
                else if (formattedDistance < 100){
                    label = "<span class='scaleBarDistanceLabel'><span class='scaleBarDistanceText'>" + formattedDistance.toFixed(0) + "&nbsp;x&nbsp;</span><span class='scaleBarDistanceIcon'><span class='" + scaleBarUnit.icon + "'></span></span></span>";
                }
                else{
                    label = "<span class='scaleBarDistanceLabel'><span class='scaleBarDistanceText'>" + this.roundTen(formattedDistance.toFixed(0)) + "&nbsp;x&nbsp;</span><span class='scaleBarDistanceIcon'><span class='" + scaleBarUnit.icon + "'></span></span></span>";
                }
            }

            //set the label
            this.metricScalebar.getElementsByClassName("esriScalebarLabel esriScalebarLineLabel esriScalebarSecondNumber")[0].innerHTML = label;

        },

        showScaleBarDialog: function(){
            /*
            if(this.scaleBarDialog === null){
                this.scaleBarDialog = new ScaleBarDialog();
            }else{
                this.scaleBarDialog.show();
            }
            */
            this.scaleBarDialog = new ScaleBarDialog();
        },

        changeScaleBarUnits: function(event){
            this.unitId = event.unitId;

            //redraw the bar
            this._drawScaleBar(this.scalebarAcb.a, this.scalebarAcb.c, this.scalebarAcb.b);
        },

        roundTen: function(number){
            return Math.round(number/10)*10;
        }

    });
});