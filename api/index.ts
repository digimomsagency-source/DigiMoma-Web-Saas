import app from "../server";

export default function handler(req: any, res: any) {
  // If req.body was pre-parsed by Vercel serverless runtime, mark _body = true
  // so Express's body-parser doesn't hang on an already-consumed stream.
  if (req.body !== undefined && req.body !== null) {
    req._body = true;
  }

  // 1. Check if rewritten route query parameter was supplied by Vercel rewrite rule
  let targetRoute = "";
  if (req.query && req.query.route) {
    const rawRoute = Array.isArray(req.query.route) ? req.query.route.join("/") : req.query.route;
    targetRoute = `/api/${rawRoute}`;
    // Remove internal routing query parameter so it doesn't leak into endpoint query handlers
    delete req.query.route;
  } else {
    // Fallback: check Vercel routing headers or original URL
    const original = (req.headers["x-matched-path"] as string) || (req.headers["x-invoke-path"] as string) || req.originalUrl || req.url || "";
    if (original && original !== "/api" && original !== "/api/") {
      targetRoute = original;
    } else if (req.headers["x-now-route-matches"]) {
      try {
        const params = new URLSearchParams(req.headers["x-now-route-matches"]);
        const subpath = params.get("1");
        if (subpath) {
          targetRoute = `/api/${decodeURIComponent(subpath)}`;
        }
      } catch {
        // ignore
      }
    }
  }

  if (targetRoute) {
    // Preserve any query string
    const queryIdx = req.url.indexOf("?");
    const queryString = queryIdx !== -1 ? req.url.slice(queryIdx) : "";
    req.url = targetRoute.includes("?") ? targetRoute : `${targetRoute}${queryString}`;
  }

  // Ensure Vercel serverless function keeps the event loop alive until Express finishes
  return new Promise<void>((resolve, reject) => {
    res.on("finish", resolve);
    res.on("close", resolve);
    res.on("error", reject);

    try {
      app(req, res);
    } catch (err) {
      console.error("[Vercel Serverless Function Execution Error]:", err);
      if (!res.headersSent) {
        res.status(500).json({
          error: "Internal Serverless Execution Error",
          message: err instanceof Error ? err.message : String(err),
        });
      }
      resolve();
    }
  });
}

export { app };
