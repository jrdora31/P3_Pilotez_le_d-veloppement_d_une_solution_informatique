import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  vus: Number(__ENV.VUS || 5),
  duration: __ENV.DURATION || "30s",
  summaryTrendStats: ["avg", "min", "med", "p(90)", "p(95)", "max"],
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<500"]
  }
};

const apiUrl = __ENV.API_URL || "http://localhost:3000";
const token = __ENV.SHARE_TOKEN;

export function setup() {
  if (!token) {
    throw new Error("SHARE_TOKEN is required. Example: -e SHARE_TOKEN=<token>");
  }

  return {
    url: `${apiUrl}/share-links/${token}`
  };
}

export default function (data) {
  const response = http.get(data.url);

  check(response, {
    "status is 200": (res) => res.status === 200,
    "duration under 500 ms": (res) => res.timings.duration < 500
  });

  sleep(1);
}
