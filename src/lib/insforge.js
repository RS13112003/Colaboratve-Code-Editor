import { createClient } from "@insforge/sdk";

const baseUrl = import.meta.env.VITE_INSFORGE_BASE_URL;

if (!baseUrl) {
  throw new Error("Missing VITE_INSFORGE_BASE_URL. Add it to your .env.local file.");
}

export const insforge = createClient({
  baseUrl,
});

export { baseUrl };
