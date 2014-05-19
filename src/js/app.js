(function(window) {
    'use strict';

    var chats = {
        list: m.prop([]),
        transcript: m.prop([]),
        get: function(url) {
                return m.request({method: 'GET', url: url})
        },
        controller: function() {
            this.list = chats.list;
            this.account = m.prop("");
            this.core = m.prop(false);
            this.search = function(e) {
                e.preventDefault();
                if (!isNaN(parseInt(this.account()))) {
                    var url = this.core() ? 'api/chats/core/' + this.account() : 'api/chats/ddi/' + this.account()
                    chats.get(url)
                        .then(this.list)
                        .then(function() {
                            m.render(document.getElementById('table'), table(this));
                        }.bind(this))
                }
            }.bind(this);
            this.trans = chats.transcript;
            this.transcript = function(e) {
                var url = 'api/transcripts/' + e.target.value;
                chats.get(url)
                    .then(this.trans)
                    .then(function() {
                        m.render(document.getElementById('transcript'), transcript(this));
                    }.bind(this))
            }.bind(this);

        },
        view: function(ctrl) {
            return m("div.row", [
                m("div.col-md-6#chats", [
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
                    m('td', moment(chat.answeredAt).toString()),
                    m('td', chat.customerName),
                    m('td', chat.rackerName)
                ])
            })])
        ]);
    }

    var transcript = function(ctrl) {
        return ctrl.trans().map(function(transcript, index) {
            return [
                m('div.clear', [
                    m('span', moment(transcript.createdAt).format('h:mma').toString() + ' '),
                    m('span', transcript.name + ': '),
                    m('span', transcript.text)
                ])
            ]
        });
    }

    m.route.mode = 'pathname';
    m.route(document.getElementById('main'), '/', {
        '/': chats,
    });
})(window);
