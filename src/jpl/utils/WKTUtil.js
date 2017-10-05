/*
 *
 *  Copyright (C) 2012 K. Arthur Endsley (kaendsle@mtu.edu)
 *  Michigan Tech Research Institute (MTRI)
 *  3600 Green Court, Suite 100, Ann Arbor, MI, 48105
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 *  https://github.com/arthur-e/Wicket
 *
 *  MODDED FOR USE IN TREK BY: Eddie
 */

define([
    "dojo/_base/declare",
    "dojo/topic",
    "dojo/_base/lang",
    "jpl/data/Layer",
    'esri/geometry/Multipoint',
    'esri/geometry/Point',
    'esri/geometry/Polygon',
    'esri/geometry/Polyline'
], function(declare, topic, lang, Layer, Multipoint, Point, Polygon, Polyline){
    return declare(null,{

        constructor: function () {
        },

        convertWktToComponents: function (str) {
            var regExes = {
                'typeStr': /^\s*(\w+)\s*\(\s*(.*)\s*\)\s*$/,
                'spaces': /\s+|\+/, // Matches the '+' or the empty space
                'numeric': /-*\d+(\.*\d+)?/,
                'comma': /\s*,\s*/,
                'parenComma': /\)\s*,\s*\(/,
                'coord': /-*\d+\.*\d+ -*\d+\.*\d+/, // e.g. "24 -14"
                'doubleParenComma': /\)\s*\)\s*,\s*\(\s*\(/,
                'trimParens': /^\s*\(?(.*?)\)?\s*$/,
                'ogcTypes': /^(multi)?(point|line|polygon|box)?(string)?$/i, // Captures e.g. "Multi","Line","String"
                'crudeJson': /^{.*"(type|coordinates|geometries|features)":.*}$/ // Attempts to recognize JSON strings
            };

            var trim = function (str, sub) {
                sub = sub || ' '; // Defaults to trimming spaces
                // Trim beginning spaces
                while (beginsWith(str, sub)) {
                    str = str.substring(1);
                }
                // Trim ending spaces
                while (endsWith(str, sub)) {
                    str = str.substring(0, str.length - 1);
                }
                return str;
            };

            var beginsWith = function (str, sub) {
                return str.substring(0, sub.length) === sub;
            };

            var endsWith = function (str, sub) {
                return str.substring(str.length - sub.length) === sub;
            };

            var isArray = function (obj) {
                return !!(obj && obj.constructor === Array);
            };


            var ingest = {

                /**
                 * Return point feature given a point WKT fragment.
                 * @param   str {String}    A WKT fragment representing the point
                 * @memberof this.Wkt.Wkt.ingest
                 * @instance
                 */
                point: function (str) {
                    var coords = trim(str).split(regExes.spaces);
                    // In case a parenthetical group of coordinates is passed...
                    return [{ // ...Search for numeric substrings
                        x: parseFloat(regExes.numeric.exec(coords[0])[0]),
                        y: parseFloat(regExes.numeric.exec(coords[1])[0])
                    }];
                },

                /**
                 * Return a multipoint feature given a multipoint WKT fragment.
                 * @param   str {String}    A WKT fragment representing the multipoint
                 * @memberof this.Wkt.Wkt.ingest
                 * @instance
                 */
                multipoint: function (str) {
                    var i, components, points;
                    components = [];
                    points = trim(str).split(regExes.comma);
                    for (i = 0; i < points.length; i += 1) {
                        components.push(ingest.point.apply(this, [points[i]]));
                    }
                    return components;
                },

                /**
                 * Return a linestring feature given a linestring WKT fragment.
                 * @param   str {String}    A WKT fragment representing the linestring
                 * @memberof this.Wkt.Wkt.ingest
                 * @instance
                 */
                linestring: function (str) {
                    var i, multipoints, components;

                    // In our x-and-y representation of components, parsing
                    //  multipoints is the same as parsing linestrings
                    multipoints = ingest.multipoint.apply(this, [str]);

                    // However, the points need to be joined
                    components = [];
                    for (i = 0; i < multipoints.length; i += 1) {
                        components = components.concat(multipoints[i]);
                    }
                    return components;
                },

                /**
                 * Return a multilinestring feature given a multilinestring WKT fragment.
                 * @param   str {String}    A WKT fragment representing the multilinestring
                 * @memberof this.Wkt.Wkt.ingest
                 * @instance
                 */
                multilinestring: function (str) {
                    var i, components, line, lines;
                    components = [];

                    lines = trim(str).split(regExes.doubleParenComma);
                    if (lines.length === 1) { // If that didn't work...
                        lines = trim(str).split(regExes.parenComma);
                    }

                    for (i = 0; i < lines.length; i += 1) {
                        line = lines[i].replace(regExes.trimParens, '$1');
                        components.push(ingest.linestring.apply(this, [line]));
                    }

                    return components;
                },

                /**
                 * Return a polygon feature given a polygon WKT fragment.
                 * @param   str {String}    A WKT fragment representing the polygon
                 * @memberof this.Wkt.Wkt.ingest
                 * @instance
                 */
                polygon: function (str) {
                    var i, j, components, subcomponents, ring, rings;
                    rings = trim(str).split(regExes.parenComma);
                    components = []; // Holds one or more rings
                    for (i = 0; i < rings.length; i += 1) {
                        ring = rings[i].replace(regExes.trimParens, '$1').split(regExes.comma);
                        subcomponents = []; // Holds the outer ring and any inner rings (holes)
                        for (j = 0; j < ring.length; j += 1) {
                            // Split on the empty space or '+' character (between coordinates)
                            var split = ring[j].split(regExes.spaces);
                            if (split.length > 2) {
                                //remove the elements which are blanks
                                split = split.filter(function (n) {
                                    return n != ""
                                });
                            }
                            if (split.length === 2) {
                                var x_cord = split[0];
                                var y_cord = split[1];

                                //now push
                                subcomponents.push({
                                    x: parseFloat(x_cord),
                                    y: parseFloat(y_cord)
                                });
                            }
                        }
                        components.push(subcomponents);
                    }
                    return components;
                },

                /**
                 * Return box vertices (which would become the Rectangle bounds) given a Box WKT fragment.
                 * @param   str {String}    A WKT fragment representing the box
                 * @memberof this.Wkt.Wkt.ingest
                 * @instance
                 */
                box: function (str) {
                    var i, multipoints, components;

                    // In our x-and-y representation of components, parsing
                    //  multipoints is the same as parsing linestrings
                    multipoints = ingest.multipoint.apply(this, [str]);

                    // However, the points need to be joined
                    components = [];
                    for (i = 0; i < multipoints.length; i += 1) {
                        components = components.concat(multipoints[i]);
                    }

                    return components;
                },

                /**
                 * Return a multipolygon feature given a multipolygon WKT fragment.
                 * @param   str {String}    A WKT fragment representing the multipolygon
                 * @memberof this.Wkt.Wkt.ingest
                 * @instance
                 */
                multipolygon: function (str) {
                    var i, components, polygon, polygons;
                    components = [];
                    polygons = trim(str).split(regExes.doubleParenComma);
                    for (i = 0; i < polygons.length; i += 1) {
                        polygon = polygons[i].replace(regExes.trimParens, '$1');
                        components.push(ingest.polygon.apply(this, [polygon]));
                    }
                    return components;
                },

                /**
                 * Return an array of features given a geometrycollection WKT fragment.
                 * @param   str {String}    A WKT fragment representing the geometry collection
                 * @memberof this.Wkt.Wkt.ingest
                 * @instance
                 */
                geometrycollection: function (str) {
                    console.log('The geometrycollection WKT type is not yet supported.');
                }

            };

            var componentWrap;

            var matches;
            matches = regExes.typeStr.exec(str);
            if (matches) {
                var type = matches[1].toLowerCase();
                var base = matches[2];
                if (ingest[type]) {
                    var components = ingest[type].apply(this, [base]);
                    var componentWrap = {
                        "components": components,
                        "type": type,
                        "base": base
                    }

                }

            } else {
                if (regExes.crudeJson.test(str)) {
                    if (typeof JSON === 'object' && typeof JSON.parse === 'function') {
                        this.fromJson(JSON.parse(str));

                    } else {
                        console.log('JSON.parse() is not available; cannot parse GeoJSON strings');
                        throw {
                            name: 'JSONError',
                            message: 'JSON.parse() is not available; cannot parse GeoJSON strings'
                        };
                    }

                } else {
                    console.log('Invalid WKT string provided to read()');
                    throw {
                        name: 'WKTError',
                        message: 'Invalid WKT string provided to read()'
                    };
                }
            }

            return componentWrap;
        },

        convertComponentWrapToGeometry: function (componentWrap) {
            var construct = {
                /**
                 * Creates the framework's equivalent point geometry object.
                 * @param   config      {Object}    An optional properties hash the object should use
                 * @param   component   {Object}    An optional component to build from
                 * @return              {esri.geometry.Point}
                 */
                point: function (config, component) {
                    var coord = component || componentWrap.components;
                    if (coord instanceof Array) {
                        coord = coord[0];
                    }

                    if (config) {
                        // Allow the specification of a coordinate system
                        coord.spatialReference = config.spatialReference || config.srs;
                    }

                    return new Point(coord);
                },

                /**
                 * Creates the framework's equivalent multipoint geometry object.
                 * @param   config  {Object}    An optional properties hash the object should use
                 * @return          {esri.geometry.Multipoint}
                 */
                multipoint: function (config) {
                    config = config || {};
                    if (!config.spatialReference && config.srs) {
                        config.spatialReference = config.srs;
                    }

                    return new this.Multipoint({
                        // Create an Array of [x, y] coords from each point among the components
                        points: componentWrap.components.map(function (i) {
                            if (isArray(i)) {
                                i = i[0]; // Unwrap coords
                            }
                            return [i.x, i.y];
                        }),
                        spatialReference: config.spatialReference
                    });
                },

                /**
                 * Creates the framework's equivalent linestring geometry object.
                 * @param   config      {Object}    An optional properties hash the object should use
                 * @return              {esri.geometry.Polyline}
                 */
                linestring: function (config) {
                    config = config || {};
                    if (!config.spatialReference && config.srs) {
                        config.spatialReference = config.srs;
                    }

                    return new Polyline({
                        // Create an Array of paths...
                        paths: [
                            componentWrap.components.map(function (i) {
                                return [i.x, i.y];
                            })
                        ],
                        spatialReference: config.spatialReference
                    });
                },

                /**
                 * Creates the framework's equivalent multilinestring geometry object.
                 * @param   config      {Object}    An optional properties hash the object should use
                 * @return              {esri.geometry.Polyline}
                 */
                multilinestring: function (config) {
                    config = config || {};
                    if (!config.spatialReference && config.srs) {
                        config.spatialReference = config.srs;
                    }

                    return new Polyline({
                        // Create an Array of paths...
                        paths: componentWrap.components.map(function (i) {
                            // ...Within which are Arrays of coordinate pairs (vertices)
                            return i.map(function (j) {
                                return [j.x, j.y];
                            });
                        }),
                        spatialReference: config.spatialReference
                    });
                },

                /**
                 * Creates the framework's equivalent polygon geometry object.
                 * @param   config      {Object}    An optional properties hash the object should use
                 * @return              {esri.geometry.Polygon}
                 */
                polygon: function (config) {
                    config = config || {};
                    if (!config.spatialReference && config.srs) {
                        config.spatialReference = config.srs;
                    }

                    return new Polygon({
                        // Create an Array of rings...
                        rings: componentWrap.components.map(function (i) {
                            // ...Within which are Arrays of coordinate pairs (vertices)
                            return i.map(function (j) {
                                return [j.x, j.y];
                            });
                        }),
                        spatialReference: config.spatialReference
                    });
                },

                /**
                 * Creates the framework's equivalent multipolygon geometry object.
                 * @param   config      {Object}    An optional properties hash the object should use
                 * @return              {esri.geometry.Polygon}
                 */
                multipolygon: function (config) {
                    var that = this;
                    config = config || {};
                    if (!config.spatialReference && config.srs) {
                        config.spatialReference = config.srs;
                    }

                    return new Polygon({
                        // Create an Array of rings...
                        rings: (function () {
                            var i, j, holey, newRings, rings;

                            holey = false; // Assume there are no inner rings (holes)
                            rings = that.componentWrap.components.map(function (i) {
                                // ...Within which are Arrays of (outer) rings (polygons)
                                var rings = i.map(function (j) {
                                    // ...Within which are (possibly) Arrays of (inner) rings (holes)
                                    return j.map(function (k) {
                                        return [k.x, k.y];
                                    });
                                });

                                holey = (rings.length > 1);

                                return rings;
                            });

                            if (!holey && rings[0].length > 1) { // Easy, if there are no inner rings (holes)
                                // But we add the second condition to check that we're not too deeply nested
                                return rings;
                            }

                            newRings = [];
                            for (i = 0; i < rings.length; i += 1) {
                                if (rings[i].length > 1) {
                                    for (j = 0; j < rings[i].length; j += 1) {
                                        newRings.push(rings[i][j]);
                                    }
                                } else {
                                    newRings.push(rings[i][0]);
                                }
                            }

                            return newRings;

                        }()),
                        spatialReference: config.spatialReference
                    });
                }

            };

            var obj = construct[componentWrap.type].call(null,componentWrap.components);
            return obj;
        },


        convertGeometryToComponents: function(geometry){
            var i, j, paths, rings, verts;

            // esri.geometry.Point /////////////////////////////////////////////////////
            if (geometry.type === 'point') {

                return {
                    type: 'point',
                    components: [{
                        x: geometry.x,
                        y: geometry.y
                    }]
                };

            }

            // esri.geometry.Multipoint ////////////////////////////////////////////////
            if (geometry.type === 'multipoint') {

                verts = [];
                for (i = 0; i < geometry.points.length; i += 1) {
                    verts.push([{
                        x: geometry.points[i][0],
                        y: geometry.points[i][1]
                    }]);
                }

                return {
                    type: 'multipoint',
                    components: verts
                };

            }

            // esri.geometry.Polyline //////////////////////////////////////////////////
            if (geometry.type === 'polyline') {

                paths = [];
                for (i = 0; i < geometry.paths.length; i += 1) {
                    verts = [];
                    for (j = 0; j < geometry.paths[i].length; j += 1) {
                        verts.push({
                            x: geometry.paths[i][j][0], // First item is longitude, second is latitude
                            y: geometry.paths[i][j][1]
                        });
                    }
                    paths.push(verts);
                }

                if (geometry.paths.length > 1) { // More than one path means more than one linestring
                    return {
                        type: 'multilinestring',
                        components: paths
                    };
                }

                return {
                    type: 'linestring',
                    components: verts
                };

            }

            // esri.geometry.Polygon ///////////////////////////////////////////////////
            if (geometry.type === 'polygon' || geometry.type === 'circle') {

                rings = [];
                for (i = 0; i < geometry.rings.length; i += 1) {
                    verts = [];

                    for (j = 0; j < geometry.rings[i].length; j += 1) {
                        verts.push({
                            x: geometry.rings[i][j][0], // First item is longitude, second is latitude
                            y: geometry.rings[i][j][1]
                        });
                    }

                    if (i > 0) {
                        if (this.isInnerRingOf(verts, rings[rings.length - 1], geometry.spatialReference)) {
                            rings[rings.length - 1].push(verts);
                        } else {
                            rings.push([verts]);
                        }
                    } else {
                        rings.push([verts]);
                    }

                }

                if (rings.length > 1) {
                    return {
                        type: 'multipolygon',
                        components: rings
                    };
                }

                return {
                    type: 'polygon',
                    components: rings[0]
                };

            }
        },

        isInnerRingOf: function (ring1, ring2, srs) {
            var contained, i, ply, pnt;

            // Though less common, we assume that the first ring is an inner ring of the
            //  second as this is a stricter case (all vertices must be contained);
            //  we'll test this against the contrary where at least one vertex of the
            //  first ring is not contained by the second ring (ergo, not an inner ring)
            contained = true;

            ply = new Polygon({ // Create single polygon from second ring
                rings: ring2.map(function (i) {
                    // ...Within which are Arrays of coordinate pairs (vertices)
                    return i.map(function (j) {
                        return [j.x, j.y];
                    });
                }),
                spatialReference: srs
            });

            for (i = 0; i < ring1.length; i += 1) {
                // Sample a vertex of the first ring
                pnt = new Point(ring1[i].x, ring1[i].y, srs);

                // Now we have a test for inner rings: if the second ring does not
                //  contain every vertex of the first, then the first ring cannot be
                //  an inner ring of the second
                if (!ply.contains(pnt)) {
                    contained = false;
                    break;
                }
            }

            return contained;
        },

        convertComponentsToWkt: function (components) {
            var delimiter = ' ';

            var extract = {

                point: function (point) {
                    return String(point.x) + delimiter + String(point.y);
                },

                multipoint: function (multipoint) {
                    var i, parts = [],
                        s;

                    for (i = 0; i < multipoint.length; i += 1) {
                        s = extract.point.apply(this, [multipoint[i]]);

                        if (this.wrapVertices) {
                            s = '(' + s + ')';
                        }

                        parts.push(s);
                    }

                    return parts.join(',');
                },

                linestring: function (linestring) {
                    // Extraction of linestrings is the same as for points
                    return extract.point.apply(this, [linestring]);
                },

                multilinestring: function (multilinestring) {
                    var i, parts = [];

                    if (multilinestring.length) {
                        for (i = 0; i < multilinestring.length; i += 1) {
                            parts.push(extract.linestring.apply(this, [multilinestring[i]]));
                        }
                    } else {
                        parts.push(extract.point.apply(this, [multilinestring]));
                    }

                    return parts.join(',');
                },

                polygon: function (polygon) {
                    // Extraction of polygons is the same as for multilinestrings
                    return extract.multilinestring.apply(this, [polygon]);
                },

                multipolygon: function (multipolygon) {
                    var i, parts = [];
                    for (i = 0; i < multipolygon.length; i += 1) {
                        parts.push('(' + extract.polygon.apply(this, [multipolygon[i]]) + ')');
                    }
                    return parts.join(',');
                },

                box: function (box) {
                    return this.linestring.apply(this, [box]);
                },

                geometrycollection: function (str) {
                    console.log('The geometrycollection WKT type is not yet supported.');
                }
            };

            var i, pieces, data;
            var type = components.type;

            components = components.components;

            pieces = [];

            pieces.push(type.toUpperCase() + '(');

            for (i = 0; i < components.length; i += 1) {
                if (this.isCollection(type) && i > 0) {
                    pieces.push(',');
                }

                // There should be an extract function for the named type
                if (!extract[type]) {
                    return null;
                }

                data = extract[type].apply(this, [components[i]]);
                if (this.isCollection(type) && this.type !== 'multipoint') {
                    pieces.push('(' + data + ')');

                } else {
                    pieces.push(data);

                    // If not at the end of the components, add a comma
                    if (i !== (components.length - 1) && this.type !== 'multipoint') {
                        pieces.push(',');
                    }

                }
            }

            pieces.push(')');

            return pieces.join('');
        },

        isCollection: function (type) {
            switch (type.slice(0, 5)) {
                case 'multi':
                    // Trivial; any multi-geometry is a collection
                    return true;
                case 'polyg':
                    // Polygons with holes are "collections" of rings
                    return true;
                default:
                    // Any other geometry is not a collection
                    return false;
            }
        },


        convertExtentToWkt: function(extent){
            var rectanglePolygon = new Polygon(extent.spatialReference);
            rectanglePolygon.addRing(
                [
                    [extent.xmin,extent.ymin],//bottom left
                    [extent.xmin,extent.ymax],//top left
                    [extent.xmax,extent.ymax],//top right
                    [extent.xmax,extent.ymin],//bottom right
                    [extent.xmin,extent.ymin]// back to bottom left
                ]
            );

            var rectangleComponents = this.convertGeometryToComponents(rectanglePolygon);
            return this.convertComponentsToWkt(rectangleComponents);

        }

    });
});
