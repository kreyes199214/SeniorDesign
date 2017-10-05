define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/on",
    "dojo/topic",
    "dojo/mouse",
    "jpl/events/SlideshowEvent",
    "dijit/registry",
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    'dojo/text!./templates/SlideShowSubCategoryItem.html',
    "jpl/utils/MapUtil",
    "jpl/config/Config"
], function (declare, lang, on, topic, mouse, SlideshowEvent, registry, _WidgetBase, _TemplatedMixin, template,
             MapUtil, Config) {
    return declare([_WidgetBase, _TemplatedMixin], {
        templateString: template,
        title: "",
        subCategory: null,

        constructor: function (subCategory) {
            this.subCategory = subCategory;

            if(subCategory._num === "1"){
                this.title = subCategory._title +  " <span class='badge subCategoryBadge'>1</span>";
            }
            else{
                this.title = subCategory._title +  " <span class='badge subCategoryBadge'>" + subCategory.Collection.length + "</span>";
            }
        },

        startup: function () {
            on(this.subCategoryContainer, "click", lang.hitch(this, this.subCategoryContainerClicked));
        },

        subCategoryContainerClicked: function() {
            topic.publish(SlideshowEvent.prototype.SELECT_SLIDESHOW_SUBCATEGORY, {subCategory: this.subCategory});
        }
    });
});
