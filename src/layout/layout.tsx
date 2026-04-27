import Footer from '@/components/ui/footer';
import Navbar from '@/components/ui/navbar';
import React from 'react';
import { Outlet } from 'react-router';

const Layout: React.FC = () => {
  return (
    <div className="flex min-h-screen flex-col bg-white text-[#1a1a1a]">
      <Navbar />
      <main className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col px-4 py-8 md:px-6 md:py-10">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
