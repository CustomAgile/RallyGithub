Ext.define('changset.ui.ChangesetFilter', {
    extend: 'Ext.form.Panel',
    alias: 'widget.changesetfilter',
    cls: 'changeset-filter',
    border: 0,
    layout: 'hbox',

    items: [{
        xtype: 'textfield',
        itemId: 'FilterText',
        name: 'filtertext',
        width: 150
    },{
        xtype: 'rallybutton',
        itemId: 'FilterButton',
        text: 'Filter',
        margin: '0 0 0 4'
    }],

    constructor: function() {
        this.callParent(arguments);

        this.addEvents([
            /**
             * @event
             * fired when the filter button is clicked.
             * @param {String}
             */
            'filter'
        ]);
    },

    initComponent: function() {
        this.callParent(arguments);

        this.mon(this.down('#FilterButton'), 'click', this._onSubmit, this, {});
        this.mon(this.down('#FilterText'), 'specialkey', function(field, evt) {
            if (evt.getKey() === evt.ENTER) {
                this._onSubmit();
            }
        }, this);
    },

    _onSubmit: function() {
        var value = Ext.String.escape(this.down('#FilterText').getValue());
        this.fireEvent('filter', value);
    }
});