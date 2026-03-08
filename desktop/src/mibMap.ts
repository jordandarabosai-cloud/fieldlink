export const MIB_MAP: Record<string, string> = {
  "1.3.6.1.6.3.1.1.4.1.0": "SNMP Trap OID",
  "1.3.6.1.2.1.1.3.0": "sysUpTime",
  "1.3.6.1.4.1.6527.3.1.3.1.0.2": "Nokia Configuration Saved (admin save)",
  "1.3.6.1.4.1.6527.3.1.3.2.2.0.35": "Nokia Log Event Generated",
  "1.3.6.1.4.1.6527.3.1.3.2.2.0.43": "Nokia Threshold Crossing Event",
  "1.3.6.1.4.1.6527.3.1.3.3.0.46": "Nokia BGP Peer Session Down",
  "1.3.6.1.4.1.6527.3.1.3.3.0.63": "Nokia Static Route Withdrawn / Inactive",
  "1.3.6.1.4.1.6527.3.1.3.3.0.64": "Nokia Static Route Installed / Active",
  "1.3.6.1.4.1.6527.3.1.3.4.3.0.21": "Nokia Service/Subscriber State Change",
  "1.3.6.1.4.1.6527.3.1.2.2.7.1.0": "Nokia Event Sequence ID",
  "1.3.6.1.4.1.6527.3.1.2.2.7.9.0": "Nokia Event ID",
  "1.3.6.1.4.1.6527.3.1.2.2.7.31.0": "Nokia Event Severity",
  "1.3.6.1.4.1.6527.3.1.3.2.1.0.12": "Nokia Port Link Up (clear/recovery)",
  "1.3.6.1.4.1.6527.3.1.3.2.1.0.13": "Nokia Port Link Down (alarm)",
  "1.3.6.1.4.1.6527.3.1.3.2.1.0.36": "Nokia Port Signal Fail (alarm set)",
  "1.3.6.1.4.1.6527.3.1.3.2.1.0.37": "Nokia Port Loss of Frame (alarm set)",
  "1.3.6.1.4.1.6527.3.1.3.2.1.0.38": "Nokia Port Loss of Sync (alarm set)",
  "1.3.6.1.6.3.1.1.5.3": "IF-MIB linkDown",
  "1.3.6.1.6.3.1.1.5.4": "IF-MIB linkUp",

  // Port Events (from Event-Control list)
  "1.3.6.1.4.1.6527.3.1.3.2.1.0.2001": "Nokia SONET/SDH Port Alarm Set (incl LOF/LOS family)",
  "1.3.6.1.4.1.6527.3.1.3.2.1.0.2002": "Nokia SONET/SDH Port Alarm Clear (incl LOF/LOS family)",
  "1.3.6.1.4.1.6527.3.1.3.2.1.0.2003": "sonetSDHChannelAlarmSet",
  "1.3.6.1.4.1.6527.3.1.3.2.1.0.2004": "sonetSDHChannelAlarmClear",
  "1.3.6.1.4.1.6527.3.1.3.2.1.0.2005": "SFPInserted",
  "1.3.6.1.4.1.6527.3.1.3.2.1.0.2006": "SFPRemoved",
  "1.3.6.1.4.1.6527.3.1.3.2.1.0.2008": "SFPStatusFailure",
  "1.3.6.1.4.1.6527.3.1.3.2.1.0.2009": "portError",
  "1.3.6.1.4.1.6527.3.1.3.2.1.0.2010": "yellowDiffDelayExceeded",
  "1.3.6.1.4.1.6527.3.1.3.2.1.0.2011": "redDiffDelayExceeded",
  "1.3.6.1.4.1.6527.3.1.3.2.1.0.2012": "bndlBadEndPtDiscriminator",
  "1.3.6.1.4.1.6527.3.1.3.2.1.0.2017": "Nokia Ethernet Port Alarm Set",
  "1.3.6.1.4.1.6527.3.1.3.2.2.0.2017": "Nokia Ethernet Port Alarm Set (event-control)",
  "1.3.6.1.4.1.6527.3.1.3.2.2.0.2018": "Nokia Ethernet Port Alarm Clear (event-control)",
  "1.3.6.1.4.1.6527.3.1.3.3.0.2034": "staticRouteActive",
  "1.3.6.1.4.1.6527.3.1.3.3.0.2035": "staticRouteInactive",
  "1.3.6.1.4.1.6527.3.1.3.3.0.2063": "bfdSessionDeleted",
  "1.3.6.1.4.1.6527.3.1.3.3.0.2064": "bfdProtocolCleared",
  "1.3.6.1.4.1.6527.3.1.3.2.1.0.2018": "Nokia Ethernet Port Alarm Clear",
  "1.3.6.1.4.1.6527.3.1.3.2.1.0.2019": "ds1LoopbackStart",
  "1.3.6.1.4.1.6527.3.1.3.2.1.0.2020": "ds1LoopbackStop",
  "1.3.6.1.4.1.6527.3.1.3.2.1.0.2021": "ds3LoopbackStart",
  "1.3.6.1.4.1.6527.3.1.3.2.1.0.2022": "ds3LoopbackStop",
  "1.3.6.1.4.1.6527.3.1.3.2.1.0.2023": "sdhLoopbackStart",
  "1.3.6.1.4.1.6527.3.1.3.2.1.0.2024": "sdhLoopbackStop",
  "1.3.6.1.4.1.6527.3.1.3.2.1.0.2025": "etherLoopDetected",
  "1.3.6.1.4.1.6527.3.1.3.2.1.0.2026": "etherLoopCleared",
  "1.3.6.1.4.1.6527.3.1.3.2.1.0.2027": "etherSpeedNotCompatible",
  "1.3.6.1.4.1.6527.3.1.3.2.1.0.2028": "etherDuplexNotCompatible",
  "1.3.6.1.4.1.6527.3.1.3.2.1.0.2029": "etherIngressRateCfgNotCompatible",
  "1.3.6.1.4.1.6527.3.1.3.2.1.0.2030": "digitalDiagnosticMonitorFailed",
  "1.3.6.1.4.1.6527.3.1.3.2.1.0.2031": "SFPStatusDDMCorrupt",
  "1.3.6.1.4.1.6527.3.1.3.2.1.0.2032": "SFPStatusReadError",
  "1.3.6.1.4.1.6527.3.1.3.2.1.0.2033": "SFPStatusUnsupported",
  "1.3.6.1.4.1.6527.3.1.3.2.1.0.2034": "dsxClockSyncStateChange",
  "1.3.6.1.4.1.6527.3.1.3.2.1.0.2035": "bundleMlfrMemberLoopback",
  "1.3.6.1.4.1.6527.3.1.3.2.1.0.2036": "tmnxPortUnsupportedFunction",
  "1.3.6.1.4.1.6527.3.1.3.2.1.0.2037": "otuAlarms",
  "1.3.6.1.4.1.6527.3.1.3.2.1.0.2039": "tPortAccEgrQGrpHostMatchFailure",
  "1.3.6.1.4.1.6527.3.1.3.2.1.0.2040": "tPortEgrVPortHostMatchFailure",
  "1.3.6.1.4.1.6527.3.1.3.2.1.0.2041": "digitalDiagnosticMonitorCleared",
  "1.3.6.1.4.1.6527.3.1.3.2.1.0.2046": "tmnxEqSonetClockSrcNotCompatible",
  "1.3.6.1.4.1.6527.3.1.3.2.1.0.2047": "tmnxEqSonetSfThreshNotCompatible",
  "1.3.6.1.4.1.6527.3.1.3.2.1.0.2048": "tmnxEqSonetFramingNotCompatible",
  "1.3.6.1.4.1.6527.3.1.3.2.1.0.2049": "tmnxResvCbsPoolThreshGreen",
  "1.3.6.1.4.1.6527.3.1.3.2.1.0.2050": "tmnxResvCbsPoolThreshAmber",
  "1.3.6.1.4.1.6527.3.1.3.2.1.0.2051": "tmnxResvCbsPoolThreshRed",
  "1.3.6.1.4.1.6527.3.1.3.2.1.0.2052": "tmnxEqPortEtherCrcAlarm",
  "1.3.6.1.4.1.6527.3.1.3.2.1.0.2053": "tmnxEqPortEtherCrcAlarmClear",
  "1.3.6.1.4.1.6527.3.1.3.2.1.0.2054": "tmnxEqPortEtherInternalAlarm",
  "1.3.6.1.4.1.6527.3.1.3.2.1.0.2055": "tmnxEqPortEtherInternalAlarmClr",
  "1.3.6.1.4.1.6527.3.1.3.2.1.0.2056": "tmnxEqCohOptPortAlarm",
  "1.3.6.1.4.1.6527.3.1.3.2.1.0.2059": "SFPStatusCulprit",
  "1.3.6.1.4.1.6527.3.1.3.2.1.0.2060": "SFPStatusBlocked",
  "1.3.6.1.4.1.6527.3.1.3.2.1.0.2061": "SFPStatusOperational",
  "1.3.6.1.4.1.6527.3.1.3.2.1.0.2068": "tmnxEqPortEtherEgressRateChange",
  "1.3.6.1.4.1.6527.3.1.3.2.1.0.2071": "tmnxPortEtherLoopbackStarted",
  "1.3.6.1.4.1.6527.3.1.3.2.1.0.2072": "tmnxPortEtherLoopbackStopped",
  "1.3.6.1.4.1.6527.3.1.3.2.1.0.2073": "tmnxPortGnssStatusChange",
  "1.3.6.1.4.1.6527.3.1.3.2.1.0.2076": "tmnxPortAUIReset",

  // System / Chassis Stats (TIMETRA-SYSTEM-MIB)
  "1.3.6.1.4.1.6527.3.1.2.1.1.1": "sgiCpuUsage (CPU %)",
  "1.3.6.1.4.1.6527.3.1.2.1.1.2": "sgiMemoryUsed (bytes)",
  "1.3.6.1.4.1.6527.3.1.2.1.1.3": "sgiMemoryAvailable (bytes)",
  "1.3.6.1.4.1.6527.3.1.2.1.1.4": "sgiMemoryPoolAllocated (bytes)",
  "1.3.6.1.4.1.6527.3.1.2.1.1.5": "sgiSwMajorVersion",
  "1.3.6.1.4.1.6527.3.1.2.1.1.6": "sgiSwMinorVersion",
  "1.3.6.1.4.1.6527.3.1.2.1.1.7": "sgiSwVersionModifier",
  "1.3.6.1.4.1.6527.3.1.2.1.1.8": "sgiSnmpInGetBulks",
  "1.3.6.1.4.1.6527.3.1.2.1.1.9": "sgiKbMemoryUsed (KB)",
  "1.3.6.1.4.1.6527.3.1.2.1.1.10": "sgiKbMemoryAvailable (KB)",
  "1.3.6.1.4.1.6527.3.1.2.1.1.11": "sgiKbMemoryPoolAllocated (KB)",
  "1.3.6.1.4.1.6527.3.1.2.1.1.12": "tmnxSysCpuMonTable",
  "1.3.6.1.4.1.6527.3.1.2.1.1.12.1.1": "tmnxSysCpuMonSampleTime",
  "1.3.6.1.4.1.6527.3.1.2.1.1.12.1.2": "tmnxSysCpuMonCpuIdle",
  "1.3.6.1.4.1.6527.3.1.2.1.1.12.1.3": "tmnxSysCpuMonBusyCoreUtil",
  "1.3.6.1.4.1.6527.3.1.2.1.1.12.1.4": "tmnxSysCpuMonBusyGroupName",
  "1.3.6.1.4.1.6527.3.1.2.1.1.12.1.5": "tmnxSysCpuMonBusyGroupUtil",
  "1.3.6.1.4.1.6527.3.1.2.1.1.13": "sgiGroupingIDs",
  "1.3.6.1.4.1.6527.3.1.2.1.1.14": "sgiSnmpFailedSets",
  "1.3.6.1.4.1.2636.3.1.13.1.11": "Nokia SGI Memory Used",
  "1.3.6.1.4.1.6527.3.1.2.2.1.2.1.1": "Nokia Chassis Temperature",
  "1.3.6.1.4.1.6527.3.1.2.2.1.2.1.2": "Nokia Fan Tray Status",

  // BGP Peer Table
  "1.3.6.1.4.1.6527.3.1.2.3.24.1.7": "BGP Peer Admin Status",
  "1.3.6.1.4.1.6527.3.1.2.3.24.1.8": "BGP Peer Oper Status",
  "1.3.6.1.4.1.6527.3.1.2.3.24.1.12": "BGP Peer State",
  "1.3.6.1.4.1.6527.3.1.2.3.24.1.13": "BGP Peer Established Time",
  "1.3.6.1.4.1.6527.3.1.2.3.24.1.14": "BGP Peer In-Updates",

  // Static Route / Next-hop context seen in traps
  "1.3.6.1.4.1.6527.3.1.2.3.92.1.9": "Static Route Next-Hop Info",
  "1.3.6.1.4.1.6527.3.1.2.3.92.1.16": "Static Route Internal State/Flags",
  "1.3.6.1.4.1.6527.3.1.2.3.92.1.18": "Static Route Status Bitmap",
  "1.3.6.1.4.1.6527.3.1.2.3.21.41.0": "Static Route Protocol Type",
  "1.3.6.1.4.1.6527.3.1.2.3.21.42.0": "Static Route Active Flag",

  // Service context seen with service/subscriber traps
  "1.3.6.1.4.1.6527.3.1.2.4.3.100.1.0": "Service Event Object ID",
  "1.3.6.1.4.1.6527.3.1.2.4.3.100.29.0": "Service Event State",

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
