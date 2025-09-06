#!/bin/bash

# =============================================================================
# SCRIPT MANAGER - MASTER SCRIPT FOR ALL SYSTEM OPERATIONS
# =============================================================================
# This script provides a single entry point for all common system tasks
# and consolidates redundant scripts into a unified interface
# =============================================================================

set -e

# Load centralized configuration
if [ -f "config.env" ]; then
    source config.env
fi

# Load secrets (if available)
if [ -f "secrets.env" ]; then
    source secrets.env
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to show help
show_help() {
    echo -e "${BLUE}Contract Management System - Script Manager${NC}"
    echo -e "${BLUE}===========================================${NC}"
    echo ""
    echo -e "${CYAN}Usage: $0 [CATEGORY] [COMMAND] [OPTIONS]${NC}"
    echo ""
    echo -e "${YELLOW}Categories:${NC}"
    echo "  system     - System management (start, stop, restart, status)"
    echo "  setup      - Setup and installation (fresh, dev, ***REMOVED-KEYCLOAK_DB_PASSWORD***, database)"
    echo "  test       - Testing (apis, contracts, ai-models, e2e)"
    echo "  deploy     - Deployment (local, cloud, k8s)"
    echo "  config     - Configuration management"
    echo "  monitor    - Monitoring and maintenance"
    echo "  help       - Show detailed help"
    echo ""
    echo -e "${YELLOW}Examples:${NC}"
    echo "  $0 system start                    # Start all services"
    echo "  $0 system start --backend-only     # Start only backend"
    echo "  $0 setup fresh                     # Fresh system setup"
    echo "  $0 test apis --simple              # Simple API tests"
    echo "  $0 deploy local                    # Local deployment"
    echo ""
    echo -e "${YELLOW}For detailed help on a category:${NC}"
    echo "  $0 help system"
    echo "  $0 help setup"
    echo "  $0 help test"
}

