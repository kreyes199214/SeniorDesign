define([
  "dojo/_base/declare",
  "dojo/_base/lang",
  "dojox/gesture/swipe",
  "dojo/dom",
  "dojo/query",
  "dijit/registry",
  "dijit/_WidgetBase",
  "dijit/_TemplatedMixin",
  "dijit/dijit",
  "dojo/domReady!"
  ],
    function(declare, lang, swipe, dom, query, registry, _WidgetBase, _TemplatedMixin, dijit){
    return declare([_WidgetBase], {

        constructor: function()
        {
          console.log('constructor');
        },

        startup: function()
        {
          var self = this;
          console.log('startup(1)');
          var url = 'http://twitter.com/trekui';
          window.open(url);
        }

      });
});
