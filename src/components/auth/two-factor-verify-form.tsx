"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { twoFactor } from "@/lib/auth-client";
import { toast } from "sonner";
import { Loader2, Shield, KeyRound } from "lucide-react";

export function TwoFactorVerifyForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"totp" | "backup">("totp");
  const [code, setCode] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Individual digit inputs for TOTP
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);

  function handleDigitChange(index: number, value: string) {
    if (value.length > 1) {
      // Handle paste
      const pasted = value.replace(/\D/g, "").slice(0, 6);
      const newDigits = [...digits];
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pasted[i] ?? "";
      }
      setDigits(newDigits);
      // Focus the last filled or next empty
      const nextIndex = Math.min(pasted.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    if (!/^\d?$/.test(value)) return;

    const newDigits = [...digits];
    newDigits[index] = value;
    setDigits(newDigits);

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleDigitKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "totp") {
        const totpCode = digits.join("");
        if (totpCode.length !== 6) {
          toast.error("Please enter all 6 digits");
          setLoading(false);
          return;
        }

        const { error } = await twoFactor.verifyTotp({ code: totpCode });
        if (error) {
          toast.error(error.message || "Invalid code");
          setDigits(["", "", "", "", "", ""]);
          inputRefs.current[0]?.focus();
          setLoading(false);
          return;
        }
      } else {
        if (!code.trim()) {
          toast.error("Please enter a backup code");
          setLoading(false);
          return;
        }

        const { error } = await twoFactor.verifyBackupCode({ code: code.trim() });
        if (error) {
          toast.error(error.message || "Invalid backup code");
          setLoading(false);
          return;
        }
      }

      toast.success("Verified successfully");
      router.push("/dashboard");
    } catch {
      toast.error("Verification failed");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-(--accent-jade-muted)">
          <Shield className="h-6 w-6 text-jade" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">
          Two-Factor Authentication
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "totp"
            ? "Enter the 6-digit code from your authenticator app"
            : "Enter one of your backup codes"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {mode === "totp" ? (
          <div className="space-y-2">
            <Label>Verification Code</Label>
            <div className="flex justify-center gap-2">
              {digits.map((digit, i) => (
                <Input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  value={digit}
                  onChange={(e) => handleDigitChange(i, e.target.value)}
                  onKeyDown={(e) => handleDigitKeyDown(i, e)}
                  maxLength={6}
                  className="h-12 w-10 text-center font-mono text-lg"
                  autoFocus={i === 0}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="backup-code">Backup Code</Label>
            <Input
              id="backup-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="xxxx-xxxx-xxxx"
              className="font-mono text-center"
              autoFocus
            />
          </div>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Verify
        </Button>
      </form>

      <div className="text-center">
        <button
          type="button"
          onClick={() => setMode(mode === "totp" ? "backup" : "totp")}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-jade"
        >
          <KeyRound className="h-3.5 w-3.5" />
          {mode === "totp" ? "Use a backup code instead" : "Use authenticator app"}
        </button>
      </div>
    </div>
  );
}
