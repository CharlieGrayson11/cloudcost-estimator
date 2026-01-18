"""
CloudCost Estimator - Backend Tests
Updated for API v3.3.0
"""

import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


class TestHealthEndpoints:
    """Tests for health and info endpoints."""

    def test_root_endpoint(self):
        """Test root endpoint returns API info."""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "version" in data
        assert data["version"] == "3.3.0"

    def test_health_endpoint(self):
        """Test health endpoint returns healthy status."""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "pricing_api_status" in data


class TestProviderEndpoints:
    """Tests for provider information endpoints."""

    def test_get_providers(self):
        """Test providers endpoint returns all providers."""
        response = client.get("/providers")
        assert response.status_code == 200
        data = response.json()
        assert "aws" in data
        assert "azure" in data
        assert "gcp" in data

    def test_get_instance_types(self):
        """Test instance types endpoint."""
        response = client.get("/instance-types")
        assert response.status_code == 200
        data = response.json()
        assert "aws" in data
        assert "azure" in data
        assert "gcp" in data
        # Check AWS instance types
        assert "small" in data["aws"]
        assert "medium" in data["aws"]
        assert data["aws"]["small"]["type"] == "t3.micro"

    def test_get_storage_services(self):
        """Test storage services endpoint."""
        response = client.get("/storage-services")
        assert response.status_code == 200
        data = response.json()
        assert "aws" in data
        assert "azure" in data
        assert "gcp" in data
        assert "standard" in data["aws"]
        assert data["aws"]["standard"]["name"] == "Amazon S3 Standard"

    def test_get_database_services(self):
        """Test database services endpoint."""
        response = client.get("/database-services")
        assert response.status_code == 200
        data = response.json()
        assert "aws" in data
        assert "azure" in data
        assert "gcp" in data
        assert "sql" in data["aws"]
        assert data["aws"]["sql"]["name"] == "Amazon RDS for MySQL"


class TestFullEstimates:
    """Tests for full estimate endpoint."""

    def test_full_estimate_compute_only(self):
        """Test full estimate with compute only."""
        request = {
            "provider": "aws",
            "compute": {"provider": "aws", "size": "medium", "hours_per_month": 730, "quantity": 1},
        }
        response = client.post("/estimate/full", json=request)
        assert response.status_code == 200
        data = response.json()
        assert data["provider"] == "aws"
        assert data["total_monthly_cost"] > 0
        assert len(data["breakdown"]) >= 1

    def test_full_estimate_storage_only(self):
        """Test full estimate with storage only."""
        request = {"provider": "azure", "storage": {"provider": "azure", "storage_type": "standard", "size_gb": 100}}
        response = client.post("/estimate/full", json=request)
        assert response.status_code == 200
        data = response.json()
        assert data["provider"] == "azure"
        assert data["total_monthly_cost"] > 0

    def test_full_estimate_all_resources(self):
        """Test full estimate with all resource types."""
        request = {
            "provider": "gcp",
            "compute": {"provider": "gcp", "size": "large", "hours_per_month": 730, "quantity": 2},
            "storage": {"provider": "gcp", "storage_type": "premium", "size_gb": 500},
            "database": {
                "provider": "gcp",
                "database_type": "sql",
                "tier": "standard",
                "storage_gb": 20,
                "backup_retention_days": 7,
            },
            "data_transfer_gb": 100,
            "include_load_balancer": True,
        }
        response = client.post("/estimate/full", json=request)
        assert response.status_code == 200
        data = response.json()
        assert data["provider"] == "gcp"
        assert data["total_monthly_cost"] > 0
        assert data["total_annual_cost"] == pytest.approx(data["total_monthly_cost"] * 12)
        # Should have compute, storage, database, database_storage, data transfer, load balancer
        assert len(data["breakdown"]) >= 5

    def test_full_estimate_all_providers(self):
        """Test full estimate works for all providers."""
        for provider in ["aws", "azure", "gcp"]:
            request = {
                "provider": provider,
                "compute": {"provider": provider, "size": "small", "hours_per_month": 730, "quantity": 1},
            }
            response = client.post("/estimate/full", json=request)
            assert response.status_code == 200
            data = response.json()
            assert data["provider"] == provider


