define(function(require) {
    'use strict';

    var Backbone = require('backbone-stack');
    var Util     = require('genghis/util');

    var e = encodeURIComponent;
    var NOT_FOUND = "<p>If you think you've reached this message in error, please press <strong>0</strong> to speak with an operator. Otherwise, hang up and try again.</p>";

    function getParams() {
        if (!document.location.search) return {};

        return Util.parseQuery(window.location.search.substr(1));
    }

    function getQuery() {
        return getParams().q
    }

    return Backbone.Router.extend({
        initialize: function(options) {
            this.app = options.app;
        },

        routes: {
            '':                                                                 'index',
            'servers':                                                          'redirectToIndex',
            'servers/:server':                                                  'server',
            'servers/:server/databases':                                        'redirectToServer',
            'servers/:server/databases/:db':                                    'database',
            'servers/:server/databases/:db/collections':                        'redirectToDatabase',
            'servers/:server/databases/:db/collections/:coll':                  'collection',
            'servers/:server/databases/:db/collections/:coll/documents':        'collectionQuery',
            'servers/:server/databases/:db/collections/:coll/documents?*query': 'collectionQuery',
            'servers/:server/databases/:db/collections/:coll/explain':          'explainQuery',
            'servers/:server/databases/:db/collections/:coll/explain?*query':   'explainQuery',
            'servers/:server/databases/:db/collections/:coll/documents/:docId': 'document',
            '*path':                                                            'notFound'
        },

        index: function() {
            this.app.selection.select();
        },

        indexRoute: function() {
            return '';
        },

        redirectToIndex: function() {
            this.navigate(this.indexRoute(), true);
        },

        server: function(server) {
            this.app.selection.select(server);
        },

        serverRoute: function(server) {
            return ['servers', e(server)].join('/');
        },

        redirectToServer: function(server) {
            this.navigate(this.serverRoute(server), true);
        },

        database: function(server, db) {
            this.app.selection.select(server, db);
        },

        databaseRoute: function(server, db) {
            return ['servers', e(server), 'databases', e(db)].join('/');
        },

        redirectToDatabase: function(server, db) {
            this.navigate(this.databaseRoute(server, db), true);
        },

        collection: function(server, db, coll) {
            if (!!window.location.search) {
                return this.redirectToQuery(server, db, coll, getQuery());
            }

            this.app.selection.select(server, db, coll);
        },

        collectionRoute: function(server, db, coll) {
            return ['servers', e(server), 'databases', e(db), 'collections', e(coll)].join('/');
        },

        redirectToCollection: function(server, db, coll) {
            this.navigate(this.collectionRoute(server, db, coll), true);
        },

        collectionQuery: function(server, db, coll) {
            if (!window.location.search) {
                return this.redirectToCollection(server, db, coll);
            }

            var params = getParams();
            this.app.selection.select(server, db, coll, null, params.q, params.page);
        },

        collectionQueryRoute: function(server, db, coll, query) {
            return ['servers', e(server), 'databases', e(db), 'collections', e(coll), 'documents'].join('/')
                 + '?' + Util.buildQuery({q: e(query)});
        },

        redirectToCollectionQuery: function(server, db, coll, query) {
            if (typeof query === 'undefined') {
                query = getQuery();
            }

            this.navigate(this.collectionQueryRoute(server, db, coll, query), true);
        },

        explainQuery: function(server, db, coll) {
            this.app.selection.select(server, db, coll, null, getQuery(), null, true);
        },

        document: function(server, db, coll, docId) {
            this.app.selection.select(server, db, coll, docId);
        },

        documentRoute: function(server, db, coll, docId) {
            return ['servers', e(server), 'databases', e(db), 'collections', e(coll), 'documents', e(docId)].join('/');
        },

        redirectToDocument: function(server, db, coll, docId) {
            this.navigate(this.documentRoute(server, db, coll, docId), true);
        },

        redirectTo: function(server, db, coll, docId, query) {
            if (!server) return this.redirectToIndex();
            if (!db)     return this.redirectToServer(server);
            if (!coll)   return this.redirectToDatabase(server, db);

            if (!docId && !query) {
                return this.redirectToCollection(server, db, coll);
            } else if (!query) {
                return this.redirectToDocument(server, db, coll, docId);
            } else {
                return this.redirectToCollectionQuery(server, db, coll, query);
            }
        },

        notFound: function(path) {
            this.app.showSection();
            this.app.showMasthead('404: Not Found', NOT_FOUND, {
                error: true,
                epic:  true
            });
        }
    });
});
