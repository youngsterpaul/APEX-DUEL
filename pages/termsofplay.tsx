import React, { useState } from 'react';

export default function TermsAndConditions() {
  const [activeSection, setActiveSection] = useState<string>('escrow');

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const navItems = [
    { id: 'overview', label: '1. Platform Overview', icon: '📄' },
    { id: 'escrow', label: '2. Match Escrow & Weekly Payouts', icon: '🔒' },
    { id: 'results', label: '3. Result Verification', icon: '✅' },
    { id: 'disputes', label: '4. Disputes & Fraud Bans', icon: '⚖️' },
    { id: 'time-forfeit', label: '5. Time Limits & 24-Hour Transfer Rules', icon: '⏰' },
    { id: 'tournaments', label: '6. Tournaments & Leagues', icon: '🏆' },
    { id: 'account-trading', label: '7. Marketplace, Account Selling & External Chat', icon: '🛒' },
    { id: 'fairplay', label: '8. Non-Cooperation & Penalties', icon: '⚠️' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
      {/* Header Banner */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">⚔️</span>
            <span className="text-xl font-bold tracking-wider text-white uppercase">
              APEX DUEL — Terms of Play
            </span>
          </div>
          <div className="flex items-center space-x-2 text-xs text-slate-400 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
            <span className="text-emerald-400">🛡️</span>
            <span>Smart Escrow Protected</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar Navigation */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-3">
                Terms Navigation
              </h2>
              <nav className="space-y-1">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      activeSection === item.id
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <span className="shrink-0">{item.icon}</span>
                    <span className="truncate">{item.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main Terms Document */}
          <main className="lg:col-span-3 space-y-8">
            {/* Hero / Document Header */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 relative overflow-hidden">
              <div className="inline-flex items-center space-x-2 text-indigo-400 text-xs font-semibold uppercase tracking-widest mb-3 bg-indigo-500/10 px-3 py-1 rounded-md border border-indigo-500/20">
                Legal Binding Terms
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Terms of Service & Competitive Rules
              </h1>
              <p className="mt-3 text-slate-400 text-sm sm:text-base leading-relaxed">
                Please read these terms carefully before participating in any 1v1 matches, tournaments, leagues, or marketplace transactions hosted on APEX DUEL.
              </p>
            </div>

            {/* Section 1: Platform Overview */}
            <section id="overview" className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-4">
              <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
                <span className="text-xl">📄</span>
                <h2 className="text-xl font-bold text-white">1. Platform Overview</h2>
              </div>
              <div className="text-slate-300 text-sm sm:text-base space-y-3 leading-relaxed">
                <p>
                  Our platform provides an automated global competitive ecosystem enabling gamers to create and join 1v1 matches, user-created tournaments, and long-term leagues across supported video games on the platform.
                </p>
                <p>
                  By creating an account, participating in challenges, or trading on the platform, you agree to abide by these Terms and Conditions. All competitive stakes and account transfers are processed via smart escrow to guarantee security and prevent fraud.
                </p>
              </div>
            </section>

            {/* Section 2: Match Escrow & Weekly Payouts */}
            <section id="escrow" className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-4">
              <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
                <span className="text-xl">🔒</span>
                <h2 className="text-xl font-bold text-white">2. Match Escrow & Weekly Payouts</h2>
              </div>
              <div className="text-slate-300 text-sm sm:text-base space-y-4 leading-relaxed">
                <div className="p-4 bg-indigo-950/40 border border-indigo-800/50 rounded-xl">
                  <h3 className="text-indigo-300 font-semibold mb-1 text-sm uppercase tracking-wide">
                    Smart Escrow & Weekly Settlement
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300">
                    To avoid lies, unpaid prizes, and theft of rewards, entry stakes are locked into smart escrow before any match begins. Standard platform payments and tournament balances are processed and disbursed on a **weekly basis**.
                  </p>
                </div>

                <ul className="space-y-3 list-disc list-inside text-slate-300">
                  <li>
                    <strong className="text-white">1v1 Matches (Paid Only):</strong> All 1v1 head-to-head matches require players to set monetary stakes. 1v1 matches are strictly not free.
                  </li>
                  <li>
                    <strong className="text-white">Escrow Release:</strong> Upon mutual confirmation (Winner marks "Win", Loser marks "Loss"), funds automatically credit to the winner.
                  </li>
                  <li>
                    <strong className="text-white">Supported Games:</strong> All challenges and transfers apply strictly to video games officially integrated into the platform.
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 3: Result Verification */}
            <section id="results" className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-4">
              <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
                <span className="text-xl">✅</span>
                <h2 className="text-xl font-bold text-white">3. Result Verification Protocol</h2>
              </div>
              <div className="text-slate-300 text-sm sm:text-base space-y-3 leading-relaxed">
                <p>To collect winning funds automatically, both players must update match outcomes:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-2">
                  <div className="p-4 bg-emerald-950/20 border border-emerald-800/40 rounded-xl">
                    <span className="font-bold text-emerald-400 block mb-1">Winner Action</span>
                    Must navigate to the match page and mark that they have won.
                  </div>
                  <div className="p-4 bg-rose-950/20 border border-rose-800/40 rounded-xl">
                    <span className="font-bold text-rose-400 block mb-1">Loser Action</span>
                    Must navigate to the match page and mark that they have lost.
                  </div>
                </div>
              </div>
            </section>

            {/* Section 4: Disputes & Account Ban Policy */}
            <section id="disputes" className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-4">
              <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
                <span className="text-xl">⚖️</span>
                <h2 className="text-xl font-bold text-white">4. Dispute Settlement & Account Ban Policy</h2>
              </div>
              <div className="text-slate-300 text-sm sm:text-base space-y-4 leading-relaxed">
                <p>
                  If a player fails to accept defeat or submits contradictory outcomes, the match enters Dispute status. Both players must submit score screenshots and matching in-game match history logs.
                </p>

                <div className="p-4 bg-rose-950/40 border border-rose-800/50 rounded-xl space-y-2">
                  <h3 className="text-rose-300 font-bold text-sm uppercase tracking-wide">
                    Zero Tolerance for Deception & Fake Wins
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Any user who intentionally lies about winning, submits fake/edited screenshots, or attempts to deceive an opponent or admin will be <strong className="text-rose-400 font-bold">permanently banned</strong> from the platform. All locked stakes will be awarded to the honest opponent.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 5: Time Limits & 24-Hour Transfer Rules */}
            <section id="time-forfeit" className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-4">
              <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
                <span className="text-xl">⏰</span>
                <h2 className="text-xl font-bold text-white">5. Punctuality, Transfers & 24-Hour Rules</h2>
              </div>
              <div className="text-slate-300 text-sm sm:text-base space-y-4 leading-relaxed">
                <div className="space-y-2">
                  <h3 className="text-white font-semibold">Match Entrance Time Limit</h3>
                  <p className="text-sm">
                    If a player fails to enter the match lobby at the specified start time, they will be given an automatic <strong className="text-rose-400">Loss</strong>. The player who enters on time will be granted an automatic <strong className="text-emerald-400">Win</strong> and receive the payout.
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <h3 className="text-white font-semibold">Complete Transfer & Winning 24-Hour Rules</h3>
                  <p className="text-sm">
                    Complete account transfers or match winning confirmations must be finalized within **24 hours**.
                  </p>
                  <ul className="space-y-2 text-xs sm:text-sm list-disc list-inside text-slate-300">
                    <li>
                      <strong className="text-amber-400">Both Fail to Mark:</strong> If both parties fail to mark the transfer/completion within 24 hours, the funds will be **held indefinitely** until further admin investigation.
                    </li>
                    <li>
                      <strong className="text-indigo-400">Single Party Submission:</strong> If either user marks the transfer/match as "Complete" or "Not Complete", their request will be officially **heard and reviewed** within the 24-hour window.
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 6: Tournaments & Leagues */}
            <section id="tournaments" className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-4">
              <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
                <span className="text-xl">🏆</span>
                <h2 className="text-xl font-bold text-white">6. Tournaments & Leagues Rules</h2>
              </div>
              <div className="text-slate-300 text-sm sm:text-base space-y-4 leading-relaxed">
                <ul className="space-y-3 text-xs sm:text-sm text-slate-300 list-disc list-inside">
                  <li>
                    <strong className="text-white">Non-Player Hosting:</strong> Tournament and League creators are **not required to play** in the events they organize. Creators can act purely as host/organizer.
                  </li>
                  <li>
                    <strong className="text-white">Free Tournaments & Leagues:</strong> Organizers hosting free events must explicitly set the winning prize pool and state the clear method of winning/payout distribution prior to launching.
                  </li>
                  <li>
                    <strong className="text-white">Paid 1v1 Matches:</strong> Standard 1v1 challenges are never free under any circumstance.
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 7: Account Marketplace & External Communication */}
            <section id="account-trading" className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-4">
              <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
                <span className="text-xl">🛒</span>
                <h2 className="text-xl font-bold text-white">7. Marketplace, Account Selling & External Communication</h2>
              </div>
              <div className="text-slate-300 text-sm sm:text-base space-y-4 leading-relaxed">
                <p>
                  Users are allowed to buy and sell gaming accounts directly on the platform marketplace, subject to strict verification standards:
                </p>

                <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-4 space-y-3 text-xs sm:text-sm">
                  <ul className="space-y-2 list-disc list-inside text-slate-300">
                    <li>
                      <strong className="text-white">External Communication Allowed:</strong> Players and buyers/sellers are permitted to communicate **outside the app** via channels such as **Discord** or **WhatsApp** to coordinate match details or account transfer details.
                    </li>
                    <li>
                      <strong className="text-white">Listed Details & Rating Compliance:</strong> Accounts listed for sale must strictly match all listed details. Key metrics such as match rating, rank, level, or win-rate **must not fall below** what was specified in the marketplace listing.
                    </li>
                    <li>
                      <strong className="text-white">Escrow Payment Hold:</strong> When an account is purchased, buyer payment is held in escrow. If the account details or ratings are found to be false/inaccurate after transfer, **payment will NOT be released** to the seller.
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 8: Non-Cooperation Policy */}
            <section id="fairplay" className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-4">
              <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
                <span className="text-xl">⚠️</span>
                <h2 className="text-xl font-bold text-white">8. Non-Cooperation Policy</h2>
              </div>
              <div className="text-slate-300 text-sm sm:text-base space-y-3 leading-relaxed">
                <p>
                  If a user fails or refuses to cooperate during a dispute investigation, favor will be awarded automatically to the cooperating player. Non-cooperative players forfeit all claims to locked escrow funds.
                </p>
              </div>
            </section>

            {/* Footer Notice */}
            <div className="text-center py-6 border-t border-slate-800 text-slate-500 text-xs">
              <p>© APEX DUEL. All rights reserved.</p>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}