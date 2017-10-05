/**
 * Created by rkim on 1/13/16.
 */
define([
    "dojo/_base/declare",
    "dojo/request/xhr"
], function (declare, xhr){
    return declare(null, {

        constructor: function () {
        },

        convert: function(slideshow) {
            var oSlideshowJson = this.getJson(slideshow);
            var outJson = {
                SLIDESHOWID : 0,
                SLIDESHOWTITLE : "",
                SLIDESHOWDESCRIPTION : "",
                PLIST : [],
                LOCATION: { LAT: 0, LON: 0}

            };

            outJson.SLIDESHOWID = oSlideshowJson.SLIDESHOWID;
            outJson.SLIDESHOWTITLE = oSlideshowJson.SLIDESHOWTITLE;
            outJson.SLIDESHOWDESCRIPTION = oSlideshowJson.DESCRIPTION;
            outJson.LOCATION.LAT = oSlideshowJson.LATITUDE;
            outJson.LOCATION.LON = oSlideshowJson.LONGITUDE;

            for (var i=0; i < oSlideshowJson.SLIDES.length; i++) {
                var slideObj = {
                    DESCRIPTION: "",
                    TITLE: "",
                    INAME: "",
                    ID: 0
                }

                var imagePath = oSlideshowJson.SLIDES[i].IMAGEURL;
                var imageBigPath = imagePath.replace(".jpg", "-hpfeat2.jpg");
                imageBigPath = imageBigPath.replace(".png", "-hpfeat2.png");

                slideObj.DESCRIPTION = oSlideshowJson.SLIDES[i].SLIDEDESC;
                slideObj.TITLE = oSlideshowJson.SLIDES[i].SLIDETITLE;
                slideObj.INAME = imagePath;
                slideObj.M_INAME = imageBigPath;

                slideObj.ID = oSlideshowJson.SLIDES[i].SLIDEID;
                outJson.PLIST.push(slideObj);
            }
            return outJson;
        },

        getJson: function (url) {
            var json = this.loadTextFileAjaxSync(url, "application/json");
            // Parse json
            return JSON.parse(json);
        },

        loadTextFileAjaxSync: function (filePath, mimeType) {
            var xmlhttp=new XMLHttpRequest();
            xmlhttp.open("GET",filePath,false);
            if (mimeType != null) {
                if (xmlhttp.overrideMimeType) {
                    xmlhttp.overrideMimeType(mimeType);
                }
            }
            xmlhttp.send();
            if (xmlhttp.status==200)
            {
                return xmlhttp.responseText;
            }
            else {
                // TODO Throw exception
                return null;
            }
        }
    });
});
