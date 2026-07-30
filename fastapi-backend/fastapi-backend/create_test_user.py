#!/usr/bin/env python3
"""
Create Test User via Backend API
=================================
Creates a test user account for authentication testing.

Usage:
    python create_test_user.py
"""
import asyncio
import os
import sys

import httpx
from dotenv import load_dotenv

load_dotenv()

BASE_URL = os.getenv("API_URL", "http://localhost:8000/api/v1")
TEST_EMAIL = "demo.user@travelcrm.test"
TEST_PASSWORD = "SecurePass123!"


async def create_test_user() -> bool:
    """Create a test user via the /auth/signup endpoint."""
    url = f"{BASE_URL}/auth/signup"
    payload = {
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD,
        "first_name": "Test",
        "last_name": "User",
    }
    
    async with httpx.AsyncClient() as client:
        print(f"Creating test user: {TEST_EMAIL}")
        print(f"POST {url}")
        
        try:
            response = await client.post(url, json=payload, timeout=10.0)
            print(f"Status: {response.status_code}")
            
            if response.status_code in (200, 201):
                data = response.json()
                print(f"✅ User created successfully!")
                print(f"   User ID: {data.get('user', {}).get('id', 'N/A')}")
                print(f"   Email: {data.get('user', {}).get('email', 'N/A')}")
                return True
            elif response.status_code == 400:
                error = response.json()
                if "already registered" in str(error.get('detail', '')).lower():
                    print(f"✅ User already exists — can proceed with testing")
                    return True
                else:
                    print(f"❌ Signup failed: {error.get('detail', 'Unknown error')}")
                    return False
            else:
                error = response.json()
                print(f"❌ Signup failed: {error.get('detail', 'Unknown error')}")
                return False
        except Exception as e:
            print(f"❌ Request failed: {e}")
            return False


async def main() -> None:
    """Run the script."""
    print("=" * 70)
    print("CREATE TEST USER")
    print("=" * 70)
    
    success = await create_test_user()
    
    print("=" * 70)
    if success:
        print("✅ Test user ready!")
        print(f"   Email: {TEST_EMAIL}")
        print(f"   Password: {TEST_PASSWORD}")
        print("\nYou can now run: python test_auth_flow.py")
    else:
        print("❌ Failed to create test user")
    print("=" * 70)
    
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    asyncio.run(main())
