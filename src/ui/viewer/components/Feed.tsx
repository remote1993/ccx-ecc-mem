import React, { useMemo, useRef, useEffect } from 'react';
import { Observation, Summary, UserPrompt, FeedItem } from '../types';
import { ObservationCard } from './ObservationCard';
import { SummaryCard } from './SummaryCard';
import { PromptCard } from './PromptCard';
import { ScrollToTop } from './ScrollToTop';
import { UI } from '../constants/ui';
import type { ViewerLabels } from '../i18n';

interface FeedProps {
  observations: Observation[];
  summaries: Summary[];
  prompts: UserPrompt[];
  intro?: React.ReactNode;
  onLoadMore: () => void;
  isLoading: boolean;
  hasMore: boolean;
  labels: ViewerLabels;
}

export function Feed({ observations, summaries, prompts, intro, onLoadMore, isLoading, hasMore, labels }: FeedProps) {
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  const onLoadMoreRef = useRef(onLoadMore);

  // Keep the callback ref up to date
  useEffect(() => {
    onLoadMoreRef.current = onLoadMore;
  }, [onLoadMore]);

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasMore && !isLoading) {
          onLoadMoreRef.current?.();
        }
      },
      { threshold: UI.LOAD_MORE_THRESHOLD }
    );

    observer.observe(element);

    return () => {
      if (element) {
        observer.unobserve(element);
      }
      observer.disconnect();
    };
  }, [hasMore, isLoading]);

  const items = useMemo<FeedItem[]>(() => {
    const combined = [
      ...observations.map(o => ({ ...o, itemType: 'observation' as const })),
      ...summaries.map(s => ({ ...s, itemType: 'summary' as const })),
      ...prompts.map(p => ({ ...p, itemType: 'prompt' as const }))
    ];

    return combined.sort((a, b) => b.created_at_epoch - a.created_at_epoch);
  }, [observations, summaries, prompts]);

  return (
    <div className="feed" ref={feedRef}>
      <ScrollToTop targetRef={feedRef} labels={labels} />
      <div className="feed-content">
        {intro}
        <div className="timeline-feed">
          {items.map(item => {
            const key = `${item.itemType}-${item.id}`;
            if (item.itemType === 'observation') {
              return <ObservationCard key={key} observation={item} labels={labels} />;
            } else if (item.itemType === 'summary') {
              return <SummaryCard key={key} summary={item} labels={labels} />;
            } else {
              return <PromptCard key={key} prompt={item} labels={labels} />;
            }
          })}
          {items.length === 0 && !isLoading && (
            <div className="feed-state">
              {labels.noItems}
            </div>
          )}
          {isLoading && (
            <div className="feed-state feed-state-inline">
              <div className="spinner"></div>
              {labels.loadingMore}
            </div>
          )}
          {hasMore && !isLoading && items.length > 0 && (
            <div ref={loadMoreRef} className="load-more-sentinel" />
          )}
          {!hasMore && items.length > 0 && (
            <div className="feed-state feed-state-compact">
              {labels.noMoreItems}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
