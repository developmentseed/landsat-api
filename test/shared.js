/* global it */
'use strict';

var request = require('request');
var expect = require('chai').expect;

module.exports = function (port) {
  var url = 'http://127.0.0.1:' + port + '/landsat';

  it('should have 10 records', function (done) {
    request(url, function (err, response, body) {
      if (err) {
        console.log(err);
      }
      expect(response.statusCode).to.equal(200);
      var res = JSON.parse(body);
      expect(res.meta.found).to.equal(10);
      done();
    });
  });

  it('test scene_id parameter', function (done) {
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

  it('test cloud coverage less than 4', function (done) {
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

  it('test cloud coverage more than 4', function (done) {
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

  it('test cloud coverage from 21 to 36', function (done) {
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

  it('test date from', function (done) {
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

  it('test date to', function (done) {
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

  it('test date from and to', function (done) {
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

  it('test intersects should return 1', function (done) {
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

  it('test intersects should return 0', function (done) {
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

  it('test contains should return one', function (done) {
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

  it('test contains should return 0', function (done) {
    request(url + '?contains=56.35986328125,-5.353521355337321', function (err, response, body) {
      if (err) {
        console.log(err);
      }
      expect(response.statusCode).to.equal(200);
      var res = JSON.parse(body);
      expect(res.meta.found).to.equal(1);
      done();
    });
  });
};
