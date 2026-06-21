import { Outlet } from 'react-router';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

export function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex flex-col w-full mx-auto max-w-5xl pt-4 pb-4">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}
