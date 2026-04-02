import path from 'path';
import { ReplayRunner } from '../../core-engine/src/debug/ReplayRunner';

// Parse command line arguments
const [,, scriptPath, recordingLogPath, outHtmlPath] = process.argv;

if (!scriptPath || !recordingLogPath) {
    console.error('Usage: npx tsx run-debug.ts <path-to-k6-script> <path-to-recording-log-json> [out-html-path]');
    process.exit(1);
}

const outputPath = outHtmlPath ? path.resolve(outHtmlPath) : path.resolve('./results/debug-diff.html');

console.log('--- Starting Debug Replay ---');
console.log(`Script: ${scriptPath}`);
console.log(`Recording Log: ${recordingLogPath}`);

// Run the replay and diff
(async () => {
    try {
        const replayResult = await ReplayRunner.runDebug({
            scriptPath: path.resolve(scriptPath),
            recordingLogPath: path.resolve(recordingLogPath),
            outHtmlPath: outputPath
        });

        console.log(`\nReplay complete!`);
        console.log(`Replay Log captured at: ${replayResult.replayLogPath}`);
        console.log(`HTML Diff Report generated at: ${outputPath}`);
    } catch (error) {
        console.error('Error running debug replay:', error);
        process.exit(1);
    }
})();
