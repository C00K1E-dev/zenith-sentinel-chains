import { CookieBanner, ConsentManagerProvider, ConsentManagerDialog } from '@c15t/react';
import '../styles/cookieOverrides.css';

export function C15TCookieProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConsentManagerProvider
      options={{
        mode: 'offline',
        ignoreGeoLocation: true,
        consentCategories: ['necessary', 'marketing'],
        react: {
          colorScheme: 'dark',
          disableAnimation: false,
        },
      }}
    >
      <div 
        className="c15t-container"
        style={{
          '--button-primary': 'hsl(220 90% 56%)',
          '--button-primary-dark': 'hsl(220 90% 56%)',
          '--button-primary-hover': 'rgba(99, 179, 237, 0.1)',
          '--button-primary-hover-dark': 'rgba(99, 179, 237, 0.1)',
          '--button-focus-ring': 'hsl(220 90% 56%)',
          '--button-focus-ring-dark': 'hsl(220 90% 56%)',
          '--dialog-branding-focus-color': 'hsl(220 90% 56%)',
          '--dialog-branding-focus-color-dark': 'hsl(220 90% 56%)',
          '--switch-thumb-background-color': 'hsl(220 90% 56%)',
          '--switch-thumb-background-color-dark': 'hsl(220 90% 56%)',
          '--switch-background-color-checked': 'hsl(220 90% 56%)',
          '--switch-background-color-checked-dark': 'hsl(220 90% 56%)',
        } as React.CSSProperties}
      >
        <CookieBanner
          title="Cookie Preferences"
          description={
            <div>
              We use cookies to enhance your experience and analyze our traffic. By using this website, you agree to our{' '}
              <a
                href="/documents/Privacy Policy.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="c15t-link"
              >
                Privacy Policy
              </a>
              , {' '}
              <a
                href="/documents/Terms and Conditions.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="c15t-link"
              >
                Terms
              </a>
              , and{' '}
              <a
                href="/documents/Disclaimer.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="c15t-link"
              >
                Disclaimer
              </a>
              .
            </div>
          }
          rejectButtonText="Reject All"
          acceptButtonText="Accept All"
          customizeButtonText="Customize"
        />
        <ConsentManagerDialog />
      </div>
      {children}
    </ConsentManagerProvider>
  );
}

export default C15TCookieProvider;