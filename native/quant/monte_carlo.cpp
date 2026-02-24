// ============================================================
// CRISTAL CAPITAL TERMINAL — Monte Carlo em C++
// Compilar junto com black_scholes.cpp (ver instruções no .cpp)
// ============================================================

#include <cmath>
#include <vector>4
#include <algorithm>
#include <numeric>
#include <random>

// Gerador de números aleatórios thread-local (xoshiro256+)
static thread_local std::mt19937_64 rng(std::random_device{}());
static thread_local std::normal_distribution<double> norm_dist(0.0, 1.0);

static inline double rand_normal() { return norm_dist(rng); }

extern "C" {

// ── Opções Monte Carlo (plain vanilla / asian / barrier) ──────
// tipo: 0=call, 1=put, 2=asian-call, 3=asian-put, 4=barrier-up-out
double mc_opcao(double S, double K, double T, double r, double sigma, double q,
                int tipo, double barreira, int simulacoes, int passos) {
    const double dt    = T / passos;
    const double drift = (r - q - 0.5 * sigma * sigma) * dt;
    const double dif   = sigma * std::sqrt(dt);
    const double disc  = std::exp(-r * T);
    double soma = 0.0;
    int count = 0;

    for (int m = 0; m < simulacoes; m++) {
        double St = S;
        double soma_precos = S;
        bool knockout = false;

        for (int i = 0; i < passos; i++) {
            St *= std::exp(drift + dif * rand_normal());
            soma_precos += St;
            if (tipo == 4 && barreira > 0 && St >= barreira) {
                knockout = true;
                break;
            }
        }
        if (knockout) continue;

        double payoff = 0;
        double media_preco = soma_precos / (passos + 1);
        switch (tipo) {
            case 0: payoff = std::max(St - K, 0.0); break;
            case 1: payoff = std::max(K - St, 0.0); break;
            case 2: payoff = std::max(media_preco - K, 0.0); break;
            case 3: payoff = std::max(K - media_preco, 0.0); break;
            case 4: payoff = std::max(St - K, 0.0); break;
        }
        soma += payoff;
        count++;
    }
    if (count == 0) return 0.0;
    return disc * soma / count;
}

// ── VaR Histórico ─────────────────────────────────────────────
// retornos: array de retornos diários
// n: tamanho do array
// confianca: ex 0.95
// horizonte: dias
double var_historico(const double* retornos, int n, double confianca, int horizonte) {
    std::vector<double> ret(retornos, retornos + n);
    std::sort(ret.begin(), ret.end());
    int idx = static_cast<int>((1.0 - confianca) * n);
    if (idx < 0) idx = 0;
    if (idx >= n) idx = n - 1;
    double var = -ret[idx] * std::sqrt(static_cast<double>(horizonte));

    // CVaR (não retornado directamente nesta versão simplificada)
    return var;
}

// ── VaR Monte Carlo ───────────────────────────────────────────
double var_montecarlo(double mu, double sigma_diario, double confianca,
                      int horizonte, int simulacoes) {
    std::vector<double> ret_sim(simulacoes);
    for (int i = 0; i < simulacoes; i++) {
        double r = 0;
        for (int d = 0; d < horizonte; d++) r += mu + sigma_diario * rand_normal();
        ret_sim[i] = r;
    }
    std::sort(ret_sim.begin(), ret_sim.end());
    int idx = static_cast<int>((1.0 - confianca) * simulacoes);
    return -ret_sim[std::max(0, idx)];
}

// ── Simulação GBM — retorna apenas preços finais ──────────────
// output: array de 'simulacoes' preços finais (caller aloca)
void gbm_precos_finais(double S0, double mu, double sigma, double T,
                       int passos, int simulacoes, double* output) {
    const double dt    = T / passos;
    const double drift = (mu - 0.5 * sigma * sigma) * dt;
    const double dif   = sigma * std::sqrt(dt);

    for (int m = 0; m < simulacoes; m++) {
        double S = S0;
        for (int i = 0; i < passos; i++) S *= std::exp(drift + dif * rand_normal());
        output[m] = S;
    }
}

} // extern "C"
