# 10X CRM

A modern customer relationship management (CRM) system for sales managers to track and manage their client pipeline.

## About

10X CRM is a web-based application designed for sales teams to centralize client information, track deal status, manage communications, and monitor pipeline metrics. Built with Vanilla JavaScript and localStorage, it provides real-time updates without requiring a backend server.

## Features

- **User Authentication** – Sign up, log in, and secure sessions with localStorage
- **Client Management** – Add, view, delete, and edit clients with full contact details
- **Pipeline Tracking** – Organize clients by deal status (Lead, Contacted, Won, Lost)
- **Real-time Search & Filter** – Find clients by name or company, filter by status
- **Smart Sorting** – Sort clients by newest, name, or deal value
- **Client Details** – View full client profile with notes and deal information
- **Notes & Reminders** – Add notes to clients and set 1-minute reminders
- **Dashboard** – Live stats showing total clients, active deals, revenue, and new contacts this week
- **Profile Management** – Edit personal info, change password, reset data
- **Dark/Light Theme** – Toggle between dark and light modes with persistent storage

## Tech Stack

- **Frontend:** Vanilla JavaScript (ES6+)
- **Storage:** Browser localStorage API
- **Styling:** CSS 3 with custom design tokens
- **Data Source:** DummyJSON API (for initial client seed)
- **No dependencies:** Runs entirely in the browser

## How to Run

1. Clone this repository
2. Open `index.html` in your browser (or deploy to Vercel/Netlify)
3. Sign up with a new account or use the test account below
4. Navigate to Clients, Dashboard, or Profile pages using the sidebar

**Localhost:**
```bash
cd 10x-crm
# Serve with any local HTTP server:
python -m http.server 8000
# or
npx serve
```

Then open `http://localhost:8000` in your browser.

## Live Demo

[Deploy to Vercel or Netlify and link here]
https://10x-crm-paata-shvelidze.vercel.app/

## Test Account

For demo purposes, you can create a new account or use these test credentials:

- **Email:** demo@test.com
- **Password:** Demo1234

## File Structure

```
10x-crm/
├── index.html              # Login page
├── signup.html             # Sign up page
├── dashboard.html          # Dashboard (stats, pipeline, recent clients)
├── clients.html            # Clients list with search/filter/sort
├── profile.html            # Profile management
├── css/
│   └── styles.css          # All styles (design tokens, components)
├── js/
│   ├── auth.js             # Authentication logic (signup, login)
│   ├── guard.js            # Route protection
│   ├── shell.js            # Shared sidebar and theme toggle
│   ├── data.js             # Client data layer & API calls
│   ├── clients.js          # Clients page logic
│   ├── dashboard.js        # Dashboard calculations & rendering
│   ├── profile.js          # Profile page logic
│   └── ui.js               # Shared UI helpers (toasts)
├── README.md               # This file
├── ai-log.md               # AI usage documentation
└── .gitignore              # Git ignore file
```

## Data Persistence

All data is stored in the browser's localStorage under the following keys:

- `crm_users` — Array of registered user objects
- `crm_session` — Current user's login session
- `crm_clients` — Array of client objects (persisted from API or local additions)
- `crm_theme` — User's theme preference ("light" or "dark")

## API Integration

The app fetches initial client data from the free [DummyJSON](https://dummyjson.com) API:

- `GET /users?limit=30` — Fetches 30 sample users
- `POST /users/add` — Mocked user creation (returns response but doesn't persist on server)
- `DELETE /users/{id}` — Mocked user deletion

All changes are persisted locally in localStorage.

## Credits

Built as the final project for the 10X Code bootcamp JavaScript module.

Special thanks to:
- [DummyJSON](https://dummyjson.com) for providing free mock API data
- [Google Fonts](https://fonts.google.com) for typography (Space Grotesk, Inter)
- The 10X Code community for feedback and support
