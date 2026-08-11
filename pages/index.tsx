import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import { supabase } from '../lib/supabaseClient';
import type { Player, Duel } from '../lib/types';
import Hero from '../components/Hero';
import Leaderboard from '../components/Leaderboard';
import UpcomingDuels from '../components/UpcomingDuels';

interface HomeProps {
  players: Player[];
  duels: Duel[];
}

export default function Home({ players, duels }: HomeProps) {
  return (
    <>
      <Head>
        <title>Apex Duel — Ranked 1v1 Arena</title>
        <meta name="description" content="Challenge rivals, track wins, climb the leaderboard." />
      </Head>
      <Hero />
      <Leaderboard players={players} />
      <UpcomingDuels duels={duels} />
    </>
  );
}

export const getServerSideProps: GetServerSideProps<HomeProps> = async () => {
  const { data: players } = await supabase
    .from('players')
    .select('*')
    .order('wins', { ascending: false });

  const { data: duels } = await supabase
    .from('duels')
    .select('*, player1:player1_id(username), player2:player2_id(username)')
    .eq('status', 'scheduled')
    .order('scheduled_at', { ascending: true });

  return {
    props: {
      players: (players as Player[]) || [],
      duels: (duels as unknown as Duel[]) || [],
    },
  };
};