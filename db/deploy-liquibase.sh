#!/bin/bash

# Liquibase Migration Deployment Script for GCP
# This script builds and deploys Liquibase migrations to GKE

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="mkrew-478317"
REGION="europe-central2"
REGISTRY="${REGION}-docker.pkg.dev"
REPOSITORY="mkrew"
IMAGE_NAME="liquibase"
GKE_CLUSTER="mkrew-cluster"

echo -e "${GREEN}🚀 Liquibase Migration Deployment Script${NC}"
echo "==========================================="
echo ""

# Parse command line arguments
COMMAND=${1:-help}

function help() {
    echo "Usage: ./deploy-liquibase.sh [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  build         Build Liquibase Docker image"
    echo "  push          Build and push image to Artifact Registry"
    echo "  run           Run Liquibase migration job on GKE"
    echo "  deploy        Build, push, and run (full deployment)"
    echo "  status        Check migration job status"
    echo "  logs          View migration job logs"
    echo "  delete        Delete completed migration job"
    echo "  rollback N    Rollback N changesets (requires manual intervention)"
    echo "  help          Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./deploy-liquibase.sh deploy    # Full deployment"
    echo "  ./deploy-liquibase.sh status    # Check job status"
    echo "  ./deploy-liquibase.sh logs      # View logs"
}

function build_image() {
    echo -e "${YELLOW}📦 Building Liquibase Docker image...${NC}"

    docker build \
        -f Dockerfile.liquibase \
        -t ${IMAGE_NAME}:latest \
        .

    echo -e "${GREEN}✅ Image built successfully${NC}"
}

function push_image() {
    build_image

    echo -e "${YELLOW}🔐 Authenticating with Artifact Registry...${NC}"
    gcloud auth configure-docker ${REGISTRY}

    echo -e "${YELLOW}🏷️  Tagging image...${NC}"
    docker tag ${IMAGE_NAME}:latest \
        ${REGISTRY}/${PROJECT_ID}/${REPOSITORY}/${IMAGE_NAME}:latest

    echo -e "${YELLOW}⬆️  Pushing image to Artifact Registry...${NC}"
    docker push ${REGISTRY}/${PROJECT_ID}/${REPOSITORY}/${IMAGE_NAME}:latest

    echo -e "${GREEN}✅ Image pushed successfully${NC}"
}

function run_migration() {
    echo -e "${YELLOW}🔗 Getting GKE credentials...${NC}"
    gcloud container clusters get-credentials ${GKE_CLUSTER} --region=${REGION} --project=${PROJECT_ID}

    # Delete previous job if exists
    echo -e "${YELLOW}🗑️  Cleaning up previous job (if exists)...${NC}"
    kubectl delete job liquibase-migration --ignore-not-found=true

    # Wait a bit for cleanup
    sleep 5

    echo -e "${YELLOW}🚀 Deploying Liquibase migration job...${NC}"
    kubectl apply -f ../k8s/liquibase-job.yml

    echo -e "${GREEN}✅ Migration job deployed${NC}"
    echo ""
    echo "To check status: ./deploy-liquibase.sh status"
    echo "To view logs:    ./deploy-liquibase.sh logs"
}

function check_status() {
    echo -e "${YELLOW}📊 Checking migration job status...${NC}"
    kubectl get jobs liquibase-migration
    echo ""
    kubectl get pods -l app=mkrew-liquibase
}

function view_logs() {
    echo -e "${YELLOW}📜 Fetching migration job logs...${NC}"

    # Get the pod name
    POD_NAME=$(kubectl get pods -l app=mkrew-liquibase -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")

    if [ -z "$POD_NAME" ]; then
        echo -e "${RED}❌ No Liquibase pod found${NC}"
        exit 1
    fi

    echo "Pod: $POD_NAME"
    echo ""

    # Follow logs from liquibase container
    kubectl logs -f $POD_NAME -c liquibase
}

function delete_job() {
    echo -e "${YELLOW}🗑️  Deleting migration job...${NC}"
    kubectl delete job liquibase-migration --ignore-not-found=true
    echo -e "${GREEN}✅ Job deleted${NC}"
}

function rollback_info() {
    local COUNT=${1:-1}

    echo -e "${RED}⚠️  ROLLBACK REQUIRES MANUAL INTERVENTION${NC}"
    echo ""
    echo "To rollback $COUNT changeset(s), you need to:"
    echo ""
    echo "1. Connect to the database:"
    echo "   kubectl run -it --rm psql --image=postgres:16 --restart=Never -- \\"
    echo "     psql -h CLOUD_SQL_PROXY_HOST -U DB_USER -d mkrew"
    echo ""
    echo "2. Manually execute rollback SQL from changesets in reverse order"
    echo ""
    echo "3. Update databasechangelog table:"
    echo "   DELETE FROM databasechangelog WHERE orderexecuted IN ("
    echo "     SELECT orderexecuted FROM databasechangelog"
    echo "     ORDER BY orderexecuted DESC LIMIT $COUNT"
    echo "   );"
    echo ""
    echo "⚠️  WARNING: Rollbacks can be destructive. Always backup first!"
}

# Main command execution
case "$COMMAND" in
    build)
        build_image
        ;;
    push)
        push_image
        ;;
    run)
        run_migration
        ;;
    deploy)
        push_image
        run_migration
        ;;
    status)
        check_status
        ;;
    logs)
        view_logs
        ;;
    delete)
        delete_job
        ;;
    rollback)
        rollback_info $2
        ;;
    help|*)
        help
        ;;
esac

echo ""
echo -e "${GREEN}✨ Done!${NC}"