"""
CloudCost Estimator - Backend API
A FastAPI application for estimating cloud resource costs across providers.

This version fetches REAL pricing data from cloud provider APIs:
- Azure: Azure Retail Prices API (no auth required)
- AWS: Prices cached/estimated based on public data
- GCP: Prices cached/estimated based on public data

Best Practice: External API integration ensures up-to-date pricing
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from enum import Enum
import httpx
import asyncio
from functools import lru_cache
from datetime import datetime, timedelta
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="CloudCost Estimator API",
    description="API for estimating cloud resource costs across AWS, Azure, and GCP using real pricing data",
    version="2.0.0"
)

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================
# ENUMS AND MODELS
# ============================================

class CloudProvider(str, Enum):
    AWS = "aws"
    AZURE = "azure"
    GCP = "gcp"


class ResourceType(str, Enum):
    COMPUTE = "compute"
    STORAGE = "storage"
    DATABASE = "database"
    NETWORKING = "networking"
    SERVERLESS = "serverless"


class ComputeSize(str, Enum):
    SMALL = "small"
    MEDIUM = "medium"
    LARGE = "large"
    XLARGE = "xlarge"


class StorageType(str, Enum):
    STANDARD = "standard"
    PREMIUM = "premium"
    ARCHIVE = "archive"


class DatabaseType(str, Enum):
    SQL = "sql"
    NOSQL = "nosql"
    CACHE = "cache"


# Request/Response Models
class ComputeEstimateRequest(BaseModel):
    provider: CloudProvider
    size: ComputeSize
    hours_per_month: int = Field(default=730, ge=1, le=744)
    quantity: int = Field(default=1, ge=1, le=1000)


class StorageEstimateRequest(BaseModel):
    provider: CloudProvider
    storage_type: StorageType
    size_gb: float = Field(ge=0.1, le=1000000)


class DatabaseEstimateRequest(BaseModel):
    provider: CloudProvider
    database_type: DatabaseType
    hours_per_month: int = Field(default=730, ge=1, le=744)


class FullEstimateRequest(BaseModel):
    provider: CloudProvider
    compute: Optional[ComputeEstimateRequest] = None
    storage: Optional[StorageEstimateRequest] = None
    database: Optional[DatabaseEstimateRequest] = None
    data_transfer_gb: float = Field(default=0, ge=0)
    include_load_balancer: bool = False


class CostBreakdown(BaseModel):
    item: str
    unit_cost: float
    quantity: float
    monthly_cost: float
    pricing_source: str  # NEW: Shows where price came from


class EstimateResponse(BaseModel):
    provider: str
    provider_display_name: str
    breakdown: List[CostBreakdown]
    total_monthly_cost: float
    total_annual_cost: float
    currency: str = "USD"
    last_updated: str  # NEW: When prices were fetched
    pricing_note: str  # NEW: Information about pricing source


class ComparisonResponse(BaseModel):
    estimates: List[EstimateResponse]
    cheapest_provider: str
    potential_savings: float


class HealthResponse(BaseModel):
    status: str
    version: str
    pricing_api_status: str


# ============================================
# PRICING SERVICE - Fetches Real Prices
# ============================================

class PricingService:
    """
    Service to fetch real pricing data from cloud provider APIs.
    
    Best Practices Implemented:
    - Caching to reduce API calls
    - Fallback values if API fails
    - Async HTTP requests for performance
    - Logging for debugging
    """
    
    def __init__(self):
        self.cache: Dict[str, dict] = {}
        self.cache_expiry: Dict[str, datetime] = {}
        self.cache_duration = timedelta(hours=1)  # Cache prices for 1 hour
        
        # Azure VM SKU mappings
        self.azure_vm_skus = {
            ComputeSize.SMALL: "Standard_B1s",
            ComputeSize.MEDIUM: "Standard_B2s", 
            ComputeSize.LARGE: "Standard_B4ms",
            ComputeSize.XLARGE: "Standard_B8ms",
        }
        
        # Azure Storage SKU mappings
        self.azure_storage_skus = {
            StorageType.STANDARD: "Hot LRS",
            StorageType.PREMIUM: "Premium LRS",
            StorageType.ARCHIVE: "Archive LRS",
        }
        
        # Fallback prices (used if API fails)
        self.fallback_prices = {
            CloudProvider.AWS: {
                "compute": {ComputeSize.SMALL: 0.0116, ComputeSize.MEDIUM: 0.0464, ComputeSize.LARGE: 0.0928, ComputeSize.XLARGE: 0.1856},
                "storage": {StorageType.STANDARD: 0.023, StorageType.PREMIUM: 0.125, StorageType.ARCHIVE: 0.004},
                "database": {DatabaseType.SQL: 0.017, DatabaseType.NOSQL: 1.25, DatabaseType.CACHE: 0.017},
                "data_transfer": 0.09,
                "load_balancer": 0.0225,
            },
            CloudProvider.AZURE: {
                "compute": {ComputeSize.SMALL: 0.0104, ComputeSize.MEDIUM: 0.0416, ComputeSize.LARGE: 0.0832, ComputeSize.XLARGE: 0.166},
                "storage": {StorageType.STANDARD: 0.0184, StorageType.PREMIUM: 0.15, StorageType.ARCHIVE: 0.00099},
                "database": {DatabaseType.SQL: 0.0149, DatabaseType.NOSQL: 0.008, DatabaseType.CACHE: 0.022},
                "data_transfer": 0.087,
                "load_balancer": 0.025,
            },
            CloudProvider.GCP: {
                "compute": {ComputeSize.SMALL: 0.0104, ComputeSize.MEDIUM: 0.0335, ComputeSize.LARGE: 0.067, ComputeSize.XLARGE: 0.134},
                "storage": {StorageType.STANDARD: 0.020, StorageType.PREMIUM: 0.17, StorageType.ARCHIVE: 0.0012},
                "database": {DatabaseType.SQL: 0.0105, DatabaseType.NOSQL: 0.18, DatabaseType.CACHE: 0.016},
                "data_transfer": 0.12,
                "load_balancer": 0.025,
            },
        }
    
    def _is_cache_valid(self, key: str) -> bool:
        """Check if cached data is still valid."""
        if key not in self.cache_expiry:
            return False
        return datetime.now() < self.cache_expiry[key]
    
    def _set_cache(self, key: str, data: dict):
        """Store data in cache with expiry."""
        self.cache[key] = data
        self.cache_expiry[key] = datetime.now() + self.cache_duration
    
    async def fetch_azure_vm_price(self, size: ComputeSize, region: str = "uksouth") -> tuple[float, str]:
        """
        Fetch real VM pricing from Azure Retail Prices API.
        
        API Documentation: https://docs.microsoft.com/en-us/rest/api/cost-management/retail-prices/azure-retail-prices
        """
        cache_key = f"azure_vm_{size}_{region}"
        
        if self._is_cache_valid(cache_key):
            return self.cache[cache_key]["price"], "Azure Retail Prices API (cached)"
        
        sku_name = self.azure_vm_skus[size]
        
        # Azure Retail Prices API - FREE, no authentication required
        api_url = "https://prices.azure.com/api/retail/prices"
        params = {
            "$filter": f"serviceName eq 'Virtual Machines' and armSkuName eq '{sku_name}' and armRegionName eq '{region}' and priceType eq 'Consumption'",
            "$top": 1
        }
        
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(api_url, params=params)
                response.raise_for_status()
                data = response.json()
                
                if data.get("Items") and len(data["Items"]) > 0:
                    price = data["Items"][0]["retailPrice"]
                    self._set_cache(cache_key, {"price": price})
                    logger.info(f"Fetched Azure VM price for {sku_name}: ${price}/hour")
                    return price, "Azure Retail Prices API (live)"
                    
        except Exception as e:
            logger.warning(f"Failed to fetch Azure VM price: {e}")
        
        # Fallback to cached/default price
        return self.fallback_prices[CloudProvider.AZURE]["compute"][size], "Fallback (API unavailable)"
    
    async def fetch_azure_storage_price(self, storage_type: StorageType, region: str = "uksouth") -> tuple[float, str]:
        """
        Fetch real storage pricing from Azure Retail Prices API.
        """
        cache_key = f"azure_storage_{storage_type}_{region}"
        
        if self._is_cache_valid(cache_key):
            return self.cache[cache_key]["price"], "Azure Retail Prices API (cached)"
        
        # Map storage type to Azure product name
        product_mapping = {
            StorageType.STANDARD: "Blob Storage",
            StorageType.PREMIUM: "Premium SSD Managed Disks",
            StorageType.ARCHIVE: "Blob Storage",
        }
        
        tier_mapping = {
            StorageType.STANDARD: "Hot",
            StorageType.PREMIUM: "P10",
            StorageType.ARCHIVE: "Archive",
        }
        
        api_url = "https://prices.azure.com/api/retail/prices"
        
        try:
            if storage_type == StorageType.STANDARD:
                params = {
                    "$filter": f"serviceName eq 'Storage' and armRegionName eq '{region}' and skuName eq 'Hot LRS' and meterName eq 'Hot LRS Data Stored'",
                    "$top": 1
                }
            elif storage_type == StorageType.ARCHIVE:
                params = {
                    "$filter": f"serviceName eq 'Storage' and armRegionName eq '{region}' and skuName eq 'Archive LRS' and meterName eq 'Archive LRS Data Stored'",
                    "$top": 1
                }
            else:  # Premium
                params = {
                    "$filter": f"serviceName eq 'Storage' and armRegionName eq '{region}' and productName eq 'Premium SSD Managed Disks'",
                    "$top": 1
                }
            
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(api_url, params=params)
                response.raise_for_status()
                data = response.json()
                
                if data.get("Items") and len(data["Items"]) > 0:
                    price = data["Items"][0]["retailPrice"]
                    self._set_cache(cache_key, {"price": price})
                    logger.info(f"Fetched Azure storage price for {storage_type}: ${price}/GB")
                    return price, "Azure Retail Prices API (live)"
                    
        except Exception as e:
            logger.warning(f"Failed to fetch Azure storage price: {e}")
        
        return self.fallback_prices[CloudProvider.AZURE]["storage"][storage_type], "Fallback (API unavailable)"
    
    async def get_compute_price(self, provider: CloudProvider, size: ComputeSize) -> tuple[float, str]:
        """Get compute price for any provider."""
        if provider == CloudProvider.AZURE:
            return await self.fetch_azure_vm_price(size)
        else:
            # AWS and GCP - use reference prices (could be extended to use their APIs)
            return self.fallback_prices[provider]["compute"][size], f"{provider.value.upper()} Public Pricing Data"
    
    async def get_storage_price(self, provider: CloudProvider, storage_type: StorageType) -> tuple[float, str]:
        """Get storage price for any provider."""
        if provider == CloudProvider.AZURE:
            return await self.fetch_azure_storage_price(storage_type)
        else:
            return self.fallback_prices[provider]["storage"][storage_type], f"{provider.value.upper()} Public Pricing Data"
    
    async def get_database_price(self, provider: CloudProvider, db_type: DatabaseType) -> tuple[float, str]:
        """Get database price for any provider."""
        return self.fallback_prices[provider]["database"][db_type], f"{provider.value.upper()} Public Pricing Data"
    
    async def get_networking_price(self, provider: CloudProvider, resource: str) -> tuple[float, str]:
        """Get networking price for any provider."""
        if resource == "data_transfer":
            return self.fallback_prices[provider]["data_transfer"], f"{provider.value.upper()} Public Pricing Data"
        elif resource == "load_balancer":
            return self.fallback_prices[provider]["load_balancer"], f"{provider.value.upper()} Public Pricing Data"
        return 0.0, "Unknown"
    
    async def check_api_status(self) -> str:
        """Check if pricing APIs are accessible."""
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get("https://prices.azure.com/api/retail/prices?$top=1")
                if response.status_code == 200:
                    return "healthy"
        except:
            pass
        return "degraded (using fallback prices)"


# Initialize pricing service
pricing_service = PricingService()


# Provider display names
PROVIDER_INFO = {
    CloudProvider.AWS: {"name": "Amazon Web Services", "regions": ["us-east-1", "us-west-2", "eu-west-1", "ap-southeast-1"]},
    CloudProvider.AZURE: {"name": "Microsoft Azure", "regions": ["uksouth", "eastus", "westeurope", "southeastasia"]},
    CloudProvider.GCP: {"name": "Google Cloud Platform", "regions": ["us-central1", "europe-west1", "asia-southeast1"]},
}


# ============================================
# API ENDPOINTS
# ============================================

@app.get("/", response_model=dict)
async def root():
    """Root endpoint with API information."""
    return {
        "message": "CloudCost Estimator API",
        "version": "2.0.0",
        "docs": "/docs",
        "features": [
            "Real-time Azure pricing via Azure Retail Prices API",
            "AWS and GCP pricing from public data",
            "Automatic price caching for performance",
            "Fallback prices if APIs unavailable"
        ]
    }


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint with API status."""
    api_status = await pricing_service.check_api_status()
    return HealthResponse(
        status="healthy",
        version="2.0.0",
        pricing_api_status=api_status
    )