# Function to show category help
show_category_help() {
    local category=$1
    
    case $category in
        system)
            echo -e "${BLUE}System Management Commands${NC}"
            echo "=========================="
            echo ""
            echo -e "${YELLOW}Commands:${NC}"
            echo "  start [OPTIONS]     - Start services"
            echo "  stop [OPTIONS]      - Stop services"
            echo "  restart [OPTIONS]   - Restart services"
            echo "  status              - Show system status"
            echo "  clean-start         - Clean system start"
            echo "  clean-stop          - Clean system stop"
            echo ""
            echo -e "${YELLOW}Options:${NC}"
            echo "  --backend-only      - Start/stop only backend"
            echo "  --frontend-only     - Start/stop only frontend"
            echo "  --scitt-ccf-only    - Start/stop only SCITT CCF"
            echo "  --dev               - Development mode"
            echo "  --production        - Production mode"
            echo ""
            echo -e "${YELLOW}Examples:${NC}"
            echo "  $0 system start"
            echo "  $0 system start --backend-only --dev"
            echo "  $0 system status"
            ;;
        setup)
            echo -e "${BLUE}Setup and Installation Commands${NC}"
            echo "=================================="
            echo ""
            echo -e "${YELLOW}Commands:${NC}"
            echo "  fresh               - Fresh system setup"
            echo "  dev                 - Development environment setup"
            echo "  ***REMOVED-KEYCLOAK_DB_PASSWORD*** [OPTIONS]  - Keycloak setup"
            echo "  database [OPTIONS]  - Database setup"
            echo "  dependencies        - Install dependencies"
            echo ""
            echo -e "${YELLOW}Keycloak Options:${NC}"
            echo "  --http              - HTTP setup"
            echo "  --https             - HTTPS setup"
            echo "  --persistent        - Persistent setup"
            echo ""
            echo -e "${YELLOW}Database Options:${NC}"
            echo "  --test              - Test database"
            echo "  --production        - Production database"
            echo "  --comprehensive     - Comprehensive setup"
            echo ""
            echo -e "${YELLOW}Examples:${NC}"
            echo "  $0 setup fresh"
            echo "  $0 setup ***REMOVED-KEYCLOAK_DB_PASSWORD*** --https"
            echo "  $0 setup database --test"
            ;;
        test)
            echo -e "${BLUE}Testing Commands${NC}"
            echo "=================="
            echo ""
            echo -e "${YELLOW}Commands:${NC}"
            echo "  apis [OPTIONS]      - API testing"
            echo "  contracts [OPTIONS] - Contract creation testing"
            echo "  ai-models [OPTIONS] - AI model testing"
            echo "  e2e [OPTIONS]       - End-to-end testing"
            echo "  create-data [OPTIONS] - Create test data"
            echo "  integration [OPTIONS] - Integration testing"
            echo "  users [OPTIONS]     - User role testing"
            echo "  datasets [OPTIONS]  - Dataset testing"
            echo "  models [OPTIONS]    - AI model testing"
            echo "  environments [OPTIONS] - Training environment testing"
            echo "  test-data [OPTIONS] - Manage common test data"
            echo ""
            echo -e "${YELLOW}API Test Options:${NC}"
            echo "  --simple            - Simple output format"
            echo "  --verbose           - Verbose output"
            echo ""
            echo -e "${YELLOW}Contract Test Options:${NC}"
            echo "  --ui                - UI testing"
            echo "  --e2e               - End-to-end testing"
            echo "  --simplified        - Simplified testing"
            echo ""
            echo -e "${YELLOW}AI Model Test Options:${NC}"
            echo "  --display           - Display testing"
            echo "  --single-select     - Single select testing"
            echo ""
            echo -e "${YELLOW}Test Data Options:${NC}"
            echo "  --comprehensive     - Create comprehensive test data"
            echo "  --basic             - Create basic test data"
            echo "  --via-apis          - Create data via APIs only"
            echo "  --tdp-only          - Create TDP test data only"
            echo "  --tdc-only          - Create TDC test data only"
            echo "  --ccrp-only         - Create CCRP test data only"
            echo ""
            echo -e "${YELLOW}Integration Test Options:${NC}"
            echo "  --full              - Full integration test suite"
            echo "  --quick             - Quick integration tests"
            echo "  --user-workflows    - Test user workflows"
            echo "  --role-based        - Test role-based functionality"
            echo ""
            echo -e "${YELLOW}Test Data Options:${NC}"
            echo "  --init              - Initialize common test data"
            echo "  --show              - Show test data summary"
            echo "  --clear             - Clear test data cache"
            echo "  --refresh           - Refresh test data"
            echo ""
            echo -e "${YELLOW}Examples:${NC}"
            echo "  $0 test apis --simple"
            echo "  $0 test contracts --ui"
            echo "  $0 test create-data --comprehensive"
            echo "  $0 test integration --full"
            echo "  $0 test users --tdp"
            echo "  $0 test datasets --create"
            echo "  $0 test test-data --init"
            ;;
        deploy)
            echo -e "${BLUE}Deployment Commands${NC}"
            echo "===================="
            echo ""
            echo -e "${YELLOW}Commands:${NC}"
            echo "  local [OPTIONS]     - Local deployment"
            echo "  cloud [OPTIONS]     - Cloud deployment"
            echo "  k8s [OPTIONS]       - Kubernetes deployment"
            echo "  status              - Deployment status"
            echo ""
            echo -e "${YELLOW}Cloud Options:${NC}"
            echo "  --azure             - Azure deployment"
            echo "  --gcp               - Google Cloud deployment"
            echo "  --oci               - Oracle Cloud deployment"
            echo ""
            echo -e "${YELLOW}K8s Options:${NC}"
            echo "  --minikube          - Minikube setup"
            echo "  --local             - Local K8s setup"
            echo ""
            echo -e "${YELLOW}Examples:${NC}"
            echo "  $0 deploy local"
            echo "  $0 deploy cloud --azure"
            echo "  $0 deploy k8s --minikube"
            ;;
        config)
            echo -e "${BLUE}Configuration Management Commands${NC}"
            echo "===================================="
            echo ""
            echo -e "${YELLOW}Commands:${NC}"
            echo "  validate            - Validate configuration"
            echo "  backup              - Backup configuration"
            echo "  restore             - Restore configuration"
            echo "  status              - Configuration status"
            echo "  fix                 - Fix configuration issues"
            echo ""
            echo -e "${YELLOW}Examples:${NC}"
            echo "  $0 config validate"
            echo "  $0 config backup"
            echo "  $0 config status"
            ;;
        monitor)
            echo -e "${BLUE}Monitoring and Maintenance Commands${NC}"
            echo "======================================"
            echo ""
            echo -e "${YELLOW}Commands:${NC}"
            echo "  resources           - Monitor system resources"
            echo "  memory              - Memory analysis"
            echo "  cleanup             - System cleanup"
            echo "  optimize            - System optimization"
            echo "  emergency-stop      - Emergency stop"
            echo ""
            echo -e "${YELLOW}Examples:${NC}"
            echo "  $0 monitor resources"
            echo "  $0 monitor memory"
            echo "  $0 monitor cleanup"
            ;;
        *)
            echo -e "${RED}Unknown category: $category${NC}"
            echo "Available categories: system, setup, test, deploy, config, monitor"
            ;;
    esac
}

