import { Component, OnInit } from '@angular/core';
import { CommonService } from 'src/app/shared/services/common.service';
import { environment } from 'src/environments/environment';

type PanelStatus = 'loading' | 'ready' | 'error';

interface VideoRow {
    subCategoryName: string;
    categoryName: string;
    subCategoryImageUrl?: string;
    totalCourseMaterials: number;
    totalDuration: string;
    studentsCompletedPercentage: number;
    imageFailed?: boolean;
}

interface TrendingRow {
    courseMaterialName: string;
    subCategoryName: string;
    repeatedViews: number;
    distinctStudents: number;
}

interface ChartPoint {
    label: string;
    value: number;
}

type SortKey = 'name' | 'videos' | 'duration' | 'completed';

const CHART_W = 720;
const CHART_H = 280;
const CHART_PAD = { left: 44, right: 14, top: 12, bottom: 30 };

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
    readonly apiUrl = environment.baseUrl;
    readonly chartW = CHART_W;
    readonly chartH = CHART_H;

    status: Record<'stats' | 'revenue' | 'chart' | 'videos' | 'trending', PanelStatus> = {
        stats: 'loading', revenue: 'loading', chart: 'loading', videos: 'loading', trending: 'loading'
    };
    lastUpdated: Date | null = null;

    totalUsers = 0;
    totalStudents = 0;
    registeredThisMonth = 0;
    subscribedThisMonth = 0;
    freeUsersThisMonth = 0;
    currentMonthRevenue = 0;
    growthPercentage: number | null = null;

    points: ChartPoint[] = [];
    showChartTable = false;
    hoverIndex: number | null = null;

    videos: VideoRow[] = [];
    trending: TrendingRow[] = [];
    videoQuery = '';
    sortKey: SortKey = 'completed';
    sortDir: 1 | -1 = -1;
    pageIndex = 0;
    readonly pageSize = 5;

    constructor(private commonService: CommonService) {}

    ngOnInit(): void {
        this.refresh();
    }

    refresh(): void {
        this.loadStats();
        this.loadRevenue();
        this.loadChart();
        this.loadVideos();
        this.loadTrending();
    }

    private done(panel: keyof DashboardComponent['status'], ok: boolean): void {
        this.status[panel] = ok ? 'ready' : 'error';
        if (ok) { this.lastUpdated = new Date(); }
    }

    loadStats(): void {
        this.status.stats = 'loading';
        this.commonService.getAllData('user/userCount').subscribe({
            next: (res: any) => {
                const r = res.result || {};
                this.totalUsers = r.totalUsers || 0;
                this.totalStudents = r.totalStudents || 0;
                this.registeredThisMonth = r.registeredThisMonth || 0;
                this.subscribedThisMonth = r.subscribedThisMonth || 0;
                this.freeUsersThisMonth = r.freeUsersThisMonth || 0;
                this.done('stats', true);
            },
            error: () => this.done('stats', false)
        });
    }

    loadRevenue(): void {
        this.status.revenue = 'loading';
        this.commonService.getAllData('subscription/revenueDetails').subscribe({
            next: (res: any) => {
                const r = res.result || {};
                this.currentMonthRevenue = r.currentMonthRevenue || 0;
                // The API divides by last month's revenue. A zero month gives Infinity/NaN,
                // which JSON serialises as null, so null means "no comparison", not 0%.
                const g = r.growthPercentage == null ? NaN : Number(r.growthPercentage);
                this.growthPercentage = Number.isFinite(g) ? g : null;
                this.done('revenue', true);
            },
            error: () => this.done('revenue', false)
        });
    }

    loadChart(): void {
        this.status.chart = 'loading';
        this.commonService.getAllData('student/dashboard/subscriptions').subscribe({
            next: (res: any) => {
                this.points = (res.result || []).map((i: any) => ({
                    label: i.subscription_date, value: Number(i.total_subscriptions) || 0
                }));
                this.hoverIndex = null;
                this.done('chart', true);
            },
            error: () => this.done('chart', false)
        });
    }

    loadVideos(): void {
        this.status.videos = 'loading';
        this.commonService.getAllData('courseMaterial/videoDetails').subscribe({
            next: (res: any) => { this.videos = res.result || []; this.pageIndex = 0; this.done('videos', true); },
            error: () => this.done('videos', false)
        });
    }

    loadTrending(): void {
        this.status.trending = 'loading';
        this.commonService.getAllData('courseMaterial/dashboard/trendingVideoDetails').subscribe({
            next: (res: any) => { this.trending = res.result || []; this.done('trending', true); },
            error: () => this.done('trending', false)
        });
    }

    // ---- formatting ----
    inr(n: number): string {
        return '₹' + new Intl.NumberFormat('en-IN').format(n || 0);
    }

    num(n: number): string {
        return new Intl.NumberFormat('en-IN').format(n || 0);
    }

    get conversionRate(): number | null {
        return this.registeredThisMonth > 0 ? (this.subscribedThisMonth / this.registeredThisMonth) * 100 : null;
    }

    pct(part: number): number {
        return this.registeredThisMonth > 0 ? Math.min(100, (part / this.registeredThisMonth) * 100) : 0;
    }

    completionClass(p: number): string {
        return p >= 60 ? 'good' : p >= 40 ? 'mid' : 'low';
    }

    // ---- chart geometry ----
    get yMax(): number {
        const max = Math.max(1, ...this.points.map(p => p.value));
        const pow = Math.pow(10, Math.floor(Math.log10(max)));
        const f = max / pow;
        return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * pow;
    }

    get yTicks(): number[] {
        const step = this.yMax / 4;
        return [0, 1, 2, 3, 4].map(i => Math.round(step * i * 100) / 100);
    }

    x(i: number): number {
        const n = Math.max(1, this.points.length - 1);
        return CHART_PAD.left + (i * (CHART_W - CHART_PAD.left - CHART_PAD.right)) / n;
    }

    y(v: number): number {
        return CHART_PAD.top + (CHART_H - CHART_PAD.top - CHART_PAD.bottom) * (1 - v / this.yMax);
    }

    get baseline(): number { return this.y(0); }

    get linePoints(): string {
        return this.points.map((p, i) => `${this.x(i).toFixed(1)},${this.y(p.value).toFixed(1)}`).join(' ');
    }

    get areaPoints(): string {
        if (!this.points.length) { return ''; }
        return `${this.x(0)},${this.baseline} ${this.linePoints} ${this.x(this.points.length - 1)},${this.baseline}`;
    }

    get labelIndexes(): number[] {
        const step = Math.ceil(this.points.length / 8) || 1;
        return this.points.map((_, i) => i).filter(i => i % step === 0);
    }

    get plotEnd(): number { return CHART_W - CHART_PAD.right; }
    get plotLeft(): number { return CHART_PAD.left; }
    get plotTop(): number { return CHART_PAD.top; }
    get plotBottom(): number { return CHART_H - CHART_PAD.bottom; }

    get chartTotal(): number { return this.points.reduce((s, p) => s + p.value, 0); }

    onChartMove(ev: MouseEvent | PointerEvent, svg: SVGSVGElement): void {
        if (!this.points.length) { return; }
        const rect = svg.getBoundingClientRect();
        const sx = ((ev.clientX - rect.left) / rect.width) * CHART_W;
        let best = 0, bestD = Infinity;
        this.points.forEach((_, i) => {
            const d = Math.abs(this.x(i) - sx);
            if (d < bestD) { bestD = d; best = i; }
        });
        this.hoverIndex = best;
    }

    get tipLeftPct(): number {
        return this.hoverIndex === null ? 0 : Math.min(88, Math.max(12, (this.x(this.hoverIndex) / CHART_W) * 100));
    }

    get tipTopPct(): number {
        return this.hoverIndex === null ? 0 : (this.y(this.points[this.hoverIndex].value) / CHART_H) * 100;
    }

    // ---- videos table ----
    get filteredVideos(): VideoRow[] {
        const q = this.videoQuery.trim().toLowerCase();
        const rows = this.videos.filter(v => !q || `${v.subCategoryName} ${v.categoryName}`.toLowerCase().includes(q));
        const val = (v: VideoRow): string | number => {
            switch (this.sortKey) {
                case 'name': return (v.subCategoryName || '').toLowerCase();
                case 'videos': return Number(v.totalCourseMaterials) || 0;
                case 'duration': return this.durationSeconds(v.totalDuration);
                default: return Number(v.studentsCompletedPercentage) || 0;
            }
        };
        return rows.slice().sort((a, b) => (val(a) > val(b) ? 1 : val(a) < val(b) ? -1 : 0) * this.sortDir);
    }

    get pagedVideos(): VideoRow[] {
        return this.filteredVideos.slice(this.pageIndex * this.pageSize, (this.pageIndex + 1) * this.pageSize);
    }

    get pageCount(): number { return Math.max(1, Math.ceil(this.filteredVideos.length / this.pageSize)); }

    get rangeLabel(): string {
        const total = this.filteredVideos.length;
        return total ? `${this.pageIndex * this.pageSize + 1}–${this.pageIndex * this.pageSize + this.pagedVideos.length} of ${total}` : '0 of 0';
    }

    /** totalDuration arrives as text such as "06:12:00" or "45:10"; unknown formats sort last. */
    private durationSeconds(d: string): number {
        const parts = String(d || '').split(':').map(Number);
        if (!parts.length || parts.some(isNaN)) { return 0; }
        return parts.reduce((acc, p) => acc * 60 + p, 0);
    }

    setSort(k: SortKey): void {
        if (this.sortKey === k) { this.sortDir = (this.sortDir * -1) as 1 | -1; }
        else { this.sortKey = k; this.sortDir = k === 'name' ? 1 : -1; }
        this.pageIndex = 0;
    }

    ariaSort(k: SortKey): string {
        return this.sortKey === k ? (this.sortDir === 1 ? 'ascending' : 'descending') : 'none';
    }

    onSearch(value: string): void { this.videoQuery = value; this.pageIndex = 0; }
    page(d: number): void { this.pageIndex = Math.min(this.pageCount - 1, Math.max(0, this.pageIndex + d)); }

    initial(v: VideoRow): string { return (v.subCategoryName || '?').charAt(0).toUpperCase(); }
    imageSrc(v: VideoRow): string | null {
        return v.subCategoryImageUrl && !v.imageFailed ? this.apiUrl + v.subCategoryImageUrl : null;
    }

    maxTrending(): number { return Math.max(1, ...this.trending.map(t => Number(t.repeatedViews) || 0)); }

    retryPanel(panel: keyof DashboardComponent['status']): void {
        ({ stats: () => this.loadStats(), revenue: () => this.loadRevenue(), chart: () => this.loadChart(),
           videos: () => this.loadVideos(), trending: () => this.loadTrending() })[panel]();
    }

    exportVideosCsv(): void {
        const esc = (s: any) => `"${String(s ?? '').replace(/"/g, '""')}"`;
        const rows = [['Sub Category', 'Category', 'Total Videos', 'Total Duration', 'Students Viewed 100% (%)']]
            .concat(this.filteredVideos.map(v => [v.subCategoryName, v.categoryName, String(v.totalCourseMaterials), v.totalDuration, String(v.studentsCompletedPercentage)]));
        const blob = new Blob([rows.map(r => r.map(esc).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'video-performance.csv';
        a.click();
        URL.revokeObjectURL(a.href);
    }
}
