define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/on",
    "dojo/request/xhr",
    "dojo/dom",
    "dojo/dom-construct",
    "dojo/dom-class",
    "dojo/dom-attr",
    "dojo/dom-style",
    "dojo/topic",
    "dojo/query",
    "dijit/registry",
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    'dojo/text!./templates/TreeListLeafItem.html',
    "jpl/config/Config",
    "jpl/data/Layers",
    "jpl/events/LayerEvent",
    "jpl/events/BrowserEvent",
    "jpl/events/MapEvent",
    "jpl/utils/MapUtil",
    "jpl/utils/IndexerUtil",
    "jpl/utils/AnimationUtil",
    "dijit/form/HorizontalSlider",
    "dijit/form/HorizontalRule",
    "dijit/form/HorizontalRuleLabels",
    "dojox/charting/widget/Legend",
    "jpl/dijit/ColorLegendControl",
    "esri/layers/GraphicsLayer",
    "esri/InfoTemplate"
], function (declare, lang, on, xhr, dom, domConstruct, domClass, domAttr, domStyle, topic, query, registry, _WidgetBase,
             _TemplatedMixin, template, Config, Layers, LayerEvent, BrowserEvent, MapEvent, MapUtil, IndexerUtil, AnimationUtil,
             HorizontalSlider, HorizontalRule, HorizontalRuleLabels, Legend, ColorLegendControl, GraphicsLayer, InfoTemplate) {
    return declare([_WidgetBase, _TemplatedMixin], {
            templateString: template,
            treeSidebar: null,
            treeListItem: null,
            imgUrl: "",
            isContentsCollapsed: true,
            mapDijit: "",
            parentItem: null,

            constructor: function(treeListItem){
                this.treeListItem = treeListItem;
            },
            
            startup: function(){
                this.mapDijit = registry.byId("mainSearchMap");
                this.indexerUtil = new IndexerUtil();
                this.config = Config.getInstance();
                this.layersInstance = Layers.getInstance();

                this.title.innerHTML = this.treeListItem.title;


                if (this.treeListItem.img != undefined && this.treeListItem.img != "") {
                    var imgUrl = this.treeListItem.img.substring(0, this.treeListItem.img.lastIndexOf(".")) +
                        "-thm" + this.treeListItem.img.substring(this.treeListItem.img.lastIndexOf("."),
                            (this.treeListItem.img.length));

                    domAttr.set(this.img, "src", imgUrl);
                    domClass.remove(this.img, "hidden");
                    domClass.add(this.imageIcon, "hidden");
                } else {
                    domClass.remove(this.imageIcon, "hidden");
                    domClass.add(this.imageIcon, "fa fa-thumb-tack fa-3x");
                    domClass.add(this.img, "hidden");
                }

                this.description.innerHTML = this.treeListItem.description;

                this.setListeners();
            },

            setListeners: function(){
                on(this.checkbox, "click", lang.hitch(this, this.checkboxClicked));
            },


            checkboxClicked: function(){
                this.handleItem(this.checkbox.checked);
                if (this.parentItem){
                    this.parentItem.showCorrespondingCheckMarker();
                }
            },

            handleItem: function(isChecked){
                this.checkbox.indeterminate = false;
                this.checkbox.checked = isChecked;

                if (this.treeListItem.nodeType === "featureItem") {
                    if(isChecked){
                        this.addFeatureItemToMap(this.treeListItem);
                    }
                    else{
                        this.removeFeatureItemFromMap(this.treeListItem);
                    }
                }

            },

            getMap: function(projection) {
                var map;
                if(projection === this.config.projection.EQUIRECT) {
                    map = this.mapDijit.equirectMap;
                } else if(projection === this.config.projection.N_POLE) {
                    map = this.mapDijit.northPoleMap;
                } else if(projection === this.config.projection.S_POLE) {
                    map = this.mapDijit.southPoleMap;
                }

                return map;
            },


            addFeatureItemToMap: function(treeItem){
                var projection = this.config.data.projections.equirect;
                var pointString = treeItem.shape;
                var beginIndex = this.indexOfInString(pointString, "(", 1);
                var endIndex = this.indexOfInString(pointString, ")", 1);
                pointString = pointString.slice(beginIndex + 1, endIndex);
                var x = pointString.trim().split(" ")[0];
                var y = pointString.trim().split(" ")[1];

                this.addPointGraphic(x,y,projection, treeItem.color);
            },

            removeFeatureItemFromMap: function(treeItem){
                var projection = this.config.data.projections.equirect;
                this.removePointGraphic(projection);
            },

            addPointGraphic: function(x, y, projection, color) {
                var map = this.getMap(projection);

                if(!this.pointLayer) {
                    this.pointLayer = new GraphicsLayer();

                    var infoTemplate = new InfoTemplate();
                    infoTemplate.setTitle("Feature");
                    infoTemplate.setContent(this.getTextContent);

                    this.pointLayer.setInfoTemplate(infoTemplate);
                    map.addLayer(this.pointLayer);

                    var title = this.parentItem.treeListItem.title;
                    var path;

                    console.log("TREE LIST ITEM PARENT title", title);
                    if(title === "Chaotic Terrain"){
                        path = "M768 1408q209 0 385.5 -103t279.5 -279.5t103 -385.5t-103 -385.5t-279.5 -279.5t-385.5 -103t-385.5 103t-279.5 279.5t-103 385.5t103 385.5t279.5 279.5t385.5 103zM896 161v190q0 14 -9 23.5t-22 9.5h-192q-13 0 -23 -10t-10 -23v-190q0 -13 10 -23t23 -10h192 q13 0 22 9.5t9 23.5zM894 505l18 621q0 12 -10 18q-10 8 -24 8h-220q-14 0 -24 -8q-10 -6 -10 -18l17 -621q0 -10 10 -17.5t24 -7.5h185q14 0 23.5 7.5t10.5 17.5z";
                    }
                    if(title === "Vocanoes"){
                        path = "M 50,5 95,97.5 5,97.5 z";
                    }
                    if(title === "Canyons"){
                        path = "M1482 486q46 -26 59.5 -77.5t-12.5 -97.5l-64 -110q-26 -46 -77.5 -59.5t-97.5 12.5l-266 153v-307q0 -52 -38 -90t-90 -38h-128q-52 0 -90 38t-38 90v307l-266 -153q-46 -26 -97.5 -12.5t-77.5 59.5l-64 110q-26 46 -12.5 97.5t59.5 77.5l266 154l-266 154 q-46 26 -59.5 77.5t12.5 97.5l64 110q26 46 77.5 59.5t97.5 -12.5l266 -153v307q0 52 38 90t90 38h128q52 0 90 -38t38 -90v-307l266 153q46 26 97.5 12.5t77.5 -59.5l64 -110q26 -46 12.5 -97.5t-59.5 -77.5l-266 -154z";
                    }
                    if(title === "Outflow Channel"){
                        path = "M1536 1344v-1408q0 -26 -19 -45t-45 -19h-1408q-26 0 -45 19t-19 45v1408q0 26 19 45t45 19h1408q26 0 45 -19t19 -45z";
                    }
                    if(title === "Valley"){
                        path = "M1403 1241q17 -41 -14 -70l-493 -493v-742q0 -42 -39 -59q-13 -5 -25 -5q-27 0 -45 19l-256 256q-19 19 -19 45v486l-493 493q-31 29 -14 70q17 39 59 39h1280q42 0 59 -39z";
                    }
                    if(title === "Craters"){
                        path = "M1024 640q0 -106 -75 -181t-181 -75t-181 75t-75 181t75 181t181 75t181 -75t75 -181zM1152 640q0 159 -112.5 271.5t-271.5 112.5t-271.5 -112.5t-112.5 -271.5t112.5 -271.5t271.5 -112.5t271.5 112.5t112.5 271.5zM1280 640q0 -212 -150 -362t-362 -150t-362 150 t-150 362t150 362t362 150t362 -150t150 -362zM1408 640q0 130 -51 248.5t-136.5 204t-204 136.5t-248.5 51t-248.5 -51t-204 -136.5t-136.5 -204t-51 -248.5t51 -248.5t136.5 -204t204 -136.5t248.5 -51t248.5 51t204 136.5t136.5 204t51 248.5zM1536 640 q0 -209 -103 -385.5t-279.5 -279.5t-385.5 -103t-385.5 103t-279.5 279.5t-103 385.5t103 385.5t279.5 279.5t385.5 103t385.5 -103t279.5 -279.5t103 -385.5z";
                    }
                    if(title === "Craters"){
                        path = "M1024 640q0 -106 -75 -181t-181 -75t-181 75t-75 181t75 181t181 75t181 -75t75 -181zM1152 640q0 159 -112.5 271.5t-271.5 112.5t-271.5 -112.5t-112.5 -271.5t112.5 -271.5t271.5 -112.5t271.5 112.5t112.5 271.5zM1280 640q0 -212 -150 -362t-362 -150t-362 150 t-150 362t150 362t362 150t362 -150t150 -362zM1408 640q0 130 -51 248.5t-136.5 204t-204 136.5t-248.5 51t-248.5 -51t-204 -136.5t-136.5 -204t-51 -248.5t51 -248.5t136.5 -204t204 -136.5t248.5 -51t248.5 51t204 136.5t136.5 204t51 248.5zM1536 640 q0 -209 -103 -385.5t-279.5 -279.5t-385.5 -103t-385.5 103t-279.5 279.5t-103 385.5t103 385.5t279.5 279.5t385.5 103t385.5 -103t279.5 -279.5t103 -385.5z";
                    }
                    if(title === "Channels"){
                        path = "M1760 640q0 -176 -68.5 -336t-184 -275.5t-275.5 -184t-336 -68.5t-336 68.5t-275.5 184t-184 275.5t-68.5 336q0 213 97 398.5t265 305.5t374 151v-228q-221 -45 -366.5 -221t-145.5 -406q0 -130 51 -248.5t136.5 -204t204 -136.5t248.5 -51t248.5 51t204 136.5 t136.5 204t51 248.5q0 230 -145.5 406t-366.5 221v228q206 -31 374 -151t265 -305.5t97 -398.5z";
                    }
                    if(title === "Ice"){
                        path = ""
                    }
                    this.graphicPoint = MapUtil.prototype.createGraphicMarkerPoint(x, y, map, color, path);

                    var attributes = {
                        "graphicType": "treeLeafGraphic",
                        "description": this.treeListItem.description,
                        "img": this.treeListItem.img,
                        "item_UUID": this.treeListItem.item_UUID,
                        "nodeType": this.treeListItem.nodeType,
                        "title": this.treeListItem.title
                    }

                    this.graphicPoint.setAttributes(attributes);

                    map.reorderLayer(this.pointLayer, 0);
                }

                this.pointLayer.add(this.graphicPoint);
            },

            removePointGraphic: function(projection) {
                if(this.pointLayer){
                    var map = this.getMap(projection);
                    map.removeLayer(this.pointLayer);
                    this.graphicPoint = null;
                    this.pointLayer = null;
                }
            },

            indexOfInString: function(str, m, i) {
                return str.split(m, i).join(m).length;
            },

            setParent: function(parentItem){
                this.parentItem = parentItem;
            },

            getTextContent: function(graphic){
                var attr = graphic.attributes;

                var content = '<table width="100%" class="nomenclature-info">';
                content += '<tr><th>Name:</th><td>' + attr.title + '</td></tr>';
                content += "</table>";
                if (attr.img != undefined) {
                    var imagePath = attr.img.substring(0, attr.img.lastIndexOf(".")) + "-ci" + attr.img.substring(attr.img.lastIndexOf("."), (attr.img.length));
                    content += "<img src='" + imagePath + "'>";
                }
                content += '<p class="popupButtonContainerP"><button type="button" value="' + attr.item_UUID + '" class="btn btn-link popupTreeListItemInSidebarBtn">More</button></p>';

                return content;
            }

});

});

