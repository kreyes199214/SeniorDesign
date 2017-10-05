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
    'dojo/text!../templates/BookmarkModalDialog.html',
    "dojo/dom-construct"
], function (declare, lang, on, topic, query, win, Modal, _WidgetBase, _TemplatedMixin, template, domConstruct) {
    return declare([_WidgetBase, _TemplatedMixin], {
        templateString: template,
        widgetsInTemplate: true,
        //title: "",
        //content: "",
        sidebar: null,
        modalObj: null,
        layerIds: null,
        extent: null,

        constructor: function () {
        },

        postCreate: function () {
            this.createContainer();
            this.modalObj = query(this.createBookmarkModalContainer).modal();
        },

        startup: function(){
            on(this.addShapeButton, "click", lang.hitch(this, this.addShapeButtonClicked));
            on(this.addAnnotationButton, "click", lang.hitch(this, this.addAnnotationButtonClicked));
            on(this.finishButton, "click", lang.hitch(this, this.finishButtonClicked));
        },

        getModalButton: function (id) {
            return button = dojo.byId(id);
        },

        setLayerIds: function(layerIds){
            this.layerIds = layerIds;

            for(var i=0; i<layerIds.length; i++){
                domConstruct.place('<div>' + layerIds[i] + '</div>', this.layersList, "last");
            }
        },

        setLayerTransparencies: function(layerTransparencies){
            this.layerTransparencies = layerTransparencies;
        },

        setExtent: function(extent){
            this.extent = extent;

            domConstruct.place('<div>Left: ' + this.extent.xmin + '</div>', this.extentList, "last");
            domConstruct.place('<div>Bottom: ' + this.extent.ymin + '</div>', this.extentList, "last");
            domConstruct.place('<div>Right: ' + this.extent.xmax + '</div>', this.extentList, "last");
            domConstruct.place('<div>Top: ' + this.extent.ymax + '</div>', this.extentList, "last");
        },

        setTitle:function(title){
            this.titleInput.value = title;
        },

        setDescription:function(description){
            this.descriptionInput.value = description;
        },

        setMediaUrl: function(mediaUrl){
            this.mediaUrlInput.value = mediaUrl;
        },

        createContainer: function(){
            this.placeAt(win.body());
        },

        setToolSidebar: function(sidebar){
            this.sidebar = sidebar;
        },

        addShapeButtonClicked: function(){
            this.sidebar.createBookmarkAddShape();
        },

        addAnnotationButtonClicked: function(){
            this.sidebar.createBookmarkAddAnnotation();
        },

        finishButtonClicked: function(){
            this.sidebar.createBookmarkFinish();
        },

        getInputs: function(){
            var title = this.titleInput.value;
            var description = this.descriptionInput.value;
            var mediaUrl = this.mediaUrlInput.value;

            var inputs = {
                "layerIds": this.layerIds,
                "layerTransparencies": this.layerTransparencies,
                "extent": this.extent,
                "title": title,
                "description": description,
                "mediaUrl": mediaUrl
            };

            return inputs;
        }

    });
});