@app.get("/providers", response_model=dict)
async def get_providers():
    """Get list of supported cloud providers."""
    return {
        provider.value: {
            "name": info["name"],
            "regions": info["regions"],
        }
        for provider, info in PROVIDER_INFO.items()
    }


@app.get("/resource-types", response_model=dict)
async def get_resource_types():
    """Get available resource types and their options."""
    return {
        "compute": {"sizes": [s.value for s in ComputeSize], "description": "Virtual machines and compute instances"},
        "storage": {"types": [s.value for s in StorageType], "description": "Object storage, block storage, and archives"},
        "database": {"types": [d.value for d in DatabaseType], "description": "Managed database services"},
        "networking": {"options": ["data_transfer", "load_balancer"], "description": "Network and data transfer costs"},
    }


@app.post("/estimate/compute", response_model=EstimateResponse)
async def estimate_compute(request: ComputeEstimateRequest):
    """Estimate compute costs with real pricing data."""
    hourly_rate, source = await pricing_service.get_compute_price(request.provider, request.size)
    monthly_cost = hourly_rate * request.hours_per_month * request.quantity
    
    return EstimateResponse(
        provider=request.provider.value,
        provider_display_name=PROVIDER_INFO[request.provider]["name"],
        breakdown=[
            CostBreakdown(
                item=f"Compute ({request.size.value}) x{request.quantity}",
                unit_cost=hourly_rate,
                quantity=request.hours_per_month * request.quantity,
                monthly_cost=monthly_cost,
                pricing_source=source,
            )
        ],
        total_monthly_cost=round(monthly_cost, 2),
        total_annual_cost=round(monthly_cost * 12, 2),
        last_updated=datetime.now().isoformat(),
        pricing_note=f"Prices fetched from {source}",
    )


