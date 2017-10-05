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
    'dojo/text!./templates/LoadingIcon.html',
    "xstyle/css!./css/LoadingIcon.css",
    "jpl/events/LoadingEvent"
], function (declare, lang, on, query, html, domStyle, domAttr, topic, coreFx, baseFx, _WidgetBase, _TemplatedMixin, template,
             css, LoadingEvent) {
    return declare([_WidgetBase, _TemplatedMixin], {
            templateString: template,
            widgetsInTemplate: true,
            loadCount: 0,
            timerCount: 0,

            constructor: function () {
            },

            startup: function () {
                domStyle.set(this.loadingIconNode, 'display', 'none');
                
                topic.subscribe(LoadingEvent.prototype.BEGIN_DOWNLOAD,  lang.hitch(this, this.addEvent));
                topic.subscribe(LoadingEvent.prototype.END_DOWNLOAD,  lang.hitch(this, this.subtractEvent));
            },

            addEvent: function(message){
                this.loadCount++;
                this.timerCount++;
                domAttr.set(this.loadingIconNodeMessage, "html", message);
                this.showLoadingIcon();
            },

            subtractEvent: function(){
                this.loadCount--;
                if(this.loadCount < 1){
                    this.hideLoadingIcon();
                }
            },

            showLoadingIcon: function(){
                var loadingIcon = this;
                var loadingIconNodeHolder = this.loadingIconNode;

                baseFx.fadeIn({
                    node: loadingIconNode,
                    onEnd: function(node){
                        domStyle.set(loadingIconNodeHolder, 'display', 'block');
                        loadingIcon.hideLoadingIconAfterTime(3000);
                    }
                }).play();
            },

            hideLoadingIcon: function(){
                var loadingIconNodeHolder = this.loadingIconNode;

                coreFx.combine([
                    baseFx.fadeOut({
                        node: loadingIconNode,
                        onEnd: function(node){
                            domStyle.set(loadingIconNodeHolder, 'display', 'none');
                        }
                    }),
                    coreFx.wipeIn({
                        node: loadingIconNode
                    })
                ]).play();
            },

            hideLoadingIconAfterTime: function(time){
                var loadingIcon = this;

                setTimeout(function(){
                    loadingIcon.timerCount--;
                    if(loadingIcon.timerCount < 1){
                        loadingIcon.hideLoadingIcon();
                    }
                }, time);
            }
            
        });
    });