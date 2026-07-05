import Footer from '@/components/ui/footer';
import Navbar from '@/components/ui/navbar';
import React from 'react';
import { Outlet } from 'react-router';
import { useSpatialNav } from '@/lib/use-spatial-nav';

const Layout: React.FC = () => {
  useSpatialNav()
  return (
    <div className="flex min-h-screen flex-col bg-bg text-ink">
      <Navbar />
      <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col px-4 py-6 sm:px-5 sm:py-8 md:px-6 md:py-10">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