# Function to handle system commands
handle_system() {
    local command=$1
    shift
    local options=("$@")
    
    case $command in
        start)
            print_status $BLUE "🚀 Starting system services..."
            
            # Check for options
            local backend_only=false
            local frontend_only=false
            local scitt_ccf_only=false
            local dev_mode=false
            local production_mode=false
            
            for opt in "${options[@]}"; do
                case $opt in
                    --backend-only) backend_only=true ;;
                    --frontend-only) frontend_only=true ;;
                    --scitt-ccf-only) scitt_ccf_only=true ;;
                    --dev) dev_mode=true ;;
                    --production) production_mode=true ;;
                esac
            done
            
            # Determine which script to use
            if [ "$backend_only" = true ]; then
                print_status $BLUE "Starting backend only..."
                ./deployment/local/start-backend-only.sh
            elif [ "$frontend_only" = true ]; then
                print_status $BLUE "Starting frontend only..."
                ./deployment/local/start-frontend.sh
            elif [ "$scitt_ccf_only" = true ]; then
                print_status $BLUE "Starting SCITT CCF only..."
                ./deployment/local/start-scitt-ccf-integrated.sh
            elif [ "$dev_mode" = true ]; then
                print_status $BLUE "Starting development environment..."
                ./dev-start.sh
            elif [ "$production_mode" = true ]; then
                print_status $BLUE "Starting production environment..."
                ./start-system.sh
            else
                print_status $BLUE "Starting all services..."
                ./start-system.sh
            fi
            ;;
        stop)
            print_status $BLUE "🛑 Stopping system services..."
            ./stop-system.sh
            ;;
        restart)
            print_status $BLUE "🔄 Restarting system services..."
            ./stop-system.sh
            sleep 2
            ./start-system.sh
            ;;
        status)
            print_status $BLUE "📊 Checking system status..."
            ./deployment/local/status.sh
            ;;
        clean-start)
            print_status $BLUE "🧹 Clean system start..."
            ./clean-start.sh
            ;;
        clean-stop)
            print_status $BLUE "🧹 Clean system stop..."
            ./clean-stop.sh
            ;;
        *)
            print_status $RED "Unknown system command: $command"
            show_category_help system
            exit 1
            ;;
    esac
}

