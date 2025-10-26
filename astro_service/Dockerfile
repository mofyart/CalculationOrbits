# --- Этап 1: Сборщик (builder) ---
FROM python:3.12-slim AS builder

# Устанавливаем uv как статичный бинарный файл, так как он не требует Python
COPY --from=ghcr.io/astral-sh/uv:0.9.5 /uv /bin/

# Устанавливаем рабочую директорию
WORKDIR /app
COPY pyproject.toml uv.lock* ./

# Устанавливаем зависимости в системный каталог, а не в venv
# Используем UV_SYSTEM_SITE_PACKAGES=1, чтобы указать uv устанавливать пакеты в системные site-packages
# Привязываем uv к системному окружению
ENV UV_PROJECT_ENVIRONMENT=/usr/local/
RUN --mount=type=cache,target=/root/.cache/uv \
    UV_SYSTEM_SITE_PACKAGES=1 uv sync --locked --no-dev

# Копируем остальной код приложения
COPY . .

# --- Этап 2: Финальный образ ---
FROM python:3.12-slim

# Копируем зависимости из образа-сборщика, где они установлены в системный каталог
COPY --from=builder /usr/local/lib/python3.12/site-packages/ /usr/local/lib/python3.12/site-packages/

# Копируем код приложения
WORKDIR /app
COPY . .

EXPOSE 8000

# Команда для запуска приложения
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
