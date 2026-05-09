import { Button } from './button'

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .5a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.1c-3.3.7-4-1.4-4-1.4-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.4 1 .1-.8.4-1.3.8-1.6-2.6-.3-5.4-1.3-5.4-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.4 11.4 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.2c0 .3.2.7.8.6A12 12 0 0 0 12 .5Z" />
    </svg>
  )
}

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.35V9h3.41v1.56h.05a3.74 3.74 0 0 1 3.36-1.85c3.6 0 4.27 2.37 4.27 5.45v6.29ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13Zm1.78 13.02H3.56V9h3.56v11.45ZM22.23 0H1.77C.8 0 0 .77 0 1.72v20.56C0 23.23.8 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.72V1.72C24 .77 23.21 0 22.23 0Z" />
    </svg>
  )
}

function SubstackIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M4 3h16v2.8H4V3Zm0 5.2h16V11H4V8.2Zm0 5.2h16V21l-8-4.4L4 21v-7.6Z" />
    </svg>
  )
}

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4L15.8 12l-6.2 3.6Z" />
    </svg>
  )
}

function DribbbleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0a12 12 0 1 0 0 24 12 12 0 0 0 0-24Zm7.93 5.5a9.9 9.9 0 0 1 2.25 6.19c-.34-.07-3.7-.75-7.08-.32-.07-.17-.14-.35-.22-.52-.22-.53-.46-1.07-.71-1.59 3.75-1.53 5.45-3.68 5.76-3.76ZM12 1.83a10.12 10.12 0 0 1 6.68 2.51c-.27.39-1.8 2.44-5.32 3.76a56.2 56.2 0 0 0-3.78-5.86c.78-.26 1.6-.41 2.42-.41Zm-4.43 1.1a48.1 48.1 0 0 1 3.8 5.78c-4.62 1.23-8.64 1.18-9.08 1.17a10.2 10.2 0 0 1 5.28-6.95ZM1.82 12v-.31c.43.01 5.16.08 10.41-1.49.3.59.58 1.19.84 1.79l-.4.12c-5.42 1.75-8.3 6.5-8.54 6.91A10.14 10.14 0 0 1 1.82 12Zm10.18 10.18a10.1 10.1 0 0 1-6.5-2.36c.18-.37 2.31-4.47 8.25-6.54l.06-.02a42.3 42.3 0 0 1 2.14 7.8 10.06 10.06 0 0 1-3.95 1.12Zm5.72-2.08a43.5 43.5 0 0 0-1.95-7.28c3.18-.51 5.97.33 6.32.44a10.1 10.1 0 0 1-4.37 6.84Z" />
    </svg>
  )
}

const socialLinks = [
  { label: 'GitHub', href: 'https://github.com/whoisclebs', Icon: GithubIcon },
  { label: 'LinkedIn', href: 'https://linkedin.com/in/whoisclebs', Icon: LinkedinIcon },
  { label: 'Substack', href: 'https://whoisclebs.substack.com', Icon: SubstackIcon },
  { label: 'YouTube', href: 'https://www.youtube.com/@whoisclebs', Icon: YoutubeIcon },
  { label: 'Dribbble', href: 'https://dribbble.com/whoisclebs', Icon: DribbbleIcon },
]

export function SocialLinks({ className = '' }: { className?: string }) {
  return (
    <div className={`flex gap-2 ${className}`}>
      {socialLinks.map(({ label, href, Icon }) => (
        <Button key={label} variant="outline" size="icon" asChild>
          <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label}>
            <Icon className="h-4 w-4" />
          </a>
        </Button>
      ))}
    </div>
  )
}
