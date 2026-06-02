import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Play, RotateCcw, Trophy, Sparkles, Volume2, VolumeX, 
  Heart, AlertTriangle, CheckCircle, Flame, Star, Award, Zap, ChevronRight, HelpCircle,
  Brain, Clock, Hammer, Database, ShieldAlert, Users
} from 'lucide-react';

interface Option {
  text: string;
  score: number;
  feedback: string;
  type: 'best' | 'neutral' | 'weak' | 'fail';
}

interface Objection {
  text: string;
  options: Option[];
}

interface Customer {
  name: string;
  role: string;
  avatar: string;
  difficulty: 'Junior' | 'Senior' | 'Expert/Hardcore';
  difficultyColor: string;
  desc: string;
  objections: Objection[];
}

interface LeaderboardEntry {
  name: string;
  score: number;
  date: string;
}

const CUSTOMERS: Customer[] = [
  {
    name: "Jana Nováková",
    role: "Mladá novomanželka",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    difficulty: "Junior",
    difficultyColor: "text-emerald-400 bg-emerald-950/50 border-emerald-800",
    desc: "Snaží se ušetřit na bytu po rekonstrukci. Nesnáší jakoukoliv špínu a vrtání.",
    objections: [
      {
        text: "Sítě do oken? V supermarketu je přece koupím za stovku a nalepím je na suchý zip za 5 minut sama.",
        options: [
          {
            text: "Chápu snahu ušetřit. Lepené sítě se ale po prvním létě odlepí, propouští komáry v rozích a lepidlo navždy poškodí lak oken. Naše hliníkové sítě se montují bez vrtání na klipy a vydrží 15 let.",
            score: 25000,
            feedback: "Perfektní argumentace na hodnotu! Zákaznice uznává kvalitu bez vrtání.",
            type: "best"
          },
          {
            text: "Naše sítě jsou z hliníkového profilu, takže vypadají luxusněji a nelétají přes ně otravné mouchy.",
            score: 10000,
            feedback: "Zákaznice poslouchá, ale cena jí pořád trochu vrtá hlavou.",
            type: "neutral"
          },
          {
            text: "Pokud si koupíte levný šmejd z hobbymarketu, brzy si domů nanesete leda tak ostudu a hmyz.",
            score: 0,
            feedback: "To bylo příliš úsečné. Zákaznice je uražená a pokládá telefon!",
            type: "fail"
          }
        ]
      },
      {
        text: "Mám strach, že mi technik při seřizování oken pošpiní nové bílé koberce.",
        options: [
          {
            text: "Vaše čistota je pro nás priorita. Technici Q-Hubu vždy nosí čisté ochranné návleky a po práci po sobě plně uklidí. Navíc seřízení oken nevyžaduje žádné vrtání, takže nevznikne vůbec žádný prach.",
            score: 30000,
            feedback: "Uklidnil jste její největší obavu! Zakázka je kompletně podepsána.",
            type: "best"
          },
          {
            text: "Nebojte se, koberce se dají vždycky vyluxovat a kluci z technického jsou na čistotu celkem zvyklí.",
            score: 10000,
            feedback: "Zákaznice stále trochu váhá a raději si koberec sama zakryje starými novinami.",
            type: "neutral"
          },
          {
            text: "Trocha prachu přece k řemeslu patří, s tím musíte v bytě při servisu prostě počítat.",
            score: 0,
            feedback: "To ji vyděsilo! Ruší celou poptávku a vyhazuje vás z bytu.",
            type: "fail"
          }
        ]
      }
    ]
  },
  {
    name: "Karel Dvořák",
    role: "Šetřivý penzista",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    difficulty: "Junior",
    difficultyColor: "text-emerald-400 bg-emerald-950/50 border-emerald-800",
    desc: "Všechno si dělá sám, o všem pochybuje. Rád si povídá a slyší na úsporu nákladů za topení.",
    objections: [
      {
        text: "Okna máme jen 4 roky, jdou otevírat úplně lehce. Proč bych vám měl platit za seřízení a mazání?",
        options: [
          {
            text: "Rozumím vám, pane Dvořáku. Ale právě u novějších oken v kování nepozorovaně sedimentuje jemný prach a vysychá vazelína. Pokud mechaniku včas nepromažeme, začne drhnout a za rok budete měnit celou převodovku za desetinásobek ceny.",
            score: 35000,
            feedback: "Výborné vysvětlení prevence! Karel oceňuje logické technické vysvětlení.",
            type: "best"
          },
          {
            text: "Servis se má prostě dělat každý rok, vyžadují to záruční listy od českých výrobců oken.",
            score: 12000,
            feedback: "Papíry ho moc nezajímají, záruku už na oknech stejně nejspíš nemá.",
            type: "neutral"
          },
          {
            text: "To si jen myslíte, že jdou lehce. Když okna neuděláme, brzy vám vypadnou z pantu přímo na nohu!",
            score: 0,
            feedback: "Karel se naštval, že z něj děláte nesvéprávného hlupáka.",
            type: "fail"
          }
        ]
      },
      {
        text: "Na těsnění mi stačí obyčejná indulona nebo WD-40 z garáže, nebudu měnit celé profily u vás.",
        options: [
          {
            text: "Olej gumu krátce oživí, ale chemicky ji naleptá a urychlí rozpad. Naše nové EPDM těsnění vám sníží únik tepla až o 15 %, takže se vám investice vrátí už za tuhle zimu na účtech za vytápění.",
            score: 40000,
            feedback: "Skvělé! Přesný výpočet úspory na topení je pro Karla nejsilnější argument.",
            type: "best"
          },
          {
            text: "Chemické přípravky nepomohou, guma po letech prostě stárne a vymačkává se pod tlakem.",
            score: 15000,
            feedback: "Karel váhá, ale uznává, že na tom něco pravdy o věku materiálu bude.",
            type: "neutral"
          },
          {
            text: "To je omyl, indulonou to kování a těsnění akorát zničíte a začne vám plísnět celý okenní rám!",
            score: 0,
            feedback: "Karel se urazil a tvrdí, že indulonou maže všechno 40 let a funguje to.",
            type: "fail"
          }
        ]
      }
    ]
  },
  {
    name: "Ing. Martin Polák",
    role: "Náročný manažer v IT",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    difficulty: "Senior",
    difficultyColor: "text-indigo-400 bg-indigo-950/50 border-indigo-900",
    desc: "Bydlí v novostavbě. Požaduje moderní technologie, statistiky, čísla a perfektní spolehlivost.",
    objections: [
      {
        text: "Venkovní žaluzie jsou jen předražený rozmar. Úplně mi stačí vnitřní látkové zatemňovací závěsy.",
        options: [
          {
            text: "Vnitřní závěsy sice zachytí světlo, ale teplo už skrz sklo proniklo do interiéru a závěsy fungují jako radiátor. Venkovní žaluzie odrazí až 90 % sluneční energie ještě před oknem, čímž ušetříte tisíce za provoz klimatizace.",
            score: 75000,
            feedback: "Fyzikální a finanční argument! Manažer slyší na energetický audit.",
            type: "best"
          },
          {
            text: "Závěsy chytají prach, špatně se čistí a venkovní stínění dodává domu mnohem modernější vzhled.",
            score: 30000,
            feedback: "Estetický argument ho částečně oslovil, ale investice je pro něj stále moc vysoko.",
            type: "neutral"
          },
          {
            text: "Naše venkovní žaluzie mají dálkové ovládání a dají se plně integrovat s vaší chytrou domácností.",
            score: 20000,
            feedback: "Zajímavá technická vychytávka, ale stále postrádá hlavní finanční důvod.",
            type: "weak"
          },
          {
            text: "Pokud si dáte jen závěsy, budete mít doma v srpnu horko jako v sauně a žaluzie stejně koupíte dodatečně.",
            score: 0,
            feedback: "Arogantní tón odradil tohoto racionálního klienta. Ukončuje hovor.",
            type: "fail"
          }
        ]
      },
      {
        text: "Konkurence mi automaticky dává slevu 25 % z ceníku. Vaše konečná nabídka se mi zdá předražená.",
        options: [
          {
            text: "Chápu srovnání. Mnoho firem ale schválně základní ceník uměle navýší, aby mohly ohromit 'obří' slevou. My v Q-Hubu sázíme na férové ceny od začátku bez skrytých příplatků a s garancí německé kvality kování.",
            score: 85000,
            feedback: "Férová argumentace! Transparentní přístup u inženýra vítězí na plné čáře.",
            type: "best"
          },
          {
            text: "Naše marže jsou na minimu, nemůžeme konkurovat levnému asijskému dovozu bez certifikací, který nabízí oni.",
            score: 35000,
            feedback: "Uznává kvalitu dílů, ale cena mu stále přijde vyšší než čekal.",
            type: "neutral"
          },
          {
            text: "Můžeme zkusit schválit u vedení dodatečnou slevu 2 % jako bonus pro rychlé rozhodnutí dnes.",
            score: 15000,
            feedback: "Působí to na něj příliš lacině jako zástupný prodejní trik.",
            type: "weak"
          },
          {
            text: "Polská okna a kování od konkurence se vám sice líbí, ale za dva roky spláčete nad výdělkem.",
            score: 0,
            feedback: "Pomlouvání konkurence považuje za vysoce neprofesionální.",
            type: "fail"
          }
        ]
      }
    ]
  },
  {
    name: "Alena Králová",
    role: "Majitelka wellness hotelu",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    difficulty: "Senior",
    difficultyColor: "text-indigo-400 bg-indigo-950/50 border-indigo-900",
    desc: "Potřebuje okamžitou realizaci bez rušení hostů. Extrémně hlídá recenze na Booking.com.",
    objections: [
      {
        text: "Na hotelu nemůžu mít hluk a nepořádek déle než jeden den, hosté by mi dali špatné recenze.",
        options: [
          {
            text: "Plně chápu, recenze jsou klíčové. Naši technici pracují v sehraných týmech po 3 lidech a celou realizaci 30 pokojů dokážeme rozplánovat po křídlech tak, že jeden pokoj zabere maximálně 25 minut. Vše se stihne v čase běžného úklidu.",
            score: 95000,
            feedback: "Geniální logistický plán! Alena oceňuje, že chápete její byznys.",
            type: "best"
          },
          {
            text: "Budeme se snažit pracovat co nejrychleji a nejtišeji, ideálně dopoledne, kdy jsou hosté převážně na výletech.",
            score: 40000,
            feedback: "Snaživá odpověď, ale chybí jí pevná garance rychlosti a systému.",
            type: "neutral"
          },
          {
            text: "Můžeme vám poskytnout dodatečnou slevu na další servis jako kompenzaci za případné stížnosti hostů.",
            score: 15000,
            feedback: "Sleva její reputaci a hvězdičky na Booking.com nezachrání.",
            type: "weak"
          },
          {
            text: "Trocha montážního šumu přes den se na hotelu přece snese, klienti s tím musí počítat.",
            score: 0,
            feedback: "Katastrofa. Tento laxní přístup k jejím hostům okamžitě ukončuje jednání.",
            type: "fail"
          }
        ]
      },
      {
        text: "Mám obavy ze záruky. Co když sítě do oken hosté poškodí nebo se hned roztrhnou?",
        options: [
          {
            text: "Pro hotely dodáváme extra odolné sítě s hustě tkanou sklovláknitou síťovinou s UV filtrem. A pokud by přesto došlo k mechanickému roztržení, náš rychlý servis vám na místě vymění jen síťovinu za zlomek ceny celého rámu.",
            score: 90000,
            feedback: "Skvělý argument s budoucím servisem! Úplně opadl její finanční strach.",
            type: "best"
          },
          {
            text: "Naše sítě jsou pevné z hliníku, host je jen tak neprotrhne, pokud nepoužije hrubou sílu.",
            score: 40050,
            feedback: "Uklidnilo ji to, ale pochybnosti o chování opilých hostů trvají.",
            type: "neutral"
          },
          {
            text: "Poničené sítě můžete hostům naúčtovat přímo do závěrečného ubytovacího účtu nebo z kauce.",
            score: 10000,
            feedback: "To by hosty zbytečně naštvalo, tohle Alena dělat nechce.",
            type: "weak"
          },
          {
            text: "Sítě jsou prostě spotřební materiál, s poškozením u hostů se musíte dopředu smířit.",
            score: 0,
            feedback: "Alena chce řešení a ne bezmocné krčení rameny. Loučí se s vámi.",
            type: "fail"
          }
        ]
      }
    ]
  },
  {
    name: "Vladimír Sýkora",
    role: "Investor a majitel luxusní vily",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
    difficulty: "Expert/Hardcore",
    difficultyColor: "text-amber-400 bg-amber-950/50 border-amber-900",
    desc: "Extrémně náročný klient. Vlastní luxusní hliníková okna a těžké HS portály. Nemá čas a vyžaduje elitu.",
    objections: [
      {
        text: "Moje hliníková HS portálová okna stála dva miliony. Jsou to prémiové profily, ty žádný servis nepotřebují!",
        options: [
          {
            text: "Máte pravdu, profily jsou stabilní. Nicméně HS portálové křídlo váží běžně 300 až 500 kg. Tato enormní váha klade obrovský tlak na pojezdové nerezové vozíky. Bez pravidelného seřízení hrozí poškození vodící kolejnice, jejíž výměna vyžaduje vybourání celého rámu a stojí statisíce.",
            score: 180000,
            feedback: "Geniální! Technicky přesný rozbor na statisícové riziko poškození klienta přesvědčil.",
            type: "best"
          },
          {
            text: "I hliník má v kování pohyblivé mechanické části, které je potřeba pravidelně vyčistit od prachu a namazat tukem, jinak se kování opotřebuje.",
            score: 70000,
            feedback: "Investor poslouchá, ale stále si tiše myslí, že prémiové německé díly to zvládnou samy.",
            type: "neutral"
          },
          {
            text: "Výrobce těchto drahých profilů sám uvádí v záručních podmínkách nutnost servisu jednou ročně, jinak záruka zaniká.",
            score: 30000,
            feedback: "Nějaké papírové podmínky ho nezajímají, má vlastní právní oddělení.",
            type: "weak"
          },
          {
            text: "Uděláme vám na to nezávaznou diagnostiku zdarma a uvidíte sám, v jakém stavu ta okna reálně máte.",
            score: 15000,
            feedback: "Nemá vůbec čas na neurčité obcházení techniků, chce slyšet fakta hned.",
            type: "weak"
          },
          {
            text: "To je omyl. Hliník se ničí úplně stejně jako levný plast, jen to na něm zvenku není hned tak vidět.",
            score: 0,
            feedback: "Srovnání s levným plastem ho urazilo. Vyprovází vás ze své kanceláře.",
            type: "fail"
          }
        ]
      },
      {
        text: "Vaše značka Q-Hub na trhu nefunguje 25 let jako konkurence. Jak vím, že tu za 5 let budete pro případnou reklamaci?",
        options: [
          {
            text: "Rozumím vaší obezřetnosti. Právě jako moderní technologická firma investujeme miliony do digitalizace, standardizace procesů a transparentního kapitálu. Naše partnerství s největšími dodavateli v EU a stabilní klientská základna zaručují, že rosteme mnohem stabilněji než rigidní firmy ze staré školy.",
            score: 250000,
            feedback: "Prezentoval jste se jako dravý a stabilní lídr moderního trhu! Získal jste zakázku století!",
            type: "best"
          },
          {
            text: "Jsme stabilní společnost se silným finančním zázemím a naše práce je plně pojištěná. Naši technici mají dlouholetou praxi.",
            score: 80000,
            feedback: "To zní celkem rozumně, ale chyběl tomu ten správný vizionářský drajv pro moderního investora.",
            type: "neutral"
          },
          {
            text: "Můžete se podívat na naše skvělé recenze na internetu - stovky spokojených klientů mluví za nás.",
            score: 45000,
            feedback: "Běžné recenze na internetu velkého developera nijak zvlášť neohromí.",
            type: "weak"
          },
          {
            text: "Za celou dobu naší existence jsme neměli jediný vážnější finanční nebo právní problém.",
            score: 20000,
            feedback: "Zní to až příliš defenzivně, vzbuzuje to spíše pochybnosti a nedůvěru.",
            type: "weak"
          },
          {
            text: "Dnes krachují i firmy s třicetiletou historií, věk na trhu už v dnešní době dávno nic neznamená.",
            score: 0,
            feedback: "Tento tón považuje investor za drzost a hovor okamžitě ukončuje.",
            type: "fail"
          }
        ]
      }
    ]
  }
];

