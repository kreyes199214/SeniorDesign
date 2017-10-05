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
    "jpl/events/SlideshowEvent",
    "jpl/events/MapEvent",
    "jpl/utils/MapUtil",
    "jpl/config/Config",
    "jpl/utils/SlideshowJSONConverter",
    "jpl/dijit/ui/SlideShowPlayer",
    "bootstrap/Modal",
    'dojo/text!./templates/SlideshowViewer.html',
    "xstyle/css!./css/SlideshowViewer.css"
], function (declare, lang, on, query, topic, xhr, win, domClass, domConstruct, registry, _WidgetBase, _TemplatedMixin,
             LayerEvent, LoadingEvent, SlideshowEvent, MapEvent, MapUtil, Config, SlideshowJSONConverter, SlideShowPlayer, Modal, template) {
    return declare([_WidgetBase, _TemplatedMixin], {
        templateString: template,
        widgetsInTemplate: true,
        slideshowUrl: null,
        title: null,
        sidebar: null,
        backButtonListener: null,

        startup: function() {
            this.setContent();
            backButtonListener = on(this.backButton, "click", lang.hitch(this, this.closeViewer));
            
            //var slideShowPlayer  = new SlideShowPlayer();
            var fixedSlideshowJson = SlideshowJSONConverter.prototype.convert(this.slideshowUrl);
            //var p = 'slholder';
            //slideShowPlayer.addSlideshow(fixedSlideshowJson, p);
            var h = 300;
            var slideShowPlayer = new SlideShowPlayer(fixedSlideshowJson, h);
            slideShowPlayer.startup();

        },

        setSlideshow: function(slideshowUrl, title){
            this.slideshowUrl = slideshowUrl;
            this.title = title;
        },

        setContent: function(){
            this.slideshowTitle.innerHTML = this.title;
        },

        setSidebar: function(sidebar){
            this.sidebar = sidebar;
        },

        closeViewer: function(evt){
            this.sidebar.showSearchContainer();
            this.sidebar.slideshowBackButtonPressed(null);
            backButtonListener.remove();
        },

        cleanUp: function(){

        }

    });
});
