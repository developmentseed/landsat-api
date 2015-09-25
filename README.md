## Landsat8 Metadata API

[![Build Status](https://travis-ci.org/developmentseed/landsat-api.svg?branch=develop)](https://travis-ci.org/developmentseed/landsat-api)
[![on docker](https://img.shields.io/badge/docker-available-green.svg)](https://hub.docker.com/r/developmentseed/landsat-api/)


This is an API for NASA/USGS Landsat-8 images. Landsat-api enables you to make geospatial, date and text queries on Landsat-8 metadata.

The metadata is released in csv format by USGS on a daily basis. You can download the raw metadata from [here](http://landsat.usgs.gov/metadata_service/bulk_metadata_files/LANDSAT_8.csv).

Landsat-api needs a database for storage and query of the metadata. It supports both Elasticsearch and MongoDb as data stores.

Landsat-api powers a number of projects including [Libra](https://libra.developmentseed.org) and AstroDigtal's [Imagery Browser](https://fetch.astrodigital.com).

#### Docker

Make sure your docker installed and started.

To use docker for local testing do:

    $ docker-compose run test

To develop with docker locally:

    $ docker-compose up dev

Docker container clean up:

    $ docker-compose stop
    $ docker-compose rm

#### Dependencies

- [MongoDb](http://docs.mongodb.org/v2.6/installation/) [2.6 or higher]

or

- [ElastiSearch](https://www.elastic.co/downloads/elasticsearch) [1.6 or higher]

#### Installation

Install packages

    $: npm install

Set environment variables on your system or add an `.env` file to the root directory of the app:

  - `DB_TYPE=mongo` choices are `mongo` or `es`
  - `ES_HOST=example.com:9200` if you are using ElasticSearch
  - `MONGODB_URL=mongodb://user:pass@example.com:11111/db_name` if you use MongoDb
  - `AREA_LIMIT=500000` The area limit in (sq. km) for use in geo-spatial queries.
  - `REDIS_USE=true` Whether to active the caching. Default is false.
  - `REDIS_HOST=127.0.0.1` default is `127.0.0.1`
  - `REDIS_PASSWORD=redispassword` Redis db password. Default is null.
  - `REDIS_DATABASE=myredisdb` Name of the redis db. Default is null.
  - `REDIS_PORT=6379` Redis port. Default is 6379.

#### Run

To run the api:

    $ node index.js

To run the database updater

    $ node updater.js

*Note:* `updater.js` works with MongoDb. If you plan to update an ElasticSearch installation replace `updater.js` with examples found [here](https://github.com/developmentseed/landsat-meta-updater/tree/develop/examples).

#### Test

    $ npm test

#### Deployment with Docker

    $ docker pull developmentseed/landsat-api:1.1.0
    $ docker run -d -p "4000:4000" --name landsat-api developmentseed/landsat-api:1.1.0
