# Liquibase Deployment na GCP

> Niezależny deployment migracji bazy danych do Google Kubernetes Engine (GKE)

## 📋 Przegląd

Migracje bazy danych są zarządzane **niezależnie od aplikacji** przez dedykowany Kubernetes Job. Aplikacja **NIE** tworzy tabel - wszystkie zmiany schematu są kontrolowane przez administratorów poprzez Liquibase.

### Architektura

```
┌─────────────────────────────────────────────┐
│   Kubernetes Job: liquibase-migration      │
├─────────────────────────────────────────────┤
│                                             │
│  Init Container                             │
│  └─ Fetch secrets from Secret Manager      │
│                                             │
│  Main Container (Liquibase)                │
│  ├─ Execute changelogs                     │
│  └─ Connect via localhost:5432             │
│                                             │
│  Sidecar Container (Cloud SQL Proxy)       │
│  └─ Proxy to Cloud SQL PostgreSQL          │
│                                             │
└─────────────────────────────────────────────┘
```

## 🚀 Szybki Start

### Wymagania

- Skonfigurowany GCP project (`mkrew-478317`)
- Dostęp do GKE cluster (`mkrew-cluster`)
- Uprawnienia do Secret Manager i Artifact Registry
- Zainstalowane: `gcloud`, `kubectl`, `docker`

### 1. Build i Deploy (Full Flow)

```bash
cd db
chmod +x deploy-liquibase.sh
./deploy-liquibase.sh deploy
```

To wykona:
1. Build obrazu Docker z changelogami
2. Push do Artifact Registry
3. Deploy Kubernetes Job do GKE
4. Uruchomienie migracji

### 2. Sprawdzenie Statusu

```bash
./deploy-liquibase.sh status
```

Przykładowy output:
```
NAME                  COMPLETIONS   DURATION   AGE
liquibase-migration   1/1           45s        2m
```

### 3. Podgląd Logów

```bash
./deploy-liquibase.sh logs
```

### 4. Usunięcie Zakończonego Job

```bash
./deploy-liquibase.sh delete
```

## 📦 Komponenty

### Dockerfile.liquibase

Obraz Docker bazujący na `liquibase/liquibase:4.25-alpine`:
- Zawiera wszystkie changelogi z `db/changelog/`
- PostgreSQL JDBC driver wbudowany
- Rozmiar: ~100MB

### liquibase-job.yml

Kubernetes Job z trzema kontenerami:

1. **Init Container** (`secret-init`)
   - Pobiera credentials z GCP Secret Manager
   - Tworzy Kubernetes Secret `liquibase-secrets`

2. **Main Container** (`liquibase`)
   - Uruchamia `liquibase update`
   - Czeka na Cloud SQL Proxy
   - Wykonuje migracje

3. **Sidecar Container** (`cloud-sql-proxy`)
   - Proxy do Cloud SQL na `localhost:5432`
   - Bezpieczne połączenie przez IAM

### deploy-liquibase.sh

Helper script z komendami:

| Komenda | Opis |
|---------|------|
| `build` | Build obrazu Docker lokalnie |
| `push` | Build + push do Artifact Registry |
| `run` | Deploy job do GKE |
| `deploy` | Full flow (push + run) |
| `status` | Status job |
| `logs` | Logi migracji |
| `delete` | Usuń job |
| `rollback N` | Instrukcje rollback |

## 🔧 Konfiguracja

### Zmienne Środowiskowe (ConfigMap)

```yaml
# k8s/configmap.yml
DB_NAME: mkrew
```

### Sekrety (GCP Secret Manager)

Job pobiera następujące sekrety:
- `mkrew-db-username` - Database user
- `mkrew-db-password` - Database password
- `mkrew-cloud-sql-connection` - Cloud SQL connection string

## 🔄 Workflow CI/CD

### GitHub Actions Integration

Dodaj do `.github/workflows/deploy-gcp.yml`:

