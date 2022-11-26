FROM node:18.7.0-alpine as build-stage

COPY package*.json .

COPY . .

RUN npm ci --cache .npm --prefer-offline

RUN npm run build:prod

# production
FROM nginx:stable-alpine as deploy-stage

COPY --from=build-stage dist /usr/share/nginx/html
COPY ./nginx/default.conf /etc/nginx/conf.d

EXPOSE 80
