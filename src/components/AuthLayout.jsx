import React from "react";
import { Check } from "lucide-react";
import LanguageToggle from "@/components/LanguageToggle";

/**
 * Shared layout for auth screens. When `benefits` (array of strings) and/or
 * `proof` (string) are provided, a value panel appears beside the form on
 * desktop so the sign-up screen demonstrates benefits and evidence instead of
 * showing a bare form.
 */
export default function AuthLayout({ icon: Icon, title, subtitle, footer, benefits, proof, children }) {
  const hasPanel = (benefits && benefits.length > 0) || proof;
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-20">
      <div className="absolute top-4 right-4">
        <LanguageToggle />
      </div>
      <div className={`w-full ${hasPanel ? "max-w-4xl grid gap-10 lg:grid-cols-2 lg:items-center" : "max-w-md"}`}>
        {hasPanel && (
          <div className="hidden lg:block">
            {benefits && benefits.length > 0 && (
              <ul className="space-y-4">
                {benefits.map((b) => (
                  <li key={b} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Check className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                    </span>
                    <span className="text-sm font-medium text-foreground">{b}</span>
                  </li>
                ))}
              </ul>
            )}
            {proof && (
              <p className="mt-6 border-l-2 border-primary/40 pl-4 text-sm text-muted-foreground">{proof}</p>
            )}
          </div>
        )}
        <div className="w-full max-w-md justify-self-center">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary mb-4">
              <Icon className="w-7 h-7 text-primary-foreground" aria-hidden="true" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
            {subtitle && <p className="text-muted-foreground mt-2">{subtitle}</p>}
          </div>
          <div className="bg-card rounded-lg border border-border p-8">
            {children}
          </div>
          {footer && (
            <p className="text-center text-sm text-muted-foreground mt-6">{footer}</p>
          )}
        </div>
      </div>
    </div>
  );
}
