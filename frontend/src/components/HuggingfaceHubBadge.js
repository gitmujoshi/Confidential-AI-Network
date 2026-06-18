import React from 'react';
import { Chip, Link, Tooltip } from '@mui/material';
import HubIcon from '@mui/icons-material/Hub';
import { huggingfaceBadgeLabel, huggingfaceHubUrl } from '../utils/huggingface';

/**
 * Compact chip for catalog rows that reference the Hugging Face Hub (dev).
 */
export default function HuggingfaceHubBadge({ hfRef, size = 'small', variant = 'outlined' }) {
  if (!hfRef?.repoId) return null;

  const label = huggingfaceBadgeLabel(hfRef);
  const url = huggingfaceHubUrl(hfRef);
  const tip =
    hfRef.repoType === 'dataset'
      ? `Hub dataset — trainer loads at run time (splits: ${hfRef.splitTrain || 'train'}/${hfRef.splitTest || 'test'})`
      : 'Hub base model — trainer uses from_pretrained at run time';

  const chip = (
    <Chip
      icon={<HubIcon />}
      label={label}
      size={size}
      color="secondary"
      variant={variant}
      component={url ? Link : 'span'}
      href={url || undefined}
      target={url ? '_blank' : undefined}
      rel={url ? 'noopener noreferrer' : undefined}
      onClick={url ? (e) => e.stopPropagation() : undefined}
      sx={{ maxWidth: '100%' }}
    />
  );

  return <Tooltip title={tip}>{chip}</Tooltip>;
}
