// proxy.ts redirects every request based on session state (no token -> /login,
// customer -> /products, staff -> /admin/dashboard) before this ever renders.
export default function Home() {
  return null;
}
