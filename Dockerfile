FROM node:18-alpine

WORKDIR /app

COPY ./package.json ./package-lock.json ./

RUN npm pkg set scripts.postinstall="echo no-postinstall" && npm install

COPY . .

RUN npm run postinstall

RUN npm run build

EXPOSE 3000

# You should use -e to override this default value
ENV NUXT_PUBLIC_API_BASE_URL=/api

CMD ["npm", "run", "preview"]
