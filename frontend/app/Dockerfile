# ./frontend/app/Dockerfile

# Этап 1: Сборка фронтенда
# Используем образ Node.js для сборки приложения
FROM node:18-alpine AS builder

# Устанавливаем рабочую директорию внутри контейнера
WORKDIR /app

# Копируем файлы package.json и package-lock.json
COPY package.json package-lock.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем остальной исходный код фронтенда
COPY . .

# Запускаем сборку, которая создаст статические файлы в папке /app/build
RUN npm run build

# Этап 2: Создание финального образа на базе Nginx
# Используем легковесный образ Nginx для продакшена
FROM nginx:1.25-alpine

# Копируем нашу кастомную конфигурацию Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Копируем собранные статические файлы из первого этапа в директорию Nginx
COPY --from=builder /app/build /usr/share/nginx/html

# Задаем порт для прослушивания
EXPOSE 80

# Команда для запуска Nginx
CMD ["nginx", "-g", "daemon off;"]
