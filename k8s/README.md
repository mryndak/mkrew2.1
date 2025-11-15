# Kubernetes Manifests - mkrew

> Kubernetes configuration files dla deployment na GKE Autopilot

[![Kubernetes](https://img.shields.io/badge/Kubernetes-1.28+-blue.svg)](https://kubernetes.io/)
[![GKE](https://img.shields.io/badge/GKE-Autopilot-green.svg)](https://cloud.google.com/kubernetes-engine/docs/concepts/autopilot-overview)

## 📋 Spis treści

- [Przegląd](#-przegląd)
- [Pliki](#-pliki)
- [Deployment](#-deployment)
- [Konfiguracja](#-konfiguracja)
- [Troubleshooting](#-troubleshooting)

## 🎯 Przegląd

Ten katalog zawiera manifesty Kubernetes dla deployment aplikacji mkrew na **GKE Autopilot**. Architektura obejmuje:

- **Backend** (Spring Boot) z Cloud SQL Proxy jako sidecar
- **Frontend** (Astro SSR/SSG)
- **Ingress** z Google-managed SSL certificates
- **ConfigMaps** dla konfiguracji non-sensitive
- **Secrets** dla danych wrażliwych (DB credentials, API keys)

## 📁 Pliki

### Deployments

#### `backend-deployment.yml`
- **Backend container**: Spring Boot application (Java 21)
- **Cloud SQL Proxy sidecar**: Bezpieczne połączenie z Cloud SQL
- **Resources**: 512Mi-1Gi RAM, 250m-500m CPU
- **Health checks**: Liveness + Readiness probes (`/actuator/health`)
- **Service Account**: `mkrew-backend-sa` (Workload Identity)

**Kluczowe funkcje:**
- Cloud SQL connection via sidecar proxy
- Automatic pod restart on failure
- Zero-downtime rolling updates

#### `frontend-deployment.yml`
- **Frontend container**: Astro SSR/SSG (Node 20)
- **Resources**: 128Mi-256Mi RAM, 100m-200m CPU
- **Health checks**: HTTP probes na port 4321
- **Environment**: Production build z optimized assets

**Kluczowe funkcje:**
- SSR/SSG hybrid rendering
- Static asset serving
- API proxy to backend

### Services

#### `backend-service.yml`
- **Type**: ClusterIP (internal only)
- **Port**: 8080
- **Target**: Backend pods
- **Used by**: Frontend + Ingress

#### `frontend-service.yml`
- **Type**: ClusterIP (internal only)
- **Port**: 80 → 4321
- **Target**: Frontend pods
- **Used by**: Ingress

### Configuration

#### `configmap.yml`
Non-sensitive environment variables:
- `SPRING_PROFILES_ACTIVE`: production
- `SERVER_PORT`: 8080
- `DB_HOST`: 127.0.0.1 (via Cloud SQL Proxy)
- `DB_PORT`: 5432
- `DB_NAME`: mkrew

#### Secrets Management (GCP Secret Manager + Init Container)

**Sekrety są automatycznie zarządzane przez:**
1. **GCP Secret Manager** - przechowuje wrażliwe dane
2. **Init Container** - pobiera sekrety przed startem aplikacji
3. **Kubernetes Secret** - tworzone dynamicznie przy każdym deployment

**Automatycznie zarządzane sekrety:**
- `DB_USERNAME`: Cloud SQL user
- `DB_PASSWORD`: Cloud SQL password
- `CLOUD_SQL_CONNECTION_NAME`: Instance connection string
- `JWT_SECRET`: Klucz do podpisywania JWT tokens
- `SENDGRID_API_KEY`: SendGrid API key (opcjonalny)

**Setup:**
```bash
# Użyj skryptu do utworzenia sekretów w GCP Secret Manager
chmod +x ../scripts/setup-gcp-secrets.sh
../scripts/setup-gcp-secrets.sh
```

**RBAC dla init container:**
- ServiceAccount: `mkrew-backend-sa`
- Role: `secret-manager` (do tworzenia Kubernetes Secrets)
- Workload Identity: połączony z GCP Service Account

### Networking

#### `ingress.yml`
- **Type**: GKE Ingress (Google Cloud Load Balancer)
- **SSL**: Google-managed certificates (auto-renewal)
- **Domains**: mkrew.pl, www.mkrew.pl, api.mkrew.pl
- **Backend Config**: Cloud CDN, Session Affinity, Health Checks
- **Path routing**:
  - `/` → Frontend service
  - `/api/*` → Backend service

**Features:**
- HTTPS-only (HTTP redirects to HTTPS)
- Global load balancing
- Cloud CDN for static assets
- Session affinity for stateful connections

## 🚀 Deployment

### Prerequisites

1. **GKE Autopilot cluster** running
2. **Cloud SQL instance** created
3. **kubectl** configured with cluster credentials
4. **Service Account** `mkrew-backend-sa` created with Workload Identity

### Quick Deploy

```bash
# 1. Setup GCP Secrets in Secret Manager
cd scripts/
chmod +x setup-gcp-secrets.sh
./setup-gcp-secrets.sh
cd ../k8s/

# 2. Grant permissions to Service Account
export PROJECT_ID="mkrew-478317"
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:mkrew-backend@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:mkrew-backend@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"

# 3. Setup Workload Identity
gcloud iam service-accounts add-iam-policy-binding \
  mkrew-backend@$PROJECT_ID.iam.gserviceaccount.com \
  --role roles/iam.workloadIdentityUser \
  --member "serviceAccount:$PROJECT_ID.svc.id.goog[default/mkrew-backend-sa]"

# 4. Apply RBAC (for init container)
kubectl apply -f rbac.yml

# 5. Create ConfigMap
kubectl apply -f configmap.yml

# 6. Deploy backend (init container will create secrets automatically)
kubectl apply -f backend-deployment.yml
kubectl apply -f backend-service.yml

# 7. Deploy frontend
kubectl apply -f frontend-deployment.yml
kubectl apply -f frontend-service.yml

# 8. Reserve static IP (one-time)
gcloud compute addresses create mkrew-ip --global

# 9. Deploy Ingress
kubectl apply -f ingress.yml

# 10. Verify deployment
kubectl get pods
kubectl logs -f deployment/mkrew-backend -c secret-init  # Check init container
kubectl logs -f deployment/mkrew-backend -c backend       # Check application
kubectl get services
kubectl get ingress
```

### Verify SSL Certificate

```bash
# Check ManagedCertificate status
kubectl describe managedcertificate mkrew-cert

# Wait for status: Active (może potrwać 10-15 minut)
```

## ⚙️ Konfiguracja

### Skalowanie

**GKE Autopilot automatycznie skaluje** bazując na resource requests. Aby zwiększyć liczbę replik:

```bash
# Backend
kubectl scale deployment mkrew-backend --replicas=3

# Frontend
kubectl scale deployment mkrew-frontend --replicas=2
```

**HorizontalPodAutoscaler** (opcjonalnie):
```bash
# Auto-scale backend based on CPU
kubectl autoscale deployment mkrew-backend --cpu-percent=70 --min=1 --max=5

# Auto-scale frontend based on CPU
kubectl autoscale deployment mkrew-frontend --cpu-percent=60 --min=1 --max=3
```

### Resource Limits

Domyślne limity są konserwatywne. Dostosuj w deployment files:

**Backend:**
- Requests: 512Mi RAM, 250m CPU
- Limits: 1Gi RAM, 500m CPU

**Frontend:**
- Requests: 128Mi RAM, 100m CPU
- Limits: 256Mi RAM, 200m CPU

**Cloud SQL Proxy:**
- Requests: 64Mi RAM, 50m CPU
- Limits: 128Mi RAM, 100m CPU

### Environment Variables

Dodawanie nowych zmiennych:

**Non-sensitive (ConfigMap):**
```bash
kubectl edit configmap mkrew-config
```

**Sensitive (Secrets):**
```bash
kubectl create secret generic mkrew-secrets \
  --from-literal=NEW_SECRET=value \
  --dry-run=client -o yaml | kubectl apply -f -
```

## 🔍 Monitoring

### Logi

```bash
# Backend logs
kubectl logs -f deployment/mkrew-backend -c backend

# Cloud SQL Proxy logs
kubectl logs -f deployment/mkrew-backend -c cloud-sql-proxy

# Frontend logs
kubectl logs -f deployment/mkrew-frontend

# All pods
kubectl logs -l app=mkrew-backend --tail=100
```

### Status

```bash
# Pods status
kubectl get pods -o wide

# Deployment status
kubectl rollout status deployment/mkrew-backend
kubectl rollout status deployment/mkrew-frontend

# Ingress status
kubectl describe ingress mkrew-ingress

# Events
kubectl get events --sort-by='.lastTimestamp'
```

### Health Checks

```bash
# Port-forward to test locally
kubectl port-forward svc/mkrew-backend 8080:8080

# Test backend health
curl http://localhost:8080/actuator/health

# Test frontend
kubectl port-forward svc/mkrew-frontend 4321:80
curl http://localhost:4321
```

## 🔄 Updates & Rollbacks

### Rolling Update

```bash
# Update backend image
kubectl set image deployment/mkrew-backend \
  backend=europe-central2-docker.pkg.dev/PROJECT_ID/mkrew/backend:v2.0.0

# Update frontend image
kubectl set image deployment/mkrew-frontend \
  frontend=europe-central2-docker.pkg.dev/PROJECT_ID/mkrew/frontend:v2.0.0

# Monitor rollout
kubectl rollout status deployment/mkrew-backend
```

### Rollback

```bash
# Rollback to previous version
kubectl rollout undo deployment/mkrew-backend

# Rollback to specific revision
kubectl rollout history deployment/mkrew-backend
kubectl rollout undo deployment/mkrew-backend --to-revision=2
```

## 🔧 Troubleshooting

### Pod nie startuje

```bash
# Check pod status
kubectl describe pod <pod-name>

# Check logs
kubectl logs <pod-name>

# Check events
kubectl get events --field-selector involvedObject.name=<pod-name>
```

**Częste problemy:**
- Image pull errors: Sprawdź Artifact Registry permissions
- CrashLoopBackOff: Sprawdź logi aplikacji
- Pending: Sprawdź resource requests (GKE Autopilot może ograniczać)

### Init container nie może pobrać sekretów

```bash
# Check init container logs
kubectl logs <backend-pod> -c secret-init

# Verify GCP Secret Manager permissions
gcloud projects get-iam-policy mkrew-478317 \
  --flatten="bindings[].members" \
  --filter="bindings.members:mkrew-backend@mkrew-478317.iam.gserviceaccount.com"
```

**Fix:**
```bash
# Grant Secret Manager access
gcloud projects add-iam-policy-binding mkrew-478317 \
  --member="serviceAccount:mkrew-backend@mkrew-478317.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# Verify secrets exist in Secret Manager
gcloud secrets list --project=mkrew-478317
```

### Init container nie może utworzyć Kubernetes Secret

```bash
# Check RBAC
kubectl get role secret-manager
kubectl get rolebinding mkrew-backend-secret-manager
kubectl describe pod <backend-pod>
```

**Fix:**
```bash
# Apply RBAC
kubectl apply -f rbac.yml

# Delete pod to retry (deployment will recreate it)
kubectl delete pod <backend-pod>
```

### Brak połączenia z Cloud SQL

```bash
# Check Cloud SQL Proxy logs
kubectl logs <backend-pod> -c cloud-sql-proxy

# Verify Kubernetes Secret
kubectl get secret mkrew-secrets
kubectl get secret mkrew-secrets -o jsonpath='{.data.CLOUD_SQL_CONNECTION_NAME}' | base64 -d

# Check Workload Identity
kubectl describe serviceaccount mkrew-backend-sa
```

**Fix:**
- Verify `CLOUD_SQL_CONNECTION_NAME` in GCP Secret Manager
- Check Workload Identity binding
- Verify Cloud SQL instance is running
- Grant Cloud SQL Client role:
```bash
gcloud projects add-iam-policy-binding mkrew-478317 \
  --member="serviceAccount:mkrew-backend@mkrew-478317.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"
```

### Ingress nie działa

```bash
# Check ingress status
kubectl describe ingress mkrew-ingress

# Check ManagedCertificate
kubectl describe managedcertificate mkrew-cert

# Check backend config
kubectl describe backendconfig mkrew-backend-config
```

**Częste problemy:**
- Certificate provisioning: Czeka 10-15 minut, verify DNS
- Static IP: Sprawdź czy został zarezerwowany
- 502/503 errors: Sprawdź backend health checks

### DNS nie działa

**Verify DNS records:**
```bash
# Check A record
nslookup mkrew.pl

# Check CNAME
nslookup www.mkrew.pl
nslookup api.mkrew.pl
```

**Should point to:**
- Static IP reserved w GCP
- Or Load Balancer IP (z `kubectl get ingress`)

## 📚 Dodatkowe zasoby

- [GKE Autopilot Docs](https://cloud.google.com/kubernetes-engine/docs/concepts/autopilot-overview)
- [Workload Identity](https://cloud.google.com/kubernetes-engine/docs/how-to/workload-identity)
- [Cloud SQL Proxy](https://cloud.google.com/sql/docs/postgres/connect-kubernetes-engine)
- [GKE Ingress](https://cloud.google.com/kubernetes-engine/docs/concepts/ingress)
- [Deployment Guide](./../.ai/gcp-cd-deployment-plan.md)

## 📄 License

Proprietary - mkrew Project

---

**Deployed with ☸️ Kubernetes + ☁️ GCP**
