import { GameContainer } from '@/components/GameContainer';
import { UIOverlay } from '@/components/UIOverlay';

export default function Home() {
  return (
    <main className="w-screen h-screen overflow-hidden bg-black relative">
      <GameContainer />
      <UIOverlay />
    </main>
  );
}
