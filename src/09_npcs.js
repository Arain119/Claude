/* ==========================================================================
   居民：外观、日程、台词、喜好；信件池与主线
   ========================================================================== */
const NPC_DEFS = [
  { id: 'fang', name: '方姐', title: '邮局局长', look: { gender: 'f', age: 'adult', top: 0x8fb0c8, cardigan: true, inner: 0xffffff, hair: 'bun', glasses: true, bottom: 0x3d4f7a, skirt: true, hairCol: 0x3a2a2a, mouth: 1 }, at: { shop: 'post', off: -2.0 }, hours: [7, 20], likes: ['热拿铁', '樱饼', '一枝玫瑰'],
    lines: ['小信使，今天也辛苦啦。信件在我这儿领。', '寄信的人把心事交给我们，我们得替他们好好送到。', '下雨天要把信揣在怀里——不过今天是好天气。', '岛上的人都认得你那顶绿帽子了。'] },
  { id: 'xiaoman', name: '苏小满', title: '面包房', look: { gender: 'f', age: 'adult', scale: 0.96, apron: true, apronCol: 0xf4b8c8, top: 0xfff6e8, hair: 'pony', ahoge: true, hairCol: 0x8a5a3a, eye: EYES[3], tieCol: 0xe48fa6, mouth: 1 }, at: { shop: 'bakery', off: 2.0 }, hours: [7, 20], likes: ['小花束', '海盐冰淇淋', '小诗集'],
    lines: ['刚出炉的红豆面包！要不要尝一个？', '灯塔那边……最近还亮着吗？啊，我只是随便问问。', '面团发酵的时候，我就看着海发呆。', '樱花开的时候，面包也会变成粉色的哦。'] },
  { id: 'linche', name: '林澈', title: '灯塔守人', look: { gender: 'm', age: 'adult', top: 0x2f3d5e, bottom: 0x55585e, hair: 'short', hairCol: 0x2a2a3a, eye: EYES[1] }, at: { x: CAPE.x + 6.5, z: CAPE.z + 2, yaw: 2.2 }, hours: [0, 24], likes: ['红豆面包', '热拿铁', '岛屿图鉴'],
    lines: ['这座灯塔已经亮了七十年。我是第三个守它的人。', '晚上的海很安静，只有灯在转。', '每天早上都会有人在面包房门口排队吧……我从这里能闻到香味，大概是错觉。', '你看，今天的海是透明的绿色。'] },
  { id: 'chen', name: '陈奶奶', title: '春堂和菓子', look: { gender: 'f', age: 'old', apron: true, apronCol: 0x7a2f45, top: 0xe8d6c0, hair: 'old', mouth: 1 }, at: { shop: 'wagashi', off: 1.8 }, hours: [8, 18], likes: ['小花束', '牛奶', '一枝玫瑰'],
    lines: ['樱饼要配粗茶，孩子。', '我年轻的时候，也收到过一封漂流瓶的信呢。', '这家店开了五十年啦。', '慢慢走，春天又不会跑掉。'] },
  { id: 'zhou', name: '周叔', title: '潮汐拉面', look: { gender: 'm', age: 'adult', apron: true, apronCol: 0x2a2a2a, top: 0xffffff, hair: 'short', hat: 'towel', hairCol: 0x2a2a2a, mouth: 2 }, at: { shop: 'ramen', off: 1.6 }, hours: [11, 22], likes: ['牛奶', '饭团'],
    lines: ['汤头熬了十二个小时！', '吃饱了才有力气送信。', '老海今天又送来好东西了。', '晚上来，给你多加一片叉烧。'] },
  { id: 'xunuo', name: '许诺', title: '拾页书店', look: { gender: 'f', age: 'adult', scale: 0.95, top: 0xe8d6c0, cardigan: true, inner: 0xffffff, bottom: 0x6b5a4a, hair: 'bob', glasses: true, hairCol: 0x4a3226 }, at: { shop: 'books', off: 1.8 }, hours: [9, 20], likes: ['小诗集', '樱花拿铁', '信纸'],
    lines: ['新到了一本旧海图集，你想看看吗？', '书和信很像，都是在等一个人打开。', '嘘——猫在店里睡觉。', '我在写一本关于这座岛的小说，主角是个小信使。'] },
  { id: 'bailu', name: '白露', title: '花信风花店', look: { gender: 'f', age: 'adult', apron: true, apronCol: 0x5f8a5a, top: 0xffffff, hair: 'long', hairCol: 0x6b4a3a, eye: EYES[2], clip: 0xf4b8c8 }, at: { shop: 'flower', off: 2.0 }, hours: [8, 19], likes: ['樱花拿铁', '三色团子'],
    lines: ['今天的满天星特别精神。', '花不会说话，所以人们才用花说话。', '樱花只开两周，所以大家才那么珍惜。', '你帽子上要不要别一朵花？'] },
  { id: 'taotao', name: '桃桃', title: '星屑咖啡', look: { gender: 'f', age: 'adult', scale: 0.93, apron: true, apronCol: 0x6b4a35, top: 0xf6efe0, hair: 'twin', hairCol: 0x5a3a4a, tieCol: 0xf6d04d, mouth: 1 }, at: { shop: 'cafe', off: 2.2 }, hours: [8, 21], likes: ['樱饼', '红豆面包', '唱片《星见夜曲》'],
    lines: ['樱花拿铁卖疯啦！', '我在研究一种海盐焦糖，失败了十二次。', '我拉的海鸥你看得出来吗？', '晚上咖啡馆会点小灯，很漂亮哦。'] },
  { id: 'laohai', name: '老海', title: '渔夫', look: { gender: 'm', age: 'old', outfit: 'fisher', hair: 'short', hat: 'towel', mouth: 2 }, at: { x: 124, z: 12, yaw: Math.PI / 2 }, hours: [5, 18], likes: ['饭团', '牛奶', '潮汐拉面'],
    lines: ['海今天心情不错。', '要钓鱼就去栈桥尽头，别太早收竿。', '我孙子豆豆又跑哪儿去了？', '灯塔那小子啊，人不坏，就是太闷。'] },
  { id: 'qianhe', name: '千鹤', title: '狐守神社', look: { gender: 'f', age: 'teen', outfit: 'miko', hair: 'long', hairCol: 0x1f1f26, ribbon: 0xffffff, eye: EYES[4] }, at: { x: SHRINE.x + 4, z: SHRINE.z + 8, yaw: Math.PI }, hours: [7, 19], likes: ['油豆腐', '三色团子', '樱饼'],
    lines: ['欢迎来到狐守神社。', '传说月亮升起来以后，守护神社的白狐会出来散步。', '白狐最喜欢油豆腐，乌冬店就买得到。', '绘马上的愿望，神明都会一个一个读的。'] },
  { id: 'gu', name: '顾站长', title: '樱丘站', look: { gender: 'm', age: 'adult', outfit: 'suit', hair: 'short', hat: 'cap', hatCol: 0x26375e, hairCol: 0x3a3a3a }, at: { x: 58, z: -61.5, yaw: 0 }, hours: [6, 23], likes: ['热拿铁', '饭团'],
    lines: ['下一班车十几分钟后就到。', '这条线只有两节车厢，可是每天都准点。', '请站在黄线以内等候。', '从这里坐车，四十分钟就到星见港。'] },
  { id: 'yezi', name: '叶子', title: '画家', look: { gender: 'f', age: 'adult', top: 0xf6e08c, bottom: 0x3d4f7a, hair: 'pony', hairCol: 0xa36a4a, hat: 'cap', hatCol: 0xd9483b }, at: { x: -57.5, z: 18, yaw: -Math.PI / 2 }, mode: 'paint', hours: [9, 18], likes: ['樱花拿铁', '岛屿图鉴'],
    lines: ['别动！……啊，你挡住樱花了，往左一点。', '我想画一百张樱花，现在是第六十三张。', '河面上的花瓣叫「花筏」，是不是很好听？', '黄昏的颜色最难调。'] },
  { id: 'xiaying', name: '夏萤', title: '学园二年级', look: { gender: 'f', age: 'teen', outfit: 'sailor', hair: 'twin', hairCol: 0x4a3226, tieCol: 0xd9483b, eye: EYES[3], mouth: 1 }, path: 'main', pathOff: 0, speed: 1.25, hours: [7, 19], likes: ['海盐冰淇淋', '三色团子', '樱花拿铁'],
    lines: ['小信使！今天有我的信吗？没有？……那江遥的呢？', '期末考试什么的，等樱花谢了再说吧！', '你知道吗，灯塔守人和面包房姐姐好像……嘻嘻，秘密。', '放学后要去吃冰淇淋！'] },
  { id: 'jiangyao', name: '江遥', title: '学园二年级', look: { gender: 'm', age: 'teen', outfit: 'blazer', hair: 'short', hairCol: 0x2a2a3a, eye: EYES[1] }, path: 'main', pathOff: 1.6, speed: 1.25, hours: [7, 19], likes: ['唱片《星见夜曲》', '饭团'],
    lines: ['……嗯，你好。', '夏萤走太快了。', '我在学吉他。别告诉别人。', '车站的末班车是十点。'] },
  { id: 'doudou', name: '豆豆', title: '老海的孙子', look: { gender: 'm', age: 'kid', top: 0xf6d04d, bottom: 0x3d4f7a, hair: 'spiky', hairCol: 0x2a2a2a, mouth: 1, shortSleeve: true }, wander: { x: 64, z: 14, r: 5 }, speed: 2.4, hours: [8, 18], likes: ['小鱼干', '海盐冰淇淋', '牛奶'],
    lines: ['我长大要当渔夫，比爷爷还厉害！', '你会荡秋千吗？我能荡到天上去！', '沙滩上有好多贝壳，粉色的最稀有。', '嘘，我在跟踪一只猫。'] },
  { id: 'tangtang', name: '糖糖', title: '小学生', look: { gender: 'f', age: 'kid', top: 0xf4b8c8, bottom: 0xffffff, hair: 'pony', hairCol: 0x6b4a3a, tieCol: 0xf6d04d, skirt: true }, wander: { x: 67, z: 12, r: 4 }, speed: 2.2, hours: [8, 18], likes: ['海盐冰淇淋', '三色团子'],
    lines: ['豆豆是笨蛋！', '我要给妈妈写信，可是我不会写「樱」字。', '你的包里装的都是信吗？好多！'] },
  { id: 'wenye', name: '温爷爷', title: '退休的老师', look: { gender: 'm', age: 'old', top: 0x8a7a6a, bottom: 0x55585e, hair: 'short', mouth: 1 }, sit: { a: 1.2 }, hours: [8, 21], likes: ['热拿铁', '小诗集'],
    lines: ['五十年前，我在这棵树下向她求婚。', '树比我老多了，可它每年都重新年轻一次。', '年轻人，有喜欢的人吗？'] },
  { id: 'wennai', name: '温奶奶', title: '退休的老师', look: { gender: 'f', age: 'old', top: 0xd8b8c8, cardigan: true, inner: 0xffffff, hair: 'old', mouth: 1 }, sit: { a: 1.55 }, hours: [8, 21], likes: ['樱饼', '小花束'],
    lines: ['他每年都说同一个故事，我每年都假装第一次听。', '樱花落在茶里，就是春天的味道。', '慢慢来，日子是用来过的，不是用来赶的。'] },
  { id: 'ashu', name: '阿树', title: '风车单车行', look: { gender: 'm', age: 'adult', apron: true, apronCol: 0x2f3d33, top: 0x9fd2ee, hair: 'spiky', hairCol: 0x4a3226 }, at: { shop: 'cycle', off: -1.6 }, hours: [9, 19], likes: ['饭团', '牛奶'],
    lines: ['链条要常上油。人也是。', '骑车绕岛一圈要四十分钟，下坡的时候超爽。', '洛洛那辆车的刹车又被她骑坏了。'] },
  { id: 'tangtang2', name: '唐唐', title: '学园三年级', look: { gender: 'f', age: 'teen', outfit: 'blazer', hair: 'long', hairCol: 0x2a2a3a, eye: EYES[2] }, at: { x: 72, z: -62.4, yaw: 0 }, mode: 'phone', hours: [7, 21], likes: ['樱花拿铁'],
    lines: ['我在等去星见港的车，补习班要迟到了。', '这个站台看樱花角度最好，你知道吗？', '毕业以后，我想去对岸的城市看看。'] },
  { id: 'song', name: '宋先生', title: '上班族', look: { gender: 'm', age: 'adult', outfit: 'suit', hair: 'short', hairCol: 0x2a2a2a, glasses: true }, at: { x: 44, z: -57.6, yaw: Math.PI }, hours: [7, 22], likes: ['热拿铁', '饭团'],
    lines: ['每天坐同一班车，看同一片海，倒也不坏。', '今天的会议……算了，先看樱花。', '要是我也能当信使就好了，可以到处走走。'] },
  { id: 'chengcheng', name: '程程', title: '学园一年级', look: { gender: 'f', age: 'teen', outfit: 'sailor', hair: 'bob', hairCol: 0x6b4a3a, ribbon: 0xd9483b }, at: { x: SHRINE.x - 0.6, z: SHRINE.z - 1.5, yaw: Math.PI }, mode: 'pray', hours: [15, 19], likes: ['三色团子', '小花束'],
    lines: ['（小声）希望他能看到我的信……', '啊！你什么都没听见对吧？', '神明大人一定会帮我的。'] },
  { id: 'jitong', name: '季同学', title: '学园二年级', look: { gender: 'm', age: 'teen', outfit: 'blazer', hair: 'spiky', hairCol: 0x4a3226 }, path: 'river', bike: 0x2c5aa0, speed: 4.2, hours: [7, 19], likes: ['饭团'],
    lines: ['让一让——！啊，是你啊。', '沿着河堤骑车，花瓣会落进嘴里。'] },
  { id: 'luoluo', name: '洛洛', title: '学园一年级', look: { gender: 'f', age: 'teen', top: 0xc9e2b0, bottom: 0x3d4f7a, hair: 'pony', hairCol: 0x8a5a3a, skirt: false }, path: 'river', pathOff: 0.5, bike: 0xe48fa6, speed: 3.6, hours: [8, 19], likes: ['海盐冰淇淋'],
    lines: ['刹车？刹车是什么，能吃吗？', '阿树哥说我的车需要「休息」。'] },
  { id: 'shen', name: '沈阿姨', title: '主妇', look: { gender: 'f', age: 'adult', top: 0xe2b0a0, bottom: 0x6b5a4a, hair: 'bob', hairCol: 0x3a2a2a, skirt: true }, path: 'main', pathOff: 0.35, speed: 1.0, hours: [9, 18], likes: ['小花束', '红豆面包'],
    lines: ['今天的青柠蔬果有特价草莓！', '我家那口子又忘了倒垃圾。', '你是方姐家的小信使吧？真能干。'] },
  { id: 'xiaozhou', name: '宋小舟', title: '小学生', look: { gender: 'm', age: 'kid', top: 0x9fd2ee, bottom: 0xf6e08c, hair: 'short', hairCol: 0x3a2a2a, shortSleeve: true }, at: { x: -12, z: 118, yaw: 0.3 }, mode: 'sit', sitY: 0, hours: [9, 17], likes: ['海盐冰淇淋'],
    lines: ['我在堆一座灯塔！', '要涨潮了，城堡会被冲走吗？'] },
  { id: 'alan', name: '阿蓝', title: '海盐冰室', look: { gender: 'f', age: 'teen', top: 0x9fd2ee, bottom: 0xffffff, hair: 'bob', hairCol: 0x2a5a7a, apron: true, apronCol: 0xffffff, skirt: false }, at: { x: 26, z: 108.0, yaw: 0 }, hours: [10, 19], likes: ['樱花拿铁'],
    lines: ['海盐冰淇淋，咸咸甜甜，和夏天一个味道。', '这里是岛上最晚看到日落的地方。'] },
  { id: 'chengshu', name: '程叔', title: '邮差前辈', look: { gender: 'm', age: 'adult', outfit: 'messenger', hat: 'messenger', hair: 'short', hairCol: 0x2a2a2a }, path: 'south', speed: 1.3, hours: [8, 17], likes: ['热拿铁', '潮汐拉面'],
    lines: ['当年我也是从后巷那间小屋开始送信的。', '记住：先送远的，再送近的。', '狗不可怕，可怕的是没贴邮票的信。'] },
  { id: 'tangnai', name: '唐奶奶', title: '散步的奶奶', look: { gender: 'f', age: 'old', top: 0xb8a8e0, bottom: 0x6b5a4a, hair: 'old', skirt: true }, path: 'harbor', speed: 0.7, hours: [7, 17], likes: ['樱饼', '牛奶'],
    lines: ['走走路，看看海，一天就过去啦。', '年轻人走路都太快了。'] },
  { id: 'xiaoyu', name: '小雨', title: '夜樱散步', look: { gender: 'f', age: 'teen', top: 0x26375e, bottom: 0xf6efe0, hair: 'long', hairCol: 0x3a2a2a, skirt: true }, path: 'river', pathOff: 0.2, speed: 0.9, hours: [18, 24], likes: ['樱花拿铁'],
    lines: ['夜樱比白天更像梦。', '灯笼亮起来的时候，河面会变成金色。'] },
  { id: 'baiye', name: '白夜', title: '夜樱散步', look: { gender: 'm', age: 'teen', top: 0xf6efe0, bottom: 0x2f3a33, hair: 'short', hairCol: 0x2a2a2a }, path: 'river', pathOff: 0.205, speed: 0.9, hours: [18, 24], likes: ['热拿铁'],
    lines: ['……嗯，我们只是一起散步。只是散步。'] },
];