@app.post("/estimate/storage", response_model=EstimateResponse)
async def estimate_storage(request: StorageEstimateRequest):
    """Estimate storage costs with real pricing data."""
    monthly_rate, source = await pricing_service.get_storage_price(request.provider, request.storage_type)
    monthly_cost = monthly_rate * request.size_gb
    
    return EstimateResponse(
        provider=request.provider.value,
        provider_display_name=PROVIDER_INFO[request.provider]["name"],
        breakdown=[
            CostBreakdown(
                item=f"Storage ({request.storage_type.value})",
                unit_cost=monthly_rate,
                quantity=request.size_gb,
                monthly_cost=monthly_cost,
                pricing_source=source,
            )
        ],
        total_monthly_cost=round(monthly_cost, 2),
        total_annual_cost=round(monthly_cost * 12, 2),
        last_updated=datetime.now().isoformat(),
        pricing_note=f"Prices fetched from {source}",
    )


@app.post("/estimate/full", response_model=EstimateResponse)
async def estimate_full(request: FullEstimateRequest):
    """Get a full cost estimate with real pricing data."""
    breakdown = []
    total = 0.0
    sources = set()
    
    # Compute costs
    if request.compute:
        hourly_rate, source = await pricing_service.get_compute_price(request.provider, request.compute.size)
        compute_cost = hourly_rate * request.compute.hours_per_month * request.compute.quantity
        breakdown.append(CostBreakdown(
            item=f"Compute ({request.compute.size.value}) x{request.compute.quantity}",
            unit_cost=hourly_rate,
            quantity=request.compute.hours_per_month * request.compute.quantity,
            monthly_cost=compute_cost,
            pricing_source=source,
        ))
        total += compute_cost
        sources.add(source)
    
    # Storage costs
    if request.storage:
        monthly_rate, source = await pricing_service.get_storage_price(request.provider, request.storage.storage_type)
        storage_cost = monthly_rate * request.storage.size_gb
        breakdown.append(CostBreakdown(
            item=f"Storage ({request.storage.storage_type.value})",
            unit_cost=monthly_rate,
            quantity=request.storage.size_gb,
            monthly_cost=storage_cost,
            pricing_source=source,
        ))
        total += storage_cost
        sources.add(source)
    
    # Database costs
    if request.database:
        hourly_rate, source = await pricing_service.get_database_price(request.provider, request.database.database_type)
        db_cost = hourly_rate * request.database.hours_per_month
        breakdown.append(CostBreakdown(
            item=f"Database ({request.database.database_type.value})",
            unit_cost=hourly_rate,
            quantity=request.database.hours_per_month,
            monthly_cost=db_cost,
            pricing_source=source,
        ))
        total += db_cost
        sources.add(source)
    
    # Networking costs
    if request.data_transfer_gb > 0:
        transfer_rate, source = await pricing_service.get_networking_price(request.provider, "data_transfer")
        transfer_cost = transfer_rate * request.data_transfer_gb
        breakdown.append(CostBreakdown(
            item="Data Transfer Out",
            unit_cost=transfer_rate,
            quantity=request.data_transfer_gb,
            monthly_cost=transfer_cost,
            pricing_source=source,
        ))
        total += transfer_cost
        sources.add(source)
    
    if request.include_load_balancer:
        lb_rate, source = await pricing_service.get_networking_price(request.provider, "load_balancer")
        lb_cost = lb_rate * 730
        breakdown.append(CostBreakdown(
            item="Load Balancer",
            unit_cost=lb_rate,
            quantity=730,
            monthly_cost=lb_cost,
            pricing_source=source,
        ))
        total += lb_cost
        sources.add(source)
    
    return EstimateResponse(
        provider=request.provider.value,
        provider_display_name=PROVIDER_INFO[request.provider]["name"],
        breakdown=breakdown,
        total_monthly_cost=round(total, 2),
        total_annual_cost=round(total * 12, 2),
        last_updated=datetime.now().isoformat(),
        pricing_note=f"Prices from: {', '.join(sources)}" if sources else "No resources selected",
    )


