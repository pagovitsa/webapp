#!/bin/sh
set -eu
MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql --user=root <<EOSQL
CREATE DATABASE IF NOT EXISTS webapp_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'webapp_test'@'%' IDENTIFIED BY '$MYSQL_TEST_PASSWORD';
GRANT ALL PRIVILEGES ON webapp_test.* TO 'webapp_test'@'%';
EOSQL