export const SecretGame: React.FC<{ onClose: () => void; userEmail: string }> = ({ onClose, userEmail }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isVictory, setIsVictory] = useState(false);
  const [score, setScore] = useState(0);
  const [highScores, setHighScores] = useState<LeaderboardEntry[]>([]);
  const [playerName, setPlayerName] = useState(() => {
    return userEmail.split('@')[0] || 'Hráč';
  });
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Difficulty & Negotiation states
  const [currentCustomerIdx, setCurrentCustomerIdx] = useState(0);
  const [currentObjectionIdx, setCurrentObjectionIdx] = useState(0);
  const [lives, setLives] = useState(3);
  const [timeLeft, setTimeLeft] = useState(100); // percentage 0 - 100
  const [shuffledOptions, setShuffledOptions] = useState<Option[]>([]);
  const [rostaApplied, setRostaApplied] = useState(false);
  const [feedbackText, setFeedbackText] = useState<{ text: string; success: boolean } | null>(null);
  const [feedbackTimer, setFeedbackTimer] = useState<NodeJS.Timeout | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const activeCustomer = CUSTOMERS[currentCustomerIdx];
  const activeObjection = activeCustomer?.objections[currentObjectionIdx];

  // Sounds Synthesizer using Web Audio API
  const playSound = (type: 'correct' | 'wrong' | 'victory' | 'gameover') => {
    if (!soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      if (type === 'correct') {
        // High upbeat chime
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        
        osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc2.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc1.start();
        osc1.stop(ctx.currentTime + 0.25);
        osc2.start();
        osc2.stop(ctx.currentTime + 0.25);
      } else if (type === 'wrong') {
        // Sad low buzz
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else if (type === 'victory') {
        // Rising heroic fanfare
        const notes = [523.25, 587.33, 659.25, 783.99, 1046.50]; // C5, D5, E5, G5, C6
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);
          gain.gain.setValueAtTime(0.1, ctx.currentTime + idx * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + idx * 0.1 + 0.25);
          osc.start(ctx.currentTime + idx * 0.1);
          osc.stop(ctx.currentTime + idx * 0.1 + 0.25);
        });
      } else if (type === 'gameover') {
        // Falling sad tone
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.8);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
        osc.start();
        osc.stop(ctx.currentTime + 0.8);
      }
    } catch (e) {
      console.error('Audio synthesizer error:', e);
    }
  };

  // Load High Scores on mount
  useEffect(() => {
    const cached = localStorage.getItem('qhub_game_leaderboard');
    if (cached) {
      try {
        setHighScores(JSON.parse(cached));
      } catch (e) {}
    } else {
      const defaultScores = [
        { name: 'VIP Partner Sýkora', score: 853000, date: '2026-06-01' },
         { name: 'QAPI OZ Žralok', score: 540000, date: '2026-06-02' },
         { name: 'Junior Obchoďák', score: 185000, date: '2026-06-02' }
      ];
      localStorage.setItem('qhub_game_leaderboard', JSON.stringify(defaultScores));
      setHighScores(defaultScores);
    }
  }, []);

  // Shuffle options whenever the objection shifts
  useEffect(() => {
    if (activeObjection) {
      const shuffled = [...activeObjection.options].sort(() => Math.random() - 0.5);
      setShuffledOptions(shuffled);
      setRostaApplied(false);
      resetTimer();
    }
  }, [currentCustomerIdx, currentObjectionIdx, isPlaying]);

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(100);

    if (!isPlaying || isGameOver || isVictory) return;

    // Timer duration scales based on customer difficulty
    // Easy: 16s, Senior: 11s, Expert: 7s
    let durationSec = 16;
    if (activeCustomer?.difficulty === 'Senior') {
      durationSec = 11;
    } else if (activeCustomer?.difficulty === 'Expert/Hardcore') {
      durationSec = 7.5;
    }

    const intervalMs = 100;
    const step = (intervalMs / (durationSec * 1000)) * 100;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) {
          handleTimeout();
          return 0;
        }
        return prev - step;
      });
    }, intervalMs);
  };

  const handleTimeout = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    playSound('wrong');
    setLives(prev => {
      const next = prev - 1;
      if (next <= 0) {
        endGame(false);
      }
      return next;
    });

    setFeedbackText({
      text: "⌛ Čas vypršel! Zákazníkovi došla trpělivost.",
      success: false
    });

    // Advance to next objection or customer even on timeout
    setTimeout(() => {
      progressGame();
    }, 1500);
  };

  const selectAnswer = (option: Option) => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    // Evaluate answer
    const isGood = option.score > 0;
    if (option.type === 'fail') {
      playSound('wrong');
      setLives(prev => {
        const next = prev - 1;
        if (next <= 0) {
          endGame(false);
        }
        return next;
      });
      setFeedbackText({
        text: `❌ ${option.feedback}`,
        success: false
      });
    } else {
      playSound('correct');
      // Extra speed bonus points!
      const speedBonus = Math.round((timeLeft / 100) * (option.score * 0.2));
      const finalScoreGain = option.score + speedBonus;
      setScore(prev => prev + finalScoreGain);
      
      setFeedbackText({
        text: `👍 ${option.feedback} (+${finalScoreGain.toLocaleString()} Kč)`,
        success: true
      });
    }

    // Keep feedback visible briefly before moving on
    setTimeout(() => {
      setFeedbackText(null);
      progressGame();
    }, 2800);
  };

  const progressGame = () => {
    const totalObjections = activeCustomer.objections.length;
    if (currentObjectionIdx + 1 < totalObjections) {
      setCurrentObjectionIdx(prev => prev + 1);
    } else {
      // Customer finished! Move to next customer
      if (currentCustomerIdx + 1 < CUSTOMERS.length) {
        setCurrentCustomerIdx(prev => prev + 1);
        setCurrentObjectionIdx(0);
        // Reward 1 life for closing a client fully unless capped at 5
        setLives(l => Math.min(5, l + 1));
        playSound('correct');
      } else {
        // Complete victory!
        endGame(true);
      }
    }
  };

  const startGame = () => {
    setScore(40000);
    setLives(3);
    setCurrentCustomerIdx(0);
    setCurrentObjectionIdx(0);
    setIsGameOver(false);
    setIsVictory(false);
    setFeedbackText(null);
    setRostaApplied(false);
    setIsPlaying(true);
  };

  const endGame = (won: boolean) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsPlaying(false);
    if (won) {
      setIsVictory(true);
      playSound('victory');
    } else {
      setIsGameOver(true);
      playSound('gameover');
    }
    saveScore(score);
  };

  const saveScore = (finalScore: number) => {
    if (finalScore <= 0) return;
    const newEntry: LeaderboardEntry = {
      name: playerName.trim() || 'Hráč',
      score: finalScore,
      date: new Date().toISOString().split('T')[0]
    };

    setHighScores(prev => {
      const updated = [...prev, newEntry]
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
      localStorage.setItem('qhub_game_leaderboard', JSON.stringify(updated));
      return updated;
    });
  };

  // Helper calculations and functions
  const maxContractValue = activeObjection?.options?.reduce((m, o) => Math.max(m, o.score), 0) || 50000;

  const helperCosts = {
    petr: Math.round(maxContractValue * 0.75),    // Petr Chytroš: 75% of contract (Smart answer)
    michal: Math.round(maxContractValue * 0.20),  // Michal Chytroš: 20% of contract (Time reset)
    erik: Math.round(maxContractValue * 1.25),    // Erik: 125% of contract (Force skip best)
    rosta: Math.round(maxContractValue * 0.35),   // Rosťa: 35% of contract (Data filter)
    ondra: Math.round(maxContractValue * 0.50),   // Ondra: 50% of contract (Extra heart)
  };

  const handleUsePetr = () => {
    const cost = helperCosts.petr;
    if (score < cost) return;
    const bestOption = activeObjection?.options?.reduce((best, cur) => cur.score > best.score ? cur : best, activeObjection.options[0]);
    if (!bestOption) return;

    setScore(s => s - cost);
    selectAnswer(bestOption);
  };

  const handleUseMichal = () => {
    const cost = helperCosts.michal;
    if (score < cost) return;

    setScore(s => s - cost);
    resetTimer();
    setFeedbackText({
      text: "⏱️ Michal Chytroš zavolal klientovi a zakecal ho o fotbale a počasí! Trpělivost zákazníka je zpět na maximum.",
      success: true
    });
    setTimeout(() => {
      setFeedbackText(null);
    }, 2500);
  };

  const handleUseErik = () => {
    const cost = helperCosts.erik;
    if (score < cost) return;
    const bestOption = activeObjection?.options?.reduce((best, cur) => cur.score > best.score ? cur : best, activeObjection.options[0]);
    if (!bestOption) return;

    setScore(s => s - cost);
    if (timerRef.current) clearInterval(timerRef.current);

    const speedBonus = Math.round((timeLeft / 100) * (bestOption.score * 0.2));
    const finalScoreGain = bestOption.score + speedBonus;
    setScore(s => s + finalScoreGain);

    setFeedbackText({
      text: `🥊 Erik vletěl do bytu, srovnal zákazníka do latě a ten okamžitě bez řečí podepsal plnou zakázku! (+${finalScoreGain.toLocaleString()} Kč)`,
      success: true
    });

    setTimeout(() => {
      setFeedbackText(null);
      progressGame();
    }, 3200);
  };

  const handleUseRosta = () => {
    const cost = helperCosts.rosta;
    if (score < cost) return;

    setScore(s => s - cost);
    setRostaApplied(true);
    setFeedbackText({
      text: "📊 Rosťa poslal zákazníkovi gigantické množství technických tabulek, výkresů a grafů! Zákazník je zahlcen a chybné odpovědi mizí.",
      success: true
    });
    setTimeout(() => {
      setFeedbackText(null);
    }, 2600);
  };

  const handleUseOndra = () => {
    const cost = helperCosts.ondra;
    if (score < cost) return;
    if (lives >= 5) {
      setFeedbackText({
        text: "❤️ Už máš plný stav 5 životů! Ondru teď volat nemusíš.",
        success: false
      });
      setTimeout(() => setFeedbackText(null), 2000);
      return;
    }

    setScore(s => s - cost);
    setLives(l => l + 1);
    setFeedbackText({
      text: "❤️ Ondra Srdcař se za tebe zaručil u vedení a vyžehlil tvůj předchozí prohraný obchod! Získáváš +1 Život.",
      success: true
    });
    setTimeout(() => {
      setFeedbackText(null);
    }, 2500);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-[200] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-indigo-500/20 rounded-3xl w-full max-w-5xl my-auto overflow-hidden shadow-[0_0_60px_rgba(79,70,229,0.3)] relative text-white flex flex-col md:flex-row">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-950 hover:bg-slate-800 p-2.5 rounded-full transition cursor-pointer z-50 border border-slate-800"
        >
          <X size={18} />
        </button>

        {/* MAIN GAME AREA */}
        <div className="flex-1 flex flex-col min-h-[480px] md:min-h-[580px] border-r border-slate-950">
          
          {/* Header Info Banner */}
          <div className="p-5 border-b border-slate-950 bg-slate-900/60 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-amber-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles size={12} className="animate-pulse" />
                Dovednostní trenažér Q-Hub
              </p>
              <h3 className="text-base font-black text-slate-100 tracking-tight">
                Obchodní bitva: Servis oken & stínění ⚔️
              </h3>
            </div>

            <div className="flex items-center gap-2">
              {/* Sound Toggle */}
              <button 
                onClick={() => setSoundEnabled(!soundEnabled)} 
                className="text-slate-400 hover:text-indigo-400 p-1.5 transition"
                title={soundEnabled ? "Ztlumit zvuky" : "Zapnout zvuky"}
              >
                {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>

              {/* Lives Gauge */}
              {isPlaying && (
                <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-rose-950 flex items-center gap-1 text-rose-500 font-mono text-xs font-bold shadow-inner">
                  <Heart size={13} fill="currentColor" className="animate-pulse" />
                  <span>{lives}x</span>
                </div>
              )}

              {/* Financial Score */}
              <div className="bg-indigo-950/70 border border-indigo-900/50 px-3.5 py-1.5 rounded-xl font-mono text-center">
                <span className="text-[8px] text-indigo-400 block font-bold uppercase leading-none">Uzavřený obrat</span>
                <span className="text-xs md:text-sm font-black text-indigo-300 leading-tight">
                  {score.toLocaleString()} Kč
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Core */}
          <div className="flex-1 p-6 flex flex-col justify-between bg-gradient-to-b from-slate-900 to-slate-950 relative min-h-[380px]">
            
            {/* START SCREEN */}
            {!isPlaying && !isGameOver && !isVictory && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 bg-slate-950">
                <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white rounded-2xl flex items-center justify-center shadow-lg animate-bounce mb-4">
                  <Flame size={32} />
                </div>
                <h4 className="text-xl font-black text-slate-100 tracking-tight mb-2">
                  Poraz námitky a podepiš zakázku!
                </h4>
                <p className="text-xs text-slate-400 max-w-md mb-6 leading-relaxed">
                  Čeká tě 5 různých typů zákazníků. Každý má své specifické pochybnosti a obavy ohledně servisu oken či stínící techniky. Vyber nejlepší argumentaci, zachraň obrat a ztěžuj si to s ubývajícím časem!
                </p>

                <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl w-full max-w-md text-left mb-6 text-xs space-y-3">
                  <p className="font-bold text-indigo-400 text-center uppercase tracking-wider text-[10px] mb-1">
                    Systém hodnocení a obtížnost:
                  </p>
                  <div className="flex items-start gap-2 text-slate-300">
                    <span className="text-emerald-400 font-bold">🟢 Junior:</span>
                    <span>Jednodušší dotazy, 3 možnosti odpovědi, reakční čas 16 sekund.</span>
                  </div>
                  <div className="flex items-start gap-2 text-slate-300">
                    <span className="text-indigo-400 font-bold">🔵 Senior:</span>
                    <span>Pokročilí klienti, 4 možnost odpovědi, reakční čas 11 sekund.</span>
                  </div>
                  <div className="flex items-start gap-2 text-slate-300">
                    <span className="text-amber-500 font-bold">🔥 Expert/Hardcore:</span>
                    <span>Těžké HS Portály, 5 možností odpovědi, bleskový čas pouhých 7 sekund!</span>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-3 w-full max-w-xs">
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="Tvé jméno do žebříčku..."
                    maxLength={15}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-center text-slate-100 font-bold focus:outline-none focus:border-indigo-500"
                  />
                  <button 
                    onClick={startGame}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs tracking-wide uppercase rounded-xl shadow-[0_4px_15px_rgba(79,70,229,0.4)] transition cursor-pointer"
                  >
                    Vstoupit do vyjednávání
                  </button>
                </div>
              </div>
            )}

            {/* GAME OVER SCREEN */}
            {isGameOver && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-20 bg-slate-950">
                <div className="w-14 h-14 bg-rose-950/40 border border-rose-500/20 text-rose-500 rounded-2xl flex items-center justify-center mb-4">
                  <AlertTriangle size={28} />
                </div>
                <p className="text-[10px] font-black text-rose-500 tracking-widest uppercase mb-1">
                  Obchod ztracen
                </p>
                <h4 className="text-xl font-black text-slate-100 tracking-tight mb-2">
                  Zákazník vybral levnější konkurenci! ❌
                </h4>
                <p className="text-xs text-slate-400 mb-6 max-w-sm">
                  Nedokázal jsi obhájit přidanou hodnotu Q-Hubu. Nevěš hlavu, trénink z tebe udělá mistra!
                </p>

                <div className="bg-slate-900 border border-slate-800 px-6 py-4 rounded-2xl mb-8">
                  <span className="text-[9px] uppercase text-indigo-400 font-bold block">
                    Finální dosažený obrat
                  </span>
                  <span className="text-xl font-mono text-indigo-300 font-black">
                    {score.toLocaleString()} Kč
                  </span>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={startGame}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs tracking-widest uppercase rounded-xl transition cursor-pointer flex items-center gap-1.5"
                  >
                    <RotateCcw size={14} /> Chci odvetu
                  </button>
                  <button 
                    onClick={onClose}
                    className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    Zavřít trenažér
                  </button>
                </div>
              </div>
            )}

            {/* VICTORY OVERALL SCREEN */}
            {isVictory && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-20 bg-slate-950">
                <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 text-amber-500 rounded-2xl flex items-center justify-center mb-4 animate-bounce">
                  <Award size={32} />
                </div>
                <p className="text-[10px] font-black text-amber-400 tracking-widest uppercase mb-1">
                  Legendární obchoďák
                </p>
                <h4 className="text-2xl font-black text-slate-100 tracking-tight mb-2">
                  Podepsal jsi i HS Portály Sýkory! 🏆
                </h4>
                <p className="text-xs text-slate-400 mb-6 max-w-md col-span-3">
                  Gratulujeme! Zvládl jsi mistrovsky zpracovat všechny typy zákaznických stížností. Jsi skutečný prodejní predátor Q-Hubu!
                </p>

                <div className="bg-gradient-to-r from-amber-950/20 to-indigo-950/20 border border-amber-500/30 px-8 py-5 rounded-3xl mb-8">
                  <span className="text-[10px] uppercase text-amber-400 font-bold block">
                    Zlatý uzavřený obrat
                  </span>
                  <span className="text-2xl font-mono text-amber-300 font-black">
                    {score.toLocaleString()} Kč
                  </span>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={startGame}
                    className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs tracking-widest uppercase rounded-xl transition cursor-pointer flex items-center gap-1.5"
                  >
                    <RotateCcw size={14} /> Hrát znovu
                  </button>
                  <button 
                    onClick={onClose}
                    className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs rounded-xl transition"
                  >
                    Zavřít
                  </button>
                </div>
              </div>
            )}

            {/* CORE ACTIVE SCENE */}
            {isPlaying && !isGameOver && !isVictory && (
              <div className="flex-1 flex flex-col justify-between">
                
                {/* OPPONENT ARENA: Portrait & Speach Bubble */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-4 bg-slate-900/40 p-4 sm:p-5 rounded-2xl border border-slate-900">
                  <div className="relative flex-shrink-0">
                    <img 
                      src={activeCustomer?.avatar} 
                      alt={activeCustomer?.name} 
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-indigo-500/20 shadow-md"
                      referrerPolicy="no-referrer"
                    />
                    <span className={`absolute -bottom-1.5 -right-1 py-0.5 px-2 rounded-full font-mono text-[9px] font-black border ${activeCustomer?.difficultyColor}`}>
                      {activeCustomer?.difficulty}
                    </span>
                  </div>

                  <div className="flex-1 text-center sm:text-left">
                    <h5 className="font-extrabold text-indigo-300 text-sm flex items-center justify-center sm:justify-start gap-1.5">
                      {activeCustomer?.name}
                      <span className="text-[10px] text-slate-400 font-normal">({activeCustomer?.role})</span>
                    </h5>
                    <p className="text-[10px] text-slate-400 italic mb-2 leading-tight">
                      {activeCustomer?.desc}
                    </p>

                    {/* Speach bubble containing prompt / objection */}
                    <div className="bg-slate-950 border border-slate-800 px-4 py-3 rounded-2xl rounded-tl-none relative mt-1.5 text-slate-200 text-xs text-left leading-relaxed shadow-sm">
                      <HelpCircle size={14} className="inline text-rose-500 mr-1.5 -mt-0.5" />
                      <span className="font-bold text-rose-400">"{activeObjection?.text}"</span>
                    </div>
                  </div>
                </div>

                {/* TIMEOUT LOADING PATIENCE BAR */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                    <span>Zákazníkova trpělivost</span>
                    <span className={timeLeft < 30 ? 'text-rose-500 animate-pulse' : 'text-indigo-400'}>
                      {timeLeft < 30 ? '🔥 Bleskově odpovídej!' : '⌛ Ubíhající čas'}
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800 relative group">
                    <div 
                      className={`h-full transition-all duration-100 ease-linear rounded-full ${
                        timeLeft < 30 ? 'bg-gradient-to-r from-rose-500 to-amber-500 animate-pulse' : 'bg-indigo-500'
                      }`} 
                      style={{ width: `${timeLeft}%` }}
                    />
                  </div>
                </div>

                {/* FLOATING DIALOG FEEDBACK OVERLAP */}
                {feedbackText ? (
                  <div className={`p-4 rounded-xl text-center border text-xs font-bold leading-relaxed animate-fade-in ${
                    feedbackText.success 
                      ? 'bg-emerald-950/50 border-emerald-500/30 text-emerald-300' 
                      : 'bg-rose-950/50 border-rose-500/30 text-rose-300'
                  }`}>
                    {feedbackText.text}
                  </div>
                ) : (
                  /* THE DYNAMIC LIST OF OBJECTION REPLIES (SHUFFLED) */
                  <div className="space-y-4 mt-2">
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-left mb-2">
                        Zvol nejaktivnější a nejvýhodnější reakci:
                      </p>
                      <div className="grid grid-cols-1 gap-2">
                        {(rostaApplied 
                          ? shuffledOptions.filter(opt => opt.type === 'best' || opt.type === 'neutral')
                          : shuffledOptions
                        ).map((opt, i) => (
                          <button
                            key={i}
                            onClick={() => selectAnswer(opt)}
                            className="w-full text-left p-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-indigo-500/40 text-slate-200 hover:text-white text-xs leading-relaxed transition-all active:scale-[0.99] cursor-pointer group flex items-start gap-3"
                          >
                            <span className="w-5 h-5 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center font-mono text-[10px] font-bold text-slate-400 group-hover:text-indigo-300 group-hover:border-indigo-500/30 flex-shrink-0 transition">
                              {i + 1}
                            </span>
                            <span className="flex-1 text-slate-300 group-hover:text-white transition">
                              {opt.text}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Q-HUB SALES ADVISORS SUPPORT TEAM */}
                    <div className="border-t border-slate-900/60 pt-3">
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest text-left mb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                        <span className="flex items-center gap-1.5">
                          <Users size={12} className="text-indigo-400" />
                          Aktivní podpora týmu Q-Hub k ruce:
                        </span>
                        <span className="text-[8px] font-normal text-slate-500 normal-case">Stojí provizi z aktuálního rozjednaného obchodu</span>
                      </p>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-1">
                        {/* Petr Chytroš */}
                        <button
                          disabled={score < helperCosts.petr}
                          onClick={handleUsePetr}
                          className={`p-2 rounded-xl text-left border flex flex-col justify-between transition-all duration-200 relative group cursor-pointer ${
                            score < helperCosts.petr 
                              ? 'bg-slate-950/40 border-slate-950 text-slate-600 cursor-not-allowed opacity-55' 
                              : 'bg-indigo-950/20 border-indigo-900/30 text-indigo-200 hover:bg-indigo-900/10 hover:border-indigo-500/50'
                          }`}
                          title={`Petr vyřeší správně tuto námitku za tebe. Stojí ${helperCosts.petr.toLocaleString()} Kč`}
                        >
                          <div className="flex items-center gap-1 mb-0.5">
                            <Brain size={12} className="text-amber-400 flex-shrink-0 animate-pulse" />
                            <span className="text-[10px] font-black truncate">Petr Chytroš</span>
                          </div>
                          <span className="text-[8px] text-slate-400 block leading-tight mb-1">Chytrá odpověď</span>
                          <span className={`text-[9px] font-mono font-bold ${score < helperCosts.petr ? 'text-slate-500' : 'text-amber-400'}`}>
                            -{helperCosts.petr.toLocaleString()} Kč
                          </span>
                        </button>

                        {/* Michal Chytroš */}
                        <button
                          disabled={score < helperCosts.michal}
                          onClick={handleUseMichal}
                          className={`p-2 rounded-xl text-left border flex flex-col justify-between transition-all duration-200 relative group cursor-pointer ${
                            score < helperCosts.michal 
                              ? 'bg-slate-950/40 border-slate-950 text-slate-600 cursor-not-allowed opacity-55' 
                              : 'bg-indigo-950/20 border-indigo-900/30 text-indigo-200 hover:bg-indigo-900/10 hover:border-indigo-500/50'
                          }`}
                          title={`Michal ti dá plný čas na rozmyšlenou. Stojí ${helperCosts.michal.toLocaleString()} Kč`}
                        >
                          <div className="flex items-center gap-1 mb-0.5">
                            <Clock size={12} className="text-emerald-400 flex-shrink-0" />
                            <span className="text-[10px] font-black truncate">Michal Chytroš</span>
                          </div>
                          <span className="text-[8px] text-slate-400 block leading-tight mb-1">Zakecá & dá čas</span>
                          <span className={`text-[9px] font-mono font-bold ${score < helperCosts.michal ? 'text-slate-500' : 'text-emerald-400'}`}>
                            -{helperCosts.michal.toLocaleString()} Kč
                          </span>
                        </button>

                        {/* Erik */}
                        <button
                          disabled={score < helperCosts.erik}
                          onClick={handleUseErik}
                          className={`p-2 rounded-xl text-left border flex flex-col justify-between transition-all duration-200 relative group cursor-pointer ${
                            score < helperCosts.erik 
                              ? 'bg-slate-950/40 border-slate-950 text-slate-600 cursor-not-allowed opacity-55' 
                              : 'bg-indigo-950/20 border-indigo-900/30 text-indigo-200 hover:bg-indigo-900/10 hover:border-indigo-500/50'
                          }`}
                          title={`Erik vletí dovnitř a zmlátí zákazníka obří salvou argumentů! Automaticky ulovíš zakázku v plné ceně. Stojí ${helperCosts.erik.toLocaleString()} Kč`}
                        >
                          <div className="flex items-center gap-1 mb-0.5">
                            <Hammer size={12} className="text-rose-400 flex-shrink-0" />
                            <span className="text-[10px] font-black truncate">Erik Sval</span>
                          </div>
                          <span className="text-[8px] text-slate-400 block leading-tight mb-1">Zmlátit & Skip</span>
                          <span className={`text-[9px] font-mono font-bold ${score < helperCosts.erik ? 'text-slate-500' : 'text-rose-400'}`}>
                            -{helperCosts.erik.toLocaleString()} Kč
                          </span>
                        </button>

                        {/* Rosťa */}
                        <button
                          disabled={score < helperCosts.rosta || rostaApplied}
                          onClick={handleUseRosta}
                          className={`p-2 rounded-xl text-left border flex flex-col justify-between transition-all duration-200 relative group cursor-pointer ${
                            score < helperCosts.rosta || rostaApplied
                              ? 'bg-slate-950/40 border-slate-950 text-slate-600 cursor-not-allowed opacity-55' 
                              : 'bg-indigo-950/20 border-indigo-900/30 text-indigo-200 hover:bg-indigo-900/10 hover:border-indigo-500/50'
                          }`}
                          title={`Rosťa pošle tolik analytických dat a grafů, že odmaže slabé a chybná řešení. Stojí ${helperCosts.rosta.toLocaleString()} Kč`}
                        >
                          <div className="flex items-center gap-1 mb-0.5">
                            <Database size={12} className="text-cyan-400 flex-shrink-0" />
                            <span className="text-[10px] font-black truncate">Rosťa Data</span>
                          </div>
                          <span className="text-[8px] text-slate-400 block leading-tight mb-1">Odmaže špatné</span>
                          <span className={`text-[9px] font-mono font-bold ${score < helperCosts.rosta || rostaApplied ? 'text-slate-500' : 'text-cyan-400'}`}>
                            -{helperCosts.rosta.toLocaleString()} Kč
                          </span>
                        </button>

                        {/* Ondra */}
                        <button
                          disabled={score < helperCosts.ondra}
                          onClick={handleUseOndra}
                          className={`p-2 rounded-xl text-left border flex flex-col justify-between transition-all duration-200 relative group cursor-pointer col-span-2 sm:col-span-1 ${
                            score < helperCosts.ondra 
                              ? 'bg-slate-950/40 border-slate-950 text-slate-600 cursor-not-allowed opacity-55' 
                              : 'bg-indigo-950/20 border-indigo-900/30 text-indigo-200 hover:bg-indigo-900/10 hover:border-indigo-500/50'
                          }`}
                          title={`Ondra Srdcař se za tebe zaručí u šéfa a dokoupí 1 ztracený život (srdce). Stojí ${helperCosts.ondra.toLocaleString()} Kč`}
                        >
                          <div className="flex items-center gap-1 mb-0.5">
                            <ShieldAlert size={12} className="text-teal-400 flex-shrink-0" />
                            <span className="text-[10px] font-black truncate">Ondra Srdcař</span>
                          </div>
                          <span className="text-[8px] text-slate-400 block leading-tight mb-1">Koupit +1 srdce</span>
                          <span className={`text-[9px] font-mono font-bold ${score < helperCosts.ondra ? 'text-slate-500' : 'text-teal-400'}`}>
                            -{helperCosts.ondra.toLocaleString()} Kč
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: HIGH SCORE BOARD & TIPS */}
        <div className="w-full md:w-80 bg-slate-950 p-6 flex flex-col justify-between max-h-[350px] md:max-h-full overflow-y-auto">
          <div>
            <div className="flex items-center gap-2.5 mb-4 border-b border-slate-900 pb-3">
              <Trophy className="text-amber-500" size={18} />
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-300">
                Nejlepší Obchoďáci Q-Hubu
              </h4>
            </div>

            <div className="space-y-2">
              {highScores.map((scoreEntry, index) => {
                const isUser = scoreEntry.name.toLowerCase() === playerName.toLowerCase();
                return (
                  <div 
                    key={index}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all duration-200 ${
                      index === 0 ? 'bg-amber-950/20 border-amber-500/25' :
                      index === 1 ? 'bg-slate-900 border-slate-800' :
                      index === 2 ? 'bg-indigo-950/10 border-indigo-900/30' :
                      isUser ? 'bg-indigo-950/30 border-indigo-500/30' : 'bg-slate-900/40 border-slate-950'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center font-mono text-[10px] font-black ${
                        index === 0 ? 'bg-amber-500 text-slate-950 text-xs' :
                        index === 1 ? 'bg-slate-400 text-slate-950' :
                        index === 2 ? 'bg-amber-800 text-white' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {index + 1}
                      </span>
                      <span className={`text-xs font-extrabold ${isUser ? 'text-indigo-300' : 'text-slate-300'} truncate max-w-[125px]`}>
                        {scoreEntry.name}
                      </span>
                    </div>
                    <div className="text-right font-mono">
                      <span className="text-xs font-black text-indigo-400">
                        {scoreEntry.score.toLocaleString()} Kč
                      </span>
                      <span className="text-[8px] text-slate-500 block leading-tight mt-0.5">
                        {scoreEntry.date}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-5 border-t border-slate-900 mt-5 text-left">
            <h5 className="text-[10px] font-black uppercase text-indigo-400 tracking-wider mb-1 flex items-center gap-1">
              <Zap size={11} className="text-amber-400 animate-pulse" />
              Prodejní pravidlo Q-Hubu:
            </h5>
            <p className="text-[9.5px] text-slate-400 leading-relaxed">
              Nikdy nepomlouvej konkurenci ani neodporuj zákazníkovi napřímo. Místo toho vyjádři pochopení, upleť logický most na přidanou hodnotu a ukaž reálné úspory na topení či eliminaci drahých rizik. Seřízení zachraňuje celá kování oken!
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
