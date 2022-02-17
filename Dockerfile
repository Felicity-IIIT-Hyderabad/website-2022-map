FROM node:16

WORKDIR /app
RUN yarn

EXPOSE 3000

CMD ["yarn", "start"]
