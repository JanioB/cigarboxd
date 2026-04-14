"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-[#17171b]">
        <main className="mx-auto flex min-h-screen max-w-[780px] flex-col justify-center px-4 py-16">
          <p className="graphik text-xs font-semibold uppercase tracking-[0.24em] text-sh-grey">
            Fatal error
          </p>
          <h1 className="tiempos mt-3 text-4xl text-p-white">The application hit a fatal rendering error.</h1>
          <p className="mt-4 text-base leading-7 text-l-white">
            {error.message || "Unexpected fatal error."}
          </p>
          <button
            type="button"
            onClick={reset}
            className="graphik mt-6 w-fit rounded-full bg-b-green px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-si-black"
          >
            Retry
          </button>
        </main>
      </body>
    </html>
  );
}
