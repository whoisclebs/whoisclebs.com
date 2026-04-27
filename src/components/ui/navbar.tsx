import React from 'react';
import { Link, NavLink } from 'react-router';
import { Menu, X } from 'lucide-react';

const navigationItems = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'Sobre' },
  { to: '/blog', label: 'Blog' },
  { to: '/til', label: 'TIL' },
  { to: '/portfolio', label: 'Portfolio' },
  { to: '/hobbies', label: 'Hobbies' },
  { to: '/books', label: 'Livros' },
]

const Navbar: React.FC = () => {
  const [open, setOpen] = React.useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-[#1a1a1a] bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex min-h-16 w-full max-w-[1280px] items-center justify-between gap-6 px-4 md:px-6">
        <Link to="/" className="text-xl font-extrabold tracking-[-0.04em] md:text-2xl">whoisclebs.com</Link>
        <button
          type="button"
          className="inline-flex size-10 items-center justify-center border border-[#1a1a1a] md:hidden"
          aria-label={open ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
        >
          {open ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
        </button>
        <nav className="hidden flex-wrap items-center gap-4 font-mono text-xs uppercase tracking-[0.1em] md:flex" aria-label="Principal">
          {navigationItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={({isActive}) => isActive ? 'font-medium' : ''}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
      {open && (
        <nav className="border-t border-[#1a1a1a] bg-white px-4 py-4 font-mono text-xs uppercase tracking-[0.1em] md:hidden" aria-label="Principal mobile">
          <div className="mx-auto grid w-full max-w-[1280px] gap-4">
            {navigationItems.map((item) => (
              <NavLink key={item.to} to={item.to} onClick={() => setOpen(false)} className={({isActive}) => isActive ? 'font-medium' : ''}>
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
};

export default Navbar;
