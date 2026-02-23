# ============================================================
# CRISTAL CAPITAL TERMINAL — Preâmbulo Python (Server-Side)
# numpy 2.4 + scipy 1.17 + pandas 3.0 disponíveis
# ============================================================

import sys, math, json, warnings
warnings.filterwarnings('ignore')

import numpy as np
import scipy.stats as stats
import scipy.optimize as opt
import pandas as pd

# ── Black-Scholes ─────────────────────────────────────────────

def bs(S, K, T, r, sigma, q=0, tipo='call'):
    """Black-Scholes europeia + gregas completas."""
    if T <= 0 or sigma <= 0:
        p = max(S-K,0) if tipo=='call' else max(K-S,0)
        return dict(preco=p, delta=float(S>K), gamma=0, theta=0, vega=0, rho=0, d1=0, d2=0)
    sqT = math.sqrt(T)
    d1 = (math.log(S/K) + (r - q + .5*sigma**2)*T) / (sigma*sqT)
    d2 = d1 - sigma*sqT
    eqT, erT = math.exp(-q*T), math.exp(-r*T)
    if tipo == 'call':
        preco = S*eqT*stats.norm.cdf(d1) - K*erT*stats.norm.cdf(d2)
        delta = eqT*stats.norm.cdf(d1)
        theta = (-(S*eqT*stats.norm.pdf(d1)*sigma)/(2*sqT) - r*K*erT*stats.norm.cdf(d2) + q*S*eqT*stats.norm.cdf(d1))/365
        rho_g = K*T*erT*stats.norm.cdf(d2)/100
    else:
        preco = K*erT*stats.norm.cdf(-d2) - S*eqT*stats.norm.cdf(-d1)
        delta = -eqT*stats.norm.cdf(-d1)
        theta = (-(S*eqT*stats.norm.pdf(d1)*sigma)/(2*sqT) + r*K*erT*stats.norm.cdf(-d2) - q*S*eqT*stats.norm.cdf(-d1))/365
        rho_g = -K*T*erT*stats.norm.cdf(-d2)/100
    gamma = eqT*stats.norm.pdf(d1)/(S*sigma*sqT)
    vega  = S*eqT*stats.norm.pdf(d1)*sqT/100
    return dict(preco=preco, delta=delta, gamma=gamma, theta=theta, vega=vega, rho=rho_g, d1=d1, d2=d2)

def vol_implicita(preco_mkt, S, K, T, r, q=0, tipo='call'):
    """Vol implícita via Newton-Raphson."""
    sigma = 0.20
    for _ in range(100):
        res = bs(S, K, T, r, sigma, q, tipo)
        diff = res['preco'] - preco_mkt
        vega_abs = res['vega'] * 100
        if abs(diff) < 1e-8: break
        if abs(vega_abs) < 1e-10: break
        sigma -= diff / vega_abs
        sigma = max(0.001, min(sigma, 20.0))
    return sigma

def superficie_vol(S, K_list, T_list, r, sigma_base=0.20, skew=-0.01, convex=0.005):
    """Gera superfície de volatilidade parametrizada."""
    dados = []
    for T in T_list:
        for K in K_list:
            m = math.log(K/S)  # log-moneyness
            vol = sigma_base + skew*m + convex*m**2 + 0.002*math.sqrt(T)
            vol = max(0.01, vol)
            dados.append({'T': T, 'K': K, 'vol': vol, 'moneyness': K/S})
    return pd.DataFrame(dados)

# ── Monte Carlo ───────────────────────────────────────────────

def mc_gbm(S0, mu, sigma, T, n_sim=5000, n_steps=252, seed=42):
    """Simulação GBM vectorizada com numpy."""
    rng = np.random.default_rng(seed)
    dt = T / n_steps
    Z = rng.standard_normal((n_sim, n_steps))
    inc = (mu - .5*sigma**2)*dt + sigma*math.sqrt(dt)*Z
    paths = S0 * np.exp(np.cumsum(inc, axis=1))
    precos_final = paths[:, -1]
    pcts = np.percentile(precos_final, [5,25,50,75,95])
    return {
        'p5': pcts[0], 'p25': pcts[1], 'p50': pcts[2], 'p75': pcts[3], 'p95': pcts[4],
        'media': float(precos_final.mean()),
        'std': float(precos_final.std()),
        'prob_ganho': float((precos_final > S0).mean()),
        'paths_sample': paths[:5].tolist(),  # 5 trajectórias para gráfico
    }

