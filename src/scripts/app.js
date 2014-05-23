(function(window) {
    'use strict';

    var chats = {
        list: m.prop([]),
        transcript: m.prop([]),
        accountType: m.prop('ddi'),
        currentAccount: m.prop(''),
        lastAccount: m.prop(''),
        get: function(url) {
                return m.request({method: 'GET', url: url})
        },
        controller: function() {
            this.list = chats.list;
            this.accountType = chats.accountType;
            this.account = chats.currentAccount;
            this.lastAccount = chats.lastAccount;
            this.trans = chats.transcript;
            this.sized = false;
            this.extended = false;

            this.search = function(e) {
                e.preventDefault();
                if (this.lastAccount() !== this.account()) {
                    clearSelected();
                }
                if (!isNaN(parseInt(this.account()))) {
                    var url = 'api/chats/' + this.accountType() + '/' + this.account();
                    chats.get(url)
                        .then(this.list)
                        .then(function() { return tableRender(this)}.bind(this))
                }
            }.bind(this);

            this.transcript = function(e) {
                var url = 'api/transcripts/' + e.target.value;
                this.lastAccount(this.account());
                clearSelected();
                makeSelected(e.target);
                chats.get(url)
                    .then(this.trans)
                    .then(function() { return transcriptRender(this)}.bind(this))
            }.bind(this);

            this.resize = function() {
                if (this.sized) {
                    this.sized = false;
                    transcriptMinimize();
                    transcriptRender(this);
                } else {
                    this.sized = true;
                    transcriptMaximize();
                    transcriptRender(this);
                }
            }.bind(this)

            this.extend = function() {
                if (this.extended) {
                    this.extended = false;
                    transcriptUndoExtend();
                    transcriptRender(this);
                } else {
                    this.extended = true;
                    transcriptDoExtend();
                    transcriptRender(this);
                }
            }.bind(this)

        },
        view: function(ctrl) {
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
                        m('div#table')
                    ])
                ]),
                m('div#transcript-controls', [
                    m('span#transcript-extend', {onclick: ctrl.extend}),
                    m('span#transcript-resize', {onclick: ctrl.resize})
                ]),
                m('div.col-md-6.unextended#transcript')
            ])
        }
    }

    var table = function(ctrl) {
        return m('table.table', [
            m('thead', [
                m('tr', [
                    m('th', 'Transcript'),
                    m('th', 'Date'),
                    m('th', 'Customer'),
                    m('th', 'Racker')
                ])
            ]),
            m('tbody', [ ctrl.list().map(function(chat, index) {
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

    var tableRender = function(ctrl) {
        m.render(document.getElementById('table'), table(ctrl));
    }

    var transcript = function(ctrl) {
        return ctrl.trans().map(function(transcript, index) {
            return [
                m('div', [
                    m('span[style=font-style:oblique]', moment(transcript.createdAt).format('h:mma').toString() + ' '),
                    m('span', {style: {color: transcript.personType ? '#660000' : '#003399', fontWeight: 'bold'}}, transcript.name + ': '),
                    m('span', transcript.text)
                ])
            ]
        });
    }

    var transcriptResize = function(ctrl) {
        if (ctrl.sized) {
            return m('i.fa.fa-text-width.fa-2x.enabled');
        } else {
            return m('i.fa.fa-text-width.fa-2x');
        }
    }

    var transcriptExtend = function(ctrl) {
        if (ctrl.extended) {
            return m('i.fa.fa-text-height.fa-2x.enabled');
        } else {
            return m('i.fa.fa-text-height.fa-2x');
        }
    }

    var transcriptRender = function(ctrl) {
        m.render(document.getElementById('transcript'), transcript(ctrl));
        m.render(document.getElementById('transcript-resize'), transcriptResize(ctrl));
        m.render(document.getElementById('transcript-extend'), transcriptExtend(ctrl));
        $('#transcript').scrollTop(0);
    }

    var transcriptMaximize = function() {
        $('#transcript').removeClass('col-md-6');
        $('#transcript').addClass('col-md-8');
        $('#chats').removeClass('col-md-6');
        $('#chats').addClass('col-md-4');
    }

    var transcriptMinimize = function() {
        $('#transcript').removeClass('col-md-8');
        $('#transcript').addClass('col-md-6');
        $('#chats').removeClass('col-md-4');
        $('#chats').addClass('col-md-6');
    }

    var transcriptDoExtend = function() {
        $('#transcript').removeClass('unextended');
        $('#transcript').addClass('extended');
    }

    var transcriptUndoExtend = function() {
        $('#transcript').removeClass('extended');
        $('#transcript').addClass('unextended');
    }

    var makeSelected = function(e) {
        $(e).closest('tr').addClass('selected');
        $(e).addClass('selected-button');
    }

    var clearSelected = function() {
        $('.selected').removeClass('selected');
        $('.selected-button').removeClass('selected-button');
    }

    m.route.mode = 'pathname';
    m.route(document.getElementById('main'), '/', {
        '/': chats,
    });
})(window);
