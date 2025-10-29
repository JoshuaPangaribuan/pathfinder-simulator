FROM node:20.18-alpine AS frontend
WORKDIR /app/web
COPY web/package*.json ./
RUN npm ci && npm cache clean --force
COPY web/ ./
RUN npm run build

FROM golang:1.25-alpine AS backend
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
COPY --from=frontend /app/web/dist ./web/dist
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -ldflags="-w -s" -o pathfinder ./cmd/server

FROM alpine:3.20
RUN apk --no-cache add ca-certificates && \
    addgroup -g 1001 -S appuser && \
    adduser -S -D -H -u 1001 -h /root -s /sbin/nologin -G appuser -g appuser appuser
WORKDIR /root/
COPY --from=backend /app/pathfinder .
RUN chown appuser:appuser pathfinder
USER appuser
EXPOSE 8080
CMD ["./pathfinder", "-addr", ":8080"]