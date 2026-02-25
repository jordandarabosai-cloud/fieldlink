export default function App() {
  return (
    <div className="app">
      <aside className="sidebar">
        <h1>FieldLink</h1>
        <nav>
          <button>Connections</button>
          <button>Discovery</button>
          <button>Polling</button>
          <button>Logs</button>
        </nav>
      </aside>
      <main className="main">
        <h2>Welcome</h2>
        <p>Protocol dashboard placeholder (Modbus RTU, BACnet, SNMP).</p>
      </main>
    </div>
  );
}
