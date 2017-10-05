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
    'dojo/text!../templates/ShareModalDialog.html'
], function (declare, lang, on, topic, query, win, Modal, _WidgetBase, _TemplatedMixin, template) {
    return declare([_WidgetBase, _TemplatedMixin], {
        templateString: template,
        widgetsInTemplate: true,
        modalObj: null,

        constructor: function () {
        },

        postCreate: function () {
            this.createContainer();
            this.modalObj = query(this.shareModalContainer).modal();
            var text = "";
            text = this.getPermalink();
            this.shareModalDialogPermalinkInputBox.value = text;

            on(this.shareModalDialogPermalinkInputBox, "click", function(){
                this.focus();this.select();
            });
        },

        createContainer: function(){
            this.placeAt(win.body());
        },

        getPermalink: function(){
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
                return newMapPermalink;
            }
            else{
                return location.href;
            }
        }

    });
});
