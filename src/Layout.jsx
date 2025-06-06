// Layout.jsx
export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col">
      {/* sticky nav */}
      <header className="bg-white shadow-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center gap-4 px-6 py-3">
          <h1 className="text-2xl font-bold text-dark flex-1">Raffle Hub</h1>
          {/* add nav links / wallet button here */}
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="bg-white border-t text-sm py-6">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap justify-between gap-4">
          <p>&copy; 2025 Raffle Hub</p>
          <a href="mailto:support@example.com" className="hover:underline">
            Contact&nbsp;Us
          </a>
        </div>
      </footer>
    </div>
  );
}
