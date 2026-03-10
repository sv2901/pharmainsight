import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FlaskConical, ArrowRight } from "lucide-react";
import { toast } from "sonner";

const regions = [
  "India", "United States", "China", "Japan", "Germany", "United Kingdom",
  "France", "Brazil", "South Korea", "Canada", "Australia", "Southeast Asia",
  "Middle East", "Africa", "Latin America", "European Union"
];

const horizons = [
  { value: "3", label: "3 Years" },
  { value: "5", label: "5 Years" },
  { value: "7", label: "7 Years" },
  { value: "10", label: "10 Years" },
];

export default function NewAnalysisPage() {
  const [drugName, setDrugName] = useState("");
  const [disease, setDisease] = useState("");
  const [region, setRegion] = useState("India");
  const [horizon, setHorizon] = useState("5");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!drugName.trim() || !disease.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/reports/generate", {
        drug_name: drugName.trim(),
        disease: disease.trim(),
        region,
        forecast_horizon: parseInt(horizon),
      });
      toast.success("Analysis started! Redirecting to report...");
      navigate(`/reports/${res.data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to start analysis");
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl" data-testid="new-analysis-page">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
          New Market Analysis
        </h1>
        <p className="text-slate-500">Configure your pharmaceutical market forecast parameters</p>
      </div>

      <Card className="bg-white border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-md flex items-center justify-center">
              <FlaskConical className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
                Analysis Parameters
              </CardTitle>
              <CardDescription>Our AI agents will research, forecast, and strategize based on these inputs</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6" data-testid="analysis-form">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="drugName" className="text-slate-700 font-medium">Drug Name *</Label>
                <Input
                  id="drugName"
                  data-testid="drug-name-input"
                  value={drugName}
                  onChange={(e) => setDrugName(e.target.value)}
                  placeholder="e.g., Semaglutide"
                  required
                  className="h-11"
                />
                <p className="text-xs text-slate-400">Enter the generic or brand name of the pharmaceutical drug</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="disease" className="text-slate-700 font-medium">Disease Area *</Label>
                <Input
                  id="disease"
                  data-testid="disease-input"
                  value={disease}
                  onChange={(e) => setDisease(e.target.value)}
                  placeholder="e.g., Type 2 Diabetes"
                  required
                  className="h-11"
                />
                <p className="text-xs text-slate-400">The therapeutic area or disease indication</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-slate-700 font-medium">Region</Label>
                <Select value={region} onValueChange={setRegion} data-testid="region-select">
                  <SelectTrigger className="h-11" data-testid="region-select-trigger">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map((r) => (
                      <SelectItem key={r} value={r} data-testid={`region-option-${r.toLowerCase().replace(/\s/g, '-')}`}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-400">Target market region for the analysis</p>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700 font-medium">Forecast Horizon</Label>
                <Select value={horizon} onValueChange={setHorizon} data-testid="horizon-select">
                  <SelectTrigger className="h-11" data-testid="horizon-select-trigger">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {horizons.map((h) => (
                      <SelectItem key={h.value} value={h.value} data-testid={`horizon-option-${h.value}`}>
                        {h.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-400">Number of years to project into the future</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-md p-4 text-sm text-slate-600">
              <p className="font-medium text-slate-700 mb-2">What happens next:</p>
              <ol className="list-decimal list-inside space-y-1 text-slate-500">
                <li><span className="font-medium text-slate-600">Market Research Agent</span> gathers epidemiology and competitive data</li>
                <li><span className="font-medium text-slate-600">Forecasting Agent</span> builds revenue projections with scenarios</li>
                <li><span className="font-medium text-slate-600">Strategy Agent</span> generates executive-ready recommendations</li>
              </ol>
              <p className="mt-2 text-xs text-slate-400">Typical generation time: 1-2 minutes</p>
            </div>

            <Button
              type="submit"
              data-testid="submit-analysis-btn"
              className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-medium text-base"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Starting Analysis...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Generate Market Report
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
