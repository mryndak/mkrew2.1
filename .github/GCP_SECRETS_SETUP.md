# Konfiguracja sekretów GCP dla GitHub Actions

## Problem
Deployment z GitHub Actions nie działa, ponieważ brakuje skonfigurowanych sekretów w repozytorium.

## Wymagane sekrety

Aby deployment działał poprawnie, musisz skonfigurować następujące sekrety w GitHub:

### 1. Podstawowe sekrety GCP

Przejdź do: `Settings` → `Secrets and variables` → `Actions` → `New repository secret`

| Nazwa sekretu | Opis | Przykład |
|--------------|------|----------|
| `GCP_PROJECT_ID` | ID projektu GCP | `mkrew-prod-123456` |
| `GCP_REGION` | Region GCP | `europe-central2` |
| `GKE_CLUSTER` | Nazwa klastra GKE | `mkrew-cluster` |
| `ARTIFACT_REGISTRY` | Nazwa Artifact Registry | `mkrew-registry` |

### 2. Sekrety autoryzacji (Workload Identity Federation)

| Nazwa sekretu | Opis | Format |
|--------------|------|--------|
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | Provider ID dla Workload Identity | `projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/POOL_NAME/providers/PROVIDER_NAME` |
| `GCP_SERVICE_ACCOUNT` | Email konta usługowego | `github-actions@PROJECT_ID.iam.gserviceaccount.com` |

### 3. Sekrety aplikacji (opcjonalne, dla frontendu)

| Nazwa sekretu | Opis |
|--------------|------|
| `PUBLIC_RECAPTCHA_SITE_KEY` | Google reCAPTCHA site key |
| `PUBLIC_GA_TRACKING_ID` | Google Analytics tracking ID |
| `PUBLIC_SENTRY_DSN` | Sentry DSN dla monitoringu błędów |

## Jak uzyskać wartości sekretów GCP?

### GCP_PROJECT_ID
```bash
gcloud config get-value project
```

### GCP_REGION
Sprawdź region swojego klastra:
```bash
gcloud container clusters list
```

### GKE_CLUSTER
```bash
gcloud container clusters list --format="value(name)"
```

### ARTIFACT_REGISTRY
```bash
gcloud artifacts repositories list --format="value(name)"
```

### Workload Identity Federation

#### Krok 1: Utwórz Workload Identity Pool
```bash
gcloud iam workload-identity-pools create "github-pool" \
  --project="YOUR_PROJECT_ID" \
  --location="global" \
  --display-name="GitHub Actions Pool"
```

#### Krok 2: Utwórz Provider
```bash
gcloud iam workload-identity-pools providers create-oidc "github-provider" \
  --project="YOUR_PROJECT_ID" \
  --location="global" \
  --workload-identity-pool="github-pool" \
  --display-name="GitHub Provider" \
  --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository" \
  --issuer-uri="https://token.actions.githubusercontent.com"
```

#### Krok 3: Utwórz Service Account
```bash
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions Service Account" \
  --project="YOUR_PROJECT_ID"
```

#### Krok 4: Nadaj uprawnienia Service Account
```bash
# Artifact Registry
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

# GKE
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/container.developer"

# Cloud SQL (jeśli używasz)
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"
```

#### Krok 5: Połącz GitHub z Service Account
```bash
gcloud iam service-accounts add-iam-policy-binding \
  "github-actions@YOUR_PROJECT_ID.iam.gserviceaccount.com" \
  --project="YOUR_PROJECT_ID" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/attribute.repository/YOUR_GITHUB_USERNAME/YOUR_REPO_NAME"
```

#### Krok 6: Pobierz Provider ID
```bash
gcloud iam workload-identity-pools providers describe "github-provider" \
  --project="YOUR_PROJECT_ID" \
  --location="global" \
  --workload-identity-pool="github-pool" \
  --format="value(name)"
```

To da Ci wartość dla `GCP_WORKLOAD_IDENTITY_PROVIDER`.

## Weryfikacja konfiguracji

Po dodaniu sekretów, możesz przetestować deployment:

1. Przejdź do zakładki `Actions` w repozytorium
2. Wybierz workflow `CD - Deploy to GCP`
3. Kliknij `Run workflow`
4. Wybierz branch i environment
5. Uruchom workflow

## Troubleshooting

### Błąd: "failed to generate access token"
- Sprawdź czy `GCP_WORKLOAD_IDENTITY_PROVIDER` i `GCP_SERVICE_ACCOUNT` są poprawne
- Sprawdź czy Service Account ma odpowiednie uprawnienia

### Błąd: "permission denied" przy push do Artifact Registry
- Sprawdź czy Service Account ma rolę `roles/artifactregistry.writer`

### Błąd: "cluster not found"
- Sprawdź czy `GKE_CLUSTER` i `GCP_REGION` są poprawne
- Upewnij się że klaster istnieje: `gcloud container clusters list`

## Więcej informacji

- [Workload Identity Federation](https://cloud.google.com/iam/docs/workload-identity-federation)
- [GitHub Actions with GCP](https://github.com/google-github-actions/auth)
