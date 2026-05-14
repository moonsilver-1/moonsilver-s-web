export type FootballSource = {
  label: string;
  href: string;
};

export type FootballRecord = {
  period: string;
  winner: string;
  runnerUp?: string;
  score?: string;
  goals?: string;
  topScorer?: string;
  club?: string;
  note: string;
  route?: string[];
};

export type FootballSection = {
  id: string;
  tag: string;
  title: string;
  intro: string;
  accent: string;
  stats: Array<{
    label: string;
    value: string;
    note: string;
  }>;
  highlights: string[];
  records: FootballRecord[];
  sources: FootballSource[];
};

export const footballSections: FootballSection[] = [
  {
    id: "world-cup",
    tag: "FIFA",
    title: "World Cup / 世界杯",
    intro: "2006-2022 的现代世界杯档案，重点看总进球、冠军与典型晋级路线。",
    accent: "from-sky-400/25 via-cyan-400/10 to-transparent",
    stats: [
      { label: "2022 goals", value: "172", note: "64 matches" },
      { label: "2018 goals", value: "169", note: "France 4-2 Croatia" },
      { label: "2014 goals", value: "171", note: "Germany 1-0 Argentina" },
    ],
    highlights: [
      "2014 和 2022 是这段时间轴里最显眼的高进球峰值。",
      "五届冠军分布清晰，能很好地做成时间轴和冠军分布图。",
      "淘汰赛路线统一，用于展示晋级树很合适。",
    ],
    records: [
      { period: "2006", winner: "Italy", runnerUp: "France", score: "1-1, Italy won on pens", goals: "147 goals", note: "Italy won the final in Berlin.", route: ["Group stage", "Round of 16", "Quarter-finals", "Semi-finals", "Final"] },
      { period: "2010", winner: "Spain", runnerUp: "Netherlands", score: "1-0 aet", goals: "145 goals", note: "Spain's first World Cup title.", route: ["Group stage", "Round of 16", "Quarter-finals", "Semi-finals", "Final"] },
      { period: "2014", winner: "Germany", runnerUp: "Argentina", score: "1-0 aet", goals: "171 goals", note: "Germany set the era's scoring peak.", route: ["Group stage", "Round of 16", "Quarter-finals", "Semi-finals", "Final"] },
      { period: "2018", winner: "France", runnerUp: "Croatia", score: "4-2", goals: "169 goals", note: "A chaotic but decisive final.", route: ["Group stage", "Round of 16", "Quarter-finals", "Semi-finals", "Final"] },
      { period: "2022", winner: "Argentina", runnerUp: "France", score: "3-3, Argentina won on pens", goals: "172 goals", note: "The first 3-3 World Cup final.", route: ["Group stage", "Round of 16", "Quarter-finals", "Semi-finals", "Final"] },
    ],
    sources: [
      { label: "FIFA World Cup 2022 summary", href: "https://publications.fifa.com/de/annual-report-2022/2022-at-a-glance/fifa-world-cup-qatar-2022-summary/" },
      { label: "RSSSF World Cup 2018", href: "https://www.rsssf.org/tables/2018f.html" },
      { label: "RSSSF World Cup 2022", href: "https://rsssf.org/tables/2022f.html" },
    ],
  },
  {
    id: "euro",
    tag: "UEFA",
    title: "EURO / 欧洲杯",
    intro: "2004-2024 的欧洲杯档案，冠军更替与扩军后的总进球变化都很明显。",
    accent: "from-amber-400/25 via-orange-400/10 to-transparent",
    stats: [
      { label: "2024 goals", value: "117", note: "51 matches" },
      { label: "2020 goals", value: "142", note: "expanded format" },
      { label: "2016 goals", value: "108", note: "Portugal won in Paris" },
    ],
    highlights: [
      "2004 的希腊神话依旧是近代欧洲杯最醒目的冷门之一。",
      "2016 和 2020 之后，欧洲杯总进球明显抬升。",
      "2024 的西班牙是首支四冠球队。",
    ],
    records: [
      { period: "2004", winner: "Greece", runnerUp: "Portugal", score: "1-0", goals: "77 goals", note: "The shock title in Portugal.", route: ["Group stage", "Quarter-finals", "Semi-finals", "Final"] },
      { period: "2008", winner: "Spain", runnerUp: "Germany", score: "1-0", goals: "77 goals", note: "Spain started the golden era.", route: ["Group stage", "Quarter-finals", "Semi-finals", "Final"] },
      { period: "2012", winner: "Spain", runnerUp: "Italy", score: "4-0", goals: "76 goals", note: "Spain's most complete final performance.", route: ["Group stage", "Quarter-finals", "Semi-finals", "Final"] },
      { period: "2016", winner: "Portugal", runnerUp: "France", score: "1-0 aet", goals: "108 goals", note: "Portugal won despite Ronaldo's early injury.", route: ["Group stage", "Round of 16", "Quarter-finals", "Semi-finals", "Final"] },
      { period: "2020", winner: "Italy", runnerUp: "England", score: "1-1, Italy won on pens", goals: "142 goals", note: "Italy's run was built on control and resilience.", route: ["Group stage", "Round of 16", "Quarter-finals", "Semi-finals", "Final"] },
      { period: "2024", winner: "Spain", runnerUp: "England", score: "2-1", goals: "117 goals", note: "Spain became a record four-time champion.", route: ["Group stage", "Round of 16", "Quarter-finals", "Semi-finals", "Final"] },
    ],
    sources: [
      { label: "UEFA EURO 2024 key numbers", href: "https://www.uefa.com/euro2024/news/028b-1a57cfc4277b-b36b2f9a6b83-1000--euro-2024-key-numbers/" },
      { label: "UEFA EURO history", href: "https://www.uefa.com/uefaeuro/history/" },
    ],
  },
  {
    id: "asian-cup",
    tag: "AFC",
    title: "AFC Asian Cup / 亚洲杯",
    intro: "2004-2023 的亚洲杯档案，2007、2015 和 2023 都是很好的叙事节点。",
    accent: "from-emerald-400/25 via-teal-400/10 to-transparent",
    stats: [
      { label: "2023 goals", value: "132", note: "51 matches" },
      { label: "2019 goals", value: "130", note: "Qatar's breakthrough run" },
      { label: "2011 champion", value: "Japan", note: "A fourth title" },
    ],
    highlights: [
      "2007 的伊拉克是亚洲杯最经典的故事之一。",
      "2015 的澳大利亚主场夺冠推动了赛事进一步扩张。",
      "2023 的卡塔尔把赛事热度和进球数都推到更高点。",
    ],
    records: [
      { period: "2004", winner: "Japan", runnerUp: "China PR", score: "3-1", goals: "77 goals", note: "China hosted a dramatic edition.", route: ["Group stage", "Quarter-finals", "Semi-finals", "Final"] },
      { period: "2007", winner: "Iraq", runnerUp: "Saudi Arabia", score: "1-0", goals: "53 goals", note: "One of the great underdog titles.", route: ["Group stage", "Quarter-finals", "Semi-finals", "Final"] },
      { period: "2011", winner: "Japan", runnerUp: "Australia", score: "1-0 aet", goals: "90 goals", note: "Japan won a record fourth title.", route: ["Group stage", "Quarter-finals", "Semi-finals", "Final"] },
      { period: "2015", winner: "Australia", runnerUp: "Korea Republic", score: "2-1 aet", goals: "85 goals", note: "Australia won as host nation.", route: ["Group stage", "Quarter-finals", "Semi-finals", "Final"] },
      { period: "2019", winner: "Qatar", runnerUp: "Japan", score: "3-1", goals: "130 goals", topScorer: "Almoez Ali (9)", note: "Qatar's first Asian crown was emphatic.", route: ["Group stage", "Round of 16", "Quarter-finals", "Semi-finals", "Final"] },
      { period: "2023", winner: "Qatar", runnerUp: "Jordan", score: "3-1", goals: "132 goals", topScorer: "Akram Afif (8)", note: "Back-to-back titles for Qatar.", route: ["Group stage", "Round of 16", "Quarter-finals", "Semi-finals", "Final"] },
    ],
    sources: [
      { label: "AFC Asian Cup 2023", href: "https://www.the-afc.com/en/national/afc_asian_cup.html" },
      { label: "RSSSF Asian Cup history", href: "https://www.rsssf.org/tablesa/aspac.html" },
    ],
  },
  {
    id: "afcon",
    tag: "CAF",
    title: "AFCON / 非洲杯",
    intro: "非洲杯的现代档案，能看到 2019、2021 和 2023 的连续主线。",
    accent: "from-yellow-400/25 via-amber-400/10 to-transparent",
    stats: [
      { label: "2023 champion", value: "Ivory Coast", note: "home-ground comeback" },
      { label: "2021 champion", value: "Senegal", note: "first title" },
      { label: "2006-2023", value: "6 editions", note: "modern archive slice" },
    ],
    highlights: [
      "这一段最适合展示冠军路线和不同主办国之间的切换。",
      "塞内加尔、阿尔及利亚、科特迪瓦是最近几届的核心名字。",
    ],
    records: [
      { period: "2006", winner: "Egypt", runnerUp: "Ivory Coast", score: "0-0, Egypt won on pens", goals: "99 goals", note: "Egypt started a dominant run.", route: ["Group stage", "Quarter-finals", "Semi-finals", "Final"] },
      { period: "2010", winner: "Egypt", runnerUp: "Ghana", score: "1-0", goals: "99 goals", note: "A second straight title for Egypt.", route: ["Group stage", "Quarter-finals", "Semi-finals", "Final"] },
      { period: "2013", winner: "Nigeria", runnerUp: "Burkina Faso", score: "1-0", goals: "56 goals", note: "Nigeria returned to the top.", route: ["Group stage", "Quarter-finals", "Semi-finals", "Final"] },
      { period: "2019", winner: "Algeria", runnerUp: "Senegal", score: "1-0", goals: "102 goals", note: "Algeria won with a compact, elite side.", route: ["Group stage", "Round of 16", "Quarter-finals", "Semi-finals", "Final"] },
      { period: "2021", winner: "Senegal", runnerUp: "Egypt", score: "0-0, Senegal won on pens", goals: "100 goals", note: "Mane's Senegal won the long-awaited title.", route: ["Group stage", "Round of 16", "Quarter-finals", "Semi-finals", "Final"] },
      { period: "2023", winner: "Ivory Coast", runnerUp: "Nigeria", score: "2-1", goals: "102 goals", note: "The hosts completed a dramatic comeback.", route: ["Group stage", "Round of 16", "Quarter-finals", "Semi-finals", "Final"] },
    ],
    sources: [
      { label: "CAF AFCON archive", href: "https://www.cafonline.com/caf-africa-cup-of-nations/" },
      { label: "RSSSF AFCON history", href: "https://www.rsssf.org/tablesa/afcon.html" },
    ],
  },
  {
    id: "copa-america",
    tag: "CONMEBOL",
    title: "Copa América / 美洲杯",
    intro: "2007-2024 的美洲杯档案，阿根廷和巴西的两大主线都很清晰。",
    accent: "from-fuchsia-400/25 via-rose-400/10 to-transparent",
    stats: [
      { label: "2024 champion", value: "Argentina", note: "back-to-back major title run" },
      { label: "2019 champion", value: "Brazil", note: "hosted title" },
      { label: "2007-2024", value: "7 editions", note: "modern slice" },
    ],
    highlights: [
      "2011、2015、2016、2021、2024 串起了近代南美冠军叙事。",
      "阿根廷在 2021 之后重新把大赛冠军线拉直。",
    ],
    records: [
      { period: "2007", winner: "Brazil", runnerUp: "Argentina", score: "3-0", goals: "86 goals", note: "Brazil dominated the final.", route: ["Group stage", "Quarter-finals", "Semi-finals", "Final"] },
      { period: "2011", winner: "Uruguay", runnerUp: "Paraguay", score: "3-0", goals: "103 goals", note: "Uruguay's 15th title.", route: ["Group stage", "Quarter-finals", "Semi-finals", "Final"] },
      { period: "2015", winner: "Chile", runnerUp: "Argentina", score: "0-0, Chile won on pens", goals: "48 goals", note: "Chile won on home soil.", route: ["Group stage", "Quarter-finals", "Semi-finals", "Final"] },
      { period: "2016", winner: "Chile", runnerUp: "Argentina", score: "0-0, Chile won on pens", goals: "18 goals", note: "Centenario was tight and tactical.", route: ["Group stage", "Quarter-finals", "Semi-finals", "Final"] },
      { period: "2019", winner: "Brazil", runnerUp: "Peru", score: "3-1", goals: "60 goals", note: "Brazil won the home tournament.", route: ["Group stage", "Quarter-finals", "Semi-finals", "Final"] },
      { period: "2021", winner: "Argentina", runnerUp: "Brazil", score: "1-0", goals: "65 goals", note: "Messi finally lifted a senior international trophy.", route: ["Group stage", "Quarter-finals", "Semi-finals", "Final"] },
      { period: "2024", winner: "Argentina", runnerUp: "Colombia", score: "1-0 aet", goals: "70 goals", note: "Argentina defended the crown in the US.", route: ["Group stage", "Quarter-finals", "Semi-finals", "Final"] },
    ],
    sources: [
      { label: "CONMEBOL history", href: "https://www.conmebol.com/en/copa-america/" },
      { label: "RSSSF Copa América", href: "https://www.rsssf.org/tablesc/sa.html" },
    ],
  },
  {
    id: "ucl",
    tag: "UEFA",
    title: "UEFA Champions League / 欧冠",
    intro: "2005/06-2024/25 的欧冠时间轴，足够覆盖旧赛制尾声和新赛制开端。",
    accent: "from-violet-400/25 via-indigo-400/10 to-transparent",
    stats: [
      { label: "Archive span", value: "2005/06-2024/25", note: "20 seasons" },
      { label: "Record run", value: "Madrid", note: "multiple crowns in the era" },
      { label: "2024/25 title", value: "PSG", note: "new league-phase era" },
    ],
    highlights: [
      "这是最适合做晋级树和冠军路线图的板块。",
      "2013/14、2018/19、2021/22 和 2024/25 都是叙事强点。",
    ],
    records: [
      { period: "2005/06", winner: "Barcelona", topScorer: "Samuel Eto'o (9)", note: "Barcelona's second title in the modern format.", route: ["Group stage", "Round of 16", "Quarter-finals", "Semi-finals", "Final"] },
      { period: "2006/07", winner: "Milan", topScorer: "Kaká (10)", note: "Milan recovered from the prior year.", route: ["Group stage", "Round of 16", "Quarter-finals", "Semi-finals", "Final"] },
      { period: "2007/08", winner: "Manchester United", topScorer: "Cristiano Ronaldo (8)", note: "United won after the Moscow final.", route: ["Group stage", "Round of 16", "Quarter-finals", "Semi-finals", "Final"] },
      { period: "2008/09", winner: "Barcelona", topScorer: "Lionel Messi (9)", note: "Pep's first European crown.", route: ["Group stage", "Round of 16", "Quarter-finals", "Semi-finals", "Final"] },
      { period: "2009/10", winner: "Inter", topScorer: "Lionel Messi (8)", note: "Mourinho's treble-winning Inter.", route: ["Group stage", "Round of 16", "Quarter-finals", "Semi-finals", "Final"] },
      { period: "2010/11", winner: "Barcelona", topScorer: "Lionel Messi (12)", note: "The peak of the Guardiola-Barca cycle.", route: ["Group stage", "Round of 16", "Quarter-finals", "Semi-finals", "Final"] },
      { period: "2011/12", winner: "Chelsea", topScorer: "Lionel Messi (14)", note: "Chelsea's underdog knockout run.", route: ["Group stage", "Round of 16", "Quarter-finals", "Semi-finals", "Final"] },
      { period: "2012/13", winner: "Bayern", topScorer: "Cristiano Ronaldo (12)", note: "Bayern completed the treble path.", route: ["Group stage", "Round of 16", "Quarter-finals", "Semi-finals", "Final"] },
      { period: "2013/14", winner: "Real Madrid", topScorer: "Cristiano Ronaldo (17)", note: "The first title of Madrid's four in five years.", route: ["Group stage", "Round of 16", "Quarter-finals", "Semi-finals", "Final"] },
      { period: "2014/15", winner: "Barcelona", topScorer: "Lionel Messi (10)", note: "MSN powered another title.", route: ["Group stage", "Round of 16", "Quarter-finals", "Semi-finals", "Final"] },
      { period: "2015/16", winner: "Real Madrid", topScorer: "Cristiano Ronaldo (16)", note: "A tight final over city rivals.", route: ["Group stage", "Round of 16", "Quarter-finals", "Semi-finals", "Final"] },
      { period: "2016/17", winner: "Real Madrid", topScorer: "Cristiano Ronaldo (12)", note: "Back-to-back titles under Zidane.", route: ["Group stage", "Round of 16", "Quarter-finals", "Semi-finals", "Final"] },
      { period: "2017/18", winner: "Real Madrid", topScorer: "Cristiano Ronaldo (15)", note: "Three straight titles in the old format.", route: ["Group stage", "Round of 16", "Quarter-finals", "Semi-finals", "Final"] },
      { period: "2018/19", winner: "Liverpool", topScorer: "Lionel Messi (12)", note: "A chaotic but iconic knockout route.", route: ["Group stage", "Round of 16", "Quarter-finals", "Semi-finals", "Final"] },
      { period: "2019/20", winner: "Bayern", topScorer: "Robert Lewandowski (15)", note: "The pandemic season compressed everything.", route: ["Group stage", "Round of 16", "Quarter-finals", "Semi-finals", "Final"] },
      { period: "2020/21", winner: "Chelsea", topScorer: "Erling Haaland (10)", note: "Chelsea beat Manchester City in the final.", route: ["Group stage", "Round of 16", "Quarter-finals", "Semi-finals", "Final"] },
      { period: "2021/22", winner: "Real Madrid", topScorer: "Karim Benzema (15)", note: "Benzema's knockout run was the headline.", route: ["Group stage", "Round of 16", "Quarter-finals", "Semi-finals", "Final"] },
      { period: "2022/23", winner: "Manchester City", topScorer: "Erling Haaland (12)", note: "City finally converted dominance into the title.", route: ["Group stage", "Round of 16", "Quarter-finals", "Semi-finals", "Final"] },
      { period: "2023/24", winner: "Real Madrid", topScorer: "Kylian Mbappé / Harry Kane (8)", note: "The old format era ended with Madrid again.", route: ["Group stage", "Round of 16", "Quarter-finals", "Semi-finals", "Final"] },
      { period: "2024/25", winner: "Paris Saint-Germain", topScorer: "Raphinha (13)", note: "The new league-phase era started with PSG.", route: ["League phase", "Knockout play-off", "Round of 16", "Quarter-finals", "Semi-finals", "Final"] },
    ],
    sources: [
      { label: "UEFA Champions League history", href: "https://www.uefa.com/uefachampionsleague/history/" },
      { label: "UEFA season goals scored", href: "https://www.uefa.com/uefachampionsleague/history/rankings/players/season_goals_scored/" },
    ],
  },
  {
    id: "pl",
    tag: "League",
    title: "Premier League / 英超",
    intro: "2005/06-2024/25 的 20 个赛季时间轴，核心看点是冠军轮换和积分峰值。",
    accent: "from-lime-400/20 via-green-400/10 to-transparent",
    stats: [
      { label: "Archive span", value: "2005/06-2024/25", note: "20 completed seasons" },
      { label: "Most titles", value: "Man City 6", note: "in this period" },
      { label: "2024/25 title", value: "Liverpool 84", note: "Arne Slot's first season" },
    ],
    highlights: [
      "这段时间轴最明显的特征就是切尔西、曼联、曼城和利物浦的轮流登顶。",
      "2017/18 的 100 分和 2019/20 的 99 分，是最醒目的高峰。",
      "很适合做完整年表和冠军分布图。",
    ],
    records: [
      { period: "2005/06", winner: "Chelsea", goals: "91 pts", note: "Mourinho's title-winning side." },
      { period: "2006/07", winner: "Manchester United", goals: "89 pts", note: "United took the crown back." },
      { period: "2007/08", winner: "Manchester United", goals: "87 pts", note: "Ronaldo's breakout league title." },
      { period: "2008/09", winner: "Manchester United", goals: "90 pts", note: "Three straight titles." },
      { period: "2009/10", winner: "Chelsea", goals: "86 pts", note: "Ancelotti's first league season." },
      { period: "2010/11", winner: "Manchester United", goals: "80 pts", note: "United remained the league reference point." },
      { period: "2011/12", winner: "Manchester City", goals: "89 pts", note: "A final-day title that changed the era." },
      { period: "2012/13", winner: "Manchester United", goals: "89 pts", note: "Ferguson's final title." },
      { period: "2013/14", winner: "Manchester City", goals: "86 pts", note: "City regained the summit." },
      { period: "2014/15", winner: "Chelsea", goals: "87 pts", note: "A dominant Mourinho return season." },
      { period: "2015/16", winner: "Leicester City", goals: "81 pts", note: "The greatest modern underdog title." },
      { period: "2016/17", winner: "Chelsea", goals: "93 pts", note: "Conte's back-three reset." },
      { period: "2017/18", winner: "Manchester City", goals: "100 pts", note: "The centurions arrived." },
      { period: "2018/19", winner: "Manchester City", goals: "98 pts", note: "A one-point title race vs Liverpool." },
      { period: "2019/20", winner: "Liverpool", goals: "99 pts", note: "A historic title run." },
      { period: "2020/21", winner: "Manchester City", goals: "86 pts", note: "City returned to the top." },
      { period: "2021/22", winner: "Manchester City", goals: "93 pts", note: "Late-season drama decided the crown." },
      { period: "2022/23", winner: "Manchester City", goals: "89 pts", note: "Haaland accelerated the machine." },
      { period: "2023/24", winner: "Manchester City", goals: "91 pts", note: "Four straight titles." },
      { period: "2024/25", winner: "Liverpool", goals: "84 pts", note: "Liverpool returned to the top." },
    ],
    sources: [
      { label: "RSSSF English league archive", href: "https://www.rsssf.org/tablese/engtops.html" },
      { label: "RSSSF England 2024/25", href: "https://www.rsssf.org/tablese/eng2025.html" },
    ],
  },
  {
    id: "laliga",
    tag: "League",
    title: "La Liga / 西甲",
    intro: "2005/06-2024/25 的西甲时间轴，主线是皇马与巴萨的长期对抗。",
    accent: "from-red-400/20 via-orange-400/10 to-transparent",
    stats: [
      { label: "Archive span", value: "2005/06-2024/25", note: "20 completed seasons" },
      { label: "Messi", value: "8 titles", note: "Pichichi era marker" },
      { label: "2024/25 title", value: "Barcelona", note: "Mbappé era did not break the pattern" },
    ],
    highlights: [
      "西甲的时间轴几乎就是皇马、巴萨、少数搅局者的交替史。",
      "2013/14 的马竞和 2020/21 的马竞是两个非常醒目的短暂插入点。",
    ],
    records: [
      { period: "2005/06", winner: "Barcelona", goals: "82 pts", note: "Barcelona opened a dominant stretch." },
      { period: "2006/07", winner: "Real Madrid", goals: "76 pts", note: "Madrid responded immediately." },
      { period: "2007/08", winner: "Real Madrid", goals: "85 pts", note: "Back-to-back titles." },
      { period: "2008/09", winner: "Barcelona", goals: "87 pts", note: "Pep's first major league title." },
      { period: "2009/10", winner: "Barcelona", goals: "99 pts", note: "A historic 99-point campaign." },
      { period: "2010/11", winner: "Barcelona", goals: "96 pts", note: "The rivalry kept intensifying." },
      { period: "2011/12", winner: "Real Madrid", goals: "100 pts", note: "Mourinho's record-setting league season." },
      { period: "2012/13", winner: "Barcelona", goals: "100 pts", note: "Another 100-point level season." },
      { period: "2013/14", winner: "Atlético Madrid", goals: "90 pts", note: "A remarkable break in the binary race." },
      { period: "2014/15", winner: "Barcelona", goals: "94 pts", note: "MSN powered the title." },
      { period: "2015/16", winner: "Barcelona", goals: "91 pts", note: "Barcelona kept the edge." },
      { period: "2016/17", winner: "Real Madrid", goals: "93 pts", note: "Madrid won while also dominating Europe." },
      { period: "2017/18", winner: "Barcelona", goals: "93 pts", note: "A steady return to the top." },
      { period: "2018/19", winner: "Barcelona", goals: "87 pts", note: "Messi remained the anchor." },
      { period: "2019/20", winner: "Real Madrid", goals: "87 pts", note: "The pandemic season shook the table." },
      { period: "2020/21", winner: "Atlético Madrid", goals: "86 pts", note: "Simeone's side held on late." },
      { period: "2021/22", winner: "Real Madrid", goals: "86 pts", note: "Benzema carried the finishing stretch." },
      { period: "2022/23", winner: "Barcelona", goals: "88 pts", note: "Xavi's rebuild delivered the title." },
      { period: "2023/24", winner: "Real Madrid", goals: "95 pts", note: "Madrid were back at the top." },
      { period: "2024/25", winner: "Barcelona", goals: "88 pts", note: "Barcelona closed the 20-season loop." },
    ],
    sources: [
      { label: "RSSSF Spain top scorers", href: "https://www.rsssf.org/tabless/spantops.html" },
      { label: "RSSSF Spain 2024/25", href: "https://www.rsssf.org/tabless/span2025.html" },
    ],
  },
  {
    id: "serie-a",
    tag: "League",
    title: "Serie A / 意甲",
    intro: "意甲 20 年里有很强的峰谷切换，适合继续扩成更细的积分轴。",
    accent: "from-emerald-400/20 via-lime-400/10 to-transparent",
    stats: [
      { label: "Archive span", value: "2005/06-2024/25", note: "20 completed seasons" },
      { label: "Juventus", value: "9 titles", note: "dominant decade" },
      { label: "2024/25 champ", value: "Napoli", note: "new-cycle title" },
    ],
    highlights: [
      "意甲最适合继续扩成积分和金靴双轴。",
      "尤文的长统治和那不勒斯、米兰、国米的断点都很清楚。",
    ],
    records: [
      { period: "2005/06", winner: "Juventus", goals: "91 pts", note: "Title later affected by Calciopoli." },
      { period: "2006/07", winner: "Inter", goals: "97 pts", note: "Inter began a dominant run." },
      { period: "2007/08", winner: "Inter", goals: "85 pts", note: "Back-to-back titles." },
      { period: "2008/09", winner: "Inter", goals: "84 pts", note: "The streak continued." },
      { period: "2009/10", winner: "Inter", goals: "82 pts", note: "Mourinho's treble season." },
      { period: "2010/11", winner: "Milan", goals: "82 pts", note: "Milan interrupted the run." },
      { period: "2011/12", winner: "Juventus", goals: "84 pts", note: "Juventus began the long cycle." },
      { period: "2012/13", winner: "Juventus", goals: "87 pts", note: "The title streak was underway." },
      { period: "2013/14", winner: "Juventus", goals: "102 pts", note: "A dominant title." },
      { period: "2014/15", winner: "Juventus", goals: "87 pts", note: "Another controlled win." },
      { period: "2015/16", winner: "Juventus", goals: "91 pts", note: "Higuaín's explosive season." },
      { period: "2016/17", winner: "Juventus", goals: "91 pts", note: "The dominance continued." },
      { period: "2017/18", winner: "Juventus", goals: "95 pts", note: "A modern peak." },
      { period: "2018/19", winner: "Juventus", goals: "90 pts", note: "The last of the old streak." },
      { period: "2019/20", winner: "Juventus", goals: "83 pts", note: "The title still stayed in Turin." },
      { period: "2020/21", winner: "Inter", goals: "91 pts", note: "Inter ended Juventus' long control." },
      { period: "2021/22", winner: "Milan", goals: "86 pts", note: "Milan returned to the summit." },
      { period: "2022/23", winner: "Napoli", goals: "90 pts", note: "Napoli's title was brilliant and complete." },
      { period: "2023/24", winner: "Inter", goals: "94 pts", note: "Inter won with a strong margin." },
      { period: "2024/25", winner: "Napoli", goals: "84 pts", note: "Napoli came back to the top." },
    ],
    sources: [
      { label: "RSSSF Serie A top scorers", href: "https://www.rsssf.org/tablesi/italtops.html" },
      { label: "RSSSF Italy 2024/25", href: "https://www.rsssf.org/tablesi/italy25.html" },
    ],
  },
  {
    id: "bundesliga",
    tag: "League",
    title: "Bundesliga / 德甲",
    intro: "2005/06-2024/25 的德甲时间轴，拜仁统治和少数破局赛季是核心信息。",
    accent: "from-rose-400/20 via-pink-400/10 to-transparent",
    stats: [
      { label: "Archive span", value: "2005/06-2024/25", note: "20 completed seasons" },
      { label: "Bayern", value: "15 titles", note: "in this period" },
      { label: "2023/24 title", value: "Leverkusen 90", note: "the unbeaten season" },
    ],
    highlights: [
      "德甲的冠军分布比英超和西甲更集中，拜仁几乎主导了整个时期。",
      "2013/14 后的长波段尤其适合做时间轴和冠军柱状图。",
    ],
    records: [
      { period: "2005/06", winner: "Bayern", goals: "75 pts", note: "Bayern opened the era on top." },
      { period: "2006/07", winner: "Stuttgart", goals: "70 pts", note: "A rare non-Bayern title." },
      { period: "2007/08", winner: "Bayern", goals: "76 pts", note: "Bayern bounced back." },
      { period: "2008/09", winner: "Wolfsburg", goals: "69 pts", note: "A classic outsider title." },
      { period: "2009/10", winner: "Bayern", goals: "70 pts", note: "The dominant club returned." },
      { period: "2010/11", winner: "Dortmund", goals: "75 pts", note: "Klopp's title team changed the mood." },
      { period: "2011/12", winner: "Dortmund", goals: "81 pts", note: "Back-to-back titles." },
      { period: "2012/13", winner: "Bayern", goals: "91 pts", note: "The treble side arrived." },
      { period: "2013/14", winner: "Bayern", goals: "90 pts", note: "Guardiola's first Bundesliga title." },
      { period: "2014/15", winner: "Bayern", goals: "79 pts", note: "Another title, less dramatic but steady." },
      { period: "2015/16", winner: "Bayern", goals: "88 pts", note: "Lewandowski's peak years." },
      { period: "2016/17", winner: "Bayern", goals: "82 pts", note: "The control continued." },
      { period: "2017/18", winner: "Bayern", goals: "84 pts", note: "Another familiar finish." },
      { period: "2018/19", winner: "Bayern", goals: "78 pts", note: "A close but successful chase." },
      { period: "2019/20", winner: "Bayern", goals: "82 pts", note: "Pandemic season, same champion." },
      { period: "2020/21", winner: "Bayern", goals: "78 pts", note: "The streak kept going." },
      { period: "2021/22", winner: "Bayern", goals: "77 pts", note: "A narrow but still decisive title." },
      { period: "2022/23", winner: "Bayern", goals: "71 pts", note: "A tense title race ended on goal difference." },
      { period: "2023/24", winner: "Leverkusen", goals: "90 pts", note: "An unbeaten season changed the league map." },
      { period: "2024/25", winner: "Bayern", goals: "82 pts", note: "Bayern returned to the top." },
    ],
    sources: [
      { label: "RSSSF German scorers", href: "https://www.rsssf.org/tablesd/duittops.html" },
      { label: "RSSSF Germany 2024/25", href: "https://www.rsssf.org/tablesd/duit2025.html" },
    ],
  },
  {
    id: "ligue-1",
    tag: "League",
    title: "Ligue 1 / 法甲",
    intro: "2005/06-2024/25 的法甲时间轴，适合看里昂时代到巴黎时代的转折。",
    accent: "from-cyan-400/20 via-slate-400/10 to-transparent",
    stats: [
      { label: "Archive span", value: "2005/06-2024/25", note: "20 completed seasons" },
      { label: "Most titles", value: "PSG", note: "dominant late era" },
      { label: "2024/25 title", value: "PSG 84", note: "another crown" },
    ],
    highlights: [
      "法甲的主线很像里昂的终章和巴黎的长期统治之间的切换。",
      "2010/11、2016/17 和 2020/21 是最有“破局感”的几个赛季。",
    ],
    records: [
      { period: "2005/06", winner: "Lyon", goals: "84 pts", note: "Lyon's final great peak." },
      { period: "2006/07", winner: "Lyon", goals: "81 pts", note: "Another Lyon title." },
      { period: "2007/08", winner: "Lyon", goals: "80 pts", note: "The three-title run closed." },
      { period: "2008/09", winner: "Bordeaux", goals: "80 pts", note: "Bordeaux broke the sequence." },
      { period: "2009/10", winner: "Marseille", goals: "78 pts", note: "Marseille returned to the summit." },
      { period: "2010/11", winner: "Lille", goals: "76 pts", note: "Hazard's Lille became champions." },
      { period: "2011/12", winner: "Montpellier", goals: "82 pts", note: "A surprise champion season." },
      { period: "2012/13", winner: "PSG", goals: "83 pts", note: "Paris entered the modern era." },
      { period: "2013/14", winner: "PSG", goals: "89 pts", note: "Paris kept building strength." },
      { period: "2014/15", winner: "PSG", goals: "80 pts", note: "A controlled title year." },
      { period: "2015/16", winner: "PSG", goals: "96 pts", note: "A dominant campaign." },
      { period: "2016/17", winner: "Monaco", goals: "95 pts", note: "Monaco's counter-attack side won the league." },
      { period: "2017/18", winner: "PSG", goals: "93 pts", note: "Paris responded immediately." },
      { period: "2018/19", winner: "PSG", goals: "91 pts", note: "Another comfortable title." },
      { period: "2019/20", winner: "PSG", goals: "68 pts", note: "The season ended early." },
      { period: "2020/21", winner: "Lille", goals: "83 pts", note: "Lille broke PSG's run again." },
      { period: "2021/22", winner: "PSG", goals: "86 pts", note: "Messi, Neymar and Mbappé still won the league." },
      { period: "2022/23", winner: "PSG", goals: "85 pts", note: "Another Paris crown." },
      { period: "2023/24", winner: "PSG", goals: "76 pts", note: "A lower-points title but still a title." },
      { period: "2024/25", winner: "PSG", goals: "84 pts", note: "Paris finished the period on top." },
    ],
    sources: [
      { label: "RSSSF France 2005/06", href: "https://www.rsssf.org/tablesf/fran06.html" },
      { label: "RSSSF France 2024/25", href: "https://www.rsssf.org/tablesf/fran2025.html" },
    ],
  },
  {
    id: "csl",
    tag: "League",
    title: "Chinese Super League / 中超",
    intro: "2004-2025 的完整中超赛季档案，把冠军、时代和断点放进一条时间轴。",
    accent: "from-sky-400/15 via-emerald-400/10 to-transparent",
    stats: [
      { label: "Archive span", value: "2004-2025", note: "full CSL era" },
      { label: "Most titles", value: "Guangzhou Evergrande", note: "7 straight titles" },
      { label: "2025 champion", value: "Shanghai Port", note: "three straight titles" },
    ],
    highlights: [
      "中超非常适合做逐季档案，因为冠军变化和俱乐部兴衰都很明显。",
      "广州时代、江苏 2020、武汉三镇 2022 和海港 2023-2025 是关键节点。",
    ],
    records: [
      { period: "2004", winner: "Shenzhen Jianlibao", note: "The debut CSL champion." },
      { period: "2005", winner: "Dalian Shide", note: "The first mature CSL champion season." },
      { period: "2006", winner: "Shandong Luneng Taishan", topScorer: "Li Jinyu (26)", note: "Shandong returned to the top." },
      { period: "2007", winner: "Changchun Yatai", note: "A surprise champion year." },
      { period: "2008", winner: "Shandong Luneng", topScorer: "Eber Luis (14)", note: "A classic 30-round season." },
      { period: "2009", winner: "Beijing Guoan", note: "The capital club broke through." },
      { period: "2010", winner: "Shandong Luneng", note: "Another Shandong title." },
      { period: "2011", winner: "Guangzhou Evergrande", note: "The dynasty began." },
      { period: "2012", winner: "Guangzhou Evergrande", note: "Back-to-back titles." },
      { period: "2013", winner: "Guangzhou Evergrande", note: "The streak kept building." },
      { period: "2014", winner: "Guangzhou Evergrande", note: "Another dominant season." },
      { period: "2015", winner: "Guangzhou Evergrande", note: "A fifth straight title in the run." },
      { period: "2016", winner: "Guangzhou Evergrande", note: "The club still ruled the league." },
      { period: "2017", winner: "Guangzhou Evergrande", note: "Seven straight titles completed the dynasty." },
      { period: "2018", winner: "Shanghai SIPG", note: "Shanghai broke the run." },
      { period: "2019", winner: "Guangzhou Evergrande", note: "The old king struck back one more time." },
      { period: "2020", winner: "Jiangsu Suning", note: "A one-season champion story." },
      { period: "2021", winner: "Shandong Taishan", note: "Shandong returned again." },
      { period: "2022", winner: "Wuhan Three Towns", note: "A newly promoted club won immediately." },
      { period: "2023", winner: "Shanghai Port", note: "Shanghai Port stepped into dominance." },
      { period: "2024", winner: "Shanghai Port", topScorer: "Wu Lei (34)", note: "Shanghai Port repeated the title." },
      { period: "2025", winner: "Shanghai Port", note: "Shanghai Port completed the three-peat." },
    ],
    sources: [
      { label: "RSSSF China 2005", href: "https://www.rsssf.org/tablesc/china05.html" },
      { label: "RSSSF China 2006", href: "https://www.rsssf.org/tablesc/china06.html" },
      { label: "RSSSF China 2008", href: "https://www.rsssf.org/tablesc/china08.html" },
      { label: "2024 CSL summary", href: "https://en.wikipedia.org/wiki/2024_Chinese_Super_League" },
      { label: "2025 CSL roundup", href: "https://www.china.org.cn/china/Off_the_Wire/2025-11/22/content_118190388.shtml" },
    ],
  },
];

export const defaultFootballSectionId = "world-cup";
