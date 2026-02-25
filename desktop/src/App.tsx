import { useEffect, useMemo, useState } from "react";

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
  const [activePage, setActivePage] = useState<"connections" | "discovery" | "polling" | "logs">("connections");
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

  const [pollName, setPollName] = useState<string>("Supply Temp");
  const [pollStart, setPollStart] = useState<number>(1);
  const [pollCount, setPollCount] = useState<number>(1);
  const [pollInterval, setPollInterval] = useState<number>(1000);
  const [pollFunction, setPollFunction] = useState<Exclude<ModbusFunction, "write">>("holding");
  const [pollSlaveId, setPollSlaveId] = useState<number>(modbusAddress);
  const [pollItems, setPollItems] = useState<PollingItem[]>([]);
  const [pollLogs, setPollLogs] = useState<PollingLog[]>([]);

  const refreshPorts = async () => {
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
    if (!window.fieldlink.modbus) {
      throw new Error("Modbus bridge not available");
    }
    if (functionType === "holding") {
      return window.fieldlink.modbus.readHolding({ address, start, count });
    }
    return window.fieldlink.modbus.readInput({ address, start, count });
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
    setPollItems((items) => [
      ...items,
      {
        id,
        name: pollName,
        functionType: pollFunction,
        address: pollSlaveId,
        start: startOverride ?? pollStart,
        count: pollCount,
        intervalMs: pollInterval,
        enabled: true,
      },
    ]);
  };

  const handleAddNextPoll = () => {
    const nextStart = pollStart + pollCount;
    handleAddPoll(nextStart);
    setPollStart(nextStart);
  };

  const handleTogglePoll = (id: string) => {
    setPollItems((items) =>
      items.map((item) => (item.id === id ? { ...item, enabled: !item.enabled } : item))
    );
  };

  const handleRemovePoll = (id: string) => {
    setPollItems((items) => items.filter((item) => item.id !== id));
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

  const sortedLogs = useMemo(() => [...pollLogs].slice(0, 200), [pollLogs]);

  useEffect(() => {
    refreshPorts();
  }, []);

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
              <h3>Discovery is next</h3>
              <p>Phase 2 will add device discovery, live bus scans, and device detail cards.</p>
              <button className="secondary" disabled>
                Scan Bus (Phase 2)
              </button>
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
              <h3>Latest Values</h3>
              {pollItems.length === 0 ? (
                <p className="helper-text">No polls yet.</p>
              ) : (
                <table className="log-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Function</th>
                      <th>Slave</th>
                      <th>Start</th>
                      <th>Count</th>
                      <th>Latest</th>
                      <th>Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pollItems.map((item) => (
                      <tr key={item.id}>
                        <td>{item.name}</td>
                        <td>{item.functionType}</td>
                        <td>{item.address}</td>
                        <td>{item.start}</td>
                        <td>{item.count}</td>
                        <td>{item.lastValues ? item.lastValues.join(", ") : "-"}</td>
                        <td>{item.lastUpdated || "-"}</td>
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
