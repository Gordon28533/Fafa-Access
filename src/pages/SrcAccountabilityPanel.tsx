import { useMemo, useState } from 'react';

interface SrcOfficerMetric {
  officerId: string;
  userId: string;
  officerName: string;
  officerEmail: string;
  universityId: string;
  universityName: string;
  position: string;
  pendingCount: number;
  pendingSlaBreaches: number;
  reviewedCount: number;
  avgReviewHours: number;
  avgReviewDays: number;
  slaReviewBreaches: number;
  slaViolation: boolean;
}

interface SrcAccountabilitySummary {
  totalOfficers: number;
  totalPending: number;
  totalPendingSlaBreaches: number;
  totalReviewCount: number;
  averageReviewHours: number;
  slaViolationCount: number;
  slaHours: number;
}

interface SrcAccountabilityPanelProps {
  data: SrcOfficerMetric[];
  summary: SrcAccountabilitySummary;
  loading?: boolean;
}

type SortKey = 'pending' | 'review' | 'sla';

export default function SrcAccountabilityPanel({
  data,
  summary,
  loading = false,
}: SrcAccountabilityPanelProps) {
  const [sortBy, setSortBy] = useState<SortKey>('sla');

  const sortedData = useMemo(() => {
    if (!data) return [];
    const sorted = [...data];

    switch (sortBy) {
      case 'pending':
        sorted.sort((a, b) => b.pendingCount - a.pendingCount);
        break;
      case 'review':
        sorted.sort((a, b) => b.avgReviewHours - a.avgReviewHours);
        break;
      case 'sla':
      default:
        sorted.sort((a, b) => {
          if (a.slaViolation === b.slaViolation) {
            return b.pendingSlaBreaches - a.pendingSlaBreaches;
          }
          return a.slaViolation ? -1 : 1;
        });
    }

    return sorted;
  }, [data, sortBy]);

  if (loading) {
    return (
      <div className="src-accountability">
        <div className="loading">Loading SRC accountability data...</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="src-accountability">
        <div className="no-data">No SRC accountability data available.</div>
      </div>
    );
  }

  return (
    <div className="src-accountability">
      <div className="src-accountability-header">
        <div>
          <h2>SRC Accountability Dashboard</h2>
          <p className="src-subtitle">
            SLA threshold: {summary.slaHours} hours
          </p>
        </div>
        <div className="src-controls">
          <label htmlFor="src-sort">Sort by:</label>
          <select
            id="src-sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
          >
            <option value="sla">SLA Violations</option>
            <option value="pending">Pending Count</option>
            <option value="review">Review Time</option>
          </select>
        </div>
      </div>

      <div className="src-summary">
        <div className="src-summary-card">
          <span className="summary-label">Total SRC Officers</span>
          <span className="summary-value">{summary.totalOfficers}</span>
        </div>
        <div className="src-summary-card">
          <span className="summary-label">Pending Applications</span>
          <span className="summary-value">{summary.totalPending}</span>
        </div>
        <div className="src-summary-card">
          <span className="summary-label">SLA Breaches (Pending)</span>
          <span className="summary-value danger">{summary.totalPendingSlaBreaches}</span>
        </div>
        <div className="src-summary-card">
          <span className="summary-label">Avg Review Hours</span>
          <span className="summary-value">{summary.averageReviewHours}</span>
        </div>
        <div className="src-summary-card">
          <span className="summary-label">Officers in Violation</span>
          <span className="summary-value warning">{summary.slaViolationCount}</span>
        </div>
      </div>

      <div className="src-table-wrapper">
        <table className="src-table">
          <thead>
            <tr>
              <th>Officer</th>
              <th>University</th>
              <th>Position</th>
              <th>Pending</th>
              <th>Pending SLA</th>
              <th>Reviewed</th>
              <th>Avg Review (hrs)</th>
              <th>SLA Breaches</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((officer) => (
              <tr
                key={officer.officerId}
                className={officer.slaViolation ? 'src-row violation' : 'src-row'}
              >
                <td>
                  <div className="src-officer">
                    <div className="src-officer-name">{officer.officerName}</div>
                    <div className="src-officer-email">{officer.officerEmail}</div>
                  </div>
                </td>
                <td>{officer.universityName}</td>
                <td>{officer.position}</td>
                <td className="numeric">{officer.pendingCount}</td>
                <td className="numeric danger">{officer.pendingSlaBreaches}</td>
                <td className="numeric">{officer.reviewedCount}</td>
                <td className="numeric">{officer.avgReviewHours}</td>
                <td className="numeric warning">{officer.slaReviewBreaches}</td>
                <td>
                  <span className={officer.slaViolation ? 'status-badge danger' : 'status-badge ok'}>
                    {officer.slaViolation ? 'Violation' : 'On Track'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
