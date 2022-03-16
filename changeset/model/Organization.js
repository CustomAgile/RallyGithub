Ext.define('changeset.model.Organization', {
    extend: 'Ext.data.Model',
    idProperty: 'login',
    fields: [
        {name: 'url', type: 'string'},
        {name: 'login', type: 'string'}
    ]
});