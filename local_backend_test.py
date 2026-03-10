import requests
import sys
import time

class LocalBackendTester:
    def __init__(self):
        self.base_url = "http://localhost:8001/api"
        self.token = None
        self.tests = []

    def test_api(self, name, method, endpoint, expected_status, data=None):
        """Test API endpoint"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        try:
            if method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=5)
            elif method == 'GET':
                response = requests.get(url, headers=headers, timeout=5)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=5)

            success = response.status_code == expected_status
            self.tests.append({
                "name": name,
                "success": success,
                "status": response.status_code,
                "expected": expected_status
            })
            
            print(f"{'✅' if success else '❌'} {name}: {response.status_code}")
            
            if success:
                try:
                    return response.json() if response.content else {}
                except:
                    return {}
            return None

        except Exception as e:
            self.tests.append({"name": name, "success": False, "error": str(e)})
            print(f"❌ {name}: {str(e)}")
            return None

def main():
    print("🔬 Local Backend API Tests")
    print("=" * 40)
    
    tester = LocalBackendTester()
    
    # Test login
    login_data = tester.test_api(
        "Admin Login", "POST", "auth/login", 200,
        {"email": "admin@pharmainsight.com", "password": "admin123"}
    )
    
    if login_data and 'token' in login_data:
        tester.token = login_data['token']
        admin_id = login_data['user']['id']
        print(f"🔑 Token acquired")
    else:
        print("❌ Login failed")
        return 1

    # Test authenticated endpoints
    tester.test_api("Get Me", "GET", "auth/me", 200)
    users_data = tester.test_api("List Users", "GET", "users", 200)
    tester.test_api("List Reports", "GET", "reports", 200)
    
    # Test user creation and deletion
    new_user = tester.test_api(
        "Create User", "POST", "auth/register", 200,
        {"name": "Test User", "email": "test@example.com", "password": "test123", "role": "analyst"}
    )
    
    if new_user and 'id' in new_user:
        tester.test_api("Delete User", "DELETE", f"users/{new_user['id']}", 200)
    
    # Test report generation
    report_data = tester.test_api(
        "Generate Report", "POST", "reports/generate", 200,
        {"drug_name": "Aspirin", "disease": "Heart Disease", "region": "India", "forecast_horizon": 3}
    )
    
    report_id = None
    if report_data and 'id' in report_data:
        report_id = report_data['id']
        print(f"📊 Report generated: {report_id}")
        
        # Wait a moment and check report
        time.sleep(1)
        tester.test_api("Get Report", "GET", f"reports/{report_id}", 200)
    
    # Test error cases
    tester.test_api("Invalid Login", "POST", "auth/login", 401, 
                   {"email": "wrong@test.com", "password": "wrong"})
    tester.test_api("Get Non-existent Report", "GET", "reports/fake-id", 404)

    # Clean up
    if report_id:
        tester.test_api("Delete Report", "DELETE", f"reports/{report_id}", 200)

    # Results
    total = len(tester.tests)
    passed = sum(1 for t in tester.tests if t.get('success', False))
    print(f"\n📊 Results: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
    
    return 0 if passed >= total * 0.8 else 1

if __name__ == "__main__":
    sys.exit(main())