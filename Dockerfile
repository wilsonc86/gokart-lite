FROM node:8.11.4-stretch
MAINTAINER asi@dbca.wa.gov.au

RUN apt-get update -y  && apt-get install -y python-pip

WORKDIR /usr/src/app

COPY requirements.txt ./
COPY gokart ./gokart
COPY dist/release ./dist/release
COPY uwsgi.ini  ./uwsgi.ini

RUN pip install --no-cache-dir -r requirements.txt

EXPOSE 8080
CMD ["uwsgi", "-i", "uwsgi.ini"]
