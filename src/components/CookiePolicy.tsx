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
      <CookieBanner
        title="Cookie Preferences"
        description="We use cookies to enhance your experience and analyze our traffic. By using this website, you agree to our Privacy Policy, Terms, and Disclaimer."
        rejectButtonText="Reject All"
        acceptButtonText="Accept All"
        customizeButtonText="Customize"
      />
      <ConsentManagerDialog />
      {children}
    </ConsentManagerProvider>
  );
}

export default C15TCookieProvider;