define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/cookie",
    "bootstrap-tour/Tour",
    "dojo/i18n!./nls/textContent",
    "jpl/utils/FeatureDetector",
    "jpl/config/Config",
    "dojo/topic",
    "dojo/dom-construct",
    "dojo/_base/window",
    "jpl/events/NavigationEvent",
    "jpl/events/MapEvent",
    "dojo/dom",
    "dojo/dom-class",
    "dojo/dom-attr",
    "dojo/query",
    "dojo/on",
    "dojo/NodeList-traverse"
], function (declare, lang, cookie, Tour, textContent, FeatureDetector, Config, topic, domConstruct, win,
             NavigationEvent, MapEvent, dom, domClass, domAttr, query, on) {
    return declare(null, {
        controlBar: null,
        overlay: null,
        clearOverlay: null,
        totalMapCount: 0,
        mapsLoadedCount: 0,
        isEnded: false,
        tour: null,

        constructor: function(){
            this.config = Config.getInstance();
            this.detectedFeatures = FeatureDetector.getInstance();
            this.totalMapCount = Object.keys(this.config.projection).length - 1;
            topic.subscribe(MapEvent.prototype.MAP_READY, lang.hitch(this, this.mapReady));
        },

        startup: function(){
            on(window.document, "#tourShowPreferenceCkbox:click", function() {
                cookie("disableInitialTour", true, {expires: 3600 * 1000 * 24 * 365 * 2});
            });
        },

        mapReady: function(evt){
            this.mapsLoadedCount++;
            if(this.mapsLoadedCount > this.totalMapCount) {
                if(!cookie("disableInitialTour")) {
                    this.startTour();
                }
            }
        },

        setControlBar: function(controlBar){
          this.controlBar = controlBar;
        },

        startTour: function() {
            var self = this;

            self.tour = new Tour({
                name: "demo-tour",
                backdrop: false,
                storage: false,
                autoscroll: false,
                delay: 400,
                keyboard: false,
                orphan: true,
                onStart: function(tour) {
                    //make sure the sidebar is closed
                    //topic.publish(NavigationEvent.prototype.CLOSE_SIDEBAR, {resize: false});
                    self.controlBar.closeSidebars();
                    self.overlay = domConstruct.place('<div style="position:fixed;top:0;right:0;bottom:0;left:0;z-index:100;background-color:#000;Opacity:0.3;"></div>', win.body(), "first");
                    self.clearOverlay = domConstruct.place('<div style="position:fixed;top:0;right:0;bottom:0;left:0;z-index:110;background-color:#000;Opacity:0.0;"></div>', win.body(), "first");
                },
                onNext: function(tour) {
                    var tourId = tour.getCurrentStep()+1;
                    self.displaySidebar(tour.getStep(tourId), tourId, true);
                },

                onPrev: function(tour) {
                    var tourId = tour.getCurrentStep()-1;
                    self.displaySidebar(tour.getStep(tourId), tourId, true);
                },
                onShown: function() {
                    if(self.isEnded){
                        self.tour.end();
                    }else{
                        domClass.remove(dom.byId(this.id), "fade");
                    }
                },
                onHide: function() {
                    if(dom.byId(this.id))
                        domClass.add(dom.byId(this.id), "fade");
                },
                onEnd: function(){
                    self.isEnded = true;
                    if(self.overlay)
                        domConstruct.destroy(self.overlay);
                    if(self.clearOverlay){
                        domConstruct.destroy(self.clearOverlay);
                    }
                },
                steps: self.getSteps()
            });

            self.tour.init(true);
            self.tour.start();
        },

        getSteps: function() {

            var steps = [];

            var step = {
                title: "<h1>" + textContent.HelpGallery_interactiveTour_welcomeTitle + "</h1>",
                backdrop: true,
                content: '<span style="font-size: 1.2em;text-align:left;display:inline-block;">' + textContent.HelpGallery_interactiveTour_welcomeContent + '</span>',
                template: "<div class='popover tour' style='max-width:400px;width:90%;text-align:center;'><div class='arrow'></div> <h3 class='popover-title'></h3> <div class='popover-content'></div> <div class='popover-navigation'>" +
                "<button class='btn btn-success' data-role='next'><span class='fa fa-check'></span>" + textContent.HelpGallery_interactiveTour_welcomeStartBtn + "</button> <button class='btn btn-primary' data-role='end' style='float:none;'>" + textContent.HelpGallery_interactiveTour_welcomeSkipBtn + "</button> </div>" +
                "<div class='checkbox'> <label><input id='tourShowPreferenceCkbox' type='checkbox'> Do not show this dialog again </label></div></div></div>",
                selectedOption:"welcome"
            };
            steps.push(step);

            step = {
                title: textContent.HelpGallery_interactiveTour_mapViewTitle,
                content: textContent.HelpGallery_interactiveTour_mapViewContent,
                selectedOption:"map"
            }
            steps.push(step);

            step = {
                element: "#controlItemMenu",
                title: textContent.HelpGallery_interactiveTour_controlItemMenuButtonTitle,
                content: textContent.HelpGallery_interactiveTour_controlItemMenuButtonContent,
                placement: "right",
                selectedOption:"highlightMenu"
            }
            steps.push(step);
            step = {
                element: "#controlItemMenu",
                title: textContent.HelpGallery_interactiveTour_controlItemMenuTitle,
                content: textContent.HelpGallery_interactiveTour_controlItemMenuContent,
                placement: "right",
                selectedOption:"menu"
            }
            steps.push(step);

            if(this.config.controls.login) {
                step = {
                    element: "#loginBtn",
                    title: textContent.HelpGallery_interactiveTour_controlItemMenuSignInTitle,
                    content: textContent.HelpGallery_interactiveTour_controlItemMenuSignInContent,
                    placement: "right",
                    selectedOption: "menuLogIn"
                }
                steps.push(step);
            }

            if(this.config.controls.search){
                step = {
                    element: "#controlItemSearch",
                    title: textContent.HelpGallery_interactiveTour_controlItemSearchButtonTitle,
                    content: textContent.HelpGallery_interactiveTour_controlItemSearchButtonContent,
                    placement: "right",
                    selectedOption:"highlightSearch"
                }
                steps.push(step);
                step = {
                    element: "#controlItemSearch",
                    title: textContent.HelpGallery_interactiveTour_controlItemSearchTitle,
                    content: textContent.HelpGallery_interactiveTour_controlItemSearchContent,
                    placement: "right",
                    selectedOption:"search"
                }
                steps.push(step);
                step = {
                    element: "#searchSidebarSearchInput",
                    title: textContent.HelpGallery_interactiveTour_controlItemSearchInputTitle,
                    content: textContent.HelpGallery_interactiveTour_controlItemSearchInputContent,
                    placement: "bottom",
                    selectedOption:"searchInput"
                }
                steps.push(step);
                step = {
                    element: "#searchSidebarFacetButtonsContainer",
                    title: textContent.HelpGallery_interactiveTour_controlItemSearchFacetTitle,
                    content: textContent.HelpGallery_interactiveTour_controlItemSearchFacetContent,
                    placement: "bottom",
                    selectedOption:"searchFacet"
                }
                steps.push(step);
                step = {
                    element: "#controlItemSearch",
                    title: textContent.HelpGallery_interactiveTour_controlItemSearchSubfacetTitle,
                    content: textContent.HelpGallery_interactiveTour_controlItemSearchSubfacetContent,
                    placement: "bottom",
                    selectedOption:"searchSubfacet"
                }
                steps.push(step);
                step = {
                    element: "#controlItemSearch",
                    title: textContent.HelpGallery_interactiveTour_controlItemSearchLayerSelectTitle,
                    content: textContent.HelpGallery_interactiveTour_controlItemSearchLayerSelectContent,
                    placement: "right",
                    selectedOption:"searchLayerSelect"
                }
                steps.push(step);
                step = {
                    element: "#controlItemSearch",
                    title: textContent.HelpGallery_interactiveTour_controlItemSearchViewerSelectTitle,
                    content: textContent.HelpGallery_interactiveTour_controlItemSearchViewerSelectContent,
                    placement: "right",
                    selectedOption:"searchViewerSelect"
                }
                steps.push(step);
            }

            if(this.config.controls.tools){
                step = {
                    element: "#controlItemTools",
                    title: textContent.HelpGallery_interactiveTour_controlItemToolsButtonTitle,
                    content: textContent.HelpGallery_interactiveTour_controlItemToolsButtonContent,
                    placement: "left",
                    selectedOption:"highlightTools"
                }
                steps.push(step);
                step = {
                    element: "#controlItemTools",
                    title: textContent.HelpGallery_interactiveTour_controlItemToolsTitle,
                    content: textContent.HelpGallery_interactiveTour_controlItemToolsContent,
                    placement: "left",
                    selectedOption:"tools"
                }
                steps.push(step);
            }

            if(this.config.controls.socialmedia){
                step = {
                    element: "#controlItemShare",
                    title: textContent.HelpGallery_interactiveTour_controlItemMapPermalinkTitle,
                    content: textContent.HelpGallery_interactiveTour_controlItemMapPermalinkContent,
                    placement: "left",
                    selectedOption:"highlightShare"
                }
                steps.push(step);
            }

            if(this.config.controls.layers){
                step = {
                    element: "#controlItemLayers",
                    title: textContent.HelpGallery_interactiveTour_controlItemLayersButtonTitle,
                    content: textContent.HelpGallery_interactiveTour_controlItemLayersButtonContent,
                    placement: "left",
                    selectedOption:"highlightLayers"
                }
                steps.push(step);
                step = {
                    element: "#controlItemLayers",
                    title: textContent.HelpGallery_interactiveTour_controlItemLayersTitle,
                    content: textContent.HelpGallery_interactiveTour_controlItemLayersContent,
                    placement: "left",
                    selectedOption:"layers"
                }
                steps.push(step);
            }

            if(this.config.controls.explore){
                step = {
                    element: "#controlItemExplorer",
                    title: textContent.HelpGallery_interactiveTour_controlItemExploreButtonTitle,
                    content: textContent.HelpGallery_interactiveTour_controlItemExploreButtonContent,
                    placement: "left",
                    selectedOption:"highlightExplorer"
                }
                steps.push(step);
                step = {
                    element: "#explorersidebarStackContainer",
                    title: textContent.HelpGallery_interactiveTour_controlItemExploreTitle,
                    content: textContent.HelpGallery_interactiveTour_controlItemExploreContent,
                    placement: "top",
                    selectedOption:"explorer"
                }
                steps.push(step);
            }

            if(!this.detectedFeatures.mobileDevice) {
                steps.push(
                    {
                        element: "#mapDetailsContainer",
                        title: textContent.HelpGallery_interactiveTour_mapDetailsContainerTitle,
                        content: textContent.HelpGallery_interactiveTour_mapDetailsContainerContent,
                        placement: "left",
                        selectedOption:"mapDetails"
                    }
                )
            }

            steps.push(
                {
                    element: "#mapScalebarsContainer",
                    title: textContent.HelpGallery_interactiveTour_mapScalebarsContainerTitle,
                    content: textContent.HelpGallery_interactiveTour_mapScalebarsContainerContent,
                    placement: "left",
                    selectedOption:"scalebars"
                },
                {
                    element: "#controlBarLeft",
                    title: textContent.HelpGallery_interactiveTour_mapZoomInBtnTitle,
                    content: textContent.HelpGallery_interactiveTour_mapZoomInBtnContent,
                    placement: "right",
                    selectedOption:"highlightMapZoom"
                }
            );

            if(!this.detectedFeatures.mobileDevice && this.detectedFeatures.webGL) {
                steps.push(
                    {
                        element: "#controlItemProjections",
                        title: textContent.HelpGallery_interactiveTour_view2DContainerTitle,
                        content: textContent.HelpGallery_interactiveTour_view2DContainerContent,
                        placement: "top",
                        selectedOption:"highlightDimensionSwitch"
                    },
                    {
                        element: "#gameControlsContainer",
                        title: textContent.HelpGallery_interactiveTour_gameControlsContainerTitle,
                        content: textContent.HelpGallery_interactiveTour_gameControlsContainerContent,
                        placement: "top",
                        selectedOption:"highlightGameController"
                    },
                    {
                        element: "#terrainExaggerationText",
                        title: textContent.HelpGallery_interactiveTour_mapExaggerationTitle,
                        content: textContent.HelpGallery_interactiveTour_mapExaggerationContent,
                        placement: "left",
                        selectedOption:"highlightTerrainExaggeration"
                    }
                );
            };

            //final step
            steps.push(
                {
                    title: textContent.HelpGallery_interactiveTour_tourCompleteTitle,
                    backdrop: true,
                    content: textContent.HelpGallery_interactiveTour_tourCompleteContent,
                    template: "<div class='popover tour' style='max-width:400px;text-align:center;'><div class='arrow'></div> <h3 class='popover-title'></h3> <div class='popover-content' style='text-align:left;'></div> <div class='popover-navigation'>" +
                    "<button class='btn btn-success' data-role='end' style='float:none;'>Explore The Moon!</button></div>" +
                    "</div></div>",
                    selectedOption:"final"
                }
            );

            return steps;
        },

        displaySidebar: function(step, currentStepId, show) {
            var selectedOption = step.selectedOption;
            switch(selectedOption){
                case "none":
                    this.sendAllToBack();
                    this.controlBar.closeSidebars();
                    break;
                case "welcome":
                    break;
                case "map":
                    this.sendAllToBack();
                    this.controlBar.view2DClicked({});
                    this.controlBar.closeSidebars();
                    break;
                case "highlightMenu":
                    this.sendAllToBack();
                    this.controlBar.closeSidebars();
                    this.bringToFront("controlItemMenu");
                    break;
                case "menu":
                    this.sendAllToBack();
                    this.controlBar.closeSidebars();
                    this.controlBar.activateMenu();
                    break;
                case "menuLogIn":
                    this.controlBar.closeSidebars();
                    this.controlBar.activateMenu();
                    this.sendAllToBack();
                    this.bringToFront("loginPanel");
                    break;
                case "highlightSearch":
                    this.sendAllToBack();
                    this.controlBar.closeSidebars();
                    this.bringToFront("controlItemSearch");
                    break;
                case "search":
                    this.sendAllToBack();
                    this.resetSearchSidebar();
                    this.controlBar.closeSidebars();
                    this.controlBar.activateSearch();
                    this.closeSearchSidebarViewers();
                    break;
                case "searchInput":
                    this.sendAllToBack();
                    this.bringToFront("searchSidebarSearchInputDiv");
                    this.searchKeyword("tycho");
                    break;
                case "searchFacet":
                    this.sendAllToBack();
                    this.bringToFront("searchSidebarFacetButtonsContainer");
                    break;
                case "searchSubfacet":
                    this.sendAllToBack();
                    this.openFacet("searchSidebarFacetButtonsContainer", 0);
                    this.bringToFront("searchSidebarSubFacetsContainer");
                    break;
                case "searchLayerSelect":
                    this.sendAllToBack();
                    this.closeSearchSidebarViewers();
                    this.bringToFront("searchSidebarSearchBarResults");
                    this.openFacet("searchSidebarFacetButtonsContainer", 0);
                    this.selectSubFacet("searchSidebarSubFacetList", "product");
                    break;
                case "searchViewerSelect":
                    this.controlBar.closeSidebars();
                    this.controlBar.activateSearch();
                    this.sendAllToBack();
                    this.selectSearchItem("searchSidebarSearchBarResults", 5);
                    break;
                case "highlightTools":
                    this.sendAllToBack()
                    this.controlBar.closeSidebars();
                    this.bringToFront("controlItemTools");
                    break;
                case "tools":
                    this.sendAllToBack();
                    this.controlBar.activateTools();
                    break;
                case "highlightShare":
                    this.sendAllToBack();
                    this.controlBar.closeSidebars();
                    this.bringToFront("controlItemShare");
                    break;
                case "share":
                    this.sendAllToBack();
                    this.controlBar.closeSidebars();
                    break;
                case "highlightLayers":
                    this.sendAllToBack();
                    this.controlBar.closeSidebars();
                    this.bringToFront("controlItemLayersButton");
                    break;
                case "layers":
                    this.sendAllToBack();
                    this.controlBar.activateLayers();
                    break;
                case "highlightExplorer":
                    this.sendAllToBack();
                    this.controlBar.closeSidebars();
                    this.bringToFront("controlItemExplorerButton");
                    break;
                case "explorer":
                    this.sendAllToBack();
                    this.controlBar.closeSidebars();
                    this.controlBar.activateExplorer();
                    break;
                case "scalebars":
                    this.sendAllToBack();
                    this.controlBar.closeSidebars();
                    break;
                case "mapDetails":
                    this.sendAllToBack();
                    this.controlBar.closeSidebars();
                    break;
                case "highlightMapZoom":
                    this.sendAllToBack();
                    this.controlBar.view2DClicked({});
                    this.controlBar.closeSidebars();
                    this.bringToFront("controlBarLeft");
                    break;
                case "mapZoom":
                    this.sendAllToBack();
                    this.controlBar.view2DClicked({});
                    this.controlBar.closeSidebars();
                    break;
                case "highlightDimensionSwitch":
                    this.sendAllToBack();
                    this.controlBar.view3DClicked({});
                    this.controlBar.closeSidebars();
                    this.bringToFront("controlItemProjections");
                    break;
                case "dimensionSwitch":
                    this.sendAllToBack();
                    this.controlBar.view3DClicked({});
                    this.controlBar.closeSidebars();
                    break;
                case "highlightGameController":
                    this.sendAllToBack();
                    this.controlBar.closeSidebars();
                    this.bringToFront("gameControlsContainer");
                    break;
                case "gameController":
                    this.sendAllToBack();
                    this.controlBar.closeSidebars();
                    break;
                case "final":
                    this.sendAllToBack();
                    this.controlBar.view2DClicked({});
                    this.controlBar.closeSidebars();
                    break;
                default:
                    break;
            }
        },

        sendAllToBack: function(){
            var div = query("#controlItemMenu")[0];
            if(div){
                domClass.remove(div, "helpZIndexFront");
            }

            var div = query("#loginPanel")[0];
            if(div){
                domClass.remove(div, "helpZIndexFront");
            }

            div = query("#controlItemSearch")[0];
            if(div){
                domClass.remove(div, "helpZIndexFront");
            }

            div = query("#searchSidebarSearchInputDiv")[0];
            if(div){
                domClass.remove(div, "helpZIndexFront");
            }

            div = query("#searchSidebarFacetButtonsContainer")[0];
            if(div){
                domClass.remove(div, "helpZIndexFront");
            }

            div = query("#searchSidebarFacetsHideScrollbarDiv")[0];
            if(div){
                domClass.remove(div, "helpZIndexFront");
            }

            div = query("#searchSidebarSubFacetsContainer")[0];
            if(div){
                domClass.remove(div, "helpZIndexFront");
            }

            div = query("#searchSidebarSearchBarResults")[0];
            if(div){
                domClass.remove(div, "helpZIndexFront");
            }

            div = query("#controlItemTools")[0];
            if(div){
                domClass.remove(div, "helpZIndexFront");
            }

            div = query("#controlItemShare")[0];
            if(div){
                domClass.remove(div, "helpZIndexFront");
            }

            div = query("#controlItemLayersButton")[0];
            if(div){
                domClass.remove(div, "helpZIndexFront");
            }

            div = query("#controlItemExplorerButton")[0];
            if(div){
                domClass.remove(div, "helpZIndexFront");
            }

            div = query("#mapDetailsContainer")[0];
            if(div){
                domClass.remove(div, "helpZIndexFront");
            }

            div = query("#mapScalebarsContainer")[0];
            if(div){
                domClass.remove(div, "helpZIndexFront");
            }

            div = query("#controlBarLeft")[0];
            if(div){
                domClass.remove(div, "helpZIndexFront");
            }

            div = query("#controlItemProjections")[0];
            if(div){
                domClass.remove(div, "helpZIndexFront");
            }

            div = query("#gameControlsContainer")[0];
            if(div){
                domClass.remove(div, "helpZIndexFront");
            }
        },

        bringToFront: function(id){
            var div = query("#" + id)[0];
            domClass.add(div, "helpZIndexFront");
        },

        closeSearchSidebarViewers: function(){
            if(this.controlBar.searchSidebar){
                if(this.controlBar.searchSidebar.viewerContainerContent){
                    this.controlBar.searchSidebar.viewerContainerContent.closeViewer();
                }

            }
        },

        searchKeyword: function(keyword){
            if(this.controlBar.searchSidebar){
                domAttr.set("searchSidebarSearchInput", "value", keyword);
                this.controlBar.searchSidebar.searchKeyword(keyword);
            }
        },

        openFacet: function(container, index){
            var containerDiv = query("#"+container);

            facetDiv = containerDiv.children()[index];
            facetDiv.click();
        },

        selectSubFacet:function(container, label){
            var containerDiv = query("#"+container);
            var buttons = containerDiv.children("button");
            var subFacet = null;
            for(var i = 0; i < buttons.length;i++){
                var nodeValue = buttons[i].childNodes[0].nodeValue;
                if(nodeValue.slice(0,nodeValue.indexOf(" (")) === label){
                    subFacet = buttons[i];
                    i = buttons.length + 1;
                }
            }
            subFacet.click();
        },

        selectSearchItem: function(container, index){
            var containerDiv = query("#"+container);
            containerDiv.children()[0].children[0].children[0].children[0].children[0].children[index].click();
        },

        resetSearchSidebar: function(){
            if(this.controlBar.searchSidebar){
                this.controlBar.searchSidebar.createSearchMenu("");
                this.searchKeyword("");
            }
        }

    });
});
