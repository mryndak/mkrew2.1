# Tech Stack - mkrew2

## Backend
### Języki i Frameworki
- **Java** - główny język programowania backendu
- **Spring Boot** - framework aplikacyjny
  - Spring Web - REST API
  - Spring Data JPA - warstwa dostępu do danych
  - Spring Security - autentykacja i autoryzacja (jeśli wymagana)

### Web Scraping
- **Jsoup** - parsowanie HTML i ekstrakcja danych
- **Selenium WebDriver** (opcjonalnie) - dla dynamicznych stron z JavaScript
- **Apache HttpClient** - zaawansowane żądania HTTP

### Baza Danych
- **PostgreSQL** - relacyjna baza danych
- **Liquibase** - zarządzanie migracjami i wersjami schematów bazy danych
- **HikariCP** - connection pooling (domyślnie w Spring Boot)

### Build i Dependency Management
- **Gradle** - narzędzie do budowania projektu i zarządzania zależnościami
  - Gradle Wrapper - zapewnia spójną wersję Gradle w zespole
  - Kotlin DSL lub Groovy DSL - konfiguracja build scripts
  - Spring Boot Gradle Plugin - integracja ze Spring Boot

## Frontend
### Języki i Frameworki
- **TypeScript** - typowany JavaScript dla lepszej jakości kodu
- **Astro** - framework do budowy statycznych i dynamicznych stron
  - Astro Islands - selektywna hydratacja komponentów
  - Content Collections - zarządzanie treścią

### UI i Style
- **CSS Modules** lub **Tailwind CSS** - stylowanie
- **React/Vue/Svelte** (opcjonalnie) - komponenty interaktywne w Astro Islands

### Build Tools
- **Vite** - bundler (wbudowany w Astro)
- **ESLint** - linting kodu TypeScript
- **Prettier** - formatowanie kodu

## Cloud Platform - GCP
### Compute
- **Google Kubernetes Engine (GKE)** - zarządzany Kubernetes dla kontenerów
- **Cloud Run** (opcjonalnie) - serverless dla kontenerów
- **Compute Engine** (opcjonalnie) - wirtualne maszyny

### Database
- **Cloud SQL for PostgreSQL** - zarządzana baza danych PostgreSQL
  - Automatyczne backupy
  - High availability
  - Replikacja

### Storage
- **Cloud Storage** - przechowywanie plików statycznych, backupów
- **Persistent Disks** - storage dla GKE

### Networking
- **Cloud Load Balancing** - dystrybucja ruchu
- **Cloud CDN** - cache dla contentu statycznego
- **Cloud DNS** - zarządzanie domenami

### Monitoring i Logging
- **Cloud Logging** - centralne logowanie aplikacji
- **Cloud Monitoring** - metryki i alerty
- **Cloud Trace** - distributed tracing
- **Error Reporting** - śledzenie błędów

### CI/CD
- **Cloud Build** - automatyczne budowanie i deployment
- **Artifact Registry** - repozytorium obrazów Docker
- **GitHub Actions** (opcjonalnie) - integracja z GitHub

### Security
- **Cloud IAM** - zarządzanie dostępem
- **Secret Manager** - bezpieczne przechowywanie sekretów
- **Cloud Armor** - ochrona przed DDoS

## DevOps i Deployment
### Konteneryzacja
- **Docker** - konteneryzacja aplikacji
  - Multi-stage builds dla optymalizacji obrazów
  - Docker Compose - lokalne środowisko deweloperskie
  - Obrazy przechowywane w Artifact Registry (GCP)

### Orchestration
- **Kubernetes** - orkiestracja kontenerów w produkcji
  - Deployments, Services, ConfigMaps
  - Ingress dla routingu HTTP
  - Horizontal Pod Autoscaling
- **Google Kubernetes Engine (GKE)** - zarządzany Kubernetes na GCP

### Infrastructure as Code
- **Terraform** - definicja infrastruktury GCP
- **Cloud Deployment Manager** (opcjonalnie) - natywne narzędzie GCP

## Narzędzia Deweloperskie
### Version Control
- **Git** - kontrola wersji
- **GitHub** / **GitLab** - hosting repozytorium

### IDE i Edytory
- **IntelliJ IDEA** - środowisko deweloperskie dla Java
- **VS Code** - edytor dla TypeScript/Astro
- **Postman** / **Insomnia** - testowanie API

### Monitorowanie i Logi
- **SLF4J + Logback** - logowanie w Javie
- **Spring Boot Actuator** - monitoring endpoints
- **Cloud Logging** - agregacja logów w GCP

## Architektura
### Backend Architecture
- **REST API** - komunikacja frontend-backend
- **Layered Architecture**:
  - Controller Layer - endpointy REST
  - Service Layer - logika biznesowa
  - Repository Layer - dostęp do danych
  - Scraping Layer - web scraping services

### Frontend Architecture
- **Static Site Generation (SSG)** - domyślnie w Astro
- **Server-Side Rendering (SSR)** - opcjonalnie dla dynamicznych treści
- **API Client** - komunikacja z backendem (Fetch API / Axios)

### Deployment Architecture
- **Multi-tier Architecture**:
  - Frontend: Cloud Storage + Cloud CDN lub GKE
  - Backend: GKE (Kubernetes)
  - Database: Cloud SQL for PostgreSQL
  - Load Balancer: Cloud Load Balancing
  - Cache: Cloud CDN

## Konfiguracja Środowiska
### Zmienne Środowiskowe
- **application.properties** / **application.yml** - konfiguracja Spring Boot
- **.env** - zmienne środowiskowe dla Astro
- **ConfigMaps** / **Secrets** - konfiguracja w Kubernetes
- **Secret Manager** - sekrety w GCP

### Profile
- **dev** - rozwój lokalny
- **test** - testy
- **staging** - środowisko testowe na GCP
- **prod** - produkcja na GCP