class Logger {
  public static info(message?: any, ...optionalParams: any[]): void {
    console.log(message, ...optionalParams);
  }

  public static error(message?: any, ...optionalParams: any[]): void {
    console.error(message, ...optionalParams);
  }
}

export default Logger;
