import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { PrimaryButton } from "../components/ui/Button";
import Card from "../components/ui/Card";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      toast.success("Account created");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cs-bg text-cs-text flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <p className="text-xl font-semibold tracking-tight text-cs-text">CyberShield</p>
          <p className="text-xs text-cs-subtle mt-0.5">Security Audit Platform</p>
        </div>
        <Card>
          <h2 className="text-lg font-medium text-cs-text mb-6">Create account</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-cs-muted mb-1.5">Full Name</label>
              <input type="text" required value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-cs-elevated border border-cs-border rounded-lg px-3 py-2.5 text-sm text-cs-text placeholder-cs-subtle focus:outline-none focus:border-cs-primary transition-all duration-200"
                placeholder="John Sharma" />
            </div>
            <div>
              <label className="block text-sm text-cs-muted mb-1.5">Work Email</label>
              <input type="email" required value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-cs-elevated border border-cs-border rounded-lg px-3 py-2.5 text-sm text-cs-text placeholder-cs-subtle focus:outline-none focus:border-cs-primary transition-all duration-200"
                placeholder="you@company.com" />
            </div>
            <div>
              <label className="block text-sm text-cs-muted mb-1.5">Password</label>
              <input type="password" required value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full bg-cs-elevated border border-cs-border rounded-lg px-3 py-2.5 text-sm text-cs-text placeholder-cs-subtle focus:outline-none focus:border-cs-primary transition-all duration-200"
                placeholder="Min. 8 characters" />
            </div>
            <PrimaryButton type="submit" disabled={loading} className="w-full py-2.5 mt-2">
              {loading ? "Creating account..." : "Create Account"}
            </PrimaryButton>
          </form>
          <p className="text-center text-sm text-cs-subtle mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-cs-primary hover:opacity-80 transition-opacity">Sign in</Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
