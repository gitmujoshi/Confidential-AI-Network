# Wait for PostgreSQL container to be healthy
echo "⏳ Waiting for PostgreSQL to be healthy..."
max_attempts=30
attempt=1
while [ $attempt -le $max_attempts ]; do
    if docker ps --format "{{.Names}}: {{.Status}}" | grep -q "postgres-keycloak.*healthy"; then
        echo -e " ${GREEN}✅ PostgreSQL is healthy!${NC}"
        break
    fi
    
    echo -n "."
    sleep 2
    attempt=$((attempt + 1))
done

if [ $attempt -gt $max_attempts ]; then
    echo -e " ${RED}❌ PostgreSQL failed to become healthy${NC}"
    exit 1
fi
