# mkrew - Blood Donation Platform

> Webowa aplikacja dla dawców krwi w Polsce - zbieranie stanów krwi, zarządzanie donacjami i powiadomienia

[![Java](https://img.shields.io/badge/Java-21-orange.svg)](https://www.oracle.com/java/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2-green.svg)](https://spring.io/projects/spring-boot)
[![Astro](https://img.shields.io/badge/Astro-4.0-purple.svg)](https://astro.build/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg)](LICENSE)

## 📋 Spis treści

- [O projekcie](#o-projekcie)
- [Funkcjonalności](#funkcjonalności)
- [Stack technologiczny](#stack-technologiczny)
- [Struktura projektu](#struktura-projektu)
- [Szybki start](#szybki-start)
- [Dokumentacja](#dokumentacja)
- [Status implementacji](#status-implementacji)
- [Roadmap](#roadmap)
- [Zespół](#zespół)

## 🎯 O projekcie

**mkrew** to platforma webowa wspierająca dawców krwi w Polsce poprzez:
- **Web scraping** - codzienne zbieranie stanów krwi z publicznych stron RCKiK
- **Dziennik donacji** - prowadzenie historii własnych donacji z eksportem danych
- **Powiadomienia** - alerty e-mail i in-app o krytycznych stanach zapasów krwi
- **Ulubione centra** - monitorowanie wybranych RCKiK i spersonalizowane powiadomienia

### Problem użytkownika

Braki zapasów krwi w RCKiK i niewystarczająca komunikacja do potencjalnych dawców utrudniają szybkie uzupełnianie zasobów. Brak jednego, czytelnego widoku aktualnych stanów zapasów i prostego mechanizmu śledzenia własnych donacji.

### Rozwiązanie

mkrew dostarcza:
- Scentralizowany dashboard z aktualnymi stanami krwi ze wszystkich RCKiK w Polsce
- Automatyczne powiadomienia o krytycznych poziomach krwi w ulubionych centrach
- Osobisty dziennik donacji z przypomnieniami i statystykami
- Panel administracyjny do zarządzania danymi i monitoringu scrapera

## ✨ Funkcjonalności

### MVP (wersja 1.0)

#### Dla dawców krwi
- ✅ **Rejestracja i weryfikacja** - tworzenie konta z weryfikacją email
- ✅ **Bezpieczne logowanie** - JWT authentication z rate limiting
- ✅ **Przeglądanie RCKiK** - lista i szczegóły centrów krwiodawstwa z aktualnymi stanami
- ✅ **Ulubione centra** - dodawanie, zarządzanie priorytetami
- ✅ **Powiadomienia email** - alerty o krytycznych stanach krwi (<20%)
- ⏳ **Dziennik donacji** - CRUD operacje, eksport do CSV/JSON
- ⏳ **Powiadomienia in-app** - wewnętrzne powiadomienia po zalogowaniu
- ✅ **Profil użytkownika** - zarządzanie danymi osobowymi i preferencjami powiadomień

#### Dla administratorów
- ✅ **Panel admina** - zarządzanie RCKiK (CRUD)
- ⏳ **Monitoring scrapera** - status, logi, manualne uruchamianie
- ⏳ **Raporty użytkowników** - zgłoszenia problemów z danymi
- ✅ **Audit logs** - immutable dziennik krytycznych operacji

#### System scraping
- ✅ **Codzienne scraping** - automatyczne pobieranie danych o 02:00 CET
- ✅ **Materialized view** - optymalizacja wydajności dla dashboardu
- ✅ **Scraper configs** - konfigurowalne CSS selektory w bazie danych
- ✅ **Error logging** - pełne logowanie błędów parsowania

### Przyszłe funkcjonalności (post-MVP)
- 🔜 **Mapy interaktywne** - geolokalizacja najbliższych centrów
- 🔜 **Prognozowanie** - ML model przewidywania zapotrzebowania na krew
- 🔜 **Push notifications** - mobilne powiadomienia (Firebase)
- 🔜 **Public API** - oficjalne API dla RCKiK do wysyłania danych
- 🔜 **Gamification** - streak donacji, osiągnięcia
- 🔜 **Dark mode** - ciemny motyw interfejsu

## 🛠 Stack technologiczny

### Backend
- **Java 21** + **Spring Boot 3.2**
  - Spring Web (REST API)
  - Spring Data JPA (dostęp do danych)
  - Spring Security (autentykacja + autoryzacja)
  - Spring Validation (walidacja danych)
- **PostgreSQL 16** (baza danych)
- **Liquibase** (migracje bazy danych)
- **BCrypt** (hashowanie haseł, cost factor 12)
- **JWT** (JSON Web Tokens)
- **SpringDoc OpenAPI** (dokumentacja API - Swagger)
- **Jsoup** (web scraping HTML)
- **SendGrid** (wysyłka emaili)
- **Gradle 8.5** (build tool)

### Frontend
- **TypeScript** (język programowania)
- **Astro 4.0** (framework SSG/SSR)
  - Astro Islands (selective hydration)
  - View Transitions API
- **React 18** (komponenty interaktywne)
- **Redux Toolkit** (zarządzanie stanem)
- **Tailwind CSS** (stylowanie)
- **React Hook Form + Zod** (formularze i walidacja)
- **Recharts** (wykresy i trendy)
- **Axios** (HTTP client)
- **Vitest + Playwright** (testy)

### Baza danych
- **PostgreSQL 16**
- **15 tabel biznesowych** + **1 materialized view**
- **Liquibase** (17 changesets)
- **HikariCP** (connection pooling)

### DevOps & Cloud
- **Docker + Docker Compose** (konteneryzacja)
- **Google Cloud Platform (GCP)**
  - Cloud SQL for PostgreSQL
  - Google Kubernetes Engine (GKE)
  - Cloud Build (CI/CD)
  - Artifact Registry
  - Secret Manager
- **GitHub Actions** (CI/CD)
- **Terraform** (Infrastructure as Code - planowane)

## 📁 Struktura projektu

```
mkrew2.1/
├── .ai/                          # Dokumentacja kontekstowa i plany (tylko dla AI)
│   ├── prd.md                    # Product Requirements Document
│   ├── tech-stack.md             # Stack technologiczny
│   ├── api-plan.md               # Plan API
│   ├── plan-db.md                # Plan bazy danych
│   ├── ui-plan.md                # Plan UI/UX
│   ├── test-plan.md              # Plan testów
│   ├── gcp-deployment-quickstart.md
│   └── gcp-cd-deployment-plan.md # Plan deployment na GCP
│
├── k8s/                          # Kubernetes manifests
│   ├── backend-deployment.yml    # Backend deployment + Cloud SQL Proxy
│   ├── backend-service.yml       # Backend service
│   ├── frontend-deployment.yml   # Frontend deployment
│   ├── frontend-service.yml      # Frontend service
│   ├── configmap.yml             # Non-sensitive config
│   ├── secrets.yml.template      # Secrets template
│   └── ingress.yml               # Ingress + SSL certificates
│
├── backend/                      # Spring Boot application
│   ├── src/
│   │   ├── main/java/pl/mkrew/backend/
│   │   │   ├── entity/           # JPA entities (15 entities)
│   │   │   ├── repository/       # Spring Data repositories
│   │   │   ├── service/          # Business logic
│   │   │   ├── controller/       # REST controllers
│   │   │   ├── dto/              # Data Transfer Objects
│   │   │   ├── config/           # Configuration
│   │   │   ├── exception/        # Exception handling
│   │   │   └── scheduler/        # Scheduled tasks
│   │   └── resources/
│   │       └── application.yml
│   ├── build.gradle
│   ├── docker-compose.yml
│   ├── Dockerfile
│   └── README.md                 # Backend documentation
│
├── frontend/                     # Astro + React application
│   ├── src/
│   │   ├── components/           # React/Astro components
│   │   │   ├── ui/               # Primitive UI components
│   │   │   ├── rckik/            # RCKiK domain components
│   │   │   ├── auth/             # Authentication components
│   │   │   ├── dashboard/        # Dashboard components
│   │   │   ├── admin/            # Admin panel components
│   │   │   └── common/           # Shared components
│   │   ├── layouts/              # Astro layouts
│   │   ├── pages/                # File-based routing
│   │   ├── lib/                  # Libraries & utilities
│   │   │   ├── api/              # API client
│   │   │   ├── store/            # Redux store
│   │   │   ├── hooks/            # Custom React hooks
│   │   │   └── utils/            # Utility functions
│   │   └── middleware/           # Astro middleware
│   ├── tests/
│   │   ├── unit/                 # Unit tests (Vitest)
│   │   ├── integration/          # Integration tests
│   │   └── e2e/                  # E2E tests (Playwright)
│   ├── astro.config.mjs
│   ├── tailwind.config.cjs
│   ├── package.json
│   └── README.md                 # Frontend documentation
│
├── db/                           # Database setup
│   ├── changelog/
│   │   ├── db.changelog-master.yaml
│   │   └── changesets/           # 17 Liquibase changesets
│   ├── docker-compose.yml
│   ├── erd-diagram.drawio        # ERD diagram
│   └── README.md                 # Database documentation
│
├── docs/                         # API documentation (backend-generated)
├── .github/
│   └── workflows/                # GitHub Actions
├── .gitignore
├── LICENSE
└── README.md                     # This file
```

## 🚀 Szybki start

### Wymagania wstępne

- **Docker** i **Docker Compose** (zalecane)
- **Java 21** (JDK)
- **Node.js 20+** i **npm/pnpm**
- **PostgreSQL 16** (jeśli bez Dockera)

### 1. Klonowanie repozytorium

```bash
git clone https://github.com/yourusername/mkrew2.1.git
cd mkrew2.1
```

### 2. Uruchomienie bazy danych

```bash
cd db
docker-compose up -d
```

To automatycznie:
- Uruchomi PostgreSQL na porcie 5432
- Wykona wszystkie migracje Liquibase
- Zainstaluje pgAdmin na http://localhost:5050

### 3. Uruchomienie backendu

**Opcja A: Docker Compose (zalecane)**
```bash
cd backend
docker-compose up -d
```

Backend będzie dostępny na: http://localhost:8080

**Opcja B: Gradle**
```bash
cd backend
./gradlew bootRun
```

### 4. Uruchomienie frontendu

```bash
cd frontend
npm install
npm run dev
```

Frontend będzie dostępny na: http://localhost:4321

### 5. Weryfikacja

- **Backend API**: http://localhost:8080/actuator/health
- **Swagger UI**: http://localhost:8080/swagger-ui.html
- **Frontend**: http://localhost:4321
- **pgAdmin**: http://localhost:5050

## 📚 Dokumentacja

### Dokumentacja kontekstowa (katalog .ai/)
- [Product Requirements Document](/.ai/prd.md) - pełna specyfikacja produktu (27 user stories)
- [Tech Stack](./.ai/tech-stack.md) - szczegółowy stos technologiczny
- [API Plan](./.ai/api-plan.md) - plan REST API (wszystkie endpointy)
- [Database Plan](./.ai/plan-db.md) - schemat bazy danych (15 tabel + widok)
- [UI Plan](./.ai/ui-plan.md) - architektura UI/UX, wszystkie widoki
- [Test Plan](./.ai/test-plan.md) - strategia testowania
- [GCP Deployment](./.ai/gcp-deployment-quickstart.md) - deployment na GCP

### Dokumentacja modułów
- [Backend README](./backend/README.md) - Spring Boot application
- [Frontend README](./frontend/README.md) - Astro + React application
- [Database README](./db/README.md) - PostgreSQL setup

### API Documentation
- **Swagger UI**: http://localhost:8080/swagger-ui.html (interaktywna dokumentacja)
- **OpenAPI Spec**: http://localhost:8080/v3/api-docs
- [Detailed API docs](./backend/docs/) - szczegółowa dokumentacja endpointów

## 📊 Status implementacji

### ✅ Zaimplementowane (MVP)

#### Backend
- ✅ **Infrastruktura**: Spring Boot, JPA, Security, Liquibase
- ✅ **US-001**: Rejestracja użytkownika (multi-step, GDPR consent)
- ✅ **US-002**: Weryfikacja email (24h token, idempotent)
- ✅ **US-003**: Logowanie (JWT, rate limiting, lockout)
- ✅ **US-004**: Reset hasła (2-step, email enumeration prevention)
- ✅ **US-005**: Profil użytkownika (GET, PATCH)
- ✅ **US-006**: Preferencje powiadomień (4 poziomy częstotliwości)
- ✅ **US-007**: Lista RCKiK (pagination, filtry, blood levels)
- ✅ **US-008**: Szczegóły RCKiK (historia, trendy)
- ✅ **US-009**: Ulubione RCKiK (add/remove, priority)
- ✅ **US-010**: Email notifications (SendGrid, critical alerts)
- ✅ **Swagger**: Pełna dokumentacja API

#### Database
- ✅ **15 tabel biznesowych** + **1 materialized view**
- ✅ **17 changesets Liquibase** (z rollback)
- ✅ **Seed data**: 21 RCKiK + scraper configs
- ✅ **Indeksy**: composite, partial, GIN
- ✅ **Audit logs**: immutable (trigger-protected)

#### Frontend
- 🏗️ **Setup**: Astro + React + Redux + Tailwind
- ⏳ **UI Components**: w trakcie implementacji
- ⏳ **Auth Pages**: w trakcie
- ⏳ **Dashboard**: w trakcie

### ⏳ W trakcie implementacji

- **US-011**: In-app notifications
- **US-012**: Dodawanie donacji do dziennika
- **US-013**: Edycja/usuwanie donacji
- **US-014**: Eksport dziennika donacji
- **Frontend MVP**: Public pages, Auth, Dashboard
- **Admin Panel**: RCKiK management, Scraper monitoring

### 🔜 Backlog (post-MVP)

- **US-017**: Manualne uruchomienie scrapera
- **US-018**: Monitoring błędów scraperów
- **US-019**: Zarządzanie kanoniczną listą RCKiK
- **US-021**: Zgłaszanie problemów z danymi
- **US-022**: Email deliverability metrics
- **US-024**: Audit logs viewer
- **Mapy interaktywne**: Leaflet/Mapbox
- **Real-time notifications**: WebSocket/SSE
- **Dark mode**: ciemny motyw
- **Prognozowanie**: ML model

## 🗺️ Roadmap

### Faza 1: MVP (6 tygodni) - ✅ W trakcie
- [x] **Week 1-2**: Backend infrastructure + Auth (US-001 do US-004)
- [x] **Week 3**: User management + Notifications (US-005, US-006, US-010)
- [x] **Week 4**: RCKiK endpoints (US-007, US-008, US-009)
- [ ] **Week 5**: Donations (US-012, US-013, US-014)
- [ ] **Week 6**: Frontend MVP + Testing

### Faza 2: Admin Panel (2 tygodnie)
- [ ] Admin UI (RCKiK management, Scraper monitoring)
- [ ] User reports (US-021)
- [ ] Audit logs viewer (US-024)

### Faza 3: Enhancement (4 tygodnie)
- [ ] Mapy interaktywne (Leaflet)
- [ ] Real-time notifications (WebSocket)
- [ ] Advanced filtering i search
- [ ] Performance optimization

### Faza 4: Production (2 tygodnie)
- [ ] GCP deployment (Cloud SQL, GKE)
- [ ] CI/CD pipeline (GitHub Actions + Cloud Build)
- [ ] Monitoring (Cloud Monitoring, Logging)
- [ ] Security audit (OWASP Top 10)

### Faza 5: Post-Launch
- [ ] ML model prognozowania zapotrzebowania
- [ ] Public API dla RCKiK
- [ ] Mobile app (React Native)
- [ ] Analytics dashboard

## 👥 Zespół

- **Product Owner**: [Your Name]
- **Backend Developer**: [Your Name]
- **Frontend Developer**: [Your Name]
- **DevOps**: [Your Name]

## 🤝 Contributing

Projekt jest w fazie MVP i nie przyjmuje zewnętrznych kontrybutorów. Po publicznym release zostaną opublikowane wytyczne dla contributorów.

## 📄 License

Proprietary - mkrew Project. All rights reserved.

## 📧 Kontakt

- **Email**: contact@mkrew.pl (placeholder)
- **Issues**: [GitHub Issues](https://github.com/yourusername/mkrew2.1/issues)
- **Documentation**: [Project Wiki](https://github.com/yourusername/mkrew2.1/wiki)

---

**Made with ❤️ for blood donors in Poland**
