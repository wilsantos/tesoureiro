FROM php:8.2-apache

RUN apt-get update && apt-get install -y \
    libpng-dev \
    curl \
    && docker-php-ext-install pdo pdo_mysql \
    && a2enmod rewrite headers \
    && rm -rf /var/lib/apt/lists/*

COPY docker/php/php.ini /usr/local/etc/php/conf.d/tesoureiro.ini
COPY api/ /var/www/html/
COPY api/config/database.example.php /var/www/html/config/database.php

EXPOSE 80
