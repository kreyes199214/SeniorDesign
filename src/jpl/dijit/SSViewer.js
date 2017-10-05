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
    "dojo/dom-attr",
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
    'dojo/text!./templates/SSViewer.html',
    "xstyle/css!./css/SSViewer.css"
], function (declare, lang, on, query, topic, xhr, win, domClass, domConstruct, domAttr, registry, _WidgetBase, _TemplatedMixin, LayerEvent, LoadingEvent, MapEvent,
             MapUtil, IndexerUtil, Config, SlideshowJSONConverter, SlideShowPlayer, graphicsUtils, Modal, template) {
    return declare([_WidgetBase, _TemplatedMixin], {
        templateString: template,
        slideshow: null,
        sidebar: null,
        backButtonListener: null,

        startup: function() {
            this.config = Config.getInstance();
            this.indexerUtil = new IndexerUtil();
            this.mapDijit = registry.byId("mainSearchMap");
            this.setContent();

            backButtonListener = on(this.backButton, "click", lang.hitch(this, this.closeViewer));
        },

        setSlideshow: function(slideshow){
            this.slideshow = slideshow;
            console.log("slideshow", slideshow);
        },

        setSidebar: function(sidebar){
            this.sidebar = sidebar;
        },

        closeViewer: function(evt){
            this.sidebar.showSearchContainer();
            this.removePointGraphic(this.slideshow.dataProjection);
            backButtonListener.remove();
        },

        setContent: function(){
            var self = this;
            this.ssTitle.innerHTML = this.slideshow.title;
            var point = this.slideshow.shape.substring(7, this.slideshow.shape.length-1).split(" ");
            this.addPointGraphic(point[0], point[1], this.slideshow.dataProjection);

            //content = content + "</table>";

            //self.nomenclatureContent.innerHTML = content;

            if(this.slideshow.hasAttach){
                var attachmentUrl = this.indexerUtil.createGetAttachmentsUrl(this.slideshow.item_UUID);
                console.log("attachmentUrl", attachmentUrl);
                xhr(attachmentUrl,{
                    handleAs: "json",
                    headers: {"X-Requested-With": null}
                }).then(function(attachmentData){
                    console.log("attachmentData", attachmentData);
                    domConstruct.empty(self.slideshowAttachmentContent);
                    domConstruct.empty(self.slideshowList);
                    var docs = attachmentData.response.docs;

                    if(docs.length === 1){
                        var content = '<table class="table">';
                        content += "<tr><td>Item Type</td><td>Slideshow</td></tr>";
                        content += "<tr><td>Category</td><td>" + self.slideshow.productType + "</td></tr>";

                        if ("mission" in self.slideshow)
                            content += "<tr><td>Mission</td><td>" + self.slideshow.mission + "</td></tr>";
                        content += "</table>";
                        self.ssContent.innerHTML = content;
                        self.description.innerHTML = docs[0].desc;

                        //domAttr.set(self.ssImage, "src", docs[0].imgURL);

                        if(docs[0].slideURL) {
                            domClass.remove(query(self.slideshowAttachmentContent)[0], "hidden");
                            domClass.add(query(self.slideshowListContainer)[0], "hidden");
                            var fixedSlideshowJson = SlideshowJSONConverter.prototype.convert(attachmentData.response.docs[0].slideURL);
                            //var w = 570;
                            var h = 300;
                            var slideShowPlayer = new SlideShowPlayer(fixedSlideshowJson, h);
                            slideShowPlayer.setViewerHTMLID("ssViewer");
                            slideShowPlayer.startup();
                        }
                    }
                    if(docs.length > 1){
                        self.createSlideshowList(docs);
                    }

                },function(err){
                    console.log("error retrieving slideshow query:" + err);
                });
            }
        },

        createSlideshowList: function(docs){
            var self = this;

            domClass.remove(query(self.slideshowListContainer)[0], "hidden");
            domClass.add(query(self.slideshowAttachmentContent)[0], "hidden");

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
                    '</div>'
                '</li>';
                var slideshowItemNode = domConstruct.place(slideshowItem, self.slideshowListContainer);


                on(slideshowItemNode, "click", function (e) {
                    var slideUrl = e.target.dataset.slideurl
                    domClass.remove(query(self.slideshowAttachmentContent)[0], "hidden");
                    domClass.add(query(self.slideshowListContainer)[0], "hidden");
                    var fixedSlideshowJson = SlideshowJSONConverter.prototype.convert(slideUrl);
                    var w = 570;
                    var h = 300;
                    var slideShowPlayer = new SlideShowPlayer(fixedSlideshowJson, w, h);
                    slideShowPlayer.startup();

                    var button = '<button type="button" class="btn btn-default"><span class="glyphicon glyphicon-arrow-left" aria-hidden="true"></span>&nbsp;Slide Show List</button>';
                    var buttonNode = domConstruct.place(button, self.slideshowAttachmentContent);

                    on(buttonNode, "click", function(e){
                        domClass.remove(query(self.slideshowListContainer)[0], "hidden");
                        domClass.add(query(self.slideshowAttachmentContent)[0], "hidden");
                        domConstruct.empty(self.slideshowAttachmentContent);
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
            map.setExtent(this.graphicPoint._extent);
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

        cleanUp: function(){
            this.removePointGraphic(this.slideshow.dataProjection);
        }
    });
});
