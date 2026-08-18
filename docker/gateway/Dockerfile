FROM nginx:alpine

RUN apk add --no-cache tzdata

COPY docker/entrypoint-timezone.sh /entrypoint-timezone.sh
RUN chmod +x /entrypoint-timezone.sh

COPY docker/nginx/gateway.conf /etc/nginx/conf.d/default.conf

ENTRYPOINT ["/entrypoint-timezone.sh"]
CMD ["nginx", "-g", "daemon off;"]

EXPOSE 80
