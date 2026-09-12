# 🛡️ AEGIS Technical Architecture & Cryptographic Specification

## 1. Mathematical Biometric Entropy Formulation

The biometric trajectory consists of a sampled time-series of coordinate vectors:
$$\mathcal{T} = \{(x_1, y_1, t_1), (x_2, y_2, t_2), \dots, (x_N, y_N, t_N)\}$$

### Instantaneous Velocity & Shannon Entropy
For each consecutive pair of points:
$$v_i = \frac{\sqrt{(x_i - x_{i-1})^2 + (y_i - y_{i-1})^2}}{t_i - t_{i-1}}$$

Velocities are quantized into discrete bins $B_k$. The probability of falling into bin $B_k$ is $p_k = \frac{n_k}{N-1}$. The Shannon entropy is:
$$\mathcal{H} = -\sum_{k} p_k \log_2(p_k)$$

- **Autonomous Agentic Script / Linear Motion**: Constant velocity, $v_i \approx \text{const}$, yielding $\mathcal{H} \to 0$.
- **Natural Human Ballistic Movement**: Micro-tremors, neuromuscular jitter, bell-shaped velocity profiles yielding $\mathcal{H} \ge 1.5$ and angular diversity $\sum |\Delta\theta_i| \ge 2$.

---

## 2. Zero-Knowledge Behavioral Proof (ZK-BP)

The client constructs a cryptographically binding signature over the trajectory without transmitting raw user coordinates:
$$\text{Trajectory Hash} = \text{SHA256}(\mathcal{T})$$
$$\text{ZK-Proof Signature} = \text{HMAC-SHA256}_{K_{\text{AMTD}}}(\text{txId} \parallel \text{Trajectory Hash} \parallel \text{userActivation} \parallel \text{Port})$$

---

## 3. Temporal Vault Synchronization Algorithm

```
On arrival of Shard A:
    Record t_A = now()
    If Shard B already in vault:
        Compute delta_t = |t_A - t_B|
        If delta_t <= 50ms AND ZKP valid:
            Authorize Transaction
        Else:
            Drop & Quarantine
    Else:
        Arm 50ms timer
        On timer expiry:
            If Shard B still absent:
                Flag ASYMMETRIC_TRANSPORT_FAILURE (CSRF / Bot Attack)
                Quarantine Transaction
                Zero Balance Deducted
```
