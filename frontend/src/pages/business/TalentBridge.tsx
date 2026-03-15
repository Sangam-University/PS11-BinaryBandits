import { useEffect, useState } from "react";
import { useBountyStore } from "../../store/useBountyStore";
import { Plus, Briefcase, Clock, CheckCircle2, AlertCircle, ArrowUpRight, MessageSquare, Send, ShieldCheck, RotateCcw, Star, DollarSign, FileText, Filter, Timer, TrendingUp, Sparkles, Loader2 } from "lucide-react";
import { getCategoryColor } from "../junior-pro/BiddingModal";
import { ConfirmDialog } from "../../components/ui/confirm-dialog";
import { ImageUpload } from "../../components/ui/image-upload";
import { SubmissionModal } from "../../components/ui/submission-modal";
import { formatTimeRemaining } from "../../services/api";

import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "../../components/ui/dialog";

import { Calendar } from "../../components/ui/calendar";
import { fetchUsersByIds, fetchCompanyProfile, aiFindBestMatch } from "../../services/api";
import type { User, CompanyProfile } from "../../services/api";


function StarRating({ rating, onRate, interactive = false, size = 20 }: { rating: number; onRate?: (r: number) => void; interactive?: boolean; size?: number }) {
    const [hover, setHover] = useState(0);
    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    className={`transition-all ${interactive ? 'cursor-pointer hover:scale-110' : ''}`}
                    style={{ width: size, height: size }}
                    fill={(interactive ? hover || rating : rating) >= star ? "#F59E0B" : "none"}
                    stroke={(interactive ? hover || rating : rating) >= star ? "#F59E0B" : "#D1D5DB"}
                    strokeWidth={1.5}
                    onMouseEnter={() => interactive && setHover(star)}
                    onMouseLeave={() => interactive && setHover(0)}
                    onClick={() => interactive && onRate?.(star)}
                />
            ))}
        </div>
    );
}

type FilterKey = "ALL" | "OPEN" | "IN_PROGRESS" | "REVIEW" | "COMPLETED";

