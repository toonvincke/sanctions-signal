/**
 * SS-024: independent, read-only reachability check in GitHub Actions.
 * Run after: bun scripts/ss-024-curated-sources.ts --json > /tmp/ss024-sources.json
 * Then: bun scripts/ss-024-verify-live-links.ts /tmp/ss024-sources.json
 * Network calls are bounded; neither the database nor published mappings are modified.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { probeOfficialLink, safeOfficialUrl } from "./ss-024-link-check";

type Entry = {jurisdiction:string;slug:string;url:string|null;status:string};
const path=process.argv[2];
if(!path) throw new Error("Missing inventory file argument");
const data=JSON.parse(readFileSync(path,"utf8")) as {total:number;programmes:Entry[]};
if(!Array.isArray(data.programmes) || data.total!==data.programmes.length) throw new Error("Invalid mapping inventory");
const mapped=data.programmes.filter(p=>p.status==="mapped"&&p.url);
if(mapped.some(p=>!safeOfficialUrl(p.url!))) throw new Error("Unsafe mapped URL in inventory");
const unique=[...new Set(mapped.map(p=>p.url!))];
const checked:Awaited<ReturnType<typeof probeOfficialLink>>[]=[];
const concurrency=5;
let next=0;
async function worker(){
 for(;;){
  const n=next++;
  if(n>=unique.length) break;
  const url=unique[n]!;
  const result=await probeOfficialLink(url);
  checked.push(result);
  const code=result.http_status===undefined?"":String(result.http_status);
  console.log(result.status.padEnd(12),code.padEnd(4),url);
 }
}
await Promise.all(Array.from({length:concurrency},()=>worker()));
checked.sort((a,b)=>a.url.localeCompare(b.url));
const counts=checked.reduce<Record<string,number>>((a,x)=>(a[x.status]=(a[x.status]??0)+1,a),{});
const report={verified_at:new Date().toISOString(),total_programmes:data.total,
  mapped_programmes:mapped.length,unmapped_programmes:data.total-mapped.length,
  unique_urls:unique.length,counts,checks:checked};
writeFileSync("ss-024-link-report.json",JSON.stringify(report,null,2)+"\n");
console.log("SUMMARY",JSON.stringify({programmes:mapped.length,unmapped:report.unmapped_programmes,urls:unique.length,statuses:counts}));
if(checked.some(x=>x.status==="broken")){
 console.log("::warning::One or more official source URLs returned HTTP 404 or 410. Mapping needs review; no automatic withdrawal.");
}
if(checked.some(x=>x.status==="blocked"||x.status==="unavailable")){
 console.log("::notice::Some official servers block automated requests or had transient errors; these do not prove a dead link.");
}
