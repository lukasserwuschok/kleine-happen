(function(){
"use strict";
// ================= config =================
const APP_VERSION="1.1.0";
const PRIVACY_BASE="https://lukasserwuschok.github.io/kleine-happen/";
const CONTACT_MAIL="serwuschok-service@outlook.de";
const LANGS=["de","en","fr","es","it","nl","pl","tr"];

// ================= language =================
let LANG="de", L=I18N.de;
const PR={};
function t(k,vars){
  let s=L.ui[k];
  if(s===undefined)s=I18N.de.ui[k];
  if(s===undefined)s=k;
  if(vars)s=s.replace(/\{(\w+)\}/g,(m,x)=>vars[x]!==undefined?vars[x]:m);
  return s;
}
function plural(k,n,vars){
  let form="other";
  try{const pr=PR[L.locale]||(PR[L.locale]=new Intl.PluralRules(L.locale));form=pr.select(n)}catch(e){}
  const key=L.ui[k+"."+form]!==undefined?k+"."+form:k+".other";
  return t(key,Object.assign({n},vars||{}));
}
function detectLang(){
  const p=S.prefs.lang||"";
  if(LANGS.includes(p))return p;
  const cand=(navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language||"de"]);
  for(const c of cand){const l=String(c).slice(0,2).toLowerCase();if(LANGS.includes(l))return l}
  return "en";
}
function applyLang(){
  LANG=detectLang();L=I18N[LANG]||I18N.de;
  document.documentElement.lang=LANG;
  document.title=t("app.name");
  document.querySelectorAll("[data-t]").forEach(el=>el.textContent=t(el.dataset.t));
  document.querySelectorAll("[data-ta]").forEach(el=>el.setAttribute("aria-label",t(el.dataset.ta)));
  document.querySelectorAll("[data-tt]").forEach(el=>el.setAttribute("title",t(el.dataset.tt)));
  const sy=document.getElementById("sync");if(sy&&sy.dataset.key)sy.querySelector("span").textContent=t(sy.dataset.key);
  SPLIT_RE=null;
}

// ================= data =================
// Internal identifiers stay German (they are stored in users' data); labels come from the language files.
const GROUPS=[["gemuese","--mint"],["obst","--berry"],["getreide","--sun"],["eiweiss","--peach"],["huelsen","--grape"],["milch","--sky"],["eisen","--peach"]];
const gl=k=>L.grp[k]||I18N.de.grp[k]||k;
const GMAP={v:"gemuese",o:"obst",c:"getreide",p:"eiweiss",l:"huelsen",m:"milch"};
const amtL=i=>(L.amt||I18N.de.amt)[i]||"";
const MOODS=[["lecker","😋","--mint-soft"],["ok","🙂","--sky-soft"],["naja","😐","--sun-soft"],["nein","🙅","--berry-soft"]];
const moodL=k=>L.mood[k]||I18N.de.mood[k]||"";
const MEALS=["Frühstück","Vormittag","Mittag","Nachmittag","Abend"];
const MEAL_KEY={"Frühstück":"breakfast","Vormittag":"morning","Mittag":"lunch","Nachmittag":"afternoon","Abend":"dinner","Snack":"snack"};
const mealL=v=>MEAL_KEY[v]?(L.meal[MEAL_KEY[v]]||I18N.de.meal[MEAL_KEY[v]]):v;
const SLOTS=[["F","Frühstück"],["M","Mittag"],["A","Abend"]];
const ALLERGENS=["ei","milch","weizen","erdnuss","baumnuss","fisch","sesam","soja","krebstiere"];
const alName=k=>(L.allergens[k]||I18N.de.allergens[k]||[k])[0];
const alHint=k=>(L.allergens[k]||I18N.de.allergens[k]||[k,""])[1];
const MILESTONES=["start","faust","pinzette","loeffel","becher","halm","stueckig","tisch","fleisch","liebling","teilen"];
const msL=k=>L.ms[k]||I18N.de.ms[k]||k;
const TIP_STYLE=[["🍽️","--sun-soft"],["😮","--berry-soft"],["🚫","--peach-soft"],["✋","--mint-soft"],["💪","--grape-soft"],["🥚","--sky-soft"],["🥤","--sun-soft"]];

const C={rot:"#FF6B6B",orange:"#FFA94D",gruen:"#40C057",lila:"#9775FA",weiss:"#C8A27A",getreide:"#E3B341",eiweiss:"#F06595",milch:"#4DABF7"};
const CATALOG=[
 ["rot",["Tomate","Erdbeere","Himbeere","Wassermelone","Rote Bete","Rote Paprika","Kirsche","Rote Linsen"]],
 ["orange",["Karotte","Süßkartoffel","Kürbis","Mango","Aprikose","Pfirsich","Banane","Mais","Gelbe Paprika","Orange"]],
 ["gruen",["Brokkoli","Zucchini","Erbsen","Spinat","Avocado","Gurke","Grüne Bohnen","Kiwi","Birne","Lauch"]],
 ["lila",["Heidelbeere","Pflaume","Aubergine","Rotkohl","Brombeere","Rote Weintraube"]],
 ["weiss",["Blumenkohl","Kartoffel","Pastinake","Apfel","Champignons","Fenchel","Kichererbsen","Tofu","Weiße Bohnen"]],
 ["getreide",["Haferflocken","Hirse","Dinkelgrieß","Nudeln","Brot","Couscous","Quinoa","Polenta"]],
 ["eiweiss",["Ei","Rind","Hähnchen","Pute","Lamm","Lachs","Seelachs","Kabeljau"]],
 ["milch",["Naturjoghurt","Mozzarella","Frischkäse","Quark","Butter","Hüttenkäse"]]
];
const CATALOG_N=CATALOG.reduce((n,c)=>n+c[1].length,0);
const catL=k=>L.cat[k]||I18N.de.cat[k]||k;
const foodL=f=>(L.foods&&L.foods[f])||f;
// every catalog food is recognised in every language, so a switch of language keeps the ticks
let FOOD_NAMES=null;
function foodNames(){
  if(FOOD_NAMES)return FOOD_NAMES;
  FOOD_NAMES={};
  CATALOG.forEach(([,list])=>list.forEach(f=>{
    const s=new Set([f.toLowerCase()]);
    Object.values(I18N).forEach(l=>{if(l.foods&&l.foods[f])s.add(l.foods[f].toLowerCase())});
    FOOD_NAMES[f]=s;
  }));
  return FOOD_NAMES;
}

// recipe base (German). Translations live in lang/*.js under recipes[id] = {n, ing, st, tip}.
const RECIPES=[
 {id:"r1",n:"Bananen-Hafer-Pancakes",min:15,cat:["Frühstück"],g:"ocp",iron:1,al:["ei"],c:"sun",ing:["1 reife Banane","1 Ei","3 EL zarte Haferflocken","etwas Rapsöl"],st:["Banane zerdrücken, Ei und Haferflocken unterrühren, 5 Minuten quellen lassen.","Kleine Pancakes bei mittlerer Hitze beidseitig durchbraten.","In Streifen schneiden und abkühlen lassen."],tip:"Hält 2 Tage im Kühlschrank und lässt sich einfrieren."},
 {id:"r2",n:"Hirse-Porridge mit Birne",min:10,cat:["Frühstück"],g:"co",iron:1,al:[],c:"mint",ing:["3 EL Hirseflocken","100 ml Wasser","½ weiche Birne"],st:["Hirseflocken in Wasser aufkochen und quellen lassen.","Birne fein reiben und unterrühren."],tip:"Löffel vorladen und hinlegen, das Kind führt ihn selbst zum Mund. Vitamin C aus der Birne hilft, das Eisen aufzunehmen."},
 {id:"r3",n:"Ofen-Süßkartoffel-Spalten",min:30,cat:["Mittag","Abend"],g:"v",al:[],c:"peach",ing:["1 Süßkartoffel","1 TL Rapsöl","Prise Paprika edelsüß"],st:["Ofen auf 200 °C vorheizen.","In fingerdicke Spalten schneiden, mit Öl mischen.","25 Minuten backen, bis sie innen ganz weich sind."],tip:"Spalten etwas länger als eine Kinderfaust, damit oben ein Stück herausschaut."},
 {id:"r4",n:"Brokkoli-Bäumchen",min:10,cat:["Mittag","Abend"],g:"v",al:[],c:"mint",ing:["Brokkoli-Röschen mit langem Stiel"],st:["Röschen 6–8 Minuten dämpfen, bis sie sehr weich sind.","Kurz abkühlen lassen."],tip:"Der Stiel ist der perfekte Griff."},
 {id:"r5",n:"Rinder-Hackbällchen",min:25,cat:["Mittag","Abend"],g:"pvc",iron:1,al:["ei"],c:"berry",ing:["250 g Rinderhack","1 kleine Karotte","3 EL zarte Haferflocken","1 Ei"],st:["Karotte fein reiben, alles verkneten.","Längliche Bällchen formen.","Bei 180 °C ca. 18 Minuten backen, bis sie durch sind."],tip:"Rind ist eine der besten Eisenquellen. Länglich greift sich leichter als rund."},
 {id:"r6",n:"Rote-Linsen-Taler",min:25,cat:["Mittag","Abend"],g:"lvc",iron:1,al:["ei"],c:"peach",ing:["100 g rote Linsen","1 kleine Zucchini","3 EL Haferflocken","1 Ei"],st:["Linsen 12 Minuten weich kochen, abgießen.","Zucchini reiben, ausdrücken, mit allem mischen.","Kleine Taler in wenig Öl beidseitig braten."],tip:"Lassen sich gut einfrieren und kurz im Ofen aufwärmen."},
 {id:"r7",n:"Spinat-Omelett-Streifen",min:10,cat:["Frühstück","Abend"],g:"pv",iron:1,al:["ei"],c:"mint",ing:["1 Ei","1 Handvoll Babyspinat","1 TL Rapsöl"],st:["Spinat fein hacken, mit dem Ei verquirlen.","Dünn in der Pfanne stocken lassen, wenden, ganz durchgaren.","In fingerbreite Streifen schneiden."],tip:"Ei immer komplett durchgaren."},
 {id:"r8",n:"Avocado im Hafermantel",min:5,cat:["Snack","Frühstück"],g:"vc",al:[],c:"mint",ing:["½ reife Avocado","2 EL Haferflocken, fein gemahlen"],st:["Avocado in dicke Spalten schneiden.","In den gemahlenen Haferflocken wälzen."],tip:"Der Mantel sorgt dafür, dass die glitschige Avocado nicht aus der Hand rutscht."},
 {id:"r9",n:"Gedünstete Apfelspalten",min:10,cat:["Snack"],g:"o",al:[],c:"berry",ing:["1 Apfel","Prise Zimt"],st:["Apfel schälen und in Spalten schneiden.","Mit wenig Wasser zugedeckt 6–8 Minuten dünsten."],tip:"Roher Apfel ist zu hart. Gedünstet ist er sicher."},
 {id:"r10",n:"Lachs-Kartoffel-Taler",min:30,cat:["Mittag","Abend"],g:"pv",iron:1,al:["fisch"],c:"sky",ing:["1 mehlig kochende Kartoffel","80 g Lachsfilet","1 TL Dill","1 EL Haferflocken"],st:["Kartoffel kochen, Lachs ca. 8 Minuten dämpfen.","Zusammen zerdrücken, Dill und Haferflocken untermischen.","Taler formen und in wenig Öl goldbraun braten."],tip:"Lachs mit den Fingern nach Gräten absuchen."},
 {id:"r11",n:"Polenta-Sticks",min:20,cat:["Mittag","Snack"],g:"cm",al:["milch"],c:"sun",ing:["50 g Polenta","250 ml Wasser","1 EL Butter"],st:["Polenta ins kochende Wasser rühren, 5 Minuten köcheln, Butter einrühren.","Fingerdick auf ein Brett streichen und fest werden lassen.","In Sticks schneiden und kurz anbraten."],tip:"Lassen sich vorbereiten und im Kühlschrank lagern."},
 {id:"r12",n:"Kürbis-Mini-Muffins",min:35,cat:["Snack","Frühstück"],g:"vocp",al:["ei","weizen"],c:"peach",ing:["150 g Hokkaido","1 Banane","2 Eier","100 g Dinkelmehl","1 TL Backpulver","2 EL Rapsöl"],st:["Kürbis reiben, Banane zerdrücken.","Mit Eiern und Öl verrühren, Mehl und Backpulver unterheben.","In Mini-Muffinformen bei 180 °C 20 Minuten backen."],tip:"Perfekte Greifgröße und gut für unterwegs."},
 {id:"r13",n:"Fusilli mit Linsen-Tomaten-Soße",min:20,cat:["Mittag","Abend"],g:"clv",iron:1,al:["weizen"],c:"berry",ing:["Vollkorn-Fusilli","50 g rote Linsen","200 g passierte Tomaten","½ Karotte"],st:["Linsen mit Tomaten und geriebener Karotte 15 Minuten köcheln.","Nudeln weicher als al dente kochen.","Soße unterheben, abkühlen lassen."],tip:"Fusilli halten die Soße und lassen sich mit der ganzen Hand greifen."},
 {id:"r14",n:"Hähnchen-Streifen",min:25,cat:["Mittag","Abend"],g:"p",iron:1,al:[],c:"sun",ing:["1 Hähnchenschenkel ohne Haut","1 TL Rapsöl","Paprika edelsüß"],st:["Mit Öl und Gewürz bei 190 °C ca. 25 Minuten im Ofen garen.","In lange, fingerbreite Streifen schneiden."],tip:"Schenkel bleibt saftiger als Brust. Auch Lutschen und Saugen bringt Eisen."},
 {id:"r15",n:"Joghurt mit Heidelbeeren",min:3,cat:["Snack","Frühstück"],g:"mo",al:["milch"],c:"grape",ing:["3 EL Naturjoghurt 3,5 %","1 Handvoll Heidelbeeren"],st:["Heidelbeeren zerdrücken.","Unter den Joghurt mischen, Löffel vorladen."],tip:"Runde Früchte immer zerdrücken oder vierteln."},
 {id:"r16",n:"Blumenkohl-Käse-Taler",min:30,cat:["Mittag","Abend"],g:"vmpc",al:["ei","milch"],c:"sky",ing:["200 g Blumenkohl","1 Ei","40 g Mozzarella","3 EL Haferflocken"],st:["Blumenkohl weich dämpfen und zerdrücken.","Mit Ei, gezupftem Mozzarella und Haferflocken mischen.","Taler formen, bei 190 °C 20 Minuten backen."],tip:"Mozzarella ist salzarm und gut für Babys geeignet."},
 {id:"r17",n:"Grießbrei mit Apfelmus",min:10,cat:["Frühstück","Abend"],g:"cmo",al:["weizen","milch"],c:"sky",ing:["2 EL Dinkelgrieß","150 ml Vollmilch","2 EL Apfelmus ohne Zucker"],st:["Milch aufkochen, Grieß einrühren, 3 Minuten quellen lassen.","Apfelmus unterrühren, abkühlen lassen."],tip:"Kleine Mengen Kuhmilch im Brei sind in Ordnung, als Getränk erst ab dem ersten Geburtstag."},
 {id:"r18",n:"Selbstgemachte Fischstäbchen",min:25,cat:["Mittag"],g:"pc",iron:1,al:["fisch","ei"],c:"sky",ing:["150 g Seelachsfilet","1 Ei","5 EL Haferflocken, gemahlen","1 EL Rapsöl"],st:["Fisch in fingerdicke Stäbchen schneiden.","Erst durchs verquirlte Ei, dann durch die Haferflocken ziehen.","Bei 200 °C 12–15 Minuten backen, bis der Fisch durch ist."],tip:"Seelachs ist mild und hat wenige Gräten."},
 {id:"r19",n:"Gemüse-Waffeln",min:20,cat:["Frühstück","Snack"],g:"vcp",al:["ei","weizen"],c:"mint",ing:["1 Zucchini","1 Karotte","2 Eier","80 g Dinkelmehl"],st:["Gemüse fein reiben und ausdrücken.","Mit Eiern und Mehl verrühren.","Im Waffeleisen goldbraun backen, in Streifen schneiden."],tip:"Lassen sich gut einfrieren und toasten."},
 {id:"r20",n:"Hummus-Toaststreifen",min:10,cat:["Snack","Abend"],g:"lc",iron:1,al:["sesam","weizen"],c:"sun",ing:["1 Dose Kichererbsen","1 EL Tahin","1 EL Olivenöl","Spritzer Zitrone","Vollkorntoast"],st:["Kichererbsen abspülen und mit Tahin, Öl und Zitrone fein pürieren.","Toast leicht rösten und in Streifen schneiden.","Dünn mit Hummus bestreichen."],tip:"Gleich zwei Dinge auf einmal: Eisen aus den Kichererbsen und Sesam als Allergen."},
 {id:"r21",n:"Bananen-Erdnuss-Stücke",min:3,cat:["Snack"],g:"o",al:["erdnuss"],c:"peach",ing:["½ Banane","½ TL Erdnussmus ohne Salz und Zucker"],st:["Banane längs halbieren.","Sehr dünn mit Erdnussmus bestreichen."],tip:"Erdnussmus nie pur oder dick geben, sondern dünn verstrichen oder mit Wasser verdünnt."},
 {id:"r22",n:"Tofu-Sticks",min:15,cat:["Mittag","Abend"],g:"l",iron:1,al:["soja"],c:"grape",ing:["100 g Naturtofu","1 TL Rapsöl","Prise Paprika"],st:["Tofu trocken tupfen und in Sticks schneiden.","In wenig Öl von allen Seiten braten."],tip:"Pflanzliche Eisenquelle, am besten mit etwas Obst oder Paprika für Vitamin C."},
 {id:"r23",n:"Ofen-Gemüse-Pommes",min:30,cat:["Mittag","Abend"],g:"v",al:[],c:"sun",ing:["1 Pastinake","1 Karotte","1 TL Rapsöl"],st:["Gemüse schälen und in Pommes-Form schneiden.","Mit Öl mischen und bei 200 °C 25 Minuten backen."],tip:"Innen weich, außen fest genug zum Greifen."},
 {id:"r24",n:"Rinder-Bolognese mit Fusilli",min:30,cat:["Mittag","Abend"],g:"pvc",iron:1,al:["weizen"],c:"berry",ing:["150 g Rinderhack","1 kleine Zucchini","200 g passierte Tomaten","Vollkorn-Fusilli"],st:["Hack krümelig anbraten, geriebene Zucchini dazu.","Tomaten zugeben und 15 Minuten köcheln.","Mit weich gekochten Nudeln mischen."],tip:"Für die Familie mitkochen und erst nach dem Abfüllen für die Großen würzen."},
 {id:"r25",n:"Birnen-Haferkekse",min:25,cat:["Snack"],g:"co",al:[],c:"grape",ing:["1 reife Birne","100 g zarte Haferflocken","1 EL Rapsöl"],st:["Birne fein reiben und mit Haferflocken und Öl verkneten.","Kleine, flache Kekse formen.","Bei 180 °C 15–18 Minuten backen."],tip:"Werden weich und zerfallen leicht im Mund."}
];
const locR=r=>{if(!r||r.own)return r;const tr=L.recipes&&L.recipes[r.id];return tr?Object.assign({},r,tr):r};
const recTime=r=>r.own?(r.t||""):t("min",{n:r.min});

// ================= state =================
let live=false;
const S={tab:"heute",day:todayISO(),weekEnd:todayISO(),sub:{rezepte:"ideen",entdecken:"essen"},
  days:{},foods:{items:{},allergens:{}},prefs:{name:"",birth:"",favs:[],onboarded:false,lang:""},plan:{slots:{}},shop:{items:[]},ms:{done:{}},mine:{},
  filter:"all",q:"",ideaSeed:0};

// ================= helpers =================
function todayISO(){const d=new Date();d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,10)}
function shift(iso,n){const d=new Date(iso+"T12:00:00Z");d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)}
function dd(iso,o){return new Date(iso+"T12:00:00").toLocaleDateString(L.locale,o)}
function short(iso){return dd(iso,{day:"numeric",month:"numeric"})}
function wd(iso){return dd(iso,{weekday:"short"}).replace(".","")}
function nowHM(){const n=new Date();return String(n.getHours()).padStart(2,"0")+":"+String(n.getMinutes()).padStart(2,"0")}
const $=id=>document.getElementById(id);
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const v=n=>"var("+n+")";
function toast(m){const el=$("toast");el.textContent=m;el.hidden=false;clearTimeout(toast.h);toast.h=setTimeout(()=>el.hidden=true,2000)}
function notice(m){const n=$("notice");n.textContent=m;n.hidden=false}
function confetti(){
  if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  const box=document.createElement("div");box.className="confetti";
  const cols=["--sun","--peach","--mint","--sky","--berry","--grape"];
  for(let i=0;i<34;i++){const p=document.createElement("i");p.style.left=(Math.random()*100)+"%";p.style.background=v(cols[i%6]);p.style.setProperty("--dx",(Math.random()*120-60)+"px");p.style.setProperty("--rot",(Math.random()*720-360)+"deg");p.style.animationDelay=(Math.random()*.25)+"s";box.appendChild(p)}
  document.body.appendChild(box);setTimeout(()=>box.remove(),1900);
}
function ageText(){
  const b=S.prefs.birth;if(!b)return "";
  const s=new Date(b+"T12:00:00"),n=new Date();
  let m=(n.getFullYear()-s.getFullYear())*12+(n.getMonth()-s.getMonth());
  let anchor=new Date(s);anchor.setMonth(s.getMonth()+m);
  if(anchor>n){m--;anchor=new Date(s);anchor.setMonth(s.getMonth()+m)}
  if(m<0)return "";
  const w=Math.floor((n-anchor)/864e5/7);
  return plural("age.month",m)+(w>0?t("age.and")+plural("age.week",w):"");
}
const getRecipe=id=>locR(RECIPES.find(r=>r.id===id)||S.mine[id]);
const allRecipes=()=>[...RECIPES.map(locR),...Object.values(S.mine).sort((a,b)=>a.n.localeCompare(b.n))];
const groupsOf=r=>{const g=[...(r.g||"")].map(c=>GMAP[c]).filter(Boolean);if(r.iron)g.push("eisen");return g};
const isFav=id=>(S.prefs.favs||[]).includes(id);

