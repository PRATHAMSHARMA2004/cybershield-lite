import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getDashboard } from "../services/api";
import API from "../services/api";
import Card from "../components/ui/Card";
import { Spinner } from "../components/ui/primitives";

export default function UpgradePage() {
  const RAZORPAY_KEY = process.env.REACT_APP_RAZORPAY_KEY_ID;

  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);

  // 🔒 Redirect if already Pro
  useEffect(() => {
    getDashboard()
      .then((res) => {
        const plan = res.data.dashboard.user?.plan;
        if (plan === "pro") {
          navigate("/dashboard");
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleUpgrade = async () => {
    try {
      setUpgrading(true);

      if (!RAZORPAY_KEY) {
        alert("Razorpay key missing. Check .env file.");
        return;
      }

      if (!window.Razorpay) {
        alert("Razorpay SDK not loaded.");
        return;
      }

      // 1️⃣ Create subscription from backend
      const { data } = await API.post("/user/create-subscription");

      if (!data?.subscription?.id) {
        throw new Error("Subscription creation failed");
      }

      const subscription = data.subscription;

      // 2️⃣ Razorpay Checkout
      const options = {
        key: RAZORPAY_KEY,
        subscription_id: subscription.id,
        name: "CyberShield",
        description: "Pro Plan - Monthly Subscription",
        theme: {
          color: "#0f172a",
        },

        handler: async function (response) {
          try {
            await API.post("/user/verify-payment", response);

            alert("🎉 Subscription Activated! You are now PRO.");
            navigate("/dashboard");
          } catch (err) {
            console.error("Verification failed:", err);
            alert("Payment verification failed.");
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (error) {
      console.error("Subscription error:", error);
      alert("Subscription failed. Try again.");
    } finally {
      setUpgrading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-16 px-6">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-cs-text mb-4">
          Upgrade to Pro
        </h1>
        <p className="text-cs-subtle text-lg">
          Unlock unlimited scans and advanced security insights.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Free Plan */}
        <Card className="p-8 border border-cs-border">
          <h2 className="text-xl font-semibold mb-4">Free Plan</h2>
          <p className="text-3xl font-bold mb-6">
            ₹0<span className="text-sm text-cs-subtle"> / month</span>
          </p>

          <ul className="space-y-3 text-sm text-cs-subtle mb-8">
            <li>✓ 5 scans per month</li>
            <li>✓ Basic vulnerability detection</li>
            <li>✓ SSL & security headers check</li>
            <li>✗ No monitoring</li>
            <li>✗ No priority support</li>
          </ul>

          <button
            disabled
            className="w-full py-3 rounded-lg bg-cs-elevated text-cs-muted cursor-not-allowed"
          >
            Current Plan
          </button>
        </Card>

        {/* Pro Plan */}
        <Card className="p-8 border-2 border-cs-primary relative shadow-lg">
          <span className="absolute top-4 right-4 text-xs font-semibold bg-cs-primary text-white px-3 py-1 rounded-full">
            MOST POPULAR
          </span>

          <h2 className="text-xl font-semibold mb-4">Pro Plan</h2>
          <p className="text-3xl font-bold mb-6">
            ₹499<span className="text-sm text-cs-subtle"> / month</span>
          </p>

          <ul className="space-y-3 text-sm text-cs-text mb-8">
            <li>✓ Unlimited scans</li>
            <li>✓ Advanced vulnerability insights</li>
            <li>✓ SSL monitoring alerts</li>
            <li>✓ Security score tracking</li>
            <li>✓ Priority support</li>
          </ul>

          <button
            onClick={handleUpgrade}
            disabled={upgrading}
            className="w-full py-3 rounded-lg bg-cs-primary text-white font-semibold hover:opacity-90 transition disabled:opacity-50"
          >
            {upgrading ? "Processing..." : "Upgrade Now"}
          </button>
        </Card>
      </div>

      <p className="text-center text-xs text-cs-subtle mt-10">
        Cancel anytime. No hidden charges.
      </p>
    </div>
  );
}