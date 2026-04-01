/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Shield, 
  Activity, 
  RefreshCw, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Server,
  Zap,
  Globe,
  Settings,
  BarChart3,
  Search,
  Terminal
} from "lucide-react";

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

export default function App() {
  const [proxies, setProxies] = useState<ProxyNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [newProxy, setNewProxy] = useState({ host: "", port: "", protocol: "http" });
  const [rotationResult, setRotationResult] = useState<any>(null);
  const [rotating, setRotating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchProxies = async () => {
    try {
      const res = await fetch("/api/proxies");
      const data = await res.json();
      setProxies(data);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch proxies", err);
    }
  };

  useEffect(() => {
    fetchProxies();
    const interval = setInterval(fetchProxies, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAddProxy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProxy.host || !newProxy.port) return;
    
    try {
      const res = await fetch("/api/proxies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProxy),
      });
      if (res.ok) {
        setNewProxy({ host: "", port: "", protocol: "http" });
        fetchProxies();
      }
    } catch (err) {
      console.error("Failed to add proxy", err);
    }
  };

  const handleDeleteProxy = async (id: string) => {
    try {
      await fetch(`/api/proxies/${id}`, { method: "DELETE" });
      fetchProxies();
    } catch (err) {
      console.error("Failed to delete proxy", err);
    }
  };

  const handleRotate = async () => {
    setRotating(true);
    try {
      const res = await fetch("/api/rotate");
      const data = await res.json();
      setRotationResult(data);
    } catch (err) {
      console.error("Rotation failed", err);
    } finally {
      setRotating(false);
    }
  };

  const filteredProxies = proxies.filter(p => 
    p.host.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCount = proxies.filter(p => p.status === "active").length;
  const avgLatency = proxies.length > 0 
    ? Math.round(proxies.reduce((acc, p) => acc + p.latency, 0) / proxies.length) 
    : 0;

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-[#E4E4E7] font-sans selection:bg-orange-500/30">
      {/* Sidebar Rail */}
      <div className="fixed left-0 top-0 bottom-0 w-16 bg-[#121214] border-r border-white/5 flex flex-col items-center py-8 gap-8 z-50">
        <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div className="flex flex-col gap-6 text-white/40">
          <Globe className="w-5 h-5 cursor-pointer hover:text-white transition-colors" />
          <BarChart3 className="w-5 h-5 cursor-pointer hover:text-white transition-colors" />
          <Settings className="w-5 h-5 cursor-pointer hover:text-white transition-colors" />
        </div>
      </div>

      {/* Main Content */}
      <main className="pl-16">
        {/* Header */}
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-[#0A0A0B]/80 backdrop-blur-xl sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold tracking-tight">ProxyFlow</h1>
            <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[10px] uppercase tracking-widest font-bold text-white/40">
              v1.0.4-stable
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-orange-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Search nodes..." 
                className="bg-white/5 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button 
              onClick={handleRotate}
              disabled={rotating}
              className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-orange-500/20"
            >
              <RefreshCw className={`w-4 h-4 ${rotating ? 'animate-spin' : ''}`} />
              Rotate Proxy
            </button>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: "Active Nodes", value: activeCount, icon: Activity, color: "text-green-400" },
              { label: "Total Pool", value: proxies.length, icon: Server, color: "text-blue-400" },
              { label: "Avg Latency", value: `${avgLatency}ms`, icon: Clock, color: "text-orange-400" },
              { label: "Throughput", value: "1.2k/s", icon: Zap, color: "text-purple-400" },
            ].map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-[#121214] border border-white/5 p-5 rounded-2xl flex items-center justify-between group hover:border-white/10 transition-colors"
              >
                <div>
                  <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
                </div>
                <div className={`p-3 bg-white/5 rounded-xl ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Proxy List */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold uppercase tracking-widest text-white/40 flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Live Node Monitoring
                </h2>
              </div>
              
              <div className="bg-[#121214] border border-white/5 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 bg-white/[0.02]">
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/20">Node ID</th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/20">Endpoint</th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/20">Status</th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/20">Latency</th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-white/20">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      <AnimatePresence mode="popLayout">
                        {filteredProxies.map((proxy) => (
                          <motion.tr 
                            key={proxy.id}
                            layout
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="group hover:bg-white/[0.02] transition-colors"
                          >
                            <td className="px-6 py-4">
                              <span className="font-mono text-xs text-white/40">#{proxy.id}</span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">{proxy.host}</span>
                                <span className="text-[10px] text-white/30 uppercase">{proxy.protocol} • Port {proxy.port}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                {proxy.status === "active" ? (
                                  <div className="flex items-center gap-1.5 text-green-400 text-xs font-medium">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                    Active
                                  </div>
                                ) : proxy.status === "failed" ? (
                                  <div className="flex items-center gap-1.5 text-red-400 text-xs font-medium">
                                    <XCircle className="w-3.5 h-3.5" />
                                    Failed
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5 text-orange-400 text-xs font-medium">
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    Checking
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 font-mono text-xs">
                              <span className={proxy.latency > 300 ? "text-orange-400" : "text-white/60"}>
                                {proxy.latency}ms
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <button 
                                onClick={() => handleDeleteProxy(proxy.id)}
                                className="p-2 text-white/20 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>
                {filteredProxies.length === 0 && (
                  <div className="p-12 text-center flex flex-col items-center gap-3">
                    <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center">
                      <Search className="w-6 h-6 text-white/20" />
                    </div>
                    <p className="text-sm text-white/40">No nodes found matching your criteria.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar Controls */}
            <div className="space-y-6">
              {/* Add Proxy */}
              <div className="bg-[#121214] border border-white/5 rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Plus className="w-4 h-4 text-orange-500" />
                  Provision New Node
                </h3>
                <form onSubmit={handleAddProxy} className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-white/20">Host / IP Address</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 192.168.1.1" 
                      className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-orange-500/50"
                      value={newProxy.host}
                      onChange={(e) => setNewProxy({...newProxy, host: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-white/20">Port</label>
                      <input 
                        type="number" 
                        placeholder="8080" 
                        className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-orange-500/50"
                        value={newProxy.port}
                        onChange={(e) => setNewProxy({...newProxy, port: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-white/20">Protocol</label>
                      <select 
                        className="w-full bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-orange-500/50 appearance-none"
                        value={newProxy.protocol}
                        onChange={(e) => setNewProxy({...newProxy, protocol: e.target.value as any})}
                      >
                        <option value="http">HTTP</option>
                        <option value="https">HTTPS</option>
                      </select>
                    </div>
                  </div>
                  <button className="w-full bg-white/5 hover:bg-white/10 border border-white/10 py-2.5 rounded-lg text-sm font-medium transition-all active:scale-95 mt-2">
                    Add to Pool
                  </button>
                </form>
              </div>

              {/* Rotation Output */}
              <div className="bg-[#121214] border border-white/5 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-blue-400" />
                    Rotation Output
                  </h3>
                  {rotationResult && (
                    <span className="text-[10px] text-green-400 font-bold uppercase tracking-widest">Success</span>
                  )}
                </div>
                
                <div className="bg-black/40 rounded-xl p-4 font-mono text-xs min-h-[120px] border border-white/5 relative overflow-hidden">
                  {rotationResult ? (
                    <motion.div 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }}
                      className="space-y-2"
                    >
                      <div className="flex items-center gap-2 text-white/40">
                        <span className="text-blue-400">$</span> curl -x {rotationResult.proxy}
                      </div>
                      <div className="text-green-400/80">
                        {JSON.stringify(rotationResult.node, null, 2)}
                      </div>
                    </motion.div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-white/20 gap-2">
                      <RefreshCw className="w-8 h-8 opacity-10" />
                      <p>Awaiting rotation request...</p>
                    </div>
                  )}
                </div>
              </div>

              {/* System Health */}
              <div className="bg-orange-500/5 border border-orange-500/10 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
                  <h3 className="text-sm font-semibold text-orange-500">System Integrity</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/40">CPU Load</span>
                    <span className="font-mono">12.4%</span>
                  </div>
                  <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                    <div className="bg-orange-500 h-full w-[12.4%]" />
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/40">Memory Usage</span>
                    <span className="font-mono">256MB</span>
                  </div>
                  <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                    <div className="bg-orange-500 h-full w-[35%]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
