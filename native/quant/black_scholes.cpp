// ============================================================
// CRISTAL CAPITAL TERMINAL — Black-Scholes em C++
// Compilar para WebAssembly com Emscripten:
//   emcc black_scholes.cpp monte_carlo.cpp -O3 -s WASM=1
//       -s EXPORTED_FUNCTIONS='["_bs_call","_bs_put","_bs_delta_call",
//          "_bs_delta_put","_bs_gamma","_bs_vega","_bs_theta_call",
//          "_bs_theta_put","_bs_vol_implicita","_mc_opcao","_var_historico"]'
//       -s EXPORTED_RUNTIME_METHODS='["ccall","cwrap"]'
//       -o ../public/wasm/quant.js
// ============================================================

#include <cmath>
#include <algorithm>

// ── Distribuição Normal ───────────────────────────────────────

static double norm_cdf(double x) {
    const double a[] = {0.319381530, -0.356563782, 1.781477937, -1.821255978, 1.330274429};
    double t = 1.0 / (1.0 + 0.2316419 * std::abs(x));
    double d = 0.3989422820 * std::exp(-x * x / 2.0);
    double p = d * t * (a[0] + t * (a[1] + t * (a[2] + t * (a[3] + t * a[4]))));
    return x > 0 ? 1.0 - p : p;
}

static double norm_pdf(double x) {
    return std::exp(-0.5 * x * x) / std::sqrt(2.0 * M_PI);
}

// ── Black-Scholes Greeks ──────────────────────────────────────

static void bs_d1d2(double S, double K, double T, double r, double sigma, double q,
                    double& d1, double& d2) {
    double sqrt_T = std::sqrt(T);
    d1 = (std::log(S / K) + (r - q + 0.5 * sigma * sigma) * T) / (sigma * sqrt_T);
    d2 = d1 - sigma * sqrt_T;
}

extern "C" {

double bs_call(double S, double K, double T, double r, double sigma, double q) {
    if (T <= 0 || sigma <= 0 || S <= 0 || K <= 0) return std::max(S - K, 0.0);
    double d1, d2;
    bs_d1d2(S, K, T, r, sigma, q, d1, d2);
    return S * std::exp(-q * T) * norm_cdf(d1) - K * std::exp(-r * T) * norm_cdf(d2);
}

double bs_put(double S, double K, double T, double r, double sigma, double q) {
    if (T <= 0 || sigma <= 0 || S <= 0 || K <= 0) return std::max(K - S, 0.0);
    double d1, d2;
    bs_d1d2(S, K, T, r, sigma, q, d1, d2);
    return K * std::exp(-r * T) * norm_cdf(-d2) - S * std::exp(-q * T) * norm_cdf(-d1);
}

double bs_delta_call(double S, double K, double T, double r, double sigma, double q) {
    if (T <= 0) return 0;
    double d1, d2;
    bs_d1d2(S, K, T, r, sigma, q, d1, d2);
    return std::exp(-q * T) * norm_cdf(d1);
}

double bs_delta_put(double S, double K, double T, double r, double sigma, double q) {
    if (T <= 0) return 0;
    double d1, d2;
    bs_d1d2(S, K, T, r, sigma, q, d1, d2);
    return -std::exp(-q * T) * norm_cdf(-d1);
}

double bs_gamma(double S, double K, double T, double r, double sigma, double q) {
    if (T <= 0 || sigma <= 0) return 0;
    double d1, d2;
    bs_d1d2(S, K, T, r, sigma, q, d1, d2);
    return std::exp(-q * T) * norm_pdf(d1) / (S * sigma * std::sqrt(T));
}

double bs_vega(double S, double K, double T, double r, double sigma, double q) {
    if (T <= 0) return 0;
    double d1, d2;
    bs_d1d2(S, K, T, r, sigma, q, d1, d2);
    return S * std::exp(-q * T) * norm_pdf(d1) * std::sqrt(T) / 100.0;
}

double bs_theta_call(double S, double K, double T, double r, double sigma, double q) {
    if (T <= 0) return 0;
    double d1, d2;
    bs_d1d2(S, K, T, r, sigma, q, d1, d2);
    double part1 = -(S * std::exp(-q * T) * norm_pdf(d1) * sigma) / (2.0 * std::sqrt(T));
    double part2 = -r * K * std::exp(-r * T) * norm_cdf(d2);
    double part3 =  q * S * std::exp(-q * T) * norm_cdf(d1);
    return (part1 + part2 + part3) / 365.0;
}

double bs_theta_put(double S, double K, double T, double r, double sigma, double q) {
    if (T <= 0) return 0;
    double d1, d2;
    bs_d1d2(S, K, T, r, sigma, q, d1, d2);
    double part1 = -(S * std::exp(-q * T) * norm_pdf(d1) * sigma) / (2.0 * std::sqrt(T));
    double part2 =  r * K * std::exp(-r * T) * norm_cdf(-d2);
    double part3 = -q * S * std::exp(-q * T) * norm_cdf(-d1);
    return (part1 + part2 + part3) / 365.0;
}

// Newton-Raphson para volatilidade implícita
// tipo: 0 = call, 1 = put
double bs_vol_implicita(double preco_mercado, double S, double K, double T,
                        double r, double q, int tipo) {
    double sigma = 0.20;
    for (int i = 0; i < 100; i++) {
        double preco = tipo == 0 ? bs_call(S, K, T, r, sigma, q)
                                 : bs_put (S, K, T, r, sigma, q);
        double vega_abs = bs_vega(S, K, T, r, sigma, q) * 100.0;
        double diff = preco - preco_mercado;
        if (std::abs(diff) < 1e-8) break;
        if (std::abs(vega_abs) < 1e-10) break;
        sigma -= diff / vega_abs;
        sigma = std::max(0.001, std::min(sigma, 20.0));
    }
    return sigma;
}

} // extern "C"
