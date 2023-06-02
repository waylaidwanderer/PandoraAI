FROM node:16-alpine

WORKDIR /app

COPY ./package.json ./package-lock.json ./

RUN npm pkg set scripts.postinstall="echo no-postinstall" && npm install

COPY . .

COPY .env ./

RUN npm run postinstall

#RUN sed -i 's#${n.apiBaseUrl}#/api#g' /app/.output/public/_nuxt/entry.*.js

EXPOSE 3000

CMD ["npm", "run", "preview"]
