import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, GitCompareArrows, Loader2 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from "recharts";

const COLORS = ["#0f172a", "#0d9488", "#d97706", "#dc2626", "#2563eb"];

export default function ComparePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ids = searchParams.get("ids")?.split(",").filter(Boolean) || [];
    if (ids.length < 2) {
      navigate("/");
      return;
    }
    const fetchReports = async () => {
      try {
        const res = await api.post("/reports/compare", { report_ids: ids });
        setReports(res.data);
      } catch {
        navigate("/");
      }
      setLoading(false);
    };
    fetchReports();
  }, [searchParams, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  // Build comparison data
  const revenueCompare = reports.map((r, i) => ({
    name: `${r.drug_name}\n(${r.region})`,
    short: r.drug_name,
    base: r.forecast?.summary?.total_cumulative_revenue_base_millions || 0,
    best: r.forecast?.summary?.total_cumulative_revenue_best_millions || 0,
    worst: r.forecast?.summary?.total_cumulative_revenue_worst_millions || 0,
    color: COLORS[i % COLORS.length],
  }));

  const cagrCompare = reports.map((r, i) => ({
    name: r.drug_name,
    cagr: r.forecast?.summary?.cagr_base_pct || 0,
    color: COLORS[i % COLORS.length],
  }));

  const marketSizeCompare = reports.map((r, i) => ({
    name: r.drug_name,
    current: r.market_research?.market_overview?.current_market_size_usd_millions || 0,
    projected: r.market_research?.market_overview?.projected_market_size_usd_millions || 0,
    color: COLORS[i % COLORS.length],
  }));

  return (
    <div className="p-8 max-w-7xl" data-testid="compare-page">
      <div className="flex items-center gap-3 mb-8">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")} data-testid="compare-back-btn">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <GitCompareArrows className="w-5 h-5 text-slate-400" />
            <h1 className="text-3xl font-bold text-slate-900" style={{ fontFamily: "'Playfair Display', serif" }}>
              Report Comparison
            </h1>
          </div>
          <p className="text-slate-500 mt-1">Comparing {reports.length} reports side by side</p>
        </div>
      </div>

      {/* Report Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {reports.map((r, i) => (
          <Card key={r.id} className="bg-white border-slate-200 shadow-sm" style={{ borderTopColor: COLORS[i], borderTopWidth: 3 }}>
            <CardContent className="p-5">
              <h3 className="font-bold text-slate-900 text-lg mb-1">{r.drug_name}</h3>
              <div className="flex gap-2 mb-3">
                <Badge variant="outline" className="text-xs">{r.disease}</Badge>
                <Badge variant="outline" className="text-xs">{r.region}</Badge>
                <Badge variant="outline" className="text-xs">{r.forecast_horizon}yr</Badge>
              </div>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Market Size</span>
                  <span className="font-semibold text-slate-900">${r.market_research?.market_overview?.current_market_size_usd_millions || 0}M</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">CAGR (Base)</span>
                  <span className="font-semibold text-slate-900">{r.forecast?.summary?.cagr_base_pct || 0}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Peak Revenue</span>
                  <span className="font-semibold text-slate-900">${r.forecast?.summary?.peak_revenue_base_millions || 0}M</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Patients (Eligible)</span>
                  <span className="font-semibold text-slate-900">{((r.market_research?.patient_population?.eligible_for_treatment || 0) / 1e6).toFixed(1)}M</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Cumulative Revenue Comparison */}
      <Card className="bg-white border-slate-200 shadow-sm mb-6">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50">
          <CardTitle className="text-sm">Cumulative Revenue Comparison (Base Case)</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={revenueCompare}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="short" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `$${v}M`} />
              <Tooltip formatter={(v) => [`$${v}M`]} />
              <Legend />
              <Bar dataKey="worst" name="Worst Case" fill="#dc2626" radius={[2, 2, 0, 0]} />
              <Bar dataKey="base" name="Base Case" fill="#0f172a" radius={[2, 2, 0, 0]} />
              <Bar dataKey="best" name="Best Case" fill="#0d9488" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* CAGR + Market Size Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-sm">CAGR Comparison (%)</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={cagrCompare}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(v) => [`${v}%`]} />
                <Bar dataKey="cagr" name="CAGR (Base)" radius={[4, 4, 0, 0]}>
                  {cagrCompare.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-sm">Market Size: Current vs Projected</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={marketSizeCompare}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `$${v}M`} />
                <Tooltip formatter={(v) => [`$${v}M`]} />
                <Legend />
                <Bar dataKey="current" name="Current" fill="#94a3b8" radius={[2, 2, 0, 0]} />
                <Bar dataKey="projected" name="Projected" fill="#0f172a" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Strategy Comparison */}
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50">
          <CardTitle className="text-sm">Executive Summary Comparison</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reports.map((r, i) => (
              <div key={r.id} className="p-4 border border-slate-200 rounded-sm" style={{ borderTopColor: COLORS[i], borderTopWidth: 2 }}>
                <h4 className="font-semibold text-slate-900 mb-2">{r.drug_name}</h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {r.strategy?.executive_summary || "No executive summary available"}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
