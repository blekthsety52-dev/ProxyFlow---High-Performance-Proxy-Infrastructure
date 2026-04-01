import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cors from "cors";
import axios from "axios";
import httpProxy from "http-proxy";

const app = express();
const PORT = 3000;
const proxy = httpProxy.createProxyServer({});

// Proxy Pool State
interface ProxyNode {
  id: string;
  host: string;
  port: number;
  protocol: "http" | "https";
  status: "active" | "failed" | "checking";
  latency: number;
  lastChecked: Date;
  successCount: number;
  failCount: number;
}

let proxyPool: ProxyNode[] = [
  { id: "1", host: "1.1.1.1", port: 8080, protocol: "http", status: "active", latency: 120, lastChecked: new Date(), successCount: 0, failCount: 0 },
  { id: "2", host: "2.2.2.2", port: 3128, protocol: "http", status: "active", latency: 250, lastChecked: new Date(), successCount: 0, failCount: 0 },
  { id: "3", host: "3.3.3.3", port: 80, protocol: "http", status: "failed", latency: 0, lastChecked: new Date(), successCount: 0, failCount: 0 },
];

let rotationIndex = 0;

app.use(cors());
app.use(express.json());

// API Routes
app.get("/api/proxies", (req, res) => {
  res.json(proxyPool);
});

app.post("/api/proxies", (req, res) => {
  const { host, port, protocol } = req.body;
  const newProxy: ProxyNode = {
    id: Math.random().toString(36).substr(2, 9),
    host,
    port: parseInt(port),
    protocol: protocol || "http",
    status: "checking",
    latency: 0,
    lastChecked: new Date(),
    successCount: 0,
    failCount: 0,
  };
  proxyPool.push(newProxy);
  checkProxyHealth(newProxy);
  res.status(201).json(newProxy);
});

app.delete("/api/proxies/:id", (req, res) => {
  proxyPool = proxyPool.filter(p => p.id !== req.params.id);
  res.status(204).send();
});

// Rotation Endpoint
app.get("/api/rotate", (req, res) => {
  const activeProxies = proxyPool.filter(p => p.status === "active");
  if (activeProxies.length === 0) {
    return res.status(503).json({ error: "No active proxies available" });
  }
  
  const selected = activeProxies[rotationIndex % activeProxies.length];
  rotationIndex++;
  
  res.json({
    proxy: `${selected.protocol}://${selected.host}:${selected.port}`,
    node: selected
  });
});

// Health Check Logic
async function checkProxyHealth(node: ProxyNode) {
  node.status = "checking";
  const start = Date.now();
  try {
    // In a real scenario, we'd use the proxy to fetch a test URL
    // For this demo, we'll simulate a check
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
    
    const isSuccess = Math.random() > 0.2; // 80% success rate for simulation
    if (isSuccess) {
      node.status = "active";
      node.latency = Date.now() - start;
      node.successCount++;
    } else {
      throw new Error("Timeout");
    }
  } catch (err) {
    node.status = "failed";
    node.latency = 0;
    node.failCount++;
  }
  node.lastChecked = new Date();
}

// Periodic Health Checks
setInterval(() => {
  proxyPool.forEach(checkProxyHealth);
}, 30000);

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ProxyFlow Server running on http://localhost:${PORT}`);
  });
}

startServer();
