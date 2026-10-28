// Introductory, manually-authored grammar reference, not a claim of full HSK grammar coverage.
const units = [
['是 · identity','Noun + 是 + noun','我是学生。','I am a student.','Use 是 to identify people and things. Adjectival predicates normally do not require 是.'],
['不 · general negation','不 + verb/adjective','我不喝咖啡。','I do not drink coffee.','不 is the common negator for habits, future intentions and non-past descriptions.'],
['没有 · absence and past negation','没(有) + verb / 没有 + noun','我没有时间。','I do not have time.','没有 expresses absence; 没 + verb commonly negates the occurrence of an action.'],
['吗 · yes/no questions','Statement + 吗？','你喜欢茶吗？','Do you like tea?','Add 吗 to a statement to form a neutral yes/no question.'],
['呢 · follow-up questions','Topic + 呢？','我很好，你呢？','I am fine. How about you?','呢 can ask about the same topic for a different person or thing.'],
['的 · possession / modification','Modifier + 的 + noun','这是我的书。','This is my book.','的 links possessors or other modifiers to a noun; familiar relationships can omit it.'],
['在 · location / ongoing action','Subject + 在 + place','我在学校。','I am at school.','在 introduces a location; 在 + verb can also mark an ongoing action.'],
['有 · existence and possession','Subject + 有 + noun','我有两个朋友。','I have two friends.','有 expresses having or there being something.'],
['了 · completed change','Verb + 了 / Sentence + 了','我吃了饭。','I ate a meal.','了 can mark an event as complete or a change of situation; it is not a simple past-tense suffix.'],
['会 / 能 / 可以 · ability','Subject + modal + verb','我会说一点中文。','I can speak a little Chinese.','会 often refers to learned ability, 能 to capability or circumstances, 可以 to permission or possibility.'],
['想 / 要 · wishes','Subject + 想/要 + verb','我想喝水。','I want to drink water.','想 often softens a wish; 要 can be more definite.'],
['比 · comparing','A + 比 + B + adjective','今天比昨天热。','Today is hotter than yesterday.','比 introduces the comparison standard.'],
['过 · experience','Verb + 过','我去过北京。','I have been to Beijing.','过 marks previous experience, often at least once.'],
['因为…所以… · cause','因为 + cause，所以 + result','因为下雨，所以我没去。','Because it rained, I did not go.','Both halves may be used together, but context can make one unnecessary.'],
['先…然后… · sequence','先 + first action，然后 + next action','我们先吃饭，然后学习。','First we eat, then we study.','Use the pair to order events.'],
['把 · affected object','Subject + 把 + object + verb + result','请把门关上。','Please close the door.','把 moves an affected object before the verb; the verb usually has a result or complement.']
];
export const chineseGrammarFoundations=units.map(([title,formation,native,meaning,description],i)=>({id:`zh-grammar-${String(i+1).padStart(2,'0')}`,level:'Foundation',title,formation,description,examples:[{native,meaning}],source:'Yukoto authored foundation guide'}));
