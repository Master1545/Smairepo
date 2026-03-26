FROM node:18
WORKDIR /app
COPY package*.json ./
RUN apt-get update && apt-get install -y python3 make g++ git curl && rm -rf /var/lib/apt/lists/*
RUN npm install --verbose
COPY . .
CMD ["npm", "start"]
