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
      <div className="min-h-screen flex items-center justify-center bg-white text-black font-serif">
        <p className="text-xl font-bold uppercase tracking-widest border-b-2 border-black pb-2">Retrieving Energy Directorate Data...</p>
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
    <main className="min-h-screen bg-white text-black font-serif p-4 md:p-8">
      <div className="max-w-6xl mx-auto border-4 border-black p-8">
        
        {/* Formal Report Header */}
        <header className="border-b-4 border-black pb-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="flex-1">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-700 mb-2">Government Energy Directorate</h2>
            <h1 className="text-4xl font-extrabold uppercase tracking-tight text-black mb-2">ShiftNZ Wholesale Report</h1>
            <p className="text-black font-medium border-l-4 border-black pl-3 py-1">
              Ref: {feedModel.toUpperCase()} | Live Market Price Feed Visibility
            </p>
          </div>
          <div className="text-right text-sm border-2 border-black p-3 font-semibold bg-gray-50 shrink-0">
            <p className="uppercase mb-1 border-b border-black pb-1">Document Control</p>
            <p><strong>Source:</strong> {feedDataSource}</p>
            <p><strong>Issued:</strong> {new Date(feedTimestamp).toLocaleTimeString('en-NZ', { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </header>

        {/* Primary Metrics */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="border-2 border-black p-5 bg-white">
            <h3 className="text-sm uppercase font-bold text-black border-b-2 border-black pb-2 mb-3">Live Price Now</h3>
            <p className="text-3xl font-extrabold text-black">${currentSettings.pricePerMwh.toFixed(2)} / MWh</p>
            <p className="text-sm text-gray-700 font-medium mt-2">Current half-hour market assessment</p>
          </div>
          <div className="border-2 border-black p-5 bg-white">
            <h3 className="text-sm uppercase font-bold text-black border-b-2 border-black pb-2 mb-3">Recommended Shift Target</h3>
            <p className="text-3xl font-extrabold text-gray-800">{proposedSettings.time}</p>
            <p className="text-sm text-gray-700 font-medium mt-2">Valuation: ${proposedSettings.pricePerMwh.toFixed(2)} / MWh</p>
          </div>
          <div className="border-2 border-black p-5 bg-gray-100">
            <h3 className="text-sm uppercase font-bold text-black border-b-2 border-black pb-2 mb-3">Issued Directive</h3>
            <p className="text-2xl font-extrabold text-black uppercase">{actionPhrase}</p>
            <p className="text-sm text-gray-700 font-medium mt-2 tracking-tight">SPOT MARKET COMPLIANCE REQUIRED</p>
          </div>
        </section>

        {/* Forecast Block */}
        <section className="border-2 border-black p-6 mb-8">
          <h3 className="text-lg font-bold uppercase mb-4 border-b-2 border-black pb-2">Long-Term Assessment Data</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="border border-gray-400 p-4">
              <h4 className="text-sm font-bold uppercase mb-3 bg-black text-white py-1 px-2 inline-block">7-Day Optimal Window</h4>
              <p className="text-xl font-bold mb-4">{bestWeekly ? `${bestWeekly.day} ${bestWeekly.time}` : 'Pending...'}</p>
              <div className="h-40 border-t border-gray-400 pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyForecast}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ccc" />
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#000' }} axisLine={{ stroke: '#000' }} tickLine={{ stroke: '#000' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#000' }} axisLine={{ stroke: '#000' }} tickLine={{ stroke: '#000' }} tickFormatter={(val) => `$${val}`} />
                    <Line type="step" dataKey="pricePerMwh" stroke="#000" strokeWidth={2} dot={{ r: 2, fill: '#000' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="border border-gray-400 p-4">
              <h4 className="text-sm font-bold uppercase mb-3 bg-black text-white py-1 px-2 inline-block">14-Day Strategic Outlook</h4>
              <p className="text-xl font-bold mb-4">{bestMonthly ? `${bestMonthly.day} ${bestMonthly.time}` : 'Pending...'}</p>
              <div className="h-40 border-t border-gray-400 pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyForecast}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ccc" />
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#000' }} axisLine={{ stroke: '#000' }} tickLine={{ stroke: '#000' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#000' }} axisLine={{ stroke: '#000' }} tickLine={{ stroke: '#000' }} tickFormatter={(val) => `$${val}`} />
                    <Line type="step" dataKey="pricePerMwh" stroke="#555" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </section>

        {/* Tab Selection (Formalized) */}
        <div className="flex bg-white border-2 border-black border-b-0 w-max mb-0">
          <button 
            onClick={() => setActiveTab('factory')}
            className={clsx("py-2 px-6 font-bold text-sm uppercase transition-colors", 
              activeTab === 'factory' ? "bg-black text-white" : "hover:bg-gray-200 text-black border-r-2 border-black")}
          >
            Sect 1. Heavy Manufacturing
          </button>
          <button 
            onClick={() => setActiveTab('data')}
            className={clsx("py-2 px-6 font-bold text-sm uppercase transition-colors", 
              activeTab === 'data' ? "bg-black text-white" : "hover:bg-gray-200 text-black")}
          >
            Sect 2. Data Center Operations
          </button>
        </div>

        <div className="border-2 border-black p-6 grid grid-cols-1 xl:grid-cols-12 gap-8">
          
          {/* Left Column: Flow & Calculator */}
          <div className="xl:col-span-4 flex flex-col space-y-6 border-b xl:border-b-0 xl:border-r-2 border-black pb-6 xl:pb-0 xl:pr-6">
            <div>
              <h2 className="text-lg font-bold uppercase mb-2 border-b border-black pb-1">Form 42A: Load Shedding Parameters</h2>
              <p className="text-sm font-medium text-gray-700 leading-snug">
                {activeTab === 'factory' ? 
                  'Declare heavy manufacturing loads below to simulate displacement from critical wholesale price bands.' : 
                  'Declare IT & cooling limits to optimize batch processing away from critical price bands.'
                }
              </p>
            </div>

            <div className="border border-black p-4 bg-gray-50">
              <p className="font-bold text-sm uppercase mb-3 border-b-2 border-black pb-1">Input Variable: Megawatts (MW)</p>
              {activeTab === 'factory' ? (
                <>
                  <div className="flex justify-between items-end mb-2">
                    <span className="font-bold">Allocated Load:</span>
                    <span className="text-lg font-bold border-b border-black px-2">{energyUsageMW.toFixed(1)} MW</span>
                  </div>
                  <input type="range" min="0.5" max="25" step="0.5" value={energyUsageMW} onChange={(e) => setEnergyUsageMW(parseFloat(e.target.value))} className="w-full mt-2 accent-black" />
                </>
              ) : (
                <>
                  <div className="flex justify-between items-end mb-2">
                    <span className="font-bold">Allocated Load:</span>
                    <span className="text-lg font-bold border-b border-black px-2">{energyUsageDataMW.toFixed(1)} MW</span>
                  </div>
                  <input type="range" min="1" max="50" step="1" value={energyUsageDataMW} onChange={(e) => setEnergyUsageDataMW(parseFloat(e.target.value))} className="w-full mt-2 accent-black" />
                </>
              )}
            </div>

            <div className="border border-black">
              <h3 className="bg-black text-white p-2 font-bold uppercase text-sm">Shift Protocol Comparison</h3>
              <div className="p-4 space-y-4 bg-white">
                <div className="border-l-4 border-black pl-3">
                  <p className="text-xs font-bold uppercase mb-1">Baseline Status</p>
                  <select value={currentSelectedHourOffset} onChange={(e) => setCurrentSelectedHourOffset(parseInt(e.target.value))} className="bg-gray-100 border border-black text-black font-bold p-1 w-full uppercase outline-none mb-1">
                    {gridData24h.map((d:any) => <option key={"c"+d.hourOffset} value={d.hourOffset}>{d.time} (LOGGED)</option>)}
                  </select>
                  <p className="text-sm font-bold mt-1">RATE: ${currentSettings.pricePerMwh.toFixed(2)}/MWh</p>
                </div>
                
                <div className="border-l-4 border-gray-400 pl-3">
                  <p className="text-xs font-bold uppercase mb-1">Proposed Shift Window</p>
                  <select value={proposedSelectedHourOffset} onChange={(e) => setProposedSelectedHourOffset(parseInt(e.target.value))} className="bg-gray-100 border border-black text-black font-bold p-1 w-full uppercase outline-none mb-1">
                    {gridData24h.map((d:any) => <option key={"p"+d.hourOffset} value={d.hourOffset}>{d.time} (PROPOSED)</option>)}
                  </select>
                  <p className="text-sm font-bold mt-1">RATE: ${proposedSettings.pricePerMwh.toFixed(2)}/MWh</p>
                </div>
              </div>
            </div>

            <div className="border-4 border-black p-5 bg-white">
              <h3 className="font-bold uppercase text-lg border-b-2 border-black pb-2 mb-4">Calculated Financial Yield</h3>
              <p className="text-sm font-bold mb-1 uppercase">Total Savings Derived (Per Hour)</p>
              <p className="text-4xl font-extrabold text-black mb-4">
                {moneySaved > 0 ? "$" + moneySaved.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : "$0.00"} <span className="text-lg">NZD</span>
              </p>

              <p className="text-sm font-bold mb-1 uppercase pt-4 border-t border-black">Associated Emissions Avoidance</p>
              <p className="text-2xl font-bold">
                {carbonSaved > 0 ? carbonSaved.toFixed(1) : "0.0"} <span className="text-base text-gray-600">kg CO2e</span>
              </p>
            </div>
          </div>

          {/* Right Column: Chart */}
          <div className="xl:col-span-8 flex flex-col">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold uppercase underline">Exhibit A: 24h Spot Price Trajectory</h2>
                <p className="text-sm text-gray-800 font-medium mt-2">Verified wholesale pricing intervals extracted from daily operations. Dotted guidelines designate recommended arbitrage intervals.</p>
              </div>
              <div className="border-2 border-black px-3 py-1 font-bold text-xs uppercase bg-black text-white shrink-0 ml-4">
                Integrity: [{gridData[0].reliability}]
              </div>
            </div>

            <div className="grow w-full h-[400px] border-2 border-black p-4 bg-gray-50">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={gridData24h}>
                  <XAxis dataKey="time" tick={{fontSize: 12, fill: '#000', fontWeight: 'bold'}} tickMargin={10} minTickGap={30} axisLine={{stroke: '#000', strokeWidth: 2}} tickLine={{stroke: '#000', strokeWidth: 2}} />
                  <YAxis tick={{fontSize: 12, fill: '#000', fontWeight: 'bold'}} axisLine={{stroke: '#000', strokeWidth: 2}} tickLine={{stroke: '#000', strokeWidth: 2}} tickFormatter={(val) => `$${val}`} />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ccc" />
                  
                  <Tooltip 
                    contentStyle={{ borderRadius: '0px', border: '2px solid #000', backgroundColor: '#fff', fontWeight: 'bold', fontFamily: 'serif' }}
                    formatter={(value: any, name: any) => [
                      name === 'pricePerMwh' ? `$${value} / MWh` : `${value} km/h`, 
                      name === 'pricePerMwh' ? 'Audited Price' : 'Wind Speed'
                    ]}
                  />
                  
                  <ReferenceLine x={currentSettings.time} stroke="#000" strokeWidth={2} strokeDasharray="5 5" label={{ position: 'top', value: 'STATUS QUO (LOGGED)', fill: '#000', fontSize: 12, fontWeight: 'bold' }} />
                  <ReferenceLine x={proposedSettings.time} stroke="#000" strokeWidth={3} label={{ position: 'top', value: 'TARGET (PROPOSED)', fill: '#000', fontSize: 12, fontWeight: 'bold' }} />

                  <Area 
                    type="step" 
                    dataKey="pricePerMwh" 
                    stroke="#000" 
                    strokeWidth={2}
                    fillOpacity={0.1} 
                    fill="#000" 
                    activeDot={{ r: 5, fill: '#000', stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            <div className="border-t border-black mt-8 pt-4">
              <p className="text-xs uppercase font-bold text-center">END OF REPORT SECTION - CLASSIFIED AS ROUTINE OPERATIONS DATA</p>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
