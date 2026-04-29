/**
 * HumanFormatter - Formats context output with ANSI colors for terminal
 *
 * Handles all colored formatting for context injection (terminal display).
 */

import type {
  ContextConfig,
  Observation,
  TokenEconomics,
  PriorMessages,
} from '../types.js';
import { colors } from '../types.js';
import { ModeManager } from '../../domain/ModeManager.js';
import { formatObservationTokenDisplay } from '../TokenCalculator.js';
import { getContextLabels } from './AgentFormatter.js';

/**
 * Format current date/time for header display
 */
function formatHeaderDateTime(): string {
  const now = new Date();
  const date = now.toLocaleDateString('en-CA'); // YYYY-MM-DD format
  const time = now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).toLowerCase().replace(' ', '');
  const tz = now.toLocaleTimeString('en-US', { timeZoneName: 'short' }).split(' ').pop();
  return `${date} ${time} ${tz}`;
}

/**
 * Render human-readable header
 */
export function renderHumanHeader(project: string): string[] {
  const labels = getContextLabels();
  return [
    '',
    `${colors.bright}${colors.cyan}[${project}] ${labels.recent_context}, ${formatHeaderDateTime()}${colors.reset}`,
    `${colors.gray}${'─'.repeat(60)}${colors.reset}`,
    ''
  ];
}

/**
 * Render human-readable legend
 */
export function renderHumanLegend(): string[] {
  const mode = ModeManager.getInstance().getActiveMode();
  const labels = getContextLabels();
  const typeLegendItems = mode.observation_types.map(t => `${t.emoji} ${t.label}`).join(' | ');

  return [
    `${colors.dim}${labels.legend}: ${labels.session} | ${typeLegendItems}${colors.reset}`,
    ''
  ];
}

/**
 * Render human-readable column key
 */
export function renderHumanColumnKey(): string[] {
  const labels = getContextLabels();
  return [
    `${colors.bright}${labels.column_key}${colors.reset}`,
    `${colors.dim}  ${labels.read}: ${labels.read_description}${colors.reset}`,
    `${colors.dim}  ${labels.work}: ${labels.work_description}${colors.reset}`,
    ''
  ];
}

/**
 * Render human-readable context index instructions
 */
export function renderHumanContextIndex(): string[] {
  const labels = getContextLabels();
  return [
    `${colors.dim}${labels.context_index}: ${labels.context_index_description}${colors.reset}`,
    '',
    `${colors.dim}${labels.details_intro}${colors.reset}`,
    `${colors.dim}  - ${labels.fetch_by_id}${colors.reset}`,
    `${colors.dim}  - ${labels.search_history}${colors.reset}`,
    `${colors.dim}  - ${labels.trust_index}${colors.reset}`,
    ''
  ];
}

/**
 * Render human-readable context economics
 */
export function renderHumanContextEconomics(
  economics: TokenEconomics,
  config: ContextConfig
): string[] {
  const output: string[] = [];
  const labels = getContextLabels();

  output.push(`${colors.bright}${colors.cyan}${labels.context_economics}${colors.reset}`);
  output.push(`${colors.dim}  ${labels.loading}: ${economics.totalObservations} ${labels.observations_short} (${economics.totalReadTokens.toLocaleString()} ${labels.tokens_to_read})${colors.reset}`);
  output.push(`${colors.dim}  ${labels.work_investment}: ${economics.totalDiscoveryTokens.toLocaleString()} ${labels.work_investment_description}${colors.reset}`);

  if (economics.totalDiscoveryTokens > 0 && (config.showSavingsAmount || config.showSavingsPercent)) {
    let savingsLine = `  ${labels.your_savings}: `;
    if (config.showSavingsAmount && config.showSavingsPercent) {
      savingsLine += `${economics.savings.toLocaleString()} ${labels.tokens} (${economics.savingsPercent}% ${labels.reduction_from_reuse})`;
    } else if (config.showSavingsAmount) {
      savingsLine += `${economics.savings.toLocaleString()} ${labels.tokens}`;
    } else {
      savingsLine += `${economics.savingsPercent}% ${labels.reduction_from_reuse}`;
    }
    output.push(`${colors.green}${savingsLine}${colors.reset}`);
  }
  output.push('');

  return output;
}

/**
 * Render human-readable day header
 */
export function renderHumanDayHeader(day: string): string[] {
  return [
    `${colors.bright}${colors.cyan}${day}${colors.reset}`,
    ''
  ];
}

/**
 * Render human-readable file header
 */
