// Real-time URL heuristic dissector & Shannon Entropy calculator

const SUSPICIOUS_KEYWORDS = [
  'login', 'verify', 'update', 'secure', 'account', 'banking',
  'signin', 'support', 'wallet', 'security', 'service', 'recover',
  'confirm', 'password', 'authenticate', 'appleid', 'paypal', 'netflix',
  'billing', 'validate', 'portal', 'auth'
]

const SUSPICIOUS_TLDS = [
  '.tk', '.ml', '.ga', '.cf', '.gq', '.top', '.xyz', '.work',
  '.click', '.loan', '.racing', '.surf', '.download'
]

export function calculateEntropy(str) {
  if (!str) return 0
  const len = str.length
  const freq = {}
  for (let i = 0; i < len; i++) {
    const c = str[i]
    freq[c] = (freq[c] || 0) + 1
  }

  let entropy = 0
  for (const c in freq) {
    const p = freq[c] / len
    entropy -= p * Math.log2(p)
  }
  return Math.round(entropy * 100) / 100
}

export function dissectUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return null

  let normalized = rawUrl.trim()
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = 'http://' + normalized
  }

  let parsed = null
  try {
    parsed = new URL(normalized)
  } catch {
    return {
      valid: false,
      raw: rawUrl,
      error: 'Malformed URL structure'
    }
  }

  const hostname = parsed.hostname.toLowerCase()
  const pathname = parsed.pathname
  const protocol = parsed.protocol.replace(':', '')

  // 1. IP Host detection
  const isIpHolder = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)

  // 2. Punycode detection
  const isPunycode = hostname.includes('xn--')

  // 3. At symbol in raw URL
  const hasAtSymbol = rawUrl.includes('@')

  // 4. Subdomain count
  const domainParts = hostname.split('.').filter(Boolean)
  const subdomainCount = Math.max(0, domainParts.length - 2)

  // 5. Keyword analysis
  const matchedKeywords = SUSPICIOUS_KEYWORDS.filter(kw =>
    normalized.toLowerCase().includes(kw)
  )

  // 6. Suspicious TLD check
  const matchedTld = SUSPICIOUS_TLDS.find(tld => hostname.endsWith(tld))

  // 7. Entropy calculations
  const totalEntropy = calculateEntropy(normalized)
  const pathEntropy = calculateEntropy(pathname)

  // 8. Port check
  const hasCustomPort = Boolean(parsed.port && parsed.port !== '80' && parsed.port !== '443')

  // Calculated heuristic risk level (0 to 100)
  let heuristicScore = 0
  const flags = []

  if (protocol === 'http') {
    heuristicScore += 15
    flags.push('Unencrypted protocol (HTTP)')
  }
  if (isIpHolder) {
    heuristicScore += 45
    flags.push('Raw numeric IP address used as hostname')
  }
  if (isPunycode) {
    heuristicScore += 35
    flags.push('Punycode / IDN homograph character encoding')
  }
  if (hasAtSymbol) {
    heuristicScore += 40
    flags.push('Obfuscated credentials syntax (@ symbol in URL)')
  }
  if (subdomainCount >= 3) {
    heuristicScore += 25
    flags.push(`Excessive subdomain nesting (${subdomainCount} subdomains)`)
  }
  if (matchedTld) {
    heuristicScore += 25
    flags.push(`High-abuse top-level domain (${matchedTld})`)
  }
  if (matchedKeywords.length >= 2) {
    heuristicScore += 20
    flags.push(`Multiple sensitive phishing terms: [${matchedKeywords.slice(0, 3).join(', ')}]`)
  } else if (matchedKeywords.length === 1) {
    heuristicScore += 10
    flags.push(`Suspicious phishing term detected: "${matchedKeywords[0]}"`)
  }
  if (totalEntropy > 4.4) {
    heuristicScore += 20
    flags.push(`High Shannon entropy (${totalEntropy} bits) indicates randomization`)
  }
  if (hasCustomPort) {
    heuristicScore += 15
    flags.push(`Non-standard HTTP port (${parsed.port})`)
  }

  const finalScore = Math.min(100, heuristicScore)

  return {
    valid: true,
    protocol,
    hostname,
    pathname,
    search: parsed.search,
    subdomainCount,
    isIpHolder,
    isPunycode,
    hasAtSymbol,
    hasCustomPort,
    matchedKeywords,
    matchedTld,
    totalEntropy,
    pathEntropy,
    heuristicScore: finalScore,
    flags
  }
}
