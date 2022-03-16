Ext.define('changeset.model.Branch', {
    extend: 'Ext.data.Model',
    idProperty: 'name',
    fields: [
        {name: 'commit', type: 'object'},
        {name: 'name', type: 'string'}
    ]
});