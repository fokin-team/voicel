# Base project configuration
FROM node:18.7.0-buster as build

WORKDIR /usr/src/app

RUN apt-get update || : && apt-get install python -y
RUN wget https://bootstrap.pypa.io/get-pip.py
RUN python3 get-pip.py
RUN npm i -g @nestjs/cli

COPY . .

EXPOSE 3000 8080