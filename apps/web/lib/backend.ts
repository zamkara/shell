const configuredBackendURL = process.env.BACKEND_URL?.trim()

if (!configuredBackendURL && process.env.NODE_ENV === "production") {
  throw new Error("BACKEND_URL is required in production")
}

export const BACKEND_URL = (
  configuredBackendURL || "http://localhost:8080"
).replace(/\/$/, "")
