Ext.define('changeset.model.ChangesetFile', {
    extend: 'Ext.data.Model',
    fields: [
        {name: 'status', type: 'string'},
        {name: 'filename', type: 'string'},
        {name: 'url', type: 'string'},
        {name: 'deletions', type: 'integer'},
        {name: 'additions', type: 'integer'},
        {name: 'changes', type: 'integer'},
        {name: 'diff', type: 'string'}
    ]
});