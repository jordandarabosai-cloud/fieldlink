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
    };
  }
}
