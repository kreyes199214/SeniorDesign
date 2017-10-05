/**
 * Modal Dialog
 *
 * @module jpl/dijit/ui/SlopeModalDialog
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
    'dojo/text!../templates/CraterModalDialog.html'
], function (declare, lang, on, topic, query, win, Modal, _WidgetBase, _TemplatedMixin, template) {
    return declare([_WidgetBase, _TemplatedMixin], {
        templateString: template,
        widgetsInTemplate: true,
        title: "",
        content: "",
        modalObj: null,

        constructor: function () {
        },

        postCreate: function () {
            this.createContainer();
            this.modalObj = query(this.craterModalContainer).modal();
        },

        getModalButton: function (what) {
            var button;
            switch (what)
            {
                case "Rectangle":
                    button = dojo.byId("craterRectangleButton");
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