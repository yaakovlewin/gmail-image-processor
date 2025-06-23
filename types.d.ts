// Type declarations for Pipedream environment modules
declare module "@pipedream/platform" {
  export const axios: any;
}

declare module "fs" {
  export const promises: {
    readFile: (path: string) => Promise<any>;
    writeFile: (path: string, data: any) => Promise<void>;
    unlink: (path: string) => Promise<void>;
    stat: (path: string) => Promise<{ size: number }>;
  };
}

// Global functions available in Pipedream environment
declare function atob(data: string): string;
declare function btoa(data: string): string;