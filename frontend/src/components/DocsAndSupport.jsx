import React from 'react';

export default function DocsAndSupport({ activePage }) {
  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
      <h2 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.5px', marginBottom: '8px' }}>{activePage}</h2>
      <p style={{ color: '#888', fontSize: '13px', marginBottom: '24px' }}>Universal System D unbanked economic observation engine.</p>
      <div style={{ background: '#0a0a0c', border: '1px solid #1a1a1a', borderRadius: '16px', padding: '28px' }}>
        <div style={{ fontSize: '14px', color: '#ddd', lineHeight: '1.8' }}>
          {activePage === 'About' && "Street AI tracks the global informal economy across dark cash and mobile money channels with 99% precision targets. By combining Sentinel orbital SAR, cellular RF signals, and decentralized pricing networks, the platform provides institutional-grade visibility into previously invisible markets."}
          {activePage === 'Documentation' && "The 7-Pillar Architecture executes zero-cost spatial pipelines through DuckDB, Overture Maps Parquet, and localized Playwright scrapers before applying typed Pydantic ontology graphs to prevent LLM hallucinations."}
          {activePage === 'Support' && "For custom enterprise integrations, high-frequency Sentinel-1 orbital Tasking, or dedicated municipal geofence calibration, contact the core engineering team directly via secure channel."}
        </div>
      </div>
    </div>
  );
}