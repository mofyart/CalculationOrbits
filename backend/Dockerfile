FROM golang:1.19 AS builder

WORKDIR /app

COPY go.mod go.sum ./

RUN go mod download

COPY *.go ./

RUN CGO_ENABLED=0 GOOS=linux go build -o /my-app

FROM scratch

COPY --from=builder /my-app /my-app

CMD ["/my-app"]
