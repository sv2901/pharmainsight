import requests
import sys
import time
from datetime import datetime

class PharmaInsightAPITester:
    def __init__(self, base_url="https://consult-pharma.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.admin_user_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json() if response.content else {}
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_body = response.json()
                    print(f"   Error: {error_body}")
                except:
                    print(f"   Error: {response.text}")

            return success, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_admin_login(self):
        """Test admin login"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@pharmainsight.com", "password": "admin123"}
        )
        if success and 'token' in response:
            self.token = response['token']
            self.admin_user_id = response.get('user', {}).get('id')
            print(f"   🔑 Token acquired, Admin ID: {self.admin_user_id}")
            return True
        return False

    def test_get_me(self):
        """Test /auth/me endpoint"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me", 
            200
        )
        if success:
            print(f"   👤 User: {response.get('name')} ({response.get('role')})")
        return success

    def test_create_analyst_user(self):
        """Test creating a new analyst user"""
        test_user_data = {
            "name": f"Test Analyst {datetime.now().strftime('%H%M%S')}",
            "email": f"analyst_{datetime.now().strftime('%H%M%S')}@test.com",
            "password": "testpass123",
            "role": "analyst"
        }
        success, response = self.run_test(
            "Create Analyst User",
            "POST",
            "auth/register",
            200,
            data=test_user_data
        )
        if success:
            print(f"   👥 Created user: {response.get('name')} (ID: {response.get('id')})")
            return response.get('id')
        return None

    def test_list_users(self):
        """Test listing users"""
        success, response = self.run_test(
            "List Users",
            "GET",
            "users",
            200
        )
        if success:
            print(f"   📋 Found {len(response)} users")
            for user in response[:3]:  # Show first 3 users
                print(f"      - {user.get('name')} ({user.get('role')})")
        return success, response

    def test_delete_user(self, user_id):
        """Test deleting a user"""
        success, response = self.run_test(
            "Delete User",
            "DELETE",
            f"users/{user_id}",
            200
        )
        if success:
            print(f"   🗑️ Deleted user: {user_id}")
        return success

    def test_generate_report(self):
        """Test generating a report"""
        report_data = {
            "drug_name": "Semaglutide",
            "disease": "Type 2 Diabetes",
            "region": "India",
            "forecast_horizon": 5
        }
        success, response = self.run_test(
            "Generate Report",
            "POST",
            "reports/generate",
            200,
            data=report_data
        )
        if success:
            report_id = response.get('id')
            print(f"   📊 Report generated: {report_id} (Status: {response.get('status')})")
            return report_id
        return None

    def test_get_report(self, report_id):
        """Test getting a specific report"""
        success, response = self.run_test(
            "Get Report",
            "GET",
            f"reports/{report_id}",
            200
        )
        if success:
            print(f"   📄 Report: {response.get('drug_name')} - {response.get('status')}")
        return success, response

    def test_list_reports(self):
        """Test listing reports"""
        success, response = self.run_test(
            "List Reports",
            "GET",
            "reports",
            200
        )
        if success:
            print(f"   📁 Found {len(response)} reports")
            for report in response[:3]:  # Show first 3 reports
                print(f"      - {report.get('drug_name')}: {report.get('status')}")
        return success, response

    def test_delete_report(self, report_id):
        """Test deleting a report"""
        success, response = self.run_test(
            "Delete Report",
            "DELETE",
            f"reports/{report_id}",
            200
        )
        if success:
            print(f"   🗑️ Deleted report: {report_id}")
        return success
    
    def test_pdf_export(self, report_id):
        """Test PDF export for completed report"""
        url = f"{self.base_url}/reports/{report_id}/pdf"
        headers = {'Authorization': f'Bearer {self.token}'}
        
        self.tests_run += 1
        print(f"\n🔍 Testing PDF Export for report {report_id}...")
        
        try:
            response = requests.get(url, headers=headers, timeout=30)
            
            if response.status_code == 200:
                # Check if response is actually a PDF
                if response.headers.get('content-type') == 'application/pdf':
                    self.tests_passed += 1
                    print(f"✅ Passed - PDF generated successfully ({len(response.content)} bytes)")
                    return True, response.content
                else:
                    print(f"❌ Failed - Expected PDF, got {response.headers.get('content-type')}")
            elif response.status_code == 400:
                print(f"⚠️ Expected failure - Report not completed yet")
                return False, "Report not completed"
            else:
                print(f"❌ Failed - Status: {response.status_code}")
                
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
        
        return False, {}
    
    def test_quick_insight(self):
        """Test quick insight generation"""
        insight_data = {
            "drug_name": "Adalimumab",
            "disease": "Rheumatoid Arthritis", 
            "region": "India"
        }
        success, response = self.run_test(
            "Generate Quick Insight",
            "POST",
            "quick-insight",
            200,
            data=insight_data
        )
        if success:
            # Check if response has expected fields
            expected_fields = ['opportunity_score', 'go_no_go', 'brief_analysis', 'market_size_estimate_usd_millions']
            missing_fields = [f for f in expected_fields if f not in response]
            if missing_fields:
                print(f"   ⚠️ Missing fields: {missing_fields}")
            else:
                print(f"   💡 Insight: Score {response.get('opportunity_score')}/10, Decision: {response.get('go_no_go')}")
        return success, response
    
    def test_report_comparison(self, report_ids):
        """Test report comparison with list of report IDs"""
        compare_data = {"report_ids": report_ids}
        success, response = self.run_test(
            "Compare Reports",
            "POST", 
            "reports/compare",
            200,
            data=compare_data
        )
        if success:
            print(f"   📊 Comparison: {len(response)} reports returned")
            for i, report in enumerate(response):
                print(f"      {i+1}. {report.get('drug_name')} ({report.get('region')})")
        return success, response