@app.post("/compare", response_model=ComparisonResponse)
async def compare_providers(
    compute_size: ComputeSize = ComputeSize.MEDIUM,
    storage_gb: float = 100,
    storage_type: StorageType = StorageType.STANDARD,
    hours_per_month: int = 730,
):
    """Compare costs across all providers using real pricing data."""
    estimates = []
    
    for provider in CloudProvider:
        compute_request = ComputeEstimateRequest(
            provider=provider,
            size=compute_size,
            hours_per_month=hours_per_month,
            quantity=1,
        )
        storage_request = StorageEstimateRequest(
            provider=provider,
            storage_type=storage_type,
            size_gb=storage_gb,
        )
        full_request = FullEstimateRequest(
            provider=provider,
            compute=compute_request,
            storage=storage_request,
        )
        
        estimate = await estimate_full(full_request)
        estimates.append(estimate)
    
    # Find cheapest
    sorted_estimates = sorted(estimates, key=lambda x: x.total_monthly_cost)
    cheapest = sorted_estimates[0]
    most_expensive = sorted_estimates[-1]
    
    return ComparisonResponse(
        estimates=estimates,
        cheapest_provider=cheapest.provider,
        potential_savings=round(most_expensive.total_monthly_cost - cheapest.total_monthly_cost, 2),
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)