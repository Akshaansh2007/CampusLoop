# CampusLoop

**A campus marketplace for students to buy and sell pre-owned items.**

CampusLoop is a full-stack web application designed to help students buy and sell second-hand items within their campus community. It provides a centralized marketplace where students can browse listings, discover items, publish their own listings, manage their sales, and contact sellers directly.

## Live Application

- **Website:** [CampusLoop](https://campusloop-frontend.onrender.com)
- **GitHub Repository:** [Akshaansh2007/CampusLoop](https://github.com/Akshaansh2007/CampusLoop)

## Problem Statement

Students frequently need affordable textbooks, electronics, and academic supplies. At the same time, other students may have usable items they no longer need.

Finding these items through scattered messages and informal channels can be inconvenient. CampusLoop addresses this problem by providing a dedicated marketplace for listing, discovering, and managing pre-owned items.

## Target Users

- Students looking for affordable second-hand products.
- Students who want to sell items they no longer need.
- Campus communities that benefit from reuse and student-to-student commerce.

## Key Features

- **User Authentication:** Register, log in, and log out securely.
- **Marketplace Listings:** Browse available items published by students.
- **Search and Filtering:** Search listings, filter by category, and sort results.
- **Create Listings:** Publish items with a title, description, price, category, and condition.
- **My Listings:** View and manage your own listings.
- **Edit and Delete:** Update listing information or remove listings you own.
- **Availability Management:** Mark an item as sold and reflect its availability in the marketplace.
- **Seller Contact:** Access the seller's available contact methods, including supported messaging and social platforms.
- **Ownership and Access Control:** Restrict listing management actions to the listing owner.

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React, Vite, JavaScript, CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas |
| Data Modeling | Mongoose |
| Authentication | JSON Web Tokens (JWT), bcryptjs |
| API Communication | HTTP and JSON |
| Version Control | Git and GitHub |
| Deployment | Render |

## Architecture

CampusLoop uses a client-server architecture.

1. **Frontend:** The React application provides the marketplace interface and sends API requests to the backend.
2. **Backend:** The Express API handles authentication, listing operations, validation, and authorization.
3. **Database:** MongoDB Atlas persistently stores user and listing data.
4. **Deployment:** The frontend and backend are deployed as separate services on Render, while MongoDB Atlas hosts the database.

```text
User
  |
  v
React + Vite Frontend
  |
  | HTTP / JSON API requests
  v
Express + Node.js Backend
  |
  | Mongoose
  v
MongoDB Atlas
```

## Project Structure

```text
CampusLoop/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── config/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── styles/
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── server/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── index.js
│   └── package.json
├── .gitignore
└── README.md
```

## Run Locally

### Prerequisites

Install the following before running the application:

- Node.js and npm
- Git
- A MongoDB Atlas database or another compatible MongoDB deployment

### 1. Clone the repository

```bash
git clone https://github.com/Akshaansh2007/CampusLoop.git
cd CampusLoop
```

### 2. Configure the backend

Install the backend dependencies:

```bash
cd server
npm install
```

Create a file named `.env` inside the `server/` directory:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_jwt_secret
```

Replace the example values with your own configuration. Never commit real credentials or secret values to GitHub.

Start the backend:

```bash
npm run dev
```

The backend will normally run at `http://localhost:5000`.

### 3. Configure the frontend

Open a second terminal from the project root:

```bash
cd client
npm install
```

Create a `client/.env` file containing:

```env
VITE_API_URL=http://localhost:5000
```

Start the frontend:

```bash
npm run dev
```

Vite will display the local frontend URL, normally `http://localhost:5173`.

### 4. Verify the application

Open the frontend URL displayed by Vite. Ensure that the backend is running and that the configured MongoDB connection is available.

## Environment Variables

| Variable | Location | Purpose |
|---|---|---|
| `MONGODB_URI` | Backend | MongoDB connection string |
| `JWT_SECRET` | Backend | Secret used for JWT authentication |
| `PORT` | Backend | Server port; defaults to `5000` |
| `VITE_API_URL` | Frontend | Base URL of the backend API |

For production, configure these values in the deployment platform's environment settings. The frontend API URL must point to the deployed backend.

**Security note:** Never commit `.env` files, database credentials, JWT secrets, or other private credentials. Variables prefixed with `VITE_` are exposed to frontend code and must not contain secrets.

## API Overview

The backend exposes REST API endpoints for authentication and listing management.

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/auth/register` | Register a user |
| `POST` | `/api/auth/login` | Authenticate a user |
| `GET` | `/api/auth/contact` | Retrieve contact settings |
| `PUT` | `/api/auth/contact` | Update contact settings |
| `GET` | `/api/listings` | Retrieve public available listings |
| `POST` | `/api/listings` | Create a listing |
| `GET` | `/api/listings/mine` | Retrieve the authenticated user's listings |
| `PUT` | `/api/listings/:id` | Update an owned listing |
| `DELETE` | `/api/listings/:id` | Delete an owned listing |
| `PATCH` | `/api/listings/:id/sold` | Mark an owned listing as sold |

Protected endpoints require valid authentication. Listing modifications are subject to server-side ownership checks.

## Deployment

CampusLoop is deployed using Render:

- **Frontend:** [Open CampusLoop](https://campusloop-frontend.onrender.com)
- **Backend:** Express web service hosted on Render.
- **Database:** MongoDB Atlas.

The frontend communicates with the deployed backend through the `VITE_API_URL` environment variable.

## Future Improvements

Potential improvements include stronger automated testing, enhanced listing discovery, and further accessibility and reliability refinements.

## Author

**Akshaansh Rai**

GitHub: [Akshaansh2007](https://github.com/Akshaansh2007)

---

CampusLoop aims to make student-to-student commerce more convenient by bringing item discovery, listing management, and seller contact into one application.
