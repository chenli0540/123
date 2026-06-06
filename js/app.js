/**
 * 剧本工坊 - 小说转剧本 YAML 工具
 * Bilibili 风格 · AI 驱动
 */
const ScreenplayStudio = (() => {
    'use strict';

    // ===== 状态管理 =====
    const state = {
        novelText: '',
        screenplay: [],
        characters: [],
        isProcessing: false,
        apiKey: localStorage.getItem('bili_api_key') || '',
        apiEndpoint: localStorage.getItem('bili_api_endpoint') || 'https://api.openai.com/v1/chat/completions',
        apiModel: localStorage.getItem('bili_api_model') || 'gpt-4o-mini',
        useAI: false,
        rawYaml: '',
        isEdited: false,
        showSeparators: true,

        // 文库
        novelLibrary: JSON.parse(localStorage.getItem('novel_library') || '[]'),
        currentNovelId: localStorage.getItem('current_novel_id') || null,
        currentChapterId: localStorage.getItem('current_chapter_id') || null,

        // 设置
        compareFontSize: parseInt(localStorage.getItem('bili_font_size') || '15'),
        compareFontFamily: localStorage.getItem('bili_font_family') || '',
        themeColor: localStorage.getItem('bili_theme_color') || 'default',
        autoSplitActs: localStorage.getItem('bili_auto_split') === 'true',

        // 分章设置
        chapterSplitMode: localStorage.getItem('chapter_split_mode') || 'marker',
        chapterMarkerPattern: localStorage.getItem('chapter_marker_pattern') || '第\\d+[章回节]',
        chapterSize: parseInt(localStorage.getItem('chapter_size') || '8000'),

        // AI 提示词设置
        aiSystemPrompt: localStorage.getItem('bili_ai_system_prompt') || '你是一个专业的剧本编剧助手，擅长将小说转化为剧本格式。只输出YAML，不要任何额外文字。',
        aiUserPrompt: localStorage.getItem('bili_ai_user_prompt') || `你是一位专业的剧本编剧。请将以下小说文本转化为专业的剧本格式（YAML格式），包含场次划分、场景描述、角色对话（标注情绪）、动作描述。

要求：
1. 根据时间、地点变化合理划分场次
2. 提取所有出现的人物角色
3. 对话要标注说话人和情绪状态
4. 包含场景描述和环境描写
5. 动作描写单独标注

输出格式必须是纯 YAML，格式如下：
\`\`\`yaml
- 场次: 1
  场景: "场景标题"
  地点: "地点"
  时间: "时间"
  内容:
    - 类型: 描述
      内容: "描述文字"
    - 类型: 对话
      角色: "角色名"
      台词: "对话内容"
      情绪: "情绪"
    - 类型: 动作
      内容: "动作描述"
\`\`\`

注意：
- 不要输出任何解释性文字，只输出 YAML
- YAML 必须格式正确，可以解析
- 合理划分场次，每场要有明确的场景、地点、时间
- 对话内容要完整保留原文

以下是需要转换的小说文本：

---
{inputText}
---`,
    };

    // ===== DOM 引用 =====
    let els = {};

    // ===== 样例数据 =====
    const SAMPLES = {
        wuxia: `夕阳西下，断肠人在天涯。

慕容雪站在悬崖边上，长发被狂风吹得飞舞。她的眼神冷得像冰，手中长剑在落日余晖中泛着寒光。

"你终于来了。"她头也不回，声音清冷。

身后传来脚步声，沉重而缓慢。一个黑衣男子从树林中走出，脸上带着玩世不恭的笑。

"雪儿，三年不见，你还是这么冷淡。"男子停在她身后三步远的地方，双手抱胸。

慕容雪缓缓转身，剑尖直指他的咽喉："陆沉舟，你背叛师门，杀害师父，今天我要为师门清理门户。"

陆沉舟的笑容僵在脸上，眼中闪过一丝痛楚："师父不是我杀的。"

"证据确凿，你还想抵赖？"慕容雪的声音微微发抖。

"那枚令牌是有人陷害我。"陆沉舟深吸一口气，"给我三天时间，我一定找出真凶。"

"三天？"慕容雪冷笑，"你当我还会相信你吗？"

就在这时，树林中突然传来一阵急促的弓弦声。数十支箭矢如雨般射向二人。陆沉舟一个箭步冲上前，将慕容雪扑倒在地，滚向一旁的巨石后面。

"有埋伏！"陆沉舟低声道。

慕容雪被他压在身下，脸上的冰冷终于有了一丝裂痕。她推开陆沉舟，语气复杂："你……为什么要救我？"

"因为我说过，我会保护你一辈子。"陆沉舟看着她，眼中是前所未有的认真。`,

        romance: `夏天的风带着海盐的味道。

林初夏推开了咖啡馆的玻璃门，门口的铃铛发出清脆的声响。她环顾四周，最终视线落在了靠窗座位上的那个男人身上。

三年前的不告而别，如今他就这样若无其事地坐在那里，甚至还对着她笑。

"好久不见，初夏。"顾言深站起来，替她拉开椅子。

林初夏没有坐下，她紧紧攥着手提包的带子，声音有些哽咽："你凭什么觉得，我会来见你？"

顾言深沉默了片刻，眼神暗了暗："因为我欠你一个解释。"

"解释？"林初夏笑了，但笑容里满是苦涩，"你消失整整三年，现在回来就为了给我一个解释？"

"我得了脑瘤。"顾言深平静地说，"当时医生说只有三成的把握。我不想……让你看着我死。"

林初夏愣住了，所有的愤怒和委屈在这一刻轰然崩塌。她张了张嘴，却发不出任何声音。

"手术成功了，但恢复用了两年。"顾言深从口袋里掏出一枚戒指，单膝跪下，"所以我想问，你愿意嫁给一个曾经消失过的人吗？"

咖啡馆里所有人都看了过来。林初夏的眼眶红了，她捂着嘴，眼泪止不住地往下掉。`,

        scifi: `"警报！能源核心温度超出阈值！"

整个指挥舱被红光笼罩，刺耳的警报声此起彼伏。

指挥官陈锋猛地从座椅上站起来，目光紧盯着全息屏幕上不断攀升的数字："启动备用冷却系统！"

"报告指挥官，备用系统在三小时前就已经损坏了！"技术员林小夕的声音带着慌乱。

"什么？为什么不报告？"陈锋狠狠一拳砸在控制台上。

"因为……"林小夕咬着嘴唇，"是您签署的维修延迟令，说优先保证推进系统的维护。"

陈锋愣住了。他确实签署过那个命令，但那是一周前的事，他没想到备用系统恰好在这时候出问题。

"那现在怎么办？"副指挥官周明皱眉问道。

林小夕快速操作着键盘，调出一份结构图："有一个办法。能源核心的过载保护可以通过人工手动重启，但需要有人进入核心舱。"

"核心舱的温度现在有八百度。"周明冷冷地说。

"所以不能用真人。"林小夕抬起头，看向陈锋，"指挥官，请求启动'女娲'AI的完全形态，让她进入核心舱。"

陈锋的脸色变得极为难看："不行！女娲是我们最后的底牌，而且她的意识一旦完全激活，可能会……"

"可能会拥有自我意识，我知道。"林小夕打断了他，"但现在不激活她，我们所有人都得死。"`
    };

    // ===== 转换引擎 =====
    const ConversionEngine = {

        detectScenes(text) {
            const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim());
            const scenes = [];
            let currentScene = null;

            const scenePatterns = [
                /(?:这时|此时|就在|突然|与此同时|另一方面|镜头|场景)/,
                /(?:第[一二三四五六七八九十\d]+[章回节幕]|Chapter|Scene\s*\d+)/i,
                /(?:清晨|黄昏|傍晚|深夜|午夜|黎明|破晓|入夜|夜幕降临|天亮了|天黑了|早晨|晚上)/,
                /(?:转眼间|片刻后|半小时后|一个时辰后|不知过了多久|第二天|次日|翌日|几天后|数月后)/,
                /(?:另一边|另一处|与此同时|另外一边|与此同时|而在)/,
            ];

            paragraphs.forEach((para, idx) => {
                const trimmed = para.trim();
                const isSceneStart = idx === 0 || scenePatterns.some(p => p.test(trimmed));

                if (isSceneStart && currentScene && currentScene.paragraphs.length > 0) {
                    scenes.push(currentScene);
                    currentScene = null;
                }

                if (!currentScene) {
                    currentScene = {
                        index: scenes.length + 1,
                        title: this.inferSceneTitle(trimmed),
                        location: this.inferLocation(trimmed),
                        time: this.inferTime(trimmed),
                        paragraphs: [],
                        raw: '',
                    };
                }

                currentScene.paragraphs.push(trimmed);
                currentScene.raw += (currentScene.raw ? '\n\n' : '') + trimmed;
            });

            if (currentScene && currentScene.paragraphs.length > 0) {
                scenes.push(currentScene);
            }

            return scenes.length > 0 ? scenes : [{
                index: 1,
                title: '单场景',
                location: '',
                time: '',
                paragraphs: [text],
                raw: text,
            }];
        },

        inferSceneTitle(text) {
            const lines = text.split('\n').filter(l => l.trim());
            const firstLine = lines[0] || '';
            if (firstLine.length < 30 && !firstLine.includes('"') && !firstLine.includes('「')) {
                return firstLine.replace(/[「」""。，！？、：；]/g, '').trim() || '未命名场景';
            }
            const timeMatch = text.match(/(清晨|黄昏|傍晚|深夜|午夜|黎明|破晓|入夜|白天|晚上|早晨|正午)/);
            const locMatch = text.match(/(?:在|来到|走进|踏入|抵达)(.+?)(?:[的里中上内前旁边处，。\s])/);
            if (timeMatch || locMatch) {
                return `${timeMatch ? timeMatch[1] : ''}${locMatch ? ' · ' + locMatch[1] : ''}`.trim() || '未命名场景';
            }
            return '未命名场景';
        },

        inferLocation(text) {
            const patterns = [
                /(?:在|来到|走进|踏入|抵达)([^，。\s]{2,12})(?:里|中|上|内|前|旁|边|处|的|，|。|\s)/,
                /([^，。\s]{2,8})(?:大厅|房间|宫殿|小屋|别墅|大楼|广场|街道|巷子|山顶|悬崖|海边|河边|湖边|森林|树林|草地|花园|庭院|天台|地下室|走廊|门口)/,
                /(咖啡馆|餐厅|酒吧|酒店|医院|学校|教室|办公室|公园|车站|机场|庙宇|道观|城堡|塔楼|山洞|洞穴|宫殿|庭院)/,
            ];
            for (const p of patterns) {
                const m = text.match(p);
                if (m) {
                    let loc = m[1] || m[0];
                    loc = loc.replace(/^(?:在|来到|走进|踏入|抵达)/, '').trim();
                    if (loc.length < 15) return loc;
                }
            }
            return '';
        },

        inferTime(text) {
            const patterns = [
                /(清晨|黄昏|傍晚|深夜|午夜|黎明|破晓|入夜|白天|晚上|早晨|正午|晌午|午后|凌晨)/,
                /(?:太阳|夕阳|落日|日出|阳光|月光|星光|朝霞|晚霞|余晖|烈日)/,
                /(\d{1,2}[：:]\d{2})/,
                /(?:春天|夏天|秋天|冬天|春季|夏季|秋季|冬季)/,
            ];
            for (const p of patterns) {
                const m = text.match(p);
                if (m) return m[1] || m[0];
            }
            return '';
        },

        extractDialogues(text) {
            const dialogues = [];
            const seen = new Set();

            // 模式1: "对话" 某人说
            const pattern1 = /"([^"]{2,80})"(?:[，。！？；,\s]*)([^，。！？\s]{2,6})(?:说|道|问|答|喊|叫|骂|笑|叹|哼|低声道|轻声道|大声道|喃喃道|解释道|补充道|强调道|提醒道|警告道|重复道|继续说道|接着说|冷冷地说|平静地说|激动地说|颤抖着说|哭着说|笑着说|喝道|喊道|叫道|问道|答道|叹道|笑道|骂道)/g;
            let m;
            while ((m = pattern1.exec(text)) !== null) {
                const key = m[1].substring(0, 15);
                if (!seen.has(key)) {
                    seen.add(key);
                    const speaker = m[2].replace(/[「」"",，。！？、\s]/g, '').trim();
                    if (speaker && speaker.length < 8) {
                        dialogues.push({
                            text: m[1].trim(),
                            speaker: speaker,
                            index: m.index,
                            emotion: this.inferEmotion(m[0], m[1]),
                        });
                    }
                }
            }

            // 模式2: 某人说："对话"
            const pattern2 = /([^，。！？\s]{2,6})(?:说|道|问|答|喊|叫|骂|笑|叹|哼|低声道|轻声道|大声道|喃喃道|解释道|补充道|强调道|提醒道|警告道|重复道|继续说道|接着说|冷冷地说|平静地说|激动地说|颤抖着说|哭着说|笑着说|喝道|喊道|叫道|问道|答道|叹道|笑道|骂道)[：:，,]\s*"([^"]{2,80})"/g;
            while ((m = pattern2.exec(text)) !== null) {
                const key = m[2].substring(0, 15);
                if (!seen.has(key)) {
                    seen.add(key);
                    const speaker = m[1].replace(/[「」"",，。！？、\s]/g, '').trim();
                    if (speaker && speaker.length < 8) {
                        dialogues.push({
                            text: m[2].trim(),
                            speaker: speaker,
                            index: m.index,
                            emotion: this.inferEmotion(m[0], m[2]),
                        });
                    }
                }
            }

            // 模式3: 「对话」
            const jpPattern = /「([^」]{2,80})」/g;
            while ((m = jpPattern.exec(text)) !== null) {
                const key = 'jp_' + m[1].substring(0, 15);
                if (!seen.has(key)) {
                    seen.add(key);
                    const context = text.substring(Math.max(0, m.index - 40), m.index);
                    const speaker = this.extractSpeaker(context);
                    dialogues.push({
                        text: m[1].trim(),
                        speaker: speaker,
                        index: m.index,
                        emotion: this.inferEmotion(context, m[1]),
                    });
                }
            }

            // 模式4: 独立的双引号对话（无明确说话人，作为兜底）
            if (dialogues.length === 0) {
                const fallback = /"([^"]{4,80})"/g;
                while ((m = fallback.exec(text)) !== null) {
                    const key = 'fb_' + m[1].substring(0, 15);
                    if (!seen.has(key)) {
                        seen.add(key);
                        const context = text.substring(Math.max(0, m.index - 30), m.index);
                        dialogues.push({
                            text: m[1].trim(),
                            speaker: this.extractSpeaker(context),
                            index: m.index,
                            emotion: this.inferEmotion(context, m[1]),
                        });
                    }
                }
            }

            return dialogues;
        },

        extractSpeaker(context) {
            const patterns = [
                /(?:只听见|只听|却听|就听)([^，。！？\s]{2,6})(?:说|道|问|答|喊|叫)/,
                /([^，。！？\s]{2,6})(?:说|道|问|答|喊|叫|骂|笑|叹|哼|喝道|喊道|叫道|问道|答道|叹道|笑道)/,
            ];
            for (const p of patterns) {
                const m = context.match(p);
                if (m) {
                    let speaker = m[1].replace(/[：「」"",，。！？、\s]/g, '').trim();
                    const filterWords = ['突然', '这时', '此时', '然后', '接着', '只听', '只听见', '就听'];
                    for (const fw of filterWords) {
                        speaker = speaker.replace(fw, '');
                    }
                    if (speaker && speaker.length < 6) return speaker;
                }
            }
            return '未知';
        },

        inferEmotion(context, dialogue) {
            const emotionMap = {
                '愤怒': ['怒', '愤', '咬牙切齿', '火冒三丈', '暴跳如雷', '冷冷地', '冷淡', '冰冷', '冷声'],
                '悲伤': ['悲', '哭', '泪', '哽咽', '颤', '凄凉', '哀', '伤心', '难过', '泣'],
                '喜悦': ['笑', '喜', '乐', '微笑', '愉快', '开心', '高兴', '欢呼', '欢'],
                '惊讶': ['惊', '震', '呆', '愣', '瞪', '愕', '意外', '难以置信', '吃惊'],
                '忧虑': ['忧', '愁', '叹', '皱眉', '担心', '不安', '忐忑', '焦虑'],
                '急切': ['急', '慌', '连忙', '赶紧', '匆匆', '慌乱', '慌张', '匆忙'],
                '温柔': ['温柔', '轻柔', '轻声道', '轻声', '柔和', '低语', '柔声'],
                '平静': ['平静', '淡定', '冷静', '沉稳', '从容', '淡然', '镇定'],
            };

            const text = context + ' ' + dialogue;
            const scores = {};
            for (const [emotion, keywords] of Object.entries(emotionMap)) {
                scores[emotion] = keywords.filter(k => text.includes(k)).length;
            }

            const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
            return best && best[1] > 0 ? best[0] : '普通';
        },

        extractCharacters(text, knownDialogues) {
            const charMap = new Map();

            // 从对话中提取
            for (const d of knownDialogues) {
                if (d.speaker && d.speaker !== '未知') {
                    if (!charMap.has(d.speaker)) {
                        charMap.set(d.speaker, { name: d.speaker, dialogueCount: 0, type: '角色' });
                    }
                    charMap.get(d.speaker).dialogueCount++;
                }
            }

            // 从场景文本中寻找人名
            const namePatterns = [
                /([一-鿿]{2,4})(?:说|道|问|答|喊|叫|骂|笑|叹|哼|走了过来|走去|站在|坐下|站起身来|转过身|抬起头|低下头|看着|望着|盯着|看向|对着|朝着|向着|抱拳|拱手)/g,
                /(?:只见|但见|却见|看到|看见|却看)([一-鿿]{2,4})/g,
            ];

            for (const pattern of namePatterns) {
                let m;
                while ((m = pattern.exec(text)) !== null) {
                    const name = m[1].trim();
                    if (name.length >= 2 && name.length <= 4 &&
                        !/^[的我了是在有这和不就都一个很上]。，！？、：；]/.test(name[0]) &&
                        !charMap.has(name)) {
                        charMap.set(name, { name, dialogueCount: 0, type: '角色' });
                    }
                }
            }

            return Array.from(charMap.values())
                .sort((a, b) => b.dialogueCount - a.dialogueCount)
                .map((c, i) => ({
                    ...c,
                    type: i === 0 ? '主角' : i < 3 ? '主要角色' : '配角',
                }));
        },

        convert(text) {
            if (!text || !text.trim()) return [];

            const scenes = this.detectScenes(text);
            const allDialogues = [];
            for (const scene of scenes) {
                const dialogues = this.extractDialogues(scene.raw);
                allDialogues.push(...dialogues);
            }

            const characters = this.extractCharacters(text, allDialogues);

            const screenplay = scenes.map((scene, idx) => {
                const blocks = this.sceneToYamlBlocks(scene, allDialogues, characters);
                return {
                    id: `scene-${idx + 1}`,
                    场次: scene.index,
                    场景: scene.title,
                    地点: scene.location || '未知',
                    时间: scene.time || '未知',
                    内容: blocks,
                };
            });

            // 保存角色状态
            this._lastCharacters = characters;

            return screenplay;
        },

        sceneToYamlBlocks(scene, allDialogues, characters) {
            const blocks = [];
            const usedDialogues = new Set();
            const lines = scene.raw.split('\n').filter(l => l.trim());

            // 找到本场景相关的对话
            const sceneDialogues = allDialogues.filter(d =>
                scene.raw.includes(d.text.substring(0, Math.min(12, d.text.length)))
            );

            for (let li = 0; li < lines.length; li++) {
                const trimmed = lines[li].trim();
                if (!trimmed) continue;

                // 检查是否是对话行
                let matchedDialogue = null;
                for (const d of sceneDialogues) {
                    const key = d.text.substring(0, Math.min(12, d.text.length));
                    if (trimmed.includes(key) && !usedDialogues.has(key)) {
                        matchedDialogue = d;
                        usedDialogues.add(key);
                        break;
                    }
                }

                if (matchedDialogue) {
                    blocks.push({
                        type: '对话',
                        character: matchedDialogue.speaker,
                        content: matchedDialogue.text,
                        emotion: matchedDialogue.emotion,
                    });
                    continue;
                }

                // 判断是否为动作
                const actionVerbs = ['走', '跑', '跳', '站', '坐', '躺', '看', '望', '听', '拿', '放', '推',
                    '拉', '打', '踢', '抽', '拔', '握', '举', '抬', '低', '转', '笑', '哭', '叹',
                    '点', '摇', '挥', '冲', '退', '追', '蹲', '跪', '趴', '躲', '闪', '扑', '抱',
                    '拍', '抓', '扔', '抛', '敲', '关', '开', '翻', '掏', '摸', '扶', '揽', '搂'
                ];
                const hasAction = actionVerbs.some(v => trimmed.includes(v));
                const isShort = trimmed.replace(/\s/g, '').length < 60;
                const noQuote = !trimmed.includes('"') && !trimmed.includes('「');

                if (hasAction && isShort && noQuote) {
                    blocks.push({ type: '动作', content: trimmed });
                    continue;
                }

                blocks.push({ type: '描述', content: trimmed });
            }

            return blocks;
        },

        toYaml(screenplay, showSeparators = true) {
            if (!screenplay || screenplay.length === 0) return '# 暂无剧本数据\n';

            let yaml = '# 剧本文件\n';
            yaml += `# 生成时间: ${new Date().toLocaleString('zh-CN')}\n`;
            yaml += `# 总场次: ${screenplay.length}\n\n`;

            screenplay.forEach((scene, idx) => {
                if (showSeparators && idx > 0) {
                    yaml += `# ──────────────────────────────\n`;
                }
                yaml += `- 场次: ${scene.场次}\n`;
                yaml += `  场景: "${scene.场景}"\n`;
                yaml += `  地点: "${scene.地点}"\n`;
                yaml += `  时间: "${scene.时间}"\n`;
                yaml += `  内容:\n`;

                if (scene.内容 && scene.内容.length > 0) {
                    let prevType = '';
                    let prevChar = '';
                    scene.内容.forEach((block, bi) => {
                        // 分隔线：角色/类型变化时插入
                        const curType = block.type || '';
                        const curChar = block.character || '';
                        if (showSeparators && bi > 0 && (curType !== prevType || (curType === '对话' && curChar !== prevChar))) {
                            yaml += `    # ----\n`;
                        }
                        prevType = curType;
                        prevChar = curChar;

                        const content = (block.content || '').replace(/"/g, '\\"');
                        if (block.type === '对话') {
                            yaml += `    - 类型: 对话\n`;
                            yaml += `      角色: "${block.character || '未知'}"\n`;
                            yaml += `      台词: "${content}"\n`;
                            yaml += `      情绪: ${block.emotion || '普通'}\n`;
                        } else if (block.type === '动作') {
                            yaml += `    - 类型: 动作\n`;
                            yaml += `      内容: "${content}"\n`;
                        } else {
                            yaml += `    - 类型: 描述\n`;
                            yaml += `      内容: "${content}"\n`;
                        }
                    });
                } else {
                    yaml += `    - 类型: 描述\n      内容: ""\n`;
                }

                if (idx < screenplay.length - 1) yaml += '\n';
            });

            return yaml;
        },

        fromYaml(yaml) {
            const scenes = [];
            let currentScene = null;
            let currentBlock = null;

            const lines = yaml.split('\n');
            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.startsWith('#') || trimmed === '') continue;

                if (trimmed.startsWith('- 场次:')) {
                    if (currentScene) {
                        if (currentBlock) { currentScene.内容.push(currentBlock);
                            currentBlock = null; }
                        scenes.push(currentScene);
                    }
                    currentScene = { 场次: parseInt(trimmed.split(':')[1]) || 1, 场景: '', 地点: '', 时间: '', 内容: [] };
                    currentBlock = null;
                } else if (currentScene) {
                    if (trimmed.startsWith('场景:')) {
                        currentScene.场景 = trimmed.replace('场景:', '').trim().replace(/^"|"$/g, '');
                    } else if (trimmed.startsWith('地点:')) {
                        currentScene.地点 = trimmed.replace('地点:', '').trim().replace(/^"|"$/g, '');
                    } else if (trimmed.startsWith('时间:')) {
                        currentScene.时间 = trimmed.replace('时间:', '').trim().replace(/^"|"$/g, '');
                    } else if (trimmed.startsWith('- 类型:')) {
                        if (currentBlock && currentScene) currentScene.内容.push(currentBlock);
                        currentBlock = { type: trimmed.split(':')[1].trim() };
                    } else if (currentBlock) {
                        if (trimmed.startsWith('角色:')) {
                            currentBlock.character = trimmed.replace('角色:', '').trim().replace(/^"|"$/g, '');
                        } else if (trimmed.startsWith('台词:')) {
                            currentBlock.content = trimmed.replace('台词:', '').trim().replace(/^"|"$/g, '').replace(/\\"/g, '"');
                        } else if (trimmed.startsWith('情绪:')) {
                            currentBlock.emotion = trimmed.replace('情绪:', '').trim();
                        } else if (trimmed.startsWith('内容:')) {
                            currentBlock.content = trimmed.replace('内容:', '').trim().replace(/^"|"$/g, '').replace(/\\"/g, '"');
                        }
                    }
                }
            }

            if (currentBlock && currentScene) currentScene.内容.push(currentBlock);
            if (currentScene) scenes.push(currentScene);

            return scenes;
        },

        async convertWithAI(text, apiKey, endpoint, model) {
            // 文本长度检查 — 优先在真实章节边界截断，其次段落边界
            const MAX_CHARS = 8000;
            let inputText = text;
            let truncated = false;
            if (text.length > MAX_CHARS) {
                truncated = true;
                const sliceTarget = text.substring(0, MAX_CHARS);

                // 1) 找真实章节标记作为截断点
                const chapters = this._detectRealChapters(sliceTarget);
                const validBreaks = chapters.filter(c => c.index > MAX_CHARS * 0.3 && c.index < MAX_CHARS);
                if (validBreaks.length > 0) {
                    const best = validBreaks[validBreaks.length - 1];
                    inputText = text.substring(0, best.index).trim();
                } else {
                    // 2) 没找到章节标记，在段落边界截断
                    const paraBreak = sliceTarget.lastIndexOf('\n\n', MAX_CHARS);
                    if (paraBreak > MAX_CHARS * 0.5) {
                        inputText = text.substring(0, paraBreak).trim();
                    } else {
                        const lineBreak = sliceTarget.lastIndexOf('\n', MAX_CHARS);
                        inputText = lineBreak > MAX_CHARS * 0.3 ? text.substring(0, lineBreak).trim() : sliceTarget.trim();
                    }
                }
                console.warn(`文本超长（${text.length} 字符），截断至 ${inputText.length} 字符`);
            }

            const prompt = state.aiUserPrompt.replace('{inputText}', inputText);

            const requestBody = {
                model: model,
                messages: [
                    { role: 'system', content: state.aiSystemPrompt },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.3,
                max_tokens: 4096,
            };

            // 带重试的请求（最多 2 次）
            let lastError = null;
            for (let attempt = 1; attempt <= 2; attempt++) {
                try {
                    const response = await fetch(endpoint, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${apiKey}`,
                        },
                        body: JSON.stringify(requestBody),
                    });

                    if (!response.ok) {
                        const err = await response.text();
                        let detail = '';
                        try {
                            const errJson = JSON.parse(err);
                            detail = errJson.error?.message || errJson.message || '';
                        } catch (e) { detail = err.substring(0, 300); }

                        if (response.status === 429 && attempt === 1) {
                            // 限流，等待 2 秒后重试
                            lastError = new Error(`请求过多 (429)，正在重试...`);
                            await new Promise(r => setTimeout(r, 2000));
                            continue;
                        }
                        if (response.status === 401) {
                            throw new Error(`认证失败 (401)：API Key 无效或已过期。请检查 API Key 是否正确`);
                        }
                        if (response.status === 400) {
                            throw new Error(`请求错误 (400)：${detail}`);
                        }
                        throw new Error(`API 错误 (${response.status}): ${detail || err.substring(0, 300)}`);
                    }

                    const data = await response.json();

                    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                        throw new Error('API 返回格式异常，缺少 choices 字段');
                    }

                    const content = data.choices[0].message.content;
                    if (!content || content.trim().length === 0) {
                        throw new Error('API 返回了空内容，请重试');
                    }

                    const yamlMatch = content.match(/```ya?ml\n([\s\S]*?)```/) || content.match(/(^- 场次:[\s\S]*)/m);
                    const result = yamlMatch ? (yamlMatch[1] || yamlMatch[0]).trim() : content.trim();

                    if (truncated) {
                        return result + `\n\n# ⚠️ 注意：原文共 ${text.length} 字符，`
                            + `已基于前 ${inputText.length} 字符生成（8000 字符分章）。如需完整转换，建议逐章处理。`;
                    }
                    return result;

                } catch (err) {
                    lastError = err;
                    if (attempt === 2 || !err.message.includes('429')) throw err;
                }
            }
            throw lastError || new Error('API 请求失败');
        },

        _lastCharacters: [],
        getLastCharacters() { return this._lastCharacters; },
    };

    // ===== UI 控制 =====
    const UI = {
        init() {
            els = {
                novelInput: document.getElementById('novelInput'),
                charCount: document.getElementById('charCount'),
                paraCount: document.getElementById('paraCount'),
                sceneCount: document.getElementById('sceneCount'),
                convertBtn: document.getElementById('convertBtn'),
                clearBtn: document.getElementById('clearBtn'),
                exportBtn: document.getElementById('exportBtn'),
                copyBtn: document.getElementById('copyBtn'),
                yamlOutput: document.getElementById('yamlOutput'),
                outputStats: document.getElementById('outputStats'),
                scenePreview: document.getElementById('scenePreview'),
                charactersSection: document.getElementById('charactersSection'),
                characterTags: document.getElementById('characterTags'),
                loadingOverlay: document.getElementById('loadingOverlay'),
                loadingText: document.getElementById('loadingText'),
                toastContainer: document.getElementById('toastContainer'),
                sampleBtns: document.querySelectorAll('.sample-btn'),
                aiToggle: document.getElementById('aiToggle'),
                aiSettingsPanel: document.getElementById('aiSettingsPanel'),
                apiKeyInput: document.getElementById('apiKeyInput'),
                apiEndpointInput: document.getElementById('apiEndpointInput'),
                apiModelInput: document.getElementById('apiModelInput'),
                testApiBtn: document.getElementById('testApiBtn'),
                closeApiSettingsBtn: document.getElementById('closeApiSettingsBtn'),
                formatOptions: document.querySelectorAll('.format-option'),
                emptyState: document.getElementById('emptyState'),
                currentFormat: 'yaml',
            };

            this.bindEvents();
            this.updateInputStats();
            this.loadAPISettings();
        },

        bindEvents() {
            els.novelInput.addEventListener('input', () => {
                this.updateInputStats();
                state.novelText = els.novelInput.value;
            });

            els.convertBtn.addEventListener('click', () => this.handleConvert());

            els.novelInput.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.key === 'Enter') {
                    e.preventDefault();
                    this.handleConvert();
                }
            });

            els.clearBtn.addEventListener('click', () => {
                if (els.novelInput.value && !confirm('确定要清空输入内容吗？')) return;
                els.novelInput.value = '';
                state.novelText = '';
                state.screenplay = [];
                els.yamlOutput.value = '';
                els.outputStats.style.display = 'none';
                els.scenePreview.innerHTML = '';
                els.charactersSection.style.display = 'none';
                els.emptyState.style.display = 'flex';
                this.updateInputStats();
                this.showToast('已清空所有内容', 'info');
            });

            els.exportBtn.addEventListener('click', () => this.handleExport());
            els.copyBtn.addEventListener('click', () => this.handleCopy());

            els.yamlOutput.addEventListener('input', () => {
                state.isEdited = true;
                state.rawYaml = els.yamlOutput.value;
                if (els.emptyState) {
                    els.emptyState.style.display = els.yamlOutput.value.trim() ? 'none' : 'flex';
                }
            });

            // 样例按钮
            els.sampleBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    const sample = btn.dataset.sample;
                    if (SAMPLES[sample]) {
                        els.novelInput.value = SAMPLES[sample];
                        state.novelText = SAMPLES[sample];
                        this.updateInputStats();
                        this.showToast('✅ 已加载「' + btn.textContent.trim() + '」样例', 'success');
                    }
                });
            });

            // AI 切换
            els.aiToggle.addEventListener('change', () => {
                state.useAI = els.aiToggle.checked;
                if (state.useAI) {
                    els.convertBtn.innerHTML = '🤖 AI 智能转换';
                    els.convertBtn.className = 'btn btn-purple btn-lg';
                } else {
                    els.convertBtn.innerHTML = '✨ 开始转换';
                    els.convertBtn.className = 'btn btn-pink btn-lg';
                }
            });

            // API 设置（实时保存）
            els.apiKeyInput.addEventListener('input', () => {
                this.saveAPISettings(true);
                this.updateAPIStatus();
            });
            els.apiEndpointInput.addEventListener('input', () => this.saveAPISettings(true));
            els.apiModelInput.addEventListener('input', () => this.saveAPISettings(true));

            // 测试连接
            els.testApiBtn?.addEventListener('click', () => this.testAPIConnection());

            // 关闭 API 设置面板
            els.closeApiSettingsBtn?.addEventListener('click', () => {
                els.aiSettingsPanel.classList.remove('active');
            });

            // API 快捷预设
            document.querySelectorAll('.preset-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const preset = btn.dataset.preset;
                    const presets = {
                        deepseek: {
                            endpoint: 'https://api.deepseek.com/chat/completions',
                            model: 'deepseek-chat',
                        },
                        openai: {
                            endpoint: 'https://api.openai.com/v1/chat/completions',
                            model: 'gpt-4o-mini',
                        },
                        qwen: {
                            endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
                            model: 'qwen-turbo',
                        },
                    };
                    const cfg = presets[preset];
                    if (cfg) {
                        els.apiEndpointInput.value = cfg.endpoint;
                        els.apiModelInput.value = cfg.model;
                        this.saveAPISettings(true);
                        this.updateAPIStatus();
                        const names = { deepseek: 'DeepSeek', openai: 'OpenAI', qwen: '通义千问' };
                        this.showToast(`✅ 已切换至 ${names[preset] || preset} 配置`, 'success');
                    }
                });
            });

            // 格式选择
            els.formatOptions.forEach(opt => {
                opt.addEventListener('click', () => {
                    els.formatOptions.forEach(o => o.classList.remove('active'));
                    opt.classList.add('active');
                    els.currentFormat = opt.dataset.format;
                });
            });

        },

        loadAPISettings() {
            if (els.apiKeyInput) els.apiKeyInput.value = state.apiKey;
            if (els.apiEndpointInput) els.apiEndpointInput.value = state.apiEndpoint;
            if (els.apiModelInput) els.apiModelInput.value = state.apiModel;
            this.updateAPIStatus();
        },

        updateAPIStatus() {
            const panel = els.aiSettingsPanel;
            if (!panel) return;
            let existing = panel.querySelector('.api-status-line');
            if (!existing) {
                existing = document.createElement('div');
                existing.className = 'api-status-line';
                existing.style.cssText = 'font-size:12px;margin-top:8px;padding:6px 10px;border-radius:6px;transition:all 0.3s;';
                panel.querySelector('p')?.before(existing);
            }
            const key = els.apiKeyInput.value.trim();
            if (key) {
                const masked = key.length > 8 ? key.substring(0, 4) + '…' + key.substring(key.length - 4) : '***';
                existing.style.background = '#e8f8e8';
                existing.style.color = '#27ae60';
                existing.innerHTML = `✅ API Key 已配置：${masked}　|　端点：${els.apiEndpointInput.value || '未设置'}`;
            } else {
                existing.style.background = '#fff3e0';
                existing.style.color = '#e67e22';
                existing.innerHTML = `⚠️ 未设置 API Key — 将使用<strong>本地智能引擎</strong>（免费，效果也不错）`;
            }
        },

        async testAPIConnection() {
            const key = els.apiKeyInput.value.trim();
            const endpoint = els.apiEndpointInput.value.trim();
            const model = els.apiModelInput.value.trim();

            if (!key) {
                this.showToast('⚠️ 请先输入 API Key 再测试', 'warning');
                els.apiKeyInput.focus();
                return;
            }
            if (!endpoint) {
                this.showToast('⚠️ 请填写 API 地址', 'warning');
                els.apiEndpointInput.focus();
                return;
            }

            const btn = els.testApiBtn;
            const originalText = btn.textContent;
            btn.textContent = '⏳ 测试中...';
            btn.disabled = true;

            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 15000); // 15秒超时

                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${key}`,
                    },
                    body: JSON.stringify({
                        model: model || 'deepseek-chat',
                        messages: [
                            { role: 'user', content: 'Hello! Reply with just: OK' }
                        ],
                        max_tokens: 10,
                    }),
                    signal: controller.signal,
                });

                clearTimeout(timeoutId);

                if (response.ok) {
                    const data = await response.json();
                    const modelUsed = data.model || model || '未知';
                    this.showToast(`✅ 连接成功！使用模型: ${modelUsed}`, 'success');
                    // 自动更新 model 字段为实际使用的模型
                    if (data.model && !els.apiModelInput.value.trim()) {
                        els.apiModelInput.value = data.model;
                        this.saveAPISettings(true);
                    }
                } else {
                    const err = await response.text();
                    let msg = `❌ 连接失败 (${response.status})`;
                    let detail = '';
                    try {
                        const errJson = JSON.parse(err);
                        detail = errJson.error?.message || errJson.message || JSON.stringify(errJson).substring(0, 300);
                    } catch (e) {
                        detail = err.substring(0, 300);
                    }
                    msg += `: ${detail}`;
                    this.showToast(msg, 'error');

                    // 针对常见问题的诊断提示
                    if (response.status === 404) {
                        setTimeout(() => this.showToast(
                            '💡 提示：请检查 API 地址是否正确。DeepSeek 的地址是 https://api.deepseek.com/chat/completions', 'info'), 1500);
                    } else if (response.status === 401) {
                        setTimeout(() => this.showToast(
                            '💡 提示：API Key 无效，请检查是否复制正确（注意不要有多余空格）', 'info'), 1500);
                    } else if (response.status === 400) {
                        setTimeout(() => this.showToast(
                            '💡 提示：请检查模型名称是否正确。DeepSeek 用 deepseek-chat', 'info'), 1500);
                    }
                }
            } catch (err) {
                if (err.name === 'AbortError') {
                    this.showToast('❌ 连接超时！请检查网络或 API 地址是否正确', 'error');
                } else if (err.message === 'Failed to fetch' || err.message.includes('NetworkError')) {
                    this.showToast('❌ 网络/CORS 错误：浏览器可能拦截了跨域请求', 'error');
                    setTimeout(() => this.showToast(
                        '💡 提示：如果是本地打开 HTML，试试用 Live Server 启动，或者换用 Chrome 的 CORS 插件', 'info'), 2000);
                } else {
                    this.showToast(`❌ 请求失败: ${err.message}`, 'error');
                }
            } finally {
                btn.textContent = originalText;
                btn.disabled = false;
            }
        },

        saveAPISettings(silent = false) {
            state.apiKey = els.apiKeyInput.value;
            state.apiEndpoint = els.apiEndpointInput.value;
            state.apiModel = els.apiModelInput.value;
            try {
                localStorage.setItem('bili_api_key', state.apiKey);
                localStorage.setItem('bili_api_endpoint', state.apiEndpoint);
                localStorage.setItem('bili_api_model', state.apiModel);
                if (!silent) {
                    this.showToast('✅ API 设置已保存', 'success');
                }
            } catch (e) { /* ignore */ }
        },

        updateInputStats() {
            const text = els.novelInput.value;
            const chars = text.replace(/\s/g, '').length;
            const paras = text.split('\n').filter(l => l.trim()).length;
            if (els.charCount) els.charCount.textContent = chars.toLocaleString();
            if (els.paraCount) els.paraCount.textContent = paras;
        },

        async handleConvert() {
            const text = els.novelInput.value.trim();
            if (!text) {
                this.showToast('请先输入小说文本！', 'warning');
                els.novelInput.focus();
                return;
            }

            if (state.isProcessing) return;

            // AI 模式但未填写 API Key 时，自动降级并提示
            if (state.useAI && !state.apiKey) {
                this.showToast('⚠️ 未配置 API Key，已自动切换为本地智能引擎', 'warning');
            }

            state.isProcessing = true;
            els.convertBtn.disabled = true;
            els.loadingOverlay.classList.add('active');

            try {
                let yamlStr;
                const screenplay = [];

                if (state.useAI && state.apiKey) {
                    // AI 模式 - 文本长度提示
                    if (text.length > 7000) {
                        this.showToast(`📐 文本较长 (${text.length} 字符)，AI 将处理前 8000 字符`, 'info');
                    }

                    els.loadingText.textContent = '🤖 AI 正在分析文本...';
                    await this.delay(500);
                    yamlStr = await ConversionEngine.convertWithAI(text, state.apiKey, state.apiEndpoint, state.apiModel);

                    // AI 模式下，解析 YAML 回来获取结构化数据
                    try {
                        const parsed = ConversionEngine.fromYaml(yamlStr);
                        screenplay.push(...parsed);
                        // 从 YAML 文本中提取角色
                        const charNames = new Set();
                        const charLines = yamlStr.split('\n').filter(l => l.trim().startsWith('角色:'));
                        charLines.forEach(l => {
                            const name = l.replace('角色:', '').trim().replace(/^"|"$/g, '');
                            if (name && name !== '未知') charNames.add(name);
                        });
                        state.characters = Array.from(charNames).map((name, i) => ({
                            name,
                            dialogueCount: 0,
                            type: i === 0 ? '主角' : i < 3 ? '主要角色' : '配角',
                        }));
                    } catch (e) {
                        // YAML 解析失败也没关系，至少有文本
                        this.showToast('⚠️ YAML 解析有小问题，但内容已生成', 'warning');
                    }
                } else {
                    // 本地智能引擎
                    els.loadingText.textContent = '📝 正在分析场景结构...';
                    await this.delay(400);

                    const scenes = ConversionEngine.detectScenes(text);

                    els.loadingText.textContent = '🎬 正在提取对话和角色...';
                    await this.delay(350);

                    let allDialogues = [];
                    for (const scene of scenes) {
                        const dialogues = ConversionEngine.extractDialogues(scene.raw);
                        allDialogues.push(...dialogues);
                    }

                    // 去重
                    const seen = new Set();
                    allDialogues = allDialogues.filter(d => {
                        const key = d.text.substring(0, 15);
                        if (seen.has(key)) return false;
                        seen.add(key);
                        return true;
                    });

                    state.characters = ConversionEngine.extractCharacters(text, allDialogues);

                    els.loadingText.textContent = '📄 正在生成剧本 YAML...';
                    await this.delay(300);

                    screenplay.push(...ConversionEngine.convert(text));
                    yamlStr = ConversionEngine.toYaml(screenplay);
                }

                state.screenplay = screenplay;
                state.rawYaml = yamlStr;
                els.yamlOutput.value = yamlStr;
                state.isEdited = false;

                // 更新 UI
                if (els.emptyState) els.emptyState.style.display = 'none';
                this.showOutputStats(screenplay.length > 0 ? screenplay : ConversionEngine.fromYaml(yamlStr));
                this.showScenePreview(screenplay.length > 0 ? screenplay : ConversionEngine.fromYaml(yamlStr));
                this.showCharacters(state.characters || []);

                const totalScenes = screenplay.length > 0 ? screenplay.length : (yamlStr.match(/- 场次:/g) || []).length;
                if (els.sceneCount) els.sceneCount.textContent = totalScenes;

                this.showToast(`✅ 转换完成！共 ${totalScenes} 场，${state.characters.length} 个角色`, 'success');

                // 更新文库统计数据（如果有当前小说）
                if (state.currentNovelId) {
                    const novel = state.novelLibrary.find(n => n.id === state.currentNovelId);
                    if (novel) {
                        novel.totalScenes = totalScenes;
                        novel.totalChars = state.characters.length;
                        if (state.currentChapterId) {
                            const ch = (novel.chapters || []).find(c => c.id === state.currentChapterId);
                            if (ch) {
                                ch.scenes = totalScenes;
                                ch.characters = state.characters.length;
                            }
                        }
                        this.saveLibrary();
                    }
                }

                // 触发自定义事件，通知外部角色数据已更新
                try {
                    document.dispatchEvent(new CustomEvent('screenplayConverted', {
                        detail: { screenplay: state.screenplay, characters: state.characters }
                    }));
                } catch (e) { /* ignore */ }

            } catch (err) {
                console.error('转换失败:', err);
                this.showToast('❌ 转换失败: ' + err.message, 'error');
            } finally {
                state.isProcessing = false;
                els.convertBtn.disabled = false;
                els.loadingOverlay.classList.remove('active');
            }
        },

        showOutputStats(screenplay) {
            if (!screenplay || screenplay.length === 0) return;

            let totalDialogues = 0,
                totalActions = 0,
                totalDescriptions = 0;

            for (const scene of screenplay) {
                if (scene.内容) {
                    for (const b of scene.内容) {
                        if (b.type === '对话' || b.类型 === '对话') totalDialogues++;
                        else if (b.type === '动作' || b.类型 === '动作') totalActions++;
                        else totalDescriptions++;
                    }
                }
            }

            if (totalDialogues === 0 && totalActions === 0 && totalDescriptions === 0) {
                // 尝试从原始数据统计
                const yaml = els.yamlOutput.value;
                totalDialogues = (yaml.match(/- 类型: 对话/g) || []).length;
                totalActions = (yaml.match(/- 类型: 动作/g) || []).length;
                totalDescriptions = (yaml.match(/- 类型: 描述/g) || []).length;
            }

            const charCount = state.characters ? state.characters.length : '?';

            els.outputStats.style.display = 'flex';
            els.outputStats.innerHTML = `
                <div class="output-stat-item">
                    <span class="output-stat-value" style="color:var(--bili-pink)">${screenplay.length}</span>
                    <span class="output-stat-label">总场次</span>
                </div>
                <div class="output-stat-item">
                    <span class="output-stat-value" style="color:var(--bili-blue)">${totalDialogues}</span>
                    <span class="output-stat-label">对话</span>
                </div>
                <div class="output-stat-item">
                    <span class="output-stat-value" style="color:var(--bili-green)">${totalActions}</span>
                    <span class="output-stat-label">动作</span>
                </div>
                <div class="output-stat-item">
                    <span class="output-stat-value" style="color:var(--bili-purple)">${totalDescriptions}</span>
                    <span class="output-stat-label">描述</span>
                </div>
                <div class="output-stat-item">
                    <span class="output-stat-value" style="color:var(--bili-orange)">${charCount}</span>
                    <span class="output-stat-label">角色</span>
                </div>
            `;
        },

        showScenePreview(screenplay) {
            if (!screenplay || screenplay.length === 0) {
                els.scenePreview.innerHTML = '';
                return;
            }

            const colors = [
                'var(--bili-pink)', 'var(--bili-blue)', 'var(--bili-green)',
                'var(--bili-purple)', 'var(--bili-orange)', 'var(--bili-cyan)',
                'var(--bili-red)', 'var(--bili-yellow)',
            ];

            els.scenePreview.innerHTML = screenplay.map((scene, idx) => {
                const contentCount = scene.内容 ? scene.内容.length : 0;
                const diaCount = scene.内容 ? scene.内容.filter(b => b.type === '对话' || b.类型 === '对话').length : 0;
                return `
                    <div class="scene-card" style="border-left-color: ${colors[idx % colors.length]}">
                        <div class="scene-card-header">
                            <span class="scene-number">第 ${scene.场次} 场</span>
                            <span style="font-size:12px;color:var(--text-tertiary)">${contentCount} 段 · ${diaCount} 句对话</span>
                        </div>
                        <div class="scene-title">${scene.场景 || '未命名场景'}</div>
                        <div class="scene-meta">
                            ${scene.地点 && scene.地点 !== '未知' ? `<span class="scene-meta-item">📍 ${scene.地点}</span>` : ''}
                            ${scene.时间 && scene.时间 !== '未知' ? `<span class="scene-meta-item">⏰ ${scene.时间}</span>` : ''}
                        </div>
                    </div>
                `;
            }).join('');
        },

        showCharacters(characters) {
            if (!characters || characters.length === 0) {
                els.charactersSection.style.display = 'none';
                return;
            }
            els.charactersSection.style.display = 'block';

            const typeClass = {
                '主角': 'character-tag-main',
                '主要角色': 'character-tag-support',
                '配角': 'character-tag-extra',
            };

            els.characterTags.innerHTML = characters.map(c => {
                const cls = typeClass[c.type] || 'character-tag-extra';
                const count = c.dialogueCount > 0 ? `<span class="tag-count">${c.dialogueCount}句</span>` : '';
                return `<span class="character-tag ${cls}">${c.name}${count}</span>`;
            }).join('');
        },

        // ===== 文本内容匹配辅助方法 =====

        // 从文本中提取长度 > minLen 的连续中文字符序列
        _extractChineseFragments(text, minLen = 5) {
            const cleaned = text.replace(/^\s*\d+\s*/, '').trim();
            const seqs = cleaned.match(/[一-鿿]{5,}/g);
            return seqs ? [...new Set(seqs)] : [];
        },

        // 在另一面板中按文本内容查找匹配行
        _matchLineByText(line, otherContainer) {
            const contentEl = line.querySelector('.compare-line-content');
            if (!contentEl) return null;
            const text = contentEl.textContent || '';
            const fragments = this._extractChineseFragments(text);
            if (fragments.length === 0) return null;

            const otherLines = otherContainer.querySelectorAll('.compare-line .compare-line-content');
            for (const frag of fragments) {
                for (const otherContent of otherLines) {
                    if ((otherContent.textContent || '').includes(frag)) {
                        return otherContent.closest('.compare-line');
                    }
                }
            }
            return null;
        },

        // 处理右侧对照面板的可编辑输入
        _handleCompareEdit(e) {
            const line = e.target.closest('.compare-line');
            if (!line) return;
            const sceneIdx = parseInt(line.dataset.scene);
            const blockIdx = parseInt(line.dataset.blockIndex);
            if (isNaN(sceneIdx) || isNaN(blockIdx)) return;

            // 如果 screenplay 未填充，尝试从 rawYaml 恢复
            if (!state.screenplay || state.screenplay.length === 0) {
                if (state.rawYaml) {
                    try { state.screenplay = ConversionEngine.fromYaml(state.rawYaml); } catch (e) { return; }
                } else { return; }
            }
            if (!state.screenplay[sceneIdx]) return;
            const blocks = state.screenplay[sceneIdx].内容;
            if (!blocks || !blocks[blockIdx]) return;

            const contentEl = line.querySelector('.compare-line-content');
            if (!contentEl) return;
            const fullText = contentEl.textContent || '';
            const block = blocks[blockIdx];
            const type = block.type || '';

            if (type === '对话') {
                const quoteMatch = fullText.match(/"([^"]*)"$/);
                if (quoteMatch) {
                    block.content = quoteMatch[1].trim();
                    block.台词 = block.content;
                }
            } else if (type === '动作') {
                const actionMatch = fullText.match(/【(.*)】/);
                if (actionMatch) {
                    block.content = actionMatch[1].trim();
                    block.内容 = block.content;
                }
            } else {
                block.content = fullText.trim();
                block.内容 = block.content;
            }

            state.rawYaml = ConversionEngine.toYaml(state.screenplay, state.showSeparators);
            els.yamlOutput.value = state.rawYaml;
            els.yamlOutput.dispatchEvent(new Event('input'));
        },

        generateCompareView() {
            const originalEl = document.getElementById('compareScrollLeft');
            const screenplayEl = document.getElementById('compareScrollRight');
            if (!originalEl || !screenplayEl) return;

            const originalText = state.novelText || '';
            const screenplay = state.screenplay && state.screenplay.length > 0
                ? state.screenplay
                : (state.rawYaml ? ConversionEngine.fromYaml(state.rawYaml) : []);
            const showSep = state.showSeparators;

            // 场景颜色轮换（左右共用同一套颜色，一一对应）
            const palette = [
                { bg: 'rgba(251,114,153,0.07)', border: 'rgba(251,114,153,0.4)', label: '#fb7299' },
                { bg: 'rgba(0,161,214,0.07)', border: 'rgba(0,161,214,0.4)', label: '#00a1d6' },
                { bg: 'rgba(46,204,113,0.07)', border: 'rgba(46,204,113,0.4)', label: '#2ecc71' },
                { bg: 'rgba(155,89,182,0.07)', border: 'rgba(155,89,182,0.4)', label: '#9b59b6' },
                { bg: 'rgba(255,140,0,0.07)', border: 'rgba(255,140,0,0.4)', label: '#ff8c00' },
                { bg: 'rgba(26,188,156,0.07)', border: 'rgba(26,188,156,0.4)', label: '#1abc9c' },
                { bg: 'rgba(231,76,60,0.07)', border: 'rgba(231,76,60,0.4)', label: '#e74c3c' },
                { bg: 'rgba(243,156,18,0.07)', border: 'rgba(243,156,18,0.4)', label: '#f39c12' },
            ];
            const getColor = (i) => palette[i % palette.length];

            // --- 估算每场在原文中对应的行范围 ---
            const origLines = originalText.split('\n');
            const totalBlocks = screenplay.reduce((s, sc) => s + (sc.内容 || []).length, 0) || 1;
            const origSceneMap = new Array(origLines.length).fill(0);
            if (screenplay.length > 1 && totalBlocks > 0) {
                let lineCursor = 0;
                for (let si = 0; si < screenplay.length; si++) {
                    const blockCount = (screenplay[si].内容 || []).length || 1;
                    const proportion = blockCount / totalBlocks;
                    const sceneLines = Math.max(1, Math.round(proportion * origLines.length));
                    const endLine = Math.min(lineCursor + sceneLines, origLines.length);
                    for (let li = lineCursor; li < endLine; li++) origSceneMap[li] = si;
                    lineCursor = endLine;
                    if (si === screenplay.length - 1) {
                        for (let li = lineCursor; li < origLines.length; li++) origSceneMap[li] = si;
                    }
                }
            }

            // --- 渲染原文（左栏） ---
            let prevScene = -1;
            originalEl.innerHTML = origLines.map((line, i) => {
                const si = origSceneMap[i];
                const c = getColor(si);
                let html = '';
                if (si !== prevScene) {
                    html += `<div class="scene-boundary" data-scene="${si}" style="--scene-clr:${c.border};">
                        <span class="scene-boundary-dot" style="background:${c.label};"></span>
                        <span class="scene-boundary-label">第${si+1}场 · ${screenplay[si]?.场景 || ''}</span>
                    </div>`;
                }
                prevScene = si;
                html += `<div class="compare-line" data-index="${i}" data-scene="${si}"
                    style="background:${c.bg};border-left:2px solid ${c.border};">
                    <span class="compare-line-num">${i + 1}</span>
                    <span class="compare-line-content">${line || '&nbsp;'}</span>
                </div>`;
                return html;
            }).join('');

            // --- 渲染剧本（右栏） ---
            let spHtml = '';
            let lineNum = 0;

            screenplay.forEach((scene, si) => {
                const c = getColor(si);

                // 场次标题行
                spHtml += `
                    <div class="compare-line scene-header" data-scene="${si}" contenteditable="plaintext-only"
                        style="background:${c.bg};border-left:3px solid ${c.border};border-radius:4px;margin:4px 0 2px;">
                        <span class="compare-line-num">${++lineNum}</span>
                        <span class="compare-line-content" style="font-weight:700;color:${c.label};">
                            🎬 第${scene.场次}场 · ${scene.场景 || ''}
                        </span>
                    </div>`;
                // 地点/时间
                spHtml += `
                    <div class="compare-line" data-scene="${si}" contenteditable="plaintext-only"
                        style="font-size:12px;background:${c.bg};border-left:2px solid ${c.border};">
                        <span class="compare-line-num">${++lineNum}</span>
                        <span class="compare-line-content" style="color:var(--text-tertiary);">
                            📍 ${scene.地点 || '未知'}　⏰ ${scene.时间 || '未知'}
                        </span>
                    </div>`;

                if (scene.内容 && scene.内容.length > 0) {
                    let pt = '', pc = '';
                    scene.内容.forEach((block, bi) => {
                        const type = block.type || block.类型 || '';
                        const charName = block.character || block.角色 || '';
                        const content = block.content || block.台词 || block.内容 || '';
                        const emotion = block.emotion || block.情绪 || '';
                        const cc = type === '对话' ? charName : '';

                        if (showSep && bi > 0 && (type !== pt || (type === '对话' && cc !== pc))) {
                            spHtml += `<div class="compare-sep" data-scene="${si}"><span class="compare-sep-text">────</span></div>`;
                        }
                        pt = type; pc = cc;

                        if (type === '对话') {
                            spHtml += `
                                <div class="compare-line type-dialogue" data-scene="${si}" data-block-index="${bi}" contenteditable="plaintext-only"
                                    style="background:${c.bg};border-left:2px solid ${c.border};">
                                    <span class="compare-line-num">${++lineNum}</span>
                                    <span class="compare-line-content">
                                        <span class="char-name">${charName || '未知'}</span>
                                        ${emotion ? `<span class="char-emotion">（${emotion}）</span>：` : '：'}
                                        "${content}"
                                    </span>
                                </div>`;
                        } else if (type === '动作') {
                            spHtml += `
                                <div class="compare-line type-action" data-scene="${si}" data-block-index="${bi}" contenteditable="plaintext-only"
                                    style="background:${c.bg};border-left:2px solid ${c.border};">
                                    <span class="compare-line-num">${++lineNum}</span>
                                    <span class="compare-line-content">【${content}】</span>
                                </div>`;
                        } else {
                            spHtml += `
                                <div class="compare-line type-description" data-scene="${si}" data-block-index="${bi}" contenteditable="plaintext-only"
                                    style="background:${c.bg};border-left:2px solid ${c.border};">
                                    <span class="compare-line-num">${++lineNum}</span>
                                    <span class="compare-line-content">${content}</span>
                                </div>`;
                        }
                    });
                }
            });

            const editHint = '<div class="compare-edit-hint" style="padding:4px 10px;font-size:11px;color:var(--bili-pink);border-bottom:1px dashed rgba(251,114,153,0.2);margin-bottom:4px;user-select:none;">✏️ 点击可编辑</div>';
            screenplayEl.innerHTML = (spHtml ? editHint + spHtml : '<div style="padding:20px;text-align:center;color:var(--text-tertiary)">暂无剧本数据</div>');

            // --- 跨面板行级高亮（按文本内容匹配） ---
            const _crossHl = (hoverC, otherC) => (e) => {
                const line = e.target.closest('.compare-line, .scene-boundary');
                if (!line) return;
                document.querySelectorAll('.scene-hl').forEach(el => el.classList.remove('scene-hl'));
                if (line.classList.contains('compare-line')) {
                    const contentEl = line.querySelector('.compare-line-content');
                    if (!contentEl) { line.classList.add('scene-hl'); return; }
                    const text = contentEl.textContent || '';
                    const cleaned = text.replace(/^\s*\d+\s*/, '').trim();
                    const seqs = cleaned.match(/[一-鿿]{5,}/g);
                    const fragments = seqs ? [...new Set(seqs)] : [];
                    if (fragments.length > 0) {
                        const otherContents = otherC.querySelectorAll('.compare-line .compare-line-content');
                        let matched = false;
                        for (const frag of fragments) {
                            for (const oc of otherContents) {
                                if ((oc.textContent || '').includes(frag)) {
                                    oc.closest('.compare-line').classList.add('scene-hl');
                                    matched = true;
                                    break;
                                }
                            }
                            if (matched) break;
                        }
                    }
                    line.classList.add('scene-hl');
                } else {
                    const scene = line.dataset.scene;
                    if (scene === undefined) return;
                    hoverC.querySelectorAll(`.compare-line[data-scene="${scene}"]`).forEach(el => el.classList.add('scene-hl'));
                    otherC.querySelectorAll(`.compare-line[data-scene="${scene}"]`).forEach(el => el.classList.add('scene-hl'));
                }
            };
            const _crossHlOut = (hoverC) => (e) => {
                if (!hoverC.contains(e.relatedTarget)) {
                    document.querySelectorAll('.scene-hl').forEach(el => el.classList.remove('scene-hl'));
                }
            };
            originalEl.addEventListener('mouseover', _crossHl(originalEl, screenplayEl));
            screenplayEl.addEventListener('mouseover', _crossHl(screenplayEl, originalEl));
            originalEl.addEventListener('mouseout', _crossHlOut(originalEl));
            screenplayEl.addEventListener('mouseout', _crossHlOut(screenplayEl));

            // --- 右侧可编辑面板输入事件 ---
            screenplayEl.addEventListener('input', (e) => this._handleCompareEdit(e));

            // --- 同步滚动 ---
            this._setupSyncedScroll(originalEl, screenplayEl);
        },

        _setupSyncedScroll(leftEl, rightEl) {
            if (this._scrollCleanup) { this._scrollCleanup(); this._scrollCleanup = null; }

            let isSyncing = false;

            const doSync = (src, tgt) => {
                if (isSyncing) return;
                isSyncing = true;
                // 同步滚动百分比，去掉 rAF 延迟确保实时响应
                const sMax = src.scrollHeight - src.clientHeight;
                const tMax = tgt.scrollHeight - tgt.clientHeight;
                if (sMax > 0 && tMax > 0) {
                    tgt.scrollTop = (src.scrollTop / sMax) * tMax;
                }
                isSyncing = false;
            };

            const onLeftScroll = () => doSync(leftEl, rightEl);
            const onRightScroll = () => doSync(rightEl, leftEl);

            leftEl.addEventListener('scroll', onLeftScroll, { passive: true });
            rightEl.addEventListener('scroll', onRightScroll, { passive: true });

            // 内容变化时自动保持同步（直接同步，无 rAF 延迟）
            try {
                const ro = new ResizeObserver(() => {
                    // 直接同步，不经过 rAF 延迟
                    if (leftEl.scrollTop > rightEl.scrollTop) {
                        doSync(leftEl, rightEl);
                    } else {
                        doSync(rightEl, leftEl);
                    }
                });
                ro.observe(leftEl);
                ro.observe(rightEl);

                this._scrollCleanup = () => {
                    leftEl.removeEventListener('scroll', onLeftScroll);
                    rightEl.removeEventListener('scroll', onRightScroll);
                    ro.disconnect();
                    isSyncing = false;
                };
            } catch (e) {
                // ResizeObserver 不支持时的降级
                this._scrollCleanup = () => {
                    leftEl.removeEventListener('scroll', onLeftScroll);
                    rightEl.removeEventListener('scroll', onRightScroll);
                    isSyncing = false;
                };
            }
        },

        // ===== 文库管理 =====

        getNovelId() { return '_n_' + Date.now() + '_' + Math.random().toString(36).slice(2,6); },

        saveLibrary() {
            try {
                localStorage.setItem('novel_library', JSON.stringify(state.novelLibrary));
                localStorage.setItem('current_novel_id', state.currentNovelId || '');
                localStorage.setItem('current_chapter_id', state.currentChapterId || '');
            } catch(e) { /* ignore quota */ }
        },

        renderFileList() {
            const list = document.getElementById('fileMgrList');
            const stats = document.getElementById('fileMgrStats');
            if (!list) return;
            const lib = state.novelLibrary;

            // 统计
            if (stats) {
                const totalChapters = lib.reduce((s, n) => s + (n.chapters ? n.chapters.length : 0), 0);
                const totalWords = lib.reduce((s, n) => s + (n.totalWords || 0), 0);
                document.getElementById('novelCount').textContent = lib.length;
                document.getElementById('chapterCount').textContent = totalChapters;
                document.getElementById('totalWordCount').textContent = totalWords.toLocaleString();
            }

            if (!lib.length) {
                list.innerHTML = `<div class="file-mgr-empty">
                    <div class="file-mgr-empty-icon">📚</div>
                    <div>还没有小说，点击「导入小说」开始</div>
                    <div style="font-size:12px;color:var(--text-tertiary);margin-top:6px;">支持 .txt 格式，可多章管理</div>
                </div>`;
                return;
            }

            list.innerHTML = lib.map((novel, ni) => {
                const chaps = novel.chapters || [];
                const chapHtml = chaps.length > 0 ? `<div class="novel-card-chapters">${
                    chaps.map((ch, ci) => `
                        <div class="chapter-item ${state.currentNovelId === novel.id && state.currentChapterId === ch.id ? 'active' : ''}"
                             data-novel="${novel.id}" data-chapter="${ch.id}">
                            <span class="chapter-item-title">📄 ${ch.title || '第' + (ci+1) + '章'}</span>
                            <span class="chapter-item-stats">${(ch.content || '').length}字</span>
                        </div>
                    `).join('')
                }</div>` : '';

                return `<div class="novel-card">
                    <div class="novel-card-header">
                        <div class="novel-card-title">
                            📖 ${novel.name}
                            <span class="novel-card-chapter-badge">${chaps.length}章</span>
                        </div>
                    </div>
                    <div class="novel-card-stats">
                        <span>📝 ${novel.totalWords || 0} 字</span>
                        <span>🎬 ${novel.totalScenes || 0} 场</span>
                        <span>🎭 ${novel.totalChars || 0} 角色</span>
                    </div>
                    ${chapHtml}
                    <div class="novel-card-actions">
                        <button class="btn btn-outline btn-sm load-novel-btn" data-novel="${novel.id}">📂 加载</button>
                        <button class="btn btn-outline btn-sm delete-novel-btn" data-novel="${novel.id}" style="color:var(--bili-red);border-color:rgba(231,76,60,0.3);">🗑️ 删除</button>
                    </div>
                </div>`;
            }).join('');

            // 事件绑定
            list.querySelectorAll('.load-novel-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.loadNovel(btn.dataset.novel);
                });
            });
            list.querySelectorAll('.delete-novel-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (confirm('确定要删除这部小说吗？')) {
                        this.deleteNovel(btn.dataset.novel);
                    }
                });
            });
            list.querySelectorAll('.chapter-item').forEach(item => {
                item.addEventListener('click', () => {
                    this.loadNovel(item.dataset.novel, item.dataset.chapter);
                });
            });
        },

        // 智能章节分割（正则 + AI 辅助）
        async _splitChapters(content, useAI = false, apiKey = '', endpoint = '', model = '') {
            const mode = state.chapterSplitMode;

            // --- 按标记分章 ---
            if (mode === 'marker') {
                // 1) 优先识别原文真实章节标记
                const realChapters = this._detectRealChapters(content);
                if (realChapters.length >= 2) {
                    const chapters = [];
                    for (let i = 0; i < realChapters.length; i++) {
                        const start = realChapters[i].index;
                        const end = i + 1 < realChapters.length ? realChapters[i + 1].index : content.length;
                        const chunk = content.slice(start, end).trim();
                        if (chunk.length > 50) {
                            chapters.push({ title: realChapters[i].title, content: chunk });
                        }
                    }
                    return chapters.length > 0 ? chapters : [{ title: '第1章', content: content.trim() }];
                }

                // 2) 尝试用户自定义正则
                try {
                    const pattern = state.chapterMarkerPattern;
                    if (pattern) {
                        const regex = new RegExp(pattern, 'gm');
                        const matches = [];
                        let m;
                        while ((m = regex.exec(content)) !== null) {
                            if (m[0].length > 1 && m[0].length < 50 && !m[0].includes('"') && !m[0].includes('「')) {
                                matches.push({ index: m.index, title: m[0].trim() });
                            }
                        }
                        if (matches.length >= 2) {
                            const chapters = [];
                            for (let i = 0; i < matches.length; i++) {
                                const start = matches[i].index;
                                const end = i + 1 < matches.length ? matches[i + 1].index : content.length;
                                const chunk = content.slice(start, end).trim();
                                if (chunk.length > 50) {
                                    chapters.push({ title: matches[i].title, content: chunk });
                                }
                            }
                            if (chapters.length > 0) return chapters;
                        }
                    }
                } catch (e) {
                    console.warn('自定义分章正则无效', e);
                }
            }

            // 按字数分章（或标记模式无匹配时回退到字数分章）
            const chunkSize = (mode === 'size') ? state.chapterSize : 8000;
            return this._sizeSplitChapters(content, chunkSize);
        },

        // 严格检测真实章节标记
        _detectRealChapters(text) {
            const candidates = [];
            const lines = text.split('\n');

            // 行首章节标记正则
            const chapterRegex = /^(?:\s*第[一二三四五六七八九十百千\d零〇]+[章回部节](?:\s+.+)?)$/;
            const chapterRegex2 = /^(?:\s*Chapter\s+\d+(?:\s*[:\-–—].+)?)$/i;
            const volumeRegex = /^(?:\s*第[一二三四五六七八九十百千\d零〇]+卷(?:\s+.+)?)$/;

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;

                let matched = false;
                let title = '';

                if (chapterRegex.test(line) || volumeRegex.test(line)) {
                    matched = true;
                    title = line;
                } else if (chapterRegex2.test(line)) {
                    matched = true;
                    title = line;
                }

                if (matched) {
                    // 严格校验：
                    // 1) 标题行不超过 30 字（真实章节标题简短）
                    if (title.length > 30) continue;
                    // 2) 不含引号（对话中不会出现章节标记）
                    if (title.includes('"') || title.includes('「') || title.includes('』')) continue;
                    // 3) 下一行存在且有内容（章节标题后应有正文）
                    const nextLine = (lines[i + 1] || '').trim();
                    if (!nextLine || nextLine.length < 5) continue;
                    // 4) 排除含"部队""干部""全部"等干扰词的上下文
                    if (/部队|干部|全部|大部|分部|内部|外部|本部|背部|局部|章节|团部|支部|头部/.test(line)) continue;

                    // 通过校验，计算在原文中的位置（含换行符偏移）
                    let offset = 0;
                    for (let j = 0; j < i; j++) {
                        offset += lines[j].length + 1;
                    }
                    candidates.push({ index: offset, title });
                }
            }

            return candidates;
        },

        // 按字数分章（段落边界感知）
        _sizeSplitChapters(content, chunkSize) {
            const CHUNK_SIZE = chunkSize || 8000;
            const chapters = [];
            let start = 0;
            let idx = 1;

            while (start < content.length) {
                let end = Math.min(start + CHUNK_SIZE, content.length);
                if (end < content.length) {
                    const paraBreak = content.lastIndexOf('\n\n', end);
                    if (paraBreak > start + CHUNK_SIZE * 0.4) {
                        end = paraBreak;
                    } else {
                        const lineBreak = content.lastIndexOf('\n', end);
                        if (lineBreak > start + CHUNK_SIZE * 0.25) {
                            end = lineBreak;
                        }
                    }
                }
                const chunk = content.slice(start, end).trim();
                if (chunk.length > 50) {
                    chapters.push({ title: '第' + idx + '章', content: chunk });
                    idx++;
                }
                start = end;
            }

            return chapters.length > 0 ? chapters : [{ title: '第1章', content: content.trim() }];
        },

        // 尝试自动检测编码并解码
        _decodeText(buffer) {
            const bytes = new Uint8Array(buffer);

            // 检测 UTF-16 BOM（TextDecoder 不自动处理 UTF-16 BOM, 需手动）
            if (bytes[0] === 0xFF && bytes[1] === 0xFE) {
                return new TextDecoder('utf-16le').decode(buffer);
            }
            if (bytes[0] === 0xFE && bytes[1] === 0xFF) {
                return new TextDecoder('utf-16be').decode(buffer);
            }

            // 先试 UTF-8（TextDecoder 会自动跳过 UTF-8 BOM）
            try {
                const decoder = new TextDecoder('utf-8', { fatal: true });
                return decoder.decode(buffer);
            } catch (e) {
                // UTF-8 解码失败，试 GBK
                try {
                    const decoder = new TextDecoder('gbk', { fatal: false });
                    const text = decoder.decode(buffer);
                    // 检查是否包含大量替换字符（�）
                    if (text.indexOf('�') >= 0) throw new Error('bad decode');
                    return text;
                } catch (e2) {
                    // 最后尝试 GB2312 / 终极 fallback
                    try {
                        return new TextDecoder('gb2312').decode(buffer);
                    } catch (e3) {
                        return new TextDecoder('utf-8', { fatal: false }).decode(buffer);
                    }
                }
            }
        },

        importNovelFile(file) {
            const name = file.name.replace(/\.txt$/i, '').trim() || '未命名小说';
            const self = this;

            // 先读取为 ArrayBuffer 以处理编码
            const reader = new FileReader();
            reader.onload = async function(e) {
                const buffer = e.target.result;
                let content;
                try {
                    content = self._decodeText(buffer);
                } catch (err) {
                    // 终极 fallback
                    content = new TextDecoder('utf-8', { fatal: false }).decode(buffer);
                }

                // 按章节拆分（AI 模式时使用 AI 辅助）
                let chapters = await self._splitChapters(content, state.useAI, state.apiKey, state.apiEndpoint, state.apiModel);
                if (!chapters || chapters.length === 0) {
                    chapters = [{ title: '全文', content: content.trim() }];
                }

                let existing = state.novelLibrary.find(n => n.name === name);
                if (existing) {
                    // 追加到已有小说
                    let addedCount = 0;
                    chapters.forEach(ch => {
                        const dup = (existing.chapters || []).some(ec => ec.title === ch.title);
                        if (!dup) {
                            if (!existing.chapters) existing.chapters = [];
                            existing.chapters.push({
                                id: self.getNovelId(),
                                title: ch.title,
                                content: ch.content,
                            });
                            addedCount++;
                        }
                    });
                    if (addedCount === 0 && chapters.length > 0) {
                        // 章节名都重复，作为新章追加
                        const base = (existing.chapters || []).length + 1;
                        chapters.forEach((ch, ci) => {
                            existing.chapters.push({
                                id: self.getNovelId(),
                                title: '第' + (base + ci) + '章 ' + ch.title,
                                content: ch.content,
                            });
                        });
                        addedCount = chapters.length;
                    }
                    existing.totalWords = (existing.chapters || []).reduce((s, c) => s + (c.content || '').replace(/\s/g, '').length, 0);
                    // 只对前 3 章做场景统计（避免卡顿）
                    let sceneCount = existing.totalScenes || 0;
                    chapters.slice(0, 3).forEach(ch => {
                        sceneCount += ConversionEngine.detectScenes(ch.content).length;
                    });
                    existing.totalScenes = sceneCount;
                    self.showToast(`✅ 「${name}」已追加 ${addedCount} 章`, 'success');
                } else {
                    // 新建小说
                    let sceneCount = 0;
                    // 只对前 3 章做场景统计
                    chapters.slice(0, 3).forEach(ch => {
                        sceneCount += ConversionEngine.detectScenes(ch.content).length;
                    });
                    const totalWords = chapters.reduce((s, ch) => s + (ch.content || '').replace(/\s/g, '').length, 0);
                    existing = {
                        id: self.getNovelId(),
                        name: name,
                        chapters: chapters.map(ch => ({
                            id: self.getNovelId(),
                            title: ch.title,
                            content: ch.content,
                        })),
                        totalWords: totalWords,
                        totalScenes: sceneCount,
                        totalChars: 0,
                        createdAt: Date.now(),
                    };
                    state.novelLibrary.push(existing);
                    self.showToast(`✅ 已导入「${name}」${chapters.length} 章`, 'success');
                }

                self.saveLibrary();
                self.renderFileList();
            };
            reader.readAsArrayBuffer(file);
        },

        loadNovel(novelId, chapterId) {
            const novel = state.novelLibrary.find(n => n.id === novelId);
            if (!novel) return;
            state.currentNovelId = novelId;
            const chaps = novel.chapters || [];

            if (chapterId) {
                const ch = chaps.find(c => c.id === chapterId);
                if (ch) {
                    state.currentChapterId = chapterId;
                    els.novelInput.value = ch.content;
                    state.novelText = ch.content;
                    this.updateInputStats();
                    this.showToast(`📂 已加载「${novel.name} - ${ch.title}」`, 'success');
                }
            } else {
                // 默认加载第一章（不合并所有章，避免长文本卡顿）
                const firstCh = chaps[0];
                if (firstCh) {
                    state.currentChapterId = firstCh.id;
                    els.novelInput.value = firstCh.content;
                    state.novelText = firstCh.content;
                    this.updateInputStats();
                    const hint = chaps.length > 1 ? `（共${chaps.length}章，已加载第1章）` : '';
                    this.showToast(`📂 已加载「${novel.name} - ${firstCh.title}」${hint}`, 'success');
                }
            }
            this.saveLibrary();
            this.renderFileList();
        },

        deleteNovel(novelId) {
            state.novelLibrary = state.novelLibrary.filter(n => n.id !== novelId);
            if (state.currentNovelId === novelId) {
                state.currentNovelId = null;
                state.currentChapterId = null;
            }
            this.saveLibrary();
            this.renderFileList();
            this.showToast('🗑️ 已删除', 'info');
        },

        // ===== 设置管理 =====

        saveSetting(key, value) {
            state[key] = value;
            const map = {
                compareFontSize: 'bili_font_size',
                compareFontFamily: 'bili_font_family',
                themeColor: 'bili_theme_color',
                autoSplitActs: 'bili_auto_split',
            };
            if (map[key]) {
                localStorage.setItem(map[key], String(value));
            }
        },

        applySettings() {
            // 字体大小
            const fs = state.compareFontSize;
            document.documentElement.style.setProperty('--fs-compare', fs + 'px');
            // 同时应用到全屏对照
            document.querySelectorAll('.fullscreen-panel-content').forEach(el => {
                el.style.fontSize = fs + 'px';
            });

            // 字体
            const ff = state.compareFontFamily;
            if (ff) {
                document.documentElement.style.setProperty('--font-compare', ff);
            } else {
                document.documentElement.style.removeProperty('--font-compare');
            }

            // 主题
            this.applyTheme(state.themeColor);

            // 更新设置面板 UI
            const fsInput = document.getElementById('fontSizeInput');
            const fsVal = document.getElementById('fontSizeValue');
            if (fsInput) fsInput.value = fs;
            if (fsVal) fsVal.textContent = fs + 'px';

            const ffSelect = document.getElementById('fontFamilySelect');
            if (ffSelect) ffSelect.value = ff;

            const autoSplit = document.getElementById('autoSplitToggle');
            if (autoSplit) autoSplit.checked = state.autoSplitActs;
        },

        applyTheme(theme) {
            // 向后兼容旧主题名
            const legacyMap = { default: "minimal-white", eye: "soft-pastel", warm: "editorial-serif", dark: "tokyo-night" };
            theme = legacyMap[theme] || theme;
            // html-ppt 主题映射：加载 ppt/themes/<theme>.css
            const themeLink = document.getElementById('theme-link');
            if (themeLink) {
                themeLink.href = `ppt/themes/${theme}.css`;
                themeLink.disabled = false;
            }
            // 保存
            this.saveSetting('themeColor', theme);
            // 更新主题选择器 UI
            document.querySelectorAll('.theme-option').forEach(el => {
                el.classList.toggle('active', el.dataset.theme === theme);
            });
        },

        // ===== 全屏对照 =====

        openFullscreenCompare() {
            console.log('openFullscreenCompare called', { novelText: state.novelText?.length, screenplay: state.screenplay?.length, rawYaml: state.rawYaml?.length });
            const overlay = document.getElementById('fullscreenCompare');
            if (!overlay) return;
            const left = document.getElementById('fsCompareLeft');
            const right = document.getElementById('fsCompareRight');
            if (!left || !right) return;

            // 渲染内容
            const originalText = state.novelText || '';
            const screenplay = state.screenplay && state.screenplay.length > 0
                ? state.screenplay
                : (state.rawYaml ? ConversionEngine.fromYaml(state.rawYaml) : []);

            if (!originalText || !screenplay.length) {
                this.showToast('请先转换小说再打开对照模式', 'warning');
                return;
            }

            const palette = [
                { bg: 'rgba(251,114,153,0.07)', border: 'rgba(251,114,153,0.4)', label: '#fb7299' },
                { bg: 'rgba(0,161,214,0.07)', border: 'rgba(0,161,214,0.4)', label: '#00a1d6' },
                { bg: 'rgba(46,204,113,0.07)', border: 'rgba(46,204,113,0.4)', label: '#2ecc71' },
                { bg: 'rgba(155,89,182,0.07)', border: 'rgba(155,89,182,0.4)', label: '#9b59b6' },
                { bg: 'rgba(255,140,0,0.07)', border: 'rgba(255,140,0,0.4)', label: '#ff8c00' },
                { bg: 'rgba(26,188,156,0.07)', border: 'rgba(26,188,156,0.4)', label: '#1abc9c' },
            ];
            const getColor = (i) => palette[i % palette.length];
            const origLines = originalText.split('\n');

            // 估算原文行对应场景
            const totalBlocks = screenplay.reduce((s, sc) => s + (sc.内容 || []).length, 0) || 1;
            const origSceneMap = new Array(origLines.length).fill(0);
            if (screenplay.length > 1 && totalBlocks > 0) {
                let cursor = 0;
                for (let si = 0; si < screenplay.length; si++) {
                    const bc = (screenplay[si].内容 || []).length || 1;
                    const sl = Math.max(1, Math.round((bc / totalBlocks) * origLines.length));
                    const end = Math.min(cursor + sl, origLines.length);
                    for (let li = cursor; li < end; li++) origSceneMap[li] = si;
                    cursor = end;
                    if (si === screenplay.length - 1) {
                        for (let li = cursor; li < origLines.length; li++) origSceneMap[li] = si;
                    }
                }
            }

            // 原文（左）
            let prevSi = -1;
            left.innerHTML = origLines.map((line, i) => {
                const si = origSceneMap[i];
                const c = getColor(si);
                let html = '';
                if (si !== prevSi) {
                    html += `<div class="scene-boundary" data-scene="${si}" style="--scene-clr:${c.border};">
                        <span class="scene-boundary-dot" style="background:${c.label};"></span>
                        <span class="scene-boundary-label">第${si+1}场</span>
                    </div>`;
                }
                prevSi = si;
                html += `<div class="compare-line" data-index="${i}" data-scene="${si}"
                    style="background:${c.bg};border-left:2px solid ${c.border};">
                    <span class="compare-line-num">${i+1}</span>
                    <span class="compare-line-content">${line || '&nbsp;'}</span>
                </div>`;
                return html;
            }).join('');

            // 剧本（右）
            let rh = '';
            let ln = 0;
            screenplay.forEach((scene, si) => {
                const c = getColor(si);
                rh += `<div class="compare-line scene-header" data-scene="${si}" contenteditable="plaintext-only"
                    style="background:${c.bg};border-left:3px solid ${c.border};border-radius:4px;">
                    <span class="compare-line-num">${++ln}</span>
                    <span class="compare-line-content" style="font-weight:700;color:${c.label};">🎬 第${scene.场次}场 · ${scene.场景||''}</span>
                </div>
                <div class="compare-line" data-scene="${si}" contenteditable="plaintext-only"
                    style="font-size:12px;background:${c.bg};border-left:2px solid ${c.border};">
                    <span class="compare-line-num">${++ln}</span>
                    <span class="compare-line-content" style="color:var(--text-tertiary);">📍 ${scene.地点||'未知'}　⏰ ${scene.时间||'未知'}</span>
                </div>`;
                if (scene.内容) {
                    let pt = '', pc = '';
                    scene.内容.forEach((b, bi) => {
                        const t = b.type||b.类型||'';
                        const cn = b.character||b.角色||'';
                        const ct = b.content||b.台词||b.内容||'';
                        const em = b.emotion||b.情绪||'';
                        const cc = t === '对话' ? cn : '';
                        if (state.showSeparators && bi > 0 && (t !== pt || (t === '对话' && cc !== pc))) {
                            rh += `<div class="compare-sep" data-scene="${si}"><span class="compare-sep-text">────</span></div>`;
                        }
                        pt = t; pc = cc;
                        if (t === '对话') {
                            rh += `<div class="compare-line type-dialogue" data-scene="${si}" data-block-index="${bi}" contenteditable="plaintext-only"
                                style="background:${c.bg};border-left:2px solid ${c.border};">
                                <span class="compare-line-num">${++ln}</span>
                                <span class="compare-line-content"><span class="char-name">${cn||'未知'}</span>
                                ${em ? `<span class="char-emotion">（${em}）</span>：` : '：'}"${ct}"</span></div>`;
                        } else if (t === '动作') {
                            rh += `<div class="compare-line type-action" data-scene="${si}" data-block-index="${bi}" contenteditable="plaintext-only"
                                style="background:${c.bg};border-left:2px solid ${c.border};">
                                <span class="compare-line-num">${++ln}</span>
                                <span class="compare-line-content">【${ct}】</span></div>`;
                        } else {
                            rh += `<div class="compare-line type-description" data-scene="${si}" data-block-index="${bi}" contenteditable="plaintext-only"
                                style="background:${c.bg};border-left:2px solid ${c.border};">
                                <span class="compare-line-num">${++ln}</span>
                                <span class="compare-line-content">${ct}</span></div>`;
                        }
                    });
                }
            });
            const fsEditHint = '<div class="compare-edit-hint" style="padding:4px 10px;font-size:11px;color:var(--bili-pink);border-bottom:1px dashed rgba(251,114,153,0.2);margin-bottom:4px;user-select:none;">✏️ 点击可编辑</div>';
            right.innerHTML = (rh ? fsEditHint + rh : '<div style="padding:20px;text-align:center;color:var(--text-tertiary)">暂无剧本数据</div>');

            // 统计
            document.getElementById('fsCompareStats').textContent =
                `${origLines.length} 行 ↔ ${ln} 行`;

            // 应用设置
            this.applySettings();

            // 同步滚动（实时无延迟）
            if (this._fsScrollCleanup) this._fsScrollCleanup();
            let syncing = false;
            const doSync = (src, tgt) => {
                if (syncing) return;
                syncing = true;
                const sMax = src.scrollHeight - src.clientHeight;
                const tMax = tgt.scrollHeight - tgt.clientHeight;
                if (sMax > 0 && tMax > 0) tgt.scrollTop = (src.scrollTop / sMax) * tMax;
                syncing = false;
            };
            const onLS = () => doSync(left, right);
            const onRS = () => doSync(right, left);
            left.addEventListener('scroll', onLS, {passive:true});
            right.addEventListener('scroll', onRS, {passive:true});

            // 全屏对照也加 ResizeObserver，确保字体/高度变化后自动同步
            let fsRo = null;
            try {
                fsRo = new ResizeObserver(() => {
                    if (left.scrollTop > right.scrollTop) {
                        doSync(left, right);
                    } else {
                        doSync(right, left);
                    }
                });
                fsRo.observe(left);
                fsRo.observe(right);
            } catch (e) { /* ResizeObserver not supported */ }

            this._fsScrollCleanup = () => {
                left.removeEventListener('scroll', onLS);
                right.removeEventListener('scroll', onRS);
                if (fsRo) fsRo.disconnect();
                syncing = false;
            };

            // --- 跨面板行级高亮（按文本内容匹配） ---
            const _fsCrossHl = (hoverC, otherC) => (e) => {
                const line = e.target.closest('.compare-line, .scene-boundary');
                if (!line) return;
                document.querySelectorAll('.scene-hl').forEach(el => el.classList.remove('scene-hl'));
                if (line.classList.contains('compare-line')) {
                    const contentEl = line.querySelector('.compare-line-content');
                    if (!contentEl) { line.classList.add('scene-hl'); return; }
                    const text = contentEl.textContent || '';
                    const cleaned = text.replace(/^\s*\d+\s*/, '').trim();
                    const seqs = cleaned.match(/[一-鿿]{5,}/g);
                    const fragments = seqs ? [...new Set(seqs)] : [];
                    if (fragments.length > 0) {
                        const otherContents = otherC.querySelectorAll('.compare-line .compare-line-content');
                        let matched = false;
                        for (const frag of fragments) {
                            for (const oc of otherContents) {
                                if ((oc.textContent || '').includes(frag)) {
                                    oc.closest('.compare-line').classList.add('scene-hl');
                                    matched = true;
                                    break;
                                }
                            }
                            if (matched) break;
                        }
                    }
                    line.classList.add('scene-hl');
                } else {
                    const scene = line.dataset.scene;
                    if (scene === undefined) return;
                    hoverC.querySelectorAll(`.compare-line[data-scene="${scene}"]`).forEach(el => el.classList.add('scene-hl'));
                    otherC.querySelectorAll(`.compare-line[data-scene="${scene}"]`).forEach(el => el.classList.add('scene-hl'));
                }
            };
            const _fsCrossHlOut = (hoverC) => (e) => {
                if (!hoverC.contains(e.relatedTarget)) {
                    document.querySelectorAll('.scene-hl').forEach(el => el.classList.remove('scene-hl'));
                }
            };
            left.addEventListener('mouseover', _fsCrossHl(left, right));
            right.addEventListener('mouseover', _fsCrossHl(right, left));
            left.addEventListener('mouseout', _fsCrossHlOut(left));
            right.addEventListener('mouseout', _fsCrossHlOut(right));

            // --- 全屏右侧可编辑面板输入事件 ---
            right.addEventListener('input', (e) => this._handleCompareEdit(e));

            console.log('Activating fullscreen overlay');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        },

        closeFullscreenCompare() {
            const overlay = document.getElementById('fullscreenCompare');
            if (!overlay) return;
            overlay.classList.remove('active');
            document.body.style.overflow = '';
            if (this._fsScrollCleanup) {
                this._fsScrollCleanup();
                this._fsScrollCleanup = null;
            }
        },

        handleExport() {
            const yaml = els.yamlOutput.value.trim();
            if (!yaml) {
                this.showToast('没有可导出的内容', 'warning');
                return;
            }

            const format = els.currentFormat || 'yaml';
            let content = yaml;
            let filename = `剧本_${new Date().toISOString().slice(0, 10)}`;
            let mime = 'text/yaml;charset=utf-8';
            let ext = '.yaml';

            if (format === 'json') {
                try {
                    const parsed = ConversionEngine.fromYaml(yaml);
                    content = JSON.stringify(parsed, null, 2);
                    ext = '.json';
                    mime = 'application/json;charset=utf-8';
                } catch (e) {
                    this.showToast('JSON 转换失败: ' + e.message, 'error');
                    return;
                }
            } else if (format === 'txt') {
                try {
                    const parsed = ConversionEngine.fromYaml(yaml);
                    content = parsed.map(s => {
                        let txt = `【第${s.场次}场】${s.场景 || ''}\n`;
                        txt += `地点：${s.地点 || '未知'}  |  时间：${s.时间 || '未知'}\n`;
                        txt += '─'.repeat(44) + '\n';
                        if (s.内容) {
                            let prevType = '';
                            let prevChar = '';
                            s.内容.forEach((b, bi) => {
                                const type = b.type || b.类型 || '';
                                const c = b.content || b.内容 || b.台词 || '';
                                const curChar = b.character || b.角色 || '';

                                // 分隔线
                                if (bi > 0 && (type !== prevType || (type === '对话' && curChar !== prevChar))) {
                                    txt += '────\n';
                                }
                                prevType = type;
                                prevChar = curChar;

                                if (type === '对话') {
                                    txt += `${curChar}（${b.emotion || b.情绪 || '普通'}）："${c}"\n`;
                                } else if (type === '动作') {
                                    txt += `【${c}】\n`;
                                } else {
                                    txt += `${c}\n`;
                                }
                            });
                        }
                        txt += '\n';
                        return txt;
                    }).join('');
                    ext = '.txt';
                    mime = 'text/plain;charset=utf-8';
                } catch (e) {
                    this.showToast('文本转换失败', 'error');
                    return;
                }
            }

            // 自动拆分（超过 5 幕）
            const parsed = format === 'yaml' ? ConversionEngine.fromYaml(yaml) : [];
            const totalScenes = parsed.length || 0;

            if (state.autoSplitActs && totalScenes > 5 && format !== 'json') {
                // 拆分为多个文件
                const chunkSize = Math.ceil(totalScenes / Math.ceil(totalScenes / 5));
                const chunks = [];
                for (let i = 0; i < parsed.length; i += chunkSize) {
                    chunks.push(parsed.slice(i, i + chunkSize));
                }

                chunks.forEach((chunk, ci) => {
                    let chunkContent = content;
                    if (format === 'yaml') {
                        chunkContent = ConversionEngine.toYaml(chunk, state.showSeparators);
                    } else if (format === 'txt') {
                        chunkContent = chunk.map(s => {
                            let txt = `【第${s.场次}场】${s.场景 || ''}\n`;
                            txt += `地点：${s.地点 || '未知'}  |  时间：${s.时间 || '未知'}\n`;
                            txt += '─'.repeat(44) + '\n';
                            if (s.内容) {
                                let pt = '', pc = '';
                                s.内容.forEach((b, bi) => {
                                    const t = b.type || b.类型 || '';
                                    const c = b.content || b.内容 || b.台词 || '';
                                    const cc = b.character || b.角色 || '';
                                    if (bi > 0 && (t !== pt || (t === '对话' && cc !== pc))) txt += '────\n';
                                    pt = t; pc = cc;
                                    if (t === '对话') txt += `${cc}（${b.emotion||b.情绪||'普通'}）："${c}"\n`;
                                    else if (t === '动作') txt += `【${c}】\n`;
                                    else txt += `${c}\n`;
                                });
                            }
                            return txt + '\n';
                        }).join('');
                    }
                    const blob = new Blob([chunkContent], { type: mime });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${filename}_${ci + 1}${ext}`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                });

                this.showToast(`✅ 已导出 ${chunks.length} 个文件（自动拆分）`, 'success');
            } else {
                // 单个文件导出
                const blob = new Blob([content], { type: mime });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename + ext;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                this.showToast(`✅ 已导出 ${filename}${ext}`, 'success');
            }
        },

        async handleCopy() {
            const yaml = els.yamlOutput.value.trim();
            if (!yaml) {
                this.showToast('没有可复制的内容', 'warning');
                return;
            }
            try {
                await navigator.clipboard.writeText(yaml);
                this.showToast('📋 已复制到剪贴板', 'success');
            } catch (e) {
                els.yamlOutput.select();
                document.execCommand('copy');
                this.showToast('📋 已复制到剪贴板', 'success');
            }
        },

        showToast(message, type = 'info') {
            const colors = {
                success: 'toast-success',
                error: 'toast-error',
                info: 'toast-info',
                warning: 'toast-warning',
            };

            const toast = document.createElement('div');
            toast.className = `toast ${colors[type] || 'toast-info'}`;
            toast.textContent = message;
            els.toastContainer.appendChild(toast);

            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(100%)';
                toast.style.transition = 'all 0.3s ease';
                setTimeout(() => toast.remove(), 300);
            }, 3000);
        },

        // ===== 剧本展示（HTML PPT） =====

        generatePresentation() {
            const screenplay = state.screenplay && state.screenplay.length > 0
                ? state.screenplay
                : (state.rawYaml ? ConversionEngine.fromYaml(state.rawYaml) : []);
            const characters = state.characters || ConversionEngine.getLastCharacters() || [];

            if (!screenplay.length) {
                this.showToast('请先转换小说再生成剧本展示', 'warning');
                return;
            }

            const totalScenes = screenplay.length;
            const totalDialogues = screenplay.reduce((s, sc) => s + (sc.内容 || []).filter(b => (b.type||'') === '对话').length, 0);

            // --- 构建幻灯片 HTML ---
            let slidesHtml = '';

            // 1. 封面
            slidesHtml += `
            <section class="slide center tc" data-title="封面">
                <div style="max-width:800px;margin:0 auto;">
                    <p class="kicker">剧本工坊 · ${new Date().toLocaleDateString('zh-CN')}</p>
                    <h1 class="h1 anim-fade-up" data-anim="fade-up" style="font-size:clamp(48px,6vw,80px);">
                        <span class="gradient-text">剧本展示</span>
                    </h1>
                    <p class="lede" style="margin:20px 0;">共 ${totalScenes} 场 · ${totalDialogues} 句对话 · ${characters.length} 个角色</p>
                    <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:32px;">
                        <span class="pill">← → 翻页</span>
                        <span class="pill">T 换主题</span>
                        <span class="pill">F 全屏</span>
                        <span class="pill">O 概览</span>
                    </div>
                    <div class="deck-footer" style="margin-top:60px;"><span class="dim2">脚本工坊 · HTML PPT</span><span class="slide-number" data-current="1" data-total="0"></span></div>
                </div>
                <div class="notes" style="display:none;">欢迎来到剧本展示。使用键盘 ← → 翻页，T 键切换主题。</div>
            </section>`;

            // 2. 角色介绍（如果有）
            if (characters.length > 0) {
                const roles = { '主角': [], '主要角色': [], '配角': [] };
                characters.forEach(c => { (roles[c.type] || roles['配角']).push(c); });
                const allRoles = [...(roles['主角']||[]), ...(roles['主要角色']||[]), ...(roles['配角']||[])];

                slidesHtml += `
            <section class="slide" data-title="角色">
                <p class="kicker">Cast</p>
                <h2 class="h2">角色介绍</h2>
                <div class="grid g3 mt-l anim-stagger-list" data-anim-target">`;
                allRoles.forEach(c => {
                    const emoji = c.type === '主角' ? '⭐' : c.type === '主要角色' ? '🔷' : '🔸';
                    slidesHtml += `
                    <div class="card tc" style="padding:24px 16px;">
                        <div style="font-size:36px;margin-bottom:8px;">${emoji}</div>
                        <h4>${c.name}</h4>
                        <p class="dim" style="font-size:12px;">${c.type}</p>
                        <p class="dim" style="font-size:12px;">${c.dialogueCount || 0} 句台词</p>
                    </div>`;
                });
                slidesHtml += `
                </div>
                <div class="notes" style="display:none;">这是本剧本的主要角色介绍。</div>
            </section>`;
            }

            // 3. 每场一页
            screenplay.forEach((scene, idx) => {
                const blocks = scene.内容 || [];
                const dialogues = blocks.filter(b => (b.type||'') === '对话');
                const actions = blocks.filter(b => (b.type||'') === '动作');
                const descriptions = blocks.filter(b => (b.type||'') !== '对话' && (b.type||'') !== '动作');

                slidesHtml += `
            <section class="slide" data-title="第${scene.场次}场">
                <p class="kicker">Scene ${scene.场次} · ${totalScenes}</p>
                <h2 class="h2">${scene.场景 || '未命名场景'}</h2>
                <div class="meta-line" style="display:flex;gap:16px;margin:12px 0 20px;font-size:14px;color:var(--text-2);">
                    <span>📍 ${scene.地点 || '未知'}</span>
                    <span>⏰ ${scene.时间 || '未知'}</span>
                    <span>💬 ${dialogues.length} 句对话</span>
                </div>
                <div class="grid g2" style="gap:10px;">`;

                // 展示前 8 个内容块
                const displayBlocks = blocks.slice(0, 8);
                displayBlocks.forEach(b => {
                    const type = b.type || '';
                    const charName = b.character || '';
                    const content = b.content || b.台词 || '';
                    const emotion = b.emotion || '';

                    if (type === '对话') {
                        slidesHtml += `
                    <div class="card" style="padding:12px 14px;">
                        <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                            <span style="width:24px;height:24px;border-radius:50%;background:var(--accent);color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;">${charName.charAt(0)}</span>
                            <span style="font-weight:600;font-size:13px;">${charName}</span>
                            ${emotion ? `<span style="font-size:11px;color:var(--text-2);">（${emotion}）</span>` : ''}
                        </div>
                        <p style="font-size:14px;line-height:1.6;margin:0;">"${content}"</p>
                    </div>`;
                    } else if (type === '动作') {
                        slidesHtml += `
                    <div class="card" style="padding:10px 14px;border-left:3px solid var(--accent);">
                        <p style="font-size:13px;margin:0;color:var(--text-2);">🎬 ${content}</p>
                    </div>`;
                    } else {
                        slidesHtml += `
                    <div class="card" style="padding:10px 14px;">
                        <p style="font-size:13px;margin:0;color:var(--text-2);">${content.length > 80 ? content.substring(0, 80) + '…' : content}</p>
                    </div>`;
                    }
                });

                if (blocks.length > 8) {
                    slidesHtml += `
                    <div class="card tc" style="grid-column:1/-1;padding:10px;font-size:13px;color:var(--text-3);">还有 ${blocks.length - 8} 段内容…</div>`;
                }

                slidesHtml += `
                </div>
                <div class="notes" style="display:none;">
                    第${scene.场次}场 · ${scene.场景 || ''} · ${scene.地点 || ''} · ${scene.时间 || ''}
                    ${dialogues.map(d => `\n${d.character || d.角色}：${(d.content || d.台词 || '').substring(0, 40)}`).join('')}
                </div>
            </section>`;
            });

            // 4. 统计数据
            const actionCount = screenplay.reduce((s, sc) => s + (sc.内容 || []).filter(b => (b.type||'') === '动作').length, 0);
            const descCount = screenplay.reduce((s, sc) => s + (sc.内容 || []).filter(b => (b.type||'') !== '对话' && (b.type||'') !== '动作').length, 0);

            slidesHtml += `
            <section class="slide center tc" data-title="统计">
                <div>
                    <p class="kicker">Statistics</p>
                    <h2 class="h2">剧本总览</h2>
                    <div class="grid g3 mt-l" style="max-width:600px;margin:32px auto 0;">
                        <div class="card tc"><div style="font-size:48px;font-weight:900;color:var(--accent);">${totalScenes}</div><p class="dim">总场次</p></div>
                        <div class="card tc"><div style="font-size:48px;font-weight:900;color:var(--accent);">${totalDialogues}</div><p class="dim">对话</p></div>
                        <div class="card tc"><div style="font-size:48px;font-weight:900;color:var(--accent);">${actionCount}</div><p class="dim">动作</p></div>
                        <div class="card tc"><div style="font-size:48px;font-weight:900;color:var(--accent);">${descCount}</div><p class="dim">描述</p></div>
                        <div class="card tc"><div style="font-size:48px;font-weight:900;color:var(--accent);">${characters.length}</div><p class="dim">角色</p></div>
                        <div class="card tc">
                            <div style="font-size:48px;font-weight:900;color:var(--accent);">${
                                characters.filter(c => c.type === '主角').length > 0 ? characters.filter(c => c.type === '主角').length : '—'
                            }</div>
                            <p class="dim">主角</p>
                        </div>
                    </div>
                </div>
                <div class="notes" style="display:none;">剧本统计总览。</div>
            </section>`;

            // 5. 结尾
            slidesHtml += `
            <section class="slide center tc" data-title="结尾">
                <div>
                    <h1 class="h1 anim-rise-in" data-anim="rise-in" style="font-size:clamp(48px,5vw,64px);">
                        <span class="gradient-text">谢谢观看</span>
                    </h1>
                    <p class="lede" style="margin:16px auto;">剧本工坊 · 小说转剧本 AI 工具</p>
                    <p class="dim" style="margin-top:32px;font-size:12px;">按 ← → 翻页 · T 换主题 · F 全屏 · O 概览 · S 备注</p>
                </div>
            </section>`;

            // --- 组装完整 HTML ---
            const themes = ['minimal-white','editorial-serif','soft-pastel','tokyo-night','catppuccin-mocha','dracula','sunset-warm','aurora'];
            // 用绝对路径，Blob URL 下相对路径不工作
            const baseUrl = window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1);
            const basePath = baseUrl + 'ppt/';

            const fullHtml = `<!DOCTYPE html>
<html lang="zh-CN" data-theme="minimal-white">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>剧本展示 · ${screenplay.length} 场</title>
<link rel="stylesheet" href="${basePath}fonts.css">
<link rel="stylesheet" href="${basePath}base.css">
<link rel="stylesheet" id="theme-link" href="${basePath}themes/minimal-white.css">
<link rel="stylesheet" href="${basePath}animations.css">
<style>
  .deck { background: var(--bg); }
  .slide { padding: 48px 56px; overflow-y: auto; }
  .slide h1, .slide h2 { margin-top: 0; }
  .meta-line span { display: inline-flex; align-items: center; gap: 4px; }
  .grid.g2 { grid-template-columns: 1fr 1fr; }
  .card { background: var(--surface); border-radius: var(--radius-2); padding: 16px; }
  .card.tc { text-align: center; }
  .pill { padding: 4px 14px; border-radius: 999px; background: var(--surface-2); font-size: 12px; color: var(--text-2); border: 1px solid var(--border); }
  .kicker { text-transform: uppercase; letter-spacing: 1px; font-size: 12px; color: var(--text-3); margin-bottom: 8px; }
  .dim { color: var(--text-2); }
  .dim2 { color: var(--text-3); }
  .deck-footer { padding: 12px 0 0; font-size: 12px; display: flex; justify-content: space-between; }
  .gradient-text { background: var(--grad); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
  .tc { text-align: center; }
  .mt-l { margin-top: 24px; }
  @@media (max-width: 640px) {
    .slide { padding: 24px 16px; }
    .grid.g2, .grid.g3 { grid-template-columns: 1fr; }
  }
</style>
</head>
<body data-themes="${themes.join(',')}" data-theme-base="${basePath}themes/" style="margin:0;">
<div class="deck">
${slidesHtml}
</div>
<script src="${basePath}runtime.js"><\/script>
</body>
</html>`;

            return fullHtml;
        },

        openPresentation() {
            const html = this.generatePresentation();
            if (!html) return;

            const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
            setTimeout(() => URL.revokeObjectURL(url), 60000);
        },

        delay(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        },
    };

    // ===== 初始化 =====
    document.addEventListener('DOMContentLoaded', () => {
        UI.init();
    });

    // 暴露公共 API
    return {
        state,
        getState: () => state,
        convert: (text) => ConversionEngine.convert(text),
        toYaml: (screenplay, showSep) => ConversionEngine.toYaml(screenplay, showSep),
        fromYaml: (yaml) => ConversionEngine.fromYaml(yaml),
        showToast: (msg, type) => {
            // 如果 UI 已初始化
            if (els.toastContainer) {
                UI.showToast(msg, type);
            }
        },
        generateCompareView: () => UI.generateCompareView(),
        generatePresentation: () => UI.generatePresentation(),
        openPresentation: () => UI.openPresentation(),
        renderFileList: () => UI.renderFileList(),
        saveLibrary: () => UI.saveLibrary(),
        applySettings: () => UI.applySettings(),
        applyTheme: (t) => UI.applyTheme(t),
        openFullscreenCompare: () => UI.openFullscreenCompare(),
        closeFullscreenCompare: () => UI.closeFullscreenCompare(),
        importNovelFile: (file) => UI.importNovelFile(file),
    };
})();

// 暴露到全局，供 onclick 等直接调用
window.ScreenplayStudio = ScreenplayStudio;
