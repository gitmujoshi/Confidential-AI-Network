#!/bin/bash

# Contract Management System - Service Management Script
# For macOS/Linux development environment

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Function to check if a process is running
is_running() {
    pgrep -f "$1" > /dev/null 2>&1
}

# Function to check if a port is in use
is_port_in_use() {
    lsof -i :$1 > /dev/null 2>&1
}

# Function to start all services
start_all() {
    print_status "Starting Contract Management System..."
    
    # Start Docker services
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker Desktop first."
        exit 1
    fi
    
    print_status "Starting Docker services..."
    docker-compose -f docker-compose.main.yml up -d
    
    # Wait for services to be ready
    print_status "Waiting for services to be ready..."
    sleep 15
    
    # Start backend
    if ! is_running "node.*server.js"; then
        print_status "Starting backend..."
        cd backend
        npm run dev > ../logs/backend.log 2>&1 &
        echo $! > .backend.pid
        cd ..
        print_success "Backend started"
    else
        print_warning "Backend is already running"
    fi
    
    # Start frontend
    if ! is_running "react-scripts"; then
        print_status "Starting frontend..."
        cd frontend
        npm start > ../logs/frontend.log 2>&1 &
        echo $! > .frontend.pid
        cd ..
        print_success "Frontend started"
    else
        print_warning "Frontend is already running"
    fi
    
    print_success "All services started successfully!"
    print_status "System will be available at:"
    print_status "- Frontend: http://localhost:3000"
    print_status "- Backend: http://localhost:5001"
    print_status "- Keycloak: https://localhost:8443"
}

# Function to stop all services
stop_all() {
    print_status "Stopping Contract Management System..."
    
    # Stop backend
    if [ -f backend/.backend.pid ]; then
        BACKEND_PID=$(cat backend/.backend.pid)
        if kill -0 $BACKEND_PID 2>/dev/null; then
            print_status "Stopping backend (PID: $BACKEND_PID)..."
            kill $BACKEND_PID
            rm backend/.backend.pid
            print_success "Backend stopped"
        fi
    fi
    
    # Stop frontend
    if [ -f frontend/.frontend.pid ]; then
        FRONTEND_PID=$(cat frontend/.frontend.pid)
        if kill -0 $FRONTEND_PID 2>/dev/null; then
            print_status "Stopping frontend (PID: $FRONTEND_PID)..."
            kill $FRONTEND_PID
            rm frontend/.frontend.pid
            print_success "Frontend stopped"
        fi
    fi
    
    # Stop Docker services
    print_status "Stopping Docker services..."
    docker-compose -f docker-compose.main.yml down
    
    print_success "All services stopped successfully!"
}

# Function to restart all services
restart_all() {
    print_status "Restarting Contract Management System..."
    stop_all
    sleep 5
    start_all
}

# Function to check service status
check_status() {
    echo "🔍 Contract Management System Status"
    echo "=================================="
    echo ""
    
    # Check Docker services
    echo "📦 Docker Services:"
    if docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(postgres|keycloak|contract)" > /dev/null 2>&1; then
        docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(postgres|keycloak|contract)"
    else
        echo "❌ No Docker services running"
    fi
    echo ""
    
    # Check backend
    echo "🔧 Backend Status:"
    if [ -f backend/.backend.pid ]; then
        BACKEND_PID=$(cat backend/.backend.pid)
        if kill -0 $BACKEND_PID 2>/dev/null; then
            echo "✅ Backend running (PID: $BACKEND_PID)"
            if is_port_in_use 5001; then
                echo "✅ Backend port 5001 is listening"
            else
                echo "❌ Backend port 5001 is not listening"
            fi
        else
            echo "❌ Backend not running (stale PID file)"
        fi
    else
        echo "❌ Backend PID file not found"
    fi
    echo ""
    
    # Check frontend
    echo "🎨 Frontend Status:"
    if [ -f frontend/.frontend.pid ]; then
        FRONTEND_PID=$(cat frontend/.frontend.pid)
        if kill -0 $FRONTEND_PID 2>/dev/null; then
            echo "✅ Frontend running (PID: $FRONTEND_PID)"
            if is_port_in_use 3000; then
                echo "✅ Frontend port 3000 is listening"
            else
                echo "❌ Frontend port 3000 is not listening"
            fi
        else
            echo "❌ Frontend not running (stale PID file)"
        fi
    else
        echo "❌ Frontend PID file not found"
    fi
    echo ""
    
    # Check Keycloak
    echo "🔐 Keycloak Status:"
    if is_port_in_use 8443; then
        echo "✅ Keycloak port 8443 is listening"
        if curl -s -k https://localhost:8443/health > /dev/null 2>&1; then
            echo "✅ Keycloak is responding"
        else
            echo "❌ Keycloak is not responding"
        fi
    else
        echo "❌ Keycloak port 8443 is not listening"
    fi
    echo ""
    
    # Check ports
    echo "🌐 Port Status:"
    echo "Backend (5001): $(lsof -i :5001 2>/dev/null | grep LISTEN || echo 'Not listening')"
    echo "Frontend (3000): $(lsof -i :3000 2>/dev/null | grep LISTEN || echo 'Not listening')"
    echo "Keycloak (8443): $(lsof -i :8443 2>/dev/null | grep LISTEN || echo 'Not listening')"
}

# Function to show logs
show_logs() {
    local service=$1
    case $service in
        "backend")
            if [ -f logs/backend.log ]; then
                tail -f logs/backend.log
            else
                print_error "Backend log file not found"
            fi
            ;;
        "frontend")
            if [ -f logs/frontend.log ]; then
                tail -f logs/frontend.log
            else
                print_error "Frontend log file not found"
            fi
            ;;
        "keycloak")
            docker logs -f keycloak-cms
            ;;
        "postgres")
            docker logs -f postgres
            ;;
        *)
            print_error "Unknown service: $service"
            print_status "Available services: backend, frontend, keycloak, postgres"
            ;;
    esac
}

# Function to show help
show_help() {
    echo "Contract Management System - Service Management"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  start     Start all services"
    echo "  stop      Stop all services"
    echo "  restart   Restart all services"
    echo "  status    Check service status"
    echo "  logs      Show service logs (backend|frontend|keycloak|postgres)"
    echo "  help      Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 start                    # Start all services"
    echo "  $0 stop                     # Stop all services"
    echo "  $0 status                   # Check service status"
    echo "  $0 logs backend             # Show backend logs"
    echo "  $0 logs keycloak            # Show Keycloak logs"
}

# Create logs directory
mkdir -p logs

# Main script logic
case "${1:-help}" in
    "start")
        start_all
        ;;
    "stop")
        stop_all
        ;;
    "restart")
        restart_all
        ;;
    "status")
        check_status
        ;;
    "logs")
        if [ -z "$2" ]; then
            print_error "Please specify a service (backend|frontend|keycloak|postgres)"
            exit 1
        fi
        show_logs "$2"
        ;;
    "help"|*)
        show_help
        ;;
esac
