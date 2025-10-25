FROM golang:1.23 AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .

# Статическая сборка для Alpine
ENV CGO_ENABLED=0
RUN go build -o app ./cmd/main.go


FROM alpine:latest
WORKDIR /root/

# Копируем бинарник
COPY --from=builder /app/app .

# Даём права на выполнение
RUN chmod +x ./app

EXPOSE 9090

CMD ["./app"]
