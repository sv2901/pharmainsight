import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "@/App";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { FlaskConical, FileText, CheckCircle, Clock, Trash2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const statusConfig = {
  completed: { label: "Completed", variant: "default", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  generating: { label: "Generating", variant: "secondary", className: "bg-blue-50 text-blue-700 border-blue-200" },
  researching: { label: "Researching", variant: "secondary", className: "bg-blue-50 text-blue-700 border-blue-200" },
  forecasting: { label: "Forecasting", variant: "secondary", className: "bg-blue-50 text-blue-700 border-blue-200" },
  analyzing: { label: "Analyzing", variant: "secondary", className: "bg-blue-50 text-blue-700 border-blue-200" },
  failed: { label: "Failed", variant: "destructive", className: "bg-red-50 text-red-700 border-red-200" },
};

export default function DashboardPage() {
  const { user } = useContext(AuthContext);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchReports = async () => {
    try {
      const res = await api.get("/reports");
      setReports(res.data);
    } catch (err) {
      toast.error("Failed to load reports");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReports();
    const interval = setInterval(fetchReports, 10000);
    return () => clearInterval(interval);
  }, []);

  const deleteReport = async (id, e) => {
    e.stopPropagation();
    try {
      await api.delete(`/reports/${id}`);
      setReports((prev) => prev.filter((r) => r.id !== id));
      toast.success("Report deleted");
    } catch {
      toast.error("Failed to delete report");
    }
  };

  const completedCount = reports.filter((r) => r.status === "completed").length;
  const inProgressCount = reports.filter((r) => !["completed", "failed"].includes(r.status)).length;
  const uniqueDrugs = new Set(reports.map((r) => r.drug_name)).size;

  const stats = [
    { label: "Total Reports", value: reports.length, icon: FileText, color: "text-slate-700" },
    { label: "Completed", value: completedCount, icon: CheckCircle, color: "text-emerald-600" },
    { label: "In Progress", value: inProgressCount, icon: Clock, color: "text-blue-600" },
    { label: "Drugs Analyzed", value: uniqueDrugs, icon: FlaskConical, color: "text-amber-600" },
  ];

  return (
    <div className="p-8 max-w-7xl" data-testid="dashboard-page">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
            Welcome back, {user?.name?.split(" ")[0]}
          </h1>
          <p className="text-slate-500">Here's an overview of your market intelligence reports</p>
        </div>
        <Button
          data-testid="new-analysis-btn"
          onClick={() => navigate("/new-analysis")}
          className="bg-slate-900 hover:bg-slate-800 text-white"
        >
          <FlaskConical className="w-4 h-4 mr-2" />
          New Analysis
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 stagger-children">
        {stats.map((stat) => (
          <Card key={stat.label} className="bg-white border-slate-200 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">{stat.label}</p>
                  <p className={`text-3xl font-bold mt-1 ${stat.color}`}>{loading ? "-" : stat.value}</p>
                </div>
                <stat.icon className={`w-8 h-8 ${stat.color} opacity-40`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator className="mb-6" />

      {/* Reports Table */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-slate-900" style={{ fontFamily: "'Playfair Display', serif" }}>
          Recent Reports
        </h2>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-slate-100 animate-pulse rounded-md" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <Card className="bg-white border-slate-200">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FlaskConical className="w-12 h-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">No reports yet</h3>
            <p className="text-slate-500 text-sm mb-4">Start by creating your first market analysis</p>
            <Button
              data-testid="empty-new-analysis-btn"
              onClick={() => navigate("/new-analysis")}
              className="bg-slate-900 hover:bg-slate-800 text-white"
            >
              Create Analysis
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-white border-slate-200 shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80">
                <TableHead className="font-semibold text-slate-600">Drug</TableHead>
                <TableHead className="font-semibold text-slate-600">Disease</TableHead>
                <TableHead className="font-semibold text-slate-600">Region</TableHead>
                <TableHead className="font-semibold text-slate-600">Horizon</TableHead>
                <TableHead className="font-semibold text-slate-600">Status</TableHead>
                <TableHead className="font-semibold text-slate-600">Date</TableHead>
                <TableHead className="font-semibold text-slate-600 w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => {
                const status = statusConfig[report.status] || statusConfig.generating;
                return (
                  <TableRow
                    key={report.id}
                    data-testid={`report-row-${report.id}`}
                    className="cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => navigate(`/reports/${report.id}`)}
                  >
                    <TableCell className="font-semibold text-slate-900">{report.drug_name}</TableCell>
                    <TableCell className="text-slate-600">{report.disease}</TableCell>
                    <TableCell className="text-slate-600">{report.region}</TableCell>
                    <TableCell className="text-slate-600">{report.forecast_horizon}yr</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={status.className}>
                        {!["completed", "failed"].includes(report.status) && (
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse mr-1.5" />
                        )}
                        {report.status === "failed" && <AlertCircle className="w-3 h-3 mr-1" />}
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm">
                      {new Date(report.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        data-testid={`delete-report-${report.id}`}
                        onClick={(e) => deleteReport(report.id, e)}
                        className="text-slate-400 hover:text-red-600 h-8 w-8"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