/* 信件池：to 为居民 id；mailbox 为门牌姓氏 */
const LETTER_POOL = [
  { from: '陈奶奶', to: 'xunuo', title: '订书的回执', react: '啊，陈奶奶订的那本旧食谱到啦，我这就给她留着。', tip: 4 },
  { from: '周叔', to: 'laohai', title: '下周的鱼货单', react: '周家小子又要青花鱼？行，我早点出海。', tip: 4 },
  { from: '白露', to: 'taotao', title: '春季花艺课邀请', react: '花艺课！我要做一个咖啡色的花环！', tip: 5 },
  { from: '夏萤', to: 'jiangyao', title: '折成星星的纸条', react: '……（他把纸条小心地夹进了课本里）谢谢。', tip: 5 },
  { from: '叶子', to: 'qianhe', title: '画展邀请函', react: '叶子姐姐要开画展？我一定去！', tip: 5 },
  { from: '阿树', to: 'luoluo', title: '单车修好的通知', react: '修好啦？太好了，这次我会温柔地对待刹车的！', tip: 4 },
  { from: '桃桃', to: 'bailu', title: '咖啡豆样品', react: '好香……下次给她带一束洋甘菊。', tip: 4 },
  { from: '许诺', to: 'yezi', title: '绘本合作的信', react: '要给岛上的小说画插图？我答应！', tip: 6 },
  { from: '老海', to: 'doudou', title: '给孙子的贝壳', react: '是爷爷！里面有一枚粉色的贝壳！', tip: 3 },
  { from: '千鹤', to: 'chen', title: '春祭和果子订单', react: '三百个樱饼……看来今年又要熬夜啦，呵呵。', tip: 6 },
  { from: '温奶奶', to: 'wenye', title: '五十年前情书的复印件', react: '（他读着读着，耳朵红了）……这字写得真难看啊。', tip: 6 },
  { from: '顾站长', to: 'song', title: '失物招领通知', react: '我的伞！原来落在站台上了。', tip: 4 },
  { from: '程程', to: 'jitong', title: '没有署名的信', react: '谁、谁写的？……（他四处张望，脸红到了耳根）', tip: 5 },
  { from: '方姐', to: 'chengshu', title: '退休纪念会通知', react: '纪念会就不必了……不过，谢谢你跑这一趟。', tip: 4 },
  { from: '对岸的大学', to: 'tangtang2', title: '录取通知书', react: '真的？！我考上了！谢谢你，小信使！', tip: 8 },
  { from: '沈阿姨', to: 'zhou', title: '外卖拉面的订单', react: '十碗？今天沈家有喜事吧！', tip: 4 },
  { from: '樱丘诊所', mailbox: true, title: '体检报告', tip: 3 },
  { from: '海岛电力', mailbox: true, title: '电费账单', tip: 2 },
  { from: '星见岛学园', mailbox: true, title: '家长会通知', tip: 3 },
  { from: '远方的亲戚', mailbox: true, title: '一张明信片', tip: 3 },
  { from: '小岛五金', mailbox: true, title: '新品传单', tip: 2 },
];
const STORY = [
  { day: 1, from: '苏小满', to: 'linche', title: '一封带着面包香的信', react: '……没有署名？可这味道，是红豆面包。\n（他把信贴在胸口，望向商店街的方向）\n明天你还会来吗？我想……托你送一封回信。', tip: 8 },
  { day: 2, from: '林澈', to: 'xiaoman', title: '夹着海石竹的回信', react: '他、他回信了？！\n（她把那朵小小的海石竹别在了耳边）\n……小信使，明天早上，请一定再来一趟。', tip: 8 },
  { day: 3, from: '苏小满', to: 'linche', title: '樱花树下的约定', react: '「今晚九点，樱花广场，那棵最老的树下。」\n……（灯塔守人沉默了很久，然后笑了）\n谢谢你。今晚，灯塔就交给海风吧。', tip: 10 },
];
const STAMP_DEFS = [
  { id: 'first', ch: '信', name: '初次投递', col: '#e48fa6', desc: '送出第一封信' },
  { id: 'story', ch: '塔', name: '灯塔与面包', col: '#2c6ea0', desc: '送完小满与林澈的三封信' },
  { id: 'date', ch: '樱', name: '樱花之约', col: '#d24d73', desc: '见证樱花树下的约定' },
  { id: 'fox', ch: '狐', name: '狐火', col: '#c8352e', desc: '夜里给白狐献上油豆腐' },
  { id: 'bottle', ch: '瓶', name: '漂流瓶', col: '#2a8f8f', desc: '把漂流瓶里的信交给收信人' },
  { id: 'fish', ch: '鱼', name: '第一条鱼', col: '#3a7f7a', desc: '在栈桥钓到鱼' },
  { id: 'shell', ch: '贝', name: '贝壳收藏家', col: '#e9a07a', desc: '捡到 5 枚贝壳' },
  { id: 'wish', ch: '星', name: '星愿', col: '#d9b45a', desc: '在星愿井许愿' },
  { id: 'cat', ch: '猫', name: '橘猫朋友', col: '#f39a3d', desc: '让橘子跟着你散步' },
  { id: 'busy', ch: '勤', name: '勤劳信使', col: '#5f8a5a', desc: '累计送出 10 封信' },
  { id: 'night', ch: '夜', name: '夜樱', col: '#6a5aa8', desc: '夜晚在樱川河堤散步' },
  { id: 'sunset', ch: '夕', name: '海上日落', col: '#e98a2b', desc: '黄昏时坐在灯塔岬的长椅上' },
];

