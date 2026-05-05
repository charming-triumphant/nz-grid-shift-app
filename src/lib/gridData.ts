export function generateMockNZGridData() {
  const currentHour = new Date().getHours();
  // NZ Grid is primarily hydro, wind, and geothermal, which provides a low baseload (e.g. ~40-80 gCO2eq/kWh).
  // However, during morning (7am-9am) and evening (5pm-8pm) peaks, fossil peaker plants (Huntly coal/gas) are used, 
  // spiking emissions significantly (150-250 gCO2eq/kWh).
  
  const data = [];
  
  for (let i = 0; i < 24; i++) {
    const hour = (currentHour + i) % 24;
    let baseIntensity = 50 + Math.random() * 20; // Base renewable load
    let price = 0.12 + Math.random() * 0.05; // Base price ~12c/kWh
    
    // Morning Peak: 7 AM - 9 AM
    if (hour >= 7 && hour <= 9) {
      baseIntensity += 120 + Math.random() * 50; 
      price += 0.15 + Math.random() * 0.10;
    }
    // Evening Peak: 5 PM - 8 PM
    else if (hour >= 17 && hour <= 20) {
      baseIntensity += 150 + Math.random() * 70;
      price += 0.20 + Math.random() * 0.15;
    }
    // Deep night (Highly renewable / Cheap) 11 PM - 5 AM
    else if (hour >= 23 || hour <= 5) {
      baseIntensity -= 20;
      price -= 0.04;
    }

    const timeLabel = new Date(new Date().getTime() + i * 60 * 60 * 1000).toLocaleTimeString('en-NZ', {
      hour: '2-digit', minute: '2-digit'
    });

    data.push({
      hourOffset: i,
      hourOfDay: hour,
      time: timeLabel,
      carbonIntensity: Math.round(baseIntensity), // gCO2eq/kWh
      pricePerKwh: parseFloat(price.toFixed(2)),  // $ NZD
      recommendedAction: baseIntensity < 60 ? 'Optimal' : baseIntensity > 150 ? 'Avoid' : 'Neutral'
    });
  }
  
  return data;
}
