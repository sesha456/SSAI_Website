import { ORGANIZATION_CONFIG } from '../config/organization.config';

const MONTH_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  year: 'numeric'
});

export interface OrganizationAgeInfo {
  foundedLabel: string;
  ageLabel: string;
  statValue: string;
  statUnit: string;
}

export function organizationAgeInfo(currentDate = new Date()): OrganizationAgeInfo {
  const founding = parseYearMonth(ORGANIZATION_CONFIG.foundingYearMonth);
  const current = {
    year: currentDate.getFullYear(),
    month: currentDate.getMonth() + 1
  };
  const elapsedMonths = Math.max(0, (current.year - founding.year) * 12 + current.month - founding.month);

  const age = formatElapsedMonths(elapsedMonths);
  return {
    foundedLabel: MONTH_FORMATTER.format(new Date(founding.year, founding.month - 1, 1)),
    ageLabel: age.label,
    statValue: age.value,
    statUnit: age.unit
  };
}

function parseYearMonth(value: string): { year: number; month: number } {
  const [year, month] = value.split('-').map(Number);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error(`Invalid organization founding year-month: ${value}`);
  }
  return { year, month };
}

function formatElapsedMonths(totalMonths: number): { label: string; value: string; unit: string } {
  if (totalMonths === 0) {
    return { label: 'Founded this month', value: 'New', unit: 'this month' };
  }

  if (totalMonths < 12) {
    const unit = `${pluralize('month', totalMonths)} old`;
    return { label: `${totalMonths} ${unit}`, value: String(totalMonths), unit };
  }

  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  const yearPart = `${years} ${pluralize('year', years)}`;
  const monthPart = months ? `, ${months} ${pluralize('month', months)}` : '';
  const unit = months ? `${pluralize('year', years)}, ${months} ${pluralize('month', months)} old` : `${pluralize('year', years)} old`;
  return { label: `${yearPart}${monthPart} old`, value: String(years), unit };
}

function pluralize(value: string, count: number): string {
  return count === 1 ? value : `${value}s`;
}
