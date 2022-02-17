#!/usr/bin/env bash

CONTAINER_NAME=felicity22-phaser

case $1 in
    start)
        docker run -d --name $CONTAINER_NAME -v $PWD:/app -p 3000:3000 --rm $(docker build -q .) && xdg-open "http://localhost:3000"
        ;;

    stop)
        docker stop $CONTAINER_NAME
        ;;

    *)
        echo
        echo "Usage: ./manage.sh COMMAND"
        echo
        echo "Commands:"
        echo "  start    Start container."
        echo "  stop     Stop container."
        ;;
esac
