# FieldLink

FieldLink is a cross-platform desktop app (macOS + Windows) plus a Rust core for industrial protocol testing: Modbus RTU, BACnet MS/TP, BACnet/IP, and SNMP.

## Repo Structure
- `core/` Rust library crate (protocol engine stubs)
- `desktop/` Electron + React UI
- `docs/` architecture notes

## Prerequisites
- Node.js 18+
- pnpm 9+

## Desktop Dev
```bash
cd desktop
pnpm install
pnpm dev
```

## Rust Core
The Rust core is a stub library for now and can be expanded once Rust tooling is installed.

## Notes
- USB composite device: CDC-ACM (serial) + USB-Ethernet (RNDIS/ECM)
- macOS and Windows supported via Electron
