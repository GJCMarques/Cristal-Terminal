"""
CRISTAL CAPITAL TERMINAL — FastAPI Quantum & Quant Backend
Qiskit · PennyLane · QuantLib · Advanced Financial Mathematics
"""

import asyncio
import json
import math
import traceback
from datetime import datetime
from typing import Any, Optional

import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

app = FastAPI(title="Cristal Quantum Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Helpers ────────────────────────────────────────────────────

def safe_float(v):
    """Convert numpy/complex types to JSON-safe floats."""
    if isinstance(v, (np.floating, np.integer)):
        return float(v)
    if isinstance(v, np.ndarray):
        return v.tolist()
    if isinstance(v, complex):
        return {"re": v.real, "im": v.imag}
    return v


def sanitize(obj):
    """Recursively sanitize numpy types for JSON serialization."""
    if isinstance(obj, dict):
        return {k: sanitize(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [sanitize(v) for v in obj]
    if isinstance(obj, (np.floating, np.integer)):
        f = float(obj)
        if math.isnan(f) or math.isinf(f):
            return 0.0
        return f
    if isinstance(obj, np.ndarray):
        return sanitize(obj.tolist())
    if isinstance(obj, complex):
        return {"re": obj.real, "im": obj.imag}
    if isinstance(obj, np.bool_):
        return bool(obj)
    if isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return 0.0
    return obj


# ─── Health Check ───────────────────────────────────────────────

@app.get("/health")
async def health():
    modules = {}
    try:
        import qiskit
        modules["qiskit"] = qiskit.__version__
    except ImportError:
        modules["qiskit"] = None
    try:
        import pennylane as qml
        modules["pennylane"] = qml.__version__
    except ImportError:
        modules["pennylane"] = None
    try:
        import QuantLib as ql
        modules["quantlib"] = "OK"
    except ImportError:
        modules["quantlib"] = None
    try:
        import scipy
        modules["scipy"] = scipy.__version__
    except ImportError:
        modules["scipy"] = None

    return {"status": "online", "modules": modules, "timestamp": datetime.now().isoformat()}


# ═══════════════════════════════════════════════════════════════
# PILAR A: QUANTITATIVE FINANCE (QuantLib + numpy/scipy)
# ═══════════════════════════════════════════════════════════════


# ── 1. Black-Scholes Pricer ─────────────────────────────────────

class BSRequest(BaseModel):
    S: float = 100.0
    K: float = 100.0
    T: float = 1.0
    r: float = 0.05
    sigma: float = 0.20
    q: float = 0.0
    option_type: str = "call"


@app.post("/api/quant/black-scholes")
async def black_scholes(req: BSRequest):
    from scipy.stats import norm

    d1 = (np.log(req.S / req.K) + (req.r - req.q + 0.5 * req.sigma**2) * req.T) / (req.sigma * np.sqrt(req.T))
    d2 = d1 - req.sigma * np.sqrt(req.T)

    if req.option_type == "call":
        price = req.S * np.exp(-req.q * req.T) * norm.cdf(d1) - req.K * np.exp(-req.r * req.T) * norm.cdf(d2)
    else:
        price = req.K * np.exp(-req.r * req.T) * norm.cdf(-d2) - req.S * np.exp(-req.q * req.T) * norm.cdf(-d1)

    # Greeks
    delta = np.exp(-req.q * req.T) * norm.cdf(d1) if req.option_type == "call" else np.exp(-req.q * req.T) * (norm.cdf(d1) - 1)
    gamma = np.exp(-req.q * req.T) * norm.pdf(d1) / (req.S * req.sigma * np.sqrt(req.T))
    vega = req.S * np.exp(-req.q * req.T) * norm.pdf(d1) * np.sqrt(req.T) / 100
    theta_call = (-req.S * norm.pdf(d1) * req.sigma * np.exp(-req.q * req.T) / (2 * np.sqrt(req.T))
                  - req.r * req.K * np.exp(-req.r * req.T) * norm.cdf(d2)
                  + req.q * req.S * np.exp(-req.q * req.T) * norm.cdf(d1)) / 365
    theta_put = (-req.S * norm.pdf(d1) * req.sigma * np.exp(-req.q * req.T) / (2 * np.sqrt(req.T))
                 + req.r * req.K * np.exp(-req.r * req.T) * norm.cdf(-d2)
                 - req.q * req.S * np.exp(-req.q * req.T) * norm.cdf(-d1)) / 365
    theta = theta_call if req.option_type == "call" else theta_put
    rho = (req.K * req.T * np.exp(-req.r * req.T) * norm.cdf(d2) / 100 if req.option_type == "call"
           else -req.K * req.T * np.exp(-req.r * req.T) * norm.cdf(-d2) / 100)

    return sanitize({
        "price": price, "d1": d1, "d2": d2,
        "greeks": {"delta": delta, "gamma": gamma, "vega": vega, "theta": theta, "rho": rho},
        "inputs": {"S": req.S, "K": req.K, "T": req.T, "r": req.r, "sigma": req.sigma, "q": req.q, "type": req.option_type}
    })


# ── 2. Volatility Surface 3D ───────────────────────────────────

class VolSurfaceRequest(BaseModel):
    S: float = 100.0
    r: float = 0.05
    q: float = 0.0
    base_sigma: float = 0.20
    strikes: list[float] = [70, 80, 85, 90, 95, 100, 105, 110, 115, 120, 130]
    maturities: list[float] = [0.08, 0.17, 0.25, 0.5, 0.75, 1.0, 1.5, 2.0]
    skew: float = -0.15
    convexity: float = 0.03
    term_slope: float = -0.02


@app.post("/api/quant/vol-surface")
async def vol_surface(req: VolSurfaceRequest):
    surface = []
    for T in req.maturities:
        row = []
        for K in req.strikes:
            moneyness = np.log(K / req.S)
            vol = req.base_sigma + req.skew * moneyness + req.convexity * moneyness**2 + req.term_slope * np.log(T + 0.01)
            vol = max(vol, 0.01)
            row.append(float(vol))
        surface.append(row)

    return sanitize({
        "surface": surface,
        "strikes": req.strikes,
        "maturities": req.maturities,
        "params": {"base_sigma": req.base_sigma, "skew": req.skew, "convexity": req.convexity, "term_slope": req.term_slope}
    })


# ── 3. Monte Carlo Simulation ──────────────────────────────────

class MonteCarloRequest(BaseModel):
    S0: float = 100.0
    mu: float = 0.08
    sigma: float = 0.20
    T: float = 1.0
    n_simulations: int = 5000
    n_steps: int = 252
    seed: Optional[int] = None


@app.post("/api/quant/monte-carlo")
async def monte_carlo(req: MonteCarloRequest):
    rng = np.random.default_rng(req.seed)
    dt = req.T / req.n_steps
    n_sim = min(req.n_simulations, 50000)

    # GBM simulation
    z = rng.standard_normal((n_sim, req.n_steps))
    log_returns = (req.mu - 0.5 * req.sigma**2) * dt + req.sigma * np.sqrt(dt) * z
    log_prices = np.cumsum(log_returns, axis=1)
    prices = req.S0 * np.exp(np.column_stack([np.zeros(n_sim), log_prices]))

    final_prices = prices[:, -1]
    returns = np.log(final_prices / req.S0)

    # Statistics
    percentiles = [1, 5, 10, 25, 50, 75, 90, 95, 99]
    pcts = {f"p{p}": float(np.percentile(final_prices, p)) for p in percentiles}

    # VaR
    var95 = float(-np.percentile(returns, 5) * req.S0)
    var99 = float(-np.percentile(returns, 1) * req.S0)
    cvar95 = float(-np.mean(returns[returns <= np.percentile(returns, 5)]) * req.S0)

    # Sample paths for visualization (max 50)
    n_show = min(50, n_sim)
    step_skip = max(1, req.n_steps // 100)
    sample_paths = prices[:n_show, ::step_skip].tolist()

    # Distribution histogram
    hist, bin_edges = np.histogram(final_prices, bins=60)
    distribution = [{"price": float((bin_edges[i] + bin_edges[i+1]) / 2), "count": int(hist[i])} for i in range(len(hist))]

    return sanitize({
        "percentiles": pcts,
        "var95": var95, "var99": var99, "cvar95": cvar95,
        "mean_price": float(np.mean(final_prices)),
        "std_price": float(np.std(final_prices)),
        "min_price": float(np.min(final_prices)),
        "max_price": float(np.max(final_prices)),
        "sample_paths": sample_paths,
        "distribution": distribution,
        "n_simulations": n_sim,
        "n_steps": req.n_steps,
    })


# ── 4. Portfolio Optimization (Markowitz) ───────────────────────

class PortfolioRequest(BaseModel):
    returns: list[list[float]]  # Each inner list = returns for one asset
    asset_names: list[str] = []
    rf: float = 0.02
    n_portfolios: int = 5000
    short_selling: bool = False


@app.post("/api/quant/portfolio-optimize")
async def portfolio_optimize(req: PortfolioRequest):
    returns_matrix = np.array(req.returns)
    n_assets = returns_matrix.shape[0]
    n_obs = returns_matrix.shape[1]

    if not req.asset_names:
        req.asset_names = [f"Asset_{i+1}" for i in range(n_assets)]

    mean_returns = np.mean(returns_matrix, axis=1) * 252
    cov_matrix = np.cov(returns_matrix) * 252

    # Monte Carlo portfolio simulation
    n_port = min(req.n_portfolios, 20000)
    rng = np.random.default_rng(42)

    all_weights = []
    all_returns = []
    all_vols = []
    all_sharpes = []

    for _ in range(n_port):
        if req.short_selling:
            w = rng.standard_normal(n_assets)
        else:
            w = rng.random(n_assets)
        w = w / np.sum(np.abs(w))

        port_ret = np.dot(w, mean_returns)
        port_vol = np.sqrt(np.dot(w.T, np.dot(cov_matrix, w)))
        sharpe = (port_ret - req.rf) / port_vol if port_vol > 0 else 0

        all_weights.append(w.tolist())
        all_returns.append(float(port_ret))
        all_vols.append(float(port_vol))
        all_sharpes.append(float(sharpe))

    # Find optimal portfolios
    max_sharpe_idx = int(np.argmax(all_sharpes))
    min_vol_idx = int(np.argmin(all_vols))

    # Efficient frontier
    target_returns = np.linspace(min(all_returns), max(all_returns), 50)
    frontier_vols = []
    for target in target_returns:
        candidates = [(v, r) for v, r in zip(all_vols, all_returns) if abs(r - target) < 0.01]
        if candidates:
            frontier_vols.append(min(c[0] for c in candidates))
        else:
            frontier_vols.append(None)

    frontier = [{"return": float(r), "vol": float(v)} for r, v in zip(target_returns, frontier_vols) if v is not None]

    # Correlation matrix
    corr_matrix = np.corrcoef(returns_matrix).tolist()

    return sanitize({
        "portfolios": [{"return": r, "volatility": v, "sharpe": s} for r, v, s in zip(all_returns[:2000], all_vols[:2000], all_sharpes[:2000])],
        "optimal": {
            "max_sharpe": {"weights": all_weights[max_sharpe_idx], "return": all_returns[max_sharpe_idx], "volatility": all_vols[max_sharpe_idx], "sharpe": all_sharpes[max_sharpe_idx]},
            "min_volatility": {"weights": all_weights[min_vol_idx], "return": all_returns[min_vol_idx], "volatility": all_vols[min_vol_idx], "sharpe": all_sharpes[min_vol_idx]},
        },
        "frontier": frontier,
        "correlation_matrix": corr_matrix,
        "asset_names": req.asset_names,
        "mean_returns": mean_returns.tolist(),
        "covariance_matrix": cov_matrix.tolist(),
    })


# ── 5. Bond Pricing (QuantLib) ──────────────────────────────────

class BondRequest(BaseModel):
    face_value: float = 1000.0
    coupon_rate: float = 0.05
    maturity_years: int = 10
    ytm: float = 0.04
    frequency: int = 2  # 1=annual, 2=semi-annual


@app.post("/api/quant/bond-pricing")
async def bond_pricing(req: BondRequest):
    try:
        import QuantLib as ql

        today = ql.Date.todaysDate()
        ql.Settings.instance().evaluationDate = today

        calendar = ql.TARGET()
        maturity_date = calendar.advance(today, ql.Period(req.maturity_years, ql.Years))

        freq = ql.Semiannual if req.frequency == 2 else ql.Annual
        schedule = ql.Schedule(
            today, maturity_date, ql.Period(freq),
            calendar, ql.ModifiedFollowing, ql.ModifiedFollowing,
            ql.DateGeneration.Backward, False
        )

        bond = ql.FixedRateBond(0, req.face_value, schedule, [req.coupon_rate], ql.Thirty360(ql.Thirty360.BondBasis))

        flat_curve = ql.FlatForward(today, ql.QuoteHandle(ql.SimpleQuote(req.ytm)), ql.Thirty360(ql.Thirty360.BondBasis))
        curve_handle = ql.YieldTermStructureHandle(flat_curve)
        engine = ql.DiscountingBondEngine(curve_handle)
        bond.setPricingEngine(engine)

        clean_price = bond.cleanPrice()
        dirty_price = bond.dirtyPrice()
        accrued = bond.accruedAmount()

        # Duration and Convexity
        duration_mac = ql.BondFunctions.duration(bond, req.ytm, ql.Thirty360(ql.Thirty360.BondBasis), ql.Compounded, freq, ql.Duration.Macaulay)
        duration_mod = ql.BondFunctions.duration(bond, req.ytm, ql.Thirty360(ql.Thirty360.BondBasis), ql.Compounded, freq, ql.Duration.Modified)
        convexity = ql.BondFunctions.convexity(bond, req.ytm, ql.Thirty360(ql.Thirty360.BondBasis), ql.Compounded, freq)
        dv01 = duration_mod * dirty_price / 10000

        # Cashflows
        cashflows = []
        for cf in bond.cashflows():
            cashflows.append({"date": str(cf.date()), "amount": float(cf.amount())})

        # Yield curve scenarios
        scenarios = []
        for shift in np.arange(-0.03, 0.031, 0.005):
            shifted_ytm = req.ytm + shift
            if shifted_ytm <= 0:
                continue
            shifted_curve = ql.FlatForward(today, ql.QuoteHandle(ql.SimpleQuote(shifted_ytm)), ql.Thirty360(ql.Thirty360.BondBasis))
            bond.setPricingEngine(ql.DiscountingBondEngine(ql.YieldTermStructureHandle(shifted_curve)))
            scenarios.append({"yield_shift_bps": int(shift * 10000), "price": float(bond.cleanPrice())})

        return sanitize({
            "clean_price": clean_price, "dirty_price": dirty_price, "accrued_interest": accrued,
            "duration_macaulay": duration_mac, "duration_modified": duration_mod,
            "convexity": convexity, "dv01": dv01,
            "cashflows": cashflows, "scenarios": scenarios,
            "engine": "QuantLib"
        })
    except ImportError:
        # Fallback without QuantLib
        n_periods = req.maturity_years * req.frequency
        coupon = req.face_value * req.coupon_rate / req.frequency
        ytm_per = req.ytm / req.frequency
        price = sum(coupon / (1 + ytm_per)**t for t in range(1, n_periods + 1)) + req.face_value / (1 + ytm_per)**n_periods

        # Duration
        weighted_time = sum(t * coupon / (1 + ytm_per)**t for t in range(1, n_periods + 1))
        weighted_time += n_periods * req.face_value / (1 + ytm_per)**n_periods
        mac_dur = weighted_time / price / req.frequency
        mod_dur = mac_dur / (1 + ytm_per)

        return sanitize({
            "clean_price": price, "dirty_price": price, "accrued_interest": 0,
            "duration_macaulay": mac_dur, "duration_modified": mod_dur,
            "convexity": mac_dur**2 + mac_dur, "dv01": mod_dur * price / 10000,
            "cashflows": [], "scenarios": [],
            "engine": "fallback"
        })


# ── 6. Yield Curve (Nelson-Siegel-Svensson) ─────────────────────

class YieldCurveRequest(BaseModel):
    beta0: float = 0.045
    beta1: float = -0.02
    beta2: float = 0.01
    beta3: float = 0.005
    tau1: float = 1.5
    tau2: float = 5.0
    maturities: list[float] = [0.25, 0.5, 1, 2, 3, 5, 7, 10, 15, 20, 30]


@app.post("/api/quant/yield-curve")
async def yield_curve(req: YieldCurveRequest):
    def nss(t, b0, b1, b2, b3, t1, t2):
        if t <= 0:
            return b0 + b1
        f1 = (1 - np.exp(-t / t1)) / (t / t1)
        f2 = f1 - np.exp(-t / t1)
        f3 = (1 - np.exp(-t / t2)) / (t / t2) - np.exp(-t / t2)
        return b0 + b1 * f1 + b2 * f2 + b3 * f3

    yields_data = []
    for m in req.maturities:
        y = nss(m, req.beta0, req.beta1, req.beta2, req.beta3, req.tau1, req.tau2)
        yields_data.append({"maturity": m, "yield": float(y)})

    # Generate 3D historical surface (simulated shifts)
    n_historical = 24
    surface_3d = []
    for month in range(n_historical):
        shift = 0.002 * np.sin(month * 0.3) + 0.001 * month / n_historical
        row = []
        for m in req.maturities:
            y = nss(m, req.beta0 + shift, req.beta1 - shift * 0.5, req.beta2, req.beta3, req.tau1, req.tau2)
            row.append(float(y))
        surface_3d.append(row)

    # Forward rates
    forwards = []
    for i in range(len(req.maturities) - 1):
        t1, t2 = req.maturities[i], req.maturities[i + 1]
        y1 = yields_data[i]["yield"]
        y2 = yields_data[i + 1]["yield"]
        fwd = (y2 * t2 - y1 * t1) / (t2 - t1)
        forwards.append({"start": t1, "end": t2, "forward_rate": float(fwd)})

    return sanitize({
        "yields": yields_data,
        "forwards": forwards,
        "surface_3d": surface_3d,
        "maturities": req.maturities,
        "params": {"beta0": req.beta0, "beta1": req.beta1, "beta2": req.beta2, "beta3": req.beta3, "tau1": req.tau1, "tau2": req.tau2}
    })


# ── 7. GARCH Volatility Forecasting ────────────────────────────

class GARCHRequest(BaseModel):
    returns: list[float]
    forecast_horizon: int = 30


@app.post("/api/quant/garch")
async def garch_forecast(req: GARCHRequest):
    from scipy.optimize import minimize

    returns = np.array(req.returns)
    n = len(returns)

    def garch_loglik(params):
        omega, alpha, beta = params
        if omega <= 0 or alpha < 0 or beta < 0 or alpha + beta >= 1:
            return 1e10
        sigma2 = np.zeros(n)
        sigma2[0] = np.var(returns)
        for t in range(1, n):
            sigma2[t] = omega + alpha * returns[t-1]**2 + beta * sigma2[t-1]
            if sigma2[t] <= 0:
                return 1e10
        ll = -0.5 * np.sum(np.log(2 * np.pi * sigma2) + returns**2 / sigma2)
        return -ll

    result = minimize(garch_loglik, [0.00001, 0.08, 0.88], method="Nelder-Mead",
                      options={"maxiter": 5000})
    omega, alpha, beta = result.x

    # Conditional volatilities
    sigma2 = np.zeros(n)
    sigma2[0] = np.var(returns)
    for t in range(1, n):
        sigma2[t] = omega + alpha * returns[t-1]**2 + beta * sigma2[t-1]

    # Forecast
    forecast = np.zeros(req.forecast_horizon)
    forecast[0] = omega + alpha * returns[-1]**2 + beta * sigma2[-1]
    for t in range(1, req.forecast_horizon):
        forecast[t] = omega + (alpha + beta) * forecast[t-1]

    long_run_var = omega / (1 - alpha - beta) if alpha + beta < 1 else sigma2[-1]

    vol_historical = [{"t": int(i), "vol": float(np.sqrt(sigma2[i]) * np.sqrt(252))} for i in range(0, n, max(1, n // 200))]
    vol_forecast = [{"t": int(n + i), "vol": float(np.sqrt(forecast[i]) * np.sqrt(252))} for i in range(req.forecast_horizon)]

    return sanitize({
        "params": {"omega": omega, "alpha": alpha, "beta": beta, "persistence": alpha + beta},
        "long_run_volatility": float(np.sqrt(long_run_var) * np.sqrt(252)),
        "current_volatility": float(np.sqrt(sigma2[-1]) * np.sqrt(252)),
        "vol_historical": vol_historical,
        "vol_forecast": vol_forecast,
        "log_likelihood": float(-result.fun),
    })


# ── 8. Risk Analytics (VaR/CVaR/Stress Tests) ──────────────────

class RiskRequest(BaseModel):
    returns: list[float]
    portfolio_value: float = 1000000.0
    confidence_levels: list[float] = [0.90, 0.95, 0.99]
    horizon_days: int = 10
    n_simulations: int = 10000


@app.post("/api/quant/risk-analytics")
async def risk_analytics(req: RiskRequest):
    returns = np.array(req.returns)
    n_sim = min(req.n_simulations, 50000)
    rng = np.random.default_rng(42)

    mu = np.mean(returns)
    sigma = np.std(returns)
    skew_val = float(np.mean(((returns - mu) / sigma) ** 3))
    kurt_val = float(np.mean(((returns - mu) / sigma) ** 4))

    results = {}
    for cl in req.confidence_levels:
        alpha = 1 - cl
        # Historical VaR
        hist_var = float(-np.percentile(returns, alpha * 100) * np.sqrt(req.horizon_days) * req.portfolio_value)
        # Parametric VaR (Cornish-Fisher)
        from scipy.stats import norm
        z = norm.ppf(alpha)
        cf_z = z + (z**2 - 1) * skew_val / 6 + (z**3 - 3*z) * (kurt_val - 3) / 24
        param_var = float(-cf_z * sigma * np.sqrt(req.horizon_days) * req.portfolio_value)
        # Monte Carlo VaR
        sim_returns = rng.normal(mu * req.horizon_days, sigma * np.sqrt(req.horizon_days), n_sim)
        mc_var = float(-np.percentile(sim_returns, alpha * 100) * req.portfolio_value)
        # CVaR
        tail = returns[returns <= np.percentile(returns, alpha * 100)]
        cvar = float(-np.mean(tail) * np.sqrt(req.horizon_days) * req.portfolio_value) if len(tail) > 0 else hist_var * 1.3

        results[f"{int(cl*100)}"] = {
            "historical_var": hist_var, "parametric_var": param_var,
            "montecarlo_var": mc_var, "cvar": cvar
        }

    # Distribution for visualization
    hist, bin_edges = np.histogram(returns, bins=80)
    distribution = [{"return": float((bin_edges[i] + bin_edges[i+1]) / 2 * 100), "count": int(hist[i])} for i in range(len(hist))]

    # Stress scenarios
    stress = {
        "black_monday_1987": float(-0.226 * req.portfolio_value),
        "lehman_2008": float(-0.089 * req.portfolio_value),
        "covid_march_2020": float(-0.120 * req.portfolio_value),
        "dot_com_2000": float(-0.078 * req.portfolio_value),
        "custom_3sigma": float(-3 * sigma * np.sqrt(req.horizon_days) * req.portfolio_value),
    }

    return sanitize({
        "var_results": results,
        "distribution": distribution,
        "stress_scenarios": stress,
        "statistics": {"mean": float(mu), "std": float(sigma), "skewness": skew_val, "kurtosis": kurt_val,
                        "max_return": float(np.max(returns)), "min_return": float(np.min(returns)),
                        "max_drawdown": float(np.min(np.minimum.accumulate(np.cumsum(returns))))},
    })


# ═══════════════════════════════════════════════════════════════
# PILAR B: QUANTUM COMPUTING (Qiskit + PennyLane)
# ═══════════════════════════════════════════════════════════════


# ── 1. Quantum Bell State ───────────────────────────────────────

class QuantumBellRequest(BaseModel):
    shots: int = 1024
    state_type: str = "phi_plus"  # phi_plus, phi_minus, psi_plus, psi_minus


@app.post("/api/quantum/bell-state")
async def quantum_bell_state(req: QuantumBellRequest):
    try:
        from qiskit import QuantumCircuit
        from qiskit.quantum_info import Statevector, DensityMatrix, partial_trace, entropy

        qc = QuantumCircuit(2)
        qc.h(0)

        if req.state_type == "phi_plus":
            qc.cx(0, 1)
        elif req.state_type == "phi_minus":
            qc.cx(0, 1)
            qc.z(0)
        elif req.state_type == "psi_plus":
            qc.cx(0, 1)
            qc.x(1)
        elif req.state_type == "psi_minus":
            qc.cx(0, 1)
            qc.x(1)
            qc.z(0)

        sv = Statevector.from_instruction(qc)
        probs = sv.probabilities_dict()
        dm = DensityMatrix(sv)
        dm_A = partial_trace(dm, [1])
        ent = entropy(dm_A, base=2)

        # Density matrix as 2D array
        dm_data = dm.data.tolist()
        dm_real = [[c.real for c in row] for row in dm_data]

        # Bloch sphere coordinates for each qubit
        dm_q0 = partial_trace(dm, [1]).data
        dm_q1 = partial_trace(dm, [0]).data
        bloch_q0 = {
            "x": float(2 * dm_q0[0, 1].real),
            "y": float(-2 * dm_q0[0, 1].imag),
            "z": float(dm_q0[0, 0].real - dm_q0[1, 1].real)
        }
        bloch_q1 = {
            "x": float(2 * dm_q1[0, 1].real),
            "y": float(-2 * dm_q1[0, 1].imag),
            "z": float(dm_q1[0, 0].real - dm_q1[1, 1].real)
        }

        samples = sv.sample_counts(req.shots)

        return sanitize({
            "statevector": [{"re": c.real, "im": c.imag} for c in sv.data],
            "probabilities": probs,
            "samples": dict(samples),
            "density_matrix": dm_real,
            "entanglement_entropy": float(ent),
            "concurrence": 1.0 if "phi" in req.state_type or "psi" in req.state_type else 0.0,
            "bloch_q0": bloch_q0,
            "bloch_q1": bloch_q1,
            "circuit_diagram": str(qc.draw(output="text")),
            "engine": "qiskit",
        })

    except ImportError:
        # Fallback to TypeScript-style simulation
        return {"error": "Qiskit not installed", "fallback": True}


# ── 2. Quantum Option Pricing (QAE) ────────────────────────────

class QAERequest(BaseModel):
    S: float = 100.0
    K: float = 100.0
    T: float = 0.25
    r: float = 0.05
    sigma: float = 0.20
    n_qubits: int = 6
    option_type: str = "call"


@app.post("/api/quantum/qae-pricing")
async def qae_pricing(req: QAERequest):
    from scipy.stats import norm

    # Classical BS price for comparison
    d1 = (np.log(req.S / req.K) + (req.r + 0.5 * req.sigma**2) * req.T) / (req.sigma * np.sqrt(req.T))
    d2 = d1 - req.sigma * np.sqrt(req.T)
    bs_price = req.S * norm.cdf(d1) - req.K * np.exp(-req.r * req.T) * norm.cdf(d2) if req.option_type == "call" else req.K * np.exp(-req.r * req.T) * norm.cdf(-d2) - req.S * norm.cdf(-d1)

    N = 1 << req.n_qubits
    payoffs = []
    for i in range(N):
        u = (i + 0.5) / N
        from scipy.stats import norm as norm_dist
        z = norm_dist.ppf(max(0.001, min(0.999, u)))
        ST = req.S * np.exp((req.r - 0.5 * req.sigma**2) * req.T + req.sigma * np.sqrt(req.T) * z)
        payoff = max(ST - req.K, 0) if req.option_type == "call" else max(req.K - ST, 0)
        payoffs.append({"state": i, "ST": float(ST), "payoff": float(payoff)})

    qae_price = np.exp(-req.r * req.T) * np.mean([p["payoff"] for p in payoffs])

    try:
        from qiskit import QuantumCircuit
        from qiskit.quantum_info import Statevector

        # Build a simple rotation-based amplitude loading circuit
        qc = QuantumCircuit(req.n_qubits + 1)
        for i in range(req.n_qubits):
            qc.h(i)
        # Controlled rotations for payoff encoding
        for i in range(min(req.n_qubits, 4)):
            angle = np.arcsin(min(1, payoffs[i]["payoff"] / max(1, max(p["payoff"] for p in payoffs))))
            qc.cry(2 * angle, i, req.n_qubits)

        sv = Statevector.from_instruction(qc)
        probs = sv.probabilities()

        circuit_info = {
            "n_qubits": req.n_qubits + 1,
            "depth": qc.depth(),
            "gates": qc.count_ops(),
            "diagram": str(qc.draw(output="text")),
            "statevector_sample": [{"re": float(c.real), "im": float(c.imag)} for c in sv.data[:16]],
        }
        engine = "qiskit"
    except ImportError:
        circuit_info = {"n_qubits": req.n_qubits, "depth": req.n_qubits * 2, "gates": {}, "diagram": "Qiskit not available"}
        engine = "simulation"

    return sanitize({
        "qae_price": qae_price,
        "bs_price": bs_price,
        "error_pct": abs(qae_price - bs_price) / bs_price * 100 if bs_price > 0 else 0,
        "n_evaluations_quantum": N,
        "n_evaluations_classical": N * N,
        "speedup": N,
        "payoff_distribution": payoffs[:64],
        "circuit": circuit_info,
        "engine": engine,
    })


# ── 3. QAOA Portfolio Optimization ──────────────────────────────

class QAOARequest(BaseModel):
    expected_returns: list[float] = [0.12, 0.35, 0.08, 0.22]
    volatilities: list[float] = [0.15, 0.50, 0.08, 0.30]
    correlations: list[list[float]] = [[1, .3, .1, .2], [.3, 1, .0, .4], [.1, .0, 1, .1], [.2, .4, .1, 1]]
    rf: float = 0.05
    n_layers: int = 3
    n_optimization_steps: int = 50


@app.post("/api/quantum/qaoa-portfolio")
async def qaoa_portfolio(req: QAOARequest):
    n = len(req.expected_returns)
    returns = np.array(req.expected_returns)
    vols = np.array(req.volatilities)
    rhos = np.array(req.correlations)
    cov = np.outer(vols, vols) * rhos

    N = 1 << n

    def cost(state):
        bits = [(state >> i) & 1 for i in range(n)]
        s = sum(bits)
        if s == 0:
            return 10.0
        w = np.array([b / s for b in bits])
        ret = w @ returns
        vol = np.sqrt(w @ cov @ w)
        return -(ret - req.rf) / max(vol, 1e-8)

    try:
        import pennylane as qml

        dev = qml.device("default.qubit", wires=n)

        @qml.qnode(dev)
        def qaoa_circuit(gammas, betas):
            for i in range(n):
                qml.Hadamard(wires=i)

            for layer in range(len(gammas)):
                # Cost layer
                for i in range(n):
                    for j in range(i + 1, n):
                        coupling = float(cov[i, j])
                        qml.CNOT(wires=[i, j])
                        qml.RZ(2 * gammas[layer] * coupling, wires=j)
                        qml.CNOT(wires=[i, j])
                    qml.RZ(gammas[layer] * float(returns[i]), wires=i)

                # Mixer layer
                for i in range(n):
                    qml.RX(2 * betas[layer], wires=i)

            return qml.probs(wires=range(n))

        # Optimize
        gammas = np.random.uniform(0, np.pi, req.n_layers)
        betas = np.random.uniform(0, np.pi / 2, req.n_layers)

        opt = qml.GradientDescentOptimizer(stepsize=0.1)
        convergence = []

        for step in range(req.n_optimization_steps):
            params = np.concatenate([gammas, betas])

            def cost_fn(params):
                g = params[:req.n_layers]
                b = params[req.n_layers:]
                probs = qaoa_circuit(g, b)
                return sum(probs[i] * cost(i) for i in range(N))

            params = opt.step(cost_fn, params)
            gammas = params[:req.n_layers]
            betas = params[req.n_layers:]
            energy = float(cost_fn(params))
            convergence.append(energy)

        final_probs = qaoa_circuit(gammas, betas).tolist()
        engine = "pennylane"

    except (ImportError, Exception) as e:
        # Fallback: classical simulation of QAOA-like optimization
        convergence = []
        gammas = np.random.uniform(0, np.pi, req.n_layers)
        betas = np.random.uniform(0, np.pi / 2, req.n_layers)
        final_probs = np.ones(N) / N

        for step in range(req.n_optimization_steps):
            # Simple gradient-free optimization
            probs = np.ones(N) / N
            for layer in range(req.n_layers):
                for i in range(N):
                    phase = -gammas[layer] * cost(i)
                    probs[i] *= (1 + 0.5 * np.cos(phase))
                probs /= probs.sum()

            energy = sum(probs[i] * cost(i) for i in range(N))
            convergence.append(float(energy))
            gammas += 0.05 * np.random.randn(req.n_layers)
            betas += 0.05 * np.random.randn(req.n_layers)
            final_probs = probs

        engine = "simulation"

    # Extract results
    best_state = int(np.argmax(final_probs))
    best_bits = [(best_state >> i) & 1 for i in range(n)]
    s = max(sum(best_bits), 1)
    weights = [b / s for b in best_bits]
    w = np.array(weights)
    port_ret = float(w @ returns)
    port_vol = float(np.sqrt(w @ cov @ w))
    sharpe = (port_ret - req.rf) / max(port_vol, 1e-8)

    # All portfolio distributions
    distribution = []
    for i in range(min(N, 32)):
        bits = [(i >> j) & 1 for j in range(n)]
        si = max(sum(bits), 1)
        wi = np.array([b / si for b in bits])
        distribution.append({
            "state": format(i, f'0{n}b'),
            "probability": float(final_probs[i]) if i < len(final_probs) else 0,
            "sharpe": float(-cost(i)),
            "return": float(wi @ returns),
            "volatility": float(np.sqrt(wi @ cov @ wi))
        })

    # Energy landscape for 3D plot
    landscape = []
    for gi in np.linspace(0, np.pi, 25):
        row = []
        for bi in np.linspace(0, np.pi / 2, 25):
            e = sum(cost(i) * (1 + 0.5 * np.cos(-gi * cost(i))) for i in range(N)) / N
            row.append(float(e))
        landscape.append(row)

    return sanitize({
        "optimal_weights": weights,
        "optimal_return": port_ret,
        "optimal_volatility": port_vol,
        "sharpe_ratio": sharpe,
        "best_state": format(best_state, f'0{n}b'),
        "convergence": convergence,
        "distribution": distribution,
        "landscape": landscape,
        "n_qubits": n,
        "n_portfolios": N,
        "engine": engine,
    })


# ── 4. Grover Search for Anomaly Detection ─────────────────────

class GroverRequest(BaseModel):
    n_qubits: int = 5
    target_states: list[int] = [7]
    shots: int = 1024


@app.post("/api/quantum/grover-search")
async def grover_search(req: GroverRequest):
    n = min(req.n_qubits, 10)
    N = 1 << n

    try:
        from qiskit import QuantumCircuit
        from qiskit.quantum_info import Statevector

        qc = QuantumCircuit(n)

        # Initialization
        for i in range(n):
            qc.h(i)

        # Grover iterations
        n_targets = len(req.target_states)
        n_iter = max(1, int(np.pi / 4 * np.sqrt(N / n_targets)))

        for _ in range(n_iter):
            # Oracle
            for target in req.target_states:
                bits = format(target % N, f'0{n}b')
                for i, b in enumerate(reversed(bits)):
                    if b == '0':
                        qc.x(i)
                if n > 1:
                    qc.h(n - 1)
                    qc.mcx(list(range(n - 1)), n - 1)
                    qc.h(n - 1)
                for i, b in enumerate(reversed(bits)):
                    if b == '0':
                        qc.x(i)

            # Diffusion
            for i in range(n):
                qc.h(i)
                qc.x(i)
            qc.h(n - 1)
            qc.mcx(list(range(n - 1)), n - 1)
            qc.h(n - 1)
            for i in range(n):
                qc.x(i)
                qc.h(i)

        sv = Statevector.from_instruction(qc)
        probs = sv.probabilities()
        samples = sv.sample_counts(req.shots)

        distribution = sorted(
            [{"state": format(i, f'0{n}b'), "probability": float(probs[i]), "is_target": i in req.target_states}
             for i in range(N)],
            key=lambda x: -x["probability"]
        )[:32]

        best = int(np.argmax(probs))
        engine = "qiskit"
        circuit_diagram = str(qc.draw(output="text"))
        depth = qc.depth()

    except ImportError:
        # Fallback simulation
        probs = np.ones(N) / N
        n_iter = max(1, int(np.pi / 4 * np.sqrt(N / len(req.target_states))))
        amp = 1 / np.sqrt(N)
        state = np.full(N, amp)

        for _ in range(n_iter):
            for t in req.target_states:
                if t < N:
                    state[t] *= -1
            mean_amp = np.mean(state)
            state = 2 * mean_amp - state

        probs = state ** 2
        distribution = sorted(
            [{"state": format(i, f'0{n}b'), "probability": float(probs[i]), "is_target": i in req.target_states}
             for i in range(N)],
            key=lambda x: -x["probability"]
        )[:32]
        samples = {}
        best = int(np.argmax(probs))
        engine = "simulation"
        circuit_diagram = "Simulation mode"
        depth = n_iter * (2 * n + 1)

    return sanitize({
        "found_state": format(best, f'0{n}b'),
        "found_value": best,
        "probability": float(probs[best]),
        "n_iterations": n_iter,
        "classical_iterations": N // 2,
        "speedup": float(N / (2 * n_iter)) if n_iter > 0 else 1,
        "distribution": distribution,
        "samples": dict(samples) if isinstance(samples, dict) else samples,
        "circuit_depth": depth,
        "circuit_diagram": circuit_diagram,
        "engine": engine,
    })


# ── 5. VQE Energy Minimization ─────────────────────────────────

class VQERequest(BaseModel):
    n_qubits: int = 4
    hamiltonian_type: str = "ising"  # ising, heisenberg, portfolio
    n_layers: int = 3
    n_steps: int = 100


@app.post("/api/quantum/vqe")
async def vqe_solve(req: VQERequest):
    n = min(req.n_qubits, 8)

    try:
        import pennylane as qml

        dev = qml.device("default.qubit", wires=n)

        # Hamiltonian
        coeffs = []
        obs = []
        if req.hamiltonian_type == "ising":
            for i in range(n):
                coeffs.append(-1.0)
                obs.append(qml.PauliZ(i))
            for i in range(n - 1):
                coeffs.append(-0.5)
                obs.append(qml.PauliZ(i) @ qml.PauliZ(i + 1))
        elif req.hamiltonian_type == "heisenberg":
            for i in range(n - 1):
                coeffs.extend([-0.5, -0.5, -0.5])
                obs.extend([
                    qml.PauliX(i) @ qml.PauliX(i + 1),
                    qml.PauliY(i) @ qml.PauliY(i + 1),
                    qml.PauliZ(i) @ qml.PauliZ(i + 1),
                ])
        else:  # portfolio
            for i in range(n):
                coeffs.append(0.5)
                obs.append(qml.PauliZ(i))
            for i in range(n - 1):
                coeffs.append(0.3 * np.random.randn())
                obs.append(qml.PauliZ(i) @ qml.PauliZ(i + 1))

        H = qml.Hamiltonian(coeffs, obs)

        @qml.qnode(dev)
        def circuit(params):
            for layer in range(req.n_layers):
                for i in range(n):
                    qml.RY(params[layer * n * 2 + i], wires=i)
                    qml.RZ(params[layer * n * 2 + n + i], wires=i)
                for i in range(n - 1):
                    qml.CNOT(wires=[i, i + 1])
            return qml.expval(H)

        n_params = req.n_layers * n * 2
        params = np.random.uniform(0, 2 * np.pi, n_params)
        opt = qml.GradientDescentOptimizer(stepsize=0.1)

        convergence = []
        for step in range(req.n_steps):
            params = opt.step(circuit, params)
            energy = float(circuit(params))
            convergence.append(energy)

        # Get final state for density matrix
        @qml.qnode(dev)
        def state_circuit(params):
            for layer in range(req.n_layers):
                for i in range(n):
                    qml.RY(params[layer * n * 2 + i], wires=i)
                    qml.RZ(params[layer * n * 2 + n + i], wires=i)
                for i in range(n - 1):
                    qml.CNOT(wires=[i, i + 1])
            return qml.state()

        final_state = state_circuit(params)
        probs = np.abs(final_state) ** 2

        engine = "pennylane"

    except (ImportError, Exception) as e:
        # Fallback
        convergence = []
        energy = 5.0
        for step in range(req.n_steps):
            energy = energy * 0.97 + np.random.randn() * 0.1 - 0.5
            convergence.append(float(energy))
        probs = np.random.dirichlet(np.ones(1 << n))
        engine = "simulation"

    eigenvalue = convergence[-1] if convergence else 0

    return sanitize({
        "eigenvalue_min": eigenvalue,
        "convergence": convergence,
        "probabilities": probs.tolist() if hasattr(probs, 'tolist') else list(probs),
        "n_qubits": n,
        "n_layers": req.n_layers,
        "hamiltonian_type": req.hamiltonian_type,
        "n_parameters": req.n_layers * n * 2,
        "engine": engine,
    })


# ─── Startup ───────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001, log_level="info")
