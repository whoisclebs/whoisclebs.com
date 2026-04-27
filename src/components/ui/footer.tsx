import React from 'react';
import { useI18n } from '@/lib/i18n';


const Footer: React.FC = () => {
  const { t } = useI18n()

  return (
    <footer className="border-t border-black bg-[#1a1a1a] px-4 py-12 text-white md:px-6">
      <div className="mx-auto w-full max-w-[1280px]">
        <strong className="mb-3 block text-3xl font-extrabold tracking-[-0.04em]">whoisclebs.com</strong>
        <p className="font-mono text-xs uppercase tracking-[0.06em] text-zinc-300">© 2022 - {new Date().getFullYear()} Clebson A. Fonseca. {t('footer.madeWith')}</p>
      </div>
    </footer>
  );
};

export default Footer;
