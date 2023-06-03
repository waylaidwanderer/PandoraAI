FROM node:18-alpine

WORKDIR /app

COPY ./package.json ./package-lock.json ./

RUN npm pkg set scripts.postinstall="echo no-postinstall" && npm install

COPY . .

COPY .env ./

RUN npm run postinstall

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "preview"]