def mc_opcao(S, K, T, r, sigma, tipo='call', n_sim=50000, seed=42):
    """Preço Monte Carlo com variância reduzida (antithetic variates)."""
    rng = np.random.default_rng(seed)
    Z = rng.standard_normal(n_sim // 2)
    Z = np.concatenate([Z, -Z])  # antithetic
    ST = S * np.exp((r - .5*sigma**2)*T + sigma*math.sqrt(T)*Z)
    payoff = np.maximum(ST - K, 0) if tipo == 'call' else np.maximum(K - ST, 0)
    return float(math.exp(-r*T) * payoff.mean())

# ── Estatísticas / Portfolio ──────────────────────────────────

def var_historico(retornos, confianca=0.95, horizonte=1):
    ret = np.array(retornos)
    var = -np.percentile(ret, (1-confianca)*100) * math.sqrt(horizonte)
    idx = int((1-confianca)*len(ret))
    cvar = -ret[np.argsort(ret)][:max(idx,1)].mean() * math.sqrt(horizonte)
    return {'var': float(var), 'cvar': float(cvar), 'nivel': f'{confianca*100:.0f}%'}

def portfolio_stats(pesos, retornos_matriz, dias_ano=252):
    """Métricas de portfolio (pesos x activos, retornos_matriz = activos x observações)."""
    pesos = np.array(pesos)
    R = np.array(retornos_matriz)  # shape (n_activos, n_obs)
    ret_portfolio = pesos @ R      # série de retornos do portfolio
    ret_anual = ret_portfolio.mean() * dias_ano
    vol_anual = ret_portfolio.std() * math.sqrt(dias_ano)
    sharpe = ret_anual / vol_anual if vol_anual > 0 else 0
    # Max drawdown
    cum = np.cumprod(1 + ret_portfolio)
    peak = np.maximum.accumulate(cum)
    dd = (peak - cum) / peak
    return {
        'retorno_anualizado': float(ret_anual),
        'volatilidade_anualizada': float(vol_anual),
        'sharpe': float(sharpe),
        'max_drawdown': float(dd.max()),
        'var_95': float(var_historico(ret_portfolio.tolist())['var']),
    }

def markowitz(retornos_lista, rf=0, dias_ano=252, n_portfolios=500):
    """
    Fronteira eficiente por simulação Monte Carlo de portfolios aleatórios.
    retornos_lista: lista de listas [activo1_rets, activo2_rets, ...]
    Retorna DataFrame com pesos, retorno, vol, sharpe.
    """
    R = np.array(retornos_lista)  # (n_activos, n_obs)
    n = len(retornos_lista)
    resultados = []
    for _ in range(n_portfolios):
        w = np.random.dirichlet(np.ones(n))
        ret_p = (R * w[:, None]).sum(axis=0)
        ret_a = ret_p.mean() * dias_ano
        vol_a = ret_p.std() * math.sqrt(dias_ano)
        sh = (ret_a - rf) / vol_a if vol_a > 0 else 0
        resultados.append({'pesos': w.tolist(), 'retorno': ret_a, 'vol': vol_a, 'sharpe': sh})
    df = pd.DataFrame(resultados)
    return df

def capm(ret_activo, ret_mercado, rf=0, dias_ano=252):
    """Regressão CAPM: alpha, beta, R², Sharpe, Treynor."""
    ra, rm = np.array(ret_activo), np.array(ret_mercado)
    exc_a = ra - rf/dias_ano
    exc_m = rm - rf/dias_ano
    beta, alpha = np.polyfit(exc_m, exc_a, 1)
    residuos = exc_a - (alpha + beta * exc_m)
    ss_res = (residuos**2).sum()
    ss_tot = ((exc_a - exc_a.mean())**2).sum()
    r2 = 1 - ss_res/ss_tot if ss_tot > 0 else 0
    ret_a_anual = ra.mean() * dias_ano
    vol_a_anual = ra.std() * math.sqrt(dias_ano)
    sharpe_v = (ret_a_anual - rf) / vol_a_anual if vol_a_anual > 0 else 0
    treynor = (ret_a_anual - rf) / beta if beta != 0 else 0
    tracking_err = residuos.std() * math.sqrt(dias_ano)
    ir = (alpha * dias_ano) / tracking_err if tracking_err > 0 else 0
    return {'alpha': float(alpha*dias_ano), 'beta': float(beta), 'r2': float(r2),
            'sharpe': float(sharpe_v), 'treynor': float(treynor), 'information_ratio': float(ir)}

# ── Fixed Income ──────────────────────────────────────────────

def preco_bond(nominal, cupao, ytm, maturidade, freq=2):
    """Preço de obrigação + duration + convexidade."""
    C = cupao * nominal / freq
    r = ytm / freq
    n = round(maturidade * freq)
    if r == 0: return {'preco': C*n + nominal, 'dur_mac': maturidade/2, 'dur_mod': maturidade/2, 'convex': 0, 'dv01': 0}
    t_arr = np.arange(1, n+1)
    cf = np.full(n, C); cf[-1] += nominal
    df = cf / (1+r)**t_arr
    preco = df.sum()
    dur_mac = (t_arr/freq * df).sum() / preco
    dur_mod = dur_mac / (1+r)
    convex = ((t_arr/freq * (t_arr/freq + 1/freq)) * df).sum() / (preco * (1+r)**2)
    dv01 = dur_mod * preco * 0.0001
    return {'preco': float(preco), 'dur_mac': float(dur_mac), 'dur_mod': float(dur_mod),
            'convex': float(convex), 'dv01': float(dv01)}

def ytm_bond(preco_mkt, nominal, cupao, maturidade, freq=2):
    """YTM por Newton-Raphson."""
    ytm = cupao * nominal / preco_mkt
    for _ in range(200):
        res = preco_bond(nominal, cupao, ytm, maturidade, freq)
        diff = res['preco'] - preco_mkt
        dv01 = res['dv01']
        if abs(diff) < 1e-8: break
        if abs(dv01) < 1e-12: break
        ytm += diff * 0.0001 / dv01
        ytm = max(0.0001, min(ytm, 2.0))
    return float(ytm)

# ── GARCH(1,1) ────────────────────────────────────────────────

def garch11(retornos, dias_ano=252):
    """Estima GARCH(1,1) e retorna variâncias condicionais."""
    from scipy.optimize import minimize
    ret = np.array(retornos)
    var0 = ret.var()

    def neg_ll(params):
        om, al, be = params
        if om <= 0 or al <= 0 or be <= 0 or al+be >= 1: return 1e10
        v = var0; ll = 0
        for r in ret:
            v = om + al*r**2 + be*v
            v = max(v, 1e-10)
            ll += 0.5*(math.log(2*math.pi) + math.log(v) + r**2/v)
        return ll

    res = minimize(neg_ll, [var0*0.05, 0.10, 0.85], method='L-BFGS-B',
                   bounds=[(1e-8,None),(1e-6,0.999),(1e-6,0.999)])
    om, al, be = res.x
    variancias = []
    v = var0
    for r in ret:
        v = om + al*r**2 + be*v
        variancias.append(v)
    vol_lp = math.sqrt(om/(1-al-be)) * math.sqrt(dias_ano)
    return {'omega': float(om), 'alpha': float(al), 'beta': float(be),
            'vol_lp_anualizada': float(vol_lp),
            'variancias': variancias,
            'vols_condicionais': [math.sqrt(v*dias_ano) for v in variancias]}

# ── Utilitários de Output ─────────────────────────────────────

def tabela(dados, casas=4):
    """Imprime dict como tabela alinhada."""
    if isinstance(dados, pd.DataFrame):
        print(dados.to_string(index=False))
        return
    max_k = max(len(str(k)) for k in dados.keys())
    for k, v in dados.items():
        if isinstance(v, float):
            print(f"  {str(k).ljust(max_k)}  {v:.{casas}f}")
        else:
            print(f"  {str(k).ljust(max_k)}  {v}")

def chart(tipo, dados, titulo='', xlabel='', ylabel=''):
    """
    Emite dados de gráfico para o painel renderizar com recharts.
    tipo: 'line' | 'bar' | 'scatter' | 'area'
    dados: lista de dicts [{'x': ..., 'y': ...}, ...]
    """
    print('CHART:' + json.dumps({
        'tipo': tipo, 'dados': dados,
        'titulo': titulo, 'xlabel': xlabel, 'ylabel': ylabel
    }))

def fmt(v, casas=4):   return f"{v:.{casas}f}"
def pct(v, casas=2):   return f"{v*100:.{casas}f}%"
def moeda(v, s='$'):   return f"{s}{v:,.2f}"
def bps(v):            return f"{v*10000:.1f} bps"

print("CRISTAL CAPITAL TERMINAL — Python Quant Engine")
import scipy
print(f"numpy {np.__version__} | scipy {scipy.__version__} | pandas {pd.__version__}")
print("Funções: bs, vol_implicita, mc_gbm, mc_opcao, var_historico,")
print("         markowitz, capm, preco_bond, ytm_bond, garch11, superficie_vol")
print("Output:  tabela(dict|df), chart('line', dados, titulo), fmt, pct, bps")
