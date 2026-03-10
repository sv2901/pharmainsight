"""
PharmaInsight API Tests - Railway Migration Validation
Tests for authentication, reports, users, and API endpoint availability
"""
import pytest
import requests
import os

# Use PUBLIC URL for testing what users see
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@pharmainsight.com"
ADMIN_PASSWORD = "admin123"


class TestAuthEndpoints:
    """Authentication endpoint tests"""
    
    def test_login_success(self):
        """Test admin login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        }, timeout=30)
        
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data, "No token in response"
        assert "user" in data, "No user in response"
        assert data["user"]["email"] == ADMIN_EMAIL
        assert data["user"]["role"] == "admin"
        print(f"✓ Login successful - token received, user: {data['user']['email']}")
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials returns 401"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@test.com",
            "password": "wrongpassword"
        }, timeout=30)
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ Invalid credentials correctly rejected with 401")
    
    def test_get_me_with_valid_token(self):
        """Test /api/auth/me returns user info with valid token"""
        # First login to get token
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        }, timeout=30)
        token = login_resp.json()["token"]
        
        # Test /me endpoint
        response = requests.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {token}"
        }, timeout=30)
        
        assert response.status_code == 200, f"GET /me failed: {response.text}"
        data = response.json()
        assert data["email"] == ADMIN_EMAIL
        assert data["role"] == "admin"
        print(f"✓ GET /api/auth/me successful - user: {data['email']}")
    
    def test_get_me_without_token(self):
        """Test /api/auth/me without token returns 401"""
        response = requests.get(f"{BASE_URL}/api/auth/me", timeout=30)
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✓ GET /api/auth/me correctly rejected without token")


class TestReportEndpoints:
    """Report management endpoint tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for authenticated requests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        }, timeout=30)
        return response.json()["token"]
    
    def test_list_reports(self, auth_token):
        """Test GET /api/reports returns reports list"""
        response = requests.get(f"{BASE_URL}/api/reports", headers={
            "Authorization": f"Bearer {auth_token}"
        }, timeout=30)
        
        assert response.status_code == 200, f"GET /reports failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ GET /api/reports successful - {len(data)} reports found")
    
    def test_generate_report_accepts_request(self, auth_token):
        """Test POST /api/reports/generate accepts request (may fail on LLM)"""
        response = requests.post(f"{BASE_URL}/api/reports/generate", 
            json={
                "drug_name": "TEST_Aspirin",
                "disease": "Cardiovascular Disease",
                "region": "India",
                "forecast_horizon": 5
            },
            headers={"Authorization": f"Bearer {auth_token}"},
            timeout=30
        )
        
        # Should accept the request with 200 and return report ID
        assert response.status_code == 200, f"Generate report failed: {response.text}"
        data = response.json()
        assert "id" in data, "No report id returned"
        assert "status" in data, "No status returned"
        print(f"✓ POST /api/reports/generate accepted - report_id: {data['id']}, status: {data['status']}")
    
    def test_compare_reports_endpoint_exists(self, auth_token):
        """Test POST /api/reports/compare endpoint exists"""
        response = requests.post(f"{BASE_URL}/api/reports/compare",
            json={"report_ids": ["dummy1", "dummy2"]},
            headers={"Authorization": f"Bearer {auth_token}"},
            timeout=30
        )
        
        # Should return 400 (not enough completed reports) not 404 (endpoint missing)
        assert response.status_code in [200, 400], f"Unexpected status: {response.status_code}"
        print(f"✓ POST /api/reports/compare endpoint exists - status: {response.status_code}")


class TestQuickInsightEndpoint:
    """Quick Insight endpoint tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for authenticated requests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        }, timeout=30)
        return response.json()["token"]
    
    def test_quick_insight_endpoint_exists(self, auth_token):
        """Test POST /api/quick-insight endpoint exists and accepts request"""
        response = requests.post(f"{BASE_URL}/api/quick-insight",
            json={
                "drug_name": "Aspirin",
                "disease": "Pain Management",
                "region": "India"
            },
            headers={"Authorization": f"Bearer {auth_token}"},
            timeout=60  # Longer timeout as this calls LLM
        )
        
        # Should accept request - may succeed or fail depending on LLM key
        # But should NOT return 404 (endpoint missing) or 422 (validation error)
        assert response.status_code in [200, 500], f"Unexpected status: {response.status_code}, response: {response.text}"
        print(f"✓ POST /api/quick-insight endpoint exists - status: {response.status_code}")


class TestUserEndpoints:
    """User management endpoint tests (admin only)"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for authenticated requests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        }, timeout=30)
        return response.json()["token"]
    
    def test_list_users_admin(self, auth_token):
        """Test GET /api/users works for admin"""
        response = requests.get(f"{BASE_URL}/api/users", headers={
            "Authorization": f"Bearer {auth_token}"
        }, timeout=30)
        
        assert response.status_code == 200, f"GET /users failed: {response.text}"
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        # Should have at least the admin user
        assert len(data) >= 1, "Should have at least admin user"
        print(f"✓ GET /api/users (admin) successful - {len(data)} users found")


