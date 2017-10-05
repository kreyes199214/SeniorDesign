define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/on",
    "dojo/i18n!./nls/textContent",
    "dojo/request/xhr",
    "dijit/registry",
    "dojo/dom-attr",
    "dojo/dom-class",
    "dojo/dom-style",
    "dojo/dom-construct",
    "dojo/topic",
    "dojo/query",
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    'dojo/text!./templates/SlideshowGallery.html',
    "xstyle/css!./css/SlideshowGallery.css",
    "jpl/events/BrowserEvent",
    "jpl/events/SlideshowEvent",
    "jpl/data/Slideshows",
    "jpl/dijit/SlideShowSubCategoryItem",
    "jpl/dijit/SlideShowItem",
    "jpl/dijit/ui/SlideShowPlayer",
    "jpl/config/Config",
    "jpl/events/MapEvent",
    "bootstrap-tour/Tour",
    "jpl/utils/FeatureDetector",
    "use!jquery/jquery.easing",
    "use!jquery/plugins/supersized/js/supersized",
    "jpl/utils/SlideshowJSONConverter",
    "dojo/NodeList-traverse"
], function (declare, lang, on, textContent, xhr, registry, domAttr, domClass, domStyle, domConstruct, topic, query, _WidgetBase, _TemplatedMixin,
             template, css, BrowserEvent, SlideshowEvent, Slideshows, SlideShowSubCategoryItem,
             SlideShowItem, SlideShowPlayer, Config, MapEvent, Tour, FeatureDetector, jqEasing, jqSupersized, SlideshowJSONConverter) {
    return declare([_WidgetBase, _TemplatedMixin], {
        templateString: template,
        widgetsInTemplate: true,
        detectedFeatures: FeatureDetector.getInstance(),
        showIntroSlideShow: true,
        skipToRegionSlideShow: null,

        startup: function () {
            this.config = Config.getInstance();
            this.mapDijit = registry.byId("mainSearchMap");
            this.slideshowsInstance = Slideshows.getInstance();
            this.selectedProjection = this.config.projection.EQUIRECT;
            this.selectedSlideshow = null;
            this.backstack = 0;
            this.backstackTitles = [];
            this.isManifest = false;
            this.isShowingIntroSlideShow = false;

            domClass.add(this.domNode, "sidenav-gallery");

            //height hack for demo purposes only
            //domStyle.set("supersizedForDiv", "height", 500 + "px");

            topic.subscribe(BrowserEvent.prototype.WINDOW_RESIZED, lang.hitch(this, this.windowResized));
            topic.subscribe(SlideshowEvent.prototype.SLIDESHOWS_LOADED, lang.hitch(this, this.slideshowsLoaded));
            topic.subscribe(SlideshowEvent.prototype.SELECT_SLIDESHOW_CATEGORY, lang.hitch(this, this.categoryItemContainerClicked));
            topic.subscribe(SlideshowEvent.prototype.SELECT_SLIDESHOW_SUBCATEGORY, lang.hitch(this, this.subCategoryItemContainerClicked));
            topic.subscribe(SlideshowEvent.prototype.SELECT_SLIDESHOW_COLLECTION, lang.hitch(this, this.collectionItemContainerClicked));
            topic.subscribe(SlideshowEvent.prototype.SELECT_SLIDESHOW, lang.hitch(this, this.slideShowItemContainerClicked));
            topic.subscribe(MapEvent.prototype.REGION_LABEL_SELECTED, lang.hitch(this, this.openSlideShow));

            on(this.slideshowGalleryBackBtn, "click", lang.hitch(this, this.backBtnPressed));

            this.setTextContent();
            this.showMainContent();
        },

        setTextContent: function() {
            domAttr.set(this.slideshowHeading, "innerHTML", textContent.SlideShowGallery_slideShowGalleryTitle);
            domAttr.set(this.slideShowGalleryDescription, "innerHTML", textContent.SlideShowGallery_slideShowGalleryDescription);
        },

        slideshowsLoaded: function() {
            var i = 0;
            if(this.showIntroSlideShow){
                i = 1;
                this.getIntroSlideShow();
            }

            for(i; i < this.slideshowsInstance.categoriesList.length; i++) {
                var category = this.slideshowsInstance.categoriesList[i];
                var categoryItem = new SlideShowCategoryItem(category);
                categoryItem.startup();
                domConstruct.place(categoryItem.domNode, this.slideShowCategoriesList);
            }
        },

        getIntroSlideShow: function(){
            var collection = this.slideshowsInstance.categoriesList[0].SubCategory.Collection;
            var collectionItem = new SlideShowCollectionItem(collection, true);
            collectionItem.startup();
            domConstruct.place(collectionItem.domNode, this.slideShowCategoriesList);

        },

        categoryItemContainerClicked: function(evt){
            category = evt.category;
            domClass.remove(this.slideshowGalleryBackBtn, "hidden");
            domAttr.set(this.slideshowHeading, "innerHTML", category._title);
            this.backstackTitles[1] = category._title;
            domStyle.set("slideshowSpinner", "transform", "translateX(300%)");
            domStyle.set("slideshowSpinner", "-webkit-transform", "translateX(300%)");

            this.backstack++;
            this.setSubCategories(category);
        },

        setSubCategories: function(category){
            var introSlideShowSubCategory = null;

            this.slideShowSubCategoriesList.innerHTML = "";
            var subCategory = category.SubCategory;
            if(subCategory._title){
                var subCategoryItem = new SlideShowSubCategoryItem(subCategory);
                subCategoryItem.startup();
                domConstruct.place(subCategoryItem.domNode, this.slideShowSubCategoriesList);
                introSlideShowSubCategory = subCategoryItem;
            }
            else{
                for(var i=0; i < subCategory.length; i++) {
                    var subCategoryItem = new SlideShowSubCategoryItem(subCategory[i]);
                    subCategoryItem.startup();
                    domConstruct.place(subCategoryItem.domNode, this.slideShowSubCategoriesList);

                    if(i === 0){
                        introSlideShowSubCategory = subCategoryItem;
                    }
                }
            }
        },

        subCategoryItemContainerClicked: function(evt){
            var subCategory = evt.subCategory;
            domClass.remove(this.slideshowGalleryBackBtn, "hidden");
            domAttr.set(this.slideshowHeading, "innerHTML", subCategory._title);
            this.backstackTitles[2] = subCategory._title;
            this.backstackTitles[3] = subCategory._title;
            domStyle.set("slideshowSpinner", "transform", "translateX(200%)");
            domStyle.set("slideshowSpinner", "-webkit-transform", "translateX(200%)");

            this.backstack++;
            this.setCollections(subCategory);
        },

        setCollections: function(subCategory){
            this.slideShowCollectionList.innerHTML = "";
            if(subCategory._num === "1"){
                var collectionItem = new SlideShowCollectionItem(subCategory.Collection);
                collectionItem.startup();
                domConstruct.place(collectionItem.domNode, this.slideShowCollectionList);
            }
            else{
                for(var i=0; i < subCategory.Collection.length; i++) {
                    var collectionItem = new SlideShowCollectionItem(subCategory.Collection[i]);
                    collectionItem.startup();
                    domConstruct.place(collectionItem.domNode, this.slideShowCollectionList);
                }
            }
        },

        collectionItemContainerClicked: function(evt) {
            var collection = evt.collection;
            this.slideShowManifestList.innerHTML = "";
            url = collection.url;
            if(evt.isManifest){
                this.backstack++;
                this.setUpManifest(collection.Manifest);
            }
            else{
                this.backstack++;
                this.backstack++;
                this.setUpSlideShowContent(collection, "collection", null);
            }

            if(evt.isIntroSlideShow){
                this.slideShowSubCategoriesList.innerHTML = "";
                this.slideShowCollectionList.innerHTML = "";
                this.isShowingIntroSlideShow = true;
            }
        },

        setUpManifest: function(manifestUrl){
            var self = this;
            xhr(manifestUrl, {
                handleAs: "json",
                headers: {
                    "X-Requested-With": null
                }
            }).then(function (data) {
                self.setManifestSlideShowList(data);
            }, function (err) {
                throw new Error("Could not retrieve manifest from (" + url + ") - " + err);
            });
        },

        setManifestSlideShowList: function(data){
            domClass.remove(this.slideshowGalleryBackBtn, "hidden");
            domStyle.set("slideshowSpinner", "transform", "translateX(100%)");
            domStyle.set("slideshowSpinner", "-webkit-transform", "translateX(100%)");

            var selectedRegionSlideShow;
            if(data.SLIDESHOWS.length > 0){
                for(var i=0; i < data.SLIDESHOWS.length; i++) {
                    var slideShowItem = new SlideShowItem(data.SLIDESHOWS[i], true, {"project":data.PROJECT, "subProject":data.SUBPROJECT});
                    slideShowItem.startup();
                    domConstruct.place(slideShowItem.domNode, this.slideShowManifestList);

                    if(this.skipToRegionSlideShow !== null){
                        if(data.SLIDESHOWS[i].SLIDESHOWID === this.skipToRegionSlideShow){
                            selectedRegionSlideShow = data.SLIDESHOWS[i];
                        }
                    }
                }
            }

            if(this.skipToRegionSlideShow !== null){
                if(selectedRegionSlideShow){
                  this.slideShowItemContainerClicked({"slideShow": selectedRegionSlideShow, "isManifestSlideShow":true, "project": "explore", "subProject": "marsglobe"});
                  this.skipToRegionSlideShow = null;
                }
            }
        },

        slideShowItemContainerClicked: function(evt){
            this.backstack++;
            this.setUpSlideShowContent(evt.slideShow, "slideShow", {project: evt.project, subProject: evt.subProject});
            if(evt.isManifestSlideShow){
                this.isManifest = true;
            }
        },

        setUpSlideShowContent: function(data, type, manifestURLComponents){
            var title = "";
            var url = "";
            if (type === "collection"){
                title = data.Title;
                url = data.Slideshow;
            } else if (type === "slideShow"){
                title = data.SLIDESHOWTITLE;
                url = "http://mars.nasa.gov/slideshows.json/" + manifestURLComponents.project + "/" + manifestURLComponents.subProject + "/" + data.URL;
                console.log("url", url);
            }
            else{
            }

            domClass.remove(this.slideshowGalleryBackBtn, "hidden");
            domAttr.set(this.slideshowHeading, "innerHTML", title);
            this.backstackTitles[4] = title;
            domStyle.set("slideshowSpinner", "transform", "translateX(0%)");
            domStyle.set("slideshowSpinner", "-webkit-transform", "translateX(0%)");

            //var slideShowPlayer  = new SlideShowPlayer();
            var fixedSlideshowJson = SlideshowJSONConverter.prototype.convert(url);
            //var p = 'slholder';
            //slideShowPlayer.addSlideshow(fixedSlideshowJson, p);
            var h = 300;
            var slideShowPlayer = new SlideShowPlayer(fixedSlideshowJson, h);
            slideShowPlayer.startup();
        },

        setSlideshowContent: function(slideshow) {
            domClass.remove(this.slideshowGalleryBackBtn, "hidden");
            domAttr.set(this.slideshowHeading, "innerHTML", slideshow.name);
            domStyle.set("slideshowSpinner", "transform", "translateX(0%)");
            domStyle.set("slideshowSpinner", "-webkit-transform", "translateX(0%)");

            jQuery(function($) {
                $.supersized({
                    slideshow: 1,			// Slideshow on/off
                    autoplay: 1,			// Slideshow starts playing automatically
                    start_slide: 1,			// Start slide (0 is random)
                    stop_loop: 0,			// Pauses slideshow on last slide
                    random: 0,			    // Randomize slide order (Ignores start slide)
                    slide_interval: 3000,	// Length between transitions
                    transition: 6, 			// 0-None, 1-Fade, 2-Slide Top, 3-Slide Right, 4-Slide Bottom, 5-Slide Left, 6-Carousel Right, 7-Carousel Left
                    transition_speed: 1000,	// Speed of transition
                    new_window: 1,			// Image links open in new window/tab
                    pause_hover: 0,			// Pause slideshow on hover
                    keyboard_nav: 1,		// Keyboard navigation on/off
                    performance: 1,			// 0-Normal, 1-Hybrid speed/quality, 2-Optimizes image quality, 3-Optimizes transition speed // (Only works for Firefox/IE, not Webkit)
                    image_protect: 1,		// Disables image dragging and right click with Javascript
                    vertical_center: 1,		// Vertically center background
                    horizontal_center: 1,	// Horizontally center background
                    fit_always: 0,			// Image will never exceed browser width or height (Ignores min. dimensions)
                    fit_portrait: 0,		// Portrait images will not exceed browser height
                    fit_landscape: 0,		// Landscape images will not exceed browser width
                    slide_links: 'blank',	// Individual links for each slide (Options: false, 'num', 'name', 'blank')
                    thumb_links: 1,			// Individual thumb links for each slide
                    thumbnail_navigation: 0,// Thumbnail navigation
                    slides: slideshow.slides,
                    progress_bar: 0,		// Timer for each slide
                    mouse_scrub: 0
                });
            });
        },

        showMainContent: function() {
            domStyle.set("slideshowSpinner", "transform", "translateX(400%)");
            domStyle.set("slideshowSpinner", "-webkit-transform", "translateX(400%)");
            domClass.add(this.slideshowGalleryBackBtn, "hidden");

            this.slideShowSubCategoriesList.innerHTML = "";
            this.slideShowCollectionList.innerHTML = "";
        },

        backBtnPressed: function(){
            topic.publish(SlideshowEvent.prototype.SLIDESHOW_GALLERY_BACKBUTTON_PRESSED, null);
            if (this.backstack === 4) {
                if(this.isManifest === true){
                    this.backstack--;
                    this.isManifest = false;
                }
                else{
                    this.backstack--;
                    this.backstack--;
                }
            }
            else{
                this.backstack--;
            }

            if(this.isShowingIntroSlideShow){
                this.slideShowSubCategoriesList.innerHTML = "";
                this.slideShowCollectionList.innerHTML = "";
                this.backstack--;
                this.backstack--;
                this.isShowingIntroSlideShow = false;
            }

            if(this.backstack < 0){
                this.backstack = 0;
            }

            if(this.backstack === 0){
                //category
                domAttr.set(this.slideshowHeading, "innerHTML", textContent.SlideShowGallery_slideShowGalleryTitle);
                domStyle.set("slideshowSpinner", "transform", "translateX(400%)");
                domStyle.set("slideshowSpinner", "-webkit-transform", "translateX(400%)");
                domClass.add(this.slideshowGalleryBackBtn, "hidden");
            }else if(this.backstack === 1){
                //subcategory
                var children = query(this.slideShowSubCategoriesList).children();
                this.slideShowSubCategoriesList.innerHTML = "";
                domAttr.set(this.slideshowHeading, "innerHTML", this.backstackTitles[1]);
                for(var i=0; i < children.length; i++){
                   domConstruct.place(children[i], this.slideShowSubCategoriesList);
                }
                domStyle.set("slideshowSpinner", "transform", "translateX(300%)");
                domStyle.set("slideshowSpinner", "-webkit-transform", "translateX(300%)");
            }
            else if(this.backstack === 2){
                //collection
                var children = query(this.slideShowCollectionList).children();
                domAttr.set(this.slideshowHeading, "innerHTML", this.backstackTitles[2]);
                for(var i=0; i < children.length; i++){
                   domConstruct.place(children[i], this.slideShowCollectionList);
                }
                domStyle.set("slideshowSpinner", "transform", "translateX(200%)");
                domStyle.set("slideshowSpinner", "-webkit-transform", "translateX(200%)");
            }
            else if(this.backstack === 3){
                //manifest
                var children = query(this.slideShowManifestList).children();
                domAttr.set(this.slideshowHeading, "innerHTML", this.backstackTitles[3]);
                for(var i=0; i < children.length; i++){
                   domConstruct.place(children[i], this.slideShowManifestList);
                }
                domStyle.set("slideshowSpinner", "transform", "translateX(100%)");
                domStyle.set("slideshowSpinner", "-webkit-transform", "translateX(100%)");
            }
            else{
                //4 is slideshow
            }
        },

        openSlideShow: function(evt){
            this.backstack = 0;
            this.backBtnPressed();

            this.categoryItemContainerClicked({category: this.slideshowsInstance.categoriesList[1]});
            this.subCategoryItemContainerClicked({subCategory: this.slideshowsInstance.categoriesList[1].SubCategory});
            this.skipToRegionSlideShow =  evt.slideShow.SLIDESHOWID;
            this.collectionItemContainerClicked({collection: this.slideshowsInstance.categoriesList[1].SubCategory.Collection[1], isManifest: true, isSlideShow: false, isIntroSlideShow: false});
        },

        windowResized: function(evt) {
            ////////use this to set the slideshow height when the window size changes/////
            //domStyle.set("supersizedForDiv", "height", evt.height - 200 + "px");
        }
    });
});
