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
  "dijit/dijit",
  "dojox/widget/AutoRotator",
  "dojox/widget/rotator/Controller",
  "dojox/widget/rotator/Pan",
  "dojo/domReady!"
  ],
    function(declare, lang, Button, swipe, dom, on, query, Modal, registry,  _WidgetBase, dijit, AutoRotator, Controller, Pan){
    return declare([_WidgetBase], {

        constructor: function()
        {
          console.log('constructor');
        },

        startup: function()
        {
          var self = this;
          var url = 'https://www.instagram.com/marstrek';
          window.open(url);
        }

      });
});
