/**
 * Modal Dialog
 *
 * @module jpl/dijit/ui/DistanceModalDialog
 */

define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/on",
    "dojo/topic",
    "dojo/query",
    "dojo/_base/window",
    "bootstrap/Modal",
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    'dojo/text!../templates/DistanceModalDialog.html'
], function (declare, lang, on, topic, query, win, Modal, _WidgetBase, _TemplatedMixin, template) {
    return declare([_WidgetBase, _TemplatedMixin], {
        templateString: template,
        widgetsInTemplate: true,
        //title: "",
        //content: "",
        modalObj: null,

        constructor: function () {
        },

        postCreate: function () {
            this.createContainer();
            this.modalObj = query(this.distanceModalContainer).modal();
        },

        getModalButton: function (what) {
            var button;
            switch (what)
            {
              case "Line":
                button = dojo.byId("distanceLineButton");
                break;
              case "Polyline":
                button = dojo.byId("distancePolylineButton");
                break;
              case "Freehand":
                button = dojo.byId("distanceFreehandButton");
                break;
              default:
                button = null;
                break;
            }
            return button;
        },

        createContainer: function(){
            this.placeAt(win.body());
        }

    });
});
