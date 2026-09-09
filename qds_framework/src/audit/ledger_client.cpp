#include "ledger_client.hpp"

bool LedgerClient::commit_root(uint32_t batch_id, const Hash256& root) {
    if (ledger_.count(batch_id)) return false;  // no overwrites
    ledger_[batch_id] = root;
    return true;
}

bool LedgerClient::verify_root(uint32_t batch_id, const Hash256& claimed_root) const {
    auto it = ledger_.find(batch_id);
    if (it == ledger_.end()) return false;
    return it->second == claimed_root;
}

std::string LedgerClient::dump() const {
    std::ostringstream oss;
    for (const auto& [bid, root] : ledger_)
        oss << "batch_id=" << bid << " root=" << hash_to_hex(root) << "\n";
    return oss.str();
}
