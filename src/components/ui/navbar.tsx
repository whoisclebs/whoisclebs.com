import React from 'react';
import { Link, NavLink } from 'react-router';

const Navbar: React.FC = () => {
  return (
    <header className="border-b border-gray-100">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center max-w-4xl">
        <Link to="/" className="text-xl font-medium">WC</Link>
        <nav className="flex items-center gap-6">
          <NavLink to="/" className={({isActive}) => isActive ? 'font-medium' : ''}>
            Home
          </NavLink>
          <NavLink to="/about" className={({isActive}) => isActive ? 'font-medium' : ''}>
            Sobre
          </NavLink>
          <NavLink to="/books" className={({isActive}) => isActive ? 'font-medium' : ''}>
            Livros
          </NavLink>
          <a href="links.whoisclebs.com">
            Links
          </a>
          <NavLink to="/projects" className={({isActive}) => isActive ? 'font-medium' : ''}>
            Projetos
          </NavLink>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;