export function renderHumanFileHeader(file: string): string[] {
  return [
    `${colors.dim}${file}${colors.reset}`
  ];
}

/**
 * Render human-readable table row for observation
 */
export function renderHumanTableRow(
  obs: Observation,
  time: string,
  showTime: boolean,
  config: ContextConfig
): string {
  const title = obs.title || 'Untitled';
  const icon = ModeManager.getInstance().getTypeIcon(obs.type);
  const { readTokens, discoveryTokens, workEmoji } = formatObservationTokenDisplay(obs, config);

  const timePart = showTime ? `${colors.dim}${time}${colors.reset}` : ' '.repeat(time.length);
  const readPart = (config.showReadTokens && readTokens > 0) ? `${colors.dim}(~${readTokens}t)${colors.reset}` : '';
  const discoveryPart = (config.showWorkTokens && discoveryTokens > 0) ? `${colors.dim}(${workEmoji} ${discoveryTokens.toLocaleString()}t)${colors.reset}` : '';

  return `  ${colors.dim}#${obs.id}${colors.reset}  ${timePart}  ${icon}  ${title} ${readPart} ${discoveryPart}`;
}

/**
 * Render human-readable full observation
 */
export function renderHumanFullObservation(
  obs: Observation,
  time: string,
  showTime: boolean,
  detailField: string | null,
  config: ContextConfig
): string[] {
  const output: string[] = [];
  const title = obs.title || 'Untitled';
  const icon = ModeManager.getInstance().getTypeIcon(obs.type);
  const { readTokens, discoveryTokens, workEmoji } = formatObservationTokenDisplay(obs, config);

  const timePart = showTime ? `${colors.dim}${time}${colors.reset}` : ' '.repeat(time.length);
  const readPart = (config.showReadTokens && readTokens > 0) ? `${colors.dim}(~${readTokens}t)${colors.reset}` : '';
  const discoveryPart = (config.showWorkTokens && discoveryTokens > 0) ? `${colors.dim}(${workEmoji} ${discoveryTokens.toLocaleString()}t)${colors.reset}` : '';

  output.push(`  ${colors.dim}#${obs.id}${colors.reset}  ${timePart}  ${icon}  ${colors.bright}${title}${colors.reset}`);
  if (detailField) {
    output.push(`    ${colors.dim}${detailField}${colors.reset}`);
  }
  if (readPart || discoveryPart) {
    output.push(`    ${readPart} ${discoveryPart}`);
  }
  output.push('');

  return output;
}

/**
 * Render human-readable summary item in timeline
 */
export function renderHumanSummaryItem(
  summary: { id: number; request: string | null },
  formattedTime: string
): string[] {
  const labels = getContextLabels();
  const summaryTitle = `${summary.request || labels.session_started} (${formattedTime})`;
  return [
    `${colors.yellow}#S${summary.id}${colors.reset} ${summaryTitle}`,
    ''
  ];
}

/**
 * Render human-readable summary field
 */
export function renderHumanSummaryField(label: string, value: string | null, color: string): string[] {
  if (!value) return [];
  return [`${color}${label}:${colors.reset} ${value}`, ''];
}

/**
 * Render human-readable previously section
 */
export function renderHumanPreviouslySection(priorMessages: PriorMessages): string[] {
  if (!priorMessages.assistantMessage) return [];

  const labels = getContextLabels();
  return [
    '',
    '---',
    '',
    `${colors.bright}${colors.magenta}${labels.previously}${colors.reset}`,
    '',
    `${colors.dim}A: ${priorMessages.assistantMessage}${colors.reset}`,
    ''
  ];
}

/**
 * Render human-readable footer
 */
export function renderHumanFooter(totalDiscoveryTokens: number, totalReadTokens: number): string[] {
  const labels = getContextLabels();
  const workTokensK = Math.round(totalDiscoveryTokens / 1000);
  return [
    '',
    `${colors.dim}${labels.access_prefix} ${workTokensK}k ${labels.access_human_suffix} (${totalReadTokens.toLocaleString()}t)${colors.reset}`
  ];
}

/**
 * Render human-readable empty state
 */
export function renderHumanEmptyState(project: string): string {
  const labels = getContextLabels();
  return `\n${colors.bright}${colors.cyan}[${project}] ${labels.recent_context}, ${formatHeaderDateTime()}${colors.reset}\n${colors.gray}${'─'.repeat(60)}${colors.reset}\n\n${colors.dim}${labels.no_previous_sessions}${colors.reset}\n`;
}
