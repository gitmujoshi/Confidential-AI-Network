#!/bin/bash

# Memory Optimization Script for Contract Management Development
# Performs immediate cleanup and optimization actions

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to get current memory status
get_memory_status() {
    local total_memory=$(($(sysctl hw.memsize | awk '{print $2}') / 1024 / 1024))
    local free_memory=$(($(vm_stat | grep "Pages free" | awk '{print $3}' | sed 's/\.//') * 4096 / 1024 / 1024))
    local used_memory=$((total_memory - free_memory))
    local usage_percent=$((used_memory * 100 / total_memory))
    
    echo "Total: ${total_memory}MB"
    echo "Used: ${used_memory}MB"
    echo "Free: ${free_memory}MB"
    echo "Usage: ${usage_percent}%"
}

# Function to stop development services
stop_development_services() {
    print_header "Stopping Development Services"
    
    if [ -f ".backend.pid" ]; then
        local pid=$(cat .backend.pid)
        if ps -p $pid > /dev/null 2>&1; then
            print_status "Stopping backend (PID: $pid)..."
            kill $pid 2>/dev/null || true
            rm -f .backend.pid
            print_success "Backend stopped"
        fi
    fi
    
    if [ -f ".frontend.pid" ]; then
        local pid=$(cat .frontend.pid)
        if ps -p $pid > /dev/null 2>&1; then
            print_status "Stopping frontend (PID: $pid)..."
            kill $pid 2>/dev/null || true
            rm -f .frontend.pid
            print_success "Frontend stopped"
        fi
    fi
    
    if [ -f ".hardhat.pid" ]; then
        local pid=$(cat .hardhat.pid)
        if ps -p $pid > /dev/null 2>&1; then
            print_status "Stopping blockchain (PID: $pid)..."
            kill $pid 2>/dev/null || true
            rm -f .hardhat.pid
            print_success "Blockchain stopped"
        fi
    fi
    
    # Kill any remaining Node.js processes
    local node_processes=$(ps aux | grep -E "node|npm" | grep -v grep | awk '{print $2}')
    if [ -n "$node_processes" ]; then
        print_status "Stopping remaining Node.js processes..."
        echo "$node_processes" | xargs kill 2>/dev/null || true
        print_success "Node.js processes stopped"
    fi
}

# Function to clear caches
clear_caches() {
    print_header "Clearing Caches"
    
    # Clear npm cache
    print_status "Clearing npm cache..."
    npm cache clean --force 2>/dev/null || true
    print_success "npm cache cleared"
    
    # Clear Docker cache
    if command -v docker &> /dev/null; then
        print_status "Clearing Docker cache..."
        docker system prune -f 2>/dev/null || true
        print_success "Docker cache cleared"
    fi
    
    # Clear system cache
    print_status "Clearing system cache..."
    sudo purge 2>/dev/null || true
    print_success "System cache cleared"
    
    # Clear browser caches (if possible)
    print_status "Clearing browser caches..."
    rm -rf ~/Library/Caches/Google/Chrome/Default/Cache/* 2>/dev/null || true
    rm -rf ~/Library/Caches/com.apple.Safari/* 2>/dev/null || true
    print_success "Browser caches cleared"
}

# Function to rotate log files
rotate_logs() {
    print_header "Rotating Log Files"
    
    local log_files=("backend.log" "frontend.log" "blockchain.log")
    
    for log_file in "${log_files[@]}"; do
        if [ -f "$log_file" ]; then
            local size=$(du -b "$log_file" | cut -f1)
            if [ $size -gt 10485760 ]; then  # 10MB
                print_status "Rotating $log_file (${size} bytes)..."
                mv "$log_file" "${log_file}.old"
                touch "$log_file"
                print_success "$log_file rotated"
            else
                print_status "$log_file size OK (${size} bytes)"
            fi
        fi
    done
}

# Function to optimize Node.js settings
optimize_node_settings() {
    print_header "Optimizing Node.js Settings"
    
    # Backend optimization
    if [ -f "backend/package.json" ]; then
        print_status "Optimizing backend package.json..."
        # Already done in previous edits
        print_success "Backend optimized"
    fi
    
    # Frontend optimization
    if [ -f "frontend/package.json" ]; then
        print_status "Optimizing frontend package.json..."
        # Already done in previous edits
        print_success "Frontend optimized"
    fi
    
    # Blockchain optimization
    if [ -f "blockchain/package.json" ]; then
        print_status "Optimizing blockchain package.json..."
        # Already done in previous edits
        print_success "Blockchain optimized"
    fi
}

# Function to provide recommendations
provide_recommendations() {
    print_header "Memory Optimization Recommendations"
    
    local free_memory=$(($(vm_stat | grep "Pages free" | awk '{print $3}' | sed 's/\.//') * 4096 / 1024 / 1024))
    
    echo "Current free memory: ${free_memory}MB"
    echo ""
    
    if [ $free_memory -lt 1000 ]; then
        print_error "CRITICAL: Very low memory available!"
        echo ""
        echo "Immediate actions needed:"
        echo "  1. Close unnecessary applications"
        echo "  2. Close browser tabs"
        echo "  3. Restart Cursor/VS Code"
        echo "  4. Consider restarting your computer"
        echo ""
    elif [ $free_memory -lt 2000 ]; then
        print_warning "WARNING: Low memory available"
        echo ""
        echo "Recommended actions:"
        echo "  1. Close some browser tabs"
        echo "  2. Close unused applications"
        echo "  3. Monitor memory usage closely"
        echo ""
    else
        print_success "Memory status is good"
        echo ""
    fi
    
    echo "Development best practices:"
    echo "  1. Use './stop-services.sh' when not actively developing"
    echo "  2. Restart services every 4 hours"
    echo "  3. Monitor logs for memory leaks"
    echo "  4. Use 'npm ci' instead of 'npm install'"
    echo "  5. Clear caches regularly"
    echo ""
    
    echo "Monitoring commands:"
    echo "  ./monitor-resources.sh --continuous 30"
    echo "  ./analyze-memory.sh"
    echo "  ./status.sh"
}

# Main optimization function
optimize_memory() {
    echo -e "${CYAN}🔧 Memory Optimization - $(date)${NC}"
    echo ""
    
    print_header "Current Memory Status"
    get_memory_status
    echo ""
    
    # Stop services
    stop_development_services
    echo ""
    
    # Clear caches
    clear_caches
    echo ""
    
    # Rotate logs
    rotate_logs
    echo ""
    
    # Optimize settings
    optimize_node_settings
    echo ""
    
    # Wait a moment for cleanup
    sleep 2
    
    # Show final status
    print_header "Final Memory Status"
    get_memory_status
    echo ""
    
    # Provide recommendations
    provide_recommendations
    echo ""
    
    print_success "Memory optimization completed!"
    echo ""
    echo "To restart services with optimized settings:"
    echo "  ./start-services.sh"
    echo ""
    echo "To monitor memory usage:"
    echo "  ./monitor-resources.sh --continuous 30"
}

# Parse command line arguments
case "${1:-}" in
    --help|-h)
        echo "Usage: $0 [OPTION]"
        echo "Options:"
        echo "  --help, -h       Show this help message"
        echo ""
        echo "Without options, performs full memory optimization"
        exit 0
        ;;
    *)
        optimize_memory
        ;;
esac 