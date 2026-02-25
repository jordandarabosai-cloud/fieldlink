import { useMemo, useState } from "react";

type SerialPort = {
  id: string;
  label: string;
  path: string;
};

const baudRates = [9600, 19200, 38400, 57600, 115200];

export default function App() {
  const [selectedPort, setSelectedPort] = useState<string>("/dev/tty.usbmodem01");
  const [baudRate, setBaudRate] = useState<number>(115200);
  const [parity, setParity] = useState<"none" | "even" | "odd">("none");
  const [modbusAddress, setModbusAddress] = useState<number>(1);
  const [mstpMac, setMstpMac] = useState<number>(5);

  const ports = useMemo<SerialPort[]>(
    () => [
      { id: "usbmodem01", label: "USB Serial (FieldLink)", path: "/dev/tty.usbmodem01" },
      { id: "usbserial01", label: "USB Serial Adapter", path: "/dev/tty.usbserial-A501" },
    ],
    []
  );

  return (
    <div className="app">
      <aside className="sidebar">
        <h1>FieldLink</h1>
        <nav>
          <button className="active">Connections</button>
          <button>Discovery</button>
          <button>Polling</button>
          <button>Logs</button>
        </nav>
      </aside>
      <main className="main">
        <header className="page-header">
          <div>
            <h2>Connections</h2>
            <p>Connect to your FieldLink device or any RS-485/RS-232 adapter.</p>
          </div>
          <button className="primary">Refresh Ports</button>
        </header>

        <section className="grid">
          <div className="card">
            <h3>Serial Port</h3>
            <label className="field">
              Port
              <select value={selectedPort} onChange={(e) => setSelectedPort(e.target.value)}>
                {ports.map((port) => (
                  <option key={port.id} value={port.path}>
                    {port.label} ({port.path})
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
            <button className="secondary">Open Serial</button>
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
            <div className="card-actions">
              <button className="secondary">Connect Modbus</button>
              <button className="ghost">Test Read</button>
            </div>
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
              <li>Serial: Disconnected</li>
              <li>Modbus RTU: Idle</li>
              <li>BACnet MS/TP: Idle</li>
              <li>USB-Ethernet: Not detected</li>
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}
