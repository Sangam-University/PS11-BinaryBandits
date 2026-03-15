import { useEffect, useState, useMemo } from "react";
import { useBountyStore } from "../../store/useBountyStore";
import { useAuthStore } from "../../store/useAuthStore";
import { Hexagon, Clock, MapPin, ArrowRight, Filter, Sparkles, Loader2 } from "lucide-react";
import type { Bounty } from "../../services/api";
import { formatTimeRemaining, aiGetMatchPercentage } from "../../services/api";

import { Button } from "../../components/ui/button";
import { BiddingModal, getCategoryColor } from "./BiddingModal";

const CATEGORIES = ["All", "Design", "Development", "Writing", "Social Media", "Video/Animation", "Marketing", "Miscellaneous"];

export default function JobBoard() {
    const { bounties, isLoading, loadBounties, placeBid } = useBountyStore();
    const { user } = useAuthStore();

    // Filtering State
    const [selectedCategory, setSelectedCategory] = useState("All");

    // Modal State
    const [selectedBounty, setSelectedBounty] = useState<Bounty | null>(null);
    const [selectedTheme, setSelectedTheme] = useState<{ bg: string, text: string } | null>(null);
    const [isBiddingModalOpen, setIsBiddingModalOpen] = useState(false);

    // Match % State
    const [matchResults, setMatchResults] = useState<Record<string, { percentage: number; reason: string }>>({});
    const [matchLoading, setMatchLoading] = useState<Record<string, boolean>>({});
    const [matchErrors, setMatchErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        loadBounties();
    }, [loadBounties]);

    const handleOpenBidModal = (bounty: Bounty) => {
        setSelectedBounty(bounty);
        setSelectedTheme({ bg: getCategoryColor(bounty.category ?? "Miscellaneous"), text: 'text-black' });
        setIsBiddingModalOpen(true);
    };

    const handleBidSubmit = async (bountyId: string, bidData: { bidPrice: number; message?: string }) => {
        if (!user) return;
        await placeBid(bountyId, bidData);
        setIsBiddingModalOpen(false);
    };

    const handleMatchPercentage = async (e: React.MouseEvent, bountyId: string) => {
        e.stopPropagation();
        if (matchResults[bountyId] || matchLoading[bountyId]) return;
        setMatchLoading(prev => ({ ...prev, [bountyId]: true }));
        setMatchErrors(prev => ({ ...prev, [bountyId]: "" }));
        try {
            const result = await aiGetMatchPercentage(bountyId);
            setMatchResults(prev => ({ ...prev, [bountyId]: result }));
        } catch (err: any) {
            console.error('Match % failed:', err);
            setMatchErrors(prev => ({ ...prev, [bountyId]: err?.response?.data?.error || "Failed. Try again." }));
        } finally {
            setMatchLoading(prev => ({ ...prev, [bountyId]: false }));
        }
    };

    // Derived State
    const availableBounties = useMemo(() => {
        return bounties.filter(b => {
            const isAvailable = (b.status === "OPEN" || b.status === "BIDDING") && !b.bids.some(bid => bid.studentId === user?.id);
            const notExpired = b.deadline ? new Date(b.deadline) > new Date(new Date().setHours(0,0,0,0) - 86400000) : true; 
            const categoryMatch = selectedCategory === "All" || b.category === selectedCategory;
            return isAvailable && notExpired && categoryMatch;
        }).sort((a, b) => b.bids.length - a.bids.length);
    }, [bounties, user, selectedCategory]);

    return (
        <div className="w-full min-h-full flex flex-col pt-8 md:pt-12 px-6 md:px-12 animate-in fade-in slide-in-from-bottom-8 duration-700 max-w-[1400px] mx-auto pb-0">

            {/* Coucher Massive Header Section */}
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 pb-0 border-b border-white/40 pt-0">
                <div className="max-w-4xl">
                    <h1 className="text-5xl md:text-[80px] text-white mb-8 uppercase leading-[0.9] tracking-tight">
                        FREELANCE<br />
                        MISSIONS
                    </h1>
                </div>
            </div>

            {/* Filters Section */}
            <div className="flex flex-wrap items-center gap-4 my-8">
                <div className="filter-pill flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] rounded-full border border-[#333333]">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Filter By Niche:</span>
                </div>
                <div className="filter-pill flex flex-wrap gap-2">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-4 py-2 rounded-full text-sm font-bold transition-all uppercase tracking-wider ${selectedCategory === cat
                                ? 'bg-white text-black scale-105 shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                                : 'bg-[#111111] text-gray-400 border border-[#333333] hover:border-gray-500 hover:text-white'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Interactive Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading && bounties.length === 0 ? (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center">
                        <Hexagon className="w-16 h-16 text-[#FF5E00] animate-spin-slow opacity-20" />
                        <div className="mt-6 text-xl font-bold text-gray-500 uppercase tracking-widest">Scanning Network...</div>
                    </div>
                ) : availableBounties.length > 0 ? (
                    availableBounties.map((bounty) => {
                        const bgColor = getCategoryColor(bounty.category ?? "Miscellaneous");

                        return (
                            <div
                                key={bounty.id}
                                onClick={() => handleOpenBidModal(bounty)}
                                className="group relative rounded-[40px] overflow-hidden cursor-pointer transition-transform hover:-translate-y-2 duration-500 flex flex-col h-full text-black p-8 md:p-10 min-h-[400px] shadow-2xl"
                                style={{ backgroundColor: bgColor }}
                            >
                                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                                <div className="flex justify-between items-center mb-6">
                                    <span className="text-sm font-bold tracking-wide uppercase leading-snug text-black">
                                        {bounty.category}
                                    </span>
                                    <span className="text-xs font-bold tracking-wider px-4 py-2 rounded-full bg-black/10 uppercase text-black">
                                        {bounty.status}
                                    </span>
                                </div>

                                <h3 className="text-2xl md:text-3xl font-bold leading-tight mb-6 tracking-tight line-clamp-2 text-black">
                                    {bounty.title}
                                </h3>
                                <p className="text-sm font-medium opacity-60 mb-auto line-clamp-3 leading-relaxed text-black">
                                    {bounty.description}
                                </p>

                                <div className="flex items-center justify-between text-sm font-bold border-t border-black/10 pt-6 pb-4 mt-6 text-black">
                                    <div className="flex items-center">
                                        <Clock className="w-4 h-4 mr-2" />
                                        <span>{formatTimeRemaining(bounty.deadline)} LEFT</span>
                                    </div>
                                    <div className="flex items-center">
                                        <MapPin className="w-4 h-4 mr-2" />
                                        <span className="uppercase">Remote</span>
                                    </div>
                                </div>

                                {/* AI Match % Button */}
                                <div className="pb-4">
                                    {matchResults[bounty.id] ? (
                                        <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-black text-white" title={matchResults[bounty.id].reason}>
                                            <Sparkles className="w-3.5 h-3.5" />
                                            <span className="text-xs font-bold uppercase tracking-wider">{matchResults[bounty.id].percentage}% Match</span>
                                            <span className="text-[9px] opacity-60 truncate flex-1">{matchResults[bounty.id].reason}</span>
                                        </div>
                                    ) : matchErrors[bounty.id] ? (
                                        <button
                                            onClick={(e) => { setMatchErrors(prev => ({ ...prev, [bounty.id]: "" })); handleMatchPercentage(e, bounty.id); }}
                                            className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all bg-red-500/20 text-red-800 hover:bg-red-500/30"
                                        >
                                            <Sparkles className="w-3.5 h-3.5" />
                                            {matchErrors[bounty.id]} — Tap to retry
                                        </button>
                                    ) : (
                                        <button
                                            onClick={(e) => handleMatchPercentage(e, bounty.id)}
                                            disabled={matchLoading[bounty.id]}
                                            className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all bg-black/10 hover:bg-black hover:text-white text-black disabled:opacity-50"
                                        >
                                            {matchLoading[bounty.id] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                                            {matchLoading[bounty.id] ? "Calculating..." : "See Match %"}
                                        </button>
                                    )}
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-3xl md:text-4xl font-bold tracking-tight text-black">
                                            ₹{bounty.price.toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 group-hover:translate-x-2 border border-black text-black group-hover:bg-black group-hover:text-white">
                                        <ArrowRight className="w-6 h-6" />
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="col-span-full py-32 flex flex-col items-center justify-center bg-[#111111] rounded-[40px] border border-[#333333]">
                        <MapPin className="w-16 h-16 text-gray-600 mb-6" />
                        <h3 className="text-3xl font-black text-white uppercase tracking-tight mb-2">No Active Missions</h3>
                        <p className="text-gray-400 font-medium">Try adjusting your filters or check back later.</p>
                        {selectedCategory !== 'All' && (
                            <Button onClick={() => setSelectedCategory('All')} className="mt-6 rounded-xl bg-white text-black hover:bg-gray-200 font-bold px-8">
                                CLEAR FILTERS
                            </Button>
                        )}
                    </div>
                )}
            </div>

            <BiddingModal
                bounty={selectedBounty}
                theme={selectedTheme}
                isOpen={isBiddingModalOpen}
                onClose={() => setIsBiddingModalOpen(false)}
                onSubmitBid={handleBidSubmit}
                isLoading={isLoading}
            />
        </div>
    );
}
