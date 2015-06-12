'use strict';

var ejs = require('elastic.js');

var legacyParams = function (params, q, limit) {
  var err;
  var supported_query_re = new RegExp('^[0-9a-zA-Z#\*\.\_\:\(\)\"\\[\\]\{\}\\-\\+\>\<\= ]+$');

  if (params.search) {
    if (!supported_query_re.test(params.search)) {
      err = Boom.create(400, 'Search not supported: ' + params.search, { timestamp: Date.now() });
      throw err;
    }

    q.query(ejs.QueryStringQuery(params.search));
  } else if (params.count) {
    q.facet(ejs.TermsFacet('count').fields([params.count]).size(limit));
  }

  return q;
};

module.exports = function (params, q, limit) {

  var query = ejs.BoolQuery();

  // Do legacy search
  if (params.search || params.count) {
    return legacyParams(params, q, limit);
  };

  if (params.contains) {
    var correct_query = new RegExp('[0-9\.\,\-]+$');
    if (correct_query.test(params.contains)) {
      var coordinates = params.contains.split(',');
      var coordinates = coordinates.map(parseFloat);

      console.log(coordinates);

      var shape = ejs.Shape('circle', coordinates).radius('1km');

      query = query.should(ejs.GeoShapeQuery()
                              .field('boundingBox')
                              .shape(shape));
      console.log(query);
    }
  }

  return q.query(query);

};
