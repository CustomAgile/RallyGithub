Ext.define('changeset.ui.ChangesetFilesGrid', {
    extend: 'Rally.ui.grid.Grid',
    alias: 'widget.changesetfilesgrid',
    cls: 'changeset-files-grid',
    storeConfig: {
        fetch: true,
        sorters: [{
            property: 'filename',
            direction: 'ASC'
        }]
    },
    columnCfgs: [{
        header: 'Status',
        dataIndex: 'status',
        renderer: function(value) {
            return Ext.String.capitalize(value.substring(0,3));
        },
        width: 50
    },{
        header: 'File',
        xtype: 'templatecolumn',
        tpl: '<a href="#" class="file-name">{filename}</a>',
        flex: 1,
        listeners: {
            click: function(target, dom, index) {
                Ext.query('.changeset-file-diff')[index].scrollIntoView();
            }
        }
    },{
        header: 'Changes',
        dataIndex: 'changes',
        width: 65
    },{
        header: 'Additions',
        dataIndex: 'additions',
        width: 65
    },{
        header: 'Deletions',
        dataIndex: 'deletions',
        width: 65
    }],

    constructor: function(config) {
        config = config || {};
        Ext.applyIf(config, {
            columnCfgs: this.columnCfgs,
            storeConfig: this.storeConfig,
            showPagingToolbar: false
        });
        
        this.callParent([config]);
    }
});