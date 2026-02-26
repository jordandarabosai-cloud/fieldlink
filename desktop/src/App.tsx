import { useEffect, useMemo, useRef, useState } from "react";

type SerialPort = {
  path: string;
  friendlyName: string;
  serialNumber?: string | null;
};

type ModbusFunction = "holding" | "input" | "write";

type PollingItem = {
  id: string;
  name: string;
  functionType: Exclude<ModbusFunction, "write">;
  address: number;
  start: number;
  count: number;
  intervalMs: number;
  enabled: boolean;
  lastValues?: number[];
  lastUpdated?: string;
  error?: string;
};

type PollingLog = {
  id: string;
  timestamp: string;
  name: string;
  functionType: Exclude<ModbusFunction, "write">;
  start: number;
  count: number;
  values?: number[];
  error?: string;
};

type RegisterMapEntry = {
  name: string;
  register: number;
  scale?: number;
  unit?: string;
  notes?: string;
};

type DiscoveryDevice = {
  id: string;
  source: "modbus" | "snmp" | "bacnet";
  address: string;
  name: string;
  detail?: string;
  lastSeen: string;
};

type SnmpVarbind = {
  oid: string;
  type?: string;
  value?: unknown;
};

type TrapEntry = {
  id: string;
  receivedAt: string;
  varbinds: SnmpVarbind[];
};

type SnmpCounterLog = {
  id: string;
  timestamp: string;
  ifIndex: string;
  inErrors: number;
  outErrors: number;
  inDiscards: number;
  outDiscards: number;
  inOctets: number;
  outOctets: number;
  alert?: string;
};

const baudRates = [9600, 19200, 38400, 57600, 115200];

