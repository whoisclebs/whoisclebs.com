import React from 'react';
import { Link, NavLink } from 'react-router';

const Navbar: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 border-b border-[#1a1a1a] bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex min-h-16 w-full max-w-[1280px] items-center justify-between gap-6 px-4 md:px-6">
        <Link to="/" className="text-xl font-extrabold tracking-[-0.04em] md:text-2xl">whoisclebs.com</Link>
        <nav className="flex flex-wrap items-center gap-4 font-mono text-xs uppercase tracking-[0.1em]" aria-label="Principal">
          <NavLink to="/" className={({isActive}) => isActive ? 'font-medium' : ''}>
            Home
          </NavLink>
          <NavLink to="/blog" className={({isActive}) => isActive ? 'font-medium' : ''}>
            Blog
          </NavLink>
          <NavLink to="/about" className={({isActive}) => isActive ? 'font-medium' : ''}>
            Sobre
          </NavLink>
          <NavLink to="/books" className={({isActive}) => isActive ? 'font-medium' : ''}>
            Livros
          </NavLink>
          <NavLink to="/portfolio" className={({isActive}) => isActive ? 'font-medium' : ''}>
            Portfolio
          </NavLink>
          {/* <a href="links.whoisclebs.com">
            Links
          </a>
          <NavLink to="/projects" className={({isActive}) => isActive ? 'font-medium' : ''}>
            Projetos
          </NavLink> */}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
