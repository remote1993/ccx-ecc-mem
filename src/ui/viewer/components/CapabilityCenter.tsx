import React from 'react';
import type { Capability, ViewerCapabilitiesResponse } from '../types';
import type { ViewerLabels } from '../i18n';

interface CapabilityCenterProps {
  data: ViewerCapabilitiesResponse | null;
  labels: ViewerLabels;
  isLoading: boolean;
  error?: string | null;
}

function localized(text: Capability['title'] | Capability['summary'], locale = 'zh-CN'): string {
  return text?.[locale as 'zh-CN'] || text?.en || text?.['zh-CN'] || '';
}

function CapabilityCard({ capability, locale }: { capability: Capability; locale: string }) {
  return (
    <div style={{ border: '1px solid var(--border-color)', borderRadius: 10, padding: 12, background: 'var(--card-bg)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontWeight: 700 }}>{localized(capability.title, locale) || capability.id}</div>
          <div style={{ fontSize: 12, opacity: 0.72, marginTop: 4 }}>{capability.id}</div>
        </div>
        <span style={{ fontSize: 12, border: '1px solid var(--border-color)', borderRadius: 999, padding: '2px 8px', whiteSpace: 'nowrap' }}>
          {capability.dependencyTier || 'core'}
        </span>
      </div>
      <p style={{ margin: '10px 0 0', fontSize: 13, lineHeight: 1.45 }}>{localized(capability.summary, locale)}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10, fontSize: 12, opacity: 0.82 }}>
        <span>{capability.kind}</span>
        <span>·</span>
        <span>{capability.source}</span>
        {capability.risks?.map((risk) => <span key={risk}>· {risk}</span>)}
      </div>
    </div>
  );
}

function CapabilityGroup({ title, capabilities, locale }: { title: string; capabilities: Capability[]; locale: string }) {
  if (capabilities.length === 0) return null;

  return (
    <section style={{ marginTop: 18 }}>
      <h3 style={{ margin: '0 0 10px', fontSize: 16 }}>{title} · {capabilities.length}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10 }}>
        {capabilities.map((capability) => (
          <CapabilityCard key={capability.id} capability={capability} locale={locale} />
        ))}
      </div>
    </section>
  );
}

export function CapabilityCenter({ data, labels, isLoading, error }: CapabilityCenterProps) {
  if (error) {
    return (
      <section style={{ maxWidth: 1180, margin: '18px auto', padding: '0 18px' }}>
        <div style={{ border: '1px solid var(--border-color)', borderRadius: 14, padding: 16, background: 'var(--card-bg)' }}>
          <h2 style={{ margin: 0, fontSize: 20 }}>{labels.capabilityCenter}</h2>
          <p style={{ color: 'var(--danger-color, #ef4444)', margin: '12px 0 0' }}>{error}</p>
        </div>
      </section>
    );
  }

  if (!data) {
    return (
      <section style={{ maxWidth: 1180, margin: '18px auto', padding: '0 18px' }}>
        <div style={{ border: '1px solid var(--border-color)', borderRadius: 14, padding: 16, background: 'var(--card-bg)' }}>
          <h2 style={{ margin: 0, fontSize: 20 }}>{labels.capabilityCenter}</h2>
          <p>{isLoading ? labels.loading : labels.noItems}</p>
        </div>
      </section>
    );
  }

  const locale = data.defaultLocale || 'zh-CN';
  const groups = data.capabilitiesByStatus || { active: [], optional: [], reference: [], archived: [] };

  return (
    <section style={{ maxWidth: 1180, margin: '18px auto', padding: '0 18px' }}>
      <div style={{ border: '1px solid var(--border-color)', borderRadius: 14, padding: 16, background: 'var(--card-bg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20 }}>{labels.capabilityCenter}</h2>
            <p style={{ margin: '8px 0 0', opacity: 0.78 }}>{labels.capabilityCenterDescription}</p>
          </div>
          <div style={{ fontSize: 13, opacity: 0.82 }}>
            <div>{labels.capabilityProfile}: {data.defaultProfile}</div>
            <div>{labels.capabilityLocale}: {locale}</div>
          </div>
        </div>
        {isLoading ? <p>{labels.loading}</p> : null}
        <CapabilityGroup title={labels.activeCapabilities} capabilities={groups.active || []} locale={locale} />
        <CapabilityGroup title={labels.optionalCapabilities} capabilities={groups.optional || []} locale={locale} />
        <CapabilityGroup title={labels.referenceCapabilities} capabilities={groups.reference || []} locale={locale} />
        <CapabilityGroup title={labels.archivedCapabilities} capabilities={groups.archived || []} locale={locale} />
      </div>
    </section>
  );
}
