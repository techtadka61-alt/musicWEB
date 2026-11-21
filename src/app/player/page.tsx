import type { Metadata } from 'next';
import { PlayerView } from './player-view';

export const metadata: Metadata = { title: 'Now playing' };

export default function PlayerPage() {
  return <PlayerView />;
}
