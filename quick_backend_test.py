import requests
import sys
import time
from datetime import datetime

class QuickAPITester:
    def __init__(self, base_url="https://consult-pharma.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def test_api(self, name, method, endpoint, expected_status, data=None):
        """Quick API test with shorter timeout"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"Testing {name}...", end=' ')
        
        try:
            if method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            if response.status_code == expected_status:
                self.tests_passed += 1
                print(f"✅ {response.status_code}")
                try:
                    return True, response.json() if response.content else {}
                except:
                    return True, {}
            else:
                print(f"❌ Got {response.status_code}, expected {expected_status}")
                self.failed_tests.append(f"{name}: {response.status_code}")
                return False, {}

        except Exception as e:
            print(f"❌ Error: {str(e)[:50]}...")
            self.failed_tests.append(f"{name}: {str(e)}")
            return False, {}

def main():
    print("🧪 Quick PharmaInsight API Test")
    print("=" * 50)
    
    tester = QuickAPITester()
    
    # Test login
    success, response = tester.test_api(
        "Admin Login", "POST", "auth/login", 200,
        {"email": "admin@pharmainsight.com", "password": "admin123"}
    )
    
    if success and 'token' in response:
        tester.token = response['token']
        print(f"🔑 Token acquired for {response['user']['name']}")
    else:
        print("❌ Login failed - cannot continue")
        return 1

    # Test authenticated endpoints
    tester.test_api("Get Me", "GET", "auth/me", 200)
    tester.test_api("List Users", "GET", "users", 200)
    tester.test_api("List Reports", "GET", "reports", 200)
    
    # Test report generation
    report_success, report_data = tester.test_api(
        "Generate Report", "POST", "reports/generate", 200,
        {"drug_name": "Aspirin", "disease": "Heart Disease", "region": "India", "forecast_horizon": 3}
    )
    
    if report_success:
        report_id = report_data.get('id')
        print(f"📊 Report ID: {report_id}")
        time.sleep(1)
        tester.test_api(f"Get Report", "GET", f"reports/{report_id}", 200)

    # Test error cases
    tester.test_api("Invalid Login", "POST", "auth/login", 401, 
                   {"email": "wrong@test.com", "password": "wrong"})
    
    print("\n" + "=" * 50)
    print(f"📊 Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if tester.failed_tests:
        print("❌ Failed Tests:")
        for failure in tester.failed_tests:
            print(f"   - {failure}")
    
    success_rate = (tester.tests_passed / tester.tests_run) * 100
    print(f"✨ Success Rate: {success_rate:.1f}%")
    
    return 0 if success_rate >= 80 else 1

if __name__ == "__main__":
    sys.exit(main())