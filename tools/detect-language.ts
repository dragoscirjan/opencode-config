import { tool } from '@opencode-ai/plugin';

export default tool({
  description: 'Detects the appropriate language skill (lang-ext) to load based on a file extension.',
  args: {
    extension: tool.schema.string().describe('The file extension (e.g., .ts, js, .py, tf)'),
  },
  async execute({ extension }) {
    const ext = extension.replace(/^\./, '').toLowerCase();
    
    const map: Record<string, string> = {
      c: 'lang-cpp', cpp: 'lang-cpp', h: 'lang-cpp', hpp: 'lang-cpp',
      cs: 'lang-cs',
      java: 'lang-java',
      go: 'lang-go',
      py: 'lang-py',
      rs: 'lang-rs',
      zig: 'lang-zig',
      ex: 'lang-ex', exs: 'lang-ex',
      lua: 'lang-lua',
      swift: 'lang-swift',
      js: 'lang-js', jsx: 'lang-js, lang-jsx', cjs: 'lang-js', mjs: 'lang-js',
      ts: 'lang-ts', tsx: 'lang-ts, lang-tsx',
      sh: 'lang-sh', bash: 'lang-sh',
      ps1: 'lang-ps1', psm1: 'lang-ps1',
      fish: 'lang-fish',
      md: 'lang-md',
      yaml: 'lang-yaml', yml: 'lang-yaml',
      json: 'lang-json', jsonc: 'lang-json',
      html: 'lang-html', htm: 'lang-html',
      css: 'lang-css', scss: 'lang-css', sass: 'lang-css', less: 'lang-css',
      tf: 'lang-tf', tfvars: 'lang-tf',
      vue: 'lang-vue',
      svelte: 'lang-svelte',
    };
    
    const skill = map[ext];
    if (skill) {
      return `Load skills: ${skill}`;
    }
    return `No specific language skill found for extension: ${ext}. Load the \`clean-code\` skill and proceed.`;
  }
});
