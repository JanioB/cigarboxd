"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-[780px] flex-col justify-center px-4 py-16">
      <p className="graphik text-xs font-semibold uppercase tracking-[0.24em] text-sh-grey">
        Application error
      </p>
      <h1 className="tiempos mt-3 text-4xl text-p-white">Something broke while rendering this page.</h1>
      <p className="mt-4 text-base leading-7 text-l-white">
        {error.message || "Unexpected runtime error."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="graphik mt-6 w-fit rounded-full bg-b-green px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-si-black"
      >
        Retry
      </button>
    </main>
  );
}

