FROM nginx:alpine

RUN apk add --no-cache tzdata

COPY docker/entrypoint-timezone.sh /entrypoint-timezone.sh
RUN chmod +x /entrypoint-timezone.sh

RUN rm -rf /usr/share/nginx/html/*
COPY docker/nginx/frontend.conf /etc/nginx/conf.d/default.conf

ENTRYPOINT ["/entrypoint-timezone.sh"]
CMD ["nginx", "-g", "daemon off;"]

EXPOSE 80
