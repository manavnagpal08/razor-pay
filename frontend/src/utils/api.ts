export const getApiUrl = (): string => {
  // If explicitly configured with environment variable
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl && envUrl.trim() !== "") {
    return envUrl.replace(/\/$/, "");
  }

  // Local development fallback
  if (
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
  ) {
    return "http://localhost:8000";
  }

  // Direct production backend URL
  return "https://razorpay-commerce-backend.onrender.com";
};