export default function StructuredData() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Digital Utopia',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web',
    description: 'Digital Utopia is a secure crypto trading platform offering seamless trading experiences with real-time market data and advanced trading tools.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    author: {
      '@type': 'Organization',
      name: 'Digital Utopia',
      url: 'https://digitalutopia.app',
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
} 