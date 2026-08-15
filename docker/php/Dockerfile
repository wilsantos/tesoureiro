FROM php:8.2-apache

RUN apt-get update && apt-get install -y \
    libpng-dev \
    libpq-dev \
    curl \
    unzip \
    && docker-php-ext-install pdo pdo_pgsql \
    && a2enmod rewrite headers \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

COPY docker/php/php.ini /usr/local/etc/php/conf.d/tesoureiro.ini

COPY api/composer.json api/composer.lock* /var/www/html/
WORKDIR /var/www/html
RUN composer install --no-dev --no-interaction --prefer-dist

COPY api/ /var/www/html/
COPY api/config/database.example.php /var/www/html/config/database.php

EXPOSE 80