// ================= store (native) =================
// Every document lives in one JSON file on the phone; C# persists it (see AppBridge.cs).
function native(method,args){
  if(!window.HybridWebView)return Promise.reject(new Error("no bridge"));
  return window.HybridWebView.InvokeDotNet(method,args||[]);
}
let chain=Promise.resolve();
function write(path,data){
  if(!live)return Promise.resolve();
  const json=JSON.stringify(data);
  chain=chain.then(()=>native("Save",[path,json])).catch(()=>notice(t("err.save")));
  return chain;
}
function del(path){if(live)chain=chain.then(()=>native("Delete",[path])).catch(()=>{})}
const DAY0={entries:[],still:[],nass:0,voll:0,water:false};
function day(iso){return Object.assign({},DAY0,S.days[iso]||{})}
function saveDay(iso,patch){const d=Object.assign(day(iso),patch);S.days[iso]=d;write("days/"+iso,d)}
const saveFoods=()=>write("foods/list",S.foods);
const savePrefs=()=>write("prefs/main",S.prefs);
const savePlan=()=>{const lim=shift(todayISO(),-14);const s={};Object.keys(S.plan.slots).forEach(k=>{if(k>=lim)s[k]=S.plan.slots[k]});S.plan={slots:s};write("plan/main",S.plan)};
const saveShop=()=>write("shop/list",S.shop);
const saveMs=()=>write("milestones/main",S.ms);

