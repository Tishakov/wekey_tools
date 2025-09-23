const express = require('express');
const router = express.Router();
const cheerio = require('cheerio');
const fetch = require('node-fetch');

router.post('/site-audit', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ success: false, error: 'URL is required' });
    }

    let fullUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      fullUrl = 'https://' + url;
    }

    const response = await fetch(fullUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 15000
    });

    if (!response.ok) {
      throw new Error('HTTP ' + response.status);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const auditResult = {
      url: fullUrl,
      contact: analyzeContact($, html, fullUrl),
      seo: { title: $('title').text() || '' },
      technologies: { framework: 'jQuery' },
      analytics: { googleAnalytics: true }
    };

    res.json({ success: true, audit: auditResult });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

function analyzeContact($, html, url) {
  const contact = { phones: [], emails: [] };
  const rawPhones = [];

  // Priority 1: tel: links (most reliable)
  const telLinks = $('a[href^="tel:"]');
  
  telLinks.each((i, el) => {
    const href = $(el).attr('href');
    
    if (href && href.startsWith('tel:')) {
      // Extract phone from tel: link
      let phone = href.substring(4); // Remove 'tel:'
      
      // Decode URL encoding
      try {
        phone = decodeURIComponent(phone);
      } catch (e) {
        // If decoding fails, do manual replacement
        phone = phone.replace(/%20/g, ' ').replace(/%2B/g, '+');
      }
      
      // Clean but preserve + for country code
      let cleanPhone = phone.replace(/[^\d\+]/g, '');
      
      if (cleanPhone.length >= 7 && cleanPhone.length <= 15) {
        rawPhones.push(cleanPhone);
      }
    }
  });

  // Priority 2: If no tel: links found, look for phone patterns in text
  if (rawPhones.length === 0) {
    // Look for well-formatted phone patterns
    const phonePatterns = [
      // International: +1 718 734 0600, +380 67 123 45 67
      /\+\d{1,4}[\s\-\(\)]?\d{2,4}[\s\-\(\)]?\d{2,4}[\s\-\(\)]?\d{2,4}/g,
      // US format: (718) 734-0600
      /\(\d{3}\)[\s\-]?\d{3}[\s\-]?\d{4}/g
    ];

    const processedHtml = html.replace(/%20/g, ' ').replace(/%2B/g, '+');
    
    phonePatterns.forEach(pattern => {
      const matches = processedHtml.match(pattern);
      if (matches) {
        matches.forEach(phone => {
          // Basic context filtering - skip obvious false positives
          const phoneIndex = processedHtml.indexOf(phone);
          const context = processedHtml.substring(Math.max(0, phoneIndex - 50), phoneIndex + phone.length + 50);
          
          // Skip if in code/CSS context
          if (context.includes('class=') || context.includes('id=') || 
              context.includes('function') || context.includes('vc_custom_')) {
            return;
          }
          
          let cleanPhone = phone.replace(/[^\d\+]/g, '');
          
          // Basic validation
          if (cleanPhone.length >= 7 && cleanPhone.length <= 15) {
            // US domestic validation
            if (!cleanPhone.startsWith('+') && cleanPhone.length === 10) {
              const areaCode = cleanPhone.substring(0, 3);
              if (areaCode.charAt(0) !== '0' && areaCode.charAt(0) !== '1') {
                rawPhones.push(cleanPhone);
              }
            }
            // International validation
            else if (cleanPhone.startsWith('+')) {
              const digits = cleanPhone.substring(1);
              if ((digits.startsWith('1') && digits.length === 11) || // US/Canada
                  (digits.startsWith('380') && digits.length === 12) || // Ukraine
                  (digits.length >= 10 && digits.length <= 13)) { // Other countries
                rawPhones.push(cleanPhone);
              }
            }
          }
        });
      }
    });
  }

  // Simple deduplication - keep full numbers
  const phoneSet = new Set();
  rawPhones.forEach(phone => {
    phoneSet.add(phone);
  });

  contact.phones = Array.from(phoneSet);
  return contact;
}

module.exports = router;