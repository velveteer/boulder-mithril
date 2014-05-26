(function(window) {
    'use strict';

    var get = function(url) {
        return m.request({method: 'GET', url: url})
    }

    var metrics = {};

    metrics.controller = function() {
        this.sso = m.route.param('sso');
        var url = '/api/chats/sso/'+this.sso;
        metrics.paginate = new MPaginate();
        get(url)
            .then(metrics.paginate.list)
            .then(function() { return m.module(document.getElementById('main'), metrics.paginate) });
    }

    metrics.view = function(ctrl) { return m('div#metrics') };

    var chats = {};

    chats.loadButton = function() {
        return [
            m('button[type=button].btn.btn-sm', {
                onclick: transcripts.get,
                value: this.chatID,
                style: {visibility: this.chatID == transcripts.chatID() ? 'hidden' : 'visible'}
            }, 'Load')
        ]
    }

    // Model
    chats.account = m.prop('');
    chats.accountType = m.prop('ddi');

    chats.paginate = new MPaginate();
    chats.paginate.rowsPerPage(6);
    chats.paginate.headers(['Transcript', 'Date', 'Customer', 'Racker']);
    chats.paginate.cells([chats.loadButton, 'answeredAt', 'customerName', 'rackerName']);
    chats.paginate.rowStyle(function() { return {class: this.chatID == transcripts.chatID() ? 'selected' : null} });

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
        '/metrics/:sso': metrics
    });

})(window);
