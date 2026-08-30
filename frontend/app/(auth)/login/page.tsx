"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Playfair_Display } from "next/font/google";
import type { SubmitEvent } from "react";
import { useLogin, loginErrorMessage } from "@/lib/hooks/useLogin";
import { getStaffRole } from "@/lib/auth/session";
import { BRAND } from "@/lib/branding";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["600", "700"],
});

function EyeIcon({
  className = "h-[18px] w-[18px]",
}: {
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

export default function LoginPage() {
  // Keep identifier as the value sent to your existing login API.
  const [identifier, setIdentifier] = useState("");

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);

  const loginMutation = useLogin();

  const mobileRefs = useRef<(HTMLInputElement | null)[]>([]);
  const passwordRef = useRef<HTMLInputElement>(null);

  // The app-wide launch splash (components/shared/AppSplash, mounted in the
  // root layout) covers this page while it mounts, so there's no local
  // splash/reveal transition here anymore - just autofocus the first box.
  useEffect(() => {
    mobileRefs.current[0]?.focus({ preventScroll: true });
  }, []);

  /*
   * Convert the identifier into exactly 10 visual boxes.
   */
  const mobileDigits = Array.from(
    { length: 10 },
    (_, index) => identifier[index] || ""
  );

  function handleMobileChange(
    index: number,
    value: string
  ) {
    // Only allow numbers
    const digit = value.replace(/\D/g, "").slice(-1);

    const digits = identifier.split("");

    if (digit) {
      digits[index] = digit;
    } else {
      digits[index] = "";
    }

    const nextValue = digits.join("").slice(0, 10);

    setIdentifier(nextValue);

    // Automatically move to next box
    if (digit && index < 9) {
      mobileRefs.current[index + 1]?.focus({ preventScroll: true });
    }

    // When all 10 digits are entered, move to password
    if (digit && index === 9) {
      setTimeout(() => {
        passwordRef.current?.focus({ preventScroll: true });
      }, 50);
    }
  }

  function handleMobileKeyDown(
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (
      event.key === "Backspace" &&
      !mobileDigits[index] &&
      index > 0
    ) {
      mobileRefs.current[index - 1]?.focus({ preventScroll: true });
    }

    if (
      event.key === "ArrowLeft" &&
      index > 0
    ) {
      mobileRefs.current[index - 1]?.focus({ preventScroll: true });
    }

    if (
      event.key === "ArrowRight" &&
      index < 9
    ) {
      mobileRefs.current[index + 1]?.focus({ preventScroll: true });
    }
  }

  function handleMobilePaste(
    event: React.ClipboardEvent<HTMLInputElement>
  ) {
    event.preventDefault();

    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 10);

    if (!pasted) return;

    setIdentifier(pasted);

    const nextIndex = Math.min(pasted.length, 9);

    setTimeout(() => {
      if (pasted.length === 10) {
        passwordRef.current?.focus({ preventScroll: true });
      } else {
        mobileRefs.current[nextIndex]?.focus({ preventScroll: true });
      }
    }, 50);
  }

  function handleSubmit(event: SubmitEvent) {
    event.preventDefault();

    loginMutation.mutate(
      {
        identifier: identifier.trim(),
        password,
      },
      {
        onSuccess: (data) => {
          let destination = "/admin/dashboard";

          if (data.principal_type === "customer") {
            destination = "/home";
          } else if (getStaffRole() === "salesman") {
            destination = "/salesman/home";
          }

          window.location.assign(destination);
        },
      }
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#fafaff] sm:grid sm:grid-cols-2 lg:grid-cols-[55%_45%]">

      {/* =========================================================
          HERO PANEL - tablet/desktop only. Same splash artwork as the
          mobile launch animation, shown here as a static side panel with
          no animation/timer - AppSplash itself is sm:hidden.
      ========================================================== */}

      <div className="relative hidden min-h-screen bg-[#05032c] sm:block">
        <Image
          src="/login/desktop-hero.webp"
          alt={`${BRAND.name} - Wholesale Distributor`}
          fill
          priority
          sizes="55vw"
          className="object-contain object-center"
        />
      </div>

      {/* =========================================================
          RIGHT PANEL - login form (full width on mobile, remaining
          half on tablet/desktop).
      ========================================================== */}

      <div className="relative min-w-0 overflow-hidden">

        {/* =========================================================
          DECORATIVE BACKGROUND
      ========================================================== */}

        {/* Top-right curved lines */}
        <div className="pointer-events-none absolute -right-[85px] -top-[65px] h-[250px] w-[300px] opacity-70">
          <div className="absolute inset-0 rounded-[50%] border border-[#d9d0f6]" />
          <div className="absolute right-[5px] top-[12px] h-[215px] w-[280px] rounded-[50%] border border-[#ddd5f7]" />
          <div className="absolute right-[15px] top-[25px] h-[180px] w-[260px] rounded-[50%] border border-[#e2dcf9]" />
          <div className="absolute right-[25px] top-[40px] h-[145px] w-[240px] rounded-[50%] border border-[#e6e1fa]" />
          <div className="absolute right-[35px] top-[55px] h-[110px] w-[220px] rounded-[50%] border border-[#ebe7fb]" />
        </div>

        {/* Bottom-left dots */}
        <div className="pointer-events-none absolute -bottom-5 -left-5 h-[145px] w-[160px] opacity-60">
          <div
            className="h-full w-full"
            style={{
              backgroundImage:
                "radial-gradient(circle, #cfc2f5 1.1px, transparent 1.1px)",
              backgroundSize: "9px 9px",
              maskImage:
                "linear-gradient(135deg, black 0%, transparent 75%)",
              WebkitMaskImage:
                "linear-gradient(135deg, black 0%, transparent 75%)",
            }}
          />
        </div>

        {/* Bottom-right curved lines */}
        <div className="pointer-events-none absolute -bottom-[100px] -right-[105px] h-[260px] w-[300px] opacity-60">
          <div className="absolute inset-0 rounded-[50%] border border-[#ded6f7]" />
          <div className="absolute inset-[15px] rounded-[50%] border border-[#e4def9]" />
          <div className="absolute inset-[30px] rounded-[50%] border border-[#e9e4fa]" />
          <div className="absolute inset-[45px] rounded-[50%] border border-[#eeeafa]" />
        </div>

        {/* =========================================================
          LOGIN CONTENT
      ========================================================== */}

        <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-6 sm:px-6 lg:px-10">
          <div className="w-full max-w-[430px]">

            {/* =====================================================
              BRAND HEADER
          ====================================================== */}

            <header className="mb-5 text-center">

              {/* Logo */}
              <Image
                src="/logo-mark.png"
                alt={BRAND.name}
                width={220}
                height={135}
                priority
                className="mx-auto h-[48px] w-auto object-contain"
              />

              {/* Brand name */}
              <h1
                className={`${playfair.className} mt-[2px] text-[30px] leading-tight text-[#171927]`}
              >
                {BRAND.name}
              </h1>

              {/* Decorative divider */}
              <div className="my-2 flex items-center justify-center gap-2.5">
                <span
                  className="h-px w-[58px]"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, #a27ae5)",
                  }}
                />

                <span className="text-[9px] text-[#7a38d8]">
                  ◆
                </span>

                <span
                  className="h-px w-[58px]"
                  style={{
                    background:
                      "linear-gradient(270deg, transparent, #a27ae5)",
                  }}
                />
              </div>

              <h2 className="text-[20px] font-bold tracking-[-0.3px] text-[#161825]">
                Welcome back
              </h2>

              <p className="mt-1 text-[13px] text-[#62677a]">
                Sign in to your distribution account
              </p>
            </header>

            {/* =====================================================
              LOGIN CARD
          ====================================================== */}

            <form
              onSubmit={handleSubmit}
              className="rounded-[22px] border border-[#e8e7ef] bg-white/90 px-[21px] py-[22px] shadow-[0_18px_50px_rgba(66,48,125,0.10)] backdrop-blur-xl sm:px-[22px] sm:py-[23px]"
            >

              {/* ===================================================
                MOBILE NUMBER
            ==================================================== */}

              <div>
                <label
                  htmlFor="mobile-0"
                  className="block text-[12px] font-bold text-[#202331]"
                >
                  Enter your mobile number
                </label>

                <p className="mt-[3px] text-[10px] text-[#85899a]">
                  We&apos;ll send you a one time password
                </p>

                {/* Mobile boxes */}
                <div className="mt-3 flex w-full flex-nowrap gap-[5px]">
                  {mobileDigits.map((digit, index) => (
                    <input
                      key={index}
                      ref={(element) => {
                        mobileRefs.current[index] = element;
                      }}
                      id={`mobile-${index}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      autoComplete={
                        index === 0
                          ? "tel"
                          : "off"
                      }
                      value={digit}
                      onChange={(event) =>
                        handleMobileChange(
                          index,
                          event.target.value
                        )
                      }
                      onKeyDown={(event) =>
                        handleMobileKeyDown(
                          index,
                          event
                        )
                      }
                      onPaste={
                        index === 0
                          ? handleMobilePaste
                          : undefined
                      }
                      aria-label={`Mobile number digit ${index + 1
                        }`}
                      className={`
                      h-[39px]
                      min-w-0
                      flex-1
                      rounded-[7px]
                      border
                      bg-white
                      text-center
                      text-[15px]
                      font-medium
                      text-[#222437]
                      outline-none
                      transition-all
                      ${digit
                          ? "border-[#b99aea] bg-[#fdfbff]"
                          : "border-[#dedfea]"
                        }
                      focus:border-[#7036e0]
                      focus:ring-[2px]
                      focus:ring-[#7036e0]/10
                    `}
                    />
                  ))}
                </div>
              </div>

              {/* ===================================================
                OR DIVIDER
            ==================================================== */}

              <div className="my-[16px] flex items-center gap-3">
                <div className="h-px flex-1 bg-[#e7e7ee]" />



                <div className="h-px flex-1 bg-[#e7e7ee]" />
              </div>

              {/* ===================================================
                PASSWORD
            ==================================================== */}

              <div>
                <label
                  htmlFor="password"
                  className="block text-[12px] font-bold text-[#202331]"
                >
                  Enter your password
                </label>

                <div className="mt-[7px] flex h-[39px] items-center overflow-hidden rounded-[8px] border border-[#dedfea] bg-white transition-all focus-within:border-[#7137df] focus-within:ring-[2px] focus-within:ring-[#7137df]/10">
                  <input
                    ref={passwordRef}
                    id="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    required
                    className="min-w-0 flex-1 border-0 bg-transparent px-3 text-[11px] text-[#1c2032] outline-none placeholder:text-[#a4a7b5]"
                  />

                  <button
                    type="button"
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                    onClick={() =>
                      setShowPassword(
                        (value) => !value
                      )
                    }
                    className="px-3 text-[#7c8091] transition-colors hover:text-[#262a3b]"
                  >
                    <EyeIcon className="h-[17px] w-[17px]" />
                  </button>
                </div>
              </div>

              {/* ===================================================
                REMEMBER + FORGOT
            ==================================================== */}

              <div className="my-[14px] flex items-center justify-between">
                <label className="flex cursor-pointer items-center gap-1.5 text-[10px] text-[#686d7d]">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(event) =>
                      setRemember(
                        event.target.checked
                      )
                    }
                    className="h-[14px] w-[14px] cursor-pointer rounded accent-[#6730d7]"
                  />

                  <span>Remember me</span>
                </label>

                <button
                  type="button"
                  className="text-[10px] font-medium text-[#5422bd] transition-colors hover:text-[#3e168e]"
                >
                  Forgot password?
                </button>
              </div>

              {/* ===================================================
                ERROR
            ==================================================== */}

              {loginMutation.isError && (
                <div className="mb-3 rounded-[7px] border border-red-100 bg-red-50 px-3 py-2 text-[11px] font-medium text-red-700">
                  {loginErrorMessage(
                    loginMutation.error
                  )}
                </div>
              )}

              {/* ===================================================
                LOGIN BUTTON
            ==================================================== */}

              <button
                type="submit"
                disabled={loginMutation.isPending}
                className="flex h-[38px] w-full items-center justify-center rounded-[9px] text-[11px] font-semibold text-white shadow-[0_9px_18px_rgba(91,39,199,0.24)] transition-all hover:-translate-y-[1px] hover:shadow-[0_12px_22px_rgba(91,39,199,0.28)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70"
                style={{
                  background:
                    "linear-gradient(100deg, #4b16bc, #6926d9)",
                }}
              >
                {loginMutation.isPending ? "Signing in..." : "Sign in securely"}
              </button>

              {/* ===================================================
                FOOTER
            ==================================================== */}

              <p className="mt-[14px] text-center text-[9px] leading-4 text-[#777b8b]">
                Don&apos;t have access yet?{" "}
                <span className="font-semibold text-[#5422bd]">
                  Contact your distributor administrator.
                </span>
              </p>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}