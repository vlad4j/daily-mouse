class Logger {
    public static info(message?: any, ...optionalParams: any[]): void {
        console.log(message, ...optionalParams);
    }
}

export default Logger;