// ================= foods logic =================
const UNIT_RE=/^\s*[\d.,½¼¾\/]+\s*(el|tl|g|gr|kg|ml|l|stück|stk\.?|scheiben?|handvoll|tbsp|tsp|cups?|oz|pieces?|slices?|handful|cs|cc|c\.?\s?à\s?s\.?|cuill[eè]res?|tranches?|cdas?|cditas?|cucharad(?:a|ita)s?|rodajas?|cucchia(?:i|ini|io|ino)|fette|el\.|tl\.|eetlepels?|theelepels?|plakjes?|łyżk[ai]|łyżecz(?:ka|ki)|plastr(?:y|ów)?|garść|yemek kaşığı|tatlı kaşığı|çay kaşığı|dilim|avuç)?\s+/i;
function norm(s){s=String(s).replace(UNIT_RE,"").replace(/^\s*[\d.,½¼¾]+\s*/,"").trim();return s?s.charAt(0).toUpperCase()+s.slice(1):""}
function findItem(name){const l=String(name).toLowerCase();return Object.keys(S.foods.items).find(k=>k.toLowerCase()===l)}
function findCatalog(f){const names=foodNames()[f];return Object.keys(S.foods.items).find(k=>names.has(k.toLowerCase()))}
function isCatalogName(n){const l=n.toLowerCase();return Object.values(foodNames()).some(s=>s.has(l))}
function addFoods(list,iso){
  const items=Object.assign({},S.foods.items),added=[];
  list.map(norm).filter(x=>x&&x.length<40).forEach(n=>{
    const cat=CATALOG.flatMap(c=>c[1]).find(f=>foodNames()[f].has(n.toLowerCase()));
    const exists=findItem(n)||(cat&&findCatalog(cat));
    if(!exists&&!added.some(a=>a.toLowerCase()===n.toLowerCase())){items[n]={first:iso,r:""};added.push(n)}
  });
  if(added.length){S.foods=Object.assign({},S.foods,{items});saveFoods()}
  return added;
}
let SPLIT_RE=null;
function splitFoods(s){
  if(!SPLIT_RE){
    const words=[...new Set([...(L.split||[]),...I18N.de.split])].map(w=>w.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"));
    SPLIT_RE=new RegExp("[,;+\\/]|(?<![\\p{L}])(?:"+words.join("|")+")(?![\\p{L}])","iu");
  }
  return s.split(SPLIT_RE);
}

// ================= suggestion =================
function suggestion(){
  const h=new Date().getHours();
  const meal=h<10?"Frühstück":h<15?"Mittag":h<17?"Snack":"Abend";
  const got=new Set(day(todayISO()).entries.flatMap(e=>e.groups||[]));
  const missing=GROUPS.map(g=>g[0]).filter(g=>!got.has(g));
  const ranked=allRecipes().map(r=>{const gs=groupsOf(r);let s=0;
    if(r.iron&&!got.has("eisen"))s+=4;
    s+=gs.filter(g=>missing.includes(g)).length;
    if((r.cat||[]).includes(meal))s+=3;
    if(isFav(r.id))s+=1;
    return [s,r]}).sort((a,b)=>b[0]-a[0]).slice(0,6);
  const pick=ranked[S.ideaSeed%ranked.length][1];
  let why=t("idea."+(MEAL_KEY[meal]||"snack"));
  if(pick.iron&&!got.has("eisen"))why=t("idea.noIron");
  return {r:pick,why};
}

// ================= icons =================
function foodArt(color){
  return '<svg viewBox="0 0 64 64" aria-hidden="true"><ellipse cx="32" cy="46" rx="26" ry="8" fill="#FFFFFF" opacity=".55"/><path d="M8 34h48a24 18 0 0 1-48 0Z" fill="#FFFFFF"/><circle cx="24" cy="30" r="8" fill="'+v("--"+color)+'"/><circle cx="36" cy="27" r="7" fill="'+v("--"+color)+'" opacity=".7"/><circle cx="44" cy="31" r="5" fill="'+v("--"+color)+'" opacity=".5"/><circle cx="29" cy="40" r="1.6" fill="#2A2850"/><circle cx="35" cy="40" r="1.6" fill="#2A2850"/><path d="M30 43.5q2 1.8 4 0" stroke="#2A2850" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>';
}
const ICON={
  still:'<svg viewBox="0 0 24 24"><path d="M12 21c4.5 0 7-3 7-7 0-5-7-11-7-11S5 9 5 14c0 4 2.5 7 7 7Z"/><path d="M9.5 15a2.5 2.5 0 0 0 2.5 2.5"/></svg>',
  nass:'<svg viewBox="0 0 24 24"><path d="M4 7h16v4a8 8 0 0 1-16 0Z"/><path d="M12 13.5c1.2 0 2-.8 2-1.8 0-1.3-2-3.2-2-3.2s-2 1.9-2 3.2c0 1 .8 1.8 2 1.8Z"/></svg>',
  voll:'<svg viewBox="0 0 24 24"><path d="M4 7h16v4a8 8 0 0 1-16 0Z"/><circle cx="9" cy="11" r="1"/><circle cx="15" cy="11" r="1"/><path d="M10 14q2 1.5 4 0"/></svg>',
  water:'<svg viewBox="0 0 24 24"><path d="M6 4h12l-1.5 16h-9Z"/><path d="M7 10h10"/></svg>'
};
const ROW_RED=c=>`style="margin-left:auto;color:${v("--berry")}"`;

// ================= views =================
function render(){
  $("hello").textContent=S.prefs.name?t("hello",{name:S.prefs.name}):t("app.name");
  const a=ageText();$("age").textContent=a?t("age.old",{age:a}):t("app.tagline");
  document.querySelectorAll("nav.tabs button").forEach(b=>{if(b.dataset.v===S.tab)b.setAttribute("aria-current","page");else b.removeAttribute("aria-current")});
  $("view").innerHTML=({heute:vHeute,woche:vWoche,rezepte:vRezepte,entdecken:vEntdecken,tipps:vTipps})[S.tab]();
}

function vHeute(){
  const td=todayISO(),d=day(S.day),isToday=S.day===td;
  const lab=isToday?t("day.today"):S.day===shift(td,-1)?t("day.yesterday"):dd(S.day,{weekday:"long"});
  const es=[...d.entries].sort((x,y)=>x.time.localeCompare(y.time));
  const got=new Set(es.flatMap(e=>e.groups||[]));
  const n=es.length;
  const lastStill=d.still.length?d.still[d.still.length-1]:null;
  let h=`<div class="stack">
  <div class="daybar"><button class="arrow" data-act="day" data-n="-1" aria-label="${esc(t("day.prev"))}">‹</button>
    <div class="lab">${esc(lab)}<small>${esc(dd(S.day,{day:"numeric",month:"long",year:"numeric"}))}</small></div>
    <button class="arrow" data-act="day" data-n="1" aria-label="${esc(t("day.next"))}" ${S.day>=td?"disabled":""}>›</button></div>
  <div><div class="quick">
    ${qbtn("still",t("q.milk"),d.still.length,lastStill?t("q.last",{t:lastStill}):t("q.milkSub"),"--berry-soft")}
    ${qbtn("nass",t("q.wet"),d.nass,"","--sky-soft")}
    ${qbtn("voll",t("q.dirty"),d.voll,"","--sun-soft")}
    <button class="q ${d.water?"on":""}" data-act="water" aria-pressed="${d.water}"><span class="ic" style="background:${v("--mint-soft")}">${ICON.water}</span><b>${d.water?"✓":"–"}</b><span>${esc(t("q.water"))}</span></button>
  </div>
  <div class="quickminus">${["still","nass","voll"].map(k=>`<button class="minus" data-act="minus" data-k="${k}" aria-label="${esc(t("q.minus"))}">− 1</button>`).join("")}<span></span></div></div>
  <div class="summary"><div class="blob"></div>
    <div class="eyebrow" style="color:#2A2850;opacity:.7">${esc(isToday?t("sum.todaySoFar"):t("sum.thisDay"))}</div>
    <div class="big">${esc(n===0?t("sum.none"):plural("meals",n))}</div>
    <div class="sub">${esc(n===0?t("sum.milk"):got.has("eisen")?t("sum.iron"):t("sum.noIron"))}</div>
    <div class="groups">${GROUPS.map(([k])=>`<span class="g ${got.has(k)?"on":""}">${esc(gl(k))}</span>`).join("")}</div>
  </div>`;
  h+=n?es.map(e=>{const m=MOODS.find(x=>x[0]===e.mood)||MOODS[1];
    return `<article class="entry"><span class="face" style="background:${v(m[2])}" title="${esc(moodL(m[0]))}">${m[1]}</span>
      <div class="what"><b>${esc(e.foods)}</b><span class="meta">${esc(e.time)} · ${esc(mealL(e.meal))} · <span class="amt" aria-hidden="true">${[0,1,2,3].map(i=>`<i class="${i<=e.amount?"f":""}"></i>`).join("")}</span>${esc(amtL(e.amount))}</span></div>
      <button class="edit" data-act="editEntry" data-id="${esc(e.id)}">${esc(t("edit"))}</button>
      ${e.note?`<div class="note">${esc(e.note)}</div>`:""}</article>`}).join("")
    :`<div class="empty">${t("empty.entries")}</div>`;
  h+=`<button class="btn wide" data-act="newEntry">${esc(t("btn.addMeal"))}</button>`;
  if(isToday){const s=suggestion();
    h+=`<div class="idea"><div style="width:62px;height:62px;border-radius:18px;background:${v("--"+s.r.c)};display:grid;place-items:center">${foodArt(s.r.c).replace('<svg','<svg style="width:52px;height:52px"')}</div>
      <div style="min-width:0"><div class="eyebrow">${esc(t("idea.title"))}</div><h3>${esc(s.r.n)}</h3><div class="why">${esc(s.why)}</div>
      <div class="row" style="margin-top:6px"><button class="btn small mint" data-act="recipe" data-id="${s.r.id}">${esc(t("idea.view"))}</button><button class="link" data-act="nextIdea">${esc(t("idea.other"))}</button></div></div></div>`;}
  const planned=S.plan.slots[S.day];
  if(planned&&Object.values(planned).some(Boolean)){
    h+=`<div class="card stack" style="gap:8px"><div class="eyebrow">${esc(isToday?t("planned.today"):t("planned.day"))}</div>${SLOTS.filter(([k])=>planned[k]&&getRecipe(planned[k])).map(([k,meal])=>`<div class="spread"><span><span class="muted" style="font-weight:800">${esc(mealL(meal))}:</span> <b>${esc(getRecipe(planned[k]).n)}</b></span><button class="btn small ghost" data-act="logRecipe" data-id="${planned[k]}" data-meal="${meal}">${esc(t("btn.log"))}</button></div>`).join("")}</div>`;
  }
  return h+"</div>";
}
function qbtn(k,label,count,sub,bg){
  return `<button class="q" data-act="plus" data-k="${k}"><span class="ic" style="background:${v(bg)}">${ICON[k]}</span><b>${count}</b><span>${esc(label)}${sub?"<br>"+esc(sub):""}</span></button>`;
}

function vWoche(){
  const end=S.weekEnd,td=todayISO();
  const days=[...Array(7)].map((_,i)=>shift(end,i-6));
  const ds=days.map(day);
  const meals=ds.reduce((n,d)=>n+d.entries.length,0);
  const ironDays=ds.filter(d=>d.entries.some(e=>(e.groups||[]).includes("eisen"))).length;
  const newFoods=Object.values(S.foods.items).filter(x=>x.first>=days[0]&&x.first<=end).length;
  const stillAvg=(ds.reduce((n,d)=>n+d.still.length,0)/7);
  const counts={};
  ds.forEach(d=>d.entries.filter(e=>e.mood==="lecker").forEach(e=>splitFoods(e.foods).map(norm).filter(Boolean).forEach(f=>counts[f]=(counts[f]||0)+1)));
  const top=Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const AC=["--sky-soft","--sky","--grape","--berry"];
  let h=`<div class="stack">
  <div class="daybar"><button class="arrow" data-act="week" data-n="-7" aria-label="${esc(t("wk.prev"))}">‹</button>
    <div class="lab">${esc(end===td?t("wk.last7"):t("wk.week"))}<small>${short(days[0])} – ${short(end)}</small></div>
    <button class="arrow" data-act="week" data-n="7" aria-label="${esc(t("wk.next"))}" ${end>=td?"disabled":""}>›</button></div>
  <div class="tiles">
    <div class="tile" style="background:${v("--sun")}"><b>${meals}</b><span>${esc(t("wk.meals"))}</span></div>
    <div class="tile" style="background:${v("--peach")}"><b>${ironDays}<small style="font-size:1rem"> / 7</small></b><span>${esc(t("wk.ironDays"))}</span></div>
    <div class="tile" style="background:${v("--mint")}"><b>${newFoods}</b><span>${esc(t("wk.newFoods"))}</span></div>
    <div class="tile" style="background:${v("--sky")}"><b>${stillAvg.toLocaleString(L.locale,{maximumFractionDigits:1})}</b><span>${esc(t("wk.milk"))}</span></div>
  </div>
  <div class="card stack" style="gap:10px"><h2>${esc(t("wk.perDay"))}</h2>
    <div class="meals">${ds.map(d=>{const e=[...d.entries].sort((a,b)=>a.time.localeCompare(b.time));
      return `<div class="mcol">${e.length?"":`<span class="num">0</span>`}${e.slice(0,5).map(x=>`<span class="bub" title="${esc(x.foods)}" style="background:${v(AC[x.amount]||"--sky")}"></span>`).join("")}${e.length>5?`<span class="num">+${e.length-5}</span>`:""}</div>`}).join("")}</div>
    <div class="mlabels">${days.map(x=>`<span>${esc(x===td?t("day.today"):wd(x))}</span>`).join("")}</div>
    <div class="row muted" style="font-size:.78rem;font-weight:800;gap:12px">${[0,1,2,3].map(i=>`<span class="row" style="gap:4px"><span class="bub" style="width:12px;height:12px;border-radius:50%;background:${v(AC[i])}"></span>${esc(amtL(i))}</span>`).join("")}</div>
  </div>
  <div class="card stack" style="gap:8px"><h2>${esc(t("wk.groups"))}</h2><p class="muted" style="font-size:.9rem">${esc(t("wk.variety"))}</p>
    <div class="hm"><table><thead><tr><th></th>${days.map(x=>`<th>${esc(x===td?t("day.today"):wd(x))}</th>`).join("")}</tr></thead><tbody>
    ${GROUPS.map(([k,c])=>`<tr><th class="rl">${esc(gl(k))}</th>${ds.map(d=>`<td><div class="cell ${d.entries.some(e=>(e.groups||[]).includes(k))?"on":""}" style="--c:${v(c)}"></div></td>`).join("")}</tr>`).join("")}
    </tbody></table></div></div>`;
  h+=`<div class="card stack" style="gap:8px"><h2>${esc(t("wk.fav"))}</h2>${top.length?`<div class="row">${top.map(([f,n])=>`<span class="chip" style="background:${v("--mint-soft")};border-color:${v("--mint")}">😋 ${esc(f)}${n>1?" ×"+n:""}</span>`).join("")}</div>`:`<p class="muted">${esc(t("wk.favEmpty"))}</p>`}</div>`;
  return h+"</div>";
}

const FILTERS=["all","fav","iron","Frühstück","Mittag","Abend","Snack","own"];
const filterL=f=>({all:t("f.all"),fav:"♥ "+t("f.fav"),iron:t("f.iron"),own:t("f.own")})[f]||mealL(f);
function vRezepte(){
  const sub=S.sub.rezepte;
  let h=`<div class="stack"><div class="subtabs" role="group">${[["ideen","rc.ideas"],["plan","rc.plan"],["einkauf","rc.shop"]].map(([k,l])=>`<button data-act="sub" data-t="rezepte" data-s="${k}" aria-pressed="${sub===k}">${esc(t(l))}</button>`).join("")}</div>`;
  if(sub==="ideen"){
    const q=S.q.toLowerCase();
    const list=allRecipes().filter(r=>{
      const f=S.filter;
      if(f==="fav"&&!isFav(r.id))return false;
      if(f==="iron"&&!r.iron)return false;
      if(f==="own"&&!r.own)return false;
      if(MEAL_KEY[f]&&!(r.cat||[]).includes(f))return false;
      if(q&&!(r.n+" "+(r.ing||[]).join(" ")).toLowerCase().includes(q))return false;
      return true});
    h+=`<input class="search" id="search" type="search" placeholder="${esc(t("rc.search"))}" value="${esc(S.q)}" aria-label="${esc(t("rc.searchLabel"))}">
    <div class="filters">${FILTERS.map(c=>`<button class="chip" data-act="filter" data-f="${esc(c)}" aria-pressed="${S.filter===c}">${esc(filterL(c))}</button>`).join("")}</div>
    <div class="rgrid">${list.map(rcard).join("")}</div>
    ${list.length?"":`<div class="empty">${esc(t("rc.none"))}</div>`}
    <button class="btn ghost wide" data-act="newRecipe">${esc(t("rc.addOwn"))}</button>`;
  }
  if(sub==="plan"){
    const td=todayISO();
    h+=`<p class="muted" style="font-weight:700">${esc(t("plan.intro"))}</p>`;
    for(let i=0;i<7;i++){const x=shift(td,i),p=S.plan.slots[x]||{};
      h+=`<div class="pday"><div class="pdate ${i===0?"today":""}">${esc(i===0?t("day.today"):wd(x))}<small>${short(x)}</small></div><div class="slots">${SLOTS.map(([k,meal])=>{const r=p[k]&&getRecipe(p[k]);return `<button class="slot ${r?"full":""}" data-act="pickSlot" data-d="${x}" data-k="${k}"><span class="k">${esc(mealL(meal))}</span><span class="v">${r?esc(r.n):`<span class="muted">${esc(t("plan.pick"))}</span>`}</span></button>`}).join("")}</div></div>`}
    h+=`<button class="btn mint wide" data-act="planToShop">${esc(t("plan.toShop"))}</button>`;
  }
  if(sub==="einkauf"){
    const items=S.shop.items||[];
    h+=`<form class="addrow" data-form="shopAdd"><input id="shopIn" type="text" placeholder="${esc(t("shop.ph"))}" aria-label="${esc(t("shop.add"))}" autocomplete="off"><button class="btn" type="submit">+</button></form>
    <div class="card shop">${items.length?items.map(it=>`<button class="si ${it.done?"done":""}" data-act="shopToggle" data-id="${esc(it.id)}"><span class="cb">${it.done?"✓":""}</span><span class="tx">${esc(it.t)}</span></button>`).join(""):`<p class="muted" style="padding:6px">${esc(t("shop.empty"))}</p>`}</div>
    ${items.some(i=>i.done)?`<button class="btn ghost wide" data-act="shopClear">${esc(t("shop.clear"))}</button>`:""}`;
  }
  return h+"</div>";
}
function rcard(r){
  return `<button class="rc" data-act="recipe" data-id="${esc(r.id)}"><span class="pic" style="background:${v("--"+r.c+"-soft")}">${foodArt(r.c)}${isFav(r.id)?'<span class="heart" style="color:'+v("--berry")+'">♥</span>':""}</span>
  <span class="txt"><h3>${esc(r.n)}</h3><span class="t">${esc(recTime(r))}</span><span>${r.iron?`<span class="tag iron">${esc(t("tag.iron"))}</span>`:""}${r.own?`<span class="tag own">${esc(t("tag.own"))}</span>`:""}${(r.cat||[]).slice(0,1).map(c=>`<span class="tag">${esc(mealL(c))}</span>`).join("")}</span></span></button>`;
}

const RE_EMO={like:"😋",meh:"😐",no:"🙅"};
function vEntdecken(){
  const sub=S.sub.entdecken;
  let h=`<div class="stack"><div class="subtabs" role="group">${[["essen","dc.foods"],["allergene","dc.allergens"],["meilensteine","dc.milestones"]].map(([k,l])=>`<button data-act="sub" data-t="entdecken" data-s="${k}" aria-pressed="${sub===k}">${esc(t(l))}</button>`).join("")}</div>`;
  if(sub==="essen"){
    const tried=CATALOG.reduce((n,c)=>n+c[1].filter(f=>findCatalog(f)).length,0);
    const pct=tried/CATALOG_N, circ=2*Math.PI*34;
    h+=`<div class="card progress"><svg class="ring" viewBox="0 0 84 84"><circle cx="42" cy="42" r="34" fill="none" stroke="${v("--line")}" stroke-width="10"/><circle cx="42" cy="42" r="34" fill="none" stroke="${v("--mint")}" stroke-width="10" stroke-linecap="round" stroke-dasharray="${circ*pct} ${circ}" transform="rotate(-90 42 42)"/><text x="42" y="48" text-anchor="middle" font-family="Outfit, Poppins, sans-serif" font-weight="700" font-size="20" fill="${v("--ink")}">${tried}</text></svg>
      <div><h2>${esc(t("rainbow.title"))}</h2><p class="muted" style="font-weight:700">${esc(t("rainbow.text",{n:tried,total:CATALOG_N}))}</p></div></div>`;
    CATALOG.forEach(([k,list])=>{
      h+=`<div class="cat"><h3><i style="background:${C[k]}"></i>${esc(catL(k))}</h3><div class="foods">${list.map(f=>{const key=findCatalog(f),it=key&&S.foods.items[key];const r=it&&it.r?RE_EMO[it.r]:"";
        return `<button class="fd ${it?"on":""}" style="--c:${C[k]}" data-act="food" data-n="${esc(key||foodL(f))}"><i></i>${esc(foodL(f))}${r?`<em>${r}</em>`:""}</button>`}).join("")}</div></div>`});
    const extra=Object.keys(S.foods.items).filter(n=>!isCatalogName(n)).sort((a,b)=>a.localeCompare(b));
    h+=`<div class="cat"><h3><i style="background:${v("--grape")}"></i>${esc(t("foods.more"))}</h3>
      ${extra.length?`<div class="foods">${extra.map(f=>{const it=S.foods.items[f];const r=it.r?RE_EMO[it.r]:"";return `<button class="fd on" style="--c:${v("--grape")}" data-act="food" data-n="${esc(f)}"><i></i>${esc(f)}${r?`<em>${r}</em>`:""}</button>`}).join("")}</div>`:`<p class="muted" style="font-size:.9rem">${esc(t("foods.moreEmpty"))}</p>`}
      <form class="addrow" data-form="foodAdd" style="margin-top:10px"><input id="foodIn" type="text" placeholder="${esc(t("foods.other"))}" autocomplete="off" aria-label="${esc(t("foods.add"))}"><button class="btn" type="submit">+</button></form></div>`;
  }
  if(sub==="allergene"){
    h+=`<p class="muted" style="font-weight:700">${esc(t("al.intro"))}</p><div class="allg">`;
    ALLERGENS.forEach(k=>{const a=S.foods.allergens[k];const st=astate(a);
      h+=`<button class="al" data-act="allergen" data-k="${k}"><b>${esc(alName(k))}</b><span class="pill ${st.cls}">${esc(st.txt)}</span><span class="muted" style="font-size:.8rem;font-weight:700">${esc(a&&a.note?a.note:alHint(k))}</span></button>`});
    h+="</div>";
  }
  if(sub==="meilensteine"){
    const done=S.ms.done||{};const n=MILESTONES.filter(m=>done[m]).length;
    h+=`<div class="card"><h2>${esc(t("ms.count",{n,total:MILESTONES.length}))}</h2><p class="muted" style="font-weight:700">${esc(t("ms.pace"))}</p></div>`;
    MILESTONES.forEach(k=>{const dte=done[k];
      h+=`<button class="ms" data-act="milestone" data-k="${k}"><svg class="star" viewBox="0 0 40 40"><path d="M20 3l4.9 10.4 11.4 1.3-8.5 7.8 2.3 11.3L20 28.2 9.9 33.8l2.3-11.3-8.5-7.8 11.4-1.3Z" fill="${dte?v("--sun"):v("--bg")}" stroke="${dte?v("--sun"):v("--line")}" stroke-width="2.5" stroke-linejoin="round"/></svg><span class="tx"><b>${esc(msL(k))}</b><small>${esc(dte?t("ms.on",{d:dd(dte,{day:"numeric",month:"long"})}):t("ms.notYet"))}</small></span></button>`});
  }
  return h+"</div>";
}
function astate(a){
  if(!a||!a.date)return {cls:"",txt:t("al.not")};
  if(a.s==="react")return {cls:"react",txt:t("al.react")};
  if(a.s==="ok")return {cls:"ok",txt:t("al.ok")};
  const until=shift(a.date,3);
  if(todayISO()<=until)return {cls:"watch",txt:t("al.watchUntil",{d:short(until)})};
  return {cls:"watch",txt:t("al.since",{d:short(a.date)})};
}

function vTipps(){
  const tips=L.tips||I18N.de.tips;
  return `<div class="stack"><div><h2>${esc(t("tips.title"))}</h2><p class="muted" style="font-weight:700">${esc(t("tips.intro"))}</p></div>
  ${tips.map(([ti,body],i)=>{const [e,bg]=TIP_STYLE[i]||["💡","--sun-soft"];return `<details class="tip" ${i===0?"open":""}><summary><span class="ti" style="background:${v(bg)}">${e}</span><h3>${esc(ti)}</h3></summary><div class="bd">${body}</div></details>`}).join("")}</div>`;
}

// ================= sheets =================
function openSheet(html){$("sheet").innerHTML='<div class="grab"></div>'+html;$("sheetwrap").hidden=false;document.body.style.overflow="hidden"}
function closeSheet(){$("sheetwrap").hidden=true;document.body.style.overflow=""}

let F={};
function entrySheet(entry,pre){
  const h=new Date().getHours();
  F={id:entry?entry.id:null,amount:entry?entry.amount:2,mood:entry?(entry.mood||"ok"):"lecker",groups:new Set(entry?(entry.groups||[]):(pre&&pre.groups)||[]),arm:false};
  const meal=entry?entry.meal:(pre&&pre.meal)||(h<10?"Frühstück":h<12?"Vormittag":h<15?"Mittag":h<17?"Nachmittag":"Abend");
  const opts=MEALS.includes(meal)?MEALS:[...MEALS,meal];
  openSheet(`<form class="stack" data-form="entry">
    <h2>${esc(entry?t("en.edit"):t("en.new"))}</h2>
    <div class="two"><label class="f">${esc(t("en.time"))}<input type="time" id="fTime" value="${esc(entry?entry.time:nowHM())}" required></label>
      <label class="f">${esc(t("en.meal"))}<select id="fMeal">${opts.map(m=>`<option value="${esc(m)}" ${m===meal?"selected":""}>${esc(mealL(m))}</option>`).join("")}</select></label></div>
    <label class="f">${esc(t("en.food"))}<input type="text" id="fFoods" value="${esc(entry?entry.foods:(pre&&pre.foods)||"")}" placeholder="${esc(t("en.foodPh"))}" autocomplete="off" required></label>
    <div class="flab">${esc(t("en.howMuch"))}</div>
    <div class="seg" data-seg="amount">${[0,1,2,3].map(i=>`<button type="button" data-v="${i}" aria-pressed="${F.amount===i}"><span class="amt">${[0,1,2,3].map(j=>`<i class="${j<=i?"f":""}"></i>`).join("")}</span>${esc(amtL(i))}</button>`).join("")}</div>
    <div class="flab">${esc(t("en.taste"))}</div>
    <div class="seg" data-seg="mood">${MOODS.map(m=>`<button type="button" data-v="${m[0]}" aria-pressed="${F.mood===m[0]}"><span class="e">${m[1]}</span>${esc(moodL(m[0]))}</button>`).join("")}</div>
    <div class="flab">${esc(t("en.groups"))}</div>
    <div class="row" data-seg="groups">${GROUPS.map(([k])=>`<button type="button" class="chip" data-v="${k}" aria-pressed="${F.groups.has(k)}">${esc(gl(k))}</button>`).join("")}</div>
    <label class="f">${esc(t("en.note"))}<textarea id="fNote" placeholder="${esc(t("en.notePh"))}">${esc(entry?entry.note:"")}</textarea></label>
    <div class="row"><button class="btn" type="submit">${esc(t("btn.save"))}</button><button class="btn ghost" type="button" data-act="closeSheet">${esc(t("btn.cancel"))}</button>${entry?`<button class="link" type="button" data-act="delEntry" ${ROW_RED()}>${esc(t("btn.delete"))}</button>`:""}</div>
  </form>`);
}
function recipeSheet(id){
  const r=getRecipe(id);if(!r)return;F={};
  const missingAl=(r.al||[]).filter(a=>!(S.foods.allergens[a]&&S.foods.allergens[a].date));
  openSheet(`<div class="stack rd">
    <div class="hero" style="background:${v("--"+r.c+"-soft")}">${foodArt(r.c)}</div>
    <div class="spread"><div style="min-width:0"><h2>${esc(r.n)}</h2><div class="muted" style="font-weight:800">${esc(recTime(r))}</div></div>
      <button class="round" data-act="fav" data-id="${esc(r.id)}" aria-pressed="${isFav(r.id)}" aria-label="${esc(t("rs.fav"))}"><span style="font-size:1.2rem;color:${v("--berry")}">${isFav(r.id)?"♥":"♡"}</span></button></div>
    <div>${r.iron?`<span class="tag iron">${esc(t("tag.iron"))}</span>`:""}${(r.cat||[]).map(c=>`<span class="tag">${esc(mealL(c))}</span>`).join("")}${(r.al||[]).map(a=>`<span class="tag warn">${esc(t("rs.contains",{x:alName(a)}))}</span>`).join("")}</div>
    ${missingAl.length?`<div class="hint">${t("rs.notIntroduced",{x:esc(missingAl.map(alName).join(", "))})}</div>`:""}
    <div><div class="eyebrow">${esc(t("rs.ing"))}</div><ul>${(r.ing||[]).map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div>
    <div><div class="eyebrow">${esc(t("rs.steps"))}</div><ol>${(r.st||[]).map(x=>`<li>${esc(x)}</li>`).join("")}</ol></div>
    ${r.tip?`<div class="hint" style="background:${v("--mint-soft")}">💡 ${esc(r.tip)}</div>`:""}
    <div class="row"><button class="btn" data-act="logRecipe" data-id="${esc(r.id)}">${esc(t("rs.logToday"))}</button><button class="btn ghost" data-act="planRecipe" data-id="${esc(r.id)}">${esc(t("rs.plan"))}</button>${r.own?`<button class="link" data-act="delRecipe" data-id="${esc(r.id)}" ${ROW_RED()}>${esc(t("btn.delete"))}</button>`:""}</div>
  </div>`);
}
function planRecipeSheet(id){
  const td=todayISO();F={pid:id,d:td,k:"M"};
  const r=getRecipe(id);
  if((r.cat||[]).includes("Frühstück")&&!(r.cat||[]).includes("Mittag"))F.k="F";
  openSheet(`<div class="stack"><h2>${esc(t("pl.title",{x:r.n}))}</h2>
    <div class="flab">${esc(t("pl.day"))}</div><div class="pickgrid" data-pick="d">${[...Array(7)].map((_,i)=>{const x=shift(td,i);return `<button data-v="${x}" aria-pressed="${x===F.d}">${esc(i===0?t("day.today"):wd(x))}<br><span class="muted">${short(x)}</span></button>`}).join("")}</div>
    <div class="flab">${esc(t("pl.meal"))}</div><div class="pickgrid" data-pick="k">${SLOTS.map(([k,meal])=>`<button data-v="${k}" aria-pressed="${k===F.k}">${esc(mealL(meal))}</button>`).join("")}</div>
    <button class="btn" data-act="planSave">${esc(t("pl.save"))}</button></div>`);
}
function slotSheet(d,k){
  F={d,k};const cur=(S.plan.slots[d]||{})[k];
  const meal=SLOTS.find(s=>s[0]===k)[1];
  const list=allRecipes().sort((a,b)=>(isFav(b.id)-isFav(a.id))||((b.cat||[]).includes(meal)-(a.cat||[]).includes(meal)));
  openSheet(`<div class="stack"><h2>${esc(mealL(meal))}, ${esc(d===todayISO()?t("sl.today"):dd(d,{weekday:"long"}))}</h2>
    <div class="plist">${list.map(r=>`<button data-act="slotSet" data-id="${esc(r.id)}" ${r.id===cur?`style="border-color:${v("--mint")};background:${v("--mint-soft")}"`:""}><span>${isFav(r.id)?'<span style="color:'+v("--berry")+'">♥</span> ':""}${esc(r.n)}</span><span class="muted" style="font-size:.8rem">${r.iron?esc(t("tag.iron")):""}</span></button>`).join("")}</div>
    ${cur?`<button class="btn ghost" data-act="slotSet" data-id="">${esc(t("sl.clear"))}</button>`:""}</div>`);
}
function foodSheet(name){
  const key=findItem(name),it=key&&S.foods.items[key];
  F={name:key||name};
  openSheet(`<div class="stack"><h2>${esc(F.name)}</h2>
    <p class="muted" style="font-weight:700">${esc(it?t("fs.first",{d:dd(it.first,{day:"numeric",month:"long"})}):t("fs.notYet"))}</p>
    <div class="seg" style="grid-template-columns:repeat(3,1fr)">${[["like","fs.like"],["meh","fs.meh"],["no","fs.no"]].map(([k,l])=>`<button data-act="foodSet" data-r="${k}" aria-pressed="${!!it&&it.r===k}"><span class="e">${RE_EMO[k]}</span>${esc(t(l))}</button>`).join("")}</div>
    <p class="muted" style="font-size:.88rem">${esc(t("fs.retry"))}</p>
    <div class="row">${it?"":`<button class="btn mint" data-act="foodSet" data-r="">${esc(t("fs.triedToday"))}</button>`}${it?`<button class="link" data-act="foodDel" style="color:${v("--berry")}">${esc(t("fs.untry"))}</button>`:""}</div></div>`);
}
function allergenSheet(k){
  const a=S.foods.allergens[k]||{};
  F={k};
  openSheet(`<div class="stack"><h2>${esc(alName(k))}</h2><p class="muted" style="font-weight:700">${esc(a.date?t("fs.first",{d:dd(a.date,{day:"numeric",month:"long"})}):t("as.idea",{x:alHint(k)}))}</p>
    <div class="plist">
      <button data-act="alSet" data-s="watch">${esc(t("as.today"))}<span>🍽️</span></button>
      <button data-act="alSet" data-s="ok">${esc(t("as.ok"))}<span>✓</span></button>
      <button data-act="alSet" data-s="react">${esc(t("as.react"))}<span>⚠️</span></button>
    </div>
    <label class="f">${esc(t("en.note"))}<textarea id="alNote" placeholder="${esc(t("as.notePh"))}">${esc(a.note||"")}</textarea></label>
    <div class="row"><button class="btn small ghost" data-act="alNote">${esc(t("as.saveNote"))}</button>${a.date?`<button class="link" data-act="alReset" ${ROW_RED()}>${esc(t("as.reset"))}</button>`:""}</div>
    <p class="muted" style="font-size:.85rem">${esc(t("as.emergency"))}</p></div>`);
}
function milestoneSheet(k){
  const d=(S.ms.done||{})[k];F={k};
  openSheet(`<div class="stack"><h2>${esc(msL(k))}</h2><label class="f">${esc(t("msh.when"))}<input type="date" id="msDate" value="${esc(d||todayISO())}" max="${todayISO()}"></label>
    <div class="row"><button class="btn" data-act="msSave">${esc(t("msh.done"))}</button>${d?`<button class="link" data-act="msDel" ${ROW_RED()}>${esc(t("msh.remove"))}</button>`:""}</div></div>`);
}
function recipeFormSheet(){
  F={groups:new Set(),cats:new Set()};
  openSheet(`<form class="stack" data-form="recipe"><h2>${esc(t("rf.title"))}</h2>
    <label class="f">${esc(t("rf.name"))}<input type="text" id="rName" required autocomplete="off" placeholder="${esc(t("rf.namePh"))}"></label>
    <label class="f">${esc(t("rf.time"))}<input type="text" id="rTime" placeholder="${esc(t("rf.timePh"))}" autocomplete="off"></label>
    <label class="f">${esc(t("rf.ing"))}<textarea id="rIng" rows="4"></textarea></label>
    <label class="f">${esc(t("rf.steps"))}<textarea id="rSt" rows="4"></textarea></label>
    <div class="flab">${esc(t("rf.fits"))}</div><div class="row" data-seg="cats">${["Frühstück","Mittag","Abend","Snack"].map(c=>`<button type="button" class="chip" data-v="${c}" aria-pressed="false">${esc(mealL(c))}</button>`).join("")}</div>
    <div class="flab">${esc(t("rf.contains"))}</div><div class="row" data-seg="groups">${GROUPS.map(([k])=>`<button type="button" class="chip" data-v="${k}" aria-pressed="false">${esc(gl(k))}</button>`).join("")}</div>
    <label class="f">${esc(t("rf.tip"))}<input type="text" id="rTip" autocomplete="off"></label>
    <div class="row"><button class="btn" type="submit">${esc(t("btn.save"))}</button><button class="btn ghost" type="button" data-act="closeSheet">${esc(t("btn.cancel"))}</button></div></form>`);
}
function settingsSheet(){
  F={wipe:0};
  const cur=S.prefs.lang||"";
  openSheet(`<form class="stack" data-form="settings"><h2>${esc(t("st.title"))}</h2>
    <label class="f">${esc(t("st.name"))}<input type="text" id="sName" value="${esc(S.prefs.name)}" autocomplete="off" placeholder="${esc(t("st.namePh"))}"></label>
    <label class="f">${esc(t("st.birth"))}<input type="date" id="sBirth" value="${esc(S.prefs.birth)}" max="${todayISO()}"></label>
    <label class="f">${esc(t("st.lang"))}<select id="sLang"><option value="" ${cur===""?"selected":""}>${esc(t("st.langAuto"))}</option>${LANGS.map(l=>`<option value="${l}" ${cur===l?"selected":""}>${esc(I18N[l]?I18N[l].name:l)}</option>`).join("")}</select></label>
    <button class="btn" type="submit">${esc(t("btn.save"))}</button>
    <div class="card stack" style="gap:8px;box-shadow:none"><h3>${esc(t("st.privTitle"))}</h3><p class="muted" style="font-size:.9rem">${esc(t("st.privText"))}</p>
      <p class="muted" style="font-size:.9rem">${esc(t("st.backupText"))}</p>
      <div class="row"><button class="btn small" type="button" data-act="backupOut">${esc(t("st.backupOut"))}</button><button class="btn ghost small" type="button" data-act="backupIn">${esc(t("st.backupIn"))}</button></div></div>
    <div class="card stack" style="gap:8px;box-shadow:none"><h3>${esc(t("st.exportTitle"))}</h3><p class="muted" style="font-size:.9rem">${esc(t("st.exportText"))}</p><button class="btn ghost small" type="button" data-act="export">${esc(t("st.export"))}</button></div>
    <div class="danger-zone"><h3>${esc(t("st.wipeTitle"))}</h3><p class="muted" style="font-size:.9rem">${esc(t("st.wipeText"))}</p><button class="btn danger small" type="button" data-act="wipe">${esc(t("st.wipe"))}</button></div>
    <div class="row" style="justify-content:center;gap:4px"><button class="link" type="button" data-act="privacy">${esc(t("st.privacy"))}</button><span class="muted">·</span><button class="link" type="button" data-act="about">${esc(t("st.about"))}</button></div>
    <p class="muted" style="font-size:.8rem;text-align:center">${esc(t("app.name"))} ${APP_VERSION}</p>
  </form>`);
}
function welcomeSheet(){
  const cur=S.prefs.lang||"";
  openSheet(`<form class="stack welcome" data-form="welcome">
    <div class="hero">${document.querySelector(".mascot").outerHTML.replace('class="mascot"','')}</div>
    <h2>${esc(t("wl.title"))}</h2>
    <p>${esc(t("wl.text"))}</p>
    <div class="facts">
      <div class="fact"><span style="background:${v("--mint-soft")}">🔒</span><div>${t("wl.private")}</div></div>
      <div class="fact"><span style="background:${v("--sun-soft")}">🩺</span><div>${t("wl.medical")}</div></div>
    </div>
    <label class="f">${esc(t("st.lang"))}<select id="wLang">${LANGS.map(l=>`<option value="${l}" ${(cur||LANG)===l?"selected":""}>${esc(I18N[l]?I18N[l].name:l)}</option>`).join("")}</select></label>
    <label class="f">${esc(t("wl.name"))}<input type="text" id="wName" autocomplete="off" placeholder="${esc(t("wl.namePh"))}"></label>
    <label class="f">${esc(t("wl.birth"))}<input type="date" id="wBirth" max="${todayISO()}"></label>
    <button class="btn wide" type="submit">${esc(t("wl.go"))}</button>
  </form>`);
}
function privacySheet(){
  openSheet(`<div class="stack legal"><h2>${esc(t("pv.title"))}</h2>${t("pv.html")}
    <button class="btn ghost small" data-act="openUrl" data-url="${esc(PRIVACY_BASE+(L.privacy||"privacy.html"))}">${esc(t("pv.full"))}</button></div>`);
}
function aboutSheet(){
  openSheet(`<div class="stack legal"><h2>${esc(t("ab.title"))}</h2>${t("ab.html")}
    <h3>${esc(t("ab.contact"))}</h3><p>${esc(CONTACT_MAIL)}</p>
    <h3>${esc(t("ab.fonts"))}</h3><p class="muted">${esc(t("ab.fontsText"))}</p>
    <p class="muted">${esc(t("ab.version",{v:APP_VERSION}))}</p></div>`);
}

// ================= actions =================
const ACT={
  tab:el=>{S.tab=el.dataset.v;render();scrollTo(0,0)},
  sub:el=>{S.sub[el.dataset.t]=el.dataset.s;render()},
  day:el=>{const n=shift(S.day,+el.dataset.n);if(n<=todayISO()){S.day=n;render()}},
  week:el=>{const n=shift(S.weekEnd,+el.dataset.n);S.weekEnd=n>todayISO()?todayISO():n;render()},
  plus:el=>{const k=el.dataset.k,d=day(S.day);
    if(k==="still")saveDay(S.day,{still:[...d.still,S.day===todayISO()?nowHM():"--:--"].sort()});
    else saveDay(S.day,{[k]:d[k]+1});
    render();toast(k==="still"?t("toast.milk"):t("toast.diaper"))},
  minus:el=>{const k=el.dataset.k,d=day(S.day);
    if(k==="still"){if(!d.still.length)return;saveDay(S.day,{still:d.still.slice(0,-1)})}
    else{if(!d[k])return;saveDay(S.day,{[k]:d[k]-1})}
    render()},
  water:()=>{saveDay(S.day,{water:!day(S.day).water});render()},
  newEntry:()=>entrySheet(null),
  editEntry:el=>{const e=day(S.day).entries.find(x=>x.id===el.dataset.id);if(e)entrySheet(e)},
  delEntry:el=>{if(!F.arm){F.arm=true;el.textContent=t("btn.reallyDelete");return}
    saveDay(S.day,{entries:day(S.day).entries.filter(x=>x.id!==F.id)});closeSheet();render();toast(t("toast.deleted"))},
  nextIdea:()=>{S.ideaSeed++;render()},
  recipe:el=>recipeSheet(el.dataset.id),
  fav:el=>{const id=el.dataset.id,f=new Set(S.prefs.favs||[]);f.has(id)?f.delete(id):f.add(id);S.prefs=Object.assign({},S.prefs,{favs:[...f]});savePrefs();recipeSheet(id);render()},
  logRecipe:el=>{const r=getRecipe(el.dataset.id);closeSheet();S.tab="heute";S.day=todayISO();render();
    entrySheet(null,{foods:r.n,groups:groupsOf(r),meal:el.dataset.meal})},
  planRecipe:el=>planRecipeSheet(el.dataset.id),
  planSave:()=>{const s=Object.assign({},S.plan.slots);s[F.d]=Object.assign({},s[F.d]||{},{[F.k]:F.pid});S.plan={slots:s};savePlan();closeSheet();render();toast(t("toast.planned"))},
  pickSlot:el=>slotSheet(el.dataset.d,el.dataset.k),
  slotSet:el=>{const s=Object.assign({},S.plan.slots);const p=Object.assign({},s[F.d]||{});if(el.dataset.id)p[F.k]=el.dataset.id;else delete p[F.k];s[F.d]=p;S.plan={slots:s};savePlan();closeSheet();render()},
  planToShop:()=>{const td=todayISO(),items=[...(S.shop.items||[])],have=new Set(items.map(i=>i.t.toLowerCase()));let n=0;
    for(let i=0;i<7;i++){const p=S.plan.slots[shift(td,i)]||{};Object.values(p).forEach(id=>{const r=getRecipe(id);((r&&r.ing)||[]).forEach(x=>{if(!have.has(x.toLowerCase())){items.push({id:"s"+Date.now().toString(36)+n,t:x,done:false});have.add(x.toLowerCase());n++}})})}
    if(!n){toast(t("toast.planEmpty"));return}
    S.shop={items};saveShop();S.sub.rezepte="einkauf";render();toast(t("toast.ingAdded",{n}))},
  shopToggle:el=>{S.shop={items:S.shop.items.map(i=>i.id===el.dataset.id?Object.assign({},i,{done:!i.done}):i)};saveShop();render()},
  shopClear:()=>{S.shop={items:S.shop.items.filter(i=>!i.done)};saveShop();render()},
  filter:el=>{S.filter=el.dataset.f;render()},
  newRecipe:()=>recipeFormSheet(),
  delRecipe:el=>{if(!F.armR){F.armR=true;el.textContent=t("btn.reallyDelete");return}const id=el.dataset.id;delete S.mine[id];del("myrecipes/"+id);closeSheet();render();toast(t("toast.recipeDeleted"))},
  food:el=>foodSheet(el.dataset.n),
  foodSet:el=>{const items=Object.assign({},S.foods.items),k=findItem(F.name)||F.name;const was=!!items[k];items[k]={first:(items[k]&&items[k].first)||todayISO(),r:el.dataset.r};S.foods=Object.assign({},S.foods,{items});saveFoods();closeSheet();render();if(!was){confetti();toast(t("toast.newFood",{x:k}))}},
  foodDel:()=>{const items=Object.assign({},S.foods.items);delete items[findItem(F.name)];S.foods=Object.assign({},S.foods,{items});saveFoods();closeSheet();render()},
  allergen:el=>allergenSheet(el.dataset.k),
  alSet:el=>{const al=Object.assign({},S.foods.allergens),cur=al[F.k]||{};const s=el.dataset.s;
    al[F.k]=Object.assign({},cur,{date:s==="watch"?todayISO():(cur.date||todayISO()),s,note:($("alNote")||{}).value||cur.note||""});
    const isNew=!cur.date;S.foods=Object.assign({},S.foods,{allergens:al});saveFoods();closeSheet();render();if(isNew&&s!=="react")confetti()},
  alNote:()=>{const al=Object.assign({},S.foods.allergens),cur=al[F.k]||{};al[F.k]=Object.assign({},cur,{note:$("alNote").value.trim()});S.foods=Object.assign({},S.foods,{allergens:al});saveFoods();closeSheet();render();toast(t("toast.noteSaved"))},
  alReset:()=>{const al=Object.assign({},S.foods.allergens);delete al[F.k];S.foods=Object.assign({},S.foods,{allergens:al});saveFoods();closeSheet();render()},
  milestone:el=>milestoneSheet(el.dataset.k),
  msSave:()=>{const done=Object.assign({},S.ms.done||{});const was=!!done[F.k];done[F.k]=$("msDate").value||todayISO();S.ms={done};saveMs();closeSheet();render();if(!was)confetti()},
  msDel:()=>{const done=Object.assign({},S.ms.done||{});delete done[F.k];S.ms={done};saveMs();closeSheet();render()},
  settings:()=>settingsSheet(),
  export:async()=>{
    const q=x=>'"'+String(x==null?"":x).replace(/"/g,'""')+'"';
    const rows=[L.csv||I18N.de.csv];
    Object.keys(S.days).sort().forEach(k=>{const d=day(k);const base=[d.still.length,d.nass,d.voll];
      if(!d.entries.length)rows.push([k,"","","","","","","",...base]);
      [...d.entries].sort((a,b)=>a.time.localeCompare(b.time)).forEach(e=>rows.push([k,e.time,mealL(e.meal),e.foods,amtL(e.amount),moodL(e.mood),(e.groups||[]).map(gl).join(", "),e.note,...base]))});
    const csv="﻿"+rows.map(r=>r.map(q).join(";")).join("\r\n");
    try{await native("ShareText",[t("csv.file")+"-"+todayISO()+".csv",csv,t("share.diary")])}
    catch(e){toast(t("toast.exportFail"))}},
  backupOut:async()=>{
    try{await native("ShareText",[t("backup.file")+"-"+todayISO()+".json",JSON.stringify({app:"kleine-happen",version:1,exported:new Date().toISOString(),docs:allDocs()}),t("share.backup")])}
    catch(e){toast(t("toast.backupFail"))}},
  backupIn:async()=>{
    let raw="";
    try{raw=await native("PickText",[])}catch(e){toast(t("toast.readFail"));return}
    if(!raw)return;
    let b;try{b=JSON.parse(raw)}catch(e){toast(t("toast.notBackup"));return}
    if(!b||b.app!=="kleine-happen"||typeof b.docs!=="object"){toast(t("toast.notBackup"));return}
    const n=mergeDocs(b.docs);applyLang();closeSheet();render();confetti();toast(n?t("toast.backupIn"):t("toast.backupSame"))},
  privacy:()=>privacySheet(),
  about:()=>aboutSheet(),
  openUrl:async el=>{try{await native("OpenUrl",[el.dataset.url])}catch(e){toast(t("toast.linkFail"))}},
  wipe:async el=>{
    if(!F.wipe){F.wipe=1;el.textContent=t("st.wipeConfirm");return}
    try{await chain;await native("DeleteAll",[])}catch(e){toast(t("toast.wipeFail"));return}
    applyDocs({});S.foods={items:{},allergens:{}};S.prefs={name:"",birth:"",favs:[],onboarded:false,lang:""};S.plan={slots:{}};S.shop={items:[]};S.ms={done:{}};
    applyLang();S.tab="heute";S.day=todayISO();closeSheet();render();toast(t("toast.wiped"));welcomeSheet()},
  closeSheet:()=>closeSheet()
};
document.addEventListener("click",e=>{
  const seg=e.target.closest("[data-seg] > button");
  if(seg){const box=seg.parentElement,k=box.dataset.seg,val=seg.dataset.v;
    if(k==="groups"||k==="cats"){const set=F[k];set.has(val)?set.delete(val):set.add(val);seg.setAttribute("aria-pressed",String(set.has(val)))}
    else{F[k]=k==="amount"?+val:val;[...box.children].forEach(b=>b.setAttribute("aria-pressed",String(b===seg)))}
    return}
  const pk=e.target.closest("[data-pick] > button");
  if(pk){F[pk.parentElement.dataset.pick]=pk.dataset.v;[...pk.parentElement.children].forEach(b=>b.setAttribute("aria-pressed",String(b===pk)));return}
  const el=e.target.closest("[data-act]");if(el&&ACT[el.dataset.act]){e.preventDefault();ACT[el.dataset.act](el,e)}
});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!$("sheetwrap").hidden)closeSheet()});
document.addEventListener("input",e=>{if(e.target.id==="search"){S.q=e.target.value;const pos=e.target.selectionStart;render();const s=$("search");s.focus();s.setSelectionRange(pos,pos)}});
// changing the language in the welcome sheet re-renders it right away
document.addEventListener("change",e=>{if(e.target.id==="wLang"){S.prefs=Object.assign({},S.prefs,{lang:e.target.value});applyLang();render();
  const n=$("wName")?$("wName").value:"",b=$("wBirth")?$("wBirth").value:"";welcomeSheet();$("wName").value=n;$("wBirth").value=b}});
