define([
    "dojo/_base/declare",
    "dojo/topic",
    "dojo/_base/lang",
    "jpl/config/Config",
    "jpl/data/Layer"
], function(declare, topic, lang, Config, Layer){
    return declare(null,{
        config: null,

        constructor: function () {
            this.config = Config.getInstance();
        },

        createGetItemUrl: function(parameters) {
            var searchUrl =  this.config.getItemUrl;

            if(parameters.productLabel){
                searchUrl = searchUrl.replace("productLabel=", "productLabel=" + parameters.productLabel);
            }
            else{
                searchUrl = searchUrl.replace("productLabel=","");
            }

            if(parameters.extID){
                searchUrl = searchUrl.replace("extID=", "extID=" + parameters.extID);
            }
            else{
                searchUrl = searchUrl.replace("extID=","");
            }


            if(parameters.projection){
                searchUrl = searchUrl.replace("PROJECTION", this.getProjectionParameter(parameters.projection));
            }else{
                searchUrl = searchUrl.replace("PROJECTION", "eq");
            }
            return searchUrl;
        },

        createLayerServicesUrl: function(uuid){
            return this.config.getLayerServicesUrl + uuid;
        },

        createGetPixelValueUrl: function(endpoint, lat, lon){
            return endpoint + '/identify?geometry=' + lon + '%2C' + lat + '&geometryType=esriGeometryPoint&f=json';
        },

        getFacetsUrl: function(parameters){
            var searchUrl = this.config.services.searchItemsUrl;

            if(parameters.projection){
                searchUrl = searchUrl.replace("PROJECTION", this.getProjectionParameter(parameters.projection));
            }else{
                searchUrl = searchUrl.replace("PROJECTION", "eq");
            }

            searchUrl = searchUrl.substring(0,searchUrl.indexOf("?"));
            return searchUrl
        },

        createGetAttachmentsUrl: function(uuid){
            var searchUrl = this.config.services.getAttachmentsUrl;
            return searchUrl + uuid;
        },

        createGetSearchItemsUrl: function(parameters){
            var searchUrl = this.config.services.searchItemsUrl;

            if(parameters.bbox){
                searchUrl = searchUrl.replace("bbox=", "bbox=" + parameters.bbox);
            }
            else{
                 searchUrl = searchUrl.replace("bbox=","");
            }
            if (parameters.shape){
                searchUrl = searchUrl.replace("shape=", "shape=" + parameters.shape);
            }
            else {
                searchUrl = searchUrl.replace("shape=","");
            }

            if(parameters.intersects){
                searchUrl = searchUrl.replace("intersects=", "intersects=" + parameters.intersects);
            }
            else{
                searchUrl = searchUrl.replace("intersects=","");
            }
            if(parameters.key && parameters.key !== ""){
                searchUrl = searchUrl.replace("key=", "key=" + parameters.key);
            }else{
               searchUrl =  searchUrl.replace("key=", "");
            }

            if(parameters.start){
                searchUrl = searchUrl.replace("start=", "start=" + parameters.start);
            }else{
                searchUrl = searchUrl.replace("start=", "start=0");
            }

            if(parameters.rows){
                searchUrl = searchUrl.replace("rows=", "rows=" + parameters.rows);
            }else{
                searchUrl = searchUrl.replace("rows=", "rows=" + 10);
            }

            if(parameters.projection){
                searchUrl = searchUrl.replace("PROJECTION", this.getProjectionParameter(parameters.projection));
                searchUrl = searchUrl.replace("proj=", "proj=" + parameters.projection);
            }else{
                searchUrl = searchUrl.replace("PROJECTION", "eq");
            }

            if(parameters.serviceType){
                if(parameters.serviceType === ""){
                    searchUrl = searchUrl.replace("serviceType=", "");
                }else{
                    searchUrl = searchUrl.replace("serviceType=", "serviceType=" + parameters.serviceType);
                }
            }else{
                searchUrl = searchUrl.replace("serviceType=", "");
            }

            if(parameters.facetKeys){
                if(parameters.facetKeys === ""){
                    sarchUrl = searchUrl.replace("facetKeys=", "");
                }else {
                    searchUrl = searchUrl.replace("facetKeys=", "facetKeys=" + parameters.facetKeys);
                }
            }else{
                searchUrl = searchUrl.replace("facetKeys=", "");
            }

            if(parameters.facetValues){
                if(parameters.facetValues === ""){
                    searchUrl = searchUrl.replace("facetValues=", "");
                }else{
                    searchUrl = searchUrl.replace("facetValues=", "facetValues=" + parameters.facetValues);
                }
            }else{
                searchUrl = searchUrl.replace("facetValues=", "");
            }

            if(parameters.explorerMode){
                searchUrl = searchUrl + "&exploreMode=true";
            }

            if(parameters.noSort){
                searchUrl = searchUrl.replace("noSort=", "noSort=" + parameters.noSort);
            }else{
                searchUrl = searchUrl.replace("noSort=", "noSort=false");
            }

            return searchUrl;
        },

        createGetAutoLayersUrl: function(parameters){
            var searchUrl = this.config.services.autoLayers;

            if(parameters.bbox){
                searchUrl = searchUrl.replace("bbox=", "bbox=" + parameters.bbox);
            }
            else{
                searchUrl = searchUrl.replace("bbox=","");
            }

            if (parameters.shape){
                searchUrl = searchUrl.replace("shape=", "shape=" + parameters.shape);
            }
            else {
                searchUrl = searchUrl.replace("shape=","");
            }

            if(parameters.ids){
                searchUrl = searchUrl.replace("ids=", "ids=" + parameters.ids);
            }
            else{
                searchUrl = searchUrl.replace("ids=","");
            }

            if(parameters.intersects){
                searchUrl = searchUrl.replace("intersects=", "intersects=" + parameters.intersects);
            }
            else{
                searchUrl = searchUrl.replace("intersects=","");
            }

            if(parameters.start){
                searchUrl = searchUrl.replace("start=", "start=" + parameters.start);
            }else{
                searchUrl = searchUrl.replace("start=", "start=0");
            }

            if(parameters.rows){
                searchUrl = searchUrl.replace("rows=", "rows=" + parameters.rows);
            }else{
                searchUrl = searchUrl.replace("rows=", "rows=" + 10);
            }

            if(parameters.projection){
                searchUrl = searchUrl.replace("PROJECTION", this.getProjectionParameter(parameters.projection));
                searchUrl = searchUrl.replace("proj=", "proj=" + parameters.projection);
            }else{
                searchUrl = searchUrl.replace("PROJECTION", "eq");
            }

            return searchUrl;
        },

        createGetSearchDEMUrl: function(parameters){
            var searchUrl = this.config.services.searchCoveredDEMUrl;
            if (searchUrl != undefined) {
                if(parameters.bbox){
                    searchUrl = searchUrl.replace("bbox=", "bbox=" + parameters.bbox);
                }
                else{
                    searchUrl = searchUrl.replace("bbox=","");
                }
            }

            return searchUrl;
        },

        createGetRockCraterInputDataUrl: function(parameters) {
            var searchUrl = this.config.services.searchRockCraterInput;
            if (searchUrl != undefined) {
                if(parameters.bbox){
                    searchUrl = searchUrl.replace("bbox=", "bbox=" + parameters.bbox);
                }
                else{
                    searchUrl = searchUrl.replace("bbox=","");
                }
            }

            return searchUrl;
        },

        createThumbnailUrl2: function (url, type, size) {
           if (type === "outreach") {
               var imagePath = url.substring(0, url.lastIndexOf(".")) + size + url.substring(url.lastIndexOf("."), url.length);
               return imagePath;
           } else if (type === "trek") {
               return this.createThumbnailUrl(url, size);
           } else {
               return url;
           }
        },

        //Currently only accepts 120 & 200
        createThumbnailUrl: function(thumbnailUrl, size) {
            if (thumbnailUrl == undefined)
                return "";
            if (thumbnailUrl.endsWith("-")) {
                return thumbnailUrl + size + ".png";
            } else {
                return thumbnailUrl;
            }
        },

        createLayer: function(item, layerService) {
            var item = item.response.docs[0];
            var layerService = this.getDefaultLayer(layerService.response.docs, "Mosaic");
            return this.createLayerByDocs(item, layerService);
        },

        getDefaultLayer: function (docs, type) {
            for(var i=0; i < docs.length; i++) {
                if(docs[i].serviceType === type) {
                    return docs[i];
                }
            }
            return undefined;
        },

        createLayerByDocs: function (item, layerService) {
            var layer = new Layer();
            var bboxStrings = item.bbox.split(",");
            var bbox = {
                west: bboxStrings[0],
                east: bboxStrings[2],
                north: bboxStrings[3],
                south: bboxStrings[1]
            };

            layer.uuid = item.item_UUID;
            layer.mission = "";
            layer.instrument = "";
            layer.productLabel = item.productLabel;
            layer.productType = item.productType;

            var services = [{
                endPoint: layerService.endPoint,
                format: layerService.format,
                layerId: item.productLabel,
                mode: "",
                protocol: layerService.protocol,
                serviceType: layerService.serviceType,
                tileMatrixSet: layerService.tileMatrixSet
            }];

            //Mosaic sevrvice type are visiabe layers. assign default service with Mosaic
            layer.service = this.selectServiceByType(services, "Mosaic");

            layer.services = services;
            layer.serviceProtocol = services[0].protocol;
            layer.arcGISType = "";
            layer.endPoint = services[0].EndPoint;
            layer.WMSEndPoint = "";
            layer.WMSLayers = "";
            layer.layerTitle = item.title;
            layer.description = "";
            layer.thumbnailImage = item.thumbnailURLDir;
            layer.layerProjection = item.dataProjection;
            layer.boundingBox = bbox;
            layer.legendURL = "";

            return layer;

        },

        createLayerFromFootPrint: function(footprint, layerInfo){
            var layer = new Layer();
            var bboxStrings = layerInfo.bbox.split(",");
            var bbox = {
                west: bboxStrings[0],
                east: bboxStrings[2],
                north: bboxStrings[3],
                south: bboxStrings[1]
            };

            layer.uuid = footprint.item_UUID;
            layer.mission = layerInfo.mission;
            layer.instrument = layerInfo.instrument;
            layer.productLabel = layerInfo.productLabel;
            layer.productType = layerInfo.productType;
            layer.services = [footprint];
            layer.service = footprint;
            layer.serviceProtocol = footprint.protocol;
            layer.arcGISType = "";
            layer.endPoint = footprint.endPoint;
            layer.WMSEndPoint = "";
            layer.WMSLayers = "";
            layer.layerTitle = layerInfo.title + "footprint";
            layer.description = "";
            layer.thumbnailImage = layerInfo.thumbnailURLDir;
            layer.layerProjection = layerInfo.dataProjection;
            layer.boundingBox = bbox;
            layer.legendURL = "";

            return layer;
        },

        createLayerFromOldJson: function(json){
            var layer = new Layer();
            var bbox = {
                west: json.bounding.leftbc,
                east: json.bounding.rightbc,
                north: json.bounding.topbc,
                south: json.bounding.bottombc
            };

            layer.uuid = json.UUID;
            layer.mission = json.mission;
            layer.instrument = json.instrument;
            layer.productLabel = json.productLabel;
            layer.productType = json.productType;
            layer.services = json.services;
            layer.service = json.services[0];
            layer.serviceProtocol = json.services[0].protocol;
            layer.arcGISType = "";
            layer.endPoint = json.services[0].endPoint;
            layer.WMSEndPoint = "";
            layer.WMSLayers = "";
            layer.layerTitle = json.title;
            layer.description = json.description;
            layer.thumbnailImage = json.thumbnailImage;
            layer.layerProjection = json.layerProjection;
            layer.boundingBox = bbox;
            layer.legendURL = json.legend;

            return layer;
        },

        selectServiceByType: function(services, type) {
            var result;

            for(var i=0; i < services.length; i++) {
                if(services[i].serviceType === type) {
                    return services[i];
                }
            }

            if(!result) {
                //if nothing was found, throw an error
                throw new Error("service '" + type + "' was not found in list of services for basemap");
            }

        },

        getProjectionParameter: function(string){
            if(string === this.config.projection.N_POLE){
                return "polar";
            }else if(string === this.config.projection.S_POLE){
                return "polar";
            }else{
                return "eq";
            }
        },

        createGetItemByUuidUrl: function(uuid){
            return this.config.services.getItemByUuidUrl + uuid;
        },

        createGetManifestByProductLabelUrl: function(productLabel){
            return this.config.services.getManifestByProductLabelUrl + productLabel;
        }

    });
});
