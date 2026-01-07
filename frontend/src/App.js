import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { AlertCircle, TrendingUp, Clock, DollarSign, Users, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import './App.css';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

function App() {
  const [dashboard, setDashboard] = useState(null);
  const [dcaPerformance, setDcaPerformance] = useState([]);
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [dashRes, dcaRes, casesRes] = await Promise.all([
        fetch(`${API_BASE}/analytics/dashboard`),
        fetch(`${API_BASE}/analytics/dca-performance`),
        fetch(`${API_BASE}/cases?limit=20`)
      ]);

      if (!dashRes.ok || !dcaRes.ok || !casesRes.ok) {
        throw new Error('Failed to fetch data from API');
      }

      const dashData = await dashRes.json();
      const dcaData = await dcaRes.json();
      const casesData = await casesRes.json();

      setDashboard(dashData);
      setDcaPerformance(dcaData);
      setCases(casesData);
      setLoading(false);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading Control Tower...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <AlertCircle size={48} color="#ef4444" />
        <h2>Connection Error</h2>
        <p>{error}</p>
        <p className="error-hint">Make sure the backend is running at {API_BASE}</p>
        <button onClick={fetchData} className="retry-button">Retry</button>
      </div>
    );
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  const agingChartData = dashboard?.aging_buckets ? Object.entries(dashboard.aging_buckets).map(([bucket, data]) => ({
    name: bucket,
    amount: data.total_amount / 1000,
    count: data.count
  })) : [];

  const riskPieData = dashboard?.risk_distribution ? Object.entries(dashboard.risk_distribution).map(([risk, data]) => ({
    name: risk,
    value: data.count
  })) : [];

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <h1>DCA Control Tower</h1>
          <p>Enterprise Debt Collection Management Platform</p>
        </div>
      </header>

      {/* Tabs */}
      <div className="tabs">
        <div className="tabs-container">
          {['dashboard', 'cases', 'dcas'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`tab ${activeTab === tab ? 'active' : ''}`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <main className="main-content">
        {activeTab === 'dashboard' && (
          <>
            {/* KPI Cards */}
            <div className="kpi-grid">
              <KPICard
                icon={<Users size={24} />}
                title="Active Cases"
                value={dashboard?.summary.total_active_cases || 0}
                color="blue"
              />
              <KPICard
                icon={<DollarSign size={24} />}
                title="AR Exposure"
                value={`$${((dashboard?.summary.total_ar_exposure || 0) / 1000000).toFixed(1)}M`}
                color="green"
              />
              <KPICard
                icon={<Clock size={24} />}
                title="Avg Days Overdue"
                value={Math.round(dashboard?.summary.avg_days_overdue || 0)}
                color="orange"
              />
              <KPICard
                icon={<CheckCircle size={24} />}
                title="SLA Compliance"
                value={`${dashboard?.sla_health.on_time_pct || 0}%`}
                color="purple"
              />
            </div>

            {/* SLA Health */}
            <div className="card sla-health">
              <h2>SLA Health Status</h2>
              <div className="sla-grid">
                <div className="sla-item green">
                  <CheckCircle size={32} />
                  <div className="sla-value">{dashboard?.sla_health.on_time || 0}</div>
                  <div className="sla-label">On Time</div>
                </div>
                <div className="sla-item yellow">
                  <AlertTriangle size={32} />
                  <div className="sla-value">{dashboard?.sla_health.at_risk || 0}</div>
                  <div className="sla-label">At Risk</div>
                </div>
                <div className="sla-item red">
                  <XCircle size={32} />
                  <div className="sla-value">{dashboard?.sla_health.breached || 0}</div>
                  <div className="sla-label">Breached</div>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="charts-grid">
              <div className="card">
                <h2>Aging Buckets</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={agingChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis label={{ value: 'Amount ($K)', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Bar dataKey="amount" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="card">
                <h2>Risk Distribution</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={riskPieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={entry => entry.name}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {riskPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* DCA Performance */}
            <div className="card">
              <h2>DCA Performance Leaderboard</h2>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>DCA</th>
                      <th>Recovery Rate</th>
                      <th>Avg Days</th>
                      <th>SLA %</th>
                      <th>Capacity</th>
                      <th>Cases</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dcaPerformance.map((dca, idx) => (
                      <tr key={idx}>
                        <td>
                          <div className="dca-name">{dca.dca_name}</div>
                          <div className="dca-code">{dca.dca_code}</div>
                        </td>
                        <td>
                          <span className={`badge ${dca.recovery_rate >= 70 ? 'green' : 'yellow'}`}>
                            {dca.recovery_rate}%
                          </span>
                        </td>
                        <td>{dca.avg_days_to_recovery}d</td>
                        <td>{dca.sla_adherence_rate}%</td>
                        <td>
                          <div className="capacity-bar">
                            <div 
                              className={`capacity-fill ${dca.capacity_pct > 80 ? 'red' : 'blue'}`}
                              style={{ width: `${dca.capacity_pct}%` }}
                            ></div>
                          </div>
                          <span className="capacity-text">{dca.capacity_pct}%</span>
                        </td>
                        <td>{dca.active_cases}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === 'cases' && (
          <div className="card">
            <h2>Recent Cases</h2>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Case ID</th>
                    <th>Account</th>
                    <th>Amount</th>
                    <th>Days Overdue</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>SLA</th>
                  </tr>
                </thead>
                <tbody>
                  {cases.map((c) => (
                    <tr key={c.case_id}>
                      <td className="mono">{c.case_id.slice(0, 8)}...</td>
                      <td>{c.account_number}</td>
                      <td>${c.total_outstanding.toLocaleString()}</td>
                      <td>{c.days_overdue}</td>
                      <td>
                        <div>{c.priority_score?.toFixed(1)}</div>
                        <div className="small-text">{c.sla_tier}</div>
                      </td>
                      <td>
                        <span className={`badge ${
                          c.status === 'RESOLVED' ? 'green' :
                          c.status === 'ACTIVE' ? 'blue' : 'gray'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td>
                        {c.sla_breach ? 
                          <XCircle size={20} color="#ef4444" /> : 
                          <CheckCircle size={20} color="#10b981" />
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'dcas' && (
          <div className="card">
            <h2>DCA Agencies</h2>
            <div className="dca-cards-grid">
              {dcaPerformance.map((dca, idx) => (
                <div key={idx} className="dca-card">
                  <h3>{dca.dca_name}</h3>
                  <p className="dca-code-large">{dca.dca_code}</p>
                  
                  <div className="dca-stats">
                    <div className="stat">
                      <span className="stat-label">Recovery Rate:</span>
                      <span className="stat-value green">{dca.recovery_rate}%</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Avg Recovery Time:</span>
                      <span className="stat-value">{dca.avg_days_to_recovery} days</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">SLA Adherence:</span>
                      <span className="stat-value">{dca.sla_adherence_rate}%</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Active Cases:</span>
                      <span className="stat-value">{dca.active_cases}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Capacity:</span>
                      <span className="stat-value">{dca.capacity_pct}%</span>
                    </div>
                  </div>
                  
                  <div className="capacity-bar-large">
                    <div 
                      className={`capacity-fill ${dca.capacity_pct > 80 ? 'red' : 'blue'}`}
                      style={{ width: `${dca.capacity_pct}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function KPICard({ icon, title, value, color }) {
  return (
    <div className="kpi-card">
      <div className={`kpi-icon ${color}`}>
        {icon}
      </div>
      <div className="kpi-content">
        <p className="kpi-title">{title}</p>
        <p className="kpi-value">{value}</p>
      </div>
    </div>
  );
}

export default App;