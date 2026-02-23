# ============================================================
# CRISTAL CAPITAL TERMINAL — Init Pyodide
# Carregado automaticamente ao abrir o Ambiente Quant
# ============================================================

import sys
import math
import json
from typing import List, Dict, Optional, Tuple

# Tentar importar numpy/scipy (disponíveis no Pyodide)
try:
    import numpy as np
    import scipy.stats as stats
    import scipy.optimize as opt
    NUMPY = True
except ImportError:
    NUMPY = False

# ── Funções Financeiras Base ──────────────────────────────────

def norm_cdf(x: float) -> float:
    """CDF da distribuição normal padrão."""
    return (1.0 + math.erf(x / math.sqrt(2.0))) / 2.0

def norm_pdf(x: float) -> float:
    return math.exp(-0.5 * x * x) / math.sqrt(2 * math.pi)

# ── Black-Scholes ─────────────────────────────────────────────

def black_scholes(S, K, T, r, sigma, q=0, tipo='call'):
    """
    Preço Black-Scholes + Gregas para opções europeias.

    Args:
        S: Preço spot
        K: Strike
        T: Tempo até expiração (anos)
        r: Taxa livre de risco (decimal)
        sigma: Volatilidade (decimal)
        q: Dividend yield contínuo (decimal)
        tipo: 'call' ou 'put'

    Returns:
        dict com preco, delta, gamma, theta, vega, rho
    """
    if T <= 0 or sigma <= 0:
        payoff = max(S - K, 0) if tipo == 'call' else max(K - S, 0)
        return {'preco': payoff, 'delta': 1 if S > K else 0, 'gamma': 0, 'theta': 0, 'vega': 0, 'rho': 0}

    sqrt_T = math.sqrt(T)
    d1 = (math.log(S / K) + (r - q + 0.5 * sigma**2) * T) / (sigma * sqrt_T)
    d2 = d1 - sigma * sqrt_T

    eqT, erT = math.exp(-q * T), math.exp(-r * T)
    Nd1, Nd2 = norm_cdf(d1), norm_cdf(d2)
    nd1 = norm_pdf(d1)

    if tipo == 'call':
        preco = S * eqT * Nd1 - K * erT * Nd2
        delta = eqT * Nd1
        theta = (-(S * eqT * nd1 * sigma) / (2 * sqrt_T) - r * K * erT * Nd2 + q * S * eqT * Nd1) / 365
        rho   =  K * T * erT * Nd2 / 100
    else:
        preco = K * erT * norm_cdf(-d2) - S * eqT * norm_cdf(-d1)
        delta = -eqT * norm_cdf(-d1)
        theta = (-(S * eqT * nd1 * sigma) / (2 * sqrt_T) + r * K * erT * norm_cdf(-d2) - q * S * eqT * norm_cdf(-d1)) / 365
        rho   = -K * T * erT * norm_cdf(-d2) / 100

    gamma = eqT * nd1 / (S * sigma * sqrt_T)
    vega  = S * eqT * nd1 * sqrt_T / 100

    return {'preco': preco, 'delta': delta, 'gamma': gamma, 'theta': theta, 'vega': vega, 'rho': rho, 'd1': d1, 'd2': d2}

def vol_implicita(preco_mercado, S, K, T, r, q=0, tipo='call'):
    """Volatilidade implícita via Newton-Raphson."""
    sigma = 0.20
    for _ in range(100):
        bs = black_scholes(S, K, T, r, sigma, q, tipo)
        diff = bs['preco'] - preco_mercado
        vega = bs['vega'] * 100
        if abs(diff) < 1e-8: break
        if abs(vega) < 1e-10: break
        sigma -= diff / vega
        sigma = max(0.001, min(sigma, 20.0))
    return sigma

# ── Estatísticas ──────────────────────────────────────────────

def retornos_log(precos):
    """Retornos logarítmicos de uma série de preços."""
    return [math.log(precos[i] / precos[i-1]) for i in range(1, len(precos))]

def sharpe(retornos_diarios, taxa_livre=0, dias_ano=252):
    """Ratio de Sharpe anualizado."""
    import statistics
    m = statistics.mean(retornos_diarios) * dias_ano
    s = statistics.stdev(retornos_diarios) * math.sqrt(dias_ano)
    return (m - taxa_livre) / s if s else 0

def max_drawdown(precos):
    """Maximum Drawdown de uma série de preços."""
    pico = precos[0]
    max_dd = 0
    for p in precos:
        if p > pico: pico = p
        dd = (pico - p) / pico
        if dd > max_dd: max_dd = dd
    return max_dd

# ── VaR ───────────────────────────────────────────────────────

