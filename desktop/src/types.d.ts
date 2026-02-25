export {};

declare global {
  interface Window {
    fieldlink: {
      version: string;
      serial: {
        listPorts: () => Promise<
          Array<{ path: string; friendlyName: string; serialNumber?: string | null }>
        >;
        open: (options: { path: string; baudRate: number; parity: "none" | "even" | "odd" }) => Promise<{ open: boolean; path?: string }>;
        close: () => Promise<{ open: boolean }>;
      };
      modbus: {
        readHolding: (options: { address: number; start: number; count: number }) => Promise<{ values: number[] }>;
        readInput: (options: { address: number; start: number; count: number }) => Promise<{ values: number[] }>;
        writeMultiple: (options: { address: number; start: number; values: number[] }) => Promise<{ written: number }>;
      };
      snmp: {
        configure: (options: { receiver: { port: number; address: string; community?: string } }) => Promise<{ listening: boolean; port: number; address: string }>;
        get: (options: {
          host: string;
          port: number;
          version: "v1" | "v2c" | "v3";
          community?: string;
          v3?: {
            user: string;
            authProtocol?: string;
            authKey?: string;
            privProtocol?: string;
            privKey?: string;
            engineId?: string;
          };
          oids: string[];
        }) => Promise<{ varbinds: Array<{ oid: string; type?: string; value?: unknown }> }>;
        walk: (options: {
          host: string;
          port: number;
          version: "v1" | "v2c" | "v3";
          community?: string;
          v3?: {
            user: string;
            authProtocol?: string;
            authKey?: string;
            privProtocol?: string;
            privKey?: string;
            engineId?: string;
          };
          baseOid: string;
        }) => Promise<{ varbinds: Array<{ oid: string; type?: string; value?: unknown }> }>;
        stopReceiver: () => Promise<{ listening: boolean }>;
        onTrap: (callback: (payload: { receivedAt: string; raw: unknown; varbinds: Array<{ oid: string; type?: string; value?: unknown }> }) => void) => void;
      };
    };
  }
}
