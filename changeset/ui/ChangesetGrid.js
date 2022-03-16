Ext.define('changeset.ui.ChangesetGrid', {
    extend: 'Rally.ui.grid.Grid',
    require: [
        'Rally.util.Navigation',
        'Rally.ui.Button'
    ],
    alias: 'widget.changesetgrid',
    cls: 'changeset-grid',

    /**
     * @cfg
     * @private
     * 
     * Artifact type prefix regexes to match in commit messages.
     */
    artifactRegexes: [
        /(DE\d+)/,
        /(US\d+)/,
        /(TA\d+)/
    ],

    columnCfgs: [{
        header: 'Message',
        dataIndex: 'message',
        itemId: 'messageCol',
        flex: 1,
        renderer: function(value) {
            value = Ext.String.htmlEncode(value);
            Ext.each(this.artifactRegexes, function(artifactRegex) {
                value = value.replace(artifactRegex, '<a href="#" class="artifact-link">$1</a>');
            });
            return value;
        }
    },{
        xtype: 'templatecolumn',
        header: 'Author',
        tpl: '{author.name}',
        flex: 0.3
    },{
        xtype: 'datecolumn',
        header: 'Commit Time',
        dataIndex: 'timestamp',
        format: 'Y-m-d h:i:s A',
        width: 160
    },{
        header: 'Revision',
        dataIndex: 'revision',
        renderer: function(value) {
            return Ext.String.format('<a href="#" class="revision-link">{0}</a>', value);
        },
        width: 85
    }],

    buttonAlign: 'center',
    buttons: [{
        xtype: 'rallybutton',
        text: 'Load More',
        itemId: 'loadButton',
        margin: '10 0 0 0',
        width: 400
    }],

    constructor: function(config) {
        config = config || {};
        Ext.applyIf(config, {
            columnCfgs: this.columnCfgs,
            showPagingToolbar: false
        });
        this.callParent([config]);
    },

    initComponent: function() {
        this.callParent(arguments);
        this.addEvents(
            /**
             * @event
             * fired when a revision is clicked.
             * @param {changeset.model.Commit}
             */
            'revisionClicked',
            /**
             * @event
             * fired when an artifact is clicked.
             * @param {String}
             */
            'artifactClicked'
        );

        this.on('render', this._onRender, this);
        this.down('#loadButton').on('click', this._loadMore, this);
        this.mon(this.store, 'load', this._onStoreLoad, this);
        this.mon(this.store, 'datachanged', this._onStoreDataChanged, this);
    },

    /**
     * Set the filter value.
     * 
     * @param value {String} The value to filter for or {null} for no filter.
     */
    setCommitFilter: function(value) {
        var store = this.store;
        this.filteredRowCount = null;
        if (Ext.isEmpty(value)) {
            this.commitFilter = null;
            store.clearFilter();
        } else {
            var regex = new RegExp(value, 'i');
            this.commitFilter = {
                filterFn: function(record) {
                    if (regex.test(record.get('message'))) {
                        return true;
                    } else if (regex.test(record.get('author').name)) {
                        return true;
                    } else if (regex.test(record.get('revision'))) {
                        return true;
                    }

                    return false;
                }
            };

            store.clearFilter(true);
            store.filter(this.commitFilter);
        }
    },

    _loadMore: function() {
        if (this.down('#loadButton')) {
            var store = this.store;
            store.clearFilter(true);
            store.nextPage();
        }
    },

    _onRender: function() {
        var el = this.getEl();
        el.on('click', this._onArtifactClick, this, {delegate: 'a.artifact-link'});
        el.on('click', this._onRevisionClick, this, {delegate: 'a.revision-link'});
    },

    _onArtifactClick: function(event, dom, opts) {
        this.fireEvent('artifactClicked', dom.innerHTML);
    },

    _onRevisionClick: function(event, dom) {
        var record = this.store.findRecord('revision', dom.innerHTML);
        this.fireEvent('revisionClicked', record);
    },

    _onStoreLoad: function(store, records) {
        // Scroll to first new row.
        if (records.length > 0) {
            var rowIdx = store.indexOf(records[0]);
            if (rowIdx) {
                this.getView().focusRow(rowIdx);
            }
        }

        // If the count is less than the pagesize we've run out of pages.
        var pageSize = store.pageSize;
        if (store.currentPage > 1) {
            pageSize--;
        }
        if (records.length < pageSize) {
            this.down('#loadButton').destroy();
        }

        if (this.commitFilter) {
            store.filter(this.commitFilter);
        }
    },

    _onStoreDataChanged: function() {
        var store = this.store;
        if (store.isFiltered()) {
            var filteredRowCount = store.data.getCount();
            if (filteredRowCount < 1 || (this.filteredRowCount && this.filteredRowCount >= filteredRowCount)) {
                this._loadMore();
            }
            this.filteredRowCount = filteredRowCount;
        }
    }
});