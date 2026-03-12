import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Card from "../components/ui/Card";
import { PrimaryButton } from "../components/ui/Button";
import toast from "react-hot-toast";

export default function ResetPasswordPage() {

  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {

    e.preventDefault();

    if (!password) {
      toast.error("Please enter a new password");
      return;
    }

    setLoading(true);

    try {

      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/auth/reset-password/${token}`,
        { password }
      );

      toast.success(res.data.message || "Password updated");

      setTimeout(() => {
        navigate("/login");
      }, 1500);

    } catch (err) {

      toast.error(
        err.response?.data?.message || "Reset failed"
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
            Reset Password
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">

            <div>

              <label className="block text-sm text-cs-muted mb-1.5">
                New Password
              </label>

              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full bg-cs-elevated border border-cs-border rounded-lg px-3 py-2.5 text-sm text-cs-text placeholder-cs-subtle focus:outline-none focus:border-cs-primary transition-all duration-200"
              />

            </div>

            <PrimaryButton
              type="submit"
              disabled={loading}
              className="w-full py-2.5"
            >
              {loading ? "Updating..." : "Update Password"}
            </PrimaryButton>

          </form>

        </Card>

      </div>

    </div>

  );

}