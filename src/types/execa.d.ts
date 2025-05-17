declare module 'execa' {
  interface ExecaChildProcess<T> extends Promise<T> {
    stdout: string | Buffer;
    stderr: string | Buffer;
    // Additional properties like kill(), etc.
  }

  interface ExecaOptions {
    stdio?: 'pipe' | 'inherit' | 'ignore' | Array<any>;
    [key: string]: any;
  }

  interface ExecaResult {
    stdout: string;
    stderr: string;
    exitCode: number;
  }

  function execa(command: string, args?: string[], options?: ExecaOptions): ExecaChildProcess<ExecaResult>;
  
  export { execa, ExecaChildProcess, ExecaOptions, ExecaResult };
}
