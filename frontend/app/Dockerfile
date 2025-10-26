# ./frontend/app/Dockerfile

# --- Этап 1: Сборка фронтенда ---
# Используем образ Node.js для сборки приложения
FROM node:18-alpine AS builder

# Устанавливаем рабочую директорию внутри контейнера
WORKDIR /app

# Копируем файлы package.json и package-lock.json
COPY package*.json ./

# ИСПОЛЬЗУЕМ КЕШ-МАУНТ:
# Эта команда будет использовать постоянный кеш npm,
# что предотвратит повторное скачивание уже существующих пакетов.
RUN --mount=type=cache,target=/root/.npm npm install

# Копируем остальной исходный код фронтенда
# Благодаря .dockerignore, ненужные файлы не попадут в образ
COPY . .

# Запускаем сборку, которая создаст статические файлы в папке /app/build
RUN npm run build


# --- Этап 2: Создание финального образа на базе Nginx ---
# Этот этап остается без изменений
FROM nginx:1.25-alpine

# Копируем нашу кастомную конфигурацию Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Копируем собранные статические файлы из первого этапа в директорию Nginx
COPY --from=builder /app/build /usr/share/nginx/html

# Задаем порт для прослушивания
EXPOSE 80

# Команда для запуска Nginx
CMD ["nginx", "-g", "daemon off;"]
