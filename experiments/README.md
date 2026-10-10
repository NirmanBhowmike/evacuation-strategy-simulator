# Experiment Runners

This directory contains development, calibration, diagnostic, and formal execution utilities for the evacuation simulator.

The final Architecture V2 v1.2 dataset was produced from the frozen simulation source at:

```text
1a84923664c028f3b6b15c5ec93ddaf9b7905095
```

Main commands:

```bash
npm run formal:pair
npm run diagnostic:matrix
npm run formal:batch
```

Calibration and diagnostic scripts are retained because they document how model parameters and formal conditions were selected. Their outputs should not be substituted for the completed 4,200-run formal dataset.

Current formal results are under `results/formal-v1.2/`.