/**
 * Store for loading {changeset.model.Commit} records from Github.
 */
Ext.define('changeset.data.github.CommitStore', {
    extend: 'Ext.data.Store',
    require: [
        'changeset.model.Commit',
        'changeset.data.github.Proxy'
    ],

    model: 'changeset.model.Commit',

    constructor: function() {
        this.callParent(arguments);
        this.on('beforeload', function(store, operation, eOpts) {
            this._addShaToOptions(1);
        }, this, {single:true});
    },

    /**
     * Github's commit endpoint's paging is a little funky.
     *
     * You must specify a sha to page to,
     * instead of a normal page number.
     */
    loadPage: function(page, options) {
        this._addShaToOptions(page);
        var result = this.callParent(arguments);
        return result;
    },

    /**
     * Overridden to remove duplicate row that comes back
     * because of API's funky paging.
     * @private
     */
    onProxyLoad: function(operation) {
        if (operation && operation.page > 1 && operation.resultSet) {
            var resultSet = operation.resultSet;
            if (resultSet.records && resultSet.records.length > 0) {
                resultSet.records.shift();
                resultSet.count--;
                resultSet.total--;
                resultSet.totalRecords--;
            }
        }
        return this.callParent(arguments);
    },

    _addShaToOptions: function(page) {
        if (this.proxy) {
            var sha,
                data = this.snapshot || this.data;
            if (page === 1) {
                sha = this.startSha;
            } else {
                var lastCommit = data.getAt(data.getCount() - 1);
                sha = lastCommit.get('revision');
            }

            if (!this.proxy.extraParams) {
                this.proxy.extraParams = {};
            }
            this.proxy.extraParams.sha = sha;
        }
    }
});