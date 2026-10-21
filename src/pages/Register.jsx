import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Mail, Lock, Loader2, Eye, EyeOff, Check } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import { toast } from "@/components/ui/use-toast";
import { safeReturnTo } from "@/lib/authReturnTo";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** 0–4 score: length, case mix, digits, symbols. */
function passwordScore(pw) {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score += 1;
  if (pw.length >= 12) score += 1;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score += 1;
  if (/\d/.test(pw)) score += 1;
  if (/[^A-Za-z0-9]/.test(pw)) score += 1;
  return Math.min(4, score);
}

function PasswordStrength({ password, t }) {
  const score = passwordScore(password);
  if (!password) return null;
  const labels = [
    t('auth.strengthWeak'),
    t('auth.strengthWeak'),
    t('auth.strengthFair'),
    t('auth.strengthGood'),
    t('auth.strengthStrong'),
  ];
  const colors = ['bg-destructive', 'bg-destructive', 'bg-amber-500', 'bg-emerald-500', 'bg-emerald-600'];
  return (
    <div className="space-y-1" aria-live="polite">
      <div className="flex gap-1" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`h-1 flex-1 rounded-full ${i < score ? colors[score] : 'bg-secondary'}`}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{labels[score]}</p>
    </div>
  );
}

export default function Register() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false, confirm: false });

  const emailInvalid = touched.email && email.length > 0 && !EMAIL_RE.test(email);
  const passwordTooShort = touched.password && password.length > 0 && password.length < 8;
  const confirmMismatch = touched.confirm && confirmPassword.length > 0 && password !== confirmPassword;
  const confirmMatch = confirmPassword.length > 0 && password === confirmPassword;

  const benefits = useMemo(
    () => [t('auth.benefit1'), t('auth.benefit2'), t('auth.benefit3')],
    [t]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setTouched({ email: true, password: true, confirm: true });
    if (!EMAIL_RE.test(email)) {
      setError(t('auth.emailInvalid'));
      return;
    }
    if (password.length < 8) {
      setError(t('auth.passwordTooShort'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('auth.passwordsMismatch'));
      return;
    }
    setLoading(true);
    try {
      await base44.auth.register({ email, password });
      setShowOtp(true);
    } catch (err) {
      setError(err.message || t('auth.registerError'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await base44.auth.verifyOtp({ email, otpCode });
      if (result?.access_token) {
        base44.auth.setToken(result.access_token);
      }
      window.location.href = safeReturnTo();
    } catch (err) {
      setError(err.message || t('auth.codeInvalid'));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      await base44.auth.resendOtp(email);
      toast({
        title: t('auth.codeSent'),
        description: t('auth.codeSentDesc'),
      });
    } catch (err) {
      setError(err.message || t('auth.resendFailed'));
    }
  };

  const handleGoogle = () => {
    base44.auth.loginWithProvider("google", safeReturnTo());
  };

  if (showOtp) {
    return (
      <AuthLayout
        icon={Mail}
        title={t('auth.otpTitle')}
        subtitle={t('auth.otpSubtitle', { email })}
      >
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            {error}
          </div>
        )}
        <div className="flex justify-center mb-6">
          <InputOTP
            maxLength={6}
            value={otpCode}
            onChange={setOtpCode}
            autoFocus
            autoComplete="one-time-code"
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>
        <Button
          className="w-full h-12 font-medium"
          onClick={handleVerify}
          disabled={loading || otpCode.length < 6}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t('auth.verifying')}
            </>
          ) : (
            t('auth.verify')
          )}
        </Button>
        <p className="text-center text-sm text-muted-foreground mt-4">
          {t('auth.noCode')}{" "}
          <button onClick={handleResend} className="text-primary font-medium hover:underline">
            {t('auth.resend')}
          </button>
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      icon={UserPlus}
      title={t('auth.registerTitle')}
      subtitle={t('auth.registerSubtitle')}
      benefits={benefits}
      proof={t('auth.registerProof')}
      footer={
        <>
          {t('auth.hasAccount')}{" "}
          <Link
            to={"/login" + (safeReturnTo() !== "/" ? "?returnTo=" + encodeURIComponent(safeReturnTo()) : "")}
            className="text-primary font-medium hover:underline"
          >
            {t('auth.loginLink')}
          </Link>
        </>
      }
    >
      <Button
        variant="outline"
        size="lg"
        className="w-full mb-6"
        onClick={handleGoogle}
      >
        <GoogleIcon className="w-5 h-5 mr-2" />
        {t('auth.continueGoogle')}
      </Button>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-3 text-muted-foreground">{t('common.or')}</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">{t('common.email')}</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="vous@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setTouched((s) => ({ ...s, email: true }))}
              className="pl-10 h-12"
              aria-invalid={emailInvalid || undefined}
              aria-describedby={emailInvalid ? 'email-error' : undefined}
              required
            />
          </div>
          {emailInvalid && (
            <p id="email-error" className="text-xs text-destructive">{t('auth.emailInvalid')}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">{t('common.password')}</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setTouched((s) => ({ ...s, password: true }))}
              className="pl-10 pr-10 h-12"
              aria-invalid={passwordTooShort || undefined}
              aria-describedby={passwordTooShort ? 'password-error' : 'password-hint'}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p id="password-hint" className="text-xs text-muted-foreground">{t('auth.passwordHint')}</p>
          {passwordTooShort && (
            <p id="password-error" className="text-xs text-destructive">{t('auth.passwordTooShort')}</p>
          )}
          <PasswordStrength password={password} t={t} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">{t('auth.confirmPassword')}</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="confirm"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onBlur={() => setTouched((s) => ({ ...s, confirm: true }))}
              className="pl-10 pr-10 h-12"
              aria-invalid={confirmMismatch || undefined}
              aria-describedby={confirmMismatch ? 'confirm-error' : undefined}
              required
            />
            {confirmMatch && (
              <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" aria-hidden="true" />
            )}
          </div>
          {confirmMismatch && (
            <p id="confirm-error" className="text-xs text-destructive">{t('auth.passwordsMismatch')}</p>
          )}
        </div>
        <Button type="submit" size="lg" className="w-full font-medium" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t('auth.registerSubmitting')}
            </>
          ) : (
            t('auth.registerSubmit')
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}