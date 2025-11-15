# GCP Deployment - Quick Start Guide

## Wymagania Wstępne

- [ ] Konto Google Cloud Platform z włączoną płatnością
- [ ] Zainstalowane `gcloud` CLI
- [ ] Zainstalowane `kubectl`
- [ ] Zainstalowane `docker`
- [ ] Repository GitHub z dostępem do GitHub Actions
- [ ] Domena (mkrew.pl) z dostępem do DNS

## Setup Checklist

### 1. GCP Project Setup (15 min)

```bash
# Set variables
export PROJECT_ID="mkrew-project"
export REGION="europe-central2"
export ZONE="europe-central2-a"
export CLUSTER_NAME="mkrew-cluster"
export DB_INSTANCE="mkrew-db"

# Create and configure project
gcloud projects create $PROJECT_ID
gcloud config set project $PROJECT_ID
gcloud config set compute/region $REGION
gcloud config set compute/zone $ZONE

# Link billing account (replace BILLING_ACCOUNT_ID)
gcloud billing projects link $PROJECT_ID --billing-account=BILLING_ACCOUNT_ID
```

### 2. Enable APIs (5 min)

```bash
gcloud services enable \
  container.googleapis.com \
  sqladmin.googleapis.com \
  artifactregistry.googleapis.com \
  compute.googleapis.com \
  cloudresourcemanager.googleapis.com \
  iam.googleapis.com \
  secretmanager.googleapis.com \
  dns.googleapis.com
```

### 3. Artifact Registry (2 min)

```bash
gcloud artifacts repositories create mkrew \
  --repository-format=docker \
  --location=$REGION \
  --description="Docker repository for mkrew"
```

### 4. GKE Autopilot Cluster (5 min)

```bash
# Create Autopilot cluster (fully managed, pay-per-pod)
gcloud container clusters create-auto $CLUSTER_NAME \
  --region=$REGION \
  --project=$PROJECT_ID

# Get credentials (note: region, not zone)
gcloud container clusters get-credentials $CLUSTER_NAME --region=$REGION
```

**Why Autopilot?**
- ✅ Pay only for running pods (~60% cheaper)
- ✅ No node management needed
- ✅ Auto-scaling and auto-repair built-in
- ✅ Ideal for dev environments with low traffic
- ✅ Google manages infrastructure

**Autopilot Limitations:**
- ⚠️ No SSH to nodes (managed by Google)
- ⚠️ Some workload types not supported (DaemonSets, HostPath)
- ⚠️ Slightly slower pod startup (~10-30s)

For your use case (dev, low traffic, cost-sensitive) → Perfect fit!

### 5. Cloud SQL (8 min)

```bash
# Create instance
gcloud sql instances create $DB_INSTANCE \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=$REGION \
  --backup \
  --backup-start-time=02:00

# Create database
gcloud sql databases create mkrew --instance=$DB_INSTANCE

# Create user (save password securely!)
gcloud sql users create mkrew-user \
  --instance=$DB_INSTANCE \
  --password=$(openssl rand -base64 32)

# Get connection name
export CLOUD_SQL_CONNECTION=$(gcloud sql instances describe $DB_INSTANCE \
  --format='value(connectionName)')
echo "Cloud SQL Connection: $CLOUD_SQL_CONNECTION"
```

### 6. Service Accounts & IAM (10 min)

```bash
# GitHub Actions Service Account
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/container.developer"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

# Backend Service Account (for Cloud SQL)
gcloud iam service-accounts create mkrew-backend \
  --display-name="mkrew Backend"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:mkrew-backend@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"

# Kubernetes Service Account
kubectl create serviceaccount mkrew-backend-sa --namespace=default

gcloud iam service-accounts add-iam-policy-binding \
  mkrew-backend@$PROJECT_ID.iam.gserviceaccount.com \
  --role="roles/iam.workloadIdentityUser" \
  --member="serviceAccount:$PROJECT_ID.svc.id.goog[default/mkrew-backend-sa]"

kubectl annotate serviceaccount mkrew-backend-sa \
  --namespace=default \
  iam.gke.io/gcp-service-account=mkrew-backend@$PROJECT_ID.iam.gserviceaccount.com
```

