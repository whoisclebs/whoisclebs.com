import React from 'react';


const Footer: React.FC = () => {
  return (
    <footer className="py-6 border-t border-gray-100">
      <div className="blog-container text-center text-sm text-gray-500">
        © {new Date().getFullYear()} WhoIsClebs. Feito com ❤️ e Vite.
      </div>
    </footer>
  );
};

export default Footer;