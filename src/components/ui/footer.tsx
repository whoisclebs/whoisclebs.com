import React from 'react';
import { Link } from 'react-router';
import { useI18n } from '@/lib/i18n';
import { useLocalizedPath } from '@/lib/use-localized-path';

const Footer: React.FC = () => {
  const { t } = useI18n()
  const localizedPath = useLocalizedPath()

  return (
    <footer className="border-t border-line bg-graphite px-4 py-12 text-bg md:px-6">
      <div className="mx-auto w-full max-w-[1280px]">
        <strong className="mb-3 block text-2xl font-extrabold tracking-[-0.04em] sm:text-3xl">Clebson Augusto</strong>
        <div className="mb-4 flex flex-wrap gap-3 font-mono text-xs uppercase tracking-[0.06em] text-soft">
          <Link className="transition-colors hover:text-accent hover:underline hover:underline-offset-4" to={localizedPath('/privacy-policy')} data-nav-item>{t('footer.privacy')}</Link>
          <span aria-hidden="true">/</span>
          <Link className="transition-colors hover:text-accent hover:underline hover:underline-offset-4" to={localizedPath('/terms-of-use')} data-nav-item>{t('footer.terms')}</Link>
        </div>
        <p className="font-mono text-xs uppercase tracking-[0.06em] text-soft">© 2022 - {new Date().getFullYear()} Clebson A. Fonseca. {t('footer.madeWith')}</p>
      </div>
    </footer>
  );
};

export default Footer;