def var_historico(retornos, confianca=0.95, horizonte=1):
    """Value at Risk histórico."""
    sorted_ret = sorted(retornos)
    idx = int((1 - confianca) * len(sorted_ret))
    var = -sorted_ret[idx] * math.sqrt(horizonte)
    cvar = -sum(sorted_ret[:idx]) / max(idx, 1) * math.sqrt(horizonte)
    return {'var': var, 'cvar': cvar, 'nivel': f'{confianca*100:.0f}%', 'horizonte': f'{horizonte}d'}

# ── Monte Carlo ───────────────────────────────────────────────

def mc_gbm(S0, mu, sigma, T, simulacoes=1000, passos=252, seed=None):
    """
    Simulação Monte Carlo via GBM.
    Retorna dicionário com trajectórias e estatísticas.
    """
    import random
    if seed is not None: random.seed(seed)

    dt = T / passos
    drift = (mu - 0.5 * sigma**2) * dt
    dif = sigma * math.sqrt(dt)

    precos_finais = []
    for _ in range(simulacoes):
        S = S0
        for _ in range(passos):
            z = random.gauss(0, 1)
            S *= math.exp(drift + dif * z)
        precos_finais.append(S)

    precos_finais.sort()
    n = len(precos_finais)

    return {
        'p5':    precos_finais[int(0.05 * n)],
        'p25':   precos_finais[int(0.25 * n)],
        'p50':   precos_finais[int(0.50 * n)],
        'p75':   precos_finais[int(0.75 * n)],
        'p95':   precos_finais[int(0.95 * n)],
        'media': sum(precos_finais) / n,
        'min':   precos_finais[0],
        'max':   precos_finais[-1],
        'prob_ganho': sum(1 for p in precos_finais if p > S0) / n,
    }

# ── Curva de Taxas Nelson-Siegel ──────────────────────────────

def nelson_siegel(maturidades, beta0, beta1, beta2, lam):
    """Yield Nelson-Siegel para uma lista de maturidades."""
    yields = []
    for t in maturidades:
        if t <= 0:
            yields.append(beta0 + beta1)
            continue
        e = math.exp(-lam * t)
        f = (1 - e) / (lam * t)
        yields.append(beta0 + beta1 * f + beta2 * (f - e))
    return yields

# ── Utilitários ───────────────────────────────────────────────

def tabela(dados: dict, casas=4):
    """Formata um dicionário como tabela para o output."""
    linhas = []
    max_k = max(len(str(k)) for k in dados.keys())
    for k, v in dados.items():
        if isinstance(v, float):
            linhas.append(f"  {str(k).ljust(max_k)}  {v:.{casas}f}")
        else:
            linhas.append(f"  {str(k).ljust(max_k)}  {v}")
    return "\n".join(linhas)

def fmt_pct(v, casas=2):
    return f"{v * 100:.{casas}f}%"

def fmt_moeda(v, simbolo="$", casas=2):
    return f"{simbolo}{v:,.{casas}f}"

# ── Mensagem de boas-vindas ───────────────────────────────────

print("╔══════════════════════════════════════════════════════╗")
print("║  CRISTAL CAPITAL TERMINAL — Ambiente Quant          ║")
print("║  Python " + sys.version.split()[0].ljust(8) + ("  NumPy ✓" if NUMPY else "  NumPy ✗") + "                          ║")
print("╚══════════════════════════════════════════════════════╝")
print()
print("Funções disponíveis:")
print("  black_scholes(S, K, T, r, sigma, q=0, tipo='call')")
print("  vol_implicita(preco_mercado, S, K, T, r, q=0, tipo='call')")
print("  mc_gbm(S0, mu, sigma, T, simulacoes=1000)")
print("  var_historico(retornos, confianca=0.95, horizonte=1)")
print("  nelson_siegel(maturidades, beta0, beta1, beta2, lam)")
print("  retornos_log(precos), sharpe(retornos), max_drawdown(precos)")
print()
print("Escreva 'exemplos()' para ver exemplos de utilização.")

def exemplos():
    print("""
── Black-Scholes ─────────────────────────────────────────────
bs = black_scholes(S=100, K=105, T=0.25, r=0.05, sigma=0.20)
print(tabela(bs))

── Volatilidade Implícita ─────────────────────────────────────
vi = vol_implicita(preco_mercado=3.50, S=100, K=105, T=0.25, r=0.05)
print(f"Vol implícita: {fmt_pct(vi)}")

── Monte Carlo GBM ─────────────────────────────────────────────
mc = mc_gbm(S0=100, mu=0.08, sigma=0.20, T=1, simulacoes=5000)
print(tabela(mc))

── VaR Histórico ───────────────────────────────────────────────
retornos = retornos_log([100, 101, 99, 102, 98, 103, 97])
v = var_historico(retornos, confianca=0.95)
print(tabela(v))
""")
