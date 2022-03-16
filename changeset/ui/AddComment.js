Ext.define('changeset.ui.AddComment', {
    extend: 'Ext.form.Panel',
    alias: 'widget.addcomment',
    cls: 'changeset-add-comment',
    frame: true,
    height: 135,
    layout: 'anchor',
    defaults: {
        anchor: '100%'
    },

    adapter: null,

    items: [{
        xtype: 'textarea',
        name: 'comment',
        allowBlank: false,
        height: 90
    }],

    buttonAlign: 'center',
    buttons: [{
        xtype: 'rallybutton',
        itemId: 'SubmitButton',
        text: 'Save'
    }, {
        xtype: 'rallybutton',
        itemId: 'CancelButton',
        ui: 'link',
        text: 'Cancel'
    }],

    initComponent: function() {
        this.callParent(arguments);

        this.addEvents([
            /**
             * @event
             * fired when comment requires persisting.
             * @param {Ext.Component}
             * @param {String}
             */
            'save',
            /**
             * @event
             * fired when comment edit is canceled.
             * @param {Ext.Component}
             */
            'cancel'
        ]);

        this.mon(this.down('#SubmitButton'), 'click', this._onSubmitClick, this);
        this.mon(this.down('#CancelButton'), 'click', this._onCancelClick, this);
    },

    _onSubmitClick: function() {
        if (this.getForm().isValid()) {
            var values = this.getValues();
            this.fireEvent('save', this, values.comment);
        }
    },

    _onCancelClick: function() {
        this.fireEvent('cancel', this);
    }
});