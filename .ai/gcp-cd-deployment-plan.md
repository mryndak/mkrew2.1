# GCP Continuous Deployment - Plan Wdrożenia

## 1. Przegląd Architektury

### 1.1 Komponenty Aplikacji
- **Frontend**: Astro + TypeScript (SSR/SSG)
- **Backend**: Spring Boot + Java 21
- **Database**: PostgreSQL (Cloud SQL)
- **Platform**: Google Cloud Platform (GCP)
- **Orchestrator**: Google Kubernetes Engine (GKE)

### 1.2 Architektura Deployment

```
┌─────────────────────────────────────────────────────────────┐
│                    Cloud Load Balancer                      │
│                   (SSL/TLS Termination)                     │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
┌──────────────┐          ┌──────────────┐
│   Frontend   │          │   Backend    │
│  (Astro SSR) │          │(Spring Boot) │
│   GKE Pods   │          │   GKE Pods   │
│   Replicas:1 │          │   Replicas:1 │
└──────────────┘          └───────┬──────┘
                                  │
                          ┌───────┴──────────┐
                          │  Cloud SQL Proxy │
                          │    (Sidecar)     │
                          └───────┬──────────┘
                                  │
                          ┌───────▼──────────┐
                          │   Cloud SQL for  │
                          │   PostgreSQL     │
                          │  (Managed DB)    │
                          └──────────────────┘
```

## 2. Infrastruktura GCP

### 2.1 Wymagane Usługi

#### Compute & Orchestration
- **GKE Autopilot**: Fully managed Kubernetes (pay-per-pod)
  - No node management required
  - Auto-scaling and auto-repair built-in
  - Automatic resource optimization
  - Regional deployment (high availability)
  - Google manages infrastructure

#### Database
- **Cloud SQL for PostgreSQL**:
  - Instance type: db-f1-micro (development) / db-n1-standard-1 (production)
  - High Availability: enabled (production)
  - Automated backups: daily
  - Point-in-time recovery: enabled

#### Storage & Registry
- **Artifact Registry**: Docker image repository
  - Repository: `mkrew`
  - Format: Docker
  - Location: europe-central2 (Warsaw)

#### Networking
- **VPC**: Custom VPC network
- **Cloud Load Balancer**: Global HTTPS Load Balancer
- **Cloud DNS**: DNS zone for mkrew.pl
- **Static IP**: Reserved external IP address

#### Security
- **Secret Manager**: Sensitive credentials storage
- **Cloud IAM**: Service accounts and permissions
- **Workload Identity**: GKE to GCP services authentication

#### Monitoring
- **Cloud Logging**: Centralized logging
- **Cloud Monitoring**: Metrics and alerts
- **Cloud Trace**: Distributed tracing

## 3. CI/CD Pipeline

### 3.1 GitHub Actions Workflow

Pipeline składa się z 3 głównych jobów:

1. **build-and-push-backend**
   - Budowanie obrazu Docker dla backendu
   - Push do Artifact Registry
   - Tagging: `latest` + `<git-sha>`

2. **build-and-push-frontend**
   - Budowanie obrazu Docker dla frontendu
   - Push do Artifact Registry
   - Tagging: `latest` + `<git-sha>`

3. **deploy-to-gke**
   - Aktualizacja deploymentów w GKE
   - Rolling update z zero-downtime
   - Weryfikacja statusu wdrożenia

### 3.2 Wyzwalacze Deployment

- **Automatyczny**: Push do brancha `main` (production)
- **Automatyczny**: Push do brancha `staging` (staging)
- **Manualny**: Workflow dispatch z wyborem środowiska

### 3.3 Wymagane GitHub Secrets

```yaml
# GCP Configuration
GCP_PROJECT_ID: "mkrew-project"
GCP_REGION: "europe-central2"
GCP_WORKLOAD_IDENTITY_PROVIDER: "projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github/providers/github"
GCP_SERVICE_ACCOUNT: "github-actions@mkrew-project.iam.gserviceaccount.com"

# GKE Configuration (Autopilot uses regional deployment)
GKE_CLUSTER: "mkrew-cluster"
GKE_REGION: "europe-central2"
ARTIFACT_REGISTRY: "mkrew"
```

