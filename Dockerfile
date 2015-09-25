FROM    node:0.12.7

ADD . /app

RUN cd /app && npm install && npm install -g nodemon

EXPOSE 4000 4000

CMD node /app/index.js
