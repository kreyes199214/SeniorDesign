define([
    "dojo/_base/declare",
    "dojo/dom-construct",
    "dojo/dom-style",
    "esri/layers/ArcGISTiledMapServiceLayer"
], function(declare, domConstruct, domStyle, ArcGISTiledMapServiceLayer){
    return declare([ArcGISTiledMapServiceLayer],{

        onLoad: function() {
            //store the maximum level for imagery available
            this.maxZoom = this.setMaxZoomImageryLevel(this.tileInfo.lods);
            //set the lods to be the complete zoom level for oversampling if needed
            this.tileInfo.lods = this.setLODS(this.tileInfo.lods, 15);
            this.resampling = true;
            this._lowestLevel = 15;
        },

        setId: function(id) {
            this.id = id;
        },

        setLODS: function(originalLODs, totalLevels) {
            //loop over original LODs and add any additional needed
            for(var i = originalLODs.length; i < totalLevels; i++) {
                originalLODs.push({
                    "level": i,
                    "resolution": (originalLODs[i-1].resolution/2),
                    "scale":  (originalLODs[i-1].scale/2)
                });
            }

            this.maxScale = originalLODs[originalLODs.length-1].scale;
            this.maxZoom = originalLODs.length;

            return originalLODs;
        },

        setMaxZoomImageryLevel: function(lods) {
            //make a copy of the lods
            var lodCopy = lods.slice(0);

            //return the length - 1 since zooms are zero based
            return lodCopy.length - 1;
        },


        _addImage: function(a, c, d, b, e, f, h, g, t, m, k) {
            // a = level, d = row, e = col, h = tilew, g = tileh
            this.inherited(arguments);
            var img = this._tiles[f];

            if(a >= this.maxZoom) {
                var overzoomfactor = Math.pow(2, a - this.maxZoom);
                img.style.width = h * overzoomfactor + "px";
                img.style.height = g * overzoomfactor + "px";
                img.style.margin = "-" + h * (d % overzoomfactor) + "px 0 0 " + ("-" + g * (e % overzoomfactor) + "px");
            }
        },

        _tileLoadHandler: function(a) {
            var img = arguments[0].currentTarget;
            var clippingDiv = domConstruct.create("div");
            var imgid = img.id;

            // do/undo what is done in the parent function
            this._noDom ? this._standby.push(clippingDiv) : (this._popTile(img));
            this._tiles[imgid] = clippingDiv;

            // copy img attributes
            clippingDiv.style.cssText = img.style.cssText;
            clippingDiv.style.visibility = 'hidden';
            clippingDiv.className = img.className;
            clippingDiv.style.width = "256px";
            clippingDiv.style.height = "256px";
            clippingDiv.style.margin = "";
            clippingDiv.style.overflow = 'hidden';

            // needed so that tiles will be pruned if they're offscreen
            var transform = (domStyle.getComputedStyle(img).transform || domStyle.getComputedStyle(img).webkitTransform).split(/[,\)]/);
            clippingDiv._left = +transform[4];
            clippingDiv._top = +transform[5];

            // reset image sizes after clearing out other attributes
            var tmpw = img.style.width;
            var tmph = img.style.height;
            var tmpm = img.style.margin;
            img.style.cssText = "";
            img.style.width = tmpw;
            img.style.height = tmph;
            img.style.margin = tmpm;

            // replace and destroy original img
            img.parentNode.replaceChild(clippingDiv, img);
            clippingDiv.appendChild(img);
            img.removeAttribute("id");
            clippingDiv.id = imgid;

            if(clippingDiv.style.visibility !== 'visible') {
                clippingDiv.style.visibility = 'visible'; // prevents flash of raw color
            }
            arguments[0].currentTarget = clippingDiv;
        },

        getTileUrl: function(level, row, col) {
            if (level >= this.maxZoom) {
                var zoomfactor = Math.pow(2, level - this.maxZoom),
                a = this.maxZoom, b = Math.floor(row / zoomfactor), f = Math.floor(col / zoomfactor);
            } else {
                var a = level, b = row; f = col;
            }

            var e = this.tileServers,
                g = this._getToken(),
                d = this._url.query;
            a = (e ? e[b % e.length] : this._url.path) + "/tile/" + a + "/" + b + "/" + f;
            this.resampling && !this.tileMap && (a += "?blankTile\x3dfalse");
            d && (a = this.resampling && !this.tileMap ? a + ("\x26" + f.objectToQuery(d)) : a + ("?" + f.objectToQuery(d)));
            if (g && (!d || !d.token)) a += (-1 === a.indexOf("?") ? "?" : "\x26") + "token\x3d" + g;
            a = this.addTimestampToURL(a);

            return a
        }

    });
});