# AI Ping-Pong – Synthetic Data

## File Index

1. **time_efficiency.csv** – workflow runtimes and quality across five runs each.  
   Columns: `workflow`, `run`, `manual_time_min`, `automated_time_min`, `efficiency_gain_percent`, `manual_quality_percent`, `automated_quality_percent`
2. **quality_degradation.csv** – accuracy decay over five iterations.  
   Columns: `iteration`, `approach`, `accuracy_percent`
3. **model_strengths.csv** – model capability matrix.  
   Columns: `model`, `core_strength`, `ideal_task`, `avg_step_time_min`, `quality_lift`
4. **free_tier_accuracy.csv** – free-tier benchmark scores.  
   Columns: `model`, `accuracy_percent`
5. **roi_calculation.csv** – ROI math inputs.  
   Columns: `metric`, `value`
6. **quality_metrics.csv** – headline quality measures.  
   Columns: `metric`, `score`
7. **experiment_summary.csv** – representative orchestration sequences.  
   Columns: `sequence`, `quality_percent`, `meets_criteria`
8. **revision_cycles.csv** – revision counts by approach.  
   Columns: `approach`, `avg_revision_cycles`
9. **productivity_growth.csv** – macro productivity deltas.  
   Columns: `metric`, `baseline_value`, `pingpong_value`, `unit`
