FROM node:20

WORKDIR /app

# package.json önce kopyala
COPY package*.json ./

# Tüm sistem bağımlılıkları
RUN apt-get update && apt-get install -y \
    python3 make g++ git curl build-essential pkg-config libcairo2-dev \
    libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev \
    && rm -rf /var/lib/apt/lists/*

# npm install verbose
RUN npm install --verbose || (echo "⚠️ npm install failed" && exit 1)

# Tüm proje dosyaları
COPY . .

CMD ["npm", "start"]