### 7. Workload Identity Federation (10 min)

```bash
# Get project number
export PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')

# Create Workload Identity Pool
gcloud iam workload-identity-pools create github \
  --location=global \
  --display-name="GitHub Actions Pool"

# Create Provider
gcloud iam workload-identity-pools providers create-oidc github \
  --location=global \
  --workload-identity-pool=github \
  --display-name="GitHub Provider" \
  --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" \
  --issuer-uri="https://token.actions.githubusercontent.com"

# Bind Service Account to GitHub Repo (replace with your repo)
gcloud iam service-accounts add-iam-policy-binding \
  github-actions@$PROJECT_ID.iam.gserviceaccount.com \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/github/attribute.repository/mryndak/mkrew2.1"

# Get Workload Identity Provider
export WIP="projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/github/providers/github"
echo "Workload Identity Provider: $WIP"
```

### 8. Static IP & DNS (5 min)

```bash
# Reserve static IP
gcloud compute addresses create mkrew-ip --global

# Get IP address
export STATIC_IP=$(gcloud compute addresses describe mkrew-ip \
  --global --format='value(address)')
echo "Static IP: $STATIC_IP"

# Configure DNS A records:
# mkrew.pl -> $STATIC_IP
# www.mkrew.pl -> $STATIC_IP
# api.mkrew.pl -> $STATIC_IP
```

### 9. GitHub Secrets (5 min)

W GitHub repository settings > Secrets and variables > Actions, dodaj:

```
GCP_PROJECT_ID = "mkrew-project"
GCP_REGION = "europe-central2"
GCP_WORKLOAD_IDENTITY_PROVIDER = "projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github/providers/github"
GCP_SERVICE_ACCOUNT = "github-actions@mkrew-project.iam.gserviceaccount.com"
GKE_CLUSTER = "mkrew-cluster"
ARTIFACT_REGISTRY = "mkrew"
```

**Note:** No `GKE_ZONE` needed for Autopilot - it uses regional clusters (`GCP_REGION`).

### 10. Deploy Kubernetes Resources (10 min)

```bash
# Update manifest placeholders
cd .ai/k8s

# Backend deployment
sed -i "s/PROJECT_ID/$PROJECT_ID/g" backend-deployment.yml
sed -i "s/REGION/$REGION/g" backend-deployment.yml

# Frontend deployment
sed -i "s/PROJECT_ID/$PROJECT_ID/g" frontend-deployment.yml
sed -i "s/REGION/$REGION/g" frontend-deployment.yml

# Apply ConfigMap
kubectl apply -f configmap.yml

# Create Secrets
kubectl create secret generic mkrew-secrets \
  --from-literal=DB_USERNAME=mkrew-user \
  --from-literal=DB_PASSWORD="YOUR_SECURE_PASSWORD" \
  --from-literal=PUBLIC_API_BASE_URL=https://api.mkrew.pl/api/v1 \
  --from-literal=PUBLIC_SITE_URL=https://mkrew.pl \
  --from-literal=PUBLIC_RECAPTCHA_SITE_KEY="" \
  --from-literal=PUBLIC_GA_TRACKING_ID="" \
  --from-literal=PUBLIC_SENTRY_DSN="" \
  --from-literal=PUBLIC_SENTRY_ENVIRONMENT=production \
  --from-literal=CLOUD_SQL_CONNECTION_NAME="$CLOUD_SQL_CONNECTION"

# Apply Services
kubectl apply -f backend-service.yml
kubectl apply -f frontend-service.yml

# Apply Deployments (will fail initially - no images yet)
kubectl apply -f backend-deployment.yml
kubectl apply -f frontend-deployment.yml

# Apply Ingress
kubectl apply -f ingress.yml
```

### 11. First Deployment (5 min)

```bash
# Push to main branch to trigger GitHub Actions
git add .
git commit -m "feat: Add GCP deployment configuration"
git push origin main

# Watch deployment
watch -n 2 'kubectl get pods'

# Check rollout status
kubectl rollout status deployment/mkrew-backend
kubectl rollout status deployment/mkrew-frontend
```

