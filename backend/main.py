"""
CloudCost Estimator - Backend API
A FastAPI application for estimating cloud resource costs across providers.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum
import uvicorn

app = FastAPI(
    title="CloudCost Estimator API",
    description="API for estimating cloud resource costs across AWS, Azure, and GCP",
    version="1.0.0"
)

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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


# Pricing data (simplified - in production, fetch from provider APIs)
PRICING_DATA = {
    CloudProvider.AWS: {
        ResourceType.COMPUTE: {
            ComputeSize.SMALL: 0.0116,    # t3.micro per hour
            ComputeSize.MEDIUM: 0.0464,   # t3.medium per hour
            ComputeSize.LARGE: 0.0928,    # t3.large per hour
            ComputeSize.XLARGE: 0.1856,   # t3.xlarge per hour
        },
        ResourceType.STORAGE: {
            StorageType.STANDARD: 0.023,   # S3 Standard per GB/month
            StorageType.PREMIUM: 0.125,    # EBS gp3 per GB/month
            StorageType.ARCHIVE: 0.004,    # S3 Glacier per GB/month
        },
        ResourceType.DATABASE: {
            DatabaseType.SQL: 0.017,       # RDS MySQL db.t3.micro per hour
            DatabaseType.NOSQL: 1.25,      # DynamoDB per million WCU
            DatabaseType.CACHE: 0.017,     # ElastiCache per hour
        },
        ResourceType.NETWORKING: {
            "data_transfer_out": 0.09,     # Per GB
            "load_balancer": 0.0225,       # ALB per hour
        },
        ResourceType.SERVERLESS: {
            "lambda_requests": 0.20,       # Per million requests
            "lambda_duration": 0.0000166667,  # Per GB-second
        },
    },
    CloudProvider.AZURE: {
        ResourceType.COMPUTE: {
            ComputeSize.SMALL: 0.0104,    # B1s per hour
            ComputeSize.MEDIUM: 0.0416,   # B2s per hour
            ComputeSize.LARGE: 0.0832,    # B4ms per hour
            ComputeSize.XLARGE: 0.166,    # B8ms per hour
        },
        ResourceType.STORAGE: {
            StorageType.STANDARD: 0.0184,  # Blob Hot per GB/month
            StorageType.PREMIUM: 0.15,     # Premium SSD per GB/month
            StorageType.ARCHIVE: 0.00099,  # Archive per GB/month
        },
        ResourceType.DATABASE: {
            DatabaseType.SQL: 0.0149,      # Azure SQL Basic per hour
            DatabaseType.NOSQL: 0.008,     # Cosmos DB per RU/s/hour
            DatabaseType.CACHE: 0.022,     # Redis Cache per hour
        },
        ResourceType.NETWORKING: {
            "data_transfer_out": 0.087,    # Per GB
            "load_balancer": 0.025,        # App Gateway per hour
        },
        ResourceType.SERVERLESS: {
            "function_requests": 0.20,     # Per million executions
            "function_duration": 0.000016, # Per GB-second
        },
    },
    CloudProvider.GCP: {
        ResourceType.COMPUTE: {
            ComputeSize.SMALL: 0.0104,    # e2-micro per hour
            ComputeSize.MEDIUM: 0.0335,   # e2-medium per hour
            ComputeSize.LARGE: 0.067,     # e2-standard-2 per hour
            ComputeSize.XLARGE: 0.134,    # e2-standard-4 per hour
        },
        ResourceType.STORAGE: {
            StorageType.STANDARD: 0.020,   # Cloud Storage Standard per GB/month
            StorageType.PREMIUM: 0.17,     # Persistent SSD per GB/month
            StorageType.ARCHIVE: 0.0012,   # Archive per GB/month
        },
        ResourceType.DATABASE: {
            DatabaseType.SQL: 0.0105,      # Cloud SQL per hour
            DatabaseType.NOSQL: 0.18,      # Firestore per 100k reads
            DatabaseType.CACHE: 0.016,     # Memorystore per GB/hour
        },
        ResourceType.NETWORKING: {
            "data_transfer_out": 0.12,     # Per GB (varies by region)
            "load_balancer": 0.025,        # Per hour
        },
        ResourceType.SERVERLESS: {
            "function_requests": 0.40,     # Per million invocations
            "function_duration": 0.0000025,# Per GB-second
        },
    },
}

# Provider display names and regions
PROVIDER_INFO = {
    CloudProvider.AWS: {
        "name": "Amazon Web Services",
        "regions": ["us-east-1", "us-west-2", "eu-west-1", "ap-southeast-1"],
    },
    CloudProvider.AZURE: {
        "name": "Microsoft Azure",
        "regions": ["eastus", "westus2", "westeurope", "southeastasia"],
    },
    CloudProvider.GCP: {
        "name": "Google Cloud Platform",
        "regions": ["us-central1", "us-west1", "europe-west1", "asia-southeast1"],
    },
}


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


class EstimateResponse(BaseModel):
    provider: str
    provider_display_name: str
    breakdown: List[CostBreakdown]
    total_monthly_cost: float
    total_annual_cost: float
    currency: str = "USD"


class ComparisonResponse(BaseModel):
    estimates: List[EstimateResponse]
    cheapest_provider: str
    potential_savings: float


class HealthResponse(BaseModel):
    status: str
    version: str


# API Endpoints
@app.get("/", response_model=dict)
async def root():
    """Root endpoint with API information."""
    return {
        "message": "CloudCost Estimator API",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint for container orchestration."""
    return HealthResponse(status="healthy", version="1.0.0")


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
        "compute": {
            "sizes": [size.value for size in ComputeSize],
            "description": "Virtual machines and compute instances",
        },
        "storage": {
            "types": [st.value for st in StorageType],
            "description": "Object storage, block storage, and archives",
        },
        "database": {
            "types": [dt.value for dt in DatabaseType],
            "description": "Managed database services",
        },
        "networking": {
            "options": ["data_transfer", "load_balancer"],
            "description": "Network and data transfer costs",
        },
        "serverless": {
            "options": ["functions"],
            "description": "Serverless compute services",
        },
    }