## 4. Konfiguracja Kubernetes

### 4.1 Manifesty

Pliki konfiguracyjne znajdują się w `.ai/k8s/`:

- **configmap.yml**: Zmienne środowiskowe (non-sensitive)
- **secrets.yml.template**: Template dla sekretów (sensitive)
- **backend-deployment.yml**: Deployment backendu + Cloud SQL Proxy
- **backend-service.yml**: ClusterIP service dla backendu
- **frontend-deployment.yml**: Deployment frontendu
- **frontend-service.yml**: ClusterIP service dla frontendu
- **ingress.yml**: Ingress + ManagedCertificate + BackendConfig

### 4.2 Cloud SQL Connection

Backend łączy się z Cloud SQL przez **Cloud SQL Proxy** jako sidecar container:

```yaml
containers:
- name: cloud-sql-proxy
  image: gcr.io/cloud-sql-connectors/cloud-sql-proxy:2.14.3
  args:
    - "--structured-logs"
    - "--port=5432"
    - "$(CLOUD_SQL_CONNECTION_NAME)"
```

### 4.3 Ingress & SSL

- **ManagedCertificate**: Automatyczne zarządzanie certyfikatami SSL
- **BackendConfig**: Cloud CDN, health checks, session affinity
- **Domains**: mkrew.pl, www.mkrew.pl, api.mkrew.pl

## 5. Deployment Process

### 5.1 Initial Setup (One-time)

#### Krok 1: Utworzenie GCP Projektu
```bash
export PROJECT_ID="mkrew-project"
export REGION="europe-central2"
# Uwaga: ZONE nie jest potrzebne dla GKE Autopilot (używa regional deployment)

gcloud projects create $PROJECT_ID
gcloud config set project $PROJECT_ID
```

#### Krok 2: Włączenie API
```bash
gcloud services enable \
  container.googleapis.com \
  sqladmin.googleapis.com \
  artifactregistry.googleapis.com \
  compute.googleapis.com \
  cloudresourcemanager.googleapis.com \
  iam.googleapis.com \
  secretmanager.googleapis.com
```

#### Krok 3: Utworzenie Artifact Registry
```bash
gcloud artifacts repositories create mkrew \
  --repository-format=docker \
  --location=$REGION \
  --description="Docker repository for mkrew application"
```

#### Krok 4: Utworzenie GKE Autopilot Cluster
```bash
# GKE Autopilot - fully managed, pay-per-pod
# Workload Identity jest włączone domyślnie w Autopilot
gcloud container clusters create-auto mkrew-cluster \
  --region=$REGION
```

**Uwagi dotyczące GKE Autopilot:**
- Autopilot automatycznie zarządza węzłami (brak parametrów --num-nodes, --machine-type)
- Wymaga regional deployment (--region zamiast --zone)
- **Workload Identity jest włączone domyślnie** (nie potrzeba --workload-pool)
- Skaluje bazując na resource requests w podach
- Auto-repair i auto-upgrade są wbudowane
- Płacisz tylko za rzeczywiste użycie zasobów przez pody

**Weryfikacja Workload Identity:**
```bash
# Po utworzeniu klastra sprawdź, czy Workload Identity jest włączone
gcloud container clusters describe mkrew-cluster \
  --region=$REGION \
  --format="value(workloadIdentityConfig.workloadPool)"
# Powinno zwrócić: mkrew-project.svc.id.goog
```

#### Krok 5: Utworzenie Cloud SQL Instance
```bash
# PostgreSQL 16 z automatycznymi backupami i point-in-time recovery
# Edycja ENTERPRISE pozwala na użycie tanich tierów shared-core (db-f1-micro)
gcloud sql instances create mkrew-db \
  --database-version=POSTGRES_16 \
  --edition=ENTERPRISE \
  --tier=db-f1-micro \
  --region=$REGION \
  --backup \
  --backup-start-time=02:00 \
  --maintenance-window-day=SUN \
  --maintenance-window-hour=03
```

