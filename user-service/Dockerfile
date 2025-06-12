FROM node:20-alpine
WORKDIR /srv
COPY package*.json ./
RUN npm ci
COPY src ./src
ARG PORT=3001           # overridden for other service
ENV PORT=$PORT
EXPOSE $PORT
CMD ["node", "src/index.js"]
