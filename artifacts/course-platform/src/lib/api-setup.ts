import { setAuthTokenGetter } from "@workspace/api-client-react";

// Initialize the API client to use the token from localStorage for all requests
export function setupApiClient() {
  setAuthTokenGetter(() => {
    return localStorage.getItem("token");
  });
}
