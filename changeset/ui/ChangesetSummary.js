Ext.define('changeset.ui.ChangesetSummary', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.changesetsummary',
    cls: 'changeset-summary',
    frame: true,
    
    /**
     * @cfg
     */
    messageField: 'message',
    
    /**
     * @cfg
     */
    avatarField: 'avatarUrl',
    
    /**
     * @cfg
     */
    userField: 'author',
    
    /**
     * @cfg
     */
    userNameField: 'name',
    
    /**
     * @cfg
     */
    timestampField: 'timestamp',
    
    /**
     * @cfg
     */
    revisionField: 'revision',
    
    dockedItems: [{
        xtype: 'toolbar',
        itemId: 'bottomToolbar',
        dock: 'bottom',
        border: 0
    }],

    initComponent: function() {
        this.callParent(arguments);
        this._initItems();
    },
    
    _initItems: function() {
        if (!this.record) {
            return;
        }

        this.html = '<p>' + this.record.get(this.messageField) + '</p>';

        var toolbar = this.getComponent('bottomToolbar');
        if (!Ext.isEmpty(this.record.get(this.avatarField))) {
            toolbar.add([{
               margin: '2 6 2 2',
               xtype: 'changesetavatar',
               record: this.record,
               width: 40,
               height: 40
           }]);
        }

        toolbar.add([
            {
                html: this.record.get(this.userField)[this.userNameField]
            },{
                html: Ext.Date.format(new Date(this.record.get(this.timestampField)), 'Y-m-d h:i:s A')
            },{
                html: this.record.get(this.revisionField)
            }
        ]);
    }
});