document.addEventListener("submit",e=>{
  const f=e.target.dataset.form;if(!f)return;e.preventDefault();
  if(f==="entry"){
    const foods=$("fFoods").value.trim();if(!foods)return;
    const entry={id:F.id||("e"+Date.now().toString(36)),time:$("fTime").value||nowHM(),meal:$("fMeal").value,foods,amount:F.amount,mood:F.mood,groups:[...F.groups],note:$("fNote").value.trim()};
    const d=day(S.day);
    saveDay(S.day,{entries:F.id?d.entries.map(x=>x.id===F.id?entry:x):[...d.entries,entry]});
    const added=addFoods(splitFoods(foods),S.day);
    closeSheet();render();
    if(added.length){confetti();toast(t("toast.first",{x:added.join(", ")}))}else toast(t("toast.saved"));
  }
  if(f==="shopAdd"){const val=$("shopIn").value.trim();if(!val)return;S.shop={items:[...(S.shop.items||[]),...val.split(",").map((x,i)=>({id:"s"+Date.now().toString(36)+i,t:x.trim(),done:false})).filter(x=>x.t)]};saveShop();render();$("shopIn").focus()}
  if(f==="foodAdd"){const val=$("foodIn").value;const a=addFoods(val.split(","),todayISO());render();if(a.length){confetti();toast(t("toast.newFood",{x:a.join(", ")}))}}
  if(f==="recipe"){
    const n=$("rName").value.trim();if(!n)return;
    const lines=id=>$(id).value.split("\n").map(x=>x.trim()).filter(Boolean);
    const rev=Object.fromEntries(Object.entries(GMAP).map(([a,b])=>[b,a]));
    const id="c_"+Date.now().toString(36);
    const cols=["sun","peach","mint","sky","berry","grape"];
    const r={id,n,t:$("rTime").value.trim(),cat:[...F.cats],g:[...F.groups].map(g=>rev[g]||"").join(""),iron:F.groups.has("eisen")?1:0,al:[],c:cols[n.length%6],ing:lines("rIng"),st:lines("rSt"),tip:$("rTip").value.trim(),own:1};
    S.mine=Object.assign({},S.mine,{[id]:r});write("myrecipes/"+id,r);closeSheet();S.filter="own";render();toast(t("toast.recipeSaved"));
  }
  if(f==="settings"){S.prefs=Object.assign({},S.prefs,{name:$("sName").value.trim(),birth:$("sBirth").value,lang:$("sLang").value});savePrefs();applyLang();closeSheet();render();toast(t("toast.saved"))}
  if(f==="welcome"){S.prefs=Object.assign({},S.prefs,{name:$("wName").value.trim(),birth:$("wBirth").value,onboarded:true});savePrefs();applyLang();closeSheet();render();confetti();toast(S.prefs.name?t("wl.toastName",{name:S.prefs.name}):t("wl.toast"))}
});

