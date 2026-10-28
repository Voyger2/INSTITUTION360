import * as React from "react";

const BureauWorkloadChart = React.lazy(() =>
  import("./bureau-workload").then((mod) => ({ default: mod.BureauWorkloadChart }))
);
const StatusDistributionChart = React.lazy(() =>
  import("./status-distribution").then((mod) => ({ default: mod.StatusDistributionChart }))
);

export const charts = {
  BureauWorkloadChart,
  StatusDistributionChart,
};