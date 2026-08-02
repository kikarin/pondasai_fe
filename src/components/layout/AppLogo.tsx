import { Link } from 'react-router-dom';
import { APP_ICON_URL, APP_NAME, APP_SUBTITLE } from '../../config/brand';

type AppLogoProps = {
  to?: string;
  showTagline?: boolean;
  size?: 'sm' | 'md' | 'lg';
  tone?: 'dark' | 'light';
  className?: string;
};

const sizeMap = {
  sm: { icon: 'w-8 h-8', title: 'text-base', tagline: 'text-[9px]' },
  md: { icon: 'w-10 h-10', title: 'text-xl', tagline: 'text-[10px]' },
  lg: { icon: 'w-12 h-12', title: 'text-2xl', tagline: 'text-xs' },
};

export function AppLogo({
  to,
  showTagline = false,
  size = 'md',
  tone = 'dark',
  className = '',
}: AppLogoProps) {
  const sizes = sizeMap[size];
  const titleColor = tone === 'light' ? 'text-ink' : 'text-white';
  const taglineColor = tone === 'light' ? 'text-ink-muted' : 'text-gray-400';

  const content = (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`${sizes.icon} rounded-xl overflow-hidden shrink-0`}>
        <img
          src={APP_ICON_URL}
          alt={`Logo ${APP_NAME}`}
          className="w-full h-full object-cover"
          width={48}
          height={48}
        />
      </div>
      <div className="min-w-0">
        <span className={`${sizes.title} font-bold tracking-tight ${titleColor} lowercase block leading-none`}>
          {APP_NAME}
        </span>
        {showTagline ? (
          <p className={`${sizes.tagline} ${taglineColor} uppercase tracking-widest font-mono font-bold mt-1 truncate`}>
            {APP_SUBTITLE}
          </p>
        ) : null}
      </div>
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="inline-flex hover:opacity-90 transition-opacity" aria-label={`${APP_NAME} beranda`}>
        {content}
      </Link>
    );
  }

  return content;
}
