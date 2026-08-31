import type { Tutorial, FamilyMember } from "../types";

export const tutorials: Tutorial[] = [
  {
    id: "t-01",
    title: "家常拿手菜合集",
    category: "美食",
    coverPrompt:
      "Cozy overhead photo of a Chinese home-cooked stew in a cream ceramic bowl, wooden spoon lifting broth, warm natural light on a light wood table, soft shadows, neutral cream tones, healing Instagram food photography",
    coverSize: "landscape_16_9",
    tags: ["家常菜", "入门", "慢炖"],
    author: "妈妈",
    authorRole: "家里的大厨",
    avatarColor: "#E08A2A",
    date: "2026-08-20",
    likes: 128,
    intro: "把家里最常做的几道菜整理成图文步骤，照着做不会翻车。火候是关键，慢慢来。",
    steps: [
      {
        id: "s1",
        title: "备料切配",
        imagePrompt:
          "Overhead photo of prepared ingredients neatly arranged in small cream bowls on a light wood cutting board — chopped meat, ginger, scallions, star anise, soft natural light, warm cream tones, cozy cooking tutorial",
        text: "五花肉切方块，姜切片，葱打结。香料（八角、桂皮）放小碟里，免得到时候手忙脚乱。",
        annotations: [{ x: 68, y: 42, label: "香料单独放，最后再下" }],
      },
      {
        id: "s2",
        title: "焯水去腥",
        imagePrompt:
          "Photo of a stainless pot with meat simmering in water on a gas stove, soft steam rising, warm kitchen light, cream and wood tones, cozy home cooking tutorial",
        text: "冷水下肉，加两片姜，中火烧开后撇去浮沫，煮 2 分钟捞出温水冲净。这步去腥最关键，别省。",
        annotations: [{ x: 40, y: 55, label: "冷水下锅，水开再撇沫" }],
      },
      {
        id: "s3",
        title: "炒糖色",
        imagePrompt:
          "Close-up photo of caramelizing sugar in a black wok over low flame, amber bubbles, wooden spatula, warm moody kitchen light, cream tones, cozy cooking tutorial",
        text: "小火少油下冰糖，慢慢搅到琥珀色起密集小泡。立刻下肉翻炒上色，动作要快。",
        annotations: [{ x: 52, y: 48, label: "这里转小火，别炒糊" }],
      },
      {
        id: "s4",
        title: "慢炖收汁",
        imagePrompt:
          "Photo of a clay pot with glistening braised meat simmering, rich sauce, soft steam, warm window light on a wooden table, cream and brown tones, cozy food photography",
        text: "加热水没过肉，放香料和调味，大火烧开转小火盖盖慢炖 40 分钟，最后开盖收浓汤汁。",
        annotations: [{ x: 30, y: 60, label: "加热水，冷水会让肉发紧" }],
      },
    ],
    comments: [
      {
        id: "c1",
        author: "小妹",
        avatarColor: "#A8B89A",
        text: "转小火之后需要盖锅盖吗？",
        date: "2 天前",
        stepIndex: 2,
        replies: [
          {
            id: "r1",
            author: "妈妈",
            isAuthor: true,
            text: "要盖盖子哦，这样焖出来更入味更香～",
            date: "2 天前",
          },
        ],
      },
      {
        id: "c2",
        author: "小弟",
        avatarColor: "#B89968",
        text: "可以用电磁炉代替燃气灶吗？",
        date: "1 天前",
        stepIndex: 3,
        replies: [
          {
            id: "r2",
            author: "妈妈",
            isAuthor: true,
            text: "可以的，调到对应的小火档位效果一样～",
            date: "1 天前",
          },
        ],
      },
    ],
  },
  {
    id: "t-02",
    title: "新手围巾编织教程",
    category: "手工",
    coverPrompt:
      "Close-up photo of hands knitting a cream wool scarf with wooden needles, soft ball of yarn, warm window light, cozy cream and wood tones, Instagram craft photography",
    coverSize: "portrait_4_3",
    tags: ["编织", "入门", "礼物"],
    author: "小楠",
    authorRole: "手工爱好者",
    avatarColor: "#A8B89A",
    date: "2026-08-15",
    likes: 86,
    intro: "从起针到收针，一条围巾的完整过程。新手用粗针粗线，一个周末就能织完。",
    steps: [
      {
        id: "s1",
        title: "起针",
        imagePrompt:
          "Close-up photo of hands casting on stitches on wooden knitting needles with cream wool yarn, soft natural light, warm cream background, cozy craft tutorial",
        text: "起 30 针，保持松紧均匀，太紧后面织着会手疼。",
        annotations: [{ x: 50, y: 50, label: "松紧一致最重要" }],
      },
      {
        id: "s2",
        title: "平针织 body",
        imagePrompt:
          "Close-up photo of knitting plain stitches with cream wool on wooden needles, growing scarf fabric, soft warm light, cozy craft tutorial",
        text: "一行正一行反，重复到长度约 150cm。每隔 10 行量一下宽度别跑偏。",
      },
      {
        id: "s3",
        title: "收针收尾",
        imagePrompt:
          "Close-up photo of binding off stitches on wooden needles with cream wool, finished scarf edge, warm light, cozy craft tutorial",
        text: "收针别太紧，不然末端会卷。最后藏好线头，用蒸汽熨斗轻轻定个型。",
      },
    ],
    comments: [
      {
        id: "c1",
        author: "外婆",
        avatarColor: "#D4B896",
        text: "起针总是太紧怎么办？",
        date: "3 天前",
        stepIndex: 0,
        replies: [
          {
            id: "r1",
            author: "小楠",
            isAuthor: true,
            text: "起针时换大一号的针，织正文再换回来～",
            date: "3 天前",
          },
        ],
      },
    ],
  },
  {
    id: "t-03",
    title: "手机相册整理技巧",
    category: "数码",
    coverPrompt:
      "Photo of a smartphone screen showing an organized photo gallery with cream and warm-toned thumbnails, hand holding phone over a wooden desk, soft light, cozy tech tutorial",
    coverSize: "square",
    tags: ["手机", "整理", "日常"],
    author: "阿凯",
    authorRole: "家里的数码小能手",
    avatarColor: "#B89968",
    date: "2026-08-10",
    likes: 95,
    intro: "手机里几千张照片找不到？先删后整，建相簿分类，以后搜索秒找。",
    steps: [
      {
        id: "s1",
        title: "先删后整",
        imagePrompt:
          "Photo of a hand deleting photos on a smartphone screen, trash bin icon, soft warm light over wooden desk, cozy tech tutorial, cream tones",
        text: "先批量删除截图、糊片、重复照。手指一划选中一堆，别心疼。",
        annotations: [{ x: 60, y: 45, label: "选择-多选，一划一批" }],
      },
      {
        id: "s2",
        title: "建相簿分类",
        imagePrompt:
          "Photo of a smartphone screen creating a new photo album named in Chinese, soft warm light over wooden desk, cozy tech tutorial, cream tones",
        text: "按人或事建相簿：家人、旅行、证件、菜谱。把照片拖进对应相簿。",
      },
      {
        id: "s3",
        title: "搜索秒找",
        imagePrompt:
          "Photo of a smartphone search bar in the photo app typing a Chinese keyword, results showing warm-toned photos, cozy tech tutorial, cream tones",
        text: "以后直接在搜索框输关键词，系统会按人脸、地点、物体检索，比翻相簿快。",
      },
    ],
    comments: [],
  },
  {
    id: "t-04",
    title: "衣柜收纳小技巧",
    category: "生活",
    coverPrompt:
      "Photo of a neatly organized wooden closet with folded clothes in cream and beige tones, small labels, soft natural light, cozy lifestyle photography",
    coverSize: "portrait_4_3",
    tags: ["收纳", "居家", "入门"],
    author: "小夏",
    authorRole: "居家小能手",
    avatarColor: "#E08A2A",
    date: "2026-08-05",
    likes: 72,
    intro: "衣柜总是乱糟糟？清空分类、竖立折叠、贴标签分区，三步搞定不反弹。",
    steps: [
      {
        id: "s1",
        title: "清空分类",
        imagePrompt:
          "Photo of clothes sorted in neat piles on a bed in a warm cream-toned bedroom, soft daylight, cozy lifestyle tutorial",
        text: "全部拿出来，按季节和类型分四堆：上衣、裤子、内衣、外套。",
      },
      {
        id: "s2",
        title: "竖立折叠",
        imagePrompt:
          "Close-up photo of folded clothes standing upright in a wooden drawer, cream and beige tones, soft light, cozy lifestyle tutorial",
        text: "衣服折成小方块竖着放，像书架一样，抽出来一件不会带倒一片。",
        annotations: [{ x: 45, y: 55, label: "竖立放，看得见" }],
      },
      {
        id: "s3",
        title: "贴标签分区",
        imagePrompt:
          "Close-up photo of small kraft paper labels on wooden drawer dividers with folded clothes, cream tones, soft light, cozy lifestyle tutorial",
        text: "用小标签贴出分区，家人也能照着归位，不用你一个人收拾。",
      },
    ],
    comments: [],
  },
  {
    id: "t-05",
    title: "多肉盆栽养护",
    category: "园艺",
    coverPrompt:
      "Close-up photo of small succulent plants in terracotta pots on a wooden windowsill, soft morning light, cream and green tones, cozy garden photography",
    coverSize: "square",
    tags: ["多肉", "阳台", "入门"],
    author: "阿花",
    authorRole: "阳台园艺师",
    avatarColor: "#A8B89A",
    date: "2026-07-28",
    likes: 41,
    intro: "多肉好养但容易烂根？颗粒土、控水、通风三件事做好，阳台就是小花园。",
    steps: [
      {
        id: "s1",
        title: "配颗粒土",
        imagePrompt:
          "Close-up photo of pouring grainy succulent soil mix into a terracotta pot, hands, warm light, cream and brown tones, cozy garden tutorial",
        text: "七成颗粒（麦饭石、火山岩）+ 三成泥炭，透气排水，根不烂。",
        annotations: [{ x: 55, y: 50, label: "颗粒要占大头" }],
      },
      {
        id: "s2",
        title: "晒与浇水",
        imagePrompt:
          "Close-up photo of succulents on a sunny wooden windowsill, water droplets on leaves, soft morning light, cream and green tones, cozy garden tutorial",
        text: "南窗台多晒。叶子发软发皱再浇透，别按日子浇，夏天更得控水。",
      },
      {
        id: "s3",
        title: "通风防徒长",
        imagePrompt:
          "Photo of succulents near an open window with soft breeze, warm light, cream and green tones, cozy garden tutorial",
        text: "不通风就徒长变绿。开窗或放阳台边，让它们吹吹风。",
      },
    ],
    comments: [],
  },
  {
    id: "t-06",
    title: "香薰蜡烛手作",
    category: "手工",
    coverPrompt:
      "Photo of handmade scented candles in glass jars on a wooden table with dried flowers, soft warm light, cream and amber tones, cozy craft photography",
    coverSize: "landscape_4_3",
    tags: ["蜡烛", "手作", "礼物"],
    author: "木木",
    authorRole: "手作达人",
    avatarColor: "#B89968",
    date: "2026-07-20",
    likes: 63,
    intro: "大豆蜡加精油，手作一颗蜡烛。融蜡温度和加香时机是关键，做好送人也很棒。",
    steps: [
      {
        id: "s1",
        title: "固定烛芯",
        imagePrompt:
          "Close-up photo of fixing a candle wick in a glass jar with a stick, warm light, cream tones, cozy craft tutorial",
        text: "烛芯用胶贴罐底，用筷子夹住保持正中。",
      },
      {
        id: "s2",
        title: "融蜡加香",
        imagePrompt:
          "Close-up photo of melting soy wax in a metal pouring pot, adding essential oil with a dropper, warm light, cream tones, cozy craft tutorial",
        text: "蜡温降到 65 度加精油，约 6% 比例，搅匀。",
        annotations: [{ x: 50, y: 50, label: "65 度再加香，不然会挥发" }],
      },
      {
        id: "s3",
        title: "浇筑冷却",
        imagePrompt:
          "Close-up photo of pouring wax into a glass jar with wick, warm light, cream tones, cozy craft tutorial",
        text: "缓慢倒入，室温静置 6 小时别挪动，剪平烛芯就完成。",
      },
    ],
    comments: [],
  },
];

export const members: FamilyMember[] = [
  { id: "m1", name: "小妹", role: "女儿", avatarColor: "#A8B89A", learned: ["t-01"], saved: ["t-02", "t-05"], pendingQuestions: 1 },
  { id: "m2", name: "小弟", role: "儿子", avatarColor: "#B89968", learned: [], saved: ["t-01"], pendingQuestions: 1 },
  { id: "m3", name: "外婆", role: "长辈", avatarColor: "#D4B896", learned: ["t-03"], saved: [], pendingQuestions: 0 },
];

export const categories = ["全部", "美食", "手工", "数码", "生活", "园艺"] as const;
