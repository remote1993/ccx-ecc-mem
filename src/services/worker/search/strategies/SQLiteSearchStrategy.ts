/**
 * SQLiteSearchStrategy - Direct SQLite memory queries
 *
 * This strategy handles SQLite-backed memory searches:
 * - FTS5/LIKE keyword searches when Chroma is disabled or unavailable
 * - Date range filtering
 * - Project filtering
 * - Type filtering
 * - Concept/file filtering
 *
 * Used when: Chroma is disabled/unavailable, or as a fallback when Chroma fails
 */

import { BaseSearchStrategy, SearchStrategy } from './SearchStrategy.js';
import {
  StrategySearchOptions,
  StrategySearchResult,
  SEARCH_CONSTANTS,
  ObservationSearchResult,
  SessionSummarySearchResult,
  UserPromptSearchResult
} from '../types.js';
import { SessionSearch } from '../../../sqlite/SessionSearch.js';
import { logger } from '../../../../utils/logger.js';

export class SQLiteSearchStrategy extends BaseSearchStrategy implements SearchStrategy {
  readonly name = 'sqlite';

  constructor(private sessionSearch: SessionSearch) {
    super();
  }

  canHandle(options: StrategySearchOptions): boolean {
    return true;
  }

  async search(options: StrategySearchOptions): Promise<StrategySearchResult> {
    const {
      searchType = 'all',
      obsType,
      concepts,
      files,
      limit = SEARCH_CONSTANTS.DEFAULT_LIMIT,
      offset = 0,
      project,
      dateRange,
      orderBy = 'date_desc',
      query
    } = options;

    const searchObservations = searchType === 'all' || searchType === 'observations';
    const searchSessions = searchType === 'all' || searchType === 'sessions';
    const searchPrompts = searchType === 'all' || searchType === 'prompts';

    let observations: ObservationSearchResult[] = [];
    let sessions: SessionSummarySearchResult[] = [];
    let prompts: UserPromptSearchResult[] = [];

    const baseOptions = { limit, offset, orderBy, project, dateRange };

    logger.debug('SEARCH', 'SQLiteSearchStrategy: SQLite memory search', {
      searchType,
      hasQuery: !!query,
      hasDateRange: !!dateRange,
      hasProject: !!project
    });

    const obsOptions = searchObservations ? { ...baseOptions, type: obsType, concepts, files } : null;

    try {
      return this.executeSqliteSearch(query, obsOptions, searchSessions, searchPrompts, baseOptions);
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      logger.error('WORKER', 'SQLiteSearchStrategy: Search failed', {}, errorObj);
      return this.emptyResult('sqlite');
    }
  }

  private executeSqliteSearch(
    query: string | undefined,
    obsOptions: Record<string, any> | null,
    searchSessions: boolean,
    searchPrompts: boolean,
    baseOptions: Record<string, any>
  ): StrategySearchResult {
    let observations: ObservationSearchResult[] = [];
    let sessions: SessionSummarySearchResult[] = [];
    let prompts: UserPromptSearchResult[] = [];

    if (obsOptions) {
      observations = this.sessionSearch.searchObservations(query, obsOptions);
    }
    if (searchSessions) {
      sessions = this.sessionSearch.searchSessions(query, baseOptions);
    }
    if (searchPrompts) {
      prompts = this.sessionSearch.searchUserPrompts(query, baseOptions);
    }

    return {
      results: { observations, sessions, prompts },
      usedChroma: false,
      fellBack: false,
      strategy: 'sqlite'
    };
  }

  /**
   * Find observations by concept (used by findByConcept tool)
   */
  findByConcept(concept: string, options: StrategySearchOptions): ObservationSearchResult[] {
    const { limit = SEARCH_CONSTANTS.DEFAULT_LIMIT, project, dateRange, orderBy = 'date_desc' } = options;
    return this.sessionSearch.findByConcept(concept, { limit, project, dateRange, orderBy });
  }

  /**
   * Find observations by type (used by findByType tool)
   */
  findByType(type: string | string[], options: StrategySearchOptions): ObservationSearchResult[] {
    const { limit = SEARCH_CONSTANTS.DEFAULT_LIMIT, project, dateRange, orderBy = 'date_desc' } = options;
    return this.sessionSearch.findByType(type as any, { limit, project, dateRange, orderBy });
  }

  /**
   * Find observations and sessions by file path (used by findByFile tool)
   */
  findByFile(filePath: string, options: StrategySearchOptions): {
    observations: ObservationSearchResult[];
    sessions: SessionSummarySearchResult[];
  } {
    const { limit = SEARCH_CONSTANTS.DEFAULT_LIMIT, project, dateRange, orderBy = 'date_desc' } = options;
    return this.sessionSearch.findByFile(filePath, { limit, project, dateRange, orderBy });
  }
}
