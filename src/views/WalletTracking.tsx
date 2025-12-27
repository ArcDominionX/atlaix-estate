
import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, ChevronUp, Zap, ArrowLeft, RefreshCw, ArrowUpRight, ArrowDownLeft, Repeat, CheckCircle, AlertTriangle, Globe } from 'lucide-react';
import { ChainRouter, PortfolioData } from '../services/ChainRouter';

declare var ApexCharts: any;

interface WalletData {
    id: number;
    addr: string;
    tag: string;
    bal: string;
    pnl: string;
    win: string;
    tokens: number;
    time: string;
    type: string;
}

export const WalletTracking: React.FC = () => {
    const [viewMode, setViewMode] = useState<'dashboard' | 'profile'>('dashboard');
    const [selectedWallet, setSelectedWallet] = useState<WalletData | null>(null);
    const [activeFilter, setActiveFilter] = useState<string | null>(null);
    const [walletType, setWalletType] = useState('Smart Money');
    const [chain, setChain] = useState('All Chains');
    const [searchQuery, setSearchQuery] = useState('');
    
    const [loading, setLoading] = useState(false);
    const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
    const [visibleCount, setVisibleCount] = useState(8);
    const [showDust, setShowDust] = useState(false);
    
    const netWorthChartRef = useRef<HTMLDivElement>(null);
    const chartInstance = useRef<any>(null);
    const buttonRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

    const toggleFilter = (name: string) => setActiveFilter(activeFilter === name ? null : name);
    
    const openWallet = (w: WalletData) => { 
        setSelectedWallet(w); 
        setViewMode('profile'); 
        setShowDust(false); // Reset dust toggle when opening new wallet
    };

    const handleTrack = () => {
        if (!searchQuery.trim()) return;
        const searchedWallet: WalletData = {
            id: Date.now(),
            addr: searchQuery,
            tag: 'Unknown',
            bal: 'Loading...',
            pnl: 'N/A',
            win: 'N/A',
            tokens: 0,
            time: 'Just now',
            type: 'smart'
        };
        openWallet(searchedWallet);
        setSearchQuery('');
    };

    const getDropdownStyle = (key: string) => {
        const button = buttonRefs.current[key];
        if (!button) return {};
        const rect = button.getBoundingClientRect();
        return {
            position: 'fixed' as const,
            top: `${rect.bottom + 8}px`,
            left: `${rect.left}px`,
            zIndex: 9999,
            minWidth: `${rect.width}px`
        };
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (activeFilter) {
                const target = event.target as Element;
                if (!target.closest('.filter-wrapper') && !target.closest('.filter-popup')) {
                    setActiveFilter(null);
                }
            }
        };
        const handleScroll = () => { if (activeFilter) setActiveFilter(null); };
        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('scroll', handleScroll, true);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [activeFilter]);

    useEffect(() => {
        const fetchData = async () => {
            if (viewMode === 'profile' && selectedWallet) {
                setLoading(true);
                try {
                    const targetChain = chain === 'All Chains' ? 'Ethereum' : chain;
                    const data = await ChainRouter.fetchPortfolio(targetChain, selectedWallet.addr);
                    setPortfolioData(data);
                } catch (e) {
                    console.error("Failed to fetch wallet data", e);
                } finally {
                    setLoading(false);
                }
            }
        };
        fetchData();
    }, [viewMode, selectedWallet, chain]); 

    useEffect(() => {
        if (viewMode === 'profile' && netWorthChartRef.current && typeof ApexCharts !== 'undefined' && !loading) {
            // NOTE: This chart data is currently static because we don't have historical net worth API.
            // Leaving it as visual placeholder, but ideally this should also be N/A if no history exists.
            const options = {
                series: [{ name: 'Net Worth', data: [0, 0, 0, 0, 0, 0, 0, 0] }], // Reset to zero/flat to avoid fake data
                chart: { type: 'area', height: 280, background: 'transparent', toolbar: { show: false }, zoom: { enabled: false } },
                colors: ['#26D356'],
                fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05, stops: [0, 100] } },
                stroke: { curve: 'smooth', width: 2 },
                dataLabels: { enabled: false },
                xaxis: { categories: [], labels: { style: { colors: '#8F96A3', fontFamily: 'Inter', fontSize: '11px' } }, axisBorder: { show: false }, axisTicks: { show: false } },
                yaxis: { labels: { style: { colors: '#8F96A3', fontFamily: 'Inter', fontSize: '11px' }, formatter: (val: number) => `$${val}` } },
                grid: { borderColor: '#2A2E33', strokeDashArray: 4 },
                theme: { mode: 'dark' },
                tooltip: { theme: 'dark' },
                noData: { text: 'History N/A', style: { color: '#8F96A3' } }
            };
            if (chartInstance.current) { chartInstance.current.destroy(); }
            chartInstance.current = new ApexCharts(netWorthChartRef.current, options);
            chartInstance.current.render();
        }
        return () => { if (chartInstance.current) { chartInstance.current.destroy(); chartInstance.current = null; } };
    }, [viewMode, loading]);

    const wallets: WalletData[] = [
        { id: 1, addr: '0x7180...e68', tag: 'Whale', bal: '$4.53M', pnl: '+25.1%', win: '59%', tokens: 12, time: '1m ago', type: 'whale' },
        { id: 2, addr: '0x02f7...94e6', tag: 'Smart Money', bal: '$4.46M', pnl: '+8.8%', win: '59%', tokens: 23, time: '5m ago', type: 'smart' },
        { id: 3, addr: '0x33b1...e8fh', tag: 'Smart Money', bal: '$2.85M', pnl: '+57%', win: '55%', tokens: 5, time: '10m ago', type: 'smart' },
        { id: 4, addr: '0x2381...294b', tag: 'Sniper', bal: '$1.83M', pnl: '+0.1%', win: '61%', tokens: 291, time: '10h ago', type: 'sniper' },
        { id: 5, addr: '0x8Sc1...mvz', tag: 'Early Buyer', bal: '$3.52M', pnl: '+120%', win: '70%', tokens: 4, time: '1h ago', type: 'smart' },
        { id: 6, addr: '0x54Cha...205fc', tag: 'Sniper', bal: '$13.6M', pnl: '-2.4%', win: '45%', tokens: 150, time: '3d ago', type: 'sniper' },
        { id: 7, addr: '0x99a2...k12z', tag: 'Whale', bal: '$8.2M', pnl: '+12.4%', win: '62%', tokens: 8, time: '4h ago', type: 'whale' },
        { id: 8, addr: '0x11b3...x99p', tag: 'Smart Money', bal: '$1.1M', pnl: '+45.2%', win: '78%', tokens: 15, time: '6h ago', type: 'smart' },
    ];

    const chainOptions = [
        { name: 'All Chains', icon: <Globe size={16} /> },
        { name: 'Ethereum', icon: 'https://cryptologos.cc/logos/ethereum-eth-logo.png' },
        { name: 'Solana', icon: 'https://cryptologos.cc/logos/solana-sol-logo.png' },
        { name: 'BSC', icon: 'https://cryptologos.cc/logos/bnb-bnb-logo.png' },
        { name: 'Base', icon: 'https://avatars.githubusercontent.com/u/108554348?s=200&v=4' },
        { name: 'Arbitrum', icon: 'https://cryptologos.cc/logos/arbitrum-arb-logo.png' },
        { name: 'Polygon', icon: 'https://cryptologos.cc/logos/polygon-matic-logo.png' },
        { name: 'Avalanche', icon: 'https://cryptologos.cc/logos/avalanche-avax-logo.png' },
    ];

    if (viewMode === 'dashboard') {
        return (
            <div className="flex flex-col gap-6 h-full">
                <div className="flex justify-between items-center mb-1">
                    <h1 className="text-2xl font-bold">Wallet Tracking</h1>
                </div>

                <div className="w-full min-w-0">
                    <div className="flex w-full gap-3 mb-6">
                        <div className="flex-1 bg-[#111315] border border-border rounded-lg flex items-center px-4 py-3 shadow-sm transition-all focus-within:border-primary-green/50">
                            <Search size={18} className="text-text-medium mr-2" />
                            <input type="text" placeholder="Search wallet address (e.g. 0x... or specific Solana address)" className="bg-transparent border-none text-text-light outline-none w-full font-mono text-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleTrack()} />
                        </div>
                        <button className="bg-primary-green text-main px-8 rounded-lg font-bold hover:bg-primary-green-darker transition-colors whitespace-nowrap text-sm shadow-md flex items-center justify-center" onClick={handleTrack}>Track</button>
                    </div>

                    <div className="flex flex-col gap-2 mb-6">
                        <div className="flex gap-3 items-center overflow-x-auto custom-scrollbar pb-3 px-1">
                            <div className="filter-wrapper relative flex-shrink-0">
                                <div className={`filter-pill ${activeFilter === 'chain' ? 'active' : ''}`} onClick={() => toggleFilter('chain')} ref={el => (buttonRefs.current['chain'] = el)}>
                                    {chain} <ChevronDown size={14} />
                                </div>
                                {activeFilter === 'chain' && (
                                    <div className="filter-popup" style={getDropdownStyle('chain')}>
                                        {['All Chains', 'Solana', 'Ethereum', 'BSC', 'Avalanche', 'Base', 'Polygon'].map(c => (
                                            <div key={c} className="filter-list-item" onClick={() => {setChain(c); setActiveFilter(null)}}>{c}</div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="filter-wrapper relative flex-shrink-0">
                                <div className={`filter-pill ${activeFilter === 'type' ? 'active' : ''}`} onClick={() => toggleFilter('type')} ref={el => (buttonRefs.current['type'] = el)}>
                                    {walletType} <ChevronDown size={14} />
                                </div>
                                {activeFilter === 'type' && (
                                    <div className="filter-popup" style={getDropdownStyle('type')}>
                                        {['All Types', 'Smart Money', 'Whale', 'Sniper'].map(t => (
                                            <div key={t} className="filter-list-item" onClick={() => {setWalletType(t); setActiveFilter(null)}}>{t}</div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
                        {wallets.slice(0, visibleCount).map(w => (
                            <div key={w.id} className="bg-card border border-border rounded-xl p-5 hover:border-text-dark transition-colors flex flex-col">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 bg-[#2A2E33] rounded-full"></div>
                                        <div className="font-mono text-sm font-semibold">{w.addr}</div>
                                    </div>
                                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${w.type === 'whale' ? 'bg-[#2F80ED]/10 text-[#2F80ED]' : w.type === 'smart' ? 'bg-primary-green/10 text-primary-green' : 'bg-primary-red/10 text-primary-red'}`}>{w.tag}</span>
                                </div>
                                <div className="mb-4">
                                    <div className="text-[10px] text-text-medium mb-1 font-medium uppercase tracking-wide">Total Portfolio Value</div>
                                    <div className="text-2xl font-bold">{w.bal}</div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mb-5">
                                    <div><div className="text-[10px] text-text-dark mb-0.5 font-medium">30d PnL %</div><div className={`font-bold text-sm ${w.pnl.includes('+') ? 'text-primary-green' : ''}`}>{w.pnl}</div></div>
                                    <div><div className="text-[10px] text-text-dark mb-0.5 font-medium">Win Rate %</div><div className="font-bold text-sm">{w.win}</div></div>
                                    <div><div className="text-[10px] text-text-dark mb-0.5 font-medium">% Tokens Held</div><div className="font-bold text-sm">45% Top 3</div></div>
                                    <div><div className="text-[10px] text-text-dark mb-0.5 font-medium">Last Activity</div><div className="font-medium text-sm">{w.time}</div></div>
                                </div>
                                <div className="flex gap-3 mt-auto">
                                    <button className="flex-1 py-2 border border-border rounded-lg text-[10px] font-bold hover:bg-card-hover hover:text-text-light transition-all uppercase tracking-wide" onClick={() => openWallet(w)}>View Wallet</button>
                                    <button className="flex-1 py-2 border border-border rounded-lg text-[10px] font-bold hover:bg-card-hover hover:text-text-light transition-all uppercase tracking-wide">Set Alerts</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (viewMode === 'profile') {
        const allAssets = portfolioData?.assets || [];
        const highValueAssets = allAssets.filter(a => a.rawValue >= 1);
        const dustAssets = allAssets.filter(a => a.rawValue < 1);
        
        const displayAssets = showDust ? allAssets : highValueAssets;
        
        // If no high value assets but we have dust, show dust or an empty state prompting to see dust
        const hasHiddenDust = dustAssets.length > 0 && !showDust;

        return (
            <div className="flex flex-col gap-6 animate-fade-in">
                <div className="flex items-center gap-2 text-text-medium hover:text-text-light cursor-pointer mb-2 w-fit transition-colors font-medium text-sm" onClick={() => setViewMode('dashboard')}>
                    <ArrowLeft size={18} /> Back to Dashboard
                </div>
                
                <div className="bg-main border border-border rounded-xl p-6 flex flex-col md:flex-col items-start gap-4">
                    <div>
                        <h2 className="text-xl font-bold mb-1">Wallet Tracking Dashboard</h2>
                        <p className="text-text-medium text-sm">Monitor on-chain activity of any wallet address</p>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 w-full overflow-x-auto pb-1">
                        {chainOptions.map((c) => (
                            <button 
                                key={c.name}
                                onClick={() => setChain(c.name)}
                                className={`
                                    flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all border shrink-0
                                    ${chain === c.name 
                                        ? 'bg-card border-text-light text-text-light shadow-[0_0_10px_rgba(0,0,0,0.2)]' 
                                        : 'bg-transparent border-transparent text-text-medium hover:bg-card-hover hover:text-text-light'
                                    }
                                `}
                            >
                                {typeof c.icon === 'string' ? (
                                    <img src={c.icon} alt={c.name} className="w-4 h-4 rounded-full object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
                                ) : (
                                    c.icon
                                )}
                                {c.name}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center min-h-[400px]">
                        <RefreshCw className="animate-spin text-primary-green mb-4" size={32} />
                        <div className="text-lg font-bold">Querying Data...</div>
                        <div className="text-sm text-text-medium">Fetching real-time on-chain portfolio balance</div>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div className="flex items-center gap-4">
                                <div className="text-xl md:text-3xl font-bold font-mono truncate max-w-[200px] md:max-w-none">{selectedWallet?.addr}</div>
                                <span className={`text-xs px-3 py-1 rounded font-bold uppercase ${selectedWallet?.type === 'whale' ? 'bg-[#2F80ED]/10 text-[#2F80ED] border border-[#2F80ED]/30' : selectedWallet?.type === 'smart' ? 'bg-primary-green/10 text-primary-green border border-primary-green/30' : 'bg-primary-red/10 text-primary-red border border-primary-red/30'}`}>{selectedWallet?.tag}</span>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-card border border-border rounded-xl p-5 text-center">
                                <h5 className="text-text-medium text-[10px] font-bold uppercase tracking-wide mb-1">Total Net Worth</h5>
                                <p className="text-text-light font-bold text-lg">{portfolioData?.netWorth || 'N/A'}</p>
                            </div>
                            <div className="bg-card border border-border rounded-xl p-5 text-center">
                                <h5 className="text-text-medium text-[10px] font-bold uppercase tracking-wide mb-1">Active Assets</h5>
                                <p className="text-text-light font-bold text-lg">{portfolioData?.assets.length || 0}</p>
                            </div>
                            <div className="bg-card border border-border rounded-xl p-5 text-center">
                                <h5 className="text-text-medium text-[10px] font-bold uppercase tracking-wide mb-1">Profitable Trades</h5>
                                <p className="text-text-light font-bold text-lg">N/A</p>
                            </div>
                            <div className="bg-card border border-border rounded-xl p-5 text-center">
                                <h5 className="text-text-medium text-[10px] font-bold uppercase tracking-wide mb-1">Avg Hold Time</h5>
                                <p className="text-text-light font-bold text-lg">N/A</p>
                            </div>
                        </div>

                        <div className="bg-card border border-border rounded-xl p-6">
                            <h3 className="card-title text-base">Net Worth Performance (History N/A)</h3>
                            <div ref={netWorthChartRef} className="w-full min-h-[260px]"></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            <div className="bg-card border border-border rounded-xl p-6 flex flex-col">
                                <h3 className="card-title text-base">Portfolio Breakdown</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead>
                                            <tr className="border-b border-border text-text-dark text-[10px] font-bold uppercase tracking-wide">
                                                <th className="pb-3 font-bold">Asset</th>
                                                <th className="pb-3 font-bold">Balance</th>
                                                <th className="pb-3 font-bold">Value</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {portfolioData?.assets.length === 0 && (
                                                <tr><td colSpan={3} className="py-4 text-center text-text-medium text-xs">No assets found</td></tr>
                                            )}
                                            {displayAssets.map((p, i) => (
                                                <tr key={i} className="border-b border-border last:border-0 hover:bg-card-hover/50 transition-colors">
                                                    <td className="py-3 font-bold flex items-center gap-2">
                                                        <img src={p.logo} className="w-6 h-6 rounded-full" onError={(e) => e.currentTarget.src='https://via.placeholder.com/24'} /> {p.symbol}
                                                    </td>
                                                    <td className="py-3 text-text-medium font-medium">{p.balance}</td>
                                                    <td className="py-3 text-text-light font-bold">{p.value}</td>
                                                </tr>
                                            ))}
                                            {dustAssets.length > 0 && (
                                                <tr>
                                                    <td colSpan={3} className="py-3 text-center border-t border-border/50">
                                                        <button 
                                                            onClick={() => setShowDust(!showDust)}
                                                            className="text-xs font-bold text-text-medium hover:text-text-light flex items-center justify-center gap-1 w-full py-1 transition-colors"
                                                        >
                                                            {showDust ? (
                                                                <>Show Less <ChevronUp size={14} /></>
                                                            ) : (
                                                                <>See {dustAssets.length} &lt;$1 Tokens <ChevronDown size={14} /></>
                                                            )}
                                                        </button>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            
                            <div className="bg-card border border-border rounded-xl p-6 flex flex-col">
                                <h3 className="card-title text-base">Recent Activity</h3>
                                <div className="flex flex-col">
                                    {(!portfolioData?.recentActivity || portfolioData.recentActivity.length === 0) && (
                                        <div className="flex flex-col items-center justify-center py-8 text-text-medium opacity-70">
                                            <AlertTriangle size={24} className="mb-2" />
                                            <span className="text-xs">No activity found</span>
                                        </div>
                                    )}
                                    {portfolioData?.recentActivity.map((act, i) => (
                                        <div key={i} className="flex gap-4 py-4 border-b border-border last:border-0">
                                            <div className="w-10 h-10 bg-main rounded-full flex items-center justify-center text-primary-green shrink-0"><Zap size={20} /></div>
                                            <div className="flex-1">
                                                <div className="flex justify-between mb-1">
                                                    <span className="font-bold text-primary-green text-sm">{act.type}</span>
                                                    <span className="text-[10px] text-text-dark font-medium">{act.time}</span>
                                                </div>
                                                <div className="text-xs text-text-medium font-medium">{act.desc}</div>
                                                <div className="text-[10px] text-primary-blue mt-1 font-mono">{act.hash}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-card border border-border rounded-xl p-6 flex flex-col">
                                <h3 className="card-title text-base">Recent Transactions</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left border-separate border-spacing-y-2">
                                        <thead>
                                            <tr className="text-text-dark text-[10px] font-bold uppercase tracking-wide">
                                                <th className="pb-1">Type</th>
                                                <th className="pb-1">Hash</th>
                                                <th className="pb-1">Value</th>
                                                <th className="pb-1">Time</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td colSpan={4} className="text-center py-6 text-text-medium text-xs font-medium">
                                                    N/A - Transaction history not available
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        );
    }

    return null;
};
