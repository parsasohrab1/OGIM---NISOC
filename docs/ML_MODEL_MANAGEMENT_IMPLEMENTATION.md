# 🤖 راهنمای پیاده‌سازی ML Model Management

**تاریخ:** دسامبر 2025  
**نسخه:** 1.0.0  
**هدف:** بهبود دقت پیش‌بینی‌های ML با مدیریت بهتر مدل‌ها

---

## 📋 فهرست مطالب

1. [نمای کلی](#overview)
2. [معماری](#architecture)
3. [طراحی UI](#ui-design)
4. [Model Registry API](#model-registry)
5. [Model Comparison](#model-comparison)
6. [A/B Testing Framework](#ab-testing)
7. [Testing Strategy](#testing)
8. [Best Practices](#best-practices)

---

## <a name="overview"></a>🎯 نمای کلی

این سند راهنمای کامل پیاده‌سازی سیستم مدیریت مدل‌های ML است که شامل UI، Model Registry، Model Comparison، و A/B Testing Framework می‌شود.

### اهداف

- ✅ UI جامع برای مدیریت مدل‌ها
- ✅ Model Registry با MLflow integration
- ✅ Model Comparison برای انتخاب بهترین model
- ✅ A/B Testing Framework
- ✅ Model deployment workflow
- ✅ Model drift detection

### مدل‌های پشتیبانی شده

- **Anomaly Detection**: Isolation Forest
- **Failure Prediction**: Random Forest
- **Time Series Forecasting**: LSTM
- **RUL Estimation**: Custom model

---

## <a name="architecture"></a>🏗️ معماری

```
┌─────────────────────────────────────────────────────────┐
│              ML Model Management UI                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Model List   │  │  Comparison  │  │  A/B Testing │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└────────────────────────────┬─────────────────────────────┘
                             │
                             │ REST API
                             ▼
┌─────────────────────────────────────────────────────────┐
│           ML Model Management Service                     │
│  ┌──────────────────────────────────────────────────┐   │
│  │         ModelManager                             │   │
│  │  - Model Registry                                │   │
│  │  - Model Comparison                              │   │
│  │  - A/B Testing                                   │   │
│  │  - Model Deployment                              │   │
│  └──────────────────────────────────────────────────┘   │
└────────────────────────────┬─────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   MLflow     │    │   Model      │    │   Inference  │
│   Registry   │    │   Storage    │    │   Service    │
└──────────────┘    └──────────────┘    └──────────────┘
```

---

## <a name="ui-design"></a>🎨 طراحی UI

### 1. Model List Page

```typescript
// frontend/web/src/pages/MLModels.tsx
import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ModelList } from '@/components/ModelList';
import { ModelDetails } from '@/components/ModelDetails';
import { ModelComparison } from '@/components/ModelComparison';
import { ABTesting } from '@/components/ABTesting';

interface Model {
  id: string;
  name: string;
  type: 'anomaly_detection' | 'failure_prediction' | 'time_series_forecast';
  version: number;
  status: 'active' | 'staging' | 'archived';
  accuracy: number;
  created_at: string;
  metrics: {
    precision: number;
    recall: number;
    f1_score: number;
  };
}

export function MLModels() {
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'list' | 'comparison' | 'ab-testing'>('list');
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);

  const { data: models, isLoading, refetch } = useQuery({
    queryKey: ['ml-models'],
    queryFn: async () => {
      const response = await fetch('/api/v1/ml/models');
      if (!response.ok) throw new Error('Failed to fetch models');
      return response.json();
    }
  });

  const deployModel = useMutation({
    mutationFn: async (modelId: string) => {
      const response = await fetch(`/api/v1/ml/models/${modelId}/deploy`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to deploy model');
      return response.json();
    },
    onSuccess: () => {
      refetch();
    }
  });

  return (
    <div className="ml-models">
      <div className="header">
        <h1>ML Model Management</h1>
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tab value="list">Model List</Tab>
          <Tab value="comparison">Comparison</Tab>
          <Tab value="ab-testing">A/B Testing</Tab>
        </Tabs>
      </div>

      {activeTab === 'list' && (
        <div className="model-list-view">
          <ModelList
            models={models?.models || []}
            onSelect={(modelIds) => setSelectedModels(modelIds)}
            onViewDetails={(model) => setSelectedModel(model)}
            onDeploy={(modelId) => deployModel.mutate(modelId)}
            isLoading={isLoading}
          />
          
          {selectedModel && (
            <ModelDetails
              model={selectedModel}
              onClose={() => setSelectedModel(null)}
            />
          )}
        </div>
      )}

      {activeTab === 'comparison' && (
        <ModelComparison
          models={models?.models?.filter(m => selectedModels.includes(m.id)) || []}
        />
      )}

      {activeTab === 'ab-testing' && (
        <ABTesting models={models?.models || []} />
      )}
    </div>
  );
}
```

### 2. Model List Component

```typescript
// frontend/web/src/components/ModelList.tsx
import { useState } from 'react';
import { ModelCard } from './ModelCard';
import { ModelFilters } from './ModelFilters';

interface ModelListProps {
  models: Model[];
  onSelect: (modelIds: string[]) => void;
  onViewDetails: (model: Model) => void;
  onDeploy: (modelId: string) => void;
  isLoading: boolean;
}

export function ModelList({
  models,
  onSelect,
  onViewDetails,
  onDeploy,
  isLoading
}: ModelListProps) {
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    search: ''
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filteredModels = models.filter(model => {
    if (filters.type && model.type !== filters.type) return false;
    if (filters.status && model.status !== filters.status) return false;
    if (filters.search && !model.name.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    return true;
  });

  const handleSelect = (modelId: string, selected: boolean) => {
    if (selected) {
      setSelectedIds([...selectedIds, modelId]);
    } else {
      setSelectedIds(selectedIds.filter(id => id !== modelId));
    }
    onSelect(selectedIds);
  };

  if (isLoading) {
    return <div>Loading models...</div>;
  }

  return (
    <div className="model-list">
      <ModelFilters
        filters={filters}
        onChange={setFilters}
      />
      
      <div className="model-grid">
        {filteredModels.map(model => (
          <ModelCard
            key={model.id}
            model={model}
            selected={selectedIds.includes(model.id)}
            onSelect={(selected) => handleSelect(model.id, selected)}
            onViewDetails={() => onViewDetails(model)}
            onDeploy={() => onDeploy(model.id)}
          />
        ))}
      </div>
    </div>
  );
}
```

### 3. Model Card Component

```typescript
// frontend/web/src/components/ModelCard.tsx
export function ModelCard({ model, selected, onSelect, onViewDetails, onDeploy }: ModelCardProps) {
  return (
    <div className={`model-card ${selected ? 'selected' : ''}`}>
      <div className="model-header">
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => onSelect(e.target.checked)}
        />
        <h3>{model.name}</h3>
        <span className={`status-badge ${model.status}`}>
          {model.status}
        </span>
      </div>
      
      <div className="model-info">
        <div className="info-row">
          <span>Type:</span>
          <span>{model.type}</span>
        </div>
        <div className="info-row">
          <span>Version:</span>
          <span>v{model.version}</span>
        </div>
        <div className="info-row">
          <span>Accuracy:</span>
          <span className="accuracy">{model.accuracy.toFixed(2)}%</span>
        </div>
        <div className="info-row">
          <span>Created:</span>
          <span>{new Date(model.created_at).toLocaleDateString()}</span>
        </div>
      </div>
      
      <div className="model-metrics">
        <MetricBar label="Precision" value={model.metrics.precision} />
        <MetricBar label="Recall" value={model.metrics.recall} />
        <MetricBar label="F1 Score" value={model.metrics.f1_score} />
      </div>
      
      <div className="model-actions">
        <button onClick={onViewDetails}>View Details</button>
        {model.status !== 'active' && (
          <button onClick={onDeploy}>Deploy</button>
        )}
      </div>
    </div>
  );
}
```

---

## <a name="model-registry"></a>📦 Model Registry API

### 1. Model Manager Class

```python
# backend/ml-inference-service/model_management.py
from mlflow.tracking import MlflowClient
from mlflow.store.artifact.models_artifact_repo import ModelsArtifactRepository
from typing import List, Dict, Optional, Any
import pandas as pd
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class ModelManager:
    """Manages ML models with MLflow integration"""
    
    def __init__(self):
        self.mlflow_client = MlflowClient()
        self.model_registry = {}
        self.ab_tests = {}
    
    def list_models(self, model_type: Optional[str] = None) -> List[Dict]:
        """List all registered models"""
        try:
            models = self.mlflow_client.search_registered_models()
            
            result = []
            for model in models:
                # Filter by type if specified
                if model_type and model.tags.get("type") != model_type:
                    continue
                
                latest_version = model.latest_versions[0] if model.latest_versions else None
                
                if latest_version:
                    # Get run metrics
                    run = self.mlflow_client.get_run(latest_version.run_id)
                    metrics = run.data.metrics
                    
                    result.append({
                        "id": model.name,
                        "name": model.name,
                        "type": model.tags.get("type", "unknown"),
                        "version": latest_version.version,
                        "status": latest_version.current_stage,
                        "accuracy": metrics.get("accuracy", 0.0),
                        "precision": metrics.get("precision", 0.0),
                        "recall": metrics.get("recall", 0.0),
                        "f1_score": metrics.get("f1_score", 0.0),
                        "created_at": datetime.fromtimestamp(
                            model.creation_timestamp / 1000
                        ).isoformat(),
                        "description": model.description,
                        "tags": model.tags
                    })
            
            return result
            
        except Exception as e:
            logger.error(f"Error listing models: {e}")
            return []
    
    def get_model_details(self, model_name: str, version: Optional[int] = None) -> Dict:
        """Get detailed information about a model"""
        try:
            if version:
                model_version = self.mlflow_client.get_model_version(model_name, version)
            else:
                model = self.mlflow_client.get_registered_model(model_name)
                model_version = model.latest_versions[0]
            
            run = self.mlflow_client.get_run(model_version.run_id)
            
            return {
                "id": model_name,
                "name": model_name,
                "version": model_version.version,
                "status": model_version.current_stage,
                "run_id": model_version.run_id,
                "metrics": run.data.metrics,
                "parameters": run.data.params,
                "tags": run.data.tags,
                "created_at": datetime.fromtimestamp(
                    run.info.start_time / 1000
                ).isoformat(),
                "model_uri": model_version.source
            }
            
        except Exception as e:
            logger.error(f"Error getting model details: {e}")
            raise
    
    def get_model_versions(self, model_name: str) -> List[Dict]:
        """Get all versions of a model"""
        try:
            model = self.mlflow_client.get_registered_model(model_name)
            
            versions = []
            for version in model.latest_versions:
                run = self.mlflow_client.get_run(version.run_id)
                
                versions.append({
                    "version": version.version,
                    "stage": version.current_stage,
                    "metrics": run.data.metrics,
                    "created_at": datetime.fromtimestamp(
                        run.info.start_time / 1000
                    ).isoformat()
                })
            
            return sorted(versions, key=lambda x: x["version"], reverse=True)
            
        except Exception as e:
            logger.error(f"Error getting model versions: {e}")
            return []
    
    def deploy_model(self, model_name: str, version: int, stage: str = "Production") -> Dict:
        """Deploy model to specified stage"""
        try:
            # Transition model to stage
            self.mlflow_client.transition_model_version_stage(
                name=model_name,
                version=version,
                stage=stage
            )
            
            # Load model for inference service
            model_uri = f"models:/{model_name}/{version}"
            # In production, trigger model reload in inference service
            
            logger.info(f"Deployed model {model_name} v{version} to {stage}")
            
            return {
                "status": "deployed",
                "model_name": model_name,
                "version": version,
                "stage": stage,
                "deployed_at": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error deploying model: {e}")
            raise
    
    def archive_model(self, model_name: str, version: int) -> Dict:
        """Archive a model version"""
        try:
            self.mlflow_client.transition_model_version_stage(
                name=model_name,
                version=version,
                stage="Archived"
            )
            
            return {
                "status": "archived",
                "model_name": model_name,
                "version": version
            }
            
        except Exception as e:
            logger.error(f"Error archiving model: {e}")
            raise
```

### 2. API Endpoints

```python
# backend/ml-inference-service/main.py
from fastapi import APIRouter, Depends, HTTPException
from backend.shared.auth import require_roles
from backend.ml_inference_service.model_management import ModelManager

router = APIRouter(prefix="/api/v1/ml/models", tags=["ML Models"])
model_manager = ModelManager()

@router.get("")
async def list_models(
    model_type: Optional[str] = None,
    _: Dict[str, Any] = Depends(require_roles({"system_admin", "data_engineer"}))
):
    """List all registered models"""
    models = model_manager.list_models(model_type=model_type)
    return {"models": models}

@router.get("/{model_name}")
async def get_model_details(
    model_name: str,
    version: Optional[int] = None,
    _: Dict[str, Any] = Depends(require_roles({"system_admin", "data_engineer"}))
):
    """Get model details"""
    try:
        details = model_manager.get_model_details(model_name, version)
        return details
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/{model_name}/versions")
async def get_model_versions(
    model_name: str,
    _: Dict[str, Any] = Depends(require_roles({"system_admin", "data_engineer"}))
):
    """Get all versions of a model"""
    versions = model_manager.get_model_versions(model_name)
    return {"versions": versions}

@router.post("/{model_name}/deploy")
async def deploy_model(
    model_name: str,
    version: int,
    stage: str = "Production",
    _: Dict[str, Any] = Depends(require_roles({"system_admin"}))
):
    """Deploy model to specified stage"""
    try:
        result = model_manager.deploy_model(model_name, version, stage)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{model_name}/archive")
async def archive_model(
    model_name: str,
    version: int,
    _: Dict[str, Any] = Depends(require_roles({"system_admin"}))
):
    """Archive a model version"""
    try:
        result = model_manager.archive_model(model_name, version)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

---

## <a name="model-comparison"></a>📊 Model Comparison

### 1. Comparison Engine

```python
# backend/ml-inference-service/model_comparison.py
class ModelComparisonEngine:
    """Compare multiple model versions"""
    
    def __init__(self):
        self.mlflow_client = MlflowClient()
    
    def compare_models(
        self,
        model_names: List[str],
        versions: Optional[List[int]] = None
    ) -> Dict:
        """Compare multiple model versions"""
        comparison = {
            "models": [],
            "metrics_comparison": {},
            "performance_comparison": {},
            "recommendation": None
        }
        
        model_data = []
        
        for i, model_name in enumerate(model_names):
            version = versions[i] if versions and i < len(versions) else None
            
            try:
                model_info = self._get_model_info(model_name, version)
                model_data.append(model_info)
            except Exception as e:
                logger.error(f"Error getting model info for {model_name}: {e}")
                continue
        
        # Compare metrics
        comparison["models"] = model_data
        comparison["metrics_comparison"] = self._compare_metrics(model_data)
        comparison["performance_comparison"] = self._compare_performance(model_data)
        comparison["recommendation"] = self._recommend_best_model(model_data)
        
        return comparison
    
    def _get_model_info(self, model_name: str, version: Optional[int]) -> Dict:
        """Get model information"""
        if version:
            model_version = self.mlflow_client.get_model_version(model_name, version)
        else:
            model = self.mlflow_client.get_registered_model(model_name)
            model_version = model.latest_versions[0]
        
        run = self.mlflow_client.get_run(model_version.run_id)
        
        return {
            "name": model_name,
            "version": model_version.version,
            "metrics": run.data.metrics,
            "parameters": run.data.params,
            "tags": run.data.tags,
            "created_at": datetime.fromtimestamp(
                run.info.start_time / 1000
            ).isoformat()
        }
    
    def _compare_metrics(self, model_data: List[Dict]) -> Dict:
        """Compare metrics across models"""
        metrics_comparison = {}
        
        # Get all metric names
        all_metrics = set()
        for model in model_data:
            all_metrics.update(model["metrics"].keys())
        
        for metric_name in all_metrics:
            values = []
            for model in model_data:
                value = model["metrics"].get(metric_name, 0)
                values.append({
                    "model": model["name"],
                    "version": model["version"],
                    "value": value
                })
            
            # Sort by value (descending for accuracy, precision, etc.)
            if metric_name in ["accuracy", "precision", "recall", "f1_score"]:
                values.sort(key=lambda x: x["value"], reverse=True)
            else:
                values.sort(key=lambda x: x["value"])
            
            metrics_comparison[metric_name] = {
                "values": values,
                "best": values[0] if values else None,
                "worst": values[-1] if values else None,
                "average": sum(v["value"] for v in values) / len(values) if values else 0
            }
        
        return metrics_comparison
    
    def _compare_performance(self, model_data: List[Dict]) -> Dict:
        """Compare performance metrics"""
        performance = {}
        
        for model in model_data:
            # Calculate performance score
            metrics = model["metrics"]
            score = (
                metrics.get("accuracy", 0) * 0.4 +
                metrics.get("precision", 0) * 0.2 +
                metrics.get("recall", 0) * 0.2 +
                metrics.get("f1_score", 0) * 0.2
            )
            
            performance[model["name"]] = {
                "score": score,
                "inference_time": metrics.get("inference_time_ms", 0),
                "model_size_mb": metrics.get("model_size_mb", 0)
            }
        
        return performance
    
    def _recommend_best_model(self, model_data: List[Dict]) -> Dict:
        """Recommend the best model based on metrics"""
        if not model_data:
            return None
        
        # Calculate composite score for each model
        scores = []
        for model in model_data:
            metrics = model["metrics"]
            score = (
                metrics.get("accuracy", 0) * 0.4 +
                metrics.get("precision", 0) * 0.2 +
                metrics.get("recall", 0) * 0.2 +
                metrics.get("f1_score", 0) * 0.2
            )
            scores.append({
                "model": model["name"],
                "version": model["version"],
                "score": score
            })
        
        # Sort by score
        scores.sort(key=lambda x: x["score"], reverse=True)
        best = scores[0]
        
        return {
            "model_name": best["model"],
            "version": best["version"],
            "score": best["score"],
            "reason": "Highest composite score based on accuracy, precision, recall, and F1"
        }
```

### 2. Comparison API

```python
@router.post("/compare")
async def compare_models(
    request: ModelComparisonRequest,
    _: Dict[str, Any] = Depends(require_roles({"system_admin", "data_engineer"}))
):
    """Compare multiple models"""
    comparison_engine = ModelComparisonEngine()
    
    result = comparison_engine.compare_models(
        model_names=request.model_names,
        versions=request.versions
    )
    
    return result
```

### 3. Frontend Comparison Component

```typescript
// frontend/web/src/components/ModelComparison.tsx
export function ModelComparison({ models }: { models: Model[] }) {
  const [comparison, setComparison] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleCompare = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/ml/models/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model_names: models.map(m => m.name),
          versions: models.map(m => m.version)
        })
      });
      const data = await response.json();
      setComparison(data);
    } catch (error) {
      console.error('Comparison failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="model-comparison">
      <button onClick={handleCompare} disabled={loading || models.length < 2}>
        Compare Models
      </button>

      {comparison && (
        <div className="comparison-results">
          <MetricsComparisonTable data={comparison.metrics_comparison} />
          <PerformanceComparisonChart data={comparison.performance_comparison} />
          <RecommendationCard recommendation={comparison.recommendation} />
        </div>
      )}
    </div>
  );
}
```

---

## <a name="ab-testing"></a>🧪 A/B Testing Framework

### 1. A/B Testing Manager

```python
# backend/ml-inference-service/ab_testing.py
class ABTestingManager:
    """Manages A/B testing for ML models"""
    
    def __init__(self):
        self.active_tests: Dict[str, Dict] = {}
        self.test_results: Dict[str, List[Dict]] = {}
    
    def create_ab_test(
        self,
        test_name: str,
        model_a: str,
        model_b: str,
        traffic_split: float = 0.5,
        metrics: List[str] = None
    ) -> Dict:
        """Create A/B test between two models"""
        if traffic_split < 0 or traffic_split > 1:
            raise ValueError("Traffic split must be between 0 and 1")
        
        ab_test = {
            "test_name": test_name,
            "model_a": {
                "name": model_a,
                "traffic_percentage": traffic_split * 100
            },
            "model_b": {
                "name": model_b,
                "traffic_percentage": (1 - traffic_split) * 100
            },
            "status": "active",
            "created_at": datetime.utcnow().isoformat(),
            "metrics": metrics or ["accuracy", "precision", "recall", "f1_score"],
            "results": {
                "model_a": {
                    "requests": 0,
                    "success": 0,
                    "errors": 0,
                    "metrics": {}
                },
                "model_b": {
                    "requests": 0,
                    "success": 0,
                    "errors": 0,
                    "metrics": {}
                }
            }
        }
        
        self.active_tests[test_name] = ab_test
        self.test_results[test_name] = []
        
        logger.info(f"Created A/B test: {test_name}")
        
        return ab_test
    
    def record_prediction(
        self,
        test_name: str,
        model_name: str,
        prediction: Dict,
        actual: Optional[Any] = None
    ):
        """Record prediction result for A/B test"""
        if test_name not in self.active_tests:
            raise ValueError(f"A/B test '{test_name}' not found")
        
        test = self.active_tests[test_name]
        model_key = "model_a" if model_name == test["model_a"]["name"] else "model_b"
        
        test["results"][model_key]["requests"] += 1
        
        try:
            # Calculate metrics if actual value provided
            if actual is not None:
                # Update metrics based on prediction vs actual
                # This is simplified - actual implementation depends on model type
                test["results"][model_key]["success"] += 1
            else:
                test["results"][model_key]["success"] += 1
            
        except Exception as e:
            logger.error(f"Error recording prediction: {e}")
            test["results"][model_key]["errors"] += 1
    
    def get_ab_test_results(self, test_name: str) -> Dict:
        """Get A/B test results"""
        if test_name not in self.active_tests:
            raise ValueError(f"A/B test '{test_name}' not found")
        
        test = self.active_tests[test_name]
        
        # Calculate success rates
        model_a_results = test["results"]["model_a"]
        model_b_results = test["results"]["model_b"]
        
        model_a_success_rate = (
            model_a_results["success"] / max(model_a_results["requests"], 1)
        )
        model_b_success_rate = (
            model_b_results["success"] / max(model_b_results["requests"], 1)
        )
        
        # Statistical significance test (simplified)
        is_significant = self._is_statistically_significant(
            model_a_results["requests"],
            model_a_results["success"],
            model_b_results["requests"],
            model_b_results["success"]
        )
        
        winner = "model_a" if model_a_success_rate > model_b_success_rate else "model_b"
        
        return {
            **test,
            "summary": {
                "model_a": {
                    **model_a_results,
                    "success_rate": model_a_success_rate
                },
                "model_b": {
                    **model_b_results,
                    "success_rate": model_b_success_rate
                },
                "winner": winner,
                "statistically_significant": is_significant,
                "confidence": self._calculate_confidence(
                    model_a_results["requests"],
                    model_b_results["requests"]
                )
            }
        }
    
    def _is_statistically_significant(
        self,
        n1: int,
        s1: int,
        n2: int,
        s2: int,
        alpha: float = 0.05
    ) -> bool:
        """Check if results are statistically significant (simplified chi-square test)"""
        if n1 < 30 or n2 < 30:
            return False  # Need more samples
        
        # Simplified statistical test
        p1 = s1 / n1
        p2 = s2 / n2
        
        # Z-test for proportions
        p_pooled = (s1 + s2) / (n1 + n2)
        se = math.sqrt(p_pooled * (1 - p_pooled) * (1/n1 + 1/n2))
        
        if se == 0:
            return False
        
        z = (p1 - p2) / se
        z_critical = 1.96  # For alpha = 0.05
        
        return abs(z) > z_critical
    
    def _calculate_confidence(self, n1: int, n2: int) -> float:
        """Calculate confidence level based on sample sizes"""
        total_samples = n1 + n2
        
        if total_samples < 100:
            return 0.5
        elif total_samples < 500:
            return 0.7
        elif total_samples < 1000:
            return 0.85
        else:
            return 0.95
    
    def stop_ab_test(self, test_name: str) -> Dict:
        """Stop A/B test and get final results"""
        if test_name not in self.active_tests:
            raise ValueError(f"A/B test '{test_name}' not found")
        
        test = self.active_tests[test_name]
        test["status"] = "completed"
        test["completed_at"] = datetime.utcnow().isoformat()
        
        results = self.get_ab_test_results(test_name)
        
        # Archive test
        self.test_results[test_name].append(results)
        del self.active_tests[test_name]
        
        return results
```

### 2. A/B Testing API

```python
@router.post("/ab-testing/create")
async def create_ab_test(
    request: ABTestRequest,
    _: Dict[str, Any] = Depends(require_roles({"system_admin"}))
):
    """Create A/B test"""
    ab_manager = ABTestingManager()
    
    test = ab_manager.create_ab_test(
        test_name=request.test_name,
        model_a=request.model_a,
        model_b=request.model_b,
        traffic_split=request.traffic_split,
        metrics=request.metrics
    )
    
    return test

@router.get("/ab-testing/{test_name}")
async def get_ab_test_results(
    test_name: str,
    _: Dict[str, Any] = Depends(require_roles({"system_admin", "data_engineer"}))
):
    """Get A/B test results"""
    ab_manager = ABTestingManager()
    
    try:
        results = ab_manager.get_ab_test_results(test_name)
        return results
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/ab-testing/{test_name}/stop")
async def stop_ab_test(
    test_name: str,
    _: Dict[str, Any] = Depends(require_roles({"system_admin"}))
):
    """Stop A/B test"""
    ab_manager = ABTestingManager()
    
    try:
        results = ab_manager.stop_ab_test(test_name)
        return results
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
```

### 3. Frontend A/B Testing Component

```typescript
// frontend/web/src/components/ABTesting.tsx
export function ABTesting({ models }: { models: Model[] }) {
  const [activeTests, setActiveTests] = useState<any[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const createTest = async (testConfig: ABTestConfig) => {
    const response = await fetch('/api/v1/ml/models/ab-testing/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testConfig)
    });
    const test = await response.json();
    setActiveTests([...activeTests, test]);
  };

  return (
    <div className="ab-testing">
      <div className="header">
        <h2>A/B Testing</h2>
        <button onClick={() => setShowCreateForm(true)}>
          Create New Test
        </button>
      </div>

      {showCreateForm && (
        <ABTestCreateForm
          models={models}
          onSubmit={createTest}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      <div className="active-tests">
        {activeTests.map(test => (
          <ABTestCard
            key={test.test_name}
            test={test}
            onStop={async () => {
              await fetch(`/api/v1/ml/models/ab-testing/${test.test_name}/stop`, {
                method: 'POST'
              });
              setActiveTests(activeTests.filter(t => t.test_name !== test.test_name));
            }}
          />
        ))}
      </div>
    </div>
  );
}
```

---

## <a name="testing"></a>🧪 Testing Strategy

### 1. Unit Tests

```python
# backend/tests/test_model_management.py
import pytest
from backend.ml_inference_service.model_management import ModelManager

def test_list_models():
    """Test listing models"""
    manager = ModelManager()
    models = manager.list_models()
    
    assert isinstance(models, list)
    assert len(models) > 0

def test_get_model_details():
    """Test getting model details"""
    manager = ModelManager()
    details = manager.get_model_details("anomaly-detection")
    
    assert "name" in details
    assert "version" in details
    assert "metrics" in details

def test_model_comparison():
    """Test model comparison"""
    from backend.ml_inference_service.model_comparison import ModelComparisonEngine
    
    engine = ModelComparisonEngine()
    comparison = engine.compare_models(
        ["anomaly-detection", "failure-prediction"]
    )
    
    assert "models" in comparison
    assert "metrics_comparison" in comparison
    assert "recommendation" in comparison
```

---

## <a name="best-practices"></a>✅ Best Practices

### 1. Model Versioning
- Always version models
- Use semantic versioning (major.minor.patch)
- Tag models with metadata

### 2. Model Deployment
- Test in staging first
- Gradual rollout (10% → 50% → 100%)
- Monitor metrics after deployment

### 3. A/B Testing
- Run tests for sufficient duration
- Ensure statistical significance
- Monitor both models during test

### 4. Model Monitoring
- Track model drift
- Monitor prediction accuracy
- Alert on performance degradation

---

**نسخه:** 1.0.0  
**تاریخ:** دسامبر 2025

