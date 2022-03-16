Ext.define('changeset.ui.ChangesetBrowser', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.changesetbrowser',
    require: [
        'changeset.ui.ChangesetGrid',
        'changeset.ui.Changeset',
        'changeset.ui.ChangesetFilter',
        'Rally.ui.ComboBox',
        'Rally.ui.tooltip.ToolTip'
    ],
    cls: 'changeset-browser',
    border: 0,
    bodyBorder: false,

    layout: {
        type: 'accordion',
        animate: true
    },

    /**
     * @cfg
     */
    adapter: null,

    initComponent: function() {
        this.callParent(arguments);
        this._populateToolbar();
    },

    _populateToolbar: function() {
        this.addDocked({
            itemId: 'topToolbar',
            xtype: 'toolbar',
            cls: 'changeset-browser-toolbar',
            dock: 'top',
            border: 0,
            padding: 5,
            layout: 'hbox',
            items: [
                {
                    xtype: 'rallybutton',
                    text: 'Logout',
                    margin: '0 5 0 0 ',
                    handler: function() {
                        this.adapter.logout();
                    },
                    scope: this
                }, {
                    xtype: 'rallybutton',
                    text: 'Refresh',
                    margin: '0 5 0 0 ',
                    handler: function() {
                        this.adapter.fireEvent('ready', this.adapter);
                    },
                    scope: this
                }]
        });

        this._addOrganizationChooser();
    },

    _addOrganizationChooser: function() {
        var toolbar = this.down('#topToolbar'),
            valueField = 'login';

        this.adapter.getOrganizationStore(function(store) {
            var combo = toolbar.insert(2, {
                xtype: 'rallycombobox',
                margin: '0 5 0 0',
                store: store,
                fieldLabel: 'Org:',
                labelWidth: 30,
                displayField: valueField,
                // allowNoEntry: true,
                // noEntryText: this.adapter.getUserName(),
                listeners: {
                    beforeselect: function(combo, record) {
                        if (record && record.get('login') !== this.adapter.getOrganization().login) {
                            this._onOrganizationSelect(record);
                        }
                    },
                    scope: this
                }
            });

            store.on('load', function() {
                store.insert(0, [{login: this.adapter.getUserName(), url: null}]);
                var org = this.adapter.getOrganization(),
                    selectedOrg = org ? store.findRecord('login', org.login) : store.getAt(0);
                combo.select(selectedOrg);
                this._onOrganizationSelect(selectedOrg);
            }, this, {single: true});
            store.load();
        }, this);
    },

    _onOrganizationSelect: function(organization) {
        this.adapter.setOrganization(organization);
        this.removeAll();
        this._addRepoChooser();
    },

    _addRepoChooser: function() {
        var toolbar = this.down('#topToolbar'),
            valueField = 'name',
            combo = toolbar.down('#repoChooser');
        if (combo) {
            toolbar.remove(combo);
        }

        this.adapter.getRepositoryStore(function(store) {
            var combo = toolbar.insert(3, {
                xtype: 'rallycombobox',
                itemId: 'repoChooser',
                margin: '0 5 0 0',
                store: store,
                fieldLabel: 'Repo:',
                labelWidth: 30,
                displayField: valueField,
                listeners: {
                    beforeselect: function(combo, record) {
                        if (record && record.get('name') !== this.adapter.getRepository().name) {
                            this._onRepositorySelect(record);
                        }
                    },
                    scope: this
                }
            });

            store.on('load', function() {
                var repo = this.adapter.getRepository();
                var selectedRepo = repo ? store.findRecord('name', repo.name) : store.getAt(0);
                if (selectedRepo) {
                    combo.select(selectedRepo);
                    this._onRepositorySelect(selectedRepo);
                }
            }, this, {single: true});

            store.load();
        }, this);
    },

    _onRepositorySelect: function(repository) {
        this.adapter.setRepository(repository);
        this.removeAll();
        this._addBranchChooser();
    },

    _addBranchChooser: function() {
        var toolbar = this.down('#topToolbar');
        var combo = toolbar.down('#branchChooser');
        if (combo) {
            toolbar.remove(combo);
        }

        var valueField = 'name';
        this.adapter.getBranchStore(function(store) {
            combo = toolbar.insert(4, {
                xtype: 'rallycombobox',
                itemId: 'branchChooser',
                margin: '0 5 0 0',
                store: store,
                fieldLabel: 'Branch:',
                labelWidth: 40,
                displayField: valueField,
                listeners: {
                    beforeselect: function(combo, record) {
                        if (record && record.get('name') !== this.adapter.getBranch().name) {
                            this._onBranchSelect(record);
                        }
                    },
                    scope: this
                }
            });

            store.on('load', function() {
                var currentBranch = this.adapter.getBranch(),
                    branchName = currentBranch ? currentBranch.name : 'master',
                    selectedBranch = store.findRecord('name', branchName);
                selectedBranch = selectedBranch || store.getAt(0);

                combo.select(selectedBranch);
                this._onBranchSelect(selectedBranch);
            }, this, {single: true});
            store.load();
        }, this);
    },

    _onBranchSelect: function(branch) {
        this.adapter.setBranch(branch);
        this.removeAll();
        this._addFilter();
        this._addGrid();
    },

    _addFilter: function() {
        if (this.down('changesetfilter')) {
            return;
        }

        var toolbar = this.down('#topToolbar');
        var filter = toolbar.insert(5, {
            xtype: 'changesetfilter',
            width: 210,
            listeners: {
                filter: this._onFilter,
                afterrender: function(cmp) {
                    var tip = Ext.create('Rally.ui.tooltip.ToolTip', {
                        target: cmp.getEl(),
                        anchor: 'right',
                        hideDelay: 0,
                        html: 'Filter commits by: <br /> <ul><li>-- message</li><li>-- author</li><li>-- revision</li></ul>'
                    });
                },
                scope: this
            }
        });
    },

    _addGrid: function() {
        var callback = function(store) {
            var grid = this.add({
                xtype: 'changesetgrid',
                itemId: 'changeSetGrid',
                margin: 0,
                autoScroll: true,
                model: 'changeset.model.Commit',
                store: store
            });
            //store.load();
            grid.setTitle(Ext.String.format('Commits for <a href="{0}" target="_blank">{1}</a>',
                    this.adapter.getRepositoryUrl(), this.adapter.getRepository().name));
            grid.expand();
            this.mon(grid, 'artifactClicked', this._showArtifact, this);
            this.mon(grid, 'revisionClicked', this._showRevision, this);
        };
        this.adapter.getCommitStore(callback, this);
    },

    _showArtifact: function(formattedId) {
        Ext.data.JsonP.request({
            url: Rally.environment.getServer().getWsapiUrl() + '/artifact.js',
            method: 'GET',
            callbackKey: 'jsonp',
            params: {
                query: '(FormattedID = ' + formattedId + ')'
            },
            success: this._onFormattedIdLoad,
            scope: this
        });
    },

    _onFormattedIdLoad: function(result) {
        if (result.QueryResult) {
            var results = result.QueryResult.Results;
            if (results && results.length) {
                var ref = results[0]._ref;
                //var detailLink = Rally.util.Navigation.createRallyDetailUrl(ref);
                var detailLink = Rally.util.DetailLinkBuilder.build("foo", ref, true);
                window.open(detailLink, 'detailpage');
            }
        }
    },

    _showRevision: function(record) {
        if (this.items.getCount() > 1) {
            this.remove(this.items.getAt(1));
        }
        var revision = this.add({
            xtype: 'changeset',
            adapter: this.adapter,
            title: 'Revision: ' + record.get('revision'),
            autoScroll: true,
            record: record
        });
        revision.expand();
    },

    _onFilter: function(value) {
        var grid = this.down('#changeSetGrid');
        if (grid) {
            grid.expand();
            grid.setCommitFilter(value);
        }
    }
});