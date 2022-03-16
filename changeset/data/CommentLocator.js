/**
 * Lookup comment records by path and line number.
 */
Ext.define('changeset.data.CommentLocator', {

    /**
     * @param {Ext.data.Store} store A store that loads {changeset.model.Comment} records.
     */
    constructor: function(store) {
        this.comments = this._getKeyedComments(store);
    },
    
    /**
     * Returns comments that are located at a specific diff line.
     * 
     * @param {String} path File path.
     * @param {String|Int} lineNumber Line number.
     * @return {Array} of {changeset.model.Comment}
     */
    getComments: function(path, lineNumber) {
        var key = this._getCommentKey(path, lineNumber);
        return this.comments[key] || null;
    },
    
    _getCommentKey: function(path, lineNumber) {
        return path + ':' + lineNumber.toString();
    },
    
    _getKeyedComments: function(store) {
        var comments = {};
        store.each(function(record) {
            var key = this._getCommentKey(record.get('filename'), record.get('lineNumber'));
            if (!comments.hasOwnProperty(key)) {
                comments[key] = [];
            }
            comments[key].push(record);
        }, this);
        return comments;
    }
});