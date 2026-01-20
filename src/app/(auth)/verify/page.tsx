"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useI18n } from "@/components/LocaleProvider";

type Status = "idle" | "loading" | "success" | "error";

export default function VerifyPage() {
  const { dictionary } = useI18n();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [verificationId, setVerificationId] = useState<string | null>(null);

  useEffect(() => {
    const initialEmail = searchParams.get("email");
    if (initialEmail) {
      setEmail(initialEmail);
    }
  }, [searchParams]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);

    if (!email.includes("@")) {
      setMessage(dictionary.auth.emailInvalid);
      return;
    }

    if (code.length !== 6) {
      setMessage(dictionary.auth.verificationCodeInvalid);
      return;
    }

    setStatus("loading");
    const response = await fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });

    if (!response.ok) {
      setStatus("error");
      setMessage(dictionary.auth.verificationFailed);
      return;
    }

    const data = await response.json().catch(() => null);
    const returnedVerificationId = data?.verificationId;
    const pendingRaw = sessionStorage.getItem("pendingSignup");
    if (!returnedVerificationId || !pendingRaw) {
      setStatus("error");
      setMessage(dictionary.auth.verificationDataMissing);
      return;
    }

    let pending;
    try {
      pending = JSON.parse(pendingRaw);
    } catch {
      setStatus("error");
      setMessage(dictionary.auth.verificationDataMissing);
      return;
    }

    if (pending?.email?.toLowerCase() !== email.toLowerCase()) {
      setStatus("error");
      setMessage(dictionary.auth.verificationDataMismatch);
      return;
    }

    setVerificationId(returnedVerificationId);
    setStatus("success");
    setMessage(dictionary.auth.verificationSuccess);
  };

  const handleComplete = async () => {
    const pendingRaw = sessionStorage.getItem("pendingSignup");
    if (!pendingRaw || !verificationId) {
      setStatus("error");
      setMessage(dictionary.auth.verificationDataMissing);
      return;
    }

    let pending;
    try {
      pending = JSON.parse(pendingRaw);
    } catch {
      setStatus("error");
      setMessage(dictionary.auth.verificationDataMissing);
      return;
    }

    setStatus("loading");
    const registerResponse = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...pending,
        verificationId,
      }),
    });

    if (!registerResponse.ok) {
      setStatus("error");
      setMessage(dictionary.auth.verificationFailed);
      return;
    }

    sessionStorage.removeItem("pendingSignup");
    const loginResult = await signIn("credentials", {
      email: pending.email,
      password: pending.password,
      redirect: false,
      callbackUrl: "/dashboard",
    });

    if (loginResult?.error) {
      setStatus("error");
      setMessage(dictionary.auth.loginFailed);
      return;
    }

    window.location.href = loginResult?.url ?? "/dashboard";
  };

  return (
    <div className="mx-auto max-w-md space-y-4 rounded-3xl bg-white/90 p-6 shadow-sm ring-1 ring-slate-200/70 sm:p-8">
      <h1 className="text-2xl font-semibold text-slate-900">
        {dictionary.auth.verificationTitle}
      </h1>
      <p className="text-sm text-slate-600">
        {dictionary.auth.verificationDescription}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-semibold text-slate-700">
            {dictionary.auth.email}
          </label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2 text-sm"
            required
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-700">
            {dictionary.auth.verificationCodeLabel}
          </label>
          <input
            type="text"
            value={code}
            onChange={(event) =>
              setCode(event.target.value.replace(/[^0-9]/g, ""))
            }
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2 text-sm"
            inputMode="numeric"
            maxLength={6}
            required
          />
          <p className="mt-1 text-xs text-slate-500">
            {dictionary.auth.verificationCodeHint}
          </p>
        </div>

        {message ? (
          <p
            className={`text-sm ${
              status === "success" ? "text-teal-700" : "text-rose-600"
            }`}
          >
            {message}
          </p>
        ) : null}
        {status !== "success" ? (
          <button
            type="submit"
            className="w-full rounded-full bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-70"
            disabled={status === "loading"}
          >
            {status === "loading"
              ? dictionary.auth.verificationChecking
              : dictionary.auth.verifyButton}
          </button>
        ) : null}
      </form>

      {status === "success" ? (
        <button
          type="button"
          onClick={handleComplete}
          className="block w-full rounded-full bg-teal-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-70"
          disabled={status === "loading"}
        >
          {dictionary.auth.completeButton}
        </button>
      ) : null}
    </div>
  );
}
