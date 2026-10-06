# FleetFlow: MERN Fleet Management System

FleetFlow is a full stack academic project for managing vehicles, drivers, trips, fuel records, maintenance schedules, and operational reports from one web application.

## Implemented modules

- JWT login with Admin, Fleet Manager, and Driver roles
- Admin user management with account activation and driver linking
- Dedicated driver workspace for assigned trips, progress updates, and fuel entry
- Professional analytics dashboard with live totals, charts, and compliance alerts
- Vehicle CRUD
- Driver CRUD
- Trip CRUD and assignments
- Fuel logs with automatic total cost
- Maintenance scheduling and overdue status
- Vehicle wise operational report with CSV export
- Responsive interface for desktop and mobile
- Seed script with review-ready sample data

## Technology stack

- Frontend: React, Vite, React Router, Axios, CSS
- Backend: Node.js, Express.js, JWT, bcrypt
- Database: MongoDB and Mongoose

## 1. Install the required software on Windows

1. Download and install the **LTS version of Node.js** from https://nodejs.org/.
2. Keep the default installation options selected.
3. Restart VS Code after installation.
4. Open the VS Code terminal and run:

```powershell
node -v
npm -v
```

Both commands should display version numbers.

## 2. Choose a MongoDB setup

### Option A: Local MongoDB

Install MongoDB Community Server and MongoDB Compass. Keep this value in `server/.env`:

```env
MONGO_URI=mongodb://127.0.0.1:27017/fleet_management
```

### Option B: MongoDB Atlas

Create a free cluster, database user, and network access entry. Copy the connection string and place it in `server/.env`:

```env
MONGO_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/fleet_management
```

Replace `USERNAME`, `PASSWORD`, and `CLUSTER` with your Atlas values. Do not upload the `.env` file publicly.

## 3. Configure the project

Open this project folder in VS Code. Run:

```powershell
cd server
copy .env.example .env
cd ..\client
copy .env.example .env
cd ..
```

Open `server/.env` and replace `JWT_SECRET` with a long private value.

## 4. Install packages

From the main project folder:

```powershell
npm run install:all
```

## 5. Add sample review data

Make sure MongoDB is running, then execute:

```powershell
cd server
npm run seed
```

Demo login:

```text
Admin: admin@fleet.com / Admin@123
Manager: manager@fleet.com / Manager@123
Driver: driver@fleet.com / Driver@123
```

Change the demo password before using the project beyond the college review.

## 6. Run the application

Open two VS Code terminals.

Terminal 1:

```powershell
cd server
npm run dev
```

Terminal 2:

```powershell
cd client
npm run dev
```

Open http://localhost:5173 in the browser.

## Review demonstration order

1. Log in with the administrator account.
2. Explain the dashboard totals, cost chart, vehicle utilization, and alerts.
3. Open Users and demonstrate role-based account creation.
4. Add and edit a vehicle.
5. Add a driver.
6. Create a trip using the vehicle and driver.
7. Add a fuel entry and show the calculated cost.
8. Schedule maintenance and show its status.
9. Open Reports and export the CSV file.
10. Log in as a driver and show the restricted personal workspace.

## Important API routes

| Method | Route | Purpose |
| --- | --- | --- |
| POST | `/api/auth/login` | Authenticate a user |
| GET | `/api/dashboard` | Dashboard totals and recent activity |
| GET/POST | `/api/users` | Admin-only user management |
| GET | `/api/driver/overview` | Driver's own assignments and metrics |
| PUT | `/api/driver/trips/:id` | Driver updates an assigned trip |
| POST | `/api/driver/fuel` | Driver submits fuel for an assigned vehicle |
| GET/POST | `/api/vehicles` | List or create vehicles |
| GET/POST | `/api/drivers` | List or create drivers |
| GET/POST | `/api/trips` | List or create trips |
| GET/POST | `/api/fuel` | List or create fuel records |
| GET/POST | `/api/maintenance` | List or create maintenance records |

Every resource also supports `GET`, `PUT`, and `DELETE` using `/:id`. Deletion requires the administrator role.

## Adding roles without resetting existing data

If you already have project data, do not run the seed command again. Sign in as the administrator, open **Users**, and create Manager or Driver accounts. A Driver account must be linked to an existing driver profile.

## Troubleshooting

- `node is not recognized`: install Node.js LTS and restart VS Code.
- `Database connection failed`: verify `MONGO_URI` and confirm MongoDB is running.
- `Network Error` in React: confirm the backend is running on port 5000.
- `Incorrect email or password`: run `npm run seed` from the server folder.
- Port already in use: close the earlier Node process or change the port in `.env`.