```yaml
jobs:
  # ... existing jobs ...

  deploy-database:
    name: Deploy Database Migrations
    runs-on: ubuntu-latest
    needs: []  # Can run independently
    if: github.ref == 'refs/heads/main'  # Only on main branch

    steps:
    - uses: actions/checkout@v4

    - name: Authenticate to Google Cloud
      uses: google-github-actions/auth@v2
      with:
        workload_identity_provider: ${{ secrets.GCP_WORKLOAD_IDENTITY_PROVIDER }}
        service_account: ${{ secrets.GCP_SERVICE_ACCOUNT }}

    - name: Set up Cloud SDK
      uses: google-github-actions/setup-gcloud@v2

    - name: Configure Docker for Artifact Registry
      run: gcloud auth configure-docker europe-central2-docker.pkg.dev

    - name: Build and Push Liquibase Image
      run: |
        cd db
        docker build -f Dockerfile.liquibase -t liquibase:latest .
        docker tag liquibase:latest \
          europe-central2-docker.pkg.dev/mkrew-478317/mkrew/liquibase:latest
        docker push \
          europe-central2-docker.pkg.dev/mkrew-478317/mkrew/liquibase:latest

    - name: Get GKE Credentials
      run: |
        gcloud container clusters get-credentials mkrew-cluster \
          --region=europe-central2 \
          --project=mkrew-478317

    - name: Deploy Migration Job
      run: |
        kubectl delete job liquibase-migration --ignore-not-found=true
        sleep 5
        kubectl apply -f k8s/liquibase-job.yml

    - name: Wait for Migration to Complete
      run: |
        kubectl wait --for=condition=complete --timeout=300s job/liquibase-migration

    - name: Check Migration Status
      if: always()
      run: |
        kubectl get jobs liquibase-migration
        POD_NAME=$(kubectl get pods -l app=mkrew-liquibase -o jsonpath='{.items[0].metadata.name}')
        kubectl logs $POD_NAME -c liquibase
```

### Manual Deployment

Dla deploymentu manualnego:

```bash
# 1. Build i push obrazu
cd db
./deploy-liquibase.sh push

# 2. Deploy job do GKE
./deploy-liquibase.sh run

# 3. Monitoruj status
watch kubectl get jobs,pods -l app=mkrew-liquibase

# 4. Zobacz logi
./deploy-liquibase.sh logs
```

## 📊 Monitoring

### Sprawdzenie Stanu Migracji

```bash
# Job status
kubectl get job liquibase-migration

# Pod status
kubectl get pods -l app=mkrew-liquibase

# Detailed job info
kubectl describe job liquibase-migration
```

### Historia Migracji w Bazie

Połącz się z bazą przez Cloud SQL Proxy:

```bash
# Utwórz tymczasowy pod z psql
kubectl run -it --rm psql \
  --image=postgres:16 \
  --restart=Never \
  --env="PGPASSWORD=YOUR_PASSWORD" \
  -- psql -h CLOUD_SQL_PROXY_IP -U mkrew_user -d mkrew

# W psql:
SELECT id, author, filename, dateexecuted, orderexecuted, exectype
FROM databasechangelog
ORDER BY orderexecuted DESC
LIMIT 10;
```

## 🔙 Rollback

**UWAGA**: Rollback wymaga manualnej interwencji!

### Proces Rollback

1. **Backup bazy danych**
   ```bash
   # Utwórz snapshot Cloud SQL
   gcloud sql backups create \
     --instance=mkrew-db \
     --project=mkrew-478317
   ```

2. **Zidentyfikuj changesets do rollback**
   ```sql
   SELECT id, author, filename, orderexecuted
   FROM databasechangelog
   ORDER BY orderexecuted DESC
   LIMIT 5;
   ```

3. **Wykonaj rollback SQL**
   - Otwórz plik changeset (np. `022-seed-admin-user.yaml`)
   - Znajdź sekcję `rollback:`
   - Wykonaj SQL z sekcji rollback

4. **Zaktualizuj databasechangelog**
   ```sql
   DELETE FROM databasechangelog
   WHERE id = 'changeset-id' AND author = 'author';
   ```

