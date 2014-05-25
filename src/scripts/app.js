(function(window) {
    'use strict';

    var get = function(url) {
        return m.request({method: 'GET', url: url})
    }

    // Pagination for tables
    var mPaginate = {};

    mPaginate.list = m.prop([]);
    mPaginate.rowsPerPage = m.prop(3);
    mPaginate.startPage = m.prop(0);
    mPaginate.endPage = m.prop(5);
    mPaginate.headers = m.prop([]);
    mPaginate.cells = m.prop([]);

    mPaginate.controller = function() {

        this.currentPage = m.prop(1);
        this.rowsPerPage = mPaginate.rowsPerPage;
        this.startPage = mPaginate.startPage;
        this.endPage = mPaginate.endPage;
        this.list = mPaginate.list;
        this.headers = mPaginate.headers;
        this.cells = mPaginate.cells;

        this.paginated = function() {
            return this.list().slice((this.currentPage()-1) * this.rowsPerPage(),
                ((this.currentPage()-1)*this.rowsPerPage()) + this.rowsPerPage())
        }.bind(this);

        this.numPages = function() {
            var numPages = 0;
            if (this.list() !== null && this.rowsPerPage() !== null) {
                numPages = Math.ceil(this.list().length / this.rowsPerPage());
            }
            return range(1, numPages+1);
        }.bind(this);

        this.showPage = function(e) {
            this.currentPage(e.target.innerHTML);
        }.bind(this);

        this.nextPage = function() {
            var start = this.startPage();
            var end = this.endPage();
            if (this.endPage() !== this.numPages()) {
                this.startPage(start + 1);
                this.endPage(end + 1);
            }
        }.bind(this);

        this.prevPage = function() {
            var start = this.startPage();
            var end = this.endPage();
            if (this.startPage() > 0) {
                this.startPage(start - 1);
                this.endPage(end - 1);
            }
        }.bind(this);
    }

    mPaginate.view = function(ctrl) {
        return m('div', [
            m('table.table', [
                m('thead', [
                    m('tr', [
                        ctrl.headers().map(function(header, index) {
                            return m('th', header)
                        })
                    ])
                ]),
                m('tbody', [
                    ctrl.paginated().map(function(item, index) {
                        return m('tr', {class: item.chatID == transcripts.chatID() ? 'selected' : null}, [
                            ctrl.cells().map(function(cell, index) {
                                if (typeof(cell) === 'string') {
                                    return m('td', item[cell])
                                } else if (typeof(cell) === 'function') {
                                    return m('td', [
                                        cell.call(item)
                                    ])
                                }
                            })
                        ])
                    })
                ]),
            ]),
            m('ul.list-inline.text-center', [
                ctrl.startPage() > 0 ? m('li', [ m('a.btn.btn-default.btn-sm', {onclick: ctrl.prevPage}, '<<' )]) : null,
                ctrl.numPages().length < 2 ? null : ctrl.numPages().slice(ctrl.startPage(), ctrl.endPage()).map(function(page, index) {
                    return m('li', [
                        m('a', {
                            onclick: m.withAttr('innerHTML', ctrl.currentPage),
                            class: ctrl.currentPage() == page ? 'btn btn-default btn-sm active' : 'btn btn-default btn-sm'}, page)
                        ])
                    }),
                ctrl.numPages().length > ctrl.endPage() ? m('li', [ m('a.btn.btn-default.btn-sm', {onclick: ctrl.nextPage}, '>>')]) : null
            ])
        ])
    }

    var metrics = {};

    metrics.controller = function() {
        this.sso = m.route.param('sso') || null;
        var url = '/api/chats/sso/'+this.sso;
    }

    metrics.view = function(ctrl) {};

    var chats = {};

    chats.loadButton = function() {
        return m('button[type=button].btn.btn-sm', {
            onclick: transcripts.get,
            value: this.chatID,
            style: {visibility: this.chatID == transcripts.chatID() ? 'hidden' : 'visible'}
        }, 'Load')
    }

    // Model
    chats.account = m.prop('');
    chats.accountType = m.prop('ddi');

    chats.paginate = Object.create(mPaginate);
    chats.paginate.headers(['Transcript', 'Date', 'Customer', 'Racker']);
    chats.paginate.cells([chats.loadButton, 'answeredAt', 'customerName', 'rackerName']);

    // Controller
    chats.controller = function() {
        this.account = chats.account;
        this.accountType = chats.accountType;

        this.search = function(e) {
            e.preventDefault();
            if (!isNaN(parseInt(this.account()))) {
                var url = 'api/chats/' + this.accountType() + '/' + this.account();
                get(url)
                    .then(function(list) {
                        chats.paginate.list(list);
                        return m.module(document.getElementById('table'), chats.paginate);
                    })
            }
        }.bind(this);
    };

    // View
    chats.view = function(ctrl) {
        return m('div.row#app', [
            m('div.col-md-6#chats', [
                m('form[role=form].form-inline', {
                    onsubmit: ctrl.search
                }, [
                    m('div.form-group', [
                        m('label[for=account].sr-only', 'account'),
                        m('input[placeholder=Account Number].form-control#account', {
                            onchange: m.withAttr('value', ctrl.account),
                            value: ctrl.account()
                        }),
                    ]),
                    m('div.btn-group', {'data-toggle': 'buttons'}, [
                        m('label.btn.btn-primary.btn-sm.active', {
                            onclick: m.withAttr('value', ctrl.accountType),
                            value: 'ddi'
                            }, [ 'DDI', m('input[type=radio]')
                        ]),
                        m('label.btn.btn-primary.btn-sm', {
                            onclick: m.withAttr('value', ctrl.accountType),
                            value: 'core'
                            }, ['Core', m('input[type=radio].btn.btn-default.btn-sm')
                        ]),
                        m('label.btn.btn-primary.btn-sm', {
                            onclick: m.withAttr('value', ctrl.accountType),
                            value: 'ea'
                            }, [ 'E&A', m('input[type=radio].btn.btn-default.btn-sm')
                        ]),
                    ])
                ]),
                m('div#table')
            ]),
            m('div.col-md-6.unextended#transcripts')
        ])
    };

    var transcripts = {};

    // Model
    transcripts.chatID = m.prop('');
    transcripts.list = m.prop([]);
    transcripts.sized = m.prop(false);
    transcripts.extended = m.prop(false);

    transcripts.get = function(e) {
        var url = 'api/transcripts/' + e.target.value;
        transcripts.chatID(e.target.value);
        m.module(document.getElementById('transcripts'), transcripts);
        get(url)
            .then(transcripts.list)
            .then(function() { $('#transcripts').scrollTop(0); })
    }

    // Controller
    transcripts.controller = function() {

        this.sized = transcripts.sized;
        this.extended = transcripts.extended;
        this.list = transcripts.list;

        this.resize = function() {
            if (this.sized()) {
                this.sized(false);
                transcriptMinimize();
            } else {
                this.sized(true);
                transcriptMaximize();
            }
        }.bind(this)

        this.extend = function() {
            if (this.extended()) {
                this.extended(false);
                transcriptUndoExtend();
            } else {
                this.extended(true);
                transcriptDoExtend();
            }
        }.bind(this)
    }

    // View
    transcripts.view = function(ctrl) {
        return m('div', [
            m('div#transcripts-controls', [
                m('i.fa.fa-text-height.fa-2x', {onclick: ctrl.extend, class: ctrl.extended() ? 'enabled' : ''}),
                m('i.fa.fa-text-width.fa-2x', {onclick: ctrl.resize, class: ctrl.sized() ? 'enabled' : ''})
            ]),
            ctrl.list().map(function(transcript, index) {
                return [
                    m('div.text-line', [
                        m('span[style=font-style:oblique]', moment(transcript.createdAt).format('h:mma').toString() + ' '),
                        m('span', {style: {color: transcript.personType ? '#660000' : '#003399', fontWeight: 'bold'}}, transcript.name + ': '),
                        m('span', transcript.text)
                    ])
                ]
            })
        ])
    }

    // jQuery Utilities
    var transcriptMaximize = function() {
        $('#transcripts').removeClass('col-md-6');
        $('#transcripts').addClass('col-md-8');
        $('#chats').removeClass('col-md-6');
        $('#chats').addClass('col-md-4');
    }

    var transcriptMinimize = function() {
        $('#transcripts').removeClass('col-md-8');
        $('#transcripts').addClass('col-md-6');
        $('#chats').removeClass('col-md-4');
        $('#chats').addClass('col-md-6');
    }

    var transcriptDoExtend = function() {
        $('#transcripts').removeClass('unextended');
        $('#transcripts').addClass('extended');
    }

    var transcriptUndoExtend = function() {
        $('#transcripts').removeClass('extended');
        $('#transcripts').addClass('unextended');
    }

    // Underscore range function
    var range = function(start, stop, step) {
        if (arguments.length <= 1) {
              stop = start || 0;
              start = 0;
            }
            step = arguments[2] || 1;

            var length = Math.max(Math.ceil((stop - start) / step), 0);
            var idx = 0;
            var range = new Array(length);

            while(idx < length) {
              range[idx++] = start;
              start += step;
            }

            return range;
    }

    m.route.mode = 'pathname';
    m.route(document.getElementById('main'), '/', {
        '/': chats,
        '/metrics': metrics,
        '/metrics/:sso': metrics
    });

})(window);
