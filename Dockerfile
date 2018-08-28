FROM node:8.11.4-stretch
MAINTAINER asi@dbca.wa.gov.au

RUN apt-get update -y \
  && apt-get install -y python-pip
WORKDIR /usr/src/app
COPY uwsgi.ini requirements.txt package-lock.json package.json profile.py ./
COPY gokart ./gokart
COPY src ./src
COPY dist ./dist
RUN pip install --no-cache-dir -r requirements.txt

EXPOSE 8080
CMD ["npm", "run", "serve"]