// ================= boot =================
function setSync(ok,key){const s=$("sync");s.className="sync"+(ok?" ok":"");s.querySelector("span").textContent=t(key);s.dataset.key=key}
function applyDocs(all){
  const days={},mine={};
  Object.entries(all||{}).forEach(([p,val])=>{
    if(!val||typeof val!=="object")return;
    if(p.startsWith("days/"))days[p.slice(5)]={entries:Array.isArray(val.entries)?val.entries:[],still:Array.isArray(val.still)?val.still:[],nass:+val.nass||0,voll:+val.voll||0,water:!!val.water};
    else if(p.startsWith("myrecipes/")&&val.n)mine[p.slice(10)]=Object.assign({},val,{id:p.slice(10),own:1});
    else if(p==="foods/list")S.foods={items:val.items||{},allergens:val.allergens||{}};
    else if(p==="prefs/main")S.prefs={name:val.name||"",birth:val.birth||"",favs:Array.isArray(val.favs)?val.favs:[],onboarded:!!val.onboarded,lang:LANGS.includes(val.lang)?val.lang:""};
    else if(p==="plan/main")S.plan={slots:val.slots||{}};
    else if(p==="shop/list")S.shop={items:Array.isArray(val.items)?val.items:[]};
    else if(p==="milestones/main")S.ms={done:val.done||{}};
  });
  S.days=days;S.mine=mine;
}
function allDocs(){
  const d={};
  Object.keys(S.days).forEach(k=>d["days/"+k]=day(k));
  Object.values(S.mine).forEach(r=>d["myrecipes/"+r.id]=r);
  d["foods/list"]=S.foods;d["prefs/main"]=S.prefs;d["plan/main"]=S.plan;d["shop/list"]=S.shop;d["milestones/main"]=S.ms;
  return JSON.parse(JSON.stringify(d));
}
// Merge a backup from another phone: nothing local is overwritten, missing things are added.
function mergeDocs(docs){
  let changed=0;
  const saved=JSON.parse(JSON.stringify({foods:S.foods,prefs:S.prefs,plan:S.plan,shop:S.shop,ms:S.ms,days:S.days,mine:S.mine}));
  applyDocs(docs);
  const inc={foods:S.foods,prefs:S.prefs,plan:S.plan,shop:S.shop,ms:S.ms,days:S.days,mine:S.mine};
  Object.assign(S,saved);
  Object.entries(inc.days).forEach(([iso,d])=>{
    const cur=S.days[iso];
    if(!cur){S.days[iso]=d;write("days/"+iso,d);changed++;return}
    const ids=new Set(cur.entries.map(e=>e.id));
    const entries=[...cur.entries,...d.entries.filter(e=>!ids.has(e.id))];
    const still=[...new Set([...cur.still,...d.still])].sort();
    const next={entries,still,nass:Math.max(cur.nass,d.nass),voll:Math.max(cur.voll,d.voll),water:cur.water||d.water};
    if(JSON.stringify(next)!==JSON.stringify(cur)){S.days[iso]=next;write("days/"+iso,next);changed++}
  });
  const items=Object.assign({},S.foods.items);let fc=false;
  Object.entries(inc.foods.items).forEach(([n,val])=>{const k=findItem(n);
    if(!k){items[n]=val;fc=true}
    else{const c=items[k];const first=val.first&&val.first<c.first?val.first:c.first;const r=c.r||val.r||"";if(first!==c.first||r!==c.r){items[k]={first,r};fc=true}}});
  const al=Object.assign({},S.foods.allergens);
  Object.entries(inc.foods.allergens).forEach(([k,val])=>{if(!al[k]||!al[k].date){al[k]=val;fc=true}});
  if(fc){S.foods={items,allergens:al};saveFoods();changed++}
  const favs=[...new Set([...(S.prefs.favs||[]),...(inc.prefs.favs||[])])];
  const np={name:S.prefs.name||inc.prefs.name,birth:S.prefs.birth||inc.prefs.birth,favs,onboarded:true,lang:S.prefs.lang||inc.prefs.lang||""};
  if(JSON.stringify(np)!==JSON.stringify(S.prefs)){S.prefs=np;savePrefs();changed++}
  const slots=Object.assign({},S.plan.slots);let pc=false;
  Object.entries(inc.plan.slots).forEach(([d,p])=>{const cur=Object.assign({},slots[d]||{});Object.entries(p||{}).forEach(([k,id])=>{if(id&&!cur[k]){cur[k]=id;pc=true}});slots[d]=cur});
  if(pc){S.plan={slots};savePlan();changed++}
  const sid=new Set(S.shop.items.map(i=>i.id));const add=inc.shop.items.filter(i=>!sid.has(i.id));
  if(add.length){S.shop={items:[...S.shop.items,...add]};saveShop();changed++}
  const done=Object.assign({},S.ms.done);let mc=false;
  Object.entries(inc.ms.done).forEach(([k,d])=>{if(!done[k]||d<done[k]){done[k]=d;mc=true}});
  if(mc){S.ms={done};saveMs();changed++}
  Object.values(inc.mine).forEach(r=>{if(!S.mine[r.id]){S.mine=Object.assign({},S.mine,{[r.id]:r});write("myrecipes/"+r.id,r);changed++}});
  return changed;
}
// Android back button: close the sheet, then go back to "Heute", otherwise let the app go to the background.
window.appBack=function(){
  if(!$("sheetwrap").hidden){closeSheet();return true}
  if(S.tab!=="heute"){S.tab="heute";render();scrollTo(0,0);return true}
  return false;
};

applyLang();
render();
setSync(false,"sync.loading");
(async function boot(){
  try{
    const raw=await native("LoadAll",[]);
    const all=typeof raw==="string"?JSON.parse(raw||"{}"):(raw||{});
    applyDocs(all);live=true;applyLang();setSync(true,"sync.private");render();
    if(!S.prefs.onboarded&&!Object.keys(S.days).length)welcomeSheet();
  }catch(e){
    setSync(false,"sync.error");notice(t("err.load"));
  }
})();
})();
