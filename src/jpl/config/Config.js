define([
    "dojo/_base/declare",
    "dojo/topic",
    "dojo/_base/lang",
    "dojo/request/xhr",
    "jpl/utils/MakeSingletonUtil",
    "jpl/events/BrowserEvent",
    "jpl/data/Projection",
    "jpl/config/Controls",
    "jpl/config/Tools",
    "jpl/config/Menu",
    "jpl/config/Explorer",
    "jpl/config/AutoLayers",
    "jpl/config/Search"
], function(declare, topic, lang, xhr, MakeSingletonUtil, BrowserEvent, Projection, Controls, Tools, Menu, Explorer, AutoLayers, Search) {
    /**
     * Singleton Class to store configuration information.
     * @requires dojo/_base/declare
     * @requires dojo/_base/lang
     * @requires dojo/topic
     * @requires dojo/request/xhr
     * @requires jpl/utils/MakeSingletonUtil
     * @requires jpl/events/BrowserEvent
     * @requires jpl/config/Controls
     * @requires jpl/config/Tools
     * @requires jpl/config/Menu
     * @requires jpl/data/Projection
     * @requires jpl/data/Explorer
     * @requires jpl/data/Search
     * @class jpl.config.Config
     */
    return MakeSingletonUtil(declare("gov.nasa.jpl.config.Config", [], /** @lends jpl.config.Config.prototype */ {
            data: "",
            /**
             * @property {string} - Site title to be displayed in nav bar, browser window, etc.
             * @type {string}
             * @description Site title to be displayed in nav bar, browser window, etc.
             */
            siteTitle: "",
            /**
             * @property {string} - Endpoint used to retrieve basemaps JSON content
             * @type {string}
             * @description Endpoint used to retrieve basemaps JSON content
             */
            basemapServiceURL: "",
            /**
             * @property {string} - Endpoint used to retrieve layers JSON content
             * @type {string}
             * @description Endpoint used to retrieve layers JSON content
             */
            layersServiceURL: "",
            /**
             * @property {string} - Endpoint to use for searching within the SearchGallery component
             * @type {string}
             * @description Endpoint to use for searching catalog
             */
            searchServiceURL: "",
            searchCoveredDEMUrl: "",
            /**
             * @property {string} - Endpoint to use for searching within the ExploreGallery component
             * @type {string}
             * @description Endpoint to use for searching within the ExploreGallery component
             */
            exploreServiceURL: "",
            /**
             * @property {string} - Endpoint to use for calculating elevation
             * @type {string}
             * @description Endpoint to use for searching within the ExploreGallery component
             */
            elevationServiceURL: "",
            elevationNPServiceURL: "",
            elevationSPServiceURL: "",
            /**
             * @property {string} - Endpoint to use for calculating sun angle
             * @type {string}
             * @description Endpoint to use for calculating sun angle
             */
            sunAngleServiceURL: "",
            /**
             * @property {string} - Endpoint to use for generating STL (3d print) files
             * @type {string}
             * @description Endpoint to use for generating STL (3d print) files
             */
            stlServiceURL: "",
            /**
             * @property {jpl.data.Projection} - Contains all projection information for maps used in application
             * @type {jpl.data.Projection}
             * @description Contains all projection information for maps used in application
             */
            projection: new Projection(),
            /** tool **/
            lightingServiceURL: "",
            slopeServiceURL: "",
            espServiceURL: "",
            subsetServiceURL: "",
            /**
             * @property {string} - Generic proxy to use, if needed
             * @type {string}
             * @description Generic proxy to use, if needed
             */
            proxyEndpoint: "",
            /**
             * @property {string} - 3D terrain endpoint to use, if needed
             * @type {string}
             * @description 3D terrain endpoint to use, if needed
             */
            terrainEndpoint: "",
            /**
             * @property {string} - Proxy for 3D terrain endpoint to use, if needed
             * @type {string}
             * @description Proxy for 3D terrain endpoint to use, if needed
             */
            terrainProxyEndpoint: "",
            /**
             * @property {jpl.config.Controls} - User controls that are enabled/disabled for the application.
             * @type {jpl.config.Controls}
             * @description User controls that are enabled/disabled for the application.
             */
            controls: null,
            /**
             * @property {jpl.config.Tools} - User tools that are enabled/disabled for the application.
             * @type {jpl.config.Tools}
             * @description User tools that are enabled/disabled for the application.
             */
            tools: null,
            /**
             * @property {jpl.config.Menu} - User menu that are enabled/disabled for the application.
             * @type {jpl.config.Menu}
             * @description User Menu that are enabled/disabled for the application.
             */
            menu: null,
            /**
             * @property {jpl.config.Explorer} - User explorer that are enabled/disabled for the application.
             * @type {jpl.config.Explorer}
             * @description User explorer that are enabled/disabled for the application.
             */
            explorer: null,
            /**
             * @property {jpl.config.Search} - User search that are enabled/disabled for the application.
             * @type {jpl.config.Search}
             * @description User search that are enabled/disabled for the application.
             */
            search: null,
            /**
             * @property {number} - Radius of the body's ellipsoid in meters
             * @type {number}
             * @description Radius of the body's ellipsoid in meters
             */
            ellipsoidRadius: 0,
            /**
             * @property {number} - Minimum elevation value of the body in meters
             * @type {number}
             * @description Minimum elevation value of the body in meters
             */
            elevationMinValue: 0,
            /**
             * @property {number} - Number of elevation points to use along a user defined line before calling elevation service
             * @type {number}
             * @description Number of elevation points to use along a user defined line before calling elevation service
             */
            elevationPoints: 0,
            /**
             * @property {object} - Options that are available for each layer. Examples include download, fly to, metadata
             * @type {object}
             * @description Options that are available for each layer. Examples include download, fly to, metadata
             */
            layerOptions: null,

            invisibleImagePath: "jpl/assets/images/1x1.png",

            indexerServiceURL: null,
            landingSiteServiceUrl: null,
            slideshowServiceUrl: null,
            getItemUrl: null,
            searchItemsUrl: null,
            getLayerServicesUrl: null,
            getLayerAbstractUrl: null,
            // globalDEMService: null,
            // globalDEMNPService: null,
            // globalDEMSPService: null,
            getThumbnail: null,
            nomenclatureFields: {},
            nomenclatureMarkers: {},
            nomenclatureTypeKey: null,
            ldapService: null,
            explorerMenuUrl: null,
            searchListUrl: null,
            autoLayers: null,
            autoLayerConfig: null,
            /**
             * Constructor function that is used once to setup, and is destroyed immediately after. Since this is a
             * Singleton, you do not use the new() operator, but instead use getInstance(). URL property should be overridden
             * before the constructor is called, otherwise the Layer Service URL is used by default. All layers will be
             * loaded into a corresponding projection collection.
             * @return {null}
             */
            constructor: function(configPath) {
                if(!configPath) throw "Path to site configuration is not defined!";
                //config path is defined, try and retrieve it
                this.getConfiguration(configPath);
            },

            /**
             * Retrieves configuration JSON file from provided path. Path to config should be defined in app/App module.
             * @param {string} configPath - The URL to the configuration JSON file.
             * @return {null}
             */
            getConfiguration: function(configPath) {
                xhr(configPath, {
                    handleAs: "json"
                }).then(
                    //config was retrieved successful, initialize the app
                    lang.hitch(this, function(configData) {
                        //initialize the config objects
                        this.initialize(configData);
                    }),
                    //error retrieving configuration, log the error
                    function(error) {
                        console.error("Error retrieving configuration: " + error);
                    }
                );
            },

            /**
             * Initializes configuration attributes. This is called automatically when configuration file has been successfully loaded
             * @param {object} data - The configuration data.
             * @return {null}
             */
            initialize: function(data) {
                this.siteTitle = data.title;
                this.basemapServiceURL = data.services.basemapService;
                this.layersServiceURL = data.services.layersService;
                this.proxyEndpoint = data.services.proxyEndpoint;
                this.terrainEndpoint = data.services.terrainEndpoint;
                this.terrainProxyEndpoint = data.services.terrainProxyEndpoint;
                this.elevationDEMEndpoints = data.services.elevationDEMEndpoints;
                if (data.services.elevationService) {
                    this.elevationServiceURL = data.services.elevationService.equirect;
                    this.elevationNPServiceURL = data.services.elevationService.northpole;
                    this.elevationSPServiceURL = data.services.elevationService.southpole;
                }
                this.searchServiceURL = data.services.searchService;
                this.searchCoveredDEMUrl = data.services.searchCoveredDEMUrl;
                this.exploreServiceURL = data.services.exploreService;
                this.bookmarkServiceURL = data.services.bookmarksService;
                this.bookmarkServiceUpdateUrl = data.services.bookmarkServiceUpdateUrl;
                this.bookmarkServiceGetItemsInCollectionUrl = data.services.bookmarkServiceGetItemsInCollectionUrl;
                this.bookmarkServiceGetItemsByUuidUrl = data.services.bookmarkServiceGetItemsByUuidUrl;
                this.bookmarkServiceGetShapesInCollectionUrl = data.services.bookmarkServiceGetShapesInCollectionUrl;
                this.bookmarkServiceGetAnnotationsInCollectionUrl = data.services.bookmarkServiceGetAnnotationsInCollectionUrl;
                this.bookmarkServiceDeleteUrl = data.services.bookmarkServiceDeleteUrl;
                this.sunAngleServiceURL = data.services.sunAngleService;
                this.stlServiceURL = data.services.stlService;
                this.indexerServiceURL = data.services.indexerService;
                this.getItemUrl = data.services.getItemUrl;
                this.searchItemsUrl = data.services.searchItemsUrl;
                this.getLayerServicesUrl = data.services.getLayerServicesUrl;
                this.getAttachmentsUrl = data.services.getAttachmentsUrl;
                this.getThumbnail = data.services.getThumbnail;
                this.landingSiteServiceUrl = data.services.landingSiteService;
                this.slideshowServiceUrl = data.services.slideshowService;
                this.getLayerAbstractUrl = data.services.getLayerAbstractUrl;
                this.getLayerMetadataUrl = data.services.getLayerMetadataUrl;
                this.downloadLayerMetadataUrl = data.services.downloadLayerMetadataUrl;
                this.getLayerLegendUrl = data.services.getLayerLegendUrl;
                this.services = data.services;
                this.projection.N_POLE = data.projections.northpole;
                this.projection.S_POLE = data.projections.southpole;
                this.projection.EQUIRECT = data.projections.equirect;
                this.ellipsoidRadius = data.ellipsoidRadius;
                this.elevationMinValue = data.elevationMinValue;
                this.elevationPoints = data.elevationPoints;
                this.layerOptions = data.layerOptions;
                this.googleAnalyticsID = data.googleAnalyticsID;
                this.controls = new Controls(data.controls);
                this.tools = new Tools(data.tools);
                this.menu = new Menu(data.menu);
                this.explorer = new Explorer(data.explorer);
                this.autoLayerConfig = new AutoLayers(data.autoLayersConfig);
                this.search = new Search(data.search);
                this.permalinkVersions = data.permalinkVersions;
                this.siteTheme  = data.theme;
                this.useIndexerLayers = data.useIndexerLayers;
                this.showLayerMetadata = data.showLayerMetadata;
                this.startsWithGlobe = data.startsWithGlobe;
                this.equatorialRadiusKm = data.equatorialRadiusKm;
                this.nomenclatureFields = data.nomenclatureFields;
                this.nomenclatureMarkers = data.nomenclatureMarkers;
                this.nomenclatureTypeKey = data.nomenclatureTypeKey;
                this.ldapService = data.services.ldapService;
                this.explorerMenuUrl = data.services.explorerMenuUrl;
                this.autoLayers = data.services.autoLayers;
                this.searchMenuListUrl = data.services.searchMenuListUrl;
                this.treeMenuListUrl = data.services.treeMenuListUrl;
                this.treeLayersUrl = data.services.treeLayersUrl;
                this.getItemByUuidUrl = data.services.getItemByUuidUrl;
                this.getManifestByProductLabelUrl = data.services.getManifestByProductLabelUrl;

                this.lightingServiceURL = data.services.lightingService;
                this.slopeServiceURL = data.services.slopeService;
                this.espServiceURL = data.services.espService;
                this.subsetServiceURL = data.services.subsetService;

                // if (data.services.globalDEMService) {
                //     this.services.globalDEMService = data.services.globalDEMService.equirect;
                //     this.services.globalDEMNPService = data.services.globalDEMService.northpole;
                //     this.services.globalDEMSPService = data.services.globalDEMService.southpole;
                // }
                //this.setupHasConditions();
                //this.configComplete();

                this.setExtentConfiguration(data.extents, data.projections);

                //loading json config as is
                this.data = data;
                //fire event to let the app know to start initializing
                topic.publish(BrowserEvent.prototype.CONFIG_LOADED, null);

                //for debugging
                console.info('=====config loaded');
            },

            /**
             * Sets the extent and projection values to be used in each map based on what was retrieved from configuration
             * @param {object} extents - The extents object from the configuration.
             * @param {object} projections - The projections object from the configuration.
             * @return {null}
             */
            setExtentConfiguration: function(extents, projections) {
                for(var extent in extents) {
                    //set the projection for each map
                    this.projection.setProjection(
                        extents[extent].wkid,
                        extents[extent].wkt,
                        projections[extent]
                    );

                    //set the extents for each projection
                    this.projection.setExtent(
                        extents[extent].xmin,
                        extents[extent].ymin,
                        extents[extent].xmax,
                        extents[extent].ymax,
                        projections[extent]
                    );
                }
            }
        })
    );
});