const formatTimestamp = (date: Date) =>
  date.toLocaleString(undefined, {
    hour12: false,
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

const toCsvValue = (value: string) =>
  value.includes(",") || value.includes("\n") || value.includes("\"")
    ? `"${value.replace(/\"/g, '""')}"`
    : value;

export default function App() {
  const hasBridge = typeof window !== "undefined" && Boolean(window.fieldlink);
  const [activePage, setActivePage] = useState<"connections" | "discovery" | "polling" | "logs" | "snmp" | "console">("connections");
  const [ports, setPorts] = useState<SerialPort[]>([]);
  const [selectedPort, setSelectedPort] = useState<string>("");
  const [baudRate, setBaudRate] = useState<number>(115200);
  const [parity, setParity] = useState<"none" | "even" | "odd">("none");
  const [modbusAddress, setModbusAddress] = useState<number>(1);
  const [mstpMac, setMstpMac] = useState<number>(5);
  const [serialOpen, setSerialOpen] = useState(false);
  const [status, setStatus] = useState<string>("Idle");

  const [modbusFunction, setModbusFunction] = useState<ModbusFunction>("holding");
  const [registerStart, setRegisterStart] = useState<number>(1);
  const [registerCount, setRegisterCount] = useState<number>(4);
  const [writeValues, setWriteValues] = useState<string>("0, 0, 0, 0");
  const [modbusResponse, setModbusResponse] = useState<string>("");

  const [pollName, setPollName] = useState<string>("Reg 1");
  const [pollStart, setPollStart] = useState<number>(1);
  const [pollCount, setPollCount] = useState<number>(1);
  const [pollInterval, setPollInterval] = useState<number>(1000);
  const [pollFunction, setPollFunction] = useState<Exclude<ModbusFunction, "write">>("holding");
  const [pollSlaveId, setPollSlaveId] = useState<number>(modbusAddress);
  const [pollItems, setPollItems] = useState<PollingItem[]>([]);
  const [pollLogs, setPollLogs] = useState<PollingLog[]>([]);
  const [registerMap, setRegisterMap] = useState<RegisterMapEntry[]>([]);
  const [registerMapStatus, setRegisterMapStatus] = useState<string>("");
  const [discoveryDevices, setDiscoveryDevices] = useState<DiscoveryDevice[]>([]);
  const [discoveryStatus, setDiscoveryStatus] = useState<string>("");
  const [modbusScanStart, setModbusScanStart] = useState<number>(1);
  const [modbusScanEnd, setModbusScanEnd] = useState<number>(247);
  const [modbusScanRegister, setModbusScanRegister] = useState<number>(1);
  const [modbusScanCount, setModbusScanCount] = useState<number>(1);
  const [modbusScanFunction, setModbusScanFunction] = useState<Exclude<ModbusFunction, "write">>("holding");
  const [snmpDiscoveryHosts, setSnmpDiscoveryHosts] = useState<string>("");

  const [snmpHost, setSnmpHost] = useState<string>("127.0.0.1");
  const [snmpPort, setSnmpPort] = useState<number>(161);
  const [snmpVersion, setSnmpVersion] = useState<"v1" | "v2c" | "v3">("v2c");
  const [snmpCommunity, setSnmpCommunity] = useState<string>("public");
  const [snmpV3User, setSnmpV3User] = useState<string>("");
  const [snmpV3AuthProtocol, setSnmpV3AuthProtocol] = useState<string>("SHA");
  const [snmpV3AuthKey, setSnmpV3AuthKey] = useState<string>("");
  const [snmpV3PrivProtocol, setSnmpV3PrivProtocol] = useState<string>("AES");
  const [snmpV3PrivKey, setSnmpV3PrivKey] = useState<string>("");
  const [snmpOidList, setSnmpOidList] = useState<string>("1.3.6.1.2.1.1.1.0");
  const [snmpBaseOid, setSnmpBaseOid] = useState<string>("1.3.6.1.2.1");
  const [snmpResults, setSnmpResults] = useState<SnmpVarbind[]>([]);
  const [snmpTraps, setSnmpTraps] = useState<TrapEntry[]>([]);
  const [snmpReceiverStatus, setSnmpReceiverStatus] = useState<string>("Not listening");
  const [snmpReceiverActive, setSnmpReceiverActive] = useState<boolean>(false);
  const [snmpTrapPort, setSnmpTrapPort] = useState<number>(1162);
  const [snmpTrapAddress, setSnmpTrapAddress] = useState<string>("0.0.0.0");
  const [snmpTrapCommunity, setSnmpTrapCommunity] = useState<string>("public");
  const [snmpActionStatus, setSnmpActionStatus] = useState<string>("");
  const [consolePortPath, setConsolePortPath] = useState<string>("");
  const [consoleBaudRate, setConsoleBaudRate] = useState<number>(115200);
  const [consoleParity, setConsoleParity] = useState<"none" | "even" | "odd">("none");
  const [consoleConnected, setConsoleConnected] = useState<boolean>(false);
  const [consoleLog, setConsoleLog] = useState<string>("");
  const [consoleInput, setConsoleInput] = useState<string>("");
  const [consoleAutoScroll, setConsoleAutoScroll] = useState<boolean>(true);
  const [consoleLocalEcho, setConsoleLocalEcho] = useState<boolean>(false);
  const [consoleTimestamp, setConsoleTimestamp] = useState<boolean>(false);
  const [consoleStripAnsi, setConsoleStripAnsi] = useState<boolean>(true);
  const [consoleCrLf, setConsoleCrLf] = useState<boolean>(true);
  const [consoleFontSize, setConsoleFontSize] = useState<number>(12);
  const consoleOutputRef = useRef<HTMLDivElement | null>(null);
  const [snmpTrapTargetHost, setSnmpTrapTargetHost] = useState<string>("127.0.0.1");
  const [snmpTrapTargetPort, setSnmpTrapTargetPort] = useState<number>(162);
  const [snmpTrapOid, setSnmpTrapOid] = useState<string>("1.3.6.1.6.3.1.1.5.1");
  const [snmpTrapMessage, setSnmpTrapMessage] = useState<string>("FieldLink test trap");
  const [snmpTrapSendStatus, setSnmpTrapSendStatus] = useState<string>("");
  const [snmpCounterIfIndex, setSnmpCounterIfIndex] = useState<string>("1");
  const [snmpCounterInterval, setSnmpCounterInterval] = useState<number>(10000);
  const [snmpCounterThreshold, setSnmpCounterThreshold] = useState<number>(1);
  const [snmpCounterActive, setSnmpCounterActive] = useState<boolean>(false);
  const [snmpCounterLogs, setSnmpCounterLogs] = useState<SnmpCounterLog[]>([]);
  const [snmpCounterStatus, setSnmpCounterStatus] = useState<string>("");
  const snmpCounterLastRef = useRef<
    | {
        inErrors: number;
        outErrors: number;
        inDiscards: number;
        outDiscards: number;
        inOctets: number;
        outOctets: number;
      }
    | null
  >(null);

  const refreshPorts = async () => {
    if (!hasBridge || !window.fieldlink?.serial) {
      setStatus("Web mode: desktop bridge not available.");
      return;
    }
    try {
      const list = await window.fieldlink.serial.listPorts();
      setPorts(list);
      if (!selectedPort && list.length > 0) {
        setSelectedPort(list[0].path);
      }
    } catch (err) {
      setStatus(`Failed to list ports: ${String(err)}`);
    }
  };

  const openSerial = async () => {
    if (!hasBridge || !window.fieldlink?.serial) {
      setStatus("Web mode: serial bridge not available.");
      return;
    }
    if (!selectedPort) return;
    try {
      setStatus("Opening serial...");
      await window.fieldlink.serial.open({ path: selectedPort, baudRate, parity });
      setSerialOpen(true);
      setStatus("Serial connected");
    } catch (err) {
      setStatus(`Serial open failed: ${String(err)}`);
    }
  };

  const closeSerial = async () => {
    if (!hasBridge || !window.fieldlink?.serial) {
      setStatus("Web mode: serial bridge not available.");
      return;
    }
    await window.fieldlink.serial.close();
    setSerialOpen(false);
    setStatus("Serial disconnected");
  };

  const runModbusRead = async (
    functionType: Exclude<ModbusFunction, "write">,
    start: number,
    count: number,
    address = modbusAddress
  ) => {
    if (!hasBridge || !window.fieldlink?.modbus) {
      throw new Error("Modbus bridge not available");
    }
    if (functionType === "holding") {
      return window.fieldlink.modbus.readHolding({ address, start, count });
    }
    return window.fieldlink.modbus.readInput({ address, start, count });
  };

  const openConsole = async () => {
    if (!consolePortPath) {
      setStatus("Select a console port first.");
      return;
    }
    try {
      await window.fieldlink.serial.consoleOpen({
        path: consolePortPath,
        baudRate: consoleBaudRate,
        parity: consoleParity,
      });
      setConsoleConnected(true);
    } catch (err) {
      setStatus(`Console open failed: ${String(err)}`);
      setConsoleConnected(false);
    }
  };

  const closeConsole = async () => {
    try {
      await window.fieldlink.serial.consoleClose();
    } finally {
      setConsoleConnected(false);
    }
  };

  const sendConsoleInput = async () => {
    if (!consoleInput) return;
    const payload = consoleInput + (consoleCrLf ? "\r\n" : "\n");
    try {
      await window.fieldlink.serial.consoleWrite({ data: payload });
      if (consoleLocalEcho) {
        const stamp = consoleTimestamp ? `${formatTimestamp(new Date())} ` : "";
        setConsoleLog((log) => (log + stamp + consoleInput + (consoleCrLf ? "\r\n" : "\n")).slice(-20000));
      }
      setConsoleInput("");
    } catch (err) {
      setStatus(`Console write failed: ${String(err)}`);
    }
  };

  const handleModbusAction = async () => {
    try {
      setModbusResponse("Working...");
      if (modbusFunction === "write") {
        const values = writeValues
          .split(/[,\s]+/)
          .map((value) => Number(value))
          .filter((value) => !Number.isNaN(value));
        const result = await window.fieldlink.modbus.writeMultiple({
          address: modbusAddress,
          start: registerStart,
          values,
        });
        setModbusResponse(`Wrote ${result.written} registers starting at ${registerStart}.`);
        return;
      }

      const result = await runModbusRead(modbusFunction, registerStart, registerCount);
      setModbusResponse(`Read ${result.values.length} registers: ${result.values.join(", ")}`);
    } catch (err) {
      setModbusResponse(`Modbus error: ${String(err)}`);
    }
  };

  const handleAddPoll = (startOverride?: number) => {
    const id = crypto.randomUUID();
    const nextStart = startOverride ?? pollStart;
    setPollItems((items) => [
      ...items,
      {
        id,
        name: `Reg ${nextStart}`,
        functionType: pollFunction,
        address: pollSlaveId,
        start: nextStart,
        count: pollCount,
        intervalMs: pollInterval,
        enabled: true,
      },
    ]);
    setPollName(`Reg ${nextStart}`);
  };

  const handleAddNextPoll = () => {
    const nextStart = pollStart + pollCount;
    handleAddPoll(nextStart);
    setPollStart(nextStart);
    setPollName(`Reg ${nextStart}`);
  };

  const handleTogglePoll = (id: string) => {
    setPollItems((items) =>
      items.map((item) => (item.id === id ? { ...item, enabled: !item.enabled } : item))
    );
  };

  const handleRemovePoll = (id: string) => {
    setPollItems((items) => items.filter((item) => item.id !== id));
  };

  const parseCsv = (content: string) => {
    const rows: string[][] = [];
    let current = "";
    let row: string[] = [];
    let inQuotes = false;

    const pushField = () => {
      row.push(current);
      current = "";
    };

    for (let i = 0; i < content.length; i += 1) {
      const char = content[i];
      const next = content[i + 1];
      if (char === '"') {
        if (inQuotes && next === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }
      if (!inQuotes && char === ",") {
        pushField();
        continue;
      }
      if (!inQuotes && (char === "\n" || char === "\r")) {
        if (char === "\r" && next === "\n") {
          i += 1;
        }
        pushField();
        rows.push(row);
        row = [];
        continue;
      }
      current += char;
    }
    pushField();
    if (row.some((cell) => cell.trim() !== "")) {
      rows.push(row);
    }
    return rows;
  };

  const handleRegisterMapUpload = async (file: File | null) => {
    if (!file) return;
    try {
      const text = await file.text();
      const rows = parseCsv(text).filter((r) => r.some((cell) => cell.trim() !== ""));
      if (!rows.length) {
        setRegisterMapStatus("CSV was empty.");
        return;
      }
      const header = rows[0].map((h) => h.trim().toLowerCase());
      const indexOf = (names: string[]) => names.map((n) => header.indexOf(n)).find((i) => i >= 0) ?? -1;
      const nameIdx = indexOf(["name", "register name", "label"]);
      const regIdx = indexOf(["register", "reg", "address", "start"]);
      const scaleIdx = indexOf(["scale", "multiplier", "factor"]);
      const unitIdx = indexOf(["unit", "units"]);
      const notesIdx = indexOf(["notes", "description", "desc"]);

      if (regIdx === -1) {
        setRegisterMapStatus("CSV must include a register column (register/reg/address/start).");
        return;
      }

      const entries: RegisterMapEntry[] = rows
        .slice(1)
        .map((row) => {
          const register = Number(row[regIdx] ?? 0);
          const scaleRaw = scaleIdx >= 0 ? row[scaleIdx] : "";
          const scaleValue = scaleRaw ? Number(scaleRaw) : undefined;
          return {
            name: nameIdx >= 0 && row[nameIdx] ? row[nameIdx].trim() : `Reg ${register}`,
            register,
            scale: Number.isFinite(scaleValue ?? NaN) ? scaleValue : undefined,
            unit: unitIdx >= 0 && row[unitIdx] ? row[unitIdx].trim() : undefined,
            notes: notesIdx >= 0 && row[notesIdx] ? row[notesIdx].trim() : undefined,
          };
        })
        .filter((entry) => Number.isFinite(entry.register));

      setRegisterMap(entries);
      setRegisterMapStatus(`Loaded ${entries.length} register mappings.`);
    } catch (err) {
      setRegisterMapStatus(`CSV error: ${String(err)}`);
    }
  };

  const findRegisterMap = (register: number) => registerMap.find((entry) => entry.register === register);

  const addDiscoveryDevice = (device: Omit<DiscoveryDevice, "id" | "lastSeen">) => {
    const entry: DiscoveryDevice = {
      ...device,
      id: crypto.randomUUID(),
      lastSeen: formatTimestamp(new Date()),
    };
    setDiscoveryDevices((devices) => [entry, ...devices]);
  };

  const handleModbusDiscovery = async () => {
    setDiscoveryStatus("Scanning Modbus IDs...");
    const start = Math.max(1, Math.min(modbusScanStart, modbusScanEnd));
    const end = Math.max(start, modbusScanEnd);
    let found = 0;
    for (let id = start; id <= end; id += 1) {
      try {
        const result = await runModbusRead(modbusScanFunction, modbusScanRegister, modbusScanCount, id);
        addDiscoveryDevice({
          source: "modbus",
          address: `ID ${id}`,
          name: `Modbus Device ${id}`,
          detail: `Read ${result.values.length} regs @ ${modbusScanRegister}`,
        });
        found += 1;
      } catch (err) {
        // ignore
      }
    }
    setDiscoveryStatus(`Modbus scan complete. Found ${found} device(s).`);
  };

  const handleSnmpDiscovery = async () => {
    const hosts = snmpDiscoveryHosts
      .split(/[\s,]+/)
      .map((h) => h.trim())
      .filter(Boolean);
    if (!hosts.length) {
      setDiscoveryStatus("Enter at least one SNMP host IP.");
      return;
    }
    setDiscoveryStatus("Scanning SNMP hosts...");
    let found = 0;
    for (const host of hosts) {
      try {
        const result = await window.fieldlink.snmp.get({
          host,
          port: snmpPort,
          version: snmpVersion,
          community: snmpCommunity,
          v3: {
            user: snmpV3User,
            authProtocol: snmpV3AuthProtocol,
            authKey: snmpV3AuthKey,
            privProtocol: snmpV3PrivProtocol,
            privKey: snmpV3PrivKey,
          },
          oids: ["1.3.6.1.2.1.1.1.0"],
        });
        const descr = result.varbinds?.[0]?.value ? String(result.varbinds[0].value) : "SNMP device";
        addDiscoveryDevice({
          source: "snmp",
          address: host,
          name: descr,
          detail: "sysDescr.0",
        });
        found += 1;
      } catch (err) {
        // ignore
      }
    }
    setDiscoveryStatus(`SNMP scan complete. Found ${found} device(s).`);
  };

  const handleBacnetDiscovery = async () => {
    setDiscoveryStatus("BACnet MS/TP discovery placeholder (not yet implemented).");
  };

  const handleDiscoveryAll = async () => {
    await handleModbusDiscovery();
    await handleSnmpDiscovery();
    await handleBacnetDiscovery();
  };

  const exportCsv = () => {
    if (pollLogs.length === 0) {
      setStatus("No polling data to export.");
      return;
    }

    const header = [
      "timestamp",
      "name",
      "function",
      "start",
      "count",
      "values",
      "error",
    ];

    const rows = pollLogs.map((log) => [
      toCsvValue(log.timestamp),
      toCsvValue(log.name),
      toCsvValue(log.functionType),
      log.start.toString(),
      log.count.toString(),
      toCsvValue(log.values ? log.values.join("|") : ""),
      toCsvValue(log.error ?? ""),
    ]);

    const csv = [header.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `fieldlink-polling-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setStatus("CSV exported.");
  };

  const formatTrapValue = (value: unknown) => {
    if (value === null || value === undefined) return "";

    if (value instanceof Uint8Array) {
      return String.fromCharCode(...value);
    }

    if (Array.isArray(value) && value.every((v) => typeof v === "number")) {
      return String.fromCharCode(...value);
    }

    return String(value);
  };

  const exportTrapCsv = () => {
    if (snmpTraps.length === 0) {
      setSnmpActionStatus("No trap data to export.");
      return;
    }

    const header = ["receivedAt", "oid", "value"];
    const rows = snmpTraps.flatMap((trap) =>
      trap.varbinds.map((vb) => [
        toCsvValue(trap.receivedAt),
        toCsvValue(vb.oid),
        toCsvValue(formatTrapValue(vb.value)),
      ])
    );

    const csv = [header.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `fieldlink-snmp-traps-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setSnmpActionStatus("Trap CSV exported.");
  };

  const handleSnmpConfigure = async () => {
    if (!hasBridge || !window.fieldlink?.snmp) {
      setSnmpReceiverStatus("Web mode: SNMP bridge not available.");
      return;
    }
    try {
      const result = await window.fieldlink.snmp.configure({
        receiver: { port: snmpTrapPort, address: snmpTrapAddress, community: snmpTrapCommunity },
      });
      setSnmpReceiverStatus(`Listening on ${result.address}:${result.port}`);
      setSnmpReceiverActive(true);
    } catch (err) {
      setSnmpReceiverStatus(`Receiver error: ${String(err)}`);
      setSnmpReceiverActive(false);
    }
  };

  const handleSnmpStopReceiver = async () => {
    if (!hasBridge || !window.fieldlink?.snmp) {
      setSnmpReceiverStatus("Web mode: SNMP bridge not available.");
      return;
    }
    try {
      await window.fieldlink.snmp.stopReceiver();
      setSnmpReceiverStatus("Not listening");
      setSnmpReceiverActive(false);
    } catch (err) {
      setSnmpReceiverStatus(`Receiver error: ${String(err)}`);
    }
  };

  const handleSnmpGet = async () => {
    if (!hasBridge || !window.fieldlink?.snmp) {
      setSnmpActionStatus("Web mode: SNMP bridge not available.");
      return;
    }
    try {
      setSnmpActionStatus("Running GET...");
      const oids = snmpOidList
        .split(/[,\s]+/)
        .map((oid) => oid.trim())
        .filter(Boolean);
      const result = await window.fieldlink.snmp.get({
        host: snmpHost,
        port: snmpPort,
        version: snmpVersion,
        community: snmpCommunity,
        v3: {
          user: snmpV3User,
          authProtocol: snmpV3AuthProtocol,
          authKey: snmpV3AuthKey,
          privProtocol: snmpV3PrivProtocol,
          privKey: snmpV3PrivKey,
        },
        oids,
      });
      setSnmpResults(result.varbinds || []);
      setSnmpActionStatus("GET complete.");
    } catch (err) {
      setSnmpActionStatus(`GET error: ${String(err)}`);
    }
  };

  const handleSnmpWalk = async () => {
    if (!hasBridge || !window.fieldlink?.snmp) {
      setSnmpActionStatus("Web mode: SNMP bridge not available.");
      return;
    }
    try {
      setSnmpActionStatus("Running WALK...");
      const result = await window.fieldlink.snmp.walk({
        host: snmpHost,
        port: snmpPort,
        version: snmpVersion,
        community: snmpCommunity,
        v3: {
          user: snmpV3User,
          authProtocol: snmpV3AuthProtocol,
          authKey: snmpV3AuthKey,
          privProtocol: snmpV3PrivProtocol,
          privKey: snmpV3PrivKey,
        },
        baseOid: snmpBaseOid,
      });
      setSnmpResults(result.varbinds || []);
      setSnmpActionStatus("WALK complete.");
    } catch (err) {
      setSnmpActionStatus(`WALK error: ${String(err)}`);
    }
  };


  const handleSnmpSendTrap = async () => {
    if (!hasBridge || !window.fieldlink?.snmp) {
      setSnmpTrapSendStatus("Web mode: SNMP bridge not available.");
      return;
    }
    try {
      setSnmpTrapSendStatus("Sending trap...");
      const result = await window.fieldlink.snmp.sendTrap({
        host: snmpTrapTargetHost,
        port: snmpTrapTargetPort,
        version: snmpVersion,
        community: snmpCommunity,
        v3: {
          user: snmpV3User,
          authProtocol: snmpV3AuthProtocol,
          authKey: snmpV3AuthKey,
          privProtocol: snmpV3PrivProtocol,
          privKey: snmpV3PrivKey,
        },
        trapOid: snmpTrapOid,
        message: snmpTrapMessage,
      });
      if (result.success) {
        setSnmpTrapSendStatus("Trap sent.");
      } else {
        setSnmpTrapSendStatus(`Trap error: ${result.error || "Unknown error"}`);
      }
    } catch (err) {
      setSnmpTrapSendStatus(`Trap error: ${String(err)}`);
    }
  };

  const handleSnmpCounterPoll = async () => {
    if (!hasBridge || !window.fieldlink?.snmp) {
      setSnmpCounterStatus("Web mode: SNMP bridge not available.");
      return;
    }
    const ifIndex = snmpCounterIfIndex.trim();
    if (!ifIndex) {
      setSnmpCounterStatus("Provide an ifIndex to poll.");
      return;
    }
    try {
      setSnmpCounterStatus("Polling counters...");
      const base = "1.3.6.1.2.1.2.2.1";
      const oids = [
        `${base}.14.${ifIndex}`,
        `${base}.20.${ifIndex}`,
        `${base}.13.${ifIndex}`,
        `${base}.19.${ifIndex}`,
        `${base}.10.${ifIndex}`,
        `${base}.16.${ifIndex}`,
      ];
      const result = await window.fieldlink.snmp.get({
        host: snmpHost,
        port: snmpPort,
        version: snmpVersion,
        community: snmpCommunity,
        v3: {
          user: snmpV3User,
          authProtocol: snmpV3AuthProtocol,
          authKey: snmpV3AuthKey,
          privProtocol: snmpV3PrivProtocol,
          privKey: snmpV3PrivKey,
        },
        oids,
      });
      const map = new Map((result.varbinds || []).map((vb) => [vb.oid, vb.value]));
      const readValue = (oid: string) => {
        const value = Number(map.get(oid) ?? 0);
        return Number.isFinite(value) ? value : 0;
      };
      const values = {
        inErrors: readValue(`${base}.14.${ifIndex}`),
        outErrors: readValue(`${base}.20.${ifIndex}`),
        inDiscards: readValue(`${base}.13.${ifIndex}`),
        outDiscards: readValue(`${base}.19.${ifIndex}`),
        inOctets: readValue(`${base}.10.${ifIndex}`),
        outOctets: readValue(`${base}.16.${ifIndex}`),
      };
      const last = snmpCounterLastRef.current;
      let alert: string | undefined;
      if (last) {
        const deltaErrors = (values.inErrors - last.inErrors) + (values.outErrors - last.outErrors);
        const deltaDiscards = (values.inDiscards - last.inDiscards) + (values.outDiscards - last.outDiscards);
        if (deltaErrors >= snmpCounterThreshold || deltaDiscards >= snmpCounterThreshold) {
          alert = `Errors/discards increased (errors +${deltaErrors}, discards +${deltaDiscards})`;
        }
      }
      snmpCounterLastRef.current = values;
      const entry: SnmpCounterLog = {
        id: crypto.randomUUID(),
        timestamp: formatTimestamp(new Date()),
        ifIndex,
        ...values,
        alert,
      };
      setSnmpCounterLogs((logs) => [entry, ...logs].slice(0, 200));
      setSnmpCounterStatus(alert ?? "Counter poll updated.");
    } catch (err) {
      setSnmpCounterStatus(`Counter poll error: ${String(err)}`);
    }
  };

  const exportSnmpResults = () => {
    if (!snmpResults.length) {
      setSnmpActionStatus("No SNMP results to export.");
      return;
    }
    const header = ["oid", "value"];
    const rows = snmpResults.map((vb) => [toCsvValue(vb.oid), toCsvValue(vb.value ? String(vb.value) : "")]);
    const csv = [header.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `fieldlink-snmp-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setSnmpActionStatus("SNMP CSV exported.");
  };

  const sortedLogs = useMemo(() => [...pollLogs].slice(0, 200), [pollLogs]);

  useEffect(() => {
    refreshPorts();
  }, []);
  useEffect(() => {
    if (!hasBridge || !window.fieldlink?.serial) return;
    window.fieldlink.serial.onConsoleData((payload) => {
      let normalized = payload.data.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
      if (consoleStripAnsi) {
        normalized = normalized
          .replace(/\x1b\[[0-9;?]*[A-Za-z]/g, "")
          .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
      }
      const stamp = consoleTimestamp ? `${formatTimestamp(new Date())} ` : "";
      const text = consoleTimestamp
        ? normalized
            .split(/\n/)
            .map((line, idx, arr) => (line || idx < arr.length - 1 ? stamp + line : ""))
            .join("\n")
        : normalized;
      setConsoleLog((log) => (log + text).slice(-20000));
    });
  }, [consoleTimestamp, consoleStripAnsi]);


  useEffect(() => {
    setPollName(`Reg ${pollStart}`);
  }, [pollStart]);

  useEffect(() => {
    if (!hasBridge || !window.fieldlink?.snmp) return;
    window.fieldlink.snmp.onTrap((payload) => {
      setSnmpTraps((traps) => [
        {
          id: crypto.randomUUID(),
          receivedAt: payload.receivedAt,
          varbinds: payload.varbinds || [],
        },
        ...traps,
      ]);
    });
  }, []);
  useEffect(() => {
    snmpCounterLastRef.current = null;
  }, [snmpCounterIfIndex]);

  useEffect(() => {
    if (!consoleAutoScroll) return;
    const el = consoleOutputRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [consoleLog, consoleAutoScroll]);

  useEffect(() => {
    if (!snmpCounterActive) return;
    handleSnmpCounterPoll();
    const timer = setInterval(handleSnmpCounterPoll, snmpCounterInterval);
    return () => clearInterval(timer);
  }, [
    snmpCounterActive,
    snmpCounterInterval,
    snmpCounterIfIndex,
    snmpCounterThreshold,
    snmpHost,
    snmpPort,
    snmpVersion,
    snmpCommunity,
    snmpV3User,
    snmpV3AuthProtocol,
    snmpV3AuthKey,
    snmpV3PrivProtocol,
    snmpV3PrivKey,
  ]);


  useEffect(() => {
    const timers = pollItems
      .filter((item) => item.enabled)
      .map((item) =>
        setInterval(async () => {
          try {
            const result = await runModbusRead(item.functionType, item.start, item.count, item.address);
            const timestamp = formatTimestamp(new Date());
            setPollItems((items) =>
              items.map((existing) =>
                existing.id === item.id
                  ? {
                      ...existing,
                      lastValues: result.values,
                      lastUpdated: timestamp,
                      error: undefined,
                    }
                  : existing
              )
            );
            setPollLogs((logs) => [
              {
                id: crypto.randomUUID(),
                timestamp,
                name: item.name,
                functionType: item.functionType,
                start: item.start,
                count: item.count,
                values: result.values,
              },
              ...logs,
            ]);
          } catch (err) {
            const timestamp = formatTimestamp(new Date());
            setPollItems((items) =>
              items.map((existing) =>
                existing.id === item.id
                  ? { ...existing, lastUpdated: timestamp, error: String(err) }
                  : existing
              )
            );
            setPollLogs((logs) => [
              {
                id: crypto.randomUUID(),
                timestamp,
                name: item.name,
                functionType: item.functionType,
                start: item.start,
                count: item.count,
                error: String(err),
              },
              ...logs,
            ]);
          }
        }, item.intervalMs)
      );

    return () => timers.forEach((timer) => clearInterval(timer));
  }, [pollItems]);

  return (
    <div className="app">
      <aside className="sidebar">
        <h1>FieldLink</h1>
        <nav>
          <button className={activePage === "connections" ? "active" : ""} onClick={() => setActivePage("connections")}>
            Connections
          </button>
          <button className={activePage === "discovery" ? "active" : ""} onClick={() => setActivePage("discovery")}>
            Discovery
          </button>
          <button className={activePage === "polling" ? "active" : ""} onClick={() => setActivePage("polling")}>
            Polling
          </button>
          <button className={activePage === "console" ? "active" : ""} onClick={() => setActivePage("console")}>
            Console
          </button>
          <button className={activePage === "snmp" ? "active" : ""} onClick={() => setActivePage("snmp")}>
            SNMP
          </button>
          <button className={activePage === "logs" ? "active" : ""} onClick={() => setActivePage("logs")}>
            Logs
          </button>
        </nav>
      </aside>
      <main className="main">
        <header className="page-header">
          <div>
            <h2>{activePage.charAt(0).toUpperCase() + activePage.slice(1)}</h2>
            <p>
              {activePage === "connections" && "Connect to your FieldLink device or any RS-485/RS-232 adapter."}
              {activePage === "discovery" && "Scan the bus and identify devices (Phase 2)."}
              {activePage === "polling" && "Build repeatable polling sets and export results."}
              {activePage === "console" && "Open a serial console session."}
              {activePage === "snmp" && "Query devices with SNMP and listen for traps."}
              {activePage === "logs" && "Review recent polling and Modbus activity."}
            </p>
          </div>
          {activePage === "connections" && (
            <button className="primary" onClick={refreshPorts}>
              Refresh Ports
            </button>
          )}
          {activePage === "polling" && (
            <button className="primary" onClick={exportCsv}>
              Export CSV
            </button>
          )}
          {activePage === "snmp" && (
            <button className="primary" onClick={exportSnmpResults}>
              Export Results CSV
            </button>
          )}
        </header>

        {activePage === "connections" && (
          <section className="grid">
            <div className="card">
              <h3>Serial Port</h3>
              <label className="field">
                Port
                <select value={selectedPort} onChange={(e) => setSelectedPort(e.target.value)}>
                  {ports.length === 0 && <option>No serial devices found</option>}
                  {ports.map((port) => (
                    <option key={port.path} value={port.path}>
                      {port.friendlyName} ({port.path})
                    </option>
                  ))}
                </select>
              </label>
              <div className="field-row">
                <label className="field">
                  Baud
                  <select value={baudRate} onChange={(e) => setBaudRate(Number(e.target.value))}>
                    {baudRates.map((rate) => (
                      <option key={rate} value={rate}>
                        {rate}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  Parity
                  <select value={parity} onChange={(e) => setParity(e.target.value as typeof parity)}>
                    <option value="none">None</option>
                    <option value="even">Even</option>
                    <option value="odd">Odd</option>
                  </select>
                </label>
              </div>
              {serialOpen ? (
                <button className="ghost" onClick={closeSerial}>
                  Close Serial
                </button>
              ) : (
                <button className="secondary" onClick={openSerial}>
                  Open Serial
                </button>
              )}
            </div>

            <div className="card">
              <h3>Modbus RTU</h3>
              <label className="field">
                Slave Address
                <input
                  type="number"
                  min={1}
                  max={247}
                  value={modbusAddress}
                  onChange={(e) => setModbusAddress(Number(e.target.value))}
                />
              </label>
              <label className="field">
                Function
                <select value={modbusFunction} onChange={(e) => setModbusFunction(e.target.value as ModbusFunction)}>
                  <option value="holding">Read Holding Registers</option>
                  <option value="input">Read Input Registers</option>
                  <option value="write">Write Multiple Registers</option>
                </select>
              </label>
              <div className="field-row">
                <label className="field">
                  Start Register
                  <input
                    type="number"
                    min={0}
                    value={registerStart}
                    onChange={(e) => setRegisterStart(Number(e.target.value))}
                  />
                </label>
                <label className="field">
                  Count
                  <input
                    type="number"
                    min={1}
                    value={registerCount}
                    onChange={(e) => setRegisterCount(Number(e.target.value))}
                    disabled={modbusFunction === "write"}
                  />
                </label>
              </div>
              {modbusFunction === "write" && (
                <label className="field">
                  Values (comma-separated)
                  <input value={writeValues} onChange={(e) => setWriteValues(e.target.value)} />
                </label>
              )}
              <div className="card-actions">
                <button className="secondary" onClick={handleModbusAction}>
                  Run
                </button>
                <button className="ghost" onClick={() => setModbusResponse("")}>Clear</button>
              </div>
              {modbusResponse && <p className="helper-text">{modbusResponse}</p>}
            </div>

            <div className="card">
              <h3>BACnet MS/TP</h3>
              <label className="field">
                Local MAC
                <input type="number" min={0} max={127} value={mstpMac} onChange={(e) => setMstpMac(Number(e.target.value))} />
              </label>
              <div className="card-actions">
                <button className="secondary">Connect MS/TP</button>
                <button className="ghost">Who-Is</button>
              </div>
            </div>

            <div className="card">
              <h3>Status</h3>
              <ul className="status-list">
                <li>Serial: {serialOpen ? "Connected" : "Disconnected"}</li>
                <li>Modbus RTU: {modbusResponse ? "Active" : "Idle"}</li>
                <li>BACnet MS/TP: Idle</li>
                <li>USB-Ethernet: Not detected</li>
                <li>{status}</li>
              </ul>
            </div>
          </section>
        )}

        {activePage === "discovery" && (
          <section className="grid">
            <div className="card">
              <h3>Modbus RTU Discovery</h3>
              <p className="helper-text">Scan slave IDs and probe registers to detect devices.</p>
              <div className="field-row">
                <label className="field">
                  Start ID
                  <input
                    type="number"
                    min={1}
                    max={247}
                    value={modbusScanStart}
                    onChange={(e) => setModbusScanStart(Number(e.target.value))}
                  />
                </label>
                <label className="field">
                  End ID
                  <input
                    type="number"
                    min={1}
                    max={247}
                    value={modbusScanEnd}
                    onChange={(e) => setModbusScanEnd(Number(e.target.value))}
                  />
                </label>
              </div>
              <div className="field-row">
                <label className="field">
                  Function
                  <select value={modbusScanFunction} onChange={(e) => setModbusScanFunction(e.target.value as Exclude<ModbusFunction, "write">)}>
                    <option value="holding">Holding</option>
                    <option value="input">Input</option>
                  </select>
                </label>
                <label className="field">
                  Register
                  <input
                    type="number"
                    min={0}
                    value={modbusScanRegister}
                    onChange={(e) => setModbusScanRegister(Number(e.target.value))}
                  />
                </label>
                <label className="field">
                  Count
                  <input
                    type="number"
                    min={1}
                    value={modbusScanCount}
                    onChange={(e) => setModbusScanCount(Number(e.target.value))}
                  />
                </label>
              </div>
              <div className="card-actions">
                <button className="secondary" onClick={handleModbusDiscovery}>Scan Modbus</button>
              </div>
            </div>

            <div className="card">
              <h3>SNMP Discovery</h3>
              <p className="helper-text">Enter host IPs or names separated by commas/spaces.</p>
              <label className="field">
                Hosts
                <input
                  value={snmpDiscoveryHosts}
                  onChange={(e) => setSnmpDiscoveryHosts(e.target.value)}
                  placeholder="192.168.1.10, 192.168.1.11"
                />
              </label>
              <div className="card-actions">
                <button className="secondary" onClick={handleSnmpDiscovery}>Scan SNMP</button>
              </div>
            </div>

            <div className="card">
              <h3>BACnet MS/TP Discovery</h3>
              <p className="helper-text">BACnet MS/TP discovery will be wired in next.</p>
              <div className="card-actions">
                <button className="ghost" onClick={handleBacnetDiscovery}>Scan BACnet</button>
              </div>
            </div>

            <div className="card">
              <h3>Discovery Results</h3>
              <div className="card-actions">
                <button className="ghost" onClick={handleDiscoveryAll}>Scan All</button>
                <button className="ghost" onClick={() => setDiscoveryDevices([])}>Clear</button>
              </div>
              {discoveryStatus && <p className="helper-text">{discoveryStatus}</p>}
              {discoveryDevices.length === 0 ? (
                <p className="helper-text">No devices found yet.</p>
              ) : (
                <div className="device-grid">
                  {discoveryDevices.map((device) => (
                    <div key={device.id} className="device-card">
                      <strong>{device.name}</strong>
                      <div className="helper-text">Source: {device.source}</div>
                      <div className="helper-text">Address: {device.address}</div>
                      {device.detail && <div className="helper-text">{device.detail}</div>}
                      <div className="helper-text">Last seen: {device.lastSeen}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {activePage === "polling" && (
          <section className="grid">
            <div className="card">
              <h3>New Poll</h3>
              <label className="field">
                Name
                <input value={pollName} onChange={(e) => setPollName(e.target.value)} />
              </label>
              <label className="field">
                Function
                <select value={pollFunction} onChange={(e) => setPollFunction(e.target.value as Exclude<ModbusFunction, "write">)}>
                  <option value="holding">Holding Registers</option>
                  <option value="input">Input Registers</option>
                </select>
              </label>
              <div className="field-row">
                <label className="field">
                  Slave ID
                  <input type="number" min={1} max={247} value={pollSlaveId} onChange={(e) => setPollSlaveId(Number(e.target.value))} />
                </label>
                <label className="field">
                  Start
                  <input type="number" min={0} value={pollStart} onChange={(e) => setPollStart(Number(e.target.value))} />
                </label>
              </div>
              <div className="field-row">
                <label className="field">
                  Count
                  <input type="number" min={1} value={pollCount} onChange={(e) => setPollCount(Number(e.target.value))} />
                </label>
                <label className="field">
                  Interval (ms)
                  <input type="number" min={250} value={pollInterval} onChange={(e) => setPollInterval(Number(e.target.value))} />
                </label>
              </div>
              <div className="card-actions">
                <button className="secondary" onClick={() => handleAddPoll()}>
                  Add Poll
                </button>
                <button className="ghost" onClick={handleAddNextPoll}>
                  Add Next
                </button>
              </div>
            </div>

            <div className="card">
              <h3>Active Polls</h3>
              {pollItems.length === 0 && <p className="helper-text">No polls yet. Add one to get started.</p>}
              <ul className="poll-list">
                {pollItems.map((item) => (
                  <li key={item.id}>
                    <div>
                      <strong>{item.name}</strong>
                      <div className="helper-text">
                        {item.functionType} @ {item.start} ({item.count}) every {item.intervalMs}ms · ID {item.address}
                      </div>
                      <div className="helper-text">
                        {item.lastUpdated
                          ? `Last: ${item.lastUpdated} ${item.lastValues ? `→ ${item.lastValues.join(", ")}` : ""}`
                          : "Waiting for first poll..."}
                      </div>
                      {item.error && <div className="error-text">{item.error}</div>}
                    </div>
                    <div className="poll-actions">
                      <button className="ghost" onClick={() => handleTogglePoll(item.id)}>
                        {item.enabled ? "Pause" : "Resume"}
                      </button>
                      <button className="ghost" onClick={() => handleRemovePoll(item.id)}>
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="card">
              <h3>Register Map (CSV)</h3>
              <p className="helper-text">Upload a CSV with columns like: name, register, scale, unit, notes.</p>
              <label className="field">
                CSV File
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => handleRegisterMapUpload(e.target.files?.[0] ?? null)}
                />
              </label>
              {registerMapStatus && <p className="helper-text">{registerMapStatus}</p>}
              {registerMap.length > 0 && (
                <p className="helper-text">Loaded {registerMap.length} register entries.</p>
              )}
            </div>

            <div className="card">
              <h3>Latest Values</h3>
              {pollItems.length === 0 ? (
                <p className="helper-text">No polls yet.</p>
              ) : (
                <table className="log-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Mapped</th>
                      <th>Function</th>
                      <th>Slave</th>
                      <th>Start</th>
                      <th>Count</th>
                      <th>Latest</th>
                      <th>Scaled</th>
                      <th>Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pollItems.map((item) => {
                      const mapEntry = item.count === 1 ? findRegisterMap(item.start) : undefined;
                      const rawValue = item.lastValues?.[0];
                      const scaledValue =
                        mapEntry && rawValue !== undefined
                          ? mapEntry.scale
                            ? rawValue * mapEntry.scale
                            : rawValue
                          : undefined;
                      return (
                        <tr key={item.id}>
                          <td>{item.name}</td>
                          <td>{mapEntry ? mapEntry.name : "-"}</td>
                          <td>{item.functionType}</td>
                          <td>{item.address}</td>
                          <td>{item.start}</td>
                          <td>{item.count}</td>
                          <td>{item.lastValues ? item.lastValues.join(", ") : "-"}</td>
                          <td>
                            {scaledValue !== undefined
                              ? `${scaledValue}${mapEntry?.unit ? ` ${mapEntry.unit}` : ""}`
                              : "-"}
                          </td>
                          <td>{item.lastUpdated || "-"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        )}

        {activePage === "console" && (
          <section className="grid">
            <div className="card">
              <h3>Serial Console</h3>
              <label className="field">
                Port
                <select value={consolePortPath} onChange={(e) => setConsolePortPath(e.target.value)}>
                  <option value="">Select a port</option>
                  {ports.map((port) => (
                    <option key={port.path} value={port.path}>
                      {port.friendlyName} ({port.path})
                    </option>
                  ))}
                </select>
              </label>
              <div className="field-row">
                <label className="field">
                  Baud Rate
                  <select value={consoleBaudRate} onChange={(e) => setConsoleBaudRate(Number(e.target.value))}>
                    {baudRates.map((rate) => (
                      <option key={rate} value={rate}>
                        {rate}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  Parity
                  <select value={consoleParity} onChange={(e) => setConsoleParity(e.target.value as "none" | "even" | "odd")}>
                    <option value="none">None</option>
                    <option value="even">Even</option>
                    <option value="odd">Odd</option>
                  </select>
                </label>
              </div>
              <div className="card-actions">
                {consoleConnected ? (
                  <button className="secondary" onClick={closeConsole}>Disconnect</button>
                ) : (
                  <button className="secondary" onClick={openConsole}>Connect</button>
                )}
                <button className="ghost" onClick={() => setConsoleLog("")}>Clear Log</button>
              </div>
            </div>

            <div className="card">
              <h3>Console Output</h3>
              <div className="field-row">
                <label className="field" style={{ flex: 1 }}>
                  Send
                  <input
                    value={consoleInput}
                    onChange={(e) => setConsoleInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        sendConsoleInput();
                      }
                    }}
                  />
                </label>
                <button className="secondary" onClick={sendConsoleInput}>
                  Send
                </button>
              </div>
              <div className="console-controls">
                <label className="field">
                  Font size
                  <input
                    type="number"
                    min={10}
                    max={22}
                    value={consoleFontSize}
                    onChange={(e) => setConsoleFontSize(Number(e.target.value))}
                  />
                </label>
                <div className="console-toggles">
                  <label className="inline-toggle">
                    <input
                      type="checkbox"
                      checked={consoleAutoScroll}
                      onChange={(e) => setConsoleAutoScroll(e.target.checked)}
                    />
                    Auto-scroll
                  </label>
                  <label className="inline-toggle">
                    <input
                      type="checkbox"
                      checked={consoleLocalEcho}
                      onChange={(e) => setConsoleLocalEcho(e.target.checked)}
                    />
                    Local echo
                  </label>
                  <label className="inline-toggle">
                    <input
                      type="checkbox"
                      checked={consoleCrLf}
                      onChange={(e) => setConsoleCrLf(e.target.checked)}
                    />
                    CR/LF
                  </label>
                  <label className="inline-toggle">
                    <input
                      type="checkbox"
                      checked={consoleTimestamp}
                      onChange={(e) => setConsoleTimestamp(e.target.checked)}
                    />
                    Timestamps
                  </label>
                  <label className="inline-toggle">
                    <input
                      type="checkbox"
                      checked={consoleStripAnsi}
                      onChange={(e) => setConsoleStripAnsi(e.target.checked)}
                    />
                    Strip ANSI
                  </label>
                </div>
                <div className="console-actions">
                  <button className="ghost" onClick={() => navigator.clipboard.writeText(consoleLog)}>
                    Copy
                  </button>
                  <button className="ghost" onClick={() => setConsoleLog("")}>Clear</button>
                </div>
              </div>
              <div className="console-output" ref={consoleOutputRef} style={{ fontSize: `${consoleFontSize}px` }}>
                <pre>{consoleLog || "No data yet."}</pre>
              </div>
            </div>
          </section>
        )}

        {activePage === "snmp" && (
          <section className="grid">
            <div className="card">
              <h3>SNMP Connection</h3>
              <label className="field">
                Host/IP
                <input value={snmpHost} onChange={(e) => setSnmpHost(e.target.value)} />
              </label>
              <div className="field-row">
                <label className="field">
                  Port
                  <input type="number" min={1} value={snmpPort} onChange={(e) => setSnmpPort(Number(e.target.value))} />
                </label>
                <label className="field">
                  Version
                  <select value={snmpVersion} onChange={(e) => setSnmpVersion(e.target.value as "v1" | "v2c" | "v3")}
                  >
                    <option value="v1">v1</option>
                    <option value="v2c">v2c</option>
                    <option value="v3">v3</option>
                  </select>
                </label>
              </div>
              {snmpVersion !== "v3" ? (
                <label className="field">
                  Community
                  <input value={snmpCommunity} onChange={(e) => setSnmpCommunity(e.target.value)} />
                </label>
              ) : (
                <div className="field-row">
                  <label className="field">
                    User
                    <input value={snmpV3User} onChange={(e) => setSnmpV3User(e.target.value)} />
                  </label>
                  <label className="field">
                    Auth Protocol
                    <select value={snmpV3AuthProtocol} onChange={(e) => setSnmpV3AuthProtocol(e.target.value)}>
                      <option value="SHA">SHA</option>
                      <option value="MD5">MD5</option>
                    </select>
                  </label>
                  <label className="field">
                    Auth Key
                    <input value={snmpV3AuthKey} onChange={(e) => setSnmpV3AuthKey(e.target.value)} />
                  </label>
                  <label className="field">
                    Priv Protocol
                    <select value={snmpV3PrivProtocol} onChange={(e) => setSnmpV3PrivProtocol(e.target.value)}>
                      <option value="AES">AES</option>
                      <option value="DES">DES</option>
                    </select>
                  </label>
                  <label className="field">
                    Priv Key
                    <input value={snmpV3PrivKey} onChange={(e) => setSnmpV3PrivKey(e.target.value)} />
                  </label>
                </div>
              )}
              <div className="card-actions">
                <button className="secondary" onClick={handleSnmpGet}>GET</button>
                <button className="ghost" onClick={handleSnmpWalk}>WALK</button>
              </div>
              <label className="field">
                OIDs (comma or space separated)
                <input value={snmpOidList} onChange={(e) => setSnmpOidList(e.target.value)} />
              </label>
              <label className="field">
                Base OID (for walk)
                <input value={snmpBaseOid} onChange={(e) => setSnmpBaseOid(e.target.value)} />
              </label>
              {snmpActionStatus && <p className="helper-text">{snmpActionStatus}</p>}
            </div>

            <div className="card">
              <h3>Interface Counter Polling</h3>
              <p className="helper-text">Poll IF-MIB counters for a single interface. Use ifIndex from IF-MIB::ifName.</p>
              <div className="field-row">
                <label className="field">
                  Interface ifIndex
                  <input value={snmpCounterIfIndex} onChange={(e) => setSnmpCounterIfIndex(e.target.value)} />
                </label>
                <label className="field">
                  Interval (ms)
                  <input
                    type="number"
                    min={1000}
                    value={snmpCounterInterval}
                    onChange={(e) => setSnmpCounterInterval(Number(e.target.value))}
                  />
                </label>
                <label className="field">
                  Error threshold / interval
                  <input
                    type="number"
                    min={1}
                    value={snmpCounterThreshold}
                    onChange={(e) => setSnmpCounterThreshold(Number(e.target.value))}
                  />
                </label>
              </div>
              <div className="card-actions">
                {snmpCounterActive ? (
                  <button className="secondary" onClick={() => setSnmpCounterActive(false)}>Stop Polling</button>
                ) : (
                  <button className="secondary" onClick={() => setSnmpCounterActive(true)}>Start Polling</button>
                )}
                <button className="ghost" onClick={handleSnmpCounterPoll}>Poll Now</button>
              </div>
              {snmpCounterStatus && <p className="helper-text">{snmpCounterStatus}</p>}
              {snmpCounterLogs.length === 0 ? (
                <p className="helper-text">No counter samples yet.</p>
              ) : (
                <table className="log-table">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>ifIndex</th>
                      <th>In Errors</th>
                      <th>Out Errors</th>
                      <th>In Discards</th>
                      <th>Out Discards</th>
                      <th>In Octets</th>
                      <th>Out Octets</th>
                      <th>Alert</th>
                    </tr>
                  </thead>
                  <tbody>
                    {snmpCounterLogs.slice(0, 50).map((log) => (
                      <tr key={log.id}>
                        <td>{log.timestamp}</td>
                        <td>{log.ifIndex}</td>
                        <td>{log.inErrors}</td>
                        <td>{log.outErrors}</td>
                        <td>{log.inDiscards}</td>
                        <td>{log.outDiscards}</td>
                        <td>{log.inOctets}</td>
                        <td>{log.outOctets}</td>
                        <td>{log.alert ?? ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

                        <div className="card">
              <h3>Send Test Trap</h3>
              <p className="helper-text">Send a test SNMP trap to verify listeners.</p>
              <div className="field-row">
                <label className="field">
                  Target Host
                  <input value={snmpTrapTargetHost} onChange={(e) => setSnmpTrapTargetHost(e.target.value)} />
                </label>
                <label className="field">
                  Target Port
                  <input
                    type="number"
                    min={1}
                    value={snmpTrapTargetPort}
                    onChange={(e) => setSnmpTrapTargetPort(Number(e.target.value))}
                  />
                </label>
              </div>
              <label className="field">
                Trap OID
                <input value={snmpTrapOid} onChange={(e) => setSnmpTrapOid(e.target.value)} />
              </label>
              <label className="field">
                Message
                <input value={snmpTrapMessage} onChange={(e) => setSnmpTrapMessage(e.target.value)} />
              </label>
              <div className="card-actions">
                <button className="secondary" onClick={handleSnmpSendTrap}>Send Trap</button>
              </div>
              {snmpTrapSendStatus && <p className="helper-text">{snmpTrapSendStatus}</p>}
            </div>

<div className="card">
              <h3>Trap Receiver</h3>
              <p className="helper-text">Listen on {snmpTrapAddress}:{snmpTrapPort} for v1/v2c/v3 traps. (Port 1162 avoids macOS privileged port restrictions.)</p>
              <div className="field-row">
                <label className="field">
                  Address
                  <input value={snmpTrapAddress} onChange={(e) => setSnmpTrapAddress(e.target.value)} />
                </label>
                <label className="field">
                  Port
                  <input
                    type="number"
                    min={1}
                    value={snmpTrapPort}
                    onChange={(e) => setSnmpTrapPort(Number(e.target.value))}
                  />
                </label>
                <label className="field">
                  Community
                  <input value={snmpTrapCommunity} onChange={(e) => setSnmpTrapCommunity(e.target.value)} />
                </label>
              </div>
              <div className="card-actions">
                {snmpReceiverActive ? (
                  <button className="secondary" onClick={handleSnmpStopReceiver}>Stop Listening</button>
                ) : (
                  <button className="secondary" onClick={handleSnmpConfigure}>Start Listening</button>
                )}
                <button className="ghost" onClick={exportTrapCsv}>Export Trap CSV</button>
              </div>
              <p className="helper-text">{snmpReceiverStatus}</p>
              <div className="trap-log">
                {snmpTraps.length === 0 ? (
                  <p className="helper-text">No traps yet.</p>
                ) : (
                  snmpTraps.slice(0, 50).map((trap) => (
                    <div key={trap.id} className="trap-entry">
                      <strong>{trap.receivedAt}</strong>
                      <ul>
                        {trap.varbinds.map((vb, index) => (
                          <li key={`${trap.id}-${index}`}>
                            {vb.oid}: {formatTrapValue(vb.value)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="card">
              <h3>SNMP Results</h3>
              {snmpResults.length === 0 ? (
                <p className="helper-text">No results yet.</p>
              ) : (
                <table className="log-table">
                  <thead>
                    <tr>
                      <th>OID</th>
                      <th>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {snmpResults.map((vb, index) => (
                      <tr key={`${vb.oid}-${index}`}>
                        <td>{vb.oid}</td>
                        <td>{String(vb.value ?? "")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        )}

        {activePage === "logs" && (
          <section className="grid">
            <div className="card">
              <h3>Polling Logs</h3>
              {sortedLogs.length === 0 ? (
                <p className="helper-text">No polling activity yet.</p>
              ) : (
                <table className="log-table">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Name</th>
                      <th>Function</th>
                      <th>Start</th>
                      <th>Count</th>
                      <th>Values</th>
                      <th>Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedLogs.map((log) => (
                      <tr key={log.id}>
                        <td>{log.timestamp}</td>
                        <td>{log.name}</td>
                        <td>{log.functionType}</td>
                        <td>{log.start}</td>
                        <td>{log.count}</td>
                        <td>{log.values ? log.values.join(", ") : "-"}</td>
                        <td>{log.error ?? ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
