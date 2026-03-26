# 1️⃣ Node 18 taban image
FROM node:18

# 2️⃣ Çalışma dizini oluştur
WORKDIR /app

# 3️⃣ package.json ve package-lock.json önce kopyalanır
# Böylece npm install yalnızca değişiklik olursa tekrar çalışır
COPY package*.json ./

# 4️⃣ Sistem bağımlılıklarını yükle (bazı npm paketleri için gerekli)
RUN apt-get update && apt-get install -y python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

# 5️⃣ Paketleri yükle
RUN npm install

# 6️⃣ Proje dosyalarını kopyala
COPY . .

# 7️⃣ Container başlatma komutu
CMD ["npm", "start"]
