import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft, Loader2, AlertCircle, TrendingUp, Users2, Swords,
  LineChart as LineChartIcon, DollarSign, Rocket, ShieldAlert, Target, Download
} from "lucide-react";
import { toast } from "sonner";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";

const COLORS = ["#0f172a", "#0d9488", "#d97706", "#dc2626", "#2563eb", "#64748b"];
const STATUS_LABELS = {
  generating: "Initializing agents...",
  researching: "Market Research Agent is gathering data...",
  forecasting: "Forecasting Agent is building projections...",
  analyzing: "Strategy Agent is generating insights...",
};

const fmt = (v) => {
  if (v === null || v === undefined) return "-";
  if (typeof v === "number") {
    if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
    if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
    if (v >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
    return v.toLocaleString();
  }
  return v;
};

const fmtCurrency = (v) => {
  if (v === null || v === undefined) return "-";
  if (v >= 1000) return `$${(v / 1000).toFixed(1)}B`;
  return `$${v.toFixed(0)}M`;
};

export default function ReportPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let interval;
    const fetchReport = async () => {
      try {
        const res = await api.get(`/reports/${id}`);
        setReport(res.data);
        setLoading(false);
        if (res.data.status === "completed" || res.data.status === "failed") {
          if (interval) clearInterval(interval);
        }
      } catch (err) {
        setError("Report not found");
        setLoading(false);
        if (interval) clearInterval(interval);
      }
    };
    fetchReport();
    interval = setInterval(fetchReport, 3000);
    return () => clearInterval(interval);
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex flex-col items-center justify-center h-full" data-testid="report-error">
        <AlertCircle className="w-12 h-12 text-slate-300 mb-4" />
        <p className="text-slate-600 mb-4">{error || "Report not found"}</p>
        <Button variant="outline" onClick={() => navigate("/")}>Back to Dashboard</Button>
      </div>
    );
  }

  const isGenerating = !["completed", "failed"].includes(report.status);

  return (
    <div className="p-8 max-w-7xl" data-testid="report-page">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")} data-testid="back-btn" className="text-slate-500">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "'Playfair Display', serif" }}>
              {report.drug_name}
            </h1>
            <Badge variant="outline" className="text-slate-500 border-slate-300">{report.disease}</Badge>
            <Badge variant="outline" className="text-slate-500 border-slate-300">{report.region}</Badge>
            <Badge variant="outline" className="text-slate-500 border-slate-300">{report.forecast_horizon}yr</Badge>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Generated {new Date(report.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
            {report.user_name && ` by ${report.user_name}`}
          </p>
        </div>
      </div>

      {/* Generating State */}
      {isGenerating && (
        <Card className="bg-white border-slate-200 shadow-sm" data-testid="generating-card">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-slate-900 mb-6" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
              {STATUS_LABELS[report.status] || "Processing..."}
            </h3>
            <p className="text-slate-500 mb-8">This typically takes 1-2 minutes</p>
            <div className="flex gap-4">
              {["researching", "forecasting", "analyzing"].map((step, i) => {
                const steps = ["researching", "forecasting", "analyzing"];
                const currentIdx = steps.indexOf(report.status);
                const isDone = i < currentIdx;
                const isCurrent = i === currentIdx;
                return (
                  <div key={step} className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      isDone ? "bg-emerald-100 text-emerald-700" :
                      isCurrent ? "bg-slate-900 text-white animate-pulse" :
                      "bg-slate-100 text-slate-400"
                    }`}>
                      {isDone ? "\u2713" : i + 1}
                    </div>
                    <span className={`text-sm ${isCurrent ? "text-slate-900 font-medium" : "text-slate-400"}`}>
                      {step === "researching" ? "Research" : step === "forecasting" ? "Forecast" : "Strategy"}
                    </span>
                    {i < 2 && <div className={`w-8 h-px ${isDone ? "bg-emerald-300" : "bg-slate-200"}`} />}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Failed State */}
      {report.status === "failed" && (
        <Card className="bg-white border-red-200 shadow-sm" data-testid="failed-card">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Report Generation Failed</h3>
            <p className="text-sm text-slate-500 mb-2 max-w-md text-center">{report.error || "An unexpected error occurred"}</p>
            <Button variant="outline" onClick={() => navigate("/new-analysis")} className="mt-4">Try Again</Button>
          </CardContent>
        </Card>
      )}

      {/* Completed Report */}
      {report.status === "completed" && (
        <Tabs defaultValue="overview" className="animate-fade-in" data-testid="report-tabs">
          <TabsList className="bg-slate-100 border border-slate-200 p-1 h-auto flex-wrap mb-6">
            <TabsTrigger value="overview" data-testid="tab-overview" className="text-xs sm:text-sm"><TrendingUp className="w-3.5 h-3.5 mr-1.5" />Overview</TabsTrigger>
            <TabsTrigger value="population" data-testid="tab-population" className="text-xs sm:text-sm"><Users2 className="w-3.5 h-3.5 mr-1.5" />Population</TabsTrigger>
            <TabsTrigger value="competitors" data-testid="tab-competitors" className="text-xs sm:text-sm"><Swords className="w-3.5 h-3.5 mr-1.5" />Competitors</TabsTrigger>
            <TabsTrigger value="forecast" data-testid="tab-forecast" className="text-xs sm:text-sm"><LineChartIcon className="w-3.5 h-3.5 mr-1.5" />Forecast</TabsTrigger>
            <TabsTrigger value="revenue" data-testid="tab-revenue" className="text-xs sm:text-sm"><DollarSign className="w-3.5 h-3.5 mr-1.5" />Revenue</TabsTrigger>
            <TabsTrigger value="drivers" data-testid="tab-drivers" className="text-xs sm:text-sm"><Rocket className="w-3.5 h-3.5 mr-1.5" />Drivers</TabsTrigger>
            <TabsTrigger value="risks" data-testid="tab-risks" className="text-xs sm:text-sm"><ShieldAlert className="w-3.5 h-3.5 mr-1.5" />Risks</TabsTrigger>
            <TabsTrigger value="strategy" data-testid="tab-strategy" className="text-xs sm:text-sm"><Target className="w-3.5 h-3.5 mr-1.5" />Strategy</TabsTrigger>
          </TabsList>

          <TabsContent value="overview"><MarketOverviewTab data={report.market_research} /></TabsContent>
          <TabsContent value="population"><PatientPopulationTab data={report.market_research} /></TabsContent>
          <TabsContent value="competitors"><CompetitorTab data={report.market_research} /></TabsContent>
          <TabsContent value="forecast"><ForecastTab data={report.forecast} /></TabsContent>
          <TabsContent value="revenue"><RevenueTab data={report.forecast} drug={report.drug_name} /></TabsContent>
          <TabsContent value="drivers"><DriversTab data={report.strategy} /></TabsContent>
          <TabsContent value="risks"><RisksTab data={report.strategy} /></TabsContent>
          <TabsContent value="strategy"><StrategyTab data={report.strategy} /></TabsContent>
        </Tabs>
      )}
    </div>
  );
}

/* ---- Tab Components ---- */

function StatCard({ label, value, sub, className = "" }) {
  return (
    <div className={`bg-white border border-slate-200 rounded-sm p-5 shadow-sm ${className}`}>
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  );
}

function MarketOverviewTab({ data }) {
  const overview = data?.market_overview;
  if (!overview) return <EmptyState />;

  return (
    <div className="space-y-6 report-content" data-testid="market-overview-content">
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50">
          <CardTitle className="text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>Market Overview</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-slate-600 leading-relaxed text-base mb-6">{overview.market_summary}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <StatCard label="Current Market Size" value={fmtCurrency(overview.current_market_size_usd_millions)} />
            <StatCard label="Projected Market Size" value={fmtCurrency(overview.projected_market_size_usd_millions)} />
            <StatCard label="Growth Rate" value={`${overview.market_growth_rate_pct}%`} sub="CAGR" />
          </div>
          {overview.key_market_trends && (
            <>
              <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">Key Market Trends</h4>
              <div className="flex flex-wrap gap-2">
                {overview.key_market_trends.map((trend, i) => (
                  <Badge key={i} variant="outline" className="bg-slate-50 text-slate-700 border-slate-200 py-1 px-3">
                    {trend}
                  </Badge>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PatientPopulationTab({ data }) {
  const pop = data?.patient_population;
  if (!pop) return <EmptyState />;

  const funnelData = [
    { name: "Total Population", value: pop.total_population },
    { name: "Total Patients", value: pop.total_patients },
    { name: "Diagnosed", value: pop.diagnosed_patients },
    { name: "Eligible", value: pop.eligible_for_treatment },
    { name: "Currently Treated", value: pop.currently_treated },
  ].filter(d => d.value);

  return (
    <div className="space-y-6" data-testid="population-content">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Patients" value={fmt(pop.total_patients)} />
        <StatCard label="Diagnosed" value={fmt(pop.diagnosed_patients)} />
        <StatCard label="Eligible for Treatment" value={fmt(pop.eligible_for_treatment)} />
        <StatCard label="Treatment Gap" value={fmt(pop.treatment_gap)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-sm">Patient Funnel</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={funnelData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tickFormatter={fmt} stroke="#64748b" fontSize={12} />
                <YAxis type="category" dataKey="name" width={120} stroke="#64748b" fontSize={11} />
                <Tooltip formatter={(v) => fmt(v)} />
                <Bar dataKey="value" fill="#0f172a" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-sm">Key Statistics</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <DetailRow label="Disease Prevalence" value={`${pop.disease_prevalence_rate_pct}%`} />
            <DetailRow label="Annual New Cases" value={fmt(pop.annual_new_cases)} />
            <DetailRow label="Currently Treated" value={fmt(pop.currently_treated)} />
            <DetailRow label="Treatment Gap" value={fmt(pop.treatment_gap)} />
            {pop.data_sources && (
              <div className="pt-4 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Data Sources</p>
                {pop.data_sources.map((src, i) => (
                  <p key={i} className="text-xs text-slate-500 mb-1">{src}</p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CompetitorTab({ data }) {
  const comp = data?.competitor_landscape;
  if (!comp) return <EmptyState />;

  const pieData = (comp.competitors || []).map((c) => ({
    name: c.drug_name,
    value: c.market_share_pct || 0,
  }));

  return (
    <div className="space-y-6" data-testid="competitor-content">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-sm">Competitor Drugs</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50">
                    <TableHead className="text-xs font-semibold">Drug</TableHead>
                    <TableHead className="text-xs font-semibold">Manufacturer</TableHead>
                    <TableHead className="text-xs font-semibold">Share</TableHead>
                    <TableHead className="text-xs font-semibold">Annual Cost</TableHead>
                    <TableHead className="text-xs font-semibold">Mechanism</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(comp.competitors || []).map((c, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-semibold text-slate-900">{c.drug_name}</TableCell>
                      <TableCell className="text-slate-600">{c.manufacturer}</TableCell>
                      <TableCell><Badge variant="outline" className="bg-slate-50">{c.market_share_pct}%</Badge></TableCell>
                      <TableCell className="text-slate-600">${c.avg_annual_cost_usd?.toLocaleString()}</TableCell>
                      <TableCell className="text-slate-500 text-xs">{c.mechanism}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-sm">Market Share</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {comp.pricing_overview && (
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-2">Pricing Overview</h4>
            <p className="text-slate-600">{comp.pricing_overview}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ForecastTab({ data }) {
  const yearly = data?.yearly_forecast;
  if (!yearly?.length) return <EmptyState />;

  return (
    <div className="space-y-6" data-testid="forecast-content">
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50">
          <CardTitle className="text-sm">Revenue Forecast (Base / Best / Worst)</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={yearly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="year" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `$${v}M`} />
              <Tooltip formatter={(v) => [`$${v}M`]} />
              <Legend />
              <Line type="monotone" dataKey="revenue_base_millions" stroke="#0f172a" strokeWidth={2.5} name="Base Case" dot={{ r: 4 }} />
              <Line type="monotone" dataKey="revenue_best_millions" stroke="#0d9488" strokeWidth={2} name="Best Case" strokeDasharray="5 5" dot={{ r: 3 }} />
              <Line type="monotone" dataKey="revenue_worst_millions" stroke="#dc2626" strokeWidth={2} name="Worst Case" strokeDasharray="5 5" dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50">
          <CardTitle className="text-sm">Adoption Rate Curve</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={yearly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="year" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
              <Tooltip formatter={(v) => [`${(v * 100).toFixed(1)}%`]} />
              <Legend />
              <Area type="monotone" dataKey="adoption_rate_base" stroke="#0f172a" fill="#0f172a" fillOpacity={0.08} strokeWidth={2} name="Base" />
              <Area type="monotone" dataKey="adoption_rate_best" stroke="#0d9488" fill="#0d9488" fillOpacity={0.05} strokeWidth={1.5} name="Best" />
              <Area type="monotone" dataKey="adoption_rate_worst" stroke="#dc2626" fill="#dc2626" fillOpacity={0.05} strokeWidth={1.5} name="Worst" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50">
          <CardTitle className="text-sm">Year-by-Year Forecast</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50">
                <TableHead className="text-xs font-semibold">Year</TableHead>
                <TableHead className="text-xs font-semibold">Eligible Patients</TableHead>
                <TableHead className="text-xs font-semibold">Treated (Base)</TableHead>
                <TableHead className="text-xs font-semibold">Adoption Rate</TableHead>
                <TableHead className="text-xs font-semibold">Revenue Base</TableHead>
                <TableHead className="text-xs font-semibold">Revenue Best</TableHead>
                <TableHead className="text-xs font-semibold">Revenue Worst</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {yearly.map((row, i) => (
                <TableRow key={i}>
                  <TableCell className="font-semibold">{row.year}</TableCell>
                  <TableCell>{fmt(row.eligible_patients)}</TableCell>
                  <TableCell>{fmt(row.patients_treated_base)}</TableCell>
                  <TableCell>{row.adoption_rate_base ? `${(row.adoption_rate_base * 100).toFixed(1)}%` : "-"}</TableCell>
                  <TableCell className="font-medium">${row.revenue_base_millions?.toFixed(1)}M</TableCell>
                  <TableCell className="text-emerald-700">${row.revenue_best_millions?.toFixed(1)}M</TableCell>
                  <TableCell className="text-red-600">${row.revenue_worst_millions?.toFixed(1)}M</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function RevenueTab({ data, drug }) {
  const summary = data?.summary;
  const yearly = data?.yearly_forecast;
  if (!summary || !yearly?.length) return <EmptyState />;

  const scenarioData = [
    { name: "Worst Case", value: summary.total_cumulative_revenue_worst_millions, fill: "#dc2626" },
    { name: "Base Case", value: summary.total_cumulative_revenue_base_millions, fill: "#0f172a" },
    { name: "Best Case", value: summary.total_cumulative_revenue_best_millions, fill: "#0d9488" },
  ];

  return (
    <div className="space-y-6" data-testid="revenue-content">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="CAGR (Base)" value={`${summary.cagr_base_pct}%`} />
        <StatCard label="CAGR (Best)" value={`${summary.cagr_best_pct}%`} />
        <StatCard label="Peak Revenue" value={fmtCurrency(summary.peak_revenue_base_millions)} sub={`Year ${summary.peak_year}`} />
        <StatCard label="Total Base Revenue" value={fmtCurrency(summary.total_cumulative_revenue_base_millions)} sub="Cumulative" />
      </div>

      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50">
          <CardTitle className="text-sm">Scenario Comparison - Cumulative Revenue</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={scenarioData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `$${v}M`} />
              <Tooltip formatter={(v) => [`$${v}M`]} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {scenarioData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {data?.adoption_curve && (
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-2">Adoption Curve Analysis</h4>
            <p className="text-slate-600 mb-2">{data.adoption_curve.description}</p>
            <div className="flex gap-4 text-sm">
              <span className="text-slate-500">Curve Type: <strong className="text-slate-700">{data.adoption_curve.curve_type}</strong></span>
              <span className="text-slate-500">Inflection Year: <strong className="text-slate-700">{data.adoption_curve.inflection_point_year}</strong></span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DriversTab({ data }) {
  const drivers = data?.market_drivers;
  if (!drivers?.length) return <EmptyState />;

  const impactColors = { High: "bg-emerald-50 text-emerald-700 border-emerald-200", Medium: "bg-amber-50 text-amber-700 border-amber-200", Low: "bg-slate-50 text-slate-600 border-slate-200" };

  return (
    <div className="space-y-4" data-testid="drivers-content">
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50">
          <CardTitle className="text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>Key Market Drivers</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {drivers.map((d, i) => (
            <div key={i} className="p-4 border border-slate-200 rounded-sm bg-slate-50/30">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold text-slate-900">{d.driver}</h4>
                <div className="flex gap-2">
                  <Badge variant="outline" className={impactColors[d.impact] || impactColors.Low}>{d.impact} Impact</Badge>
                  {d.timeframe && <Badge variant="outline" className="bg-slate-50 text-slate-500 border-slate-200">{d.timeframe}</Badge>}
                </div>
              </div>
              <p className="text-sm text-slate-600">{d.description}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function RisksTab({ data }) {
  const risks = data?.key_risks;
  const threats = data?.competitive_threats;
  if (!risks?.length) return <EmptyState />;

  const severityColors = { High: "bg-red-50 text-red-700 border-red-200", Medium: "bg-amber-50 text-amber-700 border-amber-200", Low: "bg-slate-50 text-slate-600 border-slate-200" };

  return (
    <div className="space-y-6" data-testid="risks-content">
      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50">
          <CardTitle className="text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>Key Risks</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {risks.map((r, i) => (
            <div key={i} className="p-4 border border-slate-200 rounded-sm bg-slate-50/30">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold text-slate-900">{r.risk}</h4>
                <div className="flex gap-2">
                  <Badge variant="outline" className={severityColors[r.severity] || severityColors.Low}>Severity: {r.severity}</Badge>
                  <Badge variant="outline" className={severityColors[r.probability] || severityColors.Low}>Prob: {r.probability}</Badge>
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-2">{r.description}</p>
              <p className="text-xs text-slate-500"><strong>Mitigation:</strong> {r.mitigation}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {threats?.length > 0 && (
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-sm">Competitive Threats</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-3">
            {threats.map((t, i) => (
              <div key={i} className="p-3 border border-slate-200 rounded-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-slate-900 text-sm">{t.threat}</span>
                  <Badge variant="outline" className={severityColors[t.impact_level] || severityColors.Low}>{t.impact_level}</Badge>
                </div>
                <p className="text-xs text-slate-500">Source: {t.source}</p>
                <p className="text-xs text-slate-600 mt-1"><strong>Response:</strong> {t.response_strategy}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StrategyTab({ data }) {
  if (!data) return <EmptyState />;
  const { strategic_recommendations, market_entry_strategy, pricing_strategy, executive_summary } = data;

  const priorityColors = { High: "bg-red-50 text-red-700 border-red-200", Medium: "bg-amber-50 text-amber-700 border-amber-200", Low: "bg-slate-50 text-slate-600 border-slate-200" };

  return (
    <div className="space-y-6" data-testid="strategy-content">
      {executive_summary && (
        <Card className="bg-slate-900 text-white shadow-sm border-0">
          <CardContent className="p-6">
            <h4 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Executive Summary</h4>
            <p className="text-slate-200 leading-relaxed">{executive_summary}</p>
          </CardContent>
        </Card>
      )}

      {strategic_recommendations?.length > 0 && (
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>Strategic Recommendations</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {strategic_recommendations.map((rec, i) => (
              <div key={i} className="p-4 border border-slate-200 rounded-sm bg-slate-50/30">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span>
                    <h4 className="font-semibold text-slate-900">{rec.recommendation}</h4>
                  </div>
                  <Badge variant="outline" className={priorityColors[rec.priority] || priorityColors.Low}>{rec.priority}</Badge>
                </div>
                <p className="text-sm text-slate-600 ml-10 mb-1">{rec.rationale}</p>
                <p className="text-xs text-slate-500 ml-10">Impact: {rec.expected_impact} | Timeline: {rec.implementation_timeline}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {market_entry_strategy && (
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-sm">Market Entry Strategy</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-slate-600 mb-6">{market_entry_strategy.recommended_approach}</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {["phase_1", "phase_2", "phase_3"].map((phase, i) => {
                const p = market_entry_strategy[phase];
                if (!p) return null;
                return (
                  <div key={phase} className="p-4 border border-slate-200 rounded-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-bold">{i + 1}</span>
                      <span className="text-xs font-semibold text-slate-400 uppercase">{p.timeline}</span>
                    </div>
                    <p className="text-sm text-slate-700 font-medium mb-1">{p.target_segment}</p>
                    <p className="text-xs text-slate-500">{p.description}</p>
                  </div>
                );
              })}
            </div>
            {market_entry_strategy.key_success_factors?.length > 0 && (
              <>
                <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Key Success Factors</h5>
                <div className="flex flex-wrap gap-2">
                  {market_entry_strategy.key_success_factors.map((f, i) => (
                    <Badge key={i} variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">{f}</Badge>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {pricing_strategy && (
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">Pricing Strategy</h4>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <DetailRow label="Recommended Range" value={pricing_strategy.recommended_price_range_usd} />
              <DetailRow label="Positioning" value={pricing_strategy.competitive_positioning} />
            </div>
            <p className="text-sm text-slate-600">{pricing_strategy.rationale}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-medium text-slate-900">{value || "-"}</span>
    </div>
  );
}

function EmptyState() {
  return (
    <Card className="bg-white border-slate-200">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="w-10 h-10 text-slate-300 mb-3" />
        <p className="text-slate-500">No data available for this section</p>
      </CardContent>
    </Card>
  );
}
