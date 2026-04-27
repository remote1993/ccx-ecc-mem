/**
 * AgentFormatter - Formats context output as compact markdown for LLM injection
 *
 * Optimized for token efficiency: flat lines instead of tables, no repeated headers.
 * The human-readable terminal formatter (HumanFormatter.ts) handles human-readable display separately.
 */

import type {
  ContextConfig,
  Observation,
  SessionSummary,
  TokenEconomics,
  PriorMessages,
} from '../types.js';
import type { ContextLabels } from '../../domain/types.js';
import { ModeManager } from '../../domain/ModeManager.js';
import { formatObservationTokenDisplay } from '../TokenCalculator.js';

const defaultContextLabels: ContextLabels = {
  recent_context: 'recent context',
  no_previous_sessions: 'No previous sessions found.',
  legend: 'Legend',
  format: 'Format',
  fetch_details: 'Fetch details',
  stats: 'Stats',
  observations_short: 'obs',
  read_tokens_short: 't read',
  work_tokens_short: 't work',
  savings: 'savings',
  saved_tokens: 't saved',
  session: 'session',
  previously: 'Previously',
  session_started: 'Session started',
  access_prefix: 'Access',
  access_suffix: 'tokens of past work via get_observations([IDs]) or mem-search skill.',
  column_key: 'Column Key',
  read: 'Read',
  read_description: 'Tokens to read this observation (cost to learn it now)',
  work: 'Work',
  work_description: 'Tokens spent on work that produced this record (research, building, deciding)',
  context_index: 'Context Index',
  context_index_description: 'This semantic index (titles, types, files, tokens) is usually sufficient to understand past work.',
  details_intro: 'When you need implementation details, rationale, or debugging context:',
  fetch_by_id: 'Fetch by ID: get_observations([IDs]) for observations visible in this index',
  search_history: 'Search history: Use the mem-search skill for past decisions, bugs, and deeper research',
  trust_index: 'Trust this index over re-reading code for past decisions and learnings',
  context_economics: 'Context Economics',
  loading: 'Loading',
  tokens_to_read: 'tokens to read',
  work_investment: 'Work investment',
  work_investment_description: 'tokens spent on research, building, and decisions',
  your_savings: 'Your savings',
  tokens: 'tokens',
  reduction_from_reuse: 'reduction from reuse',
  access_human_suffix: 'tokens of past research & decisions. Use the ccx-mem skill to access memories by ID.',
};

export function getContextLabels(): ContextLabels {
  const mode = ModeManager.getInstance().getActiveMode();
  return { ...defaultContextLabels, ...mode.context_labels };
}

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
 * Render agent header
 */
export function renderAgentHeader(project: string): string[] {
  const labels = getContextLabels();
  return [
    `# [${project}] ${labels.recent_context}, ${formatHeaderDateTime()}`,
    ''
  ];
}

/**
 * Render agent legend
 */
export function renderAgentLegend(): string[] {
  const mode = ModeManager.getInstance().getActiveMode();
  const labels = getContextLabels();
  const typeLegendItems = mode.observation_types.map(t => `${t.emoji}${t.label}`).join(' ');

  return [
    `${labels.legend}: 🎯${labels.session} ${typeLegendItems}`,
    `${labels.format}: ID TIME TYPE TITLE`,
    `${labels.fetch_details}: get_observations([IDs]) | mem-search skill`,
    ''
  ];
}

/**
 * Render agent column key - no longer needed in compact format
 */
export function renderAgentColumnKey(): string[] {
  return [];
}

/**
 * Render agent context index instructions - folded into legend
 */
export function renderAgentContextIndex(): string[] {
  return [];
}

/**
 * Render agent context economics
 */
