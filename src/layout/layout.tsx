import Footer from '@/components/ui/footer';
import Navbar from '@/components/ui/navbar';
import React from 'react';
import { Outlet } from 'react-router';

const Layout: React.FC = () => {
  return (
    <div className="bg-white text-gray-900 flex flex-col min-h-screen">
      <meta
        name="description"
        content="Clebson Fonseca – desenvolvedor, empresário e investidor. Descubra meus projetos e ideias em tecnologia, negócios e inovação."
      />      
      <Navbar />
      <main className=" mx-auto px-2 py-2 max-w-4xl flex-grow flex flex-col">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;