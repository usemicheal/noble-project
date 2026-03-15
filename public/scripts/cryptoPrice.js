// cryptoPrice.js
// Fetches live prices, multiplies by user's coin holdings,
// updates the UI, then silently saves the total as walletValue.

const COIN_IDS =
  "bitcoin,ethereum,tether,stellar,ripple,litecoin,dogecoin,binancecoin,shiba-inu,tron,cardano,solana,polygon-ecosystem-token,algorand,official-trump,pepe";

// Map: CoinGecko id  →  { holdingId, amountId, priceId, predictId }
const COIN_MAP = {
  bitcoin:                    { holding: "btc",   amountId: "btc_amount",           priceId: "bitcoin_price",                    predictId: "bitcoin_predict" },
  ethereum:                   { holding: "eth",   amountId: "eth_amount",           priceId: "ethereum_price",                   predictId: "ethereum_predict" },
  tether:                     { holding: "usdt",  amountId: "usdt_amount",          priceId: "tether_price",                     predictId: "tether_predict" },
  stellar:                    { holding: "xlm",   amountId: "xlm_amount",           priceId: "stellar_price",                    predictId: "stellar_predict" },
  ripple:                     { holding: "xrp",   amountId: "xrp_amount",           priceId: "ripple_price",                     predictId: "ripple_predict" },    // ← was "xrp_predict" in old code
  litecoin:                   { holding: "ltc",   amountId: "ltc_amount",           priceId: "litecoin_price",                   predictId: "litecoin_predict" },
  dogecoin:                   { holding: "doge",  amountId: "doge_amount",          priceId: "dogecoin_price",                   predictId: "dogecoin_predict" },
  binancecoin:                { holding: "bnb",   amountId: "bnb_amount",           priceId: "binancecoin_price",                predictId: "binancecoin_predict" },
  "shiba-inu":                { holding: "shib",  amountId: "shib_amount",          priceId: "shiba-inu_price",                  predictId: "shiba-inu_predict" },
  tron:                       { holding: "trx",   amountId: "tron_amount",          priceId: "tron_price",                       predictId: "tron_predict" },
  cardano:                    { holding: "ada",   amountId: "cardano_amount",       priceId: "cardano_price",                    predictId: "cardano_predict" },
  solana:                     { holding: "sol",   amountId: "sol_amount",           priceId: "solana_price",                     predictId: "solana_predict" },
  "polygon-ecosystem-token":  { holding: "matic", amountId: "matic_amount",         priceId: "polygon-ecosystem-token_price",    predictId: "polygon-ecosystem-token_predict" },
  algorand:                   { holding: "algo",  amountId: "algo_amount",          priceId: "algorand_price",                   predictId: "algorand_predict" },
  "official-trump":           { holding: "trump", amountId: "official_trump_amount",priceId: "official_trump_price",             predictId: "official_trump_predict" },
  pepe:                       { holding: "pepe",  amountId: "pepe_amount",          priceId: "pepe_price",                       predictId: "pepe_predict" },
};

// Holdings are injected by the EJS dashboard template into this global object.
// e.g.  window.USER_HOLDINGS = { btc: 0.5, eth: 2, usdt: 1000, ... }
// If for some reason it isn't set, fall back to all zeros.
const holdings = window.USER_HOLDINGS || {};

async function fetchCryptoData() {
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${COIN_IDS}`
    );
    const data = await res.json();

    let totalUSD = 0;

    data.forEach((coin) => {
      const map = COIN_MAP[coin.id];
      if (!map) return;

      const qty = parseFloat(holdings[map.holding] || 0);
      const price = coin.current_price || 0;
      const fiatValue = qty * price;
      totalUSD += fiatValue;

      // Update fiat amount label
      const amountElem = document.getElementById(map.amountId);
      if (amountElem) {
        amountElem.textContent = `$${fiatValue.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })} USD`;
      }

      // Update live price label
      const priceElem = document.getElementById(map.priceId);
      if (priceElem) {
        priceElem.textContent = `$ ${price.toLocaleString()}`;
      }

      // Update 24h trend
      const predictElem = document.getElementById(map.predictId);
      if (predictElem) {
        const change = coin.price_change_percentage_24h?.toFixed(2);
        if (change > 0) {
          predictElem.innerHTML = `<i class="bi bi-caret-up-fill pe-2"></i>Up by +${change}%`;
          predictElem.className = predictElem.className
            .replace("color-red-dark", "")
            .replace("color-green-dark", "") + " color-green-dark";
        } else if (change < 0) {
          predictElem.innerHTML = `<i class="bi bi-caret-down-fill pe-2"></i>Down by ${change}%`;
          predictElem.className = predictElem.className
            .replace("color-green-dark", "")
            .replace("color-red-dark", "") + " color-red-dark";
        } else {
          predictElem.innerHTML = `<i class="bi bi-dash pe-2"></i>${change}%`;
        }
      }
    });

    // Update the Assets Valuation display if the element exists
    const totalElem = document.querySelector(".totalbal");
    if (totalElem) {
      totalElem.innerHTML = `<h1 class="font-700 font-30">$${totalUSD.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}</h1>`;
    }

    // Silently save the new walletValue to the server
    saveWalletValue(totalUSD.toFixed(2));

  } catch (err) {
    console.error("Error fetching crypto data:", err);
  }
}

function saveWalletValue(total) {
  fetch("/secure/update-wallet-value", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ walletValue: total }),
  }).catch((err) => console.error("Failed to save wallet value:", err));
}

// Initial load
fetchCryptoData();

// Refresh every 60 seconds
setInterval(fetchCryptoData, 60000);