/* ---------------- 路径 ---------------- */
const PATHS = {};
function buildPaths() {
  PATHS.main = { loop: true, pts: [[5.4, -46], [5.4, 35.2], [-5.4, 35.2], [-5.4, -46]] };
  const rv = []; for (let z = -40; z <= 82; z += 6) rv.push([riverAtZ(z) + 11.0, z]); PATHS.river = { loop: false, pts: rv };
  PATHS.harbor = { loop: false, pts: [[110, -22], [110, 56]] };
  PATHS.south = { loop: false, pts: [[-55, 45.6], [96, 45.6], [106, 45.6], [106, -60]] };
  PATHS.beach = { loop: false, pts: [[-40, 120], [60, 124]] };
}
function pathLen(P) { let L = 0; const n = P.pts.length; for (let i = 0; i < (P.loop ? n : n - 1); i++) { const a = P.pts[i], b = P.pts[(i + 1) % n]; L += Math.hypot(b[0] - a[0], b[1] - a[1]); } return L; }
function pathAt(P, s) {
  // s：沿路径的距离；非循环路径往返
  const L = P.L || (P.L = pathLen(P)); let d, back = false;
  if (P.loop) d = ((s % L) + L) % L; else { const m = ((s % (2 * L)) + 2 * L) % (2 * L); if (m > L) { d = 2 * L - m; back = true; } else d = m; }
  const n = P.pts.length;
  for (let i = 0; i < (P.loop ? n : n - 1); i++) { const a = P.pts[i], b = P.pts[(i + 1) % n]; const l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (d <= l) { const t = d / l; let dx = b[0] - a[0], dz = b[1] - a[1]; if (back) { dx = -dx; dz = -dz; } return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, Math.atan2(dx, dz)]; } d -= l; }
  const e = P.pts[P.loop ? 0 : n - 1]; return [e[0], e[1], 0];
}

