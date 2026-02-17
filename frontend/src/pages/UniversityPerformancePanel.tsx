import { useState } from 'react';

interface UniversityMetric {
  universityId: string;
  universityName: string;
  totalApplications: number;
  srcPending: number;
  srcApproved: number;
  srcRejected: number;
  adminApproved: number;
  adminRejected: number;
  delivered: number;
  srcApprovalRate: string;
  overallApprovalRate: string;
  backlogPercentage: string;
  progressPercentage: string;
  performanceScore: number;
  performanceTier: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL';
}

interface UniversityPerformancePanelProps {
  data: UniversityMetric[];
  loading?: boolean;
}

export default function UniversityPerformancePanel({
  data,
  loading = false,
}: UniversityPerformancePanelProps) {
  const [sortBy, setSortBy] = useState<'score' | 'name' | 'backlog'>('score');
  const [filterTier, setFilterTier] = useState<string>('ALL');

  if (loading) {
    return (
      <div className="university-panel">
        <div className="loading-spinner">
          <p>Loading university performance data...</p>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="university-panel">
        <div className="no-data">
          <p>No university data available</p>
        </div>
      </div>
    );
  }

  // Sort data
  let sortedData = [...data];
  switch (sortBy) {
    case 'name':
      sortedData.sort((a, b) => a.universityName.localeCompare(b.universityName));
      break;
    case 'backlog':
      sortedData.sort((a, b) => parseFloat(b.backlogPercentage) - parseFloat(a.backlogPercentage));
      break;
    case 'score':
    default:
      sortedData.sort((a, b) => a.performanceScore - b.performanceScore);
  }

  // Filter by tier
  if (filterTier !== 'ALL') {
    sortedData = sortedData.filter((u) => u.performanceTier === filterTier);
  }

  const getTierColor = (tier: string): string => {
    switch (tier) {
      case 'EXCELLENT':
        return '#4ade80';
      case 'GOOD':
        return '#3b82f6';
      case 'FAIR':
        return '#f59e0b';
      case 'POOR':
        return '#ef4444';
      case 'CRITICAL':
        return '#7f1d1d';
      default:
        return '#6b7280';
    }
  };

  const getTierBgColor = (tier: string): string => {
    switch (tier) {
      case 'EXCELLENT':
        return '#f0fdf4';
      case 'GOOD':
        return '#eff6ff';
      case 'FAIR':
        return '#fffbeb';
      case 'POOR':
        return '#fef2f2';
      case 'CRITICAL':
        return '#fafaf5';
      default:
        return '#f9fafb';
    }
  };

  return (
    <div className="university-panel">
      <div className="university-header">
        <h3>University Performance Analytics</h3>
        <div className="university-controls">
          <div className="control-group">
            <label htmlFor="sort-select">Sort by:</label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'score' | 'name' | 'backlog')}
            >
              <option value="score">Performance Score (Worst First)</option>
              <option value="name">University Name</option>
              <option value="backlog">Backlog %</option>
            </select>
          </div>

          <div className="control-group">
            <label htmlFor="tier-filter">Filter by Tier:</label>
            <select
              id="tier-filter"
              value={filterTier}
              onChange={(e) => setFilterTier(e.target.value)}
            >
              <option value="ALL">All Tiers</option>
              <option value="EXCELLENT">Excellent</option>
              <option value="GOOD">Good</option>
              <option value="FAIR">Fair</option>
              <option value="POOR">Poor</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>

          <div className="result-count">
            Showing {sortedData.length} of {data.length} universities
          </div>
        </div>
      </div>

      <div className="university-table-wrapper">
        <table className="university-table">
          <thead>
            <tr>
              <th>University Name</th>
              <th>Total Apps</th>
              <th>SRC Backlog</th>
              <th>SRC Approval Rate</th>
              <th>Overall Approval Rate</th>
              <th>Progress %</th>
              <th>Performance Score</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((uni) => (
              <tr
                key={uni.universityId}
                className="university-row"
                style={{ backgroundColor: getTierBgColor(uni.performanceTier) }}
              >
                <td className="name-cell">
                  <span className="university-name">{uni.universityName}</span>
                </td>
                <td className="number-cell">{uni.totalApplications}</td>
                <td className="backlog-cell">
                  <div className="backlog-info">
                    <span className="backlog-count">{uni.srcPending}</span>
                    <span className="backlog-percent">({uni.backlogPercentage}%)</span>
                  </div>
                </td>
                <td className="rate-cell">
                  <div className="rate-display">
                    <span className="rate-value">{uni.srcApprovalRate}</span>
                    <span className="rate-meta">
                      ({uni.srcApproved}A / {uni.srcRejected}R)
                    </span>
                  </div>
                </td>
                <td className="rate-cell">
                  <span className="overall-rate">{uni.overallApprovalRate}</span>
                </td>
                <td className="progress-cell">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${uni.progressPercentage}`,
                        backgroundColor: parseFloat(uni.progressPercentage) > 80 ? '#4ade80' : '#3b82f6',
                      }}
                    ></div>
                  </div>
                  <span className="progress-text">{uni.progressPercentage}</span>
                </td>
                <td className="score-cell">
                  <div className="score-badge" style={{ borderColor: getTierColor(uni.performanceTier) }}>
                    <span className="score-value">{uni.performanceScore}</span>
                  </div>
                </td>
                <td className="status-cell">
                  <span
                    className="tier-badge"
                    style={{
                      backgroundColor: getTierColor(uni.performanceTier),
                      color: 'white',
                    }}
                  >
                    {uni.performanceTier}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="university-legend">
        <div className="legend-title">Performance Tier Legend</div>
        <div className="legend-items">
          <div className="legend-item">
            <div
              className="legend-color"
              style={{ backgroundColor: '#4ade80' }}
            ></div>
            <span>Excellent (90-100): Outstanding performance</span>
          </div>
          <div className="legend-item">
            <div
              className="legend-color"
              style={{ backgroundColor: '#3b82f6' }}
            ></div>
            <span>Good (80-89): Strong performance</span>
          </div>
          <div className="legend-item">
            <div
              className="legend-color"
              style={{ backgroundColor: '#f59e0b' }}
            ></div>
            <span>Fair (70-79): Average performance</span>
          </div>
          <div className="legend-item">
            <div
              className="legend-color"
              style={{ backgroundColor: '#ef4444' }}
            ></div>
            <span>Poor (60-69): Below average</span>
          </div>
          <div className="legend-item">
            <div
              className="legend-color"
              style={{ backgroundColor: '#7f1d1d' }}
            ></div>
            <span>Critical (0-59): Urgent attention needed</span>
          </div>
        </div>
      </div>
    </div>
  );
}
