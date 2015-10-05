FROM    node:0.10

ADD app /app

RUN apt-get update && apt-get install -y cron

RUN cd /app && npm install

RUN curl https://bootstrap.pypa.io/get-pip.py | python

RUN cd /app/updater && pip install -r requirements.txt

RUN echo "* 5     * * *   root    python /app/updater/update.py >>/var/log/cron.log 2>&1" >> /etc/crontab

RUN touch /var/log/cron.log

EXPOSE 8000 8000

CMD cron && node /app/api.js
