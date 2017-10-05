/*global define*/
define([
    'cesium/Core/combine',
    'cesium/Core/Credit',
    'cesium/Core/defaultValue',
    'cesium/Core/defined',
    'cesium/Core/defineProperties',
    'cesium/Core/DeveloperError',
    'cesium/Core/Event',
    'cesium/Core/freezeObject',
    'cesium/Core/objectToQuery',
    'cesium/Core/queryToObject',
    'cesium/Core/Rectangle',
    'cesium/Core/GeographicTilingScheme',
    'cesium/ThirdParty/Uri',
    'cesium/Scene/ImageryProvider',
    'cesium/Cesium',
    "cesium/Core/Math",
    "dojox/xml/parser"
], function(
    combine,
    Credit,
    defaultValue,
    defined,
    defineProperties,
    DeveloperError,
    Event,
    freezeObject,
    objectToQuery,
    queryToObject,
    Rectangle,
    GeographicTilingScheme,
    Uri,
    ImageryProvider,
    Cesium,
    CesiumMath,
    xmlParser
) {
    "use strict";

    /**
     * Provides tiled imagery served by {@link http://www.opengeospatial.org/standards/wmts|WMTS 1.0.0} compliant servers.
     * This provider supports HTTP KVP-encoded and RESTful GetTile requests, but does not yet support the SOAP encoding.
     *
     * @alias TrekWebMapTileServiceImageryProvider
     * @constructor
     *
     * @param {Object} options Object with the following properties:
     * @param {String} options.url The base URL for the WMTS GetTile operation (for KVP-encoded requests) or the tile-URL template (for RESTful requests). The tile-URL template should contain the following variables: &#123;style&#125;, &#123;TileMatrixSet&#125;, &#123;TileMatrix&#125;, &#123;TileRow&#125;, &#123;TileCol&#125;. The first two are optional if actual values are hardcoded or not required by the server.
     * @param {String} [options.format='image/jpeg'] The MIME type for images to retrieve from the server.
     * @param {String} options.layer The layer name for WMTS requests.
     * @param {String} options.style The style name for WMTS requests.
     * @param {String} options.tileMatrixSetID The identifier of the TileMatrixSet to use for WMTS requests.
     * @param {Array} [options.tileMatrixLabels] A list of identifiers in the TileMatrix to use for WMTS requests, one per TileMatrix level.
     * @param {Number} [options.tileWidth=256] The tile width in pixels.
     * @param {Number} [options.tileHeight=256] The tile height in pixels.
     * @param {TilingScheme} [options.tilingScheme] The tiling scheme corresponding to the organization of the tiles in the TileMatrixSet.
     * @param {Object} [options.proxy] A proxy to use for requests. This object is expected to have a getURL function which returns the proxied URL.
     * @param {Rectangle} [options.rectangle=Rectangle.MAX_VALUE] The rectangle covered by the layer.
     * @param {Number} [options.minimumLevel=0] The minimum level-of-detail supported by the imagery provider.
     * @param {Number} [options.maximumLevel] The maximum level-of-detail supported by the imagery provider, or undefined if there is no limit.
     * @param {Ellipsoid} [options.ellipsoid] The ellipsoid.  If not specified, the WGS84 ellipsoid is used.
     * @param {Credit|String} [options.credit] A credit for the data source, which is displayed on the canvas.
     *
     * @see ArcGisMapServerImageryProvider
     * @see BingMapsImageryProvider
     * @see GoogleEarthImageryProvider
     * @see OpenStreetMapImageryProvider
     * @see SingleTileImageryProvider
     * @see TileMapServiceImageryProvider
     * @see WebMapServiceImageryProvider
     * @see UrlTemplateImageryProvider
     *
     * @example
     * // Example 1. USGS shaded relief tiles (KVP)
     * var shadedRelief1 = new Cesium.TrekWebMapTileServiceImageryProvider({
     *     url : 'http://basemap.nationalmap.gov/arcgis/rest/services/USGSShadedReliefOnly/MapServer/WMTS',
     *     layer : 'USGSShadedReliefOnly',
     *     style : 'default',
     *     format : 'image/jpeg',
     *     tileMatrixSetID : 'default028mm',
     *     // tileMatrixLabels : ['default028mm:0', 'default028mm:1', 'default028mm:2' ...],
     *     maximumLevel: 19,
     *     credit : new Cesium.Credit('U. S. Geological Survey')
     * });
     * viewer.imageryLayers.addImageryProvider(shadedRelief1);
     *
     * @example
     * // Example 2. USGS shaded relief tiles (RESTful)
     * var shadedRelief2 = new Cesium.TrekWebMapTileServiceImageryProvider({
     *     url : 'http://basemap.nationalmap.gov/arcgis/rest/services/USGSShadedReliefOnly/MapServer/WMTS/tile/1.0.0/USGSShadedReliefOnly/{Style}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.jpg',
     *     layer : 'USGSShadedReliefOnly',
     *     style : 'default',
     *     format : 'image/jpeg',
     *     tileMatrixSetID : 'default028mm',
     *     maximumLevel: 19,
     *     credit : new Cesium.Credit('U. S. Geological Survey')
     * });
     * viewer.imageryLayers.addImageryProvider(shadedRelief2);
     */
    var TrekWebMapTileServiceImageryProvider = function TrekWebMapTileServiceImageryProvider(options) {
        this._ready = false;
        options = defaultValue(options, defaultValue.EMPTY_OBJECT);

        if (!defined(options.url)) {
            throw new DeveloperError('options.url is required.');
        }
        if (!defined(options.layer)) {
            throw new DeveloperError('options.layer is required.');
        }
        if (!defined(options.style)) {
            throw new DeveloperError('options.style is required.');
        }
        if (!defined(options.tileMatrixSetID)) {
            throw new DeveloperError('options.tileMatrixSetID is required.');
        }

        this._endPoint = options.url;
        this._layer = options.layer;
        this._style = options.style;
        this._tileMatrixSetID = options.tileMatrixSetID;
        this._tileMatrixLabels = options.tileMatrixLabels;
        this._proxy = options.proxy;
        this._tileDiscardPolicy = options.tileDiscardPolicy;

        this._tileWidth = defaultValue(options.tileWidth, 256);
        this._tileHeight = defaultValue(options.tileHeight, 256);

        this._errorEvent = new Event();

        var credit = options.credit;
        this._credit = typeof credit === 'string' ? new Credit(credit) : credit;


        function requestCapabilities(me) {
            var capabilityURL = me._endPoint + "/1.0.0/WMTSCapabilities.xml";

            Cesium.loadXML(capabilityURL, {}).then(function (capabilityDoc) {
                var lowerCorner = capabilityDoc.getElementsByTagNameNS('*', 'LowerCorner')[0].childNodes[0].nodeValue;
                var upperCorner = capabilityDoc.getElementsByTagNameNS('*', 'UpperCorner')[0].childNodes[0].nodeValue;
                var lcarray = lowerCorner.split(" ");
                var ucarray = upperCorner.split(" ");
                var north = Number(ucarray[1]);
                var south = Number(lcarray[1]);
                var west = Number(lcarray[0]);
                var east = Number(ucarray[0]);

                var rec = new Rectangle(CesiumMath.toRadians(west),
                    CesiumMath.toRadians(south ),
                    CesiumMath.toRadians(east),
                    CesiumMath.toRadians(north));

                me._tilingScheme = new GeographicTilingScheme();
                me._rectangle = rec;

                // Check the number of tiles at the minimum level.  If it's more than four,
                // throw an exception, because starting at the higher minimum
                // level will cause too many tiles to be downloaded and rendered.

                me._minimumLevel = 0;

                //var swTile = me._tilingScheme.positionToTileXY(Rectangle.southwest(me._rectangle), me._minimumLevel);
                //var neTile = me._tilingScheme.positionToTileXY(Rectangle.northeast(me._rectangle), me._minimumLevel);
                //var tileCount = (Math.abs(neTile.x - swTile.x) + 1) * (Math.abs(neTile.y - swTile.y) + 1);
                //if (tileCount > 4) {
                //    throw new DeveloperError('The imagery provider\'s rectangle and minimumLevel indicate that there are ' + tileCount + ' tiles at the minimum level. Imagery providers with more than four tiles at the minimum level are not supported.');
                //}


                me._format = capabilityDoc.getElementsByTagNameNS('*', 'Format')[0].childNodes[0].nodeValue;
                me._url = capabilityDoc.getElementsByTagNameNS('*', 'ResourceURL')[0].attributes["template"].value;


                me._maximumLevel = capabilityDoc.getElementsByTagNameNS('*', 'TileMatrix').length - 1;

                me._ready = true;

            }).otherwise(function (error) {
                console.debug(error);
            });
        }

        requestCapabilities(this);
    };

    var defaultParameters = freezeObject({
        service : 'WMTS',
        version : '1.0.0',
        request : 'GetTile'
    });

    function buildImageUrl(imageryProvider, col, row, level) {
        var labels = imageryProvider._tileMatrixLabels;
        var tileMatrix = defined(labels) ? labels[level] : level.toString();
        var url;

        if (imageryProvider._url.indexOf('{') >= 0) {
            // resolve tile-URL template
            url = imageryProvider._url
                .replace('{style}', imageryProvider._style)
                .replace('{Style}', imageryProvider._style)
                .replace('{TileMatrixSet}', imageryProvider._tileMatrixSetID)
                .replace('{TileMatrix}', tileMatrix)
                .replace('{TileRow}', row.toString())
                .replace('{TileCol}', col.toString());
        }
        else {
            // build KVP request
            var uri = new Uri(imageryProvider._url);
            var queryOptions = queryToObject(defaultValue(uri.query, ''));

            queryOptions = combine(defaultParameters, queryOptions);

            queryOptions.tilematrix = tileMatrix;
            queryOptions.layer = imageryProvider._layer;
            queryOptions.style = imageryProvider._style;
            queryOptions.tilerow = row;
            queryOptions.tilecol = col;
            queryOptions.tilematrixset = imageryProvider._tileMatrixSetID;
            queryOptions.format = imageryProvider._format;

            uri.query = objectToQuery(queryOptions);

            url = uri.toString();
        }

        var proxy = imageryProvider._proxy;
        if (defined(proxy)) {
            url = proxy.getURL(url);
        }

        return url;
    }

    defineProperties(TrekWebMapTileServiceImageryProvider.prototype, {
        /**
         * Gets the URL of the service hosting the imagery.
         * @memberof TrekWebMapTileServiceImageryProvider.prototype
         * @type {String}
         * @readonly
         */
        url : {
            get : function() {
                return this._url;
            }
        },

        /**
         * Gets the proxy used by this provider.
         * @memberof TrekWebMapTileServiceImageryProvider.prototype
         * @type {Proxy}
         * @readonly
         */
        proxy : {
            get : function() {
                return this._proxy;
            }
        },

        /**
         * Gets the width of each tile, in pixels. This function should
         * not be called before {@link TrekWebMapTileServiceImageryProvider#ready} returns true.
         * @memberof TrekWebMapTileServiceImageryProvider.prototype
         * @type {Number}
         * @readonly
         */
        tileWidth : {
            get : function() {
                return this._tileWidth;
            }
        },

        /**
         * Gets the height of each tile, in pixels.  This function should
         * not be called before {@link TrekWebMapTileServiceImageryProvider#ready} returns true.
         * @memberof TrekWebMapTileServiceImageryProvider.prototype
         * @type {Number}
         * @readonly
         */
        tileHeight : {
            get : function() {
                return this._tileHeight;
            }
        },

        /**
         * Gets the maximum level-of-detail that can be requested.  This function should
         * not be called before {@link TrekWebMapTileServiceImageryProvider#ready} returns true.
         * @memberof TrekWebMapTileServiceImageryProvider.prototype
         * @type {Number}
         * @readonly
         */
        maximumLevel : {
            get : function() {
                return this._maximumLevel;
            }
        },

        /**
         * Gets the minimum level-of-detail that can be requested.  This function should
         * not be called before {@link TrekWebMapTileServiceImageryProvider#ready} returns true.
         * @memberof TrekWebMapTileServiceImageryProvider.prototype
         * @type {Number}
         * @readonly
         */
        minimumLevel : {
            get : function() {
                return this._minimumLevel;
            }
        },

        /**
         * Gets the tiling scheme used by this provider.  This function should
         * not be called before {@link TrekWebMapTileServiceImageryProvider#ready} returns true.
         * @memberof TrekWebMapTileServiceImageryProvider.prototype
         * @type {TilingScheme}
         * @readonly
         */
        tilingScheme : {
            get : function() {
                return this._tilingScheme;
            }
        },

        /**
         * Gets the rectangle, in radians, of the imagery provided by this instance.  This function should
         * not be called before {@link TrekWebMapTileServiceImageryProvider#ready} returns true.
         * @memberof TrekWebMapTileServiceImageryProvider.prototype
         * @type {Rectangle}
         * @readonly
         */
        rectangle : {
            get : function() {
                return this._rectangle;
            }
        },

        /**
         * Gets the tile discard policy.  If not undefined, the discard policy is responsible
         * for filtering out "missing" tiles via its shouldDiscardImage function.  If this function
         * returns undefined, no tiles are filtered.  This function should
         * not be called before {@link TrekWebMapTileServiceImageryProvider#ready} returns true.
         * @memberof TrekWebMapTileServiceImageryProvider.prototype
         * @type {TileDiscardPolicy}
         * @readonly
         */
        tileDiscardPolicy : {
            get : function() {
                return this._tileDiscardPolicy;
            }
        },

        /**
         * Gets an event that is raised when the imagery provider encounters an asynchronous error.  By subscribing
         * to the event, you will be notified of the error and can potentially recover from it.  Event listeners
         * are passed an instance of {@link TileProviderError}.
         * @memberof TrekWebMapTileServiceImageryProvider.prototype
         * @type {Event}
         * @readonly
         */
        errorEvent : {
            get : function() {
                return this._errorEvent;
            }
        },

        /**
         * Gets the mime type of images returned by this imagery provider.
         * @memberof TrekWebMapTileServiceImageryProvider.prototype
         * @type {String}
         * @readonly
         */
        format : {
            get : function() {
                return this._format;
            }
        },

        /**
         * Gets a value indicating whether or not the provider is ready for use.
         * @memberof TrekWebMapTileServiceImageryProvider.prototype
         * @type {Boolean}
         * @readonly
         */
        ready : {
            get : function() {
                return this._ready;
            }
        },

        /**
         * Gets the credit to display when this imagery provider is active.  Typically this is used to credit
         * the source of the imagery.  This function should not be called before {@link TrekWebMapTileServiceImageryProvider#ready} returns true.
         * @memberof TrekWebMapTileServiceImageryProvider.prototype
         * @type {Credit}
         * @readonly
         */
        credit : {
            get : function() {
                return this._credit;
            }
        },

        /**
         * Gets a value indicating whether or not the images provided by this imagery provider
         * include an alpha channel.  If this property is false, an alpha channel, if present, will
         * be ignored.  If this property is true, any images without an alpha channel will be treated
         * as if their alpha is 1.0 everywhere.  When this property is false, memory usage
         * and texture upload time are reduced.
         * @memberof TrekWebMapTileServiceImageryProvider.prototype
         * @type {Boolean}
         * @readonly
         */
        hasAlphaChannel : {
            get : function() {
                return true;
            }
        }
    });

    /**
     * Gets the credits to be displayed when a given tile is displayed.
     *
     * @param {Number} x The tile X coordinate.
     * @param {Number} y The tile Y coordinate.
     * @param {Number} level The tile level;
     * @returns {Credit[]} The credits to be displayed when the tile is displayed.
     *
     * @exception {DeveloperError} <code>getTileCredits</code> must not be called before the imagery provider is ready.
     */
    TrekWebMapTileServiceImageryProvider.prototype.getTileCredits = function(x, y, level) {
        return undefined;
    };

    /**
     * Requests the image for a given tile.  This function should
     * not be called before {@link TrekWebMapTileServiceImageryProvider#ready} returns true.
     *
     * @param {Number} x The tile X coordinate.
     * @param {Number} y The tile Y coordinate.
     * @param {Number} level The tile level.
     * @returns {Promise} A promise for the image that will resolve when the image is available, or
     *          undefined if there are too many active requests to the server, and the request
     *          should be retried later.  The resolved image may be either an
     *          Image or a Canvas DOM object.
     *
     * @exception {DeveloperError} <code>requestImage</code> must not be called before the imagery provider is ready.
     */
    TrekWebMapTileServiceImageryProvider.prototype.requestImage = function(x, y, level) {
        if (!this._ready) {
            throw new DeveloperError('requestImage must not be called before the imagery provider is ready.');
        }

        var nativeRectangle = this._tilingScheme.tileXYToNativeRectangle(x, y, level);

        if (nativeRectangle.south > CesiumMath.toDegrees(this._rectangle.north) ||
            nativeRectangle.north < CesiumMath.toDegrees(this._rectangle.south) ||
            nativeRectangle.east < CesiumMath.toDegrees(this._rectangle.west) ||
            nativeRectangle.west > CesiumMath.toDegrees(this._rectangle.east)) {
            //out of range
            console.debug("out of range " + level + ":" + y + ":" + x);
            return undefined;

        }

        var url = buildImageUrl(this, x, y, level);
        return ImageryProvider.loadImage(this, url);
    };

    /**
     * Picking features is not currently supported by this imagery provider, so this function simply returns
     * undefined.
     *
     * @param {Number} x The tile X coordinate.
     * @param {Number} y The tile Y coordinate.
     * @param {Number} level The tile level.
     * @param {Number} longitude The longitude at which to pick features.
     * @param {Number} latitude  The latitude at which to pick features.
     * @return {Promise} A promise for the picked features that will resolve when the asynchronous
     *                   picking completes.  The resolved value is an array of {@link ImageryLayerFeatureInfo}
     *                   instances.  The array may be empty if no features are found at the given location.
     *                   It may also be undefined if picking is not supported.
     */
    TrekWebMapTileServiceImageryProvider.prototype.pickFeatures = function() {
        return undefined;
    };

    return TrekWebMapTileServiceImageryProvider;
});
