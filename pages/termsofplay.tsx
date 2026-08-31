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
    { id: 'escrow', label: '2. Match Escrow & Payments', icon: '🔒' },
    { id: 'results', label: '3. Result Verification', icon: '✅' },
    { id: 'disputes', label: '4. Disputes & Evidence', icon: '⚖️' },
    { id: 'time-forfeit', label: '5. Time Limits & Forfeits', icon: '⏰' },
    { id: 'tournaments', label: '6. Tournaments & Leagues', icon: '🏆' },
    { id: 'fairplay', label: '7. Non-Cooperation & Penalties', icon: '⚠️' },
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
            {/* Hero Header */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 relative overflow-hidden">
              <div className="inline-flex items-center space-x-2 text-indigo-400 text-xs font-semibold uppercase tracking-widest mb-3 bg-indigo-500/10 px-3 py-1 rounded-md border border-indigo-500/20">
                Legal Binding Terms
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Terms of Service & Competitive Rules
              </h1>
              <p className="mt-3 text-slate-400 text-sm sm:text-base leading-relaxed">
                Please read these terms carefully before participating in any 1v1 matches, tournaments, or leagues hosted on APEX DUEL.
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
                  Our platform provides an automated global competitive ecosystem enabling gamers to create and join 1v1 matches, user-created tournaments, and long-term leagues across any video game title worldwide.
                </p>
                <p>
                  By creating an account or joining any match, you agree to abide by these Terms and Conditions. All competitive match stakes are locked using automated smart contracts/escrow to guarantee dispute-free payouts.
                </p>
              </div>
            </section>

            {/* Section 2: Match Escrow & Payments */}
            <section id="escrow" className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-4">
              <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
                <span className="text-xl">🔒</span>
                <h2 className="text-xl font-bold text-white">2. Match Escrow & Automated Payouts</h2>
              </div>
              <div className="text-slate-300 text-sm sm:text-base space-y-4 leading-relaxed">
                <div className="p-4 bg-indigo-950/40 border border-indigo-800/50 rounded-xl">
                  <h3 className="text-indigo-300 font-semibold mb-1 text-sm uppercase tracking-wide">
                    Smart Escrow Protection
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300">
                    To avoid lies and theft of prizes, entry stakes are held in smart escrow before the match begins. Funds cannot be withdrawn or cancelled by either player during an active match.
                  </p>
                </div>

                <ul className="space-y-3 list-disc list-inside text-slate-300">
                  <li>
                    <strong className="text-white">1v1 Matches (Paid Only):</strong> All 1v1 head-to-head matches require players to set monetary stakes. 1v1 matches are strictly not free.
                  </li>
                  <li>
                    <strong className="text-white">Escrow Release:</strong> Upon mutual confirmation (Winner marks "Win", Loser marks "Loss"), funds automatically transfer to the winner without delay.
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
                    Must mark that they have won the game.
                  </div>
                  <div className="p-4 bg-rose-950/20 border border-rose-800/40 rounded-xl">
                    <span className="font-bold text-rose-400 block mb-1">Loser Action</span>
                    Must mark that they have lost the game.
                  </div>
                </div>
              </div>
            </section>

            {/* Section 4: Disputes & Evidence */}
            <section id="disputes" className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-4">
              <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
                <span className="text-xl">⚖️</span>
                <h2 className="text-xl font-bold text-white">4. Dispute Settlement & Required Evidence</h2>
              </div>
              <div className="text-slate-300 text-sm sm:text-base space-y-4 leading-relaxed">
                <p>
                  If a player fails to accept defeat, the match enters Dispute status.
                </p>
                <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-4 space-y-3">
                  <h3 className="font-semibold text-white text-sm">Required Evidence Standards:</h3>
                  <p className="text-xs text-slate-400">
                    Both players must provide screenshots showing:
                  </p>
                  <ul className="space-y-2 text-xs sm:text-sm text-slate-300 list-disc list-inside">
                    <li>Final score screenshot.</li>
                    <li>In-game match history matching the game details.</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 5: Time Limits & Forfeits */}
            <section id="time-forfeit" className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-4">
              <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
                <span className="text-xl">⏰</span>
                <h2 className="text-xl font-bold text-white">5. Punctuality & 24-Hour Resolution</h2>
              </div>
              <div className="text-slate-300 text-sm sm:text-base space-y-4 leading-relaxed">
                <div className="space-y-2">
                  <h3 className="text-white font-semibold">Match Entrance Time Limit</h3>
                  <p className="text-sm">
                    If a player fails to enter the match at the specified start time, they will be given an automatic <strong className="text-rose-400">Loss</strong>. The player who enters on time will be granted the <strong className="text-emerald-400">Win</strong>.
                  </p>
                </div>
                <div className="space-y-2 pt-2">
                  <h3 className="text-white font-semibold">24-Hour Auto-Grant Rule</h3>
                  <p className="text-sm">
                    If one user fails to prove win/loss or fails to respond, the opposing player's win or loss request will be automatically granted within <strong className="text-indigo-400">24 hours</strong>.
                  </p>
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
                <p>
                  Users can create tournaments and leagues on the platform.
                </p>
                <ul className="space-y-2 text-xs sm:text-sm text-slate-300 list-disc list-inside">
                  <li>For free tournaments or leagues, the creator must set the winning prize pool and method of winning.</li>
                  <li>1v1 matches are not free under any circumstance.</li>
                </ul>
              </div>
            </section>

            {/* Section 7: Non-Cooperation Policy */}
            <section id="fairplay" className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-4">
              <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
                <span className="text-xl">⚠️</span>
                <h2 className="text-xl font-bold text-white">7. Non-Cooperation Policy</h2>
              </div>
              <div className="text-slate-300 text-sm sm:text-base space-y-3 leading-relaxed">
                <p>
                  If a user fails or refuses to cooperate during a dispute, favor will be given to the player who cooperates. The non-cooperative player forfeits their claim to the escrowed funds.
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