/**
 * Adapter classes contain methods to construct Store objects for use by ui components.
 */
Ext.define('changeset.data.github.Adapter', {
    require: [
        'changeset.model.Changeset',
        'changeset.model.Comment',
        'changeset.data.github.Proxy',
        'changeset.data.github.CommitStore'
    ],
    mixins: {
        observable: 'Ext.util.Observable',
        stateful: 'Ext.state.Stateful'
    },

    /**
     * @cfg {String}
     * Github username
     */
    username: null,

    /**
     * @cfg {changeset.model.Repository}
     * @private
     * Github repository
     */
    repository: null,

    /**
     * @cfg {String}
     * @private
     * OAuth token for Github api
     */
    authToken: null,

    /**
     * @cfg {changeset.model.Branch}
     * Branch to grab commits from
     * @private
     */
    branch: null,

    /**
     * @cfg {String}
     * Base url for all Github api requests.
     */
    apiUrl: 'https://api.github.com',

    /**
     * @cfg {Int}
     * Page size to use for api calls.
     */
    pageSize: 100,

    // these configs setup statefullness
    stateful: true,
    stateEvents: ['ready', 'statechange'],

    constructor: function(config) {
        Ext.apply(this, config);

        var urlParts = window.location.href.split('?');
        this.stateId = 'githubAdapter-' + urlParts[0];
        if (urlParts.length > 1) {
            var urlParams = Ext.Object.fromQueryString(urlParts[1]);
            this.stateId += '-' + urlParams.panelOid || 'page';
        }

        this.addEvents(
            /**
             * @event
             * Fired when the adapter is ready to be used.
             * @param {changeset.data.github.Adapter}
             */
            'ready',
            /**
             * @event
             * Fired when the adapter needs authentication.
             * @param {changeset.data.github.Adapter}
             */
            'authenticationrequired',
            /**
             * @event
             * Fired when the state needs to be saved.
             * @param {changeset.data.github.Adapter}
             */
            'statechange'
        );

        this.mixins.observable.constructor.apply(this, arguments);
        this.mixins.stateful.constructor.apply(this, arguments);

        Ext.Ajax.on('beforerequest', this._onBeforeAjaxRequest, this);
        Ext.Ajax.on('requestexception', this._onAjaxRequestException, this);

        this._init();
    },

    /**
     * Get the current state.
     * @return {Object}
     */
    getState: function() {
        return {
            username: this.username,
            authToken: this.authToken,
            repository: this.repository,
            organization: this.organization,
            branch: this.branch
        };
    },

    /**
     * Get an appropriate login message
     * @return {String}
     */
    getLoginMessage: function() {
        return 'Login to your GitHub account';
    },

    /**
     * Get the currently logged in user's username
     * @return {String}
     */
    getUserName: function() {
        return this.username;
    },

    /**
     * Return a url to the repository.
     * @return {String}
     */
    getRepositoryUrl: function() {
        return 'https://github.com/' + this._getRepoPath();
    },

    /*
     * Gets the currently selected repository.
     * @return {Object}
     */
    getRepository: function() {
        return this.repository;
    },

    /*
     * Set the repository to fetch data from.
     * @param {changeset.model.Repository}
     */
    setRepository: function(repository) {
        if( !this.repository || this.repository.name !== repository.get('name') ) {
            this.branch = null;
        }
        this.repository = repository.raw;
        this.fireEvent('statechange', this);
    },

    /*
     * Gets the currently selected organization.
     * @return {Object}
     */
    getOrganization: function() {
        return this.organization;
    },

    /*
     * Set the repository to fetch data from.
     * @param {changeset.model.Repository}
     */
    setOrganization: function(organization) {
        if (!this.organization || this.organization.login !== organization.get('login')) {
            this.repository = null;
            this.branch = null;
        }
        this.organization = organization.raw || organization.data;
        this.fireEvent('statechange', this);
    },

    /*
     * Gets the currently selected branch.
     * @return {Object}
     */
    getBranch: function() {
        return this.branch;
    },

    /*
     * Set the branch to fetch data from.
     * @param {changeset.model.Branch}
     */
    setBranch: function(branch) {
        this.branch = branch.raw;
        this.fireEvent('statechange', this);
    },

    /**
     * Constructs a store which populates organization models.
     * @param {Function} callback Function to call after store is created.
     * @param {Object} scope Scope to execute callback with.
     */
    getOrganizationStore: function(callback, scope) {
        var url = [
            this.apiUrl,
            'users',
            this.username,
            'orgs'
        ].join('/');

        var store = Ext.create('Ext.data.Store', {
            model: 'changeset.model.Organization',
            proxy: Ext.create('changeset.data.github.Proxy', {
                url: url
            })
        });

        callback.call(scope, store);
    },

    /**
     * Constructs a store which populates repository models.
     * @param {Function} callback Function to call after store is created.
     * @param {Object} scope Scope to execute callback with.
     */
    getRepositoryStore: function(callback, scope) {
        var url = [this.apiUrl];

        if (this.organization.url) {
            url = url.concat([
                'orgs',
                this.organization.login,
                'repos'
            ]);
        } else {
            url = url.concat([
                'user',
                'repos'
            ]);
        }

        var store = Ext.create('Ext.data.Store', {
            model: 'changeset.model.Repository',
            proxy: Ext.create('changeset.data.github.Proxy', {
                url: url.join('/')
            }),
            buffered: true,
            pageSize: this.pageSize,
            listeners: {
                load: {
                    fn: function(store, records, successful, eOpts) {
                        if (successful && records.length === store.pageSize) {
                            store.prefetchPage(store.currentPage + 1);
                            return false;
                        }
                    },
                    single: true
                },
                prefetch: function(store, records, successful, operation, eOpts) {
                    if (successful) {
                        store.add(records);
                        if (records.length === store.pageSize) {
                            store.prefetchPage(store.currentPage + 1);
                        } else {
                            store.fireEvent('load');
                        }
                    }
                }
            }
        });

        callback.call(scope, store);
    },

    /**
     * Constructs a store which populates branch models.
     * @param {Function} callback Function to call after store is created.
     * @param {Object} scope Scope to execute callback with.
     */
    getBranchStore: function(callback, scope) {
        var url = [
            this.apiUrl,
            'repos',
            this._getRepoPath(),
            'branches'
        ].join('/');

        var store = Ext.create('Ext.data.Store', {
            model: 'changeset.model.Branch',
            proxy: Ext.create('changeset.data.github.Proxy', {
                url: url
            })
        });

        callback.call(scope, store);
    },

    /**
     * Returns a store which populates commit models.
     * @param {Function} callback Function to call after store is created.
     * @param {Object} scope Scope to execute callback with.
     */
    getCommitStore: function(callback, scope) {
        this.getBranchStore(function(store) {
            store.on('load', function(store) {
                this._onBranchLoad(store, callback, scope);
            }, this, {single: true});
            store.load();
        }, this);
    },

    /**
     * Returns a store which populates changeset models.
     * @param {changeset.model.Commit} record Commit to get changeset for.
     * @param {Function} callback Function to call after store is created.
     * @param {Object} scope Scope to execute callback with.
     */
    getChangesetStore: function(record, callback, scope) {
        if (record.get('parents').length < 1) {
            callback.call(scope, null);
            return;
        }

        var url = [
            this.apiUrl,
            'repos',
            this._getRepoPath(),
            'compare',
            record.get('parents')[0].sha + '...' + record.get('revision')
        ].join('/');

        var store = Ext.create('Ext.data.Store', {
            model: 'changeset.model.ChangesetFile',
            proxy: Ext.create('changeset.data.github.Proxy', {
                url: url,
                reader: {
                    type: 'json',
                    readRecords: changeset.data.github.Proxy.extractChangesetFileValues
                }
            })
        });

        callback.call(scope, store);
    },
    
    /**
     * Returns a store which populates comment models.
     * @param {changeset.model.Commit} record Commit record to retrieve comments for.
     * @param {Function} callback Function to call after store is created.
     * @param {Object} scope Scope to execute callback with.
     */
    getCommentStore: function(record, callback, scope) {
        var url = [
            this.apiUrl,
            'repos',
            this._getRepoPath(),
            'commits',
            record.get('revision'),
            'comments'
        ].join('/');

        var store = Ext.create('Ext.data.Store', {
            model: 'changeset.model.Comment',
            pageSize: this.pageSize,
            proxy: Ext.create('changeset.data.github.Proxy', {
                url: url,
                reader: {
                    type: 'json',
                    readRecords: changeset.data.github.Proxy.extractCommentValues
                }
            })
        });

        callback.call(scope, store);
    },

    /**
     * Saves a comment
     * 
     * @param data {Object} The comment data to save
     * @param callback {Function} The callback to be executed when the save is complete.
     * @param scope {Object} The scope to execute the callback in.
     */
    saveComment: function(data, callback, scope) {
        var url = [
            this.apiUrl,
            'repos',
            this._getRepoPath(),
            'commits',
            data.revision,
            'comments'
        ].join('/');

        Ext.Ajax.request({
            url: url,
            method: 'POST',
            jsonData: {
                body: data.comment,
                commit_id: data.revision,
                line: data.lineIdx,
                path: data.filename,
                position: data.diffIdx
            },
            success: function(response, opts) {
                if (callback) {
                    var data = Ext.decode(response.responseText);
                    var record = new changeset.model.Comment(changeset.data.github.Proxy.extractComment(data));
                    callback.call(scope, record);
                }
            },
            scope: this
        });
    },

    /**
     * Grabs an OAuth token using the passed credentials.
     * If this is successful, it will fire the 'ready' event,
     * if it fails, it will fire  the 'authenticationrequired' event.
     * 
     * @param {String} username Username to login with.
     * @param {String} password Password to login with.
     */
    authenticate: function(username, password) {
        this.username = username;               

        Ext.Ajax.request({
            url: this.apiUrl + '/authorizations',
            method: 'GET',
            headers: {
                Authorization: this._getBasicAuth(password)
            },
            success: function(response, opts) {
                var data = Ext.decode(response.responseText);
                var tokenLength = data.length;
                for (var i = 0; i < tokenLength; i++) {
                    var token = data[i];
                    if (token.note === 'RallyGithub') {
                        this.authToken = token.token;
                        this.fireEvent('ready', this);
                        return;
                    }
                }
                this._getNewToken(password);
            },
            failure: function(response, opts) {
                this.fireEvent('authenticationrequired', this);
            },
            scope: this
        });
    },

    /**
     * Logs user out of github api.
     * 
     * Fires 'authenticationrequired'.
     */
    logout: function() {
        this.repository = null;
        this.organization = null;
        this.branch = null;
        this.username = null;
        this.authToken = null;
        Ext.state.Manager.getProvider().clear(this.getStateId());
        this.fireEvent('authenticationrequired', this);
    },

    /**
     * Returns basic authentication details.
     */
    _getBasicAuth: function(password) {
        return 'Basic ' + btoa(this.username + ':' + password);
    },

    /**
     * Creates and uses a new OAuth token.
     */
    _getNewToken: function(password) {
        Ext.Ajax.request({
            url: this.apiUrl + '/authorizations',
            method: 'POST',
            headers: {
                Authorization: this._getBasicAuth(password)
            },
            jsonData: {
                note: 'RallyGithub',
                scopes: ['public_repo', 'repo']
            },
            success: function(response, opts) {
                var data = Ext.decode(response.responseText);
                this.authToken = data.token;
                this.fireEvent('ready', this);
            },
            failure: function(response, opts) {
                this.fireEvent('authenticationrequired', this);
            },
            scope: this
        });
    },

    _getRepoPath: function() {
        return this.repository.owner.login + '/' + this.repository.name;
    },

    _init: function() {
        if (!Ext.isEmpty(this.authToken)) {
            this.fireEvent('ready', this);
        } else {
            this.fireEvent('authenticationrequired', this);
        }
    },

    _onBeforeAjaxRequest: function(ext, opts) { 
        if (Ext.isEmpty(opts.headers)) {
            opts.headers = {};
        }

        if (!opts.headers.hasOwnProperty('Authorization') && this.authToken) {
            opts.headers.Authorization = 'token ' + this.authToken;
        }
    },

    _onAjaxRequestException: function(conn, response, options, eOpts) {
        if (response.status === 401) {
            this.fireEvent('authenticationrequired', this);
        }
    },

    _onBranchLoad: function(store, callback, scope) {
        var url = [
            this.apiUrl,
            'repos',
            this._getRepoPath(),
            'commits'
        ].join('/');

        var commitStore = Ext.create('changeset.data.github.CommitStore', {
            startSha: this.branch.commit.sha,
            pageSize: this.pageSize,
            clearOnPageLoad: false,
            filterOnLoad: false,
            proxy: Ext.create('changeset.data.github.Proxy', {
                 url: url,
                 reader: {
                     type: 'json',
                     readRecords: changeset.data.github.Proxy.extractCommitData 
                 }
             })
        });
        commitStore.load({
            scope: this,
            callback: function(records, operation, success) {
                callback.call(scope, commitStore);    
            }
        });
        
    },

    _getChangeset: function(record, callback, scope) {
        var url = [
            this.apiUrl,
            'repos',
            this._getRepoPath(),
            'compare',
            record.get('parents')[0].sha + '...' + record.get('revision')
        ].join('/');

        Ext.Ajax.request({
            url: url,
            method: 'GET',
            jsonData: {},
            success: function(response, opts) {
                var data = Ext.decode(response.responseText);
                callback.call(scope, data);
            },
            scope: this
        });
    }
});