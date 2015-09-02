/* global it */
'use strict';

var request = require('request');
var expect = require('chai').expect;

module.exports = function (port) {
  var url = 'http://127.0.0.1:' + port + '/landsat';
  var urlCount = 'http://127.0.0.1:' + port + '/count';

  it('should have 10 records', function (done) {
    request(urlCount, function (err, response, body) {
      if (err) {
        console.log(err);
      }
      expect(response.statusCode).to.equal(200);
      var res = JSON.parse(body);
      expect(res.results.count).to.equal(10);
      done();
    });
  });

  it('scene_id parameter should work', function (done) {
    request(url + '?scene_id=LC81560392015209LGN00', function (err, response, body) {
      if (err) {
        console.log(err);
      }
      expect(response.statusCode).to.equal(200);
      var res = JSON.parse(body);
      expect(res.results[0].sceneID).to.equal('LC81560392015209LGN00');
      done();
    });
  });

  it('cloud coverage less than 4 should return 6 results', function (done) {
    request(url + '?cloud_to=4', function (err, response, body) {
      if (err) {
        console.log(err);
      }
      expect(response.statusCode).to.equal(200);
      var res = JSON.parse(body);
      expect(res.meta.found).to.equal(6);
      done();
    });
  });

  it('cloud coverage more than 4 should return 4', function (done) {
    request(url + '?cloud_from=4', function (err, response, body) {
      if (err) {
        console.log(err);
      }
      expect(response.statusCode).to.equal(200);
      var res = JSON.parse(body);
      expect(res.meta.found).to.equal(4);
      done();
    });
  });

  it('cloud coverage from 21 to 36 should return 3', function (done) {
    request(url + '?cloud_from=21&cloud_to=36', function (err, response, body) {
      if (err) {
        console.log(err);
      }
      expect(response.statusCode).to.equal(200);
      var res = JSON.parse(body);
      expect(res.meta.found).to.equal(3);
      done();
    });
  });

  it('date_from should return 10 records', function (done) {
    request(url + '?date_from=2015-07-28', function (err, response, body) {
      if (err) {
        console.log(err);
      }
      expect(response.statusCode).to.equal(200);
      var res = JSON.parse(body);
      expect(res.meta.found).to.equal(10);
      done();
    });
  });

  it('date_to should return 0 records', function (done) {
    request(url + '?date_to=2015-07-27', function (err, response, body) {
      if (err) {
        console.log(err);
      }
      expect(response.statusCode).to.equal(200);
      var res = JSON.parse(body);
      expect(res.meta.found).to.equal(0);
      done();
    });
  });

  it('date_from and date_to should return 10', function (done) {
    request(url + '?date_from=2015-07-27&date_to=2015-07-29', function (err, response, body) {
      if (err) {
        console.log(err);
      }
      expect(response.statusCode).to.equal(200);
      var res = JSON.parse(body);
      expect(res.meta.found).to.equal(10);
      done();
    });
  });

  it('with large area polygon, intersects should return 10', function (done) {
    var geojson = '{ "type": "Feature", "properties": {}, "geometry": { \
        "type": "Polygon", \
        "coordinates": [[[-167.34375,80.4157074446218],[-161.71874999999997,-59.88893689676582], \
        [-61.87499999999999,-70.14036427207168],[59.0625,-77.91566898632583],[230.62499999999997, \
        -73.8248203461393],[211.640625,-10.487811882056695],[189.84375,48.922499263758255],[188.4375, \
        77.31251993823143],[-167.34375,80.4157074446218]]] } }';

    request(url + '?intersects=' + geojson, function (err, response, body) {
      if (err) {
        console.log(err);
      }
      expect(response.statusCode).to.equal(200);
      var res = JSON.parse(body);
      expect(res.meta.found).to.equal(10);
      done();
    });
  });

  it('intersects should return 1', function (done) {
    var geojson = '{ "type": "Feature", "properties": {}, "geometry": { \
        "type": "Polygon", \
        "coordinates": [ [ [ 53.23974609375, -5.900188795584159 ], \
            [ 53.690185546875, -5.233187143028958 ], [ 54.31640625, -5.911116815631709 ], [ 54.03076171874999, \
              -6.315298538330021 ], [ 54.0087890625, -6.860985433763648 ], \
            [ 53.4814453125, -6.719164960283201 ], [ 53.23974609375, -5.900188795584159 ] ] ] } }';

    request(url + '?intersects=' + geojson, function (err, response, body) {
      if (err) {
        console.log(err);
      }
      expect(response.statusCode).to.equal(200);
      var res = JSON.parse(body);
      expect(res.meta.found).to.equal(1);
      done();
    });
  });

  it('intersects should return 0', function (done) {
    var geojson = '{"type":"Feature","properties":{},"geometry":{"type":"Polygon","coordinates": \
    [[[56.656494140625,-6.882800241767543],[56.6015625,-6.0094592380595495],[57.06298828124999,-5.954826733929911], \
    [57.37060546875,-6.719164960283201],[56.964111328125,-7.166300381903169],[56.99707031249999,-6.631870206172686], \
    [56.87622070312499,-6.369893945725818],[56.656494140625,-6.882800241767543]]]}}';

    request(url + '?intersects=' + geojson, function (err, response, body) {
      if (err) {
        console.log(err);
      }
      expect(response.statusCode).to.equal(200);
      var res = JSON.parse(body);
      expect(res.meta.found).to.equal(0);
      done();
    });
  });

  it('FeatureCollection with single feature geojson intersects should return 1', function (done) {
    var geojson = '{"type": "FeatureCollection","features": [{"type":"Feature","properties":{},"geometry": \
    {"type":"Polygon","coordinates":[[[61.07299804687501,29.046565622728846],[61.424560546875,29.44916482692468], \
    [61.92993164062499,29.0273547804184],[61.622314453125,28.76765910569123],[61.07299804687501, \
    29.046565622728846]]]}}]}';

    request(url + '?intersects=' + geojson, function (err, response, body) {
      if (err) {
        console.log(err);
      }
      expect(response.statusCode).to.equal(200);
      var res = JSON.parse(body);
      expect(res.meta.found).to.equal(1);
      done();
    });
  });

  it('FeatureCollection with multiple features geojson intersects should return 3', function (done) {
    var geojson = '{"type": "FeatureCollection","features": [{"type":"Feature","properties":{},"geometry": \
    {"type":"Polygon","coordinates":[[[61.07299804687501,29.046565622728846],[61.424560546875,29.44916482692468], \
    [61.92993164062499,29.0273547804184],[61.622314453125,28.76765910569123],[61.07299804687501, \
    29.046565622728846]]]}}, {"type":"Feature","properties":{},"geometry":{"type":"Polygon","coordinates": \
    [[[62.95166015624999,25.849336891707605],[62.60009765624999,26.11598592533351],[62.237548828125, \
    25.720735134412106],[62.75390625,25.572175556682144],[62.95166015624999,25.849336891707605]]]}}, \
    {"type":"Feature","properties":{},"geometry":{"type":"Polygon","coordinates":[[[60.8203125,24.44714958973082], \
    [61.01806640624999,24.926294766395593],[61.292724609375,24.53712939907994],[61.12792968750001, \
    24.066528197726857],[60.8203125,24.44714958973082]]]}}]}';

    request(url + '?intersects=' + geojson, function (err, response, body) {
      if (err) {
        console.log(err);
      }
      expect(response.statusCode).to.equal(200);
      var res = JSON.parse(body);
      expect(res.meta.found).to.equal(3);
      done();
    });
  });

  it('contains should return one record', function (done) {
    request(url + '?contains=54.898681640625,-5.637852598770853', function (err, response, body) {
      if (err) {
        console.log(err);
      }
      expect(response.statusCode).to.equal(200);
      var res = JSON.parse(body);
      expect(res.meta.found).to.equal(1);
      done();
    });
  });

  it('contains should return 0 records', function (done) {
    request(url + '?contains=56.35986328125,-5.353521355337321', function (err, response, body) {
      if (err) {
        console.log(err);
      }
      expect(response.statusCode).to.equal(200);
      var res = JSON.parse(body);
      expect(res.meta.found).to.equal(0);
      done();
    });
  });

  it('legacy search with sceneID should work', function (done) {
    var scene = 'LC81560422015209LGN00';
    request(url + '?search=sceneID:' + scene, function (err, response, body) {
      if (err) {
        console.log(err);
      }
      expect(response.statusCode).to.equal(200);
      var res = JSON.parse(body);
      expect(res.meta.found).to.equal(1);
      expect(res.results[0].sceneID).to.equal(scene);
      done();
    });
  });

  it('legacy search multiple fields should work', function (done) {
    request(url + '?search=path:156+AND+row:41', function (err, response, body) {
      if (err) {
        console.log(err);
      }
      expect(response.statusCode).to.equal(200);
      var res = JSON.parse(body);
      expect(res.meta.found).to.equal(1);
      done();
    });
  });

  it('legacy search multiple fields when result should be empty', function (done) {
    request(url + '?search=path:156+AND+row:11', function (err, response, body) {
      if (err) {
        console.log(err);
      }
      expect(response.statusCode).to.equal(200);
      var res = JSON.parse(body);
      expect(res.meta.found).to.equal(0);
      done();
    });
  });
};
