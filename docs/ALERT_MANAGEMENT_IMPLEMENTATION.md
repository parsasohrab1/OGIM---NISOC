# 🚨 راهنمای پیاده‌سازی Alert Management پیشرفته

**تاریخ:** دسامبر 2025  
**نسخه:** 1.0.0  
**هدف:** کاهش 30% در false positive alerts با Alert Correlation و Root Cause Analysis

---

## 📋 فهرست مطالب

1. [نمای کلی](#overview)
2. [معماری](#architecture)
3. [Alert Correlation Engine](#correlation)
4. [Root Cause Analysis (RCA)](#rca)
5. [Alert Fatigue Detection](#fatigue)
6. [Alert Timeline Visualization](#timeline)
7. [Testing Strategy](#testing)
8. [Best Practices](#best-practices)

---

## <a name="overview"></a>🎯 نمای کلی

این سند راهنمای کامل پیاده‌سازی سیستم پیشرفته مدیریت هشدارها است که شامل Alert Correlation، Root Cause Analysis، Alert Fatigue Detection، و Timeline Visualization می‌شود.

### اهداف

- ✅ کاهش 30% در false positive alerts
- ✅ بهبود response time با correlation
- ✅ کاهش alert fatigue
- ✅ بهبود root cause identification
- ✅ Timeline visualization برای analysis

---

## <a name="architecture"></a>🏗️ معماری

```
┌─────────────────────────────────────────────────────────┐
│              Alert Stream                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Flink      │  │   ML Service │  │   Rules      │  │
│  │  (Anomaly)   │  │  (Prediction)│  │  (Threshold) │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                  │                  │          │
│         └──────────────────┼──────────────────┘          │
│                            │                             │
└────────────────────────────┼─────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│         Alert Correlation Engine                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  - Time-based correlation                         │   │
│  │  - Equipment-based correlation                   │   │
│  │  - Pattern-based correlation                     │   │
│  └──────────────────────────────────────────────────┘   │
└────────────────────────────┬─────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│         Root Cause Analysis (RCA)                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │  - Historical pattern analysis                   │   │
│  │  - Equipment history analysis                    │   │
│  │  - Environmental factor analysis                 │   │
│  └──────────────────────────────────────────────────┘   │
└────────────────────────────┬─────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│         Alert Fatigue Detection                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  - Frequency analysis                            │   │
│  │  - Suppression rules                             │   │
│  │  - User feedback integration                     │   │
│  └──────────────────────────────────────────────────┘   │
└────────────────────────────┬─────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────┐
│         Alert Timeline & Visualization                    │
│  ┌──────────────────────────────────────────────────┐   │
│  │  - Timeline view                                 │   │
│  │  - Correlation visualization                     │   │
│  │  - Root cause visualization                      │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## <a name="correlation"></a>🔗 Alert Correlation Engine

### 1. Correlation Engine Implementation

```python
# backend/alert-service/alert_correlation.py
from typing import List, Dict, Set, Optional
from datetime import datetime, timedelta
from collections import defaultdict
import logging

logger = logging.getLogger(__name__)

class AlertCorrelationEngine:
    """Correlates related alerts to reduce noise and identify patterns"""
    
    def __init__(self):
        self.correlation_rules: List[Dict] = []
        self.alert_groups: Dict[str, List[Dict]] = {}
        self.correlation_window = timedelta(minutes=5)  # 5-minute window
        self.equipment_relationships: Dict[str, Set[str]] = defaultdict(set)
    
    def correlate_alerts(self, alerts: List[Dict]) -> List[Dict]:
        """Correlate alerts into groups"""
        correlated = []
        processed = set()
        
        # Sort alerts by timestamp
        sorted_alerts = sorted(alerts, key=lambda x: x.get("timestamp", datetime.utcnow()))
        
        for alert in sorted_alerts:
            if alert["id"] in processed:
                continue
            
            # Find related alerts
            related = self._find_related_alerts(alert, sorted_alerts)
            
            if len(related) > 1:
                # Create alert group
                group = self._create_alert_group(alert, related)
                correlated.append(group)
                
                # Mark as processed
                processed.update(a["id"] for a in related)
            else:
                # Standalone alert
                correlated.append(alert)
                processed.add(alert["id"])
        
        return correlated
    
    def _find_related_alerts(self, alert: Dict, all_alerts: List[Dict]) -> List[Dict]:
        """Find alerts related to the given alert"""
        related = [alert]
        alert_time = datetime.fromisoformat(alert.get("timestamp", datetime.utcnow().isoformat()))
        
        for other in all_alerts:
            if other["id"] == alert["id"]:
                continue
            
            # Check time proximity
            other_time = datetime.fromisoformat(other.get("timestamp", datetime.utcnow().isoformat()))
            time_diff = abs((alert_time - other_time).total_seconds())
            
            if time_diff > self.correlation_window.total_seconds():
                continue  # Outside time window
            
            # Check correlation criteria
            is_related = False
            
            # 1. Same equipment or well
            if (alert.get("equipment_id") == other.get("equipment_id") or
                alert.get("well_name") == other.get("well_name")):
                is_related = True
            
            # 2. Related equipment (e.g., pump and motor)
            elif self._are_equipment_related(
                alert.get("equipment_id"),
                other.get("equipment_id")
            ):
                is_related = True
            
            # 3. Similar alert type
            elif self._is_similar_type(alert, other):
                is_related = True
            
            # 4. Pattern-based correlation
            elif self._matches_correlation_pattern(alert, other):
                is_related = True
            
            if is_related:
                related.append(other)
        
        return related
    
    def _are_equipment_related(self, eq1: Optional[str], eq2: Optional[str]) -> bool:
        """Check if two equipment are related"""
        if not eq1 or not eq2:
            return False
        
        # Check direct relationship
        if eq2 in self.equipment_relationships.get(eq1, set()):
            return True
        
        # Check reverse relationship
        if eq1 in self.equipment_relationships.get(eq2, set()):
            return True
        
        # Check if same well (equipment in same well are related)
        # This would require equipment metadata lookup
        return False
    
    def _is_similar_type(self, alert1: Dict, alert2: Dict) -> bool:
        """Check if alerts are of similar type"""
        type1 = alert1.get("alert_type") or alert1.get("rule_name", "")
        type2 = alert2.get("alert_type") or alert2.get("rule_name", "")
        
        # Similar types (e.g., "high_pressure" and "pressure_anomaly")
        similar_patterns = [
            ("pressure", "pressure"),
            ("temperature", "temperature"),
            ("vibration", "vibration"),
            ("flow", "flow")
        ]
        
        for pattern1, pattern2 in similar_patterns:
            if pattern1 in type1.lower() and pattern2 in type2.lower():
                return True
        
        return False
    
    def _matches_correlation_pattern(self, alert1: Dict, alert2: Dict) -> bool:
        """Check if alerts match predefined correlation patterns"""
        # Pattern: Cascade failures (e.g., pump failure → pressure drop)
        cascade_patterns = [
            {"source": "pump_failure", "target": "pressure_drop"},
            {"source": "valve_stuck", "target": "flow_anomaly"},
            {"source": "sensor_fault", "target": "data_quality"}
        ]
        
        for pattern in cascade_patterns:
            if (pattern["source"] in alert1.get("rule_name", "").lower() and
                pattern["target"] in alert2.get("rule_name", "").lower()):
                return True
        
        return False
    
    def _create_alert_group(self, primary_alert: Dict, related_alerts: List[Dict]) -> Dict:
        """Create an alert group from related alerts"""
        # Determine primary alert (highest severity or first)
        primary = primary_alert
        for alert in related_alerts:
            severity_order = {"critical": 3, "high": 2, "warning": 1, "info": 0}
            if severity_order.get(alert.get("severity", ""), 0) > severity_order.get(primary.get("severity", ""), 0):
                primary = alert
        
        # Analyze root cause
        root_cause = self._analyze_root_cause(related_alerts)
        
        # Calculate group metrics
        severities = [a.get("severity", "info") for a in related_alerts]
        severity_counts = {s: severities.count(s) for s in set(severities)}
        
        return {
            "group_id": f"GROUP-{primary['id']}",
            "type": "alert_group",
            "primary_alert": primary,
            "related_alerts": related_alerts,
            "count": len(related_alerts),
            "severity": self._get_highest_severity(related_alerts),
            "severity_breakdown": severity_counts,
            "root_cause": root_cause,
            "first_occurrence": min(a.get("timestamp") for a in related_alerts),
            "last_occurrence": max(a.get("timestamp") for a in related_alerts),
            "duration_seconds": (
                datetime.fromisoformat(max(a.get("timestamp") for a in related_alerts)) -
                datetime.fromisoformat(min(a.get("timestamp") for a in related_alerts))
            ).total_seconds(),
            "equipment_affected": list(set(
                a.get("equipment_id") for a in related_alerts if a.get("equipment_id")
            )),
            "wells_affected": list(set(
                a.get("well_name") for a in related_alerts if a.get("well_name")
            ))
        }
    
    def _analyze_root_cause(self, alerts: List[Dict]) -> Dict:
        """Analyze root cause of alert group"""
        # Count equipment occurrences
        equipment_counts = defaultdict(int)
        alert_type_counts = defaultdict(int)
        well_counts = defaultdict(int)
        
        for alert in alerts:
            if alert.get("equipment_id"):
                equipment_counts[alert["equipment_id"]] += 1
            if alert.get("alert_type"):
                alert_type_counts[alert["alert_type"]] += 1
            if alert.get("well_name"):
                well_counts[alert["well_name"]] += 1
        
        # Find most common
        most_common_equipment = max(equipment_counts.items(), key=lambda x: x[1])[0] if equipment_counts else None
        most_common_type = max(alert_type_counts.items(), key=lambda x: x[1])[0] if alert_type_counts else None
        most_common_well = max(well_counts.items(), key=lambda x: x[1])[0] if well_counts else None
        
        # Calculate confidence
        total_alerts = len(alerts)
        equipment_confidence = equipment_counts.get(most_common_equipment, 0) / total_alerts if most_common_equipment else 0
        type_confidence = alert_type_counts.get(most_common_type, 0) / total_alerts if most_common_type else 0
        
        return {
            "likely_equipment": most_common_equipment,
            "likely_type": most_common_type,
            "likely_well": most_common_well,
            "confidence": (equipment_confidence + type_confidence) / 2,
            "equipment_confidence": equipment_confidence,
            "type_confidence": type_confidence,
            "analysis": self._generate_root_cause_analysis(most_common_equipment, most_common_type, total_alerts)
        }
    
    def _generate_root_cause_analysis(
        self,
        equipment: Optional[str],
        alert_type: Optional[str],
        total_alerts: int
    ) -> str:
        """Generate human-readable root cause analysis"""
        if equipment and alert_type:
            return f"Root cause likely related to {equipment} experiencing {alert_type} issues. {total_alerts} related alerts detected."
        elif equipment:
            return f"Root cause likely related to {equipment}. {total_alerts} related alerts detected."
        elif alert_type:
            return f"Root cause likely related to {alert_type} issues. {total_alerts} related alerts detected."
        else:
            return f"Multiple related alerts detected ({total_alerts}). Further investigation needed."
    
    def _get_highest_severity(self, alerts: List[Dict]) -> str:
        """Get highest severity from alerts"""
        severity_order = {"critical": 3, "high": 2, "warning": 1, "info": 0}
        return max(
            alerts,
            key=lambda a: severity_order.get(a.get("severity", "info"), 0)
        ).get("severity", "info")
    
    def add_correlation_rule(self, rule: Dict):
        """Add custom correlation rule"""
        self.correlation_rules.append(rule)
        logger.info(f"Added correlation rule: {rule.get('name')}")
    
    def register_equipment_relationship(self, equipment1: str, equipment2: str):
        """Register relationship between equipment"""
        self.equipment_relationships[equipment1].add(equipment2)
        self.equipment_relationships[equipment2].add(equipment1)
```

### 2. Correlation API

```python
# backend/alert-service/main.py
from backend.alert_service.alert_correlation import AlertCorrelationEngine

correlation_engine = AlertCorrelationEngine()

@app.post("/alerts/correlate")
async def correlate_alerts(
    alerts: List[AlertCreate],
    db: Session = Depends(get_db),
    _: Dict[str, Any] = Depends(require_alert_read)
):
    """Correlate alerts into groups"""
    alerts_dict = [alert.dict() for alert in alerts]
    correlated = correlation_engine.correlate_alerts(alerts_dict)
    
    return {
        "correlated_alerts": correlated,
        "total_groups": len([a for a in correlated if a.get("type") == "alert_group"]),
        "standalone_alerts": len([a for a in correlated if a.get("type") != "alert_group"])
    }

@app.get("/alerts/groups")
async def get_alert_groups(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
    _: Dict[str, Any] = Depends(require_alert_read)
):
    """Get alert groups"""
    # Query alerts from database
    query = db.query(Alert)
    
    if start_date:
        query = query.filter(Alert.timestamp >= start_date)
    if end_date:
        query = query.filter(Alert.timestamp <= end_date)
    
    alerts = query.all()
    alerts_dict = [{
        "id": a.alert_id,
        "timestamp": a.timestamp.isoformat(),
        "severity": a.severity,
        "well_name": a.well_name,
        "equipment_id": a.equipment_id,
        "rule_name": a.rule_name,
        "message": a.message
    } for a in alerts]
    
    correlated = correlation_engine.correlate_alerts(alerts_dict)
    groups = [a for a in correlated if a.get("type") == "alert_group"]
    
    return {"groups": groups, "count": len(groups)}
```

---

## <a name="rca"></a>🔍 Root Cause Analysis (RCA)

### 1. RCA Engine Implementation

```python
# backend/alert-service/rca_engine.py
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from collections import defaultdict
import logging

logger = logging.getLogger(__name__)

class RootCauseAnalysisEngine:
    """Performs root cause analysis on alerts"""
    
    def __init__(self):
        self.historical_patterns: Dict[str, List[Dict]] = defaultdict(list)
        self.equipment_history: Dict[str, List[Dict]] = defaultdict(list)
    
    def analyze(
        self,
        alert: Dict,
        historical_alerts: List[Dict],
        equipment_history: Optional[Dict] = None
    ) -> Dict:
        """Analyze root cause of an alert"""
        # 1. Find similar historical alerts
        similar_alerts = self._find_similar_historical_alerts(alert, historical_alerts)
        
        # 2. Analyze equipment history
        equipment_analysis = self._analyze_equipment_history(
            alert.get("equipment_id"),
            equipment_history
        )
        
        # 3. Analyze environmental factors
        environmental_factors = self._analyze_environmental_factors(alert)
        
        # 4. Analyze temporal patterns
        temporal_patterns = self._analyze_temporal_patterns(alert, historical_alerts)
        
        # 5. Determine root cause
        root_cause = self._determine_root_cause(
            similar_alerts,
            equipment_analysis,
            environmental_factors,
            temporal_patterns
        )
        
        # 6. Generate recommendations
        recommendations = self._generate_recommendations(root_cause, alert)
        
        return {
            "alert_id": alert.get("id"),
            "root_cause": root_cause,
            "confidence": self._calculate_confidence(
                similar_alerts,
                equipment_analysis,
                root_cause
            ),
            "similar_historical_alerts": similar_alerts[:5],  # Top 5
            "equipment_analysis": equipment_analysis,
            "environmental_factors": environmental_factors,
            "temporal_patterns": temporal_patterns,
            "recommended_actions": recommendations,
            "analyzed_at": datetime.utcnow().isoformat()
        }
    
    def _find_similar_historical_alerts(
        self,
        alert: Dict,
        historical_alerts: List[Dict]
    ) -> List[Dict]:
        """Find similar historical alerts"""
        similar = []
        
        alert_type = alert.get("rule_name") or alert.get("alert_type", "")
        equipment_id = alert.get("equipment_id")
        well_name = alert.get("well_name")
        
        for historical in historical_alerts:
            score = 0
            
            # Type match
            if (historical.get("rule_name") == alert_type or
                historical.get("alert_type") == alert_type):
                score += 3
            
            # Equipment match
            if historical.get("equipment_id") == equipment_id:
                score += 2
            
            # Well match
            if historical.get("well_name") == well_name:
                score += 1
            
            if score >= 2:  # Minimum similarity threshold
                similar.append({
                    **historical,
                    "similarity_score": score
                })
        
        # Sort by similarity score
        similar.sort(key=lambda x: x["similarity_score"], reverse=True)
        
        return similar
    
    def _analyze_equipment_history(
        self,
        equipment_id: Optional[str],
        equipment_history: Optional[Dict]
    ) -> Dict:
        """Analyze equipment maintenance and failure history"""
        if not equipment_id:
            return {"status": "no_equipment_id"}
        
        if not equipment_history:
            return {"status": "no_history_available"}
        
        history = equipment_history.get(equipment_id, {})
        
        # Analyze failure patterns
        failures = history.get("failures", [])
        maintenance = history.get("maintenance", [])
        
        # Calculate MTBF (Mean Time Between Failures)
        if len(failures) > 1:
            failure_times = sorted([f["timestamp"] for f in failures])
            intervals = [
                (failure_times[i] - failure_times[i-1]).total_seconds() / 3600
                for i in range(1, len(failure_times))
            ]
            mtbf = sum(intervals) / len(intervals) if intervals else 0
        else:
            mtbf = None
        
        # Check if maintenance is overdue
        last_maintenance = max([m["timestamp"] for m in maintenance]) if maintenance else None
        maintenance_interval = history.get("maintenance_interval_hours", 720)  # 30 days default
        
        is_overdue = False
        if last_maintenance:
            hours_since_maintenance = (
                datetime.utcnow() - last_maintenance
            ).total_seconds() / 3600
            is_overdue = hours_since_maintenance > maintenance_interval
        
        return {
            "equipment_id": equipment_id,
            "total_failures": len(failures),
            "total_maintenance": len(maintenance),
            "mtbf_hours": mtbf,
            "last_maintenance": last_maintenance.isoformat() if last_maintenance else None,
            "maintenance_overdue": is_overdue,
            "reliability_score": self._calculate_reliability_score(failures, maintenance)
        }
    
    def _calculate_reliability_score(
        self,
        failures: List[Dict],
        maintenance: List[Dict]
    ) -> float:
        """Calculate equipment reliability score (0-100)"""
        if not failures:
            return 100.0
        
        # Base score
        score = 100.0
        
        # Deduct for failures (recent failures weigh more)
        now = datetime.utcnow()
        for failure in failures:
            failure_time = failure.get("timestamp", now)
            age_days = (now - failure_time).days
            
            # Weight: recent failures (last 30 days) have more impact
            if age_days < 30:
                weight = 1.0
            elif age_days < 90:
                weight = 0.5
            else:
                weight = 0.2
            
            score -= 10 * weight
        
        # Bonus for recent maintenance
        if maintenance:
            last_maintenance = max([m["timestamp"] for m in maintenance])
            days_since_maintenance = (now - last_maintenance).days
            
            if days_since_maintenance < 7:
                score += 5  # Recent maintenance bonus
        
        return max(0, min(100, score))
    
    def _analyze_environmental_factors(self, alert: Dict) -> Dict:
        """Analyze environmental factors that might contribute to alert"""
        # This would integrate with weather/environmental data
        # For now, return placeholder
        return {
            "temperature": None,
            "pressure": None,
            "humidity": None,
            "weather_events": [],
            "analysis": "Environmental data not available"
        }
    
    def _analyze_temporal_patterns(
        self,
        alert: Dict,
        historical_alerts: List[Dict]
    ) -> Dict:
        """Analyze temporal patterns in alerts"""
        alert_time = datetime.fromisoformat(alert.get("timestamp", datetime.utcnow().isoformat()))
        
        # Group by hour of day
        hourly_counts = defaultdict(int)
        for hist_alert in historical_alerts:
            hist_time = datetime.fromisoformat(hist_alert.get("timestamp", datetime.utcnow().isoformat()))
            hour = hist_time.hour
            hourly_counts[hour] += 1
        
        # Find peak hours
        peak_hours = sorted(hourly_counts.items(), key=lambda x: x[1], reverse=True)[:3]
        
        # Check if current alert is during peak time
        current_hour = alert_time.hour
        is_peak_time = current_hour in [h for h, _ in peak_hours]
        
        return {
            "hour_of_day": current_hour,
            "is_peak_time": is_peak_time,
            "peak_hours": [h for h, _ in peak_hours],
            "hourly_distribution": dict(hourly_counts)
        }
    
    def _determine_root_cause(
        self,
        similar_alerts: List[Dict],
        equipment_analysis: Dict,
        environmental_factors: Dict,
        temporal_patterns: Dict
    ) -> Dict:
        """Determine most likely root cause"""
        root_causes = []
        
        # Equipment-related
        if equipment_analysis.get("reliability_score", 100) < 70:
            root_causes.append({
                "type": "equipment_failure",
                "confidence": 0.8,
                "description": f"Equipment reliability score is {equipment_analysis.get('reliability_score', 0):.1f}"
            })
        
        if equipment_analysis.get("maintenance_overdue", False):
            root_causes.append({
                "type": "maintenance_overdue",
                "confidence": 0.7,
                "description": "Equipment maintenance is overdue"
            })
        
        # Pattern-based
        if len(similar_alerts) > 5:
            root_causes.append({
                "type": "recurring_issue",
                "confidence": 0.6,
                "description": f"Similar alerts occurred {len(similar_alerts)} times historically"
            })
        
        # Temporal
        if temporal_patterns.get("is_peak_time", False):
            root_causes.append({
                "type": "peak_time_issue",
                "confidence": 0.5,
                "description": "Alert occurred during peak time period"
            })
        
        # Select highest confidence root cause
        if root_causes:
            best = max(root_causes, key=lambda x: x["confidence"])
            return best
        else:
            return {
                "type": "unknown",
                "confidence": 0.3,
                "description": "Unable to determine root cause with high confidence"
            }
    
    def _generate_recommendations(self, root_cause: Dict, alert: Dict) -> List[str]:
        """Generate recommended actions based on root cause"""
        recommendations = []
        
        root_cause_type = root_cause.get("type")
        
        if root_cause_type == "equipment_failure":
            recommendations.extend([
                "Inspect equipment for physical damage",
                "Check equipment logs for error messages",
                "Review recent maintenance records",
                "Consider preventive maintenance"
            ])
        elif root_cause_type == "maintenance_overdue":
            recommendations.extend([
                "Schedule immediate maintenance",
                "Review maintenance schedule",
                "Check maintenance history"
            ])
        elif root_cause_type == "recurring_issue":
            recommendations.extend([
                "Investigate underlying cause",
                "Review alert rules for false positives",
                "Consider equipment replacement if recurring"
            ])
        else:
            recommendations.append("Further investigation required")
        
        return recommendations
    
    def _calculate_confidence(
        self,
        similar_alerts: List[Dict],
        equipment_analysis: Dict,
        root_cause: Dict
    ) -> float:
        """Calculate confidence in root cause analysis"""
        confidence = root_cause.get("confidence", 0.5)
        
        # Boost confidence if many similar alerts
        if len(similar_alerts) > 10:
            confidence = min(1.0, confidence + 0.2)
        elif len(similar_alerts) > 5:
            confidence = min(1.0, confidence + 0.1)
        
        # Boost confidence if equipment analysis available
        if equipment_analysis.get("status") != "no_history_available":
            confidence = min(1.0, confidence + 0.1)
        
        return confidence
```

### 2. RCA API

```python
@app.post("/alerts/{alert_id}/analyze")
async def analyze_alert_root_cause(
    alert_id: str,
    db: Session = Depends(get_db),
    _: Dict[str, Any] = Depends(require_alert_read)
):
    """Perform root cause analysis on an alert"""
    # Get alert
    alert = db.query(Alert).filter(Alert.alert_id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    # Get historical alerts (last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    historical = db.query(Alert).filter(
        Alert.timestamp >= thirty_days_ago,
        Alert.alert_id != alert_id
    ).all()
    
    # Convert to dict
    alert_dict = {
        "id": alert.alert_id,
        "timestamp": alert.timestamp.isoformat(),
        "severity": alert.severity,
        "well_name": alert.well_name,
        "equipment_id": alert.equipment_id,
        "rule_name": alert.rule_name,
        "message": alert.message
    }
    
    historical_dicts = [{
        "id": a.alert_id,
        "timestamp": a.timestamp.isoformat(),
        "severity": a.severity,
        "well_name": a.well_name,
        "equipment_id": a.equipment_id,
        "rule_name": a.rule_name,
        "message": a.message
    } for a in historical]
    
    # Perform RCA
    rca_engine = RootCauseAnalysisEngine()
    analysis = rca_engine.analyze(alert_dict, historical_dicts)
    
    return analysis
```

---

## <a name="fatigue"></a>😴 Alert Fatigue Detection

### 1. Fatigue Detection Engine

```python
# backend/alert-service/alert_fatigue.py
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from collections import defaultdict, deque
import logging

logger = logging.getLogger(__name__)

class AlertFatigueDetector:
    """Detects and manages alert fatigue"""
    
    def __init__(self):
        self.alert_frequency: Dict[str, deque] = defaultdict(lambda: deque(maxlen=100))
        self.suppression_rules: List[Dict] = []
        self.user_feedback: Dict[str, Dict] = {}  # alert_id -> feedback
    
    def check_fatigue(
        self,
        alert: Dict,
        time_window: timedelta = timedelta(minutes=10)
    ) -> Dict:
        """Check if alert should be suppressed due to fatigue"""
        alert_key = self._get_alert_key(alert)
        now = datetime.utcnow()
        
        # Get recent alerts of same type
        recent_alerts = [
            ts for ts in self.alert_frequency[alert_key]
            if (now - ts).total_seconds() < time_window.total_seconds()
        ]
        
        frequency = len(recent_alerts)
        
        # Check suppression rules
        should_suppress = False
        suppression_reason = None
        
        for rule in self.suppression_rules:
            if self._matches_rule(alert, rule):
                if frequency >= rule.get("max_frequency", 10):
                    should_suppress = True
                    suppression_reason = rule.get("reason", "Frequency threshold exceeded")
                    break
        
        # Check user feedback
        if alert.get("id") in self.user_feedback:
            feedback = self.user_feedback[alert.get("id")]
            if feedback.get("is_false_positive", False):
                should_suppress = True
                suppression_reason = "Marked as false positive by user"
        
        # Record alert
        self.alert_frequency[alert_key].append(now)
        
        return {
            "should_suppress": should_suppress,
            "frequency": frequency,
            "suppression_reason": suppression_reason,
            "time_window_seconds": time_window.total_seconds()
        }
    
    def _get_alert_key(self, alert: Dict) -> str:
        """Get unique key for alert grouping"""
        # Group by rule_name and equipment/well
        equipment = alert.get("equipment_id") or alert.get("well_name", "unknown")
        return f"{alert.get('rule_name', 'unknown')}:{equipment}"
    
    def _matches_rule(self, alert: Dict, rule: Dict) -> bool:
        """Check if alert matches suppression rule"""
        # Match by rule name
        if rule.get("rule_name") and alert.get("rule_name") != rule.get("rule_name"):
            return False
        
        # Match by equipment
        if rule.get("equipment_id") and alert.get("equipment_id") != rule.get("equipment_id"):
            return False
        
        # Match by well
        if rule.get("well_name") and alert.get("well_name") != rule.get("well_name"):
            return False
        
        return True
    
    def add_suppression_rule(self, rule: Dict):
        """Add suppression rule"""
        self.suppression_rules.append(rule)
        logger.info(f"Added suppression rule: {rule.get('name')}")
    
    def record_user_feedback(self, alert_id: str, feedback: Dict):
        """Record user feedback on alert"""
        self.user_feedback[alert_id] = {
            **feedback,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # If marked as false positive, update suppression rules
        if feedback.get("is_false_positive", False):
            alert = feedback.get("alert")
            if alert:
                self.add_suppression_rule({
                    "name": f"Auto-suppress: {alert.get('rule_name')}",
                    "rule_name": alert.get("rule_name"),
                    "equipment_id": alert.get("equipment_id"),
                    "max_frequency": 0,  # Suppress all
                    "reason": "User marked as false positive"
                })
    
    def get_fatigue_stats(self) -> Dict:
        """Get alert fatigue statistics"""
        stats = {}
        
        for alert_key, timestamps in self.alert_frequency.items():
            if not timestamps:
                continue
            
            now = datetime.utcnow()
            recent = [ts for ts in timestamps if (now - ts).total_seconds() < 3600]  # Last hour
            
            stats[alert_key] = {
                "total_alerts": len(timestamps),
                "recent_alerts_1h": len(recent),
                "rate_per_minute": len(recent) / 60 if recent else 0
            }
        
        return stats
```

### 2. Fatigue Detection Integration

```python
@app.post("/alerts")
async def create_alert(
    alert: AlertCreate,
    db: Session = Depends(get_db),
    _: Dict[str, Any] = Depends(require_alert_write)
):
    """Create alert with fatigue detection"""
    # Check for fatigue
    fatigue_detector = AlertFatigueDetector()
    fatigue_check = fatigue_detector.check_fatigue(alert.dict())
    
    if fatigue_check["should_suppress"]:
        logger.info(f"Alert suppressed due to fatigue: {fatigue_check['suppression_reason']}")
        return {
            "message": "Alert suppressed",
            "reason": fatigue_check["suppression_reason"],
            "frequency": fatigue_check["frequency"]
        }
    
    # Continue with normal alert creation
    # ... existing code ...
```

---

## <a name="timeline"></a>📅 Alert Timeline Visualization

### 1. Timeline API

```python
@app.get("/alerts/timeline")
async def get_alert_timeline(
    start_date: datetime,
    end_date: datetime,
    well_name: Optional[str] = None,
    equipment_id: Optional[str] = None,
    db: Session = Depends(get_db),
    _: Dict[str, Any] = Depends(require_alert_read)
):
    """Get alert timeline for visualization"""
    query = db.query(Alert).filter(
        Alert.timestamp >= start_date,
        Alert.timestamp <= end_date
    )
    
    if well_name:
        query = query.filter(Alert.well_name == well_name)
    if equipment_id:
        query = query.filter(Alert.equipment_id == equipment_id)
    
    alerts = query.order_by(Alert.timestamp).all()
    
    # Correlate alerts
    alerts_dict = [{
        "id": a.alert_id,
        "timestamp": a.timestamp.isoformat(),
        "severity": a.severity,
        "well_name": a.well_name,
        "equipment_id": a.equipment_id,
        "rule_name": a.rule_name,
        "message": a.message,
        "status": a.status
    } for a in alerts]
    
    correlated = correlation_engine.correlate_alerts(alerts_dict)
    
    # Build timeline
    timeline = {
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "events": []
    }
    
    for item in correlated:
        if item.get("type") == "alert_group":
            timeline["events"].append({
                "type": "alert_group",
                "group_id": item["group_id"],
                "timestamp": item["first_occurrence"],
                "duration_seconds": item["duration_seconds"],
                "count": item["count"],
                "severity": item["severity"],
                "root_cause": item["root_cause"],
                "alerts": item["related_alerts"]
            })
        else:
            timeline["events"].append({
                "type": "alert",
                "alert_id": item["id"],
                "timestamp": item["timestamp"],
                "severity": item["severity"],
                "message": item["message"]
            })
    
    return timeline
```

### 2. Frontend Timeline Component

```typescript
// frontend/web/src/components/AlertTimeline.tsx
import { useQuery } from '@tanstack/react-query';
import { Timeline } from 'react-vis-timeline';

export function AlertTimeline({ 
  startDate, 
  endDate, 
  wellName, 
  equipmentId 
}: AlertTimelineProps) {
  const { data: timeline, isLoading } = useQuery({
    queryKey: ['alert-timeline', startDate, endDate, wellName, equipmentId],
    queryFn: async () => {
      const params = new URLSearchParams({
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      });
      if (wellName) params.append('well_name', wellName);
      if (equipmentId) params.append('equipment_id', equipmentId);
      
      const response = await fetch(`/api/v1/alerts/timeline?${params}`);
      return response.json();
    }
  });

  if (isLoading) return <div>Loading timeline...</div>;

  const items = timeline.events.map((event: any) => ({
    id: event.type === 'alert_group' ? event.group_id : event.alert_id,
    start: new Date(event.timestamp),
    end: event.duration_seconds 
      ? new Date(new Date(event.timestamp).getTime() + event.duration_seconds * 1000)
      : new Date(event.timestamp),
    content: event.type === 'alert_group' 
      ? `Alert Group (${event.count} alerts)`
      : event.message,
    className: `severity-${event.severity}`,
    group: event.well_name || event.equipment_id,
    title: event.type === 'alert_group' 
      ? `Root Cause: ${event.root_cause?.likely_equipment || 'Unknown'}`
      : event.message
  }));

  const groups = [
    ...new Set(timeline.events.map((e: any) => e.well_name || e.equipment_id))
  ].map(name => ({ id: name, content: name }));

  return (
    <div className="alert-timeline">
      <Timeline
        items={items}
        groups={groups}
        options={{
          stack: true,
          showCurrentTime: true,
          zoomMin: 1000 * 60 * 60, // 1 hour
          zoomMax: 1000 * 60 * 60 * 24 * 7 // 1 week
        }}
      />
    </div>
  );
}
```

---

## <a name="testing"></a>🧪 Testing Strategy

### 1. Unit Tests

```python
# backend/tests/test_alert_correlation.py
import pytest
from backend.alert_service.alert_correlation import AlertCorrelationEngine

def test_correlation_same_equipment():
    """Test correlation of alerts from same equipment"""
    engine = AlertCorrelationEngine()
    
    alerts = [
        {"id": "1", "equipment_id": "PUMP-001", "timestamp": "2025-12-01T10:00:00"},
        {"id": "2", "equipment_id": "PUMP-001", "timestamp": "2025-12-01T10:01:00"},
    ]
    
    correlated = engine.correlate_alerts(alerts)
    
    assert len(correlated) == 1
    assert correlated[0]["type"] == "alert_group"
    assert correlated[0]["count"] == 2

def test_correlation_time_window():
    """Test correlation respects time window"""
    engine = AlertCorrelationEngine()
    
    alerts = [
        {"id": "1", "equipment_id": "PUMP-001", "timestamp": "2025-12-01T10:00:00"},
        {"id": "2", "equipment_id": "PUMP-001", "timestamp": "2025-12-01T10:10:00"},  # 10 min later
    ]
    
    correlated = engine.correlate_alerts(alerts)
    
    # Should not correlate (outside 5-min window)
    assert len(correlated) == 2
```

---

## <a name="best-practices"></a>✅ Best Practices

### 1. Correlation Rules
- Start with simple rules (time + equipment)
- Gradually add pattern-based rules
- Monitor correlation accuracy

### 2. RCA
- Collect sufficient historical data
- Update equipment relationships
- Refine confidence calculations

### 3. Fatigue Detection
- Set appropriate frequency thresholds
- Collect user feedback
- Adjust rules based on feedback

---

**نسخه:** 1.0.0  
**تاریخ:** دسامبر 2025

