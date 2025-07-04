#!/bin/bash

# System Resource Monitor for Contract Management Development
# Monitors CPU, Memory, Disk, Network, and Service-specific resources

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Thresholds (percentages)
CPU_WARNING=70
CPU_CRITICAL=85
MEMORY_WARNING=75
MEMORY_CRITICAL=90
DISK_WARNING=80
DISK_CRITICAL=90

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

# Function to get CPU usage
get_cpu_usage() {
    local cpu_usage=$(top -l 1 | grep "CPU usage" | awk '{print $3}' | sed 's/%//')
    echo $cpu_usage
}

# Function to get memory usage
get_memory_usage() {
    local memory_info=$(vm_stat | grep "Pages free" | awk '{print $3}' | sed 's/\.//')
    local total_memory=$(sysctl hw.memsize | awk '{print $2}')
    local free_memory=$((memory_info * 4096))
    local used_memory=$((total_memory - free_memory))
    local memory_percent=$((used_memory * 100 / total_memory))
    echo $memory_percent
}

# Function to get disk usage
get_disk_usage() {
    local disk_usage=$(df -h / | tail -1 | awk '{print $5}' | sed 's/%//')
    echo $disk_usage
}

# Function to get network connections
get_network_connections() {
    local connections=$(netstat -an | grep ESTABLISHED | wc -l)
    echo $connections
}

# Function to check service-specific resources
check_service_resources() {
    print_header "Service-Specific Resource Usage"
    
    # Check Docker containers
    if command -v docker &> /dev/null; then
        local docker_containers=$(docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null | grep -v "NAMES" | wc -l)
        if [ $docker_containers -gt 0 ]; then
            print_status "Docker containers running: $docker_containers"
            docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" 2>/dev/null || true
        else
            print_warning "No Docker containers running"
        fi
    fi
    
    # Check Node.js processes
    local node_processes=$(ps aux | grep -E "node|npm" | grep -v grep | wc -l)
    print_status "Node.js processes: $node_processes"
    
    # Check specific service ports
    local ports=("3000" "3001" "5001" "8080" "8545")
    for port in "${ports[@]}"; do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            local process=$(lsof -Pi :$port -sTCP:LISTEN | grep LISTEN | awk '{print $1, $2}' | head -1)
            print_success "Port $port: $process"
        else
            print_warning "Port $port: Not in use"
        fi
    done
}

# Function to check development-specific resources
check_dev_resources() {
    print_header "Development Environment Resources"
    
    # Check log file sizes
    local log_files=("backend.log" "frontend.log" "blockchain.log")
    for log_file in "${log_files[@]}"; do
        if [ -f "$log_file" ]; then
            local size=$(du -h "$log_file" | cut -f1)
            local lines=$(wc -l < "$log_file" 2>/dev/null || echo "0")
            print_status "$log_file: $size ($lines lines)"
            
            # Warn if log is getting large
            local size_bytes=$(du -b "$log_file" | cut -f1)
            if [ $size_bytes -gt 10485760 ]; then  # 10MB
                print_warning "$log_file is large ($size). Consider rotating logs."
            fi
        fi
    done
    
    # Check PID files
    local pid_files=(".backend.pid" ".frontend.pid" ".hardhat.pid" ".***REMOVED-KEYCLOAK_DB_PASSWORD***.pid")
    for pid_file in "${pid_files[@]}"; do
        if [ -f "$pid_file" ]; then
            local pid=$(cat "$pid_file")
            if ps -p $pid > /dev/null 2>&1; then
                print_success "$pid_file: Process $pid is running"
            else
                print_error "$pid_file: Process $pid is not running (stale PID file)"
            fi
        fi
    done
    
    # Check node_modules size
    if [ -d "node_modules" ]; then
        local node_modules_size=$(du -sh node_modules | cut -f1)
        print_status "node_modules size: $node_modules_size"
    fi
    
    # Check available ports
    local available_ports=0
    for port in {3000..3010} {5000..5010} {8080..8090} {8545..8555}; do
        if ! lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            available_ports=$((available_ports + 1))
        fi
    done
    print_status "Available ports in range: $available_ports"
}

# Function to check system limits
check_system_limits() {
    print_header "System Limits & Configuration"
    
    # Check file descriptors
    local max_files=$(ulimit -n)
    local open_files=$(lsof | wc -l)
    print_status "File descriptors - Max: $max_files, Open: $open_files"
    
    if [ $open_files -gt $((max_files * 80 / 100)) ]; then
        print_warning "High file descriptor usage"
    fi
    
    # Check process limits
    local max_processes=$(ulimit -u)
    local current_processes=$(ps aux | wc -l)
    print_status "Processes - Max: $max_processes, Current: $current_processes"
    
    # Check Docker resources (if available)
    if command -v docker &> /dev/null; then
        local docker_info=$(docker system df 2>/dev/null || echo "Docker not accessible")
        print_status "Docker disk usage: $docker_info"
    fi
}