# Function to handle setup commands
handle_setup() {
    local command=$1
    shift
    local options=("$@")
    
    case $command in
        fresh)
            print_status $BLUE "🆕 Fresh system setup..."
            ./setup-fresh-system.sh
            ;;
        dev)
            print_status $BLUE "🛠️ Development environment setup..."
            ./dev-setup.sh
            ;;
        ***REMOVED-KEYCLOAK_DB_PASSWORD***)
            print_status $BLUE "🔐 Keycloak setup..."
            
            local http_mode=false
            local https_mode=false
            local persistent_mode=false
            
            for opt in "${options[@]}"; do
                case $opt in
                    --http) http_mode=true ;;
                    --https) https_mode=true ;;
                    --persistent) persistent_mode=true ;;
                esac
            done
            
            if [ "$https_mode" = true ]; then
                ./deployment/setup-***REMOVED-KEYCLOAK_DB_PASSWORD***-https.sh
            elif [ "$persistent_mode" = true ]; then
                ./backend/setup-***REMOVED-KEYCLOAK_DB_PASSWORD***-persistent.sh
            else
                ./backend/setup-***REMOVED-KEYCLOAK_DB_PASSWORD***.js
            fi
            ;;
        database)
            print_status $BLUE "🗄️ Database setup..."
            
            local test_mode=false
            local production_mode=false
            local comprehensive_mode=false
            
            for opt in "${options[@]}"; do
                case $opt in
                    --test) test_mode=true ;;
                    --production) production_mode=true ;;
                    --comprehensive) comprehensive_mode=true ;;
                esac
            done
            
            if [ "$test_mode" = true ]; then
                ./backend/scripts/source/setup-test-database.js
            elif [ "$comprehensive_mode" = true ]; then
                ./backend/scripts/source/setup-comprehensive-db.js
            else
                ./backend/scripts/source/setupDatabase.js
            fi
            ;;
        dependencies)
            print_status $BLUE "📦 Installing dependencies..."
            npm install
            cd backend && npm install
            cd ../frontend && npm install
            cd ..
            ;;
        *)
            print_status $RED "Unknown setup command: $command"
            show_category_help setup
            exit 1
            ;;
    esac
}

