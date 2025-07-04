#!/bin/bash

# Memory Analysis and Optimization for Contract Management Development
# Identifies memory consumers and provides optimization recommendations

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
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
    echo -e "${GREEN}[OK]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[CRITICAL]${NC} $1"
}

# Function to get total system memory
get_total_memory() {
    local total_memory=$(sysctl hw.memsize | awk '{print $2}')
    echo $((total_memory / 1024 / 1024))  # Convert to MB
}

# Function to get available memory
get_available_memory() {
    local memory_info=$(vm_stat | grep "Pages free" | awk '{print $3}' | sed 's/\.//')
    local free_memory=$((memory_info * 4096 / 1024 / 1024))  # Convert to MB
    echo $free_memory
}

# Function to get memory usage by process
get_process_memory() {
    local process_name=$1
    local memory=$(ps aux | grep "$process_name" | grep -v grep | awk '{sum += $6} END {print sum}')
    echo ${memory:-0}
}

# Function to analyze Node.js processes
analyze_node_processes() {
    print_header "Node.js Process Memory Analysis"
    
    local node_processes=$(ps aux | grep -E "node|npm" | grep -v grep)
    if [ -z "$node_processes" ]; then
        print_warning "No Node.js processes found"
        return
    fi
    
    echo "Node.js Processes:"
    echo "$node_processes" | while read line; do
        local pid=$(echo "$line" | awk '{print $2}')
        local memory=$(echo "$line" | awk '{print $6}')
        local cpu=$(echo "$line" | awk '{print $3}')
        local command=$(echo "$line" | awk '{for(i=11;i<=NF;i++) printf "%s ", $i}')
        
        local memory_mb=$((memory / 1024))
        echo "  PID: $pid | Memory: ${memory_mb}MB | CPU: ${cpu}% | $command"
        
        if [ $memory_mb -gt 500 ]; then
            print_warning "  ⚠️  High memory usage: ${memory_mb}MB"
        fi
    done
}

# Function to analyze Docker containers
analyze_docker_memory() {
    print_header "Docker Container Memory Analysis"
    
    if ! command -v docker &> /dev/null; then
        print_warning "Docker not installed"
        return
    fi
    
    local containers=$(docker ps --format "{{.Names}}" 2>/dev/null)
    if [ -z "$containers" ]; then
        print_warning "No Docker containers running"
        return
    fi
    
    echo "Docker Containers:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}" 2>/dev/null || true
}

# Function to analyze log files
analyze_log_files() {
    print_header "Log File Analysis"
    
    local log_files=("backend.log" "frontend.log" "blockchain.log" "logs/*.log")
    local total_log_size=0
    
    for pattern in "${log_files[@]}"; do
        for file in $pattern; do
            if [ -f "$file" ]; then
                local size=$(du -b "$file" | cut -f1)
                local size_mb=$((size / 1024 / 1024))
                local lines=$(wc -l < "$file" 2>/dev/null || echo "0")
                
                echo "  $file: ${size_mb}MB ($lines lines)"
                total_log_size=$((total_log_size + size_mb))
                
                if [ $size_mb -gt 50 ]; then
                    print_warning "  ⚠️  Large log file: ${size_mb}MB"
                fi
            fi
        done
    done
    
    echo "  Total log size: ${total_log_size}MB"
}

# Function to analyze node_modules
analyze_node_modules() {
    print_header "Node Modules Analysis"
    
    local total_size=0
    local module_count=0
    
    # Find all node_modules directories
    find . -name "node_modules" -type d 2>/dev/null | while read dir; do
        if [ -d "$dir" ]; then
            local size=$(du -sh "$dir" | cut -f1)
            local size_mb=$(du -sm "$dir" | cut -f1)
            local count=$(find "$dir" -type d | wc -l)
            
            echo "  $dir: $size ($count directories)"
            total_size=$((total_size + size_mb))
            module_count=$((module_count + 1))
            
            if [ $size_mb -gt 500 ]; then
                print_warning "  ⚠️  Large node_modules: ${size_mb}MB"
            fi
        fi
    done
    
    echo "  Total node_modules: ${module_count} directories, ~${total_size}MB"
}

# Function to analyze browser processes
analyze_browser_memory() {
    print_header "Browser Process Analysis"
    
    local browsers=("Google Chrome" "Safari" "Firefox" "Chromium")
    
    for browser in "${browsers[@]}"; do
        local processes=$(ps aux | grep -i "$browser" | grep -v grep)
        if [ -n "$processes" ]; then
            local total_memory=0
            local process_count=0
            
            echo "$processes" | while read line; do
                local memory=$(echo "$line" | awk '{print $6}')
                local memory_mb=$((memory / 1024))
                total_memory=$((total_memory + memory_mb))
                process_count=$((process_count + 1))
            done
            
            if [ $total_memory -gt 0 ]; then
                echo "  $browser: ${process_count} processes, ~${total_memory}MB"
                if [ $total_memory -gt 1000 ]; then
                    print_warning "  ⚠️  High browser memory usage: ${total_memory}MB"
                fi
            fi
        fi
    done
}

