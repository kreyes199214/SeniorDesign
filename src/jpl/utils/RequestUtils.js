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

        getXML: function (url) {
            //console.log('RequestUtils:: send() url = ' + url);
            //alert('RequestUtils:: send() url = ' + url);
            var text = this.loadTextFileAjaxSync(url, "text/xml");
            //console.log('RequestUtils:: send() text = [' + text + ']');
            //alert('RequestUtils:: send() text = ' + text);
            if (text == "" || text == null)
              return null;
            return text;
        },

        loadTextFileAjaxSync: function (filePath, mimeType) {
            //console.log('JSONConverter:: loadTextFileAjaxSync() filePath = ' + filePath);
            //alert('JSONConverter:: loadTextFileAjaxSync() filePath = ' + filePath);
            var xmlhttp=new XMLHttpRequest();
            xmlhttp.open("GET",filePath,true);
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
