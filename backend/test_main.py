"""
Comprehensive tests for CloudCost Estimator API.
Tests cover all endpoints, edge cases, and business logic.
"""

import pytest
from fastapi.testclient import TestClient
from main import app, CloudProvider, ComputeSize, StorageType, DatabaseType

client = TestClient(app)


class TestHealthEndpoints:
    """Tests for health and status endpoints."""
    
    def test_root_endpoint(self):
        """Test root endpoint returns API info."""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "version" in data
        assert data["version"] == "1.0.0"
    
    def test_health_endpoint(self):
        """Test health check endpoint."""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "version" in data


class TestProviderEndpoints:
    """Tests for provider information endpoints."""
    
    def test_get_providers(self):
        """Test getting list of providers."""
        response = client.get("/providers")
        assert response.status_code == 200
        data = response.json()
        
        # Check all providers are present
        assert "aws" in data
        assert "azure" in data
        assert "gcp" in data
        
        # Check provider structure
        for provider in data.values():
            assert "name" in provider
            assert "regions" in provider
            assert isinstance(provider["regions"], list)
    
    def test_get_resource_types(self):
        """Test getting resource types."""
        response = client.get("/resource-types")
        assert response.status_code == 200
        data = response.json()
        
        expected_types = ["compute", "storage", "database", "networking", "serverless"]
        for resource_type in expected_types:
            assert resource_type in data
            assert "description" in data[resource_type]


class TestComputeEstimates:
    """Tests for compute cost estimation."""
    
    @pytest.mark.parametrize("provider", ["aws", "azure", "gcp"])
    def test_compute_estimate_all_providers(self, provider):
        """Test compute estimates work for all providers."""
        response = client.post("/estimate/compute", json={
            "provider": provider,
            "size": "medium",
            "hours_per_month": 730,
            "quantity": 1
        })
        assert response.status_code == 200
        data = response.json()
        assert data["provider"] == provider
        assert data["total_monthly_cost"] > 0
        assert data["total_annual_cost"] == data["total_monthly_cost"] * 12
    
    @pytest.mark.parametrize("size", ["small", "medium", "large", "xlarge"])
    def test_compute_estimate_all_sizes(self, size):
        """Test compute estimates work for all sizes."""
        response = client.post("/estimate/compute", json={
            "provider": "aws",
            "size": size,
            "hours_per_month": 730,
            "quantity": 1
        })
        assert response.status_code == 200
        data = response.json()
        assert len(data["breakdown"]) == 1
        assert size in data["breakdown"][0]["item"].lower()
    
    def test_compute_estimate_multiple_instances(self):
        """Test compute estimates with multiple instances."""
        single = client.post("/estimate/compute", json={
            "provider": "aws",
            "size": "medium",
            "hours_per_month": 730,
            "quantity": 1
        }).json()
        
        multiple = client.post("/estimate/compute", json={
            "provider": "aws",
            "size": "medium",
            "hours_per_month": 730,
            "quantity": 5
        }).json()
        
        assert multiple["total_monthly_cost"] == pytest.approx(single["total_monthly_cost"] * 5, rel=0.01)
    
    def test_compute_estimate_partial_month(self):
        """Test compute estimates for partial month usage."""
        full_month = client.post("/estimate/compute", json={
            "provider": "aws",
            "size": "medium",
            "hours_per_month": 730,
            "quantity": 1
        }).json()
        
        half_month = client.post("/estimate/compute", json={
            "provider": "aws",
            "size": "medium",
            "hours_per_month": 365,
            "quantity": 1
        }).json()
        
        assert half_month["total_monthly_cost"] == pytest.approx(full_month["total_monthly_cost"] / 2, rel=0.01)
    
    def test_compute_estimate_invalid_provider(self):
        """Test compute estimate with invalid provider."""
        response = client.post("/estimate/compute", json={
            "provider": "invalid",
            "size": "medium",
            "hours_per_month": 730,
            "quantity": 1
        })
        assert response.status_code == 422


