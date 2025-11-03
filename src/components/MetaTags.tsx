import { Helmet } from 'react-helmet-async';
import { memo } from 'react';

interface MetaTagsProps {
  title?: string;
  description?: string;
  image?: string;
  type?: string;
  path?: string;
}

const BASE_URL = 'https://smartsentinels.net';
const DEFAULT_TITLE = 'SmartSentinels | AI';
const DEFAULT_DESCRIPTION = 'SmartSentinels delivers verifiable, low-cost AI services for businesses—from smart contract audits to intelligent assistants—while rewarding contributors with SSTL tokens. Edge-native, deflationary, and built for real impact.';
const DEFAULT_IMAGE = `${BASE_URL}/og-image.png`;

export const MetaTags = memo(({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_IMAGE,
  type = 'website',
  path = '',
}: MetaTagsProps) => {
  const url = `${BASE_URL}${path}`;
  
  // Generate structured data for the page
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": title,
    "description": description,
    "url": url,
    "image": image,
    "publisher": {
      "@type": "Organization",
      "name": "SmartSentinels",
      "logo": {
        "@type": "ImageObject",
        "url": `${BASE_URL}/ss-icon.svg`
      }
    },
    "inLanguage": "en-US",
    "isPartOf": {
      "@type": "WebSite",
      "name": "SmartSentinels",
      "url": BASE_URL
    }
  };

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="SmartSentinels" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:site" content="@SmartSentinels_" />

      {/* Additional SEO */}
      <link rel="canonical" href={url} />
      <meta name="keywords" content="SmartSentinels, AI Agents, Proof of Useful Work, SSTL tokens, smart contract audits, iNFTs, blockchain, decentralized AI, Web3" />
      
      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
});

MetaTags.displayName = 'MetaTags';