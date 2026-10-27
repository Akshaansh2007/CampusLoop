
const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

export const API_URLS = {
  auth: `${API_BASE_URL}/api/auth`,
  listings: `${API_BASE_URL}/api/listings`,
};

export default API_BASE_URL;
