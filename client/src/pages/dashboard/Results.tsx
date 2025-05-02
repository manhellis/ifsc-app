import { useState, useEffect, useMemo, Fragment } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import { TabGroup, TabList, TabPanel, TabPanels, Tab } from "@headlessui/react";
import { FullResult, RankingEntry } from '../../../../shared/types/fullResults';
import { resultsApi } from '../../api';
import toast from 'react-hot-toast';
// Recharts components for analytics visualisation
import {
  ResponsiveContainer,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Bar,
  Scatter,
  Cell,
} from 'recharts';

type SimpleRankingEntry = {
  athlete_id?: number;
  rank: number | string;
  name: string;
  country: string;
  score?: string | number;
  starting_group?: string;
  ascents?: any[];
  elimination_stages?: any[];
};

/**
 * Modal component to display analytics
 */
const AnalyticsModal = ({
  isOpen,
  onClose,
  ranking,
  title,
}: {
  isOpen: boolean;
  onClose: () => void;
  ranking: SimpleRankingEntry[];
  title: string;
}) => {
  if (!isOpen) return null;

  // Decide which analytic module to render
  const AnalyticView = (() => {
    switch (title.split(':')[0]?.trim().toLowerCase()) {
      case 'lead':
        return LeadScoreDistribution;
      case 'speed':
        return SpeedTimeDistribution;
      default:
        return BoulderTopAnalytics;
    }
  })();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-2 sm:p-4">
        <div className="fixed inset-0 bg-gray-200/30 backdrop-blur-sm" onClick={onClose}></div>
        <div className="relative w-full max-w-sm sm:max-w-xl md:max-w-2xl lg:max-w-4xl transform rounded-lg bg-white p-3 sm:p-6 shadow-xl transition-all">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">{title}</h3>
            <button
              onClick={onClose}
              className="rounded-full p-1 hover:bg-gray-200"
            >
              ✕
            </button>
          </div>
          <AnalyticView ranking={ranking} />
        </div>
      </div>
    </div>
  );
};

/**
 * Simple analytics – shows which boulder problems were topped most often
 * within the provided ranking data.
 */
