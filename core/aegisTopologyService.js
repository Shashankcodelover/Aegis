// =========================================================================
// AEGIS — Zero-Trust Dual-Channel Payload Sharding Topology Mesh Service
// Manages: In-Band & Out-of-Band Transport Corridors, ZK-BP Entropy Channels,
// Governed Security Endpoint Nodes, Live Telemetry, Cascading Deletion,
// and High-Throughput Batch Ingestion (RFC 4180 CSV & JSON).
// =========================================================================

class AegisTopologyService {
    constructor() {
        this.resetTopologyDefaults();
    }

    resetTopologyDefaults() {
        this.nodes = [
            {
                id: 'NODE-DEFENDER-01',
                name: 'Gong Pay Mobile UPI Client (Honest User)',
                type: 'Mobile UPI Client',
                trustScore: 99.4,
                isolationMode: 'Zero-Trust Pass',
                status: 'active',
                createdAt: new Date().toISOString()
            },
            {
                id: 'NODE-ADVERSARY-02',
                name: 'Automated CSRF Bot / Malicious Script Node',
                type: 'External Adversary Node',
                trustScore: 3.2,
                isolationMode: 'Quarantine',
                status: 'quarantined',
                createdAt: new Date().toISOString()
            },
            {
                id: 'GATEWAY-INBAND-03',
                name: 'Public HTTP In-Band Payload Ingestion Gateway',
                type: 'Ingress API Gateway',
                trustScore: 92.0,
                isolationMode: 'Dynamic AMTD Route',
                status: 'active',
                createdAt: new Date().toISOString()
            },
            {
                id: 'TUNNEL-WEBRTC-04',
                name: 'Out-of-Band WebRTC Micro-Signaling Tunnel',
                type: 'WebRTC Signaling Relay',
                trustScore: 98.6,
                isolationMode: 'Zero-Trust Pass',
                status: 'active',
                createdAt: new Date().toISOString()
            },
            {
                id: 'VAULT-CORE-05',
                name: 'Gramin Commercial Bank Recombination Engine',
                type: 'Core Settlement Ledger',
                trustScore: 100.0,
                isolationMode: 'Zero-Trust Pass',
                status: 'active',
                createdAt: new Date().toISOString()
            }
        ];

        this.corridors = [
            {
                id: 'CORR-SHARD-101',
                sourceNodeId: 'NODE-DEFENDER-01',
                targetNodeId: 'GATEWAY-INBAND-03',
                channelType: 'In-Band HTTPS POST (Shard A)',
                shannonEntropy: 0.985,
                recombSlaMs: 42,
                bandwidthKbps: 1200,
                status: 'active',
                createdAt: new Date().toISOString()
            },
            {
                id: 'CORR-SHARD-102',
                sourceNodeId: 'NODE-DEFENDER-01',
                targetNodeId: 'TUNNEL-WEBRTC-04',
                channelType: 'Out-of-Band WebRTC DataChannel (Shard B)',
                shannonEntropy: 0.994,
                recombSlaMs: 18,
                bandwidthKbps: 840,
                status: 'active',
                createdAt: new Date().toISOString()
            },
            {
                id: 'CORR-SHARD-103',
                sourceNodeId: 'TUNNEL-WEBRTC-04',
                targetNodeId: 'VAULT-CORE-05',
                channelType: 'AMTD Ephemeral Port Rotation Tunnel',
                shannonEntropy: 0.978,
                recombSlaMs: 24,
                bandwidthKbps: 2400,
                status: 'active',
                createdAt: new Date().toISOString()
            },
            {
                id: 'CORR-SHARD-104',
                sourceNodeId: 'GATEWAY-INBAND-03',
                targetNodeId: 'VAULT-CORE-05',
                channelType: 'Zero-Knowledge Behavioral Proof Recombiner',
                shannonEntropy: 0.991,
                recombSlaMs: 35,
                bandwidthKbps: 1800,
                status: 'active',
                createdAt: new Date().toISOString()
            },
            {
                id: 'CORR-SHARD-105',
                sourceNodeId: 'NODE-ADVERSARY-02',
                targetNodeId: 'GATEWAY-INBAND-03',
                channelType: 'Intercepted Forgery Probe (Isolated Sink)',
                shannonEntropy: 0.082,
                recombSlaMs: 12,
                bandwidthKbps: 450,
                status: 'severed',
                createdAt: new Date().toISOString()
            }
        ];
    }

