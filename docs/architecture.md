# FieldLink Architecture

## Overview
FieldLink is a split-core system:
- `core/` (Rust): protocol engine + shared types for Modbus RTU, BACnet (MS/TP + IP), and SNMP.
- `desktop/` (Electron + React): cross-platform UI for macOS/Windows.

## Why split-core
- Reuse protocol engine for future iPad app (SwiftUI) via FFI.
- Keep UI iterations fast without rewriting protocol logic.

## USB behavior
Composite USB device:
- CDC-ACM serial: Modbus RTU + BACnet MS/TP
- USB-Ethernet (RNDIS/ECM): BACnet/IP + SNMP

## Desktop app
- Vite + React for the renderer.
- Electron main process for window + system access.

## Future iPad plan
- Use the Rust core via a C-ABI or UniFFI bridge.
- Build SwiftUI UI that mirrors the desktop feature set.