/* ---------------- 居民运行时 ---------------- */
const NPCS = [];
function spawnNPCs() {
  buildPaths();
  for (const d of NPC_DEFS) {
    const c = makeCharacter(d.look);
    const holder = new THREE.Group(); holder.add(c.root); scene.add(holder);
    const n = { d, id: d.id, name: d.name, c, holder, pos: new THREE.Vector3(), yaw: 0, mode: d.mode || 'idle', s: 0, speed: d.speed || 1.2, wanderT: 0, target: null, friend: 0, talkedDay: -1, giftDay: -1, visible: true, override: null };
    if (d.at) {
      if (d.at.shop) { const sh = SHOPS.find(s => s.def.id === d.at.shop); const E = sh.def.side === 'E'; n.home = [sh.x + (E ? -0.3 : 0.3), sh.z + d.at.off, E ? -Math.PI / 2 : Math.PI / 2]; }
      else n.home = [d.at.x, d.at.z, d.at.yaw];
    } else if (d.sit) { const a = d.sit.a; n.home = [PLAZA.x + Math.cos(a) * 2.78, PLAZA.z + Math.sin(a) * 2.78, Math.atan2(Math.cos(a), Math.sin(a))]; n.mode = 'sit'; n.sitY = TOWN_Y + 0.6; }
    else if (d.wander) { n.home = [d.wander.x, d.wander.z, 0]; n.mode = 'wander'; }
    else if (d.path) { n.mode = d.bike ? 'bike' : 'path'; n.s = (d.pathOff || 0) * pathLen(PATHS[d.path]) + R(0, 1); }
    if (d.mode === 'sit') n.sitY = d.sitY != null ? groundAt(n.home[0], n.home[1]) + 0.05 : TOWN_Y + 0.5;
    if (d.bike) { const b = makeBike(d.bike); b.g.scale.setScalar(1); holder.add(b.g); n.bikeObj = b; c.root.position.set(0, 0.86, -0.12); }
    if (n.home) { n.pos.set(n.home[0], groundAt(n.home[0], n.home[1]), n.home[1]); n.yaw = n.home[2]; }
    NPCS.push(n);
  }
}
const NPC_BY = (id) => NPCS.find(n => n.id === id);
function npcActive(n, hour) {
  if (n.override) return n.override.active !== false;
  const h = n.d.hours; return h[0] <= h[1] ? hour >= h[0] && hour < h[1] : hour >= h[0] || hour < h[1];
}
function updateNPCs(dt, t, hour, ppos) {
  for (const n of NPCS) {
    const active = npcActive(n, hour);
    if (!active) { if (n.holder.visible) n.holder.visible = false; continue; }
    const dist = Math.hypot(n.pos.x - ppos.x, n.pos.z - ppos.z);
    let mode = n.override ? n.override.mode : n.mode; let speed = 0;
    // 位置更新（即使很远也推进路径）
    if (n.override && n.override.pos) { n.pos.set(n.override.pos[0], n.override.pos[1], n.override.pos[2]); n.yaw = n.override.yaw; }
    else if (mode === 'path' || mode === 'bike') {
      const P = PATHS[n.d.path]; const blocked = dist < 1.3 && mode === 'path' && Math.cos(Math.atan2(ppos.x - n.pos.x, ppos.z - n.pos.z) - n.yaw) > 0.5;
      if (!blocked) { n.s += n.speed * dt; speed = n.speed; }
      const p = pathAt(P, n.s); const nx = p[0] + (mode === 'bike' ? 0 : Math.sin(p[2] + Math.PI / 2) * 0.0), nz = p[1];
      n.pos.x = nx; n.pos.z = nz; n.pos.y = groundAt(nx, nz, n.pos.y + 0.6);
      let dy = p[2] - n.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); n.yaw += dy * Math.min(1, dt * 6);
    } else if (mode === 'wander') {
      if (!n.target || n.wanderT <= 0) { const a = R(0, TAU), r = R(0, n.d.wander.r); n.target = [n.home[0] + Math.cos(a) * r, n.home[1] + Math.sin(a) * r]; n.wanderT = R(3, 7); }
      n.wanderT -= dt; const dx = n.target[0] - n.pos.x, dz = n.target[1] - n.pos.z; const L = Math.hypot(dx, dz);
      if (L > 0.3) { speed = n.speed; n.pos.x += dx / L * speed * dt; n.pos.z += dz / L * speed * dt; let dy = Math.atan2(dx, dz) - n.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); n.yaw += dy * Math.min(1, dt * 8); }
      n.pos.y = groundAt(n.pos.x, n.pos.z, n.pos.y + 0.6);
    } else if (n.home && !n.override) { n.pos.set(n.home[0], n.pos.y || groundAt(n.home[0], n.home[1]), n.home[1]); }
    // 正在交谈：面向玩家
    if (GAME.talkingTo === n) { const want = Math.atan2(ppos.x - n.pos.x, ppos.z - n.pos.z); let dy = want - n.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); n.yaw += dy * Math.min(1, dt * 6); if (mode === 'path' || mode === 'wander' || mode === 'idle' || mode === 'phone') { mode = 'talk'; speed = 0; } }
    const vis = dist < Q.npc;
    n.holder.visible = vis;
    if (!vis) continue;
    n.holder.position.copy(n.pos); n.holder.rotation.y = n.yaw;
    if (mode === 'sit' || n.override && n.override.mode === 'sit') { n.c.root.position.y = (n.override && n.override.sitY != null ? n.override.sitY : n.sitY) - n.pos.y; }
    setOutline(n.c, dist < Q.outline);
    if (dist > 60 && (n._skip = !n._skip)) continue;
    let st = mode === 'path' || mode === 'wander' ? (speed > 0.1 ? (speed > 2 ? 'run' : 'walk') : 'idle') : mode === 'bike' ? 'bike' : mode;
    if (st === 'run' && n.d.look.age !== 'kid' && speed < 2.6) st = 'walk';
    poseCharacter(n.c, dt * (dist > 60 ? 2 : 1), st, speed, t);
    if (n.bikeObj) for (const w of n.bikeObj.wheels) w.rotation.x += speed * dt / 0.33;
  }
}
