(function(window) {
    'use strict';

    var chats = {
        list: m.prop([]),
        transcript: m.prop([]),
        lastAccount: '',
        get: function(url) {
                return m.request({method: 'GET', url: url})
        },
        controller: function() {
            this.list = chats.list;
            this.account = m.prop('');
            this.core = m.prop(false);
            this.search = function(e) {
                e.preventDefault();
                if (chats.lastAccount !== this.account()) {
                    clearSelected();
                }
                if (!isNaN(parseInt(this.account()))) {
                    var url = this.core() ? 'api/chats/core/' + this.account() : 'api/chats/ddi/' + this.account()
                    chats.get(url)
                        .then(this.list)
                        .then(function() { return tableRender(this)}.bind(this))
                }
            }.bind(this);
            this.trans = chats.transcript;
            this.transcript = function(e) {
                var url = 'api/transcripts/' + e.target.value;
                chats.lastAccount = this.account();
                clearSelected();
                $(e.target).closest('tr').addClass('selected');
                $(e.target).html('Loaded').addClass('selected-button');
                chats.get(url)
                    .then(this.trans)
                    .then(function() { return transcriptRender(this)}.bind(this))
            }.bind(this);
            this.sized = false;
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
                        m('div.checkbox', [
                            m('label[for=core]', [
                                m('input[type=checkbox]#core', {
                                    onchange: m.withAttr('checked', ctrl.core),
                                    checked: ctrl.core()
                                }), 'CORE'
                            ]),
                        ]),
                        m('button[type=submit].btn.btn-sm', 'Search'),
                        m('div#table')
                    ])
                ]),
                m('span#transcript-controls', {onclick: ctrl.resize}),
                m('div.col-md-6#transcript')
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

    var transcriptControls = function(ctrl) {
        if (ctrl.sized) {
            return m('i.fa.fa-long-arrow-right.fa-2x');
        } else {
            return m('i.fa.fa-long-arrow-left.fa-2x');
        }
    }

    var transcriptRender = function(ctrl) {
        m.render(document.getElementById('transcript'), transcript(ctrl));
        m.render(document.getElementById('transcript-controls'), transcriptControls(ctrl));
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

    var clearSelected = function() {
        $('.selected').removeClass('selected');
        $('.selected-button').html('Load');
        $('.selected-button').removeClass('selected-button');
    }

    m.route.mode = 'pathname';
    m.route(document.getElementById('main'), '/', {
        '/': chats,
    });
})(window);
