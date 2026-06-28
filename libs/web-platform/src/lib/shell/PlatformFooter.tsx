import { Link } from 'react-router';
import type { PlatformFooterLink, PlatformFooterSection } from './types';

export interface PlatformFooterProps {
  links?: PlatformFooterLink[];
  sections?: PlatformFooterSection[];
  text: string;
}

export function PlatformFooter({
  links = [],
  sections = [],
  text,
}: PlatformFooterProps) {
  const hasSections = sections.length > 0;
  const hasLinks = links.length > 0;

  return (
    <footer className="footer footer-center bg-base-100 p-4 text-base-content shadow-inner">
      <div className="flex flex-col items-center gap-2">
        <p>{text}</p>

        {hasSections ? (
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            {sections.map((section) => (
              <div
                className="flex flex-col items-center gap-2"
                key={section.title ?? text}
              >
                {section.title !== undefined ? (
                  <p className="font-medium">{section.title}</p>
                ) : null}
                <div className="flex flex-wrap justify-center gap-3">
                  {section.links.map((link) => (
                    <FooterLinkItem
                      key={`${section.title ?? 'section'}-${link.to}`}
                      link={link}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {!hasSections && hasLinks ? (
          <div className="flex flex-wrap justify-center gap-3 text-sm">
            {links.map((link) => (
              <FooterLinkItem key={link.to} link={link} />
            ))}
          </div>
        ) : null}
      </div>
    </footer>
  );
}

function FooterLinkItem({ link }: { link: PlatformFooterLink }) {
  if (link.external) {
    return (
      <a
        className="link link-hover"
        href={link.to}
        rel="noreferrer"
        target="_blank"
      >
        {link.label}
      </a>
    );
  }

  return (
    <Link className="link link-hover" to={link.to}>
      {link.label}
    </Link>
  );
}