const BoulderTopAnalytics = ({
  ranking,
}: {
  ranking: SimpleRankingEntry[];
}) => {
  const { sorted, max } = useMemo(() => {
    // Get all boulder routes from the data first
    const allRoutes = new Set<string>();
    ranking.forEach(entry => {
      entry.ascents?.forEach((asc: any) => {
        allRoutes.add(asc.route_name);
      });
    });

    // Initialize counts for all boulders to 0
    const counts: Record<string, number> = {};
    allRoutes.forEach(route => {
      counts[route] = 0;
    });

    // Count tops
    ranking.forEach(entry => {
      entry.ascents?.forEach((asc: any) => {
        if (asc.top) {
          counts[asc.route_name] = (counts[asc.route_name] ?? 0) + 1;
        }
      });
    });

    const vals = Object.values(counts);
    const maxVal = vals.length ? Math.max(...vals) : 0;
    // Sort by boulder/route number
    const sortedArr = Object.entries(counts).sort((a, b) => Number(a[0]) - Number(b[0]));
    return { sorted: sortedArr, max: maxVal };
  }, [ranking]);

  if (sorted.length === 0) {
    return (
      <div className="mt-4 text-gray-500 italic">No boulder data available</div>
    );
  }

  return (
    <div className="mt-4">
      <h3 className="mb-2 text-sm font-medium">Boulder tops by problem number</h3>
      <div className="space-y-1">
        {sorted.map(([route, count]) => (
          <div key={route} className="flex items-center gap-2">
            <span className="w-8 text-xs">{`B${route}`}</span>
            <div className="flex-1 rounded bg-gray-200">
              <div
                className="h-3 rounded bg-green-500"
                style={{ width: `${max > 0 ? (count / max) * 100 : 0}%` }}
              />
            </div>
            <span className="text-xs">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
};


const parseScoreValue = (score?: string | number): number | null => {
  if (score == null) return null;
  if (typeof score === 'number') return score;

  const s = score.toString().trim();
  if (s.toUpperCase() === 'TOP') return 100; // treat TOP as the maximum possible score
  const plus = s.endsWith('+');
  const num = parseFloat(s);
  if (Number.isNaN(num)) return null;
  // Treat '+' as slightly higher
  return plus ? num + 0.1 : num;
};

const LeadScoreDistribution = ({ ranking }: { ranking: SimpleRankingEntry[] }) => {
  /**
   * Collect unique route names if per‑route ascents exist
   * (qualification rounds normally have two routes, e.g. "1" & "2").
   */
  const routeNames = Array.from(
    new Set(
      ranking.flatMap((r) =>
        (r.ascents ?? []).map((a: any) => a.route_name?.toString())
      )
    )
  ).filter(Boolean) as string[];

  /**
   * Helper that renders a horizontal bar + dots for a single dataset
   * (either one specific route or the overall score).
   */
  const ChartForRoute = ({
    routeId,
    title,
  }: {
    routeId: string | null; // null → use overall score field
    title: string;
  }) => {
    // Gather raw scores and mark TOP entries
    const rawPoints = ranking.map((r) => {
      let rawScore: string | number | undefined;
      if (routeId) {
        const asc = r.ascents?.find(
          (a: any) => a.route_name?.toString() === routeId
        );
        rawScore = asc?.score;
      } else {
        rawScore = r.score;
      }
      const text = typeof rawScore === 'string' ? rawScore.toString().trim() : '';
      const isTop = text.toUpperCase() === 'TOP';
      const numericVal = isTop ? null : parseScoreValue(rawScore);
      return { lane: 'range', rawScore, x: numericVal, name: r.name, isTop };
    });

    // Filter out entries without a valid numeric score or TOP
    const athletePoints = rawPoints.filter(
      (p) => p.isTop || (p.x !== null && typeof p.x === 'number')
    ) as { lane: string; x: number | null; name: string; isTop: boolean }[];

    if (athletePoints.length === 0) {
      return (
        <div className="mt-4 text-gray-500 italic">
          No scores available for {title}
        </div>
      );
    }

    // Determine numeric scores (excluding TOP)
    const numericScores = athletePoints
      .filter((p) => !p.isTop)
      .map((p) => p.x as number)
      .sort((a, b) => a - b);

    // Establish min and dynamic max (TOP entries become highest numeric + 5)
    const min = numericScores.length ? numericScores[0] : 0;
    const maxNumeric = numericScores.length
      ? numericScores[numericScores.length - 1]
      : min;
    const dynamicMax = athletePoints.some((p) => p.isTop)
      ? maxNumeric + 5
      : maxNumeric;

    // Final point set for plotting, substituting TOP entries
    const plotPoints = athletePoints.map((p) => ({
      lane: p.lane,
      x: p.isTop ? dynamicMax : (p.x as number),
      name: p.name,
    }));

    // Recompute overall domain including TOP
    const allXs = plotPoints.map((p) => p.x).sort((a, b) => a - b);
    const domainMin = allXs[0];
    const domainMax = allXs[allXs.length - 1];

    // Bar data uses invisible offset + visible span
    const barData = [
      {
        lane: 'range',
        offset: domainMin,
        span: domainMax - domainMin,
      },
    ];

    return (
      <div className="mt-4 space-y-1">
        <h3 className="text-sm font-medium">{title}</h3>
        <ResponsiveContainer width="100%" height={90} minWidth={300}>
          <ComposedChart
            layout="vertical"
            data={barData}
            margin={{ top: 0, right: 20, bottom: 0, left: 0 }}
          >
            <CartesianGrid horizontal={false} strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="x"
              domain={[min, domainMax]}
              tick={{ fontSize: 10 }}
              allowDecimals={false}
            />
            <YAxis type="category" dataKey="lane" hide />
            <Tooltip
              cursor={{ fill: 'rgba(0,0,0,0.04)' }}
              formatter={(value: any, _name: string, props: any) => {
                // Scatter points carry athlete name inside payload
                if (props?.payload?.name) {
                  return [`${value}`, props.payload.name];
                }
                return [`${value}`, 'Score'];
              }}
            />
            {/* Invisible bar providing left padding */}
            <Bar dataKey="offset" stackId="a" fill="transparent" />
            {/* Visible bar representing the range */}
            <Bar dataKey="span" stackId="a" fill="#60a5fa" barSize={8} />
            {/* Dots for every athlete */}
            <Scatter data={plotPoints} fill="#1f2937" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // Qualification rounds (two routes) → two separate bars
  if (routeNames.length >= 2) {
    return (
      <div>
        {routeNames
          .sort((a, b) => Number(a) - Number(b))
          .map((route) => (
            <ChartForRoute key={route} routeId={route} title={`Route ${route}`} />
          ))}
      </div>
    );
  }

  // Finals / semifinals → single bar for overall score
  return <ChartForRoute routeId={null} title="Overall" />;
};

/**
 * Speed – histogram of recorded times (faster == smaller).
 */
const SpeedTimeDistribution = ({ ranking }: { ranking: SimpleRankingEntry[] }) => {
  const { bins, maxCount, labels } = useMemo(() => {
    const times = ranking
      .map((r) => {
        const v = typeof r.score === 'string' ? parseFloat(r.score) : r.score;
        return Number.isFinite(v) ? v! : null;
      })
      .filter((v): v is number => v !== null)
      .sort((a, b) => a - b);

    if (times.length === 0) {
      return { bins: [], maxCount: 0, labels: [] as string[] };
    }

    const min = times[0];
    const max = times[times.length - 1];
    const bucketSize = (max - min) / 10 || 0.01;
    const counts = new Array(10).fill(0);
    times.forEach((t) => {
      let idx = Math.floor((t - min) / bucketSize);
      if (idx === 10) idx = 9;
      counts[idx] += 1;
    });
    const labels = counts.map((_, i) =>
      `${(min + i * bucketSize).toFixed(2)}-${(min + (i + 1) * bucketSize).toFixed(2)}`
    );
    return { bins: counts, maxCount: Math.max(...counts), labels };
  }, [ranking]);

  if (bins.length === 0) {
    return <div className="mt-4 text-gray-500 italic">No time data</div>;
  }

  return (
    <div className="mt-4">
      <h3 className="mb-2 text-sm font-medium">Speed time distribution (s)</h3>
      <div className="space-y-1">
        {bins.map((count, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-24 text-[10px] truncate">{labels[i]}</span>
            <div className="flex-1 rounded bg-gray-200">
              <div
                className="h-3 rounded bg-red-500"
                style={{ width: `${maxCount ? (count / maxCount) * 100 : 0}%` }}
              />
            </div>
            <span className="text-xs">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const RankingTable = ({ ranking }: { ranking: SimpleRankingEntry[] }) => {
  if (!ranking || ranking.length === 0) {
    return <div className="text-gray-500 italic">No ranking data available</div>;
  }

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const toggle = (key: string) =>
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="h-max md:max-h-svh md:overflow-auto">
      <table className="min-w-full">
        <thead className="sticky top-0 bg-white text-left">
          <tr>
            <th className="py-2">Place</th>
            <th className="py-2">Name</th>
            <th className="py-2">Country</th>
            <th className="py-2">Score</th>
          </tr>
        </thead>
        <tbody>
          {ranking.map((entry, index) => {
            const key = `${entry.athlete_id ?? entry.name}-${index}`;
            return (
              <Fragment key={`${key}-frag`}>
                <tr
                  key={key}
                  className={`cursor-pointer hover:bg-gray-100 ${expanded[key] ? 'bg-gray-50 border-b-0' : ''}`}
                  onClick={() => toggle(key)}
                >
                  <td className="py-2">{entry.rank}</td>
                  <td className="py-2">{entry.name}</td>
                  <td className="py-2">{entry.country}</td>
                  <td className="py-2">{entry.score ?? '-'}</td>
                </tr>
                {expanded[key] &&
                  ((entry.ascents && entry.ascents.length > 0) ||
                    (entry.elimination_stages && entry.elimination_stages.length > 0)) && (
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <td colSpan={4} className="py-3 px-4">
                        {entry.ascents && entry.ascents.length > 0 && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                            {entry.ascents.map((asc, idx) => {
                              const hasTop = asc.top;
                              const hasZone = asc.zone;
                              return (
                                <div
                                  key={idx}
                                  className={`rounded border px-3 py-2 text-xs ${
                                    hasTop
                                      ? 'bg-green-50 border-green-200'
                                      : hasZone
                                      ? 'bg-blue-50 border-blue-200'
                                      : 'bg-gray-50 border-gray-200'
                                  }`}
                                >
                                  <div className="font-medium mb-1">
                                    Boulder {asc.route_name}
                                  </div>
                                  <div className="flex justify-between text-gray-600">
                                    <span>
                                      {hasTop ? `Top: ${asc.top_tries}` : 'No top'}
                                    </span>
                                    <span>
                                      {hasZone ? `Zone: ${asc.zone_tries}` : 'No zone'}
                                    </span>
                                  </div>
                                  {asc.points !== undefined && (
                                    <div className="mt-1 text-right font-medium">
                                      {asc.points} pts
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {entry.elimination_stages &&
                          entry.elimination_stages.length > 0 && (
                            <div className="space-y-1 text-xs">
                              {entry.elimination_stages.map((stg: any) => {
                                // Find the opponent (same heat_id, different athlete)
                                const opponent = ranking.find(
                                  (ath) =>
                                    ath.athlete_id !== entry.athlete_id &&
                                    ath.elimination_stages?.some(
                                      (es: any) => es.heat_id === stg.heat_id
                                    )
                                );
                                const opponentName = opponent?.name ?? '—';
                                const displayScore = Number.isFinite(stg.time)
                                  ? (stg.time / 1000).toFixed(2)
                                  : stg.score;

                                return (
                                  <div
                                    key={stg.id}
                                    className="flex justify-between rounded border bg-gray-100 px-2 py-1"
                                  >
                                    <span>{stg.name}</span>
                                    <span className="flex-1 text-center text-gray-600">{`vs ${opponentName}`}</span>
                                    <span>{displayScore}</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                      </td>
                    </tr>
                  )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

/**
 * Lead‑specific table for Qualification – displays per‑route ascents/scores.
 */
const LeadQualificationTable = ({
  ranking,
}: {
  ranking: SimpleRankingEntry[];
}) => {
  // Determine unique route order (usually "1", "2", …)
  const routeOrder = useMemo(() => {
    const set = new Set<string>();
    ranking.forEach((r) =>
      r.ascents?.forEach((a: any) => {
        set.add(a.route_name);
      })
    );
    return Array.from(set).sort((a, b) => Number(a) - Number(b));
  }, [ranking]);

  if (!ranking || ranking.length === 0) {
    return (
      <div className="text-gray-500 italic">No ranking data available</div>
    );
  }

  return (
    <div className="h-max md:max-h-svh md:overflow-auto">
      <table className="min-w-full">
        <thead className="sticky top-0 bg-white text-left">
          <tr>
            <th className="py-2">Place</th>
            <th className="py-2">Name</th>
            <th className="py-2">Country</th>
            {routeOrder.map((r) => (
              <th key={r} className="py-2">{`R${r}`}</th>
            ))}
            <th className="py-2">Score</th>
          </tr>
        </thead>
        <tbody>
          {ranking.map((entry, index) => (
            <Fragment
              key={`${entry.athlete_id ?? entry.name}-${index}-wrapper`}
            >
              <tr>
                <td className="py-2">{entry.rank}</td>
                <td className="py-2">{entry.name}</td>
                <td className="py-2">{entry.country}</td>
                {routeOrder.map((r) => {
                  const asc = entry.ascents?.find(
                    (a: any) => a.route_name === r
                  );
                  return (
                    <td key={r} className="py-2 text-center">
                      {asc ? asc.score : '-'}
                    </td>
                  );
                })}
                <td className="py-2">{entry.score ?? '-'}</td>
              </tr>
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/**
 * Speed – qualification table showing both lane A & B runs.
 */
const SpeedQualificationTable = ({ ranking }: { ranking: SimpleRankingEntry[] }) => {
  if (!ranking || ranking.length === 0) {
    return <div className="text-gray-500 italic">No ranking data available</div>;
  }

  return (
    <div className="h-max md:max-h-svh md:overflow-auto">
      <table className="min-w-full">
        <thead className="sticky top-0 bg-white text-left">
          <tr>
            <th className="py-2">Place</th>
            <th className="py-2">Name</th>
            <th className="py-2">Country</th>
            <th className="py-2 text-center">A</th>
            <th className="py-2 text-center">B</th>
            <th className="py-2">Best</th>
          </tr>
        </thead>
        <tbody>
          {ranking.map((entry, idx) => {
            const laneA = entry.ascents?.find((a: any) => a.route_name === 'A');
            const laneB = entry.ascents?.find((a: any) => a.route_name === 'B');
            return (
              <Fragment key={`${entry.athlete_id ?? entry.name}-${idx}`}>
                <tr>
                  <td className="py-2">{entry.rank}</td>
                  <td className="py-2">{entry.name}</td>
                  <td className="py-2">{entry.country}</td>
                  <td className="py-2 text-center">{laneA ? (laneA.time_ms! / 1000).toFixed(2) : '-'}</td>
                  <td className="py-2 text-center">{laneB ? (laneB.time_ms! / 1000).toFixed(2) : '-'}</td>
                  <td className="py-2">{entry.score ?? '-'}</td>
                </tr>
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

/**
 * Speed – visual bracket diagram for finals
 */
const SpeedFinalBracket = ({ ranking }: { ranking: SimpleRankingEntry[] }) => {
  /**
   * Build a map: stageName → array of heats → array of athletes
   * Keeps insertion order for stages (1/8 → 1/4 → 1/2 → Final)
   */
  const stageData = useMemo(() => {
    type Match = { heatId: number; athletes: SimpleRankingEntry[]; winnerId?: number };
    const stageMap = new Map<string, Map<number, Match>>();

    ranking.forEach((ath) => {
      ath.elimination_stages?.forEach((es: any) => {
        if (!stageMap.has(es.name)) stageMap.set(es.name, new Map());
        const heatMap = stageMap.get(es.name)!;
        if (!heatMap.has(es.heat_id)) {
          heatMap.set(es.heat_id, { heatId: es.heat_id, athletes: [] });
        }
        const match = heatMap.get(es.heat_id)!;
        match.athletes.push(ath);
        if (es.winner === 1) match.winnerId = ath.athlete_id;
      });
    });

    // Sort stages using typical order
    const order = ['1/8', '1/4', '1/2', 'Final'];
    const orderedStages = Array.from(stageMap.entries()).sort(
      (a, b) => order.indexOf(a[0]) - order.indexOf(b[0])
    );

    return orderedStages.map(([stageName, heats]) => ({
      stageName,
      heats: Array.from(heats.values()).sort((a, b) => a.heatId - b.heatId),
    }));
  }, [ranking]);

  if (stageData.length === 0) {
    return (
      <div className="text-gray-500 italic">
        No elimination bracket data available
      </div>
    );
  }

  /**
   * Very simple CSS‑only bracket: columns for stages, boxes for athletes.
   * Lines are omitted for brevity but can be added later with ::before /
   * ::after connectors.
   */
  return (
    <div className="overflow-x-auto">
      <div className="flex gap-6">
        {stageData.map(({ stageName, heats }) => (
          <div key={stageName} className="flex flex-col items-center">
            <h4 className="mb-2 text-xs font-semibold">{stageName}</h4>
            {heats.map((match, i) => (
              <div key={i} className="flex flex-col items-center mb-6 relative">
                {/* Vertical connector */}
                {match.athletes.length > 1 && (
                  <div
                    className="absolute left-1/2 top-0 h-full -translate-x-1/2 border-l-2 border-gray-500 z-[-1]"
                  />
                )}
                {match.athletes.map((ath, idx) => (
                  <div
                    key={ath.athlete_id}
                    className={`relative z-10 mb-1 w-36 rounded border px-2 py-1 text-center text-[10px] leading-tight ${
                      match.winnerId === ath.athlete_id
                        ? 'bg-green-100 font-semibold'
                        : 'bg-white'
                    }`}
                  >
                    {ath.name}
                    {/* Horizontal connector for the first athlete (to the right) */}
                    {idx === 0 && (
                      <div className="absolute right-[-20px] top-1/2 w-5 border-t-2 border-gray-500 z-[-1]" />
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Extract per‑round ranking from the monolithic result payload.
 */
const getRoundRanking = (ranking: RankingEntry[], roundId: number) => {
  return (
    ranking
      .map((ath) => {
        const round = ath.rounds.find((r) => r.category_round_id === roundId);
        if (!round) return null;
        return {
          athlete_id: ath.athlete_id,
          name: ath.name,
          country: ath.country,
          rank: round.rank,
          score: round.score ?? '-',
          starting_group: (round as any).starting_group ?? null,
          ascents: round.ascents ?? [],
          elimination_stages: (round as any).speed_elimination_stages ?? [],
        };
      })
      .filter(Boolean) as SimpleRankingEntry[]
  ).sort((a, b) => {
    // Place null/undefined ranks at the bottom
    if (a.rank === null || a.rank === undefined) return 1;
    if (b.rank === null || b.rank === undefined) return -1;
    return Number(a.rank) - Number(b.rank);
  });
};

const Results = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { id, cid } = useParams();
  
  // State for API data and UI
  const [results, setResults] = useState<FullResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eventName, setEventName] = useState<string>("");

  // State for the analytics modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalRanking, setModalRanking] = useState<SimpleRankingEntry[]>([]);
  const [modalTitle, setModalTitle] = useState("");
  
  // Track which category‑rounds have analytics open
  const [analyticsOpen, setAnalyticsOpen] = useState<Record<number, boolean>>({});
  const toggleAnalytics = (roundId: number) =>
    setAnalyticsOpen((prev) => ({ ...prev, [roundId]: !prev[roundId] }));
  const [bracketView, setBracketView] = useState<Record<number, boolean>>({});
  const toggleBracket = (roundId: number) =>
    setBracketView((prev) => ({ ...prev, [roundId]: !prev[roundId] }));

  // Open analytics modal with specific ranking data
  const openAnalyticsModal = (ranking: SimpleRankingEntry[], title: string) => {
    setModalRanking(ranking);
    setModalTitle(title);
    setModalOpen(true);
  };

  useEffect(() => {
    if (id) {
      fetchResultData();
    }
  }, [id, cid]);

  // Fetch result data based on the id
  const fetchResultData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (id) {
        const data = await resultsApi.fetchResultById(id);
        setResults(data.results || []);
        if (data.results && data.results.length > 0) {
          setEventName(data.results[0].event || "Event Results");
        } else {
          setResults([]);
          toast.error("No results found for this event");
        }
      }
    } catch (error) {
      const errorMessage = `Failed to fetch result: ${error instanceof Error ? error.message : String(error)}`;
      setError(errorMessage);
      toast.error(errorMessage);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // If auth is loading, show loading state
  if (loading) {
    return <div>Checking authentication...</div>;
  }
  
  // If not authenticated, redirect or show message
  if (!user) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Not Authenticated</h1>
        <p className="mb-4">You need to be logged in to access this page.</p>
        <button 
          onClick={() => navigate('/login')}
          className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
        >
          Go to Login
        </button>
      </div>
    );
  }

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (results.length === 0) return <div className="text-gray-500">No results found</div>;

  const defaultIndex = cid ? results.findIndex(result => result.dcat?.toString() === cid) : 0;

  return (
    <div className="h-full md:h-auto overflow-y-auto">
      <h1 className="text-2xl font-bold">{eventName}</h1>

      {/* Analytics Modal */}
      <AnalyticsModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        ranking={modalRanking}
        title={modalTitle}
      />

      {results.length > 0 ? (
        <TabGroup defaultIndex={defaultIndex !== -1 ? defaultIndex : 0}>
          <TabList className="flex space-x-1 rounded-xl bg-gray-400/40 p-1 mt-4">
            {results.map((result) => (
              <Tab
                key={result._id}
                className={({ selected }) =>
                  `w-full rounded-lg py-2.5 text-sm font-medium leading-5 text-black ${
                    selected
                      ? "bg-white shadow"
                      : "text-gray-600 hover:bg-white/[0.12] hover:text-white"
                  }`
                }
              >
                {result.dcat} {result.status === "finished" && '🏆'}
              </Tab>
            ))}
          </TabList>
          <TabPanels className="mt-2">
            {results.map((result) => (
              <TabPanel
                key={result._id}
                className="h-fit rounded-xl bg-white p-3"
              >
                <div className="h-max md:h-auto">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-medium">Round Results</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            Status:{' '}
            <span
              className={
                result.status === 'finished'
                  ? 'text-green-600 font-medium'
                  : ''
              }
            >
              {result.status}
            </span>
          </span>
          <span className="text-sm text-gray-500">
            Updated: {new Date(result.ranking_as_of).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* SECOND‑LEVEL TABS FOR QUALI / SEMI / FINAL */}
      <TabGroup>
        <TabList className="flex space-x-1 rounded-xl bg-gray-200/60 p-1 mb-2">
          {result.category_rounds.map((cr) => (
            <Tab
              key={cr.category_round_id}
              className={({ selected }) =>
                `w-full rounded-lg py-2 text-xs sm:text-sm font-medium ${
                  selected ? 'bg-white shadow' : 'hover:bg-white/[0.12]'
                }`
              }
            >
              {cr.name}
            </Tab>
          ))}
        </TabList>
        <TabPanels>
          {result.category_rounds.map((cr) => {
            const roundRanking = getRoundRanking(
              result.ranking,
              cr.category_round_id
            );
            const groups =
              cr.starting_groups && cr.starting_groups.length > 0
                ? cr.starting_groups.map((g: { name: string }) => g.name)
                : [];
            const groupTabs = groups.length > 0 ? ['Overall', ...groups] : [];
            return (
              <TabPanel key={cr.category_round_id}>
                {/* Bracket and analytics buttons */}
                <div className="flex justify-end gap-2 mb-2">
                  {cr.kind === 'speed' && cr.name.toLowerCase().includes('final') && (
                    <button
                      onClick={() => toggleBracket(cr.category_round_id)}
                      className="rounded bg-gray-100 p-1 text-sm hover:bg-gray-200"
                    >
                      {bracketView[cr.category_round_id] ? 'Show Table' : 'Show Bracket'}
                    </button>
                  )}
                  <button
                    onClick={() =>
                      openAnalyticsModal(
                        groupTabs.length > 0
                          ? roundRanking
                          : roundRanking,
                        `${cr.kind.toUpperCase()}: ${cr.name}`
                      )
                    }
                    className="rounded bg-gray-100 p-1 text-sm hover:bg-gray-200"
                  >
                    Show Analytics
                  </button>
                </div>
                {groups.length > 0 ? (
                  <TabGroup>
                    <TabList className="mb-2 flex space-x-1 rounded bg-gray-100 p-1">
                      {groupTabs.map((g) => (
                        <Tab
                          key={g}
                          className={({ selected }) =>
                            `w-full rounded-lg py-1 text-xs sm:text-sm font-medium ${
                              selected ? 'bg-white shadow' : 'hover:bg-white/[0.12]'
                            }`
                          }
                        >
                          {g}
                        </Tab>
                      ))}
                    </TabList>
                    <TabPanels>
                      {groupTabs.map((g) => {
                        const groupRanking =
                          g === 'Overall'
                            ? roundRanking
                            : roundRanking.filter((r) => r.starting_group === g);
                        return (
                          <TabPanel key={g}>
                            {/* Bracket and analytics buttons for group */}
                            <div className="flex justify-end gap-2 mb-2">
                              {cr.kind === 'speed' && cr.name.toLowerCase().includes('final') && (
                                <button
                                  onClick={() => toggleBracket(cr.category_round_id)}
                                  className="rounded bg-gray-100 p-1 text-sm hover:bg-gray-200"
                                >
                                  {bracketView[cr.category_round_id] ? 'Show Table' : 'Show Bracket'}
                                </button>
                              )}
                              <button
                                onClick={() =>
                                  openAnalyticsModal(
                                    groupRanking,
                                    `${cr.kind.toUpperCase()}: ${cr.name}${g ? ` - ${g}` : ''}`
                                  )
                                }
                                className="rounded bg-gray-100 p-1 text-sm hover:bg-gray-200"
                              >
                                Show Analytics
                              </button>
                            </div>
                            {/* Render discipline‑specific table or bracket */}
                            {(() => {
                              if (cr.kind === 'lead') {
                                return cr.name.toLowerCase().includes('qualification') ? (
                                  <LeadQualificationTable ranking={groupRanking} />
                                ) : (
                                  <RankingTable ranking={groupRanking} />
                                );
                              }
                              if (cr.kind === 'speed') {
                                // Qualification
                                if (cr.name.toLowerCase().includes('qualification')) {
                                  return <SpeedQualificationTable ranking={groupRanking} />;
                                }
                                // Final (allow bracket toggle)
                                if (cr.name.toLowerCase().includes('final')) {
                                  return bracketView[cr.category_round_id] ? (
                                    <SpeedFinalBracket ranking={groupRanking} />
                                  ) : (
                                    <RankingTable ranking={groupRanking} />
                                  );
                                }
                              }
                              // Fallback
                              return <RankingTable ranking={groupRanking} />;
                            })()}
                          </TabPanel>
                        );
                      })}
                    </TabPanels>
                  </TabGroup>
                ) : (
                  (() => {
                    const groupRanking = roundRanking;
                    return (
                      <>
                        {/* Bracket and analytics buttons for no-group */}
                        {/* Already rendered above */}
                        {/* Render discipline‑specific table or bracket */}
                        {(() => {
                          if (cr.kind === 'lead') {
                            return cr.name.toLowerCase().includes('qualification') ? (
                              <LeadQualificationTable ranking={groupRanking} />
                            ) : (
                              <RankingTable ranking={groupRanking} />
                            );
                          }
                          if (cr.kind === 'speed') {
                            // Qualification
                            if (cr.name.toLowerCase().includes('qualification')) {
                              return <SpeedQualificationTable ranking={groupRanking} />;
                            }
                            // Final (allow bracket toggle)
                            if (cr.name.toLowerCase().includes('final')) {
                              return bracketView[cr.category_round_id] ? (
                                <SpeedFinalBracket ranking={groupRanking} />
                              ) : (
                                <RankingTable ranking={groupRanking} />
                              );
                            }
                          }
                          // Fallback
                          return <RankingTable ranking={groupRanking} />;
                        })()}
                      </>
                    );
                  })()
                )}
              </TabPanel>
            );
          })}
        </TabPanels>
      </TabGroup>
    </div>
              </TabPanel>
            ))}
          </TabPanels>
        </TabGroup>
      ) : (
        <div className="text-gray-500 mt-4">No results found for this event</div>
      )}
    </div>
  );
};

export default Results; 