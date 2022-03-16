Ext.define('changeset.model.Repository', {
    extend: 'Ext.data.Model',
    idProperty: 'name',
    fields: [
        {name: 'url', type: 'string'},
        {name: 'name', type: 'string'}
    ]
});