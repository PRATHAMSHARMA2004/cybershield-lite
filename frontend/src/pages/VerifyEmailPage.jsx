import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Card from "../components/ui/Card";
import { PrimaryButton } from "../components/ui/Button";
import toast from "react-hot-toast";
import api from "../services/api";

export default function VerifyEmailPage() {

  const { token } = useParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState("verifying");

  useEffect(() => {

    const verifyEmail = async () => {

      try {

        await api.get(`/auth/verify-email/${token}`);

        setStatus("success");

      } catch (err) {

        setStatus("error");

      }

    };

    verifyEmail();

  }, [token]);

  return (

    <div className="min-h-screen bg-cs-bg text-cs-text flex items-center justify-center px-4">

      <div className="w-full max-w-sm">

        <Card>

          {status === "verifying" && (
            <p className="text-center">Verifying your email...</p>
          )}

          {status === "success" && (
            <>
              <h2 className="text-lg font-medium text-green-400 mb-4">
                Email Verified
              </h2>

              <PrimaryButton
                className="w-full"
                onClick={() => navigate("/login")}
              >
                Go to Login
              </PrimaryButton>
            </>
          )}

          {status === "error" && (
            <p className="text-red-400 text-center">
              Invalid or expired verification link
            </p>
          )}

        </Card>

      </div>

    </div>

  );

}