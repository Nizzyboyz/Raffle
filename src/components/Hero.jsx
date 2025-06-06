export default function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-primary text-white">
      <div className="max-w-7xl mx-auto px-6 py-24 text-center">
        <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
          Win big. Play fair. Own the moment.
        </h2>
        <p className="mt-4 max-w-xl mx-auto text-lg/relaxed">
          Blockchain‑verified raffles with transparent odds and instant payouts.
        </p>

        <button
          className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-xl
                     bg-white/10 hover:bg-white/20 transition font-semibold"
          onClick={() =>
            document
              .getElementById('raffle-grid')
              ?.scrollIntoView({ behavior: 'smooth' })
          }
        >
          Browse Raffles
        </button>
      </div>

      {/* faint gradient blob behind text */}
      <div className="absolute inset-0 -z-10
                      bg-gradient-to-br from-white/10 via-primary/20 to-transparent" />
    </section>
  );
}
