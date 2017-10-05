define([
    "dojo/_base/kernel",
    "dojo/_base/declare",
    "dojo/dom-construct",
    "dojo/dom-style",
    "esri/layers/WMTSLayer",
    "esri/geometry/Extent",
    "esri/SpatialReference",
    "dojox/xml/parser",
    "dojo/_base/array"
], function(g, declare, domConstruct, domStyle, WMTSLayer, Extent, SpatialReference,parser, k){
    return declare([WMTSLayer],{

        //overriding
        overrideSpatialReference: undefined,

        constructor: function (endpoint, option){
            if (option['overrideSpatialReference'] != undefined)
                this.overrideSpatialReference = option['overrideSpatialReference'];
        },

        onLoad: function() {
            //store the maximum level for imagery available
            this.maxZoom = this.setMaxZoomImageryLevel(this.layerInfo.tileInfo.lods);
            //set the lods to be the complete zoom level for oversampling if needed
            this.layerInfo.tileInfo.lods = this.setLODS(this.layerInfo.tileInfo.lods, 19);
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
            this._noDom ? this._standby.push(clippingDiv) : (this._tilePopPop(img));
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
            if (img.parentNode != null) {
                img.parentNode.replaceChild(clippingDiv, img);
                clippingDiv.appendChild(img);
                img.removeAttribute("id");
                clippingDiv.id = imgid;

                if (clippingDiv.style.visibility !== 'visible') {
                    clippingDiv.style.visibility = 'visible'; // prevents flash of raw color
                }
                arguments[0].currentTarget = clippingDiv;
            }
        },

        getTileUrl: function(level, row, col) {

            var length = this.tileInfo.lods[level].resolution * this.tileInfo.rows;
            var west = this.tileInfo.origin.x + length * col;
            var north = this.tileInfo.origin.y - length * row;
            var east = west + length;
            var south = north - length;

            var tileExtent = new Extent(west, south, east, north);

            if (!tileExtent.intersects(this.fullExtent)) {
                return undefined;
            }


            if (level >= this.maxZoom) {
                var zoomfactor = Math.pow(2, level - this.maxZoom),
                    a = this.maxZoom, b = Math.floor(row / zoomfactor), f = Math.floor(col / zoomfactor);
            } else {
                var a = level, b = row; f = col;
            }

            //do what the parent does
            a = this._levelToLevelValue[a];
            a = this.resourceUrls && 0 < this.resourceUrls.length ? this.resourceUrls[b %
            this.resourceUrls.length].template.replace(/\{Style\}/gi, this._style)
                .replace(/\{TileMatrixSet\}/gi, this._tileMatrixSetId)
                .replace(/\{TileMatrix\}/gi, a)
                .replace(/\{TileRow\}/gi, b)
                .replace(/\{TileCol\}/gi, f)
                .replace(/\{dimensionValue\}/gi, this._dimension) : this.UrlTemplate.replace(/\{level\}/gi, a)
                .replace(/\{row\}/gi, b)
                .replace(/\{col\}/gi, f);


            return a = this.addTimestampToURL(a)
        },

        _parseCapabilities: function(a) {
            //this.inherited(arguments);

            a = a.replace(/ows:/gi, "");
            a = parser.parse(a);
            var lowerCorner = a.getElementsByTagName("LowerCorner")[0].childNodes[0].nodeValue;
            var upperCorner = a.getElementsByTagName("UpperCorner")[0].childNodes[0].nodeValue;

            var lcarray = lowerCorner.split(" ");
            var ucarray = upperCorner.split(" ");
            var extent = new Extent(Number(lcarray[0]), Number(lcarray[1]), Number(ucarray[0]), Number(ucarray[1]));

            var b = g.query("Contents", a)[0];
            if (b) {
                var f = g.query("OperationsMetadata", a)[0],
                    c = g.query("[name\x3d'GetTile']", f)[0],
                    f = this._url,
                    c = g.query("Get", c),
                    e;
                for (e = 0; e < c.length; e++) {
                    var d = g.query("Constraint", c[e])[0];
                    if (!d || this._getTagWithChildTagValue("AllowedValues", "Value", this.serviceMode, d)) {
                        f = c[e].attributes[0].nodeValue;
                        break
                    }
                } - 1 === f.indexOf("/1.0.0/") && "RESTful" === this.serviceMode && (f += "/");
                "KVP" === this.serviceMode && (f += -1 < f.indexOf("?") ?
                    "" : "?");
                this._url = f;
                this.copyright = this._getTagValues("Capabilities\x3eServiceIdentification\x3eAccessConstraints", a)[0];
                a = g.query("Layer", b);
                var h, s = [];
                this.layers = [];
                k.forEach(a, function(a) {
                    h = this._getTagValues("Identifier", a)[0];
                    s.push(h);
                    var layerInfo = this._getWMTSLayerInfo(h, a, b);

                    //if (layerInfo.tileMatrixSetInfos[0].fullExtent.ymax > 1000) {
                    if (this.overrideSpatialReference != undefined) {
                        if (this.overrideSpatialReference.wtk != undefined && this.overrideSpatialReference.wtk != "") {
                            var spatialReference = new SpatialReference({wkt: this.overrideSpatialReference.wtk });
                            //var spatialReference = new SpatialReference({wkt: "PROJCS[\"Moon2000_sp\",GEOGCS[\"GCS_Moon_2000\",DATUM[\"D_Moon_2000\",SPHEROID[\"Moon_2000_IAU_IAG\",1737400.0,0.0]],PRIMEM[\"Reference_Meridian\",0.0],UNIT[\"Degree\",0.0174532925199433]],PROJECTION[\"Stereographic_South_Pole\"],PARAMETER[\"False_Easting\",0.0],PARAMETER[\"False_Northing\",0.0],PARAMETER[\"Central_Meridian\",0.0],PARAMETER[\"Standard_Parallel_1\",-90.0],UNIT[\"Meter\",1.0]]"});

                        } else {
                            var spatialReference = new SpatialReference({wkid: this.overrideSpatialReference.wkid});
                        }

                        layerInfo.tileMatrixSetInfos[0].tileInfo.spatialReference =
                            layerInfo.tileMatrixSetInfos[0].fullExtent.spatialReference =
                                layerInfo.tileMatrixSetInfos[0].initialExtent.spatialReference = spatialReference;

                    }

                    this.layers.push(layerInfo);
                }, this);
                this._setActiveLayer();
                this.layerInfo.initialExtent = extent;
                this.layerInfo.fullExtent = extent;
                this.fullExtent = extent;
                this.initialExtent = extent;
                this.loaded = !0;
                this.onLoad(this)
            } else console.error("The WMTS capabilities XML is not valid"), this.onError(Error("The WMTS capabilities XML is not valid"))

        }
    });
});