# Function to handle test commands
handle_test() {
    local command=$1
    shift
    local options=("$@")
    
    case $command in
        apis)
            print_status $BLUE "🧪 Running API tests..."
            
            local simple_mode=false
            local verbose_mode=false
            
            for opt in "${options[@]}"; do
                case $opt in
                    --simple) simple_mode=true ;;
                    --verbose) verbose_mode=true ;;
                esac
            done
            
            if [ "$simple_mode" = true ]; then
                ./deployment/test-basic-apis-simple.sh
            else
                ./deployment/test-basic-apis.sh
            fi
            ;;
        contracts)
            print_status $BLUE "📋 Running contract tests..."
            
            local ui_mode=false
            local e2e_mode=false
            local simplified_mode=false
            
            for opt in "${options[@]}"; do
                case $opt in
                    --ui) ui_mode=true ;;
                    --e2e) e2e_mode=true ;;
                    --simplified) simplified_mode=true ;;
                esac
            done
            
            if [ "$ui_mode" = true ]; then
                ./deployment/test-contract-creation-ui.sh
            elif [ "$e2e_mode" = true ]; then
                ./deployment/test-contract-creation-end-to-end.sh
            elif [ "$simplified_mode" = true ]; then
                ./deployment/test-contract-creation-simplified.sh
            else
                ./deployment/test-contract-creation.sh
            fi
            ;;
        ai-models)
            print_status $BLUE "🤖 Running AI model tests..."
            
            local display_mode=false
            local single_select_mode=false
            
            for opt in "${options[@]}"; do
                case $opt in
                    --display) display_mode=true ;;
                    --single-select) single_select_mode=true ;;
                esac
            done
            
            if [ "$display_mode" = true ]; then
                ./deployment/test-ai-models-display.sh
            elif [ "$single_select_mode" = true ]; then
                ./deployment/test-ai-models-single-select.sh
            else
                ./deployment/test-ai-models-display.sh
            fi
            ;;
        e2e)
            print_status $BLUE "🔄 Running end-to-end tests..."
            ./deployment/test-contract-creation-end-to-end.sh
            ;;
        create-data)
            print_status $BLUE "📊 Creating test data..."
            
            local comprehensive_mode=false
            local basic_mode=false
            local via_apis_mode=false
            local tdp_only=false
            local tdc_only=false
            local ccrp_only=false
            
            for opt in "${options[@]}"; do
                case $opt in
                    --comprehensive) comprehensive_mode=true ;;
                    --basic) basic_mode=true ;;
                    --via-apis) via_apis_mode=true ;;
                    --tdp-only) tdp_only=true ;;
                    --tdc-only) tdc_only=true ;;
                    --ccrp-only) ccrp_only=true ;;
                esac
            done
            
            if [ "$via_apis_mode" = true ] || [ "$comprehensive_mode" = true ]; then
                print_status $BLUE "Creating test data via registration API..."
                BACKEND_URL="$BACKEND_URL" KEYCLOAK_URL="$KEYCLOAK_URL" FRONTEND_URL="$FRONTEND_URL" node scripts/create-test-data-via-registration-api.js
            elif [ "$tdp_only" = true ]; then
                print_status $BLUE "Creating TDP test data..."
                ./scripts/create-tdp-test-data.sh
            elif [ "$tdc_only" = true ]; then
                print_status $BLUE "Creating TDC test data..."
                ./scripts/create-tdc-test-data.sh
            elif [ "$ccrp_only" = true ]; then
                print_status $BLUE "Creating CCRP test data..."
                ./scripts/create-ccrp-test-data.sh
            else
                print_status $BLUE "Creating basic test data via registration API..."
                BACKEND_URL="$BACKEND_URL" KEYCLOAK_URL="$KEYCLOAK_URL" FRONTEND_URL="$FRONTEND_URL" node scripts/create-test-data-via-registration-api.js
            fi
            ;;
        integration)
            print_status $BLUE "🔄 Running integration tests..."
            
            local full_mode=false
            local quick_mode=false
            local user_workflows=false
            local role_based=false
            
            for opt in "${options[@]}"; do
                case $opt in
                    --full) full_mode=true ;;
                    --quick) quick_mode=true ;;
                    --user-workflows) user_workflows=true ;;
                    --role-based) role_based=true ;;
                esac
            done
            
            if [ "$full_mode" = true ]; then
                print_status $BLUE "Running full integration test suite..."
                ./scripts/test-integration-full.sh
            elif [ "$quick_mode" = true ]; then
                print_status $BLUE "Running quick integration tests..."
                ./scripts/test-integration-quick.sh
            elif [ "$user_workflows" = true ]; then
                print_status $BLUE "Testing user workflows..."
                ./scripts/test-user-roles-all.sh
            elif [ "$role_based" = true ]; then
                print_status $BLUE "Testing role-based functionality..."
                ./scripts/test-user-roles-all.sh
            else
                print_status $BLUE "Running standard integration tests..."
                ./scripts/test-integration-full.sh
            fi
            ;;
        users)
            print_status $BLUE "👥 Testing user roles..."
            
            local tdp_test=false
            local tdc_test=false
            local ccrp_test=false
            local admin_test=false
            
            for opt in "${options[@]}"; do
                case $opt in
                    --tdp) tdp_test=true ;;
                    --tdc) tdc_test=true ;;
                    --ccrp) ccrp_test=true ;;
                    --admin) admin_test=true ;;
                esac
            done
            
            if [ "$tdp_test" = true ]; then
                print_status $BLUE "Testing TDP user functionality..."
                ./scripts/test-tdp-user.sh
            elif [ "$tdc_test" = true ]; then
                print_status $BLUE "Testing TDC user functionality..."
                ./scripts/test-tdc-user.sh
            elif [ "$ccrp_test" = true ]; then
                print_status $BLUE "Testing CCRP user functionality..."
                ./scripts/test-ccrp-user.sh
            elif [ "$admin_test" = true ]; then
                print_status $BLUE "Testing Admin user functionality..."
                ./scripts/test-admin-user.sh
            else
                print_status $BLUE "Testing all user roles..."
                ./scripts/test-user-roles-all.sh
            fi
            ;;
        datasets)
            print_status $BLUE "📊 Testing datasets..."
            
            local create_test=false
            local list_test=false
            local access_test=false
            
            for opt in "${options[@]}"; do
                case $opt in
                    --create) create_test=true ;;
                    --list) list_test=true ;;
                    --access) access_test=true ;;
                esac
            done
            
            if [ "$create_test" = true ]; then
                print_status $BLUE "Testing dataset creation..."
                ./scripts/test-dataset-creation.sh
            elif [ "$list_test" = true ]; then
                print_status $BLUE "Testing dataset listing..."
                ./scripts/test-dataset-listing.sh
            elif [ "$access_test" = true ]; then
                print_status $BLUE "Testing dataset access..."
                ./scripts/test-dataset-access.sh
            else
                print_status $BLUE "Testing all dataset functionality..."
                ./scripts/test-datasets-comprehensive.sh
            fi
            ;;
        models)
            print_status $BLUE "🤖 Testing AI models..."
            
            local create_test=false
            local list_test=false
            local training_test=false
            
            for opt in "${options[@]}"; do
                case $opt in
                    --create) create_test=true ;;
                    --list) list_test=true ;;
                    --training) training_test=true ;;
                esac
            done
            
            if [ "$create_test" = true ]; then
                print_status $BLUE "Testing AI model creation..."
                ./scripts/test-model-creation.sh
            elif [ "$list_test" = true ]; then
                print_status $BLUE "Testing AI model listing..."
                ./scripts/test-model-listing.sh
            elif [ "$training_test" = true ]; then
                print_status $BLUE "Testing AI model training..."
                ./scripts/test-model-training.sh
            else
                print_status $BLUE "Testing all AI model functionality..."
                ./scripts/test-models-comprehensive.sh
            fi
            ;;
        environments)
            print_status $BLUE "🏗️ Testing training environments..."
            
            local create_test=false
            local list_test=false
            local access_test=false
            
            for opt in "${options[@]}"; do
                case $opt in
                    --create) create_test=true ;;
                    --list) list_test=true ;;
                    --access) access_test=true ;;
                esac
            done
            
            if [ "$create_test" = true ]; then
                print_status $BLUE "Testing environment creation..."
                ./scripts/test-environment-creation.sh
            elif [ "$list_test" = true ]; then
                print_status $BLUE "Testing environment listing..."
                ./scripts/test-environment-listing.sh
            elif [ "$access_test" = true ]; then
                print_status $BLUE "Testing environment access..."
                ./scripts/test-environment-access.sh
            else
                print_status $BLUE "Testing all environment functionality..."
                ./scripts/test-environments-comprehensive.sh
            fi
            ;;
        test-data)
            print_status $BLUE "📋 Managing common test data..."
            
            local init_data=false
            local show_data=false
            local clear_data=false
            local refresh_data=false
            
            for opt in "${options[@]}"; do
                case $opt in
                    --init) init_data=true ;;
                    --show) show_data=true ;;
                    --clear) clear_data=true ;;
                    --refresh) refresh_data=true ;;
                esac
            done
            
            if [ "$init_data" = true ]; then
                print_status $BLUE "Initializing common test data..."
                ./scripts/test-data-common-simple.sh
            elif [ "$show_data" = true ]; then
                print_status $BLUE "Showing test data summary..."
                ./scripts/test-data-common-simple.sh
            elif [ "$clear_data" = true ]; then
                print_status $BLUE "Clearing test data cache..."
                ./scripts/test-data-common-simple.sh --clear
            elif [ "$refresh_data" = true ]; then
                print_status $BLUE "Refreshing test data..."
                ./scripts/test-data-common-simple.sh --clear
                ./scripts/test-data-common-simple.sh
            else
                print_status $BLUE "Initializing common test data..."
                ./scripts/test-data-common-simple.sh
            fi
            ;;
        *)
            print_status $RED "Unknown test command: $command"
            show_category_help test
            exit 1
            ;;
    esac
}

