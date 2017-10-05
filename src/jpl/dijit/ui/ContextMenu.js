/**
 * Context Menu
 *
 * @module jpl/dijit/ui/ContextMenu
 */

define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/topic",
    "dojo/on",
    "dojo/dom",
    "dojo/dom-style",
    "jpl/events/ToolEvent",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "dojo/text!../templates/ContextMenu.html",
    "xstyle/css!../css/ContextMenu.css"
], function(declare, lang, topic, on, dom, domStyle, ToolEvent, _WidgetBase, _TemplatedMixin, template, css) {
    return declare([_WidgetBase, _TemplatedMixin], {
        templateString: template,
        entity: null,
        menu: null,
        graphic2D: null,
        listItems: [],

        /**
         * Widget for custom entity context menu.
         */
        constructor: function() {

        },

        startup: function() {
            on(this.removeItem, "a:click", lang.hitch(this, this.removeEntity));
            on(this.sunAngleItem, "a:click", lang.hitch(this, this.showSunAngle));
            on(this.elevationItem, "a:click", lang.hitch(this, this.calculateElevation));
            on(this.generateSTLItem, "a:click", lang.hitch(this, this.generateSTL));
            $('[data-toggle="tooltip"]').tooltip({
                trigger: "hover"
            });
        },

        /**
         * Parses the Cartesian2 and sets the DOM of the context menu
         * to position the menu at the corresponding location.
         * 
         * @param  {Cartesian2} position The window position in (x,y) from the top-left corner of container.
         */
        updateLocation: function(position) {
            if (position) {
                var x = position.x + "px";
                var y = position.y + "px";

                domStyle.set(this.container, "left", x);
                domStyle.set(this.container, "top", y);
            }
        },

        /**
         * Main function to startup the context menu for a corresponding entity on
         * the 3D globe. It adjusts component visibility and updates location and information.
         * 
         * @param  {Entity} entity   The entity for which the context menu is opened.
         * @param  {Cartesian2} position The window position at which to place the context menu.
         */
        show: function(entity, position) {
            var graphic = entity.graphic;
            this.adjustGraphicsMenu(entity.type, graphic);
            this.updateLocation(position);
            domStyle.set(this.contextMenu, "display", "inherit");

            this.entity = entity;
            this.graphic2D = entity.graphic;
        },

        /**
         * Hides and displays corresponding components of the context menu. Also updates
         * certain HTML based on the type of the graphic.
         * 
         * @param  {String} type    Type of graphic.
         * @param  {Graphic} graphic The associated Graphic object.
         */
        adjustGraphicsMenu: function(type, graphic) {
            if (type === "point") {
                domStyle.set("distance-info", "display", "none");
                domStyle.set("sun-angle-plot", "display", "");
                domStyle.set("elevation-info", "display", "none");
                domStyle.set("generate-stl", "display", "none");
            } else if (type === "polyline") {
                domStyle.set("sun-angle-plot", "display", "none");
                domStyle.set("distance-info", "display", "");
                domStyle.set("elevation-info", "display", "");
                domStyle.set("generate-stl", "display", "none");
                if (graphic.totalDistance) {
                    dom.byId("distance-info").innerHTML = "Distance: " + graphic.totalDistance;
                }
            } else if (type === "polygon") {
                domStyle.set("sun-angle-plot", "display", "none");
                domStyle.set("distance-info", "display", "none");
                domStyle.set("elevation-info", "display", "none");
                domStyle.set("generate-stl", "display", "");
            }
        },

        /**
         * Removes the camera change event. Also makes the entire HTML container not visible
         * and clears the stored entity.
         */
        close: function() {
            if (this.removeCameraChange)
                this.removeCameraChange();
            domStyle.set(this.contextMenu, "display", "none");
            this.entity = null;
        },

        /**
         * Publishes to the topic to remove from both 2D and 3D. Then closes the context menu.
         */
        removeEntity: function() {
            topic.publish(ToolEvent.prototype.REMOVE_TERRAIN_VIEW_GRAPHIC, this.graphic2D);
            this.close();
        },

        /**
         * Publishes to the topic to display the Sun Angle dialog box. Then closes the context menu.
         */
        showSunAngle: function() {
            var ltd = this.config.services.sunAngleInput;
            var alt = 0;

            topic.publish(ToolEvent.prototype.SHOW_SUN_ANGLE_PLOT, {
                graphic: this.graphic2D,
                endpoint: "//beta.lmmp.nasa.gov/getAzElfromT1",
                ltd: ltd,
                alt: alt
            });

            this.close();
        },

        /**
         * Publishes to the topic to display the Elevation plot. Then closes the context menu.
         */
        calculateElevation: function() {
            topic.publish(ToolEvent.prototype.SHOW_ELEVATION_PLOT, {
                graphic: this.graphic2D
                // projection: TODO: Get projection UPDATE: Apparently not necessary
            });

            this.close();
        },

        /**
         * Publishes to the topic to generate and download an STL file. Then closes the context menu.
         */
        generateSTL: function() {
            topic.publish(ToolEvent.prototype.SHOW_POLYGON_STL, this.graphic2D);

            this.close();
        }
    });
});

