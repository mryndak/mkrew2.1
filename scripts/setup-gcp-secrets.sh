#!/bin/bash

# Setup GCP Secrets for mkrew application
# This script creates secrets in GCP Secret Manager if they don't exist

set -e

PROJECT_ID="mkrew-478317"
REGION="europe-central2"

echo "🔐 Setting up GCP Secrets for project: $PROJECT_ID"
echo ""

# Funkcja do tworzenia lub aktualizacji sekretu
create_or_update_secret() {
  local SECRET_NAME=$1
  local SECRET_VALUE=$2

  if gcloud secrets describe "$SECRET_NAME" --project="$PROJECT_ID" &>/dev/null; then
    echo "✓ Secret '$SECRET_NAME' already exists - updating..."
    echo -n "$SECRET_VALUE" | gcloud secrets versions add "$SECRET_NAME" \
      --project="$PROJECT_ID" \
      --data-file=-
  else
    echo "✓ Creating secret '$SECRET_NAME'..."
    echo -n "$SECRET_VALUE" | gcloud secrets create "$SECRET_NAME" \
      --project="$PROJECT_ID" \
      --replication-policy="automatic" \
      --data-file=-
  fi
}

# Funkcja do pobierania wartości z promptu
prompt_secret() {
  local PROMPT_TEXT=$1
  local DEFAULT_VALUE=$2
  local SECRET_VALUE

  if [ -n "$DEFAULT_VALUE" ]; then
    read -p "$PROMPT_TEXT [$DEFAULT_VALUE]: " SECRET_VALUE
    SECRET_VALUE=${SECRET_VALUE:-$DEFAULT_VALUE}
  else
    read -p "$PROMPT_TEXT: " SECRET_VALUE
  fi

  echo "$SECRET_VALUE"
}

echo "📝 Please provide the following secrets:"
echo ""

# 1. Database Username
DB_USERNAME=$(prompt_secret "Database Username" "mkrew_user")
create_or_update_secret "mkrew-db-username" "$DB_USERNAME"

# 2. Database Password
read -sp "Database Password: " DB_PASSWORD
echo ""
if [ -z "$DB_PASSWORD" ]; then
  echo "❌ Error: Database password cannot be empty"
  exit 1
fi
create_or_update_secret "mkrew-db-password" "$DB_PASSWORD"

# 3. Cloud SQL Connection Name
echo ""
echo "Cloud SQL Connection Name format: PROJECT_ID:REGION:INSTANCE_NAME"
CLOUD_SQL_CONNECTION=$(prompt_secret "Cloud SQL Connection Name" "$PROJECT_ID:$REGION:mkrew-db")
create_or_update_secret "mkrew-cloud-sql-connection" "$CLOUD_SQL_CONNECTION"

# 4. JWT Secret
echo ""
JWT_SECRET=$(prompt_secret "JWT Secret (min 256 bits)" "")
if [ -z "$JWT_SECRET" ]; then
  echo "⚠️  No JWT Secret provided. Generating random secret..."
  JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
fi
create_or_update_secret "mkrew-jwt-secret" "$JWT_SECRET"

# 5. MailerSend API Key (optional)
echo ""
MAILERSEND_API_KEY=$(prompt_secret "MailerSend API Key (optional, press Enter to skip)" "")
create_or_update_secret "mkrew-mailersend-api-key" "$MAILERSEND_API_KEY"

echo ""
echo "✅ All secrets have been created/updated successfully!"
echo ""
echo "📋 Next steps:"
echo "   1. Grant Secret Manager access to your Service Account:"
echo "      gcloud projects add-iam-policy-binding $PROJECT_ID \\"
echo "        --member='serviceAccount:mkrew-backend@$PROJECT_ID.iam.gserviceaccount.com' \\"
echo "        --role='roles/secretmanager.secretAccessor'"
echo ""
echo "   2. Apply RBAC configuration:"
echo "      kubectl apply -f k8s/rbac.yml"
echo ""
echo "   3. Apply ConfigMap:"
echo "      kubectl apply -f k8s/configmap.yml"
echo ""
echo "   4. Deploy the application:"
echo "      kubectl apply -f k8s/backend-deployment.yml"
echo "      kubectl apply -f k8s/backend-service.yml"
echo ""
