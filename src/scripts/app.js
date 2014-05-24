(function(window) {
    'use strict';

    var get = function(url) {
        return m.request({method: 'GET', url: url})
    }

    var metrics = {};

    metrics.controller = function() {};
    metrics.view = function(ctrl) { return m('div', 'Metrics')};

    var chats = {};

    chats.chatID = m.prop('');
    chats.list = m.prop([]);
    chats.trans = m.prop([]);
    chats.accountType = m.prop('ddi');
    chats.currentAccount = m.prop('');
    chats.lastAccount = m.prop('');

    chats.controller = function() {
        this.chatID = chats.chatID;
        this.list = chats.list;
        this.accountType = chats.accountType;
        this.account = chats.currentAccount;
        this.lastAccount = chats.lastAccount;
        this.trans = chats.trans;

        this.sized = false;
        this.extended = false;
        this.rowsPerPage = 6;
        this.currentPage = 1;
        this.startPage = 0;
        this.endPage = 5;

        this.paginated = function() {
            return this.list().slice((this.currentPage-1) * this.rowsPerPage,
                ((this.currentPage-1)*this.rowsPerPage) + this.rowsPerPage)
        }.bind(this);

        this.numPages = function() {
            var numPages = 0;
            if (this.list() !== null && this.rowsPerPage !== null) {
                numPages = Math.ceil(this.list().length / this.rowsPerPage);
            }
            return range(1, numPages+1);
        }.bind(this);

        this.showPage = function(e) {
            this.currentPage = e.target.innerHTML;
            chats.clearSelected();
            chats.tableRender(this);
            chats.controlsRender(this);
        }.bind(this);

        this.nextPage = function() {
            if (this.endPage !== this.numPages) {
                ++this.startPage;
                ++this.endPage;
                chats.controlsRender(this);
            }
        }.bind(this);

        this.prevPage = function() {
            if (this.startPage > 0) {
                --this.startPage;
                --this.endPage;
                chats.controlsRender(this);
            }
        }.bind(this);

        this.search = function(e) {
            e.preventDefault();
            if (this.lastAccount() !== this.account()) {
                chats.clearSelected();
            }
            if (!isNaN(parseInt(this.account()))) {
                this.currentPage = 1;
                var url = 'api/chats/' + this.accountType() + '/' + this.account();
                get(url)
                    .then(this.list)
                    .then(function() { return chats.tableRender(this)}.bind(this))
                    .then(function() { return chats.controlsRender(this)}.bind(this))
            }
        }.bind(this);

        this.transcript = function(e) {
            var url = 'api/transcripts/' + e.target.value;
            this.chatID(e.target.value);
            this.lastAccount(this.account());
            chats.clearSelected();
            chats.makeSelected(e.target);
            get(url)
                .then(this.trans)
                .then(function() { return chats.transcriptRender(this)}.bind(this))
        }.bind(this);

        this.resize = function() {
            if (this.sized) {
                this.sized = false;
                chats.transcriptMinimize();
                chats.transcriptRender(this);
            } else {
                this.sized = true;
                chats.transcriptMaximize();
                chats.transcriptRender(this);
            }
        }.bind(this)

        this.extend = function() {
            if (this.extended) {
                this.extended = false;
                chats.transcriptUndoExtend();
                chats.transcriptRender(this);
            } else {
                this.extended = true;
                chats.transcriptDoExtend();
                chats.transcriptRender(this);
            }
        }.bind(this)

    };

    chats.view = function(ctrl) {
        return m('div.row', [
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
                    ]),
                    m('div#table'),
                    m('div#controls')
                ])
            ]),
            m('div#transcript-controls', [
                m('span#transcript-extend', {onclick: ctrl.extend}),
                m('span#transcript-resize', {onclick: ctrl.resize})
            ]),
            m('div.col-md-6.unextended#transcript')
        ])
    };

    chats.table = function(ctrl) {
        return m('table.table', [
            m('thead', [
                m('tr', [
                    m('th', 'Transcript'),
                    m('th', 'Date'),
                    m('th', 'Customer'),
                    m('th', 'Racker')
                ])
            ]),
            m('tbody', [ ctrl.paginated().map(function(chat, index) {
                return m('tr', [
                    m('td', [
                        m('button[type=button].btn.btn-sm', {
                            onclick: ctrl.transcript,
                            value: chat.chatID
                        }, 'Load')
                    ]),
                    m('td', moment(chat.answeredAt).format('MM-DD-YYYY h:mma')),
                    m('td', chat.customerName),
                    m('td', chat.rackerName)
                ])
            })])
        ]);
    }

    chats.tableRender = function(ctrl) {
        m.render(document.getElementById('table'), chats.table(ctrl));
        if (ctrl.chatID()) chats.makeSelected('.btn[value='+ctrl.chatID()+']');
    }

    chats.controls = function(ctrl) {
        return m('ul.list-inline.text-center', [
            ctrl.startPage > 0 ? m('li', [ m('a.btn.btn-default.btn-sm', {onclick: ctrl.prevPage}, '<<' )]) : null,
            ctrl.numPages().length < 2 ? null : ctrl.numPages().slice(ctrl.startPage, ctrl.endPage).map(function(page, index) {
                return m('li', [
                    m('a', {
                        onclick: ctrl.showPage,
                        class: ctrl.currentPage == page ? 'btn btn-default btn-sm active' : 'btn btn-default btn-sm'},
                    page)
                ])
            }),
            ctrl.numPages().length > ctrl.endPage ? m('li', [ m('a.btn.btn-default.btn-sm', {onclick: ctrl.nextPage}, '>>')]) : null
        ])
    }

    chats.controlsRender = function(ctrl) {
        m.render(document.getElementById('controls'), chats.controls(ctrl));
    }

    chats.transcript = function(ctrl) {
        return ctrl.trans().map(function(transcript, index) {
            return [
                m('div.text-line', [
                    m('span[style=font-style:oblique]', moment(transcript.createdAt).format('h:mma').toString() + ' '),
                    m('span', {style: {color: transcript.personType ? '#660000' : '#003399', fontWeight: 'bold'}}, transcript.name + ': '),
                    m('span', transcript.text)
                ])
            ]
        });
    }

    chats.transcriptResize = function(ctrl) {
        if (ctrl.sized) {
            return m('i.fa.fa-text-width.fa-2x.enabled');
        } else {
            return m('i.fa.fa-text-width.fa-2x');
        }
    }

    chats.transcriptExtend = function(ctrl) {
        if (ctrl.extended) {
            return m('i.fa.fa-text-height.fa-2x.enabled');
        } else {
            return m('i.fa.fa-text-height.fa-2x');
        }
    }

    chats.transcriptRender = function(ctrl) {
        m.render(document.getElementById('transcript'), chats.transcript(ctrl));
        m.render(document.getElementById('transcript-resize'), chats.transcriptResize(ctrl));
        m.render(document.getElementById('transcript-extend'), chats.transcriptExtend(ctrl));
        $('#transcript').scrollTop(0);
    }

    chats.transcriptMaximize = function() {
        $('#transcript').removeClass('col-md-6');
        $('#transcript').addClass('col-md-8');
        $('#chats').removeClass('col-md-6');
        $('#chats').addClass('col-md-4');
    }

    chats.transcriptMinimize = function() {
        $('#transcript').removeClass('col-md-8');
        $('#transcript').addClass('col-md-6');
        $('#chats').removeClass('col-md-4');
        $('#chats').addClass('col-md-6');
    }

    chats.transcriptDoExtend = function() {
        $('#transcript').removeClass('unextended');
        $('#transcript').addClass('extended');
    }

    chats.transcriptUndoExtend = function() {
        $('#transcript').removeClass('extended');
        $('#transcript').addClass('unextended');
    }

    chats.makeSelected = function(e) {
        $(e).closest('tr').addClass('selected');
        $(e).addClass('selected-button');
    }

    chats.clearSelected = function() {
        $('.selected').removeClass('selected');
        $('.selected-button').removeClass('selected-button');
    }

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
        '/metrics': metrics
    });

})(window);
