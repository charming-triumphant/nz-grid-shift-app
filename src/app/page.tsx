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
  
  const [energyUsageMW, setEnergyUsageMW] = useState<number>(2.5);
  const [energyUsageDataMW, setEnergyUsageDataMW] = useState<number>(5.0);
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-900 font-sans">
        <p className="text-lg font-semibold uppercase tracking-widest text-slate-500 border-b border-slate-300 pb-2">Retrieving Energy Directorate Data...</p>
      </div>
    );
  }

  const currentSettings = gridData.find(d => d.hourOffset === currentSelectedHourOffset);
  const proposedSettings = gridData.find(d => d.hourOffset === proposedSelectedHourOffset);
  const gridData24h = gridData.slice(0, 24);

  const activeEnergyUsageMW = activeTab === 'factory' ? energyUsageMW : energyUsageDataMW;
  const carbonSaved = (currentSettings.carbonIntensity - proposedSettings.carbonIntensity) * (activeEnergyUsageMW * 1000) / 1000; 
  const moneySaved = (currentSettings.pricePerMwh - proposedSettings.pricePerMwh) * activeEnergyUsageMW;

  const actionMap: Record<string, string> = {
    SHED_LOAD: 'REDUCE LOAD',
    CONSUME_HEAVILY: 'INCREASE CONSUMPTION',
    MAINTAIN: 'MAINTAIN CURRENT LOAD'
  };
  const actionPhrase = actionMap[currentSettings.actionSignal as string] || String(currentSettings.actionSignal).replace('_', ' ').toUpperCase();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800 font-sans p-4 md:p-8">

      <div className="max-w-6xl mx-auto bg-white border border-slate-200 shadow-sm">
        
        {/* Formal Report Header */}
        <header className="border-t-4 border-t-slate-800 border-b border-b-slate-200 p-8 mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-white">
          <div className="flex-1">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Government Energy Directorate</h2>
            <h1 className="text-3xl font-extrabold uppercase tracking-tight text-slate-900 mb-3">ShiftNZ Wholesale Report</h1>
            <p className="text-slate-700 text-sm font-medium border-l-2 border-slate-300 pl-3 py-1">
              Ref: {feedModel.toUpperCase()} | Live Market Price Feed Visibility
            </p>
          </div>
          <div className="text-right text-xs border border-slate-200 p-4 font-medium bg-slate-50 shrink-0 shadow-sm text-slate-600">
            <p className="uppercase mb-2 font-bold border-b border-slate-200 pb-1 text-slate-800">Document Control</p>
            <p className="mb-1"><strong>Source:</strong> <span className="text-slate-900">{feedDataSource}</span></p>
            <p><strong>Issued:</strong> <span className="text-slate-900">{new Date(feedTimestamp).toLocaleTimeString('en-NZ', { hour: '2-digit', minute: '2-digit' })}</span></p>
          </div>
        </header>

        <div className="px-8 pb-8">
        {/* Primary Metrics */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="border border-slate-200 p-5 bg-white shadow-sm">
            <h3 className="text-xs uppercase font-bold text-slate-600 border-b border-slate-100 pb-2 mb-3 tracking-wider">Live Price Now</h3>
            <p className="text-3xl font-extrabold text-slate-900">${currentSettings.pricePerMwh.toFixed(2)} <span className="text-lg text-slate-500 font-normal">/ MWh</span></p>
            <p className="text-xs text-slate-500 font-medium mt-2">Current half-hour market assessment</p>
          </div>
          <div className="border border-slate-200 p-5 bg-white shadow-sm">
            <h3 className="text-xs uppercase font-bold text-slate-600 border-b border-slate-100 pb-2 mb-3 tracking-wider">Recommended Shift Target</h3>
            <p className="text-3xl font-extrabold text-emerald-700">{proposedSettings.time}</p>
            <p className="text-xs text-slate-500 font-medium mt-2">Valuation: ${proposedSettings.pricePerMwh.toFixed(2)} / MWh</p>
          </div>
          <div className="border border-slate-800 p-5 bg-slate-800 text-white shadow-sm relative overflow-hidden">
            <div className="absolute right-0 top-0 opacity-10"><Zap className="w-24 h-24" /></div>
            <h3 className="text-xs uppercase font-bold text-slate-300 border-b border-slate-700 pb-2 mb-3 tracking-wider relative z-10">Issued Directive</h3>
            <p className={clsx("text-2xl font-extrabold uppercase relative z-10", currentSettings.actionSignal === 'SHED_LOAD' ? 'text-red-400' : 'text-emerald-400')}>{actionPhrase}</p>
            <p className="text-xs text-slate-400 font-medium mt-2 tracking-tight relative z-10">SPOT MARKET COMPLIANCE REQUIRED</p>
          </div>
        </section>

        {/* Forecast Block */}
        <section className="border border-slate-200 p-6 mb-8 bg-white shadow-sm">
          <h3 className="text-sm font-bold uppercase mb-4 border-b border-slate-200 pb-2 tracking-widest text-slate-800">Long-Term Assessment Data</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-2">
              <h4 className="text-xs font-bold uppercase mb-3 text-slate-700 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-800 shrink-0"></span>
                7-Day Optimal Window
              </h4>
              <p className="text-xl font-bold mb-4 text-slate-900">{bestWeekly ? `${bestWeekly.day} ${bestWeekly.time}` : 'Pending...'}</p>
              <div className="h-40 border-t border-slate-100 pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyForecast} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val}`} />
                    <Line type="step" dataKey="pricePerMwh" stroke="#1e293b" strokeWidth={2} dot={{ r: 2, fill: '#1e293b' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="p-2">
              <h4 className="text-xs font-bold uppercase mb-3 text-slate-700 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0"></span>
                14-Day Strategic Outlook
              </h4>
              <p className="text-xl font-bold mb-4 text-slate-900">{bestMonthly ? `${bestMonthly.day} ${bestMonthly.time}` : 'Pending...'}</p>
              <div className="h-40 border-t border-slate-100 pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyForecast} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val}`} />
                    <Line type="step" dataKey="pricePerMwh" stroke="#94a3b8" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </section>

        {/* Tab Selection */}
        <div className="flex bg-slate-50 border border-slate-200 border-b-0 w-max mb-0 relative top-px">
          <button 
            onClick={() => setActiveTab('factory')}
            className={clsx("py-3 px-6 font-bold text-xs uppercase tracking-wider transition-colors", 
              activeTab === 'factory' ? "bg-white text-blue-700 border-t-2 border-t-blue-600" : "text-slate-500 hover:text-slate-700 border-t-2 border-t-transparent border-r border-slate-200")}
          >
            Sect 1. Heavy Manufacturing
          </button>
          <button 
            onClick={() => setActiveTab('data')}
            className={clsx("py-3 px-6 font-bold text-xs uppercase tracking-wider transition-colors", 
              activeTab === 'data' ? "bg-white text-blue-700 border-t-2 border-t-blue-600" : "text-slate-500 hover:text-slate-700 border-t-2 border-t-transparent")}
          >
            Sect 2. Data Center Operations
          </button>
        </div>

        <div className="border border-slate-200 p-8 grid grid-cols-1 xl:grid-cols-12 gap-10 bg-white">
          
          {/* Left Column: Flow & Calculator */}
          <div className="xl:col-span-4 flex flex-col space-y-8 border-b xl:border-b-0 xl:border-r border-slate-200 pb-8 xl:pb-0 xl:pr-10">
            <div>
              <h2 className="text-lg font-bold uppercase mb-2 border-b border-slate-200 pb-1 text-slate-800">Form 42A: Load Shedding Parameters</h2>
              <p className="text-sm font-medium text-slate-500 leading-snug">
                {activeTab === 'factory' ? 
                  'Declare heavy manufacturing loads below to simulate displacement from critical wholesale price bands.' : 
                  'Declare IT & cooling limits to optimize batch processing away from critical price bands.'
                }
              </p>
            </div>

            <div className="border border-slate-200 p-5 bg-slate-50 shadow-sm relative">
              <p className="font-bold text-xs text-slate-500 uppercase mb-4 border-b border-slate-200 pb-1">Input Variable: Megawatts (MW)</p>
              {activeTab === 'factory' ? (
                <>
                  <div className="flex justify-between items-end mb-2">
                    <span className="font-bold text-slate-700">Allocated Load:</span>
                    <span className="text-xl font-extrabold text-blue-700">{energyUsageMW.toFixed(1)} MW</span>
                  </div>
                  <input type="range" min="0.5" max="25" step="0.5" value={energyUsageMW} onChange={(e) => setEnergyUsageMW(parseFloat(e.target.value))} className="w-full mt-2 accent-blue-600" />
                </>
              ) : (
                <>
                  <div className="flex justify-between items-end mb-2">
                    <span className="font-bold text-slate-700">Allocated Load:</span>
                    <span className="text-xl font-extrabold text-blue-700">{energyUsageDataMW.toFixed(1)} MW</span>
                  </div>
                  <input type="range" min="1" max="50" step="1" value={energyUsageDataMW} onChange={(e) => setEnergyUsageDataMW(parseFloat(e.target.value))} className="w-full mt-2 accent-blue-600" />
                </>
              )}
            </div>

            <div className="border border-slate-200 shadow-sm">
              <h3 className="bg-slate-100 text-slate-700 border-b border-slate-200 p-3 font-bold uppercase text-xs tracking-widest">Shift Protocol Comparison</h3>
              <div className="p-5 space-y-5 bg-white">
                <div className="border-l-2 border-slate-300 pl-4 relative">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-widest">Baseline Status</p>
                  <select value={currentSelectedHourOffset} onChange={(e) => setCurrentSelectedHourOffset(parseInt(e.target.value))} className="bg-slate-50 border border-slate-200 text-slate-700 font-bold px-2 py-1 w-full uppercase outline-none mb-1 text-sm shadow-sm cursor-pointer">
                    {gridData24h.map((d:any) => <option key={"c"+d.hourOffset} value={d.hourOffset}>{d.time} (LOGGED)</option>)}
                  </select>
                  <p className="text-sm font-bold mt-1 text-slate-600">RATE: ${currentSettings.pricePerMwh.toFixed(2)}/MWh</p>
                </div>
                
                <div className="border-l-2 border-emerald-500 pl-4 relative">
                  <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1 tracking-widest">Proposed Shift Window</p>
                  <select value={proposedSelectedHourOffset} onChange={(e) => setProposedSelectedHourOffset(parseInt(e.target.value))} className="bg-emerald-50/50 border border-emerald-200 text-emerald-800 font-bold px-2 py-1 w-full uppercase outline-none mb-1 text-sm shadow-sm cursor-pointer">
                    {gridData24h.map((d:any) => <option key={"p"+d.hourOffset} value={d.hourOffset}>{d.time} (PROPOSED)</option>)}
                  </select>
                  <p className="text-sm font-bold mt-1 text-emerald-700">RATE: ${proposedSettings.pricePerMwh.toFixed(2)}/MWh</p>
                </div>
              </div>
            </div>

            <div className="border border-slate-800 p-6 bg-slate-900 text-white shadow-md relative overflow-hidden">
              <h3 className="font-bold uppercase text-xs tracking-widest text-slate-400 border-b border-slate-700 pb-2 mb-5">Calculated Financial Yield</h3>
              
              <div className="relative z-10">
                <p className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-widest">Total Savings Derived (Per Hour)</p>
                <p className="text-4xl font-extrabold text-emerald-400 mb-6 drop-shadow-sm">
                  {moneySaved > 0 ? "$" + moneySaved.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : "$0.00"} <span className="text-sm font-bold text-slate-300">NZD</span>
                </p>

                <p className="text-[10px] font-bold text-slate-400 mb-1 uppercase pt-5 border-t border-slate-800 tracking-widest">Associated Emissions Avoidance</p>
                <p className="text-2xl font-bold text-slate-100">
                  {carbonSaved > 0 ? carbonSaved.toFixed(1) : "0.0"} <span className="text-xs text-slate-400">kg CO2e</span>
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Chart */}
          <div className="xl:col-span-8 flex flex-col">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-widest text-slate-800 border-b border-slate-200 pb-1 mb-2 flex items-center gap-2">
                  <span className="bg-blue-700 text-white w-5 h-5 rounded-sm inline-flex items-center justify-center text-xs">Ex</span>
                  Exhibit A: 24h Spot Price Trajectory
                </h2>
                <p className="text-xs text-slate-500 font-medium">Verified wholesale pricing intervals extracted from daily operations. Dotted guidelines designate recommended arbitrage intervals.</p>
              </div>
              <div className="border border-slate-200 px-3 py-1 font-bold text-[10px] tracking-widest uppercase bg-slate-50 text-slate-500 shrink-0 ml-4 shadow-sm">
                Integrity: [{gridData[0].reliability}]
              </div>
            </div>

            <div className="grow w-full h-100 border border-slate-200 p-6 bg-slate-50 shadow-inner">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={gridData24h}>
                  <XAxis dataKey="time" tick={{fontSize: 10, fill: '#64748b', fontWeight: 'bold'}} tickMargin={10} minTickGap={30} axisLine={{stroke: '#cbd5e1', strokeWidth: 1}} tickLine={{stroke: '#cbd5e1'}} />
                  <YAxis tick={{fontSize: 10, fill: '#64748b', fontWeight: 'bold'}} axisLine={{stroke: '#cbd5e1', strokeWidth: 1}} tickLine={{stroke: '#cbd5e1'}} tickFormatter={(val) => `$${val}`} />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  
                  <Tooltip 
                    contentStyle={{ borderRadius: '0px', border: '1px solid #cbd5e1', backgroundColor: '#fff', fontWeight: 'bold', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: any, name: any) => [
                      name === 'pricePerMwh' ? `$${value} / MWh` : `${value} km/h`, 
                      name === 'pricePerMwh' ? 'Audited Price' : 'Wind Speed'
                    ]}
                  />
                  
                  <ReferenceLine x={currentSettings.time} stroke="#64748b" strokeWidth={1} strokeDasharray="4 4" label={{ position: 'top', value: 'STATUS QUO (LOGGED)', fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} />
                  <ReferenceLine x={proposedSettings.time} stroke="#10b981" strokeWidth={2} label={{ position: 'top', value: 'TARGET (PROPOSED)', fill: '#10b981', fontSize: 10, fontWeight: 'bold' }} />

                  <Area 
                    type="monotone" 
                    dataKey="pricePerMwh" 
                    stroke="#2563eb" 
                    strokeWidth={2}
                    fillOpacity={0.1} 
                    fill="#3b82f6" 
                    activeDot={{ r: 5, fill: '#2563eb', stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            <div className="border-t border-slate-200 mt-8 pt-4">
              <p className="text-[10px] uppercase font-bold text-center text-slate-400 tracking-widest">End of report section - Classified as routine operations data</p>
            </div>
          </div>

        </div>
      </div>
      </div>
    </main>
  );
}
