# Base project configuration
FROM node:18.7.0-buster as build

RUN apt update & apt install python3-pip

RUN npm i -g @nestjs/cli

COPY package*.json ./

RUN npm ci --cache .npm --prefer-offline

COPY . .

RUN npm run build

CMD ["npm", "run", "start:prod"]
