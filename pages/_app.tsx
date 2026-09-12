import Link from 'next/link';
import { useRouter } from 'next/router';

export default function BottomNav() {
  const router = useRouter();

  const isActive = (path: string) => router.pathname === path;

  return (
    <nav className="mobile-bottom-bar">
      <Link href="/active" className={`nav-link ${isActive('/active') ? 'active' : ''}`}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
        </svg>
        <span>Active</span>
      </Link>

      <Link href="/profile" className={`nav-link ${isActive('/profile') ? 'active' : ''}`}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
        <span>Profile</span>
      </Link>

      <style jsx>{`
        .mobile-bottom-bar {
          display: none;
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 64px;
          background: #0f1120;
          border-top: 1px solid var(--panel-border, rgba(255, 255, 255, 0.12));
          z-index: 99999;
          align-items: center;
          justify-content: space-around;
          padding-bottom: env(safe-area-inset-bottom);
          box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.5);
        }

        :global(.nav-link) {
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 4px !important;
          color: #8a8d9b !important;
          text-decoration: none !important;
          font-size: 11px !important;
          font-weight: 700 !important;
          text-transform: uppercase !important;
          flex: 1 !important;
          height: 100% !important;
          transition: color 0.15s ease !important;
        }

        :global(.nav-link.active) {
          color: var(--red, #ff3e3e) !important;
        }

        :global(.nav-link svg) {
          color: inherit !important;
        }

        @media (max-width: 768px) {
          .mobile-bottom-bar {
            display: flex !important;
          }
        }
      `}</style>
    </nav>
  );
}