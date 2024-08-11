// metrics.js
const METRICS_NAMESPACE = "MonitoringAppNamespace";

const METRIC_AVAILABILITY = "WebsiteAvailability";
const METRIC_LATENCY = "WebsiteLatency";

// Alarm thresholds
const AVAILABILITY_THRESHOLD = 1; // Example: 100% availability
const LATENCY_THRESHOLD = 300; // Example: 300 milliseconds

module.exports = {
  METRICS_NAMESPACE,
  METRIC_AVAILABILITY,
  METRIC_LATENCY,
  AVAILABILITY_THRESHOLD,
  LATENCY_THRESHOLD,
};
