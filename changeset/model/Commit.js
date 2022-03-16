Ext.define('changeset.model.Commit', {
    extend: 'Ext.data.Model',
    idProperty: 'revision',
    fields: [
        {name: 'revision', type: 'string'},
        {name: 'url', type: 'string'},
        {name: 'author', type: 'object'},
        {name: 'avatarUrl', type: 'string'},
        {name: 'timestamp', type: 'date'},
        {name: 'message', type: 'string'},
        {name: 'tree', type: 'object'},
        {name: 'parents', type: 'array'}
    ]
});