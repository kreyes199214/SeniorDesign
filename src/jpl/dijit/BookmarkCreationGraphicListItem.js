define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/query",
    "dojo/on",
    "dojo/has",
    "dojo/topic",
    "dojo/dom-class",
    "dojo/dom-attr",
    "dojo/dom-construct",
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    'dojo/text!./templates/BookmarkCreationGraphicListItem.html'
], function (declare, lang, query, on, has, topic, domClass, domAttr, domConstruct,
             _WidgetBase, _TemplatedMixin, template) {
    return declare([_WidgetBase, _TemplatedMixin], {
        templateString: template,
        parentMenu: null,
        graphic: null,

        startup: function (title, description, graphic) {
            this.title.innerHTML = title;

            if(title.length < 1){
                this.title.innerHTML = "Untitled";
            }
            this.description.innerHTML = description;
            this.graphic = graphic;

            this.setUpIcon();
            this.setEventHandlers();
        },

        setParentMenu: function(menu){
            this.parentMenu = menu;
        },

        setEventHandlers: function(){
            on(this.removeGraphicButton, "click", lang.hitch(this, this.removeGraphicButtonClicked));
        },

        setUpIcon: function(){
            var checkGraphic = this.graphic;
            if(this.graphic.constructor === Array){
                checkGraphic = this.graphic[0];
            }

            if(checkGraphic.attributes.graphicType === "bookmarkShape"){
                domClass.add(this.icon, "fa-square-o");
                this.iconLabel.innerHTML = "Shape";
            }
            if(checkGraphic.attributes.graphicType === "bookmarkAnnotation"){
                domClass.add(this.icon, "fa-pencil");
                this.iconLabel.innerHTML = "Anno..";
            }
        },

        removeGraphicButtonClicked: function(){
            if (this.graphic.constructor == Array){
                while(this.graphic.length > 0) {
                    this.parentMenu.listItemRemoveGraphicButtonClicked(this.graphic[0]);
                }
            }
            else{
                if(this.graphic.attributes["graphicType"] === "bookmarkShape"){
                    this.parentMenu.listItemRemoveGraphicButtonClicked(this.graphic);
                }
            }
        }

    });
});
