#!/bin/bash

# Skrypt pomocniczy do pobrania wartości sekretów GCP dla GitHub Actions
# Użycie: ./get-gcp-secrets.sh

set -e

echo "========================================="
echo "🔍 Pobieranie konfiguracji GCP"
echo "========================================="
echo ""

# Sprawdź czy gcloud jest zainstalowane
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI nie jest zainstalowane"
    echo "Zainstaluj: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Sprawdź czy użytkownik jest zalogowany
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" &> /dev/null; then
    echo "❌ Nie jesteś zalogowany do gcloud"
    echo "Uruchom: gcloud auth login"
    exit 1
fi

echo "✅ gcloud CLI jest zainstalowane i skonfigurowane"
echo ""

# GCP_PROJECT_ID
echo "📋 GCP_PROJECT_ID:"
PROJECT_ID=$(gcloud config get-value project 2>/dev/null)
if [ -z "$PROJECT_ID" ]; then
    echo "   ❌ Nie znaleziono projektu. Ustaw projekt: gcloud config set project PROJECT_ID"
else
    echo "   $PROJECT_ID"
fi
echo ""

# GCP_REGION
echo "📋 GCP_REGION:"
REGION=$(gcloud container clusters list --format="value(location)" --limit=1 2>/dev/null)
if [ -z "$REGION" ]; then
    echo "   ⚠️  Nie znaleziono klastra GKE"
    echo "   Sprawdź ręcznie: gcloud container clusters list"
else
    echo "   $REGION"
fi
echo ""

# GKE_CLUSTER
echo "📋 GKE_CLUSTER:"
CLUSTER=$(gcloud container clusters list --format="value(name)" --limit=1 2>/dev/null)
if [ -z "$CLUSTER" ]; then
    echo "   ⚠️  Nie znaleziono klastra GKE"
    echo "   Utwórz klaster lub sprawdź nazwę: gcloud container clusters list"
else
    echo "   $CLUSTER"
fi
echo ""

# ARTIFACT_REGISTRY
echo "📋 ARTIFACT_REGISTRY:"
REGISTRY=$(gcloud artifacts repositories list --format="value(name)" --limit=1 2>/dev/null)
if [ -z "$REGISTRY" ]; then
    echo "   ⚠️  Nie znaleziono Artifact Registry"
    echo "   Utwórz repozytorium lub sprawdź nazwę: gcloud artifacts repositories list"
else
    echo "   $REGISTRY"
fi
echo ""

# Workload Identity Pool
echo "📋 GCP_WORKLOAD_IDENTITY_PROVIDER:"
POOL_PROVIDER=$(gcloud iam workload-identity-pools providers describe "github-provider" \
  --location="global" \
  --workload-identity-pool="github-pool" \
  --format="value(name)" 2>/dev/null || echo "")

if [ -z "$POOL_PROVIDER" ]; then
    echo "   ⚠️  Nie znaleziono Workload Identity Provider"
    echo "   Musisz go utworzyć - sprawdź dokumentację w GCP_SECRETS_SETUP.md"
else
    echo "   $POOL_PROVIDER"
fi
echo ""

# Service Account
echo "📋 GCP_SERVICE_ACCOUNT:"
if [ -z "$PROJECT_ID" ]; then
    echo "   ❌ Najpierw ustaw PROJECT_ID"
else
    SA_EMAIL="github-actions@${PROJECT_ID}.iam.gserviceaccount.com"
    SA_EXISTS=$(gcloud iam service-accounts list --filter="email:$SA_EMAIL" --format="value(email)" 2>/dev/null)

    if [ -z "$SA_EXISTS" ]; then
        echo "   ⚠️  Service Account nie istnieje: $SA_EMAIL"
        echo "   Utwórz go używając instrukcji w GCP_SECRETS_SETUP.md"
    else
        echo "   $SA_EMAIL"
    fi
fi
echo ""

# Project Number (potrzebne do Workload Identity)
echo "📋 PROJECT_NUMBER (do konfiguracji Workload Identity):"
if [ -z "$PROJECT_ID" ]; then
    echo "   ❌ Najpierw ustaw PROJECT_ID"
else
    PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format="value(projectNumber)" 2>/dev/null)
    if [ -z "$PROJECT_NUMBER" ]; then
        echo "   ❌ Nie można pobrać numeru projektu"
    else
        echo "   $PROJECT_NUMBER"
    fi
fi
echo ""

echo "========================================="
echo "📝 Podsumowanie"
echo "========================================="
echo ""
echo "Skopiuj poniższe wartości do GitHub Secrets:"
echo "(Settings → Secrets and variables → Actions → New repository secret)"
echo ""
echo "GCP_PROJECT_ID=$PROJECT_ID"
echo "GCP_REGION=$REGION"
echo "GKE_CLUSTER=$CLUSTER"
echo "ARTIFACT_REGISTRY=$REGISTRY"
if [ -n "$POOL_PROVIDER" ]; then
    echo "GCP_WORKLOAD_IDENTITY_PROVIDER=$POOL_PROVIDER"
fi
if [ -n "$PROJECT_ID" ]; then
    echo "GCP_SERVICE_ACCOUNT=github-actions@${PROJECT_ID}.iam.gserviceaccount.com"
fi
echo ""

# Sprawdź czy wszystkie wymagane wartości są dostępne
MISSING=0
[ -z "$PROJECT_ID" ] && MISSING=$((MISSING + 1))
[ -z "$REGION" ] && MISSING=$((MISSING + 1))
[ -z "$CLUSTER" ] && MISSING=$((MISSING + 1))
[ -z "$REGISTRY" ] && MISSING=$((MISSING + 1))
[ -z "$POOL_PROVIDER" ] && MISSING=$((MISSING + 1))

if [ $MISSING -eq 0 ]; then
    echo "✅ Wszystkie wymagane wartości są dostępne!"
else
    echo "⚠️  Brakuje $MISSING wartości. Sprawdź dokumentację w .github/GCP_SECRETS_SETUP.md"
fi
echo ""
