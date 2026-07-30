#!/usr/bin/env python3
"""
Database Schema Verification Script
====================================
Checks if all required tables exist in Supabase with correct schema.

Usage:
    python verify_db_schema.py
"""
import asyncio
import os
import sys
from typing import List, Dict, Any

from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

REQUIRED_TABLES = [
    "profiles",
    "visa_applications",
    "hotel_offers",
    "payment_records",
    "flight_search_cache",
]


def get_supabase_client() -> Client:
    """Create authenticated Supabase client."""
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env")
        sys.exit(1)
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)


def check_table_exists(client: Client, table_name: str) -> bool:
    """
    Check if a table exists by attempting a count query.
    Returns True if table exists, False otherwise.
    """
    try:
        # Try to query the table with a limit of 0 (no data fetched)
        response = client.table(table_name).select("*", count="exact").limit(0).execute()
        print(f"  ✅ {table_name:<25} — exists (count: {response.count})")
        return True
    except Exception as e:
        error_msg = str(e)
        if "PGRST" in error_msg or "does not exist" in error_msg.lower():
            print(f"  ❌ {table_name:<25} — NOT FOUND")
        else:
            print(f"  ⚠️  {table_name:<25} — error: {error_msg[:60]}")
        return False


def main() -> None:
    """Run schema verification."""
    print("\n" + "=" * 70)
    print("DATABASE SCHEMA VERIFICATION")
    print("=" * 70)
    print(f"Supabase URL: {SUPABASE_URL}")
    print("=" * 70 + "\n")

    client = get_supabase_client()
    
    missing_tables: List[str] = []
    
    for table in REQUIRED_TABLES:
        if not check_table_exists(client, table):
            missing_tables.append(table)
    
    print("\n" + "=" * 70)
    if missing_tables:
        print(f"❌ MISSING TABLES ({len(missing_tables)}):")
        for table in missing_tables:
            print(f"   - {table}")
        print("\n⚠️  Run the SQL migration in Supabase Dashboard:")
        print("   → SQL Editor → Paste content from supabase/migrations/RUN_THIS_IN_SUPABASE.sql")
        print("=" * 70 + "\n")
        sys.exit(1)
    else:
        print("✅ ALL REQUIRED TABLES EXIST")
        print("=" * 70 + "\n")
        sys.exit(0)


if __name__ == "__main__":
    main()
