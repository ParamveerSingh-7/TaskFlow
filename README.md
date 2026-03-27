# TaskFlow — Task Management System

A full-stack task management application built with React, Spring Boot, MySQL, Docker, and GitHub Actions.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Role-Based Access — Detailed Rules](#role-based-access--detailed-rules)
3. [Features](#features)
4. [Project Structure](#project-structure)
5. [How to Run Locally](#how-to-run-locally)
6. [How to Run with Docker](#how-to-run-with-docker)
7. [API Reference](#api-reference)
8. [Accounts Description](#accounts-description)
9. [Environment Variables](#environment-variables)

---

## Tech Stack

| Layer    | Technology                                      |
| -------- | ----------------------------------------------- |
| Frontend | React 18 + Vite, Tailwind CSS, Axios            |
| Backend  | Spring Boot 3, Spring Security, Spring Data JPA |
| Database | MySQL 8                                         |
| Auth     | JWT (stateless, HMAC-SHA256)                    |
| DevOps   | Docker, Docker Compose, GitHub Actions CI       |

---

## Role-Based Access — Detailed Rules

### How roles are assigned

Every user who registers through the app — via the Register page or `POST /api/auth/register` — is **automatically assigned the `USER` role**. There is no way to self-register as an `ADMIN`.

**Admin promotion must be done directly in the database:**

```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'admin@taskflow.com';
```

This is intentional. There is no public-facing endpoint to create or promote an admin. Only someone with direct database access can grant admin privileges, preventing any form of privilege escalation.

---

### ADMIN capabilities

| Action                          | Allowed? | Notes                                                             |
| ------------------------------- | -------- | ----------------------------------------------------------------- |
| View all registered users       | Yes      | Users management page at `/admin/users`                           |
| Delete a user                   | Yes      | **Blocked** if user has tasks in the dashboard                    |
| Create a task                   | Yes      | Can assign to themselves or any other user                        |
| Assign a task to any user       | Yes      | Cross-user assignment is admin-only                               |
| View all tasks on dashboard     | Yes      | Full visibility across all users                                  |
| Filter tasks by assigned user   | Yes      | User filter dropdown visible to both admins and users             |
| Edit a task they created        | Yes      | Can update title, description, status                             |
| Change status of their own task | Yes      | Full status control over tasks they created                       |
| Delete a task they created      | Yes      | Only for tasks where they are `createdBy`                         |
| Access `/admin/users` page      | Yes      | Non-admins are redirected to dashboard                            |

#### User deletion rule

> **An admin cannot delete a user who has tasks assigned to them on the dashboard.**
> All assigned tasks must be deleted before the user account can be removed.
> This prevents orphaned in-progress work when a user is removed from the system.

---

### USER capabilities

| Action                                                   | Allowed? | Notes                                                    |
| -------------------------------------------------------- | -------- | -------------------------------------------------------- |
| Register and login                                       | Yes      | Open to everyone                                         |
| View all tasks on dashboard                              | Yes      | Can see all tasks but can only act on their own          |
| Create a task                                            | Yes      | Becomes the `createdBy` owner of the task                |
| Assign a task to themselves                              | Yes      | Can set `assignedTo` to their own account only           |
| Assign a task to another user                            | No       | Cross-user assignment is not permitted for regular users |
| Edit a task they created                                 | Yes      | Can update title, description, and status                |
| Edit a task assigned to them                             | Yes      | Can update if they are the `assignedTo` user             |
| Edit someone else's task                                 | No       | Returns `403 Forbidden` — enforced in the service layer  |
| Delete a task they created                               | Yes      | Only when they are the `createdBy` user                  |
| Delete a task assigned to them (but not created by them) | No       | Returns `403 Forbidden`                                  |
| Access `/admin/users` page                               | No       | Automatically redirected to dashboard                    |
| See the user filter on dashboard                         | No       | User dropdown filter is admin-only                       |

---

## Features

- JWT authentication — token returned at login, attached to every request via Axios interceptor
- BCrypt password hashing — plain text passwords never stored or compared
- Role-based access: `ADMIN` vs `USER` enforced at both the HTTP security layer and the service layer
- Create, view, update, and delete tasks with full ownership checks
- Admin can assign tasks to any user; regular users can only assign to themselves
- Task status tracking: `TODO` → `IN_PROGRESS` → `DONE`
- Dashboard with filter by status; admin additionally gets filter by assigned user
- Users with active (`TODO` or `IN_PROGRESS`) tasks cannot be deleted
- Structured JSON error responses with correct HTTP status codes (201, 400, 401, 403, 404, 409, 500)
- CORS configured for local dev (`localhost:5173`) and Docker (`localhost:4173`)
- No secrets committed to Git — all credentials via environment variables

---

## Project Structure

```
capstone-project/
├── .github/
│   └── workflows/
│       └── ci.yml                    # GitHub Actions CI pipeline
├── backend/
│   ├── src/main/java/com/capstone/taskmanager/
│   │   ├── config/                   # JwtFilter, JwtUtil, SecurityConfig
│   │   ├── controller/               # AuthController, TaskController, UserController
│   │   ├── exception/                # GlobalExceptionHandler, AppException, ErrorResponse
│   │   ├── model/                    # User, Task, Role, TaskStatus
│   │   ├── repository/               # UserRepository, TaskRepository
│   │   └── service/                  # TaskService, CustomUserDetailsService
│   ├── src/main/resources/
│   │   └── application.properties
│   ├── Dockerfile
│   └── pom.xml
├── frontend/
│   ├── src/
│   │   ├── api/                      # Axios instance + all API calls
│   │   ├── components/               # Navbar, TaskCard, ProtectedRoute, etc.
│   │   ├── context/                  # AuthContext (JWT + user state)
│   │   ├── pages/                    # AuthPage, Dashboard, TaskForm, AdminUsers
│   │   └── utils/                    # jwtDecode utility
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## How to Run Locally

### Prerequisites

- Java 17+
- Maven 3.8+
- Node.js 20+
- MySQL 8 running on `localhost:3306`

### Step 1 — Database

```sql
CREATE DATABASE taskdb;
```

### Step 2 — Backend

Create `backend/src/main/resources/application-local.properties`:

```properties
app.jwt.secret=yourlocaldevsecretkey32charsminimum
spring.datasource.password=yourMysqlRootPassword
```

Then run:

```bash
cd backend
./mvnw spring-boot:run -Dspring-boot.run.profiles=local
```

Backend starts at **http://localhost:8080**

### Step 3 — Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend starts at **http://localhost:5173**

### Step 4 — Seed the admin account

Register the admin via the UI or Postman, then promote in MySQL:

```json
POST http://localhost:8080/api/auth/register
{
  "name": "Admin",
  "email": "admin@taskflow.com",
  "password": "1234"
}
```

```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'admin@taskflow.com';
```

---

## How to Run with Docker

### Step 1 — Create `.env` at the project root

```env
MYSQL_ROOT_PASSWORD=TaskFlow2026!
JWT_SECRET=taskflowsupersecretjwtkey2026abcdefghij
```

### Step 2 — Build the backend JAR

```bash
cd backend
./mvnw clean package -DskipTests
cd ..
```

### Step 3 — Start all services

```bash
docker compose up --build
```

| Service     | URL                   |
| ----------- | --------------------- |
| Frontend    | http://localhost:4173 |
| Backend API | http://localhost:8080 |

### Step 4 — Seed the admin (first time only)

Register via `http://localhost:4173`, then run in MySQL:

```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'admin@taskflow.com';
```

### To stop

```bash
docker compose down        # stop containers, keep DB data
docker compose down -v     # stop containers and wipe DB volume
```

---

## API Reference

### Auth (public — no token required)

| Method | Endpoint             | Body                        | Response          |
| ------ | -------------------- | --------------------------- | ----------------- |
| POST   | `/api/auth/register` | `{ name, email, password }` | User object (201) |
| POST   | `/api/auth/login`    | `{ email, password }`       | JWT string (200)  |

### Users (Admin only)

| Method | Endpoint          | Description                                      |
| ------ | ----------------- | ------------------------------------------------ |
| GET    | `/api/users`      | List all registered users                        |
| GET    | `/api/users/{id}` | Get a user by ID                                 |
| DELETE | `/api/users/{id}` | Delete a user (blocked if user has active tasks) |

### Tasks (Authenticated)

| Method | Endpoint                               | Who can call             | Description                    |
| ------ | -------------------------------------- | ------------------------ | ------------------------------ |
| POST   | `/api/tasks`                           | Any authenticated user   | Create a task                  |
| GET    | `/api/tasks`                           | Any authenticated user   | List all tasks                 |
| GET    | `/api/tasks/{id}`                      | Any authenticated user   | Get a single task              |
| PUT    | `/api/tasks/{id}`                      | Creator or assignee only | Update task details and status |
| DELETE | `/api/tasks/{id}`                      | Creator only             | Delete a task                  |
| GET    | `/api/tasks/filter/status?status=TODO` | Any authenticated user   | Filter by status               |
| GET    | `/api/tasks/filter/user?userId=1`      | Any authenticated user   | Filter by assigned user        |

### Error response format

```json
{
  "status": 403,
  "message": "You are not authorized to update this task",
  "timestamp": "2026-03-26T17:53:30"
}
```

Validation errors (400) return a field-to-message map:

```json
{
  "email": "Must be a valid email",
  "password": "Password must be at least 4 characters"
}
```

---

## Accounts Description

### Admin account

| Field    | Value                                         |
| -------- | --------------------------------------------- |
| Email    | `admin@taskflow.com`                          |
| Password | `1234`                                        |
| Role     | `ADMIN` (promoted via SQL after registration) |

**What to verify as admin:**

- Log in → the **Users** tab appears in the navbar
- Navigate to `/admin/users` → see all registered users with delete buttons
- Create a task → the assign dropdown lets you pick any registered user
- Create a task → assign it to a regular user → verify they can edit it
- Try deleting a user who has active tasks → should be blocked
- Delete a user who has only `DONE` tasks → should succeed
  
<img width="995" height="554" alt="Screenshot 2026-03-27 at 10 24 56 AM" src="https://github.com/user-attachments/assets/c1534d59-5e84-462c-b648-9a285f965039" />
<img width="985" height="562" alt="Screenshot 2026-03-27 at 10 25 05 AM" src="https://github.com/user-attachments/assets/5b3a9249-b847-4ceb-98b4-6d275682e011" />

### Regular user account

| Field    | Value                              |
| -------- | ---------------------------------- |
| Email    | `user@taskflow.com`                |
| Password | `1234`                             |
| Role     | `USER` (automatic on registration) |

**What to verify as user:**

- Log in → the **Users** tab is NOT visible in the navbar
- Manually visit `/admin/users` → redirected to dashboard
- Create a task → assign dropdown only shows yourself, not other users
- Edit a task you own → succeeds
- Edit a task created by someone else → Edit button does not appear
- Delete a task you created → succeeds
- Delete a task you did not create → Delete button does not appear

<img width="965" height="533" alt="Screenshot 2026-03-27 at 10 24 35 AM" src="https://github.com/user-attachments/assets/0b5ad68e-b8ee-4dc8-9695-fa75fd0412fc" />


### How to seed both accounts

**Step 1** — Register both via the frontend or Postman:

```json
POST /api/auth/register
{ "name": "Admin", "email": "admin@taskflow.com", "password": "Admin@1234" }

POST /api/auth/register
{ "name": "Test User", "email": "user@taskflow.com", "password": "User@1234" }
```

**Step 2** — Promote the admin in MySQL:

```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'admin@taskflow.com';
```

**Step 3** — Log in with either account at the login page.

> **Why no admin signup page?** All users who register through the app receive the `USER` role automatically. The `ADMIN` role can only be granted via direct database access. This is a deliberate security design — there is no way to escalate privileges through the application itself.

---

## Environment Variables

| Variable                     | Used by        | Description                                    |
| ---------------------------- | -------------- | ---------------------------------------------- |
| `MYSQL_ROOT_PASSWORD`        | Docker Compose | MySQL root password                            |
| `JWT_SECRET`                 | Backend        | HMAC-SHA256 signing key (min 32 chars)         |
| `JWT_EXPIRATION`             | Backend        | Token TTL in ms (default: `3600000` = 1 hour)  |
| `SPRING_DATASOURCE_URL`      | Backend        | JDBC connection URL (auto-set by Compose)      |
| `SPRING_DATASOURCE_USERNAME` | Backend        | DB username (auto-set by Compose)              |
| `SPRING_DATASOURCE_PASSWORD` | Backend        | DB password (reads from `MYSQL_ROOT_PASSWORD`) |
| `VITE_API_URL`               | Frontend       | Backend base URL passed at Docker build time   |

---

_TaskFlow — Capstone Project · March 2026_
