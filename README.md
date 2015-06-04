## Landsat8 Metadata API

#### Dependencies: Elastic Search

Download and install the lastest version of elastic search zip from [ES website](http://www.elasticsearch.org/download/)

#### Installation

Install NodeJS, npm and forever (This is ONLY needed if you want to run the API engine)

    $: npm install

To run the api:

    $: npm run serve

To run the API in the background run:

    $: forever start index.js

To list forever jobs:

    $: forever list
    info:    Forever processes running
    data:        uid  command         script forever pid   logfile                        uptime
    data:    [0] v0MM /usr/bin/nodejs api.js 19708   19710 /home/ubuntu/.forever/v0MM.log 0:0:5:46.387

To Kill the forever job:

    $: forever stop 0
