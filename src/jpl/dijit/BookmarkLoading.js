define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/on",
    "dojo/query",
    "dojo/html",
    "dojo/dom-style",
    "dojo/dom-attr",
    "dojo/topic",
    "dojo/fx",
    "dojo/_base/fx",
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    'dojo/text!./templates/BookmarkLoading.html',
    "xstyle/css!./css/BookmarkLoading.css",
    "jpl/events/LoadingEvent",
    "jpl/events/BrowserEvent",
    "jpl/events/BookmarkEvent"
], function (declare, lang, on, query, html, domStyle, domAttr, topic, coreFx, baseFx, _WidgetBase, _TemplatedMixin, template,
             css, LoadingEvent, BrowserEvent, BookmarkEvent) {
    return declare([_WidgetBase, _TemplatedMixin], {
            templateString: template,
            widgetsInTemplate: true,
            loadingIconNode: null,
            loadingIconNodeMessage: "Starting Resource Download...",
            loadCount: 0,
            timerCount: 0,

            constructor: function () {
            },

            startup: function () {
                domStyle.set(this.bookmarkLoadingContainer, 'display', 'none');
                topic.subscribe(LoadingEvent.prototype.SHOW_BOOKMARK,  lang.hitch(this, this.showLoadingIcon));
            },

            showLoadingIcon: function(evt){
                var loadingIcon = this;
                var loadingIconNodeHolder = this.bookmarkLoadingContainer;
                var loadingMessages = [
                    "<p>Navigating to the site... ",
                    "<i class='fa fa-check-circle bookmark-loading-check'></i></p>",
                    "<p>Adding high-resolution imagery... ",
                    "<i class='fa fa-check-circle bookmark-loading-check'></i></p>",
                    "<p>Adding points of interest data... ",
                    "<i class='fa fa-check-circle bookmark-loading-check'></i></p><p>"
                ];

                domStyle.set(loadingIconNodeHolder, 'display', 'block');
                domStyle.set(loadingIconNodeHolder, 'opacity', '1');

                var count = 0;
                var content = "";
                var interval = setInterval(function() {
                    if(count < loadingMessages.length) {
                        content += loadingMessages[count];
                        domAttr.set(loadingIconNodeHolder, "innerHTML", content);
                        count ++;
                    } else {
                        clearInterval(interval);
                    }
                },275);

                loadingIcon.hideLoadingIconAfterTime(evt, 3200);
            },

            hideLoadingIcon: function(){
                var loadingIconNodeHolder = this.bookmarkLoadingContainer;

                coreFx.combine([
                    baseFx.fadeOut({
                        node: this.bookmarkLoadingContainer,
                        onEnd: function(node){
                            domStyle.set(loadingIconNodeHolder, 'display', 'none');
                            domAttr.set(loadingIconNodeHolder, "innerHTML", '');
                        }
                    }),
                    coreFx.wipeIn({
                        node: this.bookmarkLoadingContainer
                    })
                ]).play();
            },

            hideLoadingIconAfterTime: function(evt, time){
                var loadingIcon = this;

                setTimeout(function(){
                    loadingIcon.timerCount--;
                    if(loadingIcon.timerCount < 1){
                        loadingIcon.hideLoadingIcon();
                        topic.publish(BookmarkEvent.prototype.LOADING_FINISHED, this);
                    }
                }, time);
            }
        });
    });