# Function to handle deploy commands
handle_deploy() {
    local command=$1
    shift
    local options=("$@")
    
    case $command in
        local)
            print_status $BLUE "🏠 Local deployment..."
            ./deployment/local/setup-and-run.sh
            ;;
        cloud)
            print_status $BLUE "☁️ Cloud deployment..."
            
            local azure_mode=false
            local gcp_mode=false
            local oci_mode=false
            
            for opt in "${options[@]}"; do
                case $opt in
                    --azure) azure_mode=true ;;
                    --gcp) gcp_mode=true ;;
                    --oci) oci_mode=true ;;
                esac
            done
            
            if [ "$azure_mode" = true ]; then
                ./deploy/azure/deploy-azure.sh
            elif [ "$gcp_mode" = true ]; then
                ./deploy/gcp/deploy-gcp.sh
            elif [ "$oci_mode" = true ]; then
                ./deploy/oci/deploy-oci.sh
            else
                print_status $RED "Please specify cloud provider: --azure, --gcp, or --oci"
                exit 1
            fi
            ;;
        k8s)
            print_status $BLUE "☸️ Kubernetes deployment..."
            
            local minikube_mode=false
            local local_mode=false
            
            for opt in "${options[@]}"; do
                case $opt in
                    --minikube) minikube_mode=true ;;
                    --local) local_mode=true ;;
                esac
            done
            
            if [ "$minikube_mode" = true ]; then
                ./k8s/minikube-setup.sh
            elif [ "$local_mode" = true ]; then
                ./k8s/local-setup.sh
            else
                ./k8s/deploy.sh
            fi
            ;;
        status)
            print_status $BLUE "📊 Deployment status..."
            ./deployment/deployment-status.sh
            ;;
        *)
            print_status $RED "Unknown deploy command: $command"
            show_category_help deploy
            exit 1
            ;;
    esac
}