    // Telemetry and Health Metrics
    getTelemetry() {
        const totalCorridors = this.corridors.length;
        const activeCorridors = this.corridors.filter(c => c.status === 'active').length;
        const severedCorridors = this.corridors.filter(c => c.status === 'severed').length;
        const avgEntropy = totalCorridors > 0
            ? Number((this.corridors.reduce((acc, c) => acc + (Number(c.shannonEntropy) || 0), 0) / totalCorridors).toFixed(3))
            : 0;
        const totalNodes = this.nodes.length;
        const boundNodeIds = new Set();
        this.corridors.forEach(c => {
            boundNodeIds.add(c.sourceNodeId);
            boundNodeIds.add(c.targetNodeId);
        });
        const zeroTrustCoveragePercent = totalNodes > 0
            ? Number(((boundNodeIds.size / totalNodes) * 100).toFixed(1))
            : 0;
        const avgRecombSla = totalCorridors > 0
            ? Number((this.corridors.reduce((acc, c) => acc + (Number(c.recombSlaMs) || 0), 0) / totalCorridors).toFixed(1))
            : 0;

        return {
            totalCorridors,
            activeCorridors,
            severedCorridors,
            avgEntropy,
            totalNodes,
            boundNodesCount: boundNodeIds.size,
            zeroTrustCoveragePercent,
            avgRecombSla,
            timestamp: new Date().toISOString()
        };
    }

    // Node Operations
    getAllNodes() {
        return this.nodes;
    }

    getNodeById(id) {
        return this.nodes.find(n => n.id === id);
    }

    createNode(data) {
        if (!data || !data.id || !data.name) {
            throw new Error('Node id and name are required.');
        }
        if (this.nodes.some(n => n.id === data.id)) {
            throw new Error(`Node with ID "${data.id}" already exists.`);
        }
        const node = {
            id: String(data.id).trim(),
            name: String(data.name).trim(),
            type: data.type || 'Security Gateway Node',
            trustScore: data.trustScore !== undefined ? Number(data.trustScore) : 85.0,
            isolationMode: data.isolationMode || 'Zero-Trust Pass',
            status: data.status || 'active',
            createdAt: new Date().toISOString()
        };
        this.nodes.push(node);
        return node;
    }

    deleteNode(id) {
        const initialNodeCount = this.nodes.length;
        this.nodes = this.nodes.filter(n => n.id !== id);
        if (this.nodes.length === initialNodeCount) {
            return { deleted: false, message: `Node "${id}" not found.` };
        }
        // Cascading deletion: remove all corridors connected to this node
        const initialCorridorCount = this.corridors.length;
        this.corridors = this.corridors.filter(c => c.sourceNodeId !== id && c.targetNodeId !== id);
        const cascadedCorridors = initialCorridorCount - this.corridors.length;
        return {
            deleted: true,
            nodeId: id,
            cascadedCorridorsRemoved: cascadedCorridors,
            message: `Node ${id} and ${cascadedCorridors} connected sharding corridors deleted cleanly.`
        };
    }

    purgeAllNodes() {
        const deletedNodes = this.nodes.length;
        const deletedCorridors = this.corridors.length;
        this.nodes = [];
        this.corridors = [];
        return {
            deletedNodes,
            deletedCorridors,
            message: `Universal purge executed: all ${deletedNodes} security nodes and ${deletedCorridors} corridors eliminated.`
        };
    }

    // Corridor Operations
    getAllCorridors() {
        return this.corridors;
    }

    getCorridorById(id) {
        return this.corridors.find(c => c.id === id);
    }

    createCorridor(data) {
        if (!data || !data.sourceNodeId || !data.targetNodeId) {
            throw new Error('sourceNodeId and targetNodeId are required.');
        }
        const id = data.id || `CORR-SHARD-${Date.now().toString().slice(-4)}`;
        if (this.corridors.some(c => c.id === id)) {
            throw new Error(`Corridor with ID "${id}" already exists.`);
        }
        const corridor = {
            id: String(id).trim(),
            sourceNodeId: String(data.sourceNodeId).trim(),
            targetNodeId: String(data.targetNodeId).trim(),
            channelType: data.channelType || 'In-Band HTTPS POST (Shard A)',
            shannonEntropy: data.shannonEntropy !== undefined ? Number(data.shannonEntropy) : 0.98,
            recombSlaMs: data.recombSlaMs !== undefined ? Number(data.recombSlaMs) : 30,
            bandwidthKbps: data.bandwidthKbps !== undefined ? Number(data.bandwidthKbps) : 1000,
            status: data.status === 'severed' ? 'severed' : 'active',
            createdAt: new Date().toISOString()
        };
        this.corridors.push(corridor);
        return corridor;
    }

    severCorridor(id) {
        const corridor = this.corridors.find(c => c.id === id);
        if (!corridor) throw new Error(`Corridor "${id}" not found.`);
        corridor.status = 'severed';
        corridor.severedAt = new Date().toISOString();
        return corridor;
    }

    restoreCorridor(id) {
        const corridor = this.corridors.find(c => c.id === id);
        if (!corridor) throw new Error(`Corridor "${id}" not found.`);
        corridor.status = 'active';
        delete corridor.severedAt;
        return corridor;
    }

