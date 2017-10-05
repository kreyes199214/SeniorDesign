/**
 * Flyover modal
 *
 * @module jpl/dijit/ui/FlyoverModal
 */

define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/dom-class",
    "dojo/html",
    "dojo/topic",
    "dojo/dom-attr",
    "dijit/_WidgetBase",
    "dijit/_TemplatedMixin",
    "jpl/events/MapEvent",
    "cesium/Core/JulianDate",
    "dojo/i18n!../nls/textContent",
    "dojo/text!../templates/FlyoverModal.html",
    "xstyle/css!../css/FlyoverModal.css",
    "bootstrap/Tooltip"
], function(declare, lang, domClass, domHTML, topic, domAttr, _WidgetBase,
    _TemplatedMixin, MapEvent, JulianDate, textContent, template, css) {
    return declare([_WidgetBase, _TemplatedMixin], {
        templateString: template,
        widgetsInTemplate: true,
        clock: null,

        /////////////////////
        // Constant Values //
        /////////////////////
        //SPEED_MAX: 3321506.25, // 1.28 months
        //SPEED_MIN: 57600, // 16 hours
        SPEED_MAX: 100,
        SPEED_MIN: 1,
        SPEED_MULTIPLIER: 2,
        PLAY_SHORTCUT: "<kbd>Space</kbd>",
        STEP_BACKWARD_SHORTCUT: "<kbd><span class='fa fa-arrow-left'></span></kbd>",
        STEP_FORWARD_SHORTCUT: "<kbd><span class='fa fa-arrow-right'></span></kbd>",
        FAST_BACKWARD_SHORTCUT: "<kbd><span class='fa fa-arrow-down'></span></kbd>",
        FAST_FORWARD_SHORTCUT: "<kbd><span class='fa fa-arrow-up'></span></kbd>",

        /**
         * Widget for 3D flyover controls.
         * @param  {Clock} clock The clock that is being controlled.
         */
        constructor: function(clock) {
            this.clock = clock;
            topic.subscribe(MapEvent.prototype.TIMELINE_DOWN, lang.hitch(this, function(evt) {
                this.togglePause();
            }));
        },

        postCreate: function() {},

        startup: function() {
            $('[data-toggle="tooltip"]').tooltip({
                trigger: "hover"
            });

            this.setTextContent();
        },

        setTextContent: function() {
            domAttr.set(this.exitTourBtn, "innerHTML", textContent.GlobeView_tourFlyOverModalExitTourBtn);
            domAttr.set(this.distanceLabel, "innerHTML", textContent.GlobeView_tourFlyOverModalDistanceLabel);
            domAttr.set(this.speedLabel, "innerHTML", textContent.GlobeView_tourFlyOverModalSpeedLabel);
        },

        /**
         * sets to try if any attributes have been changed.  If this flag is true and when updateAttributes function is called,
         * html labels will be refreshed.
         */
        dirty: true,

        /**
         * Makes the FlyOverModal HTML visible.
         */
        show: function() {
            domClass.add(this.popoverContainer, "in flyoverInfoVisible");

            domClass.remove(this.iconPlayPauseToggle, "fa-pause");
            domClass.add(this.iconPlayPauseToggle, "fa-play");
        },

        /**
         * Hides the FlyOverModal HTML.
         * @return {type} description
         */
        hide: function() {
            domClass.remove(this.popoverContainer, "in flyoverInfoVisible");
        },

        /**
         * Updates the time and speed at which the flyover is moving.
         */
        updateAttributes: function() {
            if (this.dirty || this.clock.shouldAnimate) {
                var distance = JulianDate.secondsDifference(this.clock.currentTime, this.clock.startTime);
                //var gregorianDate = JulianDate.toGregorianDate(this.clock.currentTime);
                //var time = gregorianDate.month + "/" + gregorianDate.day + "/" + gregorianDate.year;

                var speed = this.clock.multiplier;
                var unit = "km/s";

                //if (!this.clock.shouldAnimate) {
                //    speed = "Paused";
                //    unit = "";
                //} else {
                //    if (speed >= 2592000) {
                //        speed /= 2592000;
                //        unit = "month(s)";
                //    } else if (speed >= 86400) {
                //        speed /= 86400;
                //        unit = "day(s)";
                //    } else if (speed >= 3600) {
                //        speed /= 3600;
                //        unit = "hour(s)";
                //    } else {
                //        unit = "second(s)";
                //    }
                //
                //    unit += " per tick";
                //    speed = speed.toFixed(2);
                //}

                domHTML.set(this.currentDistance, distance.toFixed(0) + " km");
                domHTML.set(this.currentSpeed, speed + " " + unit);
                this.dirty = false;
            }
        },

        /**
         * Publishes to the topic that ends the 3D flyover.
         */
        endTour: function() {
            topic.publish(MapEvent.prototype.EXIT_TOUR_3D);
        },

        /**
         * Toggles the play/pause button and flips the clock animation property.
         */
        togglePlayPause: function() {
            if (domClass.contains(this.iconPlayPauseToggle, "fa-play")) {
                domClass.remove(this.iconPlayPauseToggle, "fa-play");
                domClass.add(this.iconPlayPauseToggle, "fa-pause");
            } else {
                domClass.remove(this.iconPlayPauseToggle, "fa-pause");
                domClass.add(this.iconPlayPauseToggle, "fa-play");
            }

            this.clock.shouldAnimate = !this.clock.shouldAnimate;
            this.dirty = true;
        },

        togglePause: function(evt) {
            domClass.remove(this.iconPlayPauseToggle, "fa-pause");
            domClass.add(this.iconPlayPauseToggle, "fa-play");

            this.clock.shouldAnimate = false;
            this.dirty = true;
        },

        /**
         * Moves the clock forward based on the current speed.
         */
        stepForward: function() {
            JulianDate.addSeconds(this.clock.currentTime, 2 * this.clock.multiplier, this.clock.currentTime);
            if (!this.clock.shouldAnimate)
                this.fixTime();
            this.dirty = true;
        },

        /**
         * Moves the clock backward based on the current speed. 
         */
        stepBackward: function() {
            JulianDate.addSeconds(this.clock.currentTime, -2 * this.clock.multiplier, this.clock.currentTime);
            if (!this.clock.shouldAnimate)
                this.fixTime();
            this.dirty = true;
        },

        /**
         * Speeds up the clock multiplier. 
         */
        fastForward: function() {
            if (this.clock.multiplier < this.SPEED_MAX) {
                this.clock.multiplier *= this.SPEED_MULTIPLIER;
                this.dirty = true;
            }
        },

        /**
         * Speeds up the clock multiplier. 
         */
        fastBackward: function() {
            if (this.clock.multiplier > this.SPEED_MIN) {
                this.clock.multiplier /= this.SPEED_MULTIPLIER;
                this.dirty = true;
            }
        },

        /**
         * If the current time of the clock is earlier than that of the start time,
         * then it moves current time to the start time. Function behaves the same in the
         * case that the time goes past that of the stopTime.
         */
        fixTime: function() {
            if (JulianDate.compare(this.clock.currentTime, this.clock.startTime) < 0)
                this.clock.currentTime = this.clock.startTime;
            else if (JulianDate.compare(this.clock.currentTime, this.clock.stopTime) > 0)
                this.clock.currentTime = this.clock.stopTime;
        },

        /**
         * Publish show fly over tour help so that 3d globe view can show it.
         */
        showHelp: function() {
           topic.publish(MapEvent.prototype.SHOW_FLY_OVER_TOUR_HELP);
        }

    });
});

