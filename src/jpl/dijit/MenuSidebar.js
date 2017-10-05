define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/query",
    "dojo/parser",
    "dojo/on",
    "dojo/request/xhr",
    "dojo/has",
    "dojo/topic",
    "dojo/dom-class",
    "dojo/dom-attr",
    "dojo/dom-construct",
    "dojo/aspect",
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    'dojo/text!./templates/MenuSidebar.html',
    "xstyle/css!./css/MenuSidebar.css",
    "jpl/events/NavigationEvent",
    "jpl/utils/MapUtil",
    "jpl/events/ToolEvent",
    "jpl/dijit/HelpManager",
    "dijit/layout/StackContainer",
    "dijit/layout/ContentPane",
    "dijit/registry",
    "jpl/utils/FeatureDetector",
    "jpl/dijit/ui/UserLogin",
    "jpl/config/Config",
    "dojo/i18n!./nls/textContent"
], function (declare, lang, query, parser, on, xhr, has, topic, domClass, domAttr, domConstruct, aspect, _WidgetBase, _TemplatedMixin,
             template, css, NavigationEvent, MapUtil, ToolEvent, HelpManager, StackContainer, ContentPane, registry,
             FeatureDetector, UserLogin, Config, textContent) {
    return declare([_WidgetBase, _TemplatedMixin], {
        templateString: template,
        widgetsInTemplate: false,
        mapDijit: "",
        searchType: "all",
        sidebarStackContainer: "",
        controlBar: null,
        subpointInstance: [],

        startup: function () {
            this.detectedFeatures = FeatureDetector.getInstance();
            this.config = Config.getInstance();
            domAttr.set(query(this.sideBarTitle)[0], "innerHTML", this.config.siteTitle);
            this.mapDijit = registry.byId("mainSearchMap");
            this.initStackContainer();
            this.setEventHandlers();
        },

        initStackContainer: function() {
            this.sidebarStackContainer = new StackContainer({
                style: "width:100%;",
                id: "menusidebarStackContainer"
            }, "menuscontainer");
        },

        setEventHandlers: function(){
            on(this.sideBarLinkBack, "click", lang.hitch(this, this.backBtnPressed));
            on(this.sideBarLinkClose, "click", lang.hitch(this, this.closeThisSidebar));

            if(this.config.menu.annotations) {
            }else{
                domConstruct.destroy(this.annotateLink);
            }

            if(this.config.menu.createBookmarks) {
            }else{
                domConstruct.destroy(this.createBookmark);
            }

            if(this.config.menu.about) {
                this.setContent("jpl/config/textAbout.html", this.aboutContainer);
                on(this.aboutLink, "click", lang.hitch(this, this.openAbout));
            }else{
                domConstruct.destroy(this.aboutLink);
            }

            if(this.config.menu.contact) {
                this.setContent("jpl/config/textContact.html", this.contactContainer);
                on(this.contactLink, "click", lang.hitch(this, this.openContact));
            }else{
                domConstruct.destroy(this.contactLink);
            }

            if(this.config.menu.credits) {
                this.setContent("jpl/config/textCredits.html", this.creditsContainer);
                on(this.creditsLink, "click", lang.hitch(this, this.openCredits));
            }else{
                domConstruct.destroy(this.creditsLink);
            }

            if(this.config.menu.relatedLinks){
                this.setContent("jpl/config/textRelatedLinks.html", this.relatedContainer);
                on(this.relatedLink, "click", lang.hitch(this, this.openRelatedLinks));
            }else{
                domConstruct.destroy(this.relatedLink);
            }

            if(this.config.menu.releaseNotes) {
                this.setContent("jpl/config/textRelease.html", this.releaseContainer);
                on(this.releaseLink, "click", lang.hitch(this, this.openRelease));
            }else{
                domConstruct.destroy(this.releaseLink);
            }

            if(this.config.menu.systemRequirements) {
                this.setContent("jpl/config/textRequirements.html", this.requirementsContainer);
                on(this.requirementsLink, "click", lang.hitch(this, this.openRequirements));
            }else{
                domConstruct.destroy(this.requirementsLink);
            }

            if(this.config.menu.help){
                if(!this.detectedFeatures.mobileDevice) {
                    var helpManager = new HelpManager();
                    helpManager.setControlBar(this.controlBar);
                    helpManager.startup();

                    on(this.helpLink, "click", lang.hitch(this, this.startTutorial));
                }else{
                    domConstruct.destroy(this.helpLink);
                }
            }else{
                domConstruct.destroy(this.helpLink);
            }

            //console.log('this.config.menu.login = ' +this.config.menu.login);
            if(this.config.menu.login) {
                on(this.loginBtn, "click", lang.hitch(this, this.login));
                topic.subscribe(ToolEvent.prototype.LOGIN_TOOL, lang.hitch(this, this.unsetLogin));
            }else{
                domConstruct.destroy(this.loginPanel);
            }
        },

        startTutorial: function(){
            var helpManager = new HelpManager();
            helpManager.setControlBar(this.controlBar);
            helpManager.startup();
            helpManager.startTour();
        },

        openMenuSidebar: function(evt) {
            domClass.add(document.body, "menu-sidebar-open");
            //MapUtil.prototype.resizeFix();
        },

        closeMenuSidebar: function(evt) {
            domClass.remove(document.body, "menu-sidebar-open");
            //MapUtil.prototype.resizeFix();
        },

        closeThisSidebar: function(){
            this.controlBar.activateMenu();
        },

        setControlBar: function(controlBar){
            this.controlBar = controlBar;
        },

        openLocateOrbiters: function(){
            this.closeAllContent();

            domClass.remove(query(this.sideBarLinkBack)[0], "invisible");
            domAttr.set(query(this.sideBarTitle)[0], "innerHTML", "Orbiters");
            domClass.remove(query(this.locateOrbitersContainer)[0], "hidden");
        },

        openLocateSunEarth: function(){
            this.closeAllContent();

            domClass.remove(query(this.sideBarLinkBack)[0], "invisible");
            domAttr.set(query(this.sideBarTitle)[0], "innerHTML", "Sun & Earth");
            domClass.remove(query(this.locateSunEarthContainer)[0], "hidden");
        },

        openAbout: function(){
            this.closeAllContent();

            domClass.remove(query(this.sideBarLinkBack)[0], "invisible");
            domAttr.set(query(this.sideBarTitle)[0], "innerHTML", "About");
            domClass.remove(query(this.aboutContainer)[0], "hidden");
        },

        openContact: function(){
            this.closeAllContent();

            domClass.remove(query(this.sideBarLinkBack)[0], "invisible");
            domAttr.set(query(this.sideBarTitle)[0], "innerHTML", "Feedback/Contact");
            domClass.remove(query(this.contactContainer)[0], "hidden");
        },

        openCredits: function(){
            this.closeAllContent();

            domClass.remove(query(this.sideBarLinkBack)[0], "invisible");
            domAttr.set(query(this.sideBarTitle)[0], "innerHTML", "Credits");
            domClass.remove(query(this.creditsContainer)[0], "hidden");
        },

        openRelatedLinks: function(){
            this.closeAllContent();

            domClass.remove(query(this.sideBarLinkBack)[0], "invisible");
            domAttr.set(query(this.sideBarTitle)[0], "innerHTML", "Related Links");
            domClass.remove(query(this.relatedContainer)[0], "hidden");
        },

        openRelease: function(){
            this.closeAllContent();

            domClass.remove(query(this.sideBarLinkBack)[0], "invisible");
            domAttr.set(query(this.sideBarTitle)[0], "innerHTML", "Release Notes");
            domClass.remove(query(this.releaseContainer)[0], "hidden");
        },

        openRequirements: function(){
            this.closeAllContent();

            domClass.remove(query(this.sideBarLinkBack)[0], "invisible");
            domAttr.set(query(this.sideBarTitle)[0], "innerHTML", "Requirements");
            domClass.remove(query(this.requirementsContainer)[0], "hidden");
        },

        closeAllContent: function(){
            domClass.add(query(this.menuContainer)[0], "hidden");
            domClass.add(query(this.aboutContainer)[0], "hidden");
            domClass.add(query(this.contactContainer)[0], "hidden");
            domClass.add(query(this.creditsContainer)[0], "hidden");
            domClass.add(query(this.relatedContainer)[0], "hidden");
            domClass.add(query(this.releaseContainer)[0], "hidden");
            domClass.add(query(this.requirementsContainer)[0], "hidden");
        },

        backBtnPressed: function(){
            this.closeAllContent();

            domClass.add(query(this.sideBarLinkBack)[0], "invisible");
            domAttr.set(query(this.sideBarTitle)[0], "innerHTML", this.config.siteTitle);
            domClass.remove(query(this.menuContainer)[0], "hidden");
        },

        login: function(evt)
        {
          var target = evt.target;
          var txt = target.innerHTML;
          //alert('Log in');
          if (txt == "Sign in")
          {
            var dial = new UserLogin(txt);
            dial.startup();
          }
          else
          {
            topic.publish(ToolEvent.prototype.LOGIN_TOOL, null, null, null);
          }
        },

        unsetLogin: function(token, username, passwd)
        {
          var o = dojo.byId("loginBtn");
          if (o != null)
          {
            //o.disabled = true;
            if (token != null)  //sign in
              o.innerHTML = 'Sign out';
            else
              o.innerHTML = 'Sign in';
          }
        },

        setContent: function(url, div){
            var self = this;
            xhr(url).then(function(content) {
                    domAttr.set(div, "innerHTML", content);
                });
        }

    });
});
