import { Wireframe3DIcon } from '@/components/PageTransitionWrapper';

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[100] bg-white flex items-center justify-center">
      <Wireframe3DIcon size={45} />
    </div>
  );
}
