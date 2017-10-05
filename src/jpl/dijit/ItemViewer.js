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
    'dojo/text!./templates/ItemViewer.html',
    "xstyle/css!./css/ItemViewer.css"
], function (declare, lang, on, query, topic, xhr, win, domClass, domConstruct, domAttr, registry, _WidgetBase, _TemplatedMixin, LayerEvent, LoadingEvent, MapEvent,
             MapUtil, IndexerUtil, Config, SlideshowJSONConverter, SlideShowPlayer, graphicsUtils, Modal, template) {
    return declare([_WidgetBase, _TemplatedMixin], {
        templateString: template,
        item: null,
        sidebar: null,
        backButtonListener: null,
        projection: null,

        startup: function() {
            this.config = Config.getInstance();
            this.indexerUtil = new IndexerUtil();
            this.mapDijit = registry.byId("mainSearchMap");
            //ALWAYS EQUIRECTANGULAR FOR NOW
            this.projection = this.config.data.projections.equirect;

            this.setContent();

            this.backButtonListener = on(this.backButton, "click", lang.hitch(this, this.closeViewer));
            on(this.sideBarLinkClose, "click", lang.hitch(this, this.closeSidebar));
        },


        setItem: function(item){
            this.item = item;
            console.log("item", item);
        },


        setSidebar: function(sidebar){
            this.sidebar = sidebar;
        },

        closeViewer: function(evt){
            this.sidebar.showSearchContainer();
            this.removePointGraphic(this.projection);
            this.backButtonListener.remove();
        },

        closeSidebar: function(evt){
            this.sidebar.closeThisSidebar();
        },

        cleanUp: function(){
            this.removePointGraphic(this.projection);
        },

        setContent: function(){
            var self = this;

            if (this.item.shape != undefined) {
                var loc = this.item.shape.substring(7, this.item.shape.length - 1).split(" ");
                this.addPointGraphic(loc[0], loc[1]);
            }

            if(this.item.title) {
                this.title.innerHTML = this.item.title;
            }

            if(this.item.description){
                this.description.innerHTML = this.item.description;
            }

            this.itemContent.innerHTML = this.createContent(this.item);

            if(this.item.itemType === "feature"){
                if(this.item.mediaType === "slideshow"){
                    //Type 2
                    this.showSlideshow(this.item.mediaURL);
                }
                else{
                    //Type 1
                    this.showImage(this.item.thumbnailURLDir);
                }
            }
            if(this.item.itemType === "manifest"){
                if(this.item.mediaType === "slideshow"){
                    //Type 4
                    this.showSlideshow(this.item.mediaURL);
                    this.showManifestWithSlideshow(this.item.item_UUID);
                }
                else{
                    //Type 3
                    this.showManifest(this.item.item_UUID);
                }
            }
        },

        showImage: function(thumbUrl){
            if(thumbUrl) {
                var imgUrl = thumbUrl.substring(0, thumbUrl.lastIndexOf(".")) +
                    "-thm" + thumbUrl.substring(thumbUrl.lastIndexOf("."),
                        (thumbUrl.length));
                domClass.remove(this.img, "hidden");
                domAttr.set(this.img, "src", imgUrl);
            }
        },

        createContent: function(doc) {
            var content = '<div class="table-responsive"><table class="table">';
            if (doc.shape != undefined) {
                var loc = doc.shape.substring(7, doc.shape.length-1).split(" ");
                content += "<tr><td>Latitude</td><td>" + loc[1] + "</td></tr>";
                content += "<tr><td>Longitude</td><td>" + loc[0] + "</td></tr>";
            }
            if (doc.mission != undefined) {
                content += "<tr><td>Mission</td><td>" + doc.mission + "</td></tr>";
            }
            if (doc.landforms != undefined) {
                content += "<tr><td>Landforms</td><td>";
                var landformsContent = "";
                for (var i=0; i<doc.landforms.length; i++) {
                    landformsContent += doc.landforms[i] + ", ";
                }
                if (landformsContent.length > 1)
                    landformsContent = landformsContent.substring(0, landformsContent.length-2);
                content += landformsContent;

                content += "</td></tr>";
            }
            //this is for nomenclature metadata

            if (doc.diameter != undefined) {
                content += "<tr><td>Diameter</td><td>" + doc.diameter + "m</td></tr>";
            }
            if (doc.type != undefined) {
                content += "<tr><td>Nomenclature Type</td><td>" + doc.type + "</td></tr>";
            }
            if (doc.ethnicity != undefined) {
                content += "<tr><td>Ethnicity</td><td>" + doc.ethnicity + "</td></tr>";
            }
            if (doc.additionalInfo != undefined) {
                content += "<tr><td>Additional Information</td><td><a href=" + doc.additionalInfo + ">" + doc.additionalInfo + "</a></td></tr>";
            }
            content += "</table></div>";
            return content;
        },

        showSlideshow: function(mediaUrl){
            domClass.remove(query(this.slideshowAttachmentContentContainer)[0], "hidden");
            //domClass.add(query(self.slideshowListContainer)[0], "hidden");

            var fixedSlideshowJson = SlideshowJSONConverter.prototype.convert(mediaUrl);
            //var w = 570;
            var h = 300;
            var slideShowPlayer = new SlideShowPlayer(fixedSlideshowJson, h);
            slideShowPlayer.setViewerHTMLID("ssViewer");
            slideShowPlayer.startup();
        },

        showManifest: function(productLabel){
            var self = this;

            var manifestUrl = this.indexerUtil.createGetManifestByProductLabelUrl(productLabel);
            xhr(manifestUrl,{
                handleAs: "json",
                headers: {"X-Requested-With": null}
            }).then(function(attachmentData){
                console.log("attachmentData", attachmentData);

                domConstruct.empty(self.slideshowAttachmentContent);
                domConstruct.empty(self.slideshowList);
                var docs = attachmentData.response.docs;

                if(docs.length > 0){
                    self.createSlideshowList(docs);
                }


            },function(err){
                console.log("error retrieving slideshow query:" + err);
            });
        },

        createSlideshowList: function(docs){
            var self = this;

            domClass.remove(query(self.slideshowListContainer)[0], "hidden");
            domClass.add(query(self.slideshowAttachmentContentContainer)[0], "hidden");

            for(var i = 0; i < docs.length;i++){
                var description = "";
                if(docs[i].desc){
                    description = docs[i].desc;
                }

                var title = docs[i].title;
                var imgUrl = docs[i].thumbnailURLDir;
                imgUrl = imgUrl.slice(0,imgUrl.lastIndexOf(".")) + "-thm" + imgUrl.slice(imgUrl.lastIndexOf("."), imgUrl.length);
                var slideUrl = docs[i].mediaURL;

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
                    '</div>';
                '</li>';
                var slideshowItemNode = domConstruct.place(slideshowItem, self.slideshowListContainer);


                on(slideshowItemNode, "click", function (e) {
                    var slideUrl = e.target.dataset.slideurl;
                    domClass.remove(query(self.slideshowAttachmentContentContainer)[0], "hidden");
                    domClass.add(query(self.slideshowListContainer)[0], "hidden");
                    var fixedSlideshowJson = SlideshowJSONConverter.prototype.convert(slideUrl);
                    var w = 570;
                    var h = 300;
                    var slideShowPlayer = new SlideShowPlayer(fixedSlideshowJson, w, h);
                    slideShowPlayer.startup();

                    self.backButtonListener.remove();
                    self.backButtonListener = on(self.backButton, "click", lang.hitch(self, self.backToManifestList));
                });

            }
        },

        showManifestWithSlideshow: function(item_UUID){
            var self = this;

            domClass.remove(query(self.slideshowListContainer)[0], "hidden");
            //this should move to the config file.
            var manifestUrl = "http://lmmpdev5:8070/TrekServices/ws/outreach/eq/manifest/" + item_UUID;

            xhr(manifestUrl,{
                handleAs: "json",
                headers: {"X-Requested-With": null}
            }).then(function(attachmentData){
                console.log("attachmentData", attachmentData);

                domConstruct.empty(self.slideshowList);

                var docs = attachmentData.response.docs;

                if(docs.length > 0){
                    self.createSlideshowListWithSlideshow(docs);
                }


            },function(err){
                console.log("error retrieving slideshow query:" + err);
            });
        },

        createSlideshowListWithSlideshow: function(docs){
            var self = this;

            for(var i = 0; i < docs.length;i++){
                var description = "";
                if(docs[i].desc){
                    description = docs[i].desc;
                }

                var title = docs[i].title;
                var imgUrl = docs[i].thumbnailURLDir;
                imgUrl = imgUrl.slice(0,imgUrl.lastIndexOf(".")) + "-thm" + imgUrl.slice(imgUrl.lastIndexOf("."), imgUrl.length);
                var slideUrl = docs[i].mediaURL;

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
                    '</div>';
                '</li>';
                var slideshowItemNode = domConstruct.place(slideshowItem, self.slideshowListContainer);

                on(slideshowItemNode, "click", function (e) {
                    var slideUrl = e.target.dataset.slideurl;
                    var fixedSlideshowJson = SlideshowJSONConverter.prototype.convert(slideUrl);
                    var w = 570;
                    var h = 300;
                    var slideShowPlayer = new SlideShowPlayer(fixedSlideshowJson, w, h);
                    slideShowPlayer.startup();
                });

            }
        },

        backToManifestList: function(){
            var self = this;

            domClass.add(query(self.slideshowAttachmentContentContainer)[0], "hidden");
            domClass.remove(query(self.slideshowListContainer)[0], "hidden");

            self.backButtonListener = on(this.backButton, "click", lang.hitch(this, this.closeViewer));
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
            if (projection == undefined) {
                map = this.mapDijit.getCurrentMap();
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
