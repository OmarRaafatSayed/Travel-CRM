#!/usr/bin/env python3
"""Quick API test — no Playwright needed."""
import asyncio
import httpx

async def test():
    # Test login first to get token
    login_url = "http://localhost:8000/api/v1/auth/login"
    login_data = {
        "email": "omarraafat939@gmail.com",
        "password": "your_password_here"  # Replace with actual password
    }
    
    print(f"🔐 Attempting login...")
    
    async with httpx.AsyncClient() as client:
        # Login
        try:
            resp = await client.post(login_url, json=login_data, timeout=10.0)
            if resp.status_code != 200:
                print(f"❌ Login failed: {resp.status_code}")
                print(f"   You need to set the correct password in this script")
                return
            
            data = resp.json()
            token = data.get("session", {}).get("access_token")
            
            if not token:
                print(f"❌ No token in response")
                return
            
            print(f"✅ Logged in! Token: {token[:20]}...")
            
            # Now test flight search
            flight_url = "http://localhost:8000/api/v1/flights/search"
            flight_data = {
                "origin": "CAI",
                "destination": "DXB",
                "departure_date": "2024-12-20",
                "passenger_count": 1,
                "travel_class": "economy"
            }
            
            headers = {"Authorization": f"Bearer {token}"}
            
            print(f"\n✈️  Searching for flights...")
            resp2 = await client.post(flight_url, json=flight_data, headers=headers, timeout=60.0)
            
            print(f"   Status: {resp2.status_code}")
            
            if resp2.status_code == 200:
                result = resp2.json()
                print(f"\n✅ SUCCESS!")
                print(f"   Provider: {result.get('provider')}")
                print(f"   Total Results: {result.get('total_results')}")
                print(f"   Success: {result.get('success')}")
                
                if result.get('flights'):
                    print(f"\n   Sample Flights:")
                    for i, flight in enumerate(result['flights'][:3], 1):
                        print(f"\n   {i}. {flight.get('airline')} {flight.get('flight_number')}")
                        print(f"      {flight.get('departure_time')} → {flight.get('arrival_time')}")
                        print(f"      Price: ${flight.get('price')} | Duration: {flight.get('duration')}")
                        print(f"      Stops: {flight.get('stops')}")
            else:
                error = resp2.json()
                print(f"❌ Flight search failed: {error}")
                
        except Exception as e:
            print(f"❌ Error: {e}")

asyncio.run(test())
