#!/bin/bash

# Development helper for local training environment

case "$1" in
    "start")
        echo "🚀 Starting local training environment..."
        cd local-tee
        docker-compose up -d
        ;;
    "stop")
        echo "🛑 Stopping local training environment..."
        cd local-tee
        docker-compose down
        ;;
    "test")
        echo "🧪 Testing local training environment..."
        cd local-tee
        ./test-training.sh
        ;;
    "clean")
        echo "🧹 Cleaning local training environment..."
        cd local-tee
        docker-compose down -v
        rm -rf environments/* containers/* outputs/* logs/*
        ;;
    "logs")
        echo "📄 Showing training logs..."
        cd local-tee
        docker-compose logs -f
        ;;
    *)
        echo "Usage: $0 {start|stop|test|clean|logs}"
        echo "  start  - Start local training environment"
        echo "  stop   - Stop local training environment"
        echo "  test   - Test local training environment"
        echo "  clean  - Clean up local training environment"
        echo "  logs   - Show training logs"
        exit 1
        ;;
esac
