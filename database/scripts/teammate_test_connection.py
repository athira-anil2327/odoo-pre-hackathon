#!/usr/bin/env python3
"""
BrightLoop Team Connection Test Script
Run this script from any authorized teammate's laptop to test connectivity
to the BrightLoop PostgreSQL database hosted over Tailscale.

Usage:
    python teammate_test_connection.py <DB_PASSWORD>
"""

import sys
import os

try:
    from sqlalchemy import create_engine, text
except ImportError:
    print("[-] SQLAlchemy not installed. Please run: pip install sqlalchemy psycopg[binary]")
    sys.exit(1)

HOST_TAILSCALE_IP = "100.127.203.13"
DB_PORT = 5432
DB_NAME = "brightloop_db"
DB_USER = "brightloop"

def test_remote_connection(password):
    connection_url = f"postgresql+psycopg://{DB_USER}:{password}@{HOST_TAILSCALE_IP}:{DB_PORT}/{DB_NAME}"
    print(f"[*] Connecting to PostgreSQL over Tailscale at {HOST_TAILSCALE_IP}:{DB_PORT} ...")

    try:
        engine = create_engine(connection_url, echo=False, connect_args={"connect_timeout": 5})
        with engine.connect() as conn:
            # Check server session details
            result = conn.execute(text("""
                SELECT 
                    current_user,
                    current_database(),
                    inet_server_addr(),
                    inet_client_addr(),
                    version()
            """)).fetchone()

            # Query existing public tables
            tables = conn.execute(text("""
                SELECT tablename 
                FROM pg_tables 
                WHERE schemaname = 'public' 
                ORDER BY tablename;
            """)).fetchall()

            table_names = [t[0] for t in tables]

            print("\n[+] SUCCESS: Connected to BrightLoop PostgreSQL over Tailscale!")
            print(f"    - Authenticated User: {result[0]}")
            print(f"    - Database Name:      {result[1]}")
            print(f"    - Server Address:     {result[2]}")
            print(f"    - Your Tailscale IP:  {result[3]}")
            print(f"    - Database Version:   {result[4].split(',')[0]}")
            print(f"    - Tables Found ({len(table_names)}): {', '.join(table_names[:6])}...")
            print("\n[+] Database is fully accessible and ready for Antigravity backend development.")
            return True

    except Exception as e:
        print(f"\n[-] Connection failed: {e}", file=sys.stderr)
        print("\nTroubleshooting tips:", file=sys.stderr)
        print("  1. Verify Tailscale is running and connected on your laptop.", file=sys.stderr)
        print(f"  2. Test Tailscale ping: tailscale ping {HOST_TAILSCALE_IP}", file=sys.stderr)
        print("  3. Double check the database password provided by Sujith.", file=sys.stderr)
        return False

if __name__ == "__main__":
    if len(sys.argv) < 2:
        pwd = os.getenv("DB_PASSWORD")
        if not pwd:
            print("Usage: python teammate_test_connection.py <DB_PASSWORD>")
            print("Or set DB_PASSWORD in your environment / .env file.")
            sys.exit(1)
    else:
        pwd = sys.argv[1]

    success = test_remote_connection(pwd)
    sys.exit(0 if success else 1)
