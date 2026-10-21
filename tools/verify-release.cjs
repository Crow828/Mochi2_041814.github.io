// Build and verify the private version. Uses the current Node executable.
const {spawnSync}=require('node:child_process');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
for(const script of ['build.mjs','tools/verify-personal.cjs']){
  const result=spawnSync(process.execPath,[script],{cwd:root,stdio:'inherit',env:process.env});
  if(result.error){console.error(result.error.message);process.exit(1);}
  if(result.status!==0)process.exit(result.status||1);
}
console.log('PASS private release build and browser verification');