5. **Weryfikuj**
   ```sql
   SELECT * FROM databasechangelog ORDER BY orderexecuted DESC;
   ```

### Helper Script

```bash
./deploy-liquibase.sh rollback 3
```

Wyświetli instrukcje rollback dla ostatnich 3 changesetów.

## 🛠️ Troubleshooting

### Problem: Job nie startuje

```bash
# Sprawdź eventy
kubectl get events --sort-by='.lastTimestamp' | grep liquibase

# Sprawdź opis job
kubectl describe job liquibase-migration

# Sprawdź logi init container
POD_NAME=$(kubectl get pods -l app=mkrew-liquibase -o jsonpath='{.items[0].metadata.name}')
kubectl logs $POD_NAME -c secret-init
```

### Problem: Brak połączenia z Cloud SQL

```bash
# Sprawdź logi Cloud SQL Proxy
kubectl logs $POD_NAME -c cloud-sql-proxy

# Weryfikuj connection name
gcloud sql instances describe mkrew-db \
  --format='value(connectionName)' \
  --project=mkrew-478317
```

### Problem: Migration timeout

```bash
# Zwiększ timeout w liquibase-job.yml
spec:
  activeDeadlineSeconds: 1800  # 30 minut zamiast domyślnego
```

### Problem: Duplikaty w databasechangelog

```sql
-- Sprawdź duplikaty
SELECT id, author, COUNT(*)
FROM databasechangelog
GROUP BY id, author
HAVING COUNT(*) > 1;

-- Usuń duplikaty (zachowaj najstarszy)
DELETE FROM databasechangelog a
USING databasechangelog b
WHERE a.id = b.id
  AND a.author = b.author
  AND a.dateexecuted > b.dateexecuted;
```

## 🔒 Bezpieczeństwo

### Service Account Permissions

Job używa `mkrew-backend-sa` z uprawnieniami:
- `roles/cloudsql.client` - połączenie z Cloud SQL
- `roles/secretmanager.secretAccessor` - dostęp do Secret Manager

### Workload Identity

```bash
# Weryfikuj binding
kubectl describe serviceaccount mkrew-backend-sa | grep Annotations

# Powinno być:
# iam.gke.io/gcp-service-account=mkrew-backend@mkrew-478317.iam.gserviceaccount.com
```

### Network Policies (Opcjonalne)

Ogranicz ruch tylko do Cloud SQL Proxy:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: liquibase-policy
spec:
  podSelector:
    matchLabels:
      app: mkrew-liquibase
  policyTypes:
  - Egress
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: mkrew-liquibase
    ports:
    - protocol: TCP
      port: 5432
```

## 📚 Dodatkowe Zasoby

- [Liquibase Documentation](https://docs.liquibase.com/)
- [Cloud SQL Proxy](https://cloud.google.com/sql/docs/postgres/sql-proxy)
- [Kubernetes Jobs](https://kubernetes.io/docs/concepts/workloads/controllers/job/)
- [GCP Secret Manager](https://cloud.google.com/secret-manager/docs)

## ✅ Checklist Przed Deploymentem

- [ ] Wszystkie changesets przetestowane lokalnie (`docker-compose up`)
- [ ] Sekrety skonfigurowane w GCP Secret Manager
- [ ] Service Account ma odpowiednie uprawnienia
- [ ] Backup bazy danych utworzony
- [ ] ConfigMap `mkrew-config` zawiera `DB_NAME`
- [ ] Artifact Registry repository istnieje
- [ ] GKE cluster jest dostępny

## 🎯 Best Practices

1. **Zawsze testuj migracje lokalnie** przed deploymentem do GCP
2. **Twórz backup** przed każdą migracją produkcyjną
3. **Uruchamiaj migracje poza godzinami szczytu**
4. **Monitoruj logi** w trakcie wykonywania migracji
5. **Dokumentuj zmiany** w changesetach (comments)
6. **Używaj wersjonowania semantycznego** dla tagów obrazu
7. **Testuj rollback** na środowisku staging

---

**Powered by 🔄 Liquibase + ☁️ GCP**