// Data ownership and page placement only. Keep key patterns and order stable.
(function () {
  'use strict';
  // ================= 功能登记表 =================
  // scope：'desk' 当前桌面 / 'global' 全局共用 / 'both' 两类都含
  // res：后缀正则（匹配 parseKey 后的 suffix，不含命名空间）
  // anchor（只对 global/both 有意义）：这份「所有桌面共用」的数据**实际**锚在哪个命名空间。
  //   缺省＝顶层根键 xy-home-v2:<后缀>（抉择／群抉择／查岗开关走这条）。
  //   'default'＝锚在默认桌面命名空间 xy-home-v2:default:<后缀>——音乐整个模块把这一格当公共库
  //   硬用：music-player.js:10 `MUSIC_PREFIX = 'xy-home-v2:default'` ＋ :11 `store = storeFor('default')`，
  //   文件头注释写明「音乐数据全局共享——所有桌面共用同一份」，mergeDesksMusic() 还把各桌面原先
  //   独立的音乐并进这一格。本站「全局共用」从来不止一个落点，旧引擎却只有「global＝顶层」这一条
  //   等式 ⇒ 锚在 default 命名空间的共享数据对计数／导出／清空三扇门全隐形（vivo X200s/Edge 实报
  //   「音乐里点【导出数据】，说本桌面暂无数据」——而诊断包里 default:music-playlists 341KB、
  //   default:music-file:* 每个 11~33MB 都实实在在在库），且导入按 global 一律落到顶层＝模块读不到
  //   的地方＝第二次静默丢数据。判据按事实拆成两格，不再由 scope 反推命名空间。
  // page：该功能自己的页面 id（#679 各功能页内直达入口；跨域声明见 WORKLOG——
  //       只读各功能 template/JS 已有的静态 id，不改任何归属文件）
  var FEATURES = [
    { id: 'sugar-diary', name: '血糖日记', group: '桌面功能', scope: 'global', page: 'page-calendar', desc: '甜食日期、食物、份量与备注', res: [/^sugar-diary$/, /^sugar-hba1c$/] },
{ id: 'fish', name: '摸鱼与上班天数', group: '桌面功能', scope: 'both',
      desc: '摸鱼累计天数、上班打卡天数、双方各自的摸鱼记录',
      res: [/^fish-/, /^work-/, /^day-fish/, /^day-work/, /^weekend-fish/] },
{ id: 'tongpin', name: '同频', group: '桌面功能', scope: 'desk', page: 'page-tongpin',
      desc: '同频状态与发送记录',
      res: [/^tongpin-/] },
{ id: 'shenshou', name: '伸手', group: '桌面功能', scope: 'desk', page: 'page-shenshou',
      desc: '伸手次数、上次伸手时间与字卡',
      res: [/^shenshou-/] },
{ id: 'water', name: '喝水', group: '桌面功能', scope: 'desk', page: 'page-water',
      desc: '喝水目标与历史、连续天数、提醒语',
      res: [/^water-/] },
{ id: 'piggy', name: '存钱罐', group: '桌面功能', scope: 'both', page: 'page-piggy',
      desc: '存钱目标与流水、心意币两套罐子、来访记录',
      res: [/^piggy-/] },
{ id: 'pomo', name: '番茄钟', group: '桌面功能', scope: 'both', page: 'page-pomodoro',
      desc: '番茄钟设置、累计次数与今日进度、陪伴记录',
      res: [/^pomo-/] },
{ id: 'garden', name: '花园', group: '桌面功能', scope: 'desk', page: 'page-garden',
      desc: '种下的花与生长进度、收获记录',
      res: [/^garden-/] },
{ id: 'cjian', name: '此间与梦角档案', group: '桌面功能', scope: 'both', page: 'page-cjian',
      desc: '此间状态与换家标记、成员名册、梦角档案（含时辰区间）',
      res: [/^cjian-/, /^narc-/] },
{ id: 'myarc', name: '我的档案', group: '桌面功能', scope: 'both', page: 'page-my-arc',
      desc: '我的档案资料与共享给 TA 的部分',
      res: [/^myarc/] },
{ id: 'room', name: '房间', group: '桌面功能', scope: 'desk', page: 'page-room',
      desc: '房间摆放与装修、家具位置',
      res: [/^room-/] },
{ id: 'drift', name: '漂流瓶', group: '桌面功能', scope: 'desk', page: 'page-drift',
      desc: '我扔出/收到的漂流瓶与回复',
      res: [/^drift-/] },
{ id: 'accounting', name: '记账', group: '桌面功能', scope: 'desk', page: 'page-accounting',
      desc: '账目记录、分类、预算与心意币记录',
      // #1325 审计：TA 记账提醒三把键 acc-remind-on/-prob/-day（accounting.js:786-788，随桌面隔离）
      // 旧正则 /^accounting-/ 认不到 ⇒ 账本搬走了、提醒却还在新设备上每天发。
      res: [/^accounting-/, /^acc-remind/, /^records-coin/] },
{ id: 'period', name: '经期记录', group: '桌面功能', scope: 'both', page: 'page-period',
      desc: '经期记录与预测、每日状态、关心语与提醒设置',
      res: [/^period-/] },
{ id: 'memo', name: '备忘录', group: '桌面功能', scope: 'both', page: 'page-memo',  // desk→both：见 pomo 上方 #1325 批注
      desc: '备忘录条目、发送记录、全局迁移标记',
      res: [/^memo-app-/] },
    // #1346 审计（desk→both）：聊天这一族的键横跨两个锚点，且**表情包那一大块整体在顶层根命名空间**——chat.js:12341-12345
    // `myEmojiStore()=xyStore(MYE_G_PREFIX)`（MYE_G_PREFIX 就是 'xy-home-v2'，:12342 那句拼键自证）写
    // `my-emoji-groups`／`hide-ta-sticker`／`emoji-recent`／`emoji-recent-<类别>`；美化方案 `chat-beauty-schemes` 走
    // chat-settings.js:1943+1958 的 `gStoreChat=xyStore('xy-home-v2')`；字体面 `cs-font` 也有一份根键（:1642/1647）；
    // 开关 `chat-panel-prewarm` 注释直接写「全局根键」（chat.js:13582）。旧 desk 只在当前桌面恰好是 default 时才认根键
    // ⇒ 第二个联系人桌面上「导出聊天」里没有公用表情包分组、没有最近使用、没有隐藏 TA 贴纸开关（13MB 级数据在库里看不见）。
    // 同批把 /^rp-wallet$/ 从本行摘掉（只留红包封面 /^rp-cover-/）：那是心意币旧账本（memory-game.js:141 读根键、
    // chat.js:9247 只当迁移源），旧表把它挂在聊天名下而 gift 行也登记了同一把——first match wins 让 gift 永远拿不到；
    // chat 一翻 both 就会把这份钱从「礼物与集市」彻底抢走，故归位给 gift。
    { id: 'chat', name: '聊天', group: '聊天与社交', scope: 'both', page: 'page-chat', btns: 'cs-export-msgs,cs-import-msgs,cs-clear-msgs',
      desc: '聊天记录、聊天设置（气泡/字号/时间轴/输入栏）、表情包与文字库、拍一拍、红包、引用',
      // #1325b 审计：ask-think-secs＝聊天设置里的「TA 思考秒数」（chat.js:10129/10147 走 activeStore），
      // 旧表里没有这一项 ⇒ 换机后 TA 又变回默认 3 秒思考。
      res: [/^chat-/, /^cs-(?!avatar-|lbl-)/, /^rp-cover-/, /* #1346: legacy rp-wallet moves to gift; see the chat-row comment block */ /^emoji-last$/, /^emoji-recent/, /^my-emoji-groups$/, /^my-text-groups$/, /^my-invite-groups$/, /^mye-global-migrated$/, /^hide-tab-/, /^hide-ta-sticker$/, /^invite-ask-history$/, /^poke-/, /^rps-score$/, /^scroll-anchor-auto$/, /^sysmsg-/, /^more-tab$/, /^more-cat$/, /^mail-emoji-mode$/, /^qixi-today$/, /^ask-think-secs$/] },
    // #1325 审计（与 requests 同族＝scope 与模块真实命名空间脱节）：群聊的键按 group-chat.js:4
    // 「消息全局存储（xy-home-v2:group-chat-msgs），不随联系人切换变」全在顶层根命名空间
    // （:79 gc-groups、:113 gc-profiles、:2052 gc-msgs-<gid>、:212 gc-beauty），旧登记 desk 只在
    // 「当前桌面恰好是 default」时才认顶层键（featureOfKey 的 isTop && cid==='default' 那半条兜底）
    // ⇒ 第二个联系人桌面上群聊＝「本桌面暂无数据」，导出/清空都看不见，而群聊页照旧有全部记录。
    { id: 'gc', name: '群聊', group: '聊天与社交', scope: 'both', page: 'page-group-chat',
      desc: '群聊记录、群分组、群成员资料、群聊美化与设置',
      // #1325b 审计：group-chat-enabled（群聊总开关）由 chat-settings.js:2691-2694 走 xyStore(GNS) 写在顶层，
      // 旧表只认 /^group-chat-msgs$/ ⇒ 开关本身导不出也清不掉（新设备上「群聊没开」这个状态跟不过去）。
      res: [/^gc-/, /^group-chat-msgs$/, /^group-chat-enabled$/] },
    // #1346 审计（desk→both）：公用字卡／表情包库按设计就是全局一份——chatcard.js:23 注释「公用字卡：全局根命名空间
    // 键 xy-home-v2:cc-groups-public——以后每个桌面的联系人都能使用」，:28 `PUB_KEY`、:37 同族的 `cc-groups-public-off`；
    // default-cards.js:186-197 的自定义词典 `dict-custom-quotes`／`dict-custom-words` 也走 `raw=xyStore('xy-home-v2')`；
    // reply-settings.js:239-245 的 `reply-gc-*` 同形。⇒ 旧 desk 在联系人桌面上把这一整块判成「没数据」。
    // ⚠️ 翻 both 后从任何桌面导出都会见到 `cc-groups-public`（用户机上实测 424.59 MB）——它由 planKeys 的
    // ONE_KEY_MAX 挡在文件外并当场说明「请用整包备份」，清空仍会真删它（弹窗按 both 口径写明影响所有桌面）。
    { id: 'cards', name: '字卡库与回复设置', group: '聊天与社交', scope: 'both', page: 'page-custom-cards', btns: 'cc-export,cc-import-data,cc-clear-all',
      desc: '自定义/公用/默认字卡、词典、TA 回复字卡、各类概率与开关（回复设置）',
      // #1325b 审计：mood-reply-cards.js:55/99/102/403/419 这套「心情回应卡」开关与概率＝mc-enabled / mc-prob-<type> /
      // mc-off-<类别> / mh-<类别> / rc-enabled（回应字卡总开关，与撤回补发的 rc-en 是两个键，card-audit.js:440 注明），
      // 旧表一条都不认 ⇒ 关掉的类别换机后全部悄悄 reopen。
      res: [/^cc-/, /^quote-cards/, /^reply-/, /^dc-/, /^dcf-/, /^dict-/, /^rcard-/, /^tm-/, /^rps-/, /^mc-/, /^mh-/, /^rc-/] },
    { id: 'fav', name: '收藏', group: '聊天与社交', scope: 'desk', page: 'page-fav',
      desc: '我收藏的消息/字卡/图片与 TA 的收藏',
      // #1325 审计：fav-settings.js:17/32 写的四把概率键是 fav-ta-msg / fav-ta-card / fav-ta-mail /
      // fav-ta-feed，旧正则一条都不认（/^fav-settings/ 是另一种拼法）⇒「收藏」页里 TA 收藏概率
      // 整段导不出也清不掉（导出去的文件里没有它，清空后这四个设置照旧生效）。
      res: [/^fav-msgs$/, /^fav-img-/, /^fav-media-/, /^fav-settings/, /^fav-ta-/] },
    { id: 'identity', name: '昵称与头像', group: '聊天与社交', scope: 'desk',
      desc: '双方当前昵称、头像、聊天页昵称与头像（各功能显示处共用这份资料）',
      // #1325b 审计：partner-gender（contacts.js:319-321 按 cid 存『他/她/TA』）不在任何 res 里 ⇒ 换机后所有指代
      // 回到默认「TA」，而它正是 #1325 那族「键在桌面命名空间但没人管」的又一格。
      res: [/^lbl-user$/, /^lbl-partner$/, /^cs-lbl-/, /^avatar-user$/, /^avatar-partner$/, /^cs-avatar-/, /^records-avatar$/, /^partner-gender$/] },
    { id: 'interact', name: '头像和昵称互动', group: '聊天与社交', scope: 'desk', page: 'page-interact',
      desc: '头像库/昵称库与其自动更换进度、开关',
      // #1325 审计：头像库那一套四把键（avatar-lib / avatar-me-lib 家族）在册，昵称库只登了
      // /^nick-lib/，而 avatar-lib.js:1339-1410 的「我的昵称库」写的是 nick-me-lib / -enabled /
      // -next / -last / -cur-hash ⇒ 换装一半导得出去一半出不去（清完头像库，昵称库还悄悄换我的名字）。
      res: [/^avatar-lib/, /^avatar-me-lib/, /^nick-lib/, /^nick-me-lib/] },
    { id: 'mail', name: '信箱', group: '聊天与社交', scope: 'desk', page: 'page-mail', btns: 'mail-export,mail-import,mail-clear',
      desc: '收信/寄信/回信、待回信计划、信箱设置（含每周摸鱼小结）',
      res: [/^mail-/, /^ml-/] },
    { id: 'feed', name: '朋友圈', group: '聊天与社交', scope: 'both', page: 'page-feed', btns: 'feed-clear-all',
      desc: '全部动态、评论点赞、通知提醒、封面与昵称头像',
      res: [/^feed-/] },
    { id: 'ask', name: 'TA 的提问与问卷', group: '聊天与社交', scope: 'desk', page: 'page-ta-ask',
      desc: 'TA 的提问/选择题/好奇/吐槽、问卷作答记录、询问提醒时间',
      // #1325b 审计：ta-invite.js:115/116 的 ti-last-id（上一条邀请到哪一首）无人认领 ⇒ 换机后从第一条重头邀请。
      res: [/^ta-ask$/, /^ta-survey$/, /^ta-choose$/, /^ta-curious$/, /^ta-roast$/, /^ta-cc-state$/, /^ta-checkin$/, /^interact-card-last$/, /^ta-chime:/, /^ti-last-id$/] },
    // #1325 审计：desk-msg-en 由 chat.js:6221 走 activeStore 写在**各桌面**命名空间，其余四把开关
    // 由 incoming-requests.js:43-104 走 xyStore(ROOT) 写在顶层——旧登记 global 只认顶层 ⇒ 这把
    // 「跨桌面来消息」开关两头都拿不到（requests 按 global 拒认 per-cid，desktop 的 /^desk-/ 又排在它后面）。
    { id: 'requests', name: '跨桌面查岗 / 来电开关', group: '聊天与社交', scope: 'both',
      desc: '跨桌面查岗开关与频率、跨桌面来电、夜间静默模式、待处理请求',
      res: [/^incoming-requests$/, /^desk-checkin-en$/, /^desk-call-en$/, /^desk-freq-mode$/, /^desk-msg-en$/, /^night-mode-en$/] },

    { id: 'calendar', name: '日历与每日留言', group: '桌面功能', scope: 'desk', page: 'page-calendar',
      desc: '每日留言、心情与语录历史、恋爱开始日、首次使用日、日历标注',
      // #1325b 审计：p2-features.js:1380/1381 的 legacyToday('memo'／'today-mood', …) 读的就是这两个**裸旧键**
      // （:1409/:1429 仍在写），旧正则 /^memo-(?!app)/ 与 /^today-mood-/ 都带短横 ⇒ 当日那条备忘/心情既读不回也导不走。
      res: [/^cal-/, /^memo-(?!app)/, /^mood-history$/, /^quote-history$/, /^today-mood-/, /^first-use-date$/, /^love-start$/, /^memo$/, /^today-mood$/] },
    { id: 'records', name: '纪念与统计', group: '桌面功能', scope: 'desk', page: 'page-home',
      desc: '纪念日、通话记录、关心/摸鱼收获等纪念页数据',
      res: [/^records-(?!coin)/] },
    // #1346 审计（desk→both）：牌面与图鉴走 divination.js:248/285/289/302 的 `gStore`＝根命名空间
    // （`divine-faces-idx`、`divine-leno-36`、`divine-face-onebased`、`divine-face-<m>-<n>`），只有抽牌历史
    // `divine-history` 随桌面（:797）⇒ 旧 desk 在联系人桌面上「有历史、没牌面」，导出回去的自定义牌面全丢。
    { id: 'divination', name: '占卜', group: '桌面功能', scope: 'both', page: 'page-divine',
      desc: '占卜历史、自定义牌面与图鉴、牌面编号开关',
      res: [/^divine-/, /^divf-/] },
    { id: 'music', name: '音乐', group: '桌面功能', scope: 'global', anchor: 'default', page: 'page-music',
      desc: '本地上传的音乐文件、歌单、收藏、播放顺序与播放记录（所有桌面共用一份）',
      res: [/^music-/] },
    
    
    
    
    { id: 'eat', name: '吃什么', group: '桌面功能', scope: 'desk', page: 'page-eat',
      desc: '菜单、抽取历史与提醒开关',
      res: [/^eat-/] },
    // #1346 审计（desk→both）：罐子本体走 p2-features.js:3540 `piggyStore()=xyStore('xy-home-v2')`
    // （`piggy-log`、`piggy-goals`），心意币两把参数 `piggy-coin-prob`／`piggy-coin-ask-limit` 也是根键（chat.js:9411/9418 读）,
    // 只有 `piggy-coin2-*` 那套新罐随桌面（p2-features.js:3950）⇒ 旧 desk 在联系人桌面上把流水与目标判成没数据。
    
    // #1325 审计（三处同族）：pomoStore=xyStore('xy-home-v2')（p2-features.js:3281，注释即「番茄钟
    // 数据全局共享……所有桌面读写同一份」）、memo-app.js:4-9（「数据全局共享……键在 xy-home-v2 根
    // 命名空间」）、applock.js:32-36 与 card-lock.js:26-47（applock-* / cardlock-state 都在根命名
    // 空间）。旧登记 desk 只在当前桌面恰好是 default 时才认顶层键 ⇒ 第二个联系人桌面上番茄钟／备忘
    // 录／二级密码锁三行全报「本桌面暂无数据」，导出与清空都碰不到它们（而页面自己照常读写同一份）。
    
    { id: 'checkin', name: '打卡与查岗记录', group: '桌面功能', scope: 'desk', page: 'page-checkin',
      desc: '打卡记录与历史、查岗卡片状态、连续天数',
      // #1325b 审计：ck-question.js:222/304/354 的 ckq-last-id / ckq-last-at（今天已经问过哪一条）与
      // p2-features.js:8253/9407/9441 的裸键 checkin（摸鱼打卡日）都不落在 /^ck-/ 上（差一个字母 q）
      // ⇒ 换机当天会被当成「没问过／没打过卡」重复问一遍。
      res: [/^checkin-/, /^ck-/, /^ck-off-/, /^ckq-/, /^checkin$/] },
    { id: 'loc', name: '定位', group: '桌面功能', scope: 'desk', page: 'page-loc-cards',
      desc: '定位历史、气泡与特效开关、自动定位、定位组合',
      res: [/^loc-/, /^loc-auto/, /^loc-sense/] },
    
    
    // #1346 审计（desk→both）：`myarc-shared`（共享给 TA 的那份，my-arc.js:24 `gStore()=xyStore(GNS)`＋:182-218）
    // 与当前档案指针 `myarc-cur`（:234/:848 同一个 gStore）都在根命名空间，档案本体 `myarc` 才随桌面 ⇒ 旧 desk
    // 在联系人桌面上只导得出一份空壳档案，共享内容与「现在看的是哪一份」都丢。
    
    
    
    
    
    
    { id: 'gift', name: '礼物与集市', group: '桌面功能', scope: 'both', page: 'page-market',
      desc: '礼物盒、集市商品与自定义、钱包与心愿单、每日购买额度',
      res: [/^gift-/, /^market-/, /^giftbox-items$/, /^ml2_/, /^rp-wallet$/, /^wl-/, /^gift-wishlist/] },
    { id: 'decision', name: '抉择', group: '桌面功能', scope: 'global',
      desc: '抉择历史与设置（全局，所有桌面共用）',
      res: [/^decision-/, /^dec-/] },
    { id: 'gdec', name: '群抉择', group: '桌面功能', scope: 'global',
      desc: '群抉择历史、成员与设置（全局，所有桌面共用）',
      res: [/^gdec-/] },
    { id: 'mood', name: '心情日记', group: '桌面功能', scope: 'desk', page: 'page-mood',
      desc: '心情日记条目、记录与自定义表情',
      res: [/^mood-diary(?:-custom)?$/] },
    // #1346 审计（desk→both）：游戏音效偏好按设计是全局一份——auction.js:165/1040 直接读写
    // `localStorage['xy-home-v2:au-sound']`，注释写明「音效偏好全局记忆（非联系人维度）」⇒ 旧 desk
    // 在联系人桌面上清不掉也导不出它（换机后每个新桌面都回到默认开）。
    { id: 'games', name: '小游戏', group: '桌面功能', scope: 'both',
      desc: '各小游戏的音效/动画开关与进行中的局面标记',
      res: [/^snake-/, /^snk-/, /^brick-/, /^c4-/, /^ms-(?!g-)/, /^m3-/, /^lk-/, /^gk-/, /^au-/, /^pong-/, /^game-/] },
    { id: 'desktop', name: '桌面布局与美化', group: '桌面与系统', scope: 'desk',
      desc: '桌面图标位置/顺序/大小、隐藏图标、壁纸与组件美化、主题色、美化方案',
      // #1325b 审计：标签栏/页签图标那一组美化（personalize.js:1851/1885/1941/2969 的 tabbar-bg-color、tabbar-bg-op、
      // tabbar-whole-op、tabbar-radius、tabbar-blur、tabbar-icon-size、tab-icon-<页>、tab-icon-opacity）与两处桌面图钉
      // （:6818/6822 的 divination-desk-pin、group-chat-desk-pin）从没登记 ⇒ 导出的「桌面美化」里没有标签栏样式。
      // ⚠️ 同批把 /^bg-keep/ 从本行搬去 sys：那是 bg-keep.js 的**后台保活**开关（pwa.js:94 与 bg-keep.js:1557 读写），
      // 挂在「桌面布局与美化」名下会让清空美化顺手关掉保活——搬走才是它该待的那一行。
      res: [/^desk-/, /^hidden-icons/, /^page-bg-/, /^card-bg-/, /^ico-/, /^phone-bg/, /^widget-/, /^app-icon/, /^app-name-color$/, /^beauty-/, /^full-beauty-/, /^decor-/, /^home-/, /^p2apps-order/, /^p2icons-/, /^rel-/, /^mem-extras$/, /^no-statusbar$/, /^bg-blur$/, /^bg-mask-op$/, /^loading-/, /^tabbar-/, /^tab-icon-/, /-desk-pin$/] },
    { id: 'lock', name: '二级密码锁', group: '桌面与系统', scope: 'both',  // desk→both：见 pomo 上方 #1325 批注
      desc: '应用锁密码、密保问答、锁定开关与字卡锁状态',
      res: [/^applock/, /^cardlock/] },
    { id: 'call', name: '通话', group: '桌面与系统', scope: 'both',
      desc: '通话背景与来电弹窗背景、通话小框位置与开关、通话中/挂起现场（记录本身在「纪念与统计」里）',
      // #1325b 审计：call.js 这一族旧表**整行缺失**——小框位置/开关走 activeStore（:385/390 call-mini-pos、
      // :275 CALL_MINI_KEY、:447 起的 call-bg / :148 call-half-bg 通话背景），而通话中与挂起现场
      // call-active / call-hold 是 xyStore(G) 顶层键（:447 那个常量就是全名）⇒ 两个锚点都有，按 both 登记。
      // 注意别把 /^records-call/ 写进来：records-call-last 由「纪念与统计」的 /^records-(?!coin)/ 先一步认领（first match wins）。
      res: [/^call-mini-/, /^call-bg$/, /^call-half-bg$/, /^call-active$/, /^call-hold$/] },
    { id: 'sys', name: '音效与系统设置', group: '桌面与系统', scope: 'both', page: 'page-sfx-settings',
      desc: '音效总开关与统一模式、开屏公告已读、引导完成标记、数据备份提醒时间',
      // #1325b 审计：这一行原本四条正则**形同空转**——真键名是 __onboard-done / __guide-done / __last-backup /
      // __last-export-ts（onboarding.js:13、pwa.js:416/672、data-backup.js:16），带 __ 前缀，旧写法一条都不认。
      // 那几条是「备份提醒／引导」的产品记账（AGENTS.md 明令保护备份提醒），本批刻意不登记进任何功能的清空范围，
      // 只把 audit() 的口径改成「__ 开头＝机器记账」，让它不再冒充「没人管的用户数据」。
      // 真正该有人管而一直没人管的三格补上：深浅色 theme-mode / 强调色 accent-color（personalize.js:4910 注释
      // 「全局设置，不按联系人隔离」的顶层键）、后台保活与通知 bg-keepalive / bg-notify（bg-keep.js:1150/1557 走
      // gSet 顶层；从「桌面布局与美化」那行搬来）、版本更新提示开关 ver-update-notify（pwa.js:193）。
      res: [/^sfx-/, /^notice-/, /^onboarding/, /^guide-/, /^splash-/, /^backup-/, /^last-export$/, /^install-/, /^theme-mode$/, /^accent-color$/, /^bg-keep/, /^bg-notify/, /^ver-update-notify$/] }
  ];

  // ================= #679 各功能页内数据卡的挂点 =================
  // 值＝该功能页里的**滚动内容容器**（卡 append 进容器末尾：随内容滚动、位于页面最下方，
  // 不占固定高度容器的位置、不挤压原有布局）。只用各功能 template/JS 已有的静态 class/id，
  // 不改任何归属文件。找不到挂点的功能页放弃注入（绝不动原页面结构），见 FD_SKIP。
  // ⚠️ 有的容器会被所属模块整块 innerHTML 重写（实测：#myarc-root ← my-arc.js、#gc-body ←、
  // #fav-list ← 等），所以注入后必须挂 childList 观察者把卡补回，见 watchBarHost。
  var FD_MOUNTS = {
    calendar: '.cal-scroll',
    records: '.cal-scroll',
    interact: '.cal-scroll',
    divination: '.div-scroll',
    music: '.sm-scroll, .cal-scroll',
    tongpin: '.tp-body',
    shenshou: '.ss-body',
    water: '.water-body',
    eat: '.eat-body',
    piggy: '.piggy-body',
    pomo: '.pomo-body',
    checkin: '.cal-scroll',
    loc: '.gs-scroll',
    garden: '.garden-scroll',
    cjian: '#cj-main',
    myarc: '.narc-scroll',
    drift: '.drift-scroll',
    memo: '.memo-body',
    period: '.period-scroll',
    accounting: '.acc-scroll',
    gift: '.market-body',
    mood: '.cal-scroll',
    fav: '#fav-list',
    ask: '.gs-scroll',
    sys: '.gs-scroll'
  };
  // 刻意不注入的功能页：
  //   · 房间页 #page-room 是 overflow:hidden 的固定全屏场景（场景/clamp 高度/底部按钮条各占
  //     一份），塞任何卡片都会挤压小屋内景；要加得先重排房间布局。
  //   · 群聊页 #page-group-chat 的主体 #gc-body 就是**消息列表**，卡会混进消息流里、且每次渲染
  //     都被重建，既难看也可能干扰贴底逻辑；群聊数据改走集中页（设置 → 工具 → 各功能数据管理）。
  var FD_SKIP = { room: 1, gc: 1 };

  window.mochiFeatureDataCatalog = Object.freeze({
    features: Object.freeze(FEATURES), mounts: Object.freeze(FD_MOUNTS), skip: Object.freeze(FD_SKIP)
  });
})();