export default function TalentBridge() {
    const { bounties, isLoading, loadBounties, createNewBounty, requestRevision, approveSubmission, leaveReview, awardBid, founderCounterOffer, requestPoc } = useBountyStore();
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Filter state
    const [activeFilter, setActiveFilter] = useState<FilterKey>("ALL");

    // Form State
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState<"Design" | "Development" | "Writing" | "Social Media" | "Video/Animation" | "Marketing" | "Miscellaneous">("Miscellaneous");
    const [price, setPrice] = useState("");
    const [date, setDate] = useState<Date | undefined>(new Date());

    // AI Best Match State
    const [bestMatchResult, setBestMatchResult] = useState<Record<string, { rankings: Array<{ studentId: string; percentage: number; reason: string }>; bestMatchId: string }>>({});
    const [bestMatchLoading, setBestMatchLoading] = useState<Record<string, boolean>>({});

    // Review Room State
    const [revisionModalBountyId, setRevisionModalBountyId] = useState<string | null>(null);
    const [revisionMessage, setRevisionMessage] = useState("");
    const [revisionScreenshotUrl, setRevisionScreenshotUrl] = useState<string | null>(null);

    // Review Form State
    const [reviewBountyId, setReviewBountyId] = useState<string | null>(null);
    const [reviewRating, setReviewRating] = useState(0);
    const [reviewComment, setReviewComment] = useState("");
    const [reviewScreenshotUrl, setReviewScreenshotUrl] = useState<string | null>(null);

    // Detail Expansion State
    const [expandedBountyId, setExpandedBountyId] = useState<string | null>(null);

    // Counter Offer State (Founder side)
    const [counterOfferBidKey, setCounterOfferBidKey] = useState<string | null>(null);
    const [counterOfferPrice, setCounterOfferPrice] = useState("");
    const [counterOfferMsg, setCounterOfferMsg] = useState("");

    // Student Profile Modal State
    const [profileModalStudentId, setProfileModalStudentId] = useState<string | null>(null);
    const [studentProfiles, setStudentProfiles] = useState<Record<string, User>>({});
    const [profileModalData, setProfileModalData] = useState<CompanyProfile | null>(null);
    const [profileModalLoading, setProfileModalLoading] = useState(false);

    // Confirmation Dialog State
    const [confirmAction, setConfirmAction] = useState<{
        type: "award" | "approve";
        bountyId: string;
        studentId?: string;
        studentName?: string;
        price?: number;
    } | null>(null);

    useEffect(() => {
        loadBounties();
    }, [loadBounties]);

    useEffect(() => {
        // Fetch real student profiles for any bidder IDs we have in the bounties list.
        const bidderIds = Array.from(new Set(bounties.flatMap(b => b.bids.map(bid => bid.studentId))));
        if (bidderIds.length === 0) return;

        fetchUsersByIds(bidderIds)
            .then((users) => {
                const map: Record<string, User> = {};
                users.forEach((user) => {
                    map[user.id] = user;
                });
                setStudentProfiles(map);
            })
            .catch(() => {
                // Ignore - we'll fall back to the mock profile generator
            });
    }, [bounties]);

    useEffect(() => {
        if (!profileModalStudentId) {
            setProfileModalData(null);
            return;
        }
        setProfileModalLoading(true);
        fetchCompanyProfile(profileModalStudentId)
            .then(data => setProfileModalData(data))
            .catch(() => setProfileModalData(null))
            .finally(() => setProfileModalLoading(false));
    }, [profileModalStudentId]);

    const handlePostBounty = async (e: React.FormEvent) => {
        e.preventDefault();
        // date validation: prevent past dates (already solved gracefully by calendar disablement but check here too)
        if (!title || !price || !date || !description) return;
        if (date < new Date(new Date().setHours(0,0,0,0))) {
             alert('Deadline cannot be in the past');
             return;
        }

        await createNewBounty({
            title,
            description,
            price: Number(price),
            deadline: date.toISOString(),
            category,
        } as any);

        setIsModalOpen(false);
        setTitle("");
        setDescription("");
        setCategory("Miscellaneous");
        setPrice("");
    };

    const handleRequestRevision = () => {
        if (!revisionModalBountyId || !revisionMessage.trim()) return;
        requestRevision(revisionModalBountyId, revisionMessage, revisionScreenshotUrl || undefined);
        setRevisionModalBountyId(null);
        setRevisionMessage("");
        setRevisionScreenshotUrl(null);
    };

    const handleLeaveReview = () => {
        if (!reviewBountyId || reviewRating === 0) return;
        leaveReview(reviewBountyId, reviewRating, reviewComment, reviewScreenshotUrl || undefined);
        setReviewBountyId(null);
        setReviewRating(0);
        setReviewComment("");
        setReviewScreenshotUrl(null);
    };

    const handleFounderCounterOffer = (bountyId: string, studentId: string) => {
        if (!counterOfferPrice || !counterOfferMsg.trim()) return;
        founderCounterOffer(bountyId, studentId, Number(counterOfferPrice), counterOfferMsg);
        setCounterOfferBidKey(null);
        setCounterOfferPrice("");
        setCounterOfferMsg("");
    };

    const getStatusColor = (_status: string) => {
        return 'text-black bg-black/10 border-black/10';
    };

    // Stats
    const openCount = bounties.filter(b => b.status === "BIDDING").length;
    const inProgressCount = bounties.filter(b => b.status === "IN_PROGRESS").length;
    const inReviewCount = bounties.filter(b => b.status === "REVIEW").length;
    const completedCount = bounties.filter(b => b.status === "COMPLETED").length;
    const totalEscrow = bounties.filter(b => b.status !== "COMPLETED").reduce((sum, b) => sum + b.price, 0);

    // Filtered bounties
    const filteredBounties = bounties.filter(b => {
        if (activeFilter === "ALL") return b.status !== "COMPLETED"; // don't show completed in ALL
        if (activeFilter === "OPEN") return b.status === "BIDDING";
        if (activeFilter === "IN_PROGRESS") return b.status === "IN_PROGRESS";
        if (activeFilter === "REVIEW") return b.status === "REVIEW";
        if (activeFilter === "COMPLETED") return b.status === "COMPLETED";
        return true;
    }).sort((a, b) => b.bids.length - a.bids.length);

    const filterOptions: { key: FilterKey; label: string; count: number }[] = [
        { key: "ALL", label: "ALL BOUNTIES", count: bounties.length },
        { key: "OPEN", label: "OPEN", count: openCount },
        { key: "IN_PROGRESS", label: "IN PROGRESS", count: inProgressCount },
        { key: "REVIEW", label: "IN REVIEW", count: inReviewCount },
        { key: "COMPLETED", label: "COMPLETED", count: completedCount },
    ];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 p-4 md:p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-4xl md:text-5xl font-normal tracking-tight text-foreground mb-5">Talent Bridge</h1>
                    <p className="text-slate-500 text-sm font-medium">
                        Post bounties, review bids, manage project lifecycle
                    </p>
                </div>

                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogTrigger className="bg-[#356DDA] hover:bg-[#2563EB] text-white rounded-full px-8 py-6 font-bold shadow-lg flex items-center shrink-0 transition-all hover:shadow-xl hover:scale-[1.02] cursor-pointer">
                        <Plus className="w-5 h-5 mr-2" />
                        Post New Bounty
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px] border-none rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Create a Bounty</DialogTitle>
                            <DialogDescription>
                                Describe the task and set a budget. Junior Pros will submit varying bids.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handlePostBounty} className="space-y-6 pt-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Project Title</label>
                                <Input
                                    required
                                    placeholder="e.g. Build React Dashboard for Inventory"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="focus-visible:ring-primary/50 border-slate-200"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Project Description</label>
                                <Textarea
                                    required
                                    placeholder="Describe the requirements..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="focus-visible:ring-primary/50 border-slate-200 resize-none min-h-[100px]"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Category</label>
                                <select 
                                    className="w-full flex h-10 w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-primary/50"
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value as any)}
                                    required
                                >
                                    <option value="Miscellaneous">Miscellaneous</option>
                                    <option value="Design">Design</option>
                                    <option value="Development">Development</option>
                                    <option value="Writing">Writing</option>
                                    <option value="Social Media">Social Media</option>
                                    <option value="Video/Animation">Video/Animation</option>
                                    <option value="Marketing">Marketing</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Budget (₹)</label>
                                    <Input
                                        required
                                        type="number"
                                        min="100"
                                        placeholder="e.g. 3500"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        className="focus-visible:ring-primary/50 border-slate-200"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700 flex items-center">
                                        <Clock className="w-4 h-4 mr-1 text-slate-400" /> Deadline
                                    </label>
                                    <div className="border border-slate-200 rounded-md p-2 bg-slate-50/50">
                                        <Calendar
                                            mode="single"
                                            selected={date}
                                            onSelect={setDate}
                                            disabled={(d) => d < new Date(new Date().setHours(0,0,0,0))}
                                            className="rounded-md mx-auto"
                                        />
                                    </div>
                                </div>
                            </div>
                            <DialogFooter className="pt-4 border-t border-slate-100 mt-6">
                                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                                <Button type="submit" disabled={isLoading} className="bg-[#356DDA] hover:bg-[#3f6212] text-white rounded-xl">
                                    {isLoading ? "Posting..." : "Post Bounty"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                    { label: "Open", count: openCount, icon: Briefcase, color: "text-blue-600", bg: "bg-blue-50" },
                    { label: "In Progress", count: inProgressCount, icon: Clock, color: "text-emerald-600", bg: "bg-emerald-50" },
                    { label: "In Review", count: inReviewCount, icon: FileText, color: "text-amber-600", bg: "bg-amber-50" },
                    { label: "Completed", count: completedCount, icon: CheckCircle2, color: "text-slate-600", bg: "bg-slate-100" },
                    { label: "Escrow", count: null, icon: DollarSign, color: "text-green-700", bg: "bg-green-50", value: `₹${totalEscrow.toLocaleString()}` },
                ].map((stat) => (
                    <div key={stat.label} className="bg-card rounded-[20px] p-4 border border-slate-100/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                        <div className="flex items-center gap-2 mb-2">
                            <div className={`w-8 h-8 rounded-full ${stat.bg} flex items-center justify-center`}>
                                <stat.icon className={`w-4 h-4 ${stat.color}`} />
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{stat.label}</span>
                        </div>
                        <p className={`text-2xl font-black tracking-tight ${stat.color}`}>
                            {stat.value ?? stat.count}
                        </p>
                    </div>
                ))}
            </div>

            {/* Filter Pills - matching junior pro style but adapted for light theme */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full border border-slate-200">
                    <Filter className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Filter:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                    {filterOptions.map(({ key, label, count }) => (
                        <button
                            key={key}
                            onClick={() => setActiveFilter(key)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all uppercase tracking-wider ${activeFilter === key
                                ? 'bg-[#356DDA] text-white shadow-md scale-105'
                                : 'bg-card text-slate-500 border border-slate-200 hover:border-slate-400 hover:text-slate-700'
                                }`}
                        >
                            {label}
                            {count > 0 && (
                                <span className={`ml-1.5 text-[10px] ${activeFilter === key ? 'text-white/60' : 'text-slate-400'}`}>
                                    {count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Bounty Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBounties.map((bounty) => {
                    const bgColor = getCategoryColor(bounty.category ?? "Miscellaneous");

                    return (
                        <div
                            key={bounty.id}
                            className="bg-card rounded-[24px] border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 overflow-hidden flex flex-col h-full"
                        >
                            <div className="p-5 md:p-6 flex flex-col h-full">
                                <div className="flex justify-between items-center mb-3">
                                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${getStatusColor(bounty.status || 'OPEN')}`}>
                                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: bgColor }} />
                                        {bounty.status ? bounty.status.replace(/_/g, ' ') : 'OPEN'}
                                    </span>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{bounty.category}</span>
                                </div>

                                <h3 className="text-lg font-bold leading-tight tracking-tight text-slate-900 mb-2 line-clamp-2">
                                    {bounty.title}
                                </h3>

                                <p className="text-sm text-slate-500 mb-4 line-clamp-2 leading-relaxed flex-grow mb-auto">
                                    {bounty.description}
                                </p>

                                <div className="flex flex-col mt-auto">
                                    <div className="flex items-center justify-between text-sm font-bold border-t border-slate-100 pt-4 mt-2">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center text-slate-400">
                                            <Timer className="w-3.5 h-3.5 mr-1" />
                                            <span className="text-xs">{formatTimeRemaining(bounty.deadline)}</span>
                                        </div>
                                        {bounty.bids.length > 0 && (
                                            <span className="px-2.5 py-0.5 bg-slate-100 rounded-full text-[10px] font-bold text-slate-500">
                                                {bounty.bids.length} BID{bounty.bids.length !== 1 ? 'S' : ''}
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-xl font-black tracking-tight text-slate-900">₹{bounty.price.toLocaleString()}</span>
                                </div>

                                    <button
                                        onClick={() => setExpandedBountyId(bounty.id)}
                                        className="w-full mt-5 flex items-center justify-center gap-2 px-4 py-4 rounded-full text-xs font-bold uppercase tracking-widest transition-all hover:scale-[1.02]"
                                        style={{ backgroundColor: "#111111", color: '#ffffff' }}
                                    >
                                        View Details
                                        <ArrowUpRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ===== DIALOG FOR EXPANDED BOUNTY ===== */}
            <Dialog open={!!expandedBountyId} onOpenChange={(open) => !open && setExpandedBountyId(null)}>
                <DialogContent className="p-0 border-none shadow-2xl w-[95vw] max-w-6xl rounded-[24px] overflow-hidden bg-transparent [&>button]:hidden">
                    {(() => {
                        const bounty = bounties.find(b => b.id === expandedBountyId);
                        if (!bounty) return null;
                        const bgColor = getCategoryColor(bounty.category ?? "Miscellaneous");
                        const isInReview = bounty.status === "REVIEW";
                        const isRevisionRequested = bounty.status === "REVISION_REQUESTED";
                        const isCompleted = bounty.status === "COMPLETED";

                        return (
                            <div className="flex flex-col lg:flex-row bg-white w-full max-h-[90vh]">
                                {/* Left — Colored Summary Panel */}
                                <div
                                    className="lg:w-[45%] p-6 md:p-8 flex flex-col justify-between text-black overflow-y-auto"
                                    style={{ backgroundColor: bgColor }}
                                >
                                    <div>
                                        <div className="flex justify-between items-start mb-4">
                                            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-black/10">
                                                <span className="w-2 h-2 rounded-full bg-black" />
                                                {bounty.status ? bounty.status.replace(/_/g, ' ') : 'OPEN'}
                                            </span>
                                            <span className="text-xs font-bold uppercase tracking-widest text-black/50">{bounty.category}</span>
                                        </div>

                                        <h3 className="text-2xl md:text-3xl font-bold leading-tight tracking-tight mb-4">
                                            {bounty.title}
                                        </h3>
                                        <p className="text-sm font-medium text-black/60 leading-relaxed mb-6">
                                            {bounty.description}
                                        </p>
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between text-sm font-bold border-t border-black/10 pt-5 mb-4">
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center">
                                                    <Timer className="w-4 h-4 mr-1.5" />
                                                    <span>{formatTimeRemaining(bounty.deadline)} LEFT</span>
                                                </div>
                                                {bounty.bids.length > 0 && (
                                                    <span className="px-3 py-1 bg-black/10 rounded-full text-xs font-bold">
                                                        {bounty.bids.length} BID{bounty.bids.length !== 1 ? 'S' : ''}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-2xl md:text-3xl font-bold tracking-tight">₹{bounty.price.toLocaleString()}</span>
                                        </div>

                                        <button
                                            onClick={() => setExpandedBountyId(null)}
                                            className="flex items-center justify-center w-full gap-2 px-5 py-4 rounded-full bg-black text-white text-sm font-bold uppercase tracking-widest hover:bg-black/80 transition-all hover:scale-[1.02]"
                                        >
                                            Close Details
                                            <ArrowUpRight className="w-4 h-4 rotate-90 transition-transform" />
                                        </button>
                                    </div>
                                </div>

                                {/* Right — White Details Panel */}
                                <div className="lg:w-[55%] bg-white p-6 md:p-8 space-y-4 overflow-y-auto max-h-[90vh]" style={{ scrollbarWidth: 'thin' }}>

                                    {/* Submitted Work — See Submission button */}
                                    {(bounty.submissionLink || bounty.submissionScreenshotUrl) && (
                                        <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                            <SubmissionModal
                                                submissionLink={bounty.submissionLink}
                                                submissionScreenshotUrl={bounty.submissionScreenshotUrl}
                                                title="Student's Submission"
                                            />
                                        </div>
                                    )}

                                    {/* Feedback History Timeline */}
                                    {bounty.feedbackHistory.length > 0 && (
                                        <div className="space-y-3">
                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                                <MessageSquare className="w-3.5 h-3.5" /> Feedback Timeline
                                            </h4>
                                            <div className="space-y-2 pl-4 border-l-2 border-slate-200">
                                                {bounty.feedbackHistory.map((fb) => (
                                                    <div key={fb.id} className={`p-3.5 rounded-xl ${fb.sender === 'founder' ? 'bg-orange-50 border border-orange-100' : 'bg-blue-50 border border-blue-100'}`}>
                                                        <div className="flex items-center gap-2 mb-1.5">
                                                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${fb.sender === 'founder' ? 'bg-orange-200 text-orange-800' : 'bg-blue-200 text-blue-800'}`}>
                                                                {fb.sender === 'founder' ? 'You' : 'Student'}
                                                            </span>
                                                            <span className="text-[10px] text-slate-400 font-medium">{new Date(fb.timestamp).toLocaleString()}</span>
                                                        </div>
                                                        <p className="text-sm text-slate-700 font-medium">{fb.message}</p>
                                                        {fb.screenshotUrl && (
                                                            <div className="mt-2 rounded-xl overflow-hidden border border-slate-200 max-w-md">
                                                                <img src={fb.screenshotUrl} alt="Feedback screenshot" className="w-full h-auto" />
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Bids / Proposals with Counter Offer */}
                                    {bounty.bids.length > 0 && (
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Proposals ({bounty.bids.length})</p>
                                                {bounty.bids.length >= 1 && (bounty.status === "OPEN" || bounty.status === "BIDDING") && (
                                                    bestMatchResult[bounty.id] ? (
                                                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#356DDA] text-white text-[10px] font-bold uppercase tracking-wider">
                                                            <Sparkles className="w-3 h-3" />
                                                            AI Ranked
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={async () => {
                                                                setBestMatchLoading(prev => ({ ...prev, [bounty.id]: true }));
                                                                try {
                                                                    const res = await aiFindBestMatch(bounty.id);
                                                                    setBestMatchResult(prev => ({ ...prev, [bounty.id]: res }));
                                                                } catch (err) {
                                                                    console.error('Best match failed:', err);
                                                                } finally {
                                                                    setBestMatchLoading(prev => ({ ...prev, [bounty.id]: false }));
                                                                }
                                                            }}
                                                            disabled={bestMatchLoading[bounty.id]}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all bg-[#356DDA] text-white hover:bg-[#2563EB] disabled:opacity-50"
                                                        >
                                                            {bestMatchLoading[bounty.id] ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                                            {bestMatchLoading[bounty.id] ? "Analyzing..." : "Find Best Match"}
                                                        </button>
                                                    )
                                                )}
                                            </div>
                                            {bounty.bids.map((bid) => {
                                                const bidKey = `${bounty.id}__${bid.studentId}`;
                                                const isCounterOfferOpen = counterOfferBidKey === bidKey;
                                                const hasCounterOffer = !!bid.counterOfferPrice;
                                                const profile = studentProfiles[bid.studentId];
                                                const bidName = profile?.name ?? bid.studentName ?? 'Student';
                                                const bidAvatar = profile?.avatarUrl ?? bid.studentAvatarUrl;

                                                return (
                                                    <div key={bid.studentId} className={`p-4 rounded-xl border space-y-3 ${bestMatchResult[bounty.id]?.bestMatchId === bid.studentId ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200' : 'bg-slate-50 border-slate-100'}`}>
                                                        {/* Best Match Badge */}
                                                        {bestMatchResult[bounty.id]?.bestMatchId === bid.studentId && (
                                                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#356DDA] text-white text-[10px] font-bold uppercase tracking-wider w-fit">
                                                                <Sparkles className="w-3 h-3" />
                                                                Best Match
                                                            </div>
                                                        )}
                                                        {/* Bid info row */}
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                {bidAvatar ? (
                                                                    <img src={bidAvatar} alt={bidName} className="w-10 h-10 rounded-full bg-slate-200 border border-slate-200 object-cover shrink-0" />
                                                                ) : (
                                                                    <div className="w-10 h-10 rounded-full bg-slate-200 border border-slate-200 flex items-center justify-center shrink-0">
                                                                        <span className="text-sm font-bold text-slate-500 uppercase">{bidName.substring(0, 2)}</span>
                                                                    </div>
                                                                )}
                                                                <div>
                                                                    <p className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                                                        {bidName}
                                                                        <button
                                                                            onClick={() => setProfileModalStudentId(bid.studentId)}
                                                                            className="text-[10px] text-blue-600 hover:text-blue-800 hover:underline cursor-pointer bg-blue-50 px-2 py-0.5 rounded-full"
                                                                        >
                                                                            View Profile
                                                                        </button>
                                                                    </p>
                                                                    <p className="text-xs text-slate-500 line-clamp-1">{bid.message}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                {bestMatchResult[bounty.id]?.rankings?.find(r => r.studentId === bid.studentId) && (
                                                                    <div className="text-center px-3 py-1 bg-blue-50 rounded-lg" title={bestMatchResult[bounty.id].rankings.find(r => r.studentId === bid.studentId)?.reason}>
                                                                        <p className="text-[9px] font-bold text-blue-500 uppercase tracking-widest">AI Match</p>
                                                                        <p className="text-base font-black text-blue-600">{bestMatchResult[bounty.id].rankings.find(r => r.studentId === bid.studentId)?.percentage}%</p>
                                                                    </div>
                                                                )}
                                                                <div className="text-center px-3 py-1 bg-emerald-50 rounded-lg">
                                                                    <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Score</p>
                                                                    <p className="text-base font-black text-emerald-600">{bid.score || 'N/A'}</p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Bid</p>
                                                                    <p className="text-lg font-black text-slate-900">₹{bid.bidPrice.toLocaleString()}</p>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Counter offer already sent indicator */}
                                                        {hasCounterOffer && (
                                                            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className="text-[9px] font-black uppercase tracking-widest text-amber-700 bg-amber-200 px-2 py-0.5 rounded-full">Your Counter-Offer</span>
                                                                    <span className="text-lg font-black text-amber-800">₹{bid.counterOfferPrice?.toLocaleString()}</span>
                                                                </div>
                                                                <p className="text-xs text-amber-700 italic border-l-2 border-amber-300 pl-2">"{bid.counterOfferMessage}"</p>
                                                                <p className="text-[10px] text-amber-500 mt-1 font-medium">Waiting for student's response...</p>
                                                            </div>
                                                        )}

                                                        {/* Counter offer form */}
                                                        {isCounterOfferOpen && (
                                                            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 space-y-2">
                                                                <p className="text-xs font-bold text-blue-700 uppercase tracking-widest">Counter Offer</p>
                                                                <Input
                                                                    type="number"
                                                                    placeholder="Your price (₹)"
                                                                    value={counterOfferPrice}
                                                                    onChange={e => setCounterOfferPrice(e.target.value)}
                                                                    className="h-9 text-sm border-blue-200 bg-card"
                                                                />
                                                                <Textarea
                                                                    placeholder="Message to student..."
                                                                    value={counterOfferMsg}
                                                                    onChange={e => setCounterOfferMsg(e.target.value)}
                                                                    className="text-sm border-blue-200 bg-card resize-none min-h-[60px]"
                                                                />
                                                                <div className="flex gap-2">
                                                                    <Button
                                                                        onClick={() => handleFounderCounterOffer(bounty.id, bid.studentId)}
                                                                        disabled={!counterOfferPrice || !counterOfferMsg.trim()}
                                                                        className="flex-1 bg-[#356DDA] hover:bg-[#2563EB] text-white rounded-lg text-xs font-bold h-8"
                                                                    >
                                                                        <Send className="w-3 h-3 mr-1.5" /> Send Counter
                                                                    </Button>
                                                                    <Button
                                                                        variant="outline"
                                                                        onClick={() => { setCounterOfferBidKey(null); setCounterOfferPrice(""); setCounterOfferMsg(""); }}
                                                                        className="rounded-lg text-xs font-bold h-8 border-blue-200"
                                                                    >
                                                                        Cancel
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Action buttons for open bounties */}
                                                        {(bounty.status === "OPEN" || bounty.status === "BIDDING") && !isCounterOfferOpen && !bid.pocRequested && (
                                                            <div className="flex gap-2 pt-1">
                                                                <Button
                                                                    onClick={() => setConfirmAction({ type: "award", bountyId: bounty.id, studentId: bid.studentId, studentName: bidName })}
                                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-5 py-2 text-xs font-bold shadow-sm"
                                                                >
                                                                    Award
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    onClick={() => requestPoc(bounty.id, bid.studentId)}
                                                                    className="border-purple-200 text-purple-600 hover:bg-purple-50 rounded-full px-5 py-2 text-xs font-bold"
                                                                >
                                                                    Request POC
                                                                </Button>
                                                                {!hasCounterOffer && (
                                                                    <Button
                                                                        variant="outline"
                                                                        onClick={() => {
                                                                            setCounterOfferBidKey(bidKey);
                                                                            setCounterOfferPrice(bounty.price.toString());
                                                                            setCounterOfferMsg("");
                                                                        }}
                                                                        className="border-slate-200 text-slate-600 hover:bg-slate-50 rounded-full px-5 py-2 text-xs font-bold"
                                                                    >
                                                                        Counter Offer
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* POC Details */}
                                                        {bid.pocRequested && bounty.status !== "IN_PROGRESS" && (
                                                            <div className={`p-4 rounded-xl border ${bid.pocStatus === 'SUBMITTED' ? 'bg-purple-50 border-purple-200' : 'bg-slate-50 border-slate-200'}`}>
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${
                                                                        bid.pocStatus === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                                                                        bid.pocStatus === 'ACCEPTED' ? 'bg-blue-100 text-blue-700' :
                                                                        bid.pocStatus === 'DECLINED' ? 'bg-red-100 text-red-700' :
                                                                        'bg-purple-200 text-purple-800'
                                                                    }`}>
                                                                        POC {bid.pocStatus}
                                                                    </span>
                                                                </div>
                                                                
                                                                {bid.pocStatus === 'PENDING' && (
                                                                    <p className="text-xs text-slate-500 font-medium">Waiting for the Junior Pro to accept your Proof of Concept request...</p>
                                                                )}
                                                                
                                                                {bid.pocStatus === 'ACCEPTED' && (
                                                                    <p className="text-xs text-blue-600 font-medium">The Junior Pro accepted the POC request and is currently working on it.</p>
                                                                )}
                                                                
                                                                {bid.pocStatus === 'DECLINED' && (
                                                                    <p className="text-xs text-red-600 font-medium">The Junior Pro respectfully declined to provide a Proof of Concept.</p>
                                                                )}

                                                                {bid.pocStatus === 'SUBMITTED' && (
                                                                    <div className="space-y-3 mt-2">
                                                                        <p className="text-xs text-purple-700 font-medium">The Junior Pro has submitted their Proof of Concept! Review their work below before awarding the bid.</p>
                                                                        <SubmissionModal
                                                                            submissionLink={bid.pocSubmissionLink || ''}
                                                                            submissionScreenshotUrl={bid.pocSubmissionScreenshotUrl}
                                                                            title="POC Submission"
                                                                            triggerLabel="Review POC"
                                                                        />
                                                                        <div className="pt-2 border-t border-purple-200 mt-3">
                                                                            <Button
                                                                                onClick={() => setConfirmAction({ type: "award", bountyId: bounty.id, studentId: bid.studentId, studentName: bidName })}
                                                                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg py-2 text-xs font-bold"
                                                                            >
                                                                                <CheckCircle2 className="w-4 h-4 mr-2" /> Award Bid & Release Escrow
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                        {/* Accepted — In Progress indicator */}
                                                        {bounty.status === "IN_PROGRESS" && bounty.claimed_by === bid.studentId && (
                                                            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-200 px-2 py-0.5 rounded-full">Accepted — Work in Progress</span>
                                                                </div>
                                                                <p className="text-xs text-emerald-700 font-medium">Agreed Price: <span className="font-black text-base">₹{bid.bidPrice.toLocaleString()}</span></p>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {bounty.bids.length === 0 && (bounty.status === "OPEN" || bounty.status === "BIDDING") && (
                                        <div className="flex items-center gap-2 text-slate-400 py-2">
                                            <Clock className="w-4 h-4" />
                                            <p className="text-sm font-medium">No proposals yet — waiting for Junior Pros to bid.</p>
                                        </div>
                                    )}

                                    {/* Review actions */}
                                    {isInReview && (
                                        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100">
                                            <Button
                                                onClick={() => setConfirmAction({ type: "approve", bountyId: bounty.id, price: bounty.price })}
                                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full py-5 font-bold shadow-md hover:shadow-lg transition-all"
                                            >
                                                <ShieldCheck className="w-5 h-5 mr-2" />
                                                Approve & Release Escrow
                                            </Button>
                                            <Button
                                                onClick={() => setRevisionModalBountyId(bounty.id)}
                                                variant="outline"
                                                className="flex-1 border-orange-300 text-orange-600 hover:bg-orange-50 rounded-full py-5 font-bold transition-all"
                                            >
                                                <RotateCcw className="w-5 h-5 mr-2" />
                                                Request Changes
                                            </Button>
                                        </div>
                                    )}

                                    {isRevisionRequested && (
                                        <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-xl border border-orange-200">
                                            <RotateCcw className="w-5 h-5 text-orange-500 shrink-0" />
                                            <p className="text-sm font-bold text-orange-700">Revision requested. Awaiting student's updated submission.</p>
                                        </div>
                                    )}

                                    {isCompleted && (
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                                                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                                                <p className="text-sm font-bold text-emerald-700">Bounty approved and escrow released. Great work!</p>
                                            </div>

                                            {bounty.review ? (
                                                <div className="p-5 bg-amber-50/50 rounded-xl border border-amber-100">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                                        <p className="text-xs font-bold uppercase tracking-widest text-amber-700">Your Review</p>
                                                    </div>
                                                    <StarRating rating={bounty.review.rating} size={18} />
                                                    {bounty.review.comment && (
                                                        <p className="text-sm text-slate-700 mt-2 font-medium">"{bounty.review.comment}"</p>
                                                    )}
                                                    <p className="text-[10px] text-slate-400 mt-2">{new Date(bounty.review.timestamp).toLocaleString()}</p>
                                                </div>
                                            ) : (
                                                <div className="p-5 bg-slate-50 rounded-xl border border-slate-100">
                                                    {reviewBountyId === bounty.id ? (
                                                        <div className="space-y-4">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <Star className="w-4 h-4 text-amber-500" />
                                                                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Rate this Junior Pro</p>
                                                            </div>
                                                            <StarRating rating={reviewRating} onRate={setReviewRating} interactive size={28} />
                                                            <Textarea
                                                                placeholder="Share your experience working with this Junior Pro..."
                                                                value={reviewComment}
                                                                onChange={(e) => setReviewComment(e.target.value)}
                                                                className="resize-none min-h-[80px] border-slate-200 bg-card focus-visible:ring-amber-300"
                                                            />
                                                            <ImageUpload
                                                                value={reviewScreenshotUrl}
                                                                onImageChange={setReviewScreenshotUrl}
                                                                label="Attach Screenshot"
                                                            />
                                                            <div className="flex gap-2 justify-end pt-2">
                                                                <Button
                                                                    variant="outline"
                                                                    onClick={() => { setReviewBountyId(null); setReviewRating(0); setReviewComment(""); setReviewScreenshotUrl(null); }}
                                                                    className="rounded-full text-xs font-bold border-slate-200"
                                                                >
                                                                    Cancel
                                                                </Button>
                                                                <Button
                                                                    onClick={handleLeaveReview}
                                                                    disabled={reviewRating === 0}
                                                                    className="bg-amber-500 hover:bg-amber-600 text-white rounded-full px-6 text-xs font-bold shadow-sm"
                                                                >
                                                                    <Star className="w-3.5 h-3.5 mr-1.5" />
                                                                    Submit Review
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => setReviewBountyId(bounty.id)}
                                                            className="w-full flex items-center justify-center gap-2 py-3 text-sm font-bold text-amber-700 hover:text-amber-800 transition-colors"
                                                        >
                                                            <Star className="w-4 h-4" />
                                                            Leave a Review for this Junior Pro
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })()}
                </DialogContent>
            </Dialog>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBounties.length === 0 && !isLoading && (
                    <div className="col-span-full p-16 text-center border-2 border-dashed border-slate-200 rounded-[24px] bg-card">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            {activeFilter === "ALL" ? <Briefcase className="w-10 h-10 text-slate-300" /> : <AlertCircle className="w-10 h-10 text-slate-300" />}
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                            {activeFilter === "ALL" ? "No Bounties Posted" : `No ${activeFilter.replace(/_/g, ' ')} Bounties`}
                        </h3>
                        <p className="text-slate-500 mt-2 font-medium max-w-md mx-auto">
                            {activeFilter === "ALL"
                                ? "Post your first task and get connected with top-tier student talent immediately."
                                : "No bounties match this filter. Try a different one."}
                        </p>
                    </div>
                )}
            </div>

            {/* ===== REQUEST CHANGES MODAL ===== */}
            <Dialog open={!!revisionModalBountyId} onOpenChange={(open) => !open && setRevisionModalBountyId(null)}>
                <DialogContent className="sm:max-w-[500px] border-none rounded-2xl shadow-xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <RotateCcw className="w-5 h-5 text-orange-500" />
                            Request Changes
                        </DialogTitle>
                        <DialogDescription>
                            Describe what needs to be changed. You can attach a screenshot for clarity.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-5 pt-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Feedback Message</label>
                            <Textarea
                                required
                                placeholder="Describe the changes needed in detail..."
                                value={revisionMessage}
                                onChange={(e) => setRevisionMessage(e.target.value)}
                                className="focus-visible:ring-primary/50 border-slate-200 resize-none min-h-[120px]"
                            />
                        </div>
                        <div className="space-y-2">
                            <ImageUpload
                                value={revisionScreenshotUrl}
                                onImageChange={setRevisionScreenshotUrl}
                                label="Attach Screenshot"
                            />
                        </div>
                    </div>
                    <DialogFooter className="pt-4 border-t border-slate-100 mt-4">
                        <Button type="button" variant="outline" onClick={() => setRevisionModalBountyId(null)}>Cancel</Button>
                        <Button
                            onClick={handleRequestRevision}
                            disabled={!revisionMessage.trim()}
                            className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold"
                        >
                            <Send className="w-4 h-4 mr-2" />
                            Send Feedback
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Profile Modal */}
            <Dialog open={!!profileModalStudentId} onOpenChange={(open) => !open && setProfileModalStudentId(null)}>
                <DialogContent className="sm:max-w-[600px] border-none rounded-[24px] shadow-2xl p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
                    {profileModalLoading ? (
                        <div className="bg-white p-16 flex flex-col items-center justify-center">
                            <Briefcase className="w-10 h-10 text-slate-300 animate-pulse mb-3" />
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading Profile...</p>
                        </div>
                    ) : profileModalData ? (() => {
                        const p = profileModalData;
                        const pUser = p.user;
                        const pStats = p.stats;
                        const bannerColor = pUser.bannerColor || '#356DDA';

                        return (
                            <div className="bg-white">
                                <div className="h-32" style={{ backgroundColor: bannerColor }}></div>
                                <div className="px-8 pb-8">
                                    <div className="flex justify-between items-end -mt-12 mb-4">
                                        <div className="w-24 h-24 rounded-full border-4 border-white bg-white shadow-md overflow-hidden flex items-center justify-center shrink-0" style={{ backgroundColor: bannerColor + '30' }}>
                                            {pUser.avatarUrl ? (
                                                <img src={pUser.avatarUrl} alt={pUser.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-2xl font-bold text-slate-600 uppercase">{pUser.name?.substring(0, 2)}</span>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <div className="text-center bg-amber-50 rounded-xl px-4 py-2 border border-amber-100 shadow-sm">
                                                <div className="flex items-center gap-1 justify-center text-amber-500 mb-0.5">
                                                    <Star className="w-4 h-4 fill-amber-500" />
                                                    <span className="font-bold text-sm text-amber-700">{pStats.avgRating || '—'}</span>
                                                </div>
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700/60">Rating</p>
                                            </div>
                                            <div className="text-center bg-emerald-50 rounded-xl px-4 py-2 border border-emerald-100 shadow-sm">
                                                <div className="font-black text-lg text-emerald-600 leading-tight">{pStats.reliabilityScore}</div>
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600/60">Reliability</p>
                                            </div>
                                        </div>
                                    </div>

                                    <h2 className="text-2xl font-black text-slate-900 mb-1">{pUser.name}</h2>
                                    <p className="text-sm text-slate-500 mb-6 font-medium">{pUser.bio || 'No bio yet.'}</p>

                                    <div className="flex items-center justify-between mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Portfolio</p>
                                            {pUser.portfolioUrl ? (
                                                <a href={pUser.portfolioUrl} target="_blank" rel="noopener noreferrer"
                                                    className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                                                    {(() => { try { return new URL(pUser.portfolioUrl).hostname; } catch { return pUser.portfolioUrl; } })()}
                                                    <ArrowUpRight className="w-3 h-3" />
                                                </a>
                                            ) : (
                                                <span className="text-sm text-slate-400">No portfolio linked</span>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 text-right">Skills</p>
                                            <div className="flex flex-wrap gap-1 justify-end">
                                                {(pUser.skills || []).slice(0, 3).map(skill => (
                                                    <span key={skill} className="px-2 py-0.5 bg-[#356DDA]/10 text-[#356DDA] text-[10px] font-bold rounded-md">{skill}</span>
                                                ))}
                                                {(pUser.skills || []).length > 3 && (
                                                    <span className="px-2 py-0.5 bg-slate-200 text-slate-600 text-[10px] font-bold rounded-md">+{(pUser.skills || []).length - 3}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-3 mb-6">
                                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col items-center justify-center text-center">
                                            <TrendingUp className="w-5 h-5 text-slate-400 mb-1.5" />
                                            <span className="text-xl font-black text-slate-800 leading-none mb-1">{pStats.deadlineAdherence ?? pStats.onTimePercent ?? 0}%</span>
                                            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">On-Time</span>
                                        </div>
                                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col items-center justify-center text-center">
                                            <Clock className="w-5 h-5 text-slate-400 mb-1.5" />
                                            <span className="text-xl font-black text-slate-800 leading-none mb-1">{pStats.revisionRate ?? 0}%</span>
                                            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Revision Rate</span>
                                        </div>
                                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col items-center justify-center text-center">
                                            <Briefcase className="w-5 h-5 text-slate-400 mb-1.5" />
                                            <span className="text-xl font-black text-slate-800 leading-none mb-1">{pStats.totalMissions ?? pStats.totalDeals ?? 0}</span>
                                            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Missions Done</span>
                                        </div>
                                    </div>

                                    {/* Completed Projects with Milestones */}
                                    {p.completedProjects && p.completedProjects.length > 0 && (
                                        <div className="mb-6">
                                            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Completed Projects</h3>
                                            <div className="space-y-2">
                                                {p.completedProjects.slice(0, 4).map(proj => (
                                                    <div key={proj.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                                                        <div className="flex items-center justify-between mb-1.5">
                                                            <span className="font-bold text-sm text-slate-800 truncate flex-1 mr-2">{proj.title}</span>
                                                            {proj.rating && (
                                                                <div className="flex items-center gap-1 shrink-0">
                                                                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                                                    <span className="text-xs font-bold text-amber-700">{proj.rating}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                            <span>{proj.category}</span>
                                                            <span>·</span>
                                                            <span>₹{proj.price.toLocaleString()}</span>
                                                            {proj.milestones.length > 0 && (
                                                                <>
                                                                    <span>·</span>
                                                                    <span>{proj.milestones.filter(m => m.status === 'COMPLETED').length}/{proj.milestones.length} milestones</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Reviews */}
                                    {p.reviews && p.reviews.length > 0 && (
                                        <div className="mb-6">
                                            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Reviews ({p.reviews.length})</h3>
                                            <div className="space-y-2">
                                                {p.reviews.slice(0, 3).map(review => (
                                                    <div key={review.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-start gap-3">
                                                        <div className="flex items-center gap-1 shrink-0 mt-0.5">
                                                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                                            <span className="text-xs font-bold text-amber-700">{review.rating}/5</span>
                                                        </div>
                                                        <p className="text-xs text-slate-600 font-medium leading-relaxed">{review.comment || 'No comment'}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Skills</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {(pUser.skills || []).map(skill => (
                                                <span key={skill} className="px-3 py-1 bg-[#356DDA]/10 text-[#356DDA] text-xs font-bold rounded-full border border-[#356DDA]/20">
                                                    {skill}
                                                </span>
                                            ))}
                                            {(!pUser.skills || pUser.skills.length === 0) && (
                                                <span className="text-xs text-slate-400">No skills listed</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-8 pt-4 border-t border-slate-100 flex justify-end">
                                        <Button onClick={() => setProfileModalStudentId(null)} className="rounded-full px-6 bg-slate-900 hover:bg-slate-800 text-white font-bold">
                                            Close Profile
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        );
                    })() : profileModalStudentId ? (
                        <div className="bg-white p-16 flex flex-col items-center justify-center">
                            <p className="text-sm text-slate-400">Failed to load profile.</p>
                            <Button onClick={() => setProfileModalStudentId(null)} className="mt-4 rounded-full px-6 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs">
                                Close
                            </Button>
                        </div>
                    ) : null}
                </DialogContent>
            </Dialog>

            {/* ===== CONFIRMATION DIALOG ===== */}
            <ConfirmDialog
                open={!!confirmAction}
                onOpenChange={(open) => !open && setConfirmAction(null)}
                title={
                    confirmAction?.type === "award"
                        ? "Award Bounty?"
                        : "Approve & Release Escrow?"
                }
                description={
                    confirmAction?.type === "award"
                        ? `This will assign the project to ${confirmAction?.studentName || "this student"} and move it to In Progress. This cannot be undone.`
                        : `This will approve the submission and release ₹${confirmAction?.price?.toLocaleString() || "0"} from escrow to the student. This cannot be undone.`
                }
                confirmLabel={confirmAction?.type === "award" ? "Award Bounty" : "Approve & Release"}
                variant="default"
                icon={confirmAction?.type === "award" ? CheckCircle2 : ShieldCheck}
                onConfirm={() => {
                    if (!confirmAction) return;
                    if (confirmAction.type === "award" && confirmAction.studentId) {
                        awardBid(confirmAction.bountyId, confirmAction.studentId);
                    } else if (confirmAction.type === "approve") {
                        approveSubmission(confirmAction.bountyId);
                    }
                }}
            />
        </div>
    );
}
