import { useState } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Zap, ArrowRight, CheckCircle, XCircle, AlertTriangle, Target } from "lucide-react";
import { toast } from "sonner";

const regions = ["India", "United States", "China", "Japan", "Germany", "United Kingdom", "European Union"];

export default function QuickInsightPage() {
  const [drugName, setDrugName] = useState("");
  const [disease, setDisease] = useState("");
  const [region, setRegion] = useState("India");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!drugName.trim() || !disease.trim()) {
      toast.error("Please fill in all fields");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await api.post("/quick-insight", {
        drug_name: drugName.trim(),
        disease: disease.trim(),
        region,
      });
      setResult(res.data);
      toast.success("Quick insight generated!");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to generate insight");
    }
    setLoading(false);
  };

  const goColor = {
    GO: "bg-emerald-50 text-emerald-700 border-emerald-300",
    "CONDITIONAL GO": "bg-amber-50 text-amber-700 border-amber-300",
    "NO GO": "bg-red-50 text-red-700 border-red-300",
  };

  const goIcon = {
    GO: <CheckCircle className="w-5 h-5" />,
    "CONDITIONAL GO": <AlertTriangle className="w-5 h-5" />,
    "NO GO": <XCircle className="w-5 h-5" />,
  };

  const scoreColor = (s) => {
    if (s >= 7) return "text-emerald-600";
    if (s >= 4) return "text-amber-600";
    return "text-red-600";
  };

  return (
    <div className="p-8 max-w-5xl" data-testid="quick-insight-page">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Zap className="w-5 h-5 text-amber-500" />
          <h1 className="text-3xl font-bold text-slate-900" style={{ fontFamily: "'Playfair Display', serif" }}>
            Quick Insight
          </h1>
        </div>
        <p className="text-slate-500">Get a rapid executive brief in under 30 seconds</p>
      </div>

      {/* Input Form */}
      <Card className="bg-white border-slate-200 shadow-sm mb-8">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="flex flex-wrap gap-4 items-end" data-testid="quick-insight-form">
            <div className="flex-1 min-w-[180px] space-y-1.5">
              <Label className="text-slate-700 text-xs font-semibold">Drug Name</Label>
              <Input data-testid="qi-drug-input" value={drugName} onChange={(e) => setDrugName(e.target.value)} placeholder="e.g., Semaglutide" required className="h-10" />
            </div>
            <div className="flex-1 min-w-[180px] space-y-1.5">
              <Label className="text-slate-700 text-xs font-semibold">Disease Area</Label>
              <Input data-testid="qi-disease-input" value={disease} onChange={(e) => setDisease(e.target.value)} placeholder="e.g., Type 2 Diabetes" required className="h-10" />
            </div>
            <div className="w-44 space-y-1.5">
              <Label className="text-slate-700 text-xs font-semibold">Region</Label>
              <Select value={region} onValueChange={setRegion}>
                <SelectTrigger className="h-10" data-testid="qi-region-trigger"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {regions.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" data-testid="qi-submit-btn" className="bg-slate-900 hover:bg-slate-800 text-white h-10" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Analyzing...</span>
              ) : (
                <span className="flex items-center gap-2"><Zap className="w-4 h-4" />Generate Brief</span>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <div className="space-y-6 animate-fade-in" data-testid="qi-results">
          {/* Score & Decision */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-white border-slate-200 shadow-sm col-span-1">
              <CardContent className="p-6 text-center">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Opportunity Score</p>
                <p className={`text-6xl font-bold ${scoreColor(result.opportunity_score)}`}>{result.opportunity_score}</p>
                <p className="text-xs text-slate-500 mt-2">/10</p>
                <p className="text-sm text-slate-600 mt-3">{result.score_rationale}</p>
              </CardContent>
            </Card>

            <Card className={`border-2 shadow-sm col-span-1 ${goColor[result.go_no_go] || "bg-slate-50 border-slate-200"}`}>
              <CardContent className="p-6 text-center flex flex-col items-center justify-center h-full">
                {goIcon[result.go_no_go] || <Target className="w-5 h-5" />}
                <p className="text-3xl font-bold mt-2">{result.go_no_go}</p>
                <p className="text-sm mt-3 leading-relaxed">{result.go_no_go_rationale}</p>
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200 shadow-sm col-span-1">
              <CardContent className="p-6 space-y-3">
                <StatLine label="Market Size" value={`$${result.market_size_estimate_usd_millions}M`} />
                <StatLine label="Growth Rate" value={`${result.market_growth_pct}%`} />
                <StatLine label="Patients" value={`${result.patient_population_millions}M`} />
                <StatLine label="Treatment Penetration" value={`${result.treatment_penetration_pct}%`} />
                <StatLine label="Peak Revenue Est." value={`$${result.estimated_peak_revenue_usd_millions}M`} />
                <StatLine label="Time to Peak" value={`${result.time_to_peak_years} years`} />
                <StatLine label="Price Range" value={result.recommended_price_range_usd} />
              </CardContent>
            </Card>
          </div>

          {/* Brief Analysis */}
          <Card className="bg-slate-900 text-white shadow-sm border-0">
            <CardContent className="p-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Executive Brief</p>
              <p className="text-slate-200 leading-relaxed">{result.brief_analysis}</p>
            </CardContent>
          </Card>

          {/* Competitors, Opportunities, Risks */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-100 bg-slate-50/50 py-3 px-5">
                <CardTitle className="text-sm">Key Competitors</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                {(result.key_competitors || []).map((c, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium text-slate-900">{c.name}</span>
                      <span className="text-slate-400 text-xs ml-1">({c.manufacturer})</span>
                    </div>
                    <Badge variant="outline" className="text-xs bg-slate-50">{c.market_share_pct}%</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-100 bg-emerald-50/50 py-3 px-5">
                <CardTitle className="text-sm text-emerald-700">Top Opportunities</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                {(result.top_opportunities || []).map((o, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    <span className="text-slate-700">{o}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-100 bg-red-50/50 py-3 px-5">
                <CardTitle className="text-sm text-red-700">Top Risks</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                {(result.top_risks || []).map((r, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                    <span className="text-slate-700">{r}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

function StatLine({ label, value }) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-slate-100 last:border-0">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-sm font-semibold text-slate-900">{value}</span>
    </div>
  );
}
