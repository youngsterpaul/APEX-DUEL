// components/BottomNav.tsx
import Link from 'next/link';
import { useRouter } from 'next/router';

interface BottomNavProps {
  user?: any;
}

export default function BottomNav({ user }: BottomNavProps) {
  const router = useRouter();

  const isActive = (path: string) => router.pathname === path;

  return (
    <div className="mobile-bottom-nav">
      <Link 
        href="/active" 
        className={`nav-item ${isActive('/active') ? 'active' : ''}`}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
        </svg>
        <span>Active</span>
      </Link>

      <Link 
        href="/profile" 
        className={`nav-item ${isActive('/profile') ? 'active' : ''}`}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
        <span>Profile</span>
      </Link>

      <style jsx>{`
        .mobile-bottom-nav {
          display: none;
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 60px;
          background: #0f1120;
          border-top: 1px solid var(--panel-border, rgba(255, 255, 255, 0.1));
          z-index: 99999; /* Higher z-index to stay above other fixed elements */
          justify-content: space-around;
          align-items: center;
          padding-bottom: env(safe-area-inset-bottom);
        }

        .nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          color: #8a8d9b;
          text-decoration: none;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          flex: 1;
          height: 100%;
          transition: color 0.2s ease;
        }

        .nav-item.active {
          color: var(--red, #ff3e3e);
        }

        @media (max-width: 768px) {
          .mobile-bottom-nav {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
}