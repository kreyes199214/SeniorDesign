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

        getJson: function (url) {
            //console.log('JSONConverter:: getJson() url = ' + url);
            //alert('JSONConverter:: getJson() url = ' + url);
            var json = this.loadTextFileAjaxSync(url, "application/json");
            //console.log('JSONConverter:: getJson() json = [' + json + ']');
            //alert('JSONConverter:: getJson() json = ' + json);
            if (json == "" || json == null)
              return null;
            json = json.replace(/'/g, '"');
            //console.log('JSONConverter:: getJson() json = ' + json);
            //alert('JSONConverter:: getJson() json = ' + json);
            if (json == null)
              return null;
            //Parse json
            return JSON.parse(json);
        },

        loadTextFileAjaxSync: function (filePath, mimeType) {
            //console.log('JSONConverter:: loadTextFileAjaxSync() filePath = ' + filePath);
            //alert('JSONConverter:: loadTextFileAjaxSync() filePath = ' + filePath);
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
                //console.log('JSONConverter:: loadTextFileAjaxSync() xmlhttp.responseText = [' + xmlhttp.responseText + ']');
                //alert('JSONConverter:: loadTextFileAjaxSync() xmlhttp.responseText = [' + xmlhttp.responseText + ']');
                return xmlhttp.responseText;
            }
            else {
                alert('JSONConverter:: loadTextFileAjaxSync() Can not load filePath = ' + filePath);
                // TODO Throw exception
                return null;
            }
        }
    });
});
