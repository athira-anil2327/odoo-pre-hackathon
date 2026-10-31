# Database Developer Scripts & Tooling

This directory contains utility scripts to assist team members with connecting, testing, and managing the shared PostgreSQL database.

---

## Available Files

### 1. `teammate_test_connection.py`
A standalone Python script that validates remote connectivity from any teammate's laptop to the centralized database over Tailscale.

**Usage:**
```bash
python teammate_test_connection.py <DB_PASSWORD>
```
Or if `DB_PASSWORD` is set in your environment / `.env`:
```bash
python teammate_test_connection.py
```

**Checks performed:**
- Establishes connection using SQLAlchemy 2.0 and `psycopg` (v3).
- Validates the current user (`brightloop`) and database (`brightloop_db`).
- Prints the server IP and your local client Tailscale IP.
- Confirms the presence of the 22 domain tables.

---

### 2. `TEAMMATE_SETUP_GUIDE.md`
A cross-platform onboarding guide for teammates on **Windows 11**, **Linux**, and **macOS**:
- Tailscale mesh IP parameters.
- Virtual environment creation and package installation commands.
- Exact `.env` configuration template.
- Troubleshooting tips and security instructions.
