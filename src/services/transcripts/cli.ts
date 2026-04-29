import { DEFAULT_CONFIG_PATH, expandHomePath, loadTranscriptWatchConfig, writeSampleConfig } from './config.js';

function getArgValue(args: string[], name: string): string | null {
  const index = args.indexOf(name);
  if (index === -1) return null;
  return args[index + 1] ?? null;
}

export async function runTranscriptCommand(subcommand: string | undefined, args: string[]): Promise<number> {
  switch (subcommand) {
    case 'init': {
      const configPath = getArgValue(args, '--config') ?? DEFAULT_CONFIG_PATH;
      writeSampleConfig(configPath);
      console.log(`Created sample config: ${expandHomePath(configPath)}`);
      return 0;
    }
    case 'validate': {
      const configPath = getArgValue(args, '--config') ?? DEFAULT_CONFIG_PATH;
      try {
        loadTranscriptWatchConfig(configPath);
      } catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
          writeSampleConfig(configPath);
          console.log(`Created sample config: ${expandHomePath(configPath)}`);
          loadTranscriptWatchConfig(configPath);
        } else {
          throw error;
        }
      }
      console.log(`Config OK: ${expandHomePath(configPath)}`);
      return 0;
    }
    default:
      console.log('Usage: ccx-ecc-mem transcript <init|validate> [--config <path>]');
      return 1;
  }
}
