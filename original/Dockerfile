FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install express
COPY . .
EXPOSE 8080
CMD ["node", "server.js"]