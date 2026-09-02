export const getApiUrl = (): string => {
  // If explicitly configured with custom domain
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl && envUrl.trim() !== "" && !envUrl.includes("localhost")) {
    return envUrl.replace(/\/$/, "");
  }
  // If in browser on production Vercel domain, use same-origin to leverage Next.js Edge rewrites
  if (typeof window !== "undefined" && window.location.hostname.includes("vercel.app")) {
    return "";
  }
  // Default direct backend URL
  return "https://razorpay-commerce-backend.onrender.com";
};