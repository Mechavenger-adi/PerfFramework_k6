/**
 * CLI handler for `convert` command.
 * Converts a conventional k6 script into a framework-compatible script
 * with logExchange calls, request definition objects, and transaction wrappers.
 */
export declare function runConvert(inputPath: string, teamName: string, scriptName: string, options: {
    inPlace?: boolean;
}): Promise<void>;
//# sourceMappingURL=convert.d.ts.map