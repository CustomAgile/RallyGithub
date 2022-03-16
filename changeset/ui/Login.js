Ext.define('changset.ui.Login', {
    extend: 'Ext.form.Panel',
    alias: 'widget.changesetlogin',
    cls: 'changeset-login',
    width: 300,
    height: 135,
    layout: 'anchor',
    defaults: {
        anchor: '100%'
    },

    adapter: null,

    items: [{
        xtype: 'textfield',
        fieldLabel: 'Username',
        name: 'username',
        allowBlank: false
    },{
        xtype: 'textfield',
        fieldLabel: 'Password',
        name: 'password',
        inputType: 'password',
        allowBlank: false
    }],

    buttonAlign: 'center',
    buttons: [{
        xtype: 'rallybutton',
        text: 'Login',
        itemId: 'LoginButton'
    }],

    initComponent: function() {
        this.callParent(arguments);
        this.insert(0, {
            html: '<span class="login-message">' + this.adapter.getLoginMessage() + '</span>',
            border: 0,
            margin: '0 0 20 0'
        });

        this.mon(this.down('#LoginButton'), 'click', this._onSubmit, this);
        Ext.each(this.query('textfield'), function(textfield) {
            textfield.on('specialkey', function(field, evt) {
                if (evt.getKey() === evt.ENTER) {
                    this._onSubmit();
                }
            }, this);
        }, this);
    },

    _onSubmit: function() {
        if (this.getForm().isValid()) {
            var values = this.getValues();
            this.adapter.authenticate(values.username, values.password);
        }
    }
});