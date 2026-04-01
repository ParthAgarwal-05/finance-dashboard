/**
 * Investment Portfolio - Math Engine
 */

export const calculateSIP = (monthlyInvestment, annualRate, years) => {
  const i = annualRate / 12 / 100;
  const n = years * 12;
  
  // FV = P × [((1 + i)^n - 1) / i] × (1 + i)
  const finalValue = monthlyInvestment * (((Math.pow(1 + i, n) - 1) / i) * (1 + i));
  const totalInvested = monthlyInvestment * n;
  const estimatedReturns = finalValue - totalInvested;

  // Generate chart data
  const chartData = [];
  for (let y = 0; y <= years; y++) {
    const months = y * 12;
    const value = months === 0 ? 0 : monthlyInvestment * (((Math.pow(1 + i, months) - 1) / i) * (1 + i));
    chartData.push({
      year: `Yr ${y}`,
      invested: monthlyInvestment * months,
      value: Math.round(value)
    });
  }

  return { totalInvested, estimatedReturns, finalValue, chartData };
};

export const calculateLumpsum = (initialInvestment, annualRate, years) => {
  const r = annualRate / 100;
  
  // FV = P × (1 + r)^n
  const finalValue = initialInvestment * Math.pow(1 + r, years);
  const totalInvested = initialInvestment;
  const estimatedReturns = finalValue - totalInvested;

  const chartData = [];
  for (let y = 0; y <= years; y++) {
    const value = initialInvestment * Math.pow(1 + r, y);
    chartData.push({
      year: `Yr ${y}`,
      invested: initialInvestment,
      value: Math.round(value)
    });
  }

  return { totalInvested, estimatedReturns, finalValue, chartData };
};