# Function to provide recommendations
provide_recommendations() {
    print_header "Resource Recommendations"
    
    local cpu_usage=$(get_cpu_usage)
    local memory_usage=$(get_memory_usage)
    local disk_usage=$(get_disk_usage)
    
    if [ $cpu_usage -gt $CPU_CRITICAL ]; then
        print_error "CPU usage is critical ($cpu_usage%). Consider:"
        echo "  - Closing unnecessary applications"
        echo "  - Restarting development services"
        echo "  - Checking for runaway processes"
    elif [ $cpu_usage -gt $CPU_WARNING ]; then
        print_warning "CPU usage is high ($cpu_usage%). Monitor closely."
    fi
    
    if [ $memory_usage -gt $MEMORY_CRITICAL ]; then
        print_error "Memory usage is critical ($memory_usage%). Consider:"
        echo "  - Restarting development services"
        echo "  - Clearing browser tabs"
        echo "  - Restarting Docker containers"
    elif [ $memory_usage -gt $MEMORY_WARNING ]; then
        print_warning "Memory usage is high ($memory_usage%). Monitor closely."
    fi
    
    if [ $disk_usage -gt $DISK_CRITICAL ]; then
        print_error "Disk usage is critical ($disk_usage%). Consider:"
        echo "  - Cleaning up log files"
        echo "  - Removing old Docker images"
        echo "  - Clearing npm cache: npm cache clean --force"
    elif [ $disk_usage -gt $DISK_WARNING ]; then
        print_warning "Disk usage is high ($disk_usage%). Monitor closely."
    fi
    
    # Development-specific recommendations
    echo ""
    print_status "Development Tips:"
    echo "  - Use './stop-services.sh' to clean up all services"
    echo "  - Restart services periodically to free memory"
    echo "  - Monitor log files for memory leaks"
    echo "  - Use 'docker system prune' to clean Docker resources"
}

# Main monitoring function
monitor_resources() {
    echo -e "${CYAN}🔍 System Resource Monitor - $(date)${NC}"
    echo ""
    
    # Get current resource usage
    local cpu_usage=$(get_cpu_usage)
    local memory_usage=$(get_memory_usage)
    local disk_usage=$(get_disk_usage)
    local network_connections=$(get_network_connections)
    
    # Display system resources
    print_header "System Resources"
    echo -e "CPU Usage:     ${cpu_usage}%"
    echo -e "Memory Usage:  ${memory_usage}%"
    echo -e "Disk Usage:    ${disk_usage}%"
    echo -e "Network Connections: ${network_connections}"
    echo ""
    
    # Color-code resource usage
    if [ $(echo "$cpu_usage > $CPU_CRITICAL" | bc -l) -eq 1 ]; then
        print_error "CPU usage is CRITICAL!"
    elif [ $(echo "$cpu_usage > $CPU_WARNING" | bc -l) -eq 1 ]; then
        print_warning "CPU usage is HIGH"
    else
        print_success "CPU usage is normal"
    fi
    
    if [ $memory_usage -gt $MEMORY_CRITICAL ]; then
        print_error "Memory usage is CRITICAL!"
    elif [ $memory_usage -gt $MEMORY_WARNING ]; then
        print_warning "Memory usage is HIGH"
    else
        print_success "Memory usage is normal"
    fi
    
    if [ $disk_usage -gt $DISK_CRITICAL ]; then
        print_error "Disk usage is CRITICAL!"
    elif [ $disk_usage -gt $DISK_WARNING ]; then
        print_warning "Disk usage is HIGH"
    else
        print_success "Disk usage is normal"
    fi
    
    echo ""
    
    # Check service-specific resources
    check_service_resources
    echo ""
    
    # Check development resources
    check_dev_resources
    echo ""
    
    # Check system limits
    check_system_limits
    echo ""
    
    # Provide recommendations
    provide_recommendations
    echo ""
    
    print_success "Resource monitoring complete!"
}

# Continuous monitoring mode
continuous_monitor() {
    local interval=${1:-30}  # Default 30 seconds
    echo -e "${CYAN}🔄 Starting continuous monitoring (every ${interval}s)${NC}"
    echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
    echo ""
    
    while true; do
        clear
        monitor_resources
        echo ""
        echo -e "${BLUE}Next check in ${interval} seconds...${NC}"
        sleep $interval
    done
}

# Parse command line arguments
case "${1:-}" in
    --continuous|-c)
        continuous_monitor "${2:-30}"
        ;;
    --help|-h)
        echo "Usage: $0 [OPTION]"
        echo "Options:"
        echo "  --continuous, -c [SECONDS]  Monitor continuously (default: 30s)"
        echo "  --help, -h                 Show this help message"
        echo ""
        echo "Without options, runs a single resource check"
        exit 0
        ;;
    *)
        monitor_resources
        ;;
esac 