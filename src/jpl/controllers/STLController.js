define([
    "dojo/_base/declare",
    "dojo/topic",
    "dojo/dom",
    "jpl/events/BrowserEvent"
], function (declare, topic, dom, BrowserEvent) {
    /**
     * Controller to handle STL file generation
     * @requires dojo/_base/declare
     * @requires dojo/topic
     * @requires dojo/dom
     * @requires jpl/events/BrowserEvent
     * @class jpl.controllers.STLController
     */
    return declare(null, /** @lends jpl.controllers.STLController.prototype */ {

        /**
         * Generates a STL file from a given service and bounding box and shows a message to the user
         * @param {string} serviceURL - URL to the STL web service.
         * @param {string} endpointURL - URL to the elevation (DEM) image service.
         * @param {string} minX - The left coordinate of the bounding box.
         * @param {string} minY - The bottom coordinate of the bounding box.
         * @param {string} maxX - The right coordinate of the bounding box.
         * @param {string} maxY - The top coordinate of the bounding box.
         * @param {string} width - The width of the STL file.
         * @param {string} height - The height of the STL file.
         * @return {number} Total distance of line in meters
         */
        generateSTL: function(serviceURL, endpointURL, minX, minY, maxX, maxY, width, height) {

            //show an alert to the user the STL file is being generated
            topic.publish(BrowserEvent.prototype.SHOW_ALERT, {
                title: "STL File Generating",
                content: "Your 3D file is being generated. It may take a few minutes and will automatically download when it is ready.",
                size: "sm"
            });

            return this.getSTLFile(
                this.buildURL(serviceURL, endpointURL, minX, minY, maxX, maxY, width, height)
            );
        },

        /**
         * Builds a URL to retrieve a STL file
         * @private
         * @param {string} serviceURL - URL to the STL web service.
         * @param {string} endpointURL - URL to the elevation (DEM) image service.
         * @param {string} minX - The left coordinate of the bounding box.
         * @param {string} minY - The bottom coordinate of the bounding box.
         * @param {string} maxX - The right coordinate of the bounding box.
         * @param {string} maxY - The top coordinate of the bounding box.
         * @param {string} width - The width of the STL file.
         * @param {string} height - The height of the STL file.
         * @return {string} URL to call to retrieve STL file
         */
        buildURL: function(serviceURL, endpointURL, minX, minY, maxX, maxY, width, height) {
            return serviceURL + "?imageServiceURL=" + endpointURL +
                "&bbox=" + minX + "," + minY + "," + maxX + "," + maxY +
                "&width=" + width +
                "&height=" + height;
        },

            downloadFile: function(sUrl) {
            console.log('STLController::downloadFile() sUrl = ' + sUrl);            
 
            var isChrome = navigator.userAgent.toLowerCase().indexOf('chrome') > -1;
            var isSafari = navigator.userAgent.toLowerCase().indexOf('safari') > -1;
            console.log('STLController::downloadFile() isChrome = ' + isChrome);            
            console.log('STLController::downloadFile() isSafari = ' + isSafari);            

                //If in Chrome or Safari - download via virtual link click
                if (isChrome || isSafari) {
                    //Creating new link node.
                    var link = document.createElement('a');
                    link.href = sUrl;

                    console.log('STLController::downloadFile() link = ' + link);            
                    console.log(link);            
                    console.log('STLController::downloadFile() link.download = ' + link.download);            
             
                    if (link.download !== undefined){
                        //Set HTML5 download attribute. This will prevent file from opening if supported.
                        //var fileName = sUrl.substring(sUrl.lastIndexOf('/') + 1, sUrl.length);
                        var ind = sUrl.indexOf("?");
                        var str = sUrl.substring(0, ind);
                        ind = str.lastIndexOf("/");
                        var fileName = str.substring(ind+1);
                        console.log('STLController::getSTLFile() fileName = ' + fileName);            
                        link.download = fileName;
                    }
             
                    //Dispatching click event.
                    if (document.createEvent) {
                        var e = document.createEvent('MouseEvents');
                        e.initEvent('click' ,true ,true);
                        link.dispatchEvent(e);
                        return true;
                    }
                }
             
                // Force file download (whether supported by server).
                var query = '&download';
             
                window.open(sUrl + query);
            },
             
        /**
         * Makes a call to retrieve the STL file given a built STL service URL
         * @private
         * @param {url} url - The built STL service URL.
         * @return {null}
         */
        getSTLFile: function(url) {
            //Because we cannot download files via ajax, we have a hidden iframe in the page. If we set
            //the source of the frame to the file, it will download automatically. Eventually need to refactor
            //to use websockets or some other job queue to download async files
            console.log('STLController::getSTLFile() url = ' + url);            
            //this.downloadFile(url);
            var stlDownloadFrame = dom.byId("stlDownloadFrame");
            stlDownloadFrame.src = url;
        },

        generateOBJ: function(serviceURL, endpointURL, demServiceURL, minX, minY, maxX, maxY, width, height) {

            //show an alert to the user the STL file is being generated
            topic.publish(BrowserEvent.prototype.SHOW_ALERT, {
                title: "OBJ File Generating",
                content: "Your 3D file is being generated. It may take a few minutes and will automatically download when it is ready.",
                size: "sm"
            });

            return this.getSTLFile(
                this.buildOBJURL(serviceURL, endpointURL, demServiceURL, minX, minY, maxX, maxY, width, height)
            );
        },

        buildOBJURL: function(serviceURL, endpointURL, demServiceURL, minX, minY, maxX, maxY, width, height) {
            return serviceURL + "?imageServiceURL=" + endpointURL + "&demServiceURL=" + demServiceURL +
                "&bbox=" + minX + "," + minY + "," + maxX + "," + maxY +
                "&width=" + width +
                "&height=" + height;
        }
    });
});
