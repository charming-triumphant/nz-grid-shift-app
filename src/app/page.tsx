"use client";

import { useEffect, useState } from "react";
import { ResponsiveContainer, AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from "recharts";
import { Zap, Leaf, Clock, BatteryCharging, Factory, Activity, ShieldCheck, ChevronRight, TrendingUp } from "lucide-react";
import clsx from "clsx";

export default function Home() {
  const [gridData, setGridData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'factory' | 'data'>('factory');

  const [feedModel, setFeedModel] = useState('Market Forecast Engine');
  const [feedDataSource, setFeedDataSource] = useState('');
  const [feedTimestamp, setFeedTimestamp] = useState('');
  const [weeklyForecast, setWeeklyForecast] = useState<any[]>([]);
  const [monthlyForecast, setMonthlyForecast] = useState<any[]>([]);
  const [bestWeekly, setBestWeekly] = useState<any>(null);
  const [bestMonthly, setBestMonthly] = useState<any>(null);
  // Calculator State
  const [energyUsageMW, setEnergyUsageMW] = useState<number>(2.5); // 2.5 MW 
  const [energyUsageDataMW, setEnergyUsageDataMW] = useState<number>(5.0); // 5 MW Data center
  const [currentSelectedHourOffset, setCurrentSelectedHourOffset] = useState<number>(0);
  const [proposedSelectedHourOffset, setProposedSelectedHourOffset] = useState<number>(12);

  useEffect(() => {
    fetch('/api/grid')
      .then(res => res.json())
      .then(data => {
        setGridData(data.forecast);
        setFeedModel(data.model || 'Spot Price Arbitrage Engine');
        setFeedDataSource(data.dataSource || 'Live feed');
        setFeedTimestamp(data.timestamp || new Date().toISOString());
        setWeeklyForecast(data.weeklyForecast || []);
        setMonthlyForecast(data.monthlyForecast || []);
        setBestWeekly(data.bestWeekly || null);
        setBestMonthly(data.bestMonthly || null);

        let bestHour = 0;
        let lowestPrice = 99999;
        data.forecast.forEach((hour: any) => {
          if (hour.pricePerMwh < lowestPrice) {
            lowestPrice = hour.pricePerMwh;
            bestHour = hour.hourOffset;
          }
        });
        setProposedSelectedHourOffset(bestHour);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center flex-col space-y-4">
      <div className="w-8 h-8 border-4 border-slate-700 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-slate-900 font-semibold tracking-wide">Loading live market price feed...</p>
    </div>;
  }

  const currentSettings = gridData.find(d => d.hourOffset === currentSelectedHourOffset);
  const proposedSettings = gridData.find(d => d.hourOffset === proposedSelectedHourOffset);
  const gridData24h = gridData.slice(0, 24);

  const activeEnergyUsageMW = activeTab === 'factory' ? energyUsageMW : energyUsageDataMW;
  const carbonSaved = (currentSettings.carbonIntensity - proposedSettings.carbonIntensity) * (activeEnergyUsageMW * 1000) / 1000; 
  const moneySaved = (currentSettings.pricePerMwh - proposedSettings.pricePerMwh) * activeEnergyUsageMW;

  const actionMap: Record<string, string> = {
    SHED_LOAD: 'Reduce load',
    CONSUME_HEAVILY: 'Increase consumption',
    MAINTAIN: 'Keep current load'
  };
  const actionPhrase = actionMap[currentSettings.actionSignal as string] || String(currentSettings.actionSignal).replace('_', ' ');

  return (
    <main className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        
        {/* Header */}
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between border-b border-slate-200 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-6 h-6 text-slate-700" />
              <span className="text-xs font-bold tracking-widest text-slate-700 uppercase">Grid-Connected Load Manager</span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">ShiftNZ Wholesale</h1>
            <p className="text-slate-500 mt-1 max-w-xl">Real-time NZ wholesale price visibility for large grid customers. Plan load shifts, protect margins, and keep operations aligned with the lowest-cost windows.</p>
          </div>
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="bg-white px-5 py-3 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 text-slate-700">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Market Feed</p>
                <p className="font-semibold text-sm">{feedDataSource}</p>
              </div>
            </div>
            <div className="bg-slate-900 px-5 py-3 rounded-2xl shadow-sm border border-slate-800 text-white flex-1">
              <p className="text-xs uppercase tracking-widest text-slate-400">Forecast Lens</p>
              <p className="font-semibold text-sm">{feedModel}</p>
              <p className="text-xs text-slate-400 mt-1">Updated {new Date(feedTimestamp).toLocaleTimeString('en-NZ', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <p className="text-xs uppercase tracking-widest text-slate-500">Live Price Now</p>
            <p className="mt-3 text-4xl font-extrabold text-slate-900">${currentSettings.pricePerMwh.toFixed(2)} / MWh</p>
            <p className="text-sm text-slate-500 mt-2">Current half-hour market price</p>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <p className="text-xs uppercase tracking-widest text-slate-500">Recommended Shift</p>
            <p className="mt-3 text-4xl font-extrabold text-emerald-600">{proposedSettings.time}</p>
            <p className="text-sm text-slate-500 mt-2">Target price ${proposedSettings.pricePerMwh.toFixed(2)} / MWh</p>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <p className="text-xs uppercase tracking-widest text-slate-500">Action Signal</p>
            <p className={clsx("mt-3 text-4xl font-extrabold", currentSettings.actionSignal === 'SHED_LOAD' ? 'text-rose-500' : 'text-emerald-600')}>{actionPhrase}</p>
            <p className="text-sm text-slate-500 mt-2">Manage load according to the spot market.</p>
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-500">Best time this week</p>
                <p className="text-2xl font-semibold text-slate-900">{bestWeekly ? `${bestWeekly.day} ${bestWeekly.time}` : 'Loading...'}</p>
              </div>
            </div>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyForecast} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val}`} />
                  <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']} />
                  <Line type="monotone" dataKey="pricePerMwh" stroke="#0f766e" strokeWidth={3} dot={{ r: 3, fill: '#0f766e' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-500">14-Day Outlook</p>
                <p className="text-2xl font-semibold text-slate-900">{bestMonthly ? `${bestMonthly.day} ${bestMonthly.time}` : 'Loading...'}</p>
              </div>
            </div>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyForecast} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val}`} />
                  <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']} />
                  <Line type="monotone" dataKey="pricePerMwh" stroke="#0f4365" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* UX Tabs */}
        <div className="flex p-1 bg-slate-200/50 rounded-2xl max-w-md mx-auto xl:mx-0">
          <button 
            onClick={() => setActiveTab('factory')}
            className={clsx("flex-1 py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200", 
              activeTab === 'factory' ? "bg-white text-indigo-700 shadow-sm ring-1 ring-black/5" : "text-slate-500 hover:text-slate-700")}
          >
            <Factory className="w-4 h-4" /> Heavy Manufacturing
          </button>
          <button 
            onClick={() => setActiveTab('data')}
            className={clsx("flex-1 py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all duration-200", 
              activeTab === 'data' ? "bg-white text-indigo-700 shadow-sm ring-1 ring-black/5" : "text-slate-500 hover:text-slate-700")}
          >
            <Activity className="w-4 h-4" /> Data Center Operations
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          
          {/* Left Column: Flow & Calculator */}
          <div className="xl:col-span-4 space-y-6">
            
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <h2 className="text-xl font-bold mb-2 flex items-center gap-2 text-slate-800">
                <Clock className="w-5 h-5 text-slate-700" />
                Operational Load Scheduler
              </h2>
              <p className="text-sm text-slate-500 mb-8 leading-relaxed">
                {activeTab === 'factory' ? 
                  'Simulate shedding multi-megawatt manufacturing loads away from extreme wholesale spot price spikes.' : 
                  'Optimize compute loads and cooling cycles for large data centers to avoid maximum grid pricing.'
                }
              </p>

              <div className="space-y-6">
                {/* Step 1 */}
                <div>
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-3">
                    <span className="bg-slate-800 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs">1</span> 
                    Set Sheddable Load (MW)
                  </label>
                  {activeTab === 'factory' ? (
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium text-slate-600">Factory Load</span>
                        <span className="text-sm font-bold text-indigo-600">{energyUsageMW} MW</span>
                      </div>
                      <input type="range" min="0.5" max="25" step="0.5" value={energyUsageMW} onChange={(e) => setEnergyUsageMW(parseFloat(e.target.value))} className="w-full accent-indigo-600" />
                      <p className="text-xs text-slate-400 mt-2">Example: Industrial refrigeration, milling, pumping</p>
                    </div>
                  ) : (
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium text-slate-600">IT & Cooling Load</span>
                        <span className="text-sm font-bold text-indigo-600">{energyUsageDataMW} MW</span>
                      </div>
                      <input type="range" min="1" max="50" step="1" value={energyUsageDataMW} onChange={(e) => setEnergyUsageDataMW(parseFloat(e.target.value))} className="w-full accent-indigo-600" />
                      <p className="text-xs text-slate-400 mt-2">Example: Deferrable batch processing, pre-cooling operations</p>
                    </div>
                  )}
                </div>

                {/* Step 2 */}
                <div>
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-3">
                    <span className="bg-slate-800 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs">2</span> 
                    Compare Schedules
                  </label>
                  <div className="space-y-3">
                    <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex justify-between items-center">
                      <div>
                        <span className="text-xs font-bold text-rose-500 uppercase tracking-widest block mb-1">Status Quo</span>
                        <select value={currentSelectedHourOffset} onChange={(e) => setCurrentSelectedHourOffset(parseInt(e.target.value))} className="bg-transparent border-none text-rose-900 font-bold p-0 focus:ring-0 cursor-pointer">
                          {gridData24h.map((d:any) => <option key={"c"+d.hourOffset} value={d.hourOffset}>{d.time} (Today)</option>)}
                        </select>
                      </div>
                      <div className="text-right">
                        <span className="block text-sm font-semibold text-rose-800">${currentSettings.pricePerMwh.toFixed(2)}/MWh</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-center -my-2 relative z-10"><ArrowDownIcon className="w-6 h-6 text-slate-300" /></div>

                    <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex justify-between items-center shadow-sm">
                      <div>
                        <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest block mb-1 flex items-center gap-1">Best shift window <Sparkles className="w-3 h-3" /></span>
                        <select value={proposedSelectedHourOffset} onChange={(e) => setProposedSelectedHourOffset(parseInt(e.target.value))} className="bg-transparent border-none text-emerald-900 font-bold p-0 focus:ring-0 cursor-pointer outline-none">
                          {gridData24h.map((d:any) => <option key={"p"+d.hourOffset} value={d.hourOffset}>{d.time} (Shift)</option>)}
                        </select>
                      </div>
                      <div className="text-right">
                        <span className="block text-sm font-semibold text-emerald-700">${proposedSettings.pricePerMwh.toFixed(2)}/MWh</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 mt-4">
                  <p className="text-xs uppercase tracking-widest text-slate-500 mb-2">Hourly Risk Profile</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white p-4 rounded-2xl border border-slate-200">
                      <p className="text-[10px] uppercase tracking-[.3em] text-slate-400">High Risk Windows</p>
                      <p className="mt-2 text-xl font-semibold text-rose-600">{gridData24h.filter((d:any) => d.pricePerMwh > 250).length}</p>
                      <p className="text-xs text-slate-500 mt-1">Half-hour intervals &gt; $250/MWh</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-slate-200">
                      <p className="text-[10px] uppercase tracking-[.3em] text-slate-400">Lowest Price</p>
                      <p className="mt-2 text-xl font-semibold text-emerald-600">${Math.min(...gridData24h.map((d:any) => d.pricePerMwh)).toFixed(2)}</p>
                      <p className="text-xs text-slate-500 mt-1">Best available 24h entry point</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Results Block */}
            <div className="bg-[#0f172a] text-white p-8 rounded-3xl relative overflow-hidden ring-1 ring-white/10 shadow-xl">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500 rounded-full blur-3xl opacity-20"></div>
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-emerald-500 rounded-full blur-3xl opacity-20"></div>
              
              <h3 className="font-bold text-slate-300 mb-6 text-sm uppercase tracking-widest flex justify-between items-center">
                Net Arbitrage
                <span className="bg-white/10 px-2 py-1 rounded text-xs">Per Hour</span>
              </h3>
              
              <div className="space-y-6 relative z-10">
                <div>
                  <p className="text-slate-400 text-sm mb-1">Financial Savings (Spot Price)</p>
                  <div className="flex items-end gap-2">
                    <span className="text-5xl font-black tracking-tighter text-emerald-400">{moneySaved > 0 ? "$" + moneySaved.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : "$0.00"}</span>
                    <span className="text-slate-300 font-medium mb-1">NZD</span>
                  </div>
                </div>

                <div className="h-px w-full bg-white/10"></div>

                <div>
                  <p className="text-slate-400 text-sm mb-1">Emissions Avoided (Co-benefit)</p>
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-bold tracking-tight text-slate-300">{carbonSaved > 0 ? carbonSaved.toFixed(1) : "0.0"}</span>
                    <span className="text-slate-400 text-sm mb-1">kg CO2e</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Chart & Operations guidance explanation */}
          <div className="xl:col-span-8 flex flex-col gap-6">
            
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex-grow flex flex-col">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">24h Wholesale Price Outlook</h2>
                  <p className="text-sm text-slate-500 mt-1">Forecasted half-hour price windows for large grid consumers. Use this view to schedule shiftable production.</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-600"></span>
                  </span>
                  Data reliability: {gridData[0].reliability}
                </div>
              </div>

              <div className="flex-grow w-full h-[350px] min-h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={gridData24h} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.6}/>
                        <stop offset="50%" stopColor="#6366f1" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="time" tick={{fontSize: 12, fill: '#64748b'}} tickMargin={10} minTickGap={30} axisLine={false} tickLine={false} />
                    <YAxis tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val}`} />
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: any, name: any) => [
                        name === 'pricePerMwh' ? `$${value} / MWh` : `${value} km/h`, 
                        name === 'pricePerMwh' ? 'Spot Price' : 'Wind Speed (Proxy)'
                      ]}
                      labelStyle={{fontWeight: 'bold', color: '#0f172a', marginBottom: '8px'}}
                    />
                    
                    <ReferenceLine x={currentSettings.time} stroke="#cbd5e1" strokeWidth={2} strokeDasharray="4 4" label={{ position: 'top', value: 'CURRENT', fill: '#64748b', fontSize: 11, fontWeight: 'bold' }} />
                    <ReferenceLine x={proposedSettings.time} stroke="#10b981" strokeWidth={3} label={{ position: 'top', value: 'SHIFT', fill: '#10b981', fontSize: 11, fontWeight: 'bold' }} />

                    <Area 
                      type="monotone" 
                      dataKey="pricePerMwh" 
                      stroke="#8b5cf6" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorPrice)" 
                      activeDot={{ r: 6, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 3 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Explainer Block for Scholarship Panel */}
            <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200 flex flex-col md:flex-row gap-6 items-center">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 shrink-0 flex items-center justify-center">
                <Factory className="w-10 h-10 text-slate-700" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 mb-1 flex items-center gap-2">Operations-Focused Guidance</h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Designed for direct-grid consumers, this dashboard shows the next practical load-shift window and the current spot price signal. Make decisions using real price signals and operational risk, not vague analytics jargon.
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}

// Just two mini-icons used to clean up the code visually
function ArrowDownIcon(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}><path fillRule="evenodd" d="M12 2.25a.75.75 0 01.75.75v16.19l6.22-6.22a.75.75 0 111.06 1.06l-7.5 7.5a.75.75 0 01-1.06 0l-7.5-7.5a.75.75 0 111.06-1.06l6.22 6.22V3a.75.75 0 01.75-.75z" clipRule="evenodd" /></svg>;
}
function Sparkles(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
}
