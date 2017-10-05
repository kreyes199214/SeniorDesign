define([
    "app/App",
    "dojo/has",
    "dojo/dom",
    "dojo/_base/lang",
    "dojo/_base/config",
    "dojo/topic",
    "jpl/config/Config",
    "jpl/events/BrowserEvent",
    "jpl/utils/FeatureDetector",
    "dojo/domReady!"
], function(App, has, dom, lang, baseConfig, topic, Config, BrowserEvent, FeatureDetector) {
    //setup the configuration
    var cfg = Config.getInstance(),
        featureDetector = FeatureDetector.getInstance();

    //when config is done, initialize app
    topic.subscribe(BrowserEvent.prototype.CONFIG_LOADED, lang.hitch(this, function(){
        var app = new App({},dom.byId('appDiv'));
        console.info('========main : startup app');
        app.startup();
    }));
});