**Uwagi:**
- **Edycja ENTERPRISE** (zamiast ENTERPRISE_PLUS) pozwala na użycie shared-core instances
- `db-f1-micro`: 0.6 GB RAM, shared CPU - najtańsza opcja dla development (~$7-9/miesiąc)
- PostgreSQL używa Write-Ahead Logging (WAL) - włączone automatycznie
- WAL umożliwia automatyczne backupy i point-in-time recovery

**Alternatywne tiery dla produkcji:**
```bash
# Opcja 2: Custom machine (więcej RAM, dedykowany CPU)
--edition=ENTERPRISE --tier=db-custom-1-3840  # 1 vCPU, 3.75GB RAM (~$35/miesiąc)

# Opcja 3: Enterprise Plus z performance-optimized tier
--edition=ENTERPRISE_PLUS --tier=db-perf-optimized-N-2  # High performance (~$150+/miesiąc)
```

#### Krok 6: Utworzenie Database
```bash
gcloud sql databases create mkrew \
  --instance=mkrew-db
```

#### Krok 7: Utworzenie Database User
```bash
gcloud sql users create mkrew-user \
  --instance=mkrew-db \
  --password=SECURE_PASSWORD
```

#### Krok 8: Workload Identity Setup
```bash
# Create service account for GitHub Actions
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions Service Account"

# Grant necessary roles
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/container.developer"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:github-actions@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

# Create Workload Identity Pool for GitHub
gcloud iam workload-identity-pools create github \
  --location=global \
  --display-name="GitHub Actions Pool"

# Create Workload Identity Provider
# Ograniczamy dostęp tylko do repozytorium mryndak/mkrew2.1
gcloud iam workload-identity-pools providers create-oidc github \
  --location=global \
  --workload-identity-pool=github \
  --display-name="GitHub Provider" \
  --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" \
  --attribute-condition="assertion.repository=='mryndak/mkrew2.1'" \
  --issuer-uri="https://token.actions.githubusercontent.com"

# Allow GitHub to authenticate as service account
gcloud iam service-accounts add-iam-policy-binding \
  github-actions@$PROJECT_ID.iam.gserviceaccount.com \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github/attribute.repository/mryndak/mkrew2.1"
```

#### Krok 9: Kubernetes Service Account Setup
```bash
# Get GKE credentials (Autopilot uses regional deployment)
gcloud container clusters get-credentials mkrew-cluster --region=$REGION

# Create Kubernetes service account
kubectl create serviceaccount mkrew-backend-sa --namespace=default

# Bind to GCP service account for Cloud SQL access
gcloud iam service-accounts create mkrew-backend \
  --display-name="mkrew Backend Service Account"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:mkrew-backend@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"

gcloud iam service-accounts add-iam-policy-binding \
  mkrew-backend@$PROJECT_ID.iam.gserviceaccount.com \
  --role="roles/iam.workloadIdentityUser" \
  --member="serviceAccount:$PROJECT_ID.svc.id.goog[default/mkrew-backend-sa]"

kubectl annotate serviceaccount mkrew-backend-sa \
  --namespace=default \
  iam.gke.io/gcp-service-account=mkrew-backend@$PROJECT_ID.iam.gserviceaccount.com
```

#### Krok 10: Deploy Kubernetes Resources
```bash
# Update placeholders in manifests
export CLOUD_SQL_CONNECTION=$(gcloud sql instances describe mkrew-db --format='value(connectionName)')

# Create ConfigMap
kubectl apply -f .ai/k8s/configmap.yml

# Create Secrets (use Secret Manager in production)
kubectl create secret generic mkrew-secrets \
  --from-literal=DB_USERNAME=mkrew-user \
  --from-literal=DB_PASSWORD=SECURE_PASSWORD \
  --from-literal=PUBLIC_API_BASE_URL=https://api.mkrew.pl/api/v1 \
  --from-literal=PUBLIC_SITE_URL=https://mkrew.pl \
  --from-literal=PUBLIC_RECAPTCHA_SITE_KEY=YOUR_KEY \
  --from-literal=PUBLIC_GA_TRACKING_ID=YOUR_ID \
  --from-literal=PUBLIC_SENTRY_DSN=YOUR_DSN \
  --from-literal=PUBLIC_SENTRY_ENVIRONMENT=production \
  --from-literal=CLOUD_SQL_CONNECTION_NAME=$CLOUD_SQL_CONNECTION

# Update image paths in deployments
sed -i "s/PROJECT_ID/$PROJECT_ID/g" .ai/k8s/backend-deployment.yml
sed -i "s/REGION/$REGION/g" .ai/k8s/backend-deployment.yml
sed -i "s/PROJECT_ID/$PROJECT_ID/g" .ai/k8s/frontend-deployment.yml
sed -i "s/REGION/$REGION/g" .ai/k8s/frontend-deployment.yml

# Deploy backend
kubectl apply -f .ai/k8s/backend-deployment.yml
kubectl apply -f .ai/k8s/backend-service.yml

# Deploy frontend
kubectl apply -f .ai/k8s/frontend-deployment.yml
kubectl apply -f .ai/k8s/frontend-service.yml

# Reserve static IP
gcloud compute addresses create mkrew-ip --global

# Deploy Ingress
kubectl apply -f .ai/k8s/ingress.yml
```