export function renderAgentContextEconomics(
  economics: TokenEconomics,
  config: ContextConfig
): string[] {
  const output: string[] = [];

  const labels = getContextLabels();
  const parts: string[] = [
    `${economics.totalObservations} ${labels.observations_short} (${economics.totalReadTokens.toLocaleString()}${labels.read_tokens_short})`,
    `${economics.totalDiscoveryTokens.toLocaleString()}${labels.work_tokens_short}`
  ];

  if (economics.totalDiscoveryTokens > 0 && (config.showSavingsAmount || config.showSavingsPercent)) {
    if (config.showSavingsPercent) {
      parts.push(`${economics.savingsPercent}% ${labels.savings}`);
    } else if (config.showSavingsAmount) {
      parts.push(`${economics.savings.toLocaleString()}${labels.saved_tokens}`);
    }
  }

  output.push(`${labels.stats}: ${parts.join(' | ')}`);
  output.push('');

  return output;
}

/**
 * Render agent day header
 */
export function renderAgentDayHeader(day: string): string[] {
  return [
    `### ${day}`,
  ];
}

/**
 * Render agent file header - no longer renders table headers in compact format
 */
export function renderAgentFileHeader(_file: string): string[] {
  // File grouping eliminated in compact format - file context is in observation titles
  return [];
}

/**
 * Format compact time: "9:23 AM" → "9:23a", "12:05 PM" → "12:05p"
 */
function compactTime(time: string): string {
  return time.toLowerCase().replace(' am', 'a').replace(' pm', 'p');
}

/**
 * Render compact flat line for observation (replaces table row)
 */
export function renderAgentTableRow(
  obs: Observation,
  timeDisplay: string,
  _config: ContextConfig
): string {
  const title = obs.title || 'Untitled';
  const icon = ModeManager.getInstance().getTypeIcon(obs.type);
  const time = timeDisplay ? compactTime(timeDisplay) : '"';

  return `${obs.id} ${time} ${icon} ${title}`;
}

/**
 * Render agent full observation
 */
export function renderAgentFullObservation(
  obs: Observation,
  timeDisplay: string,
  detailField: string | null,
  config: ContextConfig
): string[] {
  const output: string[] = [];
  const title = obs.title || 'Untitled';
  const icon = ModeManager.getInstance().getTypeIcon(obs.type);
  const time = timeDisplay ? compactTime(timeDisplay) : '"';
  const { readTokens, discoveryDisplay } = formatObservationTokenDisplay(obs, config);

  output.push(`**${obs.id}** ${time} ${icon} **${title}**`);
  if (detailField) {
    output.push(detailField);
  }

  const tokenParts: string[] = [];
  if (config.showReadTokens) {
    tokenParts.push(`~${readTokens}t`);
  }
  if (config.showWorkTokens) {
    tokenParts.push(discoveryDisplay);
  }
  if (tokenParts.length > 0) {
    output.push(tokenParts.join(' '));
  }
  output.push('');

  return output;
}

/**
 * Render agent summary item in timeline
 */
export function renderAgentSummaryItem(
  summary: { id: number; request: string | null },
  formattedTime: string
): string[] {
  const labels = getContextLabels();
  return [
    `S${summary.id} ${summary.request || labels.session_started} (${formattedTime})`,
  ];
}

/**
 * Render agent summary field
 */
export function renderAgentSummaryField(label: string, value: string | null): string[] {
  if (!value) return [];
  return [`**${label}**: ${value}`, ''];
}

/**
 * Render agent previously section
 */
export function renderAgentPreviouslySection(priorMessages: PriorMessages): string[] {
  if (!priorMessages.assistantMessage) return [];

  const labels = getContextLabels();
  return [
    '',
    '---',
    '',
    `**${labels.previously}**`,
    '',
    `A: ${priorMessages.assistantMessage}`,
    ''
  ];
}

/**
 * Render agent footer
 */
export function renderAgentFooter(totalDiscoveryTokens: number, totalReadTokens: number): string[] {
  const labels = getContextLabels();
  const workTokensK = Math.round(totalDiscoveryTokens / 1000);
  return [
    '',
    `${labels.access_prefix} ${workTokensK}k ${labels.access_suffix}`
  ];
}

/**
 * Render agent empty state
 */
export function renderAgentEmptyState(project: string): string {
  const labels = getContextLabels();
  return `# [${project}] ${labels.recent_context}, ${formatHeaderDateTime()}\n\n${labels.no_previous_sessions}`;
}
