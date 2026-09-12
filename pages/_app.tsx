import type { AppProps } from 'next/app';
import '../styles/globals.css';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ActiveChallengesButton from '../components/ActiveChallengesButton';
import BottomNav from '../components/BottomNav';
import { CartProvider } from '../lib/cartContext';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <CartProvider>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header />
        <main style={{ flex: 1 }}>
          <Component {...pageProps} />
        </main>
        <Footer />
        <ActiveChallengesButton />
        <BottomNav />
      </div>
    </CartProvider>
  );
}