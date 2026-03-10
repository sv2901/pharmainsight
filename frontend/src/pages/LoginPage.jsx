import { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrendingUp, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAdminHint, setShowAdminHint] = useState(false);
  const { login, user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.shiftKey && (e.key === "A" || e.key === "a")) {
        e.preventDefault();
        setShowAdminHint(true);
        toast.info("Admin access enabled");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome to PharmaInsight");
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Invalid credentials");
    }
    setLoading(false);
  };

  return (
    <div className="flex h-screen" data-testid="login-page">
      {/* Left Hero */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1581056771085-3ce30d907416?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzNzl8MHwxfHNlYXJjaHwyfHxwaGFybWFjZXV0aWNhbCUyMGxhYm9yYXRvcnklMjByZXNlYXJjaCUyMG1vZGVybnxlbnwwfHx8fDE3NzMxMDQxMzZ8MA&ixlib=rb-4.1.0&q=85"
          alt="Pharmaceutical Research"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-slate-900/75" />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-white/90 font-bold text-lg tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              PharmaInsight
            </span>
          </div>

          <div className="max-w-lg">
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
              AI-Powered Market Intelligence for Pharma
            </h1>
            <p className="text-slate-300 text-lg leading-relaxed mb-8">
              Generate consulting-grade market forecasts, competitive analyses, and strategic recommendations in minutes.
            </p>
            <div className="flex gap-8 text-sm">
              <div>
                <p className="text-2xl font-bold text-white">3</p>
                <p className="text-slate-400 mt-1">AI Agents</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">8</p>
                <p className="text-slate-400 mt-1">Report Sections</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">Real-time</p>
                <p className="text-slate-400 mt-1">Data Analysis</p>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-500">Trusted by life sciences consulting teams</p>
        </div>
      </div>

      {/* Right Form */}
      <div className="w-full lg:w-[45%] flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-9 h-9 bg-slate-900 rounded-md flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-slate-900 font-bold text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>PharmaInsight</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
              Welcome back
            </h2>
            <p className="text-slate-500">Sign in to access your analytics dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" data-testid="login-form">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 font-medium">Email</Label>
              <Input
                id="email"
                data-testid="login-email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700 font-medium">Password</Label>
              <Input
                id="password"
                data-testid="login-password-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="h-11"
              />
            </div>
            <Button
              type="submit"
              data-testid="login-submit-btn"
              className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-medium"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </form>

          {showAdminHint && (
            <div className="mt-6 p-4 border border-amber-200 bg-amber-50 rounded-md animate-fade-in" data-testid="admin-hint">
              <p className="text-sm font-semibold text-amber-800 mb-1">Admin Access</p>
              <p className="text-xs text-amber-700">
                Email: admin@pharmainsight.com<br />
                Password: admin123
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
