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
    'dojo/text!./templates/LandingSiteViewer.html',
    "xstyle/css!./css/LandingSiteViewer.css",
    "jpl/events/LayerEvent",
    "jpl/events/LoadingEvent",
    "jpl/events/LandingSiteEvent",
    "jpl/events/MapEvent",
    "jpl/utils/MapUtil",
    "jpl/config/Config",
    "bootstrap/Modal"
], function (declare, lang, on, query, topic, xhr, win, domClass, domConstruct, registry, _WidgetBase, _TemplatedMixin, template, LayerEvent, LoadingEvent, LandingSiteEvent, MapEvent,
             MapUtil, Config, Modal) {
    return declare([_WidgetBase, _TemplatedMixin], {
        templateString: template,
        landingSite: null,
        backButtonListener: null,

        startup: function() {
            this.setContent();

            on(this.tableOfContents, "click", lang.hitch(this, function(evt){
                var clickedSection = evt.target.dataset.value;
                var selectedSection = query("#" + clickedSection)[0];
                win.scrollIntoView(selectedSection);
            }));

            on(this.tableOfContentsLink, "click", lang.hitch(this, function(evt){
                domClass.toggle(this.tableOfContentsPanel, "hidden");
            }));

            backButtonListener = on(this.backButton, "click", lang.hitch(this, this.closeViewer));
        },

        setLandingSite: function(landingSite){
            this.landingSite = landingSite;
        },

        setSidebar: function(sidebar){
            this.sidebar = sidebar;
        },

        closeViewer: function(evt){
            this.sidebar.showSearchContainer();
            backButtonListener.remove();
        },

        scrollHandler: function(){
            if(isScrolledIntoView(this.one)){
                console.log("one");
            }
            if(isScrolledIntoView(this.two)){
                console.log("two");
            }
            if(isScrolledIntoView(this.three)){
                console.log("three");
            }
        },

        isScrolledIntoView: function (elem) {
            var docViewTop = $(window).scrollTop();
            var docViewBottom = docViewTop + $(window).height();

            var elemTop = $(elem).offset().top;
            var elemBottom = elemTop + $(elem).height();

            return ((elemBottom <= docViewBottom) && (elemTop >= docViewTop));
        },

        setContent: function(){
            this.landingSiteTitle.innerHTML = this.landingSite.name;

            for(var i=0; i < this.landingSite.sections.length; i++){
                var title = this.landingSite.sections[i].title;
                var content = this.landingSite.sections[i].content;

                domConstruct.place('<li data-value="' + "landingSiteViewerSection" + i + '" class="list-group-item">' + title + '</li>', this.tableOfContents);
                domConstruct.place('<div id="' + "landingSiteViewerSection" + i + '"><h3>' + title + '</h3>' + content + '</div>', this.landingSiteSections);
            }
        },

        cleanUp: function(){

        }

    });
});