### 12. Verify Deployment (3 min)

```bash
# Check pods
kubectl get pods

# Check services
kubectl get services

# Check ingress (wait for IP assignment, can take 10-15 min)
kubectl get ingress mkrew-ingress

# Check managed certificate (wait for provisioning)
kubectl describe managedcertificate mkrew-cert

# Test backend health
kubectl port-forward service/mkrew-backend 8080:8080
curl http://localhost:8080/actuator/health

# Test frontend
kubectl port-forward service/mkrew-frontend 4321:80
curl http://localhost:4321
```

## Estimated Total Time: ~90 minutes

## Post-Deployment Checklist

- [ ] DNS records propagated (check with `dig mkrew.pl`)
- [ ] SSL certificates issued (check in GCP Console)
- [ ] Application accessible via HTTPS
- [ ] Backend API responding
- [ ] Database connection working
- [ ] GitHub Actions pipeline successful
- [ ] Monitoring and logging configured
- [ ] Backup strategy verified

## Quick Commands Reference

```bash
# View logs
kubectl logs -l app=mkrew-backend --tail=100 -f
kubectl logs -l app=mkrew-frontend --tail=100 -f

# Restart deployment
kubectl rollout restart deployment/mkrew-backend
kubectl rollout restart deployment/mkrew-frontend

# Scale deployment
kubectl scale deployment/mkrew-backend --replicas=3

# Execute into pod
kubectl exec -it <pod-name> -- /bin/sh

# Check resource usage
kubectl top pods
kubectl top nodes

# View events
kubectl get events --sort-by='.lastTimestamp'

# Cloud SQL connection test
gcloud sql connect $DB_INSTANCE --user=mkrew-user --database=mkrew
```

## Rollback

```bash
# Rollback to previous version
kubectl rollout undo deployment/mkrew-backend
kubectl rollout undo deployment/mkrew-frontend

# Rollback to specific revision
kubectl rollout history deployment/mkrew-backend
kubectl rollout undo deployment/mkrew-backend --to-revision=2
```

## Cleanup (Development)

```bash
# Delete GKE Autopilot cluster
gcloud container clusters delete $CLUSTER_NAME --region=$REGION --quiet

# Delete Cloud SQL
gcloud sql instances delete $DB_INSTANCE --quiet

# Delete static IP
gcloud compute addresses delete mkrew-ip --global --quiet

# Delete Artifact Registry
gcloud artifacts repositories delete mkrew --location=$REGION --quiet

# Delete service accounts
gcloud iam service-accounts delete github-actions@$PROJECT_ID.iam.gserviceaccount.com --quiet
gcloud iam service-accounts delete mkrew-backend@$PROJECT_ID.iam.gserviceaccount.com --quiet
```

## Support

- Full documentation: `.ai/gcp-cd-deployment-plan.md`
- GCP Documentation: https://cloud.google.com/docs
- Kubernetes Documentation: https://kubernetes.io/docs/
- GKE Documentation: https://cloud.google.com/kubernetes-engine/docs

## Troubleshooting

### Pod CrashLoopBackOff
```bash
kubectl describe pod <pod-name>
kubectl logs <pod-name> --previous
```

### Cloud SQL Connection Failed
```bash
kubectl logs <pod-name> -c cloud-sql-proxy
# Verify CLOUD_SQL_CONNECTION_NAME in secret
kubectl get secret mkrew-secrets -o yaml
```

### Ingress Not Working
```bash
kubectl describe ingress mkrew-ingress
# Wait 10-15 minutes for provisioning
# Check ManagedCertificate status
kubectl describe managedcertificate mkrew-cert
```

### Image Pull Failed
```bash
# Verify Artifact Registry permissions
gcloud artifacts repositories get-iam-policy mkrew --location=$REGION
# Add docker-registry secret if needed
kubectl create secret docker-registry gcr-json-key \
  --docker-server=$REGION-docker.pkg.dev \
  --docker-username=_json_key \
  --docker-password="$(cat key.json)"
```