class TestRailwayConfigFiles:
    """Tests for Railway deployment configuration files"""
    
    def test_procfile_exists(self):
        """Test Procfile exists with correct gunicorn command"""
        procfile_path = "/app/Procfile"
        assert os.path.exists(procfile_path), f"Procfile not found at {procfile_path}"
        
        with open(procfile_path, 'r') as f:
            content = f.read()
        
        assert "gunicorn" in content, "Procfile missing gunicorn"
        assert "uvicorn.workers.UvicornWorker" in content, "Procfile missing UvicornWorker"
        assert "server:app" in content, "Procfile missing server:app"
        print(f"✓ Procfile exists with correct content: {content.strip()}")
    
    def test_runtime_txt_exists(self):
        """Test runtime.txt exists with python version"""
        runtime_path = "/app/runtime.txt"
        assert os.path.exists(runtime_path), f"runtime.txt not found at {runtime_path}"
        
        with open(runtime_path, 'r') as f:
            content = f.read()
        
        assert "python-" in content.lower(), "runtime.txt missing python version"
        print(f"✓ runtime.txt exists with content: {content.strip()}")
    
    def test_requirements_has_openai_not_emergent(self):
        """Test requirements.txt has openai but NOT emergentintegrations"""
        req_path = "/app/backend/requirements.txt"
        assert os.path.exists(req_path), f"requirements.txt not found"
        
        with open(req_path, 'r') as f:
            content = f.read().lower()
        
        assert "openai" in content, "requirements.txt missing openai"
        assert "gunicorn" in content, "requirements.txt missing gunicorn"
        assert "emergentintegrations" not in content, "requirements.txt still has emergentintegrations!"
        print("✓ requirements.txt has openai & gunicorn, no emergentintegrations")


class TestAgentFilesUseOpenAI:
    """Tests that agent files use standard openai SDK"""
    
    def test_market_research_agent_uses_openai(self):
        """Test market_research_agent uses openai AsyncOpenAI"""
        agent_path = "/app/backend/agents/market_research_agent.py"
        with open(agent_path, 'r') as f:
            content = f.read()
        
        assert "from openai import AsyncOpenAI" in content, "Missing openai import"
        assert "emergentintegrations" not in content, "Still has emergentintegrations!"
        print("✓ market_research_agent.py uses standard openai SDK")
    
    def test_forecast_agent_uses_openai(self):
        """Test forecast_agent uses openai AsyncOpenAI"""
        agent_path = "/app/backend/agents/forecast_agent.py"
        with open(agent_path, 'r') as f:
            content = f.read()
        
        assert "from openai import AsyncOpenAI" in content, "Missing openai import"
        assert "emergentintegrations" not in content, "Still has emergentintegrations!"
        print("✓ forecast_agent.py uses standard openai SDK")
    
    def test_strategy_agent_uses_openai(self):
        """Test strategy_agent uses openai AsyncOpenAI"""
        agent_path = "/app/backend/agents/strategy_agent.py"
        with open(agent_path, 'r') as f:
            content = f.read()
        
        assert "from openai import AsyncOpenAI" in content, "Missing openai import"
        assert "emergentintegrations" not in content, "Still has emergentintegrations!"
        print("✓ strategy_agent.py uses standard openai SDK")
    
    def test_quick_insight_agent_uses_openai(self):
        """Test quick_insight_agent uses openai AsyncOpenAI"""
        agent_path = "/app/backend/agents/quick_insight_agent.py"
        with open(agent_path, 'r') as f:
            content = f.read()
        
        assert "from openai import AsyncOpenAI" in content, "Missing openai import"
        assert "emergentintegrations" not in content, "Still has emergentintegrations!"
        print("✓ quick_insight_agent.py uses standard openai SDK")


class TestFrontendAPIConfig:
    """Test frontend API configuration"""
    
    def test_api_js_uses_relative_baseurl(self):
        """Test frontend api.js uses relative /api baseURL"""
        api_path = "/app/frontend/src/lib/api.js"
        with open(api_path, 'r') as f:
            content = f.read()
        
        assert 'baseURL: "/api"' in content, "api.js should use relative /api baseURL"
        assert "REACT_APP_BACKEND_URL" not in content, "api.js should NOT use REACT_APP_BACKEND_URL"
        print("✓ frontend/src/lib/api.js uses relative '/api' baseURL")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
