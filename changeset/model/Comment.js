Ext.define('changeset.model.Comment', {
    extend: 'Ext.data.Model',
    fields: [
        {name: 'revision', type: 'string'},
        {name: 'filename', type: 'string'},
        {name: 'lineNumber', type: 'string'},
        {name: 'user', type: 'object'},
        {name: 'avatarUrl', type: 'string'},
        {name: 'comment', type: 'string'},
        {name: 'timestamp', type: 'date'}
    ]
});