    deleteCorridor(id) {
        const initialCount = this.corridors.length;
        this.corridors = this.corridors.filter(c => c.id !== id);
        return {
            deleted: this.corridors.length < initialCount,
            corridorId: id
        };
    }

    purgeAllCorridors() {
        const deletedCount = this.corridors.length;
        this.corridors = [];
        return {
            deletedCorridors: deletedCount,
            message: `Universal purge executed: ${deletedCount} sharding corridors removed.`
        };
    }

    // Batch Ingestion (RFC 4180 CSV & JSON)
    parseRFC4180CSV(rawText) {
        const lines = rawText.split(/\r?\n/).filter(line => line.trim().length > 0);
        if (lines.length === 0) return [];

        function parseLine(line) {
            const row = [];
            let inQuotes = false;
            let token = '';
            for (let i = 0; i < line.length; i++) {
                const ch = line[i];
                if (ch === '"') {
                    if (inQuotes && line[i + 1] === '"') {
                        token += '"';
                        i++;
                    } else {
                        inQuotes = !inQuotes;
                    }
                } else if (ch === ',' && !inQuotes) {
                    row.push(token.trim());
                    token = '';
                } else {
                    token += ch;
                }
            }
            row.push(token.trim());
            return row;
        }

        const headers = parseLine(lines[0]).map(h => h.replace(/^"(.*)"$/, '$1').trim());
        const records = [];
        for (let i = 1; i < lines.length; i++) {
            const values = parseLine(lines[i]);
            if (values.length === headers.length) {
                const obj = {};
                headers.forEach((h, idx) => {
                    obj[h] = values[idx].replace(/^"(.*)"$/, '$1');
                });
                records.push(obj);
            }
        }
        return records;
    }

    ingestCorridorsBatch(payload, format = 'auto') {
        let items = [];
        let isJson = false;

        if (Array.isArray(payload)) {
            items = payload;
            isJson = true;
        } else if (typeof payload === 'string') {
            const trimmed = payload.trim();
            if (format === 'json' || (format === 'auto' && (trimmed.startsWith('[') || trimmed.startsWith('{')))) {
                try {
                    const parsed = JSON.parse(trimmed);
                    items = Array.isArray(parsed) ? parsed : [parsed];
                    isJson = true;
                } catch (e) {
                    throw new Error(`Invalid JSON batch format: ${e.message}`);
                }
            } else {
                items = this.parseRFC4180CSV(trimmed);
            }
        } else {
            throw new Error('Invalid payload: expected CSV string or JSON array.');
        }

        if (items.length === 0) {
            throw new Error('Batch payload contained 0 valid rows.');
        }

        const ingested = [];
        const errors = [];

        items.forEach((item, index) => {
            try {
                if (!item.sourceNodeId || !item.targetNodeId) {
                    throw new Error(`Row ${index + 1}: Missing sourceNodeId or targetNodeId`);
                }
                const created = this.createCorridor(item);
                ingested.push(created);
            } catch (err) {
                errors.push({ row: index + 1, error: err.message });
            }
        });

        return {
            success: true,
            totalProcessed: items.length,
            ingestedCount: ingested.length,
            errorCount: errors.length,
            ingested,
            errors,
            format: isJson ? 'JSON' : 'RFC4180_CSV'
        };
    }

    ingestNodesBatch(payload, format = 'auto') {
        let items = [];
        let isJson = false;

        if (Array.isArray(payload)) {
            items = payload;
            isJson = true;
        } else if (typeof payload === 'string') {
            const trimmed = payload.trim();
            if (format === 'json' || (format === 'auto' && (trimmed.startsWith('[') || trimmed.startsWith('{')))) {
                try {
                    const parsed = JSON.parse(trimmed);
                    items = Array.isArray(parsed) ? parsed : [parsed];
                    isJson = true;
                } catch (e) {
                    throw new Error(`Invalid JSON batch format: ${e.message}`);
                }
            } else {
                items = this.parseRFC4180CSV(trimmed);
            }
        } else {
            throw new Error('Invalid payload: expected CSV string or JSON array.');
        }

        if (items.length === 0) {
            throw new Error('Batch payload contained 0 valid rows.');
        }

        const ingested = [];
        const errors = [];

        items.forEach((item, index) => {
            try {
                if (!item.id || !item.name) {
                    throw new Error(`Row ${index + 1}: Missing id or name`);
                }
                const created = this.createNode(item);
                ingested.push(created);
            } catch (err) {
                errors.push({ row: index + 1, error: err.message });
            }
        });

        return {
            success: true,
            totalProcessed: items.length,
            ingestedCount: ingested.length,
            errorCount: errors.length,
            ingested,
            errors,
            format: isJson ? 'JSON' : 'RFC4180_CSV'
        };
    }
}

module.exports = new AegisTopologyService();
