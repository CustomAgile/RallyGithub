Ext.define('changeset.ui.Changeset', {
    extend: 'Ext.panel.Panel',
    require: [
        'changeset.data.CommentLocator',
        'changeset.ui.ChangesetSummary',
        'changeset.ui.ChangesetFileDiff',
        'changeset.ui.ChangesetFilesGrid'
    ],
    alias: 'widget.changeset',
    cls: 'changeset',

    /**
     * @cfg
     */
    adapter: null,

    initComponent: function() {
        this.callParent(arguments);
        this.on('afterrender', this._renderChangeset, this, {single: true});
    },

    _renderChangeset: function() {
        if (!this.record) {
            return;
        }

        this.add({
            xtype: 'changesetsummary',
            margin: 10,
            border: 0,
            record: this.record
        });

        if (this.record.get('parents').length > 0) {
            this._loadComments();
        }
    },
    
    _loadComments: function() {
        this.adapter.getCommentStore(this.record, function(store) {
            store.on('load', this._onCommentStoreLoad, this);
            this.up('panel').setLoading(true, true);
            store.load();
        }, this);
    },
    
    _onCommentStoreLoad: function(store) {
        var commentLocator = new changeset.data.CommentLocator(store);
        this.adapter.getChangesetStore(this.record, function(store) {
            if (!store) {
                return;
            }
            
            var callback = Ext.bind(this._onChangesetStoreLoad, this, [commentLocator], true);
            this.mon(store, 'load', callback, this, {single: true});
            store.load();
        }, this);
    },

    _onChangesetStoreLoad: function(store, records, scope, opts, commentLocator) {
        var grid = this.insert( 1,
            {
                xtype: 'changesetfilesgrid',
                margin: 10,
                border: 0,
                store: store
            }
        );

        var addedCount = 0;
        store.each(function(record) {
            var task = new Ext.util.DelayedTask(function() {
                this.add({
                    xtype: 'changesetfilediff',
                    margin: 10,
                    border: 0,
                    adapter: this.adapter,
                    record: record,
                    commentLocator: commentLocator,
                    listeners: {
                        afterrender: {
                            fn: function() {
                                addedCount++;
                                if (addedCount === store.count()) {
                                    prettyPrint();
                                    this.up('panel').setLoading(false);
                                }
                            },
                            single: true
                        },
                        scope: this
                    }
                });
            }, this);
            task.delay(10);
        }, this);
    }
});