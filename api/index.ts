import app from "../server.ts";

export default function handler(req: any, res: any) {
  // Restore original requested URL when Vercel rewrites /api/(.*) to /api
  const matchedPath = req.headers["x-matched-path"] || req.headers["x-invoke-path"] || req.originalUrl;
  if (matchedPath && typeof matchedPath === "string" && matchedPath !== "/api" && matchedPath !== "/api/") {
    req.url = matchedPath;
  } else if (req.headers["x-now-route-matches"]) {
    try {
      const params = new URLSearchParams(req.headers["x-now-route-matches"]);
      const subpath = params.get("1");
      if (subpath) {
        req.url = `/api/${decodeURIComponent(subpath)}`;
      }
    } catch {
      // fallback
    }
  }

  return app(req, res);
}

export { app };