# Function to handle config commands
handle_config() {
    local command=$1
    shift
    
    case $command in
        validate)
            ./scripts/config-manager.sh validate
            ;;
        backup)
            ./scripts/config-manager.sh backup
            ;;
        restore)
            ./scripts/config-manager.sh restore
            ;;
        status)
            ./scripts/config-manager.sh status
            ;;
        fix)
            ./scripts/config-manager.sh fix
            ;;
        *)
            print_status $RED "Unknown config command: $command"
            show_category_help config
            exit 1
            ;;
    esac
}

# Function to handle monitor commands
handle_monitor() {
    local command=$1
    shift
    
    case $command in
        resources)
            print_status $BLUE "📊 Monitoring system resources..."
            ./deployment/monitoring/monitor-resources.sh
            ;;
        memory)
            print_status $BLUE "🧠 Memory analysis..."
            ./deployment/monitoring/analyze-memory.sh
            ;;
        cleanup)
            print_status $BLUE "🧹 System cleanup..."
            ./deployment/monitoring/cleanup-memory.sh
            ;;
        optimize)
            print_status $BLUE "⚡ System optimization..."
            ./deployment/monitoring/optimize-memory.sh
            ;;
        emergency-stop)
            print_status $RED "🚨 Emergency stop..."
            ./deployment/local/emergency-stop.sh
            ;;
        *)
            print_status $RED "Unknown monitor command: $command"
            show_category_help monitor
            exit 1
            ;;
    esac
}

# Main script logic
if [ $# -eq 0 ]; then
    show_help
    exit 0
fi

category=$1
shift

case $category in
    system)
        handle_system "$@"
        ;;
    setup)
        handle_setup "$@"
        ;;
    test)
        handle_test "$@"
        ;;
    deploy)
        handle_deploy "$@"
        ;;
    config)
        handle_config "$@"
        ;;
    monitor)
        handle_monitor "$@"
        ;;
    help)
        if [ $# -eq 0 ]; then
            show_help
        else
            show_category_help "$1"
        fi
        ;;
    *)
        print_status $RED "Unknown category: $category"
        echo ""
        show_help
        exit 1
        ;;
esac
