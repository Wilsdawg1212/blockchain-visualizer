// app/page.tsx
import LiveBlocks from '@/app/components/LiveBlocks';
import Info from '@/app/components/Info/Info';

export const metadata = {
  title: 'Base Viz',
  description: 'Visualization of L2 Chain Base',
};

export default function Page() {
  return (
    <>
      <LiveBlocks />
      <Info />
    </>
  );
}