class TestStorageEstimates:
    """Tests for storage cost estimation."""
    
    @pytest.mark.parametrize("storage_type", ["standard", "premium", "archive"])
    def test_storage_estimate_all_types(self, storage_type):
        """Test storage estimates work for all types."""
        response = client.post("/estimate/storage", json={
            "provider": "aws",
            "storage_type": storage_type,
            "size_gb": 100
        })
        assert response.status_code == 200
        data = response.json()
        assert storage_type in data["breakdown"][0]["item"].lower()
    
    def test_storage_estimate_scales_linearly(self):
        """Test storage costs scale linearly with size."""
        small = client.post("/estimate/storage", json={
            "provider": "aws",
            "storage_type": "standard",
            "size_gb": 100
        }).json()
        
        large = client.post("/estimate/storage", json={
            "provider": "aws",
            "storage_type": "standard",
            "size_gb": 1000
        }).json()
        
        assert large["total_monthly_cost"] == pytest.approx(small["total_monthly_cost"] * 10, rel=0.01)
    
    def test_storage_estimate_archive_cheapest(self):
        """Test that archive storage is cheapest."""
        standard = client.post("/estimate/storage", json={
            "provider": "aws",
            "storage_type": "standard",
            "size_gb": 100
        }).json()
        
        archive = client.post("/estimate/storage", json={
            "provider": "aws",
            "storage_type": "archive",
            "size_gb": 100
        }).json()
        
        assert archive["total_monthly_cost"] < standard["total_monthly_cost"]


class TestFullEstimates:
    """Tests for full infrastructure estimates."""
    
    def test_full_estimate_compute_only(self):
        """Test full estimate with compute only."""
        response = client.post("/estimate/full", json={
            "provider": "aws",
            "compute": {
                "provider": "aws",
                "size": "medium",
                "hours_per_month": 730,
                "quantity": 2
            }
        })
        assert response.status_code == 200
        data = response.json()
        assert len(data["breakdown"]) == 1
        assert "Compute" in data["breakdown"][0]["item"]
    
    def test_full_estimate_all_resources(self):
        """Test full estimate with all resource types."""
        response = client.post("/estimate/full", json={
            "provider": "azure",
            "compute": {
                "provider": "azure",
                "size": "large",
                "hours_per_month": 730,
                "quantity": 3
            },
            "storage": {
                "provider": "azure",
                "storage_type": "premium",
                "size_gb": 500
            },
            "database": {
                "provider": "azure",
                "database_type": "sql",
                "hours_per_month": 730
            },
            "data_transfer_gb": 100,
            "include_load_balancer": True
        })
        assert response.status_code == 200
        data = response.json()
        
        # Should have 5 items: compute, storage, database, data transfer, load balancer
        assert len(data["breakdown"]) == 5
        assert data["total_monthly_cost"] > 0
        
        # Verify all components are present
        items = [b["item"] for b in data["breakdown"]]
        assert any("Compute" in item for item in items)
        assert any("Storage" in item for item in items)
        assert any("Database" in item for item in items)
        assert any("Data Transfer" in item for item in items)
        assert any("Load Balancer" in item for item in items)
    
    def test_full_estimate_empty_resources(self):
        """Test full estimate with no resources."""
        response = client.post("/estimate/full", json={
            "provider": "gcp"
        })
        assert response.status_code == 200
        data = response.json()
        assert len(data["breakdown"]) == 0
        assert data["total_monthly_cost"] == 0


class TestProviderComparison:
    """Tests for provider comparison endpoint."""
    
    def test_compare_default_params(self):
        """Test comparison with default parameters."""
        response = client.post("/compare")
        assert response.status_code == 200
        data = response.json()
        
        assert len(data["estimates"]) == 3  # AWS, Azure, GCP
        assert data["cheapest_provider"] in ["aws", "azure", "gcp"]
        assert data["potential_savings"] >= 0
    
    def test_compare_custom_params(self):
        """Test comparison with custom parameters."""
        response = client.post("/compare?compute_size=large&storage_gb=500&storage_type=premium")
        assert response.status_code == 200
        data = response.json()
        
        # Verify all providers have estimates
        providers = [e["provider"] for e in data["estimates"]]
        assert "aws" in providers
        assert "azure" in providers
        assert "gcp" in providers
    
    def test_compare_finds_cheapest(self):
        """Test that comparison correctly identifies cheapest provider."""
        response = client.post("/compare")
        data = response.json()
        
        cheapest_provider = data["cheapest_provider"]
        cheapest_cost = min(e["total_monthly_cost"] for e in data["estimates"])
        
        cheapest_estimate = next(e for e in data["estimates"] if e["provider"] == cheapest_provider)
        assert cheapest_estimate["total_monthly_cost"] == cheapest_cost


