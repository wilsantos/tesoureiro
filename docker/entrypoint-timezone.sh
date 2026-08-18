#!/bin/sh
set -e

configure_timezone() {
  tz=""

  if [ -n "${TZ}" ]; then
    tz="${TZ}"
  elif [ -f /etc/timezone ]; then
    tz=$(tr -d '[:space:]' < /etc/timezone)
  fi

  if [ -z "${tz}" ]; then
    return 0
  fi

  if [ ! -f "/usr/share/zoneinfo/${tz}" ]; then
    echo "Fuso horario '${tz}' nao encontrado em /usr/share/zoneinfo" >&2
    return 0
  fi

  export TZ="${tz}"
  ln -snf "/usr/share/zoneinfo/${tz}" /etc/localtime

  if [ -d /usr/local/etc/php/conf.d ]; then
    printf 'date.timezone = %s\n' "${tz}" > /usr/local/etc/php/conf.d/docker-timezone.ini
  fi
}

configure_timezone
exec "$@"
