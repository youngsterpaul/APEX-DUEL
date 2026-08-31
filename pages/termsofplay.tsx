import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Swords, 
  Trophy, 
  AlertTriangle, 
  Clock, 
  Scale, 
  CheckCircle2, 
  Lock, 
  HelpCircle,
  FileText
} from 'lucide-react';

export default function TermsAndConditions() {
  const [activeSection, setActiveSection] = useState<string>('escrow');

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
      {/* Header Banner */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Swords className="h-8 w-8 text-indigo-500" />
            <span className="text-xl font-bold tracking-wider text-white uppercase">
              Global Esport Arena
            </span>
          </div>
          <div className="flex items-center space-x-2 text-xs text-slate-400 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
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
                {[
                  { id: 'overview', label: '1. Platform Overview', icon: FileText },
                  { id: 'escrow', label: '2. Match Escrow & Payments', icon: Lock },
                  { id: 'results', label: '3. Result Verification', icon: CheckCircle2 },
                  { id: 'disputes', label: '4. Disputes & Evidence', icon: Scale },
                  { id: 'time-forfeit', label: '5. Time Limits & Forfeits', icon: Clock },
                  { id: 'tournaments', label: '6. Tournaments & Leagues', icon: Trophy },
                  { id: 'fairplay', label: '7. Non-Cooperation & Penalties', icon: AlertTriangle },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => scrollToSection(item.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        activeSection === item.id
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Main Terms Document */}
          <main className="lg:col-span-3 space-y-8">
            {/* Hero / Document Header */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="inline-flex items-center space-x-2 text-indigo-400 text-xs font-semibold uppercase tracking-widest mb-3 bg-indigo-500/10 px-3 py-1 rounded-md border border-indigo-500/20">
                Legal Binding Terms
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Terms of Service & Competitive Rules
              </h1>
              <p className="mt-3 text-slate-400 text-sm sm:text-base leading-relaxed">
                Last updated: August 31, 2026. Please read these terms carefully before participating in any 1v1 matches, tournaments, or leagues hosted on our platform.
              </p>
            </div>

            {/* Section 1: Platform Overview */}
            <section id="overview" className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-4">
              <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
                <FileText className="h-6 w-6 text-indigo-400" />
                <h2 className="text-xl font-bold text-white">1. Platform Overview</h2>
              </div>
              <div className="text-slate-300 text-sm sm:text-base space-y-3 leading-relaxed">
                <p>
                  Our platform provides an automated global competitive ecosystem enabling gamers to create and join 1v1 matches, user-created tournaments, and long-term leagues across any video game title.
                </p>
                <p>
                  By creating an account or joining any match, you agree to abide by these Terms and Conditions. All competitive match stakes are processed through automated smart contracts or automated wallet escrows to guarantee fraud-free payouts.
                </p>
              </div>
            </section>

            {/* Section 2: Match Escrow & Payments */}
            <section id="escrow" className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-4">
              <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
                <Lock className="h-6 w-6 text-indigo-400" />
                <h2 className="text-xl font-bold text-white">2. Match Escrow & Automated Payouts</h2>
              </div>
              <div className="text-slate-300 text-sm sm:text-base space-y-4 leading-relaxed">
                <div className="p-4 bg-indigo-950/40 border border-indigo-800/50 rounded-xl">
                  <h3 className="text-indigo-300 font-semibold mb-1 text-sm uppercase tracking-wide">
                    Smart Escrow Guarantee
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300">
                    To eliminate unpaid prize disputes, match entry fees are locked into a secure escrow system before the match begins. Funds cannot be withdrawn or cancelled by either party while a match is active.
                  </p>
                </div>

                <ul className="space-y-3 list-disc list-inside text-slate-300">
                  <li>
                    <strong className="text-white">1v1 Matches (Paid Only):</strong> All 1v1 Head-to-Head matches require both players to lock in an agreed stake prior to match initialization. Free 1v1 matches are strictly prohibited.
                  </li>
                  <li>
                    <strong className="text-white">Escrow Release:</strong> Upon mutual agreement of match results (Winner marks "Win", Loser marks "Loss"), funds are instantly released from the escrow directly to the winner's wallet without platform delay.
                  </li>
                  <li>
                    <strong className="text-white">Zero Non-Payment Guarantee:</strong> Once escrow is locked, no player can revoke funds, dispute legitimate losses without valid proof, or withhold prize payout.
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 3: Result Verification */}
            <section id="results" className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-4">
              <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
                <CheckCircle2 className="h-6 w-6 text-indigo-400" />
                <h2 className="text-xl font-bold text-white">3. Result Verification Protocol</h2>
              </div>
              <div className="text-slate-300 text-sm sm:text-base space-y-3 leading-relaxed">
                <p>To ensure fair and instant payouts, players must report results promptly upon match conclusion:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-2">
                  <div className="p-4 bg-emerald-950/20 border border-emerald-800/40 rounded-xl">
                    <span className="font-bold text-emerald-400 block mb-1">Winner Responsibility</span>
                    Must navigate to the match dashboard and submit a <span className="text-white font-semibold">"Claim Victory"</span> submission immediately after the game.
                  </div>
                  <div className="p-4 bg-rose-950/20 border border-rose-800/40 rounded-xl">
                    <span className="font-bold text-rose-400 block mb-1">Loser Responsibility</span>
                    Must navigate to the match dashboard and submit a <span className="text-white font-semibold">"Confirm Defeat"</span> submission within the reporting window.
                  </div>
                </div>
                <p className="text-xs text-slate-400">
                  * Dynamic auto-payout triggers instantly as soon as both status submissions match.
                </p>
              </div>
            </section>

            {/* Section 4: Disputes & Evidence */}
            <section id="disputes" className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-4">
              <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
                <Scale className="h-6 w-6 text-indigo-400" />
                <h2 className="text-xl font-bold text-white">4. Dispute Resolution & Evidence Submission</h2>
              </div>
              <div className="text-slate-300 text-sm sm:text-base space-y-4 leading-relaxed">
                <p>
                  If a player fails or refuses to accept defeat, or if contradictory results are reported, the match status converts to <span className="text-amber-400 font-bold">"Disputed"</span>. Escrowed funds remain securely locked until resolution.
                </p>

                <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-4 space-y-3">
                  <h3 className="font-semibold text-white text-sm">Required Evidence Standards:</h3>
                  <p className="text-xs text-slate-400">
                    In the event of a dispute, participating players must upload verifiable media evidence containing:
                  </p>
                  <ul className="space-y-2 text-xs sm:text-sm text-slate-300 list-disc list-inside">
                    <li>Unedited full-screen screenshots displaying final match score, gamertags/PSN/Steam IDs, and match ID.</li>
                    <li>In-game match history logs clearly showing match outcome and timestamp.</li>
                    <li>Video recordings (Twitch Clips, YouTube Unlisted, screen captures) demonstrating continuous gameplay if score screens are insufficient.</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 5: Time Limits & Forfeits */}
            <section id="time-forfeit" className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-4">
              <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
                <Clock className="h-6 w-6 text-indigo-400" />
                <h2 className="text-xl font-bold text-white">5. Time Limits, Auto-Wins & 24-Hour Resolution</h2>
              </div>
              <div className="text-slate-300 text-sm sm:text-base space-y-4 leading-relaxed">
                <div className="space-y-3">
                  <h3 className="text-white font-semibold">A. Scheduled Match Entrance (Punctuality Rules)</h3>
                  <p className="text-sm">
                    Players are provided a strict match lobby grace period. If a player fails to enter the match lobby within the designated start window, they will receive an automatic <strong className="text-rose-400">Forfeit Loss</strong>. The player who logged into the lobby on time will be awarded an automatic <strong className="text-emerald-400">Default Win</strong> and full escrow payout.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <h3 className="text-white font-semibold">B. Unresponsive Opponent (24-Hour Claim Rule)</h3>
                  <p className="text-sm">
                    If Player A claims a victory or loss confirmation request, and Player B fails to confirm, dispute, or provide valid evidence within <strong className="text-indigo-400">24 hours</strong>, the platform system will automatically grant Player A’s claim in full. Escrow funds will be settled immediately.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 6: Tournaments & Leagues */}
            <section id="tournaments" className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-4">
              <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
                <Trophy className="h-6 w-6 text-indigo-400" />
                <h2 className="text-xl font-bold text-white">6. Tournaments & Leagues Rules</h2>
              </div>
              <div className="text-slate-300 text-sm sm:text-base space-y-4 leading-relaxed">
                <p>
                  Platform members can host global multiplayer Tournaments and multi-week Leagues. Unlike 1v1 matches, Tournaments and Leagues offer flexible pricing configurations:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 block mb-1">
                      Free-to-Enter Events
                    </span>
                    <p className="text-xs sm:text-sm text-slate-300">
                      Organizers can host Free Tournaments or Leagues. However, the creator **must establish a guaranteed winning prize pool** and explicitly define the winning distribution method prior to tournament publication.
                    </p>
                  </div>

                  <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
                    <span className="text-xs font-bold uppercase tracking-wider text-rose-400 block mb-1">
                      1v1 Match Restrictions
                    </span>
                    <p className="text-xs sm:text-sm text-slate-300">
                      Standard 1v1 Head-to-Head challenges **cannot be created for free**. All 1v1 matches require locked stakes to prevent lobby spamming and fake result submissions.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 7: Non-Cooperation & Penalties */}
            <section id="fairplay" className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-4">
              <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
                <AlertTriangle className="h-6 w-6 text-indigo-400" />
                <h2 className="text-xl font-bold text-white">7. Non-Cooperation Policy & Fair Play</h2>
              </div>
              <div className="text-slate-300 text-sm sm:text-base space-y-3 leading-relaxed">
                <p>
                  Our dispute framework operates on a strict cooperation policy. Users who actively communicate, adhere to deadlines, and upload clean evidence will be prioritized during arbitration.
                </p>
                <div className="p-4 bg-rose-950/30 border border-rose-800/40 rounded-xl text-xs sm:text-sm text-rose-200">
                  <strong>Non-Cooperation Clause:</strong> Any player who refuses to submit required game screenshots, ignores dispute tickets, attempts extortion, or provides falsified proof will lose favor entirely during review. The dispute will automatically be settled in favor of the cooperating opponent, and the non-cooperative user may face permanent account suspension.
                </div>
              </div>
            </section>

            {/* Footer Notice */}
            <div className="text-center py-6 border-t border-slate-800 text-slate-500 text-xs">
              <p>© 2026 Competitive Gaming Platform Inc. All rights reserved.</p>
              <p className="mt-1">
                Automated Escrow Protocol v4.2 | Guaranteed Trustless Competition
              </p>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}