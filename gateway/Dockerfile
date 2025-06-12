FROM node:20-alpine
WORKDIR /srv
COPY package*.json ./
RUN npm ci
COPY src ./src
EXPOSE 8080

CMD ["npm", "start"]
