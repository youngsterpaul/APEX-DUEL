import Link from 'next/link';
import { useRouter } from 'next/router';

export default function BottomNav() {
  const router = useRouter();

  const isActive = (path: string) => router.pathname === path;

  return (
    <nav className="mobile-bottom-nav">
      {/* Home */}
      <Link href="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
        <span>Home</span>
      </Link>

      {/* My Active */}
      <Link href="/active" className={`nav-link ${isActive('/active') ? 'active' : ''}`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
        </svg>
        <span>My Active</span>
      </Link>

      {/* Profile */}
      <Link href="/profile" className={`nav-link ${isActive('/profile') ? 'active' : ''}`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
        <span>Profile</span>
      </Link>

      <style jsx>{`
        .mobile-bottom-nav {
          display: none;
          position: fixed;
          bottom: 16px;
          left: 16px;
          right: 16px;
          height: 60px;
          background: var(--panel, #14172a);
          border: 1px solid var(--panel-border, #23273f);
          border-radius: 20px;
          z-index: 99999;
          align-items: center;
          justify-content: space-around;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7), 0 0 20px rgba(41, 231, 205, 0.08);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }

        :global(.nav-link) {
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 3px !important;
          color: var(--muted, #7d82a6) !important;
          text-decoration: none !important;
          font-family: 'Rajdhani', sans-serif !important;
          font-size: 11px !important;
          font-weight: 700 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.04em !important;
          flex: 1 !important;
          height: 100% !important;
          transition: all 0.2s ease !important;
        }

        :global(.nav-link.active) {
          color: var(--red, #ff3b5c) !important;
        }

        :global(.nav-link.active svg) {
          stroke: var(--red, #ff3b5c) !important;
          filter: drop-shadow(0 0 8px rgba(255, 59, 92, 0.5));
        }

        @media (max-width: 768px) {
          .mobile-bottom-nav {
            display: flex !important;
          }
        }
      `}</style>
    </nav>
  );
}