#!/usr/bin/env python3
"""
Cell Tower OSINT Pro v13.0 Backend API Testing
Test suite for all backend endpoints
"""
import requests
import json
import sys
import time
from datetime import datetime

class CellTowerOSINTTester:
    def __init__(self, base_url="https://flask-gui-enhanced.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def log_test(self, name, success, details=""):
        """Log a test result"""
        self.tests_run += 1
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {name} {details}")
        if success:
            self.tests_passed += 1
        else:
            self.failed_tests.append(f"{name}: {details}")

    def test_root_endpoint(self):
        """Test GET /api/ - operational status"""
        try:
            response = requests.get(f"{self.api_url}/", timeout=10)
            success = response.status_code == 200
            if success:
                data = response.json()
                contains_osint = "Cell Tower OSINT Pro" in data.get("message", "")
                contains_developer = data.get("developer") == "Mr~Wh!te"
                self.log_test("Root Endpoint", success and contains_osint and contains_developer, 
                            f"Status: {response.status_code}, Contains OSINT: {contains_osint}, Developer: {contains_developer}")
                return data
            else:
                self.log_test("Root Endpoint", False, f"Status: {response.status_code}")
                return None
        except Exception as e:
            self.log_test("Root Endpoint", False, f"Error: {str(e)}")
            return None

    def test_stats_endpoint(self):
        """Test GET /api/stats - database statistics"""
        try:
            response = requests.get(f"{self.api_url}/stats", timeout=10)
            success = response.status_code == 200
            if success:
                data = response.json()
                db_stats = data.get("database", {})
                has_total_towers = "total_towers" in db_stats
                total_towers = db_stats.get("total_towers", 0)
                self.log_test("Stats Endpoint", success and has_total_towers, 
                            f"Status: {response.status_code}, Total Towers: {total_towers}")
                return data
            else:
                self.log_test("Stats Endpoint", False, f"Status: {response.status_code}")
                return None
        except Exception as e:
            self.log_test("Stats Endpoint", False, f"Error: {str(e)}")
            return None

    def test_tower_lookup(self):
        """Test POST /api/tower/lookup - specific tower lookup"""
        payload = {"mcc": 310, "mnc": 260, "lac": 7033, "cid": 17811}
        try:
            response = requests.post(f"{self.api_url}/tower/lookup", json=payload, timeout=10)
            success = response.status_code == 200
            if success:
                data = response.json()
                found = data.get("found", False)
                tower = data.get("tower")
                has_coords = tower and tower.get("lat") is not None and tower.get("lon") is not None
                self.log_test("Tower Lookup", success and found and has_coords, 
                            f"Status: {response.status_code}, Found: {found}, Has Coords: {has_coords}")
                return data
            else:
                self.log_test("Tower Lookup", False, f"Status: {response.status_code}")
                return None
        except Exception as e:
            self.log_test("Tower Lookup", False, f"Error: {str(e)}")
            return None

    def test_area_search(self):
        """Test POST /api/area/search - area tower search"""
        payload = {"lat": 38.9072, "lon": -77.0369, "radius": 10}
        try:
            response = requests.post(f"{self.api_url}/area/search", json=payload, timeout=10)
            success = response.status_code == 200
            if success:
                data = response.json()
                towers = data.get("towers", [])
                total = data.get("total", 0)
                self.log_test("Area Search", success and total > 0, 
                            f"Status: {response.status_code}, Towers Found: {total}")
                return data
            else:
                self.log_test("Area Search", False, f"Status: {response.status_code}")
                return None
        except Exception as e:
            self.log_test("Area Search", False, f"Error: {str(e)}")
            return None

    def test_phone_analysis(self):
        """Test POST /api/analyze - phone number analysis"""
        payload = {"phone": "+1 555 123 4567", "deep_scan": False}
        try:
            response = requests.post(f"{self.api_url}/analyze", json=payload, timeout=15)
            success = response.status_code == 200
            if success:
                data = response.json()
                has_confidence = "confidence_score" in data
                has_basic_info = "basic_info" in data
                has_processing_steps = "processing_steps" in data
                all_sections = has_confidence and has_basic_info and has_processing_steps
                self.log_test("Phone Analysis", success and all_sections, 
                            f"Status: {response.status_code}, Has sections: {all_sections}")
                return data
            else:
                self.log_test("Phone Analysis", False, f"Status: {response.status_code}")
                return None
        except Exception as e:
            self.log_test("Phone Analysis", False, f"Error: {str(e)}")
            return None

    def test_settings_endpoint(self):
        """Test GET /api/settings - API keys settings"""
        try:
            response = requests.get(f"{self.api_url}/settings", timeout=10)
            success = response.status_code == 200
            if success:
                data = response.json()
                api_keys = data.get("api_keys", {})
                has_required_keys = all(key in api_keys for key in ["opencellid", "google_geolocation", "numverify"])
                key_count = len(api_keys)
                self.log_test("Settings Endpoint", success and has_required_keys, 
                            f"Status: {response.status_code}, API Keys: {key_count}, Has required: {has_required_keys}")
                return data
            else:
                self.log_test("Settings Endpoint", False, f"Status: {response.status_code}")
                return None
        except Exception as e:
            self.log_test("Settings Endpoint", False, f"Error: {str(e)}")
            return None

    def test_cache_endpoint(self):
        """Test GET /api/cache - cache statistics"""
        try:
            response = requests.get(f"{self.api_url}/cache", timeout=10)
            success = response.status_code == 200
            if success:
                data = response.json()
                has_cache_stats = "hits" in data and "misses" in data
                self.log_test("Cache Endpoint", success and has_cache_stats, 
                            f"Status: {response.status_code}, Has stats: {has_cache_stats}")
                return data
            else:
                self.log_test("Cache Endpoint", False, f"Status: {response.status_code}")
                return None
        except Exception as e:
            self.log_test("Cache Endpoint", False, f"Error: {str(e)}")
            return None

    def run_all_tests(self):
        """Run all backend API tests"""
        print("🚀 Starting Cell Tower OSINT Pro Backend API Tests")
        print(f"📍 Target: {self.api_url}")
        print("=" * 60)

        # Run all tests
        self.test_root_endpoint()
        self.test_stats_endpoint()
        self.test_tower_lookup()
        self.test_area_search()
        self.test_phone_analysis()
        self.test_settings_endpoint()
        self.test_cache_endpoint()

        # Summary
        print("=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        if self.failed_tests:
            print("❌ Failed Tests:")
            for failure in self.failed_tests:
                print(f"   • {failure}")
        
        success_rate = (self.tests_passed / self.tests_run) * 100 if self.tests_run > 0 else 0
        print(f"📈 Success Rate: {success_rate:.1f}%")
        
        return success_rate >= 80

if __name__ == "__main__":
    tester = CellTowerOSINTTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)