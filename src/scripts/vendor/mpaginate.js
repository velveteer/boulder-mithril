function MPaginate() { 'use strict';

    // Borrowing range function from Underscore
    function range(start, stop, step) {
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

    var that = this; // Hold reference to closure
    this.rowsPerPage = m.prop(5); // How many rows to show per page
    this.list = m.prop([]); // A list of objects
    this.headers = m.prop([]); // List of headers for <th> elements
    this.cells = m.prop([]); // List of values to show for <td> elements
    this.rowStyle = m.prop({}); // An object for styling each <tr>

    this.controller = function() {
        this.currentPage = m.prop(1); // Current page is reset on each load
        this.startPage = m.prop(0); // The first page the controls start on
        this.endPage = m.prop(5); // The last page to show in the controls

        this.rowsPerPage = that.rowsPerPage;
        this.list = that.list;
        this.rowStyle = that.rowStyle;
        this.keys = function() { return typeof(this.list()[0]) === 'object' ? Object.keys(this.list()[0]) : [] };

        // Use defined headers or pull keys from the object schema
        this.headers = that.headers().length > 0 ? that.headers : this.keys;
        // Use defined values for each cell or pull values from object schema
        this.cells = that.cells().length > 0 ? that.cells : this.keys;

        // Slice list into pages
        this.paginated = function() {
            return this.list().slice((this.currentPage()-1) * this.rowsPerPage(),
                ((this.currentPage()-1)*this.rowsPerPage()) + this.rowsPerPage())
        }.bind(this);

        // Calculate how many pages to generate
        this.numPages = function() {
            var numPages = 0;
            if (this.list() !== null && this.rowsPerPage() !== null) {
                numPages = Math.ceil(this.list().length / this.rowsPerPage());
            }
            return range(1, numPages+1);
        }.bind(this);

        // Show next pages in controls
        this.nextPage = function() {
            var start = this.startPage();
            var end = this.endPage();
            if (this.endPage() !== this.numPages()) {
                this.startPage(start + 1);
                this.endPage(end + 1);
            }
        }.bind(this);

        // Show previous pages in controls
        this.prevPage = function() {
            var start = this.startPage();
            var end = this.endPage();
            if (this.startPage() > 0) {
                this.startPage(start - 1);
                this.endPage(end - 1);
            }
        }.bind(this);
    }

    this.view = function(ctrl) {
        return m('div.mpaginate', [
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
                        return m('tr', typeof(ctrl.rowStyle()) === 'function' ? ctrl.rowStyle().call(item) : ctrl.rowStyle(),
                            [ ctrl.cells().map(function(cell, index) { return typeof(cell) === 'function' ?  m('td', cell.call(item)) : m('td', item[cell]) })
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
}
