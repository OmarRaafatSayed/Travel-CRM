#!/usr/bin/env python3
"""List existing users from Supabase profiles table."""
import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

print("\n" + "=" * 70)
print("EXISTING USERS IN DATABASE")
print("=" * 70)

try:
    response = client.table("profiles").select("*").execute()
    
    if response.data:
        for user in response.data:
            print(f"\nUser ID: {user['id']}")
            print(f"Email: {user.get('email', 'N/A')}")
            print(f"Name: {user.get('first_name', '')} {user.get('last_name', '')}")
            print(f"Role: {user.get('role', 'N/A')}")
    else:
        print("\n❌ No users found")
except Exception as e:
    print(f"\n❌ Error: {e}")

print("\n" + "=" * 70 + "\n")
