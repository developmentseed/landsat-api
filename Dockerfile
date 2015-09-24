FROM    node:0.10

ADD app /app

RUN cd /app && npm install

EXPOSE 8000 8000

CMD node /app/api.js
