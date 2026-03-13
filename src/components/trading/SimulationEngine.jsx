// Simulation engine - generates realistic memecoin data and simulates trades

const MEMECOIN_NAMES = [
  { name: "DogWifHat", symbol: "WIF" },
  { name: "Bonk", symbol: "BONK" },
  { name: "Popcat", symbol: "POPCAT" },
  { name: "Cat in a Dogs World", symbol: "MEW" },
  { name: "Book of Meme", symbol: "BOME" },
  { name: "Slerf", symbol: "SLERF" },
  { name: "Wen", symbol: "WEN" },
  { name: "Myro", symbol: "MYRO" },
  { name: "Jeo Boden", symbol: "BODEN" },
  { name: "Harambe", symbol: "HARAMBE" },
  { name: "Mother Iggy", symbol: "MOTHER" },
  { name: "Neiro", symbol: "NEIRO" },
  { name: "Goatseus Maximus", symbol: "GOAT" },
  { name: "Fartcoin", symbol: "FART" },
  { name: "Peanut the Squirrel", symbol: "PNUT" },
  { name: "AI16Z", symbol: "AI16Z" },
  { name: "Griffain", symbol: "GRIF" },
  { name: "Pump Fun", symbol: "PUMP" },
  { name: "SolCat", symbol: "SCAT" },
  { name: "MoonDog", symbol: "MDOG" },
];

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function generateAddress() {
  const chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let addr = "";
  for (let i = 0; i < 44; i++) {
    addr += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return addr;
}

export function generateMemecoins(count = 15) {
  const shuffled = [...MEMECOIN_NAMES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map((coin) => ({
    name: coin.name,
    symbol: coin.symbol,
    address: generateAddress(),
    price: randomBetween(0.0000001, 0.01),
    price_change_pct: randomBetween(-60, 200),
    volume_24h: Math.floor(randomBetween(500, 500000)),
    market_cap: Math.floor(randomBetween(5000, 2000000)),
    liquidity_sol: randomBetween(5, 500),
    holders: Math.floor(randomBetween(10, 5000)),
    is_hot: Math.random() > 0.7,
    age_minutes: Math.floor(randomBetween(5, 1440)),
    buy_pressure: randomBetween(0.2, 0.9),
  }));
}

export function simulateTrade(token, settings) {
  const investmentSol = settings.investment_per_trade_sol || 0.5;
  const tokensBought = investmentSol / token.price;
  
  // Simulate price movement
  const volatility = randomBetween(0.3, 2.5);
  const trend = token.buy_pressure > 0.5 ? 0.1 : -0.15;
  const priceChange = (Math.random() - 0.45 + trend) * volatility;
  
  const sellPrice = token.price * (1 + priceChange);
  const profitLossSol = (sellPrice - token.price) * tokensBought;
  const profitLossPct = priceChange * 100;
  
  // Check stop loss / take profit
  const stopLossTriggered = profitLossPct <= -(settings.stop_loss_pct || 15);
  const takeProfitTriggered = profitLossPct >= (settings.take_profit_pct || 50);
  
  let finalSellPrice = sellPrice;
  let finalPnlPct = profitLossPct;
  let finalPnlSol = profitLossSol;
  
  if (stopLossTriggered) {
    finalPnlPct = -(settings.stop_loss_pct || 15);
    finalSellPrice = token.price * (1 + finalPnlPct / 100);
    finalPnlSol = (finalSellPrice - token.price) * tokensBought;
  } else if (takeProfitTriggered) {
    finalPnlPct = settings.take_profit_pct || 50;
    finalSellPrice = token.price * (1 + finalPnlPct / 100);
    finalPnlSol = (finalSellPrice - token.price) * tokensBought;
  }
  
  const strategies = ["quick_flip", "momentum", "dip_buy", "volume_spike"];
  const strategy = strategies[Math.floor(Math.random() * strategies.length)];
  
  return {
    token_name: token.name,
    token_symbol: token.symbol,
    token_address: token.address,
    buy_price: token.price,
    sell_price: finalSellPrice,
    amount_sol: investmentSol,
    tokens_bought: tokensBought,
    profit_loss_sol: parseFloat(finalPnlSol.toFixed(6)),
    profit_loss_pct: parseFloat(finalPnlPct.toFixed(2)),
    strategy: strategy,
    status: "closed",
    buy_timestamp: new Date(Date.now() - Math.floor(randomBetween(60000, 3600000))).toISOString(),
    sell_timestamp: new Date().toISOString(),
    stop_loss_triggered: stopLossTriggered,
    take_profit_triggered: takeProfitTriggered,
  };
}

export function evaluateToken(token, settings) {
  const reasons = [];
  let score = 0;
  
  if (token.liquidity_sol >= (settings.min_liquidity_sol || 10)) {
    score += 20;
    reasons.push("Liquidité suffisante");
  } else {
    reasons.push("Liquidité insuffisante");
  }
  
  if (token.volume_24h >= (settings.min_volume_24h || 1000)) {
    score += 20;
    reasons.push("Volume 24h OK");
  } else {
    reasons.push("Volume trop faible");
  }
  
  if (token.market_cap <= (settings.max_market_cap || 500000)) {
    score += 15;
    reasons.push("Market cap dans la cible");
  } else {
    reasons.push("Market cap trop élevé");
  }
  
  if (token.holders >= (settings.min_holders || 50)) {
    score += 15;
    reasons.push("Assez de holders");
  } else {
    reasons.push("Pas assez de holders");
  }
  
  if (token.buy_pressure > 0.6) {
    score += 15;
    reasons.push("Forte pression d'achat");
  }
  
  if (token.price_change_pct > 20 && token.price_change_pct < 150) {
    score += 15;
    reasons.push("Momentum positif");
  }
  
  return { score, reasons, eligible: score >= 50 };
}

export const DEFAULT_SETTINGS = {
  name: "default",
  investment_per_trade_sol: 0.5,
  stop_loss_pct: 15,
  take_profit_pct: 50,
  min_liquidity_sol: 10,
  min_volume_24h: 1000,
  max_market_cap: 500000,
  min_holders: 50,
  auto_sell_after_minutes: 60,
  max_open_trades: 5,
  strategies_enabled: ["quick_flip", "momentum", "dip_buy", "volume_spike"],
  is_active: true,
};