import re

with open('src/simulation/simulation.cpp', 'r', encoding='utf-8') as f:
    text = f.read()

sig_old = """    out() << rec.to_json(
        batch_type, phase,
        cfg_.attack_active, cfg_.attack_type,
        t.m1, t.m2,
        bob_outcome, t.correction_label,
        charlie_outcome,
        acc.decoy_qber, acc.tau_hoeffding, acc.tau_cefb,
        merkle_root, batch_committed, mac_verified, mac_tag,
        latency_us, throughput_hz
    ) << "\\n";"""

sig_new = """    out() << rec.to_json(
        batch_type, phase,
        cfg_.attack_active, cfg_.attack_type,
        t.m1, t.m2,
        bob_outcome, t.correction_label,
        charlie_outcome,
        acc.decoy_qber, acc.tau_hoeffding, acc.tau_cefb,
        acc.composable_epsilon, acc.fp_rate, acc.fn_rate,
        merkle_root, batch_committed, mac_verified, mac_tag,
        latency_us, throughput_hz
    ) << "\\n";"""

text = text.replace(sig_old, sig_new)

dispatch_old = """        // Dispatch decision
        const VerificationResult result = DecisionEngine::dispatch(acc);"""

dispatch_new = """        // A1 - Finite-key composable security epsilon
        double p0 = 0.0;
        int n_test = decoy_injector_.total_decoy();
        if (n_test > 0) {
            acc.composable_epsilon = n_test * std::exp(-2.0 * n_test * std::pow(acc.tau_hoeffding - p0, 2));
        }

        // A2 - Intercept Resend Pattern
        recent_qbers_.push_back(acc.decoy_qber);
        if (recent_qbers_.size() > 10) recent_qbers_.pop_front();
        
        bool ir_pattern = false;
        if (recent_qbers_.size() == 10) {
            double sum = std::accumulate(recent_qbers_.begin(), recent_qbers_.end(), 0.0);
            double avg = sum / 10.0;
            double var = 0.0;
            for (double q : recent_qbers_) var += (q - avg) * (q - avg);
            var /= 10.0;
            if (avg > acc.tau_hoeffding && var < 0.0002) {
                ir_pattern = true;
            }
        }

        // A3 - GHZ Degradation Trend
        if (acc.mermin_tested) {
            recent_mermins_.push_back(acc.mermin_m_hat);
            if (recent_mermins_.size() > 20) recent_mermins_.pop_front();
        }
        bool ghz_degradation = false;
        if (recent_mermins_.size() > 5) {
            double trend = (recent_mermins_.back() - recent_mermins_.front()) / recent_mermins_.size();
            if (trend < -0.05) {
                ghz_degradation = true;
            }
        }

        // A4 - PNS Analog Suspected
        bool pns_suspected = false;
        if (acc.decoy_qber < 0.005 && acc.mermin_m_hat > 3.8 && cfg_.attack_active) {
            pns_suspected = true;
        }

        // Dispatch decision (baseline)
        VerificationResult result = DecisionEngine::dispatch(acc);

        // Append our new rigor flags to the result
        if (acc.composable_epsilon > 1e-6) result.event_flags.push_back("finite_key_epsilon_high");
        if (ir_pattern) result.event_flags.push_back("intercept_resend_pattern");
        if (ghz_degradation) result.event_flags.push_back("ghz_degradation_trend");
        if (pns_suspected) result.event_flags.push_back("pns_analog_suspected");
        
        // A5 - FP / FN Tracking
        bool is_reject = (result.verdict == Verdict::REJECT);
        recent_fp_.push_back(!cfg_.attack_active && is_reject);
        recent_fn_.push_back(cfg_.attack_active && !is_reject);
        
        if (recent_fp_.size() > 100) recent_fp_.pop_front();
        if (recent_fn_.size() > 100) recent_fn_.pop_front();

        double fp_count = std::accumulate(recent_fp_.begin(), recent_fp_.end(), 0.0);
        double fn_count = std::accumulate(recent_fn_.begin(), recent_fn_.end(), 0.0);
        acc.fp_rate = fp_count / recent_fp_.size();
        acc.fn_rate = fn_count / recent_fn_.size();"""

text = text.replace(dispatch_old, dispatch_new)

with open('src/simulation/simulation.cpp', 'w', encoding='utf-8') as f:
    f.write(text)