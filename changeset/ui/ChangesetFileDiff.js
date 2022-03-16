Ext.define('changeset.ui.ChangesetFileDiff', {
    extend: 'Ext.panel.Panel',
    require: ['changeset.ui.ChangesetSummary', 'changeset.ui.AddComment'],
    alias: 'widget.changesetfilediff',
    cls: 'changeset-file-diff',
    bodyBorder: false,
    dockedItems: [{
        xtype: 'toolbar',
        itemId: 'topToolbar',
        dock: 'top'
    }],

    /**
     * @cfg
     * @private
     * 
     * Regex used to parse unified diff delimiter.
     */
    unifiedDiffRegex: /^@@\s\-(\d+)(,\d+)?\s\+(\d+)(,\d+)?\s@@/,
    
    /**
     * @cfg {changeset.data.CommentLocator}
     * 
     * Used to find comments that need to be rendered at a specific line.
     */
    commentLocator: null,

    initComponent: function() {
        this.callParent(arguments);
        var link = Ext.String.format('<a href="{0}" class="changeset-file">{1}</a>',
            this.record.get('url'), this.record.get('filename'));
        this.getComponent('topToolbar').add([
            {
                html: link,
                listeners: {
                    afterrender: function(cmp) {
                        cmp.getEl().down('.changeset-file').on('click', function(evt) {
                            evt.stopEvent();
                            window.open(this.record.get('url'), 'changesetFile');
                        }, this);
                    },
                    scope: this
                },
                flex: 1
            }
        ]);

        var source = this._renderSourceTable();
        this.add({
            html: source[0],
            autoScroll: true,
            border: 0,
            listeners: {
                afterrender: function(cmp) {
                    Ext.each(source[1], function(commentConfig){
                        Ext.apply(commentConfig, {width: this._getCommentWidth()});
                        Ext.create('changeset.ui.ChangesetSummary', commentConfig);
                    }, this);

                    cmp.getEl().on('mouseover', this._onLineOver, this, {delegate: '.line-code'});
                },
                scope: this
            }
        });
    },

    _renderSourceTable: function() {
        var diffLines = this.record.get('diff').split("\n");
        if (diffLines[diffLines.length - 1] === "\\ No newline at end of file") {
            diffLines.pop();
        }
        var lineDetails,
            commentConfigs = [],
            tableBody = ['<table><tbody>'];
        Ext.each(diffLines, function(line, lineIdx) {
            if (!line) {
                return;
            }
            lineDetails = this._getLineDetails(line, lineDetails);
            tableBody.push(this._renderDiffLine(line, lineIdx, lineDetails));
            var lineComment = this._renderDiffLineComment(lineIdx, commentConfigs);
            if (!Ext.isEmpty(lineComment)) {
                tableBody.push(lineComment);
            }
        }, this);
        tableBody.push('</tbody></table>');
        return [tableBody.join("\n"), commentConfigs];
    },
    
    _renderDiffLine: function (line, lineIdx, lineDetails) {
        var row = [Ext.String.format('<tr class="{0} diff-idx-{1}">', lineDetails.lineCls, lineIdx)];
        row.push(Ext.String.format('<th>{0}</th>', lineDetails.oldLineSymbol));
        row.push(Ext.String.format('<th>{0}</th>', lineDetails.newLineSymbol));
        row.push(Ext.String.format('<td><div class="line-wrapper"><pre class="prettyprint">{0}</pre></div></td>',
            Ext.htmlEncode(line)));
        row.push('</tr>');
        return row.join('');
    },
    
    _renderDiffLineComment: function(lineIdx, commentConfigs) {
        var comments = this.commentLocator.getComments(
            this.record.get('filename'), lineIdx);
        
        if (!comments) {
            return null;
        }
        
        var commentRows = [];
        Ext.each(comments, function(comment, idx) {
            var commentId = this.record.get('filename') + '-' + lineIdx + '-' + idx,
                row = [Ext.String.format('<tr class="line-comment" >')];
            row.push('<th colspan="2">comment</th>');
            row.push(Ext.String.format('<td><div id="{0}" class="changeset-comment"></div></td>', commentId));
            row.push('</tr>');
            commentRows.push(row.join(''));

            commentConfigs.push({
                renderTo: commentId,
                record: comment,
                messageField: 'comment',
                userField: 'user',
                userNameField: 'login',
                revisionField: 'filename'
            });
        }, this);
        return commentRows.join('\n');
    },

    _getLineDetails: function(line, lineDetails) {
        var diffMatch = this.unifiedDiffRegex.exec(line);
        if (diffMatch) {
            lineDetails = {
                oldLineNumber: parseInt(diffMatch[1], 10),
                newLineNumber: parseInt(diffMatch[3], 10),
                oldLineSymbol: 'old',
                newLineSymbol: 'new',
                lineCls: 'line-diff'
            };
        } else {
            var lineType = this._getLineType(line);
            if (lineType === '+') {
                this._getChangeDetail(lineDetails, false, true);
            } else if (lineType === '-') {
                this._getChangeDetail(lineDetails, true, false);
            } else {
                this._getChangeDetail(lineDetails, true, true);
            }
        }

        return lineDetails;
    },

    _getChangeDetail: function(lineDetails, incrementOld, incrementNew) {
        lineDetails.lineCls = 'line-equal';

        if (incrementOld) {
            lineDetails.oldLineSymbol = lineDetails.oldLineNumber.toString();
            lineDetails.oldLineNumber++;
        } else {
            lineDetails.oldLineSymbol = '+';
            lineDetails.lineCls = 'line-add';
        }

        if (incrementNew) {
            lineDetails.newLineSymbol = lineDetails.newLineNumber.toString();
            lineDetails.newLineNumber++;
        } else {
            lineDetails.newLineSymbol = '-';
            lineDetails.lineCls = 'line-remove';
        }

        lineDetails.lineCls += ' line-code line-idx-' + lineDetails.newLineNumber.toString();
    },

    _getLineType: function(line) {
        var marker = line.substring(0,1);
        if (marker === '+') {
            return marker;
        } else if (marker === '-') {
            return marker;
        }

        return '=';
    },

    _showAddComment: function(evt, target, options) {
        // close existing comment
        if (this.addCommentCmp) {
            this.addCommentCmp.fireEvent('cancel', this.addCommentCmp);
        }

        var lineEl = Ext.get(target).up('tr');
        var afterEl = lineEl;
        var nextTr = lineEl.dom.nextSibling;
        while (nextTr && (nextTr.nodeType !== 1 || nextTr.className.match(/line\-comment/))) {
            afterEl = Ext.fly(nextTr);
            nextTr = nextTr.nextSibling;
        }

        var commentEl = Ext.DomHelper.insertAfter(afterEl, {
            tag: 'tr',
            cls: 'line-comment',
            html: '<th colspan="2">comment</th><td><div class="changeset-add-comment"></div></td>'
        }, true);
        commentEl.scrollIntoView(commentEl.up('.x-accordion-body'), false);

        this.addCommentCmp = Ext.create('changeset.ui.AddComment', {
            renderTo: commentEl.down('.changeset-add-comment'),
            margin: 5,
            width: this._getCommentWidth(),
            listeners: {
                save: Ext.bind(this._onSaveComment, this, [lineEl], true),
                cancel: this._onCancelComment,
                afterrender: function() {
                    this.doLayout();
                },
                destroy: function() {
                    this.addCommentCmp = null;
                },
                scope: this
            }
        });
    },

    _getCommentWidth: function() {
        var borderWidth = 1,
            borderCount = 5,
            thWidth = 35,
            thCount = 2,
            paddingWidth = 5;
        return this.getWidth() - (borderWidth * borderCount) - (thWidth * thCount) - (paddingWidth * 2);
    },

    _onSaveComment: function(cmp, comment, options, lineEl) {
        cmp.setLoading(true);

        var lineIdx, diffIdx;
        Ext.each(lineEl.dom.className.split(' '), function(clsName) {
            var lineMatch = clsName.match(/line\-idx\-(\d+)/),
                diffMatch = clsName.match(/diff\-idx\-(\d+)/);
            if (!Ext.isEmpty(lineMatch)) {
                lineIdx = parseInt(lineMatch[1], 10);
            } else if (!Ext.isEmpty(diffMatch)) {
                diffIdx = parseInt(diffMatch[1], 10);
            }
        });

        var data = {
            filename: this.record.get('filename'),
            revision: this.up('changeset').record.get('revision'),
            lineIdx: lineIdx,
            diffIdx: diffIdx,
            comment: comment
        };

        this.adapter.saveComment(data, function(record) {
            var commentEl = cmp.getEl().up('td').insertFirst({tag: 'div', cls: 'changeset-comment'});
            cmp.destroy();

            Ext.create('changeset.ui.ChangesetSummary', {
                renderTo: commentEl,
                width: this._getCommentWidth(),
                record: record,
                messageField: 'comment',
                userField: 'user',
                userNameField: 'login',
                revisionField: 'filename',
                listeners: {
                    afterrender: function() {
                        this.doLayout();
                    },
                    scope: this
                }
            });
        }, this);
    },

    _onCancelComment: function(cmp) {
        var rowEl = cmp.getEl().up('tr');
        cmp.destroy();
        rowEl.destroy();
        this.doLayout();
    },

    _onLineOver: function(evt, target, options) {
        var el = Ext.get(target);
        el.on('mouseleave', Ext.bind(this._onLineOut, this, [el]), this, {single: true});
        el.addCls('line-selected');

        var cellEl = el.down('.line-wrapper');
        var imgEl = cellEl.insertFirst({
            tag: 'img',
            src: 'https://rally1.rallydev.com/slm/js/alm/resources/themes/images/default/feedback/commentbubble.png',
            cls: 'add-comment-icon'
        });

        imgEl.on('mouseover', function() {
            imgEl.addCls('add-comment-icon-selected');
        });

        imgEl.on('mouseout', function() {
            imgEl.removeCls('add-comment-icon-selected');
        });

        imgEl.on('click', this._showAddComment, this);
    },

    _onLineOut: function(el) {
        el.removeCls('line-selected');
        var imgEl = el.down('.add-comment-icon');
        if (imgEl) {
            imgEl.destroy();
        }
    }
});