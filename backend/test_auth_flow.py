import requests
import sys

BASE_URL = "http://localhost:8000/api/v1"
EMAIL = "admin@ba7ath.com"
PASSWORD = "admin123"

def test_auth():
    print(f"Testing auth on {BASE_URL}...")
    
    # 1. Login
    print("\n1. Logging in...")
    try:
        response = requests.post(f"{BASE_URL}/auth/login", data={"username": EMAIL, "password": PASSWORD})
        if response.status_code != 200:
            print(f"Login failed: {response.status_code} - {response.text}")
            return
        
        token_data = response.json()
        access_token = token_data.get("access_token")
        print(f"Login successful! Token: {access_token[:20]}...")
    except Exception as e:
        print(f"Login failed: {e}")
        return

    # 2. Access protected endpoint (Auth Me)
    print("\n2. Accessing /auth/me (Protected)...")
    headers = {"Authorization": f"Bearer {access_token}"}
    response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
    if response.status_code == 200:
        print(f"Success! User: {response.json().get('email')}")
    else:
        print(f"Failed: {response.status_code} - {response.text}")

    # 3. Access protected endpoint (Stats)
    print("\n3. Accessing /stats/national (Protected)...")
    response = requests.get(f"{BASE_URL}/stats/national", headers=headers)
    if response.status_code == 200:
        print("Success! Stats retrieved.")
    else:
        print(f"Failed: {response.status_code} - {response.text}")

    # 4. Access without token (Expected Failure)
    print("\n4. Accessing /stats/national WITHOUT token...")
    response = requests.get(f"{BASE_URL}/stats/national")
    if response.status_code == 401:
        print("Success! Request rejected as expected (401 Unauthorized).")
    else:
        print(f"Failed! Expected 401, got {response.status_code}")

if __name__ == "__main__":
    test_auth()
