FROM node:20-alpine AS build
WORKDIR /web
COPY package*.json ./
RUN npm ci --silent
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /web/dist /usr/share/nginx/html
EXPOSE 5173
CMD ["nginx", "-g", "daemon off;"]