### 5.2 Continuous Deployment (Automated)

Po initial setup, każdy push do brancha `main` automatycznie:

1. Buduje nowe obrazy Docker
2. Pushuje do Artifact Registry
3. Aktualizuje deployments w GKE (rolling update)
4. Weryfikuje poprawność wdrożenia

## 6. Monitoring & Logging

### 6.1 Cloud Logging

Logi z GKE są automatycznie wysyłane do Cloud Logging:

```bash
# View backend logs
gcloud logging read "resource.type=k8s_container AND resource.labels.pod_name=~mkrew-backend" --limit 50

# View frontend logs
gcloud logging read "resource.type=k8s_container AND resource.labels.pod_name=~mkrew-frontend" --limit 50
```

### 6.2 Cloud Monitoring

Konfiguracja alertów:

- CPU utilization > 80% przez 5 minut
- Memory utilization > 85% przez 5 minut
- Pod restart count > 5 w ciągu 10 minut
- HTTP 5xx errors > 10 w ciągu 1 minuty

## 7. Rollback Strategy

### 7.1 Automatyczny Rollback

W przypadku błędów podczas deployment:

```bash
kubectl rollout undo deployment/mkrew-backend
kubectl rollout undo deployment/mkrew-frontend
```

### 7.2 Rollback do Konkretnej Wersji

```bash
# View deployment history
kubectl rollout history deployment/mkrew-backend

# Rollback to specific revision
kubectl rollout undo deployment/mkrew-backend --to-revision=2
```

## 8. Koszty

### 8.1 Oszacowanie Miesięcznych Kosztów (Development - GKE Autopilot)

**Pod Resources (based on requests):**
- Backend: 0.25 vCPU, 0.5 GB RAM
- Frontend: 0.1 vCPU, 0.125 GB RAM
- Cloud SQL Proxy: 0.05 vCPU, 0.064 GB RAM
- **Total**: 0.4 vCPU, 0.689 GB RAM

**GKE Autopilot Pricing (europe-central2):**
- vCPU: 0.4 × $0.042/hour × 730h = ~$12/miesiąc
- Memory: 0.69 GB × $0.0046/hour × 730h = ~$2/miesiąc
- **GKE Autopilot Total**: ~$14-16/miesiąc

**Infrastructure Costs:**
- **GKE Autopilot**: ~$15/miesiąc
- **Cloud SQL**: ~$7-9/miesiąc (db-f1-micro, ENTERPRISE edition)
- **Load Balancer**: ~$18/miesiąc
- **Artifact Registry**: ~$0.10/GB/miesiąc (~$1)
- **Cloud Logging**: ~$0.50/GB (~$2)
- **Cloud Monitoring**: Darmowe do 150MB/miesiąc

**Łączne koszty (dev)**: ~$43-48/miesiąc (~170-190 PLN/miesiąc)

**Savings vs Standard GKE:**
- Standard GKE (1x e2-standard-2): ~$75-85/month
- Autopilot + ENTERPRISE Cloud SQL: ~$43-48/month
- **Oszczędność: ~$30-40/month (40-50%)**

