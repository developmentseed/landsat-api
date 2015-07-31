/* global it */
'use strict';

var request = require('request');
var expect = require('chai').expect;

module.exports = function (port) {
  var url = 'http://127.0.0.1:' + port + '/landsat'

  it('should have 10 records', function (done) {
    request(url, function (err, response, body) {
      if (err) {
        console.log(err);
      }
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
      var res = JSON.parse(body);
      expect(res.meta.found).to.equal(0);
      done();
    });
  });
};
