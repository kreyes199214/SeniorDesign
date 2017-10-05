//This class has been modified to use timeline with distance instead for time.   So here one second is 1 km.
//I wanted to create DistanceTimeline.js and register but wasn't able to.  So I am using this class for now.  Richard


define([
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/topic",
    "cesium/Core/JulianDate",
    "cesium/Widgets/Timeline/Timeline",
    "jpl/events/NavigationEvent",
    "jpl/events/MapEvent"
], function(declare, lang, topic, JulianDate, Timeline, NavigationEvent, MapEvent) {
    return declare([Timeline], {
        timelineMonthNames: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'BBB', 'Sep', 'Oct', 'Nov', 'Dec'],
        timelineMouseMode: {
            none: 0,
            scrub: 1,
            slide: 2,
            zoom: 3,
            touchOnly: 4
        },

        constructor: function() {
            topic.subscribe(NavigationEvent.prototype.OPEN_SIDEBAR, lang.hitch(this, this.resize));
            topic.subscribe(NavigationEvent.prototype.CLOSE_SIDEBAR, lang.hitch(this, this.resize));
        },

        removeExtraHandlers: function() {
            // Disable zooming
            this._timeBarEle.removeEventListener("mousewheel", this._onMouseWheel, false);
            this._timeBarEle.removeEventListener("DOMMouseScroll", this._onMouseWheel, false); // Mozilla mouse wheel

            // Also disable the right click and drag zoom
            this._timeBarEle.removeEventListener("mousedown", this._onMouseDown, false);
            this._onMouseDownAltered = lang.hitch(this, function(e) {
                if (this._mouseMode !== this.timelineMouseMode.touchOnly) {
                    if (e.button === 0) {
                        this._mouseMode = this.timelineMouseMode.scrub;
                        if (this._scrubElement) {
                            this._scrubElement.style.backgroundPosition = '-16px 0';
                        }
                        this._onMouseMove(e);
                        topic.publish(MapEvent.prototype.TIMELINE_DOWN, null);
                    } else {
                        this._mouseX = e.clientX;
                        if (e.button === 2) {
                            // this._mouseMode = this.timelineMouseMode.zoom;
                        } else {
                            this._mouseMode = this.timelineMouseMode.slide;
                        }
                    }

                }
                e.preventDefault();
            });
            this._timeBarEle.addEventListener("mousedown", this._onMouseDownAltered, false);

        },

        makeLabel: function(time) {

            var dDays = time.dayNumber - this._startJulian.dayNumber;
            var dSeconds = time.secondsOfDay - this._startJulian.secondsOfDay;
            dSeconds += dDays * 86400.0; //TimeConstants.SECONDS_PER_DAY;
            return dSeconds.toFixed(0) + " km";

        }
    });
});

