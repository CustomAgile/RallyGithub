Ext.define('changeset.ui.Avatar', {
    extend: 'Ext.Component',
    alias: 'widget.changesetavatar',
    cls: 'changeset-avatar',
    frame: true,
    border: 0,
    bodyBorder: false,

    listeners: {
        afterrender: function(cmp) {
            var avatarUrl = this.record.get('avatarUrl');
            if (!Ext.isEmpty(avatarUrl)) {
                avatarUrl += '&s=' + this.getWidth().toString();
                cmp.getEl().setStyle('background-image', 'url(' + avatarUrl + ')');
            }
        }
    }
});