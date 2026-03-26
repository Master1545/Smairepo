# Node 20 image kullan
FROM node:20

# Çalışma dizini root
WORKDIR /app

# package.json ve package-lock.json (varsa) kopyala
COPY package*.json ./

# Sistem bağımlılıklarını yükle (AI için gerekli olabilecek kütüphaneler)
RUN apt-get update && \
    apt-get install -y python3 make g++ git curl build-essential pkg-config \
    libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev && \
    rm -rf /var/lib/apt/lists/*

# npm bağımlılıklarını yükle
RUN npm install --verbose

# Tüm dosyaları root’tan kopyala
COPY . .

# Port 3000 aç
EXPOSE 3000

# Node.js backend’i başlat
CMD ["node", "index.js"]
