# BrightLoop Subscription Management System
## Teammate Tailscale Database Connection Guide

This guide enables all four team members using **Google Antigravity** to connect their local development backend to the centralized PostgreSQL 18 database hosted on Sujith's laptop via the private Tailscale network.

---

### 1. Connection Parameters

| Parameter | Value | Notes |
| :--- | :--- | :--- |
| **Host (Tailscale IP)** | `100.127.203.13` | Sujith's private Tailscale IPv4 address |
| **Database Port** | `5432` | Standard PostgreSQL port |
| **Database Name** | `brightloop_db` | Contains the finalized 22-table schema |
| **Database User** | `brightloop` | Dedicated application user |
| **Authentication** | `SCRAM-SHA-256` | Secure password authentication |
| **Password** | `<DB_PASSWORD>` | *Obtain securely from Sujith via private message* |

---

### 2. SQLAlchemy Connection String Formats (FastAPI Backend)

#### A. Standard Synchronous Engine (`psycopg` v3)
```ini
DATABASE_URL=postgresql+psycopg://brightloop:<DB_PASSWORD>@100.127.203.13:5432/brightloop_db
```

#### B. Asynchronous Engine (`psycopg_async`)
```ini
ASYNC_DATABASE_URL=postgresql+psycopg_async://brightloop:<DB_PASSWORD>@100.127.203.13:5432/brightloop_db
```

---

### 3. Teammate Environment Setup (`.env`)

Each teammate must create a `.env` file in the root of their local workspace with the following content:

```ini
# ==============================================================================
# BrightLoop Remote Database Configuration (Tailscale Private Network)
# ==============================================================================

DB_HOST=100.127.203.13
DB_PORT=5432
DB_NAME=brightloop_db
DB_USER=brightloop
DB_PASSWORD=paste_password_received_from_sujith_here

# SQLAlchemy Connection URLs
DATABASE_URL=postgresql+psycopg://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}
ASYNC_DATABASE_URL=postgresql+psycopg_async://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}

# Application Settings
ENVIRONMENT=development
DEBUG=True
API_V1_STR=/api/v1
```

> [!CAUTION]
> **Never commit your `.env` file to GitHub.** Ensure `.env` is listed in your `.gitignore`.

---

### 4. OS-Specific Driver Installation

Before connecting, install the required database driver packages (`SQLAlchemy` and `psycopg`):

#### On Windows (Ashil - Windows 11)
Open PowerShell in your project directory:
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install --upgrade pip
pip install sqlalchemy "psycopg[binary]"
```

#### On Linux (Athira & Dona - Kali / Ubuntu / Debian)
Open a terminal in your project directory:
```bash
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install sqlalchemy "psycopg[binary]"
```

#### On macOS
Open Terminal:
```bash
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install sqlalchemy "psycopg[binary]"
```

---

### 5. Quick Connectivity Test

Each teammate can test their connection using one of the following methods:

#### Method A: Using the Test Script
Download or copy `scripts/teammate_test_connection.py` to your machine and run:
```bash
python teammate_test_connection.py <DB_PASSWORD>
```

#### Method B: One-Liner Terminal Test
```bash
python -c "
from sqlalchemy import create_engine, text
engine = create_engine('postgresql+psycopg://brightloop:<DB_PASSWORD>@100.127.203.13:5432/brightloop_db')
with engine.connect() as conn:
    print('Connected successfully to:', conn.execute(text('SELECT current_database(), version()')).fetchone())
"
```

#### Method C: Using `psql` (if installed)
```bash
psql -h 100.127.203.13 -U brightloop -d brightloop_db -W
```

---

### 6. Authorized Devices Whitelist

For security, only the following 3 teammate Tailscale IP addresses are permitted to connect:

- **Athira Anil** (`nitro`): `100.109.99.83`
- **Ashil George James** (`laptop-miqd4vs4`): `100.86.235.47`
- **Dona Elsa Jose** (`kali-1`): `100.72.196.37`

Any connection attempt from an unlisted IP, non-Tailscale interface, or the public internet is automatically rejected by the host firewall.