# Function to provide memory optimization recommendations
provide_memory_optimizations() {
    print_header "Memory Optimization Recommendations"
    
    local total_memory=$(get_total_memory)
    local available_memory=$(get_available_memory)
    local used_memory=$((total_memory - available_memory))
    local usage_percent=$((used_memory * 100 / total_memory))
    
    echo "Current Memory Status:"
    echo "  Total: ${total_memory}MB"
    echo "  Used: ${used_memory}MB"
    echo "  Available: ${available_memory}MB"
    echo "  Usage: ${usage_percent}%"
    echo ""
    
    if [ $usage_percent -gt 90 ]; then
        print_error "CRITICAL: Memory usage is very high!"
        echo ""
        echo "Immediate Actions:"
        echo "  1. Stop development services: ./stop-services.sh"
        echo "  2. Close unnecessary browser tabs"
        echo "  3. Restart your computer if needed"
        echo ""
    elif [ $usage_percent -gt 80 ]; then
        print_warning "WARNING: Memory usage is high"
        echo ""
        echo "Recommended Actions:"
        echo "  1. Restart development services"
        echo "  2. Clear browser cache and close tabs"
        echo "  3. Check for memory leaks in applications"
        echo ""
    fi
    
    echo "Development Environment Optimizations:"
    echo "  1. Use './stop-services.sh' when not actively developing"
    echo "  2. Restart services periodically to free memory"
    echo "  3. Monitor log files and rotate them regularly"
    echo "  4. Use 'npm ci' instead of 'npm install' for faster installs"
    echo "  5. Consider using '--max-old-space-size' for Node.js processes"
    echo ""
    
    echo "System Optimizations:"
    echo "  1. Close unnecessary applications"
    echo "  2. Clear system caches: sudo purge"
    echo "  3. Restart Docker containers: docker system prune"
    echo "  4. Check Activity Monitor for memory-hogging processes"
    echo ""
    
    echo "Quick Commands:"
    echo "  Stop all services: ./stop-services.sh"
    echo "  Clear npm cache: npm cache clean --force"
    echo "  Clear Docker: docker system prune -f"
    echo "  Clear system cache: sudo purge"
    echo "  Monitor memory: ./monitor-resources.sh --continuous 10"
}

# Function to perform memory cleanup
perform_memory_cleanup() {
    print_header "Performing Memory Cleanup"
    
    echo "1. Stopping development services..."
    ./stop-services.sh 2>/dev/null || true
    
    echo "2. Clearing npm cache..."
    npm cache clean --force 2>/dev/null || true
    
    echo "3. Clearing Docker resources..."
    if command -v docker &> /dev/null; then
        docker system prune -f 2>/dev/null || true
    fi
    
    echo "4. Clearing system cache..."
    sudo purge 2>/dev/null || true
    
    echo "5. Rotating large log files..."
    for log_file in backend.log frontend.log blockchain.log; do
        if [ -f "$log_file" ]; then
            local size=$(du -b "$log_file" | cut -f1)
            if [ $size -gt 10485760 ]; then  # 10MB
                mv "$log_file" "${log_file}.old"
                touch "$log_file"
                echo "  Rotated $log_file"
            fi
        fi
    done
    
    print_success "Memory cleanup completed!"
}

# Main analysis function
analyze_memory() {
    echo -e "${CYAN}🔍 Memory Analysis - $(date)${NC}"
    echo ""
    
    # Get memory statistics
    local total_memory=$(get_total_memory)
    local available_memory=$(get_available_memory)
    local used_memory=$((total_memory - available_memory))
    local usage_percent=$((used_memory * 100 / total_memory))
    
    print_header "System Memory Overview"
    echo "Total Memory: ${total_memory}MB"
    echo "Used Memory: ${used_memory}MB"
    echo "Available Memory: ${available_memory}MB"
    echo "Usage: ${usage_percent}%"
    echo ""
    
    # Analyze different components
    analyze_node_processes
    echo ""
    
    analyze_docker_memory
    echo ""
    
    analyze_log_files
    echo ""
    
    analyze_node_modules
    echo ""
    
    analyze_browser_memory
    echo ""
    
    # Provide recommendations
    provide_memory_optimizations
    echo ""
    
    print_success "Memory analysis complete!"
}

# Parse command line arguments
case "${1:-}" in
    --cleanup|-c)
        perform_memory_cleanup
        ;;
    --help|-h)
        echo "Usage: $0 [OPTION]"
        echo "Options:"
        echo "  --cleanup, -c    Perform memory cleanup operations"
        echo "  --help, -h       Show this help message"
        echo ""
        echo "Without options, runs memory analysis only"
        exit 0
        ;;
    *)
        analyze_memory
        ;;
esac 