@app.post("/estimate/compute", response_model=EstimateResponse)
async def estimate_compute(request: ComputeEstimateRequest):
    """Estimate compute costs for a specific provider."""
    pricing = PRICING_DATA[request.provider][ResourceType.COMPUTE]
    hourly_rate = pricing[request.size]
    monthly_cost = hourly_rate * request.hours_per_month * request.quantity
    
    return EstimateResponse(
        provider=request.provider.value,
        provider_display_name=PROVIDER_INFO[request.provider]["name"],
        breakdown=[
            CostBreakdown(
                item=f"Compute ({request.size.value})",
                unit_cost=hourly_rate,
                quantity=request.hours_per_month * request.quantity,
                monthly_cost=monthly_cost,
            )
        ],
        total_monthly_cost=round(monthly_cost, 2),
        total_annual_cost=round(monthly_cost * 12, 2),
    )


@app.post("/estimate/storage", response_model=EstimateResponse)
async def estimate_storage(request: StorageEstimateRequest):
    """Estimate storage costs for a specific provider."""
    pricing = PRICING_DATA[request.provider][ResourceType.STORAGE]
    monthly_rate = pricing[request.storage_type]
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
            )
        ],
        total_monthly_cost=round(monthly_cost, 2),
        total_annual_cost=round(monthly_cost * 12, 2),
    )


@app.post("/estimate/full", response_model=EstimateResponse)
async def estimate_full(request: FullEstimateRequest):
    """Get a full cost estimate for multiple resources."""
    breakdown = []
    total = 0.0
    pricing = PRICING_DATA[request.provider]
    
    # Compute costs
    if request.compute:
        hourly_rate = pricing[ResourceType.COMPUTE][request.compute.size]
        compute_cost = hourly_rate * request.compute.hours_per_month * request.compute.quantity
        breakdown.append(CostBreakdown(
            item=f"Compute ({request.compute.size.value}) x{request.compute.quantity}",
            unit_cost=hourly_rate,
            quantity=request.compute.hours_per_month * request.compute.quantity,
            monthly_cost=compute_cost,
        ))
        total += compute_cost
    
    # Storage costs
    if request.storage:
        monthly_rate = pricing[ResourceType.STORAGE][request.storage.storage_type]
        storage_cost = monthly_rate * request.storage.size_gb
        breakdown.append(CostBreakdown(
            item=f"Storage ({request.storage.storage_type.value})",
            unit_cost=monthly_rate,
            quantity=request.storage.size_gb,
            monthly_cost=storage_cost,
        ))
        total += storage_cost
    
    # Database costs
    if request.database:
        hourly_rate = pricing[ResourceType.DATABASE][request.database.database_type]
        db_cost = hourly_rate * request.database.hours_per_month
        breakdown.append(CostBreakdown(
            item=f"Database ({request.database.database_type.value})",
            unit_cost=hourly_rate,
            quantity=request.database.hours_per_month,
            monthly_cost=db_cost,
        ))
        total += db_cost
    
    # Networking costs
    if request.data_transfer_gb > 0:
        transfer_rate = pricing[ResourceType.NETWORKING]["data_transfer_out"]
        transfer_cost = transfer_rate * request.data_transfer_gb
        breakdown.append(CostBreakdown(
            item="Data Transfer Out",
            unit_cost=transfer_rate,
            quantity=request.data_transfer_gb,
            monthly_cost=transfer_cost,
        ))
        total += transfer_cost
    
    if request.include_load_balancer:
        lb_rate = pricing[ResourceType.NETWORKING]["load_balancer"]
        lb_cost = lb_rate * 730  # Hours in a month
        breakdown.append(CostBreakdown(
            item="Load Balancer",
            unit_cost=lb_rate,
            quantity=730,
            monthly_cost=lb_cost,
        ))
        total += lb_cost
    
    return EstimateResponse(
        provider=request.provider.value,
        provider_display_name=PROVIDER_INFO[request.provider]["name"],
        breakdown=breakdown,
        total_monthly_cost=round(total, 2),
        total_annual_cost=round(total * 12, 2),
    )


@app.post("/compare", response_model=ComparisonResponse)
async def compare_providers(
    compute_size: ComputeSize = ComputeSize.MEDIUM,
    storage_gb: float = 100,
    storage_type: StorageType = StorageType.STANDARD,
    hours_per_month: int = 730,
):
    """Compare costs across all providers for the same configuration."""
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
    uvicorn.run(app, host="0.0.0.0", port=8000)
