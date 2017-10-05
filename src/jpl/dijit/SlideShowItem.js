define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/on",
    "jpl/config/Config",
    "jpl/utils/MapUtil",
    "dojo/request/xhr",
    "dojo/topic",
    "dojo/mouse",
    "jpl/events/SlideshowEvent",
    "jpl/events/MapEvent",
    "dijit/registry",
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    'dojo/text!./templates/SlideShowItem.html'
], function (declare, lang, on, Config, MapUtil, xhr, topic, mouse, SlideshowEvent, MapEvent, registry, _WidgetBase, _TemplatedMixin, template) {
    return declare([_WidgetBase, _TemplatedMixin], {
        templateString: template,
        slideShow: null,
        description: "",
        mainImageUrl: "",
        poi: "",
        pubDate: "",
        slideShowId: "",
        title: "",
        url: "",
        isManifestSlideShow: false,
        project: "",
        subProject: "",
        slideShowLocationUrl: "",
        graphicPoint: null,
        isMousedOver: false,
        isSlideShowOn: false,
        shortenedDescription: "",

        constructor: function (slideShow, isManifestSlideShow, project) {
            this.config = Config.getInstance();
            this.description = slideShow.DESCRIPTION;
            this.mainImageUrl = slideShow.MAINIMAGEURL;
            this.poi = slideShow.POI;
            this.pubDate = slideShow.PUBDATE;
            this.slideShowId = slideShow.SLIDESHOWID;
            this.title = slideShow.SLIDESHOWTITLE;
            this.url = slideShow.URL;
            this.slideShow = slideShow;
            this.slideShowLocationUrl = this.url;

            if(isManifestSlideShow){
                this.isManifestSlideShow = isManifestSlideShow;
                this.project = project.project;
                this.subProject = project.subProject;
                this.slideShowLocationUrl = "http://mars.nasa.gov/slideshows.json/" + this.project + "/" + this.subProject + "/" + this.url;
            }

            this.shortenedDescription = this.description;
            if(this.shortenedDescription.length > 63){
                this.shortenedDescription = this.description.substring(0, 57);
                this.shortenedDescription = this.shortenedDescription + "...";
            }

            //Convert to thumbnail URL
            if(this.mainImageUrl){
                var dotPos = this.mainImageUrl.lastIndexOf(".");
                var prefix = this.mainImageUrl.substring(0,dotPos);
                var suffix = this.mainImageUrl.substring(dotPos, this.mainImageUrl.length);
                prefix += "-thm";
                this.mainImageUrl = prefix + suffix;
            }
        },

        startup: function () {
            this.mapDijit = registry.byId("mainSearchMap");
            on(this.slideshowContainer, "click", lang.hitch(this, this.slideshowContainerClicked));
            on(this.slideshowContainer, mouse.enter, lang.hitch(this, this.slideshowContainerMouseOver));
            on(this.slideshowContainer, mouse.leave, lang.hitch(this, this.slideshowContainerMouseOut));

            topic.subscribe(SlideshowEvent.prototype.SLIDESHOW_GALLERY_BACKBUTTON_PRESSED, lang.hitch(this, this.backBtnPressed));
        },

        slideshowContainerClicked: function() {
            var self = this;
            xhr(this.slideShowLocationUrl, {
                handleAs: "json",
                headers: {
                    "X-Requested-With": null
                }
            }).then(function (data) {
                    if(data.LATITUDE && data.LONGITUDE){
                          self.setMapAndPosition(data.LONGITUDE, data.LATITUDE, self.config.projection.EQUIRECT);
                          self.addPointGraphic(data.LONGITUDE, data.LATITUDE, self.config.projection.EQUIRECT);
                          topic.publish(SlideshowEvent.prototype.FLY_TO_SLIDE_SHOW_LOCATION_3D, {latitude: data.LATITUDE, longitude: data.LONGITUDE});
                          topic.publish(SlideshowEvent.prototype.ADD_SLIDE_SHOW_LOCATION_3D, {latitude: data.LATITUDE, longitude: data.LONGITUDE});
                    }
                    self.isSlideShowOn = true;
                    topic.publish(SlideshowEvent.prototype.SELECT_SLIDESHOW, {slideShow: self.slideShow, isManifestSlideShow: self.isManifestSlideShow, project: self.project, subProject: self.subProject});
            }, function (err) {
                throw new Error("Could not retrieve slideshow from (" + url + ") - " + err);
            });
        },

        slideshowContainerMouseOver: function(evt) {
            this.isMousedOver = true;

            var self = this;
            xhr(this.slideShowLocationUrl, {
                handleAs: "json",
                headers: {
                    "X-Requested-With": null
                }
            }).then(function (data) {
                    if(self.isMousedOver){
                      if(data.LATITUDE && data.LONGITUDE){
                          self.addPointGraphic(data.LONGITUDE, data.LATITUDE, self.config.projection.EQUIRECT);
                          topic.publish(SlideshowEvent.prototype.ADD_SLIDE_SHOW_LOCATION_3D, {latitude: data.LATITUDE, longitude: data.LONGITUDE});
                      }
                    }
            }, function (err) {
                throw new Error("Could not retrieve slideshow from (" + url + ") - " + err);
            });
        },

        slideshowContainerMouseOut: function(evt) {
            this.isMousedOver = false;
            if(!this.isSlideShowOn){
                this.removePointGraphic(this.config.projection.EQUIRECT);
                topic.publish(SlideshowEvent.prototype.REMOVE_SLIDE_SHOW_LOCATION_3D, null);
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

        setMapAndPosition: function(x, y, projection) {
            var map = this.getMap(projection)

            MapUtil.prototype.checkAndSetMapProjection(
                this.config.projection.EQUIRECT,
                this.mapDijit.currentMapProjection
            );

            MapUtil.prototype.centerMapAt(map, x, y);
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

        backBtnPressed: function(evt){
            this.isSlideShowOn = false;
            this.removePointGraphic(this.config.projection.EQUIRECT);
            topic.publish(SlideshowEvent.prototype.REMOVE_SLIDE_SHOW_LOCATION_3D, null);
        }
    });
});
