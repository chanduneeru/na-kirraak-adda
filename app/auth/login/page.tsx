"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Login failed");
        return;
      }

      // Save token and user info
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      router.push("/");
    } catch (err: any) {
      setError("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password States
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [resetStep, setResetStep] = useState<1 | 2>(1);
  const [resetIdentifier, setResetIdentifier] = useState("");
  const [otpCodeInput, setOtpCodeInput] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetMsg, setResetMsg] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [demoOtpNotice, setDemoOtpNotice] = useState("");

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetMsg("");
    setResetLoading(true);
    setDemoOtpNotice("");
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "requestResetOtp", identifier: resetIdentifier }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setResetStep(2);
        setResetMsg(data.message);
        if (data.otpCode) {
          setDemoOtpNotice(`(Demo OTP Code: ${data.otpCode})`);
        }
      } else {
        setResetMsg(data.error || "Failed to send OTP.");
      }
    } catch (err) {
      setResetMsg("Error requesting OTP code.");
    } finally {
      setResetLoading(false);
    }
  };

  const handleVerifyOtpAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetMsg("");
    setResetLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "resetPasswordWithOtp",
          identifier: resetIdentifier,
          otpCode: otpCodeInput,
          newPassword: resetNewPassword,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setResetMsg("🎉 Password reset successfully! Please log in with your new password.");
        setTimeout(() => {
          setForgotModalOpen(false);
          setResetStep(1);
          setResetIdentifier("");
          setOtpCodeInput("");
          setResetNewPassword("");
          setResetMsg("");
        }, 2000);
      } else {
        setResetMsg(data.error || "Failed to reset password.");
      }
    } catch (err) {
      setResetMsg("Error resetting password.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#050505] px-4 text-white">
      <div className="w-full max-w-md">
        <div className="bg-[#1B1712] rounded-2xl p-8 border border-[#FF6B00] shadow-2xl space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-[#FFC145]">NA KIRRAAK</h1>
            <p className="text-gray-400 text-xs mt-1">ADDA — Welcome Back!</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Username / Email / Mobile</label>
              <input
                type="text"
                placeholder="Username or email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#050505] text-white border border-[#FF6B00] rounded-xl focus:outline-none focus:border-[#FFC145] text-sm"
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs text-gray-400">Password</label>
                <button
                  type="button"
                  onClick={() => setForgotModalOpen(true)}
                  className="text-xs text-[#FFC145] hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#050505] text-white border border-[#FF6B00] rounded-xl focus:outline-none focus:border-[#FFC145] text-sm"
                required
              />
            </div>

            {error && <p className="text-red-400 text-xs font-semibold">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FF6B00] text-black font-extrabold py-3 rounded-full hover:bg-[#FFC145] disabled:opacity-50 transition text-sm shadow-lg"
            >
              {loading ? "Logging in..." : "Login to Account"}
            </button>
          </form>

          <p className="text-gray-400 text-xs text-center">
            Don't have an account?{" "}
            <Link href="/auth/register" className="text-[#FFC145] font-bold hover:underline">
              Register Now
            </Link>
          </p>
        </div>
      </div>

      {/* Forgot Password OTP Recovery Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-[#FF6B00] bg-[#14100C] p-6 text-white shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-orange-400">Account Recovery</p>
                <h3 className="text-xl font-bold text-white">Reset Password</h3>
              </div>
              <button
                onClick={() => setForgotModalOpen(false)}
                className="text-zinc-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {resetStep === 1 ? (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <p className="text-xs text-zinc-400">
                  Enter your registered Email Address. We will send a 6-digit OTP verification code to your email inbox.
                </p>
                <div>
                  <label className="block text-xs font-bold text-orange-400 mb-1">Registered Email Address</label>
                  <input
                    type="email"
                    value={resetIdentifier}
                    onChange={(e) => setResetIdentifier(e.target.value)}
                    placeholder="Enter registered email (e.g. name@example.com)"
                    className="w-full rounded-xl border border-white/10 bg-black/80 px-3.5 py-2.5 text-xs text-white outline-none focus:border-orange-500 font-semibold"
                    required
                  />
                </div>

                {resetMsg && (
                  <p className={`text-xs font-semibold ${resetMsg.startsWith("✓") || resetMsg.startsWith("OTP") ? "text-emerald-400" : "text-red-400"}`}>
                    {resetMsg}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full rounded-full bg-[#FF6B00] py-2.5 text-xs font-extrabold text-black hover:bg-orange-400 transition"
                >
                  {resetLoading ? "Sending Code..." : "📲 Send 6-Digit OTP Code"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtpAndReset} className="space-y-4">
                <p className="text-xs text-emerald-400 font-semibold">
                  {resetMsg} {demoOtpNotice}
                </p>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1">6-Digit OTP Code</label>
                  <input
                    type="text"
                    value={otpCodeInput}
                    onChange={(e) => setOtpCodeInput(e.target.value)}
                    placeholder="Enter 6-digit OTP"
                    className="w-full rounded-xl border border-white/10 bg-black/80 px-3.5 py-2.5 text-sm text-center text-orange-400 font-bold tracking-widest outline-none focus:border-orange-500 font-mono"
                    maxLength={6}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1">New Password (Min 6 chars)</label>
                  <input
                    type="password"
                    value={resetNewPassword}
                    onChange={(e) => setResetNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full rounded-xl border border-white/10 bg-black/80 px-3.5 py-2.5 text-xs text-white outline-none focus:border-orange-500"
                    required
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setResetStep(1)}
                    className="flex-1 rounded-full bg-zinc-800 py-2.5 text-xs text-zinc-400 hover:text-white"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="flex-1 rounded-full bg-[#FF6B00] py-2.5 text-xs font-extrabold text-black hover:bg-orange-400 transition"
                  >
                    {resetLoading ? "Resetting..." : "✓ Reset Password"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
