define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    'dojo/text!./templates/ColorLegendControl.html',
    "xstyle/css!./css/ColorLegendControl.css",
    "dojo/dnd/move",
    "dojo/dnd/Moveable",
    "dojox/gfx",
    "dojo/dom-construct",
    "dojo/request/xhr",
    "dojo/_base/Color",
    "dojo/mouse",
    "dojo/on",
    "dojo/query",
    "dojo/dom",
    "dojo/dom-geometry",
    "dojo/dom-style",
    "dojo/window",
    "dojox/form/RangeSlider",
    "dojo/topic",
    "dojo/dom-class",
    "dojo/touch"
], function (declare, lang, _WidgetBase,_TemplatedMixin, template, css, move, Moveable, gfx, domConstruct, xhr, colorUtil, mouse, on, query, dom, geometry, style, win, RangeSlider, topic, domClass, touch) {
    return declare([_WidgetBase, _TemplatedMixin], {
        templateString: template,
        widgetsInTemplate: true,
        colorData: {},
        oldColorData: {},
        colorStops: [],

        constructor: function (colorDataURL) {
            lang.hitch(this, this.getColorData(colorDataURL, this.colorData));
        },

        postCreate: function () {
            //you can put stuff here to do any additional setup or massaging
            //before the widget actually starts
        },

        startup: function () {
            //call this after you have instantiated an instance of the widget
            //to boot it up
            var me = this;
            on(this.colorLegendCanvas, "mousemove", lang.hitch(this, function (event) {
                this.updateColorSwatch(event, "aboveCanvas");
            }));

            on(this.colorLegendCanvas, mouse.leave, lang.hitch(this, function() {
                domConstruct.destroy("color-legend-swatch-box");
                //if (this.mapLayer != null && typeof this.mapLayer.resetColors == 'function') {
                //    this.mapLayer.resetColors();
                //}
            }));

            on(this.colorLegendInterval, "mousemove", lang.hitch(this, function (event) {
                //console.log(event);
                this.updateIntervalColorSwatch(event, "aboveCanvas");
            }));

            on(this.colorLegendInterval, mouse.leave, lang.hitch(this, function() {
                domConstruct.destroy("color-legend-swatch-box");
            }));

            //on(this.colorLegendInterval, touch.release, lang.hitch(this, this.updateMap));

            /*on(this.colorLegendInterval, "dblclick", lang.hitch(this, function(event) {
                if(this.rangeSlider.value[0] == this.rangeSlider.minimum && this.rangeSlider.value[1] == this.rangeSlider.maximum) {
                    this.setColorData(this.colorData, this.mapLayer.layerConfig.picasso.min, this.mapLayer.layerConfig.picasso.max);
                    this.mapLayer.highlightRange(this.mapLayer.layerConfig.picasso.min, this.mapLayer.layerConfig.picasso.max, true, null, true);
                } else {
                    //http://stackoverflow.com/questions/12081547/applying-easing-to-settimeout-delays-within-a-loop
                    var easeInOutQuad = function(t, b, c, d) {
                        if ((t/=d/2) < 1) return c/2*t*t + b;
                        return -c/2 * ((--t)*(t-2) - 1) + b;
                    };
                    var self = this;

                    var easeOutQuad = function(t, b, c, d) {return -c * (t/=d)*(t-2) + b;};
                    var easeInQuad = function(t, b, c, d) {return c*(t/=d)*t + b;};

                    var time = 0;
                    var diff = 30;

                    var minTime = 0;
                    var maxTime = 1000;

                    var rangeIndices = this.getRangeIndices();
                    var rangeValues = self.getRangeValues();

                    for( var i = 0, len = diff; i <= len; i++ ) {
                        (function (s) {
                            setTimeout(function () {
                                self.isAnimating = true;
                                var newmin = Math.round(rangeIndices[0] - s * rangeIndices[0] / diff);
                                var newmax = Math.round(rangeIndices[1] + s*(((self.colorData.scale.values.length-1) - rangeIndices[1]) / diff));
                                self.drawMainColorLegend(newmin, newmax, true, true);
                                if(s == diff) {
                                    self.isAnimating = false;
                                    self.setColorData(self.colorData, rangeValues[0], rangeValues[1]);
                                    self.mapLayer.highlightRange(rangeValues[0], rangeValues[1], true, null, true);
                                }
                            }, time);
                        })(i);

                        time = easeOutQuad(i, minTime, maxTime, diff);
                    }
                }
            }));*/
        },
        setColorData: function(data, min, max) {
            this.colorData = lang.clone(data);
            this.drawColorLegend(this.colorLegendCanvas, 256, 25);
            this.setLegendRange();

            //this.setColorSlider();
            this.colorLegendSliderBox.style.display = 'none';
        },
        getColorData: function (colorDataURL, colorData) {
            xhr(colorDataURL, {
                handleAs: "json",
                headers: {
                    "X-Requested-With": null
                }
            }).then(lang.hitch(this, function (data) {
                this.oldColorData = lang.clone(data);
                this.setColorData(data);
                this.mapLayer.color2label = []; // TODO SO SO SO BAD
                this.mapLayer.color2index = [];
                this.mapLayer.index2color = [];
                for(var i = 0; i < data.scale.colors.length; i++) {
                    var val = parseInt(this.colorData.scale.colors[i], 16);
                    var newval = (val & 0x000000FF) << 24 | (val & 0x0000FF00) << 8 | (val & 0x00FF0000) >>> 8 | (val & 0xFF000000) >>> 24; // making it little endian so that it's faster on the highlighting side
                    this.mapLayer.color2label[''+newval] = data.scale.labels[i];
                    this.mapLayer.color2index[''+newval] = i;
                    this.mapLayer.index2color[i] = ''+newval;
                }
            }));
        },
        getRangeValues: function() {
            var lowindex = Math.round(this.rangeSlider.value[0]);
            var highindex = Math.round(this.rangeSlider.value[1]);
            return [parseFloat(this.colorData.scale.values[lowindex][0]), parseFloat(this.colorData.scale.values[Math.min(highindex, this.colorData.scale.values.length-1)][1])];
        },
        getRangeIndices: function() {
            return [Math.round(this.rangeSlider.value[0]), Math.round(this.rangeSlider.value[1])];
        },
        updateValuesAndLabels: function(data, min, max) {
            var newlabels =[];
            var newvalues = [];
            for(var i = 0; i < data.scale.colors.length; i++) {
                var low = ((max - min)*((i)/data.scale.colors.length) + min).toPrecision(5  );
                var high = ((max - min)*((i+1)/data.scale.colors.length) + min).toPrecision(5);
                newvalues.push([low, high]);
                newlabels.push(low + " \u2013 " + high + " ");
            }
            data.scale.values = newvalues;
            data.scale.labels = newlabels;
        },
        drawMainColorLegend: function(lowindex, highindex, clip, compress) {
            this.drawColorLegend(this.colorLegendCanvas, 256, 25, lowindex, highindex, clip, compress);
            this.rangeSlider.set("value", [lowindex, highindex]);
        },
        drawColorLegend: function (div, width, height, lowindex, highindex, clip, compress) {
            lowindex = typeof lowindex !== 'undefined' ? lowindex : 0;
            highindex = typeof highindex !== 'undefined' ? highindex : this.colorData.scale !== 'undefined' ? this.colorData.scale.colors.length-1 : this.colorData.classes.colors.length-1;
            clip = typeof clip !== 'undefined' ? clip : false;
            compress = typeof compress !== 'undefined' ? compress : false;

            div.innerHTML = "";
            var canvas = gfx.createSurface(div, width, height);

            var step = width / (clip ? this.colorData.scale.colors.length : (highindex - lowindex + 1));

            for (var i = lowindex; i <= highindex; i++) {
                if (this.colorData.scale.colors.length > 10) {
                canvas.createRect({x: step * (i - (clip ? 0 : lowindex)), y: 0, width: step, height: 25 })
                    .setFill("#" + this.colorData.scale.colors[compress ? Math.round((i - lowindex)*(this.colorData.scale.colors.length-1)/(highindex - lowindex)) : i].substr(0, 6));
                } else {
                    canvas.createRect({x: step * (i - (clip ? 0 : lowindex)), y: 0, width: step, height: 25 })
                    .setFill("#" + this.colorData.scale.colors[compress ? Math.round((i - lowindex)*(this.colorData.scale.colors.length-1)/(highindex - lowindex)) : i].substr(0, 6))
                    .setStroke({style: "solid", width: 1, color: "gray"});
                }
            };

        },

        hexToRgb: function (hexColor) {
            var newColor = colorUtil.fromString("#" + hexColor);
            return newColor.toRgb();
        },

        setLegendRange: function () {
            var lowLabel = lang.hitch(this, function() {
                if (this.colorData.scale.labels[0].search("\u2013") === -1) {
                    return this.colorData.scale.labels[0];
                } else {
                    return this.colorData.scale.labels[0].split(" \u2013 ")[0];
                }
            });

            var highLabel = lang.hitch(this, function () {
                if (this.colorData.scale.labels[this.colorData.scale.labels.length - 1].search("\u2013") === -1) {
                    return this.colorData.scale.labels[this.colorData.scale.labels.length - 1].replace("=", "");
                } else {
                    return this.colorData.scale.labels[this.colorData.scale.labels.length - 1].split(" \u2013 ")[1];
                }
            });
            this.colorLegendRangeLow.innerHTML = lowLabel();
            this.colorLegendRangeHigh.innerHTML = highLabel();
            //var rangeDiv = domConstruct.create("div", {class: "color-legend-range"}, this.colorLegendBox, "first");
            //var lowRange = domConstruct.create("span", {style: {float: "left"}, innerHTML: lowLabel()}, rangeDiv);
            //var highRange = domConstruct.create("span", {style: {float: "right"}, innerHTML: highLabel()}, rangeDiv);
        },
        generateColorTable: function(lowindex, highindex) {
            var colortable = [];
            for(var i = lowindex; i <= highindex; i++) {
                var val = parseInt(this.colorData.scale.colors[i], 16);
                var newval = (val & 0x000000FF) << 24 | (val & 0x0000FF00) << 8 | (val & 0x00FF0000) >>> 8 | (val & 0xFF000000) >>> 24; // making it little endian so that it's faster on the highlighting side
                //if ((newval & 0x8000000) > 0) {
                //    newval = newval - 0x10000000;
                //}
                colortable[''+newval] = true;
                //console.log(newval);
            }
            return colortable;
        },

        updateMap: function() {
            if (this.mapLayer != null && typeof this.mapLayer.highlightColorTable == 'function') {
                var lowindex = this.rangeSlider.value[0];
                var highindex = Math.max(0, Math.min(this.rangeSlider.value[1]-1, this.colorData.scale.labels.length-1));
                this.mapLayer.highlightColorTable(this.generateColorTable(lowindex, highindex));
                //this.mapLayer.highlightRange(rangeValues[0], rangeValues[1], true, null);
                //this.drawColorLegend(this.colorLegendCanvas, 256, 25, lowindex, highindex, true, false);

                //this.colorLegendCanvas.style["clip-path"] = "inset(0px " + 255*(rangeIndices[0]/255) + "px 0px " + 255*((255-rangeIndices[1])/255) + "px)";
                //console.log(this.colorLegendCanvas);
                //this.colorLegendCanvas.style.borderLeft = 255*(rangeIndices[0]/255) + "px solid white";
                //this.colorLegendCanvas.style.borderRight = 255*((255-rangeIndices[1])/255) + "px solid white";
            }
        },

        setLegendSlider: function() {
            this.rangeSlider = new dojox.form.HorizontalRangeSlider({
                name: "rangeSlider",
                value: [0,this.colorData.scale.labels.length],
                minimum: 0,
                maximum: this.colorData.scale.labels.length,
                discreteValues: this.colorData.scale.labels.length+1,
                showButtons: false,
                intermediateChanges: true,
                onChange: lang.hitch(this, function(value){
                    var lowindex = this.rangeSlider.value[0];
                    var highindex = Math.max(0, Math.min(this.rangeSlider.value[1]-1, this.colorData.scale.labels.length-1));
                    //this.mapLayer.highlightColorTable(this.generateColorTable(lowindex, highindex));
                    ////this.mapLayer.highlightRange(rangeValues[0], rangeValues[1], true, null);
                    this.drawColorLegend(this.colorLegendCanvas, 256, 25, lowindex, highindex, true, false);

                    if(this.rangeSlider.previousLowIndex == lowindex && this.rangeSlider.previousHighIndex == highindex) {
                        this.updateMap();
                    }
                    this.rangeSlider.previousLowIndex = lowindex;
                    this.rangeSlider.previousHighIndex = highindex;

                    //
                    ////this.colorLegendCanvas.style["clip-path"] = "inset(0px " + 255*(rangeIndices[0]/255) + "px 0px " + 255*((255-rangeIndices[1])/255) + "px)";
                    ////console.log(this.colorLegendCanvas);
                    ////this.colorLegendCanvas.style.borderLeft = 255*(rangeIndices[0]/255) + "px solid white";
                    ////this.colorLegendCanvas.style.borderRight = 255*((255-rangeIndices[1])/255) + "px solid white";
                })
            }, this.colorLegendIntervalSlider);
            this.rangeSlider.previousLowIndex = -1; // on release, it fires the same onchange twice, or so it seems
            this.rangeSlider.previousHighIndex = -1;
        },
        updateIntervalColorSwatch: function(event, position) {
            //console.log(this.rangeSlider);
            var lowindex = this.rangeSlider.value[0];
            var highindex = Math.max(0, Math.min(this.rangeSlider.value[1]-1, this.colorData.scale.labels.length-1));
            if(this.colorData.scale.values) {
                // if it has values, use those. Note that on some color bars, GIBS makes it so the last value is
                // basically from the last value to infinity (see l3 active soil moisture, which goes from 0.6 to
                // 100000000. Need a hack/fix for that.
                var low = this.colorData.scale.values[lowindex][0];
                var high = this.colorData.scale.values[highindex][1];
                if(((this.colorData.scale.values[highindex][1] - this.colorData.scale.values[highindex][0])/this.colorData.scale.values[highindex][0]) > 100.0) {
                    // this is the hack fix
                    high = this.colorData.scale.values[highindex][0];
                }
                var label = (low + " \u2013 " + high);
            } else {
                var low = this.colorData.scale.labels[lowindex];
                var high = this.colorData.scale.labels[highindex];
                var label = (low + " \u2013 " + high);
                if(low === high) {
                    label = low;
                }
            }

            var swatchBox = dom.byId("color-legend-swatch-box");
            var swatchLabel = query(".color-legend-swatch-label")[0];
            var containerPosition = geometry.position(this.colorLegendBox);
            var containerX = event.pageX - containerPosition.x;
            var windowBox = win.getBox();
            var x = event.pageX;
            if (position === "aboveCanvas") {
                var y = event.pageY - 55;
            } else if (position === "belowCanvas") {
                var y = event.pageY + 15;
            };
            var percent = containerX / containerPosition.w;
            var bins = this.colorData.scale.colors.length;
            var index = Math.floor(bins * percent);
            if (index >= bins) {
                index = bins - 1;
            }
            //var color = "#" + this.colorData.scale.colors[index].substr(0,6);
            //var label = this.colorData.scale.labels[index];
            //console.log(swatchBox);
            if (swatchBox) {
                var swatchBoxPosition = geometry.position(swatchBox);
                var swatch = query(".color-legend-swatch")[0];
                swatchLabel.innerHTML = label;
                this.drawColorLegend(swatch,23, 23, lowindex, highindex);
                //style.set(swatch, "background-color", color);
                if (windowBox.w - x < swatchBoxPosition.w/2 + 10) {
                    x = x - (5 + swatchBoxPosition.w/2 - (windowBox.w - x));
                }
                style.set(swatchBox, {left: x - swatchBoxPosition.w/2 + "px", top: y + "px"});
            } else {
                var swatchBox = domConstruct.create("div", {"class": "color-legend-swatch-box",
                    id: "color-legend-swatch-box",
                    style: {
                        left: 0,
                        top: 0
                    }
                }, dom.byId("appDiv"));

                var swatch = domConstruct.create("div", {"class": "color-legend-swatch",
                    innerHTML: "&nbsp;",
                    style: {
                        margin: 0,
                        padding: 0,
                        width: "25px",
                        height: "25px"
                    }
                }, swatchBox);
                this.drawColorLegend(swatch,23, 23, lowindex, highindex);
                var swatchLabel = domConstruct.create("span", {"class": "color-legend-swatch-label",
                    innerHTML: label
                }, swatchBox);


                var swatchBoxPosition = geometry.position(swatchBox);
                if (windowBox.w - x < swatchBoxPosition.w/2) {
                    x = x - (5 + swatchBoxPosition.w/2 - (windowBox.w - x));
                }
                style.set(swatchBox, {left: x - swatchBoxPosition.w/2 + "px", top: y + "px"});
            }
            //if (this.mapLayer != null && typeof this.mapLayer.highlightRange == 'function') {
            //    this.mapLayer.highlightRange(this.colorData.scale.values[index][0], this.colorData.scale.values[Math.min(index, this.colorData.scale.values.length-1)][1], true, null);
            //}
        },


        updateColorSwatch: function (event, position) {
            var swatchBox = dom.byId("color-legend-swatch-box");
            var swatchLabel = query(".color-legend-swatch-label")[0];
            var containerPosition = geometry.position(this.colorLegendBox);
            var containerX = event.pageX - containerPosition.x;
            var windowBox = win.getBox();
            var x = event.pageX;
            if (position === "aboveCanvas") {
                var y = event.pageY - 55;
            } else if (position === "belowCanvas") {
                var y = event.pageY + 15;
            };
            var percent = containerX / containerPosition.w;
            var bins = this.colorData.scale.colors.length;
            var index = Math.floor(bins * percent);
            if (index >= bins) {
                index = bins - 1;
            }
            var color = "#" + this.colorData.scale.colors[index].substr(0,6);
            var label = this.colorData.scale.labels[index];
                if (swatchBox) {
                    var swatchBoxPosition = geometry.position(swatchBox);
                    var swatch = query(".color-legend-swatch")[0];
                    swatchLabel.innerHTML = label;
                    style.set(swatch, "background-color", color);
                    if (windowBox.w - x < swatchBoxPosition.w/2 + 10) {
                        x = x - (5 + swatchBoxPosition.w/2 - (windowBox.w - x));
                    }
                    style.set(swatchBox, {left: x - swatchBoxPosition.w/2 + "px", top: y + "px"});
                } else {

                    var swatchBox = domConstruct.create("div", {"class": "color-legend-swatch-box",
                                                                id: "color-legend-swatch-box",
                                                                style: {
                                                                    left: 0,
                                                                    top: 0
                                                                }
                                                            }, dom.byId("appDiv"));

                    var swatch = domConstruct.create("span", {"class": "color-legend-swatch",
                                                               innerHTML: "&nbsp;",
                                                               style: {
                                                                    "background-color": color
                                                               }
                                                            }, swatchBox);
                    var swatchLabel = domConstruct.create("span", {"class": "color-legend-swatch-label",
                                                                   innerHTML: label
                                                                  }, swatchBox);


                    var swatchBoxPosition = geometry.position(swatchBox);
                    if (windowBox.w - x < swatchBoxPosition.w/2) {
                        x = x - (5 + swatchBoxPosition.w/2 - (windowBox.w - x));
                    }
                    style.set(swatchBox, {left: x - swatchBoxPosition.w/2 + "px", top: y + "px"});
                }
            //if (this.mapLayer != null && typeof this.mapLayer.highlightRange == 'function') {
            //    this.mapLayer.highlightRange(this.colorData.scale.values[index][0], this.colorData.scale.values[Math.min(index, this.colorData.scale.values.length-1)][1], true, null);
            //}
        },

        ColorStop: {
            id: "",
            index: "",
            percent: "",
            color: "",
            div: "",
            colorChanged: function(color) {
                this.color = color;
                this.setBackground();
                lang.hitch(this, this,updateGradient);
            },
            setColor: function(color) {
                this.color = color;
                style.set(this.div, {backgroundColor: "#" + this.color});
            },
            moveable: "",
            clickEvent: ""},

        setColorSlider: function () {
            if (this.colorData.scale.colors.length < 10) {
                domClass.add(this.colorLegendSliderBox, "hidden");
                this.blockColorHandler();
                return;
            };
            on(this.colorLegendCanvas, "click", lang.hitch(this, function(event) {
                this.createNewColorStop(event);
            }));

            var colorStop1 = Object.create(this.ColorStop);
            colorStop1.id = 0;
            colorStop1.index = 0;
            colorStop1.percent = 0;
            colorStop1.div = this.sliderStart;
            colorStop1.color = this.colorData.scale.colors[0].substr(0,6);
            style.set(colorStop1.div, {"float": "left",
                                        backgroundColor: "#" + colorStop1.color
                                        });

            var colorStop2 = Object.create(this.ColorStop);
            colorStop2.id = 1;
            colorStop2.index = 255;
            colorStop2.percent = 1;
            colorStop2.div = this.sliderEnd;
            colorStop2.color = this.colorData.scale.colors[this.colorData.scale.colors.length - 1].substr(0,6);
            style.set(colorStop2.div, {"float": "right",
                                        backgroundColor: "#" + colorStop2.color
                                        });

            this.setColorStopEventHandler(colorStop1);
            this.setColorStopEventHandler(colorStop2);

            this.colorStops = [colorStop1, colorStop2];
        },

        showColorPicker: function(colorStop) {
            // 5/4/15 gwc removed since it causes problem with dojo (uses "delete" as a property). We've migrated beyond this library in a dev branch as well, so this is just a function stub for now.
        },

        updateGradient: function() {
            var newGradient = [];
            this.colorStops.sort(function(x,y) {
                return x.index == y.index ? 0 : (x.index < y.index ? -1 : 1);
            });

            for (var i = 0; i < this.colorStops.length - 1; i++) {
                var color1Rgb = this.hexToRgb(this.colorStops[i].color);
                var color2Rgb = this.hexToRgb(this.colorStops[i + 1].color);
                var color1Hsv = this.rgbToHsv(color1Rgb);
                var color2Hsv = this.rgbToHsv(color2Rgb);

                var range = this.colorStops[i + 1].index - this.colorStops[i].index;
                var newGradientSection = this.createNewGradient(range, [color1Hsv, color2Hsv]);
                newGradient = newGradient.concat(newGradientSection);
            };
            this.colorData.scale.colors = newGradient;
            this.drawColorLegend();
        },

        rgbToHsv: function (color) {
            r = color[0]/255, g = color[1]/255, b = color[2]/255;
            var max = Math.max(r, g, b), min = Math.min(r, g, b);
            var h, s, v = max;

            var d = max - min;
            s = max == 0 ? 0 : d / max;

            if(max == min){
                h = 0; // achromatic
            }else{
                switch(max){
                    case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                    case g: h = (b - r) / d + 2; break;
                    case b: h = (r - g) / d + 4; break;
                }
                h /= 6;
            }
            return [h, s, v];
        },

        createNewGradient: function (steps, colors) {
          var parts = colors.length - 1;
          var gradient = [];
          var gradientIndex = 0;
          var partSteps = Math.floor(steps / parts);
          var remainder = steps - (partSteps * parts);
          for (var col = 0; col < parts; col++) {
            // get colours
            var c1 = colors[col],
                c2 = colors[col + 1];
            // determine clockwise and counter-clockwise distance between hues
            var distCCW = (c1[0] >= c2[0]) ? c1[0] - c2[0] : 1 + c1[0] - c2[0];
                distCW = (c1[0] >= c2[0]) ? 1 + c2[0] - c1[0] : c2[0] - c1[0];
             // ensure we get the right number of steps by adding remainder to final part
            if (col == parts - 1) partSteps += remainder;
            // make gradient for this part
            for (var step = 0; step < partSteps; step ++) {
              var p = step / partSteps;
              // interpolate h, s, b
              var h = (distCW <= distCCW) ? c1[0] + (distCW * p) : c1[0] - (distCCW * p);
              if (h < 0) h = 1 + h;
              if (h > 1) h = h - 1;
              var s = (1 - p) * c1[1] + p * c2[1];
              var b = (1 - p) * c1[2] + p * c2[2];
              // add to gradient array
              var rgbColor = this.hsbToRgb(h,s,b);
              var hexColor = colorUtil.fromArray(rgbColor);
              gradient.push(hexColor.toHex().replace("#", ""));
              gradientIndex ++;
            }
          }
          return gradient;
        },

        hsbToRgb: function (h, s, v){
            var r, g, b;

            var i = Math.floor(h * 6);
            var f = h * 6 - i;
            var p = v * (1 - s);
            var q = v * (1 - f * s);
            var t = v * (1 - (1 - f) * s);

            switch(i % 6){
                case 0: r = v, g = t, b = p; break;
                case 1: r = q, g = v, b = p; break;
                case 2: r = p, g = v, b = t; break;
                case 3: r = p, g = q, b = v; break;
                case 4: r = t, g = p, b = v; break;
                case 5: r = v, g = p, b = q; break;
            }

            var newColorArray = [r * 255, g * 255, b * 255];
            for (var i = 0; i < newColorArray.length; i++) {
                newColorArray[i] = Math.floor(newColorArray[i]);
            };
            return newColorArray;
        },

        createNewColorStop: function (event) {
            var containerPosition = geometry.position(this.colorLegendBox);
            var containerX = event.pageX - containerPosition.x;
            var windowBox = win.getBox();
            var x = event.pageX;
            var y = event.pageY + 15;
            var percent = containerX / containerPosition.w;
            var bins = this.colorData.scale.colors.length;
            var index = Math.floor(bins * percent);
            if (index >= bins) {
                index = bins - 1;
            }

            this.colorStops.sort(function(x,y) {
                return x.index == y.index ? 0 : (x.index < y.index ? -1 : 1);
            });

            var lookup = {};
            for (var i = 0, len = this.colorStops.length; i < len; i++) {
                lookup[this.colorStops[i].id] = this.colorStops[i];
            }
            var newId = lookup[this.colorStops.length - 1].id + 1;
            var newColorStop = Object.create(this.ColorStop);
            var newColorStopDiv = domConstruct.create("div", {"class": "color-legend-slider",
                                                              style: {
                                                                  position: "absolute",
                                                                  left: index + "px"}}, this.colorLegendSliderBox);
            newColorStop.id = newId;
            newColorStop.index = index;
            newColorStop.percent = index / this.colorData.scale.colors.length;
            newColorStop.div = newColorStopDiv;
            newColorStop.setColor(this.colorData.scale.colors[index].substr(0,6));
            newColorStop.clickEvent = on.pausable(newColorStop.div, "mouseup", lang.hitch(this, function(event) {
                on(newColorStop.div, "click", lang.hitch(this, function(event){
                    event.stopPropagation();
                    event.preventDefault();
                }));
                event.stopPropagation();
                event.preventDefault();
                this.showColorPicker(newColorStop);
            }));
            newColorStop.moveable = new move.parentConstrainedMoveable(newColorStop.div);
            newColorStop.moveable.delay = 1;

            on(newColorStop.moveable, "MoveStart", function(event) {
                newColorStop.clickEvent.pause();
             });

            on(newColorStop.moveable, "Move", lang.hitch(this, function(mover, leftTop, event) {
                var sliderContainerPosition = geometry.position(this.colorLegendSliderBox);
                var percent = (leftTop.left + 5) / sliderContainerPosition.w;
                var bins = this.colorData.scale.colors.length;
                var index = Math.floor(bins * percent);
                if (index >= bins) {
                    index = bins - 1;
                }
                newColorStop.index = leftTop.l;
                this.updateGradient();
                this.updateColorSwatch(event, "belowCanvas");
            }));

            on(newColorStop.moveable, "MoveStop", function(mover) {
                newColorStop.clickEvent.resume();
                domConstruct.destroy("color-legend-swatch-box");
            });

            this.colorStops.push(newColorStop);
        },

        setColorStopEventHandler: function (colorStop) {
                on.pausable(colorStop.div, "click", lang.hitch(this, function(event){
                    event.stopPropagation();
                    event.preventDefault();
                    this.showColorPicker(colorStop);
                }))
        },

        deleteColorStop: function(colorStop) {
            domConstruct.destroy(colorStop.div);
            for (var i = 0; i < this.colorStops.length; i++) {
                if (this.colorStops[i].id === colorStop.id) {
                    this.colorStops.splice(i, 1);
                }
            };
            this.updateGradient();
        },

        blockColorHandler: function(){
            on(this.colorLegendCanvas, "click", lang.hitch(this, function(event) {
                event.stopPropagation();
                var containerPosition = geometry.position(this.colorLegendBox);
                var containerX = event.pageX - containerPosition.x;
                var windowBox = win.getBox();
                var x = event.pageX;
                var percent = containerX / containerPosition.w;
                var bins = this.colorData.scale.colors.length;
                var index = Math.floor(bins * percent);
                if (index >= bins) {
                    index = bins - 1;
                }
                    this.showBlockColorPicker(event, index);
                }
            ));
        },

        showBlockColorPicker: function(event, index) {
            // 5/4/15 gwc removed since it causes problem with dojo (uses "delete" as a property). We've migrated beyond this library in a dev branch as well, so this is just a function stub for now.
        }

        // setBlockColors: function(){
        //     for (var i = 0; i < this.colorData.scale.colors.length; i++) {
        //         var newColorStop = Object.create(this.ColorStop);
        //         newColorStop.id = i;
        //         newColorStop.index = i;
        //         newColorStop.percent = i / this.colorData.scale.colors.length;
        //         newColorStop.setColor = this.colorData.scale.colors[i].color.substr(0,6);

        //     };
        // }


    });

});
