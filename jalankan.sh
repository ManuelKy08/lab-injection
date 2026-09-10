#!/usr/bin/env bash
# jalankan.sh — start/stop VulnLab (server API + mongo container + build client)
set -euo pipefail
cd "$(dirname "$0")"

PORT=8100
MONGO_NAME=lab-injection-mongo

case "${1:-start}" in
  start)
    echo "[vulnlab] memastikan node_modules terinstall..."
    [ -d node_modules ] || npm install
    echo "[vulnlab] menjalankan MongoDB container..."
    if ! docker ps --format '{{.Names}}' | grep -q "^${MONGO_NAME}$"; then
      docker run -d --name "${MONGO_NAME}" -p 127.0.0.1:27017:27017 \
        -v lab-injection-mongo-data:/data/db --restart unless-stopped mongo:7
    fi
    docker start "${MONGO_NAME}" >/dev/null 2>&1 || true
    sleep 5
    echo "[vulnlab] build client..."
    npm run build
    echo "[vulnlab] mulai server di http://127.0.0.1:${PORT}"
    exec npm run server
    ;;
  stop)
    echo "[vulnlab] menghentikan server (kill node index.js)..."
    pkill -f "node index.js" 2>/dev/null || true
    echo "[vulnlab] MongoDB container DIHENTIKAN tapi data tetap tersimpan di volume."
    docker stop "${MONGO_NAME}" 2>/dev/null || true
    echo "[vulnlab] untuk menghapus container permanen: docker rm ${MONGO_NAME}"
    ;;
  mongo-up)
    docker start "${MONGO_NAME}" 2>/dev/null || docker run -d --name "${MONGO_NAME}" -p 127.0.0.1:27017:27017 -v lab-injection-mongo-data:/data/db --restart unless-stopped mongo:7
    ;;
  mongo-down)
    docker stop "${MONGO_NAME}" 2>/dev/null || true
    ;;
  status)
    echo "-- port ${PORT} (server):"; (ss -ltnp 2>/dev/null | grep ":${PORT}" || echo "   mati")
    echo "-- mongo 27017:"; docker ps --filter name="${MONGO_NAME}" --format '   {{.Status}}' 2>/dev/null || echo "   mati"
    ;;
  *)
    echo "usage: $0 {start|stop|mongo-up|mongo-down|status}"
    exit 1
    ;;
esac