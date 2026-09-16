export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-4xl mx-auto px-4 py-16 sm:py-24">
        <div className="space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-50 mb-2">
              P2C Engine
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300">
              Prospect-to-Customer Platform for SaaS Ventures
            </p>
          </div>

          {/* Phase 0 Status */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 space-y-4">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
              Phase 0 — Scaffold
            </h2>
            <ul className="space-y-2 text-slate-700 dark:text-slate-300">
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                Next.js 14 (App Router) + TypeScript initialized
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                Prisma schema created (Venture, Contact, StateHistory, Touch)
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                PostgreSQL configured
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                Single-user access gate middleware
              </li>
              <li className="flex items-center gap-2">
                <span className="text-amber-600">→</span>
                Environment variables configured (.env.local, .env.example)
              </li>
              <li className="flex items-center gap-2">
                <span className="text-amber-600">→</span>
                Database migration pending (npx prisma migrate dev)
              </li>
              <li className="flex items-center gap-2">
                <span className="text-amber-600">→</span>
                Ready to push to GitHub
              </li>
            </ul>
          </div>

          {/* Next Steps */}
          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <h3 className="font-semibold text-slate-900 dark:text-slate-50 mb-2">
              Next Steps
            </h3>
            <ol className="space-y-2 text-slate-700 dark:text-slate-300 text-sm list-decimal list-inside">
              <li>Set DATABASE_URL in .env.local (Railway PostgreSQL or local Postgres)</li>
              <li>Run: npx prisma migrate dev --name init</li>
              <li>Run: npm run dev</li>
              <li>Visit http://localhost:3000 to verify</li>
              <li>Push to GitHub</li>
              <li>Move to Phase 1 (Prospect DB + Identification)</li>
            </ol>
          </div>

          {/* Architecture */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              Architecture Locked
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm text-slate-700 dark:text-slate-300">
              <div>
                <div className="font-medium text-slate-900 dark:text-slate-50">Framework</div>
                <div>Next.js 14 App Router</div>
              </div>
              <div>
                <div className="font-medium text-slate-900 dark:text-slate-50">Database</div>
                <div>PostgreSQL + Prisma</div>
              </div>
              <div>
                <div className="font-medium text-slate-900 dark:text-slate-50">Auth</div>
                <div>API Key (single-user v1)</div>
              </div>
              <div>
                <div className="font-medium text-slate-900 dark:text-slate-50">Hosting</div>
                <div>Vercel + Railway</div>
              </div>
              <div>
                <div className="font-medium text-slate-900 dark:text-slate-50">Email</div>
                <div>Resend</div>
              </div>
              <div>
                <div className="font-medium text-slate-900 dark:text-slate-50">Social</div>
                <div>Buffer API (free tier)</div>
              </div>
            </div>
          </div>

          {/* Module Map */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              Modules
            </h3>
            <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
              <li>Module 1: Prospect Identification (manual + CSV)</li>
              <li>Module 2: Prospect Database (canonical record)</li>
              <li>Module 3: Lead/Pipeline Management (state machine)</li>
              <li>Module 4a: Direct Outreach Task Queue (email + LinkedIn)</li>
              <li>Module 4b: Post Queue Replenishment (Buffer)</li>
              <li>Module 5: Response Tracking (replies → transitions)</li>
              <li>Module 6: Deal Closing (Opportunity → Customer)</li>
              <li>Module 7: Call Logging</li>
            </ul>
          </div>

          {/* Documentation Links */}
          <div className="flex gap-4">
            <a
              href="/CLAUDE.md"
              className="inline-block px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 dark:bg-slate-50 dark:text-slate-900 dark:hover:bg-slate-200 transition"
            >
              View CLAUDE.md
            </a>
            <a
              href="/docs/01-lifecycle-and-operating-model.md"
              className="inline-block px-4 py-2 bg-slate-200 text-slate-900 rounded-lg hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-50 dark:hover:bg-slate-600 transition"
            >
              Lifecycle Docs
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
