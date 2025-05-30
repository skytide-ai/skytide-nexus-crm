
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import App from './App.tsx'
import './index.css'

// Clerk publishable key - safe to store in frontend code
const PUBLISHABLE_KEY = "pk_test_dXNhYmxlLXBvbnktNDEuY2xlcmsuYWNjb3VudHMuZGV2JA"

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Clerk Publishable Key. Please add VITE_CLERK_PUBLISHABLE_KEY to your environment variables.")
}

console.log("Clerk Publishable Key loaded:", PUBLISHABLE_KEY ? "✓" : "✗")

createRoot(document.getElementById("root")!).render(
  <ClerkProvider 
    publishableKey={PUBLISHABLE_KEY}
    appearance={{
      variables: {
        colorPrimary: "#2563eb",
      }
    }}
  >
    <App />
  </ClerkProvider>
);