class TestResponseStructure:
    """Tests for API response structure consistency."""
    
    def test_estimate_response_structure(self):
        """Test that estimate responses have consistent structure."""
        response = client.post("/estimate/compute", json={
            "provider": "aws",
            "size": "medium",
            "hours_per_month": 730,
            "quantity": 1
        })
        data = response.json()
        
        # Required fields
        assert "provider" in data
        assert "provider_display_name" in data
        assert "breakdown" in data
        assert "total_monthly_cost" in data
        assert "total_annual_cost" in data
        assert "currency" in data
        
        # Breakdown structure
        for item in data["breakdown"]:
            assert "item" in item
            assert "unit_cost" in item
            assert "quantity" in item
            assert "monthly_cost" in item
    
    def test_currency_is_usd(self):
        """Test that currency is always USD."""
        response = client.post("/estimate/compute", json={
            "provider": "aws",
            "size": "medium",
            "hours_per_month": 730,
            "quantity": 1
        })
        assert response.json()["currency"] == "USD"


class TestEdgeCases:
    """Tests for edge cases and boundary conditions."""
    
    def test_minimum_hours(self):
        """Test with minimum hours per month."""
        response = client.post("/estimate/compute", json={
            "provider": "aws",
            "size": "small",
            "hours_per_month": 1,
            "quantity": 1
        })
        assert response.status_code == 200
        assert response.json()["total_monthly_cost"] > 0
    
    def test_maximum_hours(self):
        """Test with maximum hours per month."""
        response = client.post("/estimate/compute", json={
            "provider": "aws",
            "size": "small",
            "hours_per_month": 744,
            "quantity": 1
        })
        assert response.status_code == 200
    
    def test_minimum_storage(self):
        """Test with minimum storage size."""
        response = client.post("/estimate/storage", json={
            "provider": "aws",
            "storage_type": "standard",
            "size_gb": 0.1
        })
        assert response.status_code == 200
        assert response.json()["total_monthly_cost"] > 0
    
    def test_large_storage(self):
        """Test with large storage size."""
        response = client.post("/estimate/storage", json={
            "provider": "aws",
            "storage_type": "standard",
            "size_gb": 100000
        })
        assert response.status_code == 200
    
    def test_zero_data_transfer(self):
        """Test with zero data transfer."""
        response = client.post("/estimate/full", json={
            "provider": "aws",
            "data_transfer_gb": 0
        })
        assert response.status_code == 200
        # Should not have data transfer in breakdown
        items = [b["item"] for b in response.json()["breakdown"]]
        assert not any("Data Transfer" in item for item in items)


class TestValidation:
    """Tests for input validation."""
    
    def test_invalid_hours_too_low(self):
        """Test validation rejects hours below minimum."""
        response = client.post("/estimate/compute", json={
            "provider": "aws",
            "size": "medium",
            "hours_per_month": 0,
            "quantity": 1
        })
        assert response.status_code == 422
    
    def test_invalid_hours_too_high(self):
        """Test validation rejects hours above maximum."""
        response = client.post("/estimate/compute", json={
            "provider": "aws",
            "size": "medium",
            "hours_per_month": 1000,
            "quantity": 1
        })
        assert response.status_code == 422
    
    def test_invalid_quantity(self):
        """Test validation rejects invalid quantity."""
        response = client.post("/estimate/compute", json={
            "provider": "aws",
            "size": "medium",
            "hours_per_month": 730,
            "quantity": 0
        })
        assert response.status_code == 422
    
    def test_invalid_storage_size(self):
        """Test validation rejects invalid storage size."""
        response = client.post("/estimate/storage", json={
            "provider": "aws",
            "storage_type": "standard",
            "size_gb": -100
        })
        assert response.status_code == 422
    
    def test_missing_required_field(self):
        """Test validation requires provider field."""
        response = client.post("/estimate/compute", json={
            "size": "medium",
            "hours_per_month": 730,
            "quantity": 1
        })
        assert response.status_code == 422


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--cov=main", "--cov-report=term-missing"])
