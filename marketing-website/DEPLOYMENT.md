# Marketing Website Deployment Guide

## Overview
The ContractFlow Pro marketing website is deployed on Vercel with a custom domain.

## URLs
- **Production**: https://responsible-ai.dpi-apps.space
- **Vercel URL**: https://contractflow-pro-marketing-aar1ymoms.vercel.app
- **Dashboard**: https://vercel.com/joshimukesh078-gmailcoms-projects/contractflow-pro-marketing

## Quick Deployment
```bash
cd marketing-website
./deploy.sh
```

## Manual Deployment
```bash
cd marketing-website
vercel --prod --yes
```

## Adding Custom Domains
```bash
vercel domains add your-domain.com
```

## File Structure
```
marketing-website/
├── index.html          # Main website
├── styles.css          # Custom styling
├── script.js           # Interactive features
├── vercel.json         # Vercel configuration
├── package.json        # Project configuration
├── deploy.sh           # Deployment script
└── README.md           # Website documentation
```

## Configuration
The website uses:
- **Framework**: Static HTML/CSS/JS
- **Hosting**: Vercel
- **Domain**: responsible-ai.dpi-apps.space
- **SSL**: Automatic (provided by Vercel)
- **CDN**: Global Vercel CDN

## Features
- ✅ Responsive design
- ✅ Modern animations
- ✅ Contact form
- ✅ SEO optimized
- ✅ Security headers
- ✅ Fast loading
- ✅ Mobile friendly

## Updates
To update the website:
1. Edit files in `marketing-website/`
2. Run `./deploy.sh`
3. Changes are live within 30 seconds

## Monitoring
- **Performance**: Vercel Analytics
- **Uptime**: Vercel Status
- **Errors**: Vercel Function Logs

## Security
- HTTPS enforced
- Security headers configured
- XSS protection enabled
- Content type sniffing disabled 