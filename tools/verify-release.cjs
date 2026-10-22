// Build and verify the private version. Uses the current Node executable.
const {spawnSync}=require('node:child_process');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const scripts=['build.mjs','tools/verify-core-layout.cjs','tools/verify-personal.cjs','tools/verify-chat-layout.cjs','tools/verify-settings-layout.cjs','tools/verify-settings-refinement.cjs','tools/verify-card-library-layout.cjs','tools/verify-calendar-cleanup.cjs','tools/verify-custom-moods.cjs','tools/verify-chat-group-favorites.cjs','tools/verify-favorite-identity.cjs','tools/verify-update-notes.cjs'];
const from=process.argv.find(arg=>arg.startsWith('--from='))?.slice(7);
const start=from?scripts.indexOf(from):0;
if(start<0)throw Error('Unknown release checkpoint: '+from);
for(const script of scripts.slice(start)){
  console.log('\nRELEASE CHECK '+script);
  const result=spawnSync(process.execPath,[script],{cwd:root,stdio:'inherit',env:process.env,timeout:240000});
  if(result.error){console.error(result.error.message);process.exit(1);}
  if(result.status!==0)process.exit(result.status||1);
}
console.log('PASS private release build and browser verification');
