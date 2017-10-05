define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/on",
    "dojo/query",
    "dojo/topic",
    "dojo/request/xhr",
    "dojo/window",
    "dojo/dom-class",
    "dojo/dom-construct",
    "dijit/registry",
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    "jpl/events/LayerEvent",
    "jpl/events/LoadingEvent",
    "jpl/events/MapEvent",
    "jpl/utils/MapUtil",
    "jpl/utils/IndexerUtil",
    "jpl/config/Config",
    "jpl/utils/SlideshowJSONConverter",
    "jpl/dijit/ui/SlideShowPlayer",
    "esri/graphicsUtils",
    "bootstrap/Modal",
    'dojo/text!./templates/NomenclatureViewer.html',
    "xstyle/css!./css/NomenclatureViewer.css"
], function (declare, lang, on, query, topic, xhr, win, domClass, domConstruct, registry, _WidgetBase, _TemplatedMixin, LayerEvent,
             LoadingEvent, MapEvent, MapUtil, IndexerUtil, Config, SlideshowJSONConverter, SlideShowPlayer, graphicsUtils, Modal, template) {
    return declare([_WidgetBase, _TemplatedMixin], {
        templateString: template,
        nomenclature: null,
        sidebar: null,
        backButtonListener: null,

        startup: function() {
            this.config = Config.getInstance();
            this.indexerUtil = new IndexerUtil();
            this.mapDijit = registry.byId("mainSearchMap");
            this.setContent();

            backButtonListener = on(this.backButton, "click", lang.hitch(this, this.closeViewer));
            on(this.sideBarLinkClose, "click", lang.hitch(this, this.closeSidebar));
        },

        setNomenclature: function(nomenclature){
            this.nomenclature = nomenclature;
            console.log("nomenclature", nomenclature);
        },

        setSidebar: function(sidebar){
            this.sidebar = sidebar;
        },

        closeViewer: function(evt){
            this.sidebar.showSearchContainer();
            this.removePointGraphic(this.nomenclature.dataProjection);
            backButtonListener.remove();
        },

        setContent: function(){
            var self = this;

            var servicesUrl = this.indexerUtil.createLayerServicesUrl(self.nomenclature.item_UUID);
            xhr(servicesUrl, {
                handleAs: "json",
                headers: {"X-Requested-With": null}
            }).then(function (data) {
                console.log("services data", data);
                var data = data.response.docs[0];

                var fid = self.nomenclature.item_DBID;
                var fieldsObject = self.config.nomenclatureFields;
                var queryText = "";
                var fields = [];
                for(var key in fieldsObject){
                    fields.push(key);
                }
                for(var i=0; i<fields.length;i++){
                    var field = fields[i];
                    if(i === fields.length - 1){
                        queryText = queryText + field;
                    }else{
                        queryText = queryText + field + ",";
                    }
                }

                var queryUrl = data.endPoint + "/query?where=fid=" + fid + "&outFields=" + queryText + "&f=pjson";
                console.log("queryUrl", queryUrl);
                xhr(queryUrl,{
                    handleAs: "json",
                    headers: {"X-Requested-With": null}
                }).then(function(nomenclatureData){
                    console.log("nomenclatureData", nomenclatureData);
                    if(nomenclatureData.features[0]) {
                        var attributeMap = [];
                        var attributes = nomenclatureData.features[0].attributes;
                        for (key in attributes) {
                            attributeMap.push("" + fieldsObject[key] + "");
                            attributeMap.push(attributes[key]);
                        }

                        self.nomenclatureTitle.innerHTML = self.nomenclature.title;
                        var content = '<div class="table-responsive"><table class="table">';
                        content += "<tr><td>Item Type</td><td>Nomenclature</td></tr>";
                        for (var i = 0; i < attributeMap.length; i += 2) {
                            if(attributeMap[i] === "Additional Info"){
                                content = content + "<tr><td>" + attributeMap[i] + "</td><td><a href='" + attributeMap[i + 1] + "' target='_blank'>" + attributeMap[i + 1] + "</a></td></tr>"
                            }else {
                                content = content + "<tr><td>" + attributeMap[i] + "</td><td>" + attributeMap[i + 1] + "</td></tr>"
                            }
                        }
                        content = content + "</table></div>";

                        self.nomenclatureContent.innerHTML = content;

                        var geometry = nomenclatureData.features[0].geometry;
                        self.addPointGraphic(geometry.x, geometry.y, self.nomenclature.dataProjection);
                    }

                },function(err){
                    console.log("error retrieving nomenclature query:" + err);
                });

                if(self.nomenclature.hasAttach){
                    var attachmentUrl = self.indexerUtil.createGetAttachmentsUrl(self.nomenclature.item_UUID);
                    console.log("attachmentUrl", attachmentUrl);
                    xhr(attachmentUrl,{
                        handleAs: "json",
                        headers: {"X-Requested-With": null}
                    }).then(function(attachmentData){
                        console.log("attachmentData", attachmentData);
                        domConstruct.empty(self.nomenclatureAttachmentContent);
                        domConstruct.empty(self.slideshowList);
                        var docs = attachmentData.response.docs;

                        if(docs.length === 1){
                            if(docs[0].slideURL) {
                                domClass.remove(query(self.nomenclatureAttachmentContent)[0], "hidden");
                                domClass.add(query(self.slideshowListContainer)[0], "hidden");
                                var fixedSlideshowJson = SlideshowJSONConverter.prototype.convert(attachmentData.response.docs[0].slideURL);
                                var h = 300;
                                var slideShowPlayer = new SlideShowPlayer(fixedSlideshowJson, h);
                                slideShowPlayer.setViewerHTMLID("nomenclatureViewer");
                                slideShowPlayer.startup();
                            }
                        }
                        if(docs.length > 1){
                            self.createSlideshowList(docs);
                        }

                    },function(err){
                        console.log("error retrieving nomenclature query:" + err);
                    });
                }

            }, function (err) {
                console.log("error retrieving attachment description:" + err);
            });

        },

        createSlideshowList: function(docs){
            var self = this;

            domClass.remove(query(self.slideshowListContainer)[0], "hidden");
            domClass.add(query(self.nomenclatureAttachmentContent)[0], "hidden");

            for(var i = 0; i < docs.length;i++){
                var description = "";
                if(docs[i].desc){
                    description = docs[i].desc;
                }

                var title = docs[i].title;
                var imgUrl = docs[i].imgURL;
                imgUrl = imgUrl.slice(0,imgUrl.lastIndexOf(".")) + "-thm" + imgUrl.slice(imgUrl.lastIndexOf("."), imgUrl.length);
                var slideUrl = docs[i].slideURL;

                var slideshowItem = '<li class="list-group-item slideshowListItem" data-slideurl="' + slideUrl + '">' +
                    '<div class="media" data-slideurl="' + slideUrl + '">' +
                    '<div class="media-left" data-slideurl="' + slideUrl + '">' +
                    '<a href="#" data-slideurl="' + slideUrl + '">' +
                    '<img data-slideurl="' + slideUrl + '" class="media-object slideshowListItemThumbnail" src="' + imgUrl + '" alt="' + title + '">' +
                    '</a>' +
                    '</div>' +
                    '<div class="media-body" data-slideurl="' + slideUrl + '">' +
                    '<h4 class="media-heading" data-slideurl="' + slideUrl + '">' + title + '</h4>' +
                    description +
                    '</div>' +
                    '</div>' +
                '</li>';
                var slideshowItemNode = domConstruct.place(slideshowItem, self.slideshowListContainer);


                on(slideshowItemNode, "click", function (e) {
                    var slideUrl = e.target.dataset.slideurl
                    domClass.remove(query(self.nomenclatureAttachmentContent)[0], "hidden");
                    domClass.add(query(self.slideshowListContainer)[0], "hidden");
                    var fixedSlideshowJson = SlideshowJSONConverter.prototype.convert(slideUrl);
                    var h = 300;
                    var slideShowPlayer = new SlideShowPlayer(fixedSlideshowJson, h);
                    slideShowPlayer.startup();

                    var button = '<button type="button" class="btn btn-default"><span class="glyphicon glyphicon-arrow-left" aria-hidden="true"></span>&nbsp;Slide Show List</button>';
                    var buttonNode = domConstruct.place(button, self.nomenclatureAttachmentContent);

                    on(buttonNode, "click", function(e){
                        domClass.remove(query(self.slideshowListContainer)[0], "hidden");
                        domClass.add(query(self.nomenclatureAttachmentContent)[0], "hidden");
                        domConstruct.empty(self.nomenclatureAttachmentContent);
                    })
                });

            }
        },

        addPointGraphic: function(x, y, projection) {
            var map = this.getMap(projection);

            if(this.graphicPoint) {
                map.graphics.remove(this.graphicPoint);
            }

            this.graphicPoint = MapUtil.prototype.createGraphicMarkerPoint(x, y, map);

            map.graphics.add(this.graphicPoint);

            var self = this;
            setTimeout(function(){
                map.setExtent(self.graphicPoint._extent);

                topic.publish(MapEvent.prototype.GLOBE_SET_CENTER, {
                    "x": self.graphicPoint._extent.getCenter().x,
                    "y": self.graphicPoint._extent.getCenter().y
                });
            }, 500);
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
            if(projection === this.config.projection.EQUIRECT) {
                map = this.mapDijit.equirectMap;
            } else if(projection === this.config.projection.N_POLE) {
                map = this.mapDijit.northPoleMap;
            } else if(projection === this.config.projection.S_POLE) {
                map = this.mapDijit.southPoleMap;
            }

            return map;
        },

        closeSidebar: function(){
            this.sidebar.closeThisSidebar();
        },

        cleanUp: function(){
            this.removePointGraphic(this.nomenclature.dataProjection);
        }
    });
});