### 8.2 Optymalizacja Kosztów

- ✅ **GKE Autopilot już wdrożony** - płacisz tylko za rzeczywiste użycie podów
- ✅ **Cloud SQL ENTERPRISE edition** - używamy najtańszego tier (db-f1-micro)
- Zmniejsz resource requests w podach (obecnie konserwatywne)
- Skonfiguruj HorizontalPodAutoscaler do 0 replik w nocy (optional)
- Skonfiguruj retention policies dla logów (7 dni zamiast 30)
- Wyłącz Load Balancer i użyj NodePort dla dev (oszczędność ~$18/month)

**Potencjalne dalsze oszczędności:**
- Bez Load Balancer (dev only): ~$18/month
- Krótsze log retention: ~$1-2/month
- Optymalizacja resource requests: ~$5-8/month
- **Total savings potential**: ~$24-28/month

**Minimalny możliwy koszt (dev):** ~$20-25/month (~80-100 PLN)
- GKE Autopilot z optymalnymi resource requests: ~$10-12/month
- Cloud SQL db-f1-micro: ~$7-9/month
- Cloud Logging/Monitoring: ~$1-2/month
- Artifact Registry: ~$1/month

## 9. Security Best Practices

### 9.1 Implementowane Zabezpieczenia

✅ **Workload Identity**: Bezpieczna autentykacja bez kluczy
✅ **Secret Manager**: Centralne zarządzanie sekretami
✅ **Cloud SQL Proxy**: Bezpieczne połączenie z bazą danych
✅ **HTTPS only**: Managed SSL certificates
✅ **Non-root containers**: Security context w deploymentach
✅ **Network Policies**: Izolacja ruchu sieciowego (optional)
✅ **Cloud Armor**: DDoS protection (optional)
✅ **VPC Service Controls**: Perimeter security (optional)

### 9.2 Rekomendacje

- Włącz Binary Authorization dla weryfikacji obrazów
- Skonfiguruj Pod Security Policies
- Regularnie aktualizuj obrazy bazowe
- Skanuj obrazy pod kątem vulnerabilities (Artifact Registry Scanning)
- Używaj najmniejszych uprawnień IAM (principle of least privilege)

## 10. Next Steps

### 10.1 Krótkoterminowe
- [ ] Wykonać initial setup GCP
- [ ] Skonfigurować GitHub Secrets
- [ ] Przetestować pierwszy deployment
- [ ] Skonfigurować DNS records

### 10.2 Średnioterminowe
- [ ] Skonfigurować Cloud Monitoring alerts
- [ ] Dodać integration tests do pipeline
- [ ] Skonfigurować staging environment
- [ ] Dodać performance tests

### 10.3 Długoterminowe
- [ ] Wdrożyć Blue-Green deployment
- [ ] Dodać Canary deployments
- [ ] Skonfigurować Disaster Recovery plan
- [ ] Zautomatyzować scaling policies
- [ ] Wdrożyć Infrastructure as Code (Terraform)

## 11. Troubleshooting

### 11.1 Częste Problemy

#### Problem: Pod nie startuje
```bash
kubectl describe pod <pod-name>
kubectl logs <pod-name>
```

#### Problem: Brak połączenia z Cloud SQL
```bash
# Check Cloud SQL Proxy logs
kubectl logs <pod-name> -c cloud-sql-proxy

# Verify connection name
gcloud sql instances describe mkrew-db --format='value(connectionName)'
```

#### Problem: Ingress nie działa
```bash
# Check ingress status
kubectl describe ingress mkrew-ingress

# Check ManagedCertificate status
kubectl describe managedcertificate mkrew-cert
```

### 11.2 Diagnostyka

```bash
# Check all resources
kubectl get all

# Check events
kubectl get events --sort-by='.lastTimestamp'

# Check node status
kubectl get nodes

# Check resource usage
kubectl top pods
kubectl top nodes
```

## 12. Contact & Support

W razie problemów:
1. Sprawdź Cloud Logging dla szczegółowych logów
2. Przejrzyj GitHub Actions logs
3. Skonsultuj dokumentację GCP: https://cloud.google.com/docs
4. Zgłoś issue w repozytorium projektu
