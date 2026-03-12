import { useState } from "react";
import Card from "../components/ui/Card";
import { PrimaryButton } from "../components/ui/Button";
import toast from "react-hot-toast";
import axios from "axios";

export default function ForgotPasswordPage() {

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {

    e.preventDefault();

    if (!email) {
      toast.error("Please enter your email");
      return;
    }

    setLoading(true);

    try {

      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/auth/forgot-password`,
        { email }
      );

      toast.success(res.data.message || "Reset link sent");

      setEmail("");

    } catch (err) {

      toast.error(
        err.response?.data?.message || "Something went wrong"
      );

    } finally {

      setLoading(false);

    }

  };

  return (

    <div className="min-h-screen bg-cs-bg text-cs-text flex items-center justify-center px-4">

      <div className="w-full max-w-sm">

        <Card>

          <h2 className="text-lg font-medium text-cs-text mb-6">
            Forgot Password
          </h2>

          <p className="text-sm text-cs-subtle mb-4">
            Enter your email and we will send you a password reset link.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">

            <div>

              <label className="block text-sm text-cs-muted mb-1.5">
                Email
              </label>

              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full bg-cs-elevated border border-cs-border rounded-lg px-3 py-2.5 text-sm text-cs-text placeholder-cs-subtle focus:outline-none focus:border-cs-primary transition-all duration-200"
              />

            </div>

            <PrimaryButton
              type="submit"
              disabled={loading}
              className="w-full py-2.5"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </PrimaryButton>

          </form>

        </Card>

      </div>

    </div>

  );

}