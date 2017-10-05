define([
  "dojo/_base/declare",
  "dojo/_base/lang",
  "dijit/form/Button",
  "dojox/gesture/swipe",
  "dojo/dom",
  "dojo/on",
  "dojo/query",
  "bootstrap/Modal",
  "dijit/registry",
  "dijit/_WidgetBase",
  "dijit/_TemplatedMixin",
  "dojo/text!../templates/FBShare.html",
  "dijit/dijit",
  "dojox/widget/AutoRotator",
  "dojox/widget/rotator/Controller",
  "dojox/widget/rotator/Pan",
  "dojo/domReady!",
  "xstyle/css!../css/FBShare.css"
  ],
    function(declare, lang, Button, swipe, dom, on, query, Modal, registry,  _WidgetBase, _TemplatedMixin, template, dijit, AutoRotator, Controller, Pan){
    return declare([_WidgetBase, _TemplatedMixin], {
        templateString: template,
        widgetsInTemplate: true,

        constructor: function()
        {
          console.log('constructor');
        },

        startup: function()
        {
          var self = this;

          console.log('startup(1)');
          self.ssHandler('marstrek_4.png')
        },

        ssHandler: function(responseText)
        {
          console.log('ssHandler():: responseText = ' + responseText);
	  var app_id      = '1571045369861274';
          var picURL      = 'http://ourocean3.jpl.nasa.gov/trek/src/jpl/assets/images/' + responseText;
          var title       = 'NASA\'s%20Maes%20Trek';
          var caption     = 'Google%20Earth%20for%20the%20red%20planet';
          var desc        = 'An%20interactive%20map%20of%20the%20red%20planet\'s%20surface%20made%20out%20of%20images%20taken%20by%20several%20missions,%20which%20you%20can%20explore%20in%20either%202D%20or%203D';
          var link        = 'http://ourocean3.jpl.nasa.gov/ss/popupSetup2.html';
          //var redirectURL = 'http://ourocean3.jpl.nasa.gov/ss/popupClose.html';
          var redirectURL = 'http://ourocean3.jpl.nasa.gov';
          console.log('ssHandler():: picURL = ' + picURL);

          //var url = 'https://www.facebook.com/dialog/feed?app_id=1571045369861274&link=https://ourocean3.jpl.nasa.gov/ss/popupSetup.html&picture=http://ourocean3.jpl.nasa.gov/ss/' + responseText +'&name=Facebook%20Dialogs&caption=qvu Reference%20Documentation&description=Using%20Dialogs%20to%20interact%20with%20users.&redirect_uri=http://ourocean3.jpl.nasa.gov/ss/popupClose.html&display=popup';
          //var url = 'https://www.facebook.com/dialog/feed?app_id=' + app_id + '&link=' + link + '&picture=' + picURL + '&name=' + title + '&caption=' + caption + '&description=' + desc + '&redirect_uri=' + redirectURL;
          //var url = 'https://www.facebook.com/dialog/feed?app_id=' + app_id + '&link=' + link + '&picture=' + picURL + '&name=' + title + '&caption=' + caption + '&description=' + desc + '&redirect_uri=' + redirectURL + '&display=popup';
          var url = 'https://www.facebook.com/dialog/feed?app_id=' + app_id + '&link=' + link + '&picture=' + picURL + '&name=' + title + '&caption=' + caption + '&description=' + desc + '&redirect_uri=' + redirectURL;
          console.log('ssHandler():: url = ' + url);
        
          var winHeight = 650;
          var winWidth  = 850;
          var winTop = (screen.height / 2) - (winHeight / 2);
          var winLeft = (screen.width / 2) - (winWidth / 2);
        
          window.open(url,'feedDialog','toolbar=0,status=0,width='+winWidth+',height='+winHeight+',top='+winTop+',left='+winLeft);
          //window.open(url);
        },
        
        ssError: function()
        {
          console.log('ssError()::');
        },

        getRequest: function()
        {
          var req = false;
          try {
            // most browsers
            req = new XMLHttpRequest();
          } catch(e) {
            return false;
          }
          return req;
        },

        doPost: function(url, success, error)
        {
          var req = false;
          try {
            // most browsers
            req = new XMLHttpRequest();
          } catch(e) {
            return false;
          }
        
          //var req = getRequest();
          if (!req) return false;
          req.onreadystatechange = function()
          {
            if(req.readyState == 4)
            {
              return req.status === 200 ?  success(req.responseText) : error(req.status);
            }
          }
          var formData = new FormData();
          var o = document.getElementById("img_val");
          var img_val = o.value;
          o = document.getElementById("iname");
          var iname = o.value;
          formData.append("img_val", img_val);
          formData.append("iname", iname);
          req.open("POST", url, true);
          req.send(formData);
          return req;
        }

      });
});
