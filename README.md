## Landsat8 Metadata API

This small nodejs application creates an API for landsat metadata.

#### Dependencies: Elastic Search

Donwload and install the lastest version of elastic search zip from [ES website](http://www.elasticsearch.org/download/)

#### Installation

Install NodeJS, npm and forever (This is ONLY needed if you want to run the API engine)

    $: sudo apt-get install nodejs ruby ruby1.9.1-dev npm -y
    $: sudo ln -s /usr/bin/nodejs /usr/bin/node
    $: npm install

To run the api:

    $: node api.js

To test the API run:

    $: curl localhost:8000/landsat?search=LC81660362014196LGN00

To run the API in the background run:

    $: forever start api.js

To list forever jobs:

    $: forever list
    info:    Forever processes running
    data:        uid  command         script forever pid   logfile                        uptime
    data:    [0] v0MM /usr/bin/nodejs api.js 19708   19710 /home/ubuntu/.forever/v0MM.log 0:0:5:46.387

To Kill the forever job:

    $: forever stop 0

#### Config

The following environmental variables are available for customizing the API. If you add the variables to an `.env` file, they are loaded automatically when the app starts.

```

QUERY_LIMIT=100
COUNT_LIMIT=1000
PORT=8080
ES_HOST=localhost:9200
NODE_ENV=production
NEW_RELIC_APP_NAME=some_app
NEW_RELIC_LICENSE_KEY=some_license

```

#### Updating the metadata

Read more [here](updater/README.md)

#### Credit

This is a fork of the excellent OpenFDA API: https://github.com/FDA/openfda/tree/master/api


### To Do

- Add a documentation for the API
