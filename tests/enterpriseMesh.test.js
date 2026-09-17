const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert');
const aegisTopology = require('../core/aegisTopologyService');

describe('AEGIS Enterprise Zero-Trust Relational Topology & Batch Ingestion Suite', () => {
    beforeEach(() => {
        aegisTopology.resetTopologyDefaults();
    });

    it('1. should seed default endpoint nodes and verify schema integrity', () => {
        const nodes = aegisTopology.getAllNodes();
        assert.ok(Array.isArray(nodes));
        assert.strictEqual(nodes.length, 5);
        const defender = aegisTopology.getNodeById('NODE-DEFENDER-01');
        assert.ok(defender);
        assert.strictEqual(defender.trustScore, 99.4);
        assert.strictEqual(defender.isolationMode, 'Zero-Trust Pass');
    });

    it('2. should calculate live telemetry with coverage and average Shannon entropy', () => {
        const telemetry = aegisTopology.getTelemetry();
        assert.strictEqual(telemetry.totalNodes, 5);
        assert.strictEqual(telemetry.totalCorridors, 5);
        assert.strictEqual(telemetry.activeCorridors, 4);
        assert.strictEqual(telemetry.severedCorridors, 1);
        assert.ok(telemetry.avgEntropy > 0.7);
        assert.strictEqual(telemetry.zeroTrustCoveragePercent, 100);
    });

    it('3. should provision a new zero-trust sharding corridor and bind endpoints', () => {
        const corridor = aegisTopology.createCorridor({
            id: 'CORR-TEST-99',
            sourceNodeId: 'NODE-DEFENDER-01',
            targetNodeId: 'VAULT-CORE-05',
            channelType: 'Direct Encrypted Optical Intertie',
            shannonEntropy: 0.999,
            recombSlaMs: 14,
            bandwidthKbps: 3200
        });
        assert.strictEqual(corridor.id, 'CORR-TEST-99');
        assert.strictEqual(corridor.status, 'active');
        const telemetry = aegisTopology.getTelemetry();
        assert.strictEqual(telemetry.totalCorridors, 6);
    });

    it('4. should sever a sharding corridor with 1-click control and recalculate metrics', () => {
        const severed = aegisTopology.severCorridor('CORR-SHARD-101');
        assert.strictEqual(severed.status, 'severed');
        assert.ok(severed.severedAt);

        const telemetry = aegisTopology.getTelemetry();
        assert.strictEqual(telemetry.severedCorridors, 2);
        assert.strictEqual(telemetry.activeCorridors, 3);

        const restored = aegisTopology.restoreCorridor('CORR-SHARD-101');
        assert.strictEqual(restored.status, 'active');
        assert.strictEqual(aegisTopology.getTelemetry().severedCorridors, 1);
    });

    it('5. should delete single sharding corridor and verify referential continuity', () => {
        const result = aegisTopology.deleteCorridor('CORR-SHARD-102');
        assert.strictEqual(result.deleted, true);
        assert.strictEqual(aegisTopology.getAllCorridors().length, 4);
    });

    it('6. should execute cascading deletion when an endpoint node is removed', () => {
        // NODE-DEFENDER-01 is connected to CORR-SHARD-101 and CORR-SHARD-102
        const result = aegisTopology.deleteNode('NODE-DEFENDER-01');
        assert.strictEqual(result.deleted, true);
        assert.strictEqual(result.cascadedCorridorsRemoved, 2);
        assert.strictEqual(aegisTopology.getAllNodes().length, 4);
        assert.strictEqual(aegisTopology.getAllCorridors().length, 3);
    });

    it('7. should ingest sharding corridors batch via RFC 4180 CSV format', () => {
        const csvData = `id,sourceNodeId,targetNodeId,channelType,shannonEntropy,recombSlaMs,bandwidthKbps
CORR-BATCH-01,NODE-DEFENDER-01,GATEWAY-INBAND-03,"In-Band HTTPS POST (Shard A)",0.992,38,1500
CORR-BATCH-02,TUNNEL-WEBRTC-04,VAULT-CORE-05,"AMTD Ephemeral Port Rotation Tunnel",0.985,20,2800`;

        const batch = aegisTopology.ingestCorridorsBatch(csvData, 'csv');
        assert.strictEqual(batch.success, true);
        assert.strictEqual(batch.ingestedCount, 2);
        assert.strictEqual(batch.errorCount, 0);
        assert.strictEqual(aegisTopology.getAllCorridors().length, 7);
    });

    it('8. should ingest endpoint nodes batch via structured JSON format', () => {
        const jsonData = JSON.stringify([
            {
                id: 'NODE-EDGE-06',
                name: 'Biometric Authenticator Edge Hardware Token',
                type: 'Hardware Security Module',
                trustScore: 99.8,
                isolationMode: 'Zero-Trust Pass'
            },
            {
                id: 'NODE-HONEYPOT-07',
                name: 'Deception Network Decoy Ingress',
                type: 'Deception Honeypot',
                trustScore: 12.0,
                isolationMode: 'Quarantine'
            }
        ]);

        const batch = aegisTopology.ingestNodesBatch(jsonData, 'json');
        assert.strictEqual(batch.success, true);
        assert.strictEqual(batch.ingestedCount, 2);
        assert.strictEqual(aegisTopology.getAllNodes().length, 7);
    });

    it('9. should safely reject malformed batch payloads with error feedback', () => {
        assert.throws(() => {
            aegisTopology.ingestCorridorsBatch('malformed,corrupt\n');
        });
    });

    it('10. should execute universal corridor purge and verify zero count', () => {
        const purgeResult = aegisTopology.purgeAllCorridors();
        assert.strictEqual(purgeResult.deletedCorridors, 5);
        assert.strictEqual(aegisTopology.getAllCorridors().length, 0);
        const telemetry = aegisTopology.getTelemetry();
        assert.strictEqual(telemetry.totalCorridors, 0);
        assert.strictEqual(telemetry.activeCorridors, 0);
    });

    it('11. should execute universal endpoint node purge with complete cascading purge', () => {
        const purgeResult = aegisTopology.purgeAllNodes();
        assert.strictEqual(purgeResult.deletedNodes, 5);
        assert.strictEqual(purgeResult.deletedCorridors, 5);
        assert.strictEqual(aegisTopology.getAllNodes().length, 0);
        assert.strictEqual(aegisTopology.getAllCorridors().length, 0);
    });
});