def main():
    print("🚀 Starting PharmaInsight API Testing...")
    print(f"🌐 Testing against: https://consult-pharma.preview.emergentagent.com")
    
    tester = PharmaInsightAPITester()
    
    # Test Authentication Flow
    print("\n" + "="*60)
    print("🔐 AUTHENTICATION TESTS")
    print("="*60)
    
    if not tester.test_admin_login():
        print("❌ Admin login failed, stopping tests")
        return 1

    tester.test_get_me()

    # Test User Management (Admin only)
    print("\n" + "="*60)
    print("👥 USER MANAGEMENT TESTS")
    print("="*60)
    
    users_success, users_list = tester.test_list_users()
    
    # Create and then delete a test user
    test_user_id = tester.test_create_analyst_user()
    if test_user_id:
        time.sleep(1)  # Brief pause
        tester.test_delete_user(test_user_id)

    # Test Report Generation Flow
    print("\n" + "="*60)
    print("📊 REPORT GENERATION TESTS")
    print("="*60)
    
    # List existing reports first
    reports_success, existing_reports = tester.test_list_reports()
    
    # Test Phase 2: Quick Insight Feature
    print("\n" + "="*60)
    print("💡 PHASE 2: QUICK INSIGHT TESTS")
    print("="*60)
    
    tester.test_quick_insight()
    
    # Test Phase 2: Report Comparison
    print("\n" + "="*60) 
    print("📊 PHASE 2: REPORT COMPARISON TESTS")
    print("="*60)
    
    if existing_reports and len(existing_reports) >= 2:
        # Get completed reports for comparison
        completed_reports = [r for r in existing_reports if r.get('status') == 'completed']
        if len(completed_reports) >= 2:
            report_ids = [r['id'] for r in completed_reports[:2]]
            tester.test_report_comparison(report_ids)
        else:
            print("⚠️ Need at least 2 completed reports for comparison test")
    else:
        print("⚠️ Need at least 2 reports for comparison test")
    
    # Test Phase 2: PDF Export
    print("\n" + "="*60)
    print("📄 PHASE 2: PDF EXPORT TESTS") 
    print("="*60)
    
    if existing_reports:
        completed_reports = [r for r in existing_reports if r.get('status') == 'completed']
        if completed_reports:
            # Test PDF export on first completed report
            test_report = completed_reports[0]
            print(f"   📋 Testing PDF export for: {test_report.get('drug_name')} (ID: {test_report.get('id')})")
            tester.test_pdf_export(test_report['id'])
        else:
            print("⚠️ No completed reports found for PDF export test")
    else:
        print("⚠️ No reports found for PDF export test")
    
    # Generate a new report for additional testing
    report_id = tester.test_generate_report()
    if report_id:
        time.sleep(2)  # Allow some processing time
        
        # Check report status
        report_success, report_data = tester.test_get_report(report_id)
        
        # Clean up - delete the test report
        tester.test_delete_report(report_id)

    # Test Invalid Scenarios
    print("\n" + "="*60)
    print("🚫 ERROR HANDLING TESTS")
    print("="*60)
    
    # Test invalid login
    tester.run_test(
        "Invalid Login",
        "POST", 
        "auth/login",
        401,
        data={"email": "invalid@test.com", "password": "wrongpass"}
    )
    
    # Test accessing non-existent report
    tester.run_test(
        "Get Non-existent Report",
        "GET",
        "reports/non-existent-id",
        404
    )

    # Print Final Results
    print("\n" + "="*60)
    print("📊 TEST RESULTS SUMMARY")
    print("="*60)
    print(f"Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run*100):.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("⚠️  Some tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())