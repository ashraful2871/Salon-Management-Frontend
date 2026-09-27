const fs=require('fs');
function rep(p,pairs){let s=fs.readFileSync(p,'utf8');const crlf=s.includes('\r\n');if(crlf)s=s.replace(/\r\n/g,'\n');
for(const [a,b] of pairs){const n=s.split(a).length-1;if(n!==1)throw new Error(p+': '+n+' matches for '+a.slice(0,60));s=s.replace(a,()=>b);}
if(crlf)s=s.replace(/\n/g,'\r\n');fs.writeFileSync(p,s);}
rep('lib/api-types.ts',[[`  sort?: "distance" | "rating" | "newest";
  page?: number;
  limit?: number;
};`,`  sort?: "distance" | "rating" | "newest";
  category?: string;
  page?: number;
  limit?: number;
};`]]);
rep('services/salon/getAllSalon.ts',[[`  if (query?.city) params.set("city", query.city);
`,`  if (query?.city) params.set("city", query.city);
  if (query?.category) params.set("category", query.category);
`]]);
rep('app/(commonLayout)/salons/page.tsx',[
[`import { getAllSalon } from "@/services/salon/getAllSalon";
`,`import { getAllSalon } from "@/services/salon/getAllSalon";
import { isServiceCategory } from "@/constants/service-categories";
`],
[`    searchTerm: resolvedSearchParams?.searchTerm,
    ...(point`,`    searchTerm: resolvedSearchParams?.searchTerm,
    category: isServiceCategory(resolvedSearchParams.category)
      ? resolvedSearchParams.category
      : undefined,
    ...(point`]]);
rep('components/Salons/Salons.tsx',[
[`// "HAIR COLOR" -> "Hair Color". The filter still matches on the raw value.
const categoryLabel = (value: string) =>
  value === "All"
    ? "All"
    : value
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase());

`,``],
[`import { BANGLADESH_LOCATIONS } from "@/constants/bangladesh-locations";
`,`import { BANGLADESH_LOCATIONS } from "@/constants/bangladesh-locations";
import { categoryLabel } from "@/constants/service-categories";
`]]);
console.log('ok');
