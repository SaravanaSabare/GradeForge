import { useState, useMemo } from 'react';
import { Search, Loader2, Users } from 'lucide-react';
import SMProfileCard from './SMProfileCard';

interface DiscoverUser {
    id: string;
    name: string;
    department_name: string;
    year: number;
    cgpa: number;
    total_credits: number;
}

interface Props {
    users: DiscoverUser[];
    loading: boolean;
    sentIds: Set<string>;
    acceptedIds: Set<string>;
    onConnect: (user: DiscoverUser) => void;
}

export default function SMBrowseGrid({ users, loading, sentIds, acceptedIds, onConnect }: Props) {
    const [search, setSearch] = useState('');
    const [yearFilter, setYearFilter] = useState<string>('');
    const [minCgpa, setMinCgpa] = useState<string>('');

    const filtered = useMemo(() => {
        return users.filter(u => {
            if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.department_name.toLowerCase().includes(search.toLowerCase())) return false;
            if (yearFilter && String(u.year) !== yearFilter) return false;
            if (minCgpa && u.cgpa < parseFloat(minCgpa)) return false;
            return true;
        });
    }, [users, search, yearFilter, minCgpa]);

    return (
        <div>
            {/* Filter bar */}
            <div className="glass-panel" style={{ padding: '14px 16px', marginBottom: 20, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                {/* Search */}
                <div style={{ position: 'relative', flex: '1 1 160px', minWidth: 0 }}>
                    <Search size={14} color="#475569" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                    <input
                        type="text"
                        className="input-glass"
                        placeholder="Search name or dept…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ paddingLeft: 34, width: '100%', fontSize: 13 }}
                    />
                </div>

                {/* Year */}
                <select
                    className="input-glass"
                    value={yearFilter}
                    onChange={e => setYearFilter(e.target.value)}
                    style={{ flex: '0 0 110px', fontSize: 13 }}
                >
                    <option value="">All years</option>
                    <option value="1">Year 1</option>
                    <option value="2">Year 2</option>
                    <option value="3">Year 3</option>
                    <option value="4">Year 4</option>
                </select>

                {/* Min CGPA */}
                <select
                    className="input-glass"
                    value={minCgpa}
                    onChange={e => setMinCgpa(e.target.value)}
                    style={{ flex: '0 0 130px', fontSize: 13 }}
                >
                    <option value="">Any CGPA</option>
                    <option value="9">9.0+</option>
                    <option value="8">8.0+</option>
                    <option value="7">7.0+</option>
                    <option value="6">6.0+</option>
                </select>
            </div>

            {/* Grid */}
            {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 260, gap: 12, color: '#64748b' }}>
                    <Loader2 size={20} className="animate-spin" />
                    Finding study partners…
                </div>
            ) : filtered.length === 0 ? (
                <div className="glass-panel" style={{ padding: '48px 24px', textAlign: 'center' }}>
                    <Users size={32} color="#334155" style={{ marginBottom: 12, display: 'block', margin: '0 auto 12px' }} />
                    <p style={{ fontWeight: 600, fontSize: 16, marginBottom: 6 }}>
                        {users.length === 0 ? 'No students to browse' : 'No results'}
                    </p>
                    <p style={{ fontSize: 13, color: '#64748b' }}>
                        {users.length === 0
                            ? 'Check back later — new study partners join every day.'
                            : 'Try adjusting your filters.'}
                    </p>
                </div>
            ) : (
                <>
                    <p style={{ fontSize: 12, color: '#475569', marginBottom: 14 }}>
                        {filtered.length} student{filtered.length !== 1 ? 's' : ''} found
                    </p>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
                        gap: 16,
                    }}>
                        {filtered.map(u => (
                            <SMProfileCard
                                key={u.id}
                                name={u.name}
                                department_name={u.department_name}
                                year={u.year}
                                cgpa={u.cgpa}
                                total_credits={u.total_credits}
                                connectionStatus={
                                    acceptedIds.has(u.id)
                                        ? 'accepted'
                                        : sentIds.has(u.id)
                                        ? 'pending_sent'
                                        : 'none'
                                }
                                onConnect={() => onConnect(u)}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
