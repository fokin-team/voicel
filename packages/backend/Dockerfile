# Base project configuration
FROM node:18.7.0-buster as build

WORKDIR /usr/src/app

RUN apt-get update || : && apt-get install python -y
RUN wget https://bootstrap.pypa.io/get-pip.py
RUN python3 get-pip.py
RUN npm i -g @nestjs/cli

COPY . .

RUN npm instal  
RUN npm run build

EXPOSE 3000 3030 8080

CMD ["npm", "run", "start:prod"]