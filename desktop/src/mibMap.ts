export const MIB_MAP: Record<string, string> = {
  "1.3.6.1.6.3.1.1.4.1.0": "SNMP Trap OID",
  "1.3.6.1.2.1.1.3.0": "sysUpTime",
  "1.3.6.1.4.1.6527.3.1.3.1.0.2": "Nokia Configuration Saved (admin save)",
  "1.3.6.1.4.1.6527.3.1.3.2.2.0.35": "Nokia Log Event Generated",
  "1.3.6.1.4.1.6527.3.1.3.2.2.0.43": "Nokia Threshold Crossing Event",
  "1.3.6.1.4.1.6527.3.1.3.3.0.46": "Nokia BGP Peer Session Down",
  "1.3.6.1.4.1.6527.3.1.2.2.7.1.0": "Nokia Event Sequence ID",
  "1.3.6.1.4.1.6527.3.1.2.2.7.9.0": "Nokia Event ID",
  "1.3.6.1.4.1.6527.3.1.2.2.7.31.0": "Nokia Event Severity",
  "1.3.6.1.4.1.6527.3.1.3.2.1.0.12": "Nokia Port Link Up",
  "1.3.6.1.4.1.6527.3.1.3.2.1.0.13": "Nokia Port Link Down",
  "1.3.6.1.4.1.6527.3.1.3.2.1.0.36": "Nokia Port Signal Fail (Alarm)",
  "1.3.6.1.4.1.6527.3.1.3.2.1.0.37": "Nokia Port Loss of Frame (Alarm)",
  "1.3.6.1.4.1.6527.3.1.3.2.1.0.38": "Nokia Port Loss of Sync (Alarm)",
  "1.3.6.1.4.1.6527.3.1.6.3.1.1.5.3": "Nokia Link Down Trap",
  "1.3.6.1.4.1.6527.3.1.6.3.1.1.5.4": "Nokia Link Up Trap",
  
  // System / Chassis Stats
  "1.3.6.1.4.1.6527.3.1.2.1.1.1": "Nokia CPU Load (1 min)",
  "1.3.6.1.4.1.6527.3.1.2.1.1.2": "Nokia Memory Usage (%)",
  "1.3.6.1.4.1.2636.3.1.13.1.11": "Nokia SGI Memory Used",
  "1.3.6.1.4.1.6527.3.1.2.2.1.2.1.1": "Nokia Chassis Temperature",
  "1.3.6.1.4.1.6527.3.1.2.2.1.2.1.2": "Nokia Fan Tray Status",

  // BGP Peer Table
  "1.3.6.1.4.1.6527.3.1.2.3.24.1.7": "BGP Peer Admin Status",
  "1.3.6.1.4.1.6527.3.1.2.3.24.1.8": "BGP Peer Oper Status",
  "1.3.6.1.4.1.6527.3.1.2.3.24.1.12": "BGP Peer State",
  "1.3.6.1.4.1.6527.3.1.2.3.24.1.13": "BGP Peer Established Time",
  "1.3.6.1.4.1.6527.3.1.2.3.24.1.14": "BGP Peer In-Updates",

  // Interface Table (standard)
  "1.3.6.1.2.1.1.1.0": "sysDescr",
  "1.3.6.1.2.1.1.5.0": "sysName",
  "1.3.6.1.2.1.2.2.1.2": "ifDescr",
  "1.3.6.1.2.1.2.2.1.7": "ifAdminStatus",
  "1.3.6.1.2.1.2.2.1.8": "ifOperStatus",
  "1.3.6.1.2.1.31.1.1.1.1": "ifName",
  "1.3.6.1.2.1.31.1.1.1.6": "ifHCInOctets",
  "1.3.6.1.2.1.31.1.1.1.10": "ifHCOutOctets"
};

// Helper to find the best matching label for an OID (handles instances/suffixes)
export function getLabel(oid: string): string {
  if (MIB_MAP[oid]) return MIB_MAP[oid];
  
  // Try matching by prefix (e.g. table columns with row indices)
  const sortedPrefixes = Object.keys(MIB_MAP).sort((a, b) => b.length - a.length);
  for (const prefix of sortedPrefixes) {
    if (oid.startsWith(prefix + ".")) {
      return MIB_MAP[prefix];
    }
  }
  
  return oid;
}
