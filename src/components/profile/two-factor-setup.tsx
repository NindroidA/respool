"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { twoFactor } from "@/lib/auth-client";
import { toast } from "sonner";
import QRCode from "qrcode";
import {
  Shield,
  ShieldCheck,
  ShieldOff,
  Loader2,
  Copy,
  RefreshCw,
  Eye,
  EyeOff,
} from "lucide-react";

interface TwoFactorSetupProps {
  enabled: boolean;
}

export function TwoFactorSetup({ enabled }: TwoFactorSetupProps) {
  if (enabled) {
    return <TwoFactorManage />;
  }
  return <TwoFactorEnable />;
}

function TwoFactorEnable() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"password" | "qr" | "verify" | "done">(
    "password",
  );
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [totpUri, setTotpUri] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verifyCode, setVerifyCode] = useState("");

  useEffect(() => {
    if (totpUri) {
      QRCode.toDataURL(totpUri, {
        width: 200,
        margin: 2,
        color: { dark: "#000000", light: "#ffffff" },
      }).then(setQrDataUrl);
    }
  }, [totpUri]);

  function reset() {
    setStep("password");
    setPassword("");
    setTotpUri("");
    setQrDataUrl("");
    setBackupCodes([]);
    setVerifyCode("");
  }

  async function handleEnable() {
    if (!password) {
      toast.error("Password is required");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await twoFactor.enable({
        password,
        issuer: "Respool",
      });

      if (error) {
        toast.error(error.message || "Failed to enable 2FA");
        setLoading(false);
        return;
      }

      if (data) {
        setTotpUri(data.totpURI);
        setBackupCodes(data.backupCodes);
        setStep("qr");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to enable 2FA");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    if (verifyCode.length !== 6) {
      toast.error("Enter a 6-digit code");
      return;
    }
    setLoading(true);
    try {
      const { error } = await twoFactor.verifyTotp({ code: verifyCode });
      if (error) {
        toast.error(error.message || "Invalid code — try again");
        setVerifyCode("");
        setLoading(false);
        return;
      }
      setStep("done");
      toast.success("Two-factor authentication enabled!");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  function copyBackupCodes() {
    navigator.clipboard.writeText(backupCodes.join("\n"));
    toast.success("Backup codes copied to clipboard");
  }

  // Extract secret from TOTP URI for manual entry
  const secret = totpUri ? new URL(totpUri).searchParams.get("secret") : null;

  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-(--bg-card) p-3">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-(--accent-jade-muted) text-jade">
          <Shield className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">
            Two-Factor Authentication
          </p>
          <p className="text-xs text-muted-foreground">
            Not enabled — add an extra layer of security
          </p>
        </div>
      </div>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) reset();
        }}
      >
        <DialogTrigger
          render={
            <Button size="sm" className="gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" />
              Enable
            </Button>
          }
        />
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {step === "password" && "Enable Two-Factor Authentication"}
              {step === "qr" && "Scan QR Code"}
              {step === "verify" && "Verify Setup"}
              {step === "done" && "2FA Enabled!"}
            </DialogTitle>
          </DialogHeader>

          {step === "password" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Enter your password to begin setting up two-factor
                authentication.
              </p>
              <div className="space-y-2">
                <Label htmlFor="2fa-password">Password</Label>
                <Input
                  id="2fa-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleEnable()}
                  autoFocus
                />
              </div>
              <Button
                onClick={handleEnable}
                disabled={loading}
                className="w-full"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Continue
              </Button>
            </div>
          )}

          {step === "qr" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Scan this QR code with your authenticator app (Google
                Authenticator, Authy, 1Password, etc.)
              </p>

              {/* QR Code */}
              <div className="flex justify-center">
                {qrDataUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={qrDataUrl}
                    alt="TOTP QR Code"
                    className="rounded-lg border border-border"
                    width={200}
                    height={200}
                  />
                )}
              </div>

              {/* Manual entry secret */}
              {secret && (
                <div className="space-y-1.5">
                  <p className="text-2xs font-medium text-(--text-faint)">
                    Or enter this code manually:
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded bg-(--bg-surface) px-3 py-1.5 font-mono text-xs text-foreground">
                      {secret}
                    </code>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => {
                        navigator.clipboard.writeText(secret);
                        toast.success("Secret copied");
                      }}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Backup codes */}
              <div className="space-y-2 rounded-lg border border-(--color-warning)/30 bg-(--color-warning-muted) p-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-(--color-warning)">
                    Save your backup codes
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 gap-1 text-xs"
                    onClick={copyBackupCodes}
                  >
                    <Copy className="h-3 w-3" />
                    Copy
                  </Button>
                </div>
                <p className="text-2xs text-muted-foreground">
                  Store these codes somewhere safe. Each can be used once if you
                  lose access to your authenticator.
                </p>
                <div className="grid grid-cols-2 gap-1">
                  {backupCodes.map((code, i) => (
                    <code
                      key={i}
                      className="rounded bg-(--bg-base) px-2 py-1 text-center font-mono text-xs text-foreground"
                    >
                      {code}
                    </code>
                  ))}
                </div>
              </div>

              <Button onClick={() => setStep("verify")} className="w-full">
                I&apos;ve saved my backup codes — Continue
              </Button>
            </div>
          )}

          {step === "verify" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Enter the 6-digit code from your authenticator app to confirm
                setup.
              </p>
              <div className="space-y-2">
                <Label htmlFor="verify-code">Verification Code</Label>
                <Input
                  id="verify-code"
                  value={verifyCode}
                  onChange={(e) =>
                    setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                  placeholder="000000"
                  className="text-center font-mono text-lg tracking-widest"
                  maxLength={6}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  autoFocus
                />
              </div>
              <Button
                onClick={handleVerify}
                disabled={loading || verifyCode.length !== 6}
                className="w-full"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Verify & Enable
              </Button>
            </div>
          )}

          {step === "done" && (
            <div className="space-y-4 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-(--accent-jade-muted)">
                <ShieldCheck className="h-8 w-8 text-jade" />
              </div>
              <div>
                <p className="font-medium text-foreground">
                  Two-factor authentication is now active
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  You&apos;ll be asked for a code each time you sign in.
                </p>
              </div>
              <Button onClick={() => setOpen(false)} className="w-full">
                Done
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TwoFactorManage() {
  const router = useRouter();
  const [disableOpen, setDisableOpen] = useState(false);
  const [regenOpen, setRegenOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showCodes, setShowCodes] = useState(false);

  async function handleDisable() {
    if (!password) {
      toast.error("Password is required");
      return;
    }
    setLoading(true);
    try {
      const { error } = await twoFactor.disable({ password });
      if (error) {
        toast.error(error.message || "Failed to disable 2FA");
        setLoading(false);
        return;
      }
      toast.success("Two-factor authentication disabled");
      setDisableOpen(false);
      setPassword("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to disable 2FA");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegenerate() {
    if (!password) {
      toast.error("Password is required");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await twoFactor.generateBackupCodes({ password });
      if (error) {
        toast.error(error.message || "Failed to regenerate codes");
        setLoading(false);
        return;
      }
      if (data) {
        setBackupCodes(data.backupCodes);
        setShowCodes(true);
        toast.success("New backup codes generated");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to regenerate");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {/* Status */}
      <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-(--accent-jade-muted)/50 p-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-jade/20 text-jade">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              Two-Factor Authentication
            </p>
            <p className="text-xs text-jade">
              Enabled — your account is secured with TOTP
            </p>
          </div>
        </div>
        <Badge className="border-primary/30 bg-primary/10 text-xs text-primary">
          Active
        </Badge>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {/* Regenerate Backup Codes */}
        <Dialog
          open={regenOpen}
          onOpenChange={(v) => {
            setRegenOpen(v);
            if (!v) {
              setPassword("");
              setBackupCodes([]);
              setShowCodes(false);
            }
          }}
        >
          <DialogTrigger
            render={
              <Button size="sm" variant="outline" className="gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" />
                Regenerate Backup Codes
              </Button>
            }
          />
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Regenerate Backup Codes</DialogTitle>
            </DialogHeader>
            {!showCodes ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  This will invalidate your existing backup codes and generate
                  new ones. Enter your password to continue.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="regen-password">Password</Label>
                  <Input
                    id="regen-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleRegenerate()}
                    autoFocus
                  />
                </div>
                <Button
                  onClick={handleRegenerate}
                  disabled={loading}
                  className="w-full"
                >
                  {loading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Generate New Codes
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg border border-(--color-warning)/30 bg-(--color-warning-muted) p-3">
                  <p className="mb-2 text-xs font-semibold text-(--color-warning)">
                    New Backup Codes
                  </p>
                  <p className="mb-3 text-2xs text-muted-foreground">
                    Save these codes somewhere safe. Your old codes no longer
                    work.
                  </p>
                  <div className="grid grid-cols-2 gap-1">
                    {backupCodes.map((code, i) => (
                      <code
                        key={i}
                        className="rounded bg-(--bg-base) px-2 py-1 text-center font-mono text-xs text-foreground"
                      >
                        {code}
                      </code>
                    ))}
                  </div>
                </div>
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(backupCodes.join("\n"));
                    toast.success("Copied to clipboard");
                  }}
                  variant="outline"
                  className="w-full gap-1.5"
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy All
                </Button>
                <Button onClick={() => setRegenOpen(false)} className="w-full">
                  Done
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Disable 2FA */}
        <Dialog
          open={disableOpen}
          onOpenChange={(v) => {
            setDisableOpen(v);
            if (!v) setPassword("");
          }}
        >
          <DialogTrigger
            render={
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-(--color-error) hover:bg-(--color-error-muted)"
              >
                <ShieldOff className="h-3.5 w-3.5" />
                Disable 2FA
              </Button>
            }
          />
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="rounded-lg border border-(--color-error)/30 bg-(--color-error-muted) p-3">
                <p className="text-sm text-(--color-error)">
                  This will make your account less secure. You&apos;ll no longer
                  need a code to sign in.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="disable-password">
                  Enter your password to confirm
                </Label>
                <Input
                  id="disable-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleDisable()}
                  autoFocus
                />
              </div>
              <Button
                onClick={handleDisable}
                disabled={loading}
                className="w-full bg-(--color-error) text-white hover:bg-(--color-error)/80"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Disable Two-Factor Authentication
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
