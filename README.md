# Colaboratve-Code-Editor
SyncSpace — A modern collaborative coding workspace built with React, Vite, Tailwind CSS, and InsForge, featuring authentication, workspace collaboration, file management, invitations, and live HTML/CSS/JS preview.


#  SyncSpace

> A modern collaborative workspace platform built with React, Vite, and InsForge.

##  Overview

SyncSpace is a collaborative coding workspace platform that allows teams to create shared workspaces, invite collaborators, manage project files, and preview HTML/CSS/JavaScript projects instantly.

The goal of SyncSpace is to provide a lightweight, browser-based collaborative development environment with real-time collaboration capabilities.

---

##  Features

### Authentication

* User signup and login
* Protected routes
* Session management

### Workspace Management

* Create workspaces
* Join via invitation links
* Workspace settings
* Member management

### File Management

* Create files
* Rename files
* Delete files
* Multiple file types support

### Live Preview

* HTML preview
* CSS styling support
* JavaScript execution support
* Instant rendering

### Collaboration

* Workspace invitations
* Presence indicators
* Shared workspace environment

---

##  Current Limitations

The following features are under active development:

* Real-time collaborative editing
* Live cursor synchronization
* Conflict resolution
* Operational transforms / CRDT support

---

## 🛠 Tech Stack

### Frontend

* React
* Vite
* React Router
* Tailwind CSS

### Backend

* InsForge SDK
* Realtime APIs
* Authentication APIs

### Deployment

* GitHub
* Vercel

---

##  Project Structure

```bash
src/
│
├── components/
├── context/
├── lib/
├── pages/
│
├── App.jsx
├── main.jsx
└── index.css
```

---

##  Getting Started

### Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/syncspace.git
cd syncspace
```

### Install dependencies

```bash
npm install
```

### Create environment file

Create:

```bash
.env.local
```

Add:

```env
VITE_INSFORGE_PROJECT_ID=your_project_id
VITE_INSFORGE_API_KEY=your_api_key
```

### Start development server

```bash
npm run dev
```

---

## Build

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

---

### Landing Page

<img width="1472" height="836" alt="image" src="https://github.com/user-attachments/assets/03319a32-1541-46a3-9237-0b1733c34477" />


### Dashboard

<img width="1485" height="839" alt="image" src="https://github.com/user-attachments/assets/3bd47ddc-f327-4a08-b158-2f52bd38b459" />

### Workspace

<img width="1484" height="857" alt="image" src="https://github.com/user-attachments/assets/8f07b3bc-b22f-4b8e-a1a9-79f4a7b87544" />
<img width="1472" height="861" alt="image" src="https://github.com/user-attachments/assets/b8d5859a-bda2-4d44-8696-db9aae584b4c" />

##  Contributing

Contributions, issues, and feature requests are welcome.

## Author

**Ranit Sarkhel**


If you found this project useful, please give it a star.

