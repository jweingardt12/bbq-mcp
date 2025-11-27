FROM node:22-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

ENV TRANSPORT=http
ENV PORT=8081

EXPOSE 8081

CMD ["node", "dist/index.js"]
