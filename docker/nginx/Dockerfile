FROM nginx:alpine

RUN apk add --no-cache tzdata

RUN rm -rf /usr/share/nginx/html/*
COPY docker/nginx/frontend.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
