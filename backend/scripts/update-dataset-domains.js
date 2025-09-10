#!/usr/bin/env node

/**
 * Update Dataset Domains Based on Content
 * 
 * This script analyzes dataset names, descriptions, and tags to assign
 * appropriate domain categories that match our filter options.
 */

const db = require('../models');

async function updateDatasetDomains() {
  try {
    console.log('🔄 Updating dataset domains based on content analysis...');

    // Get all datasets
    const datasets = await db.Dataset.findAll({
      where: { isActive: true },
      attributes: ['id', 'name', 'description', 'tags', 'domain']
    });

    console.log(`📊 Found ${datasets.length} active datasets to analyze`);

    // Domain mapping rules based on keywords
    const domainRules = {
      'Healthcare': {
        keywords: ['medical', 'health', 'patient', 'clinical', 'pharmaceutical', 'drug', 'biomarker', 'genomic', 'proteomic', 'pharmacovigilance', 'HIPAA', 'PHI', 'EHR', 'radiology', 'DICOM', 'diagnostic', 'healthcare', 'biotech'],
        description: 'Medical, pharmaceutical, and health-related data'
      },
      'Finance': {
        keywords: ['banking', 'financial', 'credit', 'investment', 'portfolio', 'trading', 'risk', 'fraud', 'AML', 'ERISA', '401k', 'pension', 'FCRA', 'SOX', 'PCI', 'financial', 'money', 'transaction'],
        description: 'Banking, insurance, and financial services data'
      },
      'Technology': {
        keywords: ['software', 'technology', 'IT', 'analytics', 'performance', 'monitoring', 'security', 'data', 'computing', 'algorithm', 'system'],
        description: 'Software, IT, and technology sector data'
      },
      'Government': {
        keywords: ['government', 'public', 'policy', 'citizen', 'safety', 'urban', 'planning', 'regulatory', 'compliance', 'federal', 'state'],
        description: 'Government agencies and public sector data'
      },
      'Energy': {
        keywords: ['energy', 'utility', 'environmental', 'grid', 'renewable', 'power', 'electricity', 'solar', 'wind', 'climate', 'weather'],
        description: 'Energy, utilities, and environmental data'
      },
      'Education': {
        keywords: ['education', 'learning', 'student', 'academic', 'research', 'university', 'school', 'curriculum', 'teaching'],
        description: 'Educational institutions and learning data'
      },
      'Manufacturing': {
        keywords: ['manufacturing', 'industrial', 'production', 'quality', 'supply', 'chain', 'process', 'automation', 'factory', 'production'],
        description: 'Industrial, manufacturing, and supply chain data'
      },
      'Retail': {
        keywords: ['retail', 'commerce', 'consumer', 'shopping', 'customer', 'inventory', 'sales', 'marketing', 'e-commerce'],
        description: 'Consumer goods, retail, and e-commerce data'
      },
      'Transportation': {
        keywords: ['transportation', 'logistics', 'fleet', 'vehicle', 'traffic', 'route', 'mobility', 'shipping', 'delivery'],
        description: 'Transportation, logistics, and mobility data'
      },
      'Agriculture': {
        keywords: ['agriculture', 'farming', 'crop', 'food', 'agricultural', 'farming', 'crop', 'precision', 'agriculture'],
        description: 'Agricultural, food production, and farming data'
      },
      'Media': {
        keywords: ['media', 'entertainment', 'content', 'video', 'audio', 'streaming', 'broadcast', 'publishing', 'news'],
        description: 'Media, entertainment, and content creation data'
      }
    };

    let updatedCount = 0;

    for (const dataset of datasets) {
      const textToAnalyze = [
        dataset.name,
        dataset.description,
        ...(dataset.tags || [])
      ].join(' ').toLowerCase();

      let bestMatch = null;
      let maxScore = 0;

      // Score each domain based on keyword matches
      for (const [domain, rules] of Object.entries(domainRules)) {
        let score = 0;
        
        for (const keyword of rules.keywords) {
          const keywordLower = keyword.toLowerCase();
          if (textToAnalyze.includes(keywordLower)) {
            // Weight by keyword importance and frequency
            score += 1;
            if (dataset.name.toLowerCase().includes(keywordLower)) {
              score += 2; // Higher weight for name matches
            }
            if (dataset.description.toLowerCase().includes(keywordLower)) {
              score += 1.5; // Medium weight for description matches
            }
          }
        }

        if (score > maxScore) {
          maxScore = score;
          bestMatch = domain;
        }
      }

      // Only update if we found a good match (score > 0) and it's different from current
      if (bestMatch && maxScore > 0 && dataset.domain !== bestMatch) {
        await dataset.update({ domain: bestMatch });
        console.log(`✅ Updated "${dataset.name}" from "${dataset.domain}" to "${bestMatch}" (score: ${maxScore})`);
        updatedCount++;
      } else if (dataset.domain === 'Other' && !bestMatch) {
        console.log(`⚠️  No domain match found for "${dataset.name}" - keeping as "Other"`);
      } else {
        console.log(`📋 "${dataset.name}" already has appropriate domain: "${dataset.domain}"`);
      }
    }

    console.log(`🎉 Domain update completed! Updated ${updatedCount} datasets`);

    // Show final domain distribution
    const domainStats = await db.Dataset.findAll({
      where: { isActive: true },
      attributes: ['domain'],
      group: ['domain'],
      raw: true
    });

    console.log('\n📊 Final domain distribution:');
    for (const stat of domainStats) {
      const count = await db.Dataset.count({ where: { domain: stat.domain, isActive: true } });
      console.log(`  ${stat.domain}: ${count} datasets`);
    }

  } catch (error) {
    console.error('❌ Error updating dataset domains:', error);
    throw error;
  }
}

// Run the script if called directly
if (require.main === module) {
  updateDatasetDomains()
    .then(() => {
      console.log('🎉 Dataset domain update completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Dataset domain update failed:', error);
      process.exit(1);
    });
}

module.exports = { updateDatasetDomains };
