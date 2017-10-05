define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/_base/fx",
    "dojo/query",
    "dojo/dom-style",
    'dijit/_WidgetBase',
    'dijit/_TemplatedMixin',
    'dojo/text!./templates/NavBar.html',
    "xstyle/css!./css/NavBar.css",
    "jpl/config/Config"
], function (declare, lang, fx, query, domStyle, _WidgetBase, _TemplatedMixin, template, css, Config) {
    return declare([_WidgetBase, _TemplatedMixin], {
            templateString: template,
            widgetsInTemplate: true,

            constructor: function () {
            },

            postCreate: function () {
            },

            startup: function () {
                this.config = Config.getInstance();

                this.siteTitle.innerHTML = this.config.siteTitle;

                setTimeout(lang.hitch(this, this.fadeNavComponents), 10000);
                setTimeout(lang.hitch(this, this.hideNavComponents), 14000);
            },

            fadeNavComponents: function() {
                var fadeArgs = {
                    node: this.siteTitle,
                    duration: 4000
                }

                fx.fadeOut(fadeArgs).play();
            },

            hideNavComponents: function() {
                var navbar = query("#navBar")[0];
                var navbarBrand = query("#navBar .navbar-brand")[0];
                var siteTitle = query("#siteTitle")[0];

                if(navbar)
                    domStyle.set(navbar, "width", "initial");
                if(navbarBrand)
                    domStyle.set(navbarBrand, "width", "initial");
                if(siteTitle)
                    domStyle.set(siteTitle, "display", "none");
            }
        });
    });