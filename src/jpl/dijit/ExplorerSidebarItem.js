define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/query",
    "dojo/parser",
    "dojo/on",
    "dojo/mouse",
    "dojo/has",
    "dojo/topic",
    "dojo/dom-class",
    "dojo/dom-attr",
    "dojo/dom-construct",
    "dojo/request/xhr",
    "dijit/registry",
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    "jpl/events/NavigationEvent",
    "jpl/events/MapEvent",
    "jpl/utils/MapUtil",
    "jpl/utils/IndexerUtil",
    "dijit/layout/StackContainer",
    "dijit/layout/ContentPane",
    "jpl/utils/FeatureDetector",
    "jpl/config/Config",
    'dojo/text!./templates/ExplorerSidebarItem.html'
], function (declare, lang, query, parser, on, mouse, has, topic, domClass, domAttr, domConstruct, xhr, registry, _WidgetBase, _TemplatedMixin,
             NavigationEvent, MapEvent, MapUtil, IndexerUtil, StackContainer, ContentPane, FeatureDetector, Config, template) {
    return declare([_WidgetBase, _TemplatedMixin], {
        templateString: template,
        widgetsInTemplate: false,
        doc: null,
        explorerSidebar: null,

        constructor: function (doc) {
            this.doc = doc;
        },

        startup: function () {
            this.indexerUtil = new IndexerUtil();
            this.mapDijit = registry.byId("mainSearchMap");
            this.config = Config.getInstance();
            var self = this;

            topic.subscribe(MapEvent.prototype.REMOVE_ALL_EXPLORER_GRAPHICS, lang.hitch(this, this.destroyPolygonGraphic));

            if(this.doc.itemType === "product"){
                this.labelText.innerHTML = this.doc.title;
                if (this.doc.productType == "DEM") {
                    domClass.add(this.icon, "hidden");
                    domClass.add(this.image, "hidden");
                    domClass.add(this.itemContainer, "explorerQueueIconItem");
                    domClass.add(this.imageIcon, "fa fa-file fa-5x");
                } else {
                    domClass.add(this.icon, "icon-layers3");
                    var thumbnailUrl = this.indexerUtil.createThumbnailUrl(this.doc.thumbnailURLDir,"200");
                    domAttr.set(this.image, "src", thumbnailUrl);
                    domClass.add(this.imageIcon, "hidden");
                }
            } else if(this.doc.itemType === "nomenclature"){
                this.labelText.innerHTML = this.doc.title;

                domClass.add(this.icon, "hidden");
                domClass.add(this.image, "hidden");
                domClass.add(this.itemContainer, "explorerQueueIconItem");
                domClass.add(this.imageIcon, "fa fa-flag fa-5x");

            } else if(this.doc.itemType === "bookmark"){
                this.labelText.innerHTML = this.doc.title;

                domClass.add(this.icon, "hidden");
                domClass.add(this.image, "hidden");
                domClass.add(this.itemContainer, "explorerQueueIconItem");
                domClass.add(this.imageIcon, "fa fa-bookmark fa-5x");

            } else if (this.doc.itemType === "feature" || this.doc.itemType === "manifest") {
                this.labelText.innerHTML = this.doc.title;

                if (this.doc.thumbnailURLDir != undefined && this.doc.thumbnailURLDir != "") {
                    var thumbnailUrl = this.indexerUtil.createThumbnailUrl2(this.doc.thumbnailURLDir, "-ci");
                    domAttr.set(this.image, "src", thumbnailUrl);
                    domClass.add(this.imageIcon, "hidden");
                    domClass.add(this.icon, "fa fa-thumb-tack");
                } else {
                    domClass.add(this.imageIcon, "fa fa-thumb-tack fa-5x");
                    domClass.add(this.image, "hidden");
                    domClass.add(this.icon, "hidden");
                }


            } else if (this.doc.itemType === "slideshow") {
                this.labelText.innerHTML = this.doc.title;
                if (this.doc.hasAttach) {
                    var attachmentURL = this.indexerUtil.createGetAttachmentsUrl(this.doc.item_UUID);
                    xhr(attachmentURL, {
                        handleAs: "json",
                        headers: {
                            "X-Requested-With": null
                        }
                    }).then(function (attachment) {
                        if(attachment !== null) {
                            var docs = attachment.response.docs;
                            if (docs.length > 0) {
                                var ungUrl = docs[0].imgURL;
                                imgUrl = imgUrl.slice(0, imgUrl.lastIndexOf(".")) + "-thm" + imgUrl.slice(imgUrl.lastIndexOf("."), imgUrl.length);

                                domAttr.set(self.image, "src", ungUrl);
                            } else {
                                console.log("ERROR: the attachment does not exist in indexer");
                            }
                        }
                    }, function (err) {
                        console.log("error retrieving attachment results:" + err);
                    });
                    domClass.add(this.imageIcon, "hidden");
                    domClass.add(this.icon, "fa fa-image");
                } else {
                    domClass.add(this.image, "hidden");
                    domClass.add(this.icon, "hidden");
                    domClass.add(this.itemContainer, "explorerQueueIconItem");
                    domClass.add(this.imageIcon, "fa fa-image fa-5x");
                }

            }


            on(this, "click", lang.hitch(this, this.showThisInSidebar));
            on(this.domNode, mouse.enter, lang.hitch(this, this.hoverOverItem));
            on(this.domNode, mouse.leave, lang.hitch(this, this.hoverOffItem));
        },

        setExplorerSidebar: function(explorerSidebar){
            this.explorerSidebar = explorerSidebar;
        },

        showThisInSidebar: function(evt){
            this.hoverOffItem({});
            this.explorerSidebar.showExplorerItemDoc(this.doc);
        },

        hoverOverItem: function(evt){
            if(this.doc.itemType === "product" || this.doc.itemType === "bookmark") {
                var projection = this.doc.dataProjection;
                var map = this.getMap(projection);
                var spatialReference = map.spatialReference;

                var polygonString = this.doc.shape;
                var beginIndex = this.indexOfInString(polygonString, "(", 2);
                var endIndex = this.indexOfInString(polygonString, ")", 1);
                polygonString = polygonString.slice(beginIndex + 1, endIndex);

                var rawRings = polygonString.split(",");

                var midRing = [];
                for (var i = 0; i < rawRings.length; i++) {
                    var innerRing = [];
                    var x = rawRings[i].trim().split(" ")[0];
                    var y = rawRings[i].trim().split(" ")[1];
                    innerRing.push(x);
                    innerRing.push(y);
                    midRing.push(innerRing);
                }
                var rings = [];
                rings.push(midRing);

                var polygonJson = {"rings": rings, "spatialReference": spatialReference};

                this.addPolygonGraphic(polygonJson, projection);

                var polygonArray = this.doc.bbox.split(",");

                if(projection === this.config.projection.EQUIRECT){
                    topic.publish(MapEvent.prototype.ADD_EXPLORER_HIGH_LIGHT_POLYGON, {"degreeArray": polygonArray, "type":"rectangle"});
                }

            } else if(this.doc.itemType === "nomenclature"){
                var projection = this.doc.dataProjection;
                var pointString = this.doc.shape;
                var beginIndex = this.indexOfInString(pointString, "(", 1);
                var endIndex = this.indexOfInString(pointString, ")", 1);
                pointString = pointString.slice(beginIndex + 1, endIndex);
                var x = pointString.trim().split(" ")[0];
                var y = pointString.trim().split(" ")[1];

                this.addPointGraphic(x,y,projection);
                if(projection === this.config.projection.EQUIRECT) {
                    topic.publish(MapEvent.prototype.ADD_EXPLORER_HIGH_LIGHT_POLYGON, {
                        "degreeArray": {"x": x, "y": y},
                        "type": "point"
                    });
                }
            } else if(this.doc.itemType === "feature" || this.doc.itemType === "manifest"){
                var pointString = this.doc.shape;
                var beginIndex = this.indexOfInString(pointString, "(", 1);
                var endIndex = this.indexOfInString(pointString, ")", 1);
                pointString = pointString.slice(beginIndex + 1, endIndex);
                var x = pointString.trim().split(" ")[0];
                var y = pointString.trim().split(" ")[1];

                this.addPointGraphic(x,y,projection);
            }

        },

        hoverOffItem: function(evt){
            var projection = this.doc.dataProjection;

            if(this.doc.itemType === "product" || this.doc.itemType === "bookmark") {
                this.removePolygonGraphic(projection);
                if (projection === this.config.projection.EQUIRECT) {
                    topic.publish(MapEvent.prototype.REMOVE_EXPLORER_HIGH_LIGHT_POLYGON, {});
                }
            }
            if(this.doc.itemType === "nomenclature") {
                this.removePointGraphic(projection);
                if (projection === this.config.projection.EQUIRECT) {
                    topic.publish(MapEvent.prototype.REMOVE_EXPLORER_HIGH_LIGHT_POLYGON, {});
                }
            }
            if(this.doc.itemType === "feature" || this.doc.itemType === "manifest"){
                this.removePointGraphic(projection);
                if (projection === this.config.projection.EQUIRECT) {
                    topic.publish(MapEvent.prototype.REMOVE_EXPLORER_HIGH_LIGHT_POLYGON, {});
                }
            }
        },

        indexOfInString: function(str, m, i) {
            return str.split(m, i).join(m).length;
        },

        addPolygonGraphic: function(polygonJson, projection) {
            var map = this.getMap(projection);

            if(this.graphicPoint) {
                map.graphics.remove(this.graphicPoint);
            }

            this.graphicPoint = MapUtil.prototype.createGraphicMarkerPolygon(polygonJson, map);

            map.graphics.add(this.graphicPoint);
        },

        removePolygonGraphic: function(projection) {
            if(this.graphicPoint) {
                var map = this.getMap(projection);
                map.graphics.remove(this.graphicPoint);
                this.graphicPoint = null;
            }
        },

        destroyPolygonGraphic: function(){
            if(this.graphicPoint) {
                var projection = this.doc.dataProjection;
                var map = this.getMap(projection);
                map.graphics.remove(this.graphicPoint);
                this.graphicPoint = null;
            }
        },

        addPointGraphic: function(x, y, projection) {
            var map = this.getMap(projection);

            if(this.graphicPoint) {
                map.graphics.remove(this.graphicPoint);
            }

            this.graphicPoint = MapUtil.prototype.createGraphicMarkerPoint(x, y, map);

            map.graphics.add(this.graphicPoint);
        },

        removePointGraphic: function(projection) {
            if(this.graphicPoint) {
                var map = this.getMap(projection);
                map.graphics.remove(this.graphicPoint);
                this.graphicPoint = null;
            }
        },

        getMap: function(projection) {
            var map;
            if (projection === undefined) {
                map = this.mapDijit.currentMap();
            } else if(projection === this.config.projection.EQUIRECT) {
                map = this.mapDijit.equirectMap;
            } else if(projection === this.config.projection.N_POLE) {
                map = this.mapDijit.northPoleMap;
            } else if(projection === this.config.projection.S_POLE) {
                map = this.mapDijit.southPoleMap;
            }

            return map;
        }

    });
});