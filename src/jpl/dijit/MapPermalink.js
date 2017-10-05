define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/on",
    "dojo/i18n!./nls/textContent",
    "dojo/dom-attr",
    "dojo/topic",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dojo/text!./templates/MapPermalink.html",
    "xstyle/css!./css/MapPermalink.css"

], function (declare, lang, on, textContent, domAttr, topic, _WidgetBase, _TemplatedMixin, template) {
    return declare([_WidgetBase, _TemplatedMixin], {
        templateString: template,
        widgetsInTemplate: true,

        constructor: function () {
            topic.subscribe("/dojo/hashchange", lang.hitch(this, this.updatePermalink));
        },

        startup: function () {
            on(this.permalinkText, "click", this.highlightPermalink);

            this.setTextContent();
        },

        setTextContent: function() {
            domAttr.set(this.permalinkTitle, "innerHTML", textContent.Permalink_permalinkTitle);
            domAttr.set(this.permalinkDescription, "innerHTML", textContent.Permalink_permalinkDescription);
        },

        highlightPermalink: function(evt) {
            this.focus();
            this.select();
        },

        updatePermalink: function(evt) {
            //Check if in an iframe
            var isInIframe = false;
            if(window.location != window.parent.location)
                isInIframe = true;
            else
                isInIFrame = false;

            if(isInIframe){
                var parentUrl = window.parent.location.href;
                if( parentUrl.indexOf('#') >= 0){
                    parentUrl = parentUrl.substring(0, window.parent.location.href.indexOf('#'));
                }

                var newHash = window.location.hash;
                var newMapPermalink = parentUrl + newHash;
                this.permalinkText.innerHTML = newMapPermalink;
            }
            else{
                this.permalinkText.innerHTML = location.href;
            }
        }

    })
});