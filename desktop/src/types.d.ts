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
    };
  }
}
