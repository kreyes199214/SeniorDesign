/**
 * A dialog window for Scale Bar
 *
 * @module jpl/dijit/ui/ScaleBarDialog
 */

define([
    "dojo/_base/declare",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    'dojo/text!./../templates/ScaleBarDialog.html',
    "dijit/Dialog",
    "dojo/_base/connect",
    "dojo/_base/lang",
    "dojo/on",
    "dijit/registry",
    "dijit/form/Form",
    "dijit/form/DateTextBox",
    "dijit/form/TimeTextBox",
    "dijit/form/Button",
    "dijit/form/TextBox",
    "dijit/form/ValidationTextBox",
    "dijit/form/NumberTextBox",
    "xstyle/css!./../css/ScaleBarDialog.css",
    "dojo/topic",
    "jpl/events/ToolEvent",
    "dojo/dom-attr",
    "dojo/date/locale",
    "dojo/date",
    "dojox/layout/TableContainer",
    "dojo/query",
    "dojo/fx/Toggler",
    "jpl/data/ScaleBarUnits",
    "dojo/dom-construct",
    "jpl/events/MapEvent",
    "jpl/utils/LabelFormatter",
    "bootstrap/Modal",
    "dojo/_base/window"
], function(declare, _WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin, template, Dialog, connectUtil, lang, on, registry, Form, DateTextBox, TimeTextBox, Button, TextBox,
            ValidationTextBox, NumberTextBox, ScaleBarDialogCSS, topic, ToolEvent , domAttr, locale, DojoDate, TableContainer, query, Toggler, ScaleBarUnits, domConstruct,
            MapEvent, LabelFormatter, Modal, win){
    return declare("ScaleBarDialog", [_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin],{
        templateString: template,
        widgetsInTemplate: true,
        toggler:null,
        currentUnitId: 0,
        choice: 0,

        constructor: function () {
        },

        postCreate: function(){
            this.createContainer();
            this.populateContainer();
            this.setListeners();

            //Show
            query(this.scaleBarModal).modal();
        },

        show: function(){
            this.createContainer();
            this.populateContainer();
            this.setListeners();

            //Show
            query(this.scaleBarModal).modal();
        },

        createContainer: function(){
            this.placeAt(win.body());
        },

        populateContainer: function(){
            var self = this;
            var units = ScaleBarUnits.getInstance().getUnits();
            this.currentUnitId = ScaleBarUnits.getInstance().getSelectedUnitId();
            
            var listContainer = query(this.scaleBarModalListGroup)[0];

            //Create list of choices
            var listString = "";
            units.forEach(function(unit){
                var unitMeterValue = LabelFormatter.prototype.decimalFormat(unit.lengthMeters),
                    unitFeetValue = LabelFormatter.prototype.metersToFeet(unit.lengthMeters);

                if (unit.name === "Kilometers"){
                    listString += "<a value='" + unit.unitId + "'" +
                                    "class='list-group-item'>" +
                                        "<span class='text-units'>km</span>" +
                                        "<span>" +
                                            "<strong>" + unit.name +"</strong> : " + unitMeterValue + " meters " +
                                        "/ " + unitFeetValue + " feet</span>" +
                                "</a>";
                }
                else if (unit.name === "Miles"){
                    listString += "<a value='" + unit.unitId + "'" +
                                    "class='list-group-item'>" +
                                        "<span class='text-units'>Mi</span>" +
                                        "<span>" +
                                            "<strong>" + unit.name +"</strong> : " + unitMeterValue + " meters " +
                                        "/ " + unitFeetValue + " feet</span>" +
                                "</a>";
                }
                else{
                    listString += "<a value='" + unit.unitId + "'" +
                                        "class='list-group-item'>" +
                                            "<span class='" + unit.icon + " graphic-units'></span>" +
                                            "<span style='position:relative;top:-10px;'><strong>" + unit.name +"</strong> : " + unitMeterValue + " meters " +
                                    "/ " + unitFeetValue + " feet</a>";
                }
            });
            listContainer.innerHTML = listString;

            //Set all to inactive
            query(this.scaleBarModalListGroup).query(".list-group-item").forEach(function(listItemInactivate){
                domAttr.set(listItemInactivate, "class", "list-group-item");
            });

            //Set the selected one to active
            domAttr.set(query(this.scaleBarModalListGroup).query(".list-group-item")[self.currentUnitId], "class", "list-group-item active");
        },

        setListeners: function(){
            this.setListSelectionListeners();
            this.setButtonListeners();
        },

        setListSelectionListeners: function(){
            this.choice = this.currentUnitId;
            var self = this;

            //Set click listener for each list item.
             query(self.scaleBarModalListGroup).query(".list-group-item").forEach(function(listItem){
                on(listItem, "click", lang.hitch(this, function(){
                    this.choice = domAttr.get(listItem, "value");

                    //Set all to inactive
                    query(self.scaleBarModalListGroup).query(".list-group-item").forEach(function(listItemInactivate){
                        domAttr.set(listItemInactivate, "class", "list-group-item");
                    });

                    //Set the selected one to active
                    domAttr.set(query(self.scaleBarModalListGroup).query(".list-group-item")[this.choice], "class", "list-group-item active");
                }));

                //Dbl click is the same as selecting and then pressing the ok button
                on(listItem, "dblclick", lang.hitch(this, function(){
                    this.choice = domAttr.get(listItem, "value");

                    //Set all to inactive
                    query(self.scaleBarModalListGroup).query(".list-group-item").forEach(function(listItemInactivate){
                        domAttr.set(listItemInactivate, "class", "list-group-item");
                    });

                    //Set the selected one to active
                    domAttr.set(query(self.scaleBarModalListGroup).query(".list-group-item")[this.choice], "class", "list-group-item active");

                    self.scaleBarModalOkButton.click();
                }));
            });
        },

        setButtonListeners: function(){
            var self = this;

            //On submit, Ok button clicked.
            on(self.scaleBarModalOkButton, "click", lang.hitch(this, function(){
                self.currentUnitId = domAttr.get(query(this.scaleBarModalListGroup).query(".list-group-item.active")[0], "value");
                ScaleBarUnits.getInstance().setSelectedUnitId(self.currentUnitId);
                topic.publish(MapEvent.prototype.CHANGE_SCALEBAR, {unitId: self.currentUnitId});
            }));

        },

        changeScaleBarUnitId: function(event){
            this.currentUnitId = event.unitId;
        }
    });
});