FROM node:16.15.0-alpine3.15

RUN npm i -g @nestjs/cli@8.0.0
WORKDIR /home/node/app

COPY package*.json .

RUN npm install

COPY . .

CMD ["npm", "run", "start:dev"]
