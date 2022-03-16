Ext.define('changeset.data.github.Proxy', {
    extend: 'Ext.data.proxy.Rest',

    statics: {
        extractCommitData: function(data) {
            var extractCommitValues =  function(data) {
                var output = {
                    revision: data.sha,
                    url: data.url,
                    author: data.author,
                    avatarUrl: data.author ? data.author.avatar_url : null,
                    parents: data.parents
                };

                var commit = data.commit;
                if (commit) {
                    Ext.apply(output, commit);
                    output.timestamp = commit.author.date;
                }
                return output;
            };

            var recordArray = [];
            Ext.Array.each(data, function(dataItem) { 
                recordArray.push(Ext.create('changeset.model.Commit', extractCommitValues(dataItem)));
            });
            
            var result_set = new Ext.data.ResultSet({
                records: recordArray,
                success: true
            });
            return result_set;  

        },

        extractChangesetFileValues: function(data) {
            var extractChangeSetFiles = function(data) {
                var output = {
                    status: data.status,
                    filename: data.filename,
                    url: data.raw_url,
                    deletions: data.deletions,
                    additions: data.additions,
                    changes: data.changes,
                    diff: data.patch
                };
                return output;
            };

            var recordArray = [];
            Ext.Array.each(data.files, function(dataItem) {
                recordArray.push(Ext.create('changeset.model.ChangesetFile', extractChangeSetFiles(dataItem)))
            });
            var result_set = new Ext.data.ResultSet({
                records: recordArray,
                success: true
            });
            return result_set;
        },
        
        extractCommentValues: function(data) {
            var recordArray = [];
            Ext.Array.each(data, function(dataItem) {
                recordArray.push(Ext.create('changeset.model.Comment', changeset.data.github.Proxy.extractComment(dataItem)))
            });

            var result_set = new Ext.data.ResultSet({
                records: recordArray,
                success: true
            });
            return result_set;
        },

        extractComment: function(data) {
                var output = {
                    revision: data.commit_id,
                    filename: data.path,
                    lineNumber: data.position,
                    comment: data.body,
                    timestamp: data.created_at,
                    user: data.user,
                    avatarUrl: data.user ? data.user.avatar_url : null
                };
                return output;
            }
    },

    cors: true,
    stripRallyHeaders: true,
    pageParam: 'page',
    limitParam: 'per_page',
    startParam: undefined
});