class TestCompareEndpoint:
    """Tests for compare endpoint."""

    def test_compare_basic(self):
        """Test basic comparison across providers."""
        response = client.post("/compare?compute_size=medium&storage_gb=100&storage_type=standard")
        assert response.status_code == 200
        data = response.json()
        assert "estimates" in data
        assert len(data["estimates"]) == 3
        assert "cheapest_provider" in data
        assert "potential_savings" in data

    def test_compare_with_database(self):
        """Test comparison with database included."""
        response = client.post(
            "/compare?compute_size=medium&storage_gb=100&storage_type=standard"
            "&include_database=true&database_type=sql&database_tier=standard"
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["estimates"]) == 3
        # Each estimate should have database in breakdown
        for estimate in data["estimates"]:
            breakdown_items = [b["item"].lower() for b in estimate["breakdown"]]
            has_database = any("sql" in item or "database" in item or "rds" in item for item in breakdown_items)
            assert has_database

    def test_compare_cheapest_provider(self):
        """Test that cheapest provider is correctly identified."""
        response = client.post("/compare?compute_size=small&storage_gb=50")
        assert response.status_code == 200
        data = response.json()

        # Find the actual cheapest
        costs = {e["provider"]: e["total_monthly_cost"] for e in data["estimates"]}
        actual_cheapest = min(costs, key=costs.get)

        assert data["cheapest_provider"] == actual_cheapest


class TestResponseStructure:
    """Tests for response structure."""

    def test_estimate_response_structure(self):
        """Test that estimate response has correct structure."""
        request = {
            "provider": "aws",
            "compute": {"provider": "aws", "size": "medium", "hours_per_month": 730, "quantity": 1},
        }
        response = client.post("/estimate/full", json=request)
        assert response.status_code == 200
        data = response.json()

        # Check required fields
        assert "provider" in data
        assert "provider_display_name" in data
        assert "breakdown" in data
        assert "total_monthly_cost" in data
        assert "total_annual_cost" in data
        assert "currency" in data
        assert "last_updated" in data
        assert "pricing_note" in data

    def test_breakdown_item_structure(self):
        """Test that breakdown items have correct structure."""
        request = {
            "provider": "azure",
            "compute": {"provider": "azure", "size": "medium", "hours_per_month": 730, "quantity": 1},
        }
        response = client.post("/estimate/full", json=request)
        data = response.json()

        for item in data["breakdown"]:
            assert "item" in item
            assert "unit_cost" in item
            assert "quantity" in item
            assert "monthly_cost" in item
            assert "pricing_source" in item

    def test_currency_is_usd(self):
        """Test that currency is USD."""
        request = {"provider": "gcp", "storage": {"provider": "gcp", "storage_type": "standard", "size_gb": 100}}
        response = client.post("/estimate/full", json=request)
        data = response.json()
        assert data["currency"] == "USD"


class TestValidation:
    """Tests for input validation."""

    def test_invalid_provider(self):
        """Test invalid provider returns error."""
        request = {
            "provider": "invalid",
            "compute": {"provider": "invalid", "size": "medium", "hours_per_month": 730, "quantity": 1},
        }
        response = client.post("/estimate/full", json=request)
        assert response.status_code == 422

    def test_invalid_compute_size(self):
        """Test invalid compute size returns error."""
        request = {
            "provider": "aws",
            "compute": {"provider": "aws", "size": "invalid", "hours_per_month": 730, "quantity": 1},
        }
        response = client.post("/estimate/full", json=request)
        assert response.status_code == 422

    def test_invalid_storage_type(self):
        """Test invalid storage type returns error."""
        request = {"provider": "aws", "storage": {"provider": "aws", "storage_type": "invalid", "size_gb": 100}}
        response = client.post("/estimate/full", json=request)
        assert response.status_code == 422


class TestEdgeCases:
    """Tests for edge cases."""

    def test_empty_request(self):
        """Test request with no resources still returns valid response."""
        request = {"provider": "aws"}
        response = client.post("/estimate/full", json=request)
        assert response.status_code == 200
        data = response.json()
        assert data["total_monthly_cost"] == 0

    def test_large_quantity(self):
        """Test with large quantity of instances."""
        request = {
            "provider": "aws",
            "compute": {"provider": "aws", "size": "small", "hours_per_month": 730, "quantity": 100},
        }
        response = client.post("/estimate/full", json=request)
        assert response.status_code == 200
        data = response.json()
        assert data["total_monthly_cost"] > 0

    def test_partial_month_hours(self):
        """Test with partial month hours."""
        request = {
            "provider": "azure",
            "compute": {"provider": "azure", "size": "medium", "hours_per_month": 100, "quantity": 1},
        }
        response = client.post("/estimate/full", json=request)
        assert response.status_code == 200
        data = response.json()
        assert data["total_monthly_cost"] > 0