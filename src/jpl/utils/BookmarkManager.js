define([
    "dojo/_base/declare",
    "dojo/topic",
    "dojo/_base/lang"
], function(declare, topic, lang){
    return declare(null,{
        bookmarks: null,

        constructor: function () {
            this.bookmarks = [];
        },

        addBookmark: function(bookmark){
            this.bookmarks.push({"bookmark":bookmark});
        },

        removeBookmark: function(bookmark){
            var index = this.getIndexOfBookmark(bookmark);
            if (index > -1) {
                this.bookmarks.splice(index, 1);
            }
        },

        hasBookmark: function(bookmark) {
            var index = this.getIndexOfBookmark(bookmark);
            if (index > -1) {
                return true;
            }
            else {
                return false;
            }
        },

        getIndexOfBookmark: function(bookmark){
            for(var i = 0; i < this.bookmarks.length; i++){
                if(this.bookmarks[i].bookmark.title === bookmark.title){
                    return i;
                }
            }

            return -1;
        },

        setBookmarkWaypointLayer: function(bookmark, waypointLayer){
            var index = this.getIndexOfBookmark(bookmark);
            this.bookmarks[index].waypointLayer = waypointLayer;
        },

        setBookmarkPathLayer: function(bookmark, pathLayer){
            var index = this.getIndexOfBookmark(bookmark);
            this.bookmarks[index].pathLayer = pathLayer;
        },

        setBookmarkWaypoints: function(bookmark, waypoints){
            var index = this.getIndexOfBookmark(bookmark);
            this.bookmarks[index].waypoints = waypoints;
        },

        getBookmarkWaypointLayer: function(bookmark){
            var index = this.getIndexOfBookmark(bookmark);
            return this.bookmarks[index].waypointLayer;
        },

        getBookmarkPathLayer: function(bookmark){
            var index = this.getIndexOfBookmark(bookmark);
            return this.bookmarks[index].pathLayer;
        },

        getBookmarkWaypoints: function(bookmark){
            var index = this.getIndexOfBookmark(bookmark);
            return this.bookmarks[index].waypoints;
        },

        getBookmark: function(bookmark){
            var index = this.getIndexOfBookmark(bookmark);
            return this.bookmarks[index].bookmark;
        }


    });
});
