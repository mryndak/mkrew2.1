#!/bin/bash

# Build and push frontend Docker image to GCP Artifact Registry
# Usage: ./build-and-push.sh [tag]

set -e

# Configuration
PROJECT_ID="mkrew-478317"
REGION="europe-central2"
REPOSITORY="mkrew"
IMAGE_NAME="frontend"
TAG="${1:-latest}"

# Full image path
IMAGE_PATH="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/${IMAGE_NAME}:${TAG}"

echo "======================================"
echo "Building Frontend Docker Image"
echo "======================================"
echo "Project ID: ${PROJECT_ID}"
echo "Region: ${REGION}"
echo "Repository: ${REPOSITORY}"
echo "Image: ${IMAGE_NAME}"
echo "Tag: ${TAG}"
echo "Full path: ${IMAGE_PATH}"
echo "======================================"

# Step 1: Authenticate with Artifact Registry
echo ""
echo "[1/5] Authenticating with Artifact Registry..."
gcloud auth configure-docker ${REGION}-docker.pkg.dev

# Step 2: Build Docker image
echo ""
echo "[2/5] Building Docker image..."
docker build -t ${IMAGE_PATH} .

# Step 3: Push to Artifact Registry
echo ""
echo "[3/5] Pushing image to Artifact Registry..."
docker push ${IMAGE_PATH}

# Step 4: Verify image
echo ""
echo "[4/5] Verifying image in Artifact Registry..."
gcloud artifacts docker images list ${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY} \
  --filter="package=${IMAGE_NAME}" \
  --limit=5

# Step 5: Update Kubernetes deployment (optional)
echo ""
echo "[5/5] Image successfully pushed!"
echo ""
echo "To update Kubernetes deployment, run:"
echo "  kubectl rollout restart deployment/mkrew-frontend"
echo ""
echo "Or update with specific tag:"
echo "  kubectl set image deployment/mkrew-frontend frontend=${IMAGE_PATH}"
echo ""
