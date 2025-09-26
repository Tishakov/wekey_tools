const express = require('express');
const router = express.Router();
const GoogleSearchConsoleService = require('../services/GoogleSearchConsoleService');

// Инициализация GSC сервиса
const gscService = new GoogleSearchConsoleService();

// OAuth авторизация для GSC
router.get('/seo-audit-pro/auth', async (req, res) => {
  try {
    const authUrl = gscService.generateAuthUrl();
    res.json({
      success: true,
      authUrl: authUrl
    });
  } catch (error) {
    console.error('GSC Auth URL generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate authorization URL'
    });
  }
});

// API endpoint для получения токенов по коду
router.post('/seo-audit-pro/exchange-token', async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Authorization code is required'
      });
    }

    const tokens = await gscService.getTokensFromCode(code);
    
    res.json({
      success: true,
      tokens: tokens,
      message: 'Successfully connected to Google Search Console'
    });
  } catch (error) {
    console.error('GSC token exchange error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to exchange code for tokens'
    });
  }
});

// Получение списка сайтов с токенами
router.post('/seo-audit-pro/sites', async (req, res) => {
  try {
    const { tokens } = req.body;

    if (!tokens) {
      return res.status(400).json({
        success: false,
        error: 'Access tokens are required'
      });
    }

    gscService.setCredentials(tokens);
    const sites = await gscService.getSites();

    res.json({
      success: true,
      sites: sites
    });
  } catch (error) {
    console.error('GSC Sites fetch error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sites from Google Search Console: ' + error.message
    });
  }
});

// SEO Audit PRO анализ - только реальные данные GSC
router.post('/seo-audit-pro/analyze', async (req, res) => {
  try {
    const { website, tokens, period = 28 } = req.body;

    if (!website) {
      return res.status(400).json({
        success: false,
        error: 'Website URL is required'
      });
    }

    if (!tokens) {
      return res.status(400).json({
        success: false,
        error: 'Google Search Console authorization required. Please connect your GSC account first.'
      });
    }

    try {
      console.log(`🔍 Analyzing GSC data for: ${website} (period: ${period} days)`);
      const analysis = await gscService.analyzeSite(website, tokens, period);
      
      return res.json({
        success: true,
        analysis: analysis,
        source: 'real_gsc_data'
      });
    } catch (gscError) {
      console.error('GSC analysis failed:', gscError);
      return res.status(500).json({
        success: false,
        error: 'Failed to analyze GSC data: ' + gscError.message,
        details: gscError.toString()
      });
    }

  } catch (error) {
    console.error('SEO Audit PRO error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;