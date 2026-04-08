"use client";
import { useState } from "react";
import { C } from "../constants/colors";
import { Card, SectionTitle, ProgressBar } from "../shared";

export default function SeasonalityTab({ client, t }) {
  const [activeMonth, setActiveMonth] = useState(new Date().getMonth());
  const isPt = t?.seasonal === "Sazonalidade";

  const SEASONS = {
    winter: { label: "❄️ Winter", months: [11, 0, 1], color: "#60a5fa" },
    spring: { label: "🌸 Spring", months: [2, 3, 4],  color: "#34d399" },
    summer: { label: "☀️ Summer", months: [5, 6, 7],  color: "#f59e0b" },
    fall:   { label: "🍂 Fall",   months: [8, 9, 10], color: "#f97316" },
  };

  const REGIONAL_CLIMATE = {
    CT:"4season",MA:"4season",NH:"4season",ME:"4season",VT:"4season",RI:"4season",
    NY:"4season",NJ:"4season",PA:"4season",MD:"4season",
    OH:"4season",MI:"4season",IL:"4season",IN:"4season",MN:"4season",WI:"4season",
    CO:"4season",UT:"4season",WY:"4season",MT:"4season",
    VA:"moderate",NC:"moderate",TN:"moderate",KY:"moderate",MO:"moderate",
    KS:"moderate",NE:"moderate",SD:"moderate",ND:"moderate",OR:"moderate",WA:"moderate",
    FL:"warm",GA:"warm",SC:"warm",TX:"warm",LA:"warm",OK:"warm",AL:"warm",MS:"warm",AR:"warm",
    AZ:"constant",NV:"constant",CA:"constant",NM:"constant",HI:"constant",
  };
  const REGIONAL_MULTIPLIER = { "4season":1.5, moderate:1.2, warm:1.1, constant:0.8 };
  const REGIONAL_LABEL = {
    "4season": { label:"True 4-Season",        desc:"High demand swings — seasonal optimization critical", color:"#60a5fa" },
    moderate:  { label:"Moderate Seasons",     desc:"Moderate swings — seasonal alerts still valuable",   color:"#34d399" },
    warm:      { label:"Warm / Hurricane Belt",desc:"Heat + storm-driven demand — different calendar",    color:"#f59e0b" },
    constant:  { label:"Near-Constant Climate",desc:"Lower seasonality — year-round optimization priority",color:"#f97316" },
  };
  const CATEGORY_VOLATILITY = {
    "HVAC Contractor":10,"Plumber":10,"Snow Removal":9,
    "Roofing Contractor":8,"Pest Control":8,"Moving Company":7,
    "Pool Service":7,"Landscaping Company":6,"Gutter Service":6,
    "Painting Contractor":6,"Cleaning Service":5,"Insulation Contractor":5,
    "Home Renovation Contractor":5,"Electrician":4,
    "IT Services & Computer Repair":3,"Digital Marketing Agency":3,
    "Dentist":4,"Family Law Attorney":4,"Car Detailing Service":5,
  };

  const NICHE_SEASONS = {
    "Home Renovation Contractor": {
      winter: { demand:55,  urgency:"MODERATE",     decisionSpeed:"1–3 weeks", ticketRange:"$2K–$15K",      keywords:["storm damage repair","frozen pipes","emergency roof repair","snow damage contractor","interior remodel winter"],  tip:"Emergency services dominate. Have 'emergency' in attributes and posts.", cta:"Emergency Service Available" },
      spring: { demand:90,  urgency:"PLANNED",       decisionSpeed:"2–6 weeks", ticketRange:"$5K–$30K",      keywords:["deck building","exterior painting","siding replacement","window replacement","home addition"],                    tip:"Planning season — homeowners research weeks in advance. Post before/after photos now.", cta:"Free Spring Estimate" },
      summer: { demand:100, urgency:"PLANNED",       decisionSpeed:"3–8 weeks", ticketRange:"$10K–$75K",     keywords:["kitchen remodel","bathroom renovation","home addition","AC installation","pool deck"],                            tip:"Peak season. Reviews from summer projects are gold. Ask every client.", cta:"Summer Projects Available" },
      fall:   { demand:75,  urgency:"PLANNED",       decisionSpeed:"1–4 weeks", ticketRange:"$3K–$20K",      keywords:["weatherproofing","insulation","roof inspection","gutter installation","heating system"],                         tip:"Preventive season. Post content about 'preparing your home for winter'.", cta:"Pre-Winter Inspection" },
    },
    "HVAC Contractor": {
      winter: { demand:100, urgency:"CRITICAL",      decisionSpeed:"Same day",  ticketRange:"$300–$5K",      keywords:["emergency furnace repair","heater not working","heating system replacement","furnace tune-up","no heat emergency"], tip:"Peak demand. 'Emergency' and '24/7' in profile name and posts drive calls.", cta:"Same Day Heating Repair" },
      spring: { demand:75,  urgency:"PLANNED",       decisionSpeed:"1–2 weeks", ticketRange:"$100–$500",     keywords:["AC tune-up","air conditioning service","HVAC maintenance","spring AC check","AC inspection"],                     tip:"Pre-summer maintenance season. Offer tune-up specials 30–45 days before heat hits.", cta:"Spring AC Tune-Up Special" },
      summer: { demand:95,  urgency:"CRITICAL",      decisionSpeed:"Same day",  ticketRange:"$300–$5K",      keywords:["AC repair","air conditioning replacement","emergency AC","cooling system","AC not cooling"],                     tip:"Second peak. Emergency AC drives highest-ticket calls. Speed to lead is everything.", cta:"Emergency AC Repair" },
      fall:   { demand:80,  urgency:"PLANNED",       decisionSpeed:"1–2 weeks", ticketRange:"$150–$800",     keywords:["furnace tune-up","heating system check","heat pump installation","winterize HVAC","furnace inspection"],          tip:"Preventive maintenance before winter. Book-ahead campaigns work well.", cta:"Pre-Winter Furnace Check" },
    },
    "Plumber": {
      winter: { demand:100, urgency:"CRITICAL",      decisionSpeed:"Within hours", ticketRange:"$500–$5K",   keywords:["burst pipe repair","frozen pipes","emergency plumber","water heater repair","pipe freeze"],                       tip:"Frozen pipes and burst emergencies peak. '24/7 emergency' in every post.", cta:"24/7 Emergency Plumbing" },
      spring: { demand:80,  urgency:"MODERATE",      decisionSpeed:"1–3 days",  ticketRange:"$200–$1.5K",    keywords:["sump pump installation","leak repair","drain cleaning","water heater replacement","spring plumbing"],             tip:"Spring thaw causes leaks and drain issues. Sump pump demand spikes.", cta:"Spring Plumbing Checkup" },
      summer: { demand:70,  urgency:"LOW",            decisionSpeed:"1–5 days",  ticketRange:"$200–$2K",      keywords:["outdoor faucet","sprinkler system","water softener","bathroom remodel plumbing","slab leak"],                    tip:"Renovation season. Partner with contractors for bathroom and kitchen jobs.", cta:"Renovation Plumbing" },
      fall:   { demand:85,  urgency:"PLANNED",        decisionSpeed:"1–2 weeks", ticketRange:"$150–$800",     keywords:["water heater tune-up","drain cleaning","pipe insulation","winterize plumbing","water heater replacement"],       tip:"Winterization prep drives demand. 'Prepare your pipes' content converts.", cta:"Winterize Your Plumbing" },
    },
    "Roofing Contractor": {
      winter: { demand:50,  urgency:"HIGH",           decisionSpeed:"1–3 days",  ticketRange:"$500–$5K",      keywords:["emergency roof repair","snow damage roof","ice dam removal","storm damage roof","roof leak repair"],              tip:"Emergency repairs from snow/ice. Emergency response content must be prominent.", cta:"Emergency Roof Repair" },
      spring: { demand:85,  urgency:"PLANNED",        decisionSpeed:"2–6 weeks", ticketRange:"$500–$25K",     keywords:["roof inspection","roof replacement","storm damage inspection","roof repair spring","new roof estimate"],           tip:"Post-winter inspection surge. Photos of completed jobs convert.", cta:"Free Roof Inspection" },
      summer: { demand:80,  urgency:"PLANNED",        decisionSpeed:"2–6 weeks", ticketRange:"$8K–$25K",      keywords:["roof replacement","new roof installation","metal roofing","shingle replacement","roofing contractor"],            tip:"Execution peak. Reviews from summer installs are critical for fall/winter trust.", cta:"Summer Roofing Special" },
      fall:   { demand:100, urgency:"HIGH",            decisionSpeed:"1–3 weeks", ticketRange:"$500–$25K",     keywords:["roof replacement before winter","fall roof inspection","gutter and roofing","pre-winter roofing","storm damage"], tip:"Peak search month (September). 'Before winter hits' messaging converts.", cta:"Pre-Winter Roof Inspection" },
    },
    "Pest Control": {
      winter: { demand:40,  urgency:"MODERATE",       decisionSpeed:"3–7 days",  ticketRange:"$150–$500",     keywords:["rodent control","mouse exterminator","rat removal","winter pest control","indoor pest treatment"],                tip:"Rodent ingress season. 'Rodent control' and 'exclusion service' in posts.", cta:"Rodent Exclusion Service" },
      spring: { demand:100, urgency:"HIGH",            decisionSpeed:"2–5 days",  ticketRange:"$500–$5K",      keywords:["termite treatment","ant control spring","pest inspection","termite swarm","mosquito control"],                    tip:"Termite swarm season (March–May). Structural damage messaging drives high-value jobs.", cta:"Termite Inspection Now" },
      summer: { demand:90,  urgency:"MODERATE",       decisionSpeed:"1–2 weeks", ticketRange:"$150–$1.2K",    keywords:["mosquito control","pest control near me","ant exterminator","wasp removal","stinging insect removal"],            tip:"Mosquito and stinging insect peak. 'Backyard ready' messaging converts.", cta:"Mosquito-Free Backyard" },
      fall:   { demand:75,  urgency:"MODERATE",       decisionSpeed:"3–7 days",  ticketRange:"$150–$600",     keywords:["rodent exclusion","fall pest control","mice prevention","ant control fall","overwintering pests"],                tip:"Rodent prevention before winter. 'Before they get in' urgency works.", cta:"Fall Rodent Prevention" },
    },
    "Landscaping Company": {
      winter: { demand:30,  urgency:"LOW",             decisionSpeed:"2–4 weeks", ticketRange:"$500–$3K",      keywords:["snow removal","winter landscaping","holiday lighting installation","tree trimming winter","ice removal"],         tip:"Offer snow removal and holiday lighting to maintain revenue. Upsell spring contracts.", cta:"Holiday Lighting & Snow Removal" },
      spring: { demand:100, urgency:"MODERATE",        decisionSpeed:"1–3 weeks", ticketRange:"$1.2K–$50K",    keywords:["lawn care","spring cleanup","mulching","landscaping design","sod installation","irrigation activation"],          tip:"Peak season. Book out early. Use waitlist messaging — urgency converts.", cta:"Book Spring Cleanup Now" },
      summer: { demand:90,  urgency:"LOW",             decisionSpeed:"1–3 weeks", ticketRange:"$1.2K–$4K/yr",  keywords:["lawn mowing","irrigation installation","landscaping maintenance","yard care","lawn treatment"],                 tip:"Maintenance contracts dominate. Every post should push recurring service sign-up.", cta:"Weekly Lawn Care Program" },
      fall:   { demand:75,  urgency:"MODERATE",        decisionSpeed:"1–2 weeks", ticketRange:"$300–$2K",      keywords:["fall cleanup","leaf removal","aeration","overseeding","winterize sprinklers","gutter cleaning"],                 tip:"Bundle aeration + overseeding + cleanup for higher ticket.", cta:"Fall Cleanup Package" },
    },
    "Snow Removal": {
      winter: { demand:100, urgency:"CRITICAL",        decisionSpeed:"Same day",  ticketRange:"$50–$200/visit",keywords:["snow plowing near me","snow removal service","driveway snow removal","commercial snow plowing","ice removal"],   tip:"Same-day emergency demand when storms hit. Speed to lead = job won.", cta:"Storm Response Available" },
      spring: { demand:10,  urgency:"LOW",             decisionSpeed:"N/A",       ticketRange:"N/A",            keywords:["spring landscaping","lawn cleanup","property maintenance"],                                                     tip:"Off-season. Pivot to landscaping. Upsell existing snow clients.", cta:"Spring Lawn Care" },
      summer: { demand:5,   urgency:"LOW",             decisionSpeed:"N/A",       ticketRange:"N/A",            keywords:["fall contract snow removal","early bird snow removal","seasonal maintenance"],                                  tip:"Sign fall/winter contracts now. 'Early bird' pricing creates urgency.", cta:"Reserve Your Winter Contract" },
      fall:   { demand:80,  urgency:"PLANNED",         decisionSpeed:"1–4 weeks", ticketRange:"$600–$3K/season",keywords:["snow removal contract","seasonal snow plowing","commercial snow removal","winter property maintenance","pre-season snow"], tip:"Contract signing window. Most revenue locked in before first snowfall.", cta:"Lock In Your Winter Contract" },
    },
    "Pool Service": {
      winter: { demand:20,  urgency:"LOW",             decisionSpeed:"2–4 weeks", ticketRange:"$200–$500",     keywords:["pool heater repair","pool closing service","pool winterization","indoor pool maintenance","pool equipment repair"], tip:"Northern: winterization done. Southern: heater and reduced service schedule.", cta:"Pool Heater Service" },
      spring: { demand:90,  urgency:"MODERATE",        decisionSpeed:"1–2 weeks", ticketRange:"$200–$600",     keywords:["pool opening service","pool startup","pool cleaning spring","green pool treatment","pool opening near me"],        tip:"Opening surge (April–May North). 'Ready before Memorial Day' converts.", cta:"Pool Opening Service" },
      summer: { demand:100, urgency:"MODERATE",        decisionSpeed:"Same week", ticketRange:"$75–$500",      keywords:["pool cleaning service","pool maintenance","green pool fix","pool chemical service","pool repair near me"],        tip:"Peak maintenance season. Weekly service contracts. Chemical management is recurring revenue.", cta:"Weekly Pool Care Plan" },
      fall:   { demand:65,  urgency:"MODERATE",        decisionSpeed:"1–2 weeks", ticketRange:"$200–$500",     keywords:["pool closing service","pool winterization","pool cover installation","pool equipment inspection","pool closing"],  tip:"Northern markets: closing season (Sept–Oct). Bundle closing + spring opening for LTV.", cta:"Pool Closing & Winterization" },
    },
    "Painting Contractor": {
      winter: { demand:65,  urgency:"LOW",             decisionSpeed:"2–4 weeks", ticketRange:"$500–$5K",      keywords:["interior painting","bedroom painting","kitchen painting winter","interior house painting","wall painting contractor"], tip:"Interior painting peak. Contractors available, often 10–15% off peak pricing.", cta:"Interior Painting Special" },
      spring: { demand:90,  urgency:"PLANNED",         decisionSpeed:"2–6 weeks", ticketRange:"$3K–$10K",      keywords:["exterior painting spring","house painting","exterior house painter","curb appeal painting","exterior paint estimate"], tip:"'Spring curb appeal' messaging converts. Book slots before summer fills up.", cta:"Free Exterior Paint Estimate" },
      summer: { demand:80,  urgency:"MODERATE",        decisionSpeed:"2–4 weeks", ticketRange:"$3K–$12K",      keywords:["exterior painting","deck painting","fence staining","house painting contractor","commercial painting"],            tip:"Peak execution season. Reviews from summer projects build fall credibility.", cta:"Book Your Summer Slot" },
      fall:   { demand:85,  urgency:"MODERATE",        decisionSpeed:"1–3 weeks", ticketRange:"$2K–$10K",      keywords:["exterior painting fall","house painting before winter","commercial painting fall","interior painting fall","pre-winter paint"], tip:"Best contractor availability of year. 'Last chance before winter' exterior messaging converts.", cta:"Pre-Winter Exterior Painting" },
    },
    "Gutter Service": {
      winter: { demand:40,  urgency:"HIGH",            decisionSpeed:"1–3 days",  ticketRange:"$200–$1K",      keywords:["ice dam removal","gutter repair winter","frozen gutter","gutter emergency","roof ice dam"],                        tip:"Ice dams from clogged gutters cause roof damage. Emergency repair content critical.", cta:"Ice Dam & Gutter Emergency" },
      spring: { demand:85,  urgency:"MODERATE",        decisionSpeed:"1–2 weeks", ticketRange:"$150–$2K",      keywords:["gutter cleaning spring","gutter repair","gutter guard installation","spring gutter service","clogged gutters"],    tip:"Post-winter debris surge. 'Ready for spring rains' messaging works.", cta:"Spring Gutter Cleaning" },
      summer: { demand:50,  urgency:"LOW",             decisionSpeed:"2–3 weeks", ticketRange:"$150–$2.5K",    keywords:["gutter guard installation","seamless gutters","gutter replacement","gutter cleaning summer"],                       tip:"Slower season. Push gutter guard installation — high ticket, prevents fall cleaning.", cta:"Gutter Guard Installation" },
      fall:   { demand:100, urgency:"MODERATE",        decisionSpeed:"1–2 weeks", ticketRange:"$150–$2.5K",    keywords:["gutter cleaning fall","leaf gutter cleaning","gutter cleaning near me","fall gutter service","gutter before winter"], tip:"Peak season. October–November is maximum leaf debris. 2–3 cleanings/year messaging drives contracts.", cta:"Fall Gutter Cleaning" },
    },
    "Insulation Contractor": {
      winter: { demand:60,  urgency:"MODERATE",        decisionSpeed:"2–4 weeks", ticketRange:"$1.5K–$10K",    keywords:["attic insulation","energy audit winter","weatherproofing","insulation contractor","draft sealing"],                 tip:"'Why is my house so cold?' energy audit content converts.", cta:"Free Energy Audit" },
      spring: { demand:70,  urgency:"LOW",             decisionSpeed:"2–4 weeks", ticketRange:"$1.5K–$10K",    keywords:["attic insulation spring","spray foam insulation","insulation upgrade","energy efficiency home","blown in insulation"], tip:"Post-heating-season energy bill review. ROI messaging converts.", cta:"Spring Insulation Special" },
      summer: { demand:60,  urgency:"LOW",             decisionSpeed:"2–4 weeks", ticketRange:"$1.5K–$10K",    keywords:["attic insulation summer","cool house insulation","energy savings","AC efficiency insulation","insulation upgrade"], tip:"'Keep cool and lower your AC bill.' Cooling cost savings is the summer hook.", cta:"Lower Your AC Bill" },
      fall:   { demand:100, urgency:"PLANNED",         decisionSpeed:"1–3 weeks", ticketRange:"$1.5K–$20K",    keywords:["attic insulation before winter","weatherproofing fall","insulation contractor near me","pre-winter insulation","energy audit fall"], tip:"Peak season. 'Before heating bills spike' is the strongest message.", cta:"Pre-Winter Insulation Upgrade" },
    },
    "Cleaning Service": {
      winter: { demand:70,  urgency:"HIGH",            decisionSpeed:"3–7 days",  ticketRange:"$200–$500",     keywords:["house cleaning holiday","deep cleaning before Christmas","move out cleaning","post-party cleaning","holiday cleaning service"], tip:"Holiday deep clean drives November–December demand. Urgency is real.", cta:"Holiday Deep Clean" },
      spring: { demand:100, urgency:"MODERATE",        decisionSpeed:"1–2 weeks", ticketRange:"$200–$500",     keywords:["spring cleaning service","deep cleaning","house cleaning near me","spring cleaning special","residential cleaning"], tip:"'Spring cleaning' is culturally embedded. Highest demand of the year.", cta:"Spring Deep Clean Special" },
      summer: { demand:70,  urgency:"LOW",             decisionSpeed:"1–2 weeks", ticketRange:"$150–$600",     keywords:["move out cleaning","move in cleaning","summer house cleaning","vacation rental cleaning","post-construction cleaning"], tip:"Moving season (May–Sept) drives move-in/out cleaning demand.", cta:"Move-In/Out Cleaning" },
      fall:   { demand:80,  urgency:"MODERATE",        decisionSpeed:"3–7 days",  ticketRange:"$200–$500",     keywords:["fall deep cleaning","pre-holiday cleaning","house cleaning fall","Thanksgiving cleaning","year-end cleaning"],     tip:"Pre-Thanksgiving deep clean is a distinct demand spike (first 2 weeks of November).", cta:"Pre-Thanksgiving Deep Clean" },
    },
    "Moving Company": {
      winter: { demand:35,  urgency:"DATE-DRIVEN",     decisionSpeed:"4–12 weeks",ticketRange:"$800–$5K",      keywords:["local movers","winter moving discount","affordable moving company","moving company near me","residential movers"], tip:"Off-season. Up to 20% cheaper — push this in content.", cta:"Off-Season Moving Discount" },
      spring: { demand:75,  urgency:"DATE-DRIVEN",     decisionSpeed:"4–8 weeks", ticketRange:"$1K–$8K",       keywords:["moving company spring","local movers near me","residential moving","apartment movers","spring relocation"],         tip:"April leases turn. 'Limited weekend availability' creates urgency.", cta:"Book Your Spring Move" },
      summer: { demand:100, urgency:"DATE-DRIVEN",     decisionSpeed:"4–12 weeks",ticketRange:"$800–$12K",     keywords:["moving company near me","local movers","long distance movers","summer moving","moving truck rental"],               tip:"60%+ of all moves happen May–September. June is the single highest volume month.", cta:"Summer Move — Book Now" },
      fall:   { demand:60,  urgency:"DATE-DRIVEN",     decisionSpeed:"4–8 weeks", ticketRange:"$800–$8K",      keywords:["fall moving company","local movers fall","residential movers","college move out","corporate relocation fall"],      tip:"Labor Day weekend still high demand. October–November is true off-season start.", cta:"Fall Moving Special" },
    },
    "Electrician": {
      winter: { demand:85,  urgency:"HIGH",            decisionSpeed:"1–3 days",  ticketRange:"$200–$6K",      keywords:["heating system wiring","electric fireplace","panel upgrade for heating","emergency electrical","generator installation"], tip:"Heating season drives electrical demand. Generator installs spike with winter storm risk.", cta:"24/7 Emergency Service" },
      spring: { demand:70,  urgency:"PLANNED",         decisionSpeed:"1–3 weeks", ticketRange:"$500–$10K",     keywords:["outdoor lighting","EV charger installation","panel upgrade","home renovation wiring","solar panel wiring"],          tip:"Spring renovations need electricians. EV charger installs are year-round growing demand.", cta:"Free Electrical Inspection" },
      summer: { demand:75,  urgency:"MODERATE",        decisionSpeed:"3–7 days",  ticketRange:"$500–$10K",     keywords:["AC wiring","generator installation","pool pump wiring","outdoor outlet","panel upgrade summer"],                     tip:"AC and outdoor projects peak. Generator installs before hurricane season in South.", cta:"Same Day Service" },
      fall:   { demand:80,  urgency:"PLANNED",         decisionSpeed:"1–2 weeks", ticketRange:"$500–$10K",     keywords:["heating system wiring","backup generator","panel upgrade for winter","smart home","EV charger fall"],              tip:"Pre-winter demand rises. Generator and heating wiring drive fall bookings.", cta:"Winter-Ready Electrical" },
    },
    "Dentist": {
      winter: { demand:70,  urgency:"MODERATE",        decisionSpeed:"1–2 weeks", ticketRange:"$200–$5K",      keywords:["teeth whitening for holidays","dental emergency","teeth grinding mouthguard","dental insurance deadline","end of year dental"], tip:"Year-end insurance deadline drives huge demand Nov–Dec. Post urgency content.", cta:"Use Your Benefits Before Dec 31" },
      spring: { demand:80,  urgency:"PLANNED",         decisionSpeed:"2–4 weeks", ticketRange:"$500–$8K",      keywords:["teeth whitening","Invisalign","spring smile makeover","cosmetic dentistry","dental implants spring"],                tip:"Wedding and graduation season. Cosmetic procedures spike. Post transformation photos.", cta:"Spring Smile Makeover" },
      summer: { demand:65,  urgency:"LOW",             decisionSpeed:"2–4 weeks", ticketRange:"$200–$3K",      keywords:["back to school dental","kids dentist","dental checkup","sports mouthguard","family dentist"],                      tip:"Back-to-school checkups. Target parents. Post family-friendly content.", cta:"Back to School Special" },
      fall:   { demand:85,  urgency:"PLANNED",         decisionSpeed:"1–3 weeks", ticketRange:"$500–$8K",      keywords:["dental insurance maximum","year-end dental","implants before new year","Invisalign fall","dental benefits"],         tip:"Q4 is highest-value season — patients rush to use remaining insurance before Dec 31.", cta:"Book Before Dec 31" },
    },
    "Family Law Attorney": {
      winter: { demand:85,  urgency:"MODERATE",        decisionSpeed:"1–3 weeks", ticketRange:"$2K–$30K",      keywords:["divorce attorney","child custody January","new year divorce","family law consultation","divorce lawyer near me"],    tip:"January is 'Divorce Month' — highest search intent of the year after holidays.", cta:"Free Consultation This Week" },
      spring: { demand:75,  urgency:"MODERATE",        decisionSpeed:"2–4 weeks", ticketRange:"$2K–$30K",      keywords:["divorce mediation","custody modification","family lawyer","separation agreement","divorce attorney spring"],         tip:"Post-holiday resolutions continue. Tax season triggers asset discussions.", cta:"Protect Your Rights" },
      summer: { demand:65,  urgency:"LOW",             decisionSpeed:"2–6 weeks", ticketRange:"$1K–$20K",      keywords:["summer custody schedule","divorce attorney","child support modification","co-parenting agreement"],                  tip:"Custody schedule disputes peak in summer. Target co-parenting content.", cta:"Summer Custody Solutions" },
      fall:   { demand:80,  urgency:"MODERATE",        decisionSpeed:"1–3 weeks", ticketRange:"$2K–$30K",      keywords:["divorce before year end","custody for holidays","family law attorney","asset division fall","holiday custody"],      tip:"Year-end financial and holiday custody drives high-intent searches.", cta:"Resolve Before the Holidays" },
    },
    "Car Detailing Service": {
      winter: { demand:50,  urgency:"LOW",             decisionSpeed:"1–2 weeks", ticketRange:"$150–$500",     keywords:["interior car detailing","salt damage protection","ceramic coating winter","car wash detailing","car detailing winter"], tip:"Salt and road grime season. Interior and ceramic coating promotions work best.", cta:"Winter Protection Package" },
      spring: { demand:95,  urgency:"MODERATE",        decisionSpeed:"1–2 weeks", ticketRange:"$200–$800",     keywords:["spring car detailing","paint correction","car wax","full detail special","spring auto detail"],                     tip:"Highest demand season. 'Spring cleaning' messaging converts extremely well.", cta:"Spring Detail Special" },
      summer: { demand:85,  urgency:"LOW",             decisionSpeed:"1–2 weeks", ticketRange:"$200–$800",     keywords:["car detailing","UV paint protection","ceramic coating","auto detailing near me","road trip detail"],                tip:"UV protection and road trip prep. Before/after photos drive summer conversions.", cta:"Road Trip Ready Detail" },
      fall:   { demand:70,  urgency:"LOW",             decisionSpeed:"1–2 weeks", ticketRange:"$150–$600",     keywords:["fall car detailing","paint sealant","winter prep detailing","full detail","pre-winter auto detail"],                tip:"Pre-winter protection. 'Protect your car from winter' messaging works well.", cta:"Pre-Winter Protection" },
    },
    "IT Services & Computer Repair": {
      winter: { demand:75,  urgency:"MODERATE",        decisionSpeed:"1–5 days",  ticketRange:"$150–$3K",      keywords:["computer repair","laptop repair","year-end IT services","business IT support","network upgrade"],                    tip:"Year-end budget spending on IT. Target businesses with Q4 IT upgrade content.", cta:"Year-End IT Solutions" },
      spring: { demand:70,  urgency:"LOW",             decisionSpeed:"3–7 days",  ticketRange:"$150–$2K",      keywords:["computer repair","data recovery","network setup","IT support","spring tech tune-up"],                               tip:"Spring cleaning season extends to tech. 'Spring tech tune-up' campaigns work.", cta:"Spring Tech Tune-Up" },
      summer: { demand:65,  urgency:"MODERATE",        decisionSpeed:"1–3 days",  ticketRange:"$150–$800",     keywords:["computer overheating","laptop repair","IT services","cybersecurity","summer tech issues"],                          tip:"Heat causes hardware issues. 'Is your computer overheating?' content drives clicks.", cta:"Free Diagnostic Check" },
      fall:   { demand:85,  urgency:"LOW",             decisionSpeed:"3–7 days",  ticketRange:"$500–$5K",      keywords:["back to school computer","laptop repair","IT services for business","network upgrade","Q4 IT"],                    tip:"Back-to-school and Q4 business planning. Highest commercial IT demand.", cta:"Business IT Ready for Q4" },
    },
    "Digital Marketing Agency": {
      winter: { demand:60,  urgency:"LOW",             decisionSpeed:"2–6 weeks", ticketRange:"$1K–$10K/mo",   keywords:["local SEO audit","GBP optimization","2026 SEO strategy","digital marketing agency","GBP management"],               tip:"Businesses plan budgets in Q1. Target 'new year, new strategy' content.", cta:"Free GBP Audit" },
      spring: { demand:85,  urgency:"MODERATE",        decisionSpeed:"2–4 weeks", ticketRange:"$1K–$10K/mo",   keywords:["spring marketing","local SEO services","Google Maps ranking","digital marketing","GBP optimization"],               tip:"Businesses activate after winter. High intent to hire agencies in March–May.", cta:"Spring Growth Package" },
      summer: { demand:70,  urgency:"LOW",             decisionSpeed:"2–6 weeks", ticketRange:"$1K–$10K/mo",   keywords:["local business marketing","review management","GBP optimization","SEO services","local search ranking"],             tip:"Steady demand. Focus on case studies from Q1/Q2 results.", cta:"See Our Results" },
      fall:   { demand:90,  urgency:"MODERATE",        decisionSpeed:"2–4 weeks", ticketRange:"$2K–$15K/mo",   keywords:["Q4 marketing strategy","holiday local SEO","year-end optimization","GBP audit","Q4 digital marketing"],             tip:"Q4 planning drives highest-value contracts. Target decision-makers now.", cta:"Q4 Strategy Session" },
    },
  };

  const SEASONAL_TRIGGERS = {
    "HVAC Contractor": {
      winter: { problem:"Furnace stopped — no heat in the home",         cause:"Temperature dropped below 40°F; aging or overtaxed system",         action:"Emergency search 'furnace repair near me' — decision within hours", result:"Restore heat before pipes freeze and family is at risk" },
      spring: { problem:"Worried AC will fail during first heat wave",    cause:"Last summer's breakdown memory + rising temperatures",               action:"Search 'AC tune-up near me' — planned, 1–2 week decision",          result:"Reliable cooling all summer without emergency cost" },
      summer: { problem:"AC stopped cooling on first 90°F+ day",          cause:"System overtaxed by first extreme heat event of the season",          action:"Emergency search 'AC repair near me' — decision in hours",          result:"Restore cooling before heat becomes a health emergency" },
      fall:   { problem:"Concerned about heating system before winter",   cause:"First cold night + last year's heating bill memory",                 action:"Search 'furnace tune-up near me' — planned, books ahead",           result:"Reliable heating all winter without emergency cost" },
    },
    "Plumber": {
      winter: { problem:"Burst pipe / no water / flooding inside walls",  cause:"Temperature dropped below 20°F; uninsulated pipes froze",            action:"Emergency search 'emergency plumber near me' — decision in minutes", result:"Stop flooding, restore water, prevent structural damage" },
      spring: { problem:"Sump pump not working as spring thaw floods basement", cause:"Snow melt + spring rain overwhelms drainage system",            action:"Search 'sump pump installation near me' — 1–3 day decision",        result:"Dry basement throughout spring rain season" },
      summer: { problem:"Slow drains / leaking faucet / remodel needs plumber", cause:"Heavy summer usage + home renovation projects",                 action:"Search 'plumber near me' — 1–5 day decision",                       result:"Functioning plumbing for summer household use" },
      fall:   { problem:"Worried about pipes freezing this winter",        cause:"News about past freeze events + dropping temperatures",               action:"Search 'pipe insulation' or 'winterize plumbing' — planned",        result:"Protected pipes all winter; no burst pipe emergency" },
    },
    "Roofing Contractor": {
      winter: { problem:"Roof leaking / ice dam causing interior water damage", cause:"Heavy snow load + freeze-thaw cycle creates ice dams",           action:"Emergency search 'roof repair near me' — 1–3 day decision",         result:"Stop interior damage before structural problems develop" },
      spring: { problem:"Missing shingles / visible damage after winter",  cause:"Winter freeze-thaw cycles and ice dams revealed post-thaw",           action:"Search 'roof inspection near me' — 1–3 week decision",              result:"Repaired roof ready for spring storm season" },
      summer: { problem:"Planning roof replacement; current roof is aging", cause:"Summer is when family is home and projects make sense",               action:"Research 'roof replacement cost' — 3–8 week decision",              result:"New roof installed before next winter season" },
      fall:   { problem:"Roof needs replacement before winter hits",        cause:"September inspection reveals aging shingles + winter approaching",    action:"Urgent search 'roof replacement before winter' — 1–3 week",         result:"New roof installed and home protected for winter" },
    },
    "Pest Control": {
      winter: { problem:"Mice or rats getting inside through gaps in the home", cause:"Temperature drop drives rodents indoors seeking warmth",         action:"Search 'rodent exterminator near me' — 3–7 day decision",           result:"Rodent-free home; entry points sealed before deep winter" },
      spring: { problem:"Termite swarm seen in or near the home",          cause:"Warm weather (65°F+) triggers annual termite swarm season",            action:"Urgent search 'termite treatment near me' — 2–5 day decision",     result:"Protected from structural damage; treatment before colony establishes" },
      summer: { problem:"Mosquitoes making backyard unusable for family",  cause:"Standing water + heat = fastest mosquito breeding cycle",              action:"Search 'mosquito control service near me' — 1–2 week decision",     result:"Usable outdoor space for summer entertaining" },
      fall:   { problem:"Seeing more insects inside as weather cools",      cause:"Insects seeking warmth as outdoor temps drop",                       action:"Search 'pest control near me' — 3–7 day decision",                  result:"Pest-free home entering winter season" },
    },
    "Landscaping Company": {
      winter: { problem:"Driveway buried in snow; property inaccessible",  cause:"Overnight snowstorm with no plowing contract in place",               action:"Emergency search 'snow removal near me' — same-day decision",       result:"Accessible property; no slip/liability hazard" },
      spring: { problem:"Yard looks dead after winter; neighbors' yards are green", cause:"First warm weekend + visible neighborhood activity",           action:"Search 'lawn care near me' — 1–3 week decision",                    result:"Curb appeal restored; lawn ready for spring and summer" },
      summer: { problem:"Lawn growing too fast; no time to maintain it weekly", cause:"Peak growing season + busy family summer schedule",               action:"Search 'weekly lawn care near me' — 1–3 week decision",             result:"Maintained lawn all summer without effort" },
      fall:   { problem:"Leaves covering lawn; need aeration before winter", cause:"Leaf fall peak + first frost warning",                              action:"Search 'fall lawn cleanup' or 'aeration service' — 1–2 week",       result:"Healthy lawn ready for next spring" },
    },
    "Snow Removal": {
      winter: { problem:"Business parking lot buried; operations blocked",  cause:"Overnight snowstorm; no plowing contract in place",                  action:"Emergency search 'snow plowing near me' — same-day decision",       result:"Accessible property; business operations restored" },
      spring: { problem:"Snow season ending; property has debris and damage", cause:"Snow season transition; need spring cleanup",                      action:"Search 'spring property cleanup' — planned",                         result:"Property ready for spring season" },
      summer: { problem:"Need to secure winter contract before fall rush",   cause:"Better pricing and availability before October crunch",              action:"Research 'snow removal contract near me' — low urgency",             result:"Reliable winter coverage locked in at best price" },
      fall:   { problem:"Last year's plowing was unreliable; need contract now", cause:"October temperatures dropping + first frost creates urgency",   action:"Search 'snow removal service near me' — 1–4 week decision",         result:"Reliable coverage guaranteed before first snowfall" },
    },
    "Pool Service": {
      winter: { problem:"Pool heater not working; can't use pool in cooler months", cause:"Equipment failure from off-season inactivity",               action:"Search 'pool heater repair near me' — 1–2 week decision",           result:"Pool usable year-round in warm-weather markets" },
      spring: { problem:"Pool has been closed all winter; green water",     cause:"Warmer weather returning; Memorial Day approaching",                  action:"Search 'pool opening service near me' — 1–2 week decision",         result:"Clean, safe pool ready before summer swim season" },
      summer: { problem:"Pool turned green overnight / equipment issue",    cause:"Extreme heat + heavy use accelerates chemical imbalance",             action:"Search 'pool cleaning near me' — same-week decision",               result:"Clear, safe pool restored for family use" },
      fall:   { problem:"Pool needs closing before freeze damages equipment", cause:"First frost warning + end of swim season",                         action:"Search 'pool closing service near me' — 1–2 week decision",         result:"Equipment protected through winter; no spring damage repairs" },
    },
    "Painting Contractor": {
      winter: { problem:"Interior looks dingy; want a refresh while indoors", cause:"Spending more time at home highlights paint condition",             action:"Search 'interior painter near me' — 2–4 week decision",             result:"Refreshed living space at better pricing than peak season" },
      spring: { problem:"Exterior paint peeling / faded after winter",       cause:"Spring inspection after winter weathering reveals damage",           action:"Search 'exterior painter near me' — 2–6 week decision",             result:"Curb appeal restored; home protected for summer" },
      summer: { problem:"Exterior or deck needs painting while weather is ideal", cause:"Dry, warm conditions are perfect for exterior paint adhesion", action:"Search 'house painting contractor near me' — 2–4 week decision",    result:"Completed exterior job that lasts 5–10 years" },
      fall:   { problem:"Last chance to paint exterior before winter",       cause:"Dropping temperatures will prevent proper exterior paint curing",    action:"Search 'exterior painting near me' — 1–3 week urgent decision",     result:"Protected exterior going into winter; best availability of year" },
    },
    "Gutter Service": {
      winter: { problem:"Ice dams / water backing up under shingles",        cause:"Clogged gutters preventing proper drainage + freeze-thaw cycle",     action:"Emergency search 'ice dam removal near me' — 1–3 day decision",     result:"Stop interior damage; gutters cleared for proper drainage" },
      spring: { problem:"Gutters full of winter debris; spring rains overflowing", cause:"Winter leaves/debris + first heavy spring rain reveals blockage", action:"Search 'gutter cleaning near me' — 1–2 week decision",             result:"Properly draining gutters; no foundation water damage" },
      summer: { problem:"Gutters sagging or pulling away from fascia",       cause:"Weight of accumulated debris + summer storms accelerate damage",      action:"Search 'gutter repair near me' — 2–3 week decision",                result:"Secure gutters before fall leaf season" },
      fall:   { problem:"Leaves clogging gutters after every rain",          cause:"Peak leaf fall (Oct–Nov) with no guards or recent cleaning",          action:"Search 'gutter cleaning near me' — 1–2 week decision",              result:"Clean gutters before winter freeze; no ice dams next season" },
    },
    "Insulation Contractor": {
      winter: { problem:"Drafts and cold spots throughout house; high heating bills", cause:"Aging insulation + air leaks discovered during cold season",  action:"Search 'attic insulation near me' or 'energy audit' — 2–4 weeks",  result:"Warmer home with lower heating costs" },
      spring: { problem:"Received high heating bill; want to prevent it next winter", cause:"Post-heating-season energy bill review reveals inefficiency",  action:"Search 'insulation contractor near me' — 2–4 week decision",       result:"Improved efficiency saves 10–15% on annual energy bills" },
      summer: { problem:"AC constantly running; house never feels cool enough", cause:"Poor attic insulation allows heat gain through roof",              action:"Search 'attic insulation summer' — 2–4 week decision",              result:"Lower AC bills; more comfortable home during heat season" },
      fall:   { problem:"Winter approaching; last year's heating bills were too high", cause:"First cold snap + news about energy prices creates urgency", action:"Search 'attic insulation before winter' — 1–3 week urgent decision", result:"Lower heating bills all winter; more comfortable home" },
    },
    "Cleaning Service": {
      winter: { problem:"Home needs deep clean before holiday guests arrive", cause:"Thanksgiving or Christmas approaching; home not presentable",        action:"Urgent search 'deep cleaning service near me' — 3–7 day decision",  result:"Presentable, clean home for holiday gatherings" },
      spring: { problem:"Home feels grimy and stale after winter",           cause:"Spring psychological reset + cultural 'spring cleaning' trigger",    action:"Search 'house cleaning service near me' — 1–2 week decision",       result:"Fresh, clean home entering spring and summer" },
      summer: { problem:"Moving out / into new home; need professional clean", cause:"Summer lease turnover + moving season peak (May–September)",       action:"Search 'move out cleaning near me' — urgent date-driven decision",   result:"Deposit returned or new home spotless on move-in day" },
      fall:   { problem:"Home needs pre-Thanksgiving deep clean",            cause:"Thanksgiving approaching; no deep clean since spring",                action:"Search 'deep cleaning near me' — 3–7 day decision",                 result:"Home ready for holiday hosting season" },
    },
    "Moving Company": {
      winter: { problem:"Need to relocate in off-season; looking for best value", cause:"Job relocation or lease change in slower moving season",         action:"Search 'moving company near me' — 4–8 week advance planning",       result:"Smooth move at 15–20% off peak pricing with better availability" },
      spring: { problem:"Need to move before summer; lease ending in May",   cause:"Spring lease expiration + end of school year approaching",            action:"Search 'local movers near me' — 4–8 week advance booking",          result:"Move completed before peak summer rush and rate increases" },
      summer: { problem:"Must move before school year starts in August",      cause:"School calendar deadline; June–August is peak moving season",         action:"Search 'moving company near me' — 4–12 week advance booking",       result:"Family settled in new home before first day of school" },
      fall:   { problem:"Need to move after summer; post-Labor Day window",  cause:"School year established; lease ending September or October",          action:"Search 'movers near me fall' — 4–8 week advance booking",           result:"Move completed before winter makes it more difficult" },
    },
    "Electrician": {
      winter: { problem:"Breakers tripping under winter heating load",        cause:"Space heaters + holiday lights + heating system overtaxing aging panel", action:"Search 'electrician near me' — 1–3 day decision",              result:"Safe electrical system capable of handling winter load" },
      spring: { problem:"Want EV charger installed before summer driving",   cause:"Buying an EV or planning summer road trips; charger needed at home",  action:"Search 'EV charger installation near me' — 1–3 week decision",     result:"Home charging capability; no more public charger dependency" },
      summer: { problem:"Outdoor lighting / pool pump / AC wiring issue",    cause:"Summer outdoor use + AC season reveals electrical capacity gaps",      action:"Search 'electrician near me' — 3–7 day decision",                  result:"Safe outdoor electrical for summer entertaining and cooling" },
      fall:   { problem:"Need backup generator before winter storm season",  cause:"Last winter's outage + approaching storm season creates urgency",      action:"Search 'generator installation near me' — 1–3 week decision",      result:"Power security all winter; no food loss or heat failure during outages" },
    },
    "Dentist": {
      winter: { problem:"Dental benefits expiring December 31; unused",       cause:"Year-end insurance deadline + holiday smile motivation",              action:"Search 'dentist near me accepting insurance' — 1–2 week urgent",    result:"Benefits used before they expire; improved smile for holidays" },
      spring: { problem:"Want smile makeover for wedding/graduation season",  cause:"Event approaching + spring renewal mindset",                          action:"Search 'teeth whitening near me' or 'Invisalign' — 2–4 weeks",     result:"Confident smile for important life event" },
      summer: { problem:"Kids need dental checkup before school starts",      cause:"Back-to-school checklist; pediatric dental requirement",              action:"Search 'kids dentist near me' — 2–4 week planned decision",         result:"Kids cleared for school; cavity detected and treated early" },
      fall:   { problem:"Need major dental work before year-end insurance resets", cause:"Q4 insurance pressure + holiday appearance motivation",          action:"Search 'dental implants near me' — 1–3 week decision",             result:"Treatment completed using current year's benefits" },
    },
    "Family Law Attorney": {
      winter: { problem:"Marriage is over; need to start divorce in the new year", cause:"Holidays surfaced irreconcilable issues; January fresh start",   action:"Search 'divorce attorney near me' — 1–3 week decision",            result:"Legal process started; clarity and protection of rights" },
      spring: { problem:"Tax filing revealed hidden assets or financial disagreements", cause:"Tax season forces financial transparency between spouses",    action:"Search 'family law attorney near me' — 2–4 week decision",         result:"Legal counsel before financial decisions are made" },
      summer: { problem:"Custody schedule not working for summer activities", cause:"School's out; summer schedule conflicts with custody agreement",       action:"Search 'custody attorney near me' — 2–6 week decision",            result:"Modified custody arrangement that works for both parties" },
      fall:   { problem:"Need custody resolved before holiday season",        cause:"Holidays approaching + disagreement about holiday schedule",           action:"Search 'family law attorney near me' — 1–3 week decision",         result:"Clear legal agreement in place before Thanksgiving and Christmas" },
    },
    "Car Detailing Service": {
      winter: { problem:"Road salt and grime destroying car's paint",         cause:"Winter driving on salted roads causes accelerated paint damage",       action:"Search 'car detailing near me' — 1–2 week decision",               result:"Salt removed; ceramic coating protects through remaining winter" },
      spring: { problem:"Car looks terrible after winter; want it looking new", cause:"Spring sunshine reveals winter damage + comparison to neighbors",   action:"Search 'car detailing near me' — 1–2 week decision",               result:"Showroom-clean car entering spring and summer" },
      summer: { problem:"Car needs UV protection and road trip prep",         cause:"Summer UV rays + road trip planning",                                  action:"Search 'auto detailing near me' — 1–2 week decision",               result:"Protected paint + spotless interior for summer road trips" },
      fall:   { problem:"Car needs protection before winter salt season",     cause:"Approaching winter + memory of last year's salt damage",               action:"Search 'car detailing near me' — 1–2 week decision",               result:"Ceramic or sealant protection for winter season" },
    },
    "IT Services & Computer Repair": {
      winter: { problem:"Computer slow at year-end; need upgrade for new year", cause:"Year-end IT budget available + business planning for new year",     action:"Search 'IT services near me' — 1–5 day decision",                  result:"Upgraded, reliable system entering new year" },
      spring: { problem:"Computer acting slow after being on all winter",      cause:"'Spring cleaning' mindset extends to tech; tax season on aging system", action:"Search 'computer repair near me' — 3–7 day decision",           result:"Fast, clean computer for spring productivity" },
      summer: { problem:"Computer overheating in summer heat",                 cause:"High ambient temperatures + heavy usage causes thermal issues",        action:"Search 'computer repair near me' — 1–3 day urgent decision",       result:"Functioning computer throughout summer; no data loss" },
      fall:   { problem:"Business IT not ready for Q4 busy season",           cause:"Holiday business ramp-up approaching; current infrastructure insufficient", action:"Search 'IT services near me' — 3–7 day decision",           result:"IT infrastructure ready to handle Q4 business volume" },
    },
    "Digital Marketing Agency": {
      winter: { problem:"GBP not optimized; losing leads to competitors",     cause:"Q1 budget cycle + competitors starting strong with fresh strategies", action:"Search 'local SEO agency near me' — 2–6 week decision",             result:"Optimized local presence capturing Q1 demand" },
      spring: { problem:"Business picking up but not in Google Maps top 3",   cause:"Spring demand surge + awareness of ranking below competitors",         action:"Search 'local SEO services near me' — 2–4 week decision",          result:"Improved Maps ranking to capture spring high-intent searches" },
      summer: { problem:"Competitors getting reviews and ranking higher",      cause:"Peak season competition + visible rankings gap",                       action:"Search 'review management service' or 'GBP agency' — 2–6 weeks",   result:"More reviews, better ranking, more leads from Google Maps" },
      fall:   { problem:"Need Q4 strategy before holiday busy season",         cause:"Q4 planning cycle + awareness of missed Q3 opportunities",             action:"Search 'digital marketing agency near me' — 2–4 week decision",    result:"Optimized presence capturing highest-value Q4 searches" },
    },
  };

  const currentSeason = Object.entries(SEASONS).find(([, s]) => s.months.includes(activeMonth))?.[0] || "spring";
  const season = SEASONS[currentSeason];
  const nicheData = NICHE_SEASONS[client.category] || NICHE_SEASONS["Home Renovation Contractor"];
  const seasonData = nicheData[currentSeason];
  const _triggerMap = SEASONAL_TRIGGERS[client.category] || SEASONAL_TRIGGERS["HVAC Contractor"];
  const trigger = _triggerMap ? _triggerMap[currentSeason] : { problem:"—", cause:"—", action:"—", result:"—" };

  const clientState = (client.state || "").toUpperCase().trim();
  const regionType = REGIONAL_CLIMATE[clientState] || "moderate";
  const regionInfo = REGIONAL_LABEL[regionType];
  const regionMult = REGIONAL_MULTIPLIER[regionType];

  const vol = CATEGORY_VOLATILITY[client.category] || 5;
  const monthScore = seasonData.demand >= 90 ? 10 : seasonData.demand >= 75 ? 8 : seasonData.demand >= 55 ? 5 : 2;
  const opportunityScore = Math.min(100, Math.round(vol * regionMult * monthScore * 0.67));
  const scoreColor = opportunityScore >= 70 ? C.red : opportunityScore >= 45 ? C.yellow : C.green;
  const scoreLabel = opportunityScore >= 70 ? "HIGH OPPORTUNITY" : opportunityScore >= 45 ? "MODERATE" : "LOW SEASON";

  const allMonthDemands = Array.from({ length: 12 }, (_, i) => {
    const s = Object.entries(SEASONS).find(([, ss]) => ss.months.includes(i))?.[0];
    return { month: i, demand: nicheData[s]?.demand || 0 };
  });
  const futurePeaks = allMonthDemands.filter(m => m.month > activeMonth && m.demand >= 90);
  const nextPeak = futurePeaks[0];
  const daysUntilPeak = nextPeak ? (nextPeak.month - activeMonth) * 30 : null;
  const isPreSeasonWindow = daysUntilPeak !== null && daysUntilPeak > 0 && daysUntilPeak <= 45;

  const urgencyColor = { CRITICAL:"#ef4444", HIGH:"#f97316", MODERATE:"#f59e0b", PLANNED:"#06b6d4", LOW:"#10b981", "DATE-DRIVEN":"#8b5cf6" };
  const urgencyLabel = {};

  const CONSUMER_BEHAVIOR = {
    winter: [
      { behavior:"Urgency-first decisions",          detail:"Americans call the first result that answers. Speed to respond = job won." },
      { behavior:"Mobile search dominant",           detail:"Searching from the car or couch. Mobile-optimized profile critical." },
      { behavior:"Reviews matter more",              detail:"Cold weather = trust issues. 5-star reviews with 'professional' keywords convert." },
      { behavior:"Price secondary to availability",  detail:"In an emergency, ticket is higher. 'Same day service' in profile = premium." },
    ],
    spring: [
      { behavior:"Research phase (weeks)",           detail:"Americans compare 3–5 contractors before deciding. Reviews + photos = winner." },
      { behavior:"Price-conscious",                  detail:"Multiple quotes requested. 'Free estimate' CTA critical." },
      { behavior:"Social proof dominant",            detail:"Before/after photos and video content convert 40% better in spring." },
      { behavior:"Weekend decisions",                detail:"Most local searches happen Friday–Sunday. Schedule posts for Friday." },
    ],
    summer: [
      { behavior:"Largest project season",           detail:"Highest ticket average. Customers invest in quality. Show premium work." },
      { behavior:"Long research window",             detail:"Big projects planned weeks/months ahead. Consistent posts build trust." },
      { behavior:"Review velocity critical",         detail:"Summer projects = summer reviews. Ask every completed job." },
      { behavior:"Word-of-mouth peaks",              detail:"Neighbors talk. Google mentions of neighborhoods boost local authority." },
    ],
    fall: [
      { behavior:"Preventive mindset",               detail:"Americans prepare for winter. 'Before it gets cold' messaging works." },
      { behavior:"Budget finalization",              detail:"Using remaining budget before year-end. Urgency without emergency." },
      { behavior:"Trust established in summer",      detail:"Follow up with summer clients for reviews and referrals now." },
      { behavior:"Booking ahead",                   detail:"Schedule fall appointments in August posts. 'Limited slots' creates urgency." },
    ],
  };

  const behavior = CONSUMER_BEHAVIOR[currentSeason];
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const monthSeason = (m) => Object.entries(SEASONS).find(([,s]) => s.months.includes(m))?.[0];

  return (
    <div>
      <SectionTitle>Seasonality Intelligence — {client.name}</SectionTitle>

      {/* Regional profile + Opportunity Score */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr auto", gap:12, marginBottom:16 }}>
        <Card style={{ border:`1px solid ${regionInfo.color}44`, padding:"12px 16px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:10, height:10, borderRadius:"50%", background:regionInfo.color, flexShrink:0 }} />
            <div>
              <div style={{ fontWeight:700, fontSize:13, color:regionInfo.color }}>{regionInfo.label}{clientState ? ` — ${clientState}` : ""}</div>
              <div style={{ fontSize:12, color:C.textMuted, marginTop:2 }}>{regionInfo.desc}</div>
            </div>
            <div style={{ marginLeft:"auto", fontSize:12, color:C.textMuted }}>Multiplier: <strong style={{color:C.text}}>{regionMult}x</strong></div>
          </div>
        </Card>
        <Card style={{ border:`1px solid ${scoreColor}55`, padding:"12px 20px", textAlign:"center", minWidth:140 }}>
          <div style={{ fontSize:11, color:C.textMuted, marginBottom:4 }}>Seasonal Opportunity</div>
          <div style={{ fontSize:32, fontWeight:900, color:scoreColor, lineHeight:1 }}>{opportunityScore}</div>
          <div style={{ fontSize:10, color:scoreColor, fontWeight:700, marginTop:4 }}>
            {scoreLabel}
          </div>
        </Card>
      </div>

      {/* Pre-season alert */}
      {isPreSeasonWindow && (
        <div style={{ background:"#f59e0b15", border:"1px solid #f59e0b55", borderRadius:10, padding:"12px 16px", marginBottom:16, display:"flex", alignItems:"center", gap:12 }}>
          <span style={{ fontSize:18 }}>⚡</span>
          <div>
            <div style={{ fontWeight:700, fontSize:13, color:"#f59e0b" }}>
              {`Pre-Season Window — ${daysUntilPeak} days until peak demand`}
            </div>
            <div style={{ fontSize:12, color:C.textDim, marginTop:3 }}>
              Optimize GBP now — profiles that rank at peak start 30–45 days before. Update posts, photos, and CTA before competitors do.
            </div>
          </div>
        </div>
      )}

      {/* Month selector */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {months.map((m, i) => {
          const ms = monthSeason(i);
          const seasonConfig = SEASONS[ms];
          const isActive = i === activeMonth;
          return (
            <button key={m} onClick={() => setActiveMonth(i)} style={{
              padding: "7px 12px", borderRadius: 8, border: `1px solid ${isActive ? seasonConfig.color : C.border}`,
              background: isActive ? `${seasonConfig.color}20` : "transparent",
              color: isActive ? seasonConfig.color : C.textMuted,
              fontWeight: isActive ? 700 : 400, fontSize: 12, cursor: "pointer"
            }}>{m}</button>
          );
        })}
      </div>

      {/* Demand card + Keywords */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <Card style={{ border: `1px solid ${season.color}44` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ fontSize: 24 }}>{season.label.split(" ")[0]}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: C.text }}>{season.label.split(" ")[1]} — {months[activeMonth]}</div>
              <div style={{ fontSize: 12, color: C.textMuted }}>
                <span style={{ color: urgencyColor[seasonData.urgency] || C.yellow, fontWeight: 700 }}>{urgencyLabel[seasonData.urgency] || seasonData.urgency}</span>
                {" · "}{seasonData.decisionSpeed}{" · "}{seasonData.ticketRange}
              </div>
            </div>
            <div style={{ marginLeft: "auto", textAlign: "right" }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: season.color }}>{seasonData.demand}%</div>
              <div style={{ fontSize: 11, color: C.textMuted }}>Demand Index</div>
            </div>
          </div>
          <ProgressBar value={seasonData.demand} color={season.color} />
          <div style={{ marginTop: 16, padding: 12, background: `${season.color}10`, borderRadius: 8, border: `1px solid ${season.color}33` }}>
            <div style={{ fontSize: 13, color: C.textDim, lineHeight: 1.6 }}>
              <strong style={{ color: season.color }}>Strategy: </strong>{seasonData.tip}
            </div>
            <div style={{ marginTop: 8, fontSize: 13 }}>
              <strong style={{ color: C.cyan }}>Best CTA: </strong>
              <span style={{ color: C.text, fontWeight: 600 }}>"{seasonData.cta}"</span>
            </div>
          </div>
        </Card>

        <Card>
          <div style={{ fontWeight: 600, marginBottom: 14 }}>High-Intent Keywords — {months[activeMonth]}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {seasonData.keywords.map((kw) => (
              <div key={kw} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: C.bg, borderRadius: 8 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: season.color, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: C.text, fontFamily: "'JetBrains Mono', monospace" }}>{kw}</span>
                <button onClick={() => navigator.clipboard?.writeText(kw)} style={{ marginLeft: "auto", fontSize: 11, color: C.textMuted, background: "transparent", border: "none", cursor: "pointer" }}>
                  Copy
                </button>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Problem → Cause → Action → Result */}
      <Card style={{ marginBottom: 16, border: `1px solid ${season.color}33` }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: season.color, marginBottom: 14 }}>
          Consumer Trigger — {season.label.split(" ")[1]} · {client.category}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
          {[
            { label: "⚠ Problem", text: trigger.problem, color: C.red },
            { label: "💡 Cause",  text: trigger.cause,   color: C.yellow },
            { label: "🔍 Action", text: trigger.action,  color: C.blue },
            { label: "✓ Result",  text: trigger.result,  color: C.green },
          ].map(({ label, text, color }) => (
            <div key={label} style={{ padding: 12, background: C.bg, borderRadius: 10, border: `1px solid ${color}33` }}>
              <div style={{ fontSize: 11, fontWeight: 700, color, marginBottom: 6 }}>{label}</div>
              <div style={{ fontSize: 12, color: C.textDim, lineHeight: 1.5 }}>{text}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Consumer behavior */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 600, marginBottom: 16 }}>American Consumer Behavior — {season.label.split(" ")[1]}</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {behavior.map((b) => (
            <div key={b.behavior} style={{ padding: 14, background: C.bg, borderRadius: 10, border: `1px solid ${C.border}` }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: season.color, marginBottom: 5 }}>{b.behavior}</div>
              <div style={{ fontSize: 12, color: C.textDim, lineHeight: 1.5 }}>{b.detail}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Annual demand curve */}
      <Card>
        <div style={{ fontWeight: 600, marginBottom: 14 }}>Annual Demand Curve — {client.category}</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 80 }}>
          {months.map((m, i) => {
            const ms = monthSeason(i);
            const nd = nicheData[ms];
            const sc2 = SEASONS[ms];
            const isActive = i === activeMonth;
            return (
              <div key={m} onClick={() => setActiveMonth(i)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer" }}>
                <span style={{ fontSize: 9, color: isActive ? sc2.color : C.textMuted, fontWeight: isActive ? 700 : 400 }}>{nd.demand}</span>
                <div style={{ width: "100%", height: `${nd.demand * 0.7}%`, background: isActive ? sc2.color : `${sc2.color}55`, borderRadius: "3px 3px 0 0", minHeight: 4, transition: "all 0.3s" }} />
                <span style={{ fontSize: 9, color: isActive ? sc2.color : C.textMuted }